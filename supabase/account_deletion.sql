-- ────────────────────────────────────────────────────────────
-- 계정 삭제 (커플 데이터 보존형 소프트 삭제) — 기존 DB 적용용 마이그레이션
--
-- schema.sql에 동일 내용이 반영되어 있다 (canonical).
-- 이미 운영 중인 DB에는 이 파일을 Supabase SQL Editor에서 실행한다.
-- 멱등 — 여러 번 실행해도 안전.
--
-- 설계 근거:
--   profiles.id → auth.users(id) ON DELETE CASCADE,
--   couples.user1_id → profiles(id) ON DELETE CASCADE,
--   footprint_entries.user_id → profiles(id) ON DELETE CASCADE
--   이므로 auth 유저/프로필을 '하드 삭제'하면 커플 전체와 둘이 함께 쓴
--   모든 기록이 연쇄 삭제된다. 커플 앱에서는 한 명이 떠나도 남은 상대가
--   '둘이 남긴 추억'을 계속 볼 수 있어야 하므로, 하드 삭제 대신
--   '소프트 삭제(익명화)'로 구현한다.
-- ────────────────────────────────────────────────────────────

-- 1. profiles: 소프트 삭제 마커
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. 계정 삭제 RPC
--    호출자 본인 계정만 삭제 가능. SECURITY DEFINER로 auth 스키마까지 정리한다.
--    ⚠️ auth.users / auth.identities를 수정하므로, 이 함수는 auth 스키마 권한이
--       있는 역할이 소유해야 한다. Supabase SQL Editor에서 실행하면 postgres가
--       소유하게 되어 기본적으로 동작한다. 권한이 제한된 환경이라면 이 부분을
--       service_role Edge Function으로 분리해야 한다.
CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- (1) 프로필 소프트 삭제 + 개인 식별정보(PII) 제거.
  --     닉네임·캐릭터·프로필 사진은 "둘이 함께 만든 공유 기록"의 일부라
  --     남긴다 → 남은 상대가 누가 쓴 기록인지 알아볼 수 있어야 한다.
  --     연락처·푸시토큰·결제 식별자 등 개인정보만 지운다.
  --     couple_id는 유지한다(제거하면 남은 상대가 이 프로필을 조회하지 못해
  --     상대가 쓴 기록의 작성자 이름/사진이 깨진다).
  UPDATE public.profiles
  SET deleted_at         = COALESCE(deleted_at, now()),
      phone              = '',
      push_token         = NULL,
      revenuecat_user_id = NULL
  WHERE id = v_uid;

  -- (2) 개인 전용(비공유) 데이터만 삭제. 공유 기록(walks, footprint_entries,
  --     memory_stamps, couple_memos, couple_schedules)은 남긴다.
  DELETE FROM public.daily_steps   WHERE user_id = v_uid;
  DELETE FROM public.notifications WHERE recipient_id = v_uid;

  -- (3) 실질적 계정 삭제 = 로그인 영구 차단 + auth PII 제거.
  --     identities 제거 → 같은 Apple/Google로 다시 로그인하면 완전히 새 계정이
  --     생성되고, 소프트 삭제된 이 기록과는 분리된다.
  DELETE FROM auth.identities WHERE user_id = v_uid;
  UPDATE auth.users
  SET email              = 'deleted+' || v_uid::text || '@deleted.walktoo.app',
      phone              = NULL,
      raw_user_meta_data = '{}'::jsonb,
      banned_until       = now() + interval '100 years'
  WHERE id = v_uid;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;
