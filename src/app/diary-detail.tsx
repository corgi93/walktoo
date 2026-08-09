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
  useDeleteDiaryMutation,
  useUpdateEntryMutation,
} from '@/hooks/services/diary/mutation';
import { useDiaryDetailQuery } from '@/hooks/services/diary/query';
import { useNudgeMutation } from '@/hooks/services/notification/mutation';
import { useGetCoupleQuery } from '@/hooks/services/couple/query';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import { useToast } from '@/components/composite/toast/ToastProvider';
import { useEntitlement } from '@/hooks/useEntitlement';
import { useKeyboardBottomInset } from '@/hooks/useKeyboardBottomInset';
import { PREMIUM } from '@/constants/premium';
import { useDialogStore } from '@/stores/dialogStore';
import { useDiaryTheme } from '@/hooks/useDiaryTheme';
import { useThemePack } from '@/hooks/useThemePack';
import { useRevealUpgradeNudge } from '@/hooks/useRevealUpgradeNudge';
import {
  DEFAULT_DIARY_THEME_ID,
  type DiaryTheme,
} from '@/styles/diaryThemes';
import { theme } from '@/styles/theme';
import { FONT_FAMILY, LAYOUT, SPACING } from '@/styles/type';
import { FootprintEntry } from '@/types/diary';
import { formatDate, parseLocalDate } from '@/utils/date';
import {
  getLocalFileSize,
  isVideoUri,
  MAX_SHORT_VIDEO_BYTES,
  MAX_VIDEOS_PER_ENTRY,
} from '@/utils/media';

// ─── Component ──────────────────────────────────────────

