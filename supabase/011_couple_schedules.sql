-- ============================================================
-- 커플 일정 (Couple Schedules)
-- 각자 자기 일정을 적어놓으면 상대방이 "아 이때 무슨 일이 있구나" 알 수 있음.
-- 예: 학회, 회사 반차, 결혼식, 약속 등
--
-- 정책:
-- - 같은 커플이면 서로의 일정을 모두 볼 수 있음 (SELECT).
-- - 본인이 만든 일정만 수정/삭제 가능 (owner_id = auth.uid()).
-- - 커플이 해제되면 CASCADE로 같이 삭제.
-- ============================================================

-- 1. 테이블
CREATE TABLE IF NOT EXISTS public.couple_schedules (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id  UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  owner_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  title      TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 60),
  category   TEXT NOT NULL DEFAULT 'other'
             CHECK (category IN ('work','social','wedding','health','travel','study','anniversary','other')),
  emoji      TEXT,
  note       TEXT CHECK (note IS NULL OR char_length(note) <= 300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. 인덱스 (월 단위 조회가 주 사용 패턴)
CREATE INDEX IF NOT EXISTS idx_couple_schedules_couple_date
  ON public.couple_schedules(couple_id, date);

CREATE INDEX IF NOT EXISTS idx_couple_schedules_owner
  ON public.couple_schedules(owner_id);

-- 3. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION public.set_couple_schedules_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_couple_schedules_updated_at ON public.couple_schedules;
CREATE TRIGGER trg_couple_schedules_updated_at
  BEFORE UPDATE ON public.couple_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.set_couple_schedules_updated_at();

-- 4. RLS
ALTER TABLE public.couple_schedules ENABLE ROW LEVEL SECURITY;

-- SELECT: 같은 커플이면 모두 볼 수 있음
CREATE POLICY "couple_schedules_select" ON public.couple_schedules
  FOR SELECT USING (
    couple_id = (
      SELECT couple_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- INSERT: 본인 커플 + 본인 owner_id 만
CREATE POLICY "couple_schedules_insert" ON public.couple_schedules
  FOR INSERT WITH CHECK (
    owner_id = auth.uid()
    AND couple_id = (
      SELECT couple_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- UPDATE: 본인이 만든 것만
CREATE POLICY "couple_schedules_update" ON public.couple_schedules
  FOR UPDATE USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- DELETE: 본인이 만든 것만
CREATE POLICY "couple_schedules_delete" ON public.couple_schedules
  FOR DELETE USING (owner_id = auth.uid());
