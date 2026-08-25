import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
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
import { LocationPicker } from '@/components/feature/diary/LocationPicker';
import {
  PhotoPage,
  ScrapbookSaveButton,
  ThemeBg,
  ThemedDiaryCard,
  ThemedHandwriteInput,
  ThemedTitle,
  ThemePicker,
} from '@/components/feature/diary/scrapbook';
import { PREMIUM } from '@/constants/premium';
import { useDiaryTheme } from '@/hooks/useDiaryTheme';
import { useThemePack } from '@/hooks/useThemePack';
import { DEFAULT_DIARY_THEME_ID } from '@/styles/diaryThemes';
import type { Coords, ProviderId } from '@/lib/location';
import { getDailyQuestions } from '@/constants/questions';
import { useCreateDiaryMutation } from '@/hooks/services/diary/mutation';
import { useDiaryByMonthQuery } from '@/hooks/services/diary/query';
import { useEntitlement } from '@/hooks/useEntitlement';
import { useKeyboardBottomInset } from '@/hooks/useKeyboardBottomInset';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import { useDialogStore } from '@/stores/dialogStore';
import { usePhotoBoothStore } from '@/stores/photoBoothStore';
import { theme } from '@/styles/theme';
import { LAYOUT, SPACING } from '@/styles/type';
import { formatDate, getLocalToday, parseLocalDate } from '@/utils/date';
import { isImageUri } from '@/utils/media';

// ─── Component ──────────────────────────────────────────

