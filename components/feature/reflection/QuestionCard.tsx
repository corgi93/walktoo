import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, PixelCard, Row, Text } from '@/components/base';
import type {
  ReflectionCategory,
  ReflectionQuestion,
} from '@/constants/reflectionQuestions';
import { theme } from '@/styles/theme';
import { FONT_FAMILY, LAYOUT, SPACING } from '@/styles/type';

// ─── 카테고리별 톤 (KPT 치환) ──────────────────────────
//
// Keep    → 좋았던 우리   (primary / rose — 따뜻함)
// Wished  → 아쉬웠던 우리 (gray   / warm — 잔잔함, 비난 X)
// Will    → 다음 달 우리  (secondary / sage — 설렘)

const CATEGORY_TONE: Record<
  ReflectionCategory,
  { accent: string; soft: string; cardBg: string; chipBg: string }
> = {
  keep: {
    accent: theme.colors.primary,
    soft: theme.colors.primaryLight,
    cardBg: theme.colors.primarySurface,
    chipBg: theme.colors.surface,
  },
  wished: {
    accent: theme.colors.gray600,
    soft: theme.colors.gray200,
    cardBg: theme.colors.surfaceWarm,
    chipBg: theme.colors.surface,
  },
  will: {
    accent: theme.colors.secondary,
    soft: theme.colors.secondaryLight,
    cardBg: theme.colors.secondaryLight,
    chipBg: theme.colors.surface,
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
  /** 카드 진행 순서 (1/3, 2/3, 3/3) — 헤더에 표시 */
  stepIndex?: number;
  stepTotal?: number;
}

/**
 * 회고 질문 한 개를 표시하는 카드. 토스 톤 재설계 버전.
 *
 * 레이아웃:
 *   ┌─────────────────────────┐
 *   │ [카테고리 헤더 bar]      │  ← 색상 배경 + 진행 n/3
 *   ├─────────────────────────┤
 *   │ 🎨 Q. 질문 본문         │
 *   │ 힌트                    │
 *   │                         │
 *   │ 💬 말문 열기             │
 *   │ [chip] [chip] [chip]    │
 *   │                         │
 *   │ [내 답변 textarea]       │
 *   │                         │
 *   │ ─── 💞 연인 ───         │
 *   │ [공개 답변 or 잠금]      │
 *   └─────────────────────────┘
 */
export function QuestionCard({
  question,
  myAnswer,
  partnerAnswer,
  isRevealed,
  partnerName,
  onChangeMyAnswer,
  stepIndex,
  stepTotal,
}: QuestionCardProps) {
  const { t } = useTranslation('reflection');
  const isEditable = !!onChangeMyAnswer;
  const showPartner = isRevealed && !!partnerAnswer;
  const tone = CATEGORY_TONE[question.category];
  const prompts = question.prompts ?? [];

  const handleChipTap = (prompt: string) => {
    if (!onChangeMyAnswer) return;
    // 이미 같은 시작으로 시작하면 중복 삽입 X
    if (myAnswer.startsWith(prompt)) return;
    // 끝에 공백 없이 붙어있으면 공백 추가
    const separator =
      myAnswer.length === 0 || myAnswer.endsWith(' ') || myAnswer.endsWith('\n')
        ? ''
        : ' ';
    onChangeMyAnswer(`${myAnswer}${separator}${prompt}`);
  };

  return (
    <PixelCard style={styles.card} bg={tone.cardBg}>
      {/* ── 카테고리 헤더 bar ── */}
      <View style={[styles.categoryHeader, { backgroundColor: tone.accent }]}>
        <Row style={styles.categoryHeaderRow}>
          <Text style={styles.categoryLabel}>
            {t(`category.${question.category}.label`)}
          </Text>
          {stepIndex !== undefined && stepTotal !== undefined && (
            <Text style={styles.categoryStep}>
              {stepIndex}/{stepTotal}
            </Text>
          )}
        </Row>
      </View>

      {/* ── 본문 ── */}
      <View style={styles.body}>
        {/* 질문 */}
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

        {/* 말문 열기 — prompts가 있을 때만, editable일 때만 */}
        {isEditable && prompts.length > 0 && (
          <View style={styles.promptsSection}>
            <Row style={styles.promptsLabel}>
              <Text style={styles.promptsEmoji}>💬</Text>
              <Text variant="caption" color="textMuted" ml="xxs">
                {t('prompts-label')}
              </Text>
            </Row>
            <View style={styles.promptsRow}>
              {prompts.map((prompt, i) => (
                <Pressable
                  key={i}
                  style={[
                    styles.promptChip,
                    { backgroundColor: tone.chipBg, borderColor: tone.soft },
                  ]}
                  onPress={() => handleChipTap(prompt)}
                  hitSlop={4}
                >
                  <Text
                    variant="caption"
                    style={{ color: tone.accent, fontWeight: '500' }}
                  >
                    {prompt.trim()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* 내 답변 */}
        <View style={styles.answerSection}>
          <Row style={styles.sectionLabel}>
            <Icon name="user" size={11} color={tone.accent} />
            <Text
              variant="caption"
              ml="xxs"
              style={{ color: tone.accent, fontWeight: '600' }}
            >
              {t('my-answer')}
            </Text>
          </Row>
          {isEditable ? (
            <TextInput
              style={[styles.input, { borderColor: tone.soft }]}
              value={myAnswer}
              onChangeText={onChangeMyAnswer}
              placeholder={question.placeholder ?? t('answer-placeholder')}
              placeholderTextColor={theme.colors.gray400}
              multiline
              textAlignVertical="top"
              cursorColor={tone.accent}
            />
          ) : (
            <View style={[styles.readOnlyBox, { borderColor: tone.soft }]}>
              <Text variant="bodyMedium" color="text">
                {myAnswer || t('answer-placeholder')}
              </Text>
            </View>
          )}
        </View>

        {/* 연인 divider */}
        <View style={styles.partnerDivider}>
          <View style={[styles.dividerLine, { backgroundColor: tone.soft }]} />
          <View style={[styles.partnerBadge, { backgroundColor: tone.cardBg }]}>
            <Icon
              name={showPartner ? 'heart' : 'lock'}
              size={11}
              color={showPartner ? tone.accent : theme.colors.gray500}
            />
            <Text
              variant="caption"
              ml="xxs"
              style={{
                color: showPartner ? tone.accent : theme.colors.gray500,
                fontWeight: '500',
              }}
            >
              {showPartner
                ? t('partner-answer-label', { name: partnerName })
                : t('reveal-locked')}
            </Text>
          </View>
          <View style={[styles.dividerLine, { backgroundColor: tone.soft }]} />
        </View>

        {/* 연인 답변 or 잠금 */}
        {showPartner ? (
          <View style={[styles.partnerAnswerBox, { borderColor: tone.soft }]}>
            <Text variant="bodyMedium" color="text">
              {partnerAnswer}
            </Text>
          </View>
        ) : (
          <View style={[styles.lockedBox, { borderColor: tone.soft }]}>
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
    padding: 0,
    overflow: 'hidden',
  },

  /* ── 카테고리 헤더 bar ── */
  categoryHeader: {
    paddingHorizontal: LAYOUT.cardPx,
    paddingVertical: SPACING.sm,
  },
  categoryHeaderRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLabel: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONT_FAMILY.pixel,
    letterSpacing: 0.3,
  },
  categoryStep: {
    color: theme.colors.white,
    fontSize: 10,
    opacity: 0.85,
    fontFamily: FONT_FAMILY.pixel,
  },

  /* ── 본문 ── */
  body: {
    padding: LAYOUT.cardPx,
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

  /* ── 말문 열기 (prompt chips) ── */
  promptsSection: {
    marginTop: SPACING.lg,
  },
  promptsLabel: {
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  promptsEmoji: {
    fontSize: 11,
  },
  promptsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  promptChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: theme.radius.full ?? 16,
    borderWidth: 1.5,
  },

  /* ── 내 답변 ── */
  answerSection: {
    marginTop: SPACING.md,
  },
  sectionLabel: {
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
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
  },

  /* ── 연인 divider ── */
  partnerDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  partnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },

  /* ── 연인 답변 / 잠금 ── */
  partnerAnswerBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: SPACING.md,
    borderWidth: 1.5,
  },
  lockedBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    opacity: 0.7,
  },
  lockedHint: {
    fontSize: 18,
    color: theme.colors.gray400,
    letterSpacing: 4,
  },
});
