-- ============================================================
-- 월간 회고 진행 상태 조회 RPC
-- "둘 다 써야 둘 다 볼 수 있다"를 UI에 전달하기 위해
-- partner의 답변 내용은 숨긴 채 카운트만 반환한다.
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_reflection_progress(
  p_reflection_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_couple_id uuid;
  v_reflection_couple uuid;
  v_total integer;
  v_partner_id uuid;
  v_my_count integer := 0;
  v_partner_count integer := 0;
  v_is_revealed boolean;
BEGIN
  SELECT couple_id INTO v_couple_id
  FROM public.profiles WHERE id = auth.uid();

  IF v_couple_id IS NULL THEN
    RETURN jsonb_build_object('error', 'no_couple');
  END IF;

  SELECT couple_id, COALESCE(array_length(question_ids, 1), 0), is_revealed
  INTO v_reflection_couple, v_total, v_is_revealed
  FROM public.monthly_reflections
  WHERE id = p_reflection_id;

  IF v_reflection_couple IS NULL OR v_reflection_couple <> v_couple_id THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  -- 상대방 id
  SELECT CASE
    WHEN user1_id = auth.uid() THEN user2_id
    WHEN user2_id = auth.uid() THEN user1_id
  END INTO v_partner_id
  FROM public.couples
  WHERE id = v_couple_id;

  SELECT COUNT(*) INTO v_my_count
  FROM public.reflection_answers
  WHERE reflection_id = p_reflection_id
    AND user_id = auth.uid()
    AND COALESCE(trim(answer), '') <> '';

  IF v_partner_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_partner_count
    FROM public.reflection_answers
    WHERE reflection_id = p_reflection_id
      AND user_id = v_partner_id
      AND COALESCE(trim(answer), '') <> '';
  END IF;

  RETURN jsonb_build_object(
    'total', v_total,
    'my_answered', v_my_count,
    'partner_answered', v_partner_count,
    'has_partner', v_partner_id IS NOT NULL,
    'is_revealed', v_is_revealed
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_reflection_progress(uuid) TO authenticated;
