import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box, Icon, PixelBadge, Row, Text } from '@/components/base';
import { NoCoupleCard } from '@/components/feature/couple';
import {
  DiaryEmptyState,
  FootprintTimeline,
  WalkDiaryCard,
} from '@/components/feature/diary';
import { useDiaryListQuery } from '@/hooks/services/diary/query';
import { useNudgeMutation } from '@/hooks/services/notification/mutation';
import { useGetCoupleQuery } from '@/hooks/services/couple/query';
import { useGetMeQuery } from '@/hooks/services/user/query';
import { useToast } from '@/components/composite/toast/ToastProvider';
import { theme } from '@/styles/theme';
import { LAYOUT } from '@/styles/type';
import { WalkDiary } from '@/types/diary';

// ─── Types ──────────────────────────────────────────────

type ViewMode = 'timeline' | 'feed';

// ─── Component ──────────────────────────────────────────

export default function DiaryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');

  const { data: me } = useGetMeQuery();
  const { data: couple } = useGetCoupleQuery();
  const hasCoupleId = !!me?.coupleId;
  const nudge = useNudgeMutation();
  const toast = useToast();

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useDiaryListQuery();

  // 페이지 데이터 → flat array
  const diaries = useMemo(
    () => data?.pages.flatMap(page => page) ?? [],
    [data],
  );

  const handleItemPress = useCallback((diary: WalkDiary) => {
    router.push({
      pathname: '/diary-detail',
      params: {
        id: diary.id,
        date: diary.date,
        locationName: diary.locationName,
        isRevealed: String(diary.isRevealed),
        myEntry: diary.myEntry ? JSON.stringify(diary.myEntry) : '',
        partnerEntry: diary.partnerEntry ? JSON.stringify(diary.partnerEntry) : '',
      },
    });
  }, [router]);

  const handleNudge = useCallback(
    (diary: WalkDiary) => {
      if (!me || !couple) return;
      const isUser1 = couple.user1?.id === me.id;
      const partnerId = isUser1 ? couple.user2?.id : couple.user1?.id;
      if (!partnerId || !me.coupleId) return;

      nudge.mutate(
        { recipientId: partnerId, coupleId: me.coupleId, walkId: diary.id },
        {
          onSuccess: () => toast.success('톡톡! 연인에게 알림을 보냈어요'),
          onError: () => toast.error('알림 보내기에 실패했어요'),
        },
      );
    },
    [me, couple, nudge, toast],
  );

  const handleAdd = () => {
    // 오늘 날짜에 이미 기록이 있는지 확인
    const today = new Date().toISOString().split('T')[0];
    const hasTodayDiary = diaries.some((d) => d.date === today);
    if (hasTodayDiary) {
      toast.error('오늘은 이미 산책 기록을 남겼어요!');
      return;
    }
    router.push('/footprint-create');
  };

  const toggleView = () => {
    setViewMode(prev => (prev === 'timeline' ? 'feed' : 'timeline'));
  };

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // ─── No Couple State ────────────────────────────────────

  if (!hasCoupleId) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Row px="xxl" style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Icon name="arrow-left" size={22} color={theme.colors.text} />
          </Pressable>
          <Text variant="headingMedium">산책 기록</Text>
          <View style={{ width: 32 }} />
        </Row>
        <View style={styles.noCoupleWrapper}>
          <NoCoupleCard />
        </View>
      </View>
    );
  }

  // ─── Loading State ────────────────────────────────────

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodySmall" color="textMuted" mt="md">
          기록 불러오는 중...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Row px="xxl" style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Icon name="arrow-left" size={22} color={theme.colors.text} />
        </Pressable>
        <Text variant="headingMedium">산책 기록</Text>
        <Row style={styles.headerActions}>
          <Pressable onPress={toggleView} hitSlop={8}>
            <Icon
              name={viewMode === 'timeline' ? 'list' : 'map-pin'}
              size={20}
              color={theme.colors.gray600}
            />
          </Pressable>
          <Pressable onPress={handleAdd} hitSlop={8}>
            <Icon name="plus" size={22} color={theme.colors.text} />
          </Pressable>
        </Row>
      </Row>

      {diaries.length === 0 ? (
        <View style={styles.emptyWrapper}>
          <DiaryEmptyState />
        </View>
      ) : viewMode === 'timeline' ? (
        /* 타임라인 뷰 */
        <FlatList
          data={[null]}
          renderItem={() => (
            <>
              <Row px="xxl" style={styles.summaryRow}>
                <PixelBadge
                  iconName="footprint"
                  label={`총 ${diaries.length}개의 기록`}
                  size="small"
                  bg={theme.colors.primarySurface}
                />
              </Row>
              <FootprintTimeline
                diaries={diaries}
                onItemPress={handleItemPress}
                onNudge={handleNudge}
                nudgeLoading={nudge.isPending}
              />
            </>
          )}
          keyExtractor={() => 'timeline'}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.primary}
                style={styles.footerLoader}
              />
            ) : null
          }
        />
      ) : (
        /* 피드 뷰 (인스타 스타일) */
        <FlatList
          data={diaries}
          renderItem={({ item }) => (
            <Box px="xxl" style={styles.feedItem}>
              <WalkDiaryCard
                diary={item}
                onPress={handleItemPress}
                onNudge={handleNudge}
                nudgeLoading={nudge.isPending}
              />
            </Box>
          )}
          keyExtractor={item => item.id}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Row px="xxl" style={styles.summaryRow}>
              <PixelBadge
                iconName="footprint"
                label={`총 ${diaries.length}개의 기록`}
                size="small"
                bg={theme.colors.primarySurface}
              />
            </Row>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.primary}
                style={styles.footerLoader}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: LAYOUT.headerPy,
  },
  headerActions: {
    gap: LAYOUT.itemGap,
    alignItems: 'center',
  },
  emptyWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  noCoupleWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  scroll: {
    paddingBottom: LAYOUT.bottomSafe + LAYOUT.sectionGap,
  },
  summaryRow: {
    alignItems: 'center',
    marginBottom: LAYOUT.sectionGap,
  },
  feedItem: {
    marginBottom: LAYOUT.sectionGap,
  },
  footerLoader: {
    paddingVertical: LAYOUT.sectionGap,
  },
});
