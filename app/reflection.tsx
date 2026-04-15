import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Box, Button, Icon, PixelCard, Row, Text } from '@/components/base';
import { useToast } from '@/components/composite/toast/ToastProvider';
import { NoCoupleCard } from '@/components/feature/couple';
import {
  PastReflectionExpanded,
  QuestionCard,
  ReflectionHeader,
  ReflectionStatusLine,
} from '@/components/feature/reflection';
import {
  getQuestionById,
  pickReflectionQuestions,
} from '@/constants/reflectionQuestions';
import {
  useCurrentReflectionQuery,
  useReflectionDetailQuery,
  useReflectionListQuery,
  useReflectionProgressQuery,
} from '@/hooks/services/reflections/query';
import { useSaveReflectionAnswersMutation } from '@/hooks/services/reflections/mutation';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import { theme } from '@/styles/theme';
import { LAYOUT, SPACING } from '@/styles/type';
import type { ReflectionAnswer } from '@/types/reflection';

// ─── Component ──────────────────────────────────────────

export default function ReflectionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: detailId } = useLocalSearchParams<{ id?: string }>();
  const isDetailMode = !!detailId;

  const { me, couple, myName, partnerName, isCoupleConnected } =
    usePartnerDerivation();

  // ─── 미연결 가드 ──────────────────────────────────────
  if (!isCoupleConnected) {
    return (
      <NoCoupleFallback insets={insets} onBack={() => router.back()} />
    );
  }

  return isDetailMode ? (
    <DetailMode
      reflectionId={detailId!}
      myUserId={me?.id}
      myName={myName}
      partnerName={partnerName}
      insets={insets}
      onBack={() => router.back()}
    />
  ) : (
    <CurrentMode
      coupleId={couple?.id}
      myUserId={me?.id}
      myName={myName}
      partnerName={partnerName}
      insets={insets}
      onBack={() => router.back()}
    />
  );
}

// ─── Current Mode (이번 달 회고 — 인터랙티브) ──────────

interface ModeProps {
  insets: { top: number; bottom: number; left: number; right: number };
  myName: string;
  partnerName: string;
  onBack: () => void;
}

