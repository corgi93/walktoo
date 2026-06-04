import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { entitlementsService } from '@/server/entitlements';

/**
 * RevenueCat 결제 성공 후 호출.
 * 기록 업그레이드 결제를 본인/커플 entitlement로 동기화한다.
 */
export const useMarkPremiumPurchasedMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (revenuecatUserId: string) =>
      entitlementsService.markPremiumPurchased(revenuecatUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entitlement.status });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user.me });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.couple.profile });
    },
  });
};
