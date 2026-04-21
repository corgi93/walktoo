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

import { Icon, PixelCard, Row, Text } from '@/components/base';
import { useToast } from '@/components/composite/toast/ToastProvider';
import {
  DECORATION_PACKS,
  LIFETIME_PACK_ID,
  type DecorationPack,
} from '@/constants/decoration-packs';
import { useMarkPackPurchasedMutation } from '@/hooks/services/packs/mutation';
import { useUnlockedPacks } from '@/hooks/services/packs/query';
import {
  findPackageByProductId,
  getCurrentOffering,
  isRevenueCatReady,
  purchasePack,
  restorePurchases,
} from '@/lib/revenuecat';
import { theme } from '@/styles/theme';
import { LAYOUT, SPACING } from '@/styles/type';

// ─── Component ──────────────────────────────────────────

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { t } = useTranslation(['premium', 'common']);

  const markPack = useMarkPackPurchasedMutation();
  const { unlocked } = useUnlockedPacks();

  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [processingPackId, setProcessingPackId] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // ─── offering fetch (한 번) ───
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const o = await getCurrentOffering();
      if (cancelled) return;
      if (o) setOffering(o);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── 팩 하나 구매 ───
  const handlePurchase = async (pack: DecorationPack) => {
    if (processingPackId) return;
    if (unlocked.has(pack.id)) {
      toast.info(t('premium:result.already-owned'));
      return;
    }
    if (!isRevenueCatReady()) {
      toast.error(t('premium:result.sdk-unavailable'));
      return;
    }
    if (!offering) {
      toast.error(t('premium:result.sdk-unavailable'));
      return;
    }
    const rcPackage = findPackageByProductId(offering, pack.productId);
    if (!rcPackage) {
      toast.info(t('premium:result.coming-soon'));
      return;
    }

    setProcessingPackId(pack.id);
    const outcome = await purchasePack(rcPackage);
    if (outcome.userCancelled) {
      setProcessingPackId(null);
      return;
    }
    if (!outcome.ok) {
      setProcessingPackId(null);
      toast.error(t('premium:result.failed'));
      return;
    }

    // DB에 소유권 기록
    const sync = await markPack.mutateAsync({
      packId: pack.id,
      revenuecatProductId: pack.productId,
    });
    setProcessingPackId(null);
    if (sync.success) {
      toast.success(t('premium:result.success'));
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
    // TODO: 복원 시 RC entitlements를 훑어서 pack별 DB 동기화
    toast.success(t('premium:result.restored'));
  };

  const singles = DECORATION_PACKS.filter((p) => p.kind === 'single');
  const bundle = DECORATION_PACKS.find((p) => p.kind === 'bundle');
  const lifetime = DECORATION_PACKS.find((p) => p.id === LIFETIME_PACK_ID);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
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
        <Text variant="headingLarge" style={styles.pageTitle}>
          {t('premium:shop.title')}
        </Text>

        <View style={styles.singlesGrid}>
          {singles.map((pack) => (
            <PackCard
              key={pack.id}
              pack={pack}
              owned={unlocked.has(pack.id)}
              available={
                !!offering && !!findPackageByProductId(offering, pack.productId)
              }
              processing={processingPackId === pack.id}
              onPress={() => handlePurchase(pack)}
            />
          ))}
        </View>

        {bundle && (
          <View style={styles.section}>
            <PackRowCard
              pack={bundle}
              owned={unlocked.has(bundle.id)}
              available={
                !!offering && !!findPackageByProductId(offering, bundle.productId)
              }
              processing={processingPackId === bundle.id}
              onPress={() => handlePurchase(bundle)}
              accent="warm"
            />
          </View>
        )}

        {lifetime && (
          <View style={styles.section}>
            <PackRowCard
              pack={lifetime}
              owned={unlocked.has(lifetime.id)}
              available={
                !!offering &&
                !!findPackageByProductId(offering, lifetime.productId)
              }
              processing={processingPackId === lifetime.id}
              onPress={() => handlePurchase(lifetime)}
              accent="primary"
            />
          </View>
        )}
      </ScrollView>

      {processingPackId && (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
    </View>
  );
}

// ─── Pack Card (개별 팩 — 3열 그리드) ───────────────────

function PackCard({
  pack,
  owned,
  available,
  processing,
  onPress,
}: {
  pack: DecorationPack;
  owned: boolean;
  available: boolean;
  processing: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation('premium');
  const disabled = owned || processing;

  return (
    <Pressable
      style={[cardStyles.cell, owned && cardStyles.cellOwned]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={cardStyles.emoji}>{pack.emoji}</Text>
      <Text
        variant="bodySmall"
        color="text"
        align="center"
        numberOfLines={1}
        style={{ fontWeight: '600' }}
      >
        {pack.name}
      </Text>
      <Text
        variant="caption"
        color="textMuted"
        align="center"
        numberOfLines={2}
        mt="xxs"
        style={{ fontSize: 10, minHeight: 26 }}
      >
        {pack.description}
      </Text>

      <View style={cardStyles.priceRow}>
        {owned ? (
          <View style={cardStyles.ownedBadge}>
            <Icon name="check" size={10} color={theme.colors.secondary} />
            <Text
              variant="caption"
              color="secondary"
              ml="xxs"
              style={{ fontWeight: '600', fontSize: 10 }}
            >
              {t('shop.owned')}
            </Text>
          </View>
        ) : !available ? (
          <Text variant="caption" color="textMuted" style={{ fontSize: 10 }}>
            {t('shop.coming-soon')}
          </Text>
        ) : (
          <Text variant="caption" color="primary" style={{ fontWeight: '700' }}>
            {formatKRW(pack.priceKrw)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

// ─── Pack Row Card (번들/평생팩 — full-width) ───────────

function PackRowCard({
  pack,
  owned,
  available,
  processing,
  onPress,
  accent,
}: {
  pack: DecorationPack;
  owned: boolean;
  available: boolean;
  processing: boolean;
  onPress: () => void;
  accent: 'primary' | 'warm';
}) {
  const { t } = useTranslation('premium');
  const disabled = owned || processing;
  const bg =
    accent === 'primary' ? theme.colors.primarySurface : theme.colors.surfaceWarm;

  return (
    <Pressable onPress={onPress} disabled={disabled}>
      <PixelCard style={rowStyles.card} bg={bg}>
        <Row style={rowStyles.inner}>
          <Text style={rowStyles.emoji}>{pack.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Row style={{ alignItems: 'center' }}>
              <Text variant="bodyMedium" color="text" style={{ fontWeight: '700' }}>
                {pack.name}
              </Text>
              {pack.badge && (
                <View style={rowStyles.badge}>
                  <Text
                    variant="caption"
                    color="primary"
                    style={{ fontSize: 9, fontWeight: '700' }}
                  >
                    {pack.badge}
                  </Text>
                </View>
              )}
            </Row>
            <Text variant="caption" color="textMuted" mt="xxs">
              {pack.description}
            </Text>
          </View>
          <View style={rowStyles.priceCol}>
            {owned ? (
              <View style={cardStyles.ownedBadge}>
                <Icon name="check" size={12} color={theme.colors.secondary} />
                <Text
                  variant="caption"
                  color="secondary"
                  ml="xxs"
                  style={{ fontWeight: '600' }}
                >
                  {t('shop.owned')}
                </Text>
              </View>
            ) : !available ? (
              <Text variant="caption" color="textMuted">
                {t('shop.coming-soon')}
              </Text>
            ) : (
              <Text variant="bodyLarge" color="primary" style={{ fontWeight: '700' }}>
                {formatKRW(pack.priceKrw)}
              </Text>
            )}
          </View>
        </Row>
      </PixelCard>
    </Pressable>
  );
}

// ─── Helpers ────────────────────────────────────────────

const formatKRW = (price: number): string =>
  `₩${price.toLocaleString('ko-KR')}`;

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
    paddingHorizontal: SPACING.lg,
  },
  pageTitle: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  section: {
    marginTop: SPACING.md,
  },
  singlesGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
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

const cardStyles = StyleSheet.create({
  cell: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    padding: SPACING.md,
    alignItems: 'center',
    minHeight: 140,
    shadowColor: theme.colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  cellOwned: {
    opacity: 0.7,
  },
  emoji: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  priceRow: {
    marginTop: 'auto',
    paddingTop: SPACING.xs,
  },
  ownedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});

const rowStyles = StyleSheet.create({
  card: {
    padding: 0,
  },
  inner: {
    alignItems: 'center',
    gap: SPACING.md,
    padding: LAYOUT.cardPx,
  },
  emoji: {
    fontSize: 32,
  },
  badge: {
    marginLeft: SPACING.xs,
    paddingHorizontal: 6,
    paddingVertical: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
  },
  priceCol: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
});
