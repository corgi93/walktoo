/**
 * 월간 회고 질문 — "이달의 우리"
 *
 * 톤: 귀엽고 감성적 / 부담 없는 한 단어 답변도 OK
 * 매달 3개씩 결정적으로 선택
 *
 * ─── KPT(Keep / Problem / Try) → 커플 톤 치환 ──────────
 *
 * 원본 KPT는 회고를 통해 성장하기 위한 IT 팀 프레임워크다.
 * 이걸 커플 맥락에 부드럽게 옮기면:
 *
 *   Keep    → 좋았던 우리   (loved)  : 잘했고 유지하고 싶은 것 = 감사/축하의 톤
 *   Problem → 아쉬웠던 우리 (wished) : 부족했던 것 = 비난이 아닌 솔직한 마음
 *   Try     → 다음 달 우리  (will)   : 다음에 시도할 것 = 함께의 미래
 *
 * 매달 K + W + T 카테고리에서 각 1개씩 결정적으로 뽑아 총 3개 질문이 된다.
 *
 * ─── id 정책 ────────────────────────────────────────────
 *
 * 기존 1-20번 (legacy)은 DB(monthly_reflections.question_ids)에 박혀 있을 수
 * 있어 호환을 위해 메타에 남겨둔다. 새 KPT 세트는 100번대(101-121)로 추가.
 * pickReflectionQuestions는 새 KPT 세트(100+)에서만 뽑는다.
 *
 * 본문은 i18n(`reflection:questions.{id}.{question|placeholder}`)에서 가져온다.
 */

import i18n from '@/lib/i18n';

// ─── 타입 ────────────────────────────────────────────────

export type ReflectionCategory = 'keep' | 'wished' | 'will';

export interface ReflectionQuestion {
  id: number;
  emoji: string;
  category: ReflectionCategory;
  question: string;
  placeholder?: string;
  /** 말문을 여는 탭 가능한 시작 문장 조각들. 탭하면 textarea에 삽입됨. */
  prompts?: string[];
}

interface ReflectionQuestionMeta {
  id: number;
  emoji: string;
  category: ReflectionCategory;
}

// ─── Legacy 메타 (id 1-20, KPT 도입 이전 호환용) ────────

const LEGACY_META: ReflectionQuestionMeta[] = [
  { id: 1,  emoji: '💝', category: 'keep' },
  { id: 2,  emoji: '🫶', category: 'keep' },
  { id: 3,  emoji: '😄', category: 'keep' },
  { id: 4,  emoji: '🎵', category: 'keep' },
  { id: 5,  emoji: '🎬', category: 'keep' },
  { id: 6,  emoji: '📸', category: 'keep' },
  { id: 7,  emoji: '🚶', category: 'keep' },
  { id: 8,  emoji: '🏡', category: 'keep' },
  { id: 9,  emoji: '☕', category: 'keep' },
  { id: 10, emoji: '💕', category: 'keep' },
  { id: 11, emoji: '🌙', category: 'wished' },
  { id: 12, emoji: '✨', category: 'keep' },
  { id: 13, emoji: '🌸', category: 'will' },
  { id: 14, emoji: '🌱', category: 'will' },
  { id: 15, emoji: '🍀', category: 'will' },
  { id: 16, emoji: '🥺', category: 'wished' },
  { id: 17, emoji: '💌', category: 'wished' },
  { id: 18, emoji: '🎯', category: 'keep' },
  { id: 19, emoji: '🌈', category: 'keep' },
  { id: 20, emoji: '🎁', category: 'keep' },
];

// ─── KPT 메타 (id 100번대, 신규 픽셋) ───────────────────
//
// 7 + 7 + 7 = 21개. 매달 K/W/T 각 1개씩 결정적 선택.

