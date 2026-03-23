import type { CoupleProfile } from '@/types/couple';
import type { UserResponse } from '@/types/user';

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
    },
  ): Promise<UserResponse> => {
    const { data, error } = await couplesRepository.updateProfile(userId, {
      nickname: updates.nickname,
      phone: updates.phone,
      profile_image_url: updates.profileImageUrl,
      birthday: updates.birthday,
      is_profile_complete: updates.isProfileComplete,
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
    // 1. 이미 커플인지 확인
    const { data: myProfile } = await couplesRepository.getProfile(userId);
    if (myProfile?.couple_id) {
      // 대기 중인 내 초대가 있으면 → 취소하고 상대방 코드로 연결
      const { data: myCouple } = await couplesRepository.findById(
        myProfile.couple_id,
      );
      if (myCouple && !myCouple.user2) {
        // 내 대기 중인 초대 삭제
        await couplesRepository.updateProfile(userId, { couple_id: null });
        await couplesRepository.deleteCouple(myCouple.id);
      } else {
        // 이미 연결 완료된 커플
        throw new Error('이미 연결된 커플이 있어요');
      }
    }

    // 2. 코드로 커플 찾기
    const { data: couple, error: findError } =
      await couplesRepository.findByInviteCode(inviteCode);
    if (findError) throw new Error('유효하지 않은 초대코드입니다');

    // 3. 만료 확인 (24시간)
    const createdAt = new Date(couple.created_at).getTime();
    const now = Date.now();
    const EXPIRE_MS = 24 * 60 * 60 * 1000; // 24시간
    if (now - createdAt > EXPIRE_MS) {
      throw new Error('만료된 초대코드입니다. 새 코드를 요청해주세요');
    }

    // 4. 본인 커플에 참여 방지
    if (couple.user1_id === userId) {
      throw new Error('본인의 초대코드입니다');
    }

    // 5. 커플 연결
    const { data, error } = await couplesRepository.join(couple.id, {
      user2_id: userId,
      start_date: new Date().toISOString().split('T')[0],
    });
    if (error) throw error;

    // 6. 양쪽 프로필에 couple_id 연결
    await couplesRepository.updateProfile(userId, { couple_id: data.id });
    await couplesRepository.updateProfile(couple.user1_id, {
      couple_id: data.id,
    });

    // 7. user1에게 커플 연결 알림
    const joinerProfile = await couplesRepository.getProfile(userId);
    if (joinerProfile.data) {
      notificationsService.notifyCoupleJoined(
        couple.user1_id,
        userId,
        data.id,
        joinerProfile.data.nickname,
      ).catch(() => {}); // 알림 실패해도 연결은 성공
    }

    return data.id;
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
      },
      user2: {
        id: data.user2?.id ?? '',
        nickname: data.user2?.nickname ?? '',
        profileImageUrl: data.user2?.profile_image_url ?? undefined,
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
  disconnect: async (coupleId: string, user1Id: string, user2Id: string) => {
    await couplesRepository.updateProfile(user1Id, { couple_id: null });
    await couplesRepository.updateProfile(user2Id, { couple_id: null });
    await couplesRepository.disconnect(coupleId);
  },
};
