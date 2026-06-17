/**
 * walkToo 다꾸 (diary-deco) 테마 토큰
 *
 * 6종 테마 — 해외 여행지의 무드(골목, 필름, 야시장, 야경)를
 * 다이어리용 컬러 팔레트, 와시테이프, 스티커 셋으로 재해석.
 * 전체적으로 빈티지 + Y2K 레트로 코트 — 바랜 크림 페이퍼 위에
 * 살짝 채도 낮춘 레트로 팝 톤. 무드별 구분은 유지.
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
  DiaryTextureId,
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

  /** 페이지 배경 종이 텍스처 ID — bg 위에 repeat tile로 깔림. 파일 없으면 무시됨 */
  bgTexture?: DiaryTextureId;
  /** 텍스처 opacity — 0~1. 기본 0.4. 다크 테마는 더 낮게, 종이 강조는 더 높게 */
  bgTextureOpacity?: number;

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
    name: '후쿠오카 골목',
    emoji: '♡',
    desc: '좁은 골목과 첫 대화',
    bg: '#F0E4D6',
    paper: '#FAF4EB',
    line: '#DAC7B6',
    ink: '#2E2622',
    inkSoft: '#6B5E57',
    accent: '#D26A57',
    accentDeep: '#A0463C',
    tints: ['#EFC2B2', '#F1D7A4', '#C7DCC9', '#D6D2E0', '#CFE0E6'],
    titleFont: PIXEL_FONT,
    titleWeight: '400',
    bodyFont: PIXEL_FONT,
    bodyWeight: '400',
    handFont: PIXEL_FONT,
    handWeight: '400',
    monoFont: PIXEL_FONT,
    gridOpacity: 0.14,
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
      'camera-vintage',
      'label-cafe',
      'coffee-cup-saucer',
      'tag-ticket',
      'compass',
      'bubble-tea',
      'macarons',
      'rose-single',
      'hearts-pink-row',
      'hearts-pink-pair',
      'button-flower',
      'bow-yellow',
      'cake-slice',
      'text-blessed',
      'banana-milk',
      'bunny-plush',
      'bear-face',
      'star-yellow',
      'mouse-face',
    ],
    imgFrames: ['polaroid-vintage', 'polaroid-clear', 'ornate-bronze'],
    bgTexture: 'y2k-paper',
    bgTextureOpacity: 0.28,
    layout: 'collage',
    titleMode: 'ransom',
    isDark: false,
  },

  vintage_film: {
    id: 'vintage_film',
    name: '삿포로 필름',
    emoji: '◉',
    desc: '차가운 공기와 오래 남는 시선',
    bg: '#E9E0D0',
    paper: '#F7EDD9',
    line: '#C6B59C',
    ink: '#3A2E22',
    inkSoft: '#7A6550',
    accent: '#98674A',
    accentDeep: '#623E29',
    tints: ['#D6C0A2', '#C3CFCF', '#EADCC0', '#B69E84', '#A2825F'],
    titleFont: PIXEL_FONT,
    titleWeight: '400',
    bodyFont: PIXEL_FONT,
    bodyWeight: '400',
    handFont: PIXEL_FONT,
    handWeight: '400',
    monoFont: PIXEL_FONT,
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
      'tag-ticket',
      'coffee-cup-saucer',
      'label-cafe',
      'croissant',
      'milk-croissant',
      'flowers-vase',
      'rose-single',
      'clipboard',
      'cd-music',
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
    bgTexture: 'minimal-paper',
    bgTextureOpacity: 0.22,
    layout: 'filmstrip',
    titleMode: 'serif',
    isDark: false,
  },

  pixel_retro: {
    id: 'pixel_retro',
    name: '방콕 야시장',
    emoji: '▦',
    desc: '네온, 더위, 예상 밖의 웃음',
    bg: '#F0D6C2',
    paper: '#FFFBEF',
    line: '#2E2622',
    ink: '#2E2622',
    inkSoft: '#5A4E46',
    accent: '#E0694D',
    accentDeep: '#98392B',
    tints: ['#F4B19E', '#FCD27E', '#93D2BE', '#AAD0EE', '#D2B8E8'],
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
      'pin-rust',
      'arrow-teal-r',
      'tag-ticket',
      'backpack',
      'bubble-tea',
      'coral-red',
      'star-yellow',
      'star-yellow-2',
      'pin-blue',
      'heart-pink',
      'hearts-doodle',
      'arrow-teal-l',
    ],
    imgFrames: ['polaroid-clear', 'write'],
    bgTexture: 'pixel-paper',
    bgTextureOpacity: 0.25,
    layout: 'grid',
    titleMode: 'pixel',
    isDark: false,
  },

  grid_minimal: {
    id: 'grid_minimal',
    name: '타이완 노트',
    emoji: '□',
    desc: '취향을 천천히 적는 여행',
    bg: '#F2EEE2',
    paper: '#FCF8EF',
    line: '#D5CFC2',
    ink: '#2A241E',
    inkSoft: '#6E665C',
    accent: '#4E7A6F',
    accentDeep: '#2C544C',
    tints: ['#EDE8DC', '#D8E6DE', '#EDD4C9', '#EBE6D8', '#D3DFE4'],
    titleFont: PIXEL_FONT,
    titleWeight: '400',
    bodyFont: PIXEL_FONT,
    bodyWeight: '400',
    handFont: PIXEL_FONT,
    handWeight: '400',
    monoFont: PIXEL_FONT,
    gridOpacity: 0.4,
    tapes: [{ pattern: 'solid', color: '#E8E4DC' }],
    stickers: ['checkmark'],
    imgTapes: ['teal-solid', 'journal', 'dot-cream'],
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
    bgTexture: 'minimal-paper',
    bgTextureOpacity: 0.3,
    layout: 'grid',
    titleMode: 'clean',
    isDark: false,
  },

  dreamy_cloud: {
    id: 'dreamy_cloud',
    name: '홍콩 야경',
    emoji: '☁',
    desc: '트램과 항구 빛 사이',
    // 디자인의 옅은 그라데이션을 위해 base는 거의 흰색 — ThemeBg가 부드러운 색감만 얹음
    bg: '#EEF2F2',
    paper: '#FBF8F1',
    line: '#CFDDE2',
    ink: '#2A3548',
    inkSoft: '#677A95',
    accent: '#6B92BC',
    accentDeep: '#3D6790',
    tints: ['#C9DCE6', '#D0E0EA', '#DCD0E2', '#EAC6C0', '#EEE0A8'],
    titleFont: PIXEL_FONT,
    titleWeight: '400',
    bodyFont: PIXEL_FONT,
    bodyWeight: '400',
    handFont: PIXEL_FONT,
    handWeight: '400',
    monoFont: PIXEL_FONT,
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
      'camera-vintage-2',
      'compass',
      'tag-ticket',
      'stars-doodle',
      'star-yellow',
      'star-yellow-2',
      'rose-single',
      'heart-pink-soft',
      'hearts-pink-pair',
      'button-flower',
      'sleep-face',
    ],
    imgFrames: ['deckle', 'floral', 'mosaic'],
    bgTexture: 'dreamy-paper',
    bgTextureOpacity: 0.5,
    layout: 'journal',
    titleMode: 'italic',
    isDark: false,
  },

  dark_academia: {
    id: 'dark_academia',
    name: '마지막 공항',
    emoji: '✦',
    desc: '야간 비행 전, 마지막 페이지',
    bg: '#211C18',
    paper: '#EEE1C8',
    line: '#897856',
    ink: '#1A1612',
    inkSoft: '#4A4238',
    accent: '#97362E',
    accentDeep: '#571C18',
    tints: ['#E2D2B6', '#D5C097', '#C0AD84', '#B28774', '#897654'],
    titleFont: PIXEL_FONT,
    titleWeight: '400',
    bodyFont: PIXEL_FONT,
    bodyWeight: '400',
    handFont: PIXEL_FONT,
    handWeight: '400',
    monoFont: PIXEL_FONT,
    gridOpacity: 0,
    tapes: [
      { pattern: 'solid', color: '#8A7A5A' },
      { pattern: 'stripe', color: '#B09770', patternColor: 'rgba(26,22,18,0.4)' },
    ],
    stickers: ['star', 'sparkle'],
    imgTapes: ['mustard-solid', 'stars-brown', 'journal'],
    imgStickers: [
      'tag-ticket',
      'compass',
      'clipboard',
      'camera-vintage',
      'text-signature',
      'rose-single',
      'flowers-vase',
      'coffee-cup-saucer',
      'croissant',
      'cd-music',
      'label-cafe',
      'text-grateful',
      'text-blessed',
      'star-yellow',
      'heart-pink',
    ],
    imgFrames: [
      'ornate-bronze',
      'gold-baroque',
      'ornate-silver',
      'ornate-2',
      'wood-dark',
    ],
    bgTexture: 'academia-wood',
    bgTextureOpacity: 0.35,
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
