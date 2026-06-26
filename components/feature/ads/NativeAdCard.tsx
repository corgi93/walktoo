import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text as RNText, View } from 'react-native';

import { PixelCard, Row, Text } from '@/components/base';
import { ADS } from '@/constants/ads';
import { useEntitlement } from '@/hooks/useEntitlement';
import { theme } from '@/styles/theme';
import { FONT_FAMILY, LAYOUT, SPACING } from '@/styles/type';

type GoogleMobileAdsModule = typeof import('react-native-google-mobile-ads');
type LoadedNativeAd = Awaited<
  ReturnType<GoogleMobileAdsModule['NativeAd']['createForAdRequest']>
>;

let shownNativeAdsThisSession = 0;
const shownPlacements = new Set<string>();

interface NativeAdCardProps {
  placement: string;
  minItems?: number;
  itemCount?: number;
}

export function NativeAdCard({
  placement,
  minItems = 0,
  itemCount = 0,
}: NativeAdCardProps) {
  const { isEntitled, isLoading } = useEntitlement();
  const [adsModule, setAdsModule] = useState<GoogleMobileAdsModule | null>(null);
  const [nativeAd, setNativeAd] = useState<LoadedNativeAd | null>(null);

  const shouldRequest =
    ADS.ENABLED &&
    !isLoading &&
    !isEntitled &&
    itemCount >= minItems &&
    shownNativeAdsThisSession < ADS.SESSION_NATIVE_AD_LIMIT &&
    !shownPlacements.has(placement);

  useEffect(() => {
    if (!shouldRequest) return;

    let mounted = true;
    let loadedAd: LoadedNativeAd | null = null;

    (async () => {
      try {
        // Native module is unavailable until a dev/prod client is rebuilt.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mod = require('react-native-google-mobile-ads') as GoogleMobileAdsModule;
        const unitId = ADS.NATIVE_AD_UNIT_ID || mod.TestIds.NATIVE;
        const ad = await mod.NativeAd.createForAdRequest(unitId);
        loadedAd = ad;

        if (!mounted) {
          ad.destroy();
          return;
        }

        shownNativeAdsThisSession += 1;
        shownPlacements.add(placement);
        setAdsModule(mod);
        setNativeAd(ad);
      } catch (error) {
        if (__DEV__) {
          console.warn('[AdMob] native ad unavailable:', error);
        }
      }
    })();

    return () => {
      mounted = false;
      loadedAd?.destroy();
    };
  }, [placement, shouldRequest]);

  if (!adsModule || !nativeAd) return null;

  const { NativeAdView, NativeAsset, NativeAssetType } = adsModule;
  const iconUri = nativeAd.icon?.url;

  return (
    <View style={styles.wrapper}>
      <NativeAdView nativeAd={nativeAd}>
        <PixelCard style={styles.card} bg={theme.colors.surfaceWarm}>
          <Row style={styles.topRow}>
            {iconUri ? (
              <NativeAsset assetType={NativeAssetType.ICON}>
                <Image source={{ uri: iconUri }} style={styles.icon} />
              </NativeAsset>
            ) : (
              <View style={styles.iconPlaceholder} />
            )}

            <View style={styles.copy}>
              <Row style={styles.labelRow}>
                <Text variant="caption" color="textMuted">
                  광고
                </Text>
              </Row>
              <NativeAsset assetType={NativeAssetType.HEADLINE}>
                <RNText
                  numberOfLines={1}
                  style={[styles.assetText, styles.headline]}
                >
                  {nativeAd.headline}
                </RNText>
              </NativeAsset>
              {!!nativeAd.body && (
                <NativeAsset assetType={NativeAssetType.BODY}>
                  <RNText
                    numberOfLines={2}
                    style={[styles.assetCaption, styles.body]}
                  >
                    {nativeAd.body}
                  </RNText>
                </NativeAsset>
              )}
            </View>

            {!!nativeAd.callToAction && (
              <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
                <View style={styles.cta}>
                  <RNText style={styles.ctaText}>
                    {nativeAd.callToAction}
                  </RNText>
                </View>
              </NativeAsset>
            )}
          </Row>
        </PixelCard>
      </NativeAdView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: LAYOUT.screenPx,
    marginTop: SPACING.lg,
  },
  card: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    shadowOpacity: 0,
    elevation: 0,
  },
  topRow: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.gray100,
  },
  iconPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.gray100,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  labelRow: {
    alignItems: 'center',
    marginBottom: 2,
  },
  headline: {
    marginBottom: 2,
  },
  body: {
    marginTop: 0,
  },
  assetText: {
    fontFamily: FONT_FAMILY.body,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text,
  },
  assetCaption: {
    fontFamily: FONT_FAMILY.body,
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.textSecondary,
  },
  cta: {
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    borderRadius: theme.radius.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: theme.colors.primarySurface,
  },
  ctaText: {
    fontFamily: FONT_FAMILY.body,
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.primary,
  },
});
