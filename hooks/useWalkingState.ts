import { useEffect, useRef, useState } from 'react';

import { PARTNER_POLLING, SELF_WALKING } from '@/constants/game-config';

/**
 * 센서 걸음수 변화를 감지해 "현재 걷는 중"인지 판단합니다.
 *
 * - 걸음수가 증가하면 → walking = true
 * - IDLE_TIMEOUT 동안 변화 없으면 → walking = false
 *
 * 네트워크 비용 0. 순수 클라이언트 상태 관리.
 */

export function useMyWalkingState(sensorSteps: number): boolean {
  const [isWalking, setIsWalking] = useState(false);
  const lastSteps = useRef(0);
  const lastChangeAt = useRef(Date.now());

  useEffect(() => {
    if (sensorSteps > lastSteps.current) {
      lastSteps.current = sensorSteps;
      lastChangeAt.current = Date.now();
      setIsWalking(true);
    }
  }, [sensorSteps]);

  // IDLE_TIMEOUT 이후 walking을 false로
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastChangeAt.current > SELF_WALKING.IDLE_TIMEOUT_MS) {
        setIsWalking((prev) => (prev ? false : prev));
      }
    }, SELF_WALKING.CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return isWalking;
}

/**
 * 상대방 걸음수의 변화를 감지해 "상대방이 걷는 중"인지 판단합니다.
 *
 * usePartnerStepsQuery가 폴링하는 것을 활용:
 * - 이전 값보다 증가 → walking = true
 * - 동일 → walking = false
 * - IDLE_TIMEOUT 이상 변화 없음 → 자동으로 false
 *
 * 추가 네트워크 비용 0.
 */

export function usePartnerWalkingState(partnerSteps: number): boolean {
  const [isWalking, setIsWalking] = useState(false);
  const lastSteps = useRef(0);
  const lastChangeAt = useRef(0);
  const initialized = useRef(false);

  useEffect(() => {
    // 첫 데이터 로딩 시에는 walking으로 판단하지 않음
    if (!initialized.current) {
      lastSteps.current = partnerSteps;
      initialized.current = true;
      return;
    }

    if (partnerSteps > lastSteps.current) {
      lastSteps.current = partnerSteps;
      lastChangeAt.current = Date.now();
      setIsWalking(true);
    } else if (partnerSteps === lastSteps.current && lastChangeAt.current > 0) {
      // 폴링 결과가 이전과 동일 → 멈춤
      setIsWalking(false);
    }
  }, [partnerSteps]);

  // IDLE_TIMEOUT 이상 변화 없으면 강제로 false
  useEffect(() => {
    const interval = setInterval(() => {
      if (
        lastChangeAt.current > 0 &&
        Date.now() - lastChangeAt.current > PARTNER_POLLING.IDLE_TIMEOUT_MS
      ) {
        setIsWalking((prev) => (prev ? false : prev));
      }
    }, 5_000);

    return () => clearInterval(interval);
  }, []);

  return isWalking;
}
