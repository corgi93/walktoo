import { supabase } from '../client';

// ─── 타입 ────────────────────────────────────────────────

interface DailyStepRow {
  user_id: string;
  date: string;
  steps: number;
  kcal: number;
  updated_at: string;
}

// ─── 오늘의 걸음수 Upsert ───────────────────────────────

export async function syncSteps(userId: string, steps: number) {
  const today = new Date().toISOString().split('T')[0];
  const kcal = Math.round(steps * 0.04 * 10) / 10;

  const { error } = await supabase
    .from('daily_steps')
    .upsert(
      {
        user_id: userId,
        date: today,
        steps,
        kcal,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: 'user_id,date' },
    );

  if (error) throw error;
}

// ─── 내 오늘 걸음수 조회 (DB fallback용) ─────────────────

export async function getMyStepsToday(userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from('daily_steps')
    .select('steps')
    .eq('user_id', userId)
    .eq('date', today)
    .single<Pick<DailyStepRow, 'steps'>>();

  return data?.steps ?? 0;
}

// ─── 상대방의 오늘 걸음수 조회 ──────────────────────────

export async function getPartnerSteps(partnerId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from('daily_steps')
    .select('steps')
    .eq('user_id', partnerId)
    .eq('date', today)
    .single<Pick<DailyStepRow, 'steps'>>();

  return data?.steps ?? 0;
}

// ─── 커플 양쪽의 오늘 걸음수 조회 ───────────────────────

export async function getCoupleStepsToday(
  userId: string,
  partnerId: string,
): Promise<{ mySteps: number; partnerSteps: number }> {
  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from('daily_steps')
    .select('user_id, steps')
    .in('user_id', [userId, partnerId])
    .eq('date', today)
    .returns<Pick<DailyStepRow, 'user_id' | 'steps'>[]>();

  const myRow = data?.find((r) => r.user_id === userId);
  const partnerRow = data?.find((r) => r.user_id === partnerId);

  return {
    mySteps: myRow?.steps ?? 0,
    partnerSteps: partnerRow?.steps ?? 0,
  };
}

export const dailyStepsService = {
  syncSteps,
  getMyStepsToday,
  getPartnerSteps,
  getCoupleStepsToday,
};
