import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { walksService } from '@/server';
import { getMonthRange } from '@/utils/date';

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

// ─── useDiaryByMonthQuery ───────────────────────────────
//
// 캘린더 뷰용 — 특정 연/월에 속한 산책 목록 (entries 포함).

export const useDiaryByMonthQuery = (year: number, month: number) => {
  const { data: me } = useGetMeQuery();

  return useQuery({
    queryKey: QUERY_KEYS.diary.byMonth(year, month),
    queryFn: () => {
      const { start, end } = getMonthRange(year, month);
      return walksService.listByMonth(me!.coupleId!, me!.id, start, end);
    },
    enabled: !!me?.coupleId && !!me?.id,
    staleTime: 60_000,
  });
};
