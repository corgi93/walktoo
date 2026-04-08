import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, PixelBadge, Row, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { LAYOUT } from '@/styles/type';
import { formatNumber } from '@/utils/date';

// 캘린더는 '기록' 탭으로 이동했으므로 헤더 아이콘 제거.
// 헤더는 로고 + 스탬프 뱃지 + 알림 벨 3개로 간소화.

interface HomeTopBarProps {
  isCoupleConnected: boolean;
  totalStamps: number;
  unreadCount: number;
}

/**
 * 홈 상단 바 — 로고 + 스탬프 뱃지(커플) + 알림 벨
 */
export function HomeTopBar({
  isCoupleConnected,
  totalStamps,
  unreadCount,
}: HomeTopBarProps) {
  const { t } = useTranslation(['home', 'common']);
  const router = useRouter();

  return (
    <Row px="xxl" style={styles.topBar}>
      <Text variant="headingLarge" color="primary">
        {t('home:app-name')}
      </Text>
      <Row style={styles.topBarRight}>
        {isCoupleConnected && (
          <PixelBadge
            iconName="footprint"
            label={formatNumber(totalStamps)}
            size="small"
            bg={theme.colors.primarySurface}
            iconColor={theme.colors.primaryDark}
          />
        )}
        <Pressable hitSlop={8} onPress={() => router.push('/notifications')}>
          <View>
            <Icon name="bell" size={20} color={theme.colors.text} />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </Row>
    </Row>
  );
}

const styles = StyleSheet.create({
  topBar: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: LAYOUT.headerPy,
  },
  topBarRight: {
    gap: LAYOUT.itemGap,
    alignItems: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    color: theme.colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
});
