import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';

// ─── Types ──────────────────────────────────────────────

interface HeroStatCardProps {
  value: string;
  label: string;
  emoji?: string;
}

// ─── Component ──────────────────────────────────────────

export function HeroStatCard({
  value,
  label,
  emoji = '👣',
}: HeroStatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text variant="displayLarge" color="primary" mt="sm">
        {value}
      </Text>
      <Text variant="bodySmall" color="textSecondary" mt="xs">
        {label}
      </Text>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xxl,
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xxl,
    alignItems: 'center',
    ...theme.shadows.card,
  },
  emoji: {
    fontSize: 32,
  },
});
