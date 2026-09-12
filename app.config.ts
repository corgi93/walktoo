/**
 * Dynamic Expo config — env 변수 기반.
 */
import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const isPlaceholder = !clientId || clientId === 'YOUR_GOOGLE_IOS_CLIENT_ID';

  if (isPlaceholder) return config as ExpoConfig;

  const clientIdWithoutSuffix = clientId.replace(
    '.apps.googleusercontent.com',
    '',
  );
  const iosUrlScheme = `com.googleusercontent.apps.${clientIdWithoutSuffix}`;

  return {
    ...config,
    plugins: (config.plugins ?? []).map(plugin => {
      if (plugin === '@react-native-google-signin/google-signin') {
        return [plugin, { iosUrlScheme }];
      }
      return plugin;
    }),
  } as ExpoConfig;
};
