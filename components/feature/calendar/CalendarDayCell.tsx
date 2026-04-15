import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/base';
import { theme } from '@/styles/theme';

// ─── Types ──────────────────────────────────────────────

/**
 * 셀 하단에 표시되는 일정 바. 최대 2개 렌더링 + 넘치면 +N.
 */
export interface ScheduleIndicator {
  /** 'mine' = 내가 만든 일정 (primary), 'partner' = 상대 (secondary) */
  owner: 'mine' | 'partner';
}

interface CalendarDayCellProps {
  /** 셀에 표시할 날짜 (1-31). null이면 filler */
  day: number | null;
  /** 산책 기록이 있는 날 */
  hasWalk?: boolean;
  /** 발자국(스탬프) 받은 날 */
  hasStamp?: boolean;
  /** 그 날의 일정 목록 */
  schedules?: ScheduleIndicator[];
  /** 오늘 */
  isToday?: boolean;
  /** 이 셀이 인터랙션 가능한 상태 */
  disabled?: boolean;
  /** 커플 연결 이전 / 미래 등 시각적 회색 처리 */
  faded?: boolean;
  onPress?: () => void;
}

// ─── Component ──────────────────────────────────────────

/**
 * 캘린더 단일 셀. 3-레이어 인디케이터로 산책/스탬프/일정을 구분:
 *
 * - 산책(hasWalk): 셀 **배경 틴트** (primarySurface) — "다녀왔음" 느낌, alert 아님
 * - 스탬프(hasStamp): 숫자 우상단 **작은 ⭐ 골드 배지** — 성취 배지
 * - 일정(schedules): 셀 하단 **짧은 컬러 바** — 소유자 색 (me=primary / partner=secondary)
 * - 오늘: 주황색 보더 + 살짝 진한 primarySurface
 */
export function CalendarDayCell({
  day,
  hasWalk,
  hasStamp,
  schedules,
  isToday,
  disabled,
  faded,
  onPress,
}: CalendarDayCellProps) {
  if (day === null) {
    return <View style={styles.cellEmpty} />;
  }

  const textColor = faded
    ? theme.colors.gray400
    : isToday
      ? theme.colors.primary
      : hasWalk
        ? theme.colors.primaryDark
        : theme.colors.text;

  const bars = (schedules ?? []).slice(0, 2);
  const overflow = (schedules?.length ?? 0) - bars.length;

  return (
    <Pressable
      style={[
        styles.cell,
        hasWalk && !isToday && styles.cellWalk,
        isToday && styles.cellToday,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {/* 숫자 + 우상단 스탬프 배지 */}
      <View style={styles.topRow}>
        <Text
          variant="bodySmall"
          style={[
            styles.dayText,
            { color: textColor },
            (isToday || hasWalk) && styles.dayTextBold,
          ]}
        >
          {day}
        </Text>
        {hasStamp && <View style={styles.stampBadge} />}
      </View>

      {/* 하단 일정 바 */}
      <View style={styles.barsRow}>
        {bars.map((s, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              s.owner === 'mine' ? styles.barMine : styles.barPartner,
            ]}
          />
        ))}
        {overflow > 0 && (
          <Text variant="caption" style={styles.barOverflow}>
            +{overflow}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: theme.radius.sm,
    margin: 1,
  },
  cellEmpty: {
    flex: 1,
    aspectRatio: 1,
    margin: 1,
  },
  cellWalk: {
    backgroundColor: theme.colors.primarySurface,
  },
  cellToday: {
    backgroundColor: theme.colors.primarySurface,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 2,
    minHeight: 16,
  },
  dayText: {
    fontSize: 13,
    lineHeight: 16,
  },
  dayTextBold: {
    fontWeight: '600',
  },
  stampBadge: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: theme.colors.gold,
    marginLeft: 1,
    marginTop: -2,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    height: 6,
    width: '100%',
  },
  bar: {
    width: 10,
    height: 3,
    borderRadius: 1.5,
  },
  barMine: {
    backgroundColor: theme.colors.primary,
  },
  barPartner: {
    backgroundColor: theme.colors.secondary,
  },
  barOverflow: {
    fontSize: 8,
    lineHeight: 10,
    color: theme.colors.gray500,
    marginLeft: 1,
  },
});
