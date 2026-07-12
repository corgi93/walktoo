import type { DiaryThemeId } from '@/styles/diaryThemes';

/**
 * 테마별 placeholder 캡션 — 사용자가 캡션을 안 적었을 때 보여주는 무드 라벨.
 * 디자인의 CAPTIONS 포팅.
 */
export const PLACEHOLDER_CAPTIONS: Record<
  DiaryThemeId,
  readonly [string, string, string, string]
> = {
  y2k_pastel: ['골목 산책', 'first walk', '카페 창가', 'day 01'],
  vintage_film: ['sapporo', '눈 오는 길', 'film 01', '다시 올까'],
  pixel_retro: ['night market', '같이 걷기', 'D+2', 'unexpected'],
  grid_minimal: ['취향 노트', '오후 7시', '다음 장소', 'day 02'],
  dreamy_cloud: ['harbor light', '트램 소리', 'soft talk', 'city night'],
  dark_academia: ['record shop', 'side A', '파란 간판', '33 rpm'],
};
