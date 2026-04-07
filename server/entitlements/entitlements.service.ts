import { supabase } from '../client';

// ─── Types ──────────────────────────────────────────────

export interface EntitlementStatus {
  /** 본인이 평생 이용권 결제 완료 */
  hasPremium: boolean;
  /** 트라이얼 만료 시각 (ISO 8601), 한 번도 set 안 됐으면 null */
  trialEndsAt: string | null;
  /** 현재 트라이얼 활성 여부 (서버 시각 기준) */
  isInTrial: boolean;
  /** 커플이 premium 활성 (다른 한 명이 결제) */
  coupleHasPremium: boolean;
  /** 종합: 위 셋 중 하나라도 true면 premium 권한 */
  isEntitled: boolean;
}

interface ProfilePremiumRow {
  has_premium: boolean;
  premium_trial_ends_at: string | null;
  couple_id: string | null;
}

interface CouplePremiumRow {
  has_premium: boolean;
}

// ─── 트라이얼 시작 (idempotent) ──────────────────────────

export async function startTrialIfNeeded(): Promise<{
  started: boolean;
  trialEndsAt: string | null;
}> {
  const { data, error } = await supabase.rpc('start_trial_if_needed');

  if (error) {
    console.warn('[entitlements] start_trial error:', error.message);
    return { started: false, trialEndsAt: null };
  }

  const result = data as { started: boolean; trial_ends_at: string | null };
  return {
    started: result.started,
    trialEndsAt: result.trial_ends_at,
  };
}

// ─── 결제 성공 마킹 (RevenueCat 콜백 후) ────────────────

export async function markPremiumPurchased(
  revenuecatUserId: string,
): Promise<{ success: boolean }> {
  const { data, error } = await supabase.rpc('mark_premium_purchased', {
    p_revenuecat_user_id: revenuecatUserId,
  });

  if (error) {
    console.warn('[entitlements] mark_premium error:', error.message);
    return { success: false };
  }

  const result = data as { success: boolean };
  return { success: result.success };
}

// ─── 종합 entitlement 상태 ──────────────────────────────

export async function getStatus(): Promise<EntitlementStatus> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('has_premium, premium_trial_ends_at, couple_id')
    .single<ProfilePremiumRow>();

  if (profileError || !profile) {
    console.warn('[entitlements] profile fetch error:', profileError?.message);
    return defaultStatus();
  }

  let coupleHasPremium = false;
  if (profile.couple_id) {
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('has_premium')
      .eq('id', profile.couple_id)
      .maybeSingle<CouplePremiumRow>();
    if (!coupleError && couple) {
      coupleHasPremium = couple.has_premium;
    }
  }

  const trialEndsAt = profile.premium_trial_ends_at;
  const isInTrial = !!trialEndsAt && new Date(trialEndsAt).getTime() > Date.now();
  const hasPremium = profile.has_premium;
  const isEntitled = hasPremium || coupleHasPremium || isInTrial;

  return {
    hasPremium,
    trialEndsAt,
    isInTrial,
    coupleHasPremium,
    isEntitled,
  };
}

const defaultStatus = (): EntitlementStatus => ({
  hasPremium: false,
  trialEndsAt: null,
  isInTrial: false,
  coupleHasPremium: false,
  isEntitled: false,
});

export const entitlementsService = {
  startTrialIfNeeded,
  markPremiumPurchased,
  getStatus,
};
