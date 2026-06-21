import React from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import type { DiaryTheme, TapeSpec } from '@/styles/diaryThemes';

import { seeded } from './seeded';
import { Sticker } from './Sticker';
import { WashiTape } from './WashiTape';

interface TapedPolaroidProps {
  /** 사진 uri (없으면 placeholder children 사용) */
  photoUri?: string;
  /** 안에 들어갈 children — 사진이 없을 때 placeholder UI */
  children?: React.ReactNode;
  /** 손글씨 캡션 — 사진 아래 */
  caption?: string;
  /** 카드 뒤 tint (사진 없을 때 배경) */
  tint: string;
  /** 회전 각도 — 미지정 시 seed로 결정 */
  rotate?: number;
  /** 위에 붙는 와시테이프들 */
  tapes: readonly TapeSpec[];
  /** 외부 폭 — 정사각 폴라로이드 */
  size: number;
  /** 사진 영역 가로:세로 비 (default 1) */
  photoAspect?: number;
  /** seed for deterministic decoration */
  seed?: string;
  /** 우측 하단 별 스티커 표시 여부 */
  sticky?: boolean;
  /** 스티커 컬러 — 미지정 시 theme.accent */
  stickerColor?: string;
  /** 컨테이너 스타일 — absolute positioning 등 */
  style?: StyleProp<ViewStyle>;
  /** 사진 우측 하단 날짜 스탬프 (예: "04·21·26") */
  stampDate?: string;
  /** 테마 — 폰트/색상에 사용 */
  theme: DiaryTheme;
}

/**
 * 와시테이프로 붙은 폴라로이드 프레임.
 * - 모서리 살짝 회전
 * - 윗면에 와시테이프 1~2개
 * - 사진 영역 + 캡션 + 옵션 날짜 스탬프
 * - 우측 하단 옵션 스티커
 *
 * 데이터 레이어 무관 — `photoUri` 또는 `children` 중 하나로 컨텐츠 표시.
 */
export function TapedPolaroid({
  photoUri,
  children,
  caption,
  tint,
  rotate,
  tapes,
  size,
  photoAspect = 1,
  seed = 'p',
  sticky = false,
  stickerColor,
  style,
  stampDate,
  theme,
}: TapedPolaroidProps) {
  const rot = rotate ?? seeded(seed, 6);

  return (
    <View
      style={[
        {
          width: size,
          transform: [{ rotate: `${rot}deg` }],
        },
        styles.container,
        style,
      ]}
    >
      {/* paper */}
      <View
        style={[
          styles.paper,
          {
            paddingBottom: caption ? 26 : 14,
            borderColor: theme.line,
          },
        ]}
      >
        {/* photo area */}
        <View
          style={[
            styles.photo,
            {
              backgroundColor: tint,
              aspectRatio: photoAspect,
            },
          ]}
        >
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              style={styles.photoImage}
              resizeMode="cover"
            />
          ) : (
            children
          )}
        </View>

        {stampDate && (
          <View style={styles.stamp}>
            <View
              style={[
                styles.stampInner,
                { backgroundColor: 'rgba(255,255,255,0.7)' },
              ]}
            >
              {/* monoFont는 RN Text 안에서만 적용되는데 여긴 단순 표시 */}
            </View>
          </View>
        )}
      </View>

      {/* tapes overlapping the top edge */}
      {tapes.map((t, i) => {
        const n = tapes.length;
        const tapeWidth = size * 0.45;
        const x = n === 1 ? size / 2 : (size / (n + 1)) * (i + 1);
        const rr = seeded(`${seed}tape${i}`, 30);
        return (
          <WashiTape
            key={i}
            width={tapeWidth}
            height={14}
            rotate={rr}
            color={t.color}
            pattern={t.pattern}
            patternColor={t.patternColor}
            style={{
              left: x - tapeWidth / 2,
              top: -6 + seeded(`${seed}tapeY${i}`, 4),
              zIndex: 5,
            }}
          />
        );
      })}

      {sticky && (
        <Sticker
          kind="star"
          size={22}
          color={stickerColor ?? theme.accent}
          style={{ position: 'absolute', bottom: -10, right: -8, zIndex: 6 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // pixel "drop-shadow" feel via android elevation + ios shadow
    shadowColor: '#2E2622',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 0,
    elevation: 3,
  },
  paper: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderWidth: 1,
    position: 'relative',
  },
  photo: {
    position: 'relative',
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  stamp: {
    position: 'absolute',
    right: 10,
    bottom: 6,
  },
  stampInner: {
    paddingHorizontal: 3,
    minHeight: 12,
  },
});
