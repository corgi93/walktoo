-- Release P0/P1 stability hardening:
-- - one walk per couple/date/kind
-- - transactional walk + entry + reveal writes
-- - transactional couple join/disconnect

CREATE UNIQUE INDEX IF NOT EXISTS idx_walks_unique_couple_date_kind
  ON public.walks(couple_id, date, kind);

CREATE OR REPLACE FUNCTION public.create_walk_with_entry(
  p_couple_id UUID,
  p_date DATE,
  p_kind TEXT,
  p_walk_location_name TEXT,
  p_walk_location_lat DOUBLE PRECISION DEFAULT NULL,
  p_walk_location_lng DOUBLE PRECISION DEFAULT NULL,
  p_walk_location_address TEXT DEFAULT NULL,
  p_walk_location_source TEXT DEFAULT NULL,
  p_memo TEXT DEFAULT '',
  p_photos TEXT[] DEFAULT '{}',
  p_entry_location_name TEXT DEFAULT '',
  p_entry_location_lat DOUBLE PRECISION DEFAULT NULL,
  p_entry_location_lng DOUBLE PRECISION DEFAULT NULL,
  p_entry_location_address TEXT DEFAULT NULL,
  p_entry_location_source TEXT DEFAULT NULL,
  p_diary_question_id INTEGER DEFAULT NULL,
  p_diary_answer TEXT DEFAULT '',
  p_couple_question_id INTEGER DEFAULT NULL,
  p_couple_answer TEXT DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_profile_couple_id UUID;
  v_walk_id UUID;
  v_entry_id UUID;
  v_entry_count INTEGER;
  v_created_walk BOOLEAN := FALSE;
  v_was_revealed BOOLEAN := FALSE;
  v_just_revealed BOOLEAN := FALSE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'forbidden');
  END IF;

  SELECT couple_id INTO v_profile_couple_id
  FROM public.profiles
  WHERE id = v_uid;

  IF v_profile_couple_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_couple');
  END IF;
  IF v_profile_couple_id <> p_couple_id THEN
    RETURN jsonb_build_object('success', false, 'reason', 'forbidden');
  END IF;
  IF p_kind NOT IN ('together', 'each') THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_kind');
  END IF;

  INSERT INTO public.walks (
    couple_id, date, location_name, location_lat, location_lng,
    location_address, location_source, steps, kind
  )
  VALUES (
    p_couple_id,
    p_date,
    CASE WHEN p_kind = 'together' THEN COALESCE(p_walk_location_name, '') ELSE '' END,
    CASE WHEN p_kind = 'together' THEN p_walk_location_lat ELSE NULL END,
    CASE WHEN p_kind = 'together' THEN p_walk_location_lng ELSE NULL END,
    CASE WHEN p_kind = 'together' THEN p_walk_location_address ELSE NULL END,
    CASE WHEN p_kind = 'together' THEN p_walk_location_source ELSE NULL END,
    0,
    p_kind
  )
  ON CONFLICT (couple_id, date, kind) DO NOTHING
  RETURNING id INTO v_walk_id;

  IF v_walk_id IS NULL THEN
    SELECT id, is_revealed
    INTO v_walk_id, v_was_revealed
    FROM public.walks
    WHERE couple_id = p_couple_id
      AND date = p_date
      AND kind = p_kind
    FOR UPDATE;
  ELSE
    v_created_walk := TRUE;
  END IF;

  IF v_walk_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  INSERT INTO public.footprint_entries (
    walk_id, user_id, memo, photos, location_name, location_lat, location_lng,
    location_address, location_source, diary_question_id, diary_answer,
    couple_question_id, couple_answer
  )
  VALUES (
    v_walk_id,
    v_uid,
    COALESCE(p_memo, ''),
    COALESCE(p_photos, '{}'),
    CASE WHEN p_kind = 'each' THEN COALESCE(p_entry_location_name, '') ELSE '' END,
    CASE WHEN p_kind = 'each' THEN p_entry_location_lat ELSE NULL END,
    CASE WHEN p_kind = 'each' THEN p_entry_location_lng ELSE NULL END,
    CASE WHEN p_kind = 'each' THEN p_entry_location_address ELSE NULL END,
    CASE WHEN p_kind = 'each' THEN p_entry_location_source ELSE NULL END,
    p_diary_question_id,
    COALESCE(p_diary_answer, ''),
    p_couple_question_id,
    COALESCE(p_couple_answer, '')
  )
  ON CONFLICT (walk_id, user_id) DO NOTHING
  RETURNING id INTO v_entry_id;

  IF v_entry_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'already_entered',
      'walk_id', v_walk_id
    );
  END IF;

  SELECT COUNT(*) INTO v_entry_count
  FROM public.footprint_entries
  WHERE walk_id = v_walk_id;

  IF v_entry_count >= 2 AND NOT COALESCE(v_was_revealed, FALSE) THEN
    UPDATE public.walks SET is_revealed = TRUE WHERE id = v_walk_id;
    v_just_revealed := TRUE;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'walk_id', v_walk_id,
    'entry_id', v_entry_id,
    'created_walk', v_created_walk,
    'just_revealed', v_just_revealed
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.add_entry_to_walk(
  p_walk_id UUID,
  p_memo TEXT DEFAULT '',
  p_photos TEXT[] DEFAULT '{}',
  p_entry_location_name TEXT DEFAULT '',
  p_entry_location_lat DOUBLE PRECISION DEFAULT NULL,
  p_entry_location_lng DOUBLE PRECISION DEFAULT NULL,
  p_entry_location_address TEXT DEFAULT NULL,
  p_entry_location_source TEXT DEFAULT NULL,
  p_diary_question_id INTEGER DEFAULT NULL,
  p_diary_answer TEXT DEFAULT '',
  p_couple_question_id INTEGER DEFAULT NULL,
  p_couple_answer TEXT DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_profile_couple_id UUID;
  v_walk_couple_id UUID;
  v_kind TEXT;
  v_entry_id UUID;
  v_entry_count INTEGER;
  v_was_revealed BOOLEAN := FALSE;
  v_just_revealed BOOLEAN := FALSE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'forbidden');
  END IF;

  SELECT couple_id INTO v_profile_couple_id
  FROM public.profiles
  WHERE id = v_uid;

  SELECT couple_id, kind, is_revealed
  INTO v_walk_couple_id, v_kind, v_was_revealed
  FROM public.walks
  WHERE id = p_walk_id
  FOR UPDATE;

  IF v_walk_couple_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;
  IF v_profile_couple_id IS NULL OR v_profile_couple_id <> v_walk_couple_id THEN
    RETURN jsonb_build_object('success', false, 'reason', 'forbidden');
  END IF;

  INSERT INTO public.footprint_entries (
    walk_id, user_id, memo, photos, location_name, location_lat, location_lng,
    location_address, location_source, diary_question_id, diary_answer,
    couple_question_id, couple_answer
  )
  VALUES (
    p_walk_id,
    v_uid,
    COALESCE(p_memo, ''),
    COALESCE(p_photos, '{}'),
    CASE WHEN v_kind = 'each' THEN COALESCE(p_entry_location_name, '') ELSE '' END,
    CASE WHEN v_kind = 'each' THEN p_entry_location_lat ELSE NULL END,
    CASE WHEN v_kind = 'each' THEN p_entry_location_lng ELSE NULL END,
    CASE WHEN v_kind = 'each' THEN p_entry_location_address ELSE NULL END,
    CASE WHEN v_kind = 'each' THEN p_entry_location_source ELSE NULL END,
    p_diary_question_id,
    COALESCE(p_diary_answer, ''),
    p_couple_question_id,
    COALESCE(p_couple_answer, '')
  )
  ON CONFLICT (walk_id, user_id) DO NOTHING
  RETURNING id INTO v_entry_id;

  IF v_entry_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'already_entered',
      'walk_id', p_walk_id
    );
  END IF;

  SELECT COUNT(*) INTO v_entry_count
  FROM public.footprint_entries
  WHERE walk_id = p_walk_id;

  IF v_entry_count >= 2 AND NOT COALESCE(v_was_revealed, FALSE) THEN
    UPDATE public.walks SET is_revealed = TRUE WHERE id = p_walk_id;
    v_just_revealed := TRUE;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'walk_id', p_walk_id,
    'entry_id', v_entry_id,
    'created_walk', false,
    'just_revealed', v_just_revealed
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.join_couple_by_code(
  p_invite_code TEXT,
  p_start_date DATE
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_my_couple_id UUID;
  v_my_pending RECORD;
  v_target RECORD;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_profile');
  END IF;

  SELECT couple_id INTO v_my_couple_id
  FROM public.profiles
  WHERE id = v_uid
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_profile');
  END IF;

  IF v_my_couple_id IS NOT NULL THEN
    SELECT id, user1_id, user2_id
    INTO v_my_pending
    FROM public.couples
    WHERE id = v_my_couple_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'reason', 'already_paired');
    END IF;

    IF v_my_pending.id IS NOT NULL
       AND v_my_pending.user1_id = v_uid
       AND v_my_pending.user2_id IS NULL THEN
      UPDATE public.profiles SET couple_id = NULL WHERE id = v_uid;
      DELETE FROM public.couples WHERE id = v_my_pending.id;
    ELSE
      RETURN jsonb_build_object('success', false, 'reason', 'already_paired');
    END IF;
  END IF;

  SELECT *
  INTO v_target
  FROM public.couples
  WHERE invite_code = upper(trim(p_invite_code))
    AND user2_id IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_code');
  END IF;
  IF v_target.created_at < now() - interval '24 hours' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'expired');
  END IF;
  IF v_target.user1_id = v_uid THEN
    RETURN jsonb_build_object('success', false, 'reason', 'self_code');
  END IF;

  UPDATE public.couples
  SET user2_id = v_uid,
      start_date = p_start_date
  WHERE id = v_target.id;

  UPDATE public.profiles
  SET couple_id = v_target.id
  WHERE id IN (v_uid, v_target.user1_id);

  RETURN jsonb_build_object(
    'success', true,
    'couple_id', v_target.id,
    'user1_id', v_target.user1_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.disconnect_couple(p_couple_id UUID)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_couple RECORD;
  v_user1_deleted TIMESTAMPTZ;
  v_user2_deleted TIMESTAMPTZ;
BEGIN
  SELECT *
  INTO v_couple
  FROM public.couples
  WHERE id = p_couple_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;
  IF v_uid IS NULL OR (v_couple.user1_id <> v_uid AND v_couple.user2_id <> v_uid) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'forbidden');
  END IF;

  SELECT deleted_at INTO v_user1_deleted
  FROM public.profiles
  WHERE id = v_couple.user1_id;

  IF v_couple.user2_id IS NOT NULL THEN
    SELECT deleted_at INTO v_user2_deleted
    FROM public.profiles
    WHERE id = v_couple.user2_id;
  END IF;

  IF v_user1_deleted IS NOT NULL OR v_user2_deleted IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'partner_deleted');
  END IF;

  UPDATE public.profiles
  SET couple_id = NULL
  WHERE id IN (v_couple.user1_id, v_couple.user2_id);

  UPDATE public.couples
  SET user2_id = NULL,
      invite_code = 'DISCONNECTED-' || p_couple_id::text
  WHERE id = p_couple_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_premium_revoked(p_revenuecat_user_id TEXT)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID;
  v_couple_id UUID;
