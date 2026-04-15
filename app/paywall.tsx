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

import { Box, Button, Icon, PixelCard, Row, Text } from '@/components/base';
import { useToast } from '@/components/composite/toast/ToastProvider';
import { PREMIUM } from '@/constants/premium';
import { useMarkPremiumPurchasedMutation } from '@/hooks/services/entitlements/mutation';
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
import type { PurchasesPackage } from 'react-native-purchases';

// ─── Component ──────────────────────────────────────────

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { t } = useTranslation(['premium', 'common']);

  const { isEntitled, isInTrial, trialEndsAt } = useEntitlement();
  const markPurchased = useMarkPremiumPurchasedMutation();

  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [priceLabel, setPriceLabel] = useState<string>(
    formatKRW(PREMIUM.PRICE_KRW),
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // ─── 상품 fetch ───
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const offering = await getCurrentOffering();
      if (cancelled) return;
      if (!offering) return;
      const lifetime = findLifetimePackage(offering);
      if (lifetime) {
        setPkg(lifetime);
        setPriceLabel(lifetime.product.priceString);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── 핸들러 ───
  const handlePurchase = async () => {
    if (isProcessing) return;
    if (!isRevenueCatReady() || !pkg) {
      toast.error(t('premium:result.sdk-unavailable'));
      return;
    }
    setIsProcessing(true);
    const outcome = await purchaseLifetime(pkg);
    setIsProcessing(false);

    if (outcome.userCancelled) return; // 조용히 닫기
    if (!outcome.ok || !outcome.appUserId) {
      toast.error(t('premium:result.failed'));
      return;
    }
    // 서버 sync
    const sync = await markPurchased.mutateAsync(outcome.appUserId);
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
    setIsRestoring(false);

    if (!outcome.ok) {
      if (!outcome.hasEntitlement) {
        toast.info(t('premium:result.no-purchases'));
      } else {
        toast.error(t('premium:result.failed'));
      }
      return;
    }
    if (outcome.appUserId) {
      const sync = await markPurchased.mutateAsync(outcome.appUserId);
      if (sync.success) {
        toast.success(t('premium:result.restored'));
        router.back();
        return;
      }
    }
    toast.error(t('premium:result.failed'));
  };

  // ─── Trial 표시용 ───
  const trialDaysRemaining = computeTrialDaysRemaining(trialEndsAt);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── 헤더 ── */}
      <Row px="xxl" style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Icon name="x" size={22} color={theme.colors.text} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={handleRestore}
          hitSlop={8}
          disabled={isRestoring}
        >
          <Text variant="caption" color="textMuted">
            {isRestoring
              ? t('premium:actions.restoring')
              : t('premium:actions.restore')}
          </Text>
        </Pressable>
      </Row>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 브랜드 ── */}
        <Box px="xxl" style={styles.brandSection}>
          <View style={styles.crownWrap}>
            <Text style={styles.crownEmoji}>👑</Text>
          </View>
          <Text variant="displaySmall" color="primary" mt="md" align="center">
            {t('premium:brand')}
          </Text>
          <Text variant="bodySmall" color="textSecondary" mt="xs" align="center">
            {t('premium:tagline')}
          </Text>

          {/* 트라이얼 배너 */}
          {isInTrial && trialDaysRemaining !== null && (
            <View style={styles.trialBanner}>
              <Icon name="clock" size={12} color={theme.colors.primaryDark} />
              <Text variant="caption" color="primary" ml="xxs">
                {t('premium:trial-banner', { days: trialDaysRemaining })}
              </Text>
            </View>
          )}
        </Box>

        {/* ── 혜택 ── */}
        <Box px="xxl" style={styles.benefitsSection}>
          <Text variant="label" color="textMuted" mb="md">
            {t('premium:benefits.section-title')}
          </Text>
          <PixelCard style={styles.benefitsCard}>
            <BenefitRow
              emoji="📷"
              title={t('premium:benefits.photos-title')}
              description={t('premium:benefits.photos-description', {
                limit: PREMIUM.PHOTO_LIMIT_PREMIUM,
              })}
            />
            <BenefitRow
              emoji="🎨"
              title={t('premium:benefits.decoration-title')}
              description={t('premium:benefits.decoration-description')}
            />
            <BenefitRow
              emoji="📊"
              title={t('premium:benefits.stats-title')}
              description={t('premium:benefits.stats-description')}
            />
            <BenefitRow
              emoji="💞"
              title={t('premium:benefits.couple-title')}
              description={t('premium:benefits.couple-description')}
            />
            <BenefitRow
              emoji="✨"
              title={t('premium:benefits.no-ads-title')}
              description={t('premium:benefits.no-ads-description')}
              isLast
            />
          </PixelCard>
        </Box>

        {/* ── 가격 ── */}
        <Box px="xxl" style={styles.priceSection}>
          <PixelCard style={styles.priceCard} bg={theme.colors.primarySurface}>
            <Text variant="caption" color="textMuted" align="center">
              {t('premium:price.lifetime-label')}
            </Text>
            <Text
              variant="displayLarge"
              color="primary"
              align="center"
              mt="xxs"
            >
              {priceLabel}
            </Text>
            <Text variant="caption" color="primary" align="center" mt="xxs">
              {t('premium:price.one-time-note')}
            </Text>
          </PixelCard>
        </Box>

        {/* ── 약관 ── */}
        <Box px="xxl" style={styles.fineSection}>
          <Text variant="caption" color="textMuted" align="center">
            {t('premium:fine-print')}
          </Text>
        </Box>
      </ScrollView>

      {/* ── 하단 CTA ── */}
      <Box
        px="xxl"
        style={[
          styles.bottomBar,
          { paddingBottom: insets.bottom + LAYOUT.headerPy },
        ]}
      >
        {isEntitled ? (
          <Button
            variant="secondary"
            size="large"
            onPress={() => router.back()}
          >
            {t('premium:menu.active')}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="large"
            onPress={handlePurchase}
            disabled={isProcessing}
            loading={isProcessing}
          >
            {isProcessing
              ? t('premium:actions.purchasing')
              : t('premium:actions.purchase')}
          </Button>
        )}
      </Box>

      {(isProcessing || markPurchased.isPending) && (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
    </View>
  );
}

