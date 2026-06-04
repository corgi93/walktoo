/**
 * walkToo 기록 업그레이드 상수
 *
 * - 구독 없는 1회성 결제 (non-consumable IAP)
 * - 커플 한 명만 결제하면 양쪽 적용
 * - 기본 기록은 무료로 유지하고, 미디어/꾸미기/결과물 경험만 확장
 *
 * RevenueCat 콘솔과 product ID/entitlement ID가 정확히 일치해야 함.
 * 자세한 세팅은 docs/revenuecat-setup.md 참고.
 */

export const PREMIUM = {
  /** RevenueCat dashboard에서 만든 entitlement identifier */
  ENTITLEMENT_ID: 'walktoo_record_upgrade',

  /** Apple/Google 콘솔의 product identifier (양쪽 동일하게 등록) */
  PRODUCT_ID: 'com.walktoo.record_upgrade',

  /**
   * 사진 업로드 한도 (커플당 한 산책에 첨부 가능한 매수).
   * 기본 기록은 4장까지, 업그레이드 시 한 기록을 더 풍성하게 남길 수 있다.
   */
  PHOTO_LIMIT_FREE: 4,
  PHOTO_LIMIT_PREMIUM: 8,

  /** 각자의 모먼트 짧은 영상 길이. */
  VIDEO_DURATION_FREE_SECONDS: 3,
  VIDEO_DURATION_PREMIUM_SECONDS: 5,

  /** 다이어리 테마는 초기 진입 장벽을 낮추기 위해 모두 무료로 제공한다. */
  FREE_DIARY_THEME_IDS: [
    'y2k_pastel',
    'vintage_film',
    'pixel_retro',
    'grid_minimal',
    'dreamy_cloud',
    'dark_academia',
  ],

  /** 가격 fallback. 초기 부담을 낮춘 소액 업그레이드 가격. */
  PRICE_KRW: 2_200,
  PRICE_USD: 1.99,
} as const;
