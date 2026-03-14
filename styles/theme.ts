/**
 * PairWalk Design Tokens — Couple Diary Aesthetic
 *
 * 토스 스타일의 클린 미니멀리즘 위에
 * 커플 감성의 따뜻한 로즈 코랄 포인트.
 */

// ─── Color Types ────────────────────────────────────────

export type ColorType = keyof typeof theme.colors;

// ─── Theme ──────────────────────────────────────────────

export const theme = {
  colors: {
    /** 로즈 코랄 — 메인 액션, 커플 강조 */
    primary: '#E8706A',
    primaryLight: '#FDEAE8',
    primaryDark: '#C4524C',
    primarySurface: '#FFF5F4',

    /** 세이지 그린 — 건강, 성공, 보조 */
    secondary: '#81B29A',
    secondaryLight: '#D8EDE3',

    /** 소프트 피치 — 커플 포인트, 하이라이트 */
    accent: '#FFB5A7',
    accentLight: '#FFE0D9',

    /** 배경 */
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceWarm: '#FAFAF8',

    /** 뉴트럴 그레이 */
    gray100: '#F5F5F7',
    gray200: '#E8E8EC',
    gray300: '#D1D1D6',
    gray400: '#AEAEB2',
    gray500: '#8E8E93',
    gray600: '#636366',

    /** 텍스트 */
    text: '#1C1C1E',
    textSecondary: '#6E6E73',
    textMuted: '#AEAEB2',

    white: '#FFFFFF',
    error: '#E06C6C',
    success: '#81B29A',
  },

  shadows: {
    small: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 4,
      elevation: 1,
    },
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 3,
    },
    large: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 28,
      elevation: 6,
    },
  },

  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 28,
    full: 9999,
  },
} as const;
