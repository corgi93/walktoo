import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Box, Icon, PixelCard, Row, Text } from '@/components/base';
import { SimpleDatePicker } from '@/components/base/SimpleDatePicker';
import {
  useDisconnectCoupleMutation,
  useUpdateFirstMetDateMutation,
} from '@/hooks/services/couple/mutation';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import { theme } from '@/styles/theme';
import { LAYOUT } from '@/styles/type';
import { formatDday } from '@/utils/date';

// ─── Screen ──────────────────────────────────────────────

export default function CoupleManageScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation(['couple', 'common']);
  const { couple, partner } = usePartnerDerivation();
  const updateFirstMetDate = useUpdateFirstMetDateMutation();
  const disconnect = useDisconnectCoupleMutation();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDisconnect = () => {
    if (!couple) return;
    Alert.alert(
      t('couple:manage.unlink-confirm-title'),
      t('couple:manage.unlink-confirm-message'),
      [
        { text: t('couple:manage.unlink-confirm-cancel'), style: 'cancel' },
        {
          text: t('couple:manage.unlink-confirm-confirm'),
          style: 'destructive',
          onPress: () => {
            disconnect.mutate(
              {
                coupleId: couple.id,
                user1Id: couple.user1.id,
                user2Id: couple.user2.id,
              },
              { onSuccess: () => router.back() },
            );
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Row px="xxl" style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Icon name="arrow-left" size={22} color={theme.colors.text} />
        </Pressable>
        <Text variant="headingMedium">{t('couple:manage.title')}</Text>
        <View style={{ width: 22 }} />
      </Row>

      <Box px="xxl" style={{ marginTop: 24 }}>
        <PixelCard style={styles.partnerCard}>
          <View style={styles.partnerAvatar}>
            <Icon name="heart" size={24} color={theme.colors.primary} />
          </View>
          <Text variant="headingSmall" mt="md">
            {partner?.nickname ?? t('common:fallback.partner-nickname')}
          </Text>
          <Text variant="caption" color="textSecondary" mt="xs">
            {t('couple:manage.my-partner')}
          </Text>
        </PixelCard>
      </Box>

      <Box px="xxl" style={{ marginTop: 24 }}>
        <PixelCard style={styles.menuCard}>
          <Pressable
            style={styles.menuItem}
            onPress={() => setShowDatePicker(true)}
          >
            <Row style={{ alignItems: 'center', flex: 1 }}>
              <Icon name="calendar" size={18} color={theme.colors.gray600} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text variant="bodyMedium">{t('couple:manage.first-met-label')}</Text>
                <Text variant="caption" color="primary" mt="xxs">
                  {couple?.firstMetDate
                    ? `${couple.firstMetDate.replace(/-/g, '.')} (${formatDday(couple.firstMetDate)})`
                    : t('couple:manage.first-met-empty')}
                </Text>
              </View>
            </Row>
            <Icon name="chevron-right" size={16} color={theme.colors.gray400} />
          </Pressable>

          <Pressable
            style={[styles.menuItem, styles.menuItemLast]}
            onPress={handleDisconnect}
          >
            <Row style={{ alignItems: 'center', flex: 1 }}>
              <Icon name="unlink" size={18} color={theme.colors.error} />
              <Text variant="bodyMedium" color="error" ml="md">
                {t('couple:manage.unlink-button')}
              </Text>
            </Row>
            <Icon name="chevron-right" size={16} color={theme.colors.gray400} />
          </Pressable>
        </PixelCard>
      </Box>

      {showDatePicker && couple && (
        <SimpleDatePicker
          currentDate={couple.firstMetDate}
          onSave={(date) => {
            updateFirstMetDate.mutate({ coupleId: couple.id, date });
            setShowDatePicker(false);
          }}
          onClose={() => setShowDatePicker(false)}
          title={t('couple:manage.first-met-picker-title')}
        />
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: LAYOUT.headerPy,
  },
  partnerCard: {
    alignItems: 'center',
    padding: 24,
  },
  partnerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: theme.colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
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
