import { useEffect, useRef, useState } from 'react';
import { Pedometer } from 'expo-sensors';

/**
 * 오늘 자정부터 현재까지의 걸음수를 실시간으로 추적합니다.
 *
 * 1) 앱 진입 시 오늘 0시~현재까지 누적 걸음수를 가져옴 (baseSteps)
 * 2) 이후 실시간 걸음 이벤트를 구독하여 추가분 누적 (liveSteps)
 * 3) 표시 걸음수 = baseSteps + liveSteps
 */
export function usePedometer() {
  const [baseSteps, setBaseSteps] = useState(0);
  const [liveSteps, setLiveSteps] = useState(0);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let subscription: ReturnType<typeof Pedometer.watchStepCount> | null = null;

    const init = async () => {
      const isAvailable = await Pedometer.isAvailableAsync();
      setAvailable(isAvailable);
      if (!isAvailable) return;

      // 오늘 자정
      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );

      // 오늘 누적 걸음수
      try {
        const result = await Pedometer.getStepCountAsync(startOfDay, now);
        setBaseSteps(result.steps);
      } catch (e) {
        console.warn('[Pedometer] 기록 조회 실패:', e);
      }

      // 실시간 구독 — Android는 구독 이후 누적값, iOS는 이벤트당 걸음수
      // data.steps는 구독 시작 이후 총 걸음수 (누적)
      subscription = Pedometer.watchStepCount((data) => {
        setLiveSteps(data.steps);
      });
    };

    init();

    return () => {
      subscription?.remove();
    };
  }, []);

  return { steps: baseSteps + liveSteps, available };
}
