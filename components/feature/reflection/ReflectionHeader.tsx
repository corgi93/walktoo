import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, Row, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { LAYOUT } from '@/styles/type';
import { formatDate } from '@/utils/date';

interface ReflectionHeaderProps {
  /** 1-based month (1~12) */
  year?: number;
  month?: number;
  isPastDetail?: boolean;
  onBack: () => void;
}

/**
 * 회고 화면 헤더.
 * - 뒤로가기 + 타이틀 + 월 표시
 * - past detail 모드면 "지난 회고" 라벨
 */
export function ReflectionHeader({
  year,
  month,
  isPastDetail,
  onBack,
}: ReflectionHeaderProps) {
  const { t } = useTranslation('reflection');

  const monthLabel =
    year && month
      ? formatDate(new Date(year, month - 1, 1), {
          year: 'numeric',
          month: 'long',
        })
      : null;

  return (
    <Row px="xxl" style={styles.header}>
      <Pressable onPress={onBack} hitSlop={8}>
        <Icon name="arrow-left" size={22} color={theme.colors.text} />
      </Pressable>
      <View style={styles.titleWrap}>
        <Text variant="headingMedium" align="center">
          {isPastDetail ? t('past-detail-title') : t('title')}
        </Text>
        {monthLabel && (
          <Text variant="caption" color="textMuted" align="center" mt="xxs">
            {monthLabel}
          </Text>
        )}
      </View>
      <View style={{ width: 22 }} />
    </Row>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: LAYOUT.headerPy,
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
  },
});