// ─── Sub Components ─────────────────────────────────────

function BenefitRow({
  emoji,
  title,
  description,
  isLast,
}: {
  emoji: string;
  title: string;
  description: string;
  isLast?: boolean;
}) {
  return (
    <Row style={[styles.benefitRow, !isLast && styles.benefitRowBorder]}>
      <Text style={styles.benefitEmoji}>{emoji}</Text>
      <View style={styles.benefitText}>
        <Text variant="bodyMedium" color="text">
          {title}
        </Text>
        <Text variant="caption" color="textMuted" mt="xxs">
          {description}
        </Text>
      </View>
    </Row>
  );
}

// ─── Helpers ────────────────────────────────────────────

const formatKRW = (price: number): string =>
  `₩${price.toLocaleString('ko-KR')}`;

const computeTrialDaysRemaining = (
  trialEndsAt: string | null,
): number | null => {
  if (!trialEndsAt) return null;
  const ends = new Date(trialEndsAt).getTime();
  const now = Date.now();
  if (ends <= now) return null;
  return Math.ceil((ends - now) / (1000 * 60 * 60 * 24));
};

// ─── Styles ─────────────────────────────────────────────

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
  },

  /* ── 브랜드 ── */
  brandSection: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  crownWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primaryLight,
  },
  crownEmoji: {
    fontSize: 36,
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: theme.colors.primarySurface,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
  },

  /* ── 혜택 ── */
  benefitsSection: {
    marginTop: SPACING.xxl,
  },
  benefitsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  benefitRow: {
    alignItems: 'center',
    paddingVertical: LAYOUT.cardPy,
    paddingHorizontal: LAYOUT.cardPx,
    gap: SPACING.md,
  },
  benefitRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray100,
  },
  benefitEmoji: {
    fontSize: 24,
  },
  benefitText: {
    flex: 1,
  },

  /* ── 가격 ── */
  priceSection: {
    marginTop: SPACING.xxl,
  },
  priceCard: {
    padding: SPACING.xl,
    alignItems: 'center',
  },

  /* ── 약관 ── */
  fineSection: {
    marginTop: SPACING.lg,
  },

  /* ── 하단 CTA ── */
  bottomBar: {
    paddingTop: LAYOUT.headerPy,
    borderTopWidth: 2,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
