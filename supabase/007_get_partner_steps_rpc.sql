-- ============================================================
-- 상대방 걸음수 조회 RPC 함수
-- RLS 중첩 문제를 완전히 우회
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

-- 기존 RLS 정책도 수정 (혹시 직접 쿼리 fallback 용)
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

-- RPC 함수: SECURITY DEFINER로 RLS 무시하고 직접 조회
-- 단, 호출자가 해당 파트너와 같은 커플인지 검증
CREATE OR REPLACE FUNCTION public.get_partner_steps(
  p_partner_id uuid,
  p_date date
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_my_couple_id uuid;
  v_partner_couple_id uuid;
  v_steps integer;
BEGIN
  -- 1. 내 couple_id 조회
  SELECT couple_id INTO v_my_couple_id
  FROM public.profiles
  WHERE id = auth.uid();

  -- 2. 상대방 couple_id 조회
  SELECT couple_id INTO v_partner_couple_id
  FROM public.profiles
  WHERE id = p_partner_id;

  -- 3. 같은 커플인지 검증
  IF v_my_couple_id IS NULL
     OR v_partner_couple_id IS NULL
     OR v_my_couple_id != v_partner_couple_id THEN
    RETURN 0;
  END IF;

  -- 4. 걸음수 조회
  SELECT steps INTO v_steps
  FROM public.daily_steps
  WHERE user_id = p_partner_id
    AND date = p_date;

  RETURN COALESCE(v_steps, 0);
END;
$$;

-- character_type 컬럼 (아직 안 추가했으면)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS character_type text NOT NULL DEFAULT 'boy';
