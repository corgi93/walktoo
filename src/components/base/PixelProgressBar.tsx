import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';

import Text from './Text';

interface PixelProgressBarProps {
  /** 0 ~ 1 사이 진행률 */
  progress: number;
  /** 총 세그먼트 수 */
  segments?: number;
  /** 채워진 색상 */
  fillColor?: string;
  /** 라벨 (오른쪽에 표시) */
  label?: string;
  /** 높이 */
  height?: number;
  style?: ViewStyle;
}

const PixelProgressBar: React.FC<PixelProgressBarProps> = ({
  progress,
  segments = 10,
  fillColor = theme.colors.primary,
  label,
  height = 16,
  style,
}) => {
  const filledCount = Math.round(progress * segments);

  return (
    <View style={[styles.wrapper, style]}>
      <View style={[styles.track, { height }]}>
        {Array.from({ length: segments }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.segment,
              {
                height: height - 4,
                backgroundColor: i < filledCount ? fillColor : theme.colors.gray200,
              },
              i === 0 && { marginLeft: 0 },
            ]}
          />
        ))}
      </View>
      {label && (
        <Text variant="caption" color="textSecondary" ml="sm">
          {label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  track: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 2,
    paddingHorizontal: 2,
    backgroundColor: theme.colors.gray100,
  },
  segment: {
    flex: 1,
    borderRadius: 1,
  },
});

export default PixelProgressBar;
