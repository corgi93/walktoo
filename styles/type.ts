/**
 * PairWalk Typography, Spacing & Component Tokens
 *
 * 픽셀 폰트(NeoDunggeunmo)는 제목/숫자/강조에만.
 * 본문은 시스템 폰트로 가독성 확보.
 */

// ─── Font Family ────────────────────────────────────────

export const FONT_FAMILY = {
  pixel: 'NeoDunggeunmo',
  body: undefined, // RN 시스템 폰트 기본값
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

  bodyLarge: { fontSize: 16, lineHeight: 24 },
  bodyMedium: { fontSize: 14, lineHeight: 20 },
  bodySmall: { fontSize: 12, lineHeight: 16 },

  label: { fontFamily: FONT_FAMILY.pixel, fontSize: 14, lineHeight: 18 },
  caption: { fontSize: 12, lineHeight: 16 },
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

// ─── Button & Size Variants ─────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'text';
export type Size = 'small' | 'medium' | 'large';