function CurrentMode({
  coupleId,
  myUserId,
  myName,
  partnerName,
  insets,
  onBack,
}: ModeProps & { coupleId?: string; myUserId?: string }) {
  const { t } = useTranslation('reflection');
  const router = useRouter();
  const toast = useToast();

  // 1. 이달의 reflection (없으면 자동 생성)
  const {
    data: currentReflection,
    isLoading: isLoadingReflection,
  } = useCurrentReflectionQuery(coupleId);

  // 2. 답변 detail (current 위에 덧붙여 fetch)
  const {
    data: detail,
    isLoading: isLoadingDetail,
  } = useReflectionDetailQuery(currentReflection?.id, myUserId);

  // 2-b. 진행 상태 (상대방 내용 없이 카운트만) — "둘 다 썼는지" 배지용
  const { data: progress } = useReflectionProgressQuery(currentReflection?.id);

  // 3. 지난 회고 목록
  const { data: pastList = [] } = useReflectionListQuery(coupleId);

  // 4. 로컬 답변 state — fetched myAnswers를 초기값으로
  //    detail이 null이어도 빈 객체로 초기화해서 TextInput이 즉시 동작하도록.
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [hydratedFromServer, setHydratedFromServer] = useState(false);

  useEffect(() => {
    if (hydratedFromServer) return;
    if (!detail) return;
    const initial: Record<number, string> = {};
    detail.myAnswers.forEach((a) => {
      initial[a.questionId] = a.answer;
    });
    // 서버 값이 있으면 덮어쓰기 (유저가 아직 입력 안 한 상태일 때만 안전)
    setAnswers((prev) => ({ ...initial, ...prev }));
    setHydratedFromServer(true);
  }, [detail, hydratedFromServer]);

  // 5. partnerAnswers를 questionId 기준 맵으로
  const partnerAnswerMap = useMemo(() => {
    if (!detail) return {};
    const map: Record<number, string> = {};
    detail.partnerAnswers.forEach((a) => {
      map[a.questionId] = a.answer;
    });
    return map;
  }, [detail]);

  // 6. 질문 lookup
  //
  // 과거에는 `currentReflection.questionIds`를 lookup해서 만들었는데,
  // DB에 오래된/빈 row가 있으면 questions가 [] 로 찍혀서 인풋이 사라지는 버그가 있었다.
  // pickReflectionQuestions는 (coupleId, year, month)에 대해 결정론적이므로
  // 두 파트너가 서로 같은 3개 질문을 보게 되어 있고, DB 상태에 무관하게
  // 항상 안정적으로 3개를 렌더할 수 있다.
  const now = useMemo(() => new Date(), []);
  const questions = useMemo(() => {
    if (!coupleId) return [];
    const year = currentReflection?.year ?? now.getFullYear();
    const month = currentReflection?.month ?? now.getMonth() + 1;
    const fresh = pickReflectionQuestions(coupleId, year, month);
    if (fresh.length > 0) return fresh;
    // fresh 가 어떤 이유로 비어 있으면 DB row 기준으로 fallback (legacy 호환)
    return (currentReflection?.questionIds ?? [])
      .map((id) => getQuestionById(id))
      .filter((q): q is NonNullable<typeof q> => !!q);
  }, [coupleId, currentReflection, now]);

  // 7. 저장 mutation
  const saveAnswers = useSaveReflectionAnswersMutation();
  const isRevealed =
    detail?.reflection.isRevealed ??
    progress?.isRevealed ??
    currentReflection?.isRevealed ??
    false;

  // 8. 3개 질문에 모두 답변했는지 (전부 입력해야 저장 가능)
  const hasAnyAnswer = useMemo(() => {
    return Object.values(answers).some((v) => v.trim().length > 0);
  }, [answers]);

  // 9. 초기 로드 값과 비교해서 변경된게 있는지 (dirty)
  const initialAnswerMap = useMemo(() => {
    const map: Record<number, string> = {};
    detail?.myAnswers.forEach((a) => {
      map[a.questionId] = a.answer;
    });
    return map;
  }, [detail]);

  const isDirty = useMemo(() => {
    // initialized 의존성 없이 바로 dirty 계산 — 입력 즉시 저장 활성화되도록
    return questions.some((q) => {
      const cur = (answers[q.id] ?? '').trim();
      const prev = (initialAnswerMap[q.id] ?? '').trim();
      return cur !== prev;
    });
  }, [questions, answers, initialAnswerMap]);

  // 전부 답변됐는지
  const allAnswered = useMemo(() => {
    if (questions.length === 0) return false;
    return questions.every((q) => (answers[q.id] ?? '').trim().length > 0);
  }, [questions, answers]);

  // 기존에 저장된 답변이 있는지 (저장하기 vs 수정하기 분기)
  const hasExistingAnswers = useMemo(() => {
    return (detail?.myAnswers ?? []).some((a) => a.answer.trim().length > 0);
  }, [detail]);

  const handleSave = () => {
    if (!currentReflection) {
      toast.error(t('save-failed'));
      return;
    }
    if (!allAnswered) {
      toast.error(t('save-need-all'));
      return;
    }
    const payload: ReflectionAnswer[] = questions.map((q) => ({
      questionId: q.id,
      answer: (answers[q.id] ?? '').trim(),
    }));
    saveAnswers.mutate(
      { reflectionId: currentReflection.id, answers: payload },
      {
        onSuccess: (result) => {
          if (result.justRevealed) {
            toast.success(t('reveal-just-now'));
          } else {
            toast.success(t('save-success'));
          }
        },
        onError: (error) => {
          console.error('[reflection] save failed:', error.message);
          toast.error(t('save-failed'));
        },
      },
    );
  };

  // ─── Loading ──
  if (isLoadingReflection || isLoadingDetail) {
    return (
      <LoadingScreen
        insets={insets}
        onBack={onBack}
        year={currentReflection?.year}
        month={currentReflection?.month}
      />
    );
  }

  // ─── Render ──
  const yearLabel = currentReflection?.year;
  const monthLabel = currentReflection?.month;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ReflectionHeader
        year={yearLabel}
        month={monthLabel}
        onBack={onBack}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── 인트로 카드 ── */}
          <Box px="xxl" style={styles.subtitleSection}>
            <PixelCard style={styles.introCard} bg={theme.colors.surfaceWarm}>
              <Text variant="headingSmall" color="text">
                {t('intro.title')}
              </Text>
              <Text variant="bodySmall" color="textSecondary" mt="xs">
                {t('intro.description')}
              </Text>
              <Row style={styles.introTags}>
                <IntroTag label={t('intro.keep-tag')} color={theme.colors.primary} />
                <IntroTag label={t('intro.wished-tag')} color={theme.colors.gray600} />
                <IntroTag label={t('intro.will-tag')} color={theme.colors.secondary} />
              </Row>
            </PixelCard>
          </Box>

          {/* ── 진행 상태: 한 줄 인라인 (카드 X) ── */}
          <Box px="xxl" style={styles.statusLineSection}>
            <ReflectionStatusLine
              myName={myName}
              partnerName={partnerName}
              myAnswered={progress?.myAnswered ?? 0}
              partnerAnswered={progress?.partnerAnswered ?? 0}
              total={
                progress && progress.total > 0
                  ? progress.total
                  : questions.length
              }
              isRevealed={isRevealed}
              hasPartner={progress?.hasPartner ?? true}
            />
          </Box>

          {/* 질문 카드들 */}
          <Box px="xxl" style={styles.questionsSection}>
            {questions.map((question, idx) => (
              <View key={question.id} style={styles.questionWrap}>
                <QuestionCard
                  question={question}
                  myAnswer={answers[question.id] ?? ''}
                  myName={myName}
                  onChangeMyAnswer={
                    isRevealed
                      ? undefined
                      : (text) =>
                          setAnswers((prev) => ({ ...prev, [question.id]: text }))
                  }
                  partnerAnswer={partnerAnswerMap[question.id]}
                  isRevealed={isRevealed}
                  partnerName={partnerName}
                  stepIndex={idx + 1}
                  stepTotal={questions.length}
                />
              </View>
            ))}
          </Box>

          {/* 지난 회고 — 인라인으로 펼쳐서 월별 쭉 훑을 수 있게 */}
          {pastList.length > 0 && (
            <Box px="xxl" style={styles.pastSection}>
              <Row style={styles.pastHeader}>
                <Text variant="headingSmall">
                  {t('section.past')}
                </Text>
                <Pressable
                  onPress={() => router.push('/reflection-timeline')}
                  hitSlop={8}
                >
                  <Row style={styles.timelineLink}>
                    <Text variant="caption" color="primary">
                      {t('timeline.title')}
                    </Text>
                    <Icon name="chevron-right" size={12} color={theme.colors.primary} />
                  </Row>
                </Pressable>
              </Row>
              <View style={styles.pastList}>
                {pastList
                  .filter((r) => r.id !== currentReflection?.id)
                  .map((reflection) => (
                    <PastReflectionExpanded
                      key={reflection.id}
                      reflection={reflection}
                      myUserId={myUserId}
                      myName={myName}
                      partnerName={partnerName}
                    />
                  ))}
              </View>
            </Box>
          )}
        </ScrollView>

        {/* 저장 버튼 — 공개 전에만. 부분 저장 허용(한 질문이라도 쓰면 활성화). */}
        {!isRevealed && (
          <Box
            px="xxl"
            style={[
              styles.bottomBar,
              { paddingBottom: insets.bottom + LAYOUT.headerPy },
            ]}
          >
            <Button
              variant="primary"
              size="large"
              onPress={handleSave}
              disabled={!allAnswered || !isDirty || saveAnswers.isPending}
              loading={saveAnswers.isPending}
            >
              {saveAnswers.isPending
                ? t('saving')
                : !allAnswered
                  ? t('save-need-all')
                  : hasExistingAnswers
                    ? t('save-edit')
                    : t('save')}
            </Button>
          </Box>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Detail Mode (지난 회고 — 읽기 전용) ────────────────

function DetailMode({
  reflectionId,
  myUserId,
  myName,
  partnerName,
  insets,
  onBack,
}: ModeProps & { reflectionId: string; myUserId?: string }) {
  const { data: detail, isLoading } = useReflectionDetailQuery(
    reflectionId,
    myUserId,
  );

  if (isLoading) {
    return <LoadingScreen insets={insets} onBack={onBack} isPastDetail />;
  }

  if (!detail) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ReflectionHeader isPastDetail onBack={onBack} />
        <View style={styles.centerArea}>
          <Icon name="x" size={32} color={theme.colors.gray400} />
        </View>
      </View>
    );
  }

  const { reflection, myAnswers, partnerAnswers } = detail;
  const myAnswerMap: Record<number, string> = {};
  myAnswers.forEach((a) => (myAnswerMap[a.questionId] = a.answer));
  const partnerAnswerMap: Record<number, string> = {};
  partnerAnswers.forEach((a) => (partnerAnswerMap[a.questionId] = a.answer));

  const questions = reflection.questionIds
    .map((id) => getQuestionById(id))
    .filter((q): q is NonNullable<typeof q> => !!q);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ReflectionHeader
        year={reflection.year}
        month={reflection.month}
        isPastDetail
        onBack={onBack}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Box px="xxl" style={styles.questionsSection}>
          {questions.map((question, idx) => (
            <View key={question.id} style={styles.questionWrap}>
              <QuestionCard
                question={question}
                myAnswer={myAnswerMap[question.id] ?? ''}
                myName={myName}
                partnerAnswer={partnerAnswerMap[question.id]}
                isRevealed={reflection.isRevealed}
                partnerName={partnerName}
                stepIndex={idx + 1}
                stepTotal={questions.length}
              />
            </View>
          ))}
        </Box>
      </ScrollView>
    </View>
  );
}

