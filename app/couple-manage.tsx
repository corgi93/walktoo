import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box, Icon, PixelCard, Row, Text } from '@/components/base';
import { SimpleDatePicker } from '@/components/base/SimpleDatePicker';
import {
  useDisconnectCoupleMutation,
  useUpdateFirstMetDateMutation,
} from '@/hooks/services/couple/mutation';
import { useGetCoupleQuery } from '@/hooks/services/couple/query';
import { useGetMeQuery } from '@/hooks/services/user/query';
import { theme } from '@/styles/theme';
import { LAYOUT } from '@/styles/type';
import { formatDday } from '@/utils';

// ─── Screen ──────────────────────────────────────────────

export default function CoupleManageScreen() {
  const insets = useSafeAreaInsets();
  const { data: me } = useGetMeQuery();
  const { data: couple } = useGetCoupleQuery();
  const updateFirstMetDate = useUpdateFirstMetDateMutation();
  const disconnect = useDisconnectCoupleMutation();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isUser1 = couple?.user1?.id === me?.id;
  const partner = isUser1 ? couple?.user2 : couple?.user1;

  const handleDisconnect = () => {
    if (!couple) return;
    Alert.alert(
      '커플 연결 해제',
      '정말 연결을 해제하시겠어요?\n모든 산책 기록이 유지되지만, 서로의 기록을 볼 수 없게 됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '해제',
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
      {/* Header */}
      <Row px="xxl" style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Icon name="arrow-left" size={22} color={theme.colors.text} />
        </Pressable>
        <Text variant="headingMedium">커플 관리</Text>
        <View style={{ width: 22 }} />
      </Row>

      {/* Partner Info */}
      <Box px="xxl" style={{ marginTop: 24 }}>
        <PixelCard style={styles.partnerCard}>
          <View style={styles.partnerAvatar}>
            <Icon name="heart" size={24} color={theme.colors.primary} />
          </View>
          <Text variant="headingSmall" mt="md">
            {partner?.nickname ?? '상대방'}
          </Text>
          <Text variant="caption" color="textSecondary" mt="xs">
            내 연인
          </Text>
        </PixelCard>
      </Box>

      {/* Settings */}
      <Box px="xxl" style={{ marginTop: 24 }}>
        <PixelCard style={styles.menuCard}>
          {/* 처음 만난 날 */}
          <Pressable
            style={styles.menuItem}
            onPress={() => setShowDatePicker(true)}
          >
            <Row style={{ alignItems: 'center', flex: 1 }}>
              <Icon name="calendar" size={18} color={theme.colors.gray600} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text variant="bodyMedium">처음 만난 날</Text>
                <Text variant="caption" color="primary" mt="xxs">
                  {couple?.firstMetDate
                    ? `${couple.firstMetDate.replace(/-/g, '.')} (${formatDday(couple.firstMetDate)})`
                    : '설정해주세요'}
                </Text>
              </View>
            </Row>
            <Icon name="chevron-right" size={16} color={theme.colors.gray400} />
          </Pressable>

          {/* 연결 해제 */}
          <Pressable
            style={[styles.menuItem, styles.menuItemLast]}
            onPress={handleDisconnect}
          >
            <Row style={{ alignItems: 'center', flex: 1 }}>
              <Icon name="unlink" size={18} color={theme.colors.error} />
              <Text variant="bodyMedium" color="error" ml="md">
                커플 연결 해제
              </Text>
            </Row>
            <Icon name="chevron-right" size={16} color={theme.colors.gray400} />
          </Pressable>
        </PixelCard>
      </Box>

      {/* Date Picker */}
      {showDatePicker && couple && (
        <SimpleDatePicker
          currentDate={couple.firstMetDate}
          onSave={(date) => {
            updateFirstMetDate.mutate({ coupleId: couple.id, date });
            setShowDatePicker(false);
          }}
          onClose={() => setShowDatePicker(false)}
          title="처음 만난 날이 언제인가요?"
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
