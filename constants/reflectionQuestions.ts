/**
 * 월간 회고 질문 — "이달의 우리"
 *
 * 톤: 귀엽고 감성적 / 부담 없는 한 단어 답변도 OK
 * 매달 3개씩 결정적으로 선택
 *
 * 본문은 i18n(`reflection.questions.{id}.{question|placeholder}`)에서 가져온다.
 * 여기엔 메타(id, emoji)만 둔다 — id는 DB(monthly_reflections.question_ids)에
 * 박혀있으므로 절대 변경 금지.
 */

import i18n from '@/lib/i18n';

export interface ReflectionQuestion {
  id: number;
  emoji: string;
  question: string;
  placeholder?: string;
}

interface ReflectionQuestionMeta {
  id: number;
  emoji: string;
}

const REFLECTION_QUESTION_META: ReflectionQuestionMeta[] = [
  { id: 1, emoji: '💝' },
  { id: 2, emoji: '🫶' },
  { id: 3, emoji: '😄' },
  { id: 4, emoji: '🎵' },
  { id: 5, emoji: '🎬' },
  { id: 6, emoji: '📸' },
  { id: 7, emoji: '🚶' },
  { id: 8, emoji: '🏡' },
  { id: 9, emoji: '☕' },
  { id: 10, emoji: '💕' },
  { id: 11, emoji: '🌙' },
  { id: 12, emoji: '✨' },
  { id: 13, emoji: '🌸' },
  { id: 14, emoji: '🌱' },
  { id: 15, emoji: '🍀' },
  { id: 16, emoji: '🥺' },
  { id: 17, emoji: '💌' },
  { id: 18, emoji: '🎯' },
  { id: 19, emoji: '🌈' },
  { id: 20, emoji: '🎁' },
];

const buildQuestion = (meta: ReflectionQuestionMeta): ReflectionQuestion => ({
  id: meta.id,
  emoji: meta.emoji,
  // getter로 만들면 언어 변경 시 자동 반영
  get question() {
    return i18n.t(`reflection:questions.${meta.id}.question`);
  },
  get placeholder() {
    return i18n.t(`reflection:questions.${meta.id}.placeholder`);
  },
});

export const REFLECTION_QUESTIONS: ReflectionQuestion[] =
  REFLECTION_QUESTION_META.map(buildQuestion);

/**
 * 해당 년/월에 배정된 질문 3개를 결정론적으로 선택.
 * 같은 커플/월이면 항상 같은 3개를 반환한다.
 *
 * - 시드: hashCode(coupleId) ⊕ (year, month)
 * - PRNG: mulberry32 (32비트 결정적, 분포 균일)
 * - 셔플: Fisher-Yates 부분 셔플 (중복 없음 보장)
 */
export function pickReflectionQuestions(
  coupleId: string,
  year: number,
  month: number,
): ReflectionQuestion[] {
  const seed = (hashCode(coupleId) ^ (year * 12 + month)) >>> 0;
  const rng = mulberry32(seed);
  const pool = [...REFLECTION_QUESTION_META];

  // Fisher-Yates 부분 셔플: 앞 3개만 결정
  const pickCount = Math.min(3, pool.length);
  for (let i = 0; i < pickCount; i++) {
    const j = i + Math.floor(rng() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, pickCount).map(buildQuestion);
}

export function getQuestionById(id: number): ReflectionQuestion | undefined {
  const meta = REFLECTION_QUESTION_META.find((m) => m.id === id);
  return meta ? buildQuestion(meta) : undefined;
}

// ─── PRNG ───────────────────────────────────────────────

/**
 * mulberry32 — 32비트 결정적 PRNG.
 * 시드만 같으면 항상 같은 시퀀스를 반환한다. 분포가 균일.
 */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
