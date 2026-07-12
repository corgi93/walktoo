/**
 * Provider 선택 — locale 기반 자동 + 환경변수 override.
 *
 * 1. EXPO_PUBLIC_LOCATION_PROVIDER 환경변수가 'naver' | 'google' 이면 강제 사용
 * 2. 아니면: 디바이스 로케일이 ko* → naver, 그 외 → google
 *
 * 추후 사용자 설정(프로필)에서 override 가능하게 확장:
 *   selectLocationProvider({ override: user.locationProvider })
 */

import { googleLocationProvider } from './google';
import { naverLocationProvider } from './naver';
import type { LocationProvider } from './provider';
import type { ProviderId } from './types';

interface SelectOptions {
  /** 사용자 명시 선택 — undefined면 자동 */
  override?: ProviderId;
}

function detectLocale(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Localization = require('expo-localization') as {
      getLocales?: () => { languageCode?: string | null }[];
    };
    return Localization.getLocales?.()[0]?.languageCode ?? '';
  } catch {
    return '';
  }
}

export function selectLocationProvider(
  opts: SelectOptions = {},
): LocationProvider {
  const envOverride = process.env.EXPO_PUBLIC_LOCATION_PROVIDER as
    | ProviderId
    | undefined;
  const id: ProviderId = (() => {
    if (opts.override) return opts.override;
    if (envOverride === 'naver' || envOverride === 'google') return envOverride;
    const locale = detectLocale();
    return locale.startsWith('ko') ? 'naver' : 'google';
  })();

  return id === 'naver' ? naverLocationProvider : googleLocationProvider;
}
