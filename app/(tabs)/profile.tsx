import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box, Row, Text } from '@/components/base';
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
          <Ionicons
            name="settings-outline"
            size={22}
            color={theme.colors.gray500}
          />
        </Pressable>
      </Row>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Box px="xxl">
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={{ fontSize: 28 }}>🚶</Text>
            </View>

            <Text variant="headingMedium" mt="md">
              사용자
            </Text>
          </View>
        </Box>

        {/* Stats Grid — Couple Stats */}
        <Box px="xxl" style={{ marginTop: SPACING.lg }}>
          <Row gap={12}>
            <StatCard label="총 산책" value="0회" icon="footsteps-outline" />
            <StatCard label="총 걸음" value="0" icon="walk-outline" />
            <StatCard label="연속 산책" value="0일" icon="flame-outline" />
          </Row>
        </Box>

        {/* Menu Items */}
        <Box px="xxl" style={{ marginTop: SPACING.xxl }}>
          <MenuItem icon="person-outline" label="프로필 수정" />
          <MenuItem icon="heart-outline" label="커플 관리" />
          <MenuItem icon="bar-chart-outline" label="산책 통계" />
          <MenuItem icon="help-circle-outline" label="도움말" />
          <MenuItem icon="log-out-outline" label="로그아웃" isDestructive />
        </Box>
      </ScrollView>
    </View>
  );
}

// ─── Sub Components ─────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={20} color={theme.colors.primary} />
      <Text variant="displaySmall" color="primary" mt="sm">
        {value}
      </Text>
      <Text variant="caption" color="textMuted" mt="xs">
        {label}
      </Text>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  isDestructive = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  isDestructive?: boolean;
}) {
  return (
    <Pressable style={styles.menuItem}>
      <Row style={{ alignItems: 'center', flex: 1 }}>
        <Ionicons
          name={icon}
          size={20}
          color={isDestructive ? theme.colors.error : theme.colors.gray500}
        />
        <Text
          variant="bodyMedium"
          color={isDestructive ? 'error' : 'text'}
          ml="md"
        >
          {label}
        </Text>
      </Row>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={theme.colors.gray300}
      />
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
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xxl,
    padding: SPACING.xxl,
    alignItems: 'center',
    ...theme.shadows.card,
  },
  avatar: {
    width: COMPONENT_SIZE.avatarLarge,
    height: COMPONENT_SIZE.avatarLarge,
    borderRadius: COMPONENT_SIZE.avatarLarge / 2,
    backgroundColor: theme.colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    ...theme.shadows.card,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.gray200,
  },
});
