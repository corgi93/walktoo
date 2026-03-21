import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { notificationsService } from '@/server';
import { useGetMeQuery } from '../user/query';

// ─── useMarkAsReadMutation ───────────────────────────────

export const useMarkAsReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notification.list,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notification.unreadCount,
      });
    },
  });
};

// ─── useMarkAllAsReadMutation ────────────────────────────

export const useMarkAllAsReadMutation = () => {
  const queryClient = useQueryClient();
  const { data: me } = useGetMeQuery();

  return useMutation({
    mutationFn: () => notificationsService.markAllAsRead(me!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notification.list,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notification.unreadCount,
      });
    },
  });
};

// ─── useNudgeMutation ────────────────────────────────────
// 톡톡! (상대방에게 기록 요청)

export const useNudgeMutation = () => {
  const queryClient = useQueryClient();
  const { data: me } = useGetMeQuery();

  return useMutation({
    mutationFn: async ({
      recipientId,
      coupleId,
      walkId,
    }: {
      recipientId: string;
      coupleId: string;
      walkId: string;
    }) => {
      if (!me) throw new Error('로그인이 필요합니다');
      await notificationsService.notifyNudge(
        recipientId,
        me.id,
        coupleId,
        me.nickname,
        walkId,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notification.list,
      });
    },
  });
};

// ─── useSavePushTokenMutation ────────────────────────────

export const useSavePushTokenMutation = () => {
  return useMutation({
    mutationFn: ({ userId, token }: { userId: string; token: string }) =>
      notificationsService.savePushToken(userId, token),
  });
};
