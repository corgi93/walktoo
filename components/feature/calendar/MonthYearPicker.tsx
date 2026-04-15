import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Row, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';
import { getCurrentYearMonth } from '@/utils/date';

interface MonthYearPickerProps {
  year: number;
  month: number; // 1-based
  /** 커플 시작일(YYYY-MM-DD) — 피커의 최소 연도 결정 */
  coupleStartDate?: string;
  onSelect: (next: { year: number; month: number }) => void;
  onClose: () => void;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

/**
 * 연/월 선택 모달
 *
 * - 상단: 연도 가로 pill 리스트 (커플 시작 연도 ~ 현재 연도)
 * - 중앙: 4×3 월 그리드
 * - 하단: "오늘" 빠른 복귀 + 취소
 *
 * 월 탭 시 즉시 선택 → 모달 닫힘 (토스 방식).
 */
export function MonthYearPicker({
  year,
  month,
  coupleStartDate,
  onSelect,
  onClose,
}: MonthYearPickerProps) {
  const { t } = useTranslation(['home', 'common']);
  const [selectedYear, setSelectedYear] = useState(year);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = coupleStartDate
      ? Number(coupleStartDate.slice(0, 4))
      : currentYear - 2;
    const safeStart = Math.min(startYear, currentYear);
    const list: number[] = [];
    for (let y = safeStart; y <= currentYear; y++) list.push(y);
    return list;
  }, [coupleStartDate]);

  const handlePickMonth = (m: number) => {
    onSelect({ year: selectedYear, month: m });
    onClose();
  };

  const handleToday = () => {
    onSelect(getCurrentYearMonth());
    onClose();
  };

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
        <Text variant="headingSmall" mb="md">
          {t('home:records-tab.picker-title')}
        </Text>

        {/* Year pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.yearRow}
        >
          {years.map((y) => {
            const active = y === selectedYear;
            return (
              <Pressable
                key={y}
                onPress={() => setSelectedYear(y)}
                style={[styles.yearPill, active && styles.yearPillActive]}
              >
                <Text
                  variant="bodySmall"
                  color={active ? 'white' : 'textSecondary'}
                >
                  {y}
                  {t('common:labels.year-suffix')}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Month grid 4×3 */}
        <View style={styles.grid}>
          {MONTHS.map((m) => {
            const active = selectedYear === year && m === month;
            return (
              <Pressable
                key={m}
                style={[styles.monthCell, active && styles.monthCellActive]}
                onPress={() => handlePickMonth(m)}
              >
                <Text
                  variant="bodyLarge"
                  color={active ? 'white' : 'text'}
                >
                  {m}
                  {t('common:labels.month-suffix')}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Footer */}
        <Row style={styles.footer}>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text variant="bodySmall" color="textSecondary">
              {t('common:actions.cancel')}
            </Text>
          </Pressable>
          <Pressable style={styles.todayBtn} onPress={handleToday}>
            <Text variant="bodySmall" color="white">
              {t('home:records-tab.picker-today')}
            </Text>
          </Pressable>
        </Row>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(44, 44, 46, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modal: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 20,
    width: '85%',
    ...theme.pixel.borderThin,
    ...theme.shadows.card,
  },
  yearRow: {
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  yearPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.gray100,
  },
  yearPillActive: {
    backgroundColor: theme.colors.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.md,
  },
  monthCell: {
    width: '25%',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
  },
  monthCellActive: {
    backgroundColor: theme.colors.primary,
  },
  footer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: 12,
  },
  todayBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
    ...theme.pixel.borderThin,
  },
});
