import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, PixelCard, Row, Text } from '@/components/base';
import type {
  ReflectionCategory,
  ReflectionQuestion,
} from '@/constants/reflectionQuestions';
import { theme } from '@/styles/theme';
import { FONT_FAMILY, SPACING } from '@/styles/type';

// ─── 카테고리별 톤 (KPT 치환) ──────────────────────────
//
// Keep    → 좋았던 우리   (primary / rose — 따뜻함)
// Wished  → 아쉬웠던 우리 (gray   / warm — 잔잔함, 비난 X)
// Will    → 다음 달 우리  (secondary / sage — 설렘)

const CATEGORY_TONE: Record<
  ReflectionCategory,
  { accent: string; soft: string; cardBg: string }
> = {
  keep: {
    accent: theme.colors.primary,
    soft: theme.colors.primaryLight,
    cardBg: theme.colors.primarySurface,
  },
  wished: {
    accent: theme.colors.gray600,
    soft: theme.colors.gray200,
    cardBg: theme.colors.surfaceWarm,
  },
  will: {
    accent: theme.colors.secondary,
    soft: theme.colors.secondaryLight,
    cardBg: theme.colors.secondaryLight,
  },
};

// ─── Props ──────────────────────────────────────────────

interface QuestionCardProps {
  question: ReflectionQuestion;
  myAnswer: string;
  myName: string;
  partnerAnswer?: string;
  isRevealed: boolean;
  partnerName: string;
  /** 없으면 read-only (과거 회고 / 공개 후) */
  onChangeMyAnswer?: (text: string) => void;
  /** 카드 진행 순서 (1/3, 2/3, 3/3) — 헤더에 표시 */
  stepIndex?: number;
  stepTotal?: number;
  /** 상대방이 이 질문에 답변했는지 (progress 기반, 미공개 상태에서도 표시) */
  partnerHasAnswered?: boolean;
}

/**
 * 회고 질문 한 개를 표시하는 카드. 토스 톤 재설계 버전.
 *
 * 레이아웃 원칙:
 * - PixelCard의 기본 padding은 그대로 두고, 카테고리 ribbon만 negative margin으로
 *   edge-to-edge 처리. (이전에 padding:0 + overflow:hidden으로 덮어쓰면서 nested
 *   View의 터치 영역이 깨지는 문제가 있어 복원.)
 * - 입력 필드가 시각적으로 명확하도록 surface 배경 + 카테고리 톤 테두리.
 * - 말문 열기 칩은 입력 위에서 글의 시작을 도와줌 (DB 변경 없는 UI affordance).
 */
// wished 카테고리에만 노출되는 "스킵" 문구.
// 이걸 탭하면 답변 필드에 자동으로 채워지며, 정상 답변으로 저장된다.
// (비난/아쉬움 부담이 없는 달에도 회고가 성립하도록 하는 escape hatch)
const WISHED_SKIP_MARKER = '이번 달엔 딱히 아쉬웠던 게 없어요 🤍';

