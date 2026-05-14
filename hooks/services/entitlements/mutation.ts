import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { entitlementsService } from '@/server/entitlements';

/**
 * RevenueCat 결제 성공 후 호출.
 * 본인 has_premium = true + 커플 has_premium = true 동시 set.
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
