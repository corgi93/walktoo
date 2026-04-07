import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Row, Text } from '@/components/base';
import { theme } from '@/styles/theme';

// ─── Constants ───────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const pad = (n: number) => String(n).padStart(2, '0');

// ─── Props ───────────────────────────────────────────────

interface SimpleDatePickerProps {
  currentDate?: string; // ISO date string (yyyy-MM-dd)
  onSave: (date: string) => void;
  onClose: () => void;
  title?: string;
  maxDate?: Date;
  minYear?: number;
}

// ─── Component ───────────────────────────────────────────

export function SimpleDatePicker({
  currentDate,
  onSave,
  onClose,
  title = '날짜 선택',
  maxDate,
  minYear,
}: SimpleDatePickerProps) {
  const parsed = currentDate ? new Date(currentDate) : null;
  const [year, setYear] = useState<number | null>(parsed?.getFullYear() ?? null);
  const [month, setMonth] = useState<number | null>(
    parsed ? parsed.getMonth() + 1 : null,
  );
  const [day, setDay] = useState<number | null>(parsed?.getDate() ?? null);
  const [step, setStep] = useState<'year' | 'month' | 'day'>('year');

  const years = minYear
    ? Array.from({ length: CURRENT_YEAR - minYear + 1 }, (_, i) => CURRENT_YEAR - i)
    : DEFAULT_YEARS;

  const daysInMonth =
    year && month ? new Date(year, month, 0).getDate() : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const isDateValid = (y: number, m: number, d: number) => {
    if (!maxDate) return true;
    const selected = new Date(y, m - 1, d);
    return selected <= maxDate;
  };

  const handleSave = () => {
    if (year && month && day) {
      onSave(`${year}-${pad(month)}-${pad(day)}`);
    }
  };

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
        <Text variant="headingSmall" mb="md">
          {title}
        </Text>

        {year && month && day && (
          <Text
            variant="bodyLarge"
            color="primary"
            mb="sm"
            style={{ textAlign: 'center' }}
          >
            {year}.{pad(month)}.{pad(day)}
          </Text>
        )}

        {step === 'year' && (
          <FlatList
            data={years}
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
                <Text
                  variant="bodySmall"
                  color={year === item ? 'white' : 'text'}
                >
                  {item}년
                </Text>
              </Pressable>
            )}
          />
        )}

        {step === 'month' && (
          <FlatList
            data={MONTHS}
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
                <Text
                  variant="bodySmall"
                  color={month === item ? 'white' : 'text'}
                >
                  {item}월
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
            renderItem={({ item }) => {
              const disabled =
                maxDate && year && month && !isDateValid(year, month, item);
              return (
                <Pressable
                  style={[
                    styles.item,
                    day === item && styles.itemSelected,
                    disabled ? styles.itemDisabled : undefined,
                  ]}
                  onPress={() => !disabled && setDay(item)}
                  disabled={!!disabled}
                >
                  <Text
                    variant="bodySmall"
                    color={
                      disabled
                        ? 'textMuted'
                        : day === item
                          ? 'white'
                          : 'text'
                    }
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            }}
          />
        )}

        <Row style={{ justifyContent: 'flex-end', marginTop: 16, gap: 12 }}>
          <Pressable onPress={onClose}>
            <Text variant="bodySmall" color="textSecondary">
              취소
            </Text>
          </Pressable>
          {year && month && day && (
            <Pressable style={styles.saveBtn} onPress={handleSave}>
              <Text variant="bodySmall" color="white">
                저장
              </Text>
            </Pressable>
          )}
        </Row>
      </Pressable>
    </Pressable>
  );
}

// ─── Styles ──────────────────────────────────────────────

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
  itemDisabled: {
    opacity: 0.3,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
    ...theme.pixel.borderThin,
  },
});
