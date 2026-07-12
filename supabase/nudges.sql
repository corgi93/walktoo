-- 콕 찌르기 (nudge) 테이블 + RPC
-- Supabase 대시보드 SQL Editor에서 실행하세요.

-- ─── 테이블 ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.nudges (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID      NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  couple_id  UUID        NOT NULL REFERENCES public.couples(id)  ON DELETE CASCADE,
  date       DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 보내는 사람 기준 1일 1회 제한
  UNIQUE (sender_id, date)
);

-- 본인 nudge만 조회 가능
ALTER TABLE public.nudges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sender can read own nudges"
  ON public.nudges FOR SELECT
  USING (auth.uid() = sender_id);
CREATE POLICY "sender can insert own nudges"
  ON public.nudges FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- ─── RPC: 오늘 nudge 보내기 (중복 차단 + insert 원자적 처리) ──

CREATE OR REPLACE FUNCTION public.send_nudge(
  p_sender_id    UUID,
  p_recipient_id UUID,
  p_couple_id    UUID,
  p_date         DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing UUID;
BEGIN
  SELECT id INTO v_existing
  FROM public.nudges
  WHERE sender_id = p_sender_id
    AND date = p_date;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_nudged');
  END IF;

  INSERT INTO public.nudges (sender_id, recipient_id, couple_id, date)
  VALUES (p_sender_id, p_recipient_id, p_couple_id, p_date);

  RETURN jsonb_build_object('success', true);
END;
$$;
