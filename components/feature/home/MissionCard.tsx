import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Box, Icon, PixelCard, Row, Text } from '@/components/base';
import { STAMP, STEP_GOAL } from '@/constants/game-config';
import { theme } from '@/styles/theme';
import { LAYOUT } from '@/styles/type';
import { formatSteps } from '@/utils/date';

interface MissionCardProps {
  totalSteps: number;
  isMissionCompleted: boolean;
  hasTodayStamp: boolean;
  isClaiming: boolean;
  onClaim: () => void;
}

/**
 * 오늘의 미션 카드 — 커플 합산 걸음 + 발자국 받기 버튼
 */
export function MissionCard({
  totalSteps,
  isMissionCompleted,
  hasTodayStamp,
  isClaiming,
  onClaim,
}: MissionCardProps) {
  const { t } = useTranslation('home');
  const goal = STEP_GOAL.DAILY_COUPLE_MISSION;
  const percent = Math.min(Math.round((totalSteps / goal) * 100), 100);

  return (
    <Box px="xxl" style={styles.section}>
      <PixelCard style={styles.card}>
        <Row style={styles.row}>
          <Row style={styles.title}>
            <Icon name="target" size={18} color={theme.colors.secondary} />
            <Text variant="label" color="textSecondary" ml="xs">
              {t('mission.title')}
            </Text>
          </Row>
          <Text variant="caption" color="textMuted">
            {t('mission.progress-percent', { percent })}
          </Text>
        </Row>
        <Row style={styles.numberRow}>
          <Text variant="headingLarge" color="primary">
            {formatSteps(totalSteps)}
          </Text>
          <Text variant="bodySmall" color="textMuted" ml="xs">
            / {formatSteps(goal)}
          </Text>
        </Row>

        {isMissionCompleted && (
          <Pressable
            style={[
              styles.claimButton,
              hasTodayStamp && styles.claimButtonDone,
            ]}
            onPress={onClaim}
            disabled={hasTodayStamp || isClaiming}
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
                ? t('mission.claim-done')
                : t('mission.claim-button', { count: STAMP.DAILY_REWARD })}
            </Text>
          </Pressable>
        )}
      </PixelCard>
    </Box>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: LAYOUT.sectionGapSm,
  },
  card: {
    paddingHorizontal: LAYOUT.cardPx,
    paddingVertical: 14,
  },
  row: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    alignItems: 'center',
  },
  numberRow: {
    alignItems: 'baseline',
    marginTop: 4,
  },
  claimButton: {
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
  claimButtonDone: {
    backgroundColor: theme.colors.gray100,
  },
});
