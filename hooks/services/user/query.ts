import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { authService, couplesService } from '@/server';

// ─── useGetMeQuery ──────────────────────────────────────
// Supabase Auth 현재 유저 → profiles 테이블 프로필 조회

export const useGetMeQuery = () => {
  return useQuery({
    queryKey: QUERY_KEYS.user.me,
    queryFn: async () => {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('로그인이 필요합니다');
      return couplesService.getMyProfile(user.id);
    },
  });
};