export default function FootprintCreateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation(['diary', 'common', 'premium']);
  const keyboardBottomInset = useKeyboardBottomInset(SPACING.xxxl);

  const { couple, isCoupleConnected, myName } = usePartnerDerivation();
  const { isEntitled } = useEntitlement();
  const dialog = useDialogStore();
  const photoBoothResultUri = usePhotoBoothStore((s) => s.resultUri);
  const setPhotoBoothPhotos = usePhotoBoothStore((s) => s.setPhotos);
  const resetPhotoBooth = usePhotoBoothStore((s) => s.reset);
  // ─── 다꾸 테마 ────────────────────────────────────────
  const { theme: dt, themeId, setTheme } = useDiaryTheme();
  const { guardSaveWithTheme } = useThemePack();
  const [pickerOpen, setPickerOpen] = useState(false);

  // 날짜는 항상 오늘 (선택 UI 제거)
  const date = getLocalToday();
  const [locationName, setLocationName] = useState('');
  const [locationCoords, setLocationCoords] = useState<Coords | undefined>();
  const [locationAddress, setLocationAddress] = useState<string | undefined>();
  const [locationSource, setLocationSource] = useState<ProviderId | undefined>();
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [diaryAnswer, setDiaryAnswer] = useState('');
  const [coupleAnswer, setCoupleAnswer] = useState('');
  // 커플 질문은 기본 접힘 — 저장을 가볍게. 원할 때만 펼쳐 답한다.
  const [showCoupleQuestion, setShowCoupleQuestion] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const kind = 'together' as const;

  // 사진 한도 — 기본 4장 / 커플 패스 8장
  const photoLimit = isEntitled
    ? PREMIUM.PHOTO_LIMIT_PREMIUM
    : PREMIUM.PHOTO_LIMIT_FREE;

  // 오늘의 질문 (날짜 변경 시 자동 갱신)
  const { diaryQuestion, coupleQuestion } = getDailyQuestions(
    couple?.firstMetDate,
    date,
  );

  const createDiary = useCreateDiaryMutation();

  // 오늘의 데이트 기록이 이미 있으면 → diary-detail로 자동 리다이렉트.
  // 같은 날짜의 각자 미디어 기록은 우리 기록 생성 흐름을 막지 않는다.
  const { year, month } = useMemo(() => {
    const d = parseLocalDate(date);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }, [date]);
  const { data: monthWalks } = useDiaryByMonthQuery(year, month);
  const existingWalk = useMemo(
    () => monthWalks?.find((w) => w.date === date && w.kind === kind),
    [monthWalks, date, kind],
  );

  useEffect(() => {
    if (!existingWalk) return;
    // 이미 있으면 diary-detail 로 보내기 — kind 는 walk에 이미 결정됨.
    router.replace({
      pathname: '/diary-detail',
      params: {
        id: existingWalk.id,
        date: existingWalk.date,
        locationName: existingWalk.locationName,
        kind: existingWalk.kind,
        isRevealed: String(existingWalk.isRevealed),
        myEntry: existingWalk.myEntry
          ? JSON.stringify(existingWalk.myEntry)
          : '',
        partnerEntry: existingWalk.partnerEntry
          ? JSON.stringify(existingWalk.partnerEntry)
          : '',
      },
    });
  }, [existingWalk, router]);

  // 투로그 프레임에서 돌아왔을 때 결과 이미지 반영
  useFocusEffect(
    useCallback(() => {
      if (photoBoothResultUri) {
        setPhotos((prev) => [...prev, photoBoothResultUri].slice(0, photoLimit));
        resetPhotoBooth();
      }
    }, [photoBoothResultUri, photoLimit, resetPhotoBooth]),
  );

  const handleOpenPhotoBooth = () => {
    const imagePhotos = photos.filter(isImageUri);
    if (imagePhotos.length === 0) {
      dialog.alert('', t('diary:create.photo-need-first'));
      return;
    }
    setPhotoBoothPhotos(imagePhotos);
    router.push('/photo-booth');
  };

  const formattedDate = formatDate(parseLocalDate(date), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  const handleAddPhoto = async () => {
    if (photos.length >= photoLimit) {
      if (!isEntitled) {
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
    // 장소는 선택사항 — 사진/한 줄만 있어도 저장을 막지 않는다.
    const proceed = () => {
      createDiary.mutate(
        {
          date,
          kind,
          locationName: locationName.trim(),
          locationCoords,
          locationAddress,
          locationSource,
          memo: diaryAnswer.trim(), // 하위호환: memo에도 저장
          photos,
          diaryQuestionId: diaryQuestion.id,
          diaryAnswer: diaryAnswer.trim(),
          coupleQuestionId: coupleQuestion.id,
          coupleAnswer: coupleAnswer.trim(),
        },
        {
          onSuccess: () => router.back(),
          onError: (error) => {
            dialog.alert(
              t('diary:create.save-failed-title'),
              error.message || t('diary:create.save-failed'),
            );
          },
        },
      );
    };

    // 잠긴 테마를 미리보기 중이면 저장 시점에 결제/무료저장 유도 (추억 저장은 안 막음)
    guardSaveWithTheme(themeId, {
      onProceed: proceed,
      onRevertToFree: () => setTheme(DEFAULT_DIARY_THEME_ID),
    });
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: dt.bg },
      ]}
    >
      {/* 배경 텍스처/패턴 — 화면 전체에 absoluteFill로 깔림 (헤더·safe area 포함) */}
      <ThemeBg theme={dt} />

      {/* ── 헤더 ── 다크 테마는 ink가 검정에 가까워 안보임 → paper로 반전 */}
      <Row px="xxl" style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Icon
            name="x"
            size={22}
            color={dt.isDark ? dt.paper : dt.ink}
          />
        </Pressable>
        <View style={styles.titleWrap}>
          <ThemedTitle
            theme={dt}
            text="DIARY"
            sub={t('diary:create.title')}
            size={24}
          />
        </View>
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

      {/* ── 커플 미연결 시 — 차단 안내 ── */}
      {!isCoupleConnected ? (
        <View style={styles.noCoupleArea}>
          <PixelCard style={styles.noCoupleBlockCard} bg={theme.colors.surfaceWarm}>
            <View style={styles.blockIcon}>
              <Icon name="lock" size={32} color={theme.colors.gray500} />
            </View>
            <Text variant="headingSmall" mt="lg" style={{ textAlign: 'center' }}>
              {t('diary:create.no-couple-title')}
            </Text>
            <Text
              variant="bodySmall"
              color="textSecondary"
              mt="sm"
              style={{ textAlign: 'center', lineHeight: 20 }}
            >
              {t('diary:create.no-couple-description')}
            </Text>
            <Button
              variant="primary"
              size="medium"
              mt="xl"
              onPress={() => router.back()}
            >
              {t('diary:create.no-couple-back')}
            </Button>
          </PixelCard>
        </View>
      ) : (
        <>
          {/* ── 안내 — 한 줄 미니멀 힌트 ── */}
          <Row px="xxl" style={styles.hintRow}>
            <Icon name="lock" size={11} color={dt.inkSoft} />
            <Text
              variant="caption"
              ml="xs"
              style={{ color: dt.inkSoft, fontFamily: dt.bodyFont, flex: 1 }}
            >
              {t('diary:create.info-banner')}
            </Text>
          </Row>

          <KeyboardAvoidingView
            style={styles.keyboardAvoider}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView
              style={styles.scroller}
              contentContainerStyle={[
                styles.scroll,
                { paddingBottom: LAYOUT.bottomSafe + keyboardBottomInset },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            >
              <View>
              {/* ── 오늘 날짜 표시 (read-only, picker 없음) + 장소 ── */}
              <Box px="xxl" style={styles.fieldSection}>
                <View
                  style={[
                    styles.fieldCard,
                    { backgroundColor: dt.paper, borderColor: dt.line },
                  ]}
                >
                  <Icon name="calendar" size={15} color={dt.inkSoft} />
                  <Text
                    style={[
                      styles.fieldValue,
                      { color: dt.ink, fontFamily: dt.bodyFont, fontWeight: dt.bodyWeight },
                    ]}
                  >
                    {formattedDate}
                  </Text>
                </View>

                <Pressable
                  onPress={() => setLocationPickerOpen(true)}
                  style={[
                    styles.fieldCard,
                    {
                      backgroundColor: dt.paper,
                      borderColor: dt.line,
                      marginTop: SPACING.sm,
                    },
                  ]}
                >
                  <Icon
                    name={locationCoords ? 'map-pin' : 'search'}
                    size={15}
                    color={locationCoords ? dt.accent : dt.inkSoft}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.fieldValue,
                        {
                          color: locationName ? dt.ink : dt.inkSoft,
                          fontFamily: dt.bodyFont,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {locationName || t('diary:create.location-placeholder')}
                    </Text>
                    {locationAddress && (
                      <Text
                        variant="caption"
                        numberOfLines={1}
                        style={{
                          color: dt.inkSoft,
                          fontFamily: dt.bodyFont,
                          marginTop: 2,
                        }}
                      >
                        {locationAddress}
                      </Text>
                    )}
                  </View>
                  <Icon name="chevron-right" size={14} color={dt.inkSoft} />
                </Pressable>
              </Box>

              {/* ── 사진 업로드 ── */}
              <Box px="xxl" style={styles.fieldSection}>
                <Row style={styles.sectionHeader}>
                  <Text
                    style={[
                      styles.sectionLabel,
                      { color: dt.inkSoft, fontFamily: dt.bodyFont },
                    ]}
                  >
                    {t('diary:create.photo-label')}
                  </Text>
                  <Text
                    style={[
                      styles.sectionMeta,
                      { color: dt.inkSoft, fontFamily: dt.monoFont },
                    ]}
                  >
                    {photos.length}/{photoLimit}
                  </Text>
                </Row>
                <PhotoPage
                  theme={dt}
                  photos={photos}
                  editable
                  onAddPhoto={() => handleAddPhoto()}
                  onRemovePhoto={(slotIdx) => handleRemovePhoto(slotIdx)}
                  quoteSeed={date}
                />

                {/* 투로그 프레임 — 텍스트 링크 톤 */}
                {photos.some(isImageUri) && (
                  <Pressable
                    onPress={handleOpenPhotoBooth}
                    style={styles.photoBoothLink}
                  >
                    <Icon name="grid" size={12} color={dt.accent} />
                    <Text
                      style={[
                        styles.photoBoothLinkText,
                        { color: dt.accent, fontFamily: dt.bodyFont },
                      ]}
                    >
                      {t('diary:create.photobooth-button')}
                    </Text>
                  </Pressable>
                )}
              </Box>

              {/* ── by. 작성자 — 카드 사이 시그니처 ── */}
              <View
                style={[
                  styles.byTag,
                  {
                    transform:
                      dt.id === 'grid_minimal' ? [] : [{ rotate: '-0.6deg' }],
                  },
                ]}
              >
                <Text
                  style={[
                    styles.byTagText,
                    { color: dt.inkSoft, fontFamily: dt.bodyFont },
                  ]}
                >
                  by.{' '}
                  <Text style={{ color: dt.accent, fontWeight: '700' }}>
                    {myName}
                  </Text>
                </Text>
              </View>

              {/* ── 📓 다이어리 ── */}
              <Box px="xxl" style={styles.fieldSection}>
                <ThemedDiaryCard
                  theme={dt}
                  title="오늘의 다이어리"
                  question={diaryQuestion.content}
                  rotate={0.4}
                >
                  <ThemedHandwriteInput
                    theme={dt}
                    value={diaryAnswer}
                    onChangeText={setDiaryAnswer}
                    placeholder={t('diary:detail.form.diary-placeholder')}
                    minLines={3}
                  />
                </ThemedDiaryCard>
              </Box>

              {showCoupleQuestion ? (
                <Box px="xxl" style={styles.fieldSection}>
                  <ThemedDiaryCard
                    theme={dt}
                    title={`${coupleQuestion.emoji} 커플 질문`}
                    question={coupleQuestion.content}
                    rotate={-0.35}
                  >
                    <ThemedHandwriteInput
                      theme={dt}
                      value={coupleAnswer}
                      onChangeText={setCoupleAnswer}
                      placeholder={t('diary:detail.form.couple-placeholder')}
                      minLines={3}
                    />
                  </ThemedDiaryCard>
                </Box>
              ) : (
                <Box px="xxl" style={styles.fieldSection}>
                  <Pressable
                    onPress={() => setShowCoupleQuestion(true)}
                    style={[
                      styles.addQuestionBtn,
                      { backgroundColor: dt.paper, borderColor: dt.line },
                    ]}
                  >
                    <Icon name="plus" size={14} color={dt.accent} />
                    <Text
                      style={[
                        styles.addQuestionText,
                        { color: dt.inkSoft, fontFamily: dt.bodyFont },
                      ]}
                    >
                      {t('diary:create.add-couple-question')}
                    </Text>
                  </Pressable>
                </Box>
              )}
              </View>
            </ScrollView>

            {/* ── 저장 버튼 ── */}
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
                label={t('diary:create.submit')}
                loading={createDiary.isPending}
                loadingLabel={t('diary:create.submitting')}
                onPress={handleSave}
                disabled={createDiary.isPending}
              />
            </Box>
          </KeyboardAvoidingView>
        </>
      )}

      {/* 날짜는 항상 오늘이므로 SimpleDatePicker 제거됨 */}

      <ThemePicker
        open={pickerOpen}
        currentId={themeId}
        onPick={(id) => {
          setTheme(id);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />

      <LocationPicker
        open={locationPickerOpen}
        initialQuery={locationName}
        onPick={(loc) => {
          setLocationName(loc.name);
          setLocationCoords(loc.coords);
          setLocationAddress(loc.address);
          setLocationSource(loc.source);
        }}
        onPickPlainText={(name) => {
          setLocationName(name);
          // 텍스트만 입력한 경우 좌표·주소·source 모두 클리어
          setLocationCoords(undefined);
          setLocationAddress(undefined);
          setLocationSource(undefined);
        }}
        onClose={() => setLocationPickerOpen(false)}
      />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  /* ── 전체 ── */
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    justifyContent: 'space-between',
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
  titleWrap: {
    marginLeft: SPACING.sm,
  },
  byTag: {
    alignSelf: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  byTagText: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  themeBtnEmoji: {
    fontSize: 13,
  },
  hintRow: {
    alignItems: 'center',
    paddingTop: SPACING.xs,
  },
  keyboardAvoider: {
    flex: 1,
  },
  scroll: {
    paddingTop: LAYOUT.sectionGap,
    // 배경 텍스처는 화면 전체 absoluteFill ThemeBg가 담당 — 콘텐츠는 transparent 유지
  },
  scroller: {
    backgroundColor: 'transparent',
  },
  fieldSection: {
    marginTop: LAYOUT.sectionGap,
  },
  sectionHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: LAYOUT.itemGap,
  },
  sectionLabel: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  sectionMeta: {
    fontSize: 11,
    lineHeight: 14,
  },
  /* ── 폼 필드 — 다이어리 테마 paper 위 통일 ── */
  fieldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderWidth: 1,
  },
  fieldValue: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  fieldInput: {
    paddingVertical: 0,
  },
  /* ── 세그먼트 토글 ── */
  segment: {
    flexDirection: 'row',
    borderWidth: 1,
    padding: 3,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm + 1,
  },
  segmentLabel: {
    fontSize: 13,
    lineHeight: 16,
  },
  photoBoothLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  addQuestionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: theme.radius.sm,
  },
  addQuestionText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
  },
  photoBoothLinkText: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
  },
  bottomBar: {
    paddingTop: LAYOUT.headerPy,
    borderTopWidth: 2,
    borderTopColor: theme.colors.border,
  },
  noCoupleArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: LAYOUT.screenPx,
  },
  noCoupleBlockCard: {
    alignItems: 'center',
    padding: SPACING.xxxl,
  },
  blockIcon: {
    width: 80,
    height: 80,
    borderRadius: theme.radius.xxl,
    backgroundColor: theme.colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.gray300,
  },
});
