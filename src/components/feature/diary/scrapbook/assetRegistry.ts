/**
 * 다꾸 PNG 에셋 정적 레지스트리.
 *
 * RN/Metro는 동적 require를 못 처리해서, 모든 require를 빌드타임에 inline해야 함.
 * 테마 토큰에서는 문자열 ID로 참조하고 (`'tape-coral-solid'`), 컴포넌트가 이 맵에서 조회.
 *
 * 새 에셋 추가:
 *  1. src/assets/diary/{tapes|stickers|frames|textures}/<name>.<ext> 에 파일 추가
 *  2. 아래 맵에 ID → require 한 줄 추가
 *  3. diaryThemes.ts 에서 해당 ID 사용
 */

import type { ImageSourcePropType } from 'react-native';

// ─── Tapes ──────────────────────────────────────────────

export const DIARY_TAPES = {
  'coral-solid': require('@/assets/diary/tapes/tape-coral-solid.png'),
  'gingham-pink': require('@/assets/diary/tapes/tape-gingham-pink.png'),
  'sakura-pink': require('@/assets/diary/tapes/tape-sakura-pink.png'),
  'happyday': require('@/assets/diary/tapes/tape-happyday.png'),
  'blob-cream': require('@/assets/diary/tapes/tape-blob-cream.png'),
  'dot-cream': require('@/assets/diary/tapes/tape-dot-cream.png'),
  'mustard-solid': require('@/assets/diary/tapes/tape-mustard-solid.png'),
  'stars-brown': require('@/assets/diary/tapes/tape-stars-brown.png'),
  'teal-solid': require('@/assets/diary/tapes/tape-teal-solid.png'),
  'journal': require('@/assets/diary/tapes/tape-journal.png'),
  'wave-blue': require('@/assets/diary/tapes/tape-wave-blue.png'),
  'doodle-blue': require('@/assets/diary/tapes/tape-doodle-blue.png'),
} as const;

export type DiaryTapeId = keyof typeof DIARY_TAPES;

// ─── Stickers ───────────────────────────────────────────

export const DIARY_STICKERS = {
  // Y2K cute
  'hearts-pink-row': require('@/assets/diary/stickers/hearts-pink-row.png'),
  'button-flower': require('@/assets/diary/stickers/button-flower.png'),
  'bow-yellow': require('@/assets/diary/stickers/bow-yellow.png'),
  'macarons': require('@/assets/diary/stickers/macarons.png'),
  'bunny-plush': require('@/assets/diary/stickers/bunny-plush.png'),
  'bear-face': require('@/assets/diary/stickers/bear-face.png'),
  'cake-slice': require('@/assets/diary/stickers/cake-slice.png'),
  'rose-single': require('@/assets/diary/stickers/rose-single.png'),
  'banana-milk': require('@/assets/diary/stickers/banana-milk.png'),
  'bubble-tea': require('@/assets/diary/stickers/bubble-tea.png'),
  'mouse-face': require('@/assets/diary/stickers/mouse-face.png'),

  // Hearts/stars (cross-theme)
  'heart-pink': require('@/assets/diary/stickers/heart-pink.png'),
  'heart-pink-soft': require('@/assets/diary/stickers/heart-pink-soft.png'),
  'hearts-pink-pair': require('@/assets/diary/stickers/hearts-pink-pair.png'),
  'hearts-doodle': require('@/assets/diary/stickers/hearts-doodle.png'),
  'star-yellow': require('@/assets/diary/stickers/star-yellow.png'),
  'star-yellow-2': require('@/assets/diary/stickers/star-yellow-2.png'),
  'stars-doodle': require('@/assets/diary/stickers/stars-doodle.png'),
  'coral-red': require('@/assets/diary/stickers/coral-red.png'),

  // Vintage / academia
  'camera-vintage': require('@/assets/diary/stickers/camera-vintage.png'),
  'camera-vintage-2': require('@/assets/diary/stickers/camera-vintage-2.png'),
  'compass': require('@/assets/diary/stickers/compass.png'),
  'coffee-cup-saucer': require('@/assets/diary/stickers/coffee-cup-saucer.png'),
  'croissant': require('@/assets/diary/stickers/croissant.png'),
  'milk-croissant': require('@/assets/diary/stickers/milk-croissant.png'),
  'label-cafe': require('@/assets/diary/stickers/label-cafe.png'),
  'flowers-vase': require('@/assets/diary/stickers/flowers-vase.png'),
  'clipboard': require('@/assets/diary/stickers/clipboard.png'),
  'cd-music': require('@/assets/diary/stickers/cd-music.png'),
  'tag-ticket': require('@/assets/diary/stickers/tag-ticket.png'),
  'tag-blank': require('@/assets/diary/stickers/tag-blank.png'),
  'pancakes': require('@/assets/diary/stickers/pancakes.png'),
  'backpack': require('@/assets/diary/stickers/backpack.png'),

  // Pixel / minimal
  'pin-blue': require('@/assets/diary/stickers/pin-blue.png'),
  'pin-rust': require('@/assets/diary/stickers/pin-rust.png'),
  'arrow-teal-r': require('@/assets/diary/stickers/arrow-teal-r.png'),
  'arrow-teal-l': require('@/assets/diary/stickers/arrow-teal-l.png'),
  'arrow-curve': require('@/assets/diary/stickers/arrow-curve.png'),

  // Dreamy
  'cloud-bubble': require('@/assets/diary/stickers/cloud-bubble.png'),
  'hot-air-balloon': require('@/assets/diary/stickers/hot-air-balloon.png'),
  'sleep-face': require('@/assets/diary/stickers/sleep-face.png'),

  // Text labels
  'text-blessed': require('@/assets/diary/stickers/text-blessed.png'),
  'text-grateful': require('@/assets/diary/stickers/text-grateful.png'),
  'text-signature': require('@/assets/diary/stickers/text-signature.png'),
} as const;

