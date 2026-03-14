import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Box, Button, Column, Text } from '@/components/base';
import { PERMISSION_CONFIGS } from '@/constants/permissions';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';
import { PermissionType } from '@/types/permission';

// ─── Types ──────────────────────────────────────────

interface PermissionPromptProps {
  type: PermissionType;
  onAllow: () => void;
  onSkip?: () => void;
  loading?: boolean;
}

// ─── Component ──────────────────────────────────────

export const PermissionPrompt: React.FC<PermissionPromptProps> = ({
  type,
  onAllow,
  onSkip,
  loading,
}) => {
  const config = PERMISSION_CONFIGS[type];

  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Ionicons name={config.icon} size={32} color={theme.colors.primary} />
      </View>

      <Column style={{ alignItems: 'center', marginTop: SPACING.lg }}>
        <Text variant="headingSmall" align="center">
          {config.title}
        </Text>
        <Text
          variant="bodySmall"
          color="textSecondary"
          align="center"
          mt="sm"
        >
          {config.description}
        </Text>
      </Column>

      <Box style={{ width: '100%', marginTop: SPACING.xxl }}>
        <Button onPress={onAllow} size="large" loading={loading}>
          허용하기
        </Button>
        {!config.required && onSkip && (
          <Button onPress={onSkip} variant="ghost" size="medium" mt="sm">
            나중에 하기
          </Button>
        )}
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
