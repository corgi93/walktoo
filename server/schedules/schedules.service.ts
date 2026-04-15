import type {
  CoupleSchedule,
  CreateSchedulePayload,
  ScheduleCategory,
  UpdateSchedulePayload,
} from '@/types/schedule';
import { SCHEDULE_CATEGORY_EMOJI } from '@/types/schedule';

import { supabase } from '../client';

// ─── Types (raw row) ────────────────────────────────────

interface CoupleScheduleRow {
  id: string;
  couple_id: string;
  owner_id: string;
  date: string;
  title: string;
  category: ScheduleCategory;
  emoji: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

const fromRow = (row: CoupleScheduleRow): CoupleSchedule => ({
  id: row.id,
  coupleId: row.couple_id,
  ownerId: row.owner_id,
  date: row.date,
  title: row.title,
  category: row.category,
  emoji: row.emoji,
  note: row.note,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// ─── 월별 조회 ──────────────────────────────────────────

export async function listByMonth(
  coupleId: string,
  startDate: string,
  endDate: string,
): Promise<CoupleSchedule[]> {
  const { data, error } = await supabase
    .from('couple_schedules')
    .select('*')
    .eq('couple_id', coupleId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true })
    .returns<CoupleScheduleRow[]>();

  if (error) {
    console.warn('[schedules] listByMonth error:', error.message);
    return [];
  }

  return (data ?? []).map(fromRow);
}

// ─── 단일 날짜 조회 ─────────────────────────────────────

export async function listByDate(
  coupleId: string,
  date: string,
): Promise<CoupleSchedule[]> {
  const { data, error } = await supabase
    .from('couple_schedules')
    .select('*')
    .eq('couple_id', coupleId)
    .eq('date', date)
    .order('created_at', { ascending: true })
    .returns<CoupleScheduleRow[]>();

  if (error) {
    console.warn('[schedules] listByDate error:', error.message);
    return [];
  }

  return (data ?? []).map(fromRow);
}

// ─── 생성 ───────────────────────────────────────────────

export async function create(
  coupleId: string,
  ownerId: string,
  payload: CreateSchedulePayload,
): Promise<CoupleSchedule | null> {
  const emoji =
    payload.emoji ?? SCHEDULE_CATEGORY_EMOJI[payload.category] ?? null;

  const { data, error } = await supabase
    .from('couple_schedules')
    .insert({
      couple_id: coupleId,
      owner_id: ownerId,
      date: payload.date,
      title: payload.title.trim(),
      category: payload.category,
      emoji,
      note: payload.note?.trim() || null,
    })
    .select('*')
    .single<CoupleScheduleRow>();

  if (error || !data) {
    console.warn('[schedules] create error:', error?.message);
    return null;
  }

  return fromRow(data);
}

// ─── 수정 ───────────────────────────────────────────────

export async function update(
  payload: UpdateSchedulePayload,
): Promise<CoupleSchedule | null> {
  const patch: Record<string, unknown> = {};
  if (payload.date !== undefined) patch.date = payload.date;
  if (payload.title !== undefined) patch.title = payload.title.trim();
  if (payload.category !== undefined) patch.category = payload.category;
  if (payload.emoji !== undefined) patch.emoji = payload.emoji;
  if (payload.note !== undefined) {
    patch.note = payload.note?.trim() || null;
  }

  const { data, error } = await supabase
    .from('couple_schedules')
    .update(patch)
    .eq('id', payload.id)
    .select('*')
    .single<CoupleScheduleRow>();

  if (error || !data) {
    console.warn('[schedules] update error:', error?.message);
    return null;
  }

  return fromRow(data);
}

// ─── 삭제 ───────────────────────────────────────────────

export async function remove(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('couple_schedules')
    .delete()
    .eq('id', id);

  if (error) {
    console.warn('[schedules] remove error:', error.message);
    return false;
  }
  return true;
}

export const schedulesService = {
  listByMonth,
  listByDate,
  create,
  update,
  remove,
};
