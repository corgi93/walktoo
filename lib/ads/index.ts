/**
 * AdMob wrapper.
 *
 * The native module is loaded lazily so Expo Go or an old dev client can keep
 * running without crashing. Ads simply remain hidden until a rebuilt client has
 * the native SDK.
 */
export const initAdMob = async (): Promise<void> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-google-mobile-ads') as typeof import('react-native-google-mobile-ads');
    await mod.default().setRequestConfiguration({
      maxAdContentRating: mod.MaxAdContentRating.PG,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    });
    await mod.default().initialize();
  } catch (error) {
    if (__DEV__) {
      console.warn('[AdMob] init skipped:', error);
    }
  }
};
