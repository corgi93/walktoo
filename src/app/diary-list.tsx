import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Box, Icon, PixelBadge, Row, Text } from '@/components/base';
import { useToast } from '@/components/composite/toast/ToastProvider';
import { NoCoupleCard } from '@/components/feature/couple';
import {
  DiaryEmptyState,
  FootprintTimeline,
  WalkDiaryCard,
} from '@/components/feature/diary';
import { useDiaryListQuery } from '@/hooks/services/diary/query';
import { useKeyboardBottomInset } from '@/hooks/useKeyboardBottomInset';
import { useNudgeMutation } from '@/hooks/services/notification/mutation';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import { theme } from '@/styles/theme';
import { LAYOUT } from '@/styles/type';
import { WalkDiary } from '@/types/diary';
import { getLocalToday } from '@/utils/date';

// ─── Types ──────────────────────────────────────────────

type ViewMode = 'timeline' | 'feed';

// ─── Component ──────────────────────────────────────────

export default function DiaryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { t } = useTranslation(['diary']);
  const { me, hasCoupleId, partnerId, myName, partnerName } = usePartnerDerivation();
  const nudge = useNudgeMutation();
  const keyboardBottomInset = useKeyboardBottomInset(LAYOUT.sectionGap);

  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useDiaryListQuery();

  const diaries = useMemo(
    () => data?.pages.flatMap((page) => page) ?? [],
    [data],
  );

  const handleItemPress = useCallback(
    (diary: WalkDiary) => {
      router.push({
        pathname: '/diary-detail',
        params: {
          id: diary.id,
          date: diary.date,
          locationName: diary.locationName,
          kind: diary.kind,
          isRevealed: String(diary.isRevealed),
          myEntry: diary.myEntry ? JSON.stringify(diary.myEntry) : '',
          partnerEntry: diary.partnerEntry
            ? JSON.stringify(diary.partnerEntry)
            : '',
        },
      });
    },
    [router],
  );

  const handleNudge = useCallback(
    (diary: WalkDiary) => {
      if (!partnerId || !me?.coupleId) return;
      nudge.mutate(
        { recipientId: partnerId, coupleId: me.coupleId, walkId: diary.id },
        {
          onSuccess: () => toast.success(t('diary:timeline.nudge-success')),
          onError: () => toast.error(t('diary:timeline.nudge-failed')),
        },
      );
    },
    [partnerId, me, nudge, toast, t],
  );

  const handleAdd = () => {
    const today = getLocalToday();
    if (diaries.some((d) => d.date === today && d.kind === 'together')) {
      toast.error(t('diary:create.today-already'));
      return;
    }
    router.push('/footprint-create');
  };

  const toggleView = () => {
    setViewMode((prev) => (prev === 'timeline' ? 'feed' : 'timeline'));
  };

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const renderFeedItem = useCallback(
    ({ item }: { item: WalkDiary }) => (
      <Box px="xxl" style={styles.feedItem}>
        <WalkDiaryCard
          diary={item}
          onPress={handleItemPress}
          onNudge={handleNudge}
          nudgeLoading={nudge.isPending}
        />
      </Box>
    ),
    [handleItemPress, handleNudge, nudge.isPending],
  );

  // ─── No Couple State ────────────────────────────────────

  if (!hasCoupleId) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Row px="xxl" style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Icon name="arrow-left" size={22} color={theme.colors.text} />
          </Pressable>
          <Text variant="headingMedium">{t('diary:list.title')}</Text>
          <View style={{ width: 32 }} />
        </Row>
        <ScrollView
          contentContainerStyle={[
            styles.noCoupleScroll,
            { paddingBottom: insets.bottom + LAYOUT.bottomSafe + keyboardBottomInset },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.noCoupleWrapper}>
            <NoCoupleCard />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ─── Loading State ────────────────────────────────────

  if (isLoading) {
    return (
      <View
        style={[styles.container, styles.center, { paddingTop: insets.top }]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodySmall" color="textMuted" mt="md">
          {t('diary:list.loading')}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Row px="xxl" style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Icon name="arrow-left" size={22} color={theme.colors.text} />
        </Pressable>
        <Text variant="headingMedium">{t('diary:list.title')}</Text>
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
        <FootprintTimeline
          diaries={diaries}
          myName={myName}
          partnerName={partnerName}
          onItemPress={handleItemPress}
          onNudge={handleNudge}
          nudgeLoading={nudge.isPending}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={styles.scroll}
          ListHeaderComponent={
              <Row px="xxl" style={styles.summaryRow}>
                <PixelBadge
                  iconName="footprint"
                  label={t('diary:list.summary-count', { count: diaries.length })}
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
      ) : (
        <FlatList
          data={diaries}
          renderItem={renderFeedItem}
          keyExtractor={(item) => item.id}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Row px="xxl" style={styles.summaryRow}>
              <PixelBadge
                iconName="footprint"
                label={t('diary:list.summary-count', { count: diaries.length })}
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
  noCoupleScroll: {
    flexGrow: 1,
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
