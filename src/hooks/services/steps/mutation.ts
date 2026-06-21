import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { dailyStepsService } from '@/server/daily-steps';

export const useSyncStepsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, steps }: { userId: string; steps: number }) => {
      await dailyStepsService.syncSteps(userId, steps);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.steps.today });
    },
  });
};
