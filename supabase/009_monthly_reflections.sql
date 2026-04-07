-- ============================================================
-- 월간 회고 "이달의 우리"
-- 커플이 매달 3개 질문에 답하는 가벼운 회고
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

-- 1. monthly_reflections (커플 단위 월간 세션)
CREATE TABLE IF NOT EXISTS public.monthly_reflections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id   UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  year        INTEGER NOT NULL,
  month       INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  question_ids INTEGER[] NOT NULL,
  is_revealed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  revealed_at TIMESTAMPTZ,
  UNIQUE(couple_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_reflections_couple
  ON public.monthly_reflections(couple_id, year DESC, month DESC);

-- 2. reflection_answers (각자의 답변)
CREATE TABLE IF NOT EXISTS public.reflection_answers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reflection_id   UUID NOT NULL REFERENCES public.monthly_reflections(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id     INTEGER NOT NULL,
  answer          TEXT NOT NULL DEFAULT '',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(reflection_id, user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_reflection_answers_reflection
  ON public.reflection_answers(reflection_id);

-- 3. RLS
ALTER TABLE public.monthly_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflection_answers ENABLE ROW LEVEL SECURITY;

-- monthly_reflections SELECT: 본인 커플만
CREATE POLICY "monthly_reflections_select" ON public.monthly_reflections
  FOR SELECT USING (
    couple_id = (
      SELECT couple_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- monthly_reflections INSERT: 본인 커플만
CREATE POLICY "monthly_reflections_insert" ON public.monthly_reflections
  FOR INSERT WITH CHECK (
    couple_id = (
      SELECT couple_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- monthly_reflections UPDATE: 본인 커플만 (is_revealed 갱신용)
CREATE POLICY "monthly_reflections_update" ON public.monthly_reflections
  FOR UPDATE USING (
    couple_id = (
      SELECT couple_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- reflection_answers SELECT: 커플 공개 상태 or 본인 답변
CREATE POLICY "reflection_answers_select" ON public.reflection_answers
  FOR SELECT USING (
    user_id = auth.uid()
    OR reflection_id IN (
      SELECT id FROM public.monthly_reflections
      WHERE couple_id = (
        SELECT couple_id FROM public.profiles WHERE id = auth.uid()
      )
      AND is_revealed = TRUE
    )
  );

-- reflection_answers INSERT/UPDATE: 본인만
CREATE POLICY "reflection_answers_insert" ON public.reflection_answers
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "reflection_answers_update" ON public.reflection_answers
  FOR UPDATE USING (user_id = auth.uid());

-- 4. RPC: 이달의 회고 세션 get-or-create
-- question_ids를 클라이언트가 전달하고, 없으면 생성, 있으면 기존 반환
CREATE OR REPLACE FUNCTION public.get_or_create_reflection(
  p_year INTEGER,
  p_month INTEGER,
  p_question_ids INTEGER[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_couple_id uuid;
  v_reflection_id uuid;
  v_question_ids integer[];
  v_is_revealed boolean;
BEGIN
  SELECT couple_id INTO v_couple_id
  FROM public.profiles WHERE id = auth.uid();

  IF v_couple_id IS NULL THEN
    RETURN jsonb_build_object('error', 'no_couple');
  END IF;

  -- 기존 세션 찾기
  SELECT id, question_ids, is_revealed
  INTO v_reflection_id, v_question_ids, v_is_revealed
  FROM public.monthly_reflections
  WHERE couple_id = v_couple_id
    AND year = p_year
    AND month = p_month;

  -- 없으면 생성
  IF v_reflection_id IS NULL THEN
    INSERT INTO public.monthly_reflections (couple_id, year, month, question_ids)
    VALUES (v_couple_id, p_year, p_month, p_question_ids)
    RETURNING id, question_ids, is_revealed
    INTO v_reflection_id, v_question_ids, v_is_revealed;
  END IF;

  RETURN jsonb_build_object(
    'id', v_reflection_id,
    'question_ids', v_question_ids,
    'is_revealed', v_is_revealed
  );
END;
$$;

-- 5. RPC: 답변 저장 + 둘 다 완료 체크 → is_revealed 업데이트
CREATE OR REPLACE FUNCTION public.save_reflection_answers(
  p_reflection_id uuid,
  p_answers jsonb  -- [{"question_id": 1, "answer": "..."}, ...]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_couple_id uuid;
  v_reflection_couple uuid;
  v_question_ids integer[];
  v_partner_id uuid;
  v_partner_count integer;
  v_answer_record jsonb;
  v_was_revealed boolean;
  v_now_revealed boolean := FALSE;
BEGIN
  SELECT couple_id INTO v_couple_id
  FROM public.profiles WHERE id = auth.uid();

  IF v_couple_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_couple');
  END IF;

  -- 회고 소유 검증
  SELECT couple_id, question_ids, is_revealed
  INTO v_reflection_couple, v_question_ids, v_was_revealed
  FROM public.monthly_reflections
  WHERE id = p_reflection_id;

  IF v_reflection_couple IS NULL OR v_reflection_couple != v_couple_id THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  -- 각 답변 upsert
  FOR v_answer_record IN SELECT * FROM jsonb_array_elements(p_answers)
  LOOP
    INSERT INTO public.reflection_answers (
      reflection_id, user_id, question_id, answer, updated_at
    )
    VALUES (
      p_reflection_id,
      auth.uid(),
      (v_answer_record->>'question_id')::integer,
      v_answer_record->>'answer',
      now()
    )
    ON CONFLICT (reflection_id, user_id, question_id)
    DO UPDATE SET
      answer = EXCLUDED.answer,
      updated_at = now();
  END LOOP;

  -- 상대방 ID 조회
  SELECT CASE
    WHEN user1_id = auth.uid() THEN user2_id
    WHEN user2_id = auth.uid() THEN user1_id
  END INTO v_partner_id
  FROM public.couples
  WHERE id = v_couple_id;

  -- 상대방이 모든 질문에 답변했는지 체크
  IF v_partner_id IS NOT NULL AND NOT v_was_revealed THEN
    SELECT COUNT(*) INTO v_partner_count
    FROM public.reflection_answers
    WHERE reflection_id = p_reflection_id
      AND user_id = v_partner_id
      AND answer != '';

    -- 상대방이 이미 전부 답변했다면 → 공개
    IF v_partner_count >= array_length(v_question_ids, 1) THEN
      UPDATE public.monthly_reflections
      SET is_revealed = TRUE, revealed_at = now()
      WHERE id = p_reflection_id;
      v_now_revealed := TRUE;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'revealed', v_now_revealed OR v_was_revealed,
    'just_revealed', v_now_revealed
  );
END;
$$;
