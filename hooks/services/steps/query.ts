import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { dailyStepsService } from '@/server/daily-steps';

/**
 * 내 오늘 걸음수 (DB 저장값)
 * 앱 재설치 시 센서가 0이면 이 값을 fallback으로 사용
 */
export const useMyStepsTodayQuery = (userId: string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.steps.today,
    queryFn: () => dailyStepsService.getMyStepsToday(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });
};

/**
 * 상대방의 오늘 걸음수 조회
 * 30초마다 자동 refetch
 */
export const usePartnerStepsQuery = (partnerId: string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.steps.partner,
    queryFn: () => dailyStepsService.getPartnerSteps(partnerId!),
    enabled: !!partnerId,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
};
