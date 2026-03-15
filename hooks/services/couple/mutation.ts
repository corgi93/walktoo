import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { authService, couplesService } from '@/server';

// ─── useCreateInviteMutation ────────────────────────────
// 초대코드 생성 (커플 만들기)

export const useCreateInviteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('로그인이 필요합니다');
      return couplesService.createInvite(user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user.me });
    },
  });
};

// ─── useJoinCoupleMutation ──────────────────────────────
// 초대코드로 커플 연결

export const useJoinCoupleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('로그인이 필요합니다');
      return couplesService.joinByCode(user.id, inviteCode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user.me });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.couple.profile });
    },
  });
};

// ─── useDisconnectCoupleMutation ────────────────────────
// 커플 연결 해제

export const useDisconnectCoupleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      coupleId,
      user1Id,
      user2Id,
    }: {
      coupleId: string;
      user1Id: string;
      user2Id: string;
    }) => {
      return couplesService.disconnect(coupleId, user1Id, user2Id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user.me });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.couple.profile });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.couple.stats });
    },
  });
};
