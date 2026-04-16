import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, PixelCard, Row, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';
import type { WalkDiary } from '@/types/diary';
import { formatDate, parseLocalDate } from '@/utils/date';

interface MonthlyDiaryRecapProps {
  walks: WalkDiary[];
  /** 보여줄 최대 개수 (default 5) */
  limit?: number;
}

/**
 * 회고 작성 화면 상단에 얹히는 "이번 달 내 산책일기" 요약.
 *
 * 회고를 쓰려면 "한 달 전체를 기억해야" 하는 인지 부담이 있는데,
 * 이 섹션이 유저가 작성한 기록을 스치듯 보여줘서 기억을 떠올리는 힌트 역할을 한다.
 *
 * 프라이버시 원칙:
 * - 내가 쓴 내용(myEntry.memo)만 노출. 상대방 기록은 산책일기 reveal 룰을 따른다.
 * - 연도+월에 해당하는 walks만 받아 (부모에서 필터) 여기선 가공만.
 */
export function MonthlyDiaryRecap({
  walks,
  limit = 5,
}: MonthlyDiaryRecapProps) {
  const { t } = useTranslation('reflection');

  // 내가 memo를 남긴 walks 중 최신 → 오래된 순으로 상위 N개
  const items = walks
    .filter((w) => (w.myEntry?.memo ?? '').trim().length > 0)
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, limit);

  return (
    <PixelCard bg={theme.colors.surfaceWarm}>
      <Row style={styles.header}>
        <Row style={styles.headerLeft}>
          <Icon name="book-open" size={14} color={theme.colors.secondary} />
          <Text variant="label" color="textSecondary" ml="xxs">
            {t('recap.title')}
          </Text>
        </Row>
        <Text variant="caption" color="textMuted">
          {t('recap.count', { count: walks.length })}
        </Text>
      </Row>

      <Text variant="caption" color="textMuted" mt="xs">
        {t('recap.subtitle')}
      </Text>

      {items.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text variant="bodySmall" color="textMuted" align="center">
            {t('recap.empty')}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {items.map((walk, idx) => (
            <RecapRow
              key={walk.id}
              walk={walk}
              isLast={idx === items.length - 1}
            />
          ))}
        </View>
      )}
    </PixelCard>
  );
}

// ─── Sub: 한 줄 ──────────────────────────────────────────

function RecapRow({ walk, isLast }: { walk: WalkDiary; isLast?: boolean }) {
  const memo = (walk.myEntry?.memo ?? '').trim();
  const dateLabel = formatDate(parseLocalDate(walk.date), {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  });

  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <Row style={styles.rowHeader}>
        <Text variant="caption" color="textMuted">
          {dateLabel}
        </Text>
        <Text
          variant="caption"
          color="textSecondary"
          numberOfLines={1}
          style={styles.rowLocation}
        >
          · {walk.locationName}
        </Text>
      </Row>
      <Text
        variant="bodySmall"
        color="text"
        numberOfLines={2}
        style={styles.rowMemo}
      >
        {memo}
      </Text>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    alignItems: 'center',
  },
  emptyBox: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  list: {
    marginTop: SPACING.sm,
  },
  row: {
    paddingVertical: SPACING.sm,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
  },
  rowHeader: {
    alignItems: 'center',
  },
  rowLocation: {
    marginLeft: 4,
    flex: 1,
  },
  rowMemo: {
    marginTop: 2,
    lineHeight: 18,
  },
});
