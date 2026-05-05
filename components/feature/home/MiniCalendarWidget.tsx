import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, Text } from '@/components/base';
import { useCalendarMonthQuery } from '@/hooks/services/calendar/query';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';
import {
  getCurrentYearMonth,
  getDaysInMonth,
  getFirstDayOfMonth,
  getLocalToday,
  getMonthKey,
} from '@/utils/date';

const WEEKS = 6;
const COLS = 7;
const WEEKDAY_KEYS = ['0', '1', '2', '3', '4', '5', '6'] as const;

export function MiniCalendarWidget() {
  const router = useRouter();
  const { t } = useTranslation(['home', 'calendar']);

  const { year, month } = getCurrentYearMonth();
  const { walks, stamps } = useCalendarMonthQuery(year, month);

  const today = getLocalToday();
  const todayDay = Number(today.slice(8, 10));
  const monthPrefix = getMonthKey(year, month);

  const walkSet = useMemo(() => new Set(walks.map((w) => w.date)), [walks]);
  const stampSet = useMemo(() => new Set(stamps), [stamps]);

  const cells = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    while (arr.length < WEEKS * COLS) arr.push(null);
    return arr;
  }, [year, month]);

  return (
    <Pressable
      style={styles.container}
      onPress={() => router.push('/(tabs)/records')}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="calendar" size={13} color={theme.colors.primary} />
          <Text variant="bodySmall" color="text" style={styles.headerTitle}>
            {t('calendar:month-label', { year, month })}
          </Text>
        </View>
        <View style={styles.summary}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
          <Text variant="caption" color="textSecondary" style={styles.legendText}>
            {t('calendar:strip.walks', { count: walks.length })}
          </Text>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.accent }]} />
          <Text variant="caption" color="textSecondary" style={styles.legendText}>
            {t('calendar:strip.stamps', { count: stamps.length })}
          </Text>
        </View>
      </View>

      <View style={styles.weekHeader}>
        {WEEKDAY_KEYS.map((key, idx) => (
          <View key={key} style={styles.weekHeaderCell}>
            <Text
              variant="caption"
              style={[
                styles.weekHeaderText,
                {
                  color:
                    idx === 0
                      ? theme.colors.primary
                      : idx === 6
                        ? theme.colors.secondary
                        : theme.colors.textMuted,
                },
              ]}
            >
              {t(`calendar:weekdays.${key}`)}
            </Text>
          </View>
        ))}
      </View>

      {Array.from({ length: WEEKS }).map((_, weekIdx) => {
        const weekCells = cells.slice(weekIdx * COLS, weekIdx * COLS + COLS);
        if (weekCells.every((c) => c === null)) return null;
        return (
          <View key={weekIdx} style={styles.weekRow}>
            {weekCells.map((day, dayIdx) => {
              if (day === null) {
                return <View key={`e-${weekIdx}-${dayIdx}`} style={styles.cell} />;
              }
              const dateStr = `${monthPrefix}-${String(day).padStart(2, '0')}`;
              const hasWalk = walkSet.has(dateStr);
              const hasStamp = stampSet.has(dateStr);
              const isToday = day === todayDay;
              const dayColor = isToday
                ? theme.colors.white
                : dayIdx === 0
                  ? theme.colors.primary
                  : dayIdx === 6
                    ? theme.colors.secondary
                    : theme.colors.text;

              return (
                <View
                  key={dateStr}
                  style={[styles.cell, isToday && styles.cellToday]}
                >
                  <Text
                    variant="caption"
                    style={[styles.cellText, { color: dayColor }]}
                  >
                    {day}
                  </Text>
                  <View style={styles.dotRow}>
                    {hasWalk && (
                      <View
                        style={[
                          styles.dot,
                          {
                            backgroundColor: isToday
                              ? theme.colors.white
                              : theme.colors.primary,
                          },
                        ]}
                      />
                    )}
                    {hasStamp && (
                      <View
                        style={[
                          styles.dot,
                          {
                            backgroundColor: isToday
                              ? theme.colors.white
                              : theme.colors.accent,
                          },
                        ]}
                      />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        );
      })}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    ...theme.shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontWeight: '600',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 3,
  },
  legendText: {
    fontSize: 10,
    marginRight: 8,
  },
  weekHeader: {
    flexDirection: 'row',
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray100,
    marginBottom: 2,
  },
  weekHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  weekHeaderText: {
    fontSize: 10,
    lineHeight: 12,
  },
  weekRow: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 1,
    borderRadius: theme.radius.xs,
  },
  cellToday: {
    backgroundColor: theme.colors.primary,
  },
  cellText: {
    fontSize: 11,
    lineHeight: 14,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 1,
    height: 4,
    alignItems: 'center',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
});
