import React, { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line, Pattern, Rect } from 'react-native-svg';

import type { DiaryTheme } from '@/styles/diaryThemes';

interface ThemeBgProps {
  theme: DiaryTheme;
}

/**
 * 테마별 페이지 배경 오버레이.
 *
 * - grid_minimal : 격자 패턴
 * - pixel_retro  : 도트 패턴
 * - y2k_pastel   : 옅은 도트 패턴
 * - vintage_film / dark_academia / dreamy_cloud : **원톤 (단색)**
 *   디자인 의도대로 그라데이션 / 비넷 없이 theme.bg 단색만 노출.
 *   (diary-detail / footprint-create 컨테이너의 backgroundColor: dt.bg 그대로 사용)
 */
export function ThemeBg({ theme }: ThemeBgProps) {
  const uid = useId().replace(/[:]/g, '');
  const patId = `bg-pat-${uid}`;

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

  // vintage_film / dark_academia / dreamy_cloud — 원톤 (오버레이 없음)
  // diary-detail 컨테이너의 backgroundColor: dt.bg 가 그대로 노출됨.
  return null;
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
});
