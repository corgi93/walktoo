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
