// ─── Monthly Reflection ─────────────────────────────────

export interface MonthlyReflection {
  id: string;
  year: number;
  month: number;
  questionIds: number[];
  isRevealed: boolean;
  createdAt: string;
}

export interface ReflectionAnswer {
  questionId: number;
  answer: string;
}

export interface ReflectionWithAnswers {
  reflection: MonthlyReflection;
  myAnswers: ReflectionAnswer[];
  partnerAnswers: ReflectionAnswer[]; // is_revealed=true일 때만 채워짐
}

// ─── Reflection Progress ─────────────────────────────────
// 상대방 답변 내용은 감추고 카운트만 노출해서
// "둘 다 써야 둘 다 볼 수 있어요" 상태를 UI에 보여주기 위함.

export interface ReflectionProgress {
  total: number;
  myAnswered: number;
  partnerAnswered: number;
  hasPartner: boolean;
  isRevealed: boolean;
}
