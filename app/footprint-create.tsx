import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
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
  EachPhotoStrip,
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
import type { Coords, ProviderId } from '@/lib/location';
import { getDailyQuestions } from '@/constants/questions';
import { useCreateDiaryMutation } from '@/hooks/services/diary/mutation';
import { useDiaryByMonthQuery } from '@/hooks/services/diary/query';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import { useDialogStore } from '@/stores/dialogStore';
import { usePhotoBoothStore } from '@/stores/photoBoothStore';
import { theme } from '@/styles/theme';
import { LAYOUT, SPACING } from '@/styles/type';
import { formatDate, getLocalToday, parseLocalDate } from '@/utils/date';

// ─── Component ──────────────────────────────────────────

export default function FootprintCreateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ kind?: string }>();
  const { t } = useTranslation(['diary', 'common', 'premium']);

  const { couple, isCoupleConnected, myName } = usePartnerDerivation();
  const dialog = useDialogStore();
  const photoBoothResultUri = usePhotoBoothStore((s) => s.resultUri);
  const setPhotoBoothPhotos = usePhotoBoothStore((s) => s.setPhotos);
  const resetPhotoBooth = usePhotoBoothStore((s) => s.reset);

  // ─── 다꾸 테마 ────────────────────────────────────────
  const { theme: dt, themeId, setTheme } = useDiaryTheme();
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
  const [photos, setPhotos] = useState<string[]>([]);
  const kind: 'each' | 'together' =
    params.kind === 'together' ? 'together' : 'each';
  const isTogether = kind === 'together';

  // 사진 한도 — 오늘의 나 1장, 우리의 하루 4장
  const photoLimit = isTogether ? PREMIUM.PHOTO_LIMIT_FREE : 1;

  // kind 변경 시 사진 트리밍 (each ← together 전환 시 4장 → 1장)
  useEffect(() => {
    setPhotos((prev) =>
      prev.length > photoLimit ? prev.slice(0, photoLimit) : prev,
    );
  }, [photoLimit]);

  // 오늘의 질문 (날짜 변경 시 자동 갱신)
  const { diaryQuestion, coupleQuestion } = getDailyQuestions(
    couple?.firstMetDate,
    date,
  );

  const createDiary = useCreateDiaryMutation();

  // 선택한 날짜에 이미 walk가 있으면 → diary-detail로 자동 리다이렉트.
  // kind를 상대가 정한대로 강제 승계하려면 여기서 막아야 함.
  const { year, month } = useMemo(() => {
    const d = parseLocalDate(date);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }, [date]);
  const { data: monthWalks } = useDiaryByMonthQuery(year, month);
  const existingWalk = useMemo(
    () => monthWalks?.find((w) => w.date === date),
    [monthWalks, date],
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

  // 포토부스에서 돌아왔을 때 결과 이미지 반영
  useFocusEffect(
    useCallback(() => {
      if (photoBoothResultUri) {
        setPhotos((prev) => [...prev, photoBoothResultUri].slice(0, 5));
        resetPhotoBooth();
      }
    }, [photoBoothResultUri, resetPhotoBooth]),
  );

  const handleOpenPhotoBooth = () => {
    if (photos.length === 0) {
      dialog.alert('', t('diary:create.photo-need-first'));
      return;
    }
    setPhotoBoothPhotos(photos);
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
      // 한도 도달 — each(1장) / together(4장) 모두 동일 패턴
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
    if (isTogether && !locationName.trim()) {
      dialog.alert('', t('diary:create.location-required'));
      return;
    }

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

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: dt.bg },
      ]}
    >
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
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.scroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
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
                      {locationName ||
                        t(
                          isTogether
                            ? 'diary:create.location-placeholder'
                            : 'diary:create.location-placeholder-each',
                        )}
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
                {isTogether ? (
                  <PhotoPage
                    theme={dt}
                    photos={photos}
                    editable
                    onAddPhoto={() => handleAddPhoto()}
                    onRemovePhoto={(slotIdx) => handleRemovePhoto(slotIdx)}
                    quoteSeed={date}
                  />
                ) : (
                  <EachPhotoStrip
                    theme={dt}
                    myPhoto={photos[0]}
                    editable
                    onAddMyPhoto={() => handleAddPhoto()}
                    onRemoveMyPhoto={() => handleRemovePhoto(0)}
                  />
                )}

                {/* 포토부스 — 텍스트 링크 톤 */}
                {photos.length > 0 && (
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
                  title={isTogether ? '오늘의 다이어리' : '📓 오늘의 한 줄'}
                  question={isTogether ? diaryQuestion.content : ''}
                  rotate={0.4}
                >
                  <ThemedHandwriteInput
                    theme={dt}
                    value={diaryAnswer}
                    onChangeText={setDiaryAnswer}
                    placeholder={
                      isTogether
                        ? t('diary:detail.form.diary-placeholder')
                        : '오늘 너에게 들려주고 싶은 한 마디 ✿'
                    }
                    minLines={isTogether ? 3 : 2}
                  />
                </ThemedDiaryCard>
              </Box>

              {isTogether && (
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
              )}
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
  scroll: {
    paddingTop: LAYOUT.sectionGap,
    paddingBottom: LAYOUT.bottomSafe,
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
