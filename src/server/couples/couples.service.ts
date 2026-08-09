import type { CoupleProfile } from '@/types/couple';
import type { UserResponse } from '@/types/user';
import { getLocalToday } from '@/utils/date';

import { notificationsService } from '../notifications/notifications.service';
import type { ProfileRow } from '../types/database.types';
import { walksService } from '../walks/walks.service';
import { couplesRepository } from './couples.repository';

// ─── Helpers ────────────────────────────────────────────

const generateInviteCode = (): string =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

const toUserResponse = (row: ProfileRow): UserResponse => ({
  id: row.id,
  nickname: row.nickname,
  phone: row.phone,
  profileImageUrl: row.profile_image_url ?? undefined,
  birthday: row.birthday ?? undefined,
  coupleId: row.couple_id ?? undefined,
  isProfileComplete: row.is_profile_complete,
  totalWalks: row.total_walks,
  totalSteps: row.total_steps,
  characterType: row.character_type ?? 'boy',
  deletedAt: row.deleted_at ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// ─── Couples Service (비즈니스 로직) ────────────────────

export const couplesService = {
  /** 프로필 생성 (회원가입 시) */
  createProfile: async (
    userId: string,
    nickname: string,
    phone: string,
  ): Promise<UserResponse> => {
    const { data, error } = await couplesRepository.createProfile({
      id: userId,
      nickname,
      phone,
    });
    if (error) throw error;
    return toUserResponse(data);
  },

  /** 내 프로필 조회 */
  getMyProfile: async (userId: string): Promise<UserResponse> => {
    const { data, error } = await couplesRepository.getProfile(userId);
    if (error) throw error;
    return toUserResponse(data);
  },

  /** 프로필 수정 */
  updateProfile: async (
    userId: string,
    updates: {
      nickname?: string;
      phone?: string;
      profileImageUrl?: string;
      birthday?: string;
      isProfileComplete?: boolean;
      characterType?: string;
    },
  ): Promise<UserResponse> => {
    const { data, error } = await couplesRepository.updateProfile(userId, {
      nickname: updates.nickname,
      phone: updates.phone,
      profile_image_url: updates.profileImageUrl,
      birthday: updates.birthday,
      is_profile_complete: updates.isProfileComplete,
      character_type: updates.characterType,
    });
    if (error) throw error;
    return toUserResponse(data);
  },

  /** 초대코드 생성 (커플 만들기) */
  createInvite: async (userId: string) => {
    // 이미 커플인지 확인
    const { data: profile } = await couplesRepository.getProfile(userId);
    if (profile?.couple_id) {
      // 이미 대기 중인 초대가 있으면 그 코드를 재사용
      const { data: existingCouple } = await couplesRepository.findById(
        profile.couple_id,
      );
      if (existingCouple && !existingCouple.user2) {
        return {
          coupleId: existingCouple.id,
          inviteCode: existingCouple.invite_code,
        };
      }
      // 이미 연결 완료된 커플이면 에러
      throw new Error('이미 연결된 커플이 있어요');
    }

    const code = generateInviteCode();
    const { data, error } = await couplesRepository.create(userId, code);
    if (error) throw error;

    // 프로필에 couple_id 연결
    await couplesRepository.updateProfile(userId, { couple_id: data.id });

    return { coupleId: data.id, inviteCode: data.invite_code };
  },

  /** 초대코드로 커플 연결 */
  joinByCode: async (userId: string, inviteCode: string) => {
    const { data: result, error } =
      await couplesRepository.joinByCodeTransaction({
        p_invite_code: inviteCode.trim().toUpperCase(),
        p_start_date: getLocalToday(),
      });
    if (error) throw error;

    if (!result?.success || !result.couple_id || !result.user1_id) {
      switch (result?.reason) {
        case 'already_paired':
          throw new Error('이미 연결된 커플이 있어요');
        case 'expired':
          throw new Error('만료된 초대코드입니다. 새 코드를 요청해주세요');
        case 'self_code':
          throw new Error('본인의 초대코드입니다');
        case 'invalid_code':
          throw new Error('유효하지 않은 초대코드입니다');
        default:
          throw new Error('커플 연결에 실패했어요');
      }
    }

    // user1에게 커플 연결 알림
    const joinerProfile = await couplesRepository.getProfile(userId);
    if (joinerProfile.data) {
      notificationsService.notifyCoupleJoined(
        result.user1_id,
        userId,
        result.couple_id,
        joinerProfile.data.nickname,
      ).catch(() => {}); // 알림 실패해도 연결은 성공
    }

    return result.couple_id;
  },

  /** 커플 프로필 조회 (통계 포함) */
  getCoupleProfile: async (coupleId: string): Promise<CoupleProfile> => {
    const { data, error } = await couplesRepository.findById(coupleId);
    if (error) throw error;

    // 산책 통계 조회
    const stats = await walksService.getStats(coupleId);

    return {
      id: data.id,
      user1: {
        id: data.user1.id,
        nickname: data.user1.nickname,
        profileImageUrl: data.user1.profile_image_url ?? undefined,
        characterType: data.user1.character_type ?? 'boy',
        deletedAt: data.user1.deleted_at ?? undefined,
      },
      user2: {
        id: data.user2?.id ?? '',
        nickname: data.user2?.nickname ?? '',
        profileImageUrl: data.user2?.profile_image_url ?? undefined,
        characterType: data.user2?.character_type ?? 'boy',
        deletedAt: data.user2?.deleted_at ?? undefined,
      },
      startDate: data.start_date,
      firstMetDate: data.first_met_date ?? undefined,
      totalWalks: stats.totalWalks,
      currentStreak: stats.currentStreak,
    };
  },

  /** 처음 만난 날 설정 */
  updateFirstMetDate: async (coupleId: string, date: string) => {
    const { error } = await couplesRepository.updateCouple(coupleId, {
      first_met_date: date,
    });
    if (error) throw error;
  },

  /** 커플 연결 해제 */
  disconnect: async (coupleId: string, _user1Id: string, _user2Id: string) => {
    const { data: result, error } =
      await couplesRepository.disconnectTransaction({ p_couple_id: coupleId });
    if (error) throw error;
    if (result?.success) return;

    if (result?.reason === 'partner_deleted') {
      throw new Error(
        '탈퇴한 연인과의 커플은 해제할 수 없어요. 함께한 기록은 계속 보관돼요.',
      );
    }
    throw new Error('커플 연결 해제에 실패했어요');
  },
};
