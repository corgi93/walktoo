import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Row, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { LAYOUT, SPACING } from '@/styles/type';
import { formatDate } from '@/utils/date';

interface CalendarMonthNavProps {
  year: number;
  month: number; // 1-based
  onPrev: () => void;
  onNext: () => void;
  onTapMonth?: () => void; // 가운데 라벨 탭 → 현재 달로 복귀
}

/**
 * `< [2026년 4월] >` 형태의 월 네비게이션 바.
 *
 * - 양쪽 화살표로 이전/다음 달 이동
 * - 가운데 라벨을 탭하면 onTapMonth (현재 달 복귀 등)
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
        <Icon name="arrow-left" size={20} color={theme.colors.text} />
      </Pressable>
      <Pressable
        onPress={onTapMonth}
        hitSlop={8}
        disabled={!onTapMonth}
        style={styles.label}
      >
        <Text variant="headingSmall" color="text">
          {label}
        </Text>
      </Pressable>
      <Pressable onPress={onNext} hitSlop={12} style={styles.arrow}>
        <View style={styles.flipH}>
          <Icon name="arrow-left" size={20} color={theme.colors.text} />
        </View>
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
  flipH: {
    transform: [{ scaleX: -1 }],
  },
});
