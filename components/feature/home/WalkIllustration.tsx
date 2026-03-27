import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, ImageSourcePropType, StyleSheet, View } from 'react-native';

import { Icon, Row, Text } from '@/components/base';
import { theme } from '@/styles/theme';

// ─── Types ──────────────────────────────────────────────

interface WalkIllustrationProps {
  mode: 'solo' | 'couple';
  myName?: string;
  partnerName?: string;
}

// ─── Sprite Frames ──────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-var-requires
const BOY_FRAMES: ImageSourcePropType[] = [
  require('@/assets/sprites/boy_walk_1.png'),
  require('@/assets/sprites/boy_walk_2.png'),
  require('@/assets/sprites/boy_walk_3.png'),
  require('@/assets/sprites/boy_walk_4.png'),
];

// eslint-disable-next-line @typescript-eslint/no-var-requires
const GIRL_FRAMES: ImageSourcePropType[] = [
  require('@/assets/sprites/girl_walk_1.png'),
  require('@/assets/sprites/girl_walk_2.png'),
  require('@/assets/sprites/girl_walk_3.png'),
  require('@/assets/sprites/girl_walk_4.png'),
];

// ─── Walking Sprite Animation ───────────────────────────

function WalkingSprite({
  frames,
  size = 100,
  delay = 0,
  frameInterval = 300,
}: {
  frames: ImageSourcePropType[];
  size?: number;
  delay?: number;
  frameInterval?: number;
}) {
  const [frameIndex, setFrameIndex] = useState(0);
  const bounce = useRef(new Animated.Value(0)).current;

  // 프레임 순환 (1→2→3→4→1→...)
  useEffect(() => {
    const delayTimer = setTimeout(() => {
      const interval = setInterval(() => {
        setFrameIndex((prev) => (prev + 1) % frames.length);
      }, frameInterval);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(delayTimer);
  }, [frames.length, frameInterval, delay]);

  // 부드러운 바운스
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(bounce, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const translateY = bounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
      <Image
        source={frames[frameIndex]}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

// ─── Floating Mini Hearts ───────────────────────────────

function FloatingHearts() {
  const a1 = useRef(new Animated.Value(0)).current;
  const a2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (anim: Animated.Value, d: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(d),
          Animated.timing(anim, { toValue: 1, duration: 2500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ).start();
    animate(a1, 0);
    animate(a2, 1300);
  }, []);

  const heart = (anim: Animated.Value, x: number) => (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: 0,
        opacity: anim.interpolate({ inputRange: [0, 0.2, 0.7, 1], outputRange: [0, 0.7, 0.5, 0] }),
        transform: [
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -30] }) },
          { scale: anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.5, 1, 0.6] }) },
        ],
      }}
    >
      <Text style={{ fontSize: 10, color: theme.colors.primary }}>♥</Text>
    </Animated.View>
  );

  return (
    <View style={styles.heartsContainer}>
      {heart(a1, 0)}
      {heart(a2, 20)}
    </View>
  );
}

// ─── Main Component ─────────────────────────────────────

export function WalkIllustration({
  mode,
  myName = '나',
  partnerName = '상대방',
}: WalkIllustrationProps) {
  if (mode === 'couple') {
    return (
      <View style={styles.container}>
        <View style={styles.bgCircle} />

        <View style={styles.coupleArea}>
          {/* 남자 (왼쪽) */}
          <View style={styles.figureWrapper}>
            <WalkingSprite frames={BOY_FRAMES} size={80} delay={0} />
            <Text variant="caption" color="textSecondary" style={styles.nameText}>
              {myName}
            </Text>
          </View>

          {/* 가운데 하트 + 떠오르는 하트 */}
          <View style={styles.heartCenter}>
            <FloatingHearts />
            <View style={styles.heartBubble}>
              <Icon name="heart" size={11} color={theme.colors.white} />
            </View>
          </View>

          {/* 여자 (오른쪽) */}
          <View style={styles.figureWrapper}>
            <WalkingSprite frames={GIRL_FRAMES} size={80} delay={150} />
            <Text variant="caption" color="textSecondary" style={styles.nameText}>
              {partnerName}
            </Text>
          </View>
        </View>

        {/* 발자국 */}
        <Row style={styles.footprints}>
          {['·', '🐾', '·', '🐾', '·'].map((c, i) => (
            <Text key={i} style={[styles.footprintEmoji, { opacity: 0.15 + i * 0.08 }]}>
              {c}
            </Text>
          ))}
        </Row>
      </View>
    );
  }

  // ─── Solo ───────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <View style={styles.bgCircle} />
      <View style={styles.soloArea}>
        <WalkingSprite frames={BOY_FRAMES} size={80} />
      </View>
      <Row style={styles.footprints}>
        {['·', '🐾', '·'].map((c, i) => (
          <Text key={i} style={[styles.footprintEmoji, { opacity: 0.2 + i * 0.1 }]}>{c}</Text>
        ))}
      </Row>
      <Text variant="bodySmall" color="textSecondary" mt="md" style={styles.nameText}>
        아직 내 사람이 없어요
      </Text>
      <Text variant="caption" color="primary" mt="xxs">
        연결하면 둘만의 산책이 시작돼요
      </Text>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
    minHeight: 200,
  },
  bgCircle: {
    position: 'absolute',
    top: 8,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: theme.colors.accentLight,
    opacity: 0.2,
  },
  coupleArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 0,
    marginTop: 8,
    zIndex: 2,
  },
  figureWrapper: {
    alignItems: 'center',
  },
  nameText: {
    textAlign: 'center',
    marginTop: 2,
  },
  heartCenter: {
    marginBottom: 40,
    alignItems: 'center',
  },
  heartsContainer: {
    position: 'absolute',
    top: -28,
    width: 30,
    height: 30,
  },
  heartBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soloArea: {
    marginTop: 16,
    zIndex: 2,
  },
  footprints: {
    gap: 8,
    marginTop: 6,
    zIndex: 1,
  },
  footprintEmoji: {
    fontSize: 11,
    color: theme.colors.accent,
  },
});
