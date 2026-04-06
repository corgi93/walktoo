import { router } from 'expo-router';
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

import { Box, Row, Text } from '@/components/base';
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

// ─── Screen ──────────────────────────────────────────────

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const completeProfile = useCompleteProfileMutation();

  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [day, setDay] = useState<number | null>(null);
  const [dateStep, setDateStep] = useState<'year' | 'month' | 'day' | null>(null);
  const [characterType, setCharacterType] = useState<'boy' | 'girl'>('boy');
  const [page, setPage] = useState<'info' | 'character'>('info');

  const days =
    year && month
      ? Array.from({ length: getDaysInMonth(year, month) }, (_, i) => i + 1)
      : [];

  const birthdayText =
    year && month && day
      ? `${year}.${pad(month)}.${pad(day)}`
      : '생년월일을 선택해주세요';

  const isInfoValid = nickname.trim().length > 0 && year && month && day;

  const handleNext = () => {
    if (!isInfoValid) return;
    setPage('character');
  };

  const handleSubmit = () => {
    if (!isInfoValid) return;
    completeProfile.mutate({
      nickname: nickname.trim(),
      birthday: `${year}-${pad(month!)}-${pad(day!)}`,
      characterType,
    });
  };

  if (page === 'character') {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 32 }]}>
        <Box px="xxl">
          <Text variant="headingLarge">캐릭터를 선택해주세요</Text>
          <Text variant="bodySmall" color="textSecondary" mt="xs">
            홈 화면에 표시될 캐릭터예요
          </Text>
        </Box>

        <Row style={styles.characterRow}>
          <Pressable
            style={[
              styles.characterOption,
              characterType === 'boy' && styles.characterSelected,
            ]}
            onPress={() => setCharacterType('boy')}
          >
            <CharacterPreview frames={BOY_FRAMES} />
            <Text
              variant="bodySmall"
              color={characterType === 'boy' ? 'primary' : 'textSecondary'}
              mt="sm"
            >
              남자
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.characterOption,
              characterType === 'girl' && styles.characterSelected,
            ]}
            onPress={() => setCharacterType('girl')}
          >
            <CharacterPreview frames={GIRL_FRAMES} />
            <Text
              variant="bodySmall"
              color={characterType === 'girl' ? 'primary' : 'textSecondary'}
              mt="sm"
            >
              여자
            </Text>
          </Pressable>
        </Row>

        <View style={styles.bottomContainer}>
          <Row style={{ gap: 12 }}>
            <Pressable
              style={styles.backButton}
              onPress={() => setPage('info')}
            >
              <Text variant="bodyLarge" color="textSecondary">
                이전
              </Text>
            </Pressable>
            <Pressable
              style={[styles.button, { flex: 1 }]}
              onPress={handleSubmit}
              disabled={completeProfile.isPending}
            >
              <Text variant="bodyLarge" color="white">
                시작하기
              </Text>
            </Pressable>
          </Row>
        </View>
      </View>
    );
  }

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
          onPress={() => setDateStep(dateStep ? null : 'year')}
        >
          <Text
            variant="bodyLarge"
            color={year && month && day ? 'text' : 'textMuted'}
          >
            {birthdayText}
          </Text>
        </Pressable>

        {/* 날짜 선택기 */}
        {dateStep === 'year' && (
          <DateGrid
            items={YEARS}
            columns={4}
            selected={year}
            onSelect={(v) => {
              setYear(v);
              setDateStep('month');
            }}
            format={(v) => `${v}년`}
          />
        )}
        {dateStep === 'month' && (
          <DateGrid
            items={MONTHS}
            columns={4}
            selected={month}
            onSelect={(v) => {
              setMonth(v);
              setDay(null);
              setDateStep('day');
            }}
            format={(v) => `${v}월`}
          />
        )}
        {dateStep === 'day' && (
          <DateGrid
            items={days}
            columns={7}
            selected={day}
            onSelect={(v) => {
              setDay(v);
              setDateStep(null);
            }}
            format={(v) => `${v}`}
          />
        )}
      </Box>

      {/* Next */}
      {!dateStep && (
        <View style={styles.bottomContainer}>
          <Pressable
            style={[styles.button, !isInfoValid && styles.buttonDisabled]}
            onPress={handleNext}
            disabled={!isInfoValid}
          >
            <Text variant="bodyLarge" color="white">
              다음
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─── CharacterPreview ───────────────────────────────────

function CharacterPreview({ frames }: { frames: ImageSourcePropType[] }) {
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
        Animated.timing(bounce, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const translateY = bounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
      <Image
        source={frames[frameIndex]}
        style={{ width: 80, height: 80 }}
        resizeMode="contain"
      />
    </Animated.View>
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
  characterRow: {
    justifyContent: 'center',
    gap: 32,
    marginTop: 48,
    paddingHorizontal: 24,
  },
  characterOption: {
    alignItems: 'center',
    padding: 16,
    borderRadius: theme.radius.lg,
    ...theme.pixel.borderThin,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: theme.colors.surface,
  },
  characterSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySurface,
  },
  backButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
});