function parseEntryParam(value?: string): FootprintEntry | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as FootprintEntry;
  } catch {
    return undefined;
  }
}

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

  const walkId = params.id;
  const { data: walkDetail } = useDiaryDetailQuery(walkId);
  const routeMyEntry = parseEntryParam(params.myEntry);
  const routePartnerEntry = parseEntryParam(params.partnerEntry);
  const walkKind: 'together' | 'each' =
    walkDetail?.kind ?? (params.kind === 'each' ? 'each' : 'together');
  const walkDate = walkDetail?.date ?? params.date ?? '';
  const walkLocationName = walkDetail?.locationName ?? params.locationName ?? '';

  // 사진 한도 — 각자(each)는 1인당 2장, 우리의 하루는 4~8장
  const photoLimit =
    walkKind === 'each'
      ? 2
      : isEntitled
        ? PREMIUM.PHOTO_LIMIT_PREMIUM
        : PREMIUM.PHOTO_LIMIT_FREE;
  const videoDurationLimitSeconds = isEntitled
    ? PREMIUM.VIDEO_DURATION_PREMIUM_SECONDS
    : PREMIUM.VIDEO_DURATION_FREE_SECONDS;
  const videoDurationLimitMs = videoDurationLimitSeconds * 1000;

  const isRevealed = walkDetail?.isRevealed ?? params.isRevealed === 'true';
  const myEntry: FootprintEntry | undefined = walkDetail?.myEntry ?? routeMyEntry;
  const partnerEntry: FootprintEntry | undefined =
    walkDetail?.partnerEntry ?? routePartnerEntry;

  const hasMyEntry = !!myEntry;

  // 질문 데이터
  const { data: couple } = useGetCoupleQuery();
  const { diaryQuestion, coupleQuestion } = getDailyQuestions(
    couple?.firstMetDate,
    walkDate,
  );

  // ─── 다꾸 테마 ────────────────────────────────────────
  const { theme: dt, themeId, setTheme } = useDiaryTheme();
  const { guardSaveWithTheme } = useThemePack();
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
  const maybeShowRevealNudge = useRevealUpgradeNudge();
  const updateEntry = useUpdateEntryMutation();
  const deleteDiary = useDeleteDiaryMutation();
  const nudge = useNudgeMutation();
  const toast = useToast();
  const { partnerId, couple: coupleData } = usePartnerDerivation();
  const isSaving = addEntry.isPending || updateEntry.isPending;

  const handleDelete = () => {
    if (deleteDiary.isPending) return;
    dialog.confirm(
      t('diary:delete.confirm-title'),
      t('diary:delete.confirm-message'),
      () => {
        deleteDiary.mutate(walkId, {
          onSuccess: () => {
            toast.success(t('diary:delete.success'));
            router.back();
          },
          onError: () => toast.error(t('diary:delete.failed')),
        });
      },
      t('diary:delete.confirm-button'),
    );
  };

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

  const formattedDate = walkDate
    ? formatDate(parseLocalDate(walkDate), {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      })
    : '';

  React.useEffect(() => {
    if (isEditing) return;
    setMemo(myEntry?.memo ?? '');
    setPhotos(myEntry?.photos ?? []);
    setDiaryAnswer(myEntry?.diaryAnswer ?? '');
    setCoupleAnswer(myEntry?.coupleAnswer ?? '');
    setMyLocationName(myEntry?.locationName ?? '');
  }, [isEditing, myEntry]);

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
      if (walkKind === 'together' && !isEntitled) {
        dialog.showDialog({
          title: '오늘 기록을 더 풍성하게',
          message: `기본은 ${PREMIUM.PHOTO_LIMIT_FREE}장까지 무료예요. 커플 패스가 있으면 이 기록에 ${PREMIUM.PHOTO_LIMIT_PREMIUM}장까지 담을 수 있어요.`,
          buttons: [
            { label: '나중에', variant: 'cancel' },
            {
              label: '커플 패스 보기',
              variant: 'primary',
              onPress: () => router.push('/paywall'),
            },
          ],
        });
      } else {
        dialog.alert('', `사진은 ${photoLimit}장까지만 첨부할 수 있어요`);
      }
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
      mediaTypes: walkKind === 'each' ? ['images', 'videos'] : ['images'],
      allowsMultipleSelection: true,
      selectionLimit: photoLimit - photos.length,
      quality: 0.8,
      videoMaxDuration: videoDurationLimitSeconds,
    });
    if (!result.canceled) {
      const validAssets = result.assets.filter((asset) => {
        if (asset.type !== 'video') return true;
        return !asset.duration || asset.duration <= videoDurationLimitMs;
      });
      if (validAssets.length < result.assets.length) {
        dialog.alert(
          '',
          t('diary:create.video-too-long', {
            seconds: videoDurationLimitSeconds,
          }),
        );
      }
      const sizeCheckedAssets = [];
      for (const asset of validAssets) {
        if (asset.type !== 'video') {
          sizeCheckedAssets.push(asset);
          continue;
        }
        const size = asset.fileSize ?? (await getLocalFileSize(asset.uri));
        if (size && size > MAX_SHORT_VIDEO_BYTES) {
          dialog.alert('', t('diary:create.video-too-large'));
          continue;
        }
        sizeCheckedAssets.push(asset);
      }

      // 엔트리당 영상 1개 한도 — 이미 담긴 영상 + 새로 고른 영상 합산 (보관 비용 상한)
      let videoBudget = MAX_VIDEOS_PER_ENTRY - photos.filter(isVideoUri).length;
      let droppedVideo = false;
      const cappedAssets = sizeCheckedAssets.filter((asset) => {
        if (asset.type !== 'video') return true;
        if (videoBudget <= 0) {
          droppedVideo = true;
          return false;
        }
        videoBudget -= 1;
        return true;
      });
      if (droppedVideo) {
        dialog.alert(
          '',
          t('diary:create.video-limit', { count: MAX_VIDEOS_PER_ENTRY }),
        );
      }

      const uris = cappedAssets.map((a) => a.uri);
      setPhotos((prev) => [...prev, ...uris].slice(0, photoLimit));
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const proceed = () => {
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
            onSuccess: () => {
              router.back();
              // 둘 다 완성 → reveal 순간. free 사용자에게 가볍게 커플 패스 제안.
              maybeShowRevealNudge();
            },
            onError: (e) =>
              dialog.alert(
                t('diary:detail.form.save-failed-title'),
                e.message || t('diary:detail.form.save-retry'),
              ),
          },
        );
      }
    };

    // 잠긴 테마를 미리보기 중이면 저장 시점에 결제/무료저장 유도 (추억 저장은 안 막음)
    guardSaveWithTheme(themeId, {
      onProceed: proceed,
      onRevertToFree: () => setTheme(DEFAULT_DIARY_THEME_ID),
    });
  };

  const showForm = !hasMyEntry || isEditing;
  const keyboardBottomInset = useKeyboardBottomInset(
    showForm ? SPACING.xxxl : 0,
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: dt.bg },
      ]}
    >
      {/* 배경 텍스처/패턴 — 화면 전체에 absoluteFill로 깔림 (헤더·safe area 포함) */}
      <ThemeBg theme={dt} />

      {/* ── 헤더 ── 다크 테마에서는 ink가 배경에 묻히므로 paper(밝은색)로 반전 */}
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
            fontWeight: '700',
          }}
        >
          {t('diary:detail.title')}
        </Text>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={handleDelete}
          hitSlop={8}
          disabled={deleteDiary.isPending}
          style={styles.deleteBtn}
        >
          <Icon name="trash" size={18} color={dt.isDark ? dt.paper : dt.ink} />
        </Pressable>
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
        style={styles.keyboardAvoider}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroller}
          contentContainerStyle={[
            styles.scroll,
            {
              paddingBottom:
                LAYOUT.bottomSafe + LAYOUT.sectionGap + keyboardBottomInset,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        >
          <View>
          <Box px="xxl">
            {/* 디자인의 DiaryPage 형태 — rounded 카드 wrapper 없이 ThemeBg 위에 직접 콘텐츠 */}
            <View style={styles.diaryPage}>
              <View style={styles.dateBannerWrap}>
                <ScrapbookDateBanner
                  theme={dt}
                  date={formattedDate}
                  place={
                    walkKind === 'together'
                      ? walkLocationName
                      : [myEntry?.locationName, partnerEntry?.locationName]
                          .filter(Boolean)
                          .join(' · ') || t('common:labels.each-day')
                  }
                />
              </View>

              {/* ── 사진 영역 ── */}
              {/* each(각자의 하루): 1인당 최대 2장 strip / together(우리의 하루): 4슬롯 다꾸 */}
              {walkKind === 'each' ? (
                <EachPhotoStrip
                  theme={dt}
                  myPhotos={isEditing ? photos : (myEntry?.photos ?? [])}
                  partnerPhotos={partnerEntry?.photos ?? []}
                  editable={isEditing}
                  onAddMyPhoto={handleAddPhoto}
                  onRemoveMyPhoto={handleRemovePhoto}
                  stampDate={walkDate.replace(/-/g, '·').slice(2)}
                />
              ) : !isEditing ? (
                <PhotoPage
                  theme={dt}
                  photos={[
                    ...(myEntry?.photos ?? []),
                    ...(partnerEntry?.photos ?? []),
                  ].slice(0, photoLimit)}
                  quoteSeed={walkDate}
                />
              ) : (
                <PhotoPage
                  theme={dt}
                  photos={photos}
                  editable
                  onAddPhoto={() => handleAddPhoto()}
                  onRemovePhoto={(slotIdx) => handleRemovePhoto(slotIdx)}
                  quoteSeed={walkDate}
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
                    {walkKind === 'each' ? (
                      // each — 질문 없이 텍스트 직접 표시
                      <EachTextBubble
                        dt={dt}
                        text={myEntry.diaryAnswer || myEntry.memo || ''}
                        empty={t('diary:detail.answer-empty')}
                        rotate={0.4}
                      />
                    ) : myEntry.diaryQuestionId != null ? (
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
                    {/* 커플 Q&A — 우리의 하루(together)에서만 */}
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
                      photoLimit={photoLimit}
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
                    {walkKind === 'each' ? (
                      <EachTextBubble
                        dt={dt}
                        text={partnerEntry.diaryAnswer || partnerEntry.memo || ''}
                        empty={t('diary:detail.answer-empty')}
                        rotate={-0.4}
                      />
                    ) : partnerEntry.diaryQuestionId != null ? (
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
          </View>
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
  photoLimit,
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
  photoLimit: number;
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
          {photos.length}/{photoLimit}
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

// ─── Each Text Bubble ───────────────────────────────────
// each 종류 전용 — 질문 없는 단순 메모 표시

function EachTextBubble({
  dt,
  text,
  empty,
  rotate = 0,
}: {
  dt: DiaryTheme;
  text: string;
  empty: string;
  rotate?: number;
}) {
  return (
    <View
      style={[
        eachBubbleStyles.wrap,
        {
          backgroundColor: dt.tints[3],
          borderColor: dt.line,
          transform: [{ rotate: `${rotate}deg` }],
        },
      ]}
    >
      <Text
        style={{
          color: text ? dt.ink : dt.inkSoft,
          fontFamily: dt.bodyFont,
          fontWeight: dt.bodyWeight,
          fontSize: 15,
          lineHeight: 22,
        }}
      >
        {text || empty}
      </Text>
    </View>
  );
}

const eachBubbleStyles = StyleSheet.create({
  wrap: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});

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
        fontFamily: dt.bodyFont,
        fontWeight: dt.bodyWeight,
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
  deleteBtn: {
    padding: SPACING.xs,
    marginRight: SPACING.xs,
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
  keyboardAvoider: {
    flex: 1,
  },
  dateBannerWrap: {
    marginVertical: SPACING.lg,
  },
  scroll: {
    // 배경 텍스처는 화면 전체 absoluteFill ThemeBg가 담당 — 콘텐츠는 transparent 유지
  },
  scroller: {
    backgroundColor: 'transparent',
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
