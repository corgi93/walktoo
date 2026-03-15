import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box, PixelBadge, Row, Text } from '@/components/base';
import {
  DiaryEmptyState,
  FootprintTimeline,
  WalkDiaryCard,
} from '@/components/feature/diary';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';
import { WalkDiary } from '@/types/diary';

// ─── Types ──────────────────────────────────────────────

type ViewMode = 'timeline' | 'feed';

// ─── Mock Data (TODO: replace with React Query) ────────

const MOCK_DIARIES: WalkDiary[] = [
  {
    id: '1',
    coupleId: 'c1',
    date: '2025-06-20',
    locationName: '한강공원 여의도',
    steps: 8420,
    myEntry: {
      userId: 'u1',
      nickname: '나',
      memo: '날씨가 너무 좋아서 한강까지 걸었다. 치킨도 시켜 먹고 최고의 데이트 🍗',
      photos: ['photo1.jpg'],
      writtenAt: '2025-06-20T18:30:00Z',
    },
    partnerEntry: {
      userId: 'u2',
      nickname: '자기',
      memo: '오늘 한강 너무 좋았어~ 치킨이 최고였다 😋',
      photos: ['photo4.jpg'],
      writtenAt: '2025-06-20T19:00:00Z',
    },
    isRevealed: true,
    createdAt: '2025-06-20T18:30:00Z',
  },
  {
    id: '2',
    coupleId: 'c1',
    date: '2025-06-15',
    locationName: '경복궁',
    steps: 6210,
    myEntry: {
      userId: 'u1',
      nickname: '나',
      memo: '한복 입고 산책했는데 너무 더웠다 ㅋㅋ',
      photos: ['photo2.jpg', 'photo3.jpg'],
      writtenAt: '2025-06-15T15:00:00Z',
    },
    partnerEntry: undefined,
    isRevealed: false,
    createdAt: '2025-06-15T15:00:00Z',
  },
  {
    id: '3',
    coupleId: 'c1',
    date: '2025-06-10',
    locationName: '남산타워',
    steps: 12350,
    myEntry: undefined,
    partnerEntry: undefined,
    isRevealed: false,
    createdAt: '2025-06-10T20:00:00Z',
  },
];

// ─── Component ──────────────────────────────────────────

export default function DiaryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');

  const diaries = MOCK_DIARIES;

  const handleItemPress = useCallback((diary: WalkDiary) => {
    // TODO: navigate to diary detail
  }, []);

  const handleAdd = () => {
    router.push('/footprint-create');
  };

  const toggleView = () => {
    setViewMode(prev => (prev === 'timeline' ? 'feed' : 'timeline'));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Row
        px="xxl"
        py="lg"
        style={{ justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Text variant="headingLarge">발자취</Text>
        <Row style={{ gap: SPACING.sm, alignItems: 'center' }}>
          {/* 뷰 전환 토글 */}
          <Pressable onPress={toggleView} hitSlop={8}>
            <Text style={{ fontSize: 18 }}>
              {viewMode === 'timeline' ? '📋' : '📍'}
            </Text>
          </Pressable>
          <Pressable onPress={handleAdd} hitSlop={8}>
            <Text style={{ fontSize: 20 }}>✏️</Text>
          </Pressable>
        </Row>
      </Row>

      {diaries.length === 0 ? (
        <View style={styles.emptyWrapper}>
          <DiaryEmptyState />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* 발자취 수 요약 */}
          <Row px="xxl" style={styles.summaryRow}>
            <PixelBadge
              icon="👣"
              label={`총 ${diaries.length}개의 발자취`}
              size="small"
              bg={theme.colors.primarySurface}
            />
          </Row>

          {viewMode === 'timeline' ? (
            /* 타임라인 뷰 */
            <FootprintTimeline
              diaries={diaries}
              onItemPress={handleItemPress}
            />
          ) : (
            /* 피드 뷰 (인스타 스타일) */
            <View style={styles.feedList}>
              {diaries.map(diary => (
                <Box key={diary.id} px="xxl" style={{ marginBottom: SPACING.lg }}>
                  <WalkDiaryCard diary={diary} onPress={handleItemPress} />
                </Box>
              ))}
            </View>
          )}
        </ScrollView>
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
  emptyWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  scroll: {
    paddingBottom: 40,
  },
  summaryRow: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  feedList: {
    paddingTop: SPACING.xs,
  },
});
