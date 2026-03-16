import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box, Icon, Row, Text } from '@/components/base';
import {
  useSocialLoginMutation,
  useWebOAuthMutation,
} from '@/hooks/services/auth/mutation';
import { authService } from '@/server';
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
        throw new Error('Apple 인증 토큰을 받지 못했어요');
      }

      socialLogin.mutate({
        provider: 'apple',
        idToken: credential.identityToken,
        nonce: rawNonce,
      });
    } catch (e: unknown) {
      const error = e as { code?: string };
      if (error.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('로그인 실패', 'Apple 로그인 중 문제가 발생했어요');
    } finally {
      setLoadingProvider(null);
    }
  };

  // ─── Google Sign In (네이티브) ───────────────────────────

  const handleGoogleNative = async () => {
    try {
      setLoadingProvider('google');

      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) {
        throw new Error('Google 인증에 실패했어요');
      }

      const idToken = response.data.idToken;
      if (!idToken) {
        throw new Error('Google ID 토큰을 받지 못했어요');
      }

      socialLogin.mutate({ provider: 'google', idToken });
    } catch (e: unknown) {
      if (isErrorWithCode?.(e)) {
        const err = e as { code: string };
        if (err.code === statusCodes?.SIGN_IN_CANCELLED) return;
        if (err.code === statusCodes?.IN_PROGRESS) return;
      }
      Alert.alert('로그인 실패', 'Google 로그인 중 문제가 발생했어요');
    } finally {
      setLoadingProvider(null);
    }
  };

  // ─── Google Sign In (웹 OAuth — Expo Go fallback) ───────

  const handleGoogleWeb = async () => {
    try {
      setLoadingProvider('google');

      const redirectUri = makeRedirectUri();
      const url = await authService.getOAuthUrl('google', redirectUri);

      const result = await WebBrowser.openAuthSessionAsync(url, redirectUri);

      if (result.type !== 'success') return; // 유저가 취소

      // Supabase는 #fragment에 access_token, refresh_token 전달
      const hashParams = new URLSearchParams(
        result.url.split('#')[1] ?? '',
      );
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (!accessToken || !refreshToken) {
        throw new Error('인증 토큰을 받지 못했어요');
      }

      webOAuth.mutate({ accessToken, refreshToken });
    } catch {
      Alert.alert('로그인 실패', 'Google 로그인 중 문제가 발생했어요');
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
          walkToo
        </Text>
        <Text variant="bodyLarge" color="textSecondary" mt="md">
          우리 둘의 걸음, 하나의 이야기
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
                {loadingProvider === 'apple'
                  ? '로그인 중...'
                  : 'Apple로 시작하기'}
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
              {loadingProvider === 'google'
                ? '로그인 중...'
                : 'Google로 시작하기'}
            </Text>
          </Row>
        </Pressable>

        <Text
          variant="caption"
          color="textMuted"
          align="center"
          mt="lg"
        >
          시작하기를 누르면 서비스 이용약관에 동의합니다
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
