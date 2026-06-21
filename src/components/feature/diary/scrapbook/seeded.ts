/**
 * 결정론적 의사난수 — 같은 key를 주면 항상 같은 값.
 * 회전 각도, 테이프 위치 등을 매 렌더마다 흔들리지 않게 고정할 때 사용.
 */
export function seeded(key: string | number, range = 1, offset = 0): number {
  const s = String(key);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return ((h % 10000) / 10000) * range - range / 2 + offset;
}
