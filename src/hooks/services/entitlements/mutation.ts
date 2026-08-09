import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import {
  entitlementsService,
  type PremiumPurchaseSyncInput,
} from '@/server/entitlements';

/**
 * RevenueCat 결제 성공 후 호출.
 * 커플 패스 결제를 본인/커플 entitlement로 동기화한다.
 */
export const useMarkPremiumPurchasedMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PremiumPurchaseSyncInput) =>
      entitlementsService.markPremiumPurchased(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entitlement.status });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user.me });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.couple.profile });
    },
  });
};

/**
 * RevenueCat 결제 성공 후 호출.
 * 여행 무드 테마팩 결제를 본인/커플 entitlement로 동기화한다.
 */
export const useMarkThemePackPurchasedMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (revenuecatUserId: string) =>
      entitlementsService.markThemePackPurchased(revenuecatUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entitlement.status });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user.me });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.couple.profile });
    },
  });
};
