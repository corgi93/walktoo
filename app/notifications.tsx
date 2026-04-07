import { useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Box, Icon, Row, Text } from "@/components/base";
import type { IconName } from "@/components/base/Icon";
import {
  useMarkAllAsReadMutation,
  useMarkAsReadMutation,
} from "@/hooks/services/notification/mutation";
import { useNotificationListQuery } from "@/hooks/services/notification/query";
import type { AppNotification } from "@/server/notifications";
import { theme } from "@/styles/theme";
import { LAYOUT, SPACING } from "@/styles/type";

// ─── 알림 아이콘 맵 ─────────────────────────────────────

const NOTIFICATION_ICON: Record<string, { name: IconName; color: string }> = {
  couple_joined: { name: "heart", color: theme.colors.primary },
  walk_created: { name: "footprint", color: theme.colors.secondary },
  walk_revealed: { name: "unlock", color: theme.colors.accent },
  nudge: { name: "bell-ring", color: theme.colors.primary },
  stamp_claimed: { name: "footprint", color: theme.colors.primary },
};

// ─── Component ──────────────────────────────────────────

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useNotificationListQuery();

  const markAsRead = useMarkAsReadMutation();
  const markAllAsRead = useMarkAllAsReadMutation();

  const notifications = useMemo(
    () => data?.pages.flatMap((page) => page) ?? [],
    [data],
  );

  const handlePress = useCallback(
    (notification: AppNotification) => {
      // 읽음 처리
      if (!notification.isRead) {
        markAsRead.mutate(notification.id);
      }

      // 화면 이동 (타입별 분기)
      switch (notification.type) {
        case "walk_created":
        case "walk_revealed":
        case "nudge":
          // 산책 관련 → 산책 기록 페이지
          router.push("/diary-list");
          break;
        case "couple_joined":
        case "stamp_claimed":
          // 커플/발자국 → 홈
          router.push("/(tabs)");
          break;
        default:
          router.push("/(tabs)");
      }
    },
    [markAsRead, router],
  );

  const handleMarkAllRead = () => {
    markAllAsRead.mutate();
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}일 전`;
    return new Date(dateStr).toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
    });
  };

  const renderItem = useCallback(
    ({ item }: { item: AppNotification }) => {
      const iconInfo = NOTIFICATION_ICON[item.type] ?? {
        name: "bell" as IconName,
        color: theme.colors.gray500,
      };

      return (
        <Pressable
          style={[styles.notifItem, !item.isRead && styles.notifItemUnread]}
          onPress={() => handlePress(item)}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: iconInfo.color + "20" },
            ]}
          >
            <Icon name={iconInfo.name} size={18} color={iconInfo.color} />
          </View>
          <View style={styles.notifContent}>
            <Text variant="label" color="text" numberOfLines={1}>
              {item.title}
            </Text>
            <Text
              variant="bodySmall"
              color="textSecondary"
              mt="xxs"
              numberOfLines={2}
            >
              {item.body}
            </Text>
            <Text variant="caption" color="textMuted" mt="xs">
              {formatTimeAgo(item.createdAt)}
            </Text>
          </View>
          {!item.isRead && <View style={styles.unreadDot} />}
        </Pressable>
      );
    },
    [handlePress],
  );

  if (isLoading) {
    return (
      <View
        style={[styles.container, styles.center, { paddingTop: insets.top }]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <Row px="xxl" style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Icon name="arrow-left" size={22} color={theme.colors.text} />
        </Pressable>
        <Text variant="headingMedium">알림</Text>
        <Pressable onPress={handleMarkAllRead} hitSlop={8}>
          <Text variant="caption" color="primary">
            모두 읽음
          </Text>
        </Pressable>
      </Row>

      {notifications.length === 0 ? (
        <View style={[styles.center, { flex: 1 }]}>
          <Icon name="bell-off" size={48} color={theme.colors.gray300} />
          <Text variant="bodySmall" color="textMuted" mt="lg">
            아직 알림이 없어요
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.primary}
                style={{ paddingVertical: LAYOUT.sectionGap }}
              />
            ) : null
          }
        />
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: LAYOUT.headerPy,
  },
  list: {
    paddingBottom: LAYOUT.bottomSafe,
  },
  notifItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray100,
  },
  notifItemUnread: {
    backgroundColor: theme.colors.primarySurface,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notifContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginLeft: SPACING.sm,
  },
});
