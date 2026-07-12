import { STAMP } from '@/constants/game-config';
import { getLocalToday } from '@/utils/date';

import { supabase } from '../client';

// ─── 타입 ────────────────────────────────────────────────

export interface ClaimStampResult {
  success: boolean;
  reason?: 'no_couple' | 'already_claimed';
  stampId?: string;
  count?: number;
}

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

// ─── 특정 월의 스탬프 날짜 목록 ─────────────────────────
// 캘린더 뷰에서 "이 달 어느 날에 발자국 받았는지" 표시용.
// 반환: 'YYYY-MM-DD' 배열 (중복 없음, 정렬 없음)

export async function listStampDatesByMonth(
  coupleId: string,
  startDate: string,
  endDate: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('memory_stamps')
    .select('date')
    .eq('couple_id', coupleId)
    .gte('date', startDate)
    .lte('date', endDate)
    .returns<{ date: string }[]>();

  if (error) {
    console.warn('[listStampDatesByMonth] error:', error.message);
    return [];
  }

  return (data ?? []).map((row) => row.date);
}

// ─── 스탬프 획득 (하루 1회) ─────────────────────────────

export async function claimTodayStamp(
  count: number = STAMP.DAILY_REWARD,
): Promise<ClaimStampResult> {
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
  listStampDatesByMonth,
  claimTodayStamp,
};
