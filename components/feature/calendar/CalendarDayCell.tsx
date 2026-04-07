import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/base';
import { theme } from '@/styles/theme';

interface CalendarDayCellProps {
  /** 셀에 표시할 날짜 (1-31). null이면 filler 셀 (이전/다음 달) */
  day: number | null;
  /** 산책 기록이 있는 날 */
  hasWalk?: boolean;
  /** 발자국(스탬프) 받은 날 */
  hasStamp?: boolean;
  /** 오늘 */
  isToday?: boolean;
  /** 이 셀이 인터랙션 가능한 상태 (과거 빈 날, 미래 등은 disabled) */
  disabled?: boolean;
  /** 커플 연결 이전 / 미래 등 시각적 회색 처리 */
  faded?: boolean;
  onPress?: () => void;
}

/**
 * 캘린더의 단일 셀.
 *
 * 표시 규칙:
 * - 빈 셀(filler): 빈 박스만
 * - 평일: 날짜 숫자 + 인디케이터 점들
 * - 오늘: primary 테두리 + primarySurface 배경
 * - faded: 회색 텍스트 (커플 연결 이전 등)
 * - hasWalk: primary 점
 * - hasStamp: accent 점
 */
export function CalendarDayCell({
  day,
  hasWalk,
  hasStamp,
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
      : theme.colors.text;

  return (
    <Pressable
      style={[styles.cell, isToday && styles.cellToday]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        variant="bodySmall"
        style={[
          styles.dayText,
          { color: textColor },
          isToday && styles.dayTextToday,
        ]}
      >
        {day}
      </Text>
      <View style={styles.indicators}>
        {hasWalk && <View style={[styles.dot, styles.dotWalk]} />}
        {hasStamp && <View style={[styles.dot, styles.dotStamp]} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
    margin: 1,
  },
  cellEmpty: {
    flex: 1,
    aspectRatio: 1,
    margin: 1,
  },
  cellToday: {
    backgroundColor: theme.colors.primarySurface,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  dayText: {
    fontSize: 13,
    lineHeight: 16,
  },
  dayTextToday: {
    fontWeight: '600',
  },
  indicators: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
    height: 4,
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dotWalk: {
    backgroundColor: theme.colors.primary,
  },
  dotStamp: {
    backgroundColor: theme.colors.accent,
  },
});
