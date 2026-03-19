import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box, Text } from '@/components/base';
import { useCompleteProfileMutation } from '@/hooks/services/user/mutation';
import { useAuthStore } from '@/stores/authStore';
import { theme } from '@/styles/theme';

// ─── Constants ───────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 80 }, (_, i) => CURRENT_YEAR - 10 - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month, 0).getDate();

const pad = (n: number) => String(n).padStart(2, '0');

// ─── Screen ──────────────────────────────────────────────

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const completeProfile = useCompleteProfileMutation();

  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [day, setDay] = useState<number | null>(null);
  const [step, setStep] = useState<'year' | 'month' | 'day' | null>(null);

  const days =
    year && month
      ? Array.from({ length: getDaysInMonth(year, month) }, (_, i) => i + 1)
      : [];

  const birthdayText =
    year && month && day
      ? `${year}.${pad(month)}.${pad(day)}`
      : '생년월일을 선택해주세요';

  const isValid = nickname.trim().length > 0 && year && month && day;

  const handleSubmit = () => {
    if (!isValid) return;
    completeProfile.mutate({
      nickname: nickname.trim(),
      birthday: `${year}-${pad(month!)}-${pad(day!)}`,
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 32 }]}>
      {/* Header */}
      <Box px="xxl">
        <Text variant="headingLarge">프로필을 완성해주세요</Text>
        <Text variant="bodySmall" color="textSecondary" mt="xs">
          상대방에게 보여질 이름이에요
        </Text>
      </Box>

      {/* Form */}
      <Box px="xxl" style={{ marginTop: 40 }}>
        {/* 닉네임 */}
        <Text variant="bodySmall" color="textSecondary" mb="xs">
          닉네임
        </Text>
        <TextInput
          style={styles.input}
          value={nickname}
          onChangeText={setNickname}
          placeholder="닉네임을 입력해주세요"
          placeholderTextColor={theme.colors.textMuted}
          maxLength={10}
          autoFocus
        />

        {/* 생년월일 */}
        <Text variant="bodySmall" color="textSecondary" mt="xl" mb="xs">
          생년월일
        </Text>
        <Pressable
          style={styles.input}
          onPress={() => setStep(step ? null : 'year')}
        >
          <Text
            variant="bodyLarge"
            color={year && month && day ? 'text' : 'textMuted'}
          >
            {birthdayText}
          </Text>
        </Pressable>

        {/* 날짜 선택기 */}
        {step === 'year' && (
          <DateGrid
            items={YEARS}
            columns={4}
            selected={year}
            onSelect={(v) => {
              setYear(v);
              setStep('month');
            }}
            format={(v) => `${v}년`}
          />
        )}
        {step === 'month' && (
          <DateGrid
            items={MONTHS}
            columns={4}
            selected={month}
            onSelect={(v) => {
              setMonth(v);
              setDay(null);
              setStep('day');
            }}
            format={(v) => `${v}월`}
          />
        )}
        {step === 'day' && (
          <DateGrid
            items={days}
            columns={7}
            selected={day}
            onSelect={(v) => {
              setDay(v);
              setStep(null);
            }}
            format={(v) => `${v}`}
          />
        )}
      </Box>

      {/* Submit */}
      {!step && (
        <View style={styles.bottomContainer}>
          <Pressable
            style={[styles.button, !isValid && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!isValid || completeProfile.isPending}
          >
            <Text variant="bodyLarge" color="white">
              시작하기
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─── DateGrid Component ──────────────────────────────────

function DateGrid({
  items,
  columns,
  selected,
  onSelect,
  format,
}: {
  items: number[];
  columns: number;
  selected: number | null;
  onSelect: (value: number) => void;
  format: (value: number) => string;
}) {
  return (
    <View style={styles.gridContainer}>
      <FlatList
        data={items}
        numColumns={columns}
        keyExtractor={(item) => String(item)}
        style={{ maxHeight: 240 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.gridItem,
              selected === item && styles.gridItemSelected,
            ]}
            onPress={() => onSelect(item)}
          >
            <Text
              variant="bodySmall"
              color={selected === item ? 'white' : 'text'}
            >
              {format(item)}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'NeoDunggeunmo',
    fontSize: 16,
    color: theme.colors.text,
  },
  gridContainer: {
    marginTop: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    ...theme.pixel.borderThin,
    padding: 8,
  },
  gridItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: theme.radius.sm,
    minWidth: `${100 / 7}%`,
  },
  gridItemSelected: {
    backgroundColor: theme.colors.primary,
  },
  bottomContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    ...theme.pixel.borderThin,
    ...theme.shadows.small,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.gray300,
  },
});
