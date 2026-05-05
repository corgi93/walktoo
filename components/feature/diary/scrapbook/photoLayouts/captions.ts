import type { DiaryThemeId } from '@/styles/diaryThemes';

/**
 * 테마별 placeholder 캡션 — 사용자가 캡션을 안 적었을 때 보여주는 무드 라벨.
 * 디자인의 CAPTIONS 포팅.
 */
export const PLACEHOLDER_CAPTIONS: Record<
  DiaryThemeId,
  readonly [string, string, string, string]
> = {
  y2k_pastel: ['오늘도 너랑 ♡', 'blessed!', 'coffee ☕', 'lucky day'],
  vintage_film: ['together.', 'a quiet day', 'café · 04', 'old town'],
  pixel_retro: ['LOVE U', 'OK!', 'COFFEE', 'GOOD DAY'],
  grid_minimal: ['04.21', 'note 02', 'café', 'walk · 04'],
  dreamy_cloud: ['우리의 하루', 'soft day', 'dreaming…', 'sunny'],
  dark_academia: ['mon amour', 'a study day', 'le café', 'rue 04'],
};
