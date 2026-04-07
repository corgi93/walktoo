import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Box, Icon, Row, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { LAYOUT } from '@/styles/type';
import type { WalkDiary } from '@/types/diary';
import { formatDate, parseLocalDate } from '@/utils/date';

interface RecentWalksWidgetProps {
  diaries: WalkDiary[];
}

/**
 * 홈 - 최근 산책 3개 카드 위젯
 */
export function RecentWalksWidget({ diaries }: RecentWalksWidgetProps) {
  const { t } = useTranslation(['home', 'common']);
  const router = useRouter();

  if (diaries.length === 0) return null;

  const handlePress = (diary: WalkDiary) => {
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
  };

  return (
    <Box px="xxl" style={styles.section}>
      <Row style={styles.header}>
        <Row style={styles.title}>
          <Icon name="footprint" size={18} color={theme.colors.primary} />
          <Text variant="headingSmall" ml="xs">
            {t('home:recent-walks.title')}
          </Text>
        </Row>
        <Pressable onPress={() => router.push('/diary-list')} hitSlop={8}>
          <Row>
            <Text variant="caption" color="textMuted">
              {t('common:actions.see-all')}
            </Text>
            <Icon name="chevron-right" size={14} color={theme.colors.gray500} />
          </Row>
        </Pressable>
      </Row>

      <View style={styles.row}>
        {diaries.map((diary) => (
          <RecentWalkCard
            key={diary.id}
            diary={diary}
            onPress={() => handlePress(diary)}
          />
        ))}
      </View>
    </Box>
  );
}

// ─── 카드 ───────────────────────────────────────────────

function RecentWalkCard({
  diary,
  onPress,
}: {
  diary: WalkDiary;
  onPress: () => void;
}) {
  const { t } = useTranslation('home');
  const dateLabel = formatDate(parseLocalDate(diary.date), {
    month: 'numeric',
    day: 'numeric',
  });

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.dateBox}>
        <Text variant="caption" color="textMuted">
          {dateLabel}
        </Text>
      </View>
      <Text
        variant="label"
        color="text"
        numberOfLines={1}
        style={styles.location}
      >
        {diary.locationName}
      </Text>
      <Row style={styles.status}>
        <Icon
          name={diary.isRevealed ? 'unlock' : 'lock'}
          size={10}
          color={diary.isRevealed ? theme.colors.primary : theme.colors.gray500}
        />
        <Text
          variant="caption"
          color={diary.isRevealed ? 'primary' : 'textMuted'}
          ml="xxs"
        >
          {diary.isRevealed
            ? t('recent-walks.status-revealed')
            : t('recent-walks.status-pending')}
        </Text>
      </Row>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: LAYOUT.sectionGapXl,
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: LAYOUT.itemGap,
  },
  title: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: LAYOUT.itemGap,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: LAYOUT.itemGap,
    ...theme.pixel.borderThin,
    minHeight: 90,
  },
  dateBox: {
    marginBottom: 4,
  },
  location: {
    marginBottom: 6,
  },
  status: {
    alignItems: 'center',
    marginTop: 'auto',
  },
});
