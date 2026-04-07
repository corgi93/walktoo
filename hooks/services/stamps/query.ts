import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { memoryStampsService } from '@/server/memory-stamps';

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
