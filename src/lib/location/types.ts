/**
 * Location 모듈 — provider 무관한 공통 타입.
 *
 * 비즈니스 로직(검색·저장·표시)은 Place 인터페이스만 알면 됨.
 * Naver / Google 구현체는 자기 응답을 Place로 정규화해서 반환.
 */

export interface Coords {
  /** 위도 (latitude) */
  lat: number;
  /** 경도 (longitude) */
  lng: number;
}

export interface Place {
  /** provider 내부 id (캐시 dedupe용) */
  id: string;
  /** 표시명 — "라디오비숍", "한강공원" */
  name: string;
  /** 도로명/지번 주소 */
  address: string;
  /** 좌표 */
  coords: Coords;
  /** 카테고리 — "카페", "음식점" 등 (옵션) */
  category?: string;
  /** 어떤 provider에서 왔는지 */
  source: ProviderId;
}

export type ProviderId = 'naver' | 'google';

/** DB·산책 entry에 저장되는 최소 단위 */
export interface PickedLocation {
  /** 사용자 표시 이름 */
  name: string;
  /** 좌표 (없으면 그냥 텍스트 입력) */
  coords?: Coords;
  /** 도로명/지번 주소 (옵션) */
  address?: string;
  /** 어떤 provider에서 picked 됐는지 — 표시 시 attribution */
  source?: ProviderId;
}
