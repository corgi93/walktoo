/**
 * RevenueCat SDK 래퍼
 *
 * - 커플 패스와 테마팩 IAP 처리
 * - API 키가 없거나 native 모듈이 없으면 모든 호출이 no-op
 * - SDK 호출 결과는 모두 graceful 처리 (throw X, 호출부에서 결과 분기)
 *
 * NOTE: react-native-purchases는 native 모듈이라 dev client 빌드가 필요하다.
 * Expo Go / 미빌드 dev client에서도 앱이 죽지 않도록 모듈 자체를 lazy require로
 * 로드한다. 모듈 로딩이 실패하면 Purchases = null 로 두고 모든 함수는 no-op.
 *
 * 콘솔/대시보드 세팅은 docs/revenuecat-setup.md 참고.
 */

import { Platform } from 'react-native';
import type {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';

import { PREMIUM, THEME_PACK } from '@/constants/premium';

// ─── 환경 ────────────────────────────────────────────────

const API_KEY =
  Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '',
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '',
  }) ?? '';

// ─── Lazy SDK 로드 ──────────────────────────────────────
//
// 최초 호출 시점에 require()로 로드. 실패하면 null로 마킹하고 다시 시도하지 않음.

type PurchasesModule = typeof import('react-native-purchases').default;

let purchasesRef: PurchasesModule | null = null;
let loadAttempted = false;

const getPurchases = (): PurchasesModule | null => {
  if (loadAttempted) return purchasesRef;
  loadAttempted = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-purchases');
    purchasesRef = (mod.default ?? mod) as PurchasesModule;
    return purchasesRef;
  } catch (e) {
    if (__DEV__) {
      console.warn(
        '[RevenueCat] react-native-purchases unavailable. ' +
          'Rebuild dev client to enable purchases.',
        e,
      );
    }
    purchasesRef = null;
    return null;
  }
};

let initialized = false;

// ─── 초기화 ──────────────────────────────────────────────

/**
 * RevenueCat SDK 초기화. 한 user당 한 번만 configure 호출.
 * 같은 user로 다시 부르면 logIn으로 처리.
 *
 * API 키가 없거나 native 모듈이 없으면 안전하게 skip.
 */
export const initRevenueCat = async (userId: string): Promise<void> => {
  if (!API_KEY) {
    if (__DEV__) {
      console.warn('[RevenueCat] API key missing — SDK disabled');
    }
    return;
  }

  const Purchases = getPurchases();
  if (!Purchases) return;

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
  const Purchases = getPurchases();
  if (!Purchases) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch (e) {
    console.warn('[RevenueCat] getOfferings failed:', e);
    return null;
  }
};

/**
 * 현재 offering에서 커플 패스 패키지를 찾는다.
 * RevenueCat 기본 패키지 타입 또는 product ID 매칭을 모두 지원한다.
 */
export const findCouplePassPackage = (
  offering: PurchasesOffering,
): PurchasesPackage | null => {
  const matched = offering.availablePackages.find(
    (p) =>
      p.product.identifier === PREMIUM.PRODUCT_ID ||
      p.product.identifier === PREMIUM.ANDROID_PRODUCT_ID,
  );
  return matched ?? null;
};

/**
 * 여행 무드 테마팩 패키지를 모든 offering에서 찾는다.
 * 테마팩은 current offering이 아닌 별도 offering에 둘 수 있어 전체를 훑는다.
 */
export const getThemePackPackage =
  async (): Promise<PurchasesPackage | null> => {
    if (!initialized) return null;
    const Purchases = getPurchases();
    if (!Purchases) return null;
    try {
      const offerings = await Purchases.getOfferings();
      for (const offering of Object.values(offerings.all)) {
        const matched = offering.availablePackages.find(
          (p) => p.product.identifier === THEME_PACK.PRODUCT_ID,
        );
        if (matched) return matched;
      }
      return null;
    } catch (e) {
      console.warn('[RevenueCat] getThemePackPackage failed:', e);
      return null;
    }
  };

// ─── 구매 / 복원 ─────────────────────────────────────────

