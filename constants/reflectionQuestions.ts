/**
 * 월간 회고 질문 세트 — "이달의 우리"
 *
 * 톤: 귀엽고 감성적 / IT 회고 X, 커플 감성 O
 * 답변: 단어 1-2개도 OK, 부담 없이
 * 매달 3개씩 랜덤 선택
 */

export interface ReflectionQuestion {
  id: number;
  emoji: string;
  question: string;
  placeholder?: string;
}

export const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  // ─── 감사 / 고마움 ──────────────────────────────
  {
    id: 1,
    emoji: '💝',
    question: '이번 달 가장 고마웠던 순간은?',
    placeholder: '작은 것도 괜찮아',
  },
  {
    id: 2,
    emoji: '🫶',
    question: '너에게 더 고맙다고 말하고 싶은 건?',
    placeholder: '평소엔 말하기 쑥스러운 것도',
  },

  // ─── 즐거움 / 웃음 ──────────────────────────────
  {
    id: 3,
    emoji: '😄',
    question: '이번 달 가장 많이 웃었던 날은?',
    placeholder: '언제, 왜 웃었지?',
  },
  {
    id: 4,
    emoji: '🎵',
    question: '이번 달 우리의 주제가가 있다면?',
    placeholder: '많이 들었던 노래도 좋아',
  },
  {
    id: 5,
    emoji: '🎬',
    question: '이번 달 함께 본 것 중 최애는?',
    placeholder: '드라마, 영화, 유튜브 뭐든',
  },

  // ─── 추억 / 장소 ────────────────────────────────
  {
    id: 6,
    emoji: '📸',
    question: '이번 달 기억에 남는 사진 한 장이 있다면?',
    placeholder: '어떤 순간이었어?',
  },
  {
    id: 7,
    emoji: '🚶',
    question: '이번 달 가장 좋았던 산책은?',
    placeholder: '어디, 어떤 기분',
  },
  {
    id: 8,
    emoji: '🏡',
    question: '이번 달 우리만의 아지트가 있다면?',
    placeholder: '단골 카페도 좋아',
  },
  {
    id: 9,
    emoji: '☕',
    question: '이번 달 가장 맛있었던 음식은?',
    placeholder: '같이 먹었던 거면 더 좋고',
  },

  // ─── 예쁨 / 설렘 ────────────────────────────────
  {
    id: 10,
    emoji: '💕',
    question: '이번 달 네가 가장 예뻤던 순간은?',
    placeholder: '표정이든, 말투든, 행동이든',
  },
  {
    id: 11,
    emoji: '🌙',
    question: '이번 달 너의 새로 발견한 모습이 있다면?',
    placeholder: '이런 면도 있었구나 싶은 것',
  },
  {
    id: 12,
    emoji: '✨',
    question: '이번 달 우리를 한 단어로 표현한다면?',
    placeholder: '한 단어면 충분해',
  },

  // ─── 미래 / 바람 ────────────────────────────────
  {
    id: 13,
    emoji: '🌸',
    question: '다음 달 꼭 같이 해보고 싶은 건?',
    placeholder: '작은 것부터 큰 것까지',
  },
  {
    id: 14,
    emoji: '🌱',
    question: '다음 달 너에게 해주고 싶은 게 있다면?',
    placeholder: '약속 같은 느낌으로',
  },
  {
    id: 15,
    emoji: '🍀',
    question: '이번 달 서로에게 해주고 싶은 응원은?',
    placeholder: '한 마디면 돼',
  },

  // ─── 솔직한 / 미안함 ────────────────────────────
  {
    id: 16,
    emoji: '🥺',
    question: '이번 달 미안했던 순간이 있다면?',
    placeholder: '용기 내서 말해도 괜찮아',
  },
  {
    id: 17,
    emoji: '💌',
    question: '이번 달 전하지 못한 말이 있다면?',
    placeholder: '지금이라도 늦지 않았어',
  },

  // ─── 성장 / 변화 ────────────────────────────────
  {
    id: 18,
    emoji: '🎯',
    question: '이번 달 우리가 함께 이룬 건?',
    placeholder: '작은 성취도 좋아',
  },
  {
    id: 19,
    emoji: '🌈',
    question: '이번 달 인상적이었던 우리 대화는?',
    placeholder: '무슨 얘기였지?',
  },
  {
    id: 20,
    emoji: '🎁',
    question: '이번 달 가장 기뻤던 선물은?',
    placeholder: '마음도 선물이야',
  },
];

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
  const pool = [...REFLECTION_QUESTIONS];

  // Fisher-Yates 부분 셔플: 앞 3개만 결정
  const pickCount = Math.min(3, pool.length);
  for (let i = 0; i < pickCount; i++) {
    const j = i + Math.floor(rng() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, pickCount);
}

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

export function getQuestionById(id: number): ReflectionQuestion | undefined {
  return REFLECTION_QUESTIONS.find((q) => q.id === id);
}
