// ─── Couple Schedule ────────────────────────────────────
//
// 각자의 일정(학회, 회사 반차, 결혼식 등)을 달력에 표시해서 상대방이
// 미리 알 수 있게 하는 피처. 단일 날짜만 지원 (v1).

export type ScheduleCategory =
  | 'work'
  | 'social'
  | 'wedding'
  | 'health'
  | 'travel'
  | 'study'
  | 'anniversary'
  | 'other';

export interface CoupleSchedule {
  id: string;
  coupleId: string;
  ownerId: string;
  /** 'YYYY-MM-DD' */
  date: string;
  title: string;
  category: ScheduleCategory;
  /** 사용자가 따로 지정했거나, 카테고리 기본 이모지 */
  emoji: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSchedulePayload {
  date: string;
  title: string;
  category: ScheduleCategory;
  emoji?: string | null;
  note?: string | null;
}

export interface UpdateSchedulePayload {
  id: string;
  date?: string;
  title?: string;
  category?: ScheduleCategory;
  emoji?: string | null;
  note?: string | null;
}

/**
 * 카테고리 기본 이모지. 사용자가 따로 지정한 경우 그것을 사용.
 */
export const SCHEDULE_CATEGORY_EMOJI: Record<ScheduleCategory, string> = {
  work: '💼',
  social: '🍻',
  wedding: '💒',
  health: '🏥',
  travel: '✈️',
  study: '🎓',
  anniversary: '🎂',
  other: '📌',
};
