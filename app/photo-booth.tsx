import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import * as ImagePicker from 'expo-image-picker';

import { Box, Button, Icon, Row, Text } from '@/components/base';
import { formatDate } from '@/utils/date';
import FilterPicker from '@/components/feature/photobooth/FilterPicker';
import FrameColorPicker from '@/components/feature/photobooth/FrameColorPicker';
import PhotoBoothCanvas from '@/components/feature/photobooth/PhotoBoothCanvas';
import TemplatePicker from '@/components/feature/photobooth/TemplatePicker';
import { captureTemplate } from '@/lib/photobooth/captureTemplate';
import { getTemplate } from '@/lib/photobooth/templates';
import { usePhotoBoothStore } from '@/stores/photoBoothStore';
import { theme } from '@/styles/theme';
import { LAYOUT, SPACING } from '@/styles/type';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CANVAS_MAX_WIDTH = SCREEN_WIDTH - SPACING.xxl * 2;

export default function PhotoBoothScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation('diary');
  const canvasRef = useRef<View>(null);
  const [capturing, setCapturing] = useState(false);

  const {
    photos,
    templateId,
    filterId,
    frameColorId,
    setTemplate,
    setFilter,
    setFrameColor,
    setResult,
    setPhotos,
  } = usePhotoBoothStore();

  const template = getTemplate(templateId);
  // 캔버스 너비를 화면에 맞추되, 세로가 너무 길면 줄임
  const maxCanvasHeight = Dimensions.get('window').height * 0.45;
  const idealWidth = CANVAS_MAX_WIDTH;
  const idealHeight = idealWidth / template.aspectRatio;
  const canvasWidth =
    idealHeight > maxCanvasHeight
      ? maxCanvasHeight * template.aspectRatio
      : idealWidth;

  const dateLabel = formatDate(new Date(), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  // 빈 슬롯에 사진 추가
  const handleAddPhoto = useCallback(async (slotIndex: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newPhotos = [...photos];
      // 슬롯 위치에 사진 삽입
      while (newPhotos.length <= slotIndex) {
        newPhotos.push('');
      }
      newPhotos[slotIndex] = result.assets[0].uri;
      setPhotos(newPhotos.filter(Boolean));
    }
  }, [photos, setPhotos]);

  const handleSave = useCallback(async () => {
    if (capturing) return;
    setCapturing(true);
    try {
      const uri = await captureTemplate(canvasRef);
      if (uri) {
        setResult(uri);
        router.back();
      }
      // uri가 null이면 Alert가 이미 표시됨 (Expo Go 미지원)
    } catch {
      // 예상치 못한 에러
    } finally {
      setCapturing(false);
    }
  }, [capturing, setResult, router]);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <Row px="xxl" style={styles.header}>
        <Pressable onPress={handleCancel} hitSlop={8}>
          <Icon name="x" size={22} color={theme.colors.text} />
        </Pressable>
        <Text variant="headingMedium">{t('photobooth.title')}</Text>
        <View style={{ width: 32 }} />
      </Row>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* 캔버스 미리보기 */}
        <View style={styles.canvasArea}>
          <PhotoBoothCanvas
            ref={canvasRef}
            canvasWidth={canvasWidth}
            dateLabel={dateLabel}
            onAddPhoto={handleAddPhoto}
          />
        </View>

        {/* 프레임 색상 */}
        <Box style={styles.section}>
          <Text variant="label" color="textSecondary" style={styles.sectionLabel}>
            {t('photobooth.frame-color')}
          </Text>
          <FrameColorPicker selectedId={frameColorId} onSelect={setFrameColor} />
        </Box>

        {/* 필터 */}
        <Box style={styles.section}>
          <Text variant="label" color="textSecondary" style={styles.sectionLabel}>
            {t('photobooth.filter')}
          </Text>
          <FilterPicker
            selectedId={filterId}
            onSelect={setFilter}
            previewUri={photos[0] ?? null}
          />
        </Box>

        {/* 템플릿 */}
        <Box style={styles.section}>
          <Text variant="label" color="textSecondary" style={styles.sectionLabel}>
            {t('photobooth.layout')}
          </Text>
          <TemplatePicker selectedId={templateId} onSelect={setTemplate} />
        </Box>
      </ScrollView>

      {/* 저장 버튼 */}
      <Box
        px="xxl"
        style={[styles.bottomBar, { paddingBottom: insets.bottom + LAYOUT.headerPy }]}
      >
        <Button
          variant="primary"
          size="large"
          onPress={handleSave}
          disabled={capturing}
        >
          {capturing ? (
            <Row style={styles.savingRow}>
              <ActivityIndicator size="small" color={theme.colors.white} />
              <Text variant="bodyMedium" color="white">
                {t('photobooth.saving')}
              </Text>
            </Row>
          ) : (
            t('photobooth.save')
          )}
        </Button>
      </Box>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: LAYOUT.headerPy,
  },
  scroll: {
    paddingBottom: LAYOUT.bottomSafe,
  },
  canvasArea: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionLabel: {
    paddingHorizontal: SPACING.xxl,
    marginBottom: SPACING.sm,
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
