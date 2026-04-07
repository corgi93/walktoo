import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Box, Icon, Row, Text } from '@/components/base';
import { useUpdateProfileMutation } from '@/hooks/services/user/mutation';
import { useGetMeQuery } from '@/hooks/services/user/query';
import { useDialogStore } from '@/stores/dialogStore';
import { theme } from '@/styles/theme';
import { LAYOUT } from '@/styles/type';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const BOY_FRAMES: ImageSourcePropType[] = [
  require('@/assets/sprites/boy_walk_1.png'),
  require('@/assets/sprites/boy_walk_2.png'),
  require('@/assets/sprites/boy_walk_3.png'),
  require('@/assets/sprites/boy_walk_4.png'),
];

// eslint-disable-next-line @typescript-eslint/no-var-requires
const GIRL_FRAMES: ImageSourcePropType[] = [
  require('@/assets/sprites/girl_walk_1.png'),
  require('@/assets/sprites/girl_walk_2.png'),
  require('@/assets/sprites/girl_walk_3.png'),
  require('@/assets/sprites/girl_walk_4.png'),
];

// ─── Constants ───────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 80 }, (_, i) => CURRENT_YEAR - 10 - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const pad = (n: number) => String(n).padStart(2, '0');
const getDaysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();

// ─── Screen ──────────────────────────────────────────────

export default function ProfileEditScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation(['profile', 'common']);
  const { data: me } = useGetMeQuery();
  const updateProfile = useUpdateProfileMutation();
  const dialog = useDialogStore();

  const [nickname, setNickname] = useState(me?.nickname ?? '');
  const [characterType, setCharacterType] = useState<'boy' | 'girl'>(
    (me?.characterType as 'boy' | 'girl') ?? 'boy',
  );

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
      : t('profile:edit.birthday-placeholder');

  const handleSave = () => {
    if (!nickname.trim()) {
      dialog.alert('', t('profile:edit.nickname-required'));
      return;
    }

    updateProfile.mutate(
      {
        nickname: nickname.trim(),
        characterType,
        ...(year && month && day
          ? { birthday: `${year}-${pad(month)}-${pad(day)}` }
          : {}),
      },
      {
        onSuccess: () => {
          dialog.showDialog({
            title: t('profile:edit.save-success'),
            buttons: [
              { label: t('common:actions.ok'), variant: 'primary', onPress: () => router.back() },
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
        <Text variant="headingMedium">{t('profile:edit.title')}</Text>
        <Pressable onPress={handleSave} disabled={updateProfile.isPending}>
          <Text variant="bodyMedium" color="primary">
            {t('profile:edit.save')}
          </Text>
        </Pressable>
      </Row>

      <Box px="xxl" style={{ marginTop: 32 }}>
        {/* 닉네임 */}
        <Text variant="bodySmall" color="textSecondary" mb="xs">
          {t('profile:edit.nickname-label')}
        </Text>
        <TextInput
          style={styles.input}
          value={nickname}
          onChangeText={setNickname}
          placeholder={t('profile:edit.nickname-placeholder')}
          placeholderTextColor={theme.colors.textMuted}
          maxLength={10}
        />

        {/* 생년월일 */}
        <Text variant="bodySmall" color="textSecondary" mt="xl" mb="xs">
          {t('profile:edit.birthday-label')}
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
            format={(v) => `${v}${t('common:labels.year-suffix')}`}
          />
        )}
        {dateStep === 'month' && (
          <DateGrid
            items={MONTHS}
            columns={4}
            selected={month}
            onSelect={(v) => { setMonth(v); setDay(null); setDateStep('day'); }}
            format={(v) => `${v}${t('common:labels.month-suffix')}`}
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

        {/* 캐릭터 */}
        <Text variant="bodySmall" color="textSecondary" mt="xl" mb="xs">
          {t('profile:edit.character-label')}
        </Text>
        <Row style={styles.characterRow}>
          <Pressable
            style={[
              styles.characterOption,
              characterType === 'boy' && styles.characterSelected,
            ]}
            onPress={() => setCharacterType('boy')}
          >
            <CharacterPreview frames={BOY_FRAMES} size={56} />
            <Text
              variant="caption"
              color={characterType === 'boy' ? 'primary' : 'textSecondary'}
              mt="xxs"
            >
              {t('profile:edit.character-boy')}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.characterOption,
              characterType === 'girl' && styles.characterSelected,
            ]}
            onPress={() => setCharacterType('girl')}
          >
            <CharacterPreview frames={GIRL_FRAMES} size={56} />
            <Text
              variant="caption"
              color={characterType === 'girl' ? 'primary' : 'textSecondary'}
              mt="xxs"
            >
              {t('profile:edit.character-girl')}
            </Text>
          </Pressable>
        </Row>
      </Box>
    </View>
  );
}

// ─── CharacterPreview ───────────────────────────────────

function CharacterPreview({ frames, size = 56 }: { frames: ImageSourcePropType[]; size?: number }) {
  const [frameIndex, setFrameIndex] = useState(0);
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, 300);
    return () => clearInterval(interval);
  }, [frames.length]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const translateY = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
      <Image source={frames[frameIndex]} style={{ width: size, height: size }} resizeMode="contain" />
    </Animated.View>
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
  characterRow: {
    gap: 16,
  },
  characterOption: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: theme.radius.md,
    ...theme.pixel.borderThin,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: theme.colors.surface,
  },
  characterSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySurface,
  },
});