BEGIN
  SELECT id, couple_id
  INTO v_uid, v_couple_id
  FROM public.profiles
  WHERE revenuecat_user_id = p_revenuecat_user_id
  LIMIT 1;

  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  UPDATE public.profiles
  SET has_premium = false,
      premium_purchased_at = NULL
  WHERE id = v_uid;

  IF v_couple_id IS NOT NULL THEN
    UPDATE public.couples
    SET has_premium = false,
        premium_purchaser_id = NULL
    WHERE id = v_couple_id
      AND premium_purchaser_id = v_uid;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_theme_pack_revoked(p_revenuecat_user_id TEXT)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID;
  v_couple_id UUID;
BEGIN
  SELECT id, couple_id
  INTO v_uid, v_couple_id
  FROM public.profiles
  WHERE revenuecat_user_id = p_revenuecat_user_id
  LIMIT 1;

  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  UPDATE public.profiles
  SET has_theme_pack = false,
      theme_pack_purchased_at = NULL
  WHERE id = v_uid;

  IF v_couple_id IS NOT NULL THEN
    UPDATE public.couples
    SET has_theme_pack = false,
        theme_pack_purchaser_id = NULL
    WHERE id = v_couple_id
      AND theme_pack_purchaser_id = v_uid;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_walk_with_entry(UUID, DATE, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, TEXT, TEXT, TEXT[], TEXT, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, TEXT, INTEGER, TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_entry_to_walk(UUID, TEXT, TEXT[], TEXT, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, TEXT, INTEGER, TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_couple_by_code(TEXT, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.disconnect_couple(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_premium_revoked(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_theme_pack_revoked(TEXT) TO service_role;
