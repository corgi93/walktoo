import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Box, Button, Icon, Row, Text } from '@/components/base';
import {
  COUPLE_QUESTIONS,
  DIARY_QUESTIONS,
  getDailyQuestions,
} from '@/constants/questions';
import {
  useAddEntryMutation,
  useUpdateEntryMutation,
} from '@/hooks/services/diary/mutation';
import { useNudgeMutation } from '@/hooks/services/notification/mutation';
import { useGetCoupleQuery } from '@/hooks/services/couple/query';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import { useToast } from '@/components/composite/toast/ToastProvider';
import { useEntitlement } from '@/hooks/useEntitlement';
import { PREMIUM } from '@/constants/premium';
import { useDialogStore } from '@/stores/dialogStore';
import { theme } from '@/styles/theme';
import { FONT_FAMILY, LAYOUT, SPACING } from '@/styles/type';
import { FootprintEntry } from '@/types/diary';
import { formatDate, parseLocalDate } from '@/utils/date';

// ─── Component ──────────────────────────────────────────

export default function DiaryDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dialog = useDialogStore();
  const { t } = useTranslation(['diary', 'common', 'premium']);
  const { isEntitled } = useEntitlement();
  const photoLimit = isEntitled
    ? PREMIUM.PHOTO_LIMIT_PREMIUM
    : PREMIUM.PHOTO_LIMIT_FREE;
  const params = useLocalSearchParams<{
    id: string;
    date: string;
    locationName: string;
    isRevealed: string;
    myEntry: string;
    partnerEntry: string;
  }>();

  const walkId = params.id;
  const isRevealed = params.isRevealed === 'true';
  const myEntry: FootprintEntry | undefined = params.myEntry
    ? JSON.parse(params.myEntry)
    : undefined;
  const partnerEntry: FootprintEntry | undefined = params.partnerEntry
    ? JSON.parse(params.partnerEntry)
    : undefined;

  const hasMyEntry = !!myEntry;

  // 질문 데이터
  const { data: couple } = useGetCoupleQuery();
  const { diaryQuestion, coupleQuestion } = getDailyQuestions(
    couple?.firstMetDate,
    params.date,
  );

  // ─── 수정/입력 모드 ───────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [memo, setMemo] = useState(myEntry?.memo ?? '');
  const [photos, setPhotos] = useState<string[]>(myEntry?.photos ?? []);
  const [diaryAnswer, setDiaryAnswer] = useState(myEntry?.diaryAnswer ?? '');
  const [coupleAnswer, setCoupleAnswer] = useState(myEntry?.coupleAnswer ?? '');

  const addEntry = useAddEntryMutation();
  const updateEntry = useUpdateEntryMutation();
  const nudge = useNudgeMutation();
  const toast = useToast();
  const { partnerId, couple: coupleData } = usePartnerDerivation();
  const isSaving = addEntry.isPending || updateEntry.isPending;

  const canNudge = hasMyEntry && !partnerEntry;
  const handleNudge = () => {
    if (!partnerId || !coupleData?.id) return;
    nudge.mutate(
      { recipientId: partnerId, coupleId: coupleData.id, walkId },
      {
        onSuccess: () => toast.success(t('diary:timeline.nudge-success')),
        onError: () => toast.error(t('diary:timeline.nudge-failed')),
      },
    );
  };

  const formattedDate = params.date
    ? formatDate(parseLocalDate(params.date), {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      })
    : '';

  const handleStartEdit = () => {
    setMemo(myEntry?.memo ?? '');
    setPhotos(myEntry?.photos ?? []);
    setDiaryAnswer(myEntry?.diaryAnswer ?? '');
    setCoupleAnswer(myEntry?.coupleAnswer ?? '');
    setIsEditing(true);
  };
  void memo; // memo 상태는 폼 초기화에 사용 (편집 시 photos/answers와 같이 reset)

  const handleCancelEdit = () => setIsEditing(false);

  const handleAddPhoto = async () => {
    if (!isEntitled && photos.length >= PREMIUM.PHOTO_LIMIT_FREE) {
      dialog.confirm(
        t('premium:gate.photos-title'),
        t('premium:gate.photos-description', {
          limit: PREMIUM.PHOTO_LIMIT_PREMIUM,
        }),
        () => router.push('/paywall'),
        t('premium:gate.go-paywall'),
      );
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      dialog.alert(
        t('diary:create.photo-permission-title'),
        t('diary:create.photo-permission-message'),
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: photoLimit - photos.length,
      quality: 0.8,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setPhotos((prev) => [...prev, ...uris].slice(0, photoLimit));
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (hasMyEntry && myEntry) {
      updateEntry.mutate(
        {
          walkId,
          entryId: myEntry.id,
          memo: diaryAnswer.trim(),
          photos,
          diaryAnswer: diaryAnswer.trim(),
          coupleAnswer: coupleAnswer.trim(),
        },
        {
          onSuccess: () => router.back(),
          onError: (e) =>
            dialog.alert(
              t('diary:detail.form.edit-failed-title'),
              e.message || t('diary:detail.form.save-retry'),
            ),
        },
      );
    } else {
      addEntry.mutate(
        {
          walkId,
          memo: diaryAnswer.trim(),
          photos,
          diaryQuestionId: diaryQuestion.id,
          diaryAnswer: diaryAnswer.trim(),
          coupleQuestionId: coupleQuestion.id,
          coupleAnswer: coupleAnswer.trim(),
        },
        {
          onSuccess: () => router.back(),
          onError: (e) =>
            dialog.alert(
              t('diary:detail.form.save-failed-title'),
              e.message || t('diary:detail.form.save-retry'),
            ),
        },
      );
    }
  };

  const showForm = !hasMyEntry || isEditing;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── 헤더 ── */}
      <Row px="xxl" style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Icon name="arrow-left" size={22} color={theme.colors.text} />
        </Pressable>
        <Text variant="headingMedium" ml="md">
          {t('diary:detail.title')}
        </Text>
        <View style={{ flex: 1 }} />
      </Row>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Box px="xxl">
            <View style={styles.diaryPage}>
              <View style={styles.dateStamp}>
                <Icon name="calendar" size={13} color={theme.colors.primary} />
                <Text variant="caption" color="primary" ml="xxs">
                  {formattedDate}
                </Text>
              </View>

              <Row style={styles.locationRow}>
                <Icon name="map-pin" size={18} color={theme.colors.primary} />
                <Text variant="headingLarge" ml="xs">
                  {params.locationName}
                </Text>
              </Row>

              <View style={styles.dashedDivider} />

              {/* ── 내 기록 ── */}
              <EntrySection
                label={myEntry?.nickname ?? t('common:labels.me')}
                color={theme.colors.primary}
                accentBg={theme.colors.primarySurface}
                borderColor={theme.colors.primaryLight}
              >
                {hasMyEntry && !isEditing ? (
                  <>
                    {myEntry.photos.length > 0 && (
                      <PhotoStrip photos={myEntry.photos} />
                    )}
                    {myEntry.diaryQuestionId != null ? (
                      <QABlock
                        label="📝"
                        question={DIARY_QUESTIONS[myEntry.diaryQuestionId]?.content ?? ''}
                        answer={myEntry.diaryAnswer ?? ''}
                        bgColor={theme.colors.surfaceWarm}
                        emptyText={t('diary:detail.answer-empty')}
                      />
                    ) : myEntry.memo ? (
                      <View style={styles.memoReadBubble}>
                        <Text variant="bodyMedium" color="text">{myEntry.memo}</Text>
                      </View>
                    ) : null}
                    {myEntry.coupleQuestionId != null && (
                      <QABlock
                        label="💌"
                        question={COUPLE_QUESTIONS[myEntry.coupleQuestionId]?.content ?? ''}
                        answer={myEntry.coupleAnswer ?? ''}
                        bgColor={theme.colors.primarySurface}
                        emptyText={t('diary:detail.answer-empty')}
                      />
                    )}
                    <Pressable
                      style={styles.editChip}
                      onPress={handleStartEdit}
                      hitSlop={8}
                    >
                      <Icon name="edit" size={12} color={theme.colors.primary} />
                      <Text variant="caption" color="primary" ml="xxs">
                        {t('diary:detail.edit')}
                      </Text>
                    </Pressable>
                  </>
                ) : showForm ? (
                  <>
                    {isEditing && (
                      <Pressable
                        onPress={handleCancelEdit}
                        style={styles.cancelChip}
                        hitSlop={8}
                      >
                        <Text variant="caption" color="textMuted">
                          {t('diary:detail.edit-cancel')}
                        </Text>
                      </Pressable>
                    )}
                    <EntryForm
                      photos={photos}
                      diaryAnswer={diaryAnswer}
                      coupleAnswer={coupleAnswer}
                      diaryQuestionContent={diaryQuestion.content}
                      coupleQuestionContent={coupleQuestion.content}
                      coupleQuestionEmoji={coupleQuestion.emoji}
                      coupleQuestionCategory={coupleQuestion.categoryLabel}
                      onAddPhoto={handleAddPhoto}
                      onRemovePhoto={handleRemovePhoto}
                      onChangeDiaryAnswer={setDiaryAnswer}
                      onChangeCoupleAnswer={setCoupleAnswer}
                    />
                  </>
                ) : null}
              </EntrySection>

              <View style={styles.heartDivider}>
                <Text style={styles.heartText}>{'~ ~ ~'}</Text>
              </View>

              {/* ── 연인 기록 ── */}
              <EntrySection
                label={partnerEntry?.nickname ?? t('common:labels.lover')}
                color="#6A9E85"
                accentBg="#EDF7F1"
                borderColor="#C5E4D2"
              >
                {isRevealed && partnerEntry ? (
                  <>
                    {partnerEntry.photos.length > 0 && (
                      <PhotoStrip photos={partnerEntry.photos} />
                    )}
                    {partnerEntry.diaryQuestionId != null ? (
                      <QABlock
                        label="📝"
                        question={DIARY_QUESTIONS[partnerEntry.diaryQuestionId]?.content ?? ''}
                        answer={partnerEntry.diaryAnswer ?? ''}
                        bgColor="#EDF7F1"
                        emptyText={t('diary:detail.answer-empty')}
                      />
                    ) : partnerEntry.memo ? (
                      <View style={[styles.memoReadBubble, { backgroundColor: '#EDF7F1' }]}>
                        <Text variant="bodyMedium" color="text">{partnerEntry.memo}</Text>
                      </View>
                    ) : null}
                    {partnerEntry.coupleQuestionId != null && (
                      <QABlock
                        label="💌"
                        question={COUPLE_QUESTIONS[partnerEntry.coupleQuestionId]?.content ?? ''}
                        answer={partnerEntry.coupleAnswer ?? ''}
                        bgColor="#EDF7F1"
                        emptyText={t('diary:detail.answer-empty')}
                      />
                    )}
                  </>
                ) : (
                  <View style={styles.lockedArea}>
                    <View style={styles.lockedSticker}>
                      <Text style={styles.lockedStickerEmoji}>
                        {hasMyEntry ? '💌' : '🔐'}
                      </Text>
                    </View>
                    <Text
                      variant="headingSmall"
                      color="textSecondary"
                      mt="sm"
                      align="center"
                    >
                      {hasMyEntry
                        ? t('diary:detail.locked.waiting-letter-title')
                        : t('diary:detail.locked.still-locked-title')}
                    </Text>
                    <Text
                      variant="caption"
                      color="textMuted"
                      mt="xs"
                      align="center"
                      style={{ lineHeight: 18 }}
                    >
                      {hasMyEntry
                        ? t('diary:detail.locked.waiting-letter-description')
                        : t('diary:detail.locked.still-locked-description')}
                    </Text>

                    {/* 톡톡 버튼 — 내가 쓰고 연인이 안 썼을 때만 */}
                    {canNudge && (
                      <Pressable
                        style={[styles.nudgeBtn, nudge.isPending && styles.nudgeBtnDisabled]}
                        onPress={handleNudge}
                        disabled={nudge.isPending}
                      >
                        <Text style={styles.nudgeEmoji}>
                          {nudge.isPending ? '...' : '👆'}
                        </Text>
                        <Text variant="label" color="primary" ml="xs">
                          {nudge.isPending
                            ? t('diary:timeline.nudge-sending')
                            : t('diary:timeline.nudge-button')}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </EntrySection>

              <View style={styles.pageFooter}>
                <Text style={styles.pageFooterEmoji}>🐾</Text>
                <Text variant="caption" color="textMuted" ml="xxs">
                  {t('diary:detail.page-footer')}
                </Text>
              </View>
            </View>
          </Box>
        </ScrollView>

        {showForm && (
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
              disabled={isSaving}
            >
              {isSaving ? (
                <Row style={styles.savingRow}>
                  <ActivityIndicator size="small" color={theme.colors.white} />
                  <Text variant="bodyMedium" color="white">
                    {t('diary:create.submitting')}
                  </Text>
                </Row>
              ) : isEditing ? (
                t('diary:detail.save-edit')
              ) : (
                t('diary:detail.save-add')
              )}
            </Button>
          </Box>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Entry Section ──────────────────────────────────────

function EntrySection({
  label,
  color,
  accentBg,
  borderColor,
  children,
}: {
  label: string;
  color: string;
  accentBg: string;
  borderColor: string;
  children: React.ReactNode;
}) {
  const { t } = useTranslation('diary');
  return (
    <View style={styles.entrySection}>
      <View style={[styles.nameTag, { backgroundColor: accentBg, borderColor }]}>
        <Text variant="caption" style={{ color: theme.colors.textMuted }}>
          {t('detail.by')}
        </Text>
        <Text variant="label" style={{ color, marginLeft: SPACING.xxs }}>
          {label}
        </Text>
      </View>
      <View style={[styles.entryContent, { borderLeftColor: borderColor }]}>
        {children}
      </View>
    </View>
  );
}

// ─── Photo Strip ────────────────────────────────────────

function PhotoStrip({ photos }: { photos: string[] }) {
  if (photos.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.photoStrip}
    >
      {photos.map((uri, i) => (
        <View key={i} style={styles.photoFrame}>
          <Image source={{ uri }} style={styles.photoImage} />
        </View>
      ))}
    </ScrollView>
  );
}

// ─── Entry Form ─────────────────────────────────────────

function EntryForm({
  photos,
  diaryAnswer,
  coupleAnswer,
  diaryQuestionContent,
  coupleQuestionContent,
  coupleQuestionEmoji,
  coupleQuestionCategory,
  onAddPhoto,
  onRemovePhoto,
  onChangeDiaryAnswer,
  onChangeCoupleAnswer,
}: {
  photos: string[];
  diaryAnswer: string;
  coupleAnswer: string;
  diaryQuestionContent: string;
  coupleQuestionContent: string;
  coupleQuestionEmoji: string;
  coupleQuestionCategory: string;
  onAddPhoto: () => void;
  onRemovePhoto: (i: number) => void;
  onChangeDiaryAnswer: (t: string) => void;
  onChangeCoupleAnswer: (t: string) => void;
}) {
  const { t } = useTranslation(['diary']);
  return (
    <View style={styles.formArea}>
      {/* 사진 */}
      <Row style={styles.formLabel}>
        <Text style={{ fontSize: 12 }}>📷</Text>
        <Text variant="caption" color="textSecondary" ml="xxs">
          {t('diary:create.photo-label')}
        </Text>
        <Text variant="caption" color="textMuted" style={{ marginLeft: 'auto' }}>
          {photos.length}/5
        </Text>
      </Row>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.formPhotoRow}
      >
        {photos.length < 5 && (
          <Pressable style={styles.photoAddBtn} onPress={onAddPhoto}>
            <Icon name="image-plus" size={20} color={theme.colors.gray400} />
          </Pressable>
        )}
        {photos.map((uri, i) => (
          <View key={i} style={styles.formThumbWrap}>
            <Image source={{ uri }} style={styles.formThumb} />
            <Pressable
              style={styles.formThumbRemove}
              onPress={() => onRemovePhoto(i)}
              hitSlop={4}
            >
              <View style={styles.removeCircle}>
                <Icon name="x" size={8} color={theme.colors.white} />
              </View>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      {/* 📝 다이어리 질문 */}
      <Row style={[styles.formLabel, { marginTop: SPACING.md }]}>
        <Text style={{ fontSize: 12 }}>📝</Text>
        <Text variant="caption" color="textSecondary" ml="xxs">
          {t('diary:detail.form.diary-section')}
        </Text>
      </Row>
      <View style={styles.formQuestionPrompt}>
        <Text variant="bodySmall" color="primary">
          {t('diary:create.diary-prompt-prefix')} {diaryQuestionContent}
        </Text>
      </View>
      <View style={styles.formMemoCard}>
        <TextInput
          style={styles.formMemoInput}
          placeholder={t('diary:detail.form.diary-placeholder')}
          placeholderTextColor={theme.colors.gray400}
          value={diaryAnswer}
          onChangeText={onChangeDiaryAnswer}
          multiline
          textAlignVertical="top"
          cursorColor={theme.colors.primary}
        />
      </View>

      {/* 💌 커플 질문 */}
      <Row style={[styles.formLabel, { marginTop: SPACING.lg }]}>
        <Text style={{ fontSize: 12 }}>💌</Text>
        <Text variant="caption" color="textSecondary" ml="xxs">
          {t('diary:detail.form.couple-section')}
        </Text>
        <View style={styles.formCategoryChip}>
          <Text style={{ fontSize: 10 }}>{coupleQuestionEmoji}</Text>
          <Text variant="caption" color="textMuted" ml="xxs">
            {coupleQuestionCategory}
          </Text>
        </View>
      </Row>
      <View style={styles.formQuestionPrompt}>
        <Text variant="bodySmall" color="primary">
          {t('diary:create.diary-prompt-prefix')} {coupleQuestionContent}
        </Text>
      </View>
      <View style={styles.formMemoCard}>
        <TextInput
          style={styles.formMemoInput}
          placeholder={t('diary:detail.form.couple-placeholder')}
          placeholderTextColor={theme.colors.gray400}
          value={coupleAnswer}
          onChangeText={onChangeCoupleAnswer}
          multiline
          textAlignVertical="top"
          cursorColor={theme.colors.primary}
        />
      </View>
    </View>
  );
}

// ─── Q&A Block ──────────────────────────────────────────

function QABlock({
  label,
  question,
  answer,
  bgColor,
  emptyText,
}: {
  label: string;
  question: string;
  answer: string;
  bgColor: string;
  emptyText: string;
}) {
  return (
    <View style={[styles.qaBlock, { backgroundColor: bgColor }]}>
      <Text variant="caption" color="textMuted">
        {label} Q. {question}
      </Text>
      <Text variant="bodyMedium" color="text" mt="xs">
        {answer || emptyText}
      </Text>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: LAYOUT.headerPy,
  },
  scroll: {
    paddingBottom: LAYOUT.bottomSafe + LAYOUT.sectionGap,
  },
  diaryPage: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    padding: SPACING.lg,
    shadowColor: theme.colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  dateStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primarySurface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
  },
  locationRow: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  dashedDivider: {
    marginVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray300,
    borderStyle: 'dashed',
  },
  entrySection: {
    marginBottom: SPACING.sm,
  },
  nameTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    marginBottom: SPACING.sm,
  },
  entryContent: {
    borderLeftWidth: 2,
    paddingLeft: SPACING.md,
    marginLeft: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  qaBlock: {
    borderRadius: theme.radius.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  memoReadBubble: {
    backgroundColor: theme.colors.surfaceWarm,
    borderRadius: theme.radius.md,
    padding: SPACING.md,
    marginTop: SPACING.xs,
  },
  editChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    backgroundColor: theme.colors.primarySurface,
    borderRadius: theme.radius.sm,
  },
  cancelChip: {
    alignSelf: 'flex-end',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    marginBottom: SPACING.xs,
  },
  photoStrip: {
    gap: SPACING.sm,
  },
  photoFrame: {
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.gray200,
    overflow: 'hidden',
    backgroundColor: theme.colors.gray100,
  },
  photoImage: {
    width: 140,
    height: 140,
    borderRadius: theme.radius.sm,
  },
  lockedArea: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  lockedSticker: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.surfaceWarm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.gray200,
    borderStyle: 'dashed',
  },
  lockedStickerEmoji: {
    fontSize: 22,
  },
  nudgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    backgroundColor: theme.colors.primarySurface,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.primaryLight,
  },
  nudgeBtnDisabled: {
    opacity: 0.6,
  },
  nudgeEmoji: {
    fontSize: 14,
  },
  heartDivider: {
    alignItems: 'center',
    marginVertical: SPACING.xs,
  },
  heartText: {
    fontFamily: FONT_FAMILY.pixel,
    fontSize: 12,
    color: theme.colors.gray300,
    letterSpacing: 4,
  },
  pageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray200,
    borderStyle: 'dashed',
  },
  pageFooterEmoji: {
    fontSize: 14,
  },
  formArea: {
    marginTop: SPACING.xs,
  },
  formLabel: {
    alignItems: 'center',
    gap: SPACING.xxs,
    marginBottom: SPACING.xs,
  },
  formPhotoRow: {
    gap: SPACING.sm,
    paddingVertical: SPACING.xxs,
  },
  photoAddBtn: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.gray400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formThumbWrap: {
    position: 'relative',
  },
  formThumb: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.gray100,
  },
  formThumbRemove: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  removeCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formQuestionPrompt: {
    backgroundColor: theme.colors.primarySurface,
    borderRadius: theme.radius.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  formCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray100,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: theme.radius.sm,
    marginLeft: 'auto',
  },
  formMemoCard: {
    backgroundColor: theme.colors.surfaceWarm,
    borderRadius: theme.radius.md,
    padding: SPACING.md,
    minHeight: 100,
  },
  formMemoInput: {
    fontSize: SPACING.lg - 1,
    fontFamily: FONT_FAMILY.pixel,
    lineHeight: 22,
    color: theme.colors.text,
    flex: 1,
  },
  bottomBar: {
    paddingTop: LAYOUT.headerPy,
    borderTopWidth: 2,
    borderTopColor: theme.colors.border,
  },
  savingRow: {
    alignItems: 'center',
    gap: LAYOUT.itemGap,
  },
});
