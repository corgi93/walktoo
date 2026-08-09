import { supabase } from '../client';
import type { Database } from '../types/database.types';

type CoupleRow = Database['public']['Tables']['couples']['Row'];
type CoupleUpdate = Database['public']['Tables']['couples']['Update'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type JoinCoupleByCodeArgs =
  Database['public']['Functions']['join_couple_by_code']['Args'];
type DisconnectCoupleArgs =
  Database['public']['Functions']['disconnect_couple']['Args'];

// ─── Join 결과 타입 ─────────────────────────────────────

export type CoupleWithProfiles = CoupleRow & {
  user1: ProfileRow;
  user2: ProfileRow | null;
};

export interface JoinCoupleByCodeResult {
  success: boolean;
  reason?:
    | 'no_profile'
    | 'already_paired'
    | 'invalid_code'
    | 'expired'
    | 'self_code';
  couple_id?: string;
  user1_id?: string;
}

export interface DisconnectCoupleResult {
  success: boolean;
  reason?: 'not_found' | 'forbidden' | 'partner_deleted';
}

// ─── Couples Repository (couples 테이블 직접 쿼리) ─────

export const couplesRepository = {
  /** 커플 조회 (by id) */
  findById: (id: string) =>
    supabase
      .from('couples')
      .select('*, user1:profiles!couples_user1_id_fkey(*), user2:profiles!couples_user2_id_fkey(*)')
      .eq('id', id)
      .single<CoupleWithProfiles>(),

  /** 초대코드로 커플 조회 */
  findByInviteCode: (code: string) =>
    supabase
      .from('couples')
      .select('*')
      .eq('invite_code', code)
      .is('user2_id', null)
      .single<CoupleRow>(),

  /** 커플 생성 (초대코드 발급) */
  create: (userId: string, inviteCode: string) =>
    supabase
      .from('couples')
      .insert({ user1_id: userId, invite_code: inviteCode } as never)
      .select()
      .single<CoupleRow>(),

  /** 커플 연결 (user2 입장) */
  join: (coupleId: string, data: CoupleUpdate) =>
    supabase
      .from('couples')
      .update(data as never)
      .eq('id', coupleId)
      .select()
      .single<CoupleRow>(),

  /** 초대코드 연결 전체를 DB transaction으로 처리 */
  joinByCodeTransaction: (args: JoinCoupleByCodeArgs) =>
    supabase
      .rpc('join_couple_by_code', args)
      .returns<JoinCoupleByCodeResult>(),

  /** 커플 업데이트 */
  updateCouple: (coupleId: string, data: CoupleUpdate) =>
    supabase
      .from('couples')
      .update(data as never)
      .eq('id', coupleId),

  /** 커플 해제 */
  disconnect: (coupleId: string) =>
    supabase
      .from('couples')
      .update({ user2_id: null } as never)
      .eq('id', coupleId),

  /** 커플 해제 전체를 DB transaction으로 처리 */
  disconnectTransaction: (args: DisconnectCoupleArgs) =>
    supabase
      .rpc('disconnect_couple', args)
      .returns<DisconnectCoupleResult>(),

  /** 대기 중인 커플 삭제 (초대 취소) */
  deleteCouple: (coupleId: string) =>
    supabase
      .from('couples')
      .delete()
      .eq('id', coupleId)
      .is('user2_id', null),

  /** 프로필 업데이트 */
  updateProfile: (userId: string, data: ProfileUpdate) =>
    supabase
      .from('profiles')
      .update(data as never)
      .eq('id', userId)
      .select()
      .single<ProfileRow>(),

  /** 프로필 생성 (회원가입 시) */
  createProfile: (data: ProfileInsert) =>
    supabase
      .from('profiles')
      .insert(data as never)
      .select()
      .single<ProfileRow>(),

  /** 프로필 조회 */
  getProfile: (userId: string) =>
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single<ProfileRow>(),
};
