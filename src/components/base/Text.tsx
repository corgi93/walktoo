import React from 'react';
import { Platform, Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';

import { ColorType, theme } from '@/styles/theme';
import {
  TYPOGRAPHY,
  FONT_FAMILY,
  TypographyVariant,
  FontFamily,
  SpaceValue,
  getSpacing,
} from '@/styles/type';

interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  font?: FontFamily;
  color?: ColorType;
  size?: number;
  weight?: TextStyle['fontWeight'];
  align?: TextStyle['textAlign'];
  mt?: SpaceValue;
  mb?: SpaceValue;
  ml?: SpaceValue;
  mr?: SpaceValue;
}

const Text: React.FC<TextProps> = ({
  variant = 'bodyMedium',
  font,
  color = 'text',
  size,
  weight,
  align,
  mt, mb, ml, mr,
  style,
  children,
  ...rest
}) => {
  const base = TYPOGRAPHY[variant];

  const fontFamily = font
    ? FONT_FAMILY[font]
    : ('fontFamily' in base ? base.fontFamily : FONT_FAMILY.body);

  const textStyle: TextStyle = {
    fontSize: size ?? base.fontSize,
    lineHeight: size ? size * 1.3 : base.lineHeight,
    color: theme.colors[color],
    ...(fontFamily && { fontFamily }),
    ...(weight && { fontWeight: weight }),
    ...(align && { textAlign: align }),
    ...(mt !== undefined && { marginTop: getSpacing(mt) }),
    ...(mb !== undefined && { marginBottom: getSpacing(mb) }),
    ...(ml !== undefined && { marginLeft: getSpacing(ml) }),
    ...(mr !== undefined && { marginRight: getSpacing(mr) }),
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  };

  return (
    <RNText style={[textStyle, style]} {...rest}>
      {children}
    </RNText>
  );
};

export default Text;
