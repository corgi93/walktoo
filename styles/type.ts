/**
 * walkToo Typography, Spacing & Component Tokens
 *
 * 도트 게임 감성: 모든 텍스트에 픽셀 폰트.
 * NeoDunggeunmo로 통일해서 레트로 느낌 극대화.
 */

// ─── Font Family ────────────────────────────────────────

export const FONT_FAMILY = {
  pixel: 'NeoDunggeunmo',
  body: 'NeoDunggeunmo', // 본문도 픽셀폰트로 통일
} as const;

export type FontFamily = keyof typeof FONT_FAMILY;

// ─── Typography Scale ───────────────────────────────────

export const TYPOGRAPHY = {
  displayLarge: { fontFamily: FONT_FAMILY.pixel, fontSize: 40, lineHeight: 48 },
  displayMedium: { fontFamily: FONT_FAMILY.pixel, fontSize: 32, lineHeight: 40 },
  displaySmall: { fontFamily: FONT_FAMILY.pixel, fontSize: 24, lineHeight: 32 },

  headingLarge: { fontFamily: FONT_FAMILY.pixel, fontSize: 22, lineHeight: 28 },
  headingMedium: { fontFamily: FONT_FAMILY.pixel, fontSize: 18, lineHeight: 24 },
  headingSmall: { fontFamily: FONT_FAMILY.pixel, fontSize: 16, lineHeight: 22 },

  bodyLarge: { fontFamily: FONT_FAMILY.pixel, fontSize: 16, lineHeight: 24 },
  bodyMedium: { fontFamily: FONT_FAMILY.pixel, fontSize: 14, lineHeight: 20 },
  bodySmall: { fontFamily: FONT_FAMILY.pixel, fontSize: 12, lineHeight: 18 },

  label: { fontFamily: FONT_FAMILY.pixel, fontSize: 14, lineHeight: 18 },
  caption: { fontFamily: FONT_FAMILY.pixel, fontSize: 11, lineHeight: 16 },
} as const;

export type TypographyVariant = keyof typeof TYPOGRAPHY;

// ─── Spacing (4px base grid) ────────────────────────────

export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
} as const;

export type SpacingToken = keyof typeof SPACING;
export type SpaceValue = SpacingToken | number;

export const getSpacing = (value: SpaceValue): number => {
  if (typeof value === 'number') return value;
  return SPACING[value];
};

// ─── Component Sizes ────────────────────────────────────

export const COMPONENT_SIZE = {
  buttonSmall: 40,
  buttonMedium: 48,
  buttonLarge: 56,
  inputHeight: 52,
  iconSmall: 20,
  iconMedium: 24,
  iconLarge: 32,
  avatarSmall: 40,
  avatarMedium: 60,
  avatarLarge: 80,
} as const;

// ─── Layout Conventions ─────────────────────────────────
//
// 화면 전체에서 일관된 여백·간격을 유지하기 위한 레이아웃 토큰.
// 각 화면에서 SPACING 을 직접 쓰지 말고, LAYOUT 을 통해 사용할 것.
//
//  ┌─ screenPx ─────────────────────────── screenPx ─┐
//  │ [Header]                          headerPy      │
//  │                                   sectionGap    │
//  │ ┌─ Card ── cardPx ──────────────── cardPx ─┐    │
//  │ │  Title              cardPy               │    │
//  │ │  Content            itemGap              │    │
//  │ │  Badge row          cardPy               │    │
//  │ └──────────────────────────────────────────┘    │
//  │                                   sectionGap    │
//  │ ┌─ Card ───────────────────────────────────┐    │
//  │ │  ...                                     │    │
//  │ └──────────────────────────────────────────┘    │
//  │                                   bottomSafe    │
//  └─────────────────────────────────────────────────┘

export const LAYOUT = {
  /** 화면 좌우 여백 — Box px="xxl" 과 동일 */
  screenPx: SPACING.xxl,           // 24

  /** 섹션(카드) 사이 기본 간격 */
  sectionGap: SPACING.lg,          // 16

  /** 큰 섹션 간격 (미션, CTA 위 등) */
  sectionGapLg: SPACING.xl,        // 20

  /** 카드 내부 패딩 */
  cardPx: SPACING.lg,              // 16
  cardPy: SPACING.lg,              // 16

  /** 카드 내 요소 간 간격 — 작음 (배지 사이 등) */
  itemGap: SPACING.sm,             // 8

  /** 카드 내 요소 간 간격 — 보통 (라벨↔값 등) */
  itemGapMd: SPACING.md,           // 12

  /** 상단 바 세로 패딩 */
  headerPy: SPACING.md,            // 12

  /** 하단 고정 영역 패딩 */
  bottomSafe: SPACING.xxl,         // 24
} as const;

// ─── Button & Size Variants ─────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'text';
export type Size = 'small' | 'medium' | 'large';
