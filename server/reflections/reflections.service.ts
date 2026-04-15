import { pickReflectionQuestions } from '@/constants/reflectionQuestions';
import type {
  MonthlyReflection,
  ReflectionAnswer,
  ReflectionProgress,
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
    console.error('[reflections] save error:', error.message, error.details);
    throw new Error(error.message);
  }

  if (!data || typeof data !== 'object') {
    console.error('[reflections] unexpected RPC response:', data);
    throw new Error('Unexpected response from server');
  }

  const result = data as {
    success: boolean;
    just_revealed?: boolean;
  };

  if (!result.success) {
    const reason = (data as { reason?: string }).reason ?? 'unknown';
    console.warn('[reflections] save rejected:', reason);
    throw new Error(reason);
  }

  return {
    success: true,
    justRevealed: result.just_revealed ?? false,
  };
}

// ─── 진행 상태 (상대방 내용 없이 카운트만) ──────────────

export async function getReflectionProgress(
  reflectionId: string,
): Promise<ReflectionProgress | null> {
  const { data, error } = await supabase.rpc('get_reflection_progress', {
    p_reflection_id: reflectionId,
  });

  if (error) {
    console.warn('[reflections] progress error:', error.message);
    return null;
  }

  const result = data as {
    total?: number;
    my_answered?: number;
    partner_answered?: number;
    has_partner?: boolean;
    is_revealed?: boolean;
    error?: string;
  };

  if (result.error) return null;

  return {
    total: result.total ?? 0,
    myAnswered: result.my_answered ?? 0,
    partnerAnswered: result.partner_answered ?? 0,
    hasPartner: result.has_partner ?? false,
    isRevealed: result.is_revealed ?? false,
  };
}

export const reflectionsService = {
  getOrCreateCurrentReflection,
  getReflectionWithAnswers,
  listPastReflections,
  saveAnswers,
  getReflectionProgress,
};
