/**
 * walkToo 다꾸 (diary-deco) 테마 토큰
 *
 * 6종 테마 — 각자 컬러 팔레트, 폰트, 와시테이프 패턴, 스티커 셋, 타이틀 모드.
 * 데이터 레이어와는 무관 — 표시 레이어에서만 소비.
 *
 * 폰트는 디바이스에 로드된 게 없으면 시스템 폴백.
 *  - 'pixel' → NeoDunggeunmo (이미 로드)
 *  - 'hand'  → 시스템 (한글 디바이스 기본 글꼴) — 추후 Gaegu 추가 가능
 *  - 'serif' → system serif fallback
 *  - 'sans'  → system sans fallback
 *
 * @see Downloads/walktoo/diary.jsx 원본 디자인
 */

import { Platform } from 'react-native';

import type {
  DiaryFrameId,
  DiaryStickerId,
  DiaryTapeId,
} from '@/components/feature/diary/scrapbook/assetRegistry';

// ─── Tape Pattern (legacy SVG) ──────────────────────────

export type TapePattern = 'solid' | 'stripe' | 'check' | 'dot' | 'grid';

export interface TapeSpec {
  pattern: TapePattern;
  color: string;
  patternColor?: string;
}

// ─── Sticker / Doodle (legacy SVG) ──────────────────────

export type StickerKind =
  | 'heart'
  | 'star'
  | 'flower'
  | 'sparkle'
  | 'cloud'
  | 'note'
  | 'checkmark';

// ─── Photo Layout ───────────────────────────────────────

export type DiaryLayoutKind =
  | 'collage' // y2k_pastel — 4 photos scattered with mixed sizes
  | 'filmstrip' // vintage_film — vertical filmstrip with sprockets
  | 'grid' // grid_minimal / pixel_retro — 2x2 uniform
  | 'journal' // dreamy_cloud — 1 hero + 2 small + 1 wide + handwritten note
  | 'scrapbook'; // dark_academia — 2x2 + center ticket strip

// ─── Title Mode ─────────────────────────────────────────

export type TitleMode =
  | 'ransom' // Y2K — 알록달록 컷아웃 글자
  | 'serif' // vintage — 드라마틱 세리프 이탤릭
  | 'pixel' // pixel retro — 도트 픽셀
  | 'clean' // grid minimal — 깔끔한 산세
  | 'italic' // dreamy cloud — 이탤릭 세리프
  | 'dark'; // dark academia — 대문자 세리프

// ─── Font Family Resolution ─────────────────────────────

const SYSTEM_SERIF = Platform.select({
  ios: 'Times New Roman',
  android: 'serif',
  default: 'serif',
});
const SYSTEM_MONO = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});
const SYSTEM_SANS = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'sans-serif',
});

// ─── Theme ──────────────────────────────────────────────

export interface DiaryTheme {
  id: DiaryThemeId;
  name: string;
  emoji: string;
  desc: string;

  /** 페이지 배경 */
  bg: string;
  /** 카드/페이퍼 배경 */
  paper: string;
  /** 라인 / 보더 */
  line: string;
  /** 메인 글자 */
  ink: string;
  /** 보조 글자 */
  inkSoft: string;
  /** 강조 (액션, 헤더, 시그니처) */
  accent: string;
  accentDeep: string;
  /** 보조 5색 — 카드 배경, 스티커 fill 등에 회전 사용 */
  tints: readonly [string, string, string, string, string];

  /** 타이틀 폰트 — display용 */
  titleFont: string;
  titleWeight: '400' | '500' | '600' | '700' | '800' | '900';
  /** 본문 폰트 */
  bodyFont: string;
  bodyWeight: '400' | '500' | '600' | '700';
  /** 손글씨 폰트 — 캡션·답변 */
  handFont: string;
  handWeight: '400' | '500' | '600' | '700';
  /** 모노 폰트 — 날짜, 라벨 */
  monoFont: string;

