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
  findLifetimePackage,
  getCurrentOffering,
  isRevenueCatReady,
  purchaseLifetime,
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

  const [lifetimePackage, setLifetimePackage] =
    useState<PurchasesPackage | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const offering = await getCurrentOffering();
      if (cancelled || !offering) return;
      setLifetimePackage(findLifetimePackage(offering));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const price =
    lifetimePackage?.product.priceString ??
    `₩${PREMIUM.PRICE_KRW.toLocaleString('ko-KR')}`;

  const handlePurchase = async () => {
    if (isPurchasing) return;
    if (isEntitled) {
      toast.info(t('premium:result.already-owned'));
      return;
    }
    if (!isRevenueCatReady() || !lifetimePackage) {
      toast.error(t('premium:result.sdk-unavailable'));
      return;
    }

    setIsPurchasing(true);
    const outcome = await purchaseLifetime(lifetimePackage);
    if (outcome.userCancelled) {
      setIsPurchasing(false);
      return;
    }
    if (!outcome.ok || !outcome.appUserId) {
      setIsPurchasing(false);
      toast.error(t('premium:result.failed'));
      return;
    }

    const sync = await markPremium.mutateAsync(outcome.appUserId);
    setIsPurchasing(false);
    if (sync.success) {
      toast.success(t('premium:result.success'));
      router.back();
    } else {
      toast.error(t('premium:result.failed'));
    }
  };

  const handleRestore = async () => {
    if (isRestoring) return;
    if (!isRevenueCatReady()) {
      toast.error(t('premium:result.sdk-unavailable'));
      return;
    }

    setIsRestoring(true);
    const outcome = await restorePurchases();
    if (!outcome.ok || !outcome.appUserId) {
      setIsRestoring(false);
      toast.info(t('premium:result.no-purchases'));
      return;
    }

    // 기록 업그레이드와 테마팩 — 복원된 entitlement만 각각 동기화
    let synced = false;
    if (outcome.hasEntitlement) {
      const sync = await markPremium.mutateAsync(outcome.appUserId);
      synced = synced || sync.success;
    }
    if (outcome.hasThemePack) {
      const sync = await markThemePack.mutateAsync(outcome.appUserId);
      synced = synced || sync.success;
    }
    setIsRestoring(false);
    if (synced) {
      toast.success(t('premium:result.restored'));
      router.back();
    } else {
      toast.error(t('premium:result.failed'));
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Row px="xxl" style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Icon name="x" size={22} color={theme.colors.text} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable onPress={handleRestore} hitSlop={8} disabled={isRestoring}>
          <Text variant="caption" color="textMuted">
            {isRestoring
              ? t('premium:actions.restoring')
              : t('premium:actions.restore')}
          </Text>
        </Pressable>
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
            {t('premium:price.lifetime-label')}
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
          <BenefitItem
            title={t('premium:benefits.walk-book-title')}
            icon="book-open"
          />
        </View>

        <Pressable
          onPress={() => router.push('/walk-book')}
          style={styles.walkBookCard}
        >
          <View style={styles.walkBookIcon}>
            <Icon name="book-open" size={20} color={theme.colors.secondary} />
          </View>
          <View style={styles.walkBookBody}>
            <Text variant="caption" color="textMuted">
              {t('premium:walk-book.eyebrow')}
            </Text>
            <Text variant="headingSmall" color="text" mt="xxs">
              {t('premium:walk-book.title')}
            </Text>
            <Text variant="caption" color="textSecondary" mt="xs">
              {t('premium:walk-book.description')}
            </Text>
          </View>
          <Icon name="chevron-right" size={18} color={theme.colors.gray400} />
        </Pressable>

        <Pressable
          onPress={handlePurchase}
          disabled={isPurchasing || isEntitled}
          style={[
            styles.purchaseButton,
            (isPurchasing || isEntitled) && styles.buttonDisabled,
          ]}
        >
          {isPurchasing ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <>
              <Icon
                name={isEntitled ? 'check' : 'heart'}
                size={18}
                color={theme.colors.white}
              />
              <Text variant="bodyMedium" color="white" ml="sm" weight="700">
                {isEntitled
                  ? t('premium:menu.active')
                  : t('premium:actions.purchase')}
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
  walkBookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceWarm,
    shadowColor: theme.colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  walkBookIcon: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.secondaryLight,
    borderWidth: 1.5,
    borderColor: theme.colors.borderLight,
  },
  walkBookBody: {
    flex: 1,
    minWidth: 0,
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
