import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useGetMeQuery } from './services/user/query';
import { useMyStepsTodayQuery } from './services/steps/query';
import { useSyncStepsMutation } from './services/steps/mutation';
import { usePedometer } from './usePedometer';

const SYNC_INTERVAL = 60_000; // 60초마다 동기화

/**
 * 걸음수를 주기적으로 Supabase에 동기화
 * - 센서 값이 0이면 DB에 저장된 값을 fallback으로 사용 (앱 재설치 대응)
 * - 60초마다 자동 업로드
 * - 앱이 백그라운드로 갈 때 즉시 업로드
 */
export function useStepSync() {
  const { data: me } = useGetMeQuery();
  const { steps: sensorSteps } = usePedometer();
  const { data: dbSteps } = useMyStepsTodayQuery(me?.id);
  const syncSteps = useSyncStepsMutation();
  const lastSyncedSteps = useRef(0);

  // 센서 값이 있으면 센서 우선, 없으면 DB fallback
  // 센서가 0이고 DB에 값이 있으면 → 앱 재설치 상황
  const steps = sensorSteps > 0 ? sensorSteps : (dbSteps ?? 0);

  // 60초 주기 동기화 (센서 값이 있을 때만 DB 업데이트)
  useEffect(() => {
    if (!me?.id || sensorSteps <= 0) return;

    const doSync = () => {
      if (sensorSteps !== lastSyncedSteps.current) {
        syncSteps.mutate(
          { userId: me.id, steps: sensorSteps },
          {
            onSuccess: () => {
              console.log(`[StepSync] synced ${sensorSteps} steps`);
            },
            onError: (err) => {
              console.warn('[StepSync] sync failed:', err);
            },
          },
        );
        lastSyncedSteps.current = sensorSteps;
      }
    };

    const interval = setInterval(doSync, SYNC_INTERVAL);

    // 최초 1회 즉시 동기화
    doSync();

    return () => clearInterval(interval);
  }, [me?.id, sensorSteps]);

  // 앱 백그라운드 진입 시 즉시 동기화
  useEffect(() => {
    if (!me?.id) return;

    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'background' && sensorSteps > 0 && sensorSteps !== lastSyncedSteps.current) {
        syncSteps.mutate({ userId: me.id, steps: sensorSteps });
        lastSyncedSteps.current = sensorSteps;
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [me?.id, sensorSteps]);

  return { steps, synced: lastSyncedSteps.current === sensorSteps };
}
