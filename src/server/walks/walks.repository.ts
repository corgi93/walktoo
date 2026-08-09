import { supabase } from '../client';
import type { Database } from '../types/database.types';

type WalkRow = Database['public']['Tables']['walks']['Row'];
type WalkInsert = Database['public']['Tables']['walks']['Insert'];
type WalkUpdate = Database['public']['Tables']['walks']['Update'];
type EntryRow = Database['public']['Tables']['footprint_entries']['Row'];
type EntryInsert = Database['public']['Tables']['footprint_entries']['Insert'];
type CreateWalkWithEntryArgs =
  Database['public']['Functions']['create_walk_with_entry']['Args'];
type AddEntryToWalkArgs =
  Database['public']['Functions']['add_entry_to_walk']['Args'];

// ─── Join 결과 타입 ─────────────────────────────────────

type EntryWithProfile = EntryRow & {
  profiles: { nickname: string } | null;
};

export type WalkWithEntries = WalkRow & {
  footprint_entries: EntryWithProfile[];
};

export interface WalkEntryMutationResult {
  success: boolean;
  reason?:
    | 'no_couple'
    | 'forbidden'
    | 'invalid_kind'
    | 'not_found'
    | 'already_entered';
  walk_id?: string;
  entry_id?: string;
  created_walk?: boolean;
  just_revealed?: boolean;
}

// ─── Walks Repository (walks 테이블 직접 쿼리) ─────────

export const walksRepository = {
  /** 커플의 산책 목록 조회 (페이지네이션, 산책 날짜 최신순) */
  findByCoupleId: (
    coupleId: string,
    page: number,
    limit = 20,
    kind?: WalkRow['kind'],
  ) => {
    let query = supabase
      .from('walks')
      .select('*, footprint_entries(*, profiles:user_id(nickname))')
      .eq('couple_id', coupleId);

    if (kind) {
      query = query.eq('kind', kind);
    }

    return query
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)
      .returns<WalkWithEntries[]>();
  },

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

  /** 산책 생성/조회 + 내 엔트리 작성 + reveal 판정 (DB transaction) */
  createWithEntry: (args: CreateWalkWithEntryArgs) =>
    supabase
      .rpc('create_walk_with_entry', args)
      .returns<WalkEntryMutationResult>(),

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

  /** 엔트리 사진 URL 조회 (Storage 정리 시 diff용) */
  findEntryPhotos: (entryId: string) =>
    supabase
      .from('footprint_entries')
      .select('photos')
      .eq('id', entryId)
      .single<{ photos: string[] }>(),

  /** 발자취 엔트리 생성 */
  createEntry: (data: EntryInsert) =>
    supabase
      .from('footprint_entries')
      .insert(data as never)
      .select()
      .single<EntryRow>(),

  /** 기존 산책에 내 엔트리 추가 + reveal 판정 (DB transaction) */
  addEntryToWalk: (args: AddEntryToWalkArgs) =>
    supabase
      .rpc('add_entry_to_walk', args)
      .returns<WalkEntryMutationResult>(),

  /** 발자취 엔트리 수정 */
  updateEntry: (
    entryId: string,
    data: {
      memo?: string;
      photos?: string[];
      location_name?: string;
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

  /** 특정 날짜와 종류에 커플의 산책이 있는지 확인 */
  findByDateAndKind: (
    coupleId: string,
    date: string,
    kind: WalkRow['kind'],
  ) =>
    supabase
      .from('walks')
      .select('id')
      .eq('couple_id', coupleId)
      .eq('date', date)
      .eq('kind', kind)
      .returns<{ id: string }[]>(),

  /** 커플의 특정 월 산책 목록 (entries 포함, 최신순) */
  findByCoupleIdAndMonth: (coupleId: string, startDate: string, endDate: string) =>
    supabase
      .from('walks')
      .select('*, footprint_entries(*, profiles:user_id(nickname))')
      .eq('couple_id', coupleId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .returns<WalkWithEntries[]>(),

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

  /** 커플의 총 걸음수 (DB aggregate, 누적 데이터용) */
  sumStepsByCoupleId: (coupleId: string) =>
    supabase.rpc('sum_walk_steps_by_couple', { p_couple_id: coupleId }),

  /** 커플의 총 걸음수 (최근 산책들에서 합산) */
  findStepsByCoupleId: (coupleId: string) =>
    supabase
      .from('walks')
      .select('steps')
      .eq('couple_id', coupleId)
      .returns<{ steps: number }[]>(),
};
