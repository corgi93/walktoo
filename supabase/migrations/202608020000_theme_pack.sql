-- Travel mood theme pack entitlement.
-- Idempotent: safe to run more than once on an existing database.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_theme_pack BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS theme_pack_purchased_at TIMESTAMPTZ;

ALTER TABLE public.couples
  ADD COLUMN IF NOT EXISTS has_theme_pack BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS theme_pack_purchaser_id UUID
    REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.mark_theme_pack_purchased(p_revenuecat_user_id TEXT)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_couple_id UUID;
BEGIN
  UPDATE public.profiles
  SET has_theme_pack = true,
      theme_pack_purchased_at = COALESCE(theme_pack_purchased_at, now()),
      revenuecat_user_id = p_revenuecat_user_id
  WHERE id = auth.uid()
  RETURNING couple_id INTO v_couple_id;

  IF v_couple_id IS NOT NULL THEN
    UPDATE public.couples
    SET has_theme_pack = true,
        theme_pack_purchaser_id = auth.uid()
    WHERE id = v_couple_id;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_theme_pack_purchased(TEXT) TO authenticated;
