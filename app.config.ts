/**
 * Dynamic Expo config — env 변수 기반.
 */
import type { ConfigContext, ExpoConfig } from 'expo/config';

const NAVER_MAP_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID ?? '';
const NAVER_MAP_MAVEN_REPO = 'https://repository.map.naver.com/archive/maven';

type ExpoPlugin = NonNullable<ExpoConfig['plugins']>[number];

const isExpoBuildPropertiesPlugin = (plugin: ExpoPlugin) =>
  plugin === 'expo-build-properties' ||
  (Array.isArray(plugin) && plugin[0] === 'expo-build-properties');

const withNaverMapMavenRepo = (plugins: ExpoPlugin[]) => {
  let hasExpoBuildProperties = false;

  const nextPlugins = plugins.map((plugin) => {
    if (!isExpoBuildPropertiesPlugin(plugin)) {
      return plugin;
    }

    hasExpoBuildProperties = true;

    const [, options = {}] = Array.isArray(plugin) ? plugin : [plugin, {}];
    const android = typeof options.android === 'object' && options.android ? options.android : {};
    const extraMavenRepos = Array.isArray(android.extraMavenRepos)
      ? [...android.extraMavenRepos]
      : [];

    if (!extraMavenRepos.includes(NAVER_MAP_MAVEN_REPO)) {
      extraMavenRepos.push(NAVER_MAP_MAVEN_REPO);
    }

    return [
      'expo-build-properties',
      {
        ...options,
        android: {
          ...android,
          extraMavenRepos,
        },
      },
    ] as ExpoPlugin;
  });

  if (!hasExpoBuildProperties) {
    nextPlugins.push([
      'expo-build-properties',
      {
        android: {
          extraMavenRepos: [NAVER_MAP_MAVEN_REPO],
        },
      },
    ] as ExpoPlugin);
  }

  return nextPlugins;
};

export default ({ config }: ConfigContext): ExpoConfig => {
  // 기존 plugin 배열에 네이버 지도 플러그인 추가 (NCP Maps Client ID 필요)
  // 키 없을 땐 plugin 등록 안 함 → prebuild 시 에러 안 남
  const plugins = withNaverMapMavenRepo([...(config.plugins ?? [])]);
  if (NAVER_MAP_CLIENT_ID) {
    plugins.push([
      '@mj-studio/react-native-naver-map',
      {
        client_id: NAVER_MAP_CLIENT_ID,
        ios: {
          NSLocationWhenInUseUsageDescription:
            '함께 걷는 경로를 기록하기 위해 위치 접근이 필요합니다.',
          NSLocationAlwaysAndWhenInUseUsageDescription:
            '백그라운드에서도 걷기 경로를 기록하기 위해 위치 접근이 필요합니다.',
        },
        android: {
          ACCESS_FINE_LOCATION: true,
          ACCESS_COARSE_LOCATION: true,
        },
      },
    ]);
  }

  return {
    ...config,
    plugins,
  } as ExpoConfig;
};
