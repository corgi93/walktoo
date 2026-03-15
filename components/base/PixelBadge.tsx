import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';

import Text from './Text';

interface PixelBadgeProps {
  /** 배지 텍스트 */
  label: string;
  /** 배지 색상 */
  color?: string;
  /** 배경 색상 */
  bg?: string;
  /** 아이콘 이모지 (왼쪽) */
  icon?: string;
  /** 크기 */
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

const PixelBadge: React.FC<PixelBadgeProps> = ({
  label,
  color = theme.colors.text,
  bg = theme.colors.gray100,
  icon,
  size = 'medium',
  style,
}) => {
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          paddingHorizontal: isSmall ? SPACING.sm : SPACING.md,
          paddingVertical: isSmall ? SPACING.xxs : SPACING.xs,
        },
        style,
      ]}
    >
      {icon && <Text style={{ fontSize: isSmall ? 10 : 12 }}>{icon}</Text>}
      <Text
        variant={isSmall ? 'caption' : 'label'}
        style={{ color, marginLeft: icon ? SPACING.xxs : 0 }}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
});

export default PixelBadge;
