import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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

import { Box, Button, PixelCard, Row, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { FONT_FAMILY, SPACING } from '@/styles/type';

// ─── Component ──────────────────────────────────────────

export default function FootprintCreateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [date] = useState(new Date().toISOString().split('T')[0]);
  const [locationName, setLocationName] = useState('');
  const [memo, setMemo] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

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

  const handleSave = () => {
    if (!locationName.trim()) {
      Alert.alert('', '어디서 만났는지 적어주세요!');
      return;
    }
    // TODO: useCreateDiaryMutation으로 저장
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <Row px="xxl" py="md" style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={{ fontSize: 20 }}>✕</Text>
        </Pressable>
        <Text variant="headingMedium">발자취 남기기</Text>
        <View style={{ width: 32 }} />
      </Row>

      {/* 안내 배너 */}
      <Box px="xxl" style={{ marginTop: SPACING.xs }}>
        <View style={styles.infoBanner}>
          <Text style={{ fontSize: 14 }}>🔒</Text>
          <Text variant="caption" color="textSecondary" ml="sm" style={{ flex: 1 }}>
            상대방도 작성해야 서로의 발자취를 볼 수 있어요
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
          {/* 날짜 */}
          <Box px="xxl">
            <Pressable style={styles.dateCard}>
              <Text style={{ fontSize: 16 }}>📅</Text>
              <Text variant="bodyMedium" color="text" ml="sm">
                {formattedDate}
              </Text>
            </Pressable>
          </Box>

          {/* 장소 */}
          <Box px="xxl" style={{ marginTop: SPACING.xl }}>
            <Text variant="label" color="textSecondary" mb="sm">
              📍 어디서 만났나요?
            </Text>
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

          {/* 사진 업로드 */}
          <Box px="xxl" style={{ marginTop: SPACING.xl }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="label" color="textSecondary">
                📷 사진
              </Text>
              <Text variant="caption" color="textMuted">
                {photos.length}/5
              </Text>
            </Row>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoRow}
              style={{ marginTop: SPACING.sm }}
            >
              {/* 추가 버튼 */}
              {photos.length < 5 && (
                <Pressable style={styles.photoAdd} onPress={handleAddPhoto}>
                  <Text style={{ fontSize: 24 }}>📸</Text>
                  <Text variant="caption" color="textMuted" mt="xs">
                    추가
                  </Text>
                </Pressable>
              )}

              {/* 업로드된 사진 */}
              {photos.map((uri, i) => (
                <View key={i} style={styles.photoThumbWrapper}>
                  <Image source={{ uri }} style={styles.photoThumb} />
                  <Pressable
                    style={styles.photoRemove}
                    onPress={() => handleRemovePhoto(i)}
                    hitSlop={4}
                  >
                    <View style={styles.removeBtn}>
                      <Text style={{ fontSize: 10, color: theme.colors.white }}>✕</Text>
                    </View>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </Box>

          {/* 메모 */}
          <Box px="xxl" style={{ marginTop: SPACING.xl }}>
            <Text variant="label" color="textSecondary" mb="sm">
              ✍️ 오늘의 이야기
            </Text>
            <View style={styles.memoCard}>
              <TextInput
                style={styles.memoInput}
                placeholder="오늘 함께한 순간을 적어보세요"
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

        {/* 저장 버튼 */}
        <Box
          px="xxl"
          style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING.md }]}
        >
          <Button variant="primary" size="large" onPress={handleSave}>
            발자취 남기기 👣
          </Button>
        </Box>
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primarySurface,
    borderRadius: theme.radius.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  scroll: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceWarm,
    borderRadius: theme.radius.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceWarm,
    borderRadius: theme.radius.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  locationInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONT_FAMILY.pixel,
    color: theme.colors.text,
    paddingVertical: 0,
  },
  photoRow: {
    gap: SPACING.md,
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
  memoCard: {
    backgroundColor: theme.colors.surfaceWarm,
    borderRadius: theme.radius.md,
    padding: SPACING.lg,
    minHeight: 140,
  },
  memoInput: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.pixel,
    lineHeight: 22,
    color: theme.colors.text,
    flex: 1,
  },
  bottomBar: {
    paddingTop: SPACING.md,
    borderTopWidth: 2,
    borderTopColor: theme.colors.border,
  },
});
