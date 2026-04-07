import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Box, Icon, Row, Text } from '@/components/base';
import {
  useSocialLoginMutation,
  useWebOAuthMutation,
} from '@/hooks/services/auth/mutation';
import { supabase } from '@/server/client';
import { theme } from '@/styles/theme';
import { LAYOUT, SPACING } from '@/styles/type';

// ─── Google Sign-In (네이티브 모듈 — Dev Build 전용) ─────
// Expo Go에서는 네이티브 모듈이 없으므로 웹 OAuth fallback 사용
let GoogleSignin: any = null;
let isErrorWithCode: any = null;
let isSuccessResponse: any = null;
let statusCodes: any = null;
let isGoogleNativeAvailable = false;

try {
  const mod = require('@react-native-google-signin/google-signin');
  GoogleSignin = mod.GoogleSignin;
  isErrorWithCode = mod.isErrorWithCode;
  isSuccessResponse = mod.isSuccessResponse;
  statusCodes = mod.statusCodes;

  GoogleSignin.configure({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });
  isGoogleNativeAvailable = true;
} catch {
  // Expo Go — 네이티브 모듈 없음, 웹 OAuth로 fallback
}

// ─── Component ──────────────────────────────────────────

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('auth');
  const socialLogin = useSocialLoginMutation();
  const webOAuth = useWebOAuthMutation();
  const [loadingProvider, setLoadingProvider] = useState<
    'apple' | 'google' | null
  >(null);

  // ─── Apple Sign In ─────────────────────────────────────

  const handleAppleLogin = async () => {
    try {
      setLoadingProvider('apple');

      const rawNonce = Math.random().toString(36).slice(2);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        throw new Error(t('login.error-token'));
      }

      socialLogin.mutate({
        provider: 'apple',
        idToken: credential.identityToken,
        nonce: rawNonce,
      });
    } catch (e: unknown) {
      const error = e as { code?: string };
      if (error.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert(t('login.error-title'), t('login.error-apple'));
    } finally {
      setLoadingProvider(null);
    }
  };

  // ─── Google Sign In (네이티브) ───────────────────────────

  const handleGoogleNative = async () => {
    try {
      setLoadingProvider('google');
      console.log('[Google Native] 로그인 시작');

      await GoogleSignin.hasPlayServices();
      console.log('[Google Native] Play Services 확인 완료');

      const response = await GoogleSignin.signIn();
      console.log('[Google Native] signIn response type:', typeof response);
      console.log('[Google Native] isSuccess:', isSuccessResponse(response));

      if (!isSuccessResponse(response)) {
        throw new Error('Google 인증에 실패했어요');
      }

      const idToken = response.data.idToken;
      const user = response.data.user;
      console.log('[Google Native] idToken 존재:', !!idToken);
      console.log('[Google Native] user:', JSON.stringify(user, null, 2));

      if (!idToken) {
        throw new Error(t('login.error-token'));
      }

      console.log('[Google Native] Supabase socialLogin 호출...');
      socialLogin.mutate({ provider: 'google', idToken });
    } catch (e: unknown) {
      console.error('[Google Native] 에러:', e);
      if (isErrorWithCode?.(e)) {
        const err = e as { code: string };
        console.error('[Google Native] 에러 코드:', err.code);
        if (err.code === statusCodes?.SIGN_IN_CANCELLED) return;
        if (err.code === statusCodes?.IN_PROGRESS) return;
      }
      Alert.alert(t('login.error-title'), t('login.error-google'));
    } finally {
      setLoadingProvider(null);
    }
  };

  // ─── Google Sign In (웹 OAuth — Expo Go fallback, PKCE) ──

  const handleGoogleWeb = async () => {
    try {
      setLoadingProvider('google');

      const redirectUri = makeRedirectUri({
        scheme: 'walktoo',
        path: 'auth/callback',
      });
      console.log('[OAuth] redirectUri:', redirectUri);

      // Supabase PKCE OAuth URL 생성
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data.url) {
        console.error('[OAuth] signInWithOAuth error:', error);
        throw error ?? new Error('OAuth URL 생성 실패');
      }

      console.log('[OAuth] supabase auth URL:', data.url);

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
      console.log('[OAuth] result type:', result.type);

      if (result.type !== 'success') return;
      console.log('[OAuth] result url:', result.url);

      // PKCE 흐름: URL에서 code 추출
      const url = new URL(result.url);
      const code = url.searchParams.get('code');
      console.log('[OAuth] has code:', !!code);

      if (code) {
        // PKCE code → session 교환
        const { data: sessionData, error: sessionError } =
          await supabase.auth.exchangeCodeForSession(code);
        console.log('[OAuth] session exchange result:', !!sessionData.session, sessionError);

        if (sessionError) throw sessionError;

        // webOAuth mutation으로 프로필 조회 등 후처리
        const session = sessionData.session!;
        webOAuth.mutate({
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
        });
      } else {
        // implicit 흐름 fallback: fragment에서 토큰 추출
        const hashParams = new URLSearchParams(result.url.split('#')[1] ?? '');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        console.log('[OAuth] has accessToken:', !!accessToken);
        console.log('[OAuth] has refreshToken:', !!refreshToken);

        if (!accessToken || !refreshToken) {
          throw new Error(t('login.error-token'));
        }
        webOAuth.mutate({ accessToken, refreshToken });
      }
    } catch (e) {
      console.error('[OAuth] error:', e);
      Alert.alert(t('login.error-title'), t('login.error-google'));
    } finally {
      setLoadingProvider(null);
    }
  };

  // ─── Google 핸들러 분기 ────────────────────────────────

  const handleGoogleLogin = isGoogleNativeAvailable
    ? handleGoogleNative
    : handleGoogleWeb;

  const isLoading =
    loadingProvider !== null || socialLogin.isPending || webOAuth.isPending;

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: insets.bottom + LAYOUT.bottomSafe },
      ]}
    >
      {/* ── 브랜드 영역 ── */}
      <Box flex={1} center>
        <Text variant="displayLarge" color="primary">
          {t('login.brand')}
        </Text>
        <Text variant="bodyLarge" color="textSecondary" mt="md">
          {t('login.tagline')}
        </Text>
      </Box>

      {/* ── 소셜 로그인 버튼 ── */}
      <Box px="xxl">
        {/* Apple — iOS만 */}
        {Platform.OS === 'ios' && (
          <Pressable
            style={[styles.socialBtn, styles.appleBtn]}
            onPress={handleAppleLogin}
            disabled={isLoading}
          >
            <Row style={styles.socialBtnInner}>
              <Icon name="apple" size={20} color={theme.colors.white} />
              <Text variant="bodyMedium" color="white" ml="sm">
                {loadingProvider === 'apple' ? t('login.loading') : t('login.apple')}
              </Text>
            </Row>
          </Pressable>
        )}

        {/* Google — 항상 표시 (네이티브 or 웹 OAuth) */}
        <Pressable
          style={[styles.socialBtn, styles.googleBtn]}
          onPress={handleGoogleLogin}
          disabled={isLoading}
        >
          <Row style={styles.socialBtnInner}>
            <Icon name="google" size={18} color={theme.colors.text} />
            <Text variant="bodyMedium" color="text" ml="sm">
              {loadingProvider === 'google' ? t('login.loading') : t('login.google')}
            </Text>
          </Row>
        </Pressable>

        <Text variant="caption" color="textMuted" align="center" mt="lg">
          {t('login.terms')}
        </Text>
      </Box>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  socialBtn: {
    height: 52,
    borderRadius: theme.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  socialBtnInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleBtn: {
    backgroundColor: '#000000',
  },
  googleBtn: {
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
});
