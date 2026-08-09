-- walkToo 커플 패스 1년 전환
-- - 기간 없는 premium boolean을 12개월 만료 기반 entitlement로 보정한다.
-- - RevenueCat entitlement 만료일이 있으면 그대로 저장하고, 없으면 첫 동기화 시 1년을 부여한다.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_premium BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS premium_purchased_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revenuecat_user_id TEXT;

ALTER TABLE public.couples
  ADD COLUMN IF NOT EXISTS has_premium BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS premium_purchaser_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ;

UPDATE public.profiles
SET premium_expires_at = COALESCE(premium_purchased_at, now()) + interval '1 year'
WHERE has_premium = true
  AND premium_expires_at IS NULL;

UPDATE public.couples c
SET premium_expires_at = p.premium_expires_at
FROM public.profiles p
WHERE c.has_premium = true
  AND c.premium_purchaser_id = p.id
  AND c.premium_expires_at IS NULL
  AND p.premium_expires_at IS NOT NULL;

UPDATE public.couples
SET premium_expires_at = now() + interval '1 year'
WHERE has_premium = true
  AND premium_expires_at IS NULL;

DROP FUNCTION IF EXISTS public.mark_premium_purchased(TEXT);

CREATE OR REPLACE FUNCTION public.mark_premium_purchased(
  p_revenuecat_user_id TEXT,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_couple_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  UPDATE public.profiles
  SET has_premium = true,
      premium_purchased_at = COALESCE(premium_purchased_at, now()),
      premium_expires_at = CASE
        WHEN p_expires_at IS NOT NULL THEN p_expires_at
        WHEN premium_expires_at IS NULL THEN now() + interval '1 year'
        ELSE premium_expires_at
      END,
      revenuecat_user_id = p_revenuecat_user_id
  WHERE id = auth.uid()
  RETURNING couple_id, premium_expires_at INTO v_couple_id, v_expires_at;

  IF v_couple_id IS NOT NULL THEN
    UPDATE public.couples
    SET has_premium = true,
        premium_purchaser_id = auth.uid(),
        premium_expires_at = v_expires_at
    WHERE id = v_couple_id;
  END IF;

  RETURN jsonb_build_object(
    'success',
    v_expires_at IS NOT NULL AND v_expires_at > now(),
    'expires_at',
    v_expires_at
  );
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
      premium_purchased_at = NULL,
      premium_expires_at = NULL
  WHERE id = v_uid;

  IF v_couple_id IS NOT NULL THEN
    UPDATE public.couples
    SET has_premium = false,
        premium_purchaser_id = NULL,
        premium_expires_at = NULL
    WHERE id = v_couple_id
      AND premium_purchaser_id = v_uid;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_entitled()
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
DECLARE
  v_my_premium BOOLEAN;
  v_my_premium_expires_at TIMESTAMPTZ;
  v_couple_premium BOOLEAN;
  v_couple_premium_expires_at TIMESTAMPTZ;
BEGIN
  SELECT has_premium, premium_expires_at
  INTO v_my_premium, v_my_premium_expires_at
  FROM public.profiles WHERE id = auth.uid();

  IF COALESCE(v_my_premium, false)
     AND v_my_premium_expires_at IS NOT NULL
     AND v_my_premium_expires_at > now() THEN
    RETURN true;
  END IF;

  SELECT c.has_premium, c.premium_expires_at
  INTO v_couple_premium, v_couple_premium_expires_at
  FROM public.couples c
  JOIN public.profiles p ON p.couple_id = c.id
  WHERE p.id = auth.uid()
  LIMIT 1;

  IF COALESCE(v_couple_premium, false)
     AND v_couple_premium_expires_at IS NOT NULL
     AND v_couple_premium_expires_at > now() THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_premium_purchased(TEXT, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_premium_revoked(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_entitled() TO authenticated;
