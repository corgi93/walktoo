import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Box, Button, Column, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';
import { PermissionType } from '@/types/permission';
import { openAppSettings } from '@/utils/permissions';

// ─── Types ──────────────────────────────────────────

interface PermissionSettingsGuideProps {
  type: PermissionType;
}

// ─── Component ──────────────────────────────────────

export const PermissionSettingsGuide: React.FC<
  PermissionSettingsGuideProps
> = ({ type }) => {
  const { t } = useTranslation('permission');

  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Ionicons
          name="settings-outline"
          size={28}
          color={theme.colors.gray500}
        />
      </View>

      <Column style={{ alignItems: 'center', marginTop: SPACING.lg }}>
        <Text variant="headingSmall" align="center">
          {t('settings-guide.needed', { title: t(`${type}.title`) })}
        </Text>
        <Text
          variant="bodySmall"
          color="textSecondary"
          align="center"
          mt="sm"
        >
          {t('settings-guide.description')}
        </Text>
      </Column>

      <Box style={{ width: '100%', marginTop: SPACING.xxl }}>
        <Button onPress={openAppSettings} size="large" variant="secondary">
          {t('settings-guide.open-settings')}
        </Button>
      </Box>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xxl,
    padding: SPACING.xxl,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
