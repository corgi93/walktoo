import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { QUERY_KEYS } from '@/constants/keys';
import { authService, couplesService } from '@/server';
import { useAuthStore } from '@/stores/authStore';
import { useLoadingStore } from '@/stores/loadingStore';

// ─── useUpdateProfileMutation ───────────────────────────

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: {
      nickname?: string;
      phone?: string;
      profileImageUrl?: string;
      birthday?: string;
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

// ─── useCompleteProfileMutation ─────────────────────────

export const useCompleteProfileMutation = () => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();
  const { showLoading, hideLoading } = useLoadingStore();

  return useMutation({
    mutationFn: async (data: { nickname: string; birthday: string }) => {
      showLoading();
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('로그인이 필요합니다');
      return couplesService.updateProfile(user.id, {
        nickname: data.nickname,
        birthday: data.birthday,
        isProfileComplete: true,
      });
    },
    onSuccess: (updatedProfile) => {
      hideLoading();
      queryClient.setQueryData(QUERY_KEYS.user.me, updatedProfile);
      setUser(updatedProfile);
      router.replace('/permissions');
    },
    onError: () => {
      hideLoading();
    },
  });
};