// ─── Loading Screen ─────────────────────────────────────

function LoadingScreen({
  insets,
  onBack,
  year,
  month,
  isPastDetail,
}: {
  insets: { top: number; bottom: number; left: number; right: number };
  onBack: () => void;
  year?: number;
  month?: number;
  isPastDetail?: boolean;
}) {
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ReflectionHeader
        year={year}
        month={month}
        isPastDetail={isPastDetail}
        onBack={onBack}
      />
      <View style={styles.centerArea}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    </View>
  );
}

// ─── No Couple Fallback ─────────────────────────────────

function NoCoupleFallback({
  insets,
  onBack,
}: {
  insets: { top: number; bottom: number; left: number; right: number };
  onBack: () => void;
}) {
  const { t } = useTranslation('reflection');
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Row px="xxl" style={styles.fallbackHeader}>
        <Pressable onPress={onBack} hitSlop={8}>
          <Icon name="arrow-left" size={22} color={theme.colors.text} />
        </Pressable>
        <Text variant="headingMedium">{t('title')}</Text>
        <View style={{ width: 22 }} />
      </Row>
      <View style={styles.centerArea}>
        <Box px="xxl" style={{ alignItems: 'center' }}>
          <Icon name="heart" size={48} color={theme.colors.gray300} />
          <Text variant="headingSmall" mt="lg" align="center">
            {t('no-couple-title')}
          </Text>
          <Text
            variant="bodySmall"
            color="textMuted"
            mt="sm"
            align="center"
          >
            {t('no-couple-description')}
          </Text>
        </Box>
      </View>
      <View style={{ paddingBottom: insets.bottom }}>
        <NoCoupleCard />
      </View>
    </View>
  );
}