export type DiaryStickerId = keyof typeof DIARY_STICKERS;

// ─── Frames ─────────────────────────────────────────────

export const DIARY_FRAMES = {
  'deckle': require('@/assets/diary/frames/frame-deckle.png'),
  'floral': require('@/assets/diary/frames/frame-floral.png'),
  'mosaic': require('@/assets/diary/frames/frame-mosaic.png'),
  'gold-baroque': require('@/assets/diary/frames/frame-gold-baroque.png'),
  'ornate-bronze': require('@/assets/diary/frames/frame-ornate-bronze.png'),
  'ornate-silver': require('@/assets/diary/frames/frame-ornate-silver.png'),
  'ornate-2': require('@/assets/diary/frames/frame-ornate-2.png'),
  'wood-dark': require('@/assets/diary/frames/frame-wood-dark.png'),
  'polaroid-clear': require('@/assets/diary/frames/frame-polaroid-clear.png'),
  'polaroid-vintage': require('@/assets/diary/frames/frame-polaroid-vintage.png'),
  'write': require('@/assets/diary/frames/frame-write.png'),
} as const;

export type DiaryFrameId = keyof typeof DIARY_FRAMES;

// ─── Textures (배경 종이결) ─────────────────────────────
//
// 256~512px 시밍(tileable) WebP/PNG. ThemeBg가 resizeMode="repeat"로 깔아서
// 단색 bg 위에 종이/필름/양피지 느낌을 더함. 파일 없으면 textureSrc()가
// undefined를 반환하고 ThemeBg는 텍스처 레이어를 건너뜀 (graceful).
//
// 파일을 src/assets/diary/textures/ 에 떨군 뒤 아래 한 줄씩 주석 해제하면 켜짐.

export const DIARY_TEXTURES: Partial<Record<DiaryTextureId, ImageSourcePropType>> = {
  'y2k-paper': require('@/assets/diary/textures/y2k-paper.jpg'),
  'vintage-paper': require('@/assets/diary/textures/vintage-paper.jpg'),
  'pixel-paper': require('@/assets/diary/textures/pixel-paper.jpg'),
  'minimal-paper': require('@/assets/diary/textures/minimal-paper.jpg'),
  'dreamy-paper': require('@/assets/diary/textures/dreamy-paper.jpg'),
  'academia-wood': require('@/assets/diary/textures/academia-wood.jpg'),
};

export type DiaryTextureId =
  | 'y2k-paper'
  | 'vintage-paper'
  | 'pixel-paper'
  | 'minimal-paper'
  | 'dreamy-paper'
  | 'academia-wood';

// ─── Lookup helpers ─────────────────────────────────────

export function tapeSrc(id: DiaryTapeId): ImageSourcePropType {
  return DIARY_TAPES[id];
}

export function stickerSrc(id: DiaryStickerId): ImageSourcePropType {
  return DIARY_STICKERS[id];
}

export function frameSrc(id: DiaryFrameId): ImageSourcePropType {
  return DIARY_FRAMES[id];
}

export function textureSrc(id: DiaryTextureId): ImageSourcePropType | undefined {
  return DIARY_TEXTURES[id];
}
