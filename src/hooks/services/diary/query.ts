import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { walksService } from '@/server';
import { getMonthRange } from '@/utils/date';
import { useFieldCrypto } from '@/hooks/useCrypto';
import type { WalkDiary } from '@/types/diary';

import { useGetMeQuery } from '../user/query';

const PAGE_SIZE = 20;

function decryptEntries(walk: WalkDiary, decrypt: (v: string) => string): WalkDiary {
  const decryptEntry = (entry: WalkDiary['myEntry']) => {
    if (!entry) return entry;
    return {
      ...entry,
      memo: decrypt(entry.memo),
      diaryAnswer: entry.diaryAnswer ? decrypt(entry.diaryAnswer) : entry.diaryAnswer,
      coupleAnswer: entry.coupleAnswer ? decrypt(entry.coupleAnswer) : entry.coupleAnswer,
    };
  };
  return {
    ...walk,
    myEntry: decryptEntry(walk.myEntry),
    partnerEntry: decryptEntry(walk.partnerEntry),
  };
}

// ─── useDiaryListQuery ──────────────────────────────────

export const useDiaryListQuery = () => {
  const { data: me } = useGetMeQuery();
  const { decrypt } = useFieldCrypto();

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
    select: (data) => ({
      ...data,
      pages: data.pages.map((page) =>
        page.map((walk) => decryptEntries(walk, decrypt)),
      ),
    }),
  });
};

// ─── useDiaryDetailQuery ────────────────────────────────

export const useDiaryDetailQuery = (id: string) => {
  const { data: me } = useGetMeQuery();
  const { decrypt } = useFieldCrypto();

  return useQuery({
    queryKey: QUERY_KEYS.diary.detail(id),
    queryFn: () => walksService.getDetail(id, me!.id),
    enabled: !!id && !!me,
    select: (walk) => decryptEntries(walk, decrypt),
  });
};

// ─── useDiaryByMonthQuery ───────────────────────────────
//
// 캘린더 뷰용 — 특정 연/월에 속한 산책 목록 (entries 포함).

export const useDiaryByMonthQuery = (year: number, month: number) => {
  const { data: me } = useGetMeQuery();
  const { decrypt } = useFieldCrypto();

  return useQuery({
    queryKey: QUERY_KEYS.diary.byMonth(year, month),
    queryFn: () => {
      const { start, end } = getMonthRange(year, month);
      return walksService.listByMonth(me!.coupleId!, me!.id, start, end);
    },
    enabled: !!me?.coupleId && !!me?.id,
    staleTime: 60_000,
    select: (walks) => walks.map((walk) => decryptEntries(walk, decrypt)),
  });
};
