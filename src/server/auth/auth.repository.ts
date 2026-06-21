import { supabase } from '../client';

// ─── Auth Repository (Supabase Auth 직접 호출) ─────────

export const authRepository = {
  signUp: (email: string, password: string, metadata?: Record<string, string>) =>
    supabase.auth.signUp({
      email,
      password,
      options: metadata ? { data: metadata } : undefined,
    }),

  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),

  /** 소셜 로그인 (Apple / Google) — ID 토큰 기반 */
  signInWithIdToken: (
    provider: 'apple' | 'google',
    idToken: string,
    nonce?: string,
  ) =>
    supabase.auth.signInWithIdToken({
      provider,
      token: idToken,
      ...(nonce ? { nonce } : {}),
    }),

  /** 웹 기반 OAuth URL 생성 (Expo Go fallback) */
  getOAuthUrl: (provider: 'google', redirectTo: string) =>
    supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    }),

  /** 토큰으로 세션 설정 (웹 OAuth 콜백 처리) */
  setSession: (accessToken: string, refreshToken: string) =>
    supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    }),

  signOut: () => supabase.auth.signOut(),

  getSession: () => supabase.auth.getSession(),

  getUser: () => supabase.auth.getUser(),

  refreshSession: () => supabase.auth.refreshSession(),

  onAuthStateChange: (
    callback: Parameters<typeof supabase.auth.onAuthStateChange>[0],
  ) => supabase.auth.onAuthStateChange(callback),
};
