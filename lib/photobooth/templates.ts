// ─── Photo Booth Template Definitions ─────────────────

export interface SlotLayout {
  /** 프레임 내 위치/크기 (0-1 비율) */
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TemplateConfig {
  id: string;
  name: string;
  slots: number;
  /** width / height */
  aspectRatio: number;
  layout: SlotLayout[];
  /** 프레임 외곽 패딩 비율 (0-1) */
  framePadding: number;
  /** 슬롯 간 간격 비율 (0-1) */
  slotGap: number;
  /** 하단 스탬프 영역 높이 비율 (0-1) */
  bottomStripRatio: number;
}

// ─── 공통 값 ──────────────────────────────────────────
const PAD = 0.04;
const GAP = 0.02;
const STRIP = 0.1;

export const TEMPLATES: TemplateConfig[] = [
  {
    id: 'single-frame',
    name: '1컷',
    slots: 1,
    aspectRatio: 3 / 4,
    framePadding: PAD,
    slotGap: GAP,
    bottomStripRatio: STRIP,
    layout: [{ x: 0, y: 0, width: 1, height: 1 }],
  },
  {
    id: 'two-cut-vertical',
    name: '2컷 세로',
    slots: 2,
    aspectRatio: 3 / 4.5,
    framePadding: PAD,
    slotGap: GAP,
    bottomStripRatio: STRIP,
    layout: [
      { x: 0, y: 0, width: 1, height: 0.49 },
      { x: 0, y: 0.51, width: 1, height: 0.49 },
    ],
  },
  {
    id: 'two-cut-horizontal',
    name: '2컷 가로',
    slots: 2,
    aspectRatio: 4 / 3,
    framePadding: PAD,
    slotGap: GAP,
    bottomStripRatio: STRIP,
    layout: [
      { x: 0, y: 0, width: 0.49, height: 1 },
      { x: 0.51, y: 0, width: 0.49, height: 1 },
    ],
  },
  {
    id: 'four-cut-strip',
    name: '4컷 스트립',
    slots: 4,
    aspectRatio: 1 / 3.2,
    framePadding: PAD,
    slotGap: GAP,
    bottomStripRatio: 0.08,
    layout: [
      { x: 0, y: 0, width: 1, height: 0.235 },
      { x: 0, y: 0.255, width: 1, height: 0.235 },
      { x: 0, y: 0.51, width: 1, height: 0.235 },
      { x: 0, y: 0.765, width: 1, height: 0.235 },
    ],
  },
  {
    id: 'four-cut-grid',
    name: '4컷 그리드',
    slots: 4,
    aspectRatio: 1,
    framePadding: PAD,
    slotGap: GAP,
    bottomStripRatio: STRIP,
    layout: [
      { x: 0, y: 0, width: 0.49, height: 0.49 },
      { x: 0.51, y: 0, width: 0.49, height: 0.49 },
      { x: 0, y: 0.51, width: 0.49, height: 0.49 },
      { x: 0.51, y: 0.51, width: 0.49, height: 0.49 },
    ],
  },
];

export const getTemplate = (id: string): TemplateConfig =>
  TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
