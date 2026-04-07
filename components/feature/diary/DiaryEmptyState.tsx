import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Column, Icon, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';

// ─── Component ──────────────────────────────────────────

export function DiaryEmptyState() {
  const { t } = useTranslation('diary');
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Icon name="footprint" size={32} color={theme.colors.gray400} />
      </View>

      <Column style={{ alignItems: 'center', marginTop: SPACING.lg }}>
        <Text variant="headingSmall" align="center">
          {t('list.empty-title')}
        </Text>
        <Text variant="bodySmall" color="textMuted" align="center" mt="sm">
          {t('list.empty-description')}
        </Text>
      </Column>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: SPACING.xxxl,
    marginHorizontal: SPACING.xxl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
