/**
 * RevenueCat SDK 래퍼
 *
 * - 1회성 결제 (non-consumable) 전용
 * - API 키가 없으면 모든 호출이 no-op (Expo Go / dev 환경 안전)
 * - SDK 호출 결과는 모두 graceful 처리 (throw X, 호출부에서 결과 분기)
 *
 * 콘솔/대시보드 세팅은 docs/revenuecat-setup.md 참고.
 */

import { Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';

import { PREMIUM } from '@/constants/premium';

// ─── 환경 ────────────────────────────────────────────────

const API_KEY =
  Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '',
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '',
  }) ?? '';

let initialized = false;

// ─── 초기화 ──────────────────────────────────────────────

/**
 * RevenueCat SDK 초기화. 한 user당 한 번만 configure 호출.
 * 같은 user로 다시 부르면 logIn으로 처리.
 *
 * API 키가 없으면 (env 미설정) 안전하게 skip.
 */
export const initRevenueCat = async (userId: string): Promise<void> => {
  if (!API_KEY) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[RevenueCat] API key missing — SDK disabled');
    }
    return;
  }

  try {
    if (initialized) {
      await Purchases.logIn(userId);
      return;
    }
    await Purchases.configure({ apiKey: API_KEY, appUserID: userId });
    initialized = true;
  } catch (e) {
    console.warn('[RevenueCat] init failed:', e);
  }
};

export const isRevenueCatReady = (): boolean => initialized;

// ─── 상품 ────────────────────────────────────────────────

export const getCurrentOffering = async (): Promise<PurchasesOffering | null> => {
  if (!initialized) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch (e) {
    console.warn('[RevenueCat] getOfferings failed:', e);
    return null;
  }
};

/**
 * 현재 offering에서 walkToo+ 1회성 패키지를 찾는다.
 * 우선순위:
 * 1. lifetime package
 * 2. PRODUCT_ID와 일치하는 패키지
 */
export const findLifetimePackage = (
  offering: PurchasesOffering,
): PurchasesPackage | null => {
  if (offering.lifetime) return offering.lifetime;
  const matched = offering.availablePackages.find(
    (p) => p.product.identifier === PREMIUM.PRODUCT_ID,
  );
  return matched ?? null;
};

// ─── 구매 / 복원 ─────────────────────────────────────────

export interface PurchaseOutcome {
  ok: boolean;
  /** 사용자가 dialog를 취소함 (에러 표시 X) */
  userCancelled?: boolean;
  /** 활성 entitlement 보유 여부 */
  hasEntitlement?: boolean;
  /** RevenueCat appUserID (Supabase 동기화에 사용) */
  appUserId?: string;
  errorMessage?: string;
}

export const purchaseLifetime = async (
  pkg: PurchasesPackage,
): Promise<PurchaseOutcome> => {
  if (!initialized) {
    return { ok: false, errorMessage: 'sdk-unavailable' };
  }
  try {
    const result = await Purchases.purchasePackage(pkg);
    const hasEntitlement = hasActiveEntitlement(result.customerInfo);
    const appUserId = await Purchases.getAppUserID();
    return { ok: hasEntitlement, hasEntitlement, appUserId };
  } catch (e: unknown) {
    const err = e as { userCancelled?: boolean; message?: string };
    if (err.userCancelled) {
      return { ok: false, userCancelled: true };
    }
    return { ok: false, errorMessage: err.message ?? 'unknown' };
  }
};

export const restorePurchases = async (): Promise<PurchaseOutcome> => {
  if (!initialized) {
    return { ok: false, errorMessage: 'sdk-unavailable' };
  }
  try {
    const customerInfo = await Purchases.restorePurchases();
    const hasEntitlement = hasActiveEntitlement(customerInfo);
    const appUserId = await Purchases.getAppUserID();
    return { ok: hasEntitlement, hasEntitlement, appUserId };
  } catch (e: unknown) {
    const err = e as { message?: string };
    return { ok: false, errorMessage: err.message ?? 'unknown' };
  }
};

// ─── 헬퍼 ────────────────────────────────────────────────

export const hasActiveEntitlement = (info: CustomerInfo): boolean => {
  return !!info.entitlements.active[PREMIUM.ENTITLEMENT_ID];
};

export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  if (!initialized) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
};

export const getRevenueCatAppUserId = async (): Promise<string | null> => {
  if (!initialized) return null;
  try {
    return await Purchases.getAppUserID();
  } catch {
    return null;
  }
};
