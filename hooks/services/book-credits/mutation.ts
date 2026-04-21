import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { bookCreditsService } from '@/server/book-credits';

/** 결제 성공 후 크레딧 +N */
export const useAddBookCreditsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (count: number) => bookCreditsService.addCredits(count),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bookCredits.status });
    },
  });
};

/** 스탬프 → 크레딧 1권 교환 */
export const useRedeemStampsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => bookCreditsService.redeemStampsForBook(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bookCredits.status });
    },
  });
};

/** 회고북 뽑기 시 크레딧 -1 */
export const useConsumeBookCreditMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => bookCreditsService.consumeCredit(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bookCredits.status });
    },
  });
};
