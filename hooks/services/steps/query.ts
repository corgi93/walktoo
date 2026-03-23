import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { dailyStepsService } from '@/server/daily-steps';

/**
 * 상대방의 오늘 걸음수 조회
 * 30초마다 자동 refetch
 */
export const usePartnerStepsQuery = (partnerId: string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.steps.partner,
    queryFn: () => dailyStepsService.getPartnerSteps(partnerId!),
    enabled: !!partnerId,
    refetchInterval: 30_000, // 30초마다 상대방 걸음수 갱신
    staleTime: 10_000,
  });
};
