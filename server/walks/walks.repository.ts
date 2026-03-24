import { supabase } from '../client';
import type { Database } from '../types/database.types';

type WalkRow = Database['public']['Tables']['walks']['Row'];
type WalkInsert = Database['public']['Tables']['walks']['Insert'];
type WalkUpdate = Database['public']['Tables']['walks']['Update'];
type EntryRow = Database['public']['Tables']['footprint_entries']['Row'];
type EntryInsert = Database['public']['Tables']['footprint_entries']['Insert'];

// ─── Join 결과 타입 ─────────────────────────────────────

type EntryWithProfile = EntryRow & {
  profiles: { nickname: string } | null;
};

export type WalkWithEntries = WalkRow & {
  footprint_entries: EntryWithProfile[];
};

// ─── Walks Repository (walks 테이블 직접 쿼리) ─────────

export const walksRepository = {
  /** 커플의 산책 목록 조회 (페이지네이션) */
  findByCoupleId: (coupleId: string, page: number, limit = 20) =>
    supabase
      .from('walks')
      .select('*, footprint_entries(*, profiles:user_id(nickname))')
      .eq('couple_id', coupleId)
      .order('date', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)
      .returns<WalkWithEntries[]>(),

  /** 산책 상세 조회 */
  findById: (id: string) =>
    supabase
      .from('walks')
      .select('*, footprint_entries(*, profiles:user_id(nickname))')
      .eq('id', id)
      .single<WalkWithEntries>(),

  /** 산책 생성 */
  create: (data: WalkInsert) =>
    supabase
      .from('walks')
      .insert(data as never)
      .select()
      .single<WalkRow>(),

  /** 산책 수정 */
  update: (id: string, data: WalkUpdate) =>
    supabase
      .from('walks')
      .update(data as never)
      .eq('id', id)
      .select()
      .single<WalkRow>(),

  /** 산책 삭제 */
  delete: (id: string) => supabase.from('walks').delete().eq('id', id),

  /** 발자취 엔트리 생성 */
  createEntry: (data: EntryInsert) =>
    supabase
      .from('footprint_entries')
      .insert(data as never)
      .select()
      .single<EntryRow>(),

  /** 발자취 엔트리 수정 */
  updateEntry: (
    entryId: string,
    data: {
      memo?: string;
      photos?: string[];
      diary_answer?: string;
      couple_answer?: string;
    },
  ) =>
    supabase
      .from('footprint_entries')
      .update(data as never)
      .eq('id', entryId)
      .select()
      .single<EntryRow>(),

  /** 산책의 엔트리 수 조회 (reveal 판단용) */
  countEntries: (walkId: string) =>
    supabase
      .from('footprint_entries')
      .select('id', { count: 'exact', head: true })
      .eq('walk_id', walkId),

  /** 특정 날짜에 커플의 산책이 있는지 확인 */
  findByDate: (coupleId: string, date: string) =>
    supabase
      .from('walks')
      .select('id')
      .eq('couple_id', coupleId)
      .eq('date', date)
      .returns<{ id: string }[]>(),

  /** 커플의 총 산책 수 */
  countByCoupleId: (coupleId: string) =>
    supabase
      .from('walks')
      .select('id', { count: 'exact', head: true })
      .eq('couple_id', coupleId),

  /** 커플의 최근 산책 날짜들 (연속 산책 계산용) */
  findRecentDates: (coupleId: string) =>
    supabase
      .from('walks')
      .select('date')
      .eq('couple_id', coupleId)
      .eq('is_revealed', true)
      .order('date', { ascending: false })
      .limit(100)
      .returns<{ date: string }[]>(),

  /** 커플의 총 걸음수 (최근 산책들에서 합산) */
  findStepsByCoupleId: (coupleId: string) =>
    supabase
      .from('walks')
      .select('steps')
      .eq('couple_id', coupleId)
      .returns<{ steps: number }[]>(),
};
