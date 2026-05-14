/**
 * Naver Provider — 네이버 개발자센터 (Naver Developers) 지역검색·지오코딩 API.
 *
 * 두 종류 키 필요:
 * 1. **Naver Developers** (https://developers.naver.com)
 *    - 지역 검색 API: X-Naver-Client-Id, X-Naver-Client-Secret
 *    - 환경변수: EXPO_PUBLIC_NAVER_DEV_CLIENT_ID, EXPO_PUBLIC_NAVER_DEV_CLIENT_SECRET
 *
 * 2. **Naver Cloud Platform (NCP)** (https://www.ncloud.com) — 지도 WebView + Reverse Geocoding
 *    - Maps JavaScript API 클라이언트: ncpKeyId
 *    - 환경변수: EXPO_PUBLIC_NAVER_MAP_CLIENT_ID
 *    - 역지오코딩 (Reverse Geocoding) API도 NCP에 있음
 *
 * ⚠️ 클라이언트 secret 노출 — 출시 전엔 Supabase Edge Function으로 프록시 권장.
 *    당분간은 모바일 앱 전용 키라 노출돼도 큰 문제는 없음 (Naver가 앱 ID 검증).
 */

import type { LocationProvider, SearchOptions } from './provider';
import type { Coords, Place } from './types';

const SEARCH_ENDPOINT = 'https://openapi.naver.com/v1/search/local.json';
// NCP 역지오코딩
const REVERSE_GEOCODE_ENDPOINT =
  'https://maps.apigw.ntruss.com/map-reversegeocode/v2/gc';

interface NaverSearchItem {
  title: string; // HTML 태그 포함됨 (예: <b>라디오비숍</b>)
  address: string;
  roadAddress: string;
  category: string;
  // Naver 지역검색은 좌표를 KATEC 좌표계로 반환 (mapx/mapy, x10000000)
  // 하지만 v1 API는 "TM128"이 기본 — WGS84로 변환 필요. 여기선 v1의 lng/lat 반환 시도.
  mapx: string;
  mapy: string;
}

interface NaverSearchResponse {
  items: NaverSearchItem[];
}

function stripHtmlTags(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, '');
}

/**
 * Naver 지역검색의 mapx/mapy → WGS84 (lat/lng) 변환.
 * v1 API는 KATEC TM128이 아니라 그냥 WGS84 * 1e7로 반환되는 경우가 많음.
 * 안전하게 두 케이스 모두 처리:
 *  - 9자리 이상이면 WGS84 * 1e7 (예: 1269784000 → 126.9784)
 *  - 그 외엔 그대로
 */
function parseCoord(raw: string): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  // WGS84 * 1e7 형식 감지
  if (Math.abs(n) > 1_000_000) return n / 1e7;
  return n;
}

function getEnv(): { clientId: string; clientSecret: string } {
  const clientId = process.env.EXPO_PUBLIC_NAVER_DEV_CLIENT_ID;
  const clientSecret = process.env.EXPO_PUBLIC_NAVER_DEV_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      '[NaverLocationProvider] EXPO_PUBLIC_NAVER_DEV_CLIENT_ID / SECRET 환경변수가 필요합니다. https://developers.naver.com 에서 애플리케이션 등록 후 .env에 추가하세요.',
    );
  }
  return { clientId, clientSecret };
}

export const naverLocationProvider: LocationProvider = {
  id: 'naver',

  async searchPlaces(query: string, opts: SearchOptions = {}): Promise<Place[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const limit = Math.min(opts.limit ?? 8, 30);

    const { clientId, clientSecret } = getEnv();
    const url = `${SEARCH_ENDPOINT}?query=${encodeURIComponent(trimmed)}&display=${limit}&sort=random`;
    const res = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    });
    if (!res.ok) {
      throw new Error(`[Naver search] ${res.status} ${res.statusText}`);
    }
    const json = (await res.json()) as NaverSearchResponse;
    return json.items.map((item, i) => ({
      id: `naver-${item.address}-${i}`,
      name: stripHtmlTags(item.title),
      address: item.roadAddress || item.address,
      coords: {
        lng: parseCoord(item.mapx),
        lat: parseCoord(item.mapy),
      },
      category: item.category?.split('>').pop()?.trim(),
      source: 'naver' as const,
    }));
  },

  async reverseGeocode(coords: Coords): Promise<Place | null> {
    // NCP Reverse Geocoding API.
    // 환경변수 EXPO_PUBLIC_NCP_API_KEY_ID + EXPO_PUBLIC_NCP_API_KEY 필요.
    const ncpKeyId = process.env.EXPO_PUBLIC_NCP_API_KEY_ID;
    const ncpKey = process.env.EXPO_PUBLIC_NCP_API_KEY;
    if (!ncpKeyId || !ncpKey) {
      // NCP 키 없으면 좌표만 가진 플레이스 반환
      return {
        id: `naver-coords-${coords.lat}-${coords.lng}`,
        name: '',
        address: '',
        coords,
        source: 'naver',
      };
    }
    const url = `${REVERSE_GEOCODE_ENDPOINT}?coords=${coords.lng},${coords.lat}&output=json&orders=roadaddr,addr`;
    const res = await fetch(url, {
      headers: {
        'x-ncp-apigw-api-key-id': ncpKeyId,
        'x-ncp-apigw-api-key': ncpKey,
      },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      results?: { region?: Record<string, { name: string }>; land?: { name: string; number1: string; number2: string } }[];
    };
    const r = json.results?.[0];
    if (!r) return null;
    const region = r.region;
    const land = r.land;
    const parts = [
      region?.area1?.name,
      region?.area2?.name,
      region?.area3?.name,
      land?.name,
      [land?.number1, land?.number2].filter(Boolean).join('-'),
    ].filter(Boolean);
    return {
      id: `naver-rev-${coords.lat}-${coords.lng}`,
      name: '',
      address: parts.join(' '),
      coords,
      source: 'naver',
    };
  },
};
