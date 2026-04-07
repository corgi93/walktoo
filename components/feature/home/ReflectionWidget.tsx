import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Box, Icon, PixelCard, Row, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { LAYOUT, SPACING } from '@/styles/type';
import type { ReflectionWithAnswers } from '@/types/reflection';
import { formatDate } from '@/utils/date';

interface ReflectionWidgetProps {
  /** 이달의 reflection (없으면 자동 생성된다는 가정) */
  detail: ReflectionWithAnswers | null | undefined;
  isLoading?: boolean;
  /** 월말 강조 (디바이스 오늘 날짜의 일자) — 25일 이후면 더 강조 */
  todayDayOfMonth: number;
  /** 이달 (year, month 1-based) — 라벨 표시용 */
  year: number;
  month: number;
}

const REFLECTION_QUESTION_COUNT = 3;

/**
 * 홈 화면 — "이달의 우리" 회고 카드.
 *
 * 상태별 표시:
 * - 답변 0/3 → "이달의 회고를 시작해보세요" + 버튼
 * - 진행 중 (1~2/3) → "내 답변 N/3" 진행도 + "이어 쓰기"
 * - 내 답변 완료 + 미공개 → "연인의 답변을 기다리는 중" 잠금 톤
 * - 공개됨 → "💞 함께 공개됨" + "보러 가기"
 *
 * 25일 이후이면서 답변 미완료라면 살짝 강조 (월말 알림 톤).
 */
export function ReflectionWidget({
  detail,
  isLoading,
  todayDayOfMonth,
  year,
  month,
}: ReflectionWidgetProps) {
  const { t } = useTranslation('home');
  const router = useRouter();

  if (isLoading || !detail) {
    return (
      <Box px="xxl" style={styles.section}>
        <PixelCard style={styles.card} bg={theme.colors.surfaceWarm}>
          <Text variant="label" color="textMuted">
            {t('reflection-widget.title')}
          </Text>
          <Text variant="bodySmall" color="textMuted" mt="xs">
            {t('reflection-widget.loading')}
          </Text>
        </PixelCard>
      </Box>
    );
  }

  const myAnsweredCount = detail.myAnswers.filter(
    (a) => a.answer.trim().length > 0,
  ).length;
  const isMyComplete = myAnsweredCount === REFLECTION_QUESTION_COUNT;
  const isRevealed = detail.reflection.isRevealed;
  const isMonthEnd = todayDayOfMonth >= 25;

  // 상태 결정
  type State = 'empty' | 'in-progress' | 'waiting-partner' | 'revealed';
  const state: State = isRevealed
    ? 'revealed'
    : isMyComplete
      ? 'waiting-partner'
      : myAnsweredCount > 0
        ? 'in-progress'
        : 'empty';

  // 상태별 톤
  const accent = isRevealed
    ? theme.colors.primary
    : isMonthEnd && state !== 'revealed'
      ? theme.colors.primary
      : theme.colors.secondary;

  // 상태별 텍스트 키
  const stateLabel = (() => {
    switch (state) {
      case 'empty':
        return t('reflection-widget.state-empty');
      case 'in-progress':
        return t('reflection-widget.state-in-progress', {
          done: myAnsweredCount,
          total: REFLECTION_QUESTION_COUNT,
        });
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
      case 'in-progress':
        return t('reflection-widget.cta-continue');
      case 'waiting-partner':
        return t('reflection-widget.cta-view');
      case 'revealed':
        return t('reflection-widget.cta-view');
    }
  })();

  // 진행도 점 (3개)
  const dots = Array.from({ length: REFLECTION_QUESTION_COUNT }, (_, i) => i);

  const monthLabel = formatDate(new Date(year, month - 1, 1), {
    year: 'numeric',
    month: 'long',
  });

  return (
    <Box px="xxl" style={styles.section}>
      <Pressable onPress={() => router.push('/reflection')}>
        <PixelCard
          style={
            isMonthEnd && state !== 'revealed'
              ? { ...styles.card, ...styles.cardHighlighted }
              : styles.card
          }
          bg={
            isRevealed
              ? theme.colors.primarySurface
              : isMonthEnd
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

          {/* 진행도 점 + CTA */}
          <Row style={styles.bottomRow}>
            <Row style={styles.dots}>
              {dots.map((i) => {
                const filled = isRevealed || i < myAnsweredCount;
                return (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      filled && {
                        backgroundColor: accent,
                        borderColor: accent,
                      },
                    ]}
                  />
                );
              })}
            </Row>
            <Row>
              <Text variant="caption" color={isRevealed ? 'primary' : 'textSecondary'}>
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
  dots: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: theme.colors.gray300,
    backgroundColor: 'transparent',
  },
});
