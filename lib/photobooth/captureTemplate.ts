import { type RefObject } from 'react';
import { Platform, type View } from 'react-native';

/**
 * PhotoBoothCanvas View를 이미지로 캡처
 * react-native-view-shot은 네이티브 모듈이므로 dynamic import로 처리
 * @returns 로컬 file:// URI
 */
export async function captureTemplate(viewRef: RefObject<View | null>): Promise<string> {
  const { captureRef } = await import('react-native-view-shot');
  const uri = await captureRef(viewRef, {
    format: 'jpg',
    quality: 0.92,
  });

  if (Platform.OS === 'web') return uri;

  const ImageManipulator = await import('expo-image-manipulator');
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.88, format: ImageManipulator.SaveFormat.JPEG },
  );

  return result.uri;
}

/**
 * 이미지를 흑백으로 변환
 */
export async function convertToGrayscale(uri: string): Promise<string> {
  if (Platform.OS === 'web') return uri;

  const ImageManipulator = await import('expo-image-manipulator');
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [],
    { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}
