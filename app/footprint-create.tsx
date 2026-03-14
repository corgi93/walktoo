import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

import { Box, Button, Row, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';

// ─── Component ──────────────────────────────────────────

export default function FootprintCreateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [date, setDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [memo, setMemo] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const formattedDate = new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  const handleAddPhoto = () => {
    // TODO: expo-image-picker로 사진 선택
    setPhotos(prev => [...prev, 'placeholder']);
  };

  const handleSave = () => {
    // TODO: useCreateDiaryMutation으로 저장
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <Row px="xxl" py="md" style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </Pressable>
        <Text variant="headingMedium">발자취 남기기</Text>
        <View style={{ width: 24 }} />
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
          {/* 날짜 선택 */}
          <Box px="xxl">
            <Pressable style={styles.dateCard}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={theme.colors.primary}
              />
              <Text variant="bodyMedium" color="text" ml="sm">
                {formattedDate}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.colors.gray400}
                style={{ marginLeft: 'auto' }}
              />
            </Pressable>
          </Box>

          {/* 사진 업로드 */}
          <Box px="xxl" style={{ marginTop: SPACING.xxl }}>
            <Text variant="label" color="textSecondary" mb="sm">
              사진
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoRow}
            >
              {/* 추가 버튼 */}
              <Pressable style={styles.photoAdd} onPress={handleAddPhoto}>
                <Ionicons
                  name="camera-outline"
                  size={28}
                  color={theme.colors.gray400}
                />
                <Text variant="caption" color="textMuted" mt="xs">
                  추가
                </Text>
              </Pressable>

              {/* 업로드된 사진 */}
              {photos.map((_, i) => (
                <View key={i} style={styles.photoThumb}>
                  <Ionicons
                    name="image"
                    size={32}
                    color={theme.colors.gray300}
                  />
                </View>
              ))}
            </ScrollView>
          </Box>

          {/* 메모 */}
          <Box px="xxl" style={{ marginTop: SPACING.xxl }}>
            <Text variant="label" color="textSecondary" mb="sm">
              오늘의 이야기
            </Text>
            <View style={styles.memoCard}>
              <TextInput
                style={styles.memoInput}
                placeholder="오늘 함께한 순간을 기록해보세요"
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
  scroll: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceWarm,
    borderRadius: theme.radius.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  photoRow: {
    gap: SPACING.md,
  },
  photoAdd: {
    width: 88,
    height: 88,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoThumb: {
    width: 88,
    height: 88,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memoCard: {
    backgroundColor: theme.colors.surfaceWarm,
    borderRadius: theme.radius.lg,
    padding: SPACING.lg,
    minHeight: 160,
  },
  memoInput: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text,
    flex: 1,
  },
  bottomBar: {
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.gray200,
  },
});
