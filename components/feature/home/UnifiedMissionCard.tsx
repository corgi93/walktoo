import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  Box,
  Icon,
  PixelCard,
  PixelProgressBar,
  Row,
  Text,
} from '@/components/base';
import { STAMP, STEP_GOAL, stepsToCalories } from '@/constants/game-config';
import { theme } from '@/styles/theme';
import { LAYOUT, SPACING } from '@/styles/type';
import { formatNumber, formatSteps } from '@/utils/date';

// ─── Props ──────────────────────────────────────────────

interface UnifiedMissionCardProps {
  isCoupleConnected: boolean;
  myName: string;
  partnerName: string;
  mySteps: number;
  partnerSteps: number;
  hasTodayStamp: boolean;
  isClaiming: boolean;
  onClaim: () => void;
}

/**
 * 홈 히어로 카드 — StepsSection + MissionCard 통합.
 *
 * 커플 모드 (isCoupleConnected):
 *   - 헤더: 🎯 오늘 우리의 걸음 · 진행률 %
 *   - 히어로 숫자: 총합 / 목표
 *   - Progress bar
 *   - divider
 *   - 혁지니 · Kiki 각각 한 줄
 *   - 미션 완료 시 추억의 발자국 받기 버튼
 *
 * 솔로 모드:
 *   - 헤더: 🎯 오늘의 걸음
 *   - 히어로 숫자: 내 걸음 / 개인 목표
 *   - Progress bar
 *   - 우측 kcal chip
 *   - claim 버튼 없음
 *
 * PixelCard 기본 padding(16)을 유지. 내부 margin으로만 간격 조정.
 */
export function UnifiedMissionCard({
  isCoupleConnected,
  myName,
  partnerName,
  mySteps,
  partnerSteps,
  hasTodayStamp,
  isClaiming,
  onClaim,
}: UnifiedMissionCardProps) {
  const { t } = useTranslation('home');

  if (isCoupleConnected) {
    return (
      <CoupleMission
        myName={myName}
        partnerName={partnerName}
        mySteps={mySteps}
        partnerSteps={partnerSteps}
        hasTodayStamp={hasTodayStamp}
        isClaiming={isClaiming}
        onClaim={onClaim}
        t={t}
      />
    );
  }

  return <SoloMission mySteps={mySteps} t={t} />;
}

// ─── Couple Mode ────────────────────────────────────────

