import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Box, Icon, PixelCard, Row, Text } from '@/components/base';
import { useDiaryListQuery } from '@/hooks/services/diary/query';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import { theme } from '@/styles/theme';
import { LAYOUT, SPACING } from '@/styles/type';
import type { WalkDiary } from '@/types/diary';
import { formatDate, parseLocalDate } from '@/utils/date';

interface RecentWalksWidgetProps {
  /** 보여줄 최대 개수 (default 3) */
  limit?: number;
}

/**
 * 최근 산책 N개를 가로로 나란히 보여주는 위젯.
 *
 * 월별이 아니라 **전체 최근** 산책 3개를 노출한다. 월 필터링된 "이 달의 산책"과
 * 다른 의미. 3개 초과가 있을 때만 "전체 보기" CTA가 활성화되며, 탭하면
 * /diary-list 로 이동한다.
 */
export function RecentWalksWidget({ limit = 3 }: RecentWalksWidgetProps) {
  const { t } = useTranslation(['home', 'common']);
  const router = useRouter();

  const { data } = useDiaryListQuery();
  const { myName, partnerName } = usePartnerDerivation();

  // 첫 페이지(최신 20개) 중 상위 `limit`개
  const latest = useMemo<WalkDiary[]>(() => {
    const firstPage = data?.pages?.[0] ?? [];
    return firstPage.slice(0, limit);
  }, [data, limit]);

  const hasMore = (data?.pages?.[0]?.length ?? 0) > limit;

  if (latest.length === 0) {
    return (
      <Box px="xxl" style={styles.section}>
        <Row style={styles.header}>
          <Text variant="headingSmall">
            {t('home:recent-walks-section.title')}
          </Text>
        </Row>
        <PixelCard style={styles.emptyCard} bg={theme.colors.surfaceWarm}>
          <Text variant="bodySmall" color="textMuted" align="center">
            {t('home:recent-walks-section.empty')}
          </Text>
        </PixelCard>
      </Box>
    );
  }

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

  return (
    <Box px="xxl" style={styles.section}>
      <Row style={styles.header}>
        <Text variant="headingSmall">
          {t('home:recent-walks-section.title')}
        </Text>
        {hasMore && (
          <Pressable
            onPress={() => router.push('/diary-list')}
            hitSlop={8}
            style={styles.seeAll}
          >
            <Text variant="caption" color="textMuted">
              {t('common:actions.see-all')}
            </Text>
            <Icon name="chevron-right" size={14} color={theme.colors.gray500} />
          </Pressable>
        )}
      </Row>

      <View style={styles.row}>
        {latest.map((walk) => (
          <WalkMiniCard
            key={walk.id}
            walk={walk}
            myName={myName}
            partnerName={partnerName}
            onPress={() => handlePress(walk)}
          />
        ))}
      </View>
    </Box>
  );
}

// ─── Sub: 카드 ───────────────────────────────────────────

function WalkMiniCard({
  walk,
  myName,
  partnerName,
  onPress,
}: {
  walk: WalkDiary;
  myName: string;
  partnerName: string;
  onPress: () => void;
}) {
  const { t } = useTranslation('home');
  const dateLabel = formatDate(parseLocalDate(walk.date), {
    month: 'numeric',
    day: 'numeric',
  });

  const hasMyEntry = !!walk.myEntry;
  const hasPartnerEntry = !!walk.partnerEntry;

  const statusLabel = walk.isRevealed
    ? t('recent-walks.status-both')
    : hasMyEntry && !hasPartnerEntry
      ? t('recent-walks.status-me-only')
      : !hasMyEntry && hasPartnerEntry
        ? t('recent-walks.status-partner-only')
        : t('recent-walks.status-none');

  const statusColor = walk.isRevealed
    ? theme.colors.primary
    : hasMyEntry || hasPartnerEntry
      ? theme.colors.secondary
      : theme.colors.gray500;

  const statusIcon = walk.isRevealed
    ? 'unlock'
    : hasMyEntry || hasPartnerEntry
      ? 'edit'
      : 'lock';

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text variant="caption" color="textMuted">
        {dateLabel}
      </Text>
      <Text
        variant="label"
        color="text"
        numberOfLines={1}
        style={styles.cardLocation}
      >
        {walk.locationName}
      </Text>

      {/* 상태 뱃지 — 누가 썼는지 명확하게 */}
      <Row style={styles.cardStatus}>
        <Icon name={statusIcon} size={10} color={statusColor} />
        <Text
          variant="caption"
          style={{ color: statusColor }}
          ml="xxs"
          numberOfLines={1}
        >
          {statusLabel}
        </Text>
      </Row>

      {/* 미니 진행 dot (공개 전일 때만) */}
      {!walk.isRevealed && (
        <Row style={styles.progressDots}>
          <View
            style={[
              styles.miniDot,
              { backgroundColor: hasMyEntry ? theme.colors.secondary : theme.colors.gray300 },
            ]}
          />
          <View
            style={[
              styles.miniDot,
              { backgroundColor: hasPartnerEntry ? theme.colors.secondary : theme.colors.gray300 },
            ]}
          />
        </Row>
      )}
    </Pressable>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  section: {
    marginTop: LAYOUT.sectionGap,
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: SPACING.sm,
    ...theme.pixel.borderThin,
    minHeight: 86,
  },
  cardLocation: {
    marginTop: 4,
    marginBottom: 4,
  },
  cardStatus: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  progressDots: {
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  emptyCard: {
    padding: LAYOUT.cardPx,
  },
});
