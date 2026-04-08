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

interface DualStepsMissionCardProps {
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
 * 홈 히어로 카드 — 걸음/미션 통합 (split 카드 + inline progress strip)
 *
 * Couple 모드 레이아웃:
 *   ┌──────────────────────────────┐
 *   │ ┌──────┐  💗  ┌──────┐       │  ← split step mini cards
 *   │ │ 혁지니│     │ Kiki │        │     (작지만 임팩트 있게)
 *   │ │ 3,610│     │  0   │        │
 *   │ │144kcal│    │0 kcal│        │
 *   │ └──────┘     └──────┘        │
 *   │ ─────────────────────        │
 *   │ 🎯 오늘의 미션     18%       │  ← inline strip
 *   │ ██████░░░░░░ 3,610/20k       │
 *   │ [🐾 발자국 받기 (+30)]        │  ← 완료 시만
 *   └──────────────────────────────┘
 *
 * Solo 모드: split 카드 없음, 단일 유저 히어로 + 진행바.
 */
export function DualStepsMissionCard({
  isCoupleConnected,
  myName,
  partnerName,
  mySteps,
  partnerSteps,
  hasTodayStamp,
  isClaiming,
  onClaim,
}: DualStepsMissionCardProps) {
  const { t } = useTranslation('home');

  if (!isCoupleConnected) {
    return <SoloMission mySteps={mySteps} t={t} />;
  }

  const goal = STEP_GOAL.DAILY_COUPLE_MISSION;
  const total = mySteps + partnerSteps;
  const progress = Math.min(total / goal, 1);
  const percent = Math.min(Math.round(progress * 100), 100);
  const isCompleted = total >= goal;

  return (
    <Box px="xxl" style={styles.section}>
      <PixelCard bg={theme.colors.primarySurface}>
        {/* ── Split step cards ── */}
        <Row style={styles.splitRow}>
          <PersonMiniCard name={myName} steps={mySteps} highlighted />
          <View style={styles.heartDivider}>
            <Icon name="heart" size={14} color={theme.colors.primaryDark} />
          </View>
          <PersonMiniCard name={partnerName} steps={partnerSteps} />
        </Row>

        {/* ── Mission strip ── */}
        <View style={styles.missionDivider} />

        <Row style={styles.missionHeader}>
          <Row style={styles.missionHeaderLeft}>
            <Icon name="target" size={14} color={theme.colors.secondary} />
            <Text variant="caption" color="textSecondary" ml="xxs">
              {t('unified-mission.title')}
            </Text>
          </Row>
          <Text variant="caption" color="textMuted">
            {t('unified-mission.progress-percent', { percent })}
          </Text>
        </Row>

        <PixelProgressBar
          progress={progress}
          segments={16}
          fillColor={theme.colors.primary}
          style={styles.progressBar}
        />

        <Row style={styles.missionFooter}>
          <Text variant="bodySmall" color="primary">
            {formatSteps(total)}
          </Text>
          <Text variant="caption" color="textMuted" ml="xxs">
            {t('unified-mission.goal-suffix', { goal: formatNumber(goal) })}
          </Text>
        </Row>

        {/* ── Claim button (완료 시만) ── */}
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

// ─── PersonMiniCard ─────────────────────────────────────
// 기존 StepsSection의 PersonStepCard 패턴이지만 더 컴팩트.

function PersonMiniCard({
  name,
  steps,
  highlighted,
}: {
  name: string;
  steps: number;
  highlighted?: boolean;
}) {
  const kcal = stepsToCalories(steps);
  return (
    <View
      style={[
        styles.personCard,
        { backgroundColor: highlighted ? theme.colors.surface : theme.colors.surfaceWarm },
      ]}
    >
      <Text variant="caption" color="textSecondary" numberOfLines={1}>
        {name}
      </Text>
      <Text variant="headingLarge" color="primary" style={styles.personSteps}>
        {formatSteps(steps)}
      </Text>
      <Text variant="caption" color="textMuted">
        걸음
      </Text>
      <Row style={styles.kcalChip}>
        <Icon name="fire" size={9} color={theme.colors.accent} />
        <Text variant="caption" color="textSecondary" style={styles.kcalText}>
          {kcal} kcal
        </Text>
      </Row>
    </View>
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
        <Row style={styles.soloHeader}>
          <Text variant="caption" color="textSecondary">
            {t('unified-mission.solo-title')}
          </Text>
          <Text variant="caption" color="textMuted">
            {t('unified-mission.progress-percent', { percent })}
          </Text>
        </Row>
        <Row style={styles.soloHeroRow}>
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
              {kcal} kcal
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

  /* ── Split step cards ── */
  splitRow: {
    alignItems: 'center',
  },
  personCard: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.primaryLight,
  },
  personSteps: {
    marginTop: 2,
  },
  heartDivider: {
    width: 24,
    alignItems: 'center',
  },
  kcalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: theme.colors.gray100,
  },
  kcalText: {
    marginLeft: 2,
  },

  /* ── Mission strip ── */
  missionDivider: {
    height: 1,
    backgroundColor: theme.colors.gray200,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  missionHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  missionHeaderLeft: {
    alignItems: 'center',
  },
  progressBar: {
    marginTop: 6,
  },
  missionFooter: {
    alignItems: 'baseline',
    marginTop: 4,
  },

  /* ── Claim button ── */
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

  /* ── Solo ── */
  soloHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  soloHeroRow: {
    alignItems: 'baseline',
    marginTop: 4,
  },
  soloKcalRow: {
    marginTop: SPACING.sm,
    justifyContent: 'flex-end',
  },
});
