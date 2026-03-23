import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useGetMeQuery } from './services/user/query';
import { useSyncStepsMutation } from './services/steps/mutation';
import { usePedometer } from './usePedometer';

const SYNC_INTERVAL = 60_000; // 60초마다 동기화

/**
 * 걸음수를 주기적으로 Supabase에 동기화
 * - 60초마다 자동 업로드
 * - 앱이 백그라운드로 갈 때 즉시 업로드
 */
export function useStepSync() {
  const { data: me } = useGetMeQuery();
  const { steps } = usePedometer();
  const syncSteps = useSyncStepsMutation();
  const lastSyncedSteps = useRef(0);

  // 60초 주기 동기화
  useEffect(() => {
    if (!me?.id || steps <= 0) return;

    const interval = setInterval(() => {
      if (steps !== lastSyncedSteps.current) {
        syncSteps.mutate({ userId: me.id, steps });
        lastSyncedSteps.current = steps;
      }
    }, SYNC_INTERVAL);

    // 최초 1회 즉시 동기화
    if (steps > 0 && steps !== lastSyncedSteps.current) {
      syncSteps.mutate({ userId: me.id, steps });
      lastSyncedSteps.current = steps;
    }

    return () => clearInterval(interval);
  }, [me?.id, steps]);

  // 앱 백그라운드 진입 시 즉시 동기화
  useEffect(() => {
    if (!me?.id) return;

    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'background' && steps > 0 && steps !== lastSyncedSteps.current) {
        syncSteps.mutate({ userId: me.id, steps });
        lastSyncedSteps.current = steps;
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [me?.id, steps]);

  return { steps, synced: lastSyncedSteps.current === steps };
}
