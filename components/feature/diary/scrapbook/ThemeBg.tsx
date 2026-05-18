import React, { useId } from 'react';
import {
  Image,
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
 * 텍스처는 256~512px 시밍 이미지를 resizeMode="repeat"로 깔아서 GPU 메모리·
 * 디코드 비용 최소화.
 */
export function ThemeBg({ theme, children, style }: ThemeBgProps) {
  const uid = useId().replace(/[:]/g, '');
  const patId = `bg-pat-${uid}`;
  const texture = theme.bgTexture ? textureSrc(theme.bgTexture) : undefined;

  // Sibling 오버레이 모드 — 부모의 absoluteFill 차지
  if (children === undefined) {
    return (
      <>
        {texture && (
          <View style={styles.fill} pointerEvents="none">
            <Image
              source={texture}
              style={[
                styles.fill,
                { opacity: theme.bgTextureOpacity ?? 0.4 },
              ]}
              resizeMode="repeat"
            />
          </View>
        )}
        <PatternLayer theme={theme} patId={patId} />
      </>
    );
  }

  // Wrapper 모드 — 자식 콘텐츠 높이만큼 자라고 텍스처가 그 전체를 덮음
  return (
    <View style={style}>
      {texture && (
        <View style={styles.fill} pointerEvents="none">
          <Image
            source={texture}
            style={[
              styles.fill,
              { opacity: theme.bgTextureOpacity ?? 0.4 },
            ]}
            resizeMode="repeat"
          />
        </View>
      )}
      <PatternLayer theme={theme} patId={patId} />
      {children}
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
});
