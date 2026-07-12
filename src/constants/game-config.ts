/**
 * 게임/도메인 상수
 *
 * 매직 넘버를 한 곳에 모아 튜닝과 검색을 쉽게.
 * 모두 `as const`로 readonly 보장.
 */

export const STEP_GOAL = {
  /** 개인 일일 목표 (걸음) */
  DAILY_INDIVIDUAL: 10_000,
  /** 커플 합산 일일 미션 목표 (걸음) */
  DAILY_COUPLE_MISSION: 20_000,
} as const;

export const STAMP = {
  /** 미션 달성 시 지급되는 발자국 수 */
  DAILY_REWARD: 30,
} as const;

export const CALORIE = {
  /** 1걸음당 소모 칼로리 (kcal) */
  PER_STEP: 0.04,
} as const;

export const PARTNER_POLLING = {
  /** 상대방 걸음수 폴링 주기 (ms) */
  STEPS_INTERVAL_MS: 30_000,
  /** 상대방 idle 판정 (ms) — polling 주기 + 여유 */
  IDLE_TIMEOUT_MS: 45_000,
} as const;

export const SELF_WALKING = {
  /** 내 걸음 idle 판정 (ms) */
  IDLE_TIMEOUT_MS: 10_000,
  /** idle 체크 주기 (ms) */
  CHECK_INTERVAL_MS: 2_000,
} as const;

/** 걸음 → 칼로리 변환 (반올림) */
export const stepsToCalories = (steps: number): number =>
  Math.round(steps * CALORIE.PER_STEP);
