import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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

import { Box, Icon, Row, Text } from '@/components/base';
import {
  EachPhotoStrip,
  PhotoPage,
  ScrapbookByTag,
  ScrapbookDateBanner,
  ScrapbookLockedEntry,
  ScrapbookSaveButton,
  ThemeBg,
  ThemePicker,
  ThemedDiaryCard,
  ThemedHandwriteInput,
} from '@/components/feature/diary/scrapbook';
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
import { useDiaryTheme } from '@/hooks/useDiaryTheme';
import type { DiaryTheme } from '@/styles/diaryThemes';
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
  const params = useLocalSearchParams<{
    id: string;
    date: string;
    locationName: string;
    kind: string;
    isRevealed: string;
    myEntry: string;
    partnerEntry: string;
  }>();

  const walkKind: 'together' | 'each' =
    params.kind === 'each' ? 'each' : 'together';

  // 사진 한도 — 오늘의 나(each)는 1장, 우리의 하루는 4장
  const photoLimit =
    walkKind === 'each'
      ? 1
      : isEntitled
        ? PREMIUM.PHOTO_LIMIT_PREMIUM
        : PREMIUM.PHOTO_LIMIT_FREE;

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

  // ─── 다꾸 테마 ────────────────────────────────────────
  const { theme: dt, themeId, setTheme } = useDiaryTheme();
  const [pickerOpen, setPickerOpen] = useState(false);

  // ─── 수정/입력 모드 ───────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [memo, setMemo] = useState(myEntry?.memo ?? '');
  const [photos, setPhotos] = useState<string[]>(myEntry?.photos ?? []);
  const [diaryAnswer, setDiaryAnswer] = useState(myEntry?.diaryAnswer ?? '');
  const [coupleAnswer, setCoupleAnswer] = useState(myEntry?.coupleAnswer ?? '');
  const [myLocationName, setMyLocationName] = useState(
    myEntry?.locationName ?? '',
  );

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
    setMyLocationName(myEntry?.locationName ?? '');
    setIsEditing(true);
  };
  void memo; // memo 상태는 폼 초기화에 사용 (편집 시 photos/answers와 같이 reset)

  const handleCancelEdit = () => setIsEditing(false);

  const handleAddPhoto = async () => {
    if (photos.length >= photoLimit) {
      // 한도 도달 — each kind(1장)는 이미 채움, together(4장)도 가득
      dialog.alert('', `사진은 ${photoLimit}장까지만 첨부할 수 있어요`);
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
          ...(walkKind === 'each' && {
            locationName: myLocationName.trim(),
          }),
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
          ...(walkKind === 'each' && {
            locationName: myLocationName.trim(),
          }),
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
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: dt.bg },
      ]}
    >
      <ThemeBg theme={dt} />
      {/* ── 헤더 ── 다크 테마(다크 아카데미아 등)에서는 ink가 검정에 가까워 안보이므로 paper(밝은색)로 반전 */}
      <Row px="xxl" style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Icon
            name="arrow-left"
            size={22}
            color={dt.isDark ? dt.paper : dt.ink}
          />
        </Pressable>
        <Text
          variant="headingMedium"
          ml="md"
          style={{
            color: dt.isDark ? dt.paper : dt.ink,
            fontFamily: dt.titleFont,
            fontWeight: '700',
            fontStyle:
              dt.titleMode === 'italic' ||
              dt.titleMode === 'serif' ||
              dt.titleMode === 'dark'
                ? 'italic'
                : 'normal',
          }}
        >
          {t('diary:detail.title')}
        </Text>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => setPickerOpen(true)}
          hitSlop={8}
          style={[
            styles.themeBtn,
            { backgroundColor: dt.paper, borderColor: dt.line },
          ]}
        >
          <Text style={[styles.themeBtnEmoji, { color: dt.ink }]}>
            {dt.emoji}
          </Text>
          <Text
            variant="caption"
            style={{ color: dt.ink, fontWeight: '600' }}
          >
            테마
          </Text>
        </Pressable>
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
            {/* 디자인의 DiaryPage 형태 — rounded 카드 wrapper 없이 ThemeBg 위에 직접 콘텐츠 */}
            <View style={styles.diaryPage}>
              <View style={styles.dateBannerWrap}>
                <ScrapbookDateBanner
                  theme={dt}
                  date={formattedDate}
                  place={
                    walkKind === 'together'
                      ? params.locationName
                      : [myEntry?.locationName, partnerEntry?.locationName]
                          .filter(Boolean)
                          .join(' · ') || t('common:labels.each-day')
                  }
                />
              </View>

              {/* ── 사진 영역 ── */}
              {/* each(오늘의 나): 1~2장 가벼운 strip / together(우리의 하루): 4슬롯 다꾸 */}
              {walkKind === 'each' ? (
                <EachPhotoStrip
                  theme={dt}
                  myPhoto={
                    isEditing ? photos[0] : myEntry?.photos?.[0]
                  }
                  partnerPhoto={partnerEntry?.photos?.[0]}
                  editable={isEditing}
                  onAddMyPhoto={handleAddPhoto}
                  onRemoveMyPhoto={() => handleRemovePhoto(0)}
                  stampDate={params.date?.replace(/-/g, '·').slice(2) ?? ''}
                />
              ) : !isEditing ? (
                <PhotoPage
                  theme={dt}
                  photos={[
                    ...(myEntry?.photos ?? []),
                    ...(partnerEntry?.photos ?? []),
                  ].slice(0, PREMIUM.PHOTO_LIMIT_FREE)}
                  quoteSeed={params.date}
                />
              ) : (
                <PhotoPage
                  theme={dt}
                  photos={photos}
                  editable
                  onAddPhoto={() => handleAddPhoto()}
                  onRemovePhoto={(slotIdx) => handleRemovePhoto(slotIdx)}
                  quoteSeed={params.date}
                />
              )}

              {/* ── 내 기록 ── */}
              <EntrySection
                label={myEntry?.nickname ?? t('common:labels.me')}
                colorKey="accent"
                dt={dt}
              >
                {hasMyEntry && !isEditing ? (
                  <>
                    {myEntry.diaryQuestionId != null ? (
                      <ThemedDiaryCard
                        theme={dt}
                        title="오늘의 다이어리"
                        question={DIARY_QUESTIONS[myEntry.diaryQuestionId]?.content ?? ''}
                        rotate={0.6}
                        style={{ marginTop: SPACING.md }}
                      >
                        <ReadAnswer
                          dt={dt}
                          answer={myEntry.diaryAnswer ?? ''}
                          empty={t('diary:detail.answer-empty')}
                        />
                      </ThemedDiaryCard>
                    ) : myEntry.memo ? (
                      <ThemedDiaryCard
                        theme={dt}
                        title="오늘의 한 줄"
                        question="—"
                        rotate={0.6}
                        style={{ marginTop: SPACING.md }}
                      >
                        <ReadAnswer dt={dt} answer={myEntry.memo} empty="" />
                      </ThemedDiaryCard>
                    ) : null}
                    {/* 커플 Q&A — 우리의 하루(together)에서만. 오늘의 나(each)는 폼에도 없으니 읽기에서도 숨김 */}
                    {walkKind === 'together' &&
                      myEntry.coupleQuestionId != null && (
                        <ThemedDiaryCard
                          theme={dt}
                          title="오늘의 질문"
                          badge="🔥 은밀한"
                          question={COUPLE_QUESTIONS[myEntry.coupleQuestionId]?.content ?? ''}
                          rotate={-0.8}
                          style={{ marginTop: SPACING.md }}
                        >
                          <ReadAnswer
                            dt={dt}
                            answer={myEntry.coupleAnswer ?? ''}
                            empty={t('diary:detail.answer-empty')}
                          />
                        </ThemedDiaryCard>
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
                      locationName={
                        walkKind === 'each' ? myLocationName : undefined
                      }
                      walkKind={walkKind}
                      onChangeLocationName={
                        walkKind === 'each' ? setMyLocationName : undefined
                      }
                      onAddPhoto={handleAddPhoto}
                      onRemovePhoto={handleRemovePhoto}
                      onChangeDiaryAnswer={setDiaryAnswer}
                      onChangeCoupleAnswer={setCoupleAnswer}
                      dt={dt}
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
                colorKey="accentDeep"
                dt={dt}
              >
                {isRevealed && partnerEntry ? (
                  <>
                    {partnerEntry.diaryQuestionId != null ? (
                      <ThemedDiaryCard
                        theme={dt}
                        title="연인의 다이어리"
                        question={DIARY_QUESTIONS[partnerEntry.diaryQuestionId]?.content ?? ''}
                        rotate={-0.5}
                        style={{ marginTop: SPACING.md }}
                      >
                        <ReadAnswer
                          dt={dt}
                          answer={partnerEntry.diaryAnswer ?? ''}
                          empty={t('diary:detail.answer-empty')}
                        />
                      </ThemedDiaryCard>
                    ) : partnerEntry.memo ? (
                      <ThemedDiaryCard
                        theme={dt}
                        title="연인의 한 줄"
                        question="—"
                        rotate={-0.5}
                        style={{ marginTop: SPACING.md }}
                      >
                        <ReadAnswer dt={dt} answer={partnerEntry.memo} empty="" />
                      </ThemedDiaryCard>
                    ) : null}
                    {/* 커플 Q&A — 우리의 하루(together)에서만 */}
                    {walkKind === 'together' &&
                      partnerEntry.coupleQuestionId != null && (
                      <ThemedDiaryCard
                        theme={dt}
                        title="연인의 답"
                        badge="💌"
                        question={COUPLE_QUESTIONS[partnerEntry.coupleQuestionId]?.content ?? ''}
                        rotate={0.7}
                        style={{ marginTop: SPACING.md }}
                      >
                        <ReadAnswer
                          dt={dt}
                          answer={partnerEntry.coupleAnswer ?? ''}
                          empty={t('diary:detail.answer-empty')}
                        />
                      </ThemedDiaryCard>
                    )}
                  </>
                ) : (
                  <ScrapbookLockedEntry
                    theme={dt}
                    partnerName={
                      partnerEntry?.nickname ?? t('common:labels.lover')
                    }
                    title={
                      hasMyEntry
                        ? t('diary:detail.locked.waiting-letter-title')
                        : t('diary:detail.locked.still-locked-title')
                    }
                    description={
                      hasMyEntry
                        ? t('diary:detail.locked.waiting-letter-description')
                        : t('diary:detail.locked.still-locked-description')
                    }
                    iconEmoji={hasMyEntry ? '💌' : '🔐'}
                    nudgeLabel={
                      canNudge
                        ? nudge.isPending
                          ? t('diary:timeline.nudge-sending')
                          : t('diary:timeline.nudge-button')
                        : undefined
                    }
                    onNudge={canNudge ? handleNudge : undefined}
                    nudgeDisabled={nudge.isPending}
                  />
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
              {
                paddingBottom: insets.bottom + LAYOUT.headerPy,
                backgroundColor: dt.bg,
                borderTopColor: dt.line,
              },
            ]}
          >
            <ScrapbookSaveButton
              theme={dt}
              label={
                isEditing
                  ? t('diary:detail.save-edit')
                  : t('diary:detail.save-add')
              }
              loading={isSaving}
              loadingLabel={t('diary:create.submitting')}
              onPress={handleSave}
              disabled={isSaving}
            />
          </Box>
        )}
      </KeyboardAvoidingView>

      <ThemePicker
        open={pickerOpen}
        currentId={themeId}
        onPick={(id) => {
          setTheme(id);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}

// ─── Entry Section ──────────────────────────────────────

function EntrySection({
  label,
  colorKey,
  dt,
  children,
}: {
  label: string;
  colorKey: 'accent' | 'accentDeep';
  dt: DiaryTheme;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.entrySection}>
      <ScrapbookByTag
        theme={dt}
        prefix="by."
        name={label}
        colorKey={colorKey}
        style={{ marginBottom: SPACING.sm }}
      />
      {children}
    </View>
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
  locationName,
  walkKind,
  onChangeLocationName,
  onAddPhoto,
  onRemovePhoto,
  onChangeDiaryAnswer,
  onChangeCoupleAnswer,
  dt,
}: {
  photos: string[];
  diaryAnswer: string;
  coupleAnswer: string;
  diaryQuestionContent: string;
  coupleQuestionContent: string;
  coupleQuestionEmoji: string;
  coupleQuestionCategory: string;
  /** kind='each'일 때만 전달 — 내 장소 입력 */
  locationName?: string;
  /** 산책 종류 — each면 다이어리 Q 없이 freeform + 커플 Q 숨김 */
  walkKind: 'each' | 'together';
  onChangeLocationName?: (t: string) => void;
  onAddPhoto: () => void;
  onRemovePhoto: (i: number) => void;
  onChangeDiaryAnswer: (t: string) => void;
  onChangeCoupleAnswer: (t: string) => void;
  dt: DiaryTheme;
}) {
  const { t } = useTranslation(['diary']);
  const showLocationInput = locationName !== undefined && onChangeLocationName;
  return (
    <View style={styles.formArea}>
      {showLocationInput && (
        <>
          <Row style={styles.formLabel}>
            <Icon name="map-pin" size={12} color={theme.colors.gray600} />
            <Text variant="caption" color="textSecondary" ml="xxs">
              {t('diary:create.location-label-each')}
            </Text>
          </Row>
          <View style={[styles.formLocationInputWrap]}>
            <TextInput
              style={styles.formLocationInput}
              placeholder={t('diary:create.location-placeholder-each')}
              placeholderTextColor={theme.colors.gray400}
              value={locationName}
              onChangeText={onChangeLocationName}
              cursorColor={theme.colors.primary}
            />
          </View>
        </>
      )}
      {/* 📷 사진은 상단 PhotoPage에서 직접 편집 — 폼에는 카운트 라벨만 */}
      <Row style={[styles.formLabel, { marginTop: SPACING.xs }]}>
        <Text style={{ fontSize: 12 }}>📷</Text>
        <Text
          variant="caption"
          ml="xxs"
          style={{
            color: dt.inkSoft,
            fontFamily: dt.bodyFont,
            fontWeight: dt.bodyWeight,
          }}
        >
          {t('diary:create.photo-label')}
        </Text>
        <Text
          variant="caption"
          style={{
            marginLeft: 'auto',
            color: dt.inkSoft,
            fontFamily: dt.monoFont,
          }}
        >
          {photos.length}/{walkKind === 'each' ? 1 : PREMIUM.PHOTO_LIMIT_FREE}
        </Text>
      </Row>

      {/* 📝 다이어리 질문 — each면 Q 카드 숨기고 freeform memo만 */}
      <Row style={[styles.formLabel, { marginTop: SPACING.md }]}>
        <Text style={{ fontSize: 12 }}>📝</Text>
        <Text variant="caption" color="textSecondary" ml="xxs">
          {walkKind === 'each' ? '오늘의 한 줄' : t('diary:detail.form.diary-section')}
        </Text>
      </Row>
      {walkKind === 'together' && (
        <View
          style={[
            styles.formQuestionPrompt,
            {
              backgroundColor: dt.tints[0],
              borderLeftColor: dt.accent,
            },
          ]}
        >
          <Text
            variant="bodySmall"
            style={{
              color: dt.accentDeep,
              fontFamily: dt.bodyFont,
              fontWeight: dt.bodyWeight,
            }}
          >
            {t('diary:create.diary-prompt-prefix')} {diaryQuestionContent}
          </Text>
        </View>
      )}
      <View
        style={[
          styles.formMemoCard,
          { backgroundColor: dt.tints[3] },
        ]}
      >
        <ThemedHandwriteInput
          theme={dt}
          value={diaryAnswer}
          onChangeText={onChangeDiaryAnswer}
          placeholder={
            walkKind === 'each'
              ? '오늘 너에게 들려주고 싶은 한 마디 ✿'
              : t('diary:detail.form.diary-placeholder')
          }
          minLines={walkKind === 'each' ? 2 : 3}
        />
      </View>

      {/* 💌 커플 질문 — '우리의 하루'(together)에서만 노출 */}
      {walkKind === 'together' && (
        <>
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
          <View
            style={[
              styles.formQuestionPrompt,
              {
                backgroundColor: dt.tints[0],
                borderLeftColor: dt.accent,
              },
            ]}
          >
            <Text
              variant="bodySmall"
              style={{
                color: dt.accentDeep,
                fontFamily: dt.bodyFont,
                fontWeight: dt.bodyWeight,
              }}
            >
              {t('diary:create.diary-prompt-prefix')} {coupleQuestionContent}
            </Text>
          </View>
          <View
            style={[
              styles.formMemoCard,
              { backgroundColor: dt.tints[2] },
            ]}
          >
            <ThemedHandwriteInput
              theme={dt}
              value={coupleAnswer}
              onChangeText={onChangeCoupleAnswer}
              placeholder={t('diary:detail.form.couple-placeholder')}
              minLines={3}
            />
          </View>
        </>
      )}
    </View>
  );
}

// ─── Q&A Block ──────────────────────────────────────────

function ReadAnswer({
  dt,
  answer,
  empty,
}: {
  dt: DiaryTheme;
  answer: string;
  empty: string;
}) {
  return (
    <Text
      style={{
        color: answer ? dt.ink : dt.inkSoft,
        fontFamily: dt.handFont,
        fontWeight: dt.handWeight,
        fontSize: 16,
        lineHeight: 24,
      }}
    >
      {answer || empty}
    </Text>
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
  themeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
  },
  themeBtnEmoji: {
    fontSize: 13,
  },
  dateBannerWrap: {
    marginVertical: SPACING.lg,
  },
  scroll: {
    paddingBottom: LAYOUT.bottomSafe + LAYOUT.sectionGap,
  },
  // rounded 카드 wrapper 제거 — ThemeBg가 그대로 비치게 plain 컨테이너만
  diaryPage: {
    paddingVertical: SPACING.sm,
  },
  entrySection: {
    marginBottom: SPACING.sm,
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
  formLocationInputWrap: {
    backgroundColor: theme.colors.surfaceWarm,
    borderRadius: theme.radius.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    marginBottom: SPACING.md,
  },
  formLocationInput: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.pixel,
    color: theme.colors.text,
    padding: 0,
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
  bottomBar: {
    paddingTop: LAYOUT.headerPy,
    borderTopWidth: 2,
    borderTopColor: theme.colors.border,
  },
});
