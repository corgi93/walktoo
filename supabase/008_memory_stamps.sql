-- ============================================================
-- 추억의 발자국 (Memory Stamps)
-- 커플이 오늘의 미션 달성 시 하루 1회 스탬프 획득
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

-- 1. memory_stamps 테이블
CREATE TABLE IF NOT EXISTS public.memory_stamps (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id  UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  count      INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(couple_id, date)
);

CREATE INDEX IF NOT EXISTS idx_memory_stamps_couple_date
  ON public.memory_stamps(couple_id, date DESC);

-- 2. RLS
ALTER TABLE public.memory_stamps ENABLE ROW LEVEL SECURITY;

-- 본인 커플의 스탬프 SELECT
CREATE POLICY "memory_stamps_select" ON public.memory_stamps
  FOR SELECT USING (
    couple_id = (
      SELECT couple_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- 3. Claim RPC 함수
-- 오늘의 미션 달성 시 호출되어 스탬프를 지급 (하루 1회)
CREATE OR REPLACE FUNCTION public.claim_memory_stamp(
  p_date date,
  p_count integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_couple_id uuid;
  v_existing_id uuid;
  v_new_id uuid;
BEGIN
  -- 1. 내 couple_id 조회
  SELECT couple_id INTO v_couple_id
  FROM public.profiles WHERE id = auth.uid();

  IF v_couple_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'no_couple'
    );
  END IF;

  -- 2. 이미 오늘 스탬프를 받았는지 체크
  SELECT id INTO v_existing_id
  FROM public.memory_stamps
  WHERE couple_id = v_couple_id AND date = p_date;

  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'already_claimed'
    );
  END IF;

  -- 3. 스탬프 지급
  INSERT INTO public.memory_stamps (couple_id, date, count)
  VALUES (v_couple_id, p_date, p_count)
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'success', true,
    'stamp_id', v_new_id,
    'count', p_count
  );
END;
$$;

-- 4. 총 스탬프 개수 조회 RPC
CREATE OR REPLACE FUNCTION public.get_total_stamps()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_couple_id uuid;
  v_total integer;
BEGIN
  SELECT couple_id INTO v_couple_id
  FROM public.profiles WHERE id = auth.uid();

  IF v_couple_id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT COALESCE(SUM(count), 0) INTO v_total
  FROM public.memory_stamps
  WHERE couple_id = v_couple_id;

  RETURN v_total;
END;
$$;
