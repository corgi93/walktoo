// ─── 오늘의 질문 시스템 ─────────────────────────────────
//
// 📝 다이어리 질문: 산책 기록 시 매일 바뀌는 주제 (15개)
// 💌 커플 질문: 카테고리별 속마음 질문 (60개, 6카테고리 × 10개)
//
// 질문 본문은 i18n(`question.diary.{id}`, `question.couple.{id}`)에서 가져온다.
// 여기엔 메타데이터(id, category, emoji)만 둔다 — id는 DB(footprint_entries.diaryQuestionId)에
// 박혀있으므로 절대 변경 금지.
// 같은 날짜 → 같은 질문 (커플이 같은 질문 보장)

import i18n from '@/lib/i18n';

// ─── Types ──────────────────────────────────────────────

export type QuestionCategory =
  | 'thrill'    // 💕 설렘
  | 'heart'     // 🌙 속마음
  | 'memory'    // 📸 추억
  | 'future'    // 🔮 미래
  | 'daily'     // ☀️ 일상
  | 'secret';   // 🔥 은밀한

export interface Question {
  id: number;
  category: QuestionCategory;
  emoji: string;
  /** 카테고리 표시명 (i18n에서 lookup) */
  categoryLabel: string;
  /** 질문 본문 (i18n에서 lookup) */
  content: string;
}

export interface DiaryQuestion {
  id: number;
  content: string;
}

// ─── 카테고리 메타 ──────────────────────────────────────

export const CATEGORY_EMOJI: Record<QuestionCategory, string> = {
  thrill: '💕',
  heart: '🌙',
  memory: '📸',
  future: '🔮',
  daily: '☀️',
  secret: '🔥',
};

const getCategoryLabel = (category: QuestionCategory): string =>
  i18n.t(`question:category.${category}`);

// ─── 📝 다이어리 질문 (15개, id ↔ DB) ──────────────────

const DIARY_QUESTION_IDS: number[] = Array.from({ length: 15 }, (_, i) => i);

export const DIARY_QUESTIONS: DiaryQuestion[] = DIARY_QUESTION_IDS.map((id) => ({
  id,
  // i18n key는 id 기준 (lazy: getter 대신 매번 새로 만들면 언어 변경 시 자동 반영)
  get content() {
    return i18n.t(`question:diary.${id}`);
  },
}));

// ─── 💌 커플 질문 (60개, id ↔ DB) ──────────────────────

interface CoupleQuestionMeta {
  id: number;
  category: QuestionCategory;
}

// id별 카테고리 매핑 (id 그룹 → category)
const COUPLE_QUESTION_META: CoupleQuestionMeta[] = [
  ...range(0, 10).map((id) => ({ id, category: 'thrill' as const })),
  ...range(10, 20).map((id) => ({ id, category: 'heart' as const })),
  ...range(20, 30).map((id) => ({ id, category: 'memory' as const })),
  ...range(30, 40).map((id) => ({ id, category: 'future' as const })),
  ...range(40, 50).map((id) => ({ id, category: 'daily' as const })),
  ...range(50, 60).map((id) => ({ id, category: 'secret' as const })),
];

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start }, (_, i) => start + i);
}

export const COUPLE_QUESTIONS: Question[] = COUPLE_QUESTION_META.map((meta) => ({
  id: meta.id,
  category: meta.category,
  emoji: CATEGORY_EMOJI[meta.category],
  get categoryLabel() {
    return getCategoryLabel(meta.category);
  },
  get content() {
    return i18n.t(`question:couple.${meta.id}`);
  },
}));

// ─── 날짜별 질문 선택 헬퍼 ──────────────────────────────

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  return Math.abs(Math.round((b - a) / (1000 * 60 * 60 * 24)));
}

/**
 * 커플의 시작일과 기록 날짜로 오늘의 질문 2개를 결정.
 * 같은 날짜 → 같은 질문 (커플 동일 보장)
 */
export function getDailyQuestions(
  coupleStartDate: string | undefined,
  date: string,
): { diaryQuestion: DiaryQuestion; coupleQuestion: Question } {
  const dDay = coupleStartDate ? daysBetween(coupleStartDate, date) : 0;

  return {
    diaryQuestion: DIARY_QUESTIONS[dDay % DIARY_QUESTIONS.length],
    coupleQuestion: COUPLE_QUESTIONS[dDay % COUPLE_QUESTIONS.length],
  };
}
