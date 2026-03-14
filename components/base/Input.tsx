import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  TextInputProps,
  StyleSheet,
  Pressable,
} from 'react-native';

import { theme } from '@/styles/theme';
import { COMPONENT_SIZE } from '@/styles/type';

import Text from './Text';

// ─── Types ──────────────────────────────────────────────

interface InputProps extends TextInputProps {
  label: string;
  errorMessage?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
}

// ─── Component ──────────────────────────────────────────

const Input: React.FC<InputProps> = ({
  label,
  errorMessage,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  ...rest
}) => {
  const [focused, setFocused] = useState(false);

  const borderColor = errorMessage
    ? theme.colors.error
    : focused
      ? theme.colors.primary
      : theme.colors.gray200;

  return (
    <View>
      <Text variant="label" color="textSecondary" mb="xs">
        {label}
      </Text>

      <View style={[styles.container, { borderColor }]}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={theme.colors.gray400}
            style={styles.leftIcon}
          />
        )}

        <RNTextInput
          style={[styles.input, style]}
          placeholderTextColor={theme.colors.gray400}
          cursorColor={theme.colors.primary}
          onFocus={e => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          {...rest}
        />

        {rightIcon && (
          <Pressable onPress={onRightIconPress} hitSlop={8}>
            <Ionicons
              name={rightIcon}
              size={20}
              color={theme.colors.gray400}
            />
          </Pressable>
        )}
      </View>

      {errorMessage && (
        <Text variant="caption" color="error" mt="xs">
          {errorMessage}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: COMPONENT_SIZE.inputHeight,
    backgroundColor: theme.colors.surfaceWarm,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    paddingHorizontal: 16,
  },
  leftIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    paddingVertical: 0,
  },
});

export default Input;
