-- ─── daily_steps: 유저별 일일 걸음수 동기화 테이블 ─────────

CREATE TABLE IF NOT EXISTS public.daily_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  steps INTEGER NOT NULL DEFAULT 0,
  kcal NUMERIC(6,1) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 유저 + 날짜 유니크 (하루에 하나만)
  UNIQUE(user_id, date)
);

-- ─── RLS ────────────────────────────────────────────────

ALTER TABLE public.daily_steps ENABLE ROW LEVEL SECURITY;

-- 본인 + 커플 상대방 걸음수 조회 가능
-- profiles.couple_id 기반으로 같은 커플의 걸음수를 조회
-- (couples 테이블 RLS 중첩 문제를 피하기 위해 profiles 기반으로 변경)
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

-- 본인만 upsert 가능
CREATE POLICY "daily_steps_insert" ON public.daily_steps
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "daily_steps_update" ON public.daily_steps
  FOR UPDATE USING (user_id = auth.uid());

-- ─── 인덱스 ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_daily_steps_user_date
  ON public.daily_steps(user_id, date DESC);
