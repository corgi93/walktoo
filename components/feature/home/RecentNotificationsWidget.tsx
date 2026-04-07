import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Box, Icon, PixelCard, Row, Text } from '@/components/base';
import type { AppNotification } from '@/server/notifications/notifications.service';
import { theme } from '@/styles/theme';
import { LAYOUT } from '@/styles/type';

interface RecentNotificationsWidgetProps {
  notifications: AppNotification[];
}

/**
 * 홈 - 최근 알림 3개 위젯
 */
export function RecentNotificationsWidget({
  notifications,
}: RecentNotificationsWidgetProps) {
  const { t } = useTranslation(['home', 'common']);
  const router = useRouter();

  if (notifications.length === 0) return null;

  return (
    <Box px="xxl" style={styles.section}>
      <Row style={styles.header}>
        <Row style={styles.title}>
          <Icon name="bell" size={18} color={theme.colors.primary} />
          <Text variant="headingSmall" ml="xs">
            {t('home:recent-notifications.title')}
          </Text>
        </Row>
        <Pressable onPress={() => router.push('/notifications')} hitSlop={8}>
          <Row>
            <Text variant="caption" color="textMuted">
              {t('common:actions.see-all')}
            </Text>
            <Icon name="chevron-right" size={14} color={theme.colors.gray500} />
          </Row>
        </Pressable>
      </Row>

      <PixelCard style={styles.card}>
        {notifications.map((notif, idx) => (
          <Pressable
            key={notif.id}
            style={[
              styles.item,
              idx < notifications.length - 1 && styles.itemBorder,
            ]}
            onPress={() => router.push('/notifications')}
          >
            <View style={[styles.dot, !notif.isRead && styles.dotUnread]} />
            <View style={{ flex: 1 }}>
              <Text variant="label" color="text" numberOfLines={1}>
                {notif.title}
              </Text>
              <Text
                variant="caption"
                color="textMuted"
                numberOfLines={1}
                mt="xxs"
              >
                {notif.body}
              </Text>
            </View>
          </Pressable>
        ))}
      </PixelCard>
    </Box>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: LAYOUT.sectionGap,
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: LAYOUT.itemGap,
  },
  title: {
    alignItems: 'center',
  },
  card: {
    padding: 0,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: LAYOUT.itemGap,
    paddingHorizontal: LAYOUT.cardPx,
    gap: LAYOUT.itemGap,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray100,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.gray300,
  },
  dotUnread: {
    backgroundColor: theme.colors.primary,
  },
});
