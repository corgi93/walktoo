import React from 'react';
import { Image, StyleProp, View, ViewStyle } from 'react-native';

import { tapeSrc, type DiaryTapeId } from './assetRegistry';

interface ImageTapeProps {
  /** 레지스트리 ID (예: 'coral-solid') */
  id: DiaryTapeId;
  /** 표시 폭 — 높이는 4.3:1 비율로 자동 계산 */
  width?: number;
  /** 명시적 높이 — 미지정 시 width / 4.3 */
  height?: number;
  rotate?: number;
  opacity?: number;
  /** 외부 위치 — absolute top/left/right/bottom */
  style?: StyleProp<ViewStyle>;
}

/**
 * PNG 와시테이프 — 회전 + 솔리드 그림자.
 * 디자인의 ImageTape를 RN으로 포팅.
 */
export function ImageTape({
  id,
  width = 120,
  height,
  rotate = 0,
  opacity = 0.95,
  style,
}: ImageTapeProps) {
  const h = height ?? Math.round(width / 4.3);
  return (
    <View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width,
          height: h,
          opacity,
          transform: [{ rotate: `${rotate}deg` }],
          shadowColor: '#2E2622',
          shadowOffset: { width: 1, height: 1.5 },
          shadowOpacity: 0.18,
          shadowRadius: 0,
          elevation: 1,
        },
        style,
      ]}
    >
      <Image
        source={tapeSrc(id)}
        style={{ width: '100%', height: '100%' }}
        resizeMode="stretch"
      />
    </View>
  );
}
