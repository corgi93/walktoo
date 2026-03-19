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

import { Box, Icon, Row, Text } from '@/components/base';
import { useUpdateProfileMutation } from '@/hooks/services/user/mutation';
import { useGetMeQuery } from '@/hooks/services/user/query';
import { useDialogStore } from '@/stores/dialogStore';
import { theme } from '@/styles/theme';
import { LAYOUT } from '@/styles/type';

// ─── Constants ───────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 80 }, (_, i) => CURRENT_YEAR - 10 - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const pad = (n: number) => String(n).padStart(2, '0');
const getDaysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();

// ─── Screen ──────────────────────────────────────────────

export default function ProfileEditScreen() {
  const insets = useSafeAreaInsets();
  const { data: me } = useGetMeQuery();
  const updateProfile = useUpdateProfileMutation();
  const dialog = useDialogStore();

  const [nickname, setNickname] = useState(me?.nickname ?? '');

  // birthday parsing
  const parsed = me?.birthday ? new Date(me.birthday) : null;
  const [year, setYear] = useState<number | null>(parsed?.getFullYear() ?? null);
  const [month, setMonth] = useState<number | null>(
    parsed ? parsed.getMonth() + 1 : null,
  );
  const [day, setDay] = useState<number | null>(parsed?.getDate() ?? null);
  const [dateStep, setDateStep] = useState<'year' | 'month' | 'day' | null>(null);

  const days =
    year && month
      ? Array.from({ length: getDaysInMonth(year, month) }, (_, i) => i + 1)
      : [];

  const birthdayText =
    year && month && day
      ? `${year}.${pad(month)}.${pad(day)}`
      : '생년월일을 선택해주세요';

  const handleSave = () => {
    if (!nickname.trim()) {
      dialog.alert('', '닉네임을 입력해주세요');
      return;
    }

    updateProfile.mutate(
      {
        nickname: nickname.trim(),
        ...(year && month && day
          ? { birthday: `${year}-${pad(month)}-${pad(day)}` }
          : {}),
      } as { nickname: string; birthday?: string },
      {
        onSuccess: () => {
          dialog.showDialog({
            title: '프로필이 수정되었어요',
            buttons: [
              { label: '확인', variant: 'primary', onPress: () => router.back() },
            ],
          });
        },
      },
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Row px="xxl" style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Icon name="arrow-left" size={22} color={theme.colors.text} />
        </Pressable>
        <Text variant="headingMedium">프로필 수정</Text>
        <Pressable onPress={handleSave} disabled={updateProfile.isPending}>
          <Text variant="bodyMedium" color="primary">
            저장
          </Text>
        </Pressable>
      </Row>

      <Box px="xxl" style={{ marginTop: 32 }}>
        {/* 닉네임 */}
        <Text variant="bodySmall" color="textSecondary" mb="xs">
          닉네임
        </Text>
        <TextInput
          style={styles.input}
          value={nickname}
          onChangeText={setNickname}
          placeholder="닉네임"
          placeholderTextColor={theme.colors.textMuted}
          maxLength={10}
        />

        {/* 생년월일 */}
        <Text variant="bodySmall" color="textSecondary" mt="xl" mb="xs">
          생년월일
        </Text>
        <Pressable
          style={styles.input}
          onPress={() => setDateStep(dateStep ? null : 'year')}
        >
          <Text
            variant="bodyLarge"
            color={year && month && day ? 'text' : 'textMuted'}
          >
            {birthdayText}
          </Text>
        </Pressable>

        {dateStep === 'year' && (
          <DateGrid
            items={YEARS}
            columns={4}
            selected={year}
            onSelect={(v) => { setYear(v); setDateStep('month'); }}
            format={(v) => `${v}년`}
          />
        )}
        {dateStep === 'month' && (
          <DateGrid
            items={MONTHS}
            columns={4}
            selected={month}
            onSelect={(v) => { setMonth(v); setDay(null); setDateStep('day'); }}
            format={(v) => `${v}월`}
          />
        )}
        {dateStep === 'day' && (
          <DateGrid
            items={days}
            columns={7}
            selected={day}
            onSelect={(v) => { setDay(v); setDateStep(null); }}
            format={(v) => `${v}`}
          />
        )}
      </Box>
    </View>
  );
}

// ─── DateGrid ────────────────────────────────────────────

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
  onSelect: (v: number) => void;
  format: (v: number) => string;
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
            style={[styles.gridItem, selected === item && styles.gridItemSelected]}
            onPress={() => onSelect(item)}
          >
            <Text variant="bodySmall" color={selected === item ? 'white' : 'text'}>
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
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: LAYOUT.headerPy,
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
  },
  gridItemSelected: {
    backgroundColor: theme.colors.primary,
  },
});
