import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useSyncStepsMutation } from './services/steps/mutation';
import { useStepsStore } from '@/stores/stepsStore';
import { useTodaySteps } from './useTodaySteps';

const SYNC_INTERVAL = 60_000; // 60초마다 동기화

/**
 * 걸음수를 주기적으로 Supabase에 동기화
 * - 센서 값이 0이면 DB에 저장된 값을 fallback으로 사용 (앱 재설치 대응)
 * - 60초마다 자동 업로드
 * - 앱이 백그라운드로 갈 때 즉시 업로드
 */
export function useStepSync() {
  const { userId, steps, available } = useTodaySteps();
  const syncSteps = useSyncStepsMutation();
  const lastSyncedSteps = useRef(0);
  const setMySteps = useStepsStore((state) => state.setMySteps);
  const setSensorAvailable = useStepsStore((state) => state.setSensorAvailable);

  // 클로저가 최신 값을 참조하도록 ref에 동기화
  const stepsRef = useRef(steps);
  const userIdRef = useRef(userId);
  useEffect(() => { stepsRef.current = steps; }, [steps]);
  useEffect(() => { userIdRef.current = userId; }, [userId]);
  useEffect(() => { setMySteps(steps); }, [setMySteps, steps]);
  useEffect(() => { setSensorAvailable(available); }, [available, setSensorAvailable]);

  // 60초 주기 동기화 — me.id 바뀔 때만 interval 재생성
  // steps를 deps에 넣으면 걸음 업데이트마다 interval 재생성 + 즉시 sync 호출됨
  useEffect(() => {
    if (!userId) return;

    const doSync = () => {
      const steps = stepsRef.current;
      const userId = userIdRef.current;
      if (!userId || steps <= 0 || steps === lastSyncedSteps.current) return;
      syncSteps.mutate(
        { userId, steps },
        {
          onSuccess: () => {
            if (__DEV__) console.log(`[StepSync] synced ${steps} steps`);
          },
          onError: (err) => console.warn('[StepSync] sync failed:', err),
        },
      );
      lastSyncedSteps.current = steps;
    };

    const interval = setInterval(doSync, SYNC_INTERVAL);
    doSync(); // 최초 1회 즉시

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // 앱 백그라운드 진입 시 즉시 동기화
  useEffect(() => {
    if (!userId) return;

    const handleAppState = (nextState: AppStateStatus) => {
      const steps = stepsRef.current;
      const userId = userIdRef.current;
      if (nextState === 'background' && userId && steps > 0 && steps !== lastSyncedSteps.current) {
        syncSteps.mutate({ userId, steps });
        lastSyncedSteps.current = steps;
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return { steps, synced: lastSyncedSteps.current === steps };
}
