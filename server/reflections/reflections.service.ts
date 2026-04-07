import { pickReflectionQuestions } from '@/constants/reflectionQuestions';
import type {
  MonthlyReflection,
  ReflectionAnswer,
  ReflectionWithAnswers,
} from '@/types/reflection';

import { supabase } from '../client';

// ─── Helpers ────────────────────────────────────────────

const getCurrentYearMonth = (): { year: number; month: number } => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
};

// ─── 이달의 회고 가져오기 (없으면 생성) ─────────────────

export async function getOrCreateCurrentReflection(
  coupleId: string,
): Promise<MonthlyReflection | null> {
  const { year, month } = getCurrentYearMonth();
  const questions = pickReflectionQuestions(coupleId, year, month);
  const questionIds = questions.map((q) => q.id);

  const { data, error } = await supabase.rpc('get_or_create_reflection', {
    p_year: year,
    p_month: month,
    p_question_ids: questionIds,
  });

  if (error) {
    console.warn('[reflections] get_or_create error:', error.message);
    return null;
  }

  const result = data as {
    id?: string;
    question_ids?: number[];
    is_revealed?: boolean;
    error?: string;
  };

  if (result.error || !result.id) {
    return null;
  }

  return {
    id: result.id,
    year,
    month,
    questionIds: result.question_ids ?? questionIds,
    isRevealed: result.is_revealed ?? false,
    createdAt: new Date().toISOString(),
  };
}

// ─── 특정 회고의 상세 (내 답변 + 상대방 답변) ───────────

export async function getReflectionWithAnswers(
  reflectionId: string,
  myUserId: string,
): Promise<ReflectionWithAnswers | null> {
  const { data: reflection, error: refError } = await supabase
    .from('monthly_reflections')
    .select('*')
    .eq('id', reflectionId)
    .maybeSingle();

  if (refError || !reflection) {
    console.warn('[reflections] fetch error:', refError?.message);
    return null;
  }

  const { data: answers, error: ansError } = await supabase
    .from('reflection_answers')
    .select('*')
    .eq('reflection_id', reflectionId);

  if (ansError) {
    console.warn('[reflections] answers fetch error:', ansError.message);
    return null;
  }

  const myAnswers: ReflectionAnswer[] = [];
  const partnerAnswers: ReflectionAnswer[] = [];

  (answers ?? []).forEach((a: { user_id: string; question_id: number; answer: string }) => {
    const parsed = { questionId: a.question_id, answer: a.answer };
    if (a.user_id === myUserId) {
      myAnswers.push(parsed);
    } else {
      partnerAnswers.push(parsed);
    }
  });

  return {
    reflection: {
      id: reflection.id as string,
      year: reflection.year as number,
      month: reflection.month as number,
      questionIds: reflection.question_ids as number[],
      isRevealed: reflection.is_revealed as boolean,
      createdAt: reflection.created_at as string,
    },
    myAnswers,
    partnerAnswers,
  };
}

// ─── 지난 회고 목록 ─────────────────────────────────────

export async function listPastReflections(
  coupleId: string,
): Promise<MonthlyReflection[]> {
  const { data, error } = await supabase
    .from('monthly_reflections')
    .select('*')
    .eq('couple_id', coupleId)
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .limit(24);

  if (error || !data) {
    console.warn('[reflections] list error:', error?.message);
    return [];
  }

  return (data as Array<{
    id: string;
    year: number;
    month: number;
    question_ids: number[];
    is_revealed: boolean;
    created_at: string;
  }>).map((row) => ({
    id: row.id,
    year: row.year,
    month: row.month,
    questionIds: row.question_ids,
    isRevealed: row.is_revealed,
    createdAt: row.created_at,
  }));
}

// ─── 답변 저장 ──────────────────────────────────────────

export async function saveAnswers(
  reflectionId: string,
  answers: ReflectionAnswer[],
): Promise<{ success: boolean; justRevealed?: boolean }> {
  const payload = answers.map((a) => ({
    question_id: a.questionId,
    answer: a.answer,
  }));

  const { data, error } = await supabase.rpc('save_reflection_answers', {
    p_reflection_id: reflectionId,
    p_answers: payload,
  });

  if (error) {
    console.warn('[reflections] save error:', error.message);
    return { success: false };
  }

  const result = data as {
    success: boolean;
    just_revealed?: boolean;
  };

  return {
    success: result.success,
    justRevealed: result.just_revealed,
  };
}

export const reflectionsService = {
  getOrCreateCurrentReflection,
  getReflectionWithAnswers,
  listPastReflections,
  saveAnswers,
};
