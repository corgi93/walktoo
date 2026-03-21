import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { notificationsService } from '@/server';
import { useGetMeQuery } from '../user/query';

// ─── useNotificationListQuery ────────────────────────────

export const useNotificationListQuery = () => {
  const { data: me } = useGetMeQuery();

  return useInfiniteQuery({
    queryKey: QUERY_KEYS.notification.list,
    queryFn: ({ pageParam = 1 }) =>
      notificationsService.getList(me!.id, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.length === 20 ? lastPageParam + 1 : undefined,
    enabled: !!me?.id,
  });
};

// ─── useUnreadCountQuery ─────────────────────────────────

export const useUnreadCountQuery = () => {
  const { data: me } = useGetMeQuery();

  return useQuery({
    queryKey: QUERY_KEYS.notification.unreadCount,
    queryFn: () => notificationsService.getUnreadCount(me!.id),
    enabled: !!me?.id,
    refetchInterval: 30_000, // 30초마다 폴링
  });
};
