import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Row, Text } from '@/components/base';
import { theme } from '@/styles/theme';

interface FirstMetDatePickerProps {
  currentDate?: string;
  onSave: (date: string) => void;
  onClose: () => void;
}

const PICKER_YEARS = Array.from(
  { length: 30 },
  (_, i) => new Date().getFullYear() - i,
);
const PICKER_MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * 처음 만난 날 선택 모달
 * 연 → 월 → 일 순차 입력. 값이 모두 채워지면 저장 버튼 노출.
 */
export function FirstMetDatePicker({
  currentDate,
  onSave,
  onClose,
}: FirstMetDatePickerProps) {
  const { t } = useTranslation(['home', 'common']);

  // currentDate ("YYYY-MM-DD") 파싱 — UTC 함정을 피하기 위해 수동 분해
  const initial = currentDate
    ? {
        year: Number(currentDate.slice(0, 4)),
        month: Number(currentDate.slice(5, 7)),
        day: Number(currentDate.slice(8, 10)),
      }
    : null;

  const [year, setYear] = useState<number | null>(initial?.year ?? null);
  const [month, setMonth] = useState<number | null>(initial?.month ?? null);
  const [day, setDay] = useState<number | null>(initial?.day ?? null);
  const [step, setStep] = useState<'year' | 'month' | 'day'>('year');

  const daysInMonth =
    year && month ? new Date(year, month, 0).getDate() : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleSave = () => {
    if (year && month && day) {
      onSave(`${year}-${pad2(month)}-${pad2(day)}`);
    }
  };

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
        <Text variant="headingSmall" mb="md">
          {t('home:dday.picker-title')}
        </Text>

        {year && month && day && (
          <Text
            variant="bodyLarge"
            color="primary"
            mb="sm"
            style={{ textAlign: 'center' }}
          >
            {year}.{pad2(month)}.{pad2(day)}
          </Text>
        )}

        {step === 'year' && (
          <FlatList
            data={PICKER_YEARS}
            numColumns={4}
            keyExtractor={(item) => String(item)}
            style={{ maxHeight: 200 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.item, year === item && styles.itemSelected]}
                onPress={() => {
                  setYear(item);
                  setStep('month');
                }}
              >
                <Text variant="bodySmall" color={year === item ? 'white' : 'text'}>
                  {item}
                  {t('common:labels.year-suffix')}
                </Text>
              </Pressable>
            )}
          />
        )}
        {step === 'month' && (
          <FlatList
            data={PICKER_MONTHS}
            numColumns={4}
            keyExtractor={(item) => String(item)}
            style={{ maxHeight: 200 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.item, month === item && styles.itemSelected]}
                onPress={() => {
                  setMonth(item);
                  setDay(null);
                  setStep('day');
                }}
              >
                <Text variant="bodySmall" color={month === item ? 'white' : 'text'}>
                  {item}
                  {t('common:labels.month-suffix')}
                </Text>
              </Pressable>
            )}
          />
        )}
        {step === 'day' && (
          <FlatList
            data={days}
            numColumns={7}
            keyExtractor={(item) => String(item)}
            style={{ maxHeight: 200 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.item, day === item && styles.itemSelected]}
                onPress={() => setDay(item)}
              >
                <Text variant="bodySmall" color={day === item ? 'white' : 'text'}>
                  {item}
                </Text>
              </Pressable>
            )}
          />
        )}

        <Row style={styles.footer}>
          <Pressable onPress={onClose}>
            <Text variant="bodySmall" color="textSecondary">
              {t('common:actions.cancel')}
            </Text>
          </Pressable>
          {year && month && day && (
            <Pressable style={styles.saveBtn} onPress={handleSave}>
              <Text variant="bodySmall" color="white">
                {t('common:actions.save')}
              </Text>
            </Pressable>
          )}
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
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: theme.radius.sm,
  },
  itemSelected: {
    backgroundColor: theme.colors.primary,
  },
  footer: {
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 12,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
    ...theme.pixel.borderThin,
  },
});
