import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';
import type { ScheduleCategory } from '@/types/schedule';
import { SCHEDULE_CATEGORY_EMOJI } from '@/types/schedule';

const CATEGORIES: ScheduleCategory[] = [
  'work',
  'social',
  'wedding',
  'health',
  'travel',
  'study',
  'anniversary',
  'other',
];

interface ScheduleCategoryPickerProps {
  value: ScheduleCategory;
  onChange: (value: ScheduleCategory) => void;
}

/**
 * 카테고리 가로 스크롤 칩 셀렉터. 이모지 + 라벨.
 */
export function ScheduleCategoryPicker({
  value,
  onChange,
}: ScheduleCategoryPickerProps) {
  const { t } = useTranslation('schedule');

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {CATEGORIES.map((cat) => {
        const selected = cat === value;
        return (
          <Pressable
            key={cat}
            onPress={() => onChange(cat)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text
              variant="bodySmall"
              style={{ marginRight: 4, fontSize: 14, lineHeight: 18 }}
            >
              {SCHEDULE_CATEGORY_EMOJI[cat]}
            </Text>
            <Text
              variant="caption"
              style={{
                color: selected ? theme.colors.white : theme.colors.text,
                fontWeight: selected ? '600' : '400',
              }}
            >
              {t(`category.${cat}`)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: SPACING.sm,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.gray100,
    borderWidth: 1.5,
    borderColor: theme.colors.gray100,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
});
