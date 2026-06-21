import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import type { StickerKind } from '@/styles/diaryThemes';

import { seeded } from './seeded';

interface StickerProps {
  kind: StickerKind;
  size?: number;
  /** 메인 fill 컬러 — 테마 액센트 또는 tint */
  color: string;
  /** 외곽 흰 die-cut 컬러 */
  outline?: string;
  /** 회전 각도 (deg) — 미지정 시 kind+size로 결정 */
  rotate?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * 다꾸 스티커 — react-native-svg 패스.
 * 기본은 흰 die-cut 외곽 + 컬러 fill로 "스티커처럼" 보이게.
 */
export function Sticker({
  kind,
  size = 28,
  color,
  outline = '#FFFFFF',
  rotate,
  style,
}: StickerProps) {
  const rot = rotate ?? seeded(kind + size, 20);
  return (
    <View
      pointerEvents="none"
      style={[
        {
          width: size,
          height: size,
          transform: [{ rotate: `${rot}deg` }],
        },
        style,
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 40 40">
        {kind === 'heart' && (
          <>
            <Path d="M20 34 L6 18 A7 7 0 0 1 20 10 A7 7 0 0 1 34 18 Z" fill={outline} />
            <Path d="M20 32 L8 18 A5.5 5.5 0 0 1 20 12 A5.5 5.5 0 0 1 32 18 Z" fill={color} />
          </>
        )}
        {kind === 'star' && (
          <>
            <Path
              d="M20 3 L24.5 15 L37 15.5 L27 24 L30 37 L20 29 L10 37 L13 24 L3 15.5 L15.5 15 Z"
              fill={outline}
            />
            <Path
              d="M20 6 L23.5 16 L34 16.5 L26 23 L28.5 33 L20 27.5 L11.5 33 L14 23 L6 16.5 L16.5 16 Z"
              fill={color}
            />
          </>
        )}
        {kind === 'flower' && (
          <>
            <Circle cx={20} cy={8} r={6} fill={outline} />
            <Circle cx={32} cy={20} r={6} fill={outline} />
            <Circle cx={20} cy={32} r={6} fill={outline} />
            <Circle cx={8} cy={20} r={6} fill={outline} />
            <Circle cx={20} cy={20} r={8} fill={outline} />
            <Circle cx={20} cy={9} r={4.5} fill={color} />
            <Circle cx={31} cy={20} r={4.5} fill={color} />
            <Circle cx={20} cy={31} r={4.5} fill={color} />
            <Circle cx={9} cy={20} r={4.5} fill={color} />
            <Circle cx={20} cy={20} r={4.5} fill="#FFE9B0" />
          </>
        )}
        {kind === 'cloud' && (
          <Path
            d="M10 26 Q4 26 6 20 Q4 14 12 14 Q14 6 24 10 Q34 8 32 18 Q38 20 34 26 Z"
            fill={outline}
            stroke="#2E2622"
            strokeWidth={1.5}
          />
        )}
        {kind === 'note' && (
          <>
            <Rect x={5} y={5} width={30} height={30} fill={outline} />
            <Rect x={7} y={7} width={26} height={26} fill={color} />
            <Path
              d="M14 10 L14 24 A3 3 0 1 1 11 21 L11 13 L26 10 L26 22 A3 3 0 1 1 23 19 L23 12 Z"
              fill="#2E2622"
            />
          </>
        )}
        {kind === 'checkmark' && (
          <>
            <Circle cx={20} cy={20} r={16} fill={outline} />
            <Circle cx={20} cy={20} r={13} fill={color} />
            <Path
              d="M12 21 L18 27 L29 14"
              stroke={outline}
              strokeWidth={3.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
        {kind === 'sparkle' && (
          <Path
            d="M20 4 L22 18 L36 20 L22 22 L20 36 L18 22 L4 20 L18 18 Z"
            fill={color}
          />
        )}
      </Svg>
    </View>
  );
}
