import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Icon, Row, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { LAYOUT, SPACING } from '@/styles/type';
import { formatDate } from '@/utils/date';

interface CalendarMonthNavProps {
  year: number;
  month: number; // 1-based
  onPrev: () => void;
  onNext: () => void;
  /** 가운데 라벨 탭 → 연/월 피커 오픈 등 */
  onTapMonth?: () => void;
}

/**
 * `< [2026년 4월] >` 형태의 월 네비게이션 바.
 *
 * - 양쪽 chevron으로 이전/다음 달 이동
 * - 가운데 라벨 탭 → onTapMonth (연/월 피커)
 * - 월 표시는 formatDate로 i18n 안전 (ko: "2026년 4월" / en: "April 2026")
 */
export function CalendarMonthNav({
  year,
  month,
  onPrev,
  onNext,
  onTapMonth,
}: CalendarMonthNavProps) {
  const label = formatDate(new Date(year, month - 1, 1), {
    year: 'numeric',
    month: 'long',
  });

  return (
    <Row style={styles.bar}>
      <Pressable onPress={onPrev} hitSlop={12} style={styles.arrow}>
        <Icon name="chevron-left" size={22} color={theme.colors.text} />
      </Pressable>
      <Pressable
        onPress={onTapMonth}
        hitSlop={8}
        disabled={!onTapMonth}
        style={styles.label}
      >
        <Row style={styles.labelInner}>
          <Text variant="headingSmall" color="text">
            {label}
          </Text>
          {onTapMonth && (
            <Icon name="chevron-down" size={16} color={theme.colors.textMuted} />
          )}
        </Row>
      </Pressable>
      <Pressable onPress={onNext} hitSlop={12} style={styles.arrow}>
        <Icon name="chevron-right" size={22} color={theme.colors.text} />
      </Pressable>
    </Row>
  );
}

const styles = StyleSheet.create({
  bar: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: LAYOUT.screenPx,
    paddingVertical: SPACING.md,
  },
  arrow: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    flex: 1,
    alignItems: 'center',
  },
  labelInner: {
    alignItems: 'center',
    gap: 4,
  },
});
