import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { authService, couplesService } from '@/server';
import { useAuthStore } from '@/stores/authStore';
import { useCoupleStore } from '@/stores/coupleStore';
import { useLoadingStore } from '@/stores/loadingStore';
import { usePermissionStore } from '@/stores/permissionStore';
import type { UserResponse } from '@/types/user';
import type { SignInInput, SignUpInput } from '@/types';

// ─── 로그인 후 라우팅 헬퍼 ──────────────────────────────

const routeAfterLogin = (profile: UserResponse) => {
  if (!profile.isProfileComplete) {
    router.replace('/profile-setup');
  } else {
    const { hasCompletedOnboarding } = usePermissionStore.getState();
    router.replace(hasCompletedOnboarding ? '/(tabs)' : '/permissions');
  }
};

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
      routeAfterLogin(profile);
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
      routeAfterLogin(profile);
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
      routeAfterLogin(profile);
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
      routeAfterLogin(profile);
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

// ─── useDeleteAccountMutation ───────────────────────────
// 계정 삭제 (커플 데이터 보존형 소프트 삭제)

export const useDeleteAccountMutation = () => {
  const { clearUser } = useAuthStore();
  const { clearCouple } = useCoupleStore();
  const queryClient = useQueryClient();
  const { showLoading, hideLoading } = useLoadingStore();

  return useMutation({
    mutationFn: () => {
      showLoading();
      return authService.deleteAccount();
    },
    onSuccess: async () => {
      hideLoading();
      clearUser();
      clearCouple();
      queryClient.clear();

      try {
        const { GoogleSignin } = require('@react-native-google-signin/google-signin');
        await GoogleSignin.signOut();
      } catch {
        // 네이티브 모듈 없는 환경(Expo Go 등)에서는 무시
      }

      router.replace('/login');
    },
    onError: () => {
      // 삭제 실패 시 세션을 유지해 사용자가 다시 시도할 수 있게 한다.
      hideLoading();
    },
  });
};
