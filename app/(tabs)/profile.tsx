import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box, PixelCard, Row, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { COMPONENT_SIZE, SPACING } from '@/styles/type';

// ─── Component ──────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Row
        px="xxl"
        py="lg"
        style={{ justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Text variant="headingLarge">마이</Text>
        <Pressable hitSlop={8}>
          <Text style={{ fontSize: 20 }}>⚙️</Text>
        </Pressable>
      </Row>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Box px="xxl">
          <PixelCard style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={{ fontSize: 28 }}>🚶</Text>
            </View>

            <Text variant="headingMedium" mt="md">
              사용자
            </Text>
            <Text variant="caption" color="textMuted" mt="xxs">
              함께 걷는 중 💕
            </Text>
          </PixelCard>
        </Box>

        {/* Stats Grid — Couple Stats */}
        <Box px="xxl" style={{ marginTop: SPACING.lg }}>
          <Row gap={12}>
            <PixelCard style={styles.statCard} bg={theme.colors.primarySurface}>
              <Text style={{ fontSize: 20 }}>👣</Text>
              <Text variant="displaySmall" color="primary" mt="sm">
                0회
              </Text>
              <Text variant="caption" color="textSecondary" mt="xs">
                총 산책
              </Text>
            </PixelCard>
            <PixelCard style={styles.statCard}>
              <Text style={{ fontSize: 20 }}>👟</Text>
              <Text variant="displaySmall" color="primary" mt="sm">
                0
              </Text>
              <Text variant="caption" color="textSecondary" mt="xs">
                총 걸음
              </Text>
            </PixelCard>
            <PixelCard style={styles.statCard} bg={theme.colors.goldLight}>
              <Text style={{ fontSize: 20 }}>🔥</Text>
              <Text variant="displaySmall" color="primary" mt="sm">
                0일
              </Text>
              <Text variant="caption" color="textSecondary" mt="xs">
                연속 산책
              </Text>
            </PixelCard>
          </Row>
        </Box>

        {/* Menu Items */}
        <Box px="xxl" style={{ marginTop: SPACING.xxl }}>
          <PixelCard style={styles.menuCard}>
            <MenuItem emoji="✏️" label="프로필 수정" />
            <MenuItem emoji="💕" label="커플 관리" />
            <MenuItem emoji="📊" label="산책 통계" />
            <MenuItem emoji="🚪" label="로그아웃" isDestructive isLast />
          </PixelCard>
        </Box>
      </ScrollView>
    </View>
  );
}

// ─── Sub Components ─────────────────────────────────────

function MenuItem({
  emoji,
  label,
  isDestructive = false,
  isLast = false,
}: {
  emoji: string;
  label: string;
  isDestructive?: boolean;
  isLast?: boolean;
}) {
  return (
    <Pressable style={[styles.menuItem, isLast && styles.menuItemLast]}>
      <Row style={{ alignItems: 'center', flex: 1 }}>
        <Text style={{ fontSize: 16 }}>{emoji}</Text>
        <Text
          variant="bodyMedium"
          color={isDestructive ? 'error' : 'text'}
          ml="md"
        >
          {label}
        </Text>
      </Row>
      <Text variant="caption" color="textMuted">{'>'}</Text>
    </Pressable>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  profileCard: {
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  avatar: {
    width: COMPONENT_SIZE.avatarLarge,
    height: COMPONENT_SIZE.avatarLarge,
    borderRadius: 8,
    backgroundColor: theme.colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.gray200,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
});
