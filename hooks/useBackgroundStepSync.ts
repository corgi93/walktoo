import { useEffect } from 'react';
import { NativeModules, Platform } from 'react-native';

// ─── 네이티브 모듈 존재 여부 (빌드에 포함됐는지) ────────────

const hasNativeModule = !!NativeModules.ExpoTaskManager;

const TASK_NAME = 'BACKGROUND_STEP_SYNC';

// ─── Background Task 정의 (최상위) ─────────────────────────
// defineTask는 반드시 컴포넌트 밖 최상위에서 호출해야 함
// 네이티브 모듈이 빌드에 포함된 경우에만 등록

if (hasNativeModule) {
  const TaskManager = require('expo-task-manager') as typeof import('expo-task-manager');
  const BackgroundFetch = require('expo-background-fetch') as typeof import('expo-background-fetch');
  const { Pedometer } = require('expo-sensors') as typeof import('expo-sensors');
  const { supabase } = require('@/server/client') as { supabase: import('@supabase/supabase-js').SupabaseClient };

  TaskManager.defineTask(TASK_NAME, async () => {
    try {
      const isAvailable = await Pedometer.isAvailableAsync();
      if (!isAvailable) return BackgroundFetch.BackgroundFetchResult.NoData;

      // iOS만 날짜 범위 조회 지원
      if (Platform.OS !== 'ios') {
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const { steps } = await Pedometer.getStepCountAsync(startOfDay, now);

      if (steps <= 0) return BackgroundFetch.BackgroundFetchResult.NoData;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return BackgroundFetch.BackgroundFetchResult.Failed;

      const today = now.toISOString().split('T')[0];
      const kcal = Math.round(steps * 0.04 * 10) / 10;

      await supabase
        .from('daily_steps')
        .upsert({ user_id: user.id, date: today, steps, kcal }, { onConflict: 'user_id,date' });

      console.log(`[BackgroundStepSync] ${steps}보 동기화 완료`);
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
      console.warn('[BackgroundStepSync] 실패:', error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
}

// ─── Hook ───────────────────────────────────────────────

/**
 * 백그라운드 걸음수 동기화 등록
 * - 네이티브 모듈이 빌드에 포함된 경우에만 동작 (EAS 빌드 필요)
 * - iOS: Background Fetch (15~30분 간격, OS가 빈도 조절)
 * - Android: getStepCountAsync 미지원 → 포그라운드 useStepSync에 의존
 */
export function useBackgroundStepSync() {
  useEffect(() => {
    if (!hasNativeModule) {
      console.log('[BackgroundStepSync] 네이티브 모듈 없음 — 새 빌드가 필요합니다');
      return;
    }
    registerTask();
  }, []);
}

async function registerTask() {
  try {
    const BackgroundFetch = require('expo-background-fetch') as typeof import('expo-background-fetch');
    const TaskManager = require('expo-task-manager') as typeof import('expo-task-manager');

    const status = await BackgroundFetch.getStatusAsync();
    if (
      status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
      status === BackgroundFetch.BackgroundFetchStatus.Denied
    ) {
      console.log('[BackgroundStepSync] 백그라운드 갱신이 제한됨');
      return;
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(TASK_NAME, {
        minimumInterval: 15 * 60,
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('[BackgroundStepSync] 태스크 등록 완료');
    }
  } catch (error) {
    console.warn('[BackgroundStepSync] 등록 실패:', error);
  }
}
