import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { authService, couplesService } from '@/server';

// ─── useUpdateProfileMutation ───────────────────────────

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: {
      nickname?: string;
      phone?: string;
      profileImageUrl?: string;
    }) => {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('로그인이 필요합니다');
      return couplesService.updateProfile(user.id, updates);
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(QUERY_KEYS.user.me, updatedProfile);
    },
  });
};
