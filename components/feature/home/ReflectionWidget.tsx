import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Box, Icon, PixelCard, Row, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { LAYOUT, SPACING } from '@/styles/type';
import type { MonthlyReflection, ReflectionWithAnswers } from '@/types/reflection';
import { formatDate } from '@/utils/date';

interface ReflectionWidgetProps {
  /** 이달의 reflection 메타 (year, month, isRevealed). 없으면 fallback */
  reflection: MonthlyReflection | null | undefined;
  /** 답변 detail. 없어도 OK (그러면 myAnsweredCount = 0) */
  detail?: ReflectionWithAnswers | null;
  /** 진짜 첫 fetch 중일 때만 true */
  isLoading?: boolean;
  /** 월말 강조 — 25일 이후면 더 강조 */
  todayDayOfMonth: number;
  /** 라벨 표시용 (현재 달) */
  fallbackYear: number;
  fallbackMonth: number;
}

const REFLECTION_QUESTION_COUNT = 3;

/**
 * 홈 화면 — "이달의 우리" 회고 카드.
 *
 * 항상 클릭 가능 (어떤 상태든 탭하면 /reflection으로 이동).
 *
 * 상태별 표시:
 * - loading           → "준비하는 중" placeholder (탭 시 진입)
 * - empty (0/3)       → "이달의 회고를 시작해보세요" + 쓰러 가기
 * - in-progress (n/3) → "내 답변 N/3" + 이어 쓰기
 * - waiting-partner   → "연인의 답변을 기다리는 중" + 보러 가기
 * - revealed          → "💞 이달의 회고가 공개되었어요" + 보러 가기
 *
 * 25일 이후이고 미공개면 살짝 강조 (월말 알림 톤).
 */
export function ReflectionWidget({
  reflection,
  detail,
  isLoading,
  todayDayOfMonth,
  fallbackYear,
  fallbackMonth,
}: ReflectionWidgetProps) {
  const { t } = useTranslation('home');
  const router = useRouter();

  const handlePress = () => router.push('/reflection');

  // ─── Loading placeholder (단, 항상 클릭 가능) ──────────
  if (isLoading) {
    return (
      <Box px="xxl" style={styles.section}>
        <Pressable onPress={handlePress}>
          <PixelCard style={styles.card} bg={theme.colors.surfaceWarm}>
            <Row style={styles.header}>
              <Row style={styles.titleRow}>
                <Icon name="book-open" size={16} color={theme.colors.gray400} />
                <Text variant="label" color="textMuted" ml="xs">
                  {t('reflection-widget.title')}
                </Text>
              </Row>
            </Row>
            <Text variant="bodySmall" color="textMuted" mt="sm">
              {t('reflection-widget.loading')}
            </Text>
          </PixelCard>
        </Pressable>
      </Box>
    );
  }

  // ─── 실제 상태 계산 (detail이 없어도 안전) ─────────────
  const year = reflection?.year ?? fallbackYear;
  const month = reflection?.month ?? fallbackMonth;
  const isRevealed = reflection?.isRevealed ?? false;

  const myAnsweredCount = detail
    ? detail.myAnswers.filter((a) => a.answer.trim().length > 0).length
    : 0;
  const isMyComplete = myAnsweredCount === REFLECTION_QUESTION_COUNT;
  const isMonthEnd = todayDayOfMonth >= 25;

  type State = 'empty' | 'waiting-partner' | 'revealed';
  const state: State = isRevealed
    ? 'revealed'
    : isMyComplete
      ? 'waiting-partner'
      : 'empty';

  // 상태별 톤
  const accent =
    isRevealed || (isMonthEnd && state !== 'revealed')
      ? theme.colors.primary
      : theme.colors.secondary;

  const stateLabel = (() => {
    switch (state) {
      case 'empty':
        return t('reflection-widget.state-empty');
      case 'waiting-partner':
        return t('reflection-widget.state-waiting');
      case 'revealed':
        return t('reflection-widget.state-revealed');
    }
  })();

  const ctaLabel = (() => {
    switch (state) {
      case 'empty':
        return t('reflection-widget.cta-start');
      case 'waiting-partner':
        return t('reflection-widget.cta-edit', { month });
      case 'revealed':
        return t('reflection-widget.cta-view');
    }
  })();

  const monthLabel = formatDate(new Date(year, month - 1, 1), {
    year: 'numeric',
    month: 'long',
  });

  return (
    <Box px="xxl" style={styles.section}>
      <Pressable onPress={handlePress}>
        <PixelCard
          style={
            isMonthEnd && state !== 'revealed'
              ? { ...styles.card, ...styles.cardHighlighted }
              : styles.card
          }
          bg={
            isRevealed || isMonthEnd
              ? theme.colors.primarySurface
              : theme.colors.surfaceWarm
          }
        >
          {/* 헤더: 타이틀 + 월 */}
          <Row style={styles.header}>
            <Row style={styles.titleRow}>
              <Icon name="book-open" size={16} color={accent} />
              <Text variant="label" color="textSecondary" ml="xs">
                {t('reflection-widget.title')}
              </Text>
            </Row>
            <Text variant="caption" color="textMuted">
              {monthLabel}
            </Text>
          </Row>

          {/* 상태 */}
          <Text
            variant="bodyMedium"
            color={isRevealed ? 'primary' : 'text'}
            mt="sm"
          >
            {stateLabel}
          </Text>

          {/* CTA */}
          <Row style={styles.bottomRow}>
            <View />
            <Row>
              <Text
                variant="caption"
                color={isRevealed ? 'primary' : 'textSecondary'}
              >
                {ctaLabel}
              </Text>
              <Icon
                name="chevron-right"
                size={14}
                color={isRevealed ? theme.colors.primary : theme.colors.gray500}
              />
            </Row>
          </Row>
        </PixelCard>
      </Pressable>
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
  cardHighlighted: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    alignItems: 'center',
  },
  bottomRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
});
