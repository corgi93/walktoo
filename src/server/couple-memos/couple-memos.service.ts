import { supabase } from '@/server/client';
import type { CoupleMemo } from '@/types/coupleMemo';

interface CoupleMemoRow {
  couple_id: string;
  content: string;
  updated_by: string | null;
  updated_at: string;
}

const table = () => supabase.from('couple_memos');

const fromRow = (row: CoupleMemoRow): CoupleMemo => ({
  coupleId: row.couple_id,
  content: row.content,
  updatedBy: row.updated_by,
  updatedAt: row.updated_at,
});

async function get(coupleId: string): Promise<CoupleMemo | null> {
  const { data, error } = await table()
    .select('*')
    .eq('couple_id', coupleId)
    .maybeSingle<CoupleMemoRow>();

  if (error) {
    console.warn('[couple-memos] get error:', error.message);
    return null;
  }

  return data ? fromRow(data) : null;
}

async function upsert(
  coupleId: string,
  userId: string,
  content: string,
): Promise<CoupleMemo | null> {
  const { data, error } = await table()
    .upsert(
      {
        couple_id: coupleId,
        content,
        updated_by: userId,
      },
      { onConflict: 'couple_id' },
    )
    .select('*')
    .single<CoupleMemoRow>();

  if (error || !data) {
    console.warn('[couple-memos] upsert error:', error?.message);
    throw new Error(error?.message ?? 'save_failed');
  }

  return fromRow(data);
}

export const coupleMemosService = {
  get,
  upsert,
};
