import React, { useCallback, useId, useState } from 'react';
import {
  Image,
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Circle, Defs, Line, Pattern, Rect } from 'react-native-svg';

import type { DiaryTheme } from '@/styles/diaryThemes';

import { textureSrc } from './assetRegistry';

interface ThemeBgProps {
  theme: DiaryTheme;
  /**
   * 콘텐츠를 감싸는 wrapper 모드. children이 있으면 ThemeBg가 그 높이만큼
   * 자라고 텍스처/패턴이 자식 영역 전체를 덮음. ScrollView 안에서 스크롤
   * 끝까지 텍스처가 깔리게 하려면 이 모드를 써야 함.
   *
   * children이 없으면 sibling 오버레이 모드 — 부모의 absoluteFill을 차지함.
   * (헤더 등 작은 영역 + 부모 크기가 viewport-bound인 경우용)
   */
  children?: React.ReactNode;
  /** wrapper 컨테이너 추가 스타일 */
  style?: StyleProp<ViewStyle>;
}

/**
 * 테마별 페이지 배경 오버레이/래퍼.
 *
 * 레이어 순서 (아래 → 위):
 *  1. 부모/wrapper 의 backgroundColor (dt.bg)
 *  2. 종이/필름/가죽 텍스처 — theme.bgTexture가 등록돼 있을 때만
 *  3. SVG 패턴 — grid_minimal / pixel_retro / y2k_pastel
 *  4. children (wrapper 모드에서)
 *
 * 텍스처는 측정된 영역 전체에 작은 타일을 반복 배치한다. Android에서
 * resizeMode="repeat" 또는 긴 단일 cover 이미지가 스크롤 중 경계를 만들 수 있어
 * 명시적인 tile grid로 모든 테마의 긴 스크롤 배경을 덮는다.
 */
export function ThemeBg({ theme, children, style }: ThemeBgProps) {
  const uid = useId().replace(/[:]/g, '');
  const patId = `bg-pat-${uid}`;
  const texture = theme.bgTexture ? textureSrc(theme.bgTexture) : undefined;
  const textureOpacity = theme.bgTextureOpacity ?? 0.4;

  // Sibling 오버레이 모드 — 부모의 absoluteFill 차지
  if (children === undefined) {
    return (
      <>
        {texture && (
          <TextureLayer texture={texture} opacity={textureOpacity} />
        )}
        <PatternLayer theme={theme} patId={patId} />
      </>
    );
  }

  // Wrapper 모드 — 자식 콘텐츠 높이만큼 자라고 텍스처가 그 전체를 덮음
  return (
    <View style={[{ backgroundColor: theme.bg }, style]}>
      {texture && (
        <TextureLayer texture={texture} opacity={textureOpacity} />
      )}
      <PatternLayer theme={theme} patId={patId} />
      {children}
    </View>
  );
}

function TextureLayer({
  texture,
  opacity,
}: {
  texture: ReturnType<typeof textureSrc>;
  opacity: number;
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) => {
      if (
        Math.abs(prev.width - width) < 1 &&
        Math.abs(prev.height - height) < 1
      ) {
        return prev;
      }
      return { width, height };
    });
  }, []);

  if (!texture) return null;

  const tile = 220;
  const maxTiles = 120;
  const cols = Math.max(1, Math.ceil(size.width / tile));
  // 행 단위로 클램프 — 캡에 걸려도 마지막 행이 부분적으로 비지 않게
  const rows = Math.min(
    Math.max(1, Math.ceil(size.height / tile)),
    Math.max(1, Math.floor(maxTiles / cols)),
  );
  const count = cols * rows;

  return (
    <View
      style={[styles.fill, styles.clip]}
      pointerEvents="none"
      onLayout={handleLayout}
    >
      {Array.from({ length: count }).map((_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        return (
          <Image
            key={`texture-${row}-${col}`}
            source={texture}
            style={[
              styles.tile,
              {
                width: tile,
                height: tile,
                left: col * tile,
                top: row * tile,
                opacity,
              },
            ]}
            resizeMode="cover"
          />
        );
      })}
    </View>
  );
}

function PatternLayer({ theme, patId }: { theme: DiaryTheme; patId: string }) {
  if (theme.id === 'grid_minimal') {
    return (
      <View style={styles.fill} pointerEvents="none">
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            <Pattern id={patId} patternUnits="userSpaceOnUse" width={24} height={24}>
              <Rect width={24} height={24} fill="transparent" />
              <Line x1={0} y1={0} x2={24} y2={0} stroke={theme.line} strokeWidth={1} opacity={theme.gridOpacity} />
              <Line x1={0} y1={0} x2={0} y2={24} stroke={theme.line} strokeWidth={1} opacity={theme.gridOpacity} />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${patId})`} />
        </Svg>
      </View>
    );
  }

  if (theme.id === 'pixel_retro') {
    return (
      <View style={styles.fill} pointerEvents="none">
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            <Pattern id={patId} patternUnits="userSpaceOnUse" width={10} height={10}>
              <Rect width={10} height={10} fill="transparent" />
              <Circle cx={5} cy={5} r={1} fill={theme.line} opacity={theme.gridOpacity} />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${patId})`} />
        </Svg>
      </View>
    );
  }

  if (theme.id === 'y2k_pastel') {
    return (
      <View style={styles.fill} pointerEvents="none">
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            <Pattern id={patId} patternUnits="userSpaceOnUse" width={8} height={8}>
              <Rect width={8} height={8} fill="transparent" />
              <Circle cx={4} cy={4} r={0.8} fill={theme.line} opacity={theme.gridOpacity} />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${patId})`} />
        </Svg>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  // iOS는 overflow 기본이 visible — 경계 밖 타일이 영역 밖으로 보이지 않게
  clip: {
    overflow: 'hidden',
  },
  tile: {
    position: 'absolute',
  },
});
