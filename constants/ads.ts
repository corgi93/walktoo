/**
 * Low-frequency AdMob policy.
 *
 * Keep ads out of creation, reveal, auth, and paywall flows. Native ads should
 * appear only as quiet content cards for free users.
 */
export const ADS = {
  ENABLED: true,
  SESSION_NATIVE_AD_LIMIT: 1,
  RECORDS_MIN_WALKS: 5,
  NATIVE_RECORDS_PLACEMENT: 'records_after_recent_walks',
  NATIVE_AD_UNIT_ID: process.env.EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID ?? '',
} as const;