export function QuestionCard({
  question,
  myAnswer,
  myName,
  partnerAnswer,
  isRevealed,
  partnerName,
  onChangeMyAnswer,
  stepIndex,
  stepTotal,
  partnerHasAnswered,
}: QuestionCardProps) {
  const { t } = useTranslation('reflection');
  const isEditable = !!onChangeMyAnswer;
  const showPartner = isRevealed && !!partnerAnswer;
  const tone = CATEGORY_TONE[question.category];
  const prompts = question.prompts ?? [];
  const canSkip = question.category === 'wished';
  const isSkipped = canSkip && myAnswer.trim() === WISHED_SKIP_MARKER;

  const handleChipTap = (prompt: string) => {
    if (!onChangeMyAnswer) return;
    // 같은 시작 문장으로 이미 시작하면 무시 (중복 방지)
    if (myAnswer.startsWith(prompt)) return;
    // 끝에 공백/개행이 없으면 공백 추가, 빈 텍스트면 그냥 prompt
    const separator =
      myAnswer.length === 0 || myAnswer.endsWith(' ') || myAnswer.endsWith('\n')
        ? ''
        : ' ';
    onChangeMyAnswer(`${myAnswer}${separator}${prompt}`);
  };

  const handleSkipToggle = () => {
    if (!onChangeMyAnswer) return;
    if (isSkipped) {
      onChangeMyAnswer('');
    } else {
      onChangeMyAnswer(WISHED_SKIP_MARKER);
    }
  };

  return (
    <PixelCard bg={tone.cardBg}>
      {/* ── 카테고리 ribbon (negative margin으로 edge-to-edge) ── */}
      <View style={[styles.ribbon, { backgroundColor: tone.accent }]}>
        <Row style={styles.ribbonRow}>
          <Text style={styles.ribbonLabel}>
            {t(`category.${question.category}.label`)}
          </Text>
          {stepIndex !== undefined && stepTotal !== undefined && (
            <Text style={styles.ribbonStep}>
              {stepIndex}/{stepTotal}
            </Text>
          )}
        </Row>
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

      {/* ── 말문 열기 칩 (editable일 때만, prompts 있을 때만) ── */}
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
                style={({ pressed }) => [
                  styles.promptChip,
                  { borderColor: tone.accent },
                  pressed && { opacity: 0.6 },
                ]}
                onPress={() => handleChipTap(prompt)}
                hitSlop={6}
              >
                <Text
                  variant="caption"
                  style={{ color: tone.accent, fontWeight: '600' }}
                >
                  {prompt.trim()}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* ── 내 답변 ── */}
      <View style={styles.answerSection}>
        <Row style={styles.sectionLabelRow}>
          <Row style={styles.sectionLabel}>
            <Icon name="user" size={11} color={tone.accent} />
            <Text
              variant="caption"
              ml="xxs"
              style={{ color: tone.accent, fontWeight: '600' }}
            >
              {t('my-answer-with-name', { name: myName })}
            </Text>
          </Row>
          {/* Wished 전용 스킵 토글 — 아쉬웠던 게 없는 달에도 부담없이 지나갈 수 있도록 */}
          {canSkip && isEditable && (
            <Pressable
              onPress={handleSkipToggle}
              hitSlop={6}
              style={({ pressed }) => [
                styles.skipChip,
                isSkipped && styles.skipChipActive,
                pressed && { opacity: 0.6 },
              ]}
            >
              <Icon
                name={isSkipped ? 'check' : 'heart'}
                size={10}
                color={
                  isSkipped ? theme.colors.white : theme.colors.textSecondary
                }
              />
              <Text
                variant="caption"
                style={{
                  color: isSkipped
                    ? theme.colors.white
                    : theme.colors.textSecondary,
                  fontWeight: '600',
                  marginLeft: 4,
                }}
              >
                {t(isSkipped ? 'skip-done' : 'skip-wished')}
              </Text>
            </Pressable>
          )}
        </Row>
        {isEditable ? (
          <TextInput
            style={[
              styles.input,
              { borderColor: tone.accent },
              isSkipped && styles.inputSkipped,
            ]}
            value={myAnswer}
            onChangeText={onChangeMyAnswer}
            placeholder={question.placeholder ?? t('answer-placeholder')}
            placeholderTextColor={theme.colors.gray400}
            multiline
            textAlignVertical="top"
            cursorColor={tone.accent}
            editable={!isSkipped}
          />
        ) : (
          <View style={[styles.readOnlyBox, { borderColor: tone.soft }]}>
            {myAnswer ? (
              <Text variant="bodyMedium" color="text">
                {myAnswer}
              </Text>
            ) : (
              <Text variant="bodyMedium" color="textMuted" style={{ fontStyle: 'italic' }}>
                {t('answer-not-written')}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* ── 연인 영역 divider ── */}
      <View style={styles.partnerDivider}>
        <View style={[styles.dividerLine, { backgroundColor: tone.soft }]} />
        <Row style={styles.partnerBadge}>
          <Icon
            name={showPartner ? 'heart' : partnerHasAnswered ? 'check-circle' : 'lock'}
            size={11}
            color={showPartner ? tone.accent : partnerHasAnswered ? theme.colors.secondary : theme.colors.gray500}
          />
          <Text
            variant="caption"
            ml="xxs"
            style={{
              color: showPartner ? tone.accent : partnerHasAnswered ? theme.colors.secondary : theme.colors.gray500,
              fontWeight: '500',
            }}
          >
            {showPartner
              ? t('partner-answer-label', { name: partnerName })
              : partnerHasAnswered
                ? t('partner-completed')
                : t('reveal-locked')}
          </Text>
        </Row>
        <View style={[styles.dividerLine, { backgroundColor: tone.soft }]} />
      </View>

      {/* ── 연인 답변 or 잠금 ── */}
      {showPartner ? (
        <View style={[styles.partnerAnswerBox, { borderColor: tone.soft }]}>
          <Text variant="bodyMedium" color="text">
            {partnerAnswer}
          </Text>
        </View>
      ) : partnerHasAnswered ? (
        <View style={[styles.partnerCompletedBox, { borderColor: theme.colors.secondaryLight }]}>
          <Icon name="check-circle" size={18} color={theme.colors.secondary} />
          <Text variant="bodySmall" color="secondary" mt="xs" align="center">
            {t('partner-completed-hint')}
          </Text>
        </View>
      ) : (
        <View style={[styles.lockedBox, { borderColor: tone.soft }]}>
          <Text style={styles.lockedHint}>···</Text>
        </View>
      )}
    </PixelCard>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  /* ── 카테고리 ribbon (negative margin으로 PixelCard padding 무력화) ── */
  ribbon: {
    marginHorizontal: -SPACING.lg,
    marginTop: -SPACING.lg,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderTopLeftRadius: theme.radius.lg - 2,
    borderTopRightRadius: theme.radius.lg - 2,
  },
  ribbonRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ribbonLabel: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONT_FAMILY.pixel,
    letterSpacing: 0.3,
  },
  ribbonStep: {
    color: theme.colors.white,
    fontSize: 10,
    opacity: 0.85,
    fontFamily: FONT_FAMILY.pixel,
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

  /* ── 말문 열기 ── */
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
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: theme.colors.surface,
  },

  /* ── 내 답변 ── */
  answerSection: {
    marginTop: SPACING.lg,
  },
  sectionLabelRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  sectionLabel: {
    alignItems: 'center',
  },
  skipChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.gray300,
    backgroundColor: theme.colors.surface,
  },
  skipChipActive: {
    backgroundColor: theme.colors.gray500,
    borderColor: theme.colors.gray500,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 90,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONT_FAMILY.pixel,
    color: theme.colors.text,
  },
  inputSkipped: {
    backgroundColor: theme.colors.gray100,
    color: theme.colors.textMuted,
    opacity: 0.85,
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
  partnerCompletedBox: {
    backgroundColor: theme.colors.secondaryLight,
    borderRadius: theme.radius.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
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
