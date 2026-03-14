import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Box, Button, Column, Text } from '@/components/base';
import { PERMISSION_CONFIGS } from '@/constants/permissions';
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
  const config = PERMISSION_CONFIGS[type];

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
          {config.title}이 필요해요
        </Text>
        <Text
          variant="bodySmall"
          color="textSecondary"
          align="center"
          mt="sm"
        >
          {'설정에서 직접 권한을 허용해주세요.\n앱 설정 → PairWalk → 권한'}
        </Text>
      </Column>

      <Box style={{ width: '100%', marginTop: SPACING.xxl }}>
        <Button onPress={openAppSettings} size="large" variant="secondary">
          설정으로 이동
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
