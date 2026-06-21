import React from 'react';
import { View, ViewStyle, ViewProps } from 'react-native';

import { SpaceValue, getSpacing } from '@/styles/type';

export interface BoxProps extends ViewProps {
  p?: SpaceValue;
  px?: SpaceValue;
  py?: SpaceValue;
  m?: SpaceValue;
  mx?: SpaceValue;
  my?: SpaceValue;
  gap?: number;
  flex?: number;
  bg?: string;
  radius?: number;
  center?: boolean;
}

const Box: React.FC<BoxProps> = ({
  p, px, py, m, mx, my,
  gap, flex, bg, radius, center,
  style, children, ...props
}) => {
  const boxStyle: ViewStyle = {
    ...(flex !== undefined && { flex }),
    ...(bg && { backgroundColor: bg }),
    ...(radius !== undefined && { borderRadius: radius }),
    ...(gap !== undefined && { gap }),
    ...(p !== undefined && { padding: getSpacing(p) }),
    ...(px !== undefined && { paddingHorizontal: getSpacing(px) }),
    ...(py !== undefined && { paddingVertical: getSpacing(py) }),
    ...(m !== undefined && { margin: getSpacing(m) }),
    ...(mx !== undefined && { marginHorizontal: getSpacing(mx) }),
    ...(my !== undefined && { marginVertical: getSpacing(my) }),
    ...(center && { justifyContent: 'center', alignItems: 'center' }),
  };

  return (
    <View style={[boxStyle, style]} {...props}>
      {children}
    </View>
  );
};

export default Box;
