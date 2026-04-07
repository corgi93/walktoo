import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, PixelCard, Row, Text } from '@/components/base';
import type {
  ReflectionCategory,
  ReflectionQuestion,
} from '@/constants/reflectionQuestions';
import { theme } from '@/styles/theme';
import { FONT_FAMILY, LAYOUT, SPACING } from '@/styles/type';

// 카테고리별 톤 (KPT 치환 — Keep / Wished / Will)
const CATEGORY_TONE: Record<
  ReflectionCategory,
  { color: string; bg: string; border: string }
> = {
  keep: {
    color: theme.colors.primary,
    bg: theme.colors.primarySurface,
    border: theme.colors.primaryLight,
  },
  wished: {
    color: theme.colors.gray600,
    bg: theme.colors.surfaceWarm,
    border: theme.colors.gray200,
  },
  will: {
    color: theme.colors.secondary,
    bg: theme.colors.secondaryLight,
    border: theme.colors.secondaryLight,
  },
};

// ─── Props ──────────────────────────────────────────────

interface QuestionCardProps {
  question: ReflectionQuestion;
  myAnswer: string;
  partnerAnswer?: string;
  isRevealed: boolean;
  partnerName: string;
  /** 없으면 read-only (과거 회고 / 공개 후) */
  onChangeMyAnswer?: (text: string) => void;
}

/**
 * 회고 질문 한 개를 표시하는 카드.
 *
 * 상태별 렌더:
 * - editable + not revealed: 내 답변 입력 가능 + 상대방 영역 잠금
 * - editable + revealed: 내 답변 입력 가능 + 상대방 답변 표시
 * - read-only + revealed: 양쪽 답변 모두 표시
 * - read-only + not revealed: 양쪽 답변 모두 read-only (과거 미공개 케이스)
 */
export function QuestionCard({
  question,
  myAnswer,
  partnerAnswer,
  isRevealed,
  partnerName,
  onChangeMyAnswer,
}: QuestionCardProps) {
  const { t } = useTranslation('reflection');
  const isEditable = !!onChangeMyAnswer;
  const showPartner = isRevealed && !!partnerAnswer;
  const tone = CATEGORY_TONE[question.category];

  return (
    <PixelCard style={styles.card} bg={tone.bg}>
      {/* ── KPT 카테고리 뱃지 ── */}
      <View
        style={[
          styles.categoryBadge,
          { backgroundColor: tone.color, borderColor: tone.color },
        ]}
      >
        <Text variant="caption" color="white">
          {t(`category.${question.category}.label`)}
        </Text>
      </View>

      {/* ── 질문 ── */}
      <Row style={styles.questionRow}>
        <Text style={styles.emoji}>{question.emoji}</Text>
        <View style={styles.questionTextWrap}>
          <Text variant="caption" color="textMuted">
            {t('question-prefix')}
          </Text>
          <Text variant="bodyMedium" color="text" mt="xxs">
            {question.question}
          </Text>
          <Text variant="caption" color="textMuted" mt="xxs">
            {t(`category.${question.category}.hint`)}
          </Text>
        </View>
      </Row>

      {/* ── 내 답변 ── */}
      <View style={styles.section}>
        <Row style={styles.sectionLabel}>
          <Icon name="user" size={11} color={theme.colors.primaryDark} />
          <Text variant="caption" color="primary" ml="xxs">
            {t('my-answer')}
          </Text>
        </Row>
        {isEditable ? (
          <TextInput
            style={styles.input}
            value={myAnswer}
            onChangeText={onChangeMyAnswer}
            placeholder={question.placeholder ?? t('answer-placeholder')}
            placeholderTextColor={theme.colors.gray400}
            multiline
            textAlignVertical="top"
            cursorColor={theme.colors.primary}
          />
        ) : (
          <View style={styles.readOnlyBox}>
            <Text variant="bodyMedium" color="text">
              {myAnswer || t('answer-placeholder')}
            </Text>
          </View>
        )}
      </View>

      {/* ── 상대방 답변 (공개 / 잠금) ── */}
      <View style={styles.section}>
        <Row style={styles.sectionLabel}>
          <Icon
            name={showPartner ? 'heart' : 'lock'}
            size={11}
            color={showPartner ? theme.colors.primaryDark : theme.colors.gray500}
          />
          <Text
            variant="caption"
            color={showPartner ? 'primary' : 'textMuted'}
            ml="xxs"
          >
            {showPartner
              ? t('partner-answer-label', { name: partnerName })
              : t('reveal-locked')}
          </Text>
        </Row>
        {showPartner ? (
          <View style={styles.partnerAnswerBox}>
            <Text variant="bodyMedium" color="text">
              {partnerAnswer}
            </Text>
          </View>
        ) : (
          <View style={styles.lockedBox}>
            <Text style={styles.lockedHint}>···</Text>
          </View>
        )}
      </View>
    </PixelCard>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    padding: LAYOUT.cardPx,
  },

  /* ── KPT 카테고리 뱃지 ── */
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1.5,
    marginBottom: SPACING.md,
  },

  /* ── 질문 ── */
  questionRow: {
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  emoji: {
    fontSize: 22,
    lineHeight: 26,
  },
  questionTextWrap: {
    flex: 1,
  },

  /* ── 섹션 공통 ── */
  section: {
    marginTop: SPACING.lg,
  },
  sectionLabel: {
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },

  /* ── 내 답변 input ── */
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 80,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONT_FAMILY.pixel,
    color: theme.colors.text,
  },
  readOnlyBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: theme.colors.primaryLight,
  },

  /* ── 상대방 답변 / 잠금 ── */
  partnerAnswerBox: {
    backgroundColor: theme.colors.surfaceWarm,
    borderRadius: theme.radius.md,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: theme.colors.gray200,
  },
  lockedBox: {
    backgroundColor: theme.colors.gray100,
    borderRadius: theme.radius.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.gray200,
    borderStyle: 'dashed',
  },
  lockedHint: {
    fontSize: 18,
    color: theme.colors.gray400,
    letterSpacing: 4,
  },
});
