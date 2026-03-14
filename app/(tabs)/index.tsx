import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box, Button, Row, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';
import { formatSteps } from '@/utils';

// ─── Helpers ────────────────────────────────────────────

const calcCalories = (steps: number): number =>
  Math.round(steps * 0.04);

// ─── Component ──────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // TODO: replace with real data
  const myName = '남친';
  const partnerName = '여친';
  const mySteps = 0;
  const partnerSteps = 0;
  const totalWalks = 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 상단 바 */}
      <Row px="xxl" py="md" style={styles.topBar}>
        <Text variant="headingLarge" color="primary">
          PairWalk
        </Text>
        <Pressable hitSlop={8}>
          <Ionicons
            name="notifications-outline"
            size={22}
            color={theme.colors.gray500}
          />
        </Pressable>
      </Row>

      {/* 오늘의 걸음 — 나 vs 상대 */}
      <Box px="xxl" style={{ marginTop: SPACING.md }}>
        <Row style={styles.stepsRow}>
          <StepCard name={myName} steps={mySteps} isMe />
          <View style={styles.vsDivider}>
            <Text style={styles.heart}>♥</Text>
          </View>
          <StepCard name={partnerName} steps={partnerSteps} />
        </Row>
      </Box>

      {/* 캐릭터 영역 */}
      <View style={styles.characterArea}>
        <View style={styles.characterCircle}>
          <Text style={styles.characterEmoji}>🌱</Text>
        </View>
        <Text variant="bodySmall" color="textMuted" mt="lg">
          함께 걸으면 자라나요
        </Text>
      </View>

      {/* 하단 CTA */}
      <Box px="xxl" style={{ paddingBottom: SPACING.xxl }}>
        <Button
          variant="primary"
          size="large"
          onPress={() => router.push('/footprint-create')}
        >
          오늘의 발자취 남기기
        </Button>
      </Box>
    </View>
  );
}

// ─── Sub Components ─────────────────────────────────────

function StepCard({
  name,
  steps,
  isMe = false,
}: {
  name: string;
  steps: number;
  isMe?: boolean;
}) {
  return (
    <View style={[styles.stepCard, isMe && styles.stepCardMe]}>
      <Text variant="caption" color="textMuted">
        {name}
      </Text>
      <Text variant="displaySmall" color="primary" mt="xs">
        {formatSteps(steps)}
      </Text>
      <Text variant="caption" color="textMuted">
        걸음
      </Text>
      <View style={styles.calorieBadge}>
        <Ionicons name="flame-outline" size={12} color={theme.colors.accent} />
        <Text variant="caption" color="textSecondary" ml="xxs">
          {calcCalories(steps)} kcal
        </Text>
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surfaceWarm,
  },
  topBar: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepsRow: {
    alignItems: 'center',
  },
  stepCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    ...theme.shadows.card,
  },
  stepCardMe: {
    backgroundColor: theme.colors.primarySurface,
  },
  vsDivider: {
    width: 32,
    alignItems: 'center',
  },
  heart: {
    fontSize: 16,
    color: theme.colors.primary,
  },
  calorieBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    backgroundColor: theme.colors.gray100,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: theme.radius.full,
  },
  characterArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  characterCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.card,
  },
  characterEmoji: {
    fontSize: 56,
  },
});
