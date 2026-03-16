import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useCreateDiaryMutation } from '@/hooks/services/diary/mutation';
import { useGetMeQuery } from '@/hooks/services/user/query';
import { theme } from '@/styles/theme';
import { FONT_FAMILY, LAYOUT, SPACING } from '@/styles/type';

// ─── Component ──────────────────────────────────────────

export default function FootprintCreateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: me } = useGetMeQuery();
  const hasCoupleId = !!me?.coupleId;

  const [date] = useState(new Date().toISOString().split('T')[0]);
  const [locationName, setLocationName] = useState('');
  const [memo, setMemo] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const createDiary = useCreateDiaryMutation();

  const formattedDate = new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  const handleAddPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진을 업로드하려면 갤러리 접근 권한이 필요해요.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 5 - photos.length,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uris = result.assets.map(a => a.uri);
      setPhotos(prev => [...prev, ...uris].slice(0, 5));
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!locationName.trim()) {
      Alert.alert('', '오늘의 데이트 장소를 적어주세요!');
      return;
    }

    createDiary.mutate(
      {
        date,
        locationName: locationName.trim(),
        memo: memo.trim(),
        photos,
        steps: 0, // TODO: 만보기 연동 시 실제 걸음수
      },
      {
        onSuccess: () => {
          router.back();
        },
        onError: (error) => {
          Alert.alert('저장 실패', error.message || '다시 시도해주세요.');
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
        <Text variant="headingMedium">오늘의 데이트</Text>
        <View style={{ width: 32 }} />
      </Row>

      {/* ── 커플 미연결 시 — 차단 안내 ── */}
      {!hasCoupleId ? (
        <View style={styles.noCoupleArea}>
          <PixelCard style={styles.noCoupleBlockCard} bg={theme.colors.surfaceWarm}>
            <View style={styles.blockIcon}>
              <Icon name="lock" size={32} color={theme.colors.gray500} />
            </View>
            <Text variant="headingSmall" mt="lg" style={{ textAlign: 'center' }}>
              내 사람이 아직 없어요
            </Text>
            <Text
              variant="bodySmall"
              color="textSecondary"
              mt="sm"
              style={{ textAlign: 'center', lineHeight: 20 }}
            >
              산책 기록은 둘이 함께 남기는 거예요{'\n'}먼저 연인을 초대해주세요
            </Text>
            <Button
              variant="primary"
              size="medium"
              mt="xl"
              onPress={() => router.back()}
            >
              돌아가기
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
                둘 다 기록해야 서로의 하루를 열어볼 수 있어요
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
                <Pressable style={styles.dateCard}>
                  <Icon name="calendar" size={18} color={theme.colors.gray600} />
                  <Text variant="bodyMedium" color="text" ml="sm">
                    {formattedDate}
                  </Text>
                </Pressable>
              </Box>

              {/* ── 장소 ── */}
              <Box px="xxl" style={styles.fieldSection}>
                <Row style={styles.fieldLabel}>
                  <Icon name="map-pin" size={14} color={theme.colors.gray600} />
                  <Text variant="label" color="textSecondary">
                    오늘의 데이트 장소
                  </Text>
                </Row>
                <View style={styles.inputCard}>
                  <TextInput
                    style={styles.locationInput}
                    placeholder="한강공원, 경복궁, 홍대..."
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
                      사진
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
                        추가
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
              </Box>

              {/* ── 메모 ── */}
              <Box px="xxl" style={styles.fieldSection}>
                <Row style={styles.fieldLabel}>
                  <Icon name="edit" size={14} color={theme.colors.gray600} />
                  <Text variant="label" color="textSecondary">
                    오늘 우리의 이야기
                  </Text>
                </Row>
                <View style={styles.memoCard}>
                  <TextInput
                    style={styles.memoInput}
                    placeholder="오늘 너와 함께한 순간을 적어볼게"
                    placeholderTextColor={theme.colors.gray400}
                    value={memo}
                    onChangeText={setMemo}
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
                      저장 중...
                    </Text>
                  </Row>
                ) : (
                  '오늘의 기록 남기기'
                )}
              </Button>
            </Box>
          </KeyboardAvoidingView>
        </>
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

  /* ── 안내 배너 ── */
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

  /* ── 스크롤 본문 ── */
  scroll: {
    paddingTop: LAYOUT.sectionGap,
    paddingBottom: LAYOUT.bottomSafe,
  },

  /* ── 필드 공통 ── */
  fieldSection: {
    marginTop: LAYOUT.sectionGapLg,
  },
  fieldLabel: {
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: LAYOUT.itemGap,
  },

  /* ── 날짜 ── */
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceWarm,
    borderRadius: theme.radius.md,
    paddingHorizontal: LAYOUT.cardPx,
    paddingVertical: LAYOUT.cardPy,
  },

  /* ── 장소 인풋 ── */
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
    fontSize: SPACING.lg - 1, // 15 — bodyMedium(14)과 bodyLarge(16) 사이
    fontFamily: FONT_FAMILY.pixel,
    color: theme.colors.text,
    paddingVertical: 0,
  },

  /* ── 사진 ── */
  photoScroll: {
    marginTop: LAYOUT.itemGap,
  },
  photoRow: {
    gap: LAYOUT.itemGapMd,
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

  /* ── 메모 ── */
  memoCard: {
    backgroundColor: theme.colors.surfaceWarm,
    borderRadius: theme.radius.md,
    padding: LAYOUT.cardPx,
    minHeight: 140,
  },
  memoInput: {
    fontSize: SPACING.lg - 1, // 15
    fontFamily: FONT_FAMILY.pixel,
    lineHeight: 22,
    color: theme.colors.text,
    flex: 1,
  },

  /* ── 하단 저장 바 ── */
  bottomBar: {
    paddingTop: LAYOUT.headerPy,
    borderTopWidth: 2,
    borderTopColor: theme.colors.border,
  },
  savingRow: {
    alignItems: 'center',
    gap: LAYOUT.itemGap,
  },

  /* ── 커플 미연결 ── */
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
