-- ============================================================
-- daily_steps RLS 정책 수정 + character_type 컬럼 추가
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

-- 1. character_type 컬럼 추가
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS character_type text NOT NULL DEFAULT 'boy';

-- 2. daily_steps SELECT 정책 교체
--    기존: couples 테이블 서브쿼리 → couples RLS 중첩으로 상대방 조회 실패
--    수정: profiles.couple_id 기반으로 같은 커플 멤버 조회
DROP POLICY IF EXISTS "daily_steps_select" ON public.daily_steps;

CREATE POLICY "daily_steps_select" ON public.daily_steps
  FOR SELECT USING (
    user_id = auth.uid()
    OR user_id IN (
      SELECT p.id FROM public.profiles p
      WHERE p.couple_id IS NOT NULL
        AND p.couple_id = (
          SELECT couple_id FROM public.profiles WHERE id = auth.uid()
        )
        AND p.id != auth.uid()
    )
  );
