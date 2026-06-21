import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

import { useLoadingStore } from '@/stores/loadingStore';
import { theme } from '@/styles/theme';

// ─── Constants ───────────────────────────────────────────

const SCREEN_WIDTH = Dimensions.get('window').width;
const BAR_HEIGHT = 4;
const BAR_WIDTH = SCREEN_WIDTH * 0.35;

// ─── Component ───────────────────────────────────────────

export const GlobalLoadingBar: React.FC = () => {
  const { isLoading } = useLoadingStore();
  const translateX = useRef(new Animated.Value(-BAR_WIDTH)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoading) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();

      const slide = Animated.loop(
        Animated.timing(translateX, {
          toValue: SCREEN_WIDTH,
          duration: 1200,
          useNativeDriver: true,
        }),
      );
      slide.start();

      return () => {
        slide.stop();
        translateX.setValue(-BAR_WIDTH);
      };
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        translateX.setValue(-BAR_WIDTH);
      });
    }
  }, [isLoading, translateX, opacity]);

  if (!isLoading) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      {/* 프로그래스바 */}
      <View style={styles.barContainer}>
        <View style={styles.track}>
          <Animated.View
            style={[styles.bar, { transform: [{ translateX }] }]}
          />
        </View>
      </View>
    </Animated.View>
  );
};

// ─── Styles ──────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: 'rgba(44, 44, 46, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  barContainer: {
    width: SCREEN_WIDTH * 0.6,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 12,
    ...theme.pixel.borderThin,
    ...theme.shadows.card,
  },
  track: {
    height: BAR_HEIGHT,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: BAR_HEIGHT / 2,
    overflow: 'hidden',
  },
  bar: {
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    backgroundColor: theme.colors.primary,
    borderRadius: BAR_HEIGHT / 2,
  },
});

export default GlobalLoadingBar;
