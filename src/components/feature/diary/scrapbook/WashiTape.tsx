import React, { useId } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Svg, {
  Defs,
  Mask,
  Path,
  Pattern,
  Rect,
  G,
} from 'react-native-svg';

import type { TapePattern } from '@/styles/diaryThemes';

interface WashiTapeProps {
  width: number;
  height: number;
  /** 회전 각도 (deg) — 음수도 가능 */
  rotate?: number;
  color: string;
  pattern?: TapePattern;
  patternColor?: string;
  /** 외부 컨테이너 스타일 — 보통 absolute positioning */
  style?: StyleProp<ViewStyle>;
  /** 투명도 — 종이 위에 살짝 비치는 느낌 */
  opacity?: number;
}

/**
 * 와시테이프 strip — SVG 기반.
 * 가장자리는 약간 들쭉날쭉(torn) mask로 잘라냄.
 * 패턴은 SVG <Pattern>으로 타일링 — solid/stripe/check/dot/grid 5종.
 */
export function WashiTape({
  width,
  height,
  rotate = 0,
  color,
  pattern = 'stripe',
  patternColor = 'rgba(46,38,34,0.22)',
  style,
  opacity = 0.85,
}: WashiTapeProps) {
  const uid = useId().replace(/[:]/g, '');
  const maskId = `wt-mask-${uid}`;
  const patternId = `wt-pat-${uid}`;

  // torn edge path — 윗변/아랫변에 4~5개 살짝 흔들리는 노치
  const tornPath = makeTornPath(width, height);

  return (
    <View
      style={[
        {
          position: 'absolute',
          width,
          height,
          transform: [{ rotate: `${rotate}deg` }],
          opacity,
        },
        style,
      ]}
      pointerEvents="none"
    >
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <Mask id={maskId}>
            <Path d={tornPath} fill="#fff" />
          </Mask>
          {pattern === 'stripe' && (
            <Pattern
              id={patternId}
              patternUnits="userSpaceOnUse"
              width={11}
              height={11}
              patternTransform="rotate(115)"
            >
              <Rect width={11} height={11} fill={color} />
              <Rect x={8} width={3} height={11} fill={patternColor} />
            </Pattern>
          )}
          {pattern === 'check' && (
            <Pattern
              id={patternId}
              patternUnits="userSpaceOnUse"
              width={12}
              height={12}
            >
              <Rect width={12} height={12} fill={color} />
              <Rect width={6} height={6} fill={patternColor} />
              <Rect x={6} y={6} width={6} height={6} fill={patternColor} />
            </Pattern>
          )}
          {pattern === 'dot' && (
            <Pattern
              id={patternId}
              patternUnits="userSpaceOnUse"
              width={7}
              height={7}
            >
              <Rect width={7} height={7} fill={color} />
              <Rect x={2.6} y={2.6} width={1.8} height={1.8} fill={patternColor} rx={0.9} />
            </Pattern>
          )}
          {pattern === 'grid' && (
            <Pattern
              id={patternId}
              patternUnits="userSpaceOnUse"
              width={6}
              height={6}
            >
              <Rect width={6} height={6} fill={color} />
              <Rect width={6} height={1} fill={patternColor} />
              <Rect width={1} height={6} fill={patternColor} />
            </Pattern>
          )}
        </Defs>
        <G mask={`url(#${maskId})`}>
          {pattern === 'solid' ? (
            <Rect width={width} height={height} fill={color} />
          ) : (
            <Rect width={width} height={height} fill={`url(#${patternId})`} />
          )}
        </G>
      </Svg>
    </View>
  );
}

// ─── Helpers ────────────────────────────────────────────

function makeTornPath(w: number, h: number): string {
  // 윗변: 0 → w 까지 8개 노치, 아랫변: w → 0 으로 8개 노치
  const top: [number, number][] = [
    [0, h * 0.15],
    [w * 0.08, h * 0.05],
    [w * 0.18, h * 0.2],
    [w * 0.3, h * 0.02],
    [w * 0.45, h * 0.22],
    [w * 0.58, h * 0.04],
    [w * 0.7, h * 0.18],
    [w * 0.85, h * 0.06],
    [w, h * 0.2],
  ];
  const bottom: [number, number][] = [
    [w, h * 0.82],
    [w * 0.92, h * 0.98],
    [w * 0.78, h * 0.84],
    [w * 0.66, h * 0.96],
    [w * 0.5, h * 0.78],
    [w * 0.36, h * 0.98],
    [w * 0.22, h * 0.82],
    [w * 0.1, h * 0.94],
    [0, h * 0.82],
  ];
  const cmds = [
    `M ${top[0][0]},${top[0][1]}`,
    ...top.slice(1).map(([x, y]) => `L ${x},${y}`),
    ...bottom.map(([x, y]) => `L ${x},${y}`),
    'Z',
  ];
  return cmds.join(' ');
}
