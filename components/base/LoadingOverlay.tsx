import React, { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, View } from 'react-native';

import { theme } from '@/styles/theme';

import Text from './Text';

// ─── Types ──────────────────────────────────────────────

interface LoadingOverlayProps {
  visible?: boolean;
  text?: string;
}

// ─── Bouncing Dot ───────────────────────────────────────

const DOT_SIZE = 12;
const DOT_COUNT = 3;

function BouncingDot({ delay }: { delay: number }) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(translateY, {
          toValue: -10,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [delay, translateY]);

  return (
    <Animated.View
      style={[styles.dot, { transform: [{ translateY }] }]}
    />
  );
}

// ─── Component ──────────────────────────────────────────

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible = true,
  text,
}) => (
  <Modal transparent visible={visible} statusBarTranslucent animationType="fade">
    <View style={styles.backdrop}>
      <View style={styles.content}>
        <View style={styles.dots}>
          {Array.from({ length: DOT_COUNT }).map((_, i) => (
            <BouncingDot key={i} delay={i * 150} />
          ))}
        </View>
        {text && (
          <Text variant="label" color="textMuted" mt="sm">
            {text}
          </Text>
        )}
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  content: {
    alignItems: 'center',
    padding: 24,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },
});

export default LoadingOverlay;
