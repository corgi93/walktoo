import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';

/**
 * 오늘 자정부터 현재까지의 걸음수를 실시간으로 추적합니다.
 *
 * iOS:
 *   1) getStepCountAsync(오늘자정, 현재)로 누적 걸음수 가져옴 (baseSteps)
 *   2) watchStepCount로 이후 추가분 누적 (liveSteps)
 *   3) 표시 걸음수 = baseSteps + liveSteps
 *
 * Android:
 *   - getStepCountAsync 미지원 (날짜 범위 조회 불가)
 *   - watchStepCount만 사용 → 구독 이후 누적값 반환
 *   - 앱 재시작 시 0부터 다시 카운트 (DB fallback은 useStepSync에서 처리)
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

      // iOS만 오늘 누적 걸음수 조회 가능
      if (Platform.OS === 'ios') {
        try {
          const now = new Date();
          const startOfDay = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          );
          const result = await Pedometer.getStepCountAsync(startOfDay, now);
          setBaseSteps(result.steps);
        } catch (e) {
          console.warn('[Pedometer] iOS 기록 조회 실패:', e);
        }
      }

      // 실시간 구독
      // Android: 구독 이후 누적값 반환
      // iOS: 이벤트당 걸음수 (baseSteps에 추가됨)
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
