import React, { memo } from 'react';
import { View, ViewStyle } from 'react-native';

// ─── Color Palette ──────────────────────────────────────

const MALE_PALETTE = [
  'transparent', // 0
  '#2C2C2E',     // 1: outline / eyes
  '#4A3228',     // 2: hair dark
  '#6B4C3B',     // 3: hair mid
  '#8B6B50',     // 4: hair highlight
  '#FFDCB2',     // 5: skin
  '#F0C8A0',     // 6: skin shadow
  '#FFB5A0',     // 7: blush
  '#FF8C7C',     // 8: mouth
  '#FFFFFF',     // 9: eye white
  '#E8706A',     // 10: shirt (primary coral)
  '#C4524C',     // 11: shirt shadow
  '#3D5A80',     // 12: pants
  '#2E4560',     // 13: pants shadow
  '#B8834E',     // 14: shoes
  '#8B6420',     // 15: shoe shadow
];

// ─── Male Character Grid (16×22) ────────────────────────
// Chibi-style RPG character with warm coral shirt

const MALE_GRID = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5
  [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0], // 0:  hair crown
  [0,0,0,0,1,2,2,3,3,2,2,1,0,0,0,0], // 1:  hair top
  [0,0,0,1,2,3,4,3,3,4,3,2,1,0,0,0], // 2:  hair wide (highlights)
  [0,0,0,1,2,3,2,3,3,2,3,2,1,0,0,0], // 3:  hair texture
  [0,0,0,1,2,2,2,2,2,2,2,2,1,0,0,0], // 4:  hair bottom
  [0,0,0,1,2,5,5,5,5,5,5,2,1,0,0,0], // 5:  forehead + sideburns
  [0,0,0,1,5,5,5,5,5,5,5,5,1,0,0,0], // 6:  face upper
  [0,0,0,1,5,9,1,5,5,9,1,5,1,0,0,0], // 7:  eyes (white+pupil)
  [0,0,0,1,5,5,5,5,5,5,5,5,1,0,0,0], // 8:  nose area
  [0,0,0,1,5,7,5,8,8,5,7,5,1,0,0,0], // 9:  blush + smile
  [0,0,0,0,1,5,5,5,5,5,5,1,0,0,0,0], // 10: chin
  [0,0,0,0,0,1,6,5,5,6,1,0,0,0,0,0], // 11: neck
  [0,0,0,1,1,10,10,10,10,10,10,1,1,0,0,0], // 12: shoulders
  [0,0,1,10,10,10,10,10,10,10,10,10,10,1,0,0], // 13: torso
  [0,0,1,10,10,10,11,10,10,11,10,10,10,1,0,0], // 14: torso detail
  [0,0,1,5,10,10,10,10,10,10,10,10,5,1,0,0], // 15: arms/hands
  [0,0,0,1,11,10,10,10,10,10,10,11,1,0,0,0], // 16: waist
  [0,0,0,1,12,12,12,12,12,12,12,12,1,0,0,0], // 17: pants top
  [0,0,0,1,12,12,12,1,1,12,12,12,1,0,0,0], // 18: legs start
  [0,0,0,1,12,13,1,0,0,1,13,12,1,0,0,0], // 19: legs apart (shadow inside)
  [0,0,1,14,14,14,1,0,0,1,14,14,14,1,0,0], // 20: shoes
  [0,0,1,15,15,15,1,0,0,1,15,15,15,1,0,0], // 21: shoe soles
];

// ─── Component ──────────────────────────────────────────

interface PixelCharacterProps {
  type?: 'male';
  pixelSize?: number;
  style?: ViewStyle;
}

const PixelCharacter: React.FC<PixelCharacterProps> = memo(
  ({ type = 'male', pixelSize = 5, style }) => {
    const grid = MALE_GRID;
    const palette = MALE_PALETTE;
    const cols = grid[0].length;
    const rows = grid.length;

    return (
      <View
        style={[
          {
            width: cols * pixelSize,
            height: rows * pixelSize,
          },
          style,
        ]}
      >
        {grid.map((row, y) => (
          <View key={y} style={{ flexDirection: 'row', height: pixelSize }}>
            {row.map((cell, x) => (
              <View
                key={x}
                style={{
                  width: pixelSize,
                  height: pixelSize,
                  backgroundColor: palette[cell],
                }}
              />
            ))}
          </View>
        ))}
      </View>
    );
  },
);

PixelCharacter.displayName = 'PixelCharacter';

export default PixelCharacter;
