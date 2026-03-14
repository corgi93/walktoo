import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';

import { api } from '@/api';
import { tokenStorage } from '@/storage/secureStorage';
import { useAuthStore } from '@/stores/authStore';
import { LoginCredentials } from '@/types';

export const useLoginMutation = () => {
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      api.auth.login(credentials),
    onSuccess: async tokens => {
      await tokenStorage.saveTokens(tokens);
      const user = await api.user.getMe();
      setUser(user);
      router.replace('/(tabs)');
    },
  });
};

export const useLogoutMutation = () => {
  const { clearUser } = useAuthStore();

  return useMutation({
    mutationFn: () => api.auth.logout(),
    onSuccess: async () => {
      await tokenStorage.clearTokens();
      clearUser();
      router.replace('/login');
    },
    onError: async () => {
      await tokenStorage.clearTokens();
      clearUser();
      router.replace('/login');
    },
  });
};
