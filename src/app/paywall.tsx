import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { PurchasesPackage } from 'react-native-purchases';

import { Icon, PixelCard, Row, Text } from '@/components/base';
import { useToast } from '@/components/composite/toast/ToastProvider';
import { PREMIUM } from '@/constants/premium';
import {
  useMarkPremiumPurchasedMutation,
  useMarkThemePackPurchasedMutation,
} from '@/hooks/services/entitlements/mutation';
import { useEntitlement } from '@/hooks/useEntitlement';
import {
  findCouplePassPackage,
  getCurrentOffering,
  isRevenueCatReady,
  purchaseCouplePass,
  restorePurchases,
} from '@/lib/revenuecat';
import { theme } from '@/styles/theme';
import { LAYOUT, SPACING } from '@/styles/type';

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { t } = useTranslation(['premium', 'common']);
  const { isEntitled } = useEntitlement();
  const markPremium = useMarkPremiumPurchasedMutation();
  const markThemePack = useMarkThemePackPurchasedMutation();

  const [couplePassPackage, setCouplePassPackage] =
    useState<PurchasesPackage | null>(null);
  const [offeringChecked, setOfferingChecked] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const offering = await getCurrentOffering();
      if (cancelled) return;
      if (offering) {
        setCouplePassPackage(findCouplePassPackage(offering));
      }
      // 오퍼링 조회가 끝났음을 표시 — null(RC 미준비)이어도 로딩을 종료한다.
      setOfferingChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // RC 상품이 실제로 로드됐을 때만 구매 가능. 미준비면 활성 버튼 대신 "준비 중".
  const canPurchase = !!couplePassPackage;

  const price =
    couplePassPackage?.product.priceString ??
    `₩${PREMIUM.PRICE_KRW.toLocaleString('ko-KR')}`;

  const handlePurchase = async () => {
    if (isPurchasing) return;
    if (isEntitled) {
      toast.info(t('premium:result.already-owned'));
      return;
    }
    if (!isRevenueCatReady() || !couplePassPackage) {
      toast.error(t('premium:result.sdk-unavailable'));
      return;
    }

    setIsPurchasing(true);
    try {
      const outcome = await purchaseCouplePass(couplePassPackage);
      if (outcome.userCancelled) return;
      if (!outcome.ok || !outcome.appUserId) {
        toast.error(t('premium:result.failed'));
        return;
      }

      try {
        const sync = await markPremium.mutateAsync({
          revenuecatUserId: outcome.appUserId,
          expiresAt: outcome.entitlementExpiresAt ?? null,
        });
        if (sync.success) {
          toast.success(t('premium:result.success'));
          router.back();
        } else {
          toast.error(t('premium:result.sync-delayed'));
        }
      } catch {
        toast.error(t('premium:result.sync-delayed'));
      }
    } catch {
      toast.error(t('premium:result.failed'));
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (isRestoring) return;
    if (!isRevenueCatReady()) {
      toast.error(t('premium:result.sdk-unavailable'));
      return;
    }

    setIsRestoring(true);
    try {
      const outcome = await restorePurchases();
      if (!outcome.ok || !outcome.appUserId) {
        toast.info(t('premium:result.no-purchases'));
        return;
      }

      // 커플 패스와 테마팩 — 복원된 entitlement만 각각 동기화
      let synced = false;
      if (outcome.hasEntitlement) {
        const sync = await markPremium.mutateAsync({
          revenuecatUserId: outcome.appUserId,
          expiresAt: outcome.entitlementExpiresAt ?? null,
        });
        synced = synced || sync.success;
      }
      if (outcome.hasThemePack) {
        const sync = await markThemePack.mutateAsync(outcome.appUserId);
        synced = synced || sync.success;
      }
      if (synced) {
        toast.success(t('premium:result.restored'));
        router.back();
      } else {
        toast.error(t('premium:result.sync-delayed'));
      }
    } catch {
      toast.error(t('premium:result.sync-delayed'));
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Row px="xxl" style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Icon name="x" size={22} color={theme.colors.text} />
        </Pressable>
        <View style={{ flex: 1 }} />
        {canPurchase && (
          <Pressable onPress={handleRestore} hitSlop={8} disabled={isRestoring}>
            <Text variant="caption" color="textMuted">
              {isRestoring
                ? t('premium:actions.restoring')
                : t('premium:actions.restore')}
            </Text>
          </Pressable>
        )}
      </Row>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + SPACING.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.crown}>👑</Text>
          <Text variant="headingLarge" color="primary" align="center">
            {t('premium:brand')}
          </Text>
          <Text variant="bodySmall" color="textSecondary" align="center" mt="sm">
            {t('premium:tagline')}
          </Text>
        </View>

        <PixelCard style={styles.priceCard} bg={theme.colors.primarySurface}>
          <Text variant="caption" color="primary" align="center">
            {t('premium:price.upgrade-label')}
          </Text>
          <Text variant="displayMedium" color="primary" align="center" mt="sm">
            {price}
          </Text>
          <Text variant="caption" color="textSecondary" align="center" mt="sm">
            {t('premium:price.one-time-note')}
          </Text>
        </PixelCard>

        <View style={styles.benefits}>
          <BenefitItem
            title={t('premium:benefits.photos-title')}
            icon="camera"
          />
          <BenefitItem title={t('premium:benefits.couple-title')} icon="heart" />
          <BenefitItem
            title={t('premium:benefits.one-time-title')}
            icon="check-circle"
          />
        </View>

        <Pressable
          onPress={canPurchase && !isEntitled ? handlePurchase : undefined}
          disabled={
            isPurchasing || isEntitled || !offeringChecked || !canPurchase
          }
          style={[
            styles.purchaseButton,
            (isPurchasing || isEntitled || !offeringChecked || !canPurchase) &&
              styles.buttonDisabled,
          ]}
        >
          {isPurchasing || !offeringChecked ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : isEntitled ? (
            <>
              <Icon name="check" size={18} color={theme.colors.white} />
              <Text variant="bodyMedium" color="white" ml="sm" weight="700">
                {t('premium:menu.active')}
              </Text>
            </>
          ) : canPurchase ? (
            <>
              <Icon name="heart" size={18} color={theme.colors.white} />
              <Text variant="bodyMedium" color="white" ml="sm" weight="700">
                {t('premium:actions.purchase')}
              </Text>
            </>
          ) : (
            <>
              <Icon name="clock" size={18} color={theme.colors.white} />
              <Text variant="bodyMedium" color="white" ml="sm" weight="700">
                {t('premium:actions.coming-soon')}
              </Text>
            </>
          )}
        </Pressable>

        <Text variant="caption" color="textMuted" align="center">
          {t('premium:fine-print')}
        </Text>
      </ScrollView>
    </View>
  );
}

function BenefitItem({
  title,
  icon,
}: {
  title: string;
  icon: 'book-open' | 'camera' | 'heart' | 'check-circle' | 'unlock';
}) {
  return (
    <View style={styles.benefitItem}>
      <View style={styles.benefitIcon}>
        <Icon name={icon} size={17} color={theme.colors.primary} />
      </View>
      <Text variant="bodySmall" color="text" weight="700" style={{ flex: 1 }}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: LAYOUT.headerPy,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: LAYOUT.screenPx,
    gap: SPACING.lg,
  },
  hero: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.sm,
  },
  crown: {
    fontSize: 42,
    marginBottom: SPACING.sm,
  },
  priceCard: {
    padding: SPACING.xl,
  },
  benefits: {
    gap: SPACING.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.borderLight,
  },
  benefitIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryLight,
  },
  purchaseButton: {
    height: 54,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
});
