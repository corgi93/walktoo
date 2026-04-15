import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { schedulesService } from '@/server/schedules';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import { getMonthRange } from '@/utils/date';

/**
 * 월별 커플 일정 목록 — 캘린더 셀 인디케이터 + DaySheet 에서 함께 사용.
 */
export const useSchedulesByMonthQuery = (year: number, month: number) => {
  const { couple, isCoupleConnected } = usePartnerDerivation();
  const coupleId = isCoupleConnected ? couple?.id : undefined;

  return useQuery({
    queryKey: [...QUERY_KEYS.schedule.byMonth(year, month), coupleId],
    queryFn: () => {
      const { start, end } = getMonthRange(year, month);
      return schedulesService.listByMonth(coupleId!, start, end);
    },
    enabled: !!coupleId,
    staleTime: 30_000,
  });
};
