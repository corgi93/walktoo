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

import { Box, Button, Icon, PixelCard, Row, Text } from '@/components/base';
import {
  COUPLE_QUESTIONS,
  DIARY_QUESTIONS,
  getDailyQuestions,
} from '@/constants/questions';
import {
  useAddEntryMutation,
  useUpdateEntryMutation,
} from '@/hooks/services/diary/mutation';
import { useGetCoupleQuery } from '@/hooks/services/couple/query';
import { useDialogStore } from '@/stores/dialogStore';
import { theme } from '@/styles/theme';
import { FONT_FAMILY, LAYOUT, SPACING } from '@/styles/type';
import { FootprintEntry } from '@/types/diary';

// ─── Component ──────────────────────────────────────────

export default function DiaryDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dialog = useDialogStore();
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
  const hasPartnerEntry = !!partnerEntry;

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
  const isSaving = addEntry.isPending || updateEntry.isPending;

  const formattedDate = params.date
    ? new Date(params.date).toLocaleDateString('ko-KR', {
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

  const handleCancelEdit = () => setIsEditing(false);

  const handleAddPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      dialog.alert('권한 필요', '사진을 업로드하려면 갤러리 접근 권한이 필요해요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 5 - photos.length,
      quality: 0.8,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setPhotos((prev) => [...prev, ...uris].slice(0, 5));
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
          onError: (e) => dialog.alert('수정 실패', e.message || '다시 시도해주세요.'),
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
          onError: (e) => dialog.alert('저장 실패', e.message || '다시 시도해주세요.'),
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
          산책 일기
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
          {/* ══════════════════════════════════════════════════
              다이어리 페이지 — 노트 스타일
             ══════════════════════════════════════════════════ */}
          <Box px="xxl">
            <View style={styles.diaryPage}>
              {/* 날짜 스탬프 */}
              <View style={styles.dateStamp}>
                <Icon name="calendar" size={13} color={theme.colors.primary} />
                <Text variant="caption" color="primary" ml="xxs">
                  {formattedDate}
                </Text>
              </View>

              {/* 장소 */}
              <Row style={styles.locationRow}>
                <Icon name="map-pin" size={18} color={theme.colors.primary} />
                <Text variant="headingLarge" ml="xs">
                  {params.locationName}
                </Text>
              </Row>

              {/* 점선 구분 */}
              <View style={styles.dashedDivider} />

              {/* ── 내 기록 ── */}
              <EntrySection
                label={myEntry?.nickname ?? '나'}
                color={theme.colors.primary}
                accentBg={theme.colors.primarySurface}
                borderColor={theme.colors.primaryLight}
              >
                {hasMyEntry && !isEditing ? (
                  /* 읽기 모드 */
                  <>
                    {myEntry.photos.length > 0 && (
                      <PhotoStrip photos={myEntry.photos} />
                    )}
                    {/* 다이어리 질문 Q&A */}
                    {myEntry.diaryQuestionId != null ? (
                      <QABlock
                        label="📝"
                        question={DIARY_QUESTIONS[myEntry.diaryQuestionId]?.content ?? ''}
                        answer={myEntry.diaryAnswer ?? ''}
                        bgColor={theme.colors.surfaceWarm}
                      />
                    ) : myEntry.memo ? (
                      <View style={styles.memoReadBubble}>
                        <Text variant="bodyMedium" color="text">{myEntry.memo}</Text>
                      </View>
                    ) : null}
                    {/* 커플 질문 Q&A */}
                    {myEntry.coupleQuestionId != null && (
                      <QABlock
                        label="💌"
                        question={COUPLE_QUESTIONS[myEntry.coupleQuestionId]?.content ?? ''}
                        answer={myEntry.coupleAnswer ?? ''}
                        bgColor={theme.colors.primarySurface}
                      />
                    )}
                    <Pressable
                      style={styles.editChip}
                      onPress={handleStartEdit}
                      hitSlop={8}
                    >
                      <Icon name="edit" size={12} color={theme.colors.primary} />
                      <Text variant="caption" color="primary" ml="xxs">
                        수정하기
                      </Text>
                    </Pressable>
                  </>
                ) : showForm ? (
                  /* 입력/수정 폼 */
                  <>
                    {isEditing && (
                      <Pressable
                        onPress={handleCancelEdit}
                        style={styles.cancelChip}
                        hitSlop={8}
                      >
                        <Text variant="caption" color="textMuted">
                          취소
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

              {/* 작은 장식 */}
              <View style={styles.heartDivider}>
                <Text style={styles.heartText}>{'~ ~ ~'}</Text>
              </View>

              {/* ── 연인 기록 ── */}
              <EntrySection
                label={partnerEntry?.nickname ?? '연인'}
                color="#6A9E85"
                accentBg="#EDF7F1"
                borderColor="#C5E4D2"
              >
                {isRevealed && partnerEntry ? (
                  /* 공개됨 */
                  <>
                    {partnerEntry.photos.length > 0 && (
                      <PhotoStrip photos={partnerEntry.photos} />
                    )}
                    {/* 다이어리 질문 Q&A */}
                    {partnerEntry.diaryQuestionId != null ? (
                      <QABlock
                        label="📝"
                        question={DIARY_QUESTIONS[partnerEntry.diaryQuestionId]?.content ?? ''}
                        answer={partnerEntry.diaryAnswer ?? ''}
                        bgColor="#EDF7F1"
                      />
                    ) : partnerEntry.memo ? (
                      <View style={[styles.memoReadBubble, { backgroundColor: '#EDF7F1' }]}>
                        <Text variant="bodyMedium" color="text">{partnerEntry.memo}</Text>
                      </View>
                    ) : null}
                    {/* 커플 질문 Q&A */}
                    {partnerEntry.coupleQuestionId != null && (
                      <QABlock
                        label="💌"
                        question={COUPLE_QUESTIONS[partnerEntry.coupleQuestionId]?.content ?? ''}
                        answer={partnerEntry.coupleAnswer ?? ''}
                        bgColor="#EDF7F1"
                      />
                    )}
                  </>
                ) : (
                  /* 잠금 상태 */
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
                        ? '비밀 편지가 도착할 거예요'
                        : '아직 잠겨있어요'}
                    </Text>
                    <Text
                      variant="caption"
                      color="textMuted"
                      mt="xs"
                      align="center"
                      style={{ lineHeight: 18 }}
                    >
                      {hasMyEntry
                        ? '연인이 기록하면 함께 열어볼 수 있어요'
                        : '나도 기록을 남기면 서로의 하루가 열려요'}
                    </Text>
                  </View>
                )}
              </EntrySection>

              {/* 하단 장식 */}
              <View style={styles.pageFooter}>
                <Text style={styles.pageFooterEmoji}>🐾</Text>
                <Text variant="caption" color="textMuted" ml="xxs">
                  우리의 발자국
                </Text>
              </View>
            </View>
          </Box>
        </ScrollView>

        {/* ── 하단 저장 버튼 ── */}
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
                    저장 중...
                  </Text>
                </Row>
              ) : isEditing ? (
                '수정 완료'
              ) : (
                '나의 기록 남기기'
              )}
            </Button>
          </Box>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Entry Section (각 사람의 영역) ─────────────────────

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
  return (
    <View style={styles.entrySection}>
      {/* 이름 태그 */}
      <View style={[styles.nameTag, { backgroundColor: accentBg, borderColor }]}>
        <Text variant="caption" style={{ color: theme.colors.textMuted }}>
          by.
        </Text>
        <Text
          variant="label"
          style={{ color, marginLeft: SPACING.xxs }}
        >
          {label}
        </Text>
      </View>
      {/* 내용 영역 */}
      <View style={[styles.entryContent, { borderLeftColor: borderColor }]}>
        {children}
      </View>
    </View>
  );
}

// ─── Photo Strip (사진 가로 스크롤) ─────────────────────

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

// ─── Entry Form (입력/수정 폼) ──────────────────────────

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
  return (
    <View style={styles.formArea}>
      {/* 사진 */}
      <Row style={styles.formLabel}>
        <Text style={{ fontSize: 12 }}>📷</Text>
        <Text variant="caption" color="textSecondary" ml="xxs">
          사진
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
          오늘의 다이어리
        </Text>
      </Row>
      <View style={styles.formQuestionPrompt}>
        <Text variant="bodySmall" color="primary">
          Q. {diaryQuestionContent}
        </Text>
      </View>
      <View style={styles.formMemoCard}>
        <TextInput
          style={styles.formMemoInput}
          placeholder="오늘의 이야기를 적어봐 :)"
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
          오늘의 질문
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
          Q. {coupleQuestionContent}
        </Text>
      </View>
      <View style={styles.formMemoCard}>
        <TextInput
          style={styles.formMemoInput}
          placeholder="솔직하게 적어봐, 연인만 볼 수 있어"
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

// ─── Q&A Block (읽기 모드) ──────────────────────────────

function QABlock({
  label,
  question,
  answer,
  bgColor,
}: {
  label: string;
  question: string;
  answer: string;
  bgColor: string;
}) {
  return (
    <View style={[styles.qaBlock, { backgroundColor: bgColor }]}>
      <Text variant="caption" color="textMuted">
        {label} Q. {question}
      </Text>
      <Text variant="bodyMedium" color="text" mt="xs">
        {answer || '(아직 답변이 없어요)'}
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

  /* ── 다이어리 페이지 ── */
  diaryPage: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    padding: SPACING.lg,
    // 픽셀 솔리드 그림자
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

  /* ── Entry Section ── */
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

  /* ── Q&A 블록 ── */
  qaBlock: {
    borderRadius: theme.radius.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },

  /* ── 읽기 모드 ── */
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

  /* ── 사진 스트립 ── */
  photoStrip: {
    gap: SPACING.sm,
  },
  photoFrame: {
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.gray200,
    overflow: 'hidden',
    // 테이프 스티커 느낌
    backgroundColor: theme.colors.gray100,
  },
  photoImage: {
    width: 140,
    height: 140,
    borderRadius: theme.radius.sm,
  },

  /* ── 잠금 영역 ── */
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

  /* ── 하트 구분선 ── */
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

  /* ── 페이지 하단 장식 ── */
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

  /* ── 입력 폼 ── */
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

  /* ── 하단 저장 ── */
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
