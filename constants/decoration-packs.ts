/**
 * walkToo 꾸미기 팩 카탈로그
 *
 * 개별 팩은 각자 RevenueCat product로 등록. 카탈로그 정의는 클라이언트 하드코딩
 * (DB에 카탈로그 테이블 만들면 오버엔지니어링 — 앱 업데이트로 충분히 관리 가능).
 *
 * 소유권은 `couple_pack_entitlements` 테이블 (RPC `mark_pack_purchased`).
 * 'lifetime' 팩은 한 row만 저장하고 클라이언트에서 "모든 팩 unlock"으로 해석.
 * 'bundle-*' 팩은 includes[] 각 pack_id에 대해 RPC를 여러 번 호출해 펼쳐 저장.
 *
 * @see docs/revenuecat-setup.md 에서 RC 콘솔에 동일 product_id로 등록 필요.
 */

export const LIFETIME_PACK_ID = 'lifetime' as const;

export interface DecorationPack {
  /** 내부 식별자 (DB · 클라이언트 로직 키) */
  id: string;
  /** RevenueCat/스토어 product identifier */
  productId: string;
  /** 카테고리 (개별 팩 / 번들 / 평생팩) */
  kind: 'single' | 'bundle' | 'lifetime';
  /** 표시명 */
  name: string;
  /** 한 줄 설명 */
  description: string;
  /** 이모지 or 간단 아이콘 키 */
  emoji: string;
  /** 가격 (KRW, fallback — 실제는 RC offering에서 가져옴) */
  priceKrw: number;
  /** 번들일 때 포함되는 single pack id들. lifetime은 '*' */
  includes?: string[] | '*';
  /** UI 강조 뱃지 ("인기" / "할인" 등) */
  badge?: string;
}

export const DECORATION_PACKS: readonly DecorationPack[] = [
  {
    id: 'polaroid',
    productId: 'com.walktoo.pack.polaroid',
    kind: 'single',
    name: '폴라로이드 팩',
    description: '즉석 사진 프레임 · 클립 스티커',
    emoji: '📷',
    priceKrw: 1_200,
  },
  {
    id: 'washi',
    productId: 'com.walktoo.pack.washi',
    kind: 'single',
    name: '워시테이프 팩',
    description: '알록달록 테이프 · 마스킹 패턴',
    emoji: '🎀',
    priceKrw: 1_200,
  },
  {
    id: 'doodle',
    productId: 'com.walktoo.pack.doodle',
    kind: 'single',
    name: '손그림 스티커 팩',
    description: '하트 · 별 · 감성 낙서',
    emoji: '✏️',
    priceKrw: 1_200,
  },
  {
    id: 'bundle-three',
    productId: 'com.walktoo.bundle.three',
    kind: 'bundle',
    name: '3팩 묶음',
    description: '폴라로이드 + 워시테이프 + 손그림',
    emoji: '🎁',
    priceKrw: 2_900,
    includes: ['polaroid', 'washi', 'doodle'],
    badge: '약 19% 할인',
  },
  // NOTE(release phase 1): 평생팩은 초기 출시에서 숨김.
  // 가볍게 시작하는 전략 — 추후 제품 라인업 충분해지면 재도입.
  // {
  //   id: LIFETIME_PACK_ID,
  //   productId: 'com.walktoo.plus.lifetime',
  //   kind: 'lifetime',
  //   name: '올인원 평생팩',
  //   description: '지금과 앞으로 나올 모든 꾸미기 팩 영구 이용',
  //   emoji: '👑',
  //   priceKrw: 9_900,
  //   includes: '*',
  //   badge: '최대 혜택',
  // },
] as const;

/** id → 팩 조회 */
export const findPack = (id: string): DecorationPack | undefined =>
  DECORATION_PACKS.find((p) => p.id === id);

/**
 * 소유 팩 ID 집합을 받아서, 접근 가능한 기능 ID 집합으로 확장한다.
 * - lifetime 소유 → 모든 single 팩 unlock
 * - bundle 소유   → bundle.includes 각각 unlock
 * - single 소유   → 그대로
 */
export const expandOwnedPacks = (ownedIds: Iterable<string>): Set<string> => {
  const owned = new Set(ownedIds);
  const unlocked = new Set<string>();

  // lifetime이면 모든 single+bundle id 포함
  if (owned.has(LIFETIME_PACK_ID)) {
    for (const p of DECORATION_PACKS) {
      unlocked.add(p.id);
    }
    return unlocked;
  }

  // bundle 소유하면 includes 펼치기
  for (const ownedId of owned) {
    unlocked.add(ownedId);
    const pack = findPack(ownedId);
    if (pack?.kind === 'bundle' && Array.isArray(pack.includes)) {
      for (const subId of pack.includes) {
        unlocked.add(subId);
      }
    }
  }
  return unlocked;
};
