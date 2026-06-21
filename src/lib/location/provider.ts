import type { Coords, Place, ProviderId } from './types';

/**
 * LocationProvider — 지역 검색 / 역지오코딩 추상화.
 *
 * 각 provider 구현체는 자기 API를 호출해서 결과를 Place[]로 정규화.
 * 비즈니스 로직(검색 hook, picker UI)은 이 인터페이스만 의존 →
 * 한국=Naver / 글로벌=Google 등 swap 가능, 추후 Apple Maps 등도 추가 쉬움.
 */
export interface LocationProvider {
  readonly id: ProviderId;
  /** 키워드 검색 — 자동완성·검색 결과 리스트용 */
  searchPlaces(query: string, opts?: SearchOptions): Promise<Place[]>;
  /** 좌표 → 주소 (역지오코딩) — 지도 핀 드롭 후 주소 가져오기 */
  reverseGeocode(coords: Coords): Promise<Place | null>;
}

export interface SearchOptions {
  /** 결과 최대 개수 (default 8) */
  limit?: number;
  /** 검색 중심점 — 가까운 결과 우선 (옵션) */
  near?: Coords;
}
