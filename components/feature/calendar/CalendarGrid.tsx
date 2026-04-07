import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Row, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { LAYOUT, SPACING } from '@/styles/type';
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  getLocalToday,
  getMonthKey,
} from '@/utils/date';

import { CalendarDayCell } from './CalendarDayCell';

interface CalendarGridProps {
  year: number;
  month: number; // 1-based
  /** 산책 기록이 있는 'YYYY-MM-DD' 셋 */
  walkDates: Set<string>;
  /** 발자국 받은 'YYYY-MM-DD' 셋 */
  stampDates: Set<string>;
  /** 커플 시작일 ISO 문자열 — 이전 날짜는 faded */
  coupleStartDate?: string;
  onSelectDay: (yyyyMmDd: string) => void;
}

const WEEKDAY_KEYS = ['0', '1', '2', '3', '4', '5', '6'] as const;

/**
 * 7 × 6 월 그리드 (요일 헤더 포함).
 * filler 셀은 빈 칸 (null day).
 */
export function CalendarGrid({
  year,
  month,
  walkDates,
  stampDates,
  coupleStartDate,
  onSelectDay,
}: CalendarGridProps) {
  const { t } = useTranslation('calendar');

  const today = getLocalToday();
  const todayMonthKey = today.slice(0, 7); // 'YYYY-MM'
  const currentMonthKey = getMonthKey(year, month);
  const isCurrentMonth = todayMonthKey === currentMonthKey;
  const todayDay = isCurrentMonth ? Number(today.slice(8, 10)) : null;

  const cells = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    // 6주 * 7일 = 42 셀, 앞쪽은 filler
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    while (arr.length < 42) arr.push(null);
    return arr;
  }, [year, month]);

  const monthPrefix = currentMonthKey;
  const coupleStartMs = coupleStartDate
    ? new Date(coupleStartDate).getTime()
    : null;

  return (
    <View style={styles.container}>
      {/* 요일 헤더 */}
      <Row style={styles.weekHeader}>
        {WEEKDAY_KEYS.map((key, idx) => (
          <View key={key} style={styles.weekHeaderCell}>
            <Text
              variant="caption"
              style={{
                color:
                  idx === 0
                    ? theme.colors.primary
                    : idx === 6
                      ? theme.colors.secondary
                      : theme.colors.textMuted,
              }}
            >
              {t(`weekdays.${key}`)}
            </Text>
          </View>
        ))}
      </Row>

      {/* 6주 그리드 */}
      {Array.from({ length: 6 }).map((_, weekIdx) => (
        <Row key={weekIdx} style={styles.weekRow}>
          {cells.slice(weekIdx * 7, weekIdx * 7 + 7).map((day, dayIdx) => {
            if (day === null) {
              return <CalendarDayCell key={`empty-${weekIdx}-${dayIdx}`} day={null} />;
            }
            const dateStr = `${monthPrefix}-${String(day).padStart(2, '0')}`;
            const hasWalk = walkDates.has(dateStr);
            const hasStamp = stampDates.has(dateStr);
            const isToday = day === todayDay;
            const cellMs = new Date(dateStr).getTime();
            const isFuture = cellMs > new Date(today).getTime();
            const isBeforeCouple =
              coupleStartMs !== null && cellMs < coupleStartMs;
            const faded = isFuture || isBeforeCouple;

            return (
              <CalendarDayCell
                key={dateStr}
                day={day}
                hasWalk={hasWalk}
                hasStamp={hasStamp}
                isToday={isToday}
                faded={faded}
                disabled={isFuture}
                onPress={() => onSelectDay(dateStr)}
              />
            );
          })}
        </Row>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: LAYOUT.screenPx - 4, // 셀 margin 보정
  },
  weekHeader: {
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray100,
    marginBottom: SPACING.xs,
  },
  weekHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekRow: {
    width: '100%',
  },
});
