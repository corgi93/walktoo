import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Row, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { COMPONENT_SIZE, SPACING } from '@/styles/type';
import { formatDday } from '@/utils';

// ─── Types ──────────────────────────────────────────────

interface CoupleHeaderProps {
  myName: string;
  partnerName: string;
  startDate: string;
}

// ─── Component ──────────────────────────────────────────

export function CoupleHeader({
  myName,
  partnerName,
  startDate,
}: CoupleHeaderProps) {
  return (
    <View style={styles.container}>
      {/* 두 아바타 + 하트 */}
      <Row style={styles.avatarRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>🚶‍♂️</Text>
        </View>
        <View style={styles.heartBadge}>
          <Text style={styles.heartEmoji}>💕</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>🚶‍♀️</Text>
        </View>
      </Row>

      {/* 커플 이름 */}
      <Row style={styles.nameRow}>
        <Text variant="headingSmall">{myName}</Text>
        <Text variant="bodySmall" color="textMuted" style={styles.ampersand}>
          &
        </Text>
        <Text variant="headingSmall">{partnerName}</Text>
      </Row>

      {/* D+Day */}
      <Text variant="label" color="primary" mt="xs">
        {formatDday(startDate)}
      </Text>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  avatarRow: {
    alignItems: 'center',
    gap: -8,
  },
  avatar: {
    width: COMPONENT_SIZE.avatarMedium,
    height: COMPONENT_SIZE.avatarMedium,
    borderRadius: COMPONENT_SIZE.avatarMedium / 2,
    backgroundColor: theme.colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.white,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  heartBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: -10,
    zIndex: 1,
  },
  heartEmoji: {
    fontSize: 14,
  },
  nameRow: {
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  ampersand: {
    marginHorizontal: SPACING.xs,
  },
});
