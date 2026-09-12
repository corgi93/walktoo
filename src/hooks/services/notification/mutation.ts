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

// ─── useSavePushTokenMutation ────────────────────────────

export const useSavePushTokenMutation = () => {
  return useMutation({
    mutationFn: ({ userId, token }: { userId: string; token: string }) =>
      notificationsService.savePushToken(userId, token),
  });
};
