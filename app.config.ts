/**
 * Dynamic Expo config — env 변수 기반.
 */
import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
  } as ExpoConfig;
};
