import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/keys';

/**
 * Pull-to-refresh 훅
 * 각 탭에서 공통으로 사용
 *
 * @param extraKeys - 추가로 invalidate할 queryKey 배열
 * @returns { refreshing, onRefresh } - RefreshControl에 전달
 *
 * @example
 * const { refreshing, onRefresh } = useRefresh();
 * <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} />
 */
export function useRefresh(extraKeys?: readonly (readonly string[])[]) {
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    // 공통 쿼리 리프레시
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user.me }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.couple.profile }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.couple.stats }),
      // 추가 키가 있으면 같이 invalidate
      ...(extraKeys?.map((key) =>
        queryClient.invalidateQueries({ queryKey: key }),
      ) ?? []),
    ]);

    setRefreshing(false);
  }, [queryClient, extraKeys]);

  return { refreshing, onRefresh };
}
