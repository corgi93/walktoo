import { supabase } from '../client';

// ─── 타입 ────────────────────────────────────────────────

export interface ClaimStampResult {
  success: boolean;
  reason?: 'no_couple' | 'already_claimed';
  stampId?: string;
  count?: number;
}

// ─── 헬퍼: 로컬 타임존 기준 오늘 날짜 ──────────────────

const getLocalToday = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// ─── 오늘 스탬프 받았는지 확인 ───────────────────────────

export async function getTodayStamp(coupleId: string): Promise<boolean> {
  const today = getLocalToday();

  const { data, error } = await supabase
    .from('memory_stamps')
    .select('id')
    .eq('couple_id', coupleId)
    .eq('date', today)
    .maybeSingle();

  if (error) {
    console.warn('[getTodayStamp] error:', error.message);
    return false;
  }

  return !!data;
}

// ─── 총 스탬프 개수 조회 ────────────────────────────────

export async function getTotalStamps(): Promise<number> {
  const { data, error } = await supabase.rpc('get_total_stamps');

  if (error) {
    console.warn('[getTotalStamps] error:', error.message);
    return 0;
  }

  return typeof data === 'number' ? data : 0;
}

// ─── 스탬프 획득 (하루 1회) ─────────────────────────────

export async function claimTodayStamp(count = 30): Promise<ClaimStampResult> {
  const today = getLocalToday();

  const { data, error } = await supabase.rpc('claim_memory_stamp', {
    p_date: today,
    p_count: count,
  });

  if (error) {
    console.warn('[claimTodayStamp] error:', error.message);
    return { success: false };
  }

  const result = data as {
    success: boolean;
    reason?: 'no_couple' | 'already_claimed';
    stamp_id?: string;
    count?: number;
  };

  return {
    success: result.success,
    reason: result.reason,
    stampId: result.stamp_id,
    count: result.count,
  };
}

export const memoryStampsService = {
  getTodayStamp,
  getTotalStamps,
  claimTodayStamp,
};
