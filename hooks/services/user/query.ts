import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';

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
    refetchOnWindowFocus: true,
  });
};

// ─── useCouplePolling ────────────────────────────────────
// 초대코드 대기 중일 때 주기적으로 연결 상태 확인
// 홈 화면에서 사용

export const useCouplePolling = (coupleId?: string, isConnected?: boolean) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // 초대코드 만들었지만 아직 연결 안 된 상태에서만 폴링
    if (!coupleId || isConnected) return;

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user.me });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.couple.profile });
    }, 5000);

    return () => clearInterval(interval);
  }, [coupleId, isConnected]);

  // 앱이 포그라운드로 돌아올 때도 refetch
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user.me });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.couple.profile });
      }
    });
    return () => sub.remove();
  }, []);
};