function CoupleMission({
  myName,
  partnerName,
  mySteps,
  partnerSteps,
  hasTodayStamp,
  isClaiming,
  onClaim,
  t,
}: {
  myName: string;
  partnerName: string;
  mySteps: number;
  partnerSteps: number;
  hasTodayStamp: boolean;
  isClaiming: boolean;
  onClaim: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const goal = STEP_GOAL.DAILY_COUPLE_MISSION;
  const total = mySteps + partnerSteps;
  const progress = Math.min(total / goal, 1);
  const percent = Math.min(Math.round(progress * 100), 100);
  const isCompleted = total >= goal;

  return (
    <Box px="xxl" style={styles.section}>
      <PixelCard bg={theme.colors.primarySurface}>
        {/* 헤더 */}
        <Row style={styles.headerRow}>
          <Row style={styles.headerTitle}>
            <Icon name="target" size={16} color={theme.colors.secondary} />
            <Text variant="label" color="textSecondary" ml="xs">
              {t('unified-mission.title')}
            </Text>
          </Row>
          <Text variant="caption" color="textMuted">
            {t('unified-mission.progress-percent', { percent })}
          </Text>
        </Row>

        {/* 히어로 숫자 */}
        <Row style={styles.heroRow}>
          <Text variant="displaySmall" color="primary">
            {formatSteps(total)}
          </Text>
          <Text variant="bodySmall" color="textMuted" ml="xs">
            {t('unified-mission.goal-suffix', { goal: formatNumber(goal) })}
          </Text>
        </Row>

        {/* Progress bar */}
        <PixelProgressBar
          progress={progress}
          segments={16}
          fillColor={theme.colors.primary}
          style={styles.progressBar}
        />

        {/* divider */}
        <View style={styles.divider} />

        {/* 나 / 상대방 한 줄씩 */}
        <PersonRow name={myName} steps={mySteps} highlighted t={t} />
        <View style={styles.personGap} />
        <PersonRow name={partnerName} steps={partnerSteps} t={t} />

        {/* 발자국 받기 버튼 */}
        {isCompleted && (
          <Pressable
            onPress={onClaim}
            disabled={hasTodayStamp || isClaiming}
            style={[styles.claimBtn, hasTodayStamp && styles.claimBtnDone]}
          >
            <Icon
              name="footprint"
              size={14}
              color={hasTodayStamp ? theme.colors.textMuted : theme.colors.white}
            />
            <Text
              variant="bodySmall"
              color={hasTodayStamp ? 'textMuted' : 'white'}
              ml="xs"
            >
              {hasTodayStamp
                ? t('unified-mission.claim-done')
                : t('unified-mission.claim-button', { count: STAMP.DAILY_REWARD })}
            </Text>
          </Pressable>
        )}
      </PixelCard>
    </Box>
  );
}

// ─── Person Row (Couple Mode 내부) ──────────────────────

function PersonRow({
  name,
  steps,
  highlighted,
  t,
}: {
  name: string;
  steps: number;
  highlighted?: boolean;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const kcal = stepsToCalories(steps);
  return (
    <Row style={styles.personRow}>
      <Row style={styles.personLeft}>
        <View
          style={[
            styles.personDot,
            {
              backgroundColor: highlighted
                ? theme.colors.primary
                : theme.colors.gray400,
            },
          ]}
        />
        <Text variant="bodySmall" color="text" ml="xs">
          {name}
        </Text>
      </Row>
      <Row style={styles.personRight}>
        <Text
          variant="label"
          color={highlighted ? 'primary' : 'text'}
          style={styles.personSteps}
        >
          {formatSteps(steps)}
        </Text>
        <Text variant="caption" color="textMuted" ml="xxs">
          {t('unified-mission.steps-unit')}
        </Text>
        <View style={styles.personDivider} />
        <Icon name="fire" size={10} color={theme.colors.accent} />
        <Text variant="caption" color="textSecondary" ml="xxs">
          {t('unified-mission.kcal-unit', { value: kcal })}
        </Text>
      </Row>
    </Row>
  );
}

// ─── Solo Mode ──────────────────────────────────────────

function SoloMission({
  mySteps,
  t,
}: {
  mySteps: number;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const goal = STEP_GOAL.DAILY_INDIVIDUAL;
  const progress = Math.min(mySteps / goal, 1);
  const percent = Math.min(Math.round(progress * 100), 100);
  const kcal = stepsToCalories(mySteps);

  return (
    <Box px="xxl" style={styles.section}>
      <PixelCard bg={theme.colors.primarySurface}>
        <Row style={styles.headerRow}>
          <Row style={styles.headerTitle}>
            <Icon name="target" size={16} color={theme.colors.secondary} />
            <Text variant="label" color="textSecondary" ml="xs">
              {t('unified-mission.solo-title')}
            </Text>
          </Row>
          <Text variant="caption" color="textMuted">
            {t('unified-mission.progress-percent', { percent })}
          </Text>
        </Row>

        <Row style={styles.heroRow}>
          <Text variant="displaySmall" color="primary">
            {formatSteps(mySteps)}
          </Text>
          <Text variant="bodySmall" color="textMuted" ml="xs">
            {t('unified-mission.goal-suffix', { goal: formatNumber(goal) })}
          </Text>
        </Row>

        <PixelProgressBar
          progress={progress}
          segments={16}
          fillColor={theme.colors.primary}
          style={styles.progressBar}
        />

        <Row style={styles.soloKcalRow}>
          <View style={styles.kcalChip}>
            <Icon name="fire" size={11} color={theme.colors.accent} />
            <Text variant="caption" color="textSecondary" ml="xxs">
              {t('unified-mission.kcal-unit', { value: kcal })}
            </Text>
          </View>
        </Row>
      </PixelCard>
    </Box>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  section: {
    marginTop: SPACING.md,
  },
  headerRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    alignItems: 'center',
  },
  heroRow: {
    alignItems: 'baseline',
    marginTop: 6,
  },
  progressBar: {
    marginTop: SPACING.sm,
  },

  /* ── divider & person rows (couple mode) ── */
  divider: {
    height: 1,
    backgroundColor: theme.colors.gray200,
    marginVertical: SPACING.md,
  },
  personRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  personGap: {
    height: SPACING.sm,
  },
  personLeft: {
    alignItems: 'center',
  },
  personRight: {
    alignItems: 'center',
  },
  personDot: {
    width: 6,
    height: 6,
    borderRadius: 1,
  },
  personSteps: {
    // variant label 기본 크기 유지
  },
  personDivider: {
    width: SPACING.sm,
  },

  /* ── claim button ── */
  claimBtn: {
    marginTop: LAYOUT.itemGap,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primary,
    ...theme.pixel.borderThin,
  },
  claimBtnDone: {
    backgroundColor: theme.colors.gray100,
  },

  /* ── solo mode ── */
  soloKcalRow: {
    marginTop: SPACING.sm,
    justifyContent: 'flex-end',
  },
  kcalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray100,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: 4,
  },
});
