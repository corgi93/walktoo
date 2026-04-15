import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Icon, IconName, PixelCard, Row, Text } from '@/components/base';
import { Box } from '@/components/base';
import { useLogoutMutation } from '@/hooks/services/auth/mutation';
import { useCoupleStatsQuery } from '@/hooks/services/couple/query';
import { useTotalStampsQuery } from '@/hooks/services/stamps/query';
import { useGetMeQuery } from '@/hooks/services/user/query';
import { useEntitlement } from '@/hooks/useEntitlement';
import { useRefresh } from '@/hooks/useRefresh';
import { theme } from '@/styles/theme';
import { COMPONENT_SIZE, LAYOUT, SPACING } from '@/styles/type';
import { formatNumber } from '@/utils/date';

// ─── Component ──────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation(['profile', 'premium']);

  const { data: me } = useGetMeQuery();
  const { data: stats } = useCoupleStatsQuery();
  const logout = useLogoutMutation();
  const { refreshing, onRefresh } = useRefresh();
  const { isEntitled } = useEntitlement();

  const hasCoupleId = !!me?.coupleId;
  const { data: totalStamps = 0 } = useTotalStampsQuery(hasCoupleId);

  const totalWalks = stats?.totalWalks ?? 0;
  const currentStreak = stats?.currentStreak ?? 0;

  const handleLogout = () => {
    Alert.alert(t('logout-confirm.title'), t('logout-confirm.message'), [
      { text: t('logout-confirm.cancel'), style: 'cancel' },
      {
        text: t('logout-confirm.confirm'),
        style: 'destructive',
        onPress: () => logout.mutate(),
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <Row px="xxl" style={styles.header}>
        <Text variant="headingLarge">{t('tab-title')}</Text>
      </Row>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* ── Profile Card ── */}
        <Box px="xxl">
          <PixelCard style={styles.profileCard}>
            <View style={styles.avatar}>
              <Icon name="user" size={28} color={theme.colors.primary} />
            </View>

            <Text variant="headingMedium" mt="md">
              {me?.nickname ?? t('fallback-name')}
            </Text>

            {hasCoupleId ? (
              <View style={styles.coupleStatus}>
                <Icon name="heart" size={12} color={theme.colors.primary} />
                <Text variant="caption" color="primary" ml="xs">
                  {t('status.with-partner')}
                </Text>
              </View>
            ) : (
              <View style={styles.soloStatus}>
                <Icon name="user" size={12} color={theme.colors.gray500} />
                <Text variant="caption" color="textMuted" ml="xs">
                  {t('status.solo')}
                </Text>
              </View>
            )}
          </PixelCard>
        </Box>

        {hasCoupleId ? (
          <Box px="xxl" style={styles.section}>
            <Row gap={LAYOUT.itemGapMd}>
              <PixelCard style={styles.statCard} bg={theme.colors.primarySurface}>
                <Icon name="footprint" size={22} color={theme.colors.primary} />
                <Text variant="displaySmall" color="primary" mt="sm">
                  {t('stats.total-walks-count', { count: totalWalks })}
                </Text>
                <Text variant="caption" color="textSecondary" mt="xs">
                  {t('stats.total-walks')}
                </Text>
              </PixelCard>
              <PixelCard style={styles.statCard}>
                <Icon name="footprint" size={22} color={theme.colors.primary} />
                <Text variant="displaySmall" color="primary" mt="sm">
                  {formatNumber(totalStamps)}
                </Text>
                <Text variant="caption" color="textSecondary" mt="xs">
                  {t('stats.total-stamps')}
                </Text>
              </PixelCard>
              <PixelCard style={styles.statCard} bg={theme.colors.goldLight}>
                <Icon name="fire" size={22} color={theme.colors.accent} />
                <Text variant="displaySmall" color="primary" mt="sm">
                  {t('stats.current-streak-days', { count: currentStreak })}
                </Text>
                <Text variant="caption" color="textSecondary" mt="xs">
                  {t('stats.current-streak')}
                </Text>
              </PixelCard>
            </Row>
          </Box>
        ) : (
          <Box px="xxl" style={styles.section}>
            <PixelCard style={styles.noCoupleStatsCard} bg={theme.colors.surfaceWarm}>
              <Row style={styles.noCoupleHeader}>
                <View style={styles.noCoupleIcon}>
                  <Icon name="mail" size={24} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="headingSmall">{t('no-couple.title')}</Text>
                  <Text variant="caption" color="textSecondary" mt="xxs">
                    {t('no-couple.subtitle')}
                  </Text>
                </View>
              </Row>

              <Row gap={LAYOUT.itemGapMd} style={styles.ghostRow}>
                <View style={styles.ghostStat}>
                  <Icon name="footprint" size={18} color={theme.colors.gray400} />
                  <Text variant="bodyMedium" color="textMuted" mt="xs">
                    ?
                  </Text>
                </View>
                <View style={styles.ghostStat}>
                  <Icon name="shoe-sneaker" size={18} color={theme.colors.gray400} />
                  <Text variant="bodyMedium" color="textMuted" mt="xs">
                    ???
                  </Text>
                </View>
                <View style={styles.ghostStat}>
                  <Icon name="fire" size={18} color={theme.colors.gray400} />
                  <Text variant="bodyMedium" color="textMuted" mt="xs">
                    ?
                  </Text>
                </View>
              </Row>
            </PixelCard>
          </Box>
        )}

        {/* ── walkToo+ 업그레이드 CTA (free 일 때만) ── */}
        {!isEntitled && (
          <Box px="xxl" style={styles.section}>
            <Pressable onPress={() => router.push('/paywall')}>
              <PixelCard style={styles.upgradeCard} bg={theme.colors.primarySurface}>
                <Row style={styles.upgradeRow}>
                  <Text style={styles.upgradeEmoji}>👑</Text>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium" color="primary">
                      {t('premium:menu.upgrade')}
                    </Text>
                    <Text variant="caption" color="textMuted" mt="xxs">
                      {t('premium:tagline')}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={16} color={theme.colors.primary} />
                </Row>
              </PixelCard>
            </Pressable>
          </Box>
        )}

        {/* ── Menu Items ── */}
        <Box px="xxl" style={styles.menuSection}>
          <PixelCard style={styles.menuCard}>
            <MenuItem
              iconName="edit"
              label={t('menu.edit-profile')}
              onPress={() => router.push('/profile-edit')}
            />
            {hasCoupleId ? (
              <MenuItem
                iconName="heart"
                label={t('menu.couple-manage')}
                iconColor={theme.colors.primary}
                onPress={() => router.push('/couple-manage')}
              />
            ) : (
              <MenuItem iconName="link" label={t('menu.couple-connect')} />
            )}
            <MenuItem
              iconName="bar-chart"
              label={t('menu.stats')}
              locked={!isEntitled}
              onPress={() => {
                if (!isEntitled) router.push('/paywall');
                // entitled일 때 통계 페이지는 후속 작업
              }}
            />
            <MenuItem
              iconName="log-out"
              label={t('menu.logout')}
              isDestructive
              isLast
              onPress={handleLogout}
            />
          </PixelCard>
        </Box>
      </ScrollView>
    </View>
  );
}

// ─── Sub Components ─────────────────────────────────────

function MenuItem({
  iconName,
  label,
  iconColor,
  isDestructive = false,
  isLast = false,
  locked = false,
  onPress,
}: {
  iconName: IconName;
  label: string;
  iconColor?: string;
  isDestructive?: boolean;
  isLast?: boolean;
  locked?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={[styles.menuItem, isLast && styles.menuItemLast]}
      onPress={onPress}
    >
      <Row style={{ alignItems: 'center', flex: 1 }}>
        <Icon
          name={iconName}
          size={18}
          color={isDestructive ? theme.colors.error : (iconColor ?? theme.colors.gray600)}
        />
        <Text
          variant="bodyMedium"
          color={isDestructive ? 'error' : 'text'}
          ml="md"
        >
          {label}
        </Text>
        {locked && (
          <View style={styles.lockBadge}>
            <Icon name="lock" size={10} color={theme.colors.gray500} />
          </View>
        )}
      </Row>
      <Icon name="chevron-right" size={16} color={theme.colors.gray400} />
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
    paddingBottom: LAYOUT.bottomSafe + LAYOUT.sectionGap,
  },
  section: {
    marginTop: LAYOUT.sectionGap,
  },
  profileCard: {
    alignItems: 'center',
    padding: LAYOUT.bottomSafe,
  },
  avatar: {
    width: COMPONENT_SIZE.avatarLarge,
    height: COMPONENT_SIZE.avatarLarge,
    borderRadius: 8,
    backgroundColor: theme.colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coupleStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: LAYOUT.itemGap,
    backgroundColor: theme.colors.primarySurface,
    paddingHorizontal: LAYOUT.itemGapMd,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  soloStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: LAYOUT.itemGap,
    backgroundColor: theme.colors.gray100,
    paddingHorizontal: LAYOUT.itemGapMd,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: LAYOUT.cardPx,
  },
  noCoupleStatsCard: {
    padding: LAYOUT.cardPx,
  },
  noCoupleHeader: {
    alignItems: 'center',
    gap: LAYOUT.itemGap,
  },
  noCoupleIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ghostRow: {
    marginTop: LAYOUT.sectionGap,
  },
  ghostStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: LAYOUT.itemGap,
    opacity: 0.5,
  },
  menuSection: {
    marginTop: LAYOUT.sectionGapLg,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: LAYOUT.cardPy,
    paddingHorizontal: LAYOUT.cardPx,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.gray200,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  lockBadge: {
    marginLeft: SPACING.sm,
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: theme.colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeCard: {
    paddingHorizontal: LAYOUT.cardPx,
    paddingVertical: LAYOUT.cardPy,
  },
  upgradeRow: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  upgradeEmoji: {
    fontSize: 28,
  },
});
