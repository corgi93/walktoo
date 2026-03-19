import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box, Icon, IconName, PixelCard, Row, Text } from '@/components/base';
import { useLogoutMutation } from '@/hooks/services/auth/mutation';
import { useCoupleStatsQuery } from '@/hooks/services/couple/query';
import { useGetMeQuery } from '@/hooks/services/user/query';
import { theme } from '@/styles/theme';
import { COMPONENT_SIZE, LAYOUT } from '@/styles/type';
import { formatSteps } from '@/utils';

// ─── Component ──────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: me } = useGetMeQuery();
  const { data: stats } = useCoupleStatsQuery();
  const logout = useLogoutMutation();

  const hasCoupleId = !!me?.coupleId;

  const totalWalks = stats?.totalWalks ?? 0;
  const totalSteps = stats?.totalSteps ?? 0;
  const currentStreak = stats?.currentStreak ?? 0;

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: () => logout.mutate(),
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <Row px="xxl" style={styles.header}>
        <Text variant="headingLarge">마이</Text>
        <Pressable hitSlop={8}>
          <Icon name="settings" size={22} color={theme.colors.gray600} />
        </Pressable>
      </Row>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Card ── */}
        <Box px="xxl">
          <PixelCard style={styles.profileCard}>
            <View style={styles.avatar}>
              <Icon name="user" size={28} color={theme.colors.primary} />
            </View>

            <Text variant="headingMedium" mt="md">
              {me?.nickname ?? '사용자'}
            </Text>

            {hasCoupleId ? (
              <View style={styles.coupleStatus}>
                <Icon name="heart" size={12} color={theme.colors.primary} />
                <Text variant="caption" color="primary" ml="xs">
                  연인과 함께 걷는 중
                </Text>
              </View>
            ) : (
              <View style={styles.soloStatus}>
                <Icon name="user" size={12} color={theme.colors.gray500} />
                <Text variant="caption" color="textMuted" ml="xs">
                  아직 짝이 없어요
                </Text>
              </View>
            )}
          </PixelCard>
        </Box>

        {hasCoupleId ? (
          /* ─── 커플 연결됨: Stats Grid ─── */
          <Box px="xxl" style={styles.section}>
            <Row gap={LAYOUT.itemGapMd}>
              <PixelCard style={styles.statCard} bg={theme.colors.primarySurface}>
                <Icon name="footprint" size={22} color={theme.colors.primary} />
                <Text variant="displaySmall" color="primary" mt="sm">
                  {totalWalks}회
                </Text>
                <Text variant="caption" color="textSecondary" mt="xs">
                  총 산책
                </Text>
              </PixelCard>
              <PixelCard style={styles.statCard}>
                <Icon name="shoe-sneaker" size={22} color={theme.colors.primary} />
                <Text variant="displaySmall" color="primary" mt="sm">
                  {formatSteps(totalSteps)}
                </Text>
                <Text variant="caption" color="textSecondary" mt="xs">
                  총 걸음
                </Text>
              </PixelCard>
              <PixelCard style={styles.statCard} bg={theme.colors.goldLight}>
                <Icon name="fire" size={22} color={theme.colors.accent} />
                <Text variant="displaySmall" color="primary" mt="sm">
                  {currentStreak}일
                </Text>
                <Text variant="caption" color="textSecondary" mt="xs">
                  연속 산책
                </Text>
              </PixelCard>
            </Row>
          </Box>
        ) : (
          /* ─── 커플 미연결: 연결 안내 ─── */
          <Box px="xxl" style={styles.section}>
            <PixelCard style={styles.noCoupleStatsCard} bg={theme.colors.surfaceWarm}>
              <Row style={styles.noCoupleHeader}>
                <View style={styles.noCoupleIcon}>
                  <Icon name="mail" size={24} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="headingSmall">내 사람을 초대해보세요</Text>
                  <Text variant="caption" color="textSecondary" mt="xxs">
                    연결하면 둘만의 기록이 시작돼요
                  </Text>
                </View>
              </Row>

              {/* 가림 처리된 미리보기 stats */}
              <Row gap={LAYOUT.itemGapMd} style={styles.ghostRow}>
                <View style={styles.ghostStat}>
                  <Icon name="footprint" size={18} color={theme.colors.gray400} />
                  <Text variant="bodyMedium" color="textMuted" mt="xs">
                    ??회
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
                    ??일
                  </Text>
                </View>
              </Row>
            </PixelCard>
          </Box>
        )}

        {/* ── Menu Items ── */}
        <Box px="xxl" style={styles.menuSection}>
          <PixelCard style={styles.menuCard}>
            <MenuItem
              iconName="edit"
              label="프로필 수정"
              onPress={() => router.push('/profile-edit')}
            />
            {hasCoupleId ? (
              <MenuItem
                iconName="heart"
                label="커플 관리"
                iconColor={theme.colors.primary}
                onPress={() => router.push('/couple-manage')}
              />
            ) : (
              <MenuItem iconName="link" label="커플 연결하기" />
            )}
            <MenuItem iconName="bar-chart" label="산책 통계" />
            <MenuItem
              iconName="log-out"
              label="로그아웃"
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
  onPress,
}: {
  iconName: IconName;
  label: string;
  iconColor?: string;
  isDestructive?: boolean;
  isLast?: boolean;
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
      </Row>
      <Icon name="chevron-right" size={16} color={theme.colors.gray400} />
    </Pressable>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  /* ── 전체 ── */
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

  /* ── 공통 섹션 간격 ── */
  section: {
    marginTop: LAYOUT.sectionGap,
  },

  /* ── 프로필 ── */
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

  /* ── 통계 ── */
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

  /* ── 메뉴 ── */
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
});
