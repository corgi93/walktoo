import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Column, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';

// ─── Component ──────────────────────────────────────────

export function DiaryEmptyState() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>👣</Text>

      <Column style={{ alignItems: 'center', marginTop: SPACING.lg }}>
        <Text variant="headingSmall" align="center">
          아직 발자취가 없어요
        </Text>
        <Text
          variant="bodySmall"
          color="textMuted"
          align="center"
          mt="sm"
        >
          함께 걸은 첫 번째 발자국을{'\n'}
          남겨보세요
        </Text>
      </Column>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xxl,
    padding: SPACING.xxxl,
    marginHorizontal: SPACING.xxl,
    alignItems: 'center',
    ...theme.shadows.card,
  },
  emoji: {
    fontSize: 40,
  },
});
