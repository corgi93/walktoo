import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import api from '@/api/api';
import { QUERY_KEYS } from '@/constants/keys';
import { WalkDiary } from '@/types';

const PAGE_SIZE = 10;

// ─── useDiaryListQuery ──────────────────────────────────

export const useDiaryListQuery = () => {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.diary.list,
    queryFn: ({ pageParam = 0 }) => api.diary.getList(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return lastPageParam + 1;
    },
  });
};

// ─── useDiaryDetailQuery ────────────────────────────────

export const useDiaryDetailQuery = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.diary.detail(id),
    queryFn: () => api.diary.getDetail(id),
    enabled: !!id,
  });
};
