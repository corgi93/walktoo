import { supabase } from '../client';

// ─── Types ──────────────────────────────────────────────

export interface EntitlementStatus {
  /** 본인이 커플 패스 결제 완료, 기간 내 */
  hasPremium: boolean;
  /** 커플이 커플 패스 활성, 기간 내 */
  coupleHasPremium: boolean;
  /** 종합: 본인 또는 커플 중 한 명이 이용권을 보유하면 true */
  isEntitled: boolean;
  /** 본인이 여행 무드 테마팩 결제 완료 */
  hasThemePack: boolean;
  /** 커플이 테마팩 활성 (다른 한 명이 결제) */
  coupleHasThemePack: boolean;
  /** 종합: 본인 또는 커플 중 한 명이 테마팩을 보유하면 true */
  isThemePackEntitled: boolean;
}

interface ProfilePremiumRow {
  has_premium: boolean;
  premium_expires_at?: string | null;
  has_theme_pack: boolean;
  couple_id: string | null;
}

interface CouplePremiumRow {
  has_premium: boolean;
  premium_expires_at?: string | null;
  has_theme_pack: boolean;
}

export interface PremiumPurchaseSyncInput {
  revenuecatUserId: string;
  expiresAt?: string | null;
}

// ─── 결제 성공 마킹 (RevenueCat 콜백 후) ────────────────

export async function markPremiumPurchased(
  input: PremiumPurchaseSyncInput,
): Promise<{ success: boolean }> {
  const { data, error } = await supabase.rpc('mark_premium_purchased', {
    p_revenuecat_user_id: input.revenuecatUserId,
    p_expires_at: input.expiresAt ?? null,
  });

  if (error) {
    console.warn('[entitlements] mark_premium error:', error.message);
    return { success: false };
  }

  const result = data as { success?: boolean } | null;
  return { success: result?.success === true };
}

// ─── 테마팩 결제 성공 마킹 (RevenueCat 콜백 후) ─────────

export async function markThemePackPurchased(
  revenuecatUserId: string,
): Promise<{ success: boolean }> {
  const { data, error } = await supabase.rpc('mark_theme_pack_purchased', {
    p_revenuecat_user_id: revenuecatUserId,
  });

  if (error) {
    console.warn('[entitlements] mark_theme_pack error:', error.message);
    return { success: false };
  }

  const result = data as { success?: boolean } | null;
  return { success: result?.success === true };
}

// ─── 종합 entitlement 상태 ──────────────────────────────

export async function getStatus(): Promise<EntitlementStatus> {
  // theme pack 컬럼이 아직 없는 DB(마이그레이션 전)에서도 기존 premium
  // 게이팅이 깨지지 않도록, 컬럼 누락 에러 시 legacy 컬럼으로 폴백한다.
  let profile: ProfilePremiumRow | null = null;
  const { data: fullProfile, error: profileError } = await supabase
    .from('profiles')
    .select('has_premium, premium_expires_at, has_theme_pack, couple_id')
    .single<ProfilePremiumRow>();

  if (!profileError && fullProfile) {
    profile = fullProfile;
  } else {
    const { data: premiumProfile, error: premiumError } = await supabase
      .from('profiles')
      .select('has_premium, premium_expires_at, couple_id')
      .single<Omit<ProfilePremiumRow, 'has_theme_pack'>>();

    if (!premiumError && premiumProfile) {
      profile = { ...premiumProfile, has_theme_pack: false };
    } else {
      const { data: legacyProfile, error: legacyError } = await supabase
        .from('profiles')
        .select('has_premium, couple_id')
        .single<Omit<ProfilePremiumRow, 'has_theme_pack'>>();
      if (legacyError || !legacyProfile) {
        console.warn(
          '[entitlements] profile fetch error:',
          (legacyError ?? premiumError ?? profileError)?.message,
        );
        return defaultStatus();
      }
      profile = { ...legacyProfile, has_theme_pack: false };
    }
  }

  let coupleHasPremium = false;
  let coupleHasThemePack = false;
  if (profile.couple_id) {
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('has_premium, premium_expires_at, has_theme_pack')
      .eq('id', profile.couple_id)
      .maybeSingle<CouplePremiumRow>();
    if (!coupleError && couple) {
      coupleHasPremium = isPremiumActive(
        couple.has_premium,
        couple.premium_expires_at,
      );
      coupleHasThemePack = couple.has_theme_pack;
    } else if (coupleError) {
      const { data: premiumCouple, error: premiumCoupleError } = await supabase
        .from('couples')
        .select('has_premium, premium_expires_at')
        .eq('id', profile.couple_id)
        .maybeSingle<Omit<CouplePremiumRow, 'has_theme_pack'>>();
      if (!premiumCoupleError && premiumCouple) {
        coupleHasPremium = isPremiumActive(
          premiumCouple.has_premium,
          premiumCouple.premium_expires_at,
        );
      } else {
        const { data: legacyCouple } = await supabase
          .from('couples')
          .select('has_premium')
          .eq('id', profile.couple_id)
          .maybeSingle<Omit<CouplePremiumRow, 'has_theme_pack'>>();
        coupleHasPremium = legacyCouple?.has_premium ?? false;
      }
    }
  }

  const hasPremium = isPremiumActive(
    profile.has_premium,
    profile.premium_expires_at,
  );
  const hasThemePack = profile.has_theme_pack;

  return {
    hasPremium,
    coupleHasPremium,
    isEntitled: hasPremium || coupleHasPremium,
    hasThemePack,
    coupleHasThemePack,
    isThemePackEntitled: hasThemePack || coupleHasThemePack,
  };
}

const defaultStatus = (): EntitlementStatus => ({
  hasPremium: false,
  coupleHasPremium: false,
  isEntitled: false,
  hasThemePack: false,
  coupleHasThemePack: false,
  isThemePackEntitled: false,
});

const isPremiumActive = (
  hasPremium: boolean,
  expiresAt: string | null | undefined,
): boolean => {
  if (!hasPremium) return false;
  // 컬럼이 아직 없는 DB에서는 기존 boolean 동작으로 폴백한다.
  if (expiresAt === undefined) return true;
  if (!expiresAt) return false;
  return Date.parse(expiresAt) > Date.now();
};

export const entitlementsService = {
  markPremiumPurchased,
  markThemePackPurchased,
  getStatus,
};
