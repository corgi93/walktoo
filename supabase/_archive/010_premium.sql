-- ============================================================
-- walkToo+ Premium (1회성 결제 + 7일 무료 체험 + 커플 공유)
--
-- 정책:
-- - 1회성 결제 (non-consumable IAP). 월 구독 X.
-- - 7일 무료 체험 — 첫 로그인 시 1회 set, 이후 갱신 불가 (어뷰즈 방지).
-- - 커플 한 명만 결제하면 양쪽 entitled.
-- - 커플 해제 시 구매자만 premium 유지, 상대는 free 복귀 (이 SQL이 아닌
--   useDisconnectCoupleMutation 흐름에서 처리).
-- ============================================================

-- 1. profiles에 entitlement 컬럼 추가
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_premium BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS premium_trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS premium_purchased_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revenuecat_user_id TEXT;

-- 2. couples에 공유 entitlement 컬럼
ALTER TABLE public.couples
  ADD COLUMN IF NOT EXISTS has_premium BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS premium_purchaser_id UUID
    REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ============================================================
-- 3. RPC: 트라이얼 시작 (idempotent)
-- profiles.premium_trial_ends_at 가 NULL 일 때만 7일 set.
-- 이미 set 된 적 있으면 기존 값 그대로 반환.
-- ============================================================
CREATE OR REPLACE FUNCTION public.start_trial_if_needed()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing TIMESTAMPTZ;
BEGIN
  SELECT premium_trial_ends_at INTO v_existing
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object(
      'started', false,
      'trial_ends_at', v_existing
    );
  END IF;

  UPDATE public.profiles
  SET premium_trial_ends_at = now() + interval '7 days'
  WHERE id = auth.uid()
  RETURNING premium_trial_ends_at INTO v_existing;

  RETURN jsonb_build_object(
    'started', true,
    'trial_ends_at', v_existing
  );
END;
$$;

-- ============================================================
-- 4. RPC: 결제 성공 후 entitlement 마킹
-- RevenueCat 클라이언트가 구매 성공 시 호출.
-- 본인 has_premium = true + 커플도 has_premium = true.
-- ============================================================
CREATE OR REPLACE FUNCTION public.mark_premium_purchased(
  p_revenuecat_user_id TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_couple_id UUID;
BEGIN
  UPDATE public.profiles
  SET has_premium = true,
      premium_purchased_at = COALESCE(premium_purchased_at, now()),
      revenuecat_user_id = p_revenuecat_user_id
  WHERE id = auth.uid()
  RETURNING couple_id INTO v_couple_id;

  IF v_couple_id IS NOT NULL THEN
    UPDATE public.couples
    SET has_premium = true,
        premium_purchaser_id = auth.uid()
    WHERE id = v_couple_id;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================
-- 5. RPC: entitlement 체크 (전체 종합)
-- 우선순위: 본인 결제 > 커플 결제 > 트라이얼 활성
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_entitled()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_trial_ends TIMESTAMPTZ;
  v_my_premium BOOLEAN;
  v_couple_premium BOOLEAN;
BEGIN
  SELECT premium_trial_ends_at, has_premium
  INTO v_trial_ends, v_my_premium
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_my_premium THEN
    RETURN true;
  END IF;

  SELECT c.has_premium INTO v_couple_premium
  FROM public.couples c
  JOIN public.profiles p ON p.couple_id = c.id
  WHERE p.id = auth.uid()
  LIMIT 1;

  IF COALESCE(v_couple_premium, false) THEN
    RETURN true;
  END IF;

  IF v_trial_ends IS NOT NULL AND v_trial_ends > now() THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- ============================================================
-- 6. 권한
-- RPC들은 SECURITY DEFINER + auth.uid() 기반이라 안전.
-- profiles/couples의 RLS는 기존 정책을 그대로 사용 (본인 row만 read/update).
-- has_premium 컬럼은 RLS의 SELECT/UPDATE 정책에 자동 포함됨.
-- ============================================================

GRANT EXECUTE ON FUNCTION public.start_trial_if_needed() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_premium_purchased(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_entitled() TO authenticated;
