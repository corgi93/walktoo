-- ────────────────────────────────────────────────────────────
-- 여행 무드 테마팩 (non-consumable IAP) — 기존 DB 적용용 마이그레이션
--
-- schema.sql에 동일 내용이 반영되어 있다 (canonical).
-- 이미 운영 중인 DB에는 이 파일을 Supabase SQL Editor에서 실행한다.
-- 멱등 — 여러 번 실행해도 안전.
-- ────────────────────────────────────────────────────────────

-- 1. profiles: 본인 구매 여부
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_theme_pack BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS theme_pack_purchased_at TIMESTAMPTZ;

-- 2. couples: 커플 공유 (한 명만 결제하면 양쪽 적용)
ALTER TABLE public.couples
  ADD COLUMN IF NOT EXISTS has_theme_pack BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS theme_pack_purchaser_id UUID
    REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. 구매 마킹 RPC (mark_premium_purchased와 동일 패턴)
CREATE OR REPLACE FUNCTION public.mark_theme_pack_purchased(p_revenuecat_user_id TEXT)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_couple_id UUID;
BEGIN
  UPDATE public.profiles
  SET has_theme_pack = true,
      theme_pack_purchased_at = COALESCE(theme_pack_purchased_at, now()),
      revenuecat_user_id = p_revenuecat_user_id
  WHERE id = auth.uid() RETURNING couple_id INTO v_couple_id;
  IF v_couple_id IS NOT NULL THEN
    UPDATE public.couples SET has_theme_pack = true, theme_pack_purchaser_id = auth.uid()
    WHERE id = v_couple_id;
  END IF;
  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_theme_pack_purchased(TEXT) TO authenticated;
