import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Box, Icon, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { LAYOUT } from '@/styles/type';
import { formatDday } from '@/utils/date';

interface DdaySectionProps {
  myName: string;
  partnerName: string;
  firstMetDate?: string;
  onPress: () => void;
}

/**
 * 홈 D+Day 라인 — 처음 만난 날부터 D+N
 */
export function DdaySection({
  myName,
  partnerName,
  firstMetDate,
  onPress,
}: DdaySectionProps) {
  const { t } = useTranslation('home');

  return (
    <Box px="xxl" style={styles.section}>
      <Pressable onPress={onPress}>
        <Text variant="bodySmall" color="textMuted" style={styles.row}>
          {firstMetDate ? (
            <>
              <Text variant="bodySmall" color="primary">
                {myName}
              </Text>
              <Text variant="bodySmall" color="textMuted">
                {' '}
              </Text>
              <Icon name="heart" size={11} color={theme.colors.primaryDark} />
              <Text variant="bodySmall" color="textMuted">
                {' '}
              </Text>
              <Text variant="bodySmall" color="primary">
                {partnerName}
              </Text>
              <Text variant="bodySmall" color="textMuted"> {t('dday.met-text')} </Text>
              <Text variant="bodySmall" color="primary">
                {formatDday(firstMetDate)}
              </Text>
            </>
          ) : (
            t('dday.set-prompt')
          )}
        </Text>
      </Pressable>
    </Box>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: LAYOUT.sectionGapSm,
  },
  row: {
    textAlign: 'left',
  },
});
