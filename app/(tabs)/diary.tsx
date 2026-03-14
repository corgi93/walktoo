import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Row, Text } from '@/components/base';
import { DiaryEmptyState, FootprintTimeline } from '@/components/feature/diary';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';
import { WalkDiary } from '@/types/diary';

// ─── Mock Data (TODO: replace with React Query) ────────

const MOCK_DIARIES: WalkDiary[] = [
  {
    id: '1',
    coupleId: 'c1',
    date: '2025-06-20',
    locationName: '한강공원 여의도',
    memo: '날씨가 너무 좋아서 한강까지 걸었다. 치킨도 시켜 먹고 최고의 데이트 🍗',
    photos: ['photo1.jpg'],
    steps: 8420,
    createdAt: '2025-06-20T18:30:00Z',
  },
  {
    id: '2',
    coupleId: 'c1',
    date: '2025-06-15',
    locationName: '경복궁',
    memo: '한복 입고 산책했는데 너무 더웠다 ㅋㅋ',
    photos: ['photo2.jpg', 'photo3.jpg'],
    steps: 6210,
    createdAt: '2025-06-15T15:00:00Z',
  },
  {
    id: '3',
    coupleId: 'c1',
    date: '2025-06-10',
    locationName: '남산타워',
    memo: '',
    photos: [],
    steps: 12350,
    createdAt: '2025-06-10T20:00:00Z',
  },
];

// ─── Component ──────────────────────────────────────────

export default function DiaryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const diaries = MOCK_DIARIES;

  const handleItemPress = useCallback((diary: WalkDiary) => {
    // TODO: navigate to diary detail
  }, []);

  const handleAdd = () => {
    router.push('/footprint-create');
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
        <Pressable onPress={handleAdd} hitSlop={8}>
          <Ionicons
            name="add-circle-outline"
            size={24}
            color={theme.colors.primary}
          />
        </Pressable>
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
            <Text style={styles.summaryEmoji}>👣</Text>
            <Text variant="bodySmall" color="textSecondary" ml="xs">
              총 {diaries.length}개의 발자취
            </Text>
          </Row>

          {/* 타임라인 */}
          <FootprintTimeline
            diaries={diaries}
            onItemPress={handleItemPress}
          />
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surfaceWarm,
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
  summaryEmoji: {
    fontSize: 14,
  },
});
