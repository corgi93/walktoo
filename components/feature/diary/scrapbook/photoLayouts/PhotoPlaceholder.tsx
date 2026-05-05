import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { DiaryTheme } from '@/styles/diaryThemes';

interface PhotoPlaceholderProps {
  theme: DiaryTheme;
  index: number;
  /** 글자 크기 — 작은 셀에서는 줄임 */
  size?: number;
}

/**
 * 사진이 없는 슬롯에 표시되는 'PHOTO·01' 라벨.
 * 디자인의 PhotoPH 포팅.
 */
export function PhotoPlaceholder({ theme: t, index, size = 12 }: PhotoPlaceholderProps) {
  return (
    <View pointerEvents="none" style={styles.wrap}>
      <Text
        style={[
          styles.text,
          {
            fontFamily: t.monoFont,
            color: t.ink,
            fontSize: size,
          },
        ]}
      >
        PHOTO·0{index + 1}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    opacity: 0.35,
    letterSpacing: 1.5,
  },
});
