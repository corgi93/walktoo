import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Box, Icon, PixelCard, Row, Text } from '@/components/base';
import {
  getQuestionById,
  type ReflectionCategory,
} from '@/constants/reflectionQuestions';
import { useReflectionListQuery } from '@/hooks/services/reflections/query';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import { theme } from '@/styles/theme';
import { LAYOUT, SPACING } from '@/styles/type';
import type { MonthlyReflection } from '@/types/reflection';
import { formatDate } from '@/utils/date';

// ─── Category Colors ───────────────────────────────────

const CATEGORY_COLOR: Record<ReflectionCategory, string> = {
  keep: theme.colors.primary,
  wished: theme.colors.gray600,
  will: theme.colors.secondary,
};

// ─── Screen ────────────────────────────────────────────

export default function ReflectionTimelineScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation('reflection');
  const { couple } = usePartnerDerivation();

  const { data: allReflections = [] } = useReflectionListQuery(couple?.id);

  // 연도별로 그룹핑 (최신 연도 먼저, 월은 역순)
  const groupedByYear = useMemo(() => {
    const map = new Map<number, MonthlyReflection[]>();
    for (const r of allReflections) {
      if (!map.has(r.year)) map.set(r.year, []);
      map.get(r.year)!.push(r);
    }
    // 각 연도 내에서 월 역순
    for (const list of map.values()) {
      list.sort((a, b) => b.month - a.month);
    }
    // 연도 역순으로 정렬
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
  }, [allReflections]);

  const handleMonthPress = (reflection: MonthlyReflection) => {
    router.push({
      pathname: '/reflection',
      params: { id: reflection.id },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <Row px="xxl" style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Icon name="arrow-left" size={22} color={theme.colors.text} />
        </Pressable>
        <View style={styles.titleWrap}>
          <Text variant="headingMedium" align="center">
            {t('timeline.title')}
          </Text>
        </View>
        <View style={{ width: 22 }} />
      </Row>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + LAYOUT.bottomSafe },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {groupedByYear.length === 0 ? (
          <Box px="xxl" style={styles.emptyWrap}>
            <Icon name="book-open" size={40} color={theme.colors.gray300} />
            <Text
              variant="bodySmall"
              color="textMuted"
              align="center"
              mt="md"
            >
              {t('timeline.empty')}
            </Text>
          </Box>
        ) : (
          groupedByYear.map(([year, reflections]) => (
            <View key={year} style={styles.yearSection}>
              {/* 연도 헤더 */}
              <Row px="xxl" style={styles.yearHeader}>
                <View style={styles.yearDot} />
                <Text variant="headingSmall" color="primary">
                  {year}
                </Text>
                <Text variant="caption" color="textMuted" ml="sm">
                  {t('timeline.year-count', { count: reflections.length })}
                </Text>
              </Row>

              {/* 월별 카드 */}
              <Box px="xxl">
                <View style={styles.monthList}>
                  {reflections.map((r, idx) => (
                    <MonthCard
                      key={r.id}
                      reflection={r}
                      onPress={() => handleMonthPress(r)}
                      isLast={idx === reflections.length - 1}
                    />
                  ))}
                </View>
              </Box>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ─── MonthCard ─────────────────────────────────────────

function MonthCard({
  reflection,
  onPress,
  isLast,
}: {
  reflection: MonthlyReflection;
  onPress: () => void;
  isLast: boolean;
}) {
  const { t } = useTranslation('reflection');

  const monthLabel = formatDate(
    new Date(reflection.year, reflection.month - 1, 1),
    { month: 'long' },
  );

  const questions = reflection.questionIds
    .map((id) => getQuestionById(id))
    .filter((q): q is NonNullable<ReturnType<typeof getQuestionById>> => !!q);

  return (
    <View style={styles.monthCardRow}>
      {/* 타임라인 라인 */}
      <View style={styles.timelineTrack}>
        <View
          style={[
            styles.timelineDot,
            {
              backgroundColor: reflection.isRevealed
                ? theme.colors.primary
                : theme.colors.gray300,
            },
          ]}
        />
        {!isLast && <View style={styles.timelineLine} />}
      </View>

      {/* 카드 본체 */}
      <Pressable style={styles.cardPressable} onPress={onPress}>
        <PixelCard
          style={styles.monthCard}
          bg={
            reflection.isRevealed
              ? theme.colors.surface
              : theme.colors.gray50
          }
        >
          <Row style={styles.monthCardHeader}>
            <Text variant="headingSmall">{monthLabel}</Text>
            {reflection.isRevealed ? (
              <Row style={styles.revealedBadge}>
                <Icon name="unlock" size={10} color={theme.colors.primary} />
                <Text variant="caption" color="primary" ml="xxs">
                  {t('reveal-status-revealed')}
                </Text>
              </Row>
            ) : (
              <Row style={styles.pendingBadge}>
                <Icon name="lock" size={10} color={theme.colors.gray500} />
                <Text variant="caption" color="textMuted" ml="xxs">
                  {t('reveal-status-pending')}
                </Text>
              </Row>
            )}
          </Row>

          {/* 질문 미리보기 */}
          <View style={styles.questionPreview}>
            {questions.map((q) => {
              const color = CATEGORY_COLOR[q.category];
              return (
                <Row key={q.id} style={styles.previewRow}>
                  <Text style={styles.previewEmoji}>{q.emoji}</Text>
                  <Text
                    variant="caption"
                    style={{ color, fontWeight: '600' }}
                    ml="xxs"
                  >
                    {t(`category.${q.category}.label`)}
                  </Text>
                  <Text
                    variant="caption"
                    color="textMuted"
                    ml="xs"
                    numberOfLines={1}
                    style={styles.previewQuestion}
                  >
                    {q.question}
                  </Text>
                </Row>
              );
            })}
          </View>

          {/* 탭 힌트 */}
          <Row style={styles.tapHint}>
            <Text variant="caption" color="textMuted">
              {reflection.isRevealed
                ? t('timeline.tap-to-read')
                : t('timeline.tap-to-view')}
            </Text>
            <Icon
              name="chevron-right"
              size={12}
              color={theme.colors.gray400}
            />
          </Row>
        </PixelCard>
      </Pressable>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: LAYOUT.headerPy,
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  scroll: {
    flexGrow: 1,
  },

  // 연도 섹션
  yearSection: {
    marginTop: SPACING.lg,
  },
  yearHeader: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  yearDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginRight: SPACING.sm,
  },

  // 월별 리스트
  monthList: {},

  // 타임라인 트랙 + 카드
  monthCardRow: {
    flexDirection: 'row',
  },
  timelineTrack: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: SPACING.lg,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: theme.colors.gray200,
    marginTop: 2,
  },

  // 카드
  cardPressable: {
    flex: 1,
    marginBottom: SPACING.md,
  },
  monthCard: {
    padding: LAYOUT.cardPx,
  },
  monthCardHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revealedBadge: {
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primarySurface,
  },
  pendingBadge: {
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.gray100,
  },

  // 질문 미리보기
  questionPreview: {
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  previewRow: {
    alignItems: 'center',
  },
  previewEmoji: {
    fontSize: 12,
  },
  previewQuestion: {
    flex: 1,
  },

  // 탭 힌트
  tapHint: {
    marginTop: SPACING.md,
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 2,
  },

  // 빈 상태
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
  },
});