export interface PurchaseOutcome {
  ok: boolean;
  /** 사용자가 dialog를 취소함 (에러 표시 X) */
  userCancelled?: boolean;
  /** 활성 entitlement 보유 여부 (커플 패스) */
  hasEntitlement?: boolean;
  /** 커플 패스 entitlement 만료일. null이면 스토어/RC상 만료일 없음. */
  entitlementExpiresAt?: string | null;
  /** 여행 무드 테마팩 entitlement 보유 여부 (restore 시 함께 확인) */
  hasThemePack?: boolean;
  /** RevenueCat appUserID (Supabase 동기화에 사용) */
  appUserId?: string;
  errorMessage?: string;
}

const purchaseWithEntitlement = async (
  pkg: PurchasesPackage,
  entitlementId: string,
): Promise<PurchaseOutcome> => {
  if (!initialized) {
    return { ok: false, errorMessage: 'sdk-unavailable' };
  }
  const Purchases = getPurchases();
  if (!Purchases) {
    return { ok: false, errorMessage: 'sdk-unavailable' };
  }
  try {
    const result = await Purchases.purchasePackage(pkg);
    const entitlement = result.customerInfo.entitlements.active[entitlementId];
    const hasEntitlement = !!entitlement;
    const appUserId = await Purchases.getAppUserID();
    return {
      ok: hasEntitlement,
      hasEntitlement,
      entitlementExpiresAt: entitlement?.expirationDate ?? null,
      appUserId,
    };
  } catch (e: unknown) {
    const err = e as { userCancelled?: boolean; message?: string };
    if (err.userCancelled) {
      return { ok: false, userCancelled: true };
    }
    return { ok: false, errorMessage: err.message ?? 'unknown' };
  }
};

export const purchaseCouplePass = (
  pkg: PurchasesPackage,
): Promise<PurchaseOutcome> =>
  purchaseWithEntitlement(pkg, PREMIUM.ENTITLEMENT_ID);

export const purchaseThemePack = (
  pkg: PurchasesPackage,
): Promise<PurchaseOutcome> =>
  purchaseWithEntitlement(pkg, THEME_PACK.ENTITLEMENT_ID);

export const restorePurchases = async (): Promise<PurchaseOutcome> => {
  if (!initialized) {
    return { ok: false, errorMessage: 'sdk-unavailable' };
  }
  const Purchases = getPurchases();
  if (!Purchases) {
    return { ok: false, errorMessage: 'sdk-unavailable' };
  }
  try {
    const customerInfo = await Purchases.restorePurchases();
    const entitlement = customerInfo.entitlements.active[PREMIUM.ENTITLEMENT_ID];
    const hasEntitlement = !!entitlement;
    const hasThemePack = hasActiveThemePackEntitlement(customerInfo);
    const appUserId = await Purchases.getAppUserID();
    return {
      ok: hasEntitlement || hasThemePack,
      hasEntitlement,
      entitlementExpiresAt: entitlement?.expirationDate ?? null,
      hasThemePack,
      appUserId,
    };
  } catch (e: unknown) {
    const err = e as { message?: string };
    return { ok: false, errorMessage: err.message ?? 'unknown' };
  }
};

// ─── 헬퍼 ────────────────────────────────────────────────

export const hasActiveEntitlement = (info: CustomerInfo): boolean => {
  return !!info.entitlements.active[PREMIUM.ENTITLEMENT_ID];
};

export const getActiveEntitlementExpirationDate = (
  info: CustomerInfo,
): string | null | undefined => {
  return info.entitlements.active[PREMIUM.ENTITLEMENT_ID]?.expirationDate;
};

export const hasActiveThemePackEntitlement = (info: CustomerInfo): boolean => {
  return !!info.entitlements.active[THEME_PACK.ENTITLEMENT_ID];
};

export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  if (!initialized) return null;
  const Purchases = getPurchases();
  if (!Purchases) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
};

export const getRevenueCatAppUserId = async (): Promise<string | null> => {
  if (!initialized) return null;
  const Purchases = getPurchases();
  if (!Purchases) return null;
  try {
    return await Purchases.getAppUserID();
  } catch {
    return null;
  }
};
