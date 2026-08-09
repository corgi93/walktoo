import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { entitlementsService } from '@/server/entitlements';

import { useGetMeQuery } from '../user/query';

/**
 * 커플 패스 entitlement 종합 상태.
 *
 * 우선순위:
 * 1. 본인 has_premium = true + premium_expires_at 기간 내
 * 2. 커플 has_premium = true + premium_expires_at 기간 내
 * 3. 앱 진입 시 RevenueCat/Supabase 상태를 self-healing으로 동기화
 *
 * 기간 내 결제 상태가 본인이나 커플 중 한 곳에 있으면 isEntitled = true.
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