  /** 페이지 배경 격자 정도 */
  gridOpacity: number;

  /** 와시테이프 셋 — SVG fallback */
  tapes: readonly TapeSpec[];
  /** 사용 가능한 스티커 종류 — SVG fallback */
  stickers: readonly StickerKind[];

  /** PNG 와시테이프 ID 셋 — 우선 사용 */
  imgTapes: readonly DiaryTapeId[];
  /** PNG 스티커 ID 셋 — 우선 사용 */
  imgStickers: readonly DiaryStickerId[];
  /** PNG 폴라로이드 프레임 ID 셋 (옵션) */
  imgFrames: readonly DiaryFrameId[];

  /** 사진 레이아웃 종류 */
  layout: DiaryLayoutKind;
  /** 타이틀 모드 */
  titleMode: TitleMode;

  /** 다크 테마 여부 — 일부 컴포넌트에서 텍스트 색 반전 */
  isDark: boolean;
}

export type DiaryThemeId =
  | 'y2k_pastel'
  | 'vintage_film'
  | 'pixel_retro'
  | 'grid_minimal'
  | 'dreamy_cloud'
  | 'dark_academia';

// ─── 6 Themes ───────────────────────────────────────────

const PIXEL_FONT = 'NeoDunggeunmo';

export const DIARY_THEMES: Record<DiaryThemeId, DiaryTheme> = {
  y2k_pastel: {
    id: 'y2k_pastel',
    name: 'Y2K 파스텔',
    emoji: '♡',
    desc: '다꾸 감성 · 알록달록',
    bg: '#F5F0EB',
    paper: '#FBF7F2',
    line: '#E3D8CE',
    ink: '#2E2622',
    inkSoft: '#6B5E57',
    accent: '#E8706A',
    accentDeep: '#C9514B',
    tints: ['#FBD4CF', '#FFE9B0', '#C9E4D2', '#E7D7F2', '#CFE3F0'],
    titleFont: SYSTEM_SANS,
    titleWeight: '800',
    bodyFont: SYSTEM_SANS,
    bodyWeight: '400',
    handFont: SYSTEM_SANS,
    handWeight: '400',
    monoFont: SYSTEM_MONO,
    gridOpacity: 0.18,
    tapes: [
      { pattern: 'stripe', color: '#FFE9B0' },
      { pattern: 'check', color: '#CFE3F0' },
      { pattern: 'dot', color: '#FBD4CF' },
    ],
    stickers: ['heart', 'star', 'flower', 'sparkle'],
    imgTapes: [
      'coral-solid',
      'gingham-pink',
      'sakura-pink',
      'happyday',
      'blob-cream',
      'dot-cream',
    ],
    imgStickers: [
      'hearts-pink-row',
      'button-flower',
      'bow-yellow',
      'macarons',
      'bunny-plush',
      'bear-face',
      'cake-slice',
      'text-blessed',
      'rose-single',
      'banana-milk',
      'bubble-tea',
      'hearts-pink-pair',
      'heart-pink',
      'star-yellow',
      'mouse-face',
      'heart-pink-soft',
    ],
    imgFrames: ['polaroid-vintage', 'polaroid-clear', 'ornate-bronze'],
    layout: 'collage',
    titleMode: 'ransom',
    isDark: false,
  },

  vintage_film: {
    id: 'vintage_film',
    name: '빈티지 필름',
    emoji: '◉',
    desc: '세피아 · 오래된 카메라',
    bg: '#EBE1D0',
    paper: '#F4EAD5',
    line: '#C9B89A',
    ink: '#3A2E22',
    inkSoft: '#7A6550',
    accent: '#B0532A',
    accentDeep: '#7E3815',
    tints: ['#D9B48A', '#C9B89A', '#E0C9A6', '#BFA07A', '#A88968'],
    titleFont: SYSTEM_SERIF,
    titleWeight: '600',
    bodyFont: SYSTEM_MONO,
    bodyWeight: '400',
    handFont: SYSTEM_SERIF,
    handWeight: '400',
    monoFont: SYSTEM_MONO,
    gridOpacity: 0,
    tapes: [
      { pattern: 'solid', color: '#D9B48A' },
      { pattern: 'stripe', color: '#BFA07A', patternColor: 'rgba(58,46,34,0.35)' },
    ],
    stickers: ['star', 'sparkle'],
    imgTapes: ['mustard-solid', 'stars-brown', 'teal-solid', 'journal'],
    imgStickers: [
      'camera-vintage',
      'camera-vintage-2',
      'compass',
      'coffee-cup-saucer',
      'croissant',
      'milk-croissant',
      'label-cafe',
      'flowers-vase',
      'rose-single',
      'clipboard',
      'cd-music',
      'tag-ticket',
      'pancakes',
      'backpack',
      'star-yellow',
      'stars-doodle',
    ],
    imgFrames: [
      'polaroid-vintage',
      'gold-baroque',
      'wood-dark',
      'ornate-silver',
      'ornate-bronze',
    ],
    layout: 'filmstrip',
    titleMode: 'serif',
    isDark: false,
  },

  pixel_retro: {
    id: 'pixel_retro',
    name: '픽셀 레트로',
    emoji: '▦',
    desc: '8비트 · 도트 게임',
    bg: '#F3DCCB',
    paper: '#FFFDF6',
    line: '#2E2622',
    ink: '#2E2622',
    inkSoft: '#5A4E46',
    accent: '#E8706A',
    accentDeep: '#A03B37',
    tints: ['#FBD4CF', '#FFE9B0', '#C9E4D2', '#CFE3F0', '#E7D7F2'],
    titleFont: PIXEL_FONT,
    titleWeight: '400',
    bodyFont: PIXEL_FONT,
    bodyWeight: '400',
    handFont: PIXEL_FONT,
    handWeight: '400',
    monoFont: PIXEL_FONT,
    gridOpacity: 0.42,
    tapes: [
      { pattern: 'check', color: '#FFE9B0' },
      { pattern: 'stripe', color: '#E8706A' },
    ],
    stickers: ['heart', 'star', 'note'],
    imgTapes: ['gingham-pink', 'dot-cream', 'stars-brown'],
    imgStickers: [
      'heart-pink',
      'star-yellow',
      'star-yellow-2',
      'pin-blue',
      'pin-rust',
      'hearts-doodle',
      'coral-red',
      'arrow-teal-r',
    ],
    imgFrames: ['polaroid-clear', 'write'],
    layout: 'grid',
    titleMode: 'pixel',
    isDark: false,
  },

  grid_minimal: {
    id: 'grid_minimal',
    name: '그리드 미니멀',
    emoji: '□',
    desc: '깔끔한 · 필기노트',
    bg: '#F7F6F2',
    paper: '#FFFFFF',
    line: '#D9D5CC',
    ink: '#1F1F1F',
    inkSoft: '#6E6E6E',
    accent: '#2E2622',
    accentDeep: '#000000',
    tints: ['#F0EDE6', '#E8E4DC', '#E0DAC9', '#EFECE5', '#F4F1EA'],
    titleFont: SYSTEM_SANS,
    titleWeight: '700',
    bodyFont: SYSTEM_SANS,
    bodyWeight: '400',
    handFont: SYSTEM_SANS,
    handWeight: '400',
    monoFont: SYSTEM_MONO,
    gridOpacity: 0.4,
    tapes: [{ pattern: 'solid', color: '#E8E4DC' }],
    stickers: ['checkmark'],
    imgTapes: ['teal-solid'],
    imgStickers: [
      'tag-blank',
      'tag-ticket',
      'clipboard',
      'arrow-teal-r',
      'arrow-teal-l',
      'arrow-curve',
      'pin-blue',
    ],
    imgFrames: ['polaroid-clear'],
    layout: 'grid',
    titleMode: 'clean',
    isDark: false,
  },

  dreamy_cloud: {
    id: 'dreamy_cloud',
    name: '드리미 클라우드',
    emoji: '☁',
    desc: '푸른 하늘 · 꿈꾸는',
    // 디자인의 옅은 그라데이션을 위해 base는 거의 흰색 — ThemeBg가 부드러운 색감만 얹음
    bg: '#F4F7FB',
    paper: '#FFFFFF',
    line: '#D6E2EF',
    ink: '#2A3548',
    inkSoft: '#677A95',
    accent: '#7FA8D4',
    accentDeep: '#4A77AB',
    tints: ['#CFE3F0', '#D7E8F5', '#E7D7F2', '#FBD4CF', '#FFE9B0'],
    titleFont: SYSTEM_SERIF,
    titleWeight: '500',
    bodyFont: SYSTEM_SERIF,
    bodyWeight: '500',
    handFont: SYSTEM_SERIF,
    handWeight: '400',
    monoFont: SYSTEM_MONO,
    gridOpacity: 0.12,
    tapes: [
      { pattern: 'dot', color: '#CFE3F0' },
      { pattern: 'grid', color: '#E7D7F2' },
    ],
    stickers: ['cloud', 'sparkle', 'star'],
    imgTapes: ['dot-cream', 'wave-blue', 'sakura-pink', 'doodle-blue'],
    imgStickers: [
      'cloud-bubble',
      'hot-air-balloon',
      'star-yellow',
      'star-yellow-2',
      'heart-pink-soft',
      'hearts-pink-pair',
      'rose-single',
      'button-flower',
      'stars-doodle',
      'sleep-face',
    ],
    imgFrames: ['deckle', 'floral', 'mosaic'],
    layout: 'journal',
    titleMode: 'italic',
    isDark: false,
  },

  dark_academia: {
    id: 'dark_academia',
    name: '다크 아카데미아',
    emoji: '✦',
    desc: '고서 · 잉크 · 편지',
    bg: '#20201C',
    paper: '#EFE6D2',
    line: '#8A7A5A',
    ink: '#1A1612',
    inkSoft: '#4A4238',
    accent: '#8A2B1F',
    accentDeep: '#5A1810',
    tints: ['#E4D8BC', '#D6C49E', '#C2B089', '#B09770', '#8A7A5A'],
    titleFont: SYSTEM_SERIF,
    titleWeight: '600',
    bodyFont: SYSTEM_SERIF,
    bodyWeight: '500',
    handFont: SYSTEM_SERIF,
    handWeight: '400',
    monoFont: SYSTEM_MONO,
    gridOpacity: 0,
    tapes: [
      { pattern: 'solid', color: '#8A7A5A' },
      { pattern: 'stripe', color: '#B09770', patternColor: 'rgba(26,22,18,0.4)' },
    ],
    stickers: ['star', 'sparkle'],
    imgTapes: ['mustard-solid', 'stars-brown', 'journal'],
    imgStickers: [
      'star-yellow',
      'compass',
      'rose-single',
      'flowers-vase',
      'coffee-cup-saucer',
      'croissant',
      'cd-music',
      'clipboard',
      'label-cafe',
      'tag-ticket',
      'text-grateful',
      'text-signature',
      'text-blessed',
    ],
    imgFrames: [
      'ornate-bronze',
      'gold-baroque',
      'ornate-silver',
      'ornate-2',
      'wood-dark',
    ],
    layout: 'scrapbook',
    titleMode: 'dark',
    isDark: true,
  },
};

export const DIARY_THEME_LIST: readonly DiaryTheme[] = Object.values(DIARY_THEMES);

export const DEFAULT_DIARY_THEME_ID: DiaryThemeId = 'y2k_pastel';

export function getDiaryTheme(id: DiaryThemeId | undefined): DiaryTheme {
  return DIARY_THEMES[id ?? DEFAULT_DIARY_THEME_ID] ?? DIARY_THEMES[DEFAULT_DIARY_THEME_ID];
}
