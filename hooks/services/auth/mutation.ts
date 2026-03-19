import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { authService, couplesService } from '@/server';
import { useAuthStore } from '@/stores/authStore';
import { useCoupleStore } from '@/stores/coupleStore';
import { useLoadingStore } from '@/stores/loadingStore';
import type { SignInInput, SignUpInput } from '@/types';

// ─── useSignUpMutation ──────────────────────────────────

export const useSignUpMutation = () => {
  const { setUser } = useAuthStore();
  const { showLoading, hideLoading } = useLoadingStore();

  return useMutation({
    mutationFn: async ({ email, password, nickname, phone }: SignUpInput) => {
      showLoading();
      const { profile } = await authService.signUp(
        email,
        password,
        nickname,
        phone,
      );
      return profile;
    },
    onSuccess: (profile) => {
      hideLoading();
      setUser(profile);
      router.replace('/(tabs)');
    },
    onError: () => {
      hideLoading();
    },
  });
};

// ─── useLoginMutation ───────────────────────────────────

export const useLoginMutation = () => {
  const { setUser } = useAuthStore();
  const { showLoading, hideLoading } = useLoadingStore();

  return useMutation({
    mutationFn: async ({ email, password }: SignInInput) => {
      showLoading();
      const { user } = await authService.signIn(email, password);
      const profile = await couplesService.getMyProfile(user.id);
      return profile;
    },
    onSuccess: (profile) => {
      hideLoading();
      setUser(profile);
      router.replace('/(tabs)');
    },
    onError: () => {
      hideLoading();
    },
  });
};

// ─── useSocialLoginMutation ─────────────────────────────

export const useSocialLoginMutation = () => {
  const { setUser } = useAuthStore();
  const { showLoading, hideLoading } = useLoadingStore();

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
      showLoading();
      const { profile } = await authService.signInWithSocial(
        provider,
        idToken,
        nonce,
      );
      return profile;
    },
    onSuccess: (profile) => {
      hideLoading();
      console.log('[SocialLogin] 성공! user:', profile?.id, profile?.nickname);
      setUser(profile);
      router.replace('/(tabs)');
    },
    onError: (error) => {
      hideLoading();
      console.error('[SocialLogin] 실패:', error);
    },
  });
};

// ─── useWebOAuthMutation (Expo Go fallback) ─────────────

export const useWebOAuthMutation = () => {
  const { setUser } = useAuthStore();
  const { showLoading, hideLoading } = useLoadingStore();

  return useMutation({
    mutationFn: async ({
      accessToken,
      refreshToken,
    }: {
      accessToken: string;
      refreshToken: string;
    }) => {
      showLoading();
      const { profile } = await authService.handleOAuthCallback(
        accessToken,
        refreshToken,
      );
      return profile;
    },
    onSuccess: (profile) => {
      hideLoading();
      console.log('[WebOAuth] 성공! user:', profile?.id, profile?.nickname);
      setUser(profile);
      router.replace('/(tabs)');
    },
    onError: () => {
      hideLoading();
    },
  });
};

// ─── useLogoutMutation ──────────────────────────────────

export const useLogoutMutation = () => {
  const { clearUser } = useAuthStore();
  const { clearCouple } = useCoupleStore();
  const queryClient = useQueryClient();
  const { showLoading, hideLoading } = useLoadingStore();

  const cleanup = async () => {
    hideLoading();
    clearUser();
    clearCouple();
    queryClient.clear();

    // Google 네이티브 로그인 세션 초기화 → 다음 로그인 시 계정 선택기 표시
    try {
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      await GoogleSignin.signOut();
    } catch {
      // Expo Go 등 네이티브 모듈 없는 환경에서는 무시
    }

    router.replace('/login');
  };

  return useMutation({
    mutationFn: () => {
      showLoading();
      return authService.signOut();
    },
    onSuccess: cleanup,
    onError: cleanup,
  });
};
