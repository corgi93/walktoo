import React from 'react';
import { Image, StyleProp, View, ViewStyle } from 'react-native';

import { stickerSrc, type DiaryStickerId } from './assetRegistry';

interface ImageStickerProps {
  /** 레지스트리 ID (예: 'button-flower') */
  id: DiaryStickerId;
  /** 폭 — 높이는 PNG의 원본 비율 따라 (RN Image는 width만 주면 자동 비율 X,
   *  따라서 정사각으로 가정. 비정사각이 필요한 sticker는 별도 height prop) */
  size?: number;
  /** 명시 높이 — 미지정 시 size 정사각 */
  height?: number;
  rotate?: number;
  shadow?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * PNG 스티커 — 회전 + 옵션 그림자.
 * 디자인의 ImageSticker를 RN으로 포팅.
 */
export function ImageSticker({
  id,
  size = 44,
  height,
  rotate = 0,
  shadow = true,
  style,
}: ImageStickerProps) {
  const h = height ?? size;
  return (
    <View
      pointerEvents="none"
      style={[
        {
          width: size,
          height: h,
          transform: [{ rotate: `${rotate}deg` }],
          ...(shadow && {
            shadowColor: '#2E2622',
            shadowOffset: { width: 1.5, height: 2 },
            shadowOpacity: 0.22,
            shadowRadius: 0,
            elevation: 2,
          }),
        },
        style,
      ]}
    >
      <Image
        source={stickerSrc(id)}
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
      />
    </View>
  );
}
