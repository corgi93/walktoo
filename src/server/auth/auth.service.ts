import { AuthError } from '@supabase/supabase-js';

import { couplesService } from '../couples/couples.service';
import { authRepository } from './auth.repository';

// ─── Error Handling ─────────────────────────────────────

class ServerError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = 'ServerError';
  }
}

const handleAuthError = (error: AuthError | null): never | void => {
  if (!error) return;
  throw new ServerError(error.message, error.status?.toString() ?? 'UNKNOWN');
};

// ─── Auth Service (비즈니스 로직) ───────────────────────

export const authService = {
  /** 회원가입 + 프로필 생성 */
  signUp: async (
    email: string,
    password: string,
    nickname: string,
    phone?: string,
  ) => {
    // 메타데이터에 nickname/phone 전달 → DB trigger가 자동 프로필 생성
    const { data, error } = await authRepository.signUp(email, password, {
      nickname,
      phone: phone ?? '',
    });
    handleAuthError(error);

    const user = data.user!;

    // trigger로 프로필이 생성되었으므로 조회
    const profile = await couplesService.getMyProfile(user.id);

    return { user, profile };
  },

  /** 로그인 */
  signIn: async (email: string, password: string) => {
    const { data, error } = await authRepository.signIn(email, password);
    handleAuthError(error);
    return { user: data.user!, session: data.session! };
  },

  /** 소셜 로그인 (Apple / Google) */
  signInWithSocial: async (
    provider: 'apple' | 'google',
    idToken: string,
    nonce?: string,
  ) => {
    const { data, error } = await authRepository.signInWithIdToken(
      provider,
      idToken,
      nonce,
    );
    handleAuthError(error);

    const user = data.user!;

    // 프로필 조회 (첫 소셜 로그인 시 DB trigger가 프로필 자동 생성)
    const profile = await couplesService.getMyProfile(user.id);

    return { user, session: data.session!, profile };
  },

  /** 웹 기반 OAuth (Expo Go fallback) — URL 생성 */
  getOAuthUrl: async (provider: 'google', redirectTo: string) => {
    const { data, error } = await authRepository.getOAuthUrl(provider, redirectTo);
    handleAuthError(error);
    return data.url!;
  },

  /** 웹 OAuth 콜백 → 세션 설정 + 프로필 조회 */
  handleOAuthCallback: async (accessToken: string, refreshToken: string) => {
    const { data, error } = await authRepository.setSession(accessToken, refreshToken);
    handleAuthError(error);

    const user = data.user!;
    const profile = await couplesService.getMyProfile(user.id);

    return { user, session: data.session!, profile };
  },

  /** 로그아웃 */
  signOut: async () => {
    const { error } = await authRepository.signOut();
    handleAuthError(error);
  },

  /**
   * 계정 삭제.
   *
   * 커플 앱 특성상 하드 삭제하면 커플/공유 기록이 FK CASCADE로 연쇄 삭제되므로,
   * 서버 RPC(delete_my_account)가 소프트 삭제로 처리한다:
   *   - 내 프로필 익명화(PII 제거, 닉네임/사진은 공유 기록으로 보존)
   *   - 개인 전용 데이터(걸음수·알림)만 삭제, 둘이 쓴 기록은 남김
   *   - 로그인 영구 차단 → 남은 상대는 함께한 추억을 계속 볼 수 있다
   * RPC 성공 후 로컬 세션도 정리한다.
   */
  deleteAccount: async () => {
    const { error } = await authRepository.deleteAccount();
    if (error) {
      throw new ServerError(error.message, 'DELETE_ACCOUNT_FAILED');
    }
    // 로그인 세션 정리 (밴 처리되었으므로 실패해도 무시)
    await authRepository.signOut().catch(() => {});
  },

  /** 현재 세션 확인 */
  getSession: async () => {
    const { data, error } = await authRepository.getSession();
    handleAuthError(error);
    return data.session;
  },

  /** 현재 유저 정보 */
  getCurrentUser: async () => {
    const { data, error } = await authRepository.getUser();
    handleAuthError(error);
    return data.user;
  },

  /** 인증 상태 변경 리스너 */
  onAuthStateChange: authRepository.onAuthStateChange,
};
