import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FONT_FAMILY } from '@/styles/type';
import { theme } from '@/styles/theme';

// ─── Types ──────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

// ─── Context ────────────────────────────────────────────

export const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

// ─── Config ─────────────────────────────────────────────

const TOAST_COLORS: Record<ToastType, string> = {
  success: theme.colors.secondary,
  error: theme.colors.error,
  warning: theme.colors.accent,
  info: theme.colors.primary,
};

// ─── Provider ───────────────────────────────────────────

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as ToastType });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const show = useCallback(
    (message: string, type: ToastType) => {
      setToast({ visible: true, message, type });

      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(1500),
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setToast(prev => ({ ...prev, visible: false })));
    },
    [fadeAnim],
  );

  const value: ToastContextValue = {
    success: msg => show(msg, 'success'),
    error: msg => show(msg, 'error'),
    warning: msg => show(msg, 'warning'),
    info: msg => show(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast.visible && (
        <Animated.View
          style={[
            styles.toast,
            {
              top: insets.top + 40,
              opacity: fadeAnim,
              backgroundColor: TOAST_COLORS[toast.type],
            },
          ]}
          pointerEvents="none"
        >
          <Animated.Text style={styles.text}>{toast.message}</Animated.Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: theme.radius.lg,
    ...theme.shadows.medium,
    zIndex: 9999,
  },
  text: {
    color: theme.colors.white,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: FONT_FAMILY.pixel,
  },
});
