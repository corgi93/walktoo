import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { entitlementsService } from '@/server/entitlements';

/**
 * 첫 로그인 시 트라이얼 시작 (idempotent).
 * 이미 set 됐으면 서버가 no-op 처리.
 */
export const useStartTrialMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => entitlementsService.startTrialIfNeeded(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entitlement.status });
    },
  });
};

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
