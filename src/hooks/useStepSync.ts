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

  // 클로저가 최신 값을 참조하도록 ref에 동기화
  const sensorStepsRef = useRef(sensorSteps);
  const meIdRef = useRef(me?.id);
  useEffect(() => { sensorStepsRef.current = sensorSteps; }, [sensorSteps]);
  useEffect(() => { meIdRef.current = me?.id; }, [me?.id]);

  // 60초 주기 동기화 — me.id 바뀔 때만 interval 재생성
  // sensorSteps를 deps에 넣으면 걸음 업데이트마다 interval 재생성 + 즉시 sync 호출됨
  useEffect(() => {
    if (!me?.id || sensorSteps <= 0) return;

    const doSync = () => {
      const steps = sensorStepsRef.current;
      const userId = meIdRef.current;
      if (!userId || steps <= 0 || steps === lastSyncedSteps.current) return;
      syncSteps.mutate(
        { userId, steps },
        {
          onSuccess: () => console.log(`[StepSync] synced ${steps} steps`),
          onError: (err) => console.warn('[StepSync] sync failed:', err),
        },
      );
      lastSyncedSteps.current = steps;
    };

    const interval = setInterval(doSync, SYNC_INTERVAL);
    doSync(); // 최초 1회 즉시

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id]);

  // 앱 백그라운드 진입 시 즉시 동기화
  useEffect(() => {
    if (!me?.id) return;

    const handleAppState = (nextState: AppStateStatus) => {
      const steps = sensorStepsRef.current;
      const userId = meIdRef.current;
      if (nextState === 'background' && userId && steps > 0 && steps !== lastSyncedSteps.current) {
        syncSteps.mutate({ userId, steps });
        lastSyncedSteps.current = steps;
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id]);

  return { steps, synced: lastSyncedSteps.current === sensorSteps };
}
