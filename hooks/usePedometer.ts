import { useEffect, useState } from 'react';
import { Pedometer } from 'expo-sensors';

/**
 * 오늘 자정부터 현재까지의 걸음수를 실시간으로 추적합니다.
 *
 * 1) 앱 진입 시 오늘 0시~현재까지 누적 걸음수를 가져옴
 * 2) 이후 실시간 걸음 이벤트를 구독하여 누적
 */
export function usePedometer() {
  const [steps, setSteps] = useState(0);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let subscription: ReturnType<typeof Pedometer.watchStepCount> | null = null;

    const init = async () => {
      const isAvailable = await Pedometer.isAvailableAsync();
      setAvailable(isAvailable);
      if (!isAvailable) return;

      // 오늘 자정
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // 오늘 누적 걸음수
      try {
        const result = await Pedometer.getStepCountAsync(startOfDay, now);
        setSteps(result.steps);
      } catch (e) {
        console.warn('[Pedometer] 기록 조회 실패:', e);
      }

      // 실시간 구독 (이후 추가 걸음)
      let liveSteps = 0;
      subscription = Pedometer.watchStepCount((data) => {
        liveSteps += data.steps;
        setSteps((prev) => {
          // 중복 방지: 기존 누적 + 실시간 추가분
          const base = prev - liveSteps + data.steps;
          return base + liveSteps;
        });
      });
    };

    init();

    return () => {
      subscription?.remove();
    };
  }, []);

  return { steps, available };
}
