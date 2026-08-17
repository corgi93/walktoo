/**
 * useCalendarMonthQuery
 *
 * 캘린더 한 달 분량의 데이터를 한 번에 통합해주는 훅.
 * 내부적으로는 walks/stamps를 각각 React Query로 가져와서 합산.
 *
 * - walks:      그 달에 작성된 산책 기록 (date BETWEEN)
 * - stamps:     그 달에 받은 추억의 발자국 날짜 배열
 *
 * 호출부에서는 isLoading만 보고 placeholder 처리하면 됨.
 */

import { useDiaryByMonthQuery } from '@/hooks/services/diary/query';
import { useStampsByMonthQuery } from '@/hooks/services/stamps/query';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import type { WalkDiary } from '@/types/diary';

export interface CalendarMonthData {
  walks: WalkDiary[];
  stamps: string[]; // 'YYYY-MM-DD' 배열
  isLoading: boolean;
}

export const useCalendarMonthQuery = (
  year: number,
  month: number,
): CalendarMonthData => {
  const { couple, isCoupleConnected } = usePartnerDerivation();
  const coupleId = isCoupleConnected ? couple?.id : undefined;

  const walksQuery = useDiaryByMonthQuery(year, month, 'together');
  const stampsQuery = useStampsByMonthQuery(coupleId, year, month);

  const isLoading = walksQuery.isLoading || stampsQuery.isLoading;

  return {
    walks: walksQuery.data ?? [],
    stamps: stampsQuery.data ?? [],
    isLoading,
  };
};
