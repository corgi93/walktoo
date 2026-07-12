// ─── Photo Booth Filter Definitions ───────────────────

export interface FilterConfig {
  id: string;
  name: string;
  /** 반투명 오버레이 색상 (null = 오버레이 없음) */
  overlayColor: string | null;
  /** 흑백 등 이미지 처리가 필요한 필터인지 */
  requiresProcessing: boolean;
}

export const FILTERS: FilterConfig[] = [
  {
    id: 'original',
    name: '원본',
    overlayColor: null,
    requiresProcessing: false,
  },
  {
    id: 'vintage',
    name: '빈티지',
    overlayColor: 'rgba(255, 235, 205, 0.3)',
    requiresProcessing: false,
  },
  {
    id: 'bw',
    name: '흑백',
    overlayColor: null,
    requiresProcessing: true,
  },
  {
    id: 'warm',
    name: '따뜻한',
    overlayColor: 'rgba(255, 183, 130, 0.18)',
    requiresProcessing: false,
  },
  {
    id: 'cool',
    name: '시원한',
    overlayColor: 'rgba(130, 180, 255, 0.18)',
    requiresProcessing: false,
  },
  {
    id: 'rose',
    name: '로제',
    overlayColor: 'rgba(232, 112, 106, 0.15)',
    requiresProcessing: false,
  },
];

export const getFilter = (id: string): FilterConfig =>
  FILTERS.find((f) => f.id === id) ?? FILTERS[0];

// ─── Frame Background Colors ──────────────────────────

export interface FrameColor {
  id: string;
  name: string;
  color: string;
  /** 밝은 배경이면 true (텍스트 색상 결정용) */
  isLight: boolean;
}

export const FRAME_COLORS: FrameColor[] = [
  { id: 'white', name: '화이트', color: '#FFFFFF', isLight: true },
  { id: 'cream', name: '크림', color: '#FAF6F2', isLight: true },
  { id: 'rose', name: '로제', color: '#FFF5F4', isLight: true },
  { id: 'black', name: '블랙', color: '#2C2C2E', isLight: false },
];

export const getFrameColor = (id: string): FrameColor =>
  FRAME_COLORS.find((c) => c.id === id) ?? FRAME_COLORS[0];
