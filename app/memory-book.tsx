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
        {/* 잔액 + 뽑기 CTA (한 카드로 압축) */}
        <Box px="xxl">
          <PixelCard style={styles.balanceCard}>
            <Row style={styles.balanceRow}>
              <View style={styles.balanceCol}>
                <Text variant="caption" color="textMuted" style={styles.smallLabel}>
                  {t('memory-book:balance.credits-label')}
                </Text>
                <Row style={styles.numRow}>
                  <Text variant="displaySmall" color="primary" style={styles.bigNum}>
                    {creditsRemaining}
                  </Text>
                  <Text variant="caption" color="textMuted" ml="xxs">
                    {t('memory-book:balance.credits-unit')}
                  </Text>
                </Row>
              </View>
              <View style={styles.balanceCol}>
                <Text variant="caption" color="textMuted" style={styles.smallLabel}>
                  {t('memory-book:balance.stamps-label')}
                </Text>
                <Row style={styles.numRow}>
                  <Text variant="displaySmall" color="secondary" style={styles.bigNum}>
                    {totalStamps.toLocaleString()}
                  </Text>
                  <Text variant="caption" color="textMuted" ml="xxs">
                    {t('memory-book:balance.stamps-unit')}
                  </Text>
                </Row>
              </View>
            </Row>

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
          </PixelCard>
        </Box>

        {/* 발자국 교환 — 한 줄 row */}
        <Box px="xxl" style={styles.section}>
          <Pressable
            style={[
              styles.redeemRow,
              (!canRedeemMore || !hasEnoughStamps) && styles.redeemRowDisabled,
            ]}
            onPress={handleRedeem}
            disabled={
              !canRedeemMore || !hasEnoughStamps || processing === 'redeem'
            }
          >
            <Icon name="footprint" size={18} color={theme.colors.accent} />
            <View style={{ flex: 1, marginLeft: SPACING.sm }}>
              <Text variant="bodySmall" style={{ fontWeight: '600' }}>
                {t('memory-book:redeem.headline', {
                  cost: BOOK_ECONOMY.STAMP_COST_PER_BOOK,
                })}
              </Text>
              <Text variant="caption" color="textMuted">
                {!canRedeemMore
                  ? t('memory-book:redeem.cap-reached')
                  : !hasEnoughStamps
                    ? t('memory-book:redeem.need-more', {
                        remain: Math.max(0, requiredStamps - totalStamps),
                      })
                    : t('memory-book:redeem.subhead', {
                        redeemed: redeemedThisYear,
                        cap: BOOK_ECONOMY.ANNUAL_REDEEM_CAP,
                      })}
              </Text>
            </View>
            {canRedeemMore && hasEnoughStamps && (
              <Icon name="chevron-right" size={16} color={theme.colors.primary} />
            )}
          </Pressable>
        </Box>

        {/* 바로 구매 */}
        <Box px="xxl" style={styles.section}>
          {singlePack && (
            <PurchaseRow
              emoji={singlePack.emoji}
              name={singlePack.name}
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
              priceKrw={triplePack.priceKrw}
              badge={triplePack.badge}
              processing={processing === triplePack.id}
              onPress={() =>
                handlePurchase(triplePack.id, BOOK_ECONOMY.TRIPLE_CREDITS)
              }
            />
          )}
        </Box>
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
  priceKrw,
  badge,
  processing,
  onPress,
}: {
  emoji: string;
  name: string;
  priceKrw: number;
  badge?: string;
  processing: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} disabled={processing} style={styles.purchaseWrap}>
      <Row style={styles.purchaseInner}>
        <Text style={styles.purchaseEmoji}>{emoji}</Text>
        <View style={{ flex: 1 }}>
          <Row style={{ alignItems: 'center' }}>
            <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
              {name}
            </Text>
            {badge && (
              <Text
                variant="caption"
                color="primary"
                ml="sm"
                style={{ fontSize: 10, fontWeight: '600' }}
              >
                {badge}
              </Text>
            )}
          </Row>
        </View>
        <Text variant="bodyLarge" color="primary" style={styles.purchasePrice}>
          ₩{priceKrw.toLocaleString('ko-KR')}
        </Text>
      </Row>
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
  section: {
    marginTop: SPACING.md,
  },

  // Balance
  balanceCard: {
    padding: LAYOUT.cardPx,
    gap: SPACING.md,
  },
  balanceRow: {
    gap: SPACING.lg,
  },
  balanceCol: {
    flex: 1,
  },
  smallLabel: {
    fontSize: 10,
  },
  numRow: {
    alignItems: 'baseline',
    marginTop: 2,
  },
  bigNum: {
    fontFamily: FONT_FAMILY.pixel,
    fontWeight: '800',
  },

  // Redeem (row)
  redeemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: theme.colors.surfaceWarm,
    borderRadius: theme.radius.md,
  },
  redeemRowDisabled: {
    opacity: 0.5,
  },

  // Purchase
  purchaseWrap: {
    marginBottom: SPACING.xs,
  },
  purchaseInner: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  purchaseEmoji: {
    fontSize: 22,
  },
  purchasePrice: {
    fontWeight: '700',
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
