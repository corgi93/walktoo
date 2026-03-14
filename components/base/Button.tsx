import React from 'react';
import {
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import { theme } from '@/styles/theme';
import { FONT_FAMILY, COMPONENT_SIZE, ButtonVariant, Size, SpaceValue, getSpacing } from '@/styles/type';

import Text from './Text';

// ─── Types ──────────────────────────────────────────────

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: Size;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  mt?: SpaceValue;
  mb?: SpaceValue;
  style?: ViewStyle;
}

// ─── Variant Styles ─────────────────────────────────────

const VARIANT_BG: Record<ButtonVariant, string> = {
  primary: theme.colors.primary,
  secondary: theme.colors.surfaceWarm,
  outline: 'transparent',
  ghost: 'transparent',
  text: 'transparent',
};

const VARIANT_TEXT_COLOR: Record<ButtonVariant, string> = {
  primary: theme.colors.white,
  secondary: theme.colors.primary,
  outline: theme.colors.primary,
  ghost: theme.colors.primary,
  text: theme.colors.textSecondary,
};

const SIZE_HEIGHT: Record<Size, number> = {
  small: COMPONENT_SIZE.buttonSmall,
  medium: COMPONENT_SIZE.buttonMedium,
  large: COMPONENT_SIZE.buttonLarge,
};

// ─── Component ──────────────────────────────────────────

const Button: React.FC<ButtonProps> = ({
  onPress,
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = true,
  disabled = false,
  loading = false,
  mt, mb,
  style,
}) => {
  const buttonStyle: ViewStyle = {
    ...styles.base,
    backgroundColor: VARIANT_BG[variant],
    height: SIZE_HEIGHT[size],
    ...(variant === 'outline' && {
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
    }),
    ...(fullWidth ? { width: '100%' } : { alignSelf: 'flex-start' }),
    ...(disabled && { opacity: 0.5 }),
    ...(mt !== undefined && { marginTop: getSpacing(mt) }),
    ...(mb !== undefined && { marginBottom: getSpacing(mb) }),
    ...style,
  };

  const labelStyle: TextStyle = {
    fontFamily: FONT_FAMILY.pixel,
    fontSize: 16,
    color: VARIANT_TEXT_COLOR[variant],
    textAlign: 'center',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={buttonStyle}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? theme.colors.white : theme.colors.primary}
          size="small"
        />
      ) : typeof children === 'string' ? (
        <Text style={labelStyle}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    flexDirection: 'row',
  },
});

export default Button;
