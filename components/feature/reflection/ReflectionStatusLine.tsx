import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, Row, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';

interface ReflectionStatusLineProps {
  myName: string;
  partnerName: string;
  myAnswered: number;
  partnerAnswered: number;
  total: number;
  isRevealed: boolean;
  hasPartner: boolean;
}

/**
 * 한 줄짜리 진행 상태 바.
 *
 * 이전 ProgressStatusCard가 화면을 너무 차지해서 라인 하나로 축약.
 *
 *   🔒 혁지니 1/3 · Kiki 작성 중       ← 진행 중
 *   💞 둘 다 완료! 서로의 답이 열렸어요   ← 공개됨
 */
export function ReflectionStatusLine({
  myName,
  partnerName,
  myAnswered,
  partnerAnswered,
  total,
  isRevealed,
  hasPartner,
}: ReflectionStatusLineProps) {
  const { t } = useTranslation('reflection');

  if (isRevealed) {
    return (
      <Row style={[styles.line, styles.lineRevealed]}>
        <Icon name="heart" size={12} color={theme.colors.primary} />
        <Text variant="caption" color="primary" ml="xs">
          {t('status-line.revealed')}
        </Text>
      </Row>
    );
  }

  const myComplete = total > 0 && myAnswered >= total;
  const partnerComplete = total > 0 && partnerAnswered >= total;

  return (
    <Row style={styles.line}>
      <Icon name="lock" size={11} color={theme.colors.gray500} />
      <Text variant="caption" color="textMuted" ml="xs">
        {myName}
      </Text>
      <Text variant="caption" ml="xxs" style={styles.count}>
        {myComplete ? '✓' : `${myAnswered}/${total}`}
      </Text>
      <View style={styles.dot} />
      <Text variant="caption" color="textMuted">
        {partnerName}
      </Text>
      <Text variant="caption" ml="xxs" style={styles.count}>
        {!hasPartner
          ? t('status-line.no-partner')
          : partnerComplete
            ? t('status-line.partner-ready-short')
            : t('status-line.partner-writing-short')}
      </Text>
    </Row>
  );
}

const styles = StyleSheet.create({
  line: {
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.gray100,
    alignSelf: 'flex-start',
  },
  lineRevealed: {
    backgroundColor: theme.colors.primarySurface,
  },
  count: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.colors.gray300,
    marginHorizontal: SPACING.xs,
  },
});
