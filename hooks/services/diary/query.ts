import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { walksService } from '@/server';
import { useGetMeQuery } from '../user/query';

const PAGE_SIZE = 20;

// ─── useDiaryListQuery ──────────────────────────────────

export const useDiaryListQuery = () => {
  const { data: me } = useGetMeQuery();

  return useInfiniteQuery({
    queryKey: QUERY_KEYS.diary.list,
    queryFn: ({ pageParam = 1 }) =>
      walksService.getList(me!.coupleId!, me!.id, pageParam),
    enabled: !!me?.coupleId,
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return lastPageParam + 1;
    },
  });
};

// ─── useDiaryDetailQuery ────────────────────────────────

export const useDiaryDetailQuery = (id: string) => {
  const { data: me } = useGetMeQuery();

  return useQuery({
    queryKey: QUERY_KEYS.diary.detail(id),
    queryFn: () => walksService.getDetail(id, me!.id),
    enabled: !!id && !!me,
  });
};
