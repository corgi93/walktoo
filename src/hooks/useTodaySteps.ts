import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useMyStepsTodayQuery } from '@/hooks/services/steps/query';
import { useGetMeQuery } from '@/hooks/services/user/query';

import { usePedometer } from './usePedometer';

/**
 * 앱에서 사용할 "오늘 내 걸음수" 단일 보정 지점.
 *
 * Android의 Pedometer.watchStepCount는 앱 구독 이후 증분만 주기 때문에,
 * 앱 시작 시점의 DB 저장값을 세션 기준값으로 잡고 이후 센서 증분을 더한다.
 */
export function useTodaySteps() {
  const { data: me } = useGetMeQuery();
  const { steps: sensorSteps, available } = usePedometer();
  const { data: dbSteps } = useMyStepsTodayQuery(me?.id);
  const androidSessionBaseRef = useRef<number | null>(null);
  const userIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (userIdRef.current === me?.id) return;
    userIdRef.current = me?.id;
    androidSessionBaseRef.current = null;
  }, [me?.id]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    if (androidSessionBaseRef.current !== null) return;
    if (dbSteps === undefined) return;
    androidSessionBaseRef.current = dbSteps;
  }, [dbSteps]);

  const persistedSteps = dbSteps ?? 0;
  const steps =
    Platform.OS === 'android'
      ? Math.max(
          persistedSteps,
          (androidSessionBaseRef.current ?? persistedSteps) + sensorSteps,
        )
      : sensorSteps > 0
        ? sensorSteps
        : persistedSteps;

  return {
    userId: me?.id,
    steps,
    sensorSteps,
    persistedSteps,
    available,
  };
}
