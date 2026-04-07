import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
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

import { Box, Button, Icon, PixelCard, Row, Text } from '@/components/base';
import { SimpleDatePicker } from '@/components/base/SimpleDatePicker';
import { getDailyQuestions } from '@/constants/questions';
import { useCreateDiaryMutation } from '@/hooks/services/diary/mutation';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import { useDialogStore } from '@/stores/dialogStore';
import { usePhotoBoothStore } from '@/stores/photoBoothStore';
import { theme } from '@/styles/theme';
import { FONT_FAMILY, LAYOUT, SPACING } from '@/styles/type';
import { formatDate, getLocalToday, parseLocalDate } from '@/utils/date';

// ─── Component ──────────────────────────────────────────

export default function FootprintCreateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation(['diary', 'common']);

  const { couple, isCoupleConnected } = usePartnerDerivation();
  const dialog = useDialogStore();
  const photoBooth = usePhotoBoothStore();

  const [date, setDate] = useState(getLocalToday());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [diaryAnswer, setDiaryAnswer] = useState('');
  const [coupleAnswer, setCoupleAnswer] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  // 오늘의 질문 (날짜 변경 시 자동 갱신)
  const { diaryQuestion, coupleQuestion } = getDailyQuestions(
    couple?.firstMetDate,
    date,
  );

  const createDiary = useCreateDiaryMutation();

  // 포토부스에서 돌아왔을 때 결과 이미지 반영
  useFocusEffect(
    useCallback(() => {
      if (photoBooth.resultUri) {
        setPhotos((prev) => [...prev, photoBooth.resultUri!].slice(0, 5));
        photoBooth.reset();
      }
    }, [photoBooth.resultUri]),
  );

  const handleOpenPhotoBooth = () => {
    if (photos.length === 0) {
      dialog.alert('', t('diary:create.photo-need-first'));
      return;
    }
    photoBooth.setPhotos(photos);
    router.push('/photo-booth');
  };

  const formattedDate = formatDate(parseLocalDate(date), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  const handleAddPhoto = async () => {
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
    if (!locationName.trim()) {
      dialog.alert('', t('diary:create.location-required'));
      return;
    }

    createDiary.mutate(
      {
        date,
        locationName: locationName.trim(),
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── 헤더 ── */}
      <Row px="xxl" style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Icon name="x" size={22} color={theme.colors.text} />
        </Pressable>
        <Text variant="headingMedium">{t('diary:create.title')}</Text>
        <View style={{ width: 32 }} />
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
          {/* ── 안내 배너 ── */}
          <Box px="xxl" style={styles.bannerSection}>
            <View style={styles.infoBanner}>
              <Icon name="lock" size={14} color={theme.colors.gray500} />
              <Text variant="caption" color="textSecondary" ml="sm" style={{ flex: 1 }}>
                {t('diary:create.info-banner')}
              </Text>
            </View>
          </Box>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.scroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* ── 날짜 ── */}
              <Box px="xxl">
                <Pressable
                  style={styles.dateCard}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Icon name="calendar" size={18} color={theme.colors.gray600} />
                  <Text variant="bodyMedium" color="text" ml="sm">
                    {formattedDate}
                  </Text>
                  <View style={{ marginLeft: 'auto' }}>
                    <Icon name="chevron-down" size={14} color={theme.colors.gray400} />
                  </View>
                </Pressable>
              </Box>

              {/* ── 장소 ── */}
              <Box px="xxl" style={styles.fieldSection}>
                <Row style={styles.fieldLabel}>
                  <Icon name="map-pin" size={14} color={theme.colors.gray600} />
                  <Text variant="label" color="textSecondary">
                    {t('diary:create.location-label')}
                  </Text>
                </Row>
                <View style={styles.inputCard}>
                  <TextInput
                    style={styles.locationInput}
                    placeholder={t('diary:create.location-placeholder')}
                    placeholderTextColor={theme.colors.gray400}
                    value={locationName}
                    onChangeText={setLocationName}
                    cursorColor={theme.colors.primary}
                  />
                </View>
              </Box>

              {/* ── 사진 업로드 ── */}
              <Box px="xxl" style={styles.fieldSection}>
                <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Row style={styles.fieldLabel}>
                    <Icon name="camera" size={14} color={theme.colors.gray600} />
                    <Text variant="label" color="textSecondary">
                      {t('diary:create.photo-label')}
                    </Text>
                  </Row>
                  <Text variant="caption" color="textMuted">
                    {photos.length}/5
                  </Text>
                </Row>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.photoRow}
                  style={styles.photoScroll}
                >
                  {photos.length < 5 && (
                    <Pressable style={styles.photoAdd} onPress={handleAddPhoto}>
                      <Icon name="image-plus" size={24} color={theme.colors.gray400} />
                      <Text variant="caption" color="textMuted" mt="xs">
                        {t('diary:create.photo-add')}
                      </Text>
                    </Pressable>
                  )}

                  {photos.map((uri, i) => (
                    <View key={i} style={styles.photoThumbWrapper}>
                      <Image source={{ uri }} style={styles.photoThumb} />
                      <Pressable
                        style={styles.photoRemove}
                        onPress={() => handleRemovePhoto(i)}
                        hitSlop={4}
                      >
                        <View style={styles.removeBtn}>
                          <Icon name="x" size={10} color={theme.colors.white} />
                        </View>
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>

                {/* 포토부스 버튼 */}
                {photos.length > 0 && (
                  <Pressable style={styles.photoBoothBtn} onPress={handleOpenPhotoBooth}>
                    <Icon name="grid" size={14} color={theme.colors.primary} />
                    <Text variant="label" color="primary" ml="xs">
                      {t('diary:create.photobooth-button')}
                    </Text>
                  </Pressable>
                )}
              </Box>

              {/* ── 📝 다이어리 질문 ── */}
              <Box px="xxl" style={styles.fieldSection}>
                <Row style={styles.fieldLabel}>
                  <Text style={{ fontSize: 14 }}>📝</Text>
                  <Text variant="label" color="textSecondary">
                    {t('diary:create.diary-section-title')}
                  </Text>
                </Row>
                <View style={styles.questionPrompt}>
                  <Text variant="bodySmall" color="primary">
                    {t('diary:create.diary-prompt-prefix')} {diaryQuestion.content}
                  </Text>
                </View>
                <View style={styles.memoCard}>
                  <TextInput
                    style={styles.memoInput}
                    placeholder={t('diary:create.diary-placeholder')}
                    placeholderTextColor={theme.colors.gray400}
                    value={diaryAnswer}
                    onChangeText={setDiaryAnswer}
                    multiline
                    textAlignVertical="top"
                    cursorColor={theme.colors.primary}
                  />
                </View>
              </Box>

              {/* ── 💌 오늘의 질문 ── */}
              <Box px="xxl" style={styles.fieldSection}>
                <Row style={styles.fieldLabel}>
                  <Text style={{ fontSize: 14 }}>💌</Text>
                  <Text variant="label" color="textSecondary">
                    {t('diary:create.couple-section-title')}
                  </Text>
                  <View style={styles.categoryChip}>
                    <Text style={{ fontSize: 10 }}>{coupleQuestion.emoji}</Text>
                    <Text variant="caption" color="textMuted" ml="xxs">
                      {coupleQuestion.categoryLabel}
                    </Text>
                  </View>
                </Row>
                <View style={styles.questionPrompt}>
                  <Text variant="bodySmall" color="primary">
                    {t('diary:create.diary-prompt-prefix')} {coupleQuestion.content}
                  </Text>
                </View>
                <View style={styles.memoCard}>
                  <TextInput
                    style={styles.memoInput}
                    placeholder={t('diary:create.couple-placeholder')}
                    placeholderTextColor={theme.colors.gray400}
                    value={coupleAnswer}
                    onChangeText={setCoupleAnswer}
                    multiline
                    textAlignVertical="top"
                    cursorColor={theme.colors.primary}
                  />
                </View>
              </Box>
            </ScrollView>

            {/* ── 저장 버튼 ── */}
            <Box
              px="xxl"
              style={[styles.bottomBar, { paddingBottom: insets.bottom + LAYOUT.headerPy }]}
            >
              <Button
                variant="primary"
                size="large"
                onPress={handleSave}
                disabled={createDiary.isPending}
              >
                {createDiary.isPending ? (
                  <Row style={styles.savingRow}>
                    <ActivityIndicator size="small" color={theme.colors.white} />
                    <Text variant="bodyMedium" color="white">
                      {t('diary:create.submitting')}
                    </Text>
                  </Row>
                ) : (
                  t('diary:create.submit')
                )}
              </Button>
            </Box>
          </KeyboardAvoidingView>
        </>
      )}

      {/* ── 날짜 선택 모달 (최상위 레벨로 렌더링) ── */}
      {showDatePicker && (
        <SimpleDatePicker
          currentDate={date}
          onSave={(d) => {
            setDate(d);
            setShowDatePicker(false);
          }}
          onClose={() => setShowDatePicker(false)}
          title={t('diary:create.date-picker-title')}
          maxDate={new Date()}
        />
      )}
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
  bannerSection: {
    marginTop: SPACING.xs,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primarySurface,
    borderRadius: theme.radius.md,
    paddingHorizontal: LAYOUT.cardPx,
    paddingVertical: LAYOUT.itemGap,
  },
  scroll: {
    paddingTop: LAYOUT.sectionGap,
    paddingBottom: LAYOUT.bottomSafe,
  },
  fieldSection: {
    marginTop: LAYOUT.sectionGapLg,
  },
  fieldLabel: {
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: LAYOUT.itemGap,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceWarm,
    borderRadius: theme.radius.md,
    paddingHorizontal: LAYOUT.cardPx,
    paddingVertical: LAYOUT.cardPy,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceWarm,
    borderRadius: theme.radius.md,
    paddingHorizontal: LAYOUT.cardPx,
    paddingVertical: LAYOUT.cardPy,
  },
  locationInput: {
    flex: 1,
    fontSize: SPACING.lg - 1,
    fontFamily: FONT_FAMILY.pixel,
    color: theme.colors.text,
    paddingVertical: 4,
    lineHeight: 22,
  },
  photoScroll: {
    marginTop: LAYOUT.itemGap,
  },
  photoRow: {
    gap: LAYOUT.itemGapMd,
    paddingTop: 8,
    paddingRight: 8,
  },
  photoAdd: {
    width: 88,
    height: 88,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.gray400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoThumbWrapper: {
    position: 'relative',
  },
  photoThumb: {
    width: 88,
    height: 88,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.gray100,
  },
  photoRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  removeBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoBoothBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: LAYOUT.itemGapMd,
    paddingVertical: SPACING.sm,
    backgroundColor: theme.colors.primarySurface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
  },
  questionPrompt: {
    backgroundColor: theme.colors.primarySurface,
    borderRadius: theme.radius.md,
    paddingHorizontal: LAYOUT.cardPx,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray100,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: theme.radius.sm,
    marginLeft: 'auto',
  },
  memoCard: {
    backgroundColor: theme.colors.surfaceWarm,
    borderRadius: theme.radius.md,
    padding: LAYOUT.cardPx,
    minHeight: 140,
  },
  memoInput: {
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
