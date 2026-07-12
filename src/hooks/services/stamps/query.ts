import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { memoryStampsService } from '@/server/memory-stamps';
import { getMonthRange } from '@/utils/date';

/**
 * 오늘 스탬프 획득 여부
 */
export const useTodayStampQuery = (coupleId: string | undefined) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.stamps.today, coupleId],
    queryFn: () => memoryStampsService.getTodayStamp(coupleId!),
    enabled: !!coupleId,
    staleTime: 30_000,
  });
};

/**
 * 총 스탬프 개수
 */
export const useTotalStampsQuery = (enabled: boolean) => {
  return useQuery({
    queryKey: QUERY_KEYS.stamps.total,
    queryFn: () => memoryStampsService.getTotalStamps(),
    enabled,
    staleTime: 60_000,
  });
};

/**
 * 특정 월의 스탬프 받은 날짜 목록 — 캘린더 인디케이터 용도
 */
export const useStampsByMonthQuery = (
  coupleId: string | undefined,
  year: number,
  month: number,
) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.stamps.byMonth(year, month), coupleId],
    queryFn: () => {
      const { start, end } = getMonthRange(year, month);
      return memoryStampsService.listStampDatesByMonth(coupleId!, start, end);
    },
    enabled: !!coupleId,
    staleTime: 60_000,
  });
};
