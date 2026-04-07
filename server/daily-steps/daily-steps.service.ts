import { supabase } from '../client';

// ─── 타입 ────────────────────────────────────────────────

interface DailyStepRow {
  user_id: string;
  date: string;
  steps: number;
  kcal: number;
  updated_at: string;
}

// ─── 헬퍼: 로컬 타임존 기준 오늘 날짜 ──────────────────
// toISOString()은 UTC 기준이라 한국(UTC+9)에서 자정~9시 사이에
// 어제 날짜를 반환하는 버그가 있었음
const getLocalToday = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// ─── 오늘의 걸음수 Upsert ───────────────────────────────

export async function syncSteps(userId: string, steps: number) {
  const today = getLocalToday();
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
  const today = getLocalToday();

  const { data } = await supabase
    .from('daily_steps')
    .select('steps')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle<Pick<DailyStepRow, 'steps'>>();

  return data?.steps ?? 0;
}

// ─── 상대방의 오늘 걸음수 조회 ──────────────────────────
//
// RLS가 couples/profiles 서브쿼리를 중첩 평가하면서 실패할 수 있어서
// RPC (database function) 사용을 먼저 시도하고, 실패 시 직접 쿼리 fallback
export async function getPartnerSteps(partnerId: string): Promise<number> {
  const today = getLocalToday();

  // 1차: RPC 함수 시도 (SECURITY DEFINER로 RLS 무관)
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('get_partner_steps', { p_partner_id: partnerId, p_date: today });

  if (!rpcError && rpcData !== null && rpcData !== undefined) {
    console.log('[getPartnerSteps] rpc OK:', rpcData);
    return typeof rpcData === 'number' ? rpcData : 0;
  }

  // 2차 fallback: 직접 쿼리
  if (rpcError) {
    console.warn('[getPartnerSteps] rpc failed:', rpcError.message, '→ fallback to direct query');
  }

  const { data, error } = await supabase
    .from('daily_steps')
    .select('steps')
    .eq('user_id', partnerId)
    .eq('date', today)
    .maybeSingle<Pick<DailyStepRow, 'steps'>>();

  if (error) {
    console.warn('[getPartnerSteps] direct query error:', error.message, error.code);
    return 0;
  }

  console.log('[getPartnerSteps] direct:', partnerId, 'date:', today, 'steps:', data?.steps ?? 0);
  return data?.steps ?? 0;
}

// ─── 커플 양쪽의 오늘 걸음수 조회 ───────────────────────

export async function getCoupleStepsToday(
  userId: string,
  partnerId: string,
): Promise<{ mySteps: number; partnerSteps: number }> {
  const today = getLocalToday();

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
