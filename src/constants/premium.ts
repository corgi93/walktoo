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

  /**
   * 무료 다이어리 테마. 진입 장벽을 낮추기 위해 3종은 무료로 열어두고,
   * 나머지 3종은 여행 무드 테마팩(non-consumable)으로 판매한다.
   * 이미 저장된 다이어리의 테마 표시는 게이팅하지 않는다 — 새 선택만 잠근다.
   */
  FREE_DIARY_THEME_IDS: ['y2k_pastel', 'pixel_retro', 'grid_minimal'],

  /**
   * 가격 fallback. 스토어 가격이 source of truth.
   * 2,200원은 런칭 프로모션으로만 쓰고, 기본 기준가는 3,300원으로 둔다.
   */
  PRICE_KRW: 3_300,
  PRICE_USD: 2.49,
} as const;

/**
 * 여행 무드 테마팩 — 단건 1회성 결제 (non-consumable IAP)
 *
 * - 삿포로 필름 / 홍콩 야경 / 도쿄 레코드샵 테마 3종을 영구 해제
 * - 기록 업그레이드와 별도 상품. 커플 한 명만 결제하면 양쪽 적용.
 * - RevenueCat 콘솔의 product/entitlement ID와 정확히 일치해야 함.
 */
export const THEME_PACK = {
  ENTITLEMENT_ID: 'walktoo_theme_pack_travel',
  PRODUCT_ID: 'com.walktoo.theme_pack_travel',

  /** 팩에 포함되는 프리미엄 테마 (FREE_DIARY_THEME_IDS의 여집합과 일치 유지) */
  THEME_IDS: ['vintage_film', 'dreamy_cloud', 'dark_academia'],

  /** 가격 fallback. 스토어 가격이 source of truth. */
  PRICE_KRW: 3_300,
  PRICE_USD: 2.49,
} as const;

/**
 * 결과물 상품 가격 기준
 *
 * - 기록 접근권이 아니라, 이미 쌓인 기록을 이미지/PDF/리포트로 생성하는 상품
 * - 실제 IAP 등록과 결제 플로우가 붙기 전까지는 UI에서 "준비 중"으로만 노출한다.
 * - 결과물은 서버 생성/저장 비용이 있으므로 영구 무제한 권리로 팔지 않는다.
 */
export const RESULT_PRODUCTS = {
  MEMORY_CARD_IMAGE: {
    PRODUCT_ID: 'com.walktoo.memory_card_image',
    PRICE_KRW: 1_500,
    PRICE_USD: 1.49,
  },
  WALK_BOOK_BASIC: {
    PRODUCT_ID: 'com.walktoo.walk_book_basic',
    PRICE_KRW: 6_900,
    PRICE_USD: 5.99,
  },
  WALK_BOOK_EXTENDED: {
    PRODUCT_ID: 'com.walktoo.walk_book_extended',
    PRICE_KRW: 8_900,
    PRICE_USD: 7.99,
  },
  ANNIVERSARY_REPORT: {
    PRODUCT_ID: 'com.walktoo.anniversary_report',
    PRICE_KRW: 5_900,
    PRICE_USD: 4.99,
  },
} as const;

export const PRODUCT_BUNDLES = {
  RECORD_AND_THEME_PACK: {
    PRODUCT_ID: 'com.walktoo.bundle_record_theme',
    PRICE_KRW: 5_900,
    PRICE_USD: 4.49,
  },
} as const;

/** 해당 테마가 여행 무드 테마팩(유료) 소속인지 — 미보유 시 미리보기는 되고 저장 시 게이트. */
export const isThemePackThemeId = (id: string): boolean =>
  (THEME_PACK.THEME_IDS as readonly string[]).includes(id);
