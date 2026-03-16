import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { authService, couplesService } from '@/server';
import { useAuthStore } from '@/stores/authStore';
import { useCoupleStore } from '@/stores/coupleStore';
import type { SignInInput, SignUpInput } from '@/types';

// ─── useSignUpMutation ──────────────────────────────────

export const useSignUpMutation = () => {
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: async ({ email, password, nickname, phone }: SignUpInput) => {
      const { profile } = await authService.signUp(
        email,
        password,
        nickname,
        phone,
      );
      return profile;
    },
    onSuccess: (profile) => {
      setUser(profile);
      router.replace('/(tabs)');
    },
  });
};

// ─── useLoginMutation ───────────────────────────────────

export const useLoginMutation = () => {
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: async ({ email, password }: SignInInput) => {
      const { user } = await authService.signIn(email, password);
      const profile = await couplesService.getMyProfile(user.id);
      return profile;
    },
    onSuccess: (profile) => {
      setUser(profile);
      router.replace('/(tabs)');
    },
  });
};

// ─── useSocialLoginMutation ─────────────────────────────

export const useSocialLoginMutation = () => {
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: async ({
      provider,
      idToken,
      nonce,
    }: {
      provider: 'apple' | 'google';
      idToken: string;
      nonce?: string;
    }) => {
      const { profile } = await authService.signInWithSocial(
        provider,
        idToken,
        nonce,
      );
      return profile;
    },
    onSuccess: (profile) => {
      setUser(profile);
      router.replace('/permissions');
    },
  });
};

// ─── useWebOAuthMutation (Expo Go fallback) ─────────────

export const useWebOAuthMutation = () => {
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: async ({
      accessToken,
      refreshToken,
    }: {
      accessToken: string;
      refreshToken: string;
    }) => {
      const { profile } = await authService.handleOAuthCallback(
        accessToken,
        refreshToken,
      );
      return profile;
    },
    onSuccess: (profile) => {
      setUser(profile);
      router.replace('/permissions');
    },
  });
};

// ─── useLogoutMutation ──────────────────────────────────

export const useLogoutMutation = () => {
  const { clearUser } = useAuthStore();
  const { clearCouple } = useCoupleStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.signOut(),
    onSuccess: () => {
      clearUser();
      clearCouple();
      queryClient.clear();
      router.replace('/login');
    },
    onError: () => {
      clearUser();
      clearCouple();
      queryClient.clear();
      router.replace('/login');
    },
  });
};
