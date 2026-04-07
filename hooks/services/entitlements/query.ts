import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { entitlementsService } from '@/server/entitlements';

import { useGetMeQuery } from '../user/query';

/**
 * walkToo+ entitlement 종합 상태.
 *
 * 우선순위:
 * 1. 본인 has_premium = true (평생 이용권 결제)
 * 2. 커플 has_premium = true (상대가 결제)
 * 3. premium_trial_ends_at > now() (트라이얼 활성)
 *
 * 셋 중 하나라도 true면 isEntitled = true.
 */
export const useEntitlementQuery = () => {
  const { data: me } = useGetMeQuery();
  return useQuery({
    queryKey: QUERY_KEYS.entitlement.status,
    queryFn: () => entitlementsService.getStatus(),
    enabled: !!me?.id,
    staleTime: 30_000,
  });
};
