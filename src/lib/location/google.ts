/**
 * Google Provider — Places API + Geocoding API.
 *
 * 글로벌 / 한국 외 지역 fallback 용도. 한국 사용자는 naverLocationProvider 사용.
 *
 * 환경변수: EXPO_PUBLIC_GOOGLE_MAPS_KEY (Cloud Console에서 Places + Maps 활성화)
 *
 * ⚠️ 키 노출 우려: Google Cloud Console에서 application restriction (iOS bundle id /
 *    Android package name)으로 제한 필수. HTTP referrer 기반 제한도 가능.
 */

import type { LocationProvider, SearchOptions } from './provider';
import type { Coords, Place } from './types';

// Places API (New) — Text Search
const SEARCH_ENDPOINT = 'https://places.googleapis.com/v1/places:searchText';
// Geocoding API — Reverse
const GEOCODE_ENDPOINT = 'https://maps.googleapis.com/maps/api/geocode/json';

interface GooglePlace {
  id?: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  primaryType?: string;
}

function getApiKey(): string {
  const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;
  if (!key) {
    throw new Error(
      '[GoogleLocationProvider] EXPO_PUBLIC_GOOGLE_MAPS_KEY 환경변수가 필요합니다. https://console.cloud.google.com 에서 Places API 활성화 후 .env에 추가하세요.',
    );
  }
  return key;
}

export const googleLocationProvider: LocationProvider = {
  id: 'google',

  async searchPlaces(query: string, opts: SearchOptions = {}): Promise<Place[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const apiKey = getApiKey();
    const limit = Math.min(opts.limit ?? 8, 20);

    const body: Record<string, unknown> = {
      textQuery: trimmed,
      maxResultCount: limit,
    };
    if (opts.near) {
      body.locationBias = {
        circle: {
          center: { latitude: opts.near.lat, longitude: opts.near.lng },
          radius: 10_000, // 10km 반경 우선
        },
      };
    }

    const res = await fetch(SEARCH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.location,places.primaryType',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`[Google search] ${res.status} ${res.statusText}`);
    }
    const json = (await res.json()) as { places?: GooglePlace[] };
    return (json.places ?? [])
      .filter((p) => p.location)
      .map((p, i) => ({
        id: p.id ?? `google-${i}`,
        name: p.displayName?.text ?? '',
        address: p.formattedAddress ?? '',
        coords: {
          lat: p.location!.latitude,
          lng: p.location!.longitude,
        },
        category: p.primaryType,
        source: 'google' as const,
      }));
  },

  async reverseGeocode(coords: Coords): Promise<Place | null> {
    const apiKey = getApiKey();
    const url = `${GEOCODE_ENDPOINT}?latlng=${coords.lat},${coords.lng}&key=${apiKey}&language=ko`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      results?: { formatted_address?: string }[];
    };
    const first = json.results?.[0];
    if (!first) return null;
    return {
      id: `google-rev-${coords.lat}-${coords.lng}`,
      name: '',
      address: first.formatted_address ?? '',
      coords,
      source: 'google',
    };
  },
};
