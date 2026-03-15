import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box, Button, PixelBadge, PixelCard, PixelProgressBar, Row, Text } from '@/components/base';
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
  const mySteps = 3200;
  const partnerSteps = 1800;
  const dailyGoal = 10000;
  const totalWalks = 12;
  const currentStreak = 5;

  const myProgress = Math.min(mySteps / dailyGoal, 1);
  const partnerProgress = Math.min(partnerSteps / dailyGoal, 1);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 상단 바 */}
      <Row px="xxl" py="md" style={styles.topBar}>
        <Text variant="headingLarge" color="primary">
          PairWalk
        </Text>
        <Row style={{ gap: SPACING.sm }}>
          <PixelBadge icon="🔥" label={`${currentStreak}일`} size="small" />
          <Pressable hitSlop={8}>
            <Text style={{ fontSize: 18 }}>🔔</Text>
          </Pressable>
        </Row>
      </Row>

      {/* 오늘의 걸음 카드 */}
      <Box px="xxl" style={{ marginTop: SPACING.md }}>
        <Row style={styles.stepsRow}>
          {/* 내 걸음 */}
          <PixelCard style={styles.stepCard} bg={theme.colors.primarySurface}>
            <Text variant="caption" color="textSecondary">
              {myName}
            </Text>
            <Text variant="displaySmall" color="primary" mt="xs">
              {formatSteps(mySteps)}
            </Text>
            <Text variant="caption" color="textMuted">
              걸음
            </Text>
            <PixelProgressBar
              progress={myProgress}
              segments={8}
              fillColor={theme.colors.primary}
              style={{ marginTop: SPACING.sm }}
            />
            <Row style={styles.calorieBadge}>
              <Text style={{ fontSize: 10 }}>🔥</Text>
              <Text variant="caption" color="textSecondary" ml="xxs">
                {calcCalories(mySteps)} kcal
              </Text>
            </Row>
          </PixelCard>

          {/* VS 하트 */}
          <View style={styles.vsDivider}>
            <Text style={styles.heart}>♥</Text>
          </View>

          {/* 상대 걸음 */}
          <PixelCard style={styles.stepCard}>
            <Text variant="caption" color="textSecondary">
              {partnerName}
            </Text>
            <Text variant="displaySmall" color="primary" mt="xs">
              {formatSteps(partnerSteps)}
            </Text>
            <Text variant="caption" color="textMuted">
              걸음
            </Text>
            <PixelProgressBar
              progress={partnerProgress}
              segments={8}
              fillColor={theme.colors.accent}
              style={{ marginTop: SPACING.sm }}
            />
            <Row style={styles.calorieBadge}>
              <Text style={{ fontSize: 10 }}>🔥</Text>
              <Text variant="caption" color="textSecondary" ml="xxs">
                {calcCalories(partnerSteps)} kcal
              </Text>
            </Row>
          </PixelCard>
        </Row>
      </Box>

      {/* 미션 카드 */}
      <Box px="xxl" style={{ marginTop: SPACING.xl }}>
        <PixelCard style={styles.missionCard}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Row style={{ alignItems: 'center', gap: SPACING.sm }}>
              <Text style={{ fontSize: 20 }}>🏆</Text>
              <View>
                <Text variant="headingSmall">오늘의 미션</Text>
                <Text variant="caption" color="textMuted" mt="xxs">
                  함께 6,000보 걷기
                </Text>
              </View>
            </Row>
            <Text variant="label" color="primary">
              {formatSteps(mySteps + partnerSteps)} / 6,000
            </Text>
          </Row>
          <PixelProgressBar
            progress={Math.min((mySteps + partnerSteps) / 6000, 1)}
            segments={12}
            fillColor={theme.colors.secondary}
            style={{ marginTop: SPACING.md }}
          />
        </PixelCard>
      </Box>

      {/* 캐릭터 영역 */}
      <View style={styles.characterArea}>
        <PixelCard style={styles.characterFrame} bg={theme.colors.surfaceWarm}>
          <Text style={styles.characterEmoji}>🌱</Text>
        </PixelCard>
        <Text variant="bodySmall" color="textMuted" mt="md">
          함께 걸으면 자라나요
        </Text>
        <Row style={{ marginTop: SPACING.sm, gap: SPACING.xs }}>
          <PixelBadge icon="⭐" label={`${totalWalks}회`} size="small" bg={theme.colors.goldLight} />
          <PixelBadge icon="👣" label="Lv.2" size="small" bg={theme.colors.primarySurface} />
        </Row>
      </View>

      {/* 하단 CTA */}
      <Box px="xxl" style={{ paddingBottom: SPACING.xxl }}>
        <Button
          variant="primary"
          size="large"
          onPress={() => router.push('/footprint-create')}
        >
          오늘의 발자취 남기기 👣
        </Button>
      </Box>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    alignItems: 'center',
    padding: SPACING.md,
  },
  vsDivider: {
    width: 36,
    alignItems: 'center',
  },
  heart: {
    fontSize: 16,
    color: theme.colors.primary,
  },
  calorieBadge: {
    alignItems: 'center',
    marginTop: SPACING.sm,
    backgroundColor: theme.colors.gray100,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: 4,
  },
  missionCard: {
    padding: SPACING.lg,
  },
  characterArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  characterFrame: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  characterEmoji: {
    fontSize: 56,
  },
});
