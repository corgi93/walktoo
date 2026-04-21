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
import type { PurchasesOffering } from 'react-native-purchases';

import { Box, Button, Icon, PixelCard, Row, Text } from '@/components/base';
import { useToast } from '@/components/composite/toast/ToastProvider';
import {
  BOOK_ECONOMY,
  BOOK_PACK_IDS,
  findPack,
} from '@/constants/decoration-packs';
import {
  useAddBookCreditsMutation,
  useConsumeBookCreditMutation,
  useRedeemStampsMutation,
} from '@/hooks/services/book-credits/mutation';
import { useBookCreditsQuery } from '@/hooks/services/book-credits/query';
import { useTotalStampsQuery } from '@/hooks/services/stamps/query';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import {
  findPackageByProductId,
  getCurrentOffering,
  isRevenueCatReady,
  purchasePack,
} from '@/lib/revenuecat';
import { theme } from '@/styles/theme';
import { FONT_FAMILY, LAYOUT, SPACING } from '@/styles/type';

// ─── Component ──────────────────────────────────────────

export default function MemoryBookScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { t } = useTranslation(['memory-book', 'common']);
  const { isCoupleConnected } = usePartnerDerivation();

  const { data: credits } = useBookCreditsQuery();
  const { data: totalStamps = 0 } = useTotalStampsQuery(isCoupleConnected);
  const addCredits = useAddBookCreditsMutation();
  const redeemStamps = useRedeemStampsMutation();
  const consumeCredit = useConsumeBookCreditMutation();

  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const o = await getCurrentOffering();
      if (!cancelled && o) setOffering(o);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const creditsRemaining = credits?.credits ?? 0;
  const redeemedThisYear = credits?.redeemedThisYear ?? 0;
  const canRedeemMore = redeemedThisYear < BOOK_ECONOMY.ANNUAL_REDEEM_CAP;
  const requiredStamps =
    BOOK_ECONOMY.STAMP_COST_PER_BOOK * (redeemedThisYear + 1);
  const hasEnoughStamps = totalStamps >= requiredStamps;

  const singlePack = findPack(BOOK_PACK_IDS.SINGLE);
  const triplePack = findPack(BOOK_PACK_IDS.TRIPLE);

  // ─── 핸들러 ───

  const handlePurchase = async (packId: string, creditsToAdd: number) => {
    const pack = findPack(packId);
    if (!pack || processing) return;
    if (!isRevenueCatReady() || !offering) {
      toast.error(t('memory-book:toast.sdk-unavailable'));
      return;
    }
    const rcPackage = findPackageByProductId(offering, pack.productId);
    if (!rcPackage) {
      toast.info(t('memory-book:toast.coming-soon'));
      return;
    }
    setProcessing(packId);
    const outcome = await purchasePack(rcPackage);
    if (outcome.userCancelled) {
      setProcessing(null);
      return;
    }
    if (!outcome.ok) {
      setProcessing(null);
      toast.error(t('memory-book:toast.purchase-failed'));
      return;
    }
    const result = await addCredits.mutateAsync(creditsToAdd);
    setProcessing(null);
    if (result.success) {
      toast.success(
        t('memory-book:toast.purchase-success', { count: creditsToAdd }),
      );
    } else {
      toast.error(t('memory-book:toast.purchase-failed'));
    }
  };

  const handleRedeem = async () => {
    if (processing) return;
    setProcessing('redeem');
    const result = await redeemStamps.mutateAsync();
    setProcessing(null);
    if (result.success) {
      toast.success(t('memory-book:toast.redeem-success'));
      return;
    }
    if (result.reason === 'annual_cap_reached') {
      toast.info(t('memory-book:toast.annual-cap'));
    } else if (result.reason === 'insufficient_stamps') {
      toast.info(
        t('memory-book:toast.insufficient', {
          required: result.required,
          current: result.current,
        }),
      );
    } else {
      toast.error(t('memory-book:toast.redeem-failed'));
    }
  };

  const handleExport = async () => {
    if (processing) return;
    if (creditsRemaining < 1) {
      toast.info(t('memory-book:toast.no-credits'));
      return;
    }
    setProcessing('export');
    const result = await consumeCredit.mutateAsync();
    setProcessing(null);
    if (result.success) {
      // TODO(phase-2): 실제 PDF 생성 + 공유
      toast.success(t('memory-book:toast.export-placeholder'));
    } else {
      toast.error(t('memory-book:toast.export-failed'));
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <Row px="xxl" style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Icon name="x" size={22} color={theme.colors.text} />
        </Pressable>
        <Text variant="headingMedium">{t('memory-book:title')}</Text>
        <View style={{ width: 32 }} />
      </Row>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + SPACING.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 표지 미리보기 (placeholder) */}
        <Box px="xxl">
          <PixelCard style={styles.coverCard} bg={theme.colors.primarySurface}>
            <Icon name="book-open" size={40} color={theme.colors.primary} />
            <Text variant="headingMedium" color="primary" mt="md" align="center">
              {t('memory-book:cover.title')}
            </Text>
            <Text variant="caption" color="textSecondary" mt="xs" align="center">
              {t('memory-book:cover.subtitle')}
            </Text>
          </PixelCard>
        </Box>

        {/* 크레딧 잔액 카드 */}
        <Box px="xxl" style={styles.section}>
          <PixelCard style={styles.balanceCard}>
            <View style={styles.balanceRow}>
              <View style={styles.balanceCol}>
                <Text variant="caption" color="textMuted">
                  {t('memory-book:balance.credits-label')}
                </Text>
                <Text variant="displaySmall" color="primary" style={styles.bigNum}>
                  {creditsRemaining}
                </Text>
                <Text variant="caption" color="textMuted">
                  {t('memory-book:balance.credits-unit')}
                </Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceCol}>
                <Text variant="caption" color="textMuted">
                  {t('memory-book:balance.stamps-label')}
                </Text>
                <Text variant="displaySmall" color="secondary" style={styles.bigNum}>
                  {totalStamps.toLocaleString()}
                </Text>
                <Text variant="caption" color="textMuted">
                  {t('memory-book:balance.stamps-unit')}
                </Text>
              </View>
            </View>

            {/* 뽑기 CTA */}
            <View style={styles.exportCta}>
              <Button
                variant="primary"
                size="large"
                onPress={handleExport}
                disabled={creditsRemaining < 1 || processing === 'export'}
              >
                {creditsRemaining > 0
                  ? t('memory-book:cta.export-with-credit')
                  : t('memory-book:cta.export-no-credit')}
              </Button>
              <Text variant="caption" color="textMuted" mt="xs" align="center">
                {t('memory-book:cta.export-hint')}
              </Text>
            </View>
          </PixelCard>
        </Box>

        {/* 스탬프로 교환 */}
        <Box px="xxl" style={styles.section}>
          <Text variant="label" color="textMuted" style={styles.sectionLabel}>
            {t('memory-book:redeem.title')}
          </Text>
          <PixelCard style={styles.optionCard} bg={theme.colors.surfaceWarm}>
            <Row style={styles.optionRow}>
              <View style={styles.optionIconWrap}>
                <Icon name="footprint" size={22} color={theme.colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium" style={{ fontWeight: '700' }}>
                  {t('memory-book:redeem.headline', {
                    cost: BOOK_ECONOMY.STAMP_COST_PER_BOOK,
                  })}
                </Text>
                <Text variant="caption" color="textMuted" mt="xxs">
                  {t('memory-book:redeem.subhead', {
                    redeemed: redeemedThisYear,
                    cap: BOOK_ECONOMY.ANNUAL_REDEEM_CAP,
                  })}
                </Text>
              </View>
            </Row>
            <Pressable
              style={[
                styles.redeemBtn,
                (!canRedeemMore || !hasEnoughStamps) && styles.redeemBtnDisabled,
              ]}
              onPress={handleRedeem}
              disabled={
                !canRedeemMore || !hasEnoughStamps || processing === 'redeem'
              }
            >
              <Text
                variant="bodySmall"
                color={canRedeemMore && hasEnoughStamps ? 'white' : 'textMuted'}
                style={{ fontWeight: '700' }}
              >
                {!canRedeemMore
                  ? t('memory-book:redeem.cap-reached')
                  : !hasEnoughStamps
                    ? t('memory-book:redeem.need-more', {
                        remain: Math.max(0, requiredStamps - totalStamps),
                      })
                    : t('memory-book:redeem.action')}
              </Text>
            </Pressable>
          </PixelCard>
        </Box>

        {/* 결제 구매 */}
        <Box px="xxl" style={styles.section}>
          <Text variant="label" color="textMuted" style={styles.sectionLabel}>
            {t('memory-book:purchase.title')}
          </Text>
          {singlePack && (
            <PurchaseRow
              emoji={singlePack.emoji}
              name={singlePack.name}
              description={singlePack.description}
              priceKrw={singlePack.priceKrw}
              processing={processing === singlePack.id}
              onPress={() =>
                handlePurchase(singlePack.id, BOOK_ECONOMY.SINGLE_CREDITS)
              }
            />
          )}
          {triplePack && (
            <PurchaseRow
              emoji={triplePack.emoji}
              name={triplePack.name}
              description={triplePack.description}
              priceKrw={triplePack.priceKrw}
              badge={triplePack.badge}
              processing={processing === triplePack.id}
              onPress={() =>
                handlePurchase(triplePack.id, BOOK_ECONOMY.TRIPLE_CREDITS)
              }
            />
          )}
        </Box>

        <Text
          variant="caption"
          color="textMuted"
          align="center"
          style={styles.finePrint}
        >
          {t('memory-book:fine-print')}
        </Text>
      </ScrollView>

      {processing && (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
    </View>
  );
}

// ─── Purchase Row ──────────────────────────────────────

function PurchaseRow({
  emoji,
  name,
  description,
  priceKrw,
  badge,
  processing,
  onPress,
}: {
  emoji: string;
  name: string;
  description: string;
  priceKrw: number;
  badge?: string;
  processing: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} disabled={processing} style={styles.purchaseWrap}>
      <PixelCard style={styles.purchaseCard}>
        <Row style={styles.purchaseInner}>
          <Text style={styles.purchaseEmoji}>{emoji}</Text>
          <View style={{ flex: 1 }}>
            <Row style={{ alignItems: 'center' }}>
              <Text variant="bodyMedium" style={{ fontWeight: '700' }}>
                {name}
              </Text>
              {badge && (
                <View style={styles.purchaseBadge}>
                  <Text
                    variant="caption"
                    color="primary"
                    style={{ fontSize: 9, fontWeight: '700' }}
                  >
                    {badge}
                  </Text>
                </View>
              )}
            </Row>
            <Text variant="caption" color="textMuted" mt="xxs">
              {description}
            </Text>
          </View>
          <Text variant="bodyLarge" color="primary" style={styles.purchasePrice}>
            ₩{priceKrw.toLocaleString('ko-KR')}
          </Text>
        </Row>
      </PixelCard>
    </Pressable>
  );
}

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
    paddingTop: SPACING.md,
  },
  coverCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  section: {
    marginTop: SPACING.xl,
  },
  sectionLabel: {
    marginBottom: SPACING.sm,
    paddingHorizontal: 4,
  },

  // Balance
  balanceCard: {
    padding: LAYOUT.cardPx,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  balanceCol: {
    flex: 1,
    alignItems: 'center',
  },
  balanceDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
    opacity: 0.4,
    marginHorizontal: SPACING.md,
  },
  bigNum: {
    fontFamily: FONT_FAMILY.pixel,
    fontWeight: '800',
    marginTop: 2,
  },
  exportCta: {
    marginTop: SPACING.lg,
  },

  // Redeem
  optionCard: {
    padding: LAYOUT.cardPx,
  },
  optionRow: {
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  optionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.primaryLight,
  },
  redeemBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  redeemBtnDisabled: {
    backgroundColor: theme.colors.gray100,
  },

  // Purchase
  purchaseWrap: {
    marginBottom: SPACING.sm,
  },
  purchaseCard: {
    padding: 0,
  },
  purchaseInner: {
    alignItems: 'center',
    gap: SPACING.md,
    padding: LAYOUT.cardPx,
  },
  purchaseEmoji: {
    fontSize: 28,
  },
  purchaseBadge: {
    marginLeft: SPACING.xs,
    paddingHorizontal: 6,
    paddingVertical: 1,
    backgroundColor: theme.colors.primarySurface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
  },
  purchasePrice: {
    fontWeight: '700',
  },

  // Fine print
  finePrint: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.xl,
  },

  // Overlay
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
