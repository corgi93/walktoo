-- ============================================================
-- 커플 공유 메모장 (Couple Memos)
--
-- 정책:
-- - 같은 커플이면 메모를 볼 수 있음.
-- - 같은 커플이면 생성/수정할 수 있음.
-- - 한 커플당 문서 1개만 유지.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.couple_memos (
  couple_id  UUID PRIMARY KEY REFERENCES public.couples(id) ON DELETE CASCADE,
  content    TEXT NOT NULL DEFAULT '' CHECK (char_length(content) <= 5000),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_couple_memos_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_couple_memos_updated_at ON public.couple_memos;
CREATE TRIGGER trg_couple_memos_updated_at
  BEFORE UPDATE ON public.couple_memos
  FOR EACH ROW
  EXECUTE FUNCTION public.set_couple_memos_updated_at();

ALTER TABLE public.couple_memos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "couple_memos_select" ON public.couple_memos;
CREATE POLICY "couple_memos_select" ON public.couple_memos
  FOR SELECT USING (
    couple_id = (
      SELECT couple_id FROM public.profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "couple_memos_insert" ON public.couple_memos;
CREATE POLICY "couple_memos_insert" ON public.couple_memos
  FOR INSERT WITH CHECK (
    updated_by = auth.uid()
    AND couple_id = (
      SELECT couple_id FROM public.profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "couple_memos_update" ON public.couple_memos;
CREATE POLICY "couple_memos_update" ON public.couple_memos
  FOR UPDATE USING (
    couple_id = (
      SELECT couple_id FROM public.profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    updated_by = auth.uid()
    AND couple_id = (
      SELECT couple_id FROM public.profiles WHERE id = auth.uid()
    )
  );
