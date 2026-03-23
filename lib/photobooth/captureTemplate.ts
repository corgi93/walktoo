import { type RefObject } from 'react';
import { Alert, Platform, type View } from 'react-native';

/**
 * PhotoBoothCanvas View를 이미지로 캡처
 * react-native-view-shot은 dev build 전용 (Expo Go 미지원)
 * @returns 로컬 file:// URI
 */
export async function captureTemplate(viewRef: RefObject<View | null>): Promise<string | null> {
  try {
    const ViewShot = require('react-native-view-shot');
    const uri = await ViewShot.captureRef(viewRef, {
      format: 'jpg',
      quality: 0.92,
    });

    if (Platform.OS === 'web') return uri;

    const ImageManipulator = require('expo-image-manipulator');
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.88, format: ImageManipulator.SaveFormat.JPEG },
    );

    return result.uri;
  } catch {
    Alert.alert(
      '캡처 불가',
      'Development Build에서만 사용 가능해요.\nExpo Go에서는 지원되지 않습니다.',
    );
    return null;
  }
}

/**
 * 이미지를 흑백으로 변환
 */
export async function convertToGrayscale(uri: string): Promise<string> {
  if (Platform.OS === 'web') return uri;

  try {
    const ImageManipulator = require('expo-image-manipulator');
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG },
    );
    return result.uri;
  } catch {
    return uri;
  }
}
