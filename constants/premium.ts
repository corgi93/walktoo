/**
 * walkToo+ Premium 상수
 *
 * - 1회성 결제 (non-consumable IAP)
 * - 7일 무료 체험 (앱/서버 자체 로직)
 * - 커플 한 명만 결제하면 양쪽 적용
 *
 * RevenueCat 콘솔과 product ID/entitlement ID가 정확히 일치해야 함.
 * 자세한 세팅은 docs/revenuecat-setup.md 참고.
 */

export const PREMIUM = {
  /** RevenueCat dashboard에서 만든 entitlement identifier */
  ENTITLEMENT_ID: 'walktoo_plus',

  /** Apple/Google 콘솔의 product identifier (양쪽 동일하게 등록) */
  PRODUCT_ID: 'com.walktoo.plus.lifetime',

  /** 무료 체험 기간 */
  TRIAL_DAYS: 7,

  /** 사진 업로드 한도 */
  PHOTO_LIMIT_FREE: 5,
  PHOTO_LIMIT_PREMIUM: 20,

  /** 가격 fallback (RevenueCat offering이 정상 fetch되면 그쪽 우선) */
  PRICE_KRW: 19_900,
  PRICE_USD: 14.99,
} as const;
