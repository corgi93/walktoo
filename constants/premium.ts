/**
 * walkToo+ 이용권 상수
 *
 * - 1회성 결제 (non-consumable IAP)
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

  /**
   * 사진 업로드 한도 (커플당 한 산책에 첨부 가능한 매수)
   *
   * 두 사람이 합쳐서 4장까지 — 한 명이 다 채우거나, 2+2로 나누거나,
   * 둘이 같이 채우는 형태 모두 지원.
   * 다이어리 표시 레이아웃이 4슬롯 디자인이라 4가 상한.
   */
  PHOTO_LIMIT_FREE: 4,
  PHOTO_LIMIT_PREMIUM: 12,

  /** 가격 fallback. 콘솔 기본 가격도 docs/revenuecat-setup.md와 같은 14,900원으로 맞춘다. */
  PRICE_KRW: 14_900,
  PRICE_USD: 14.99,
} as const;
