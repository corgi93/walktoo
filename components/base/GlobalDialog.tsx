import React from 'react';
import { Animated, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { useDialogStore } from '@/stores/dialogStore';
import { theme } from '@/styles/theme';

import { Text } from './Text';

// ─── Component ───────────────────────────────────────────

export const GlobalDialog: React.FC = () => {
  const { visible, config, hideDialog } = useDialogStore();

  if (!visible || !config) return null;

  const handlePress = (onPress?: () => void) => {
    hideDialog();
    onPress?.();
  };

  return (
    <Pressable style={styles.overlay} onPress={hideDialog}>
      <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
        {/* Title */}
        <Text variant="headingSmall" style={styles.title}>
          {config.title}
        </Text>

        {/* Message */}
        {config.message && (
          <Text
            variant="bodySmall"
            color="textSecondary"
            style={styles.message}
          >
            {config.message}
          </Text>
        )}

        {/* Buttons */}
        <View style={styles.buttonRow}>
          {config.buttons.map((btn, i) => (
            <Pressable
              key={i}
              style={[
                styles.button,
                btn.variant === 'primary' && styles.buttonPrimary,
                btn.variant === 'cancel' && styles.buttonCancel,
                config.buttons.length === 1 && styles.buttonFull,
              ]}
              onPress={() => handlePress(btn.onPress)}
            >
              <Text
                variant="bodyMedium"
                color={btn.variant === 'primary' ? 'white' : 'textSecondary'}
              >
                {btn.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Pressable>
  );
};

// ─── Styles ──────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9998,
    backgroundColor: 'rgba(44, 44, 46, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 24,
    width: '80%',
    maxWidth: 320,
    ...theme.pixel.borderThin,
    ...theme.shadows.card,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
    ...theme.pixel.borderThin,
  },
  buttonCancel: {
    backgroundColor: theme.colors.gray100,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  buttonFull: {
    flex: 1,
  },
});

export default GlobalDialog;
