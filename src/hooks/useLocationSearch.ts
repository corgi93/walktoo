import { useEffect, useMemo, useRef, useState } from 'react';

import { selectLocationProvider } from '@/lib/location';
import type { Place, ProviderId } from '@/lib/location';

interface UseLocationSearchResult {
  results: Place[];
  isSearching: boolean;
  error: string | null;
  /** 활성 provider id (UI에 attribution 표시용) */
  providerId: ProviderId;
}

/**
 * 키워드 입력 → 디바운스 검색 → Place[] 반환.
 * Provider는 locale/env 기반으로 자동 선택 (`override`로 강제 가능).
 *
 * @example
 * const [q, setQ] = useState('');
 * const { results, isSearching } = useLocationSearch(q);
 */
export function useLocationSearch(
  query: string,
  opts: { override?: ProviderId; debounceMs?: number } = {},
): UseLocationSearchResult {
  const provider = useMemo(
    () => selectLocationProvider({ override: opts.override }),
    [opts.override],
  );
  const debounceMs = opts.debounceMs ?? 300;

  const [results, setResults] = useState<Place[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 1) {
      setResults([]);
      setIsSearching(false);
      setError(null);
      return;
    }

    setIsSearching(true);
    const myReqId = ++reqIdRef.current;
    const timer = setTimeout(() => {
      provider
        .searchPlaces(trimmed)
        .then((places) => {
          if (myReqId !== reqIdRef.current) return;
          setResults(places);
          setError(null);
        })
        .catch((e: Error) => {
          if (myReqId !== reqIdRef.current) return;
          setError(e.message);
          setResults([]);
        })
        .finally(() => {
          if (myReqId !== reqIdRef.current) return;
          setIsSearching(false);
        });
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, provider, debounceMs]);

  return { results, isSearching, error, providerId: provider.id };
}
