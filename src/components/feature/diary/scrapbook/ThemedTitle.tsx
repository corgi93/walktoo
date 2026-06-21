import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';

import type { DiaryTheme } from '@/styles/diaryThemes';

interface ThemedTitleProps {
  theme: DiaryTheme;
  text: string;
  size?: number;
  sub?: string;
  style?: StyleProp<TextStyle>;
}

/**
 * 테마별 타이틀 — titleMode에 따라 스타일링.
 * 디자인의 ransom-cutout/serif/pixel/clean/italic/dark 6종 매핑.
 *
 * RN에서는 ransom의 글자별 회전 컷아웃은 비용 대비 효과 낮아서
 * 컬러 액센트 + 텍스트 그림자로 비슷한 임팩트.
 */
export function ThemedTitle({
  theme: t,
  text,
  size = 26,
  sub,
  style,
}: ThemedTitleProps) {
  const titleBase: TextStyle = {
    fontFamily: t.titleFont,
    fontWeight: t.titleWeight,
    color: t.ink,
    fontSize: size,
    lineHeight: size * 1.05,
  };

  if (t.titleMode === 'ransom') {
    return (
      <View style={styles.row}>
        <Text
          style={[
            titleBase,
            {
              color: t.accent,
              letterSpacing: -0.5,
              textShadowColor: t.tints[1],
              textShadowOffset: { width: 2, height: 2 },
              textShadowRadius: 0,
            },
            style,
          ]}
        >
          {text}
        </Text>
        {sub && (
          <Text
            style={[
              styles.sub,
              {
                fontFamily: t.handFont,
                color: t.inkSoft,
                fontSize: size * 0.55,
                transform: [{ rotate: '-4deg' }],
              },
            ]}
          >
            {sub}
          </Text>
        )}
      </View>
    );
  }

  if (t.titleMode === 'serif') {
    return (
      <View>
        <Text
          style={[
            titleBase,
            {
              fontStyle: 'italic',
              fontSize: size * 1.1,
              letterSpacing: -0.5,
            },
            style,
          ]}
        >
          {text}
        </Text>
        {sub && (
          <Text
            style={[
              styles.sub,
              {
                fontFamily: t.handFont,
                color: t.accentDeep,
                fontSize: size * 0.5,
              },
            ]}
          >
            {sub}
          </Text>
        )}
      </View>
    );
  }

  if (t.titleMode === 'pixel') {
    return (
      <View style={styles.row}>
        <Text
          style={[
            titleBase,
            {
              color: t.accent,
              letterSpacing: 1,
              textShadowColor: t.ink,
              textShadowOffset: { width: 2, height: 2 },
              textShadowRadius: 0,
            },
            style,
          ]}
        >
          {text}
        </Text>
        {sub && (
          <Text
            style={[
              styles.sub,
              { fontFamily: t.bodyFont, color: t.inkSoft, fontSize: size * 0.5 },
            ]}
          >
            {sub}
          </Text>
        )}
      </View>
    );
  }

  if (t.titleMode === 'italic') {
    return (
      <View>
        <Text
          style={[
            titleBase,
            { fontStyle: 'italic', letterSpacing: -0.8 },
            style,
          ]}
        >
          {text}
        </Text>
        {sub && (
          <Text
            style={[
              styles.sub,
              {
                fontFamily: t.handFont,
                color: t.accent,
                fontSize: size * 0.6,
                transform: [{ rotate: '-2deg' }],
              },
            ]}
          >
            {sub}
          </Text>
        )}
      </View>
    );
  }

  if (t.titleMode === 'dark') {
    return (
      <View>
        <Text
          style={[
            titleBase,
            {
              color: t.paper,
              backgroundColor: t.ink,
              paddingHorizontal: 6,
              paddingVertical: 2,
              alignSelf: 'flex-start',
              letterSpacing: 2,
              textTransform: 'uppercase',
              fontStyle: 'italic',
            },
            style,
          ]}
        >
          {text}
        </Text>
        {sub && (
          <Text
            style={[
              styles.sub,
              {
                fontFamily: t.handFont,
                color: t.tints[0],
                fontSize: size * 0.5,
                marginTop: 4,
              },
            ]}
          >
            — {sub} —
          </Text>
        )}
      </View>
    );
  }

  // clean (grid_minimal)
  return (
    <View>
      <Text style={[titleBase, { letterSpacing: -1 }, style]}>{text}</Text>
      {sub && (
        <Text
          style={[
            styles.sub,
            {
              fontFamily: t.bodyFont,
              fontWeight: t.bodyWeight,
              color: t.inkSoft,
              fontSize: size * 0.42,
              marginTop: 3,
            },
          ]}
        >
          {sub}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sub: {
    marginTop: 2,
  },
});
