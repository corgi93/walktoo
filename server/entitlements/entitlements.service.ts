import { supabase } from '../client';

// ─── Types ──────────────────────────────────────────────

export interface EntitlementStatus {
  /** 본인이 기록 업그레이드 결제 완료 */
  hasPremium: boolean;
  /** 커플이 premium 활성 (다른 한 명이 결제) */
  coupleHasPremium: boolean;
  /** 종합: 본인 또는 커플 중 한 명이 이용권을 보유하면 true */
  isEntitled: boolean;
}

interface ProfilePremiumRow {
  has_premium: boolean;
  couple_id: string | null;
}

interface CouplePremiumRow {
  has_premium: boolean;
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
    .select('has_premium, couple_id')
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

  const hasPremium = profile.has_premium;
  const isEntitled = hasPremium || coupleHasPremium;

  return {
    hasPremium,
    coupleHasPremium,
    isEntitled,
  };
}

const defaultStatus = (): EntitlementStatus => ({
  hasPremium: false,
  coupleHasPremium: false,
  isEntitled: false,
});

export const entitlementsService = {
  markPremiumPurchased,
  getStatus,
};
