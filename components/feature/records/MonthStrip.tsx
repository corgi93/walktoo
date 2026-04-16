import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, Row, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { LAYOUT, SPACING } from '@/styles/type';
import type { MonthlyReflection } from '@/types/reflection';

interface MonthStripProps {
  walksCount: number;
  stampsCount: number;
  reflection: MonthlyReflection | null;
  /** 현재 달인지 (CTA 가용 여부) */
  isCurrentMonth: boolean;
  /** 내 답변 완료 수 (0~3). undefined면 progress 미확인 */
  myAnsweredCount?: number;
  onPressReflection: () => void;
  /** 회고 타임라인 전체 보기 */
  onPressReflectionTimeline?: () => void;
}

/**
 * 월 네비게이션 바로 아래에 얹히는 한 줄짜리 요약 strip.
 *
 * 왼쪽: 산책 n · 발자국 m (아이콘 + 숫자, 토스 통계 라인 스타일)
 * 오른쪽: 이달의 우리 회고 칩 (상태별 라벨 + 화살표)
 *
 * 기존의 큰 CalendarMonthSummary 카드가 화면의 중간을 다 먹어서
 * 이를 한 줄로 압축. 회고 CTA도 여기 안에 inline으로 들어감.
 */
export function MonthStrip({
  walksCount,
  stampsCount,
  reflection,
  isCurrentMonth,
  myAnsweredCount,
  onPressReflection,
  onPressReflectionTimeline,
}: MonthStripProps) {
  const { t } = useTranslation('calendar');

  const TOTAL = 3;
  const isMyComplete = (myAnsweredCount ?? 0) >= TOTAL;

  const reflectionState: 'revealed' | 'waiting' | 'pending' | 'empty' | 'past-none' =
    reflection?.isRevealed
      ? 'revealed'
      : reflection && isMyComplete
        ? 'waiting'
        : reflection
          ? 'pending'
          : isCurrentMonth
            ? 'empty'
            : 'past-none';

  const month = reflection?.month ?? new Date().getMonth() + 1;

  const reflectionLabel = (() => {
    switch (reflectionState) {
      case 'revealed':
        return t('strip.reflection-revealed');
      case 'waiting':
        return t('strip.reflection-edit', { month });
      case 'pending':
        return t('strip.reflection-pending');
      case 'empty':
        return t('strip.reflection-empty');
      case 'past-none':
        return t('strip.reflection-past-none');
    }
  })();

  const isInteractive =
    reflectionState === 'empty' ||
    reflectionState === 'pending' ||
    reflectionState === 'waiting' ||
    reflectionState === 'revealed';

  const accent =
    reflectionState === 'revealed' || reflectionState === 'empty'
      ? theme.colors.primary
      : reflectionState === 'pending' || reflectionState === 'waiting'
        ? theme.colors.secondary
        : theme.colors.gray400;

  return (
    <View style={styles.stripOuter}>
      {/* ── 통계 라인 ── */}
      <Row style={styles.statsRow}>
        <StatChip
          icon="footprint"
          label={t('strip.walks', { count: walksCount })}
        />
        <View style={styles.dot} />
        <StatChip
          icon="star"
          label={t('strip.stamps', { count: stampsCount })}
        />
      </Row>

      {/* ── 회고 칩 ── */}
      <Pressable
        onPress={
          reflectionState === 'past-none'
            ? onPressReflectionTimeline
            : onPressReflection
        }
        style={[
          styles.reflectionChip,
          { borderColor: accent },
        ]}
        hitSlop={6}
      >
        <Icon name="book-open" size={12} color={accent} />
        <Text
          variant="caption"
          ml="xxs"
          style={{ color: accent, fontWeight: '600' }}
          numberOfLines={1}
        >
          {reflectionLabel}
        </Text>
        <Icon name="chevron-right" size={12} color={accent} />
      </Pressable>
    </View>
  );
}

// ─── Sub: StatChip ──────────────────────────────────────

function StatChip({
  icon,
  label,
}: {
  icon: 'footprint' | 'star';
  label: string;
}) {
  return (
    <Row style={styles.statChip}>
      <Icon name={icon} size={12} color={theme.colors.textSecondary} />
      <Text variant="caption" color="textSecondary" ml="xxs">
        {label}
      </Text>
    </Row>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  stripOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LAYOUT.screenPx,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  statsRow: {
    alignItems: 'center',
    flexShrink: 1,
  },
  statChip: {
    alignItems: 'center',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.colors.gray300,
    marginHorizontal: SPACING.sm,
  },
  reflectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    borderWidth: 1.5,
    backgroundColor: theme.colors.surface,
  },
});
