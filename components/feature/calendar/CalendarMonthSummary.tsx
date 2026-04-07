import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Box, Button, Icon, PixelCard, Row, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { LAYOUT, SPACING } from '@/styles/type';
import type { MonthlyReflection } from '@/types/reflection';

interface CalendarMonthSummaryProps {
  walksCount: number;
  stampsCount: number;
  reflection: MonthlyReflection | null;
  /** 보고 있는 달이 현재 달인지 */
  isCurrentMonth: boolean;
  onPressReflection: () => void;
}

/**
 * 그리드 아래 월 요약 카드.
 *
 * - 통계 한 줄: 산책 N번 · 발자국 M개 · 회고 상태
 * - CTA:
 *   - 현재 달 → "이달의 회고 쓰기" (없을 때) 또는 "이어 쓰기" (작성 중)
 *   - 과거 달 + 회고 공개 → "이 달 회고 보기"
 *   - 과거 달 + 회고 없음 → CTA 없음
 */
export function CalendarMonthSummary({
  walksCount,
  stampsCount,
  reflection,
  isCurrentMonth,
  onPressReflection,
}: CalendarMonthSummaryProps) {
  const { t } = useTranslation('calendar');

  const reflectionStatusLabel = !reflection
    ? t('summary.reflection-empty')
    : reflection.isRevealed
      ? t('summary.reflection-revealed')
      : t('summary.reflection-pending');

  // CTA 분기
  const showCta =
    isCurrentMonth || (reflection !== null && reflection.isRevealed);
  const ctaLabel = isCurrentMonth
    ? reflection
      ? t('cta.continue-reflection')
      : t('cta.write-reflection')
    : t('cta.view-reflection');

  return (
    <Box px="xxl" style={styles.section}>
      <PixelCard style={styles.card}>
        <Text variant="label" color="textMuted" mb="sm">
          {t('summary.title')}
        </Text>

        <Row style={styles.statsRow}>
          <SummaryStat
            emoji="🐾"
            label={t('summary.walks', { count: walksCount })}
          />
          <View style={styles.divider} />
          <SummaryStat
            emoji="⭐"
            label={t('summary.stamps', { count: stampsCount })}
          />
          <View style={styles.divider} />
          <SummaryStat
            emoji="💞"
            label={reflectionStatusLabel}
            highlight={reflection?.isRevealed}
          />
        </Row>

        {showCta && (
          <View style={styles.ctaWrap}>
            <Button variant="primary" size="medium" onPress={onPressReflection}>
              {ctaLabel}
            </Button>
          </View>
        )}
      </PixelCard>
    </Box>
  );
}

// ─── Sub: 요약 stat ────────────────────────────────────

function SummaryStat({
  emoji,
  label,
  highlight,
}: {
  emoji: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text
        variant="caption"
        color={highlight ? 'primary' : 'textSecondary'}
        align="center"
        mt="xxs"
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: LAYOUT.sectionGap,
  },
  card: {
    padding: LAYOUT.cardPx,
  },
  statsRow: {
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 18,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: theme.colors.gray200,
    marginHorizontal: SPACING.xs,
  },
  ctaWrap: {
    marginTop: SPACING.lg,
  },
});