// ─── Sub: IntroTag ──────────────────────────────────────
// 인트로 카드 안의 작은 카테고리 칩. 사용자가 세 축을 미리 보고 감을 잡게 함.

function IntroTag({ label, color }: { label: string; color: string }) {
  return (
    <View
      style={[
        introTagStyles.tag,
        { borderColor: color, backgroundColor: `${color}14` },
      ]}
    >
      <Text variant="caption" style={{ color, fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
}

const introTagStyles = StyleSheet.create({
  tag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
  },
});

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  fallbackHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: LAYOUT.headerPy,
  },
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    paddingBottom: LAYOUT.bottomSafe + LAYOUT.sectionGap,
  },
  subtitleSection: {
    marginTop: SPACING.sm,
  },
  introCard: {
    padding: LAYOUT.cardPx,
  },
  introTags: {
    marginTop: SPACING.md,
    gap: SPACING.xs,
    flexWrap: 'wrap',
  },
  statusLineSection: {
    marginTop: SPACING.sm,
  },
  questionsSection: {
    marginTop: SPACING.lg,
  },
  questionWrap: {
    marginBottom: LAYOUT.sectionGap,
  },
  pastSection: {
    marginTop: SPACING.xxl,
  },
  pastHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  timelineLink: {
    alignItems: 'center',
    gap: 2,
  },
  pastList: {
    gap: SPACING.md,
  },
  bottomBar: {
    paddingTop: LAYOUT.headerPy,
    borderTopWidth: 2,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
});
