import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, Row, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { LAYOUT, SPACING } from '@/styles/type';
import type { MonthlyReflection } from '@/types/reflection';
import { formatDate } from '@/utils/date';

interface PastReflectionItemProps {
  reflection: MonthlyReflection;
  onPress: () => void;
  isLast?: boolean;
}

/**
 * 지난 회고 한 줄 카드.
 * - 월 표시 (현재 로케일)
 * - 공개/대기 뱃지
 * - chevron-right
 */
export function PastReflectionItem({
  reflection,
  onPress,
  isLast,
}: PastReflectionItemProps) {
  const { t } = useTranslation('reflection');
  const monthLabel = formatDate(
    new Date(reflection.year, reflection.month - 1, 1),
    { year: 'numeric', month: 'long' },
  );

  return (
    <Pressable
      style={[styles.item, !isLast && styles.itemBorder]}
      onPress={onPress}
    >
      <Row style={styles.row}>
        <Text variant="bodyMedium" color="text">
          {monthLabel}
        </Text>
        <Row style={styles.right}>
          <Row
            style={[
              styles.badge,
              reflection.isRevealed ? styles.badgeRevealed : styles.badgePending,
            ]}
          >
            <Icon
              name={reflection.isRevealed ? 'unlock' : 'lock'}
              size={10}
              color={
                reflection.isRevealed
                  ? theme.colors.primary
                  : theme.colors.gray500
              }
            />
            <Text
              variant="caption"
              color={reflection.isRevealed ? 'primary' : 'textMuted'}
              ml="xxs"
            >
              {reflection.isRevealed
                ? t('reveal-status-revealed')
                : t('reveal-status-pending')}
            </Text>
          </Row>
          <Icon
            name="chevron-right"
            size={14}
            color={theme.colors.gray400}
          />
        </Row>
      </Row>
    </Pressable>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  item: {
    paddingVertical: LAYOUT.cardPy,
    paddingHorizontal: LAYOUT.cardPx,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray100,
  },
  row: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  right: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  badge: {
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: theme.radius.sm,
  },
  badgeRevealed: {
    backgroundColor: theme.colors.primarySurface,
  },
  badgePending: {
    backgroundColor: theme.colors.gray100,
  },
});
