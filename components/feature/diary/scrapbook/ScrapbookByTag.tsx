import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import type { DiaryTheme } from '@/styles/diaryThemes';

interface ScrapbookByTagProps {
  theme: DiaryTheme;
  /** 라벨 — "by" or "by." */
  prefix?: string;
  /** 닉네임 */
  name: string;
  /** 색상 강조 (mine vs partner) */
  colorKey?: 'accent' | 'accentDeep';
  style?: StyleProp<ViewStyle>;
}

/**
 * 다꾸 by 태그 — 살짝 회전된 스티커 라벨.
 * grid_minimal: 회전·그림자 없음.
 */
export function ScrapbookByTag({
  theme: t,
  prefix = 'by.',
  name,
  colorKey = 'accent',
  style,
}: ScrapbookByTagProps) {
  const isMinimal = t.id === 'grid_minimal';
  return (
    <View
      style={[
        styles.tag,
        {
          backgroundColor: t.tints[2],
          borderColor: t.line,
          transform: isMinimal ? [] : [{ rotate: '-2deg' }],
          shadowColor: '#2E2622',
          shadowOffset: { width: 1, height: 2 },
          shadowOpacity: isMinimal ? 0 : 0.18,
          shadowRadius: 0,
          elevation: isMinimal ? 0 : 2,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.prefix,
          {
            color: t.inkSoft,
            fontFamily: t.bodyFont,
            fontWeight: t.bodyWeight,
          },
        ]}
      >
        {prefix}
      </Text>
      <Text
        style={[
          styles.name,
          {
            color: t[colorKey],
            fontFamily: t.handFont,
            fontWeight: t.handWeight,
          },
        ]}
        numberOfLines={1}
      >
        {' '}
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderRadius: 2,
  },
  prefix: {
    fontSize: 11,
  },
  name: {
    fontSize: 14,
  },
});
