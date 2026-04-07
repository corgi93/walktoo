import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';
import { reflectionsService } from '@/server/reflections';

/**
 * 이달의 회고 (없으면 RPC로 자동 생성)
 */
export const useCurrentReflectionQuery = (coupleId: string | undefined) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.reflection.current, coupleId],
    queryFn: () => reflectionsService.getOrCreateCurrentReflection(coupleId!),
    enabled: !!coupleId,
    staleTime: 60_000,
  });
};

/**
 * 회고 상세 (내 답변 + 상대방 답변)
 */
export const useReflectionDetailQuery = (
  reflectionId: string | undefined,
  myUserId: string | undefined,
) => {
  return useQuery({
    queryKey: reflectionId
      ? QUERY_KEYS.reflection.detail(reflectionId)
      : ['reflection', 'detail', 'none'],
    queryFn: () =>
      reflectionsService.getReflectionWithAnswers(reflectionId!, myUserId!),
    enabled: !!reflectionId && !!myUserId,
  });
};

/**
 * 지난 회고 목록
 */
export const useReflectionListQuery = (coupleId: string | undefined) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.reflection.list, coupleId],
    queryFn: () => reflectionsService.listPastReflections(coupleId!),
    enabled: !!coupleId,
  });
};
