import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { entitlementsService } from '@/server/entitlements';

import { useGetMeQuery } from '../user/query';

/**
 * walkToo+ entitlement 종합 상태.
 *
 * 우선순위:
 * 1. 본인 has_premium = true (1회성 이용권 결제)
 * 2. 커플 has_premium = true (상대가 결제)
 * 3. 앱 진입 시 RevenueCat/Supabase 상태를 self-healing으로 동기화
 *
 * 결제 상태가 본인이나 커플 중 한 곳에 있으면 isEntitled = true.
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
