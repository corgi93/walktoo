import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Box, Icon, PixelCard, Row, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { LAYOUT, SPACING } from '@/styles/type';
import type { WalkDiary } from '@/types/diary';
import { formatDate, parseLocalDate } from '@/utils/date';

interface MonthlyWalksListProps {
  walks: WalkDiary[];
}

/**
 * 이 달의 산책 수직 리스트.
 * RecentWalksWidget의 3개 horizontal 카드 패턴과 달리, 월 전체를 세로로 나열.
 * 기록 탭 전용.
 */
export function MonthlyWalksList({ walks }: MonthlyWalksListProps) {
  const { t } = useTranslation(['home', 'diary']);
  const router = useRouter();

  const handlePress = (walk: WalkDiary) => {
    router.push({
      pathname: '/diary-detail',
      params: {
        id: walk.id,
        date: walk.date,
        locationName: walk.locationName,
        isRevealed: String(walk.isRevealed),
        myEntry: walk.myEntry ? JSON.stringify(walk.myEntry) : '',
        partnerEntry: walk.partnerEntry ? JSON.stringify(walk.partnerEntry) : '',
      },
    });
  };

  if (walks.length === 0) {
    return (
      <Box px="xxl" style={styles.section}>
        <Text variant="label" color="textMuted" mb="sm">
          {t('home:records-tab.walks-section-title')}
        </Text>
        <PixelCard style={styles.emptyCard} bg={theme.colors.surfaceWarm}>
          <Text variant="bodySmall" color="textMuted" align="center">
            {t('home:records-tab.walks-empty')}
          </Text>
        </PixelCard>
      </Box>
    );
  }

  return (
    <Box px="xxl" style={styles.section}>
      <Text variant="label" color="textMuted" mb="sm">
        {t('home:records-tab.walks-section-title')}
      </Text>
      <PixelCard style={styles.listCard}>
        {walks.map((walk, idx) => (
          <WalkRow
            key={walk.id}
            walk={walk}
            onPress={() => handlePress(walk)}
            isLast={idx === walks.length - 1}
          />
        ))}
      </PixelCard>
    </Box>
  );
}

// ─── Sub: 한 줄 ──────────────────────────────────────────

function WalkRow({
  walk,
  onPress,
  isLast,
}: {
  walk: WalkDiary;
  onPress: () => void;
  isLast?: boolean;
}) {
  const { t } = useTranslation('home');
  const dateLabel = formatDate(parseLocalDate(walk.date), {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  });

  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, !isLast && styles.rowBorder]}
    >
      <View style={styles.rowDateBox}>
        <Text variant="caption" color="textMuted">
          {dateLabel}
        </Text>
      </View>
      <Text
        variant="label"
        color="text"
        numberOfLines={1}
        style={styles.rowLocation}
      >
        {walk.locationName}
      </Text>
      <Row style={styles.rowStatus}>
        <Icon
          name={walk.isRevealed ? 'unlock' : 'lock'}
          size={10}
          color={walk.isRevealed ? theme.colors.primary : theme.colors.gray500}
        />
        <Text
          variant="caption"
          color={walk.isRevealed ? 'primary' : 'textMuted'}
          ml="xxs"
        >
          {walk.isRevealed
            ? t('recent-walks.status-revealed')
            : t('recent-walks.status-pending')}
        </Text>
      </Row>
      <Icon name="chevron-right" size={14} color={theme.colors.gray400} />
    </Pressable>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  section: {
    marginTop: LAYOUT.sectionGap,
  },
  listCard: {
    padding: 0,
    overflow: 'hidden',
  },
  emptyCard: {
    padding: LAYOUT.cardPx,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: LAYOUT.cardPx,
    paddingVertical: LAYOUT.cardPy,
    gap: SPACING.sm,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray100,
  },
  rowDateBox: {
    width: 60,
  },
  rowLocation: {
    flex: 1,
  },
  rowStatus: {
    alignItems: 'center',
    gap: 0,
  },
});
