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
    const { data, error } = await authRepository.signUp(email, password);
    handleAuthError(error);

    const user = data.user!;

    // profiles 테이블에 프로필 생성
    const profile = await couplesService.createProfile(
      user.id,
      nickname,
      phone ?? '',
    );

    return { user, profile };
  },

  /** 로그인 */
  signIn: async (email: string, password: string) => {
    const { data, error } = await authRepository.signIn(email, password);
    handleAuthError(error);
    return { user: data.user!, session: data.session! };
  },

  /** 로그아웃 */
  signOut: async () => {
    const { error } = await authRepository.signOut();
    handleAuthError(error);
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
