import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { DiaryTheme } from '@/styles/diaryThemes';

import { ImageTape } from './ImageTape';
import { WashiTape } from './WashiTape';

interface ScrapbookDateBannerProps {
  theme: DiaryTheme;
  date: string;
  place: string;
}

/**
 * 날짜·장소 배너 — 살짝 회전 + 좌상단 와시테이프.
 * 디자인의 DateBanner.
 */
export function ScrapbookDateBanner({
  theme: t,
  date,
  place,
}: ScrapbookDateBannerProps) {
  const isMinimal = t.id === 'grid_minimal';

  return (
    <View
      style={[
        styles.wrap,
        {
          alignSelf: 'flex-start',
          transform: isMinimal ? [] : [{ rotate: '-1.5deg' }],
          backgroundColor: t.paper,
          borderColor: t.line,
          shadowColor: '#2E2622',
          shadowOffset: { width: 2, height: 3 },
          shadowOpacity: isMinimal ? 0 : 0.18,
          shadowRadius: 0,
          elevation: isMinimal ? 0 : 2,
        },
      ]}
    >
      <Text
        style={[
          styles.date,
          {
            fontFamily: t.monoFont,
            color: t.accent,
          },
        ]}
        numberOfLines={1}
      >
        {date}
      </Text>
      <View
        style={[
          styles.divider,
          { backgroundColor: t.line },
        ]}
      />
      <Text
        style={[
          styles.place,
          {
            fontFamily: t.handFont,
            fontWeight: t.handWeight,
            color: t.ink,
            transform: isMinimal ? [] : [{ rotate: '-2deg' }],
          },
        ]}
        numberOfLines={1}
      >
        ◉ {place}
      </Text>

      {!isMinimal &&
        (t.imgTapes[0] ? (
          <ImageTape
            id={t.imgTapes[0]}
            width={54}
            rotate={-18}
            style={{ top: -10, left: -12 }}
          />
        ) : (
          <WashiTape
            width={42}
            height={12}
            rotate={-18}
            color={t.tapes[0].color}
            pattern={t.tapes[0].pattern}
            patternColor={t.tapes[0].patternColor}
            style={{ top: -8, left: -8 }}
            opacity={0.92}
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 14,
    borderWidth: 1,
    position: 'relative',
  },
  date: {
    fontSize: 16,
    letterSpacing: 1,
    flexShrink: 0,
  },
  divider: {
    width: 1,
    height: 18,
  },
  place: {
    fontSize: 17,
    flexShrink: 1,
  },
});
