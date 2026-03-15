/**
 * PairWalk Design Tokens — Retro Pixel Game Aesthetic
 *
 * 따뜻한 로즈 코랄 컬러 + 도트 게임 감성.
 * 두꺼운 보더, 솔리드 그림자, 삐뚤빼뚤한 느낌.
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
    background: '#F5F0EB',
    surface: '#FFFFFF',
    surfaceWarm: '#FAF6F2',

    /** 뉴트럴 그레이 */
    gray100: '#F0EDE8',
    gray200: '#E0DCD6',
    gray300: '#C8C4BE',
    gray400: '#A8A4A0',
    gray500: '#888480',
    gray600: '#585450',

    /** 텍스트 */
    text: '#2C2C2E',
    textSecondary: '#6E6E73',
    textMuted: '#A8A4A0',

    /** 픽셀 보더 */
    border: '#2C2C2E',
    borderLight: '#C8C4BE',

    white: '#FFFFFF',
    error: '#E06C6C',
    success: '#81B29A',

    /** 게임 보상 컬러 */
    gold: '#FFD700',
    goldLight: '#FFF8DC',
    xp: '#7EC8E3',
  },

  /** 픽셀 스타일 솔리드 그림자 (blur 없음, offset만) */
  shadows: {
    small: {
      shadowColor: '#2C2C2E',
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 2,
    },
    card: {
      shadowColor: '#2C2C2E',
      shadowOffset: { width: 3, height: 3 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 3,
    },
    medium: {
      shadowColor: '#2C2C2E',
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 4,
    },
    large: {
      shadowColor: '#2C2C2E',
      shadowOffset: { width: 5, height: 5 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 6,
    },
  },

  /** 픽셀 보더 프리셋 */
  pixel: {
    borderThin: {
      borderWidth: 2,
      borderColor: '#2C2C2E',
    },
    borderThick: {
      borderWidth: 3,
      borderColor: '#2C2C2E',
    },
    borderAccent: {
      borderWidth: 2,
      borderColor: '#E8706A',
    },
  },

  radius: {
    xs: 2,
    sm: 4,
    md: 6,
    lg: 8,
    xl: 10,
    xxl: 12,
    full: 9999,
  },
} as const;