const KPT_META: ReflectionQuestionMeta[] = [
  // ─── Keep — 좋았던 우리 (101-107) ──
  { id: 101, emoji: '💝', category: 'keep' },
  { id: 102, emoji: '😄', category: 'keep' },
  { id: 103, emoji: '✨', category: 'keep' },
  { id: 104, emoji: '📸', category: 'keep' },
  { id: 105, emoji: '🫶', category: 'keep' },
  { id: 106, emoji: '🚶', category: 'keep' },
  { id: 107, emoji: '☕', category: 'keep' },

  // ─── Wished — 아쉬웠던 우리 (108-114) ──
  { id: 108, emoji: '🤍', category: 'wished' },
  { id: 109, emoji: '🥺', category: 'wished' },
  { id: 110, emoji: '💌', category: 'wished' },
  { id: 111, emoji: '🌙', category: 'wished' },
  { id: 112, emoji: '🌧️', category: 'wished' },
  { id: 113, emoji: '🫧', category: 'wished' },
  { id: 114, emoji: '🍃', category: 'wished' },

  // ─── Will — 다음 달 우리 (115-121) ──
  { id: 115, emoji: '🌸', category: 'will' },
  { id: 116, emoji: '🌱', category: 'will' },
  { id: 117, emoji: '🍀', category: 'will' },
  { id: 118, emoji: '🎯', category: 'will' },
  { id: 119, emoji: '🗺️', category: 'will' },
  { id: 120, emoji: '🎁', category: 'will' },
  { id: 121, emoji: '🌈', category: 'will' },
];

const ALL_META: ReflectionQuestionMeta[] = [...LEGACY_META, ...KPT_META];

// ─── 변환기 ──────────────────────────────────────────────

const buildQuestion = (meta: ReflectionQuestionMeta): ReflectionQuestion => ({
  id: meta.id,
  emoji: meta.emoji,
  category: meta.category,
  // getter로 만들면 언어 변경 시 자동 반영
  get question() {
    return i18n.t(`reflection:questions.${meta.id}.question`);
  },
  get placeholder() {
    return i18n.t(`reflection:questions.${meta.id}.placeholder`);
  },
  get prompts() {
    // i18next returnObjects로 배열 가져오기. 없으면 undefined.
    const raw = i18n.t(`reflection:questions.${meta.id}.prompts`, {
      returnObjects: true,
      defaultValue: undefined,
    });
    return Array.isArray(raw) ? (raw as string[]) : undefined;
  },
});

export const REFLECTION_QUESTIONS: ReflectionQuestion[] = ALL_META.map(buildQuestion);

// ─── 픽 알고리즘 ─────────────────────────────────────────

/**
 * 해당 년/월에 배정된 질문 3개를 결정론적으로 선택.
 * 같은 커플/월이면 항상 같은 3개를 반환한다.
 *
 * 새 KPT 세트(100+)에서 카테고리별로 1개씩 뽑는다 (Keep + Wished + Will).
 *
 * - 시드: hashCode(coupleId) ⊕ (year * 12 + month)
 * - PRNG: mulberry32 (32비트 결정적, 균일 분포)
 * - 카테고리별로 독립적으로 균일 선택 (시드를 살짝 변형)
 * - 결과 순서: Keep → Wished → Will (사용자 여정 톤)
 */
export function pickReflectionQuestions(
  coupleId: string,
  year: number,
  month: number,
): ReflectionQuestion[] {
  // 인접 month에서도 결과가 충분히 흔들리도록 multiplicative hash로 시드를 mix.
  // 카테고리별 offset도 큰 prime으로 곱해서 카테고리간 결과가 독립적이도록.
  const baseSeed = mixSeed(hashCode(coupleId), year * 12 + month);

  const pickFromCategory = (
    category: ReflectionCategory,
    seedOffset: number,
  ): ReflectionQuestionMeta => {
    const pool = KPT_META.filter((m) => m.category === category);
    const seed = mixSeed(baseSeed, seedOffset);
    const rng = mulberry32(seed);
    rng(); // warmup — 첫 출력 폐기로 시드 차이를 더 분산
    const idx = Math.floor(rng() * pool.length);
    return pool[idx];
  };

  return [
    pickFromCategory('keep', 1),
    pickFromCategory('wished', 2),
    pickFromCategory('will', 3),
  ].map(buildQuestion);
}

/**
 * Knuth multiplicative hash. 두 32비트 정수를 강하게 섞는다.
 * 인접한 입력에서도 결과가 멀어지도록 보장.
 */
function mixSeed(a: number, b: number): number {
  return Math.imul((a ^ b) | 0, 2654435769) >>> 0;
}

export function getQuestionById(id: number): ReflectionQuestion | undefined {
  const meta = ALL_META.find((m) => m.id === id);
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
