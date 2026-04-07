import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Box, Icon, PixelCard, PixelProgressBar, Row, Text } from '@/components/base';
import { STEP_GOAL, stepsToCalories } from '@/constants/game-config';
import { theme } from '@/styles/theme';
import { LAYOUT } from '@/styles/type';
import { formatNumber, formatSteps } from '@/utils/date';

interface StepsSectionProps {
  isCoupleConnected: boolean;
  myName: string;
  partnerName: string;
  mySteps: number;
  partnerSteps: number;
}

/**
 * 오늘의 걸음 카드 — 커플(나/상대방) 또는 솔로 모드
 */
export function StepsSection({
  isCoupleConnected,
  myName,
  partnerName,
  mySteps,
  partnerSteps,
}: StepsSectionProps) {
  const { t } = useTranslation(['home', 'common']);

  if (isCoupleConnected) {
    return (
      <Box px="xxl" style={styles.section}>
        <Row style={styles.stepsRow}>
          <PersonStepCard name={myName} steps={mySteps} highlighted />
          <View style={styles.vsDivider}>
            <Icon name="heart" size={16} color={theme.colors.primaryDark} />
          </View>
          <PersonStepCard name={partnerName} steps={partnerSteps} />
        </Row>
      </Box>
    );
  }

  // ─── 솔로 모드 ───
  const myProgress = Math.min(mySteps / STEP_GOAL.DAILY_INDIVIDUAL, 1);

  return (
    <Box px="xxl" style={styles.section}>
      <PixelCard style={styles.soloStepCard} bg={theme.colors.primarySurface}>
        <Row style={styles.soloStepTop}>
          <View>
            <Text variant="caption" color="textSecondary">
              {t('home:steps.today')}
            </Text>
            <Row style={styles.soloStepNum}>
              <Text variant="displaySmall" color="primary">
                {formatSteps(mySteps)}
              </Text>
              <Text variant="caption" color="textMuted" ml="xs">
                {t('home:steps.goal-suffix', {
                  goal: formatNumber(STEP_GOAL.DAILY_INDIVIDUAL),
                })}
              </Text>
            </Row>
          </View>
          <View style={styles.miniStat}>
            <Icon name="fire" size={11} color={theme.colors.accent} />
            <Text variant="caption" color="textSecondary" ml="xxs">
              {stepsToCalories(mySteps)} {t('common:units.kcal')}
            </Text>
          </View>
        </Row>
        <PixelProgressBar
          progress={myProgress}
          segments={12}
          fillColor={theme.colors.primary}
          style={styles.soloProgress}
        />
      </PixelCard>
    </Box>
  );
}

// ─── 개인 걸음 카드 ─────────────────────────────────────

function PersonStepCard({
  name,
  steps,
  highlighted,
}: {
  name: string;
  steps: number;
  highlighted?: boolean;
}) {
  const { t } = useTranslation(['common']);
  return (
    <PixelCard
      style={styles.stepCard}
      bg={highlighted ? theme.colors.primarySurface : undefined}
    >
      <Text variant="caption" color="textSecondary">
        {name}
      </Text>
      <Text variant="displaySmall" color="primary" mt="xxs">
        {formatSteps(steps)}
      </Text>
      <Text variant="caption" color="textMuted">
        {t('common:units.steps')}
      </Text>
      <View style={styles.kcalChip}>
        <Icon name="fire" size={10} color={theme.colors.accent} />
        <Text variant="caption" color="textSecondary" style={styles.kcalText}>
          {stepsToCalories(steps)} {t('common:units.kcal')}
        </Text>
      </View>
    </PixelCard>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: LAYOUT.sectionGapSm,
  },
  stepsRow: {
    alignItems: 'center',
  },
  stepCard: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: LAYOUT.cardPx,
    paddingVertical: 12,
  },
  kcalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: theme.colors.gray100,
  },
  kcalText: {
    marginLeft: 3,
  },
  vsDivider: {
    width: 28,
    alignItems: 'center',
  },
  soloStepCard: {
    padding: LAYOUT.cardPx,
  },
  soloStepTop: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  soloStepNum: {
    alignItems: 'baseline',
    marginTop: 2,
  },
  soloProgress: {
    marginTop: LAYOUT.itemGap,
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray100,
    paddingHorizontal: LAYOUT.itemGap,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
