import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';

interface PixelCardProps {
  children: React.ReactNode;
  /** 보더 두께 */
  borderWidth?: 2 | 3;
  /** 카드 배경색 */
  bg?: string;
  /** 그림자 색상 */
  shadowColor?: string;
  /** 추가 스타일 */
  style?: ViewStyle;
}

const PixelCard: React.FC<PixelCardProps> = ({
  children,
  borderWidth = 2,
  bg = theme.colors.surface,
  shadowColor,
  style,
}) => {
  const cardStyle: ViewStyle = {
    backgroundColor: bg,
    borderWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: SPACING.lg,
    // 픽셀 솔리드 그림자
    shadowColor: shadowColor ?? theme.colors.border,
    shadowOffset: { width: borderWidth + 1, height: borderWidth + 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: borderWidth + 1,
  };

  return (
    <View style={[cardStyle, style]}>
      {children}
    </View>
  );
};

export default PixelCard;
