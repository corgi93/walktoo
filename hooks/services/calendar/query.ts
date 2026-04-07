/**
 * useCalendarMonthQuery
 *
 * 캘린더 한 달 분량의 데이터를 한 번에 통합해주는 훅.
 * 내부적으로는 walks/stamps/reflection을 각각 React Query로 가져와서 합산.
 *
 * - walks:      그 달에 작성된 산책 기록 (date BETWEEN)
 * - stamps:     그 달에 받은 추억의 발자국 날짜 배열
 * - reflection: 그 달의 회고 (있으면 1개, 없으면 null) — listPastReflections 결과를 클라 필터
 *
 * 호출부에서는 isLoading만 보고 placeholder 처리하면 됨.
 */

import { useMemo } from 'react';

import { useDiaryByMonthQuery } from '@/hooks/services/diary/query';
import { useReflectionListQuery } from '@/hooks/services/reflections/query';
import { useStampsByMonthQuery } from '@/hooks/services/stamps/query';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import type { WalkDiary } from '@/types/diary';
import type { MonthlyReflection } from '@/types/reflection';

export interface CalendarMonthData {
  walks: WalkDiary[];
  stamps: string[]; // 'YYYY-MM-DD' 배열
  reflection: MonthlyReflection | null;
  isLoading: boolean;
}

export const useCalendarMonthQuery = (
  year: number,
  month: number,
): CalendarMonthData => {
  const { couple, isCoupleConnected } = usePartnerDerivation();
  const coupleId = isCoupleConnected ? couple?.id : undefined;

  const walksQuery = useDiaryByMonthQuery(year, month);
  const stampsQuery = useStampsByMonthQuery(coupleId, year, month);
  const reflectionListQuery = useReflectionListQuery(coupleId);

  // 회고 목록은 flat이라 클라에서 필터
  const reflection = useMemo<MonthlyReflection | null>(() => {
    const list = reflectionListQuery.data ?? [];
    return list.find((r) => r.year === year && r.month === month) ?? null;
  }, [reflectionListQuery.data, year, month]);

  const isLoading =
    walksQuery.isLoading || stampsQuery.isLoading || reflectionListQuery.isLoading;

  return {
    walks: walksQuery.data ?? [],
    stamps: stampsQuery.data ?? [],
    reflection,
    isLoading,
  };
};
