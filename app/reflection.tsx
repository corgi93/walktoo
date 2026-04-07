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
  PastReflectionItem,
  QuestionCard,
  ReflectionHeader,
} from '@/components/feature/reflection';
import { getQuestionById } from '@/constants/reflectionQuestions';
import {
  useCurrentReflectionQuery,
  useReflectionDetailQuery,
  useReflectionListQuery,
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

  const { me, couple, partnerName, isCoupleConnected } = usePartnerDerivation();

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
      partnerName={partnerName}
      insets={insets}
      onBack={() => router.back()}
    />
  ) : (
    <CurrentMode
      coupleId={couple?.id}
      myUserId={me?.id}
      partnerName={partnerName}
      insets={insets}
      onBack={() => router.back()}
    />
  );
}

// ─── Current Mode (이번 달 회고 — 인터랙티브) ──────────

interface ModeProps {
  insets: { top: number; bottom: number; left: number; right: number };
  partnerName: string;
  onBack: () => void;
}

function CurrentMode({
  coupleId,
  myUserId,
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

  // 3. 지난 회고 목록
  const { data: pastList = [] } = useReflectionListQuery(coupleId);

  // 4. 로컬 답변 state — fetched myAnswers를 초기값으로
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (detail && !initialized) {
      const initial: Record<number, string> = {};
      detail.myAnswers.forEach((a) => {
        initial[a.questionId] = a.answer;
      });
      setAnswers(initial);
      setInitialized(true);
    }
  }, [detail, initialized]);

  // 5. partnerAnswers를 questionId 기준 맵으로
  const partnerAnswerMap = useMemo(() => {
    if (!detail) return {};
    const map: Record<number, string> = {};
    detail.partnerAnswers.forEach((a) => {
      map[a.questionId] = a.answer;
    });
    return map;
  }, [detail]);

  // 6. 질문 lookup (i18n getter)
  const questions = useMemo(() => {
    if (!currentReflection) return [];
    return currentReflection.questionIds
      .map((id) => getQuestionById(id))
      .filter((q): q is NonNullable<typeof q> => !!q);
  }, [currentReflection]);

  // 7. 저장 mutation
  const saveAnswers = useSaveReflectionAnswersMutation();
  const isRevealed = detail?.reflection.isRevealed ?? false;

  // 8. dirty 검사: 비어있지 않은 답변이 1개 이상 + initialized 후
  const isDirty = useMemo(() => {
    if (!initialized) return false;
    return Object.values(answers).some((v) => v.trim().length > 0);
  }, [answers, initialized]);

  // 9. 모든 질문에 답변이 있는지 (저장 활성화 조건)
  const allAnswered = useMemo(() => {
    if (questions.length === 0) return false;
    return questions.every((q) => (answers[q.id] ?? '').trim().length > 0);
  }, [questions, answers]);

  const handleSave = () => {
    if (!currentReflection || !allAnswered) return;
    const payload: ReflectionAnswer[] = questions.map((q) => ({
      questionId: q.id,
      answer: (answers[q.id] ?? '').trim(),
    }));
    saveAnswers.mutate(
      { reflectionId: currentReflection.id, answers: payload },
      {
        onSuccess: (result) => {
          if (result.success) {
            if (result.justRevealed) {
              toast.success(t('reveal-just-now'));
            } else {
              toast.success(t('save-success'));
            }
          } else {
            toast.error(t('save-failed'));
          }
        },
        onError: () => toast.error(t('save-failed')),
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
          {/* 서브타이틀 */}
          <Box px="xxl" style={styles.subtitleSection}>
            <Text variant="bodySmall" color="textMuted">
              {t('subtitle')}
            </Text>
          </Box>

          {/* 질문 카드들 */}
          <Box px="xxl" style={styles.questionsSection}>
            {questions.map((question) => (
              <View key={question.id} style={styles.questionWrap}>
                <QuestionCard
                  question={question}
                  myAnswer={answers[question.id] ?? ''}
                  onChangeMyAnswer={
                    isRevealed
                      ? undefined
                      : (text) =>
                          setAnswers((prev) => ({ ...prev, [question.id]: text }))
                  }
                  partnerAnswer={partnerAnswerMap[question.id]}
                  isRevealed={isRevealed}
                  partnerName={partnerName}
                />
              </View>
            ))}
          </Box>

          {/* 지난 회고 목록 */}
          {pastList.length > 0 && (
            <Box px="xxl" style={styles.pastSection}>
              <Text variant="headingSmall" mb="md">
                {t('section.past')}
              </Text>
              <PixelCard style={styles.pastCard}>
                {pastList
                  .filter((r) => r.id !== currentReflection?.id)
                  .map((reflection, idx, arr) => (
                    <PastReflectionItem
                      key={reflection.id}
                      reflection={reflection}
                      isLast={idx === arr.length - 1}
                      onPress={() =>
                        router.push({
                          pathname: '/reflection',
                          params: { id: reflection.id },
                        })
                      }
                    />
                  ))}
              </PixelCard>
            </Box>
          )}
        </ScrollView>

        {/* 저장 버튼 — 공개 전에만 */}
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
              disabled={!allAnswered || saveAnswers.isPending || !isDirty}
              loading={saveAnswers.isPending}
            >
              {saveAnswers.isPending ? t('saving') : t('save')}
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
          {questions.map((question) => (
            <View key={question.id} style={styles.questionWrap}>
              <QuestionCard
                question={question}
                myAnswer={myAnswerMap[question.id] ?? ''}
                partnerAnswer={partnerAnswerMap[question.id]}
                isRevealed={reflection.isRevealed}
                partnerName={partnerName}
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
  questionsSection: {
    marginTop: SPACING.lg,
  },
  questionWrap: {
    marginBottom: LAYOUT.sectionGap,
  },
  pastSection: {
    marginTop: SPACING.xxl,
  },
  pastCard: {
    padding: 0,
    overflow: 'hidden',
  },
  bottomBar: {
    paddingTop: LAYOUT.headerPy,
    borderTopWidth: 2,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
});
