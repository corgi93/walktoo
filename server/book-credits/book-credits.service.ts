import { supabase } from '../client';

// ─── Types ──────────────────────────────────────────────

export interface BookCreditsStatus {
  /** 아직 사용하지 않은 회고북 뽑기 권수 */
  credits: number;
  /** 올해(서버 기준) 스탬프로 교환한 권수 */
  redeemedThisYear: number;
}

// ─── 조회 ────────────────────────────────────────────────

export async function getStatus(): Promise<BookCreditsStatus> {
  const { data, error } = await supabase.rpc('get_book_credits');

  if (error) {
    console.warn('[book-credits] getStatus error:', error.message);
    return { credits: 0, redeemedThisYear: 0 };
  }

  const result = data as { credits: number; redeemed_this_year: number };
  return {
    credits: result.credits ?? 0,
    redeemedThisYear: result.redeemed_this_year ?? 0,
  };
}

// ─── 결제 성공 시 크레딧 추가 ───────────────────────────

export async function addCredits(
  count: number,
): Promise<{ success: boolean; reason?: 'no_couple' | 'invalid_count' }> {
  const { data, error } = await supabase.rpc('add_book_credits', {
    p_count: count,
  });
  if (error) {
    console.warn('[book-credits] addCredits error:', error.message);
    return { success: false };
  }
  return data as { success: boolean; reason?: 'no_couple' | 'invalid_count' };
}

// ─── 스탬프 → 크레딧 교환 ────────────────────────────────

export async function redeemStampsForBook(): Promise<{
  success: boolean;
  reason?: 'no_couple' | 'annual_cap_reached' | 'insufficient_stamps';
  required?: number;
  current?: number;
}> {
  const { data, error } = await supabase.rpc('redeem_stamps_for_book');
  if (error) {
    console.warn('[book-credits] redeem error:', error.message);
    return { success: false };
  }
  return data as {
    success: boolean;
    reason?: 'no_couple' | 'annual_cap_reached' | 'insufficient_stamps';
    required?: number;
    current?: number;
  };
}

// ─── 크레딧 소비 (회고북 뽑기) ───────────────────────────

export async function consumeCredit(): Promise<{
  success: boolean;
  reason?: 'no_couple' | 'no_credits';
}> {
  const { data, error } = await supabase.rpc('consume_book_credit');
  if (error) {
    console.warn('[book-credits] consume error:', error.message);
    return { success: false };
  }
  return data as {
    success: boolean;
    reason?: 'no_couple' | 'no_credits';
  };
}

export const bookCreditsService = {
  getStatus,
  addCredits,
  redeemStampsForBook,
  consumeCredit,
};
