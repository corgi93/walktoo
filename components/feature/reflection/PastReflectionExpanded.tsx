import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, PixelCard, Row, Text } from '@/components/base';
import {
  getQuestionById,
  type ReflectionCategory,
} from '@/constants/reflectionQuestions';
import { useReflectionDetailQuery } from '@/hooks/services/reflections/query';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';
import type { MonthlyReflection } from '@/types/reflection';
import { formatDate } from '@/utils/date';

interface PastReflectionExpandedProps {
  reflection: MonthlyReflection;
  myUserId: string | undefined;
  myName: string;
  partnerName: string;
}

const CATEGORY_COLOR: Record<ReflectionCategory, string> = {
  keep: theme.colors.primary,
  wished: theme.colors.gray600,
  will: theme.colors.secondary,
};

/**
 * 과거 회고 한 달을 "펼쳐서" 그대로 보여주는 카드.
 *
 * 기존 PastReflectionItem + DetailMode 흐름은 "한 번 더 클릭"이 있어
 * 유저가 여러 달 연속으로 훑기 불편했는데, 이걸 inline으로 풀어
 * 리스트에서 스크롤만으로 모든 과거 회고를 읽을 수 있게 한다.
 *
 * 프라이버시: 해당 달이 공개(is_revealed)된 경우에만 상대방 답변 노출.
 * 대기 상태면 "아직 공개 전"이라는 안내만 뜬다.
 */
export function PastReflectionExpanded({
  reflection,
  myUserId,
  myName,
  partnerName,
}: PastReflectionExpandedProps) {
  const { t } = useTranslation('reflection');
  const { data: detail, isLoading } = useReflectionDetailQuery(
    reflection.id,
    myUserId,
  );

  const monthLabel = formatDate(
    new Date(reflection.year, reflection.month - 1, 1),
    { year: 'numeric', month: 'long' },
  );

  const myAnswerMap: Record<number, string> = {};
  detail?.myAnswers.forEach((a) => (myAnswerMap[a.questionId] = a.answer));
  const partnerAnswerMap: Record<number, string> = {};
  detail?.partnerAnswers.forEach(
    (a) => (partnerAnswerMap[a.questionId] = a.answer),
  );

  const questions = (detail?.reflection.questionIds ?? reflection.questionIds)
    .map((id) => getQuestionById(id))
    .filter((q): q is NonNullable<ReturnType<typeof getQuestionById>> => !!q);

  return (
    <PixelCard style={styles.card} bg={theme.colors.surface}>
      <Row style={styles.header}>
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

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : questions.length === 0 ? (
        <Text variant="bodySmall" color="textMuted" mt="sm">
          {t('recap.empty')}
        </Text>
      ) : (
        <View style={styles.list}>
          {questions.map((q, idx) => {
            const myAnswer = myAnswerMap[q.id] ?? '';
            const partnerAnswer = partnerAnswerMap[q.id] ?? '';
            const color = CATEGORY_COLOR[q.category];
            const canSeePartner = reflection.isRevealed && !!partnerAnswer;

            return (
              <View
                key={q.id}
                style={[
                  styles.questionBlock,
                  idx < questions.length - 1 && styles.blockBorder,
                ]}
              >
                {/* 카테고리 · 질문 */}
                <Row style={styles.questionMeta}>
                  <Text style={styles.questionEmoji}>{q.emoji}</Text>
                  <Text
                    variant="caption"
                    style={{ color, fontWeight: '600' }}
                    ml="xxs"
                  >
                    {t(`category.${q.category}.label`)}
                  </Text>
                </Row>
                <Text variant="bodySmall" color="text" mt="xxs">
                  {q.question}
                </Text>

                {/* 내 답변 */}
                <View style={styles.answerRow}>
                  <Text
                    variant="caption"
                    color="textMuted"
                    style={styles.nameLabel}
                  >
                    {myName}
                  </Text>
                  {myAnswer ? (
                    <Text
                      variant="bodySmall"
                      color="text"
                      style={styles.answerText}
                    >
                      {myAnswer}
                    </Text>
                  ) : (
                    <Text
                      variant="bodySmall"
                      color="textMuted"
                      style={[styles.answerText, { fontStyle: 'italic' }]}
                    >
                      {t('answer-not-written')}
                    </Text>
                  )}
                </View>

                {/* 상대방 답변 */}
                <View style={styles.answerRow}>
                  <Text
                    variant="caption"
                    color="textMuted"
                    style={styles.nameLabel}
                  >
                    {partnerName}
                  </Text>
                  {canSeePartner ? (
                    <Text
                      variant="bodySmall"
                      color="text"
                      style={styles.answerText}
                    >
                      {partnerAnswer}
                    </Text>
                  ) : (
                    <Text
                      variant="bodySmall"
                      color="textMuted"
                      style={[styles.answerText, { fontStyle: 'italic' }]}
                    >
                      {t('past-expanded.partner-locked')}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </PixelCard>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {
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
  loadingBox: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  list: {
    marginTop: SPACING.md,
  },
  questionBlock: {
    paddingVertical: SPACING.md,
  },
  blockBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray100,
  },
  questionMeta: {
    alignItems: 'center',
  },
  questionEmoji: {
    fontSize: 14,
  },
  answerRow: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  nameLabel: {
    minWidth: 56,
    maxWidth: 80,
  },
  answerText: {
    flex: 1,
    lineHeight: 18,
  },
});
