import React, { createContext, useContext, useState } from 'react';
import { Modal, Pressable, StyleSheet, TouchableOpacity } from 'react-native';

import { Column, Row, Text } from '@/components/base';
import { theme } from '@/styles/theme';

// ─── Types ──────────────────────────────────────────────

interface PopupOptions {
  title?: string;
  content: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
}

interface PopupContextValue {
  confirm: (options: PopupOptions) => void;
  alert: (options: Omit<PopupOptions, 'cancelText'>) => void;
}

// ─── Context ────────────────────────────────────────────

export const PopupContext = createContext<PopupContextValue | null>(null);

export const usePopup = () => {
  const ctx = useContext(PopupContext);
  if (!ctx) throw new Error('usePopup must be used within PopupProvider');
  return ctx;
};

// ─── Provider ───────────────────────────────────────────

export const PopupProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<PopupOptions & { visible: boolean }>({
    visible: false,
    content: '',
  });

  const show = (options: PopupOptions) =>
    setTimeout(() => setState({ ...options, visible: true }), 0);

  const hide = () => setState(prev => ({ ...prev, visible: false }));

  const value: PopupContextValue = {
    confirm: show,
    alert: show,
  };

  return (
    <PopupContext.Provider value={value}>
      {children}

      <Modal visible={state.visible} transparent animationType="fade" statusBarTranslucent>
        <Pressable style={styles.backdrop} onPress={hide}>
          <Pressable style={styles.container}>
            <Column p="xl" gap={12}>
              {state.title && (
                <Text variant="headingMedium">{state.title}</Text>
              )}

              {typeof state.content === 'string' ? (
                <Text variant="bodyMedium" color="textSecondary">
                  {state.content}
                </Text>
              ) : (
                state.content
              )}

              <Row gap={10} style={{ marginTop: 20 }}>
                {state.cancelText && (
                  <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={hide}>
                    <Text variant="label" color="textMuted">{state.cancelText}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.btn, styles.confirmBtn, !state.cancelText && styles.singleBtn]}
                  onPress={async () => { await state.onConfirm?.(); hide(); }}
                >
                  <Text variant="label" color="white">
                    {state.confirmText ?? '확인'}
                  </Text>
                </TouchableOpacity>
              </Row>
            </Column>
          </Pressable>
        </Pressable>
      </Modal>
    </PopupContext.Provider>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 320,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    ...theme.shadows.large,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: theme.colors.gray100,
  },
  confirmBtn: {
    backgroundColor: theme.colors.primary,
  },
  singleBtn: {
    flex: undefined,
    paddingHorizontal: 40,
  },
});
