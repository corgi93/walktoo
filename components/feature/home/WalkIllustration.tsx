import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, Text } from '@/components/base';
import { theme } from '@/styles/theme';

// ─── Types ──────────────────────────────────────────────

type CharacterType = 'boy' | 'girl';

interface WalkIllustrationProps {
  mode: 'solo' | 'couple';
  myName?: string;
  partnerName?: string;
  myCharacter?: CharacterType;
  partnerCharacter?: CharacterType;
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
  walking = true,
}: {
  frames: ImageSourcePropType[];
  size?: number;
  delay?: number;
  frameInterval?: number;
  walking?: boolean;
}) {
  const [frameIndex, setFrameIndex] = useState(0);
  const bounce = useRef(new Animated.Value(0)).current;

  // 프레임 순환 (걷는 중일 때만)
  useEffect(() => {
    if (!walking) {
      setFrameIndex(0); // 정지 시 기본 포즈로
      return;
    }

    let interval: ReturnType<typeof setInterval> | null = null;
    const delayTimer = setTimeout(() => {
      interval = setInterval(() => {
        setFrameIndex((prev) => (prev + 1) % frames.length);
      }, frameInterval);
    }, delay);

    return () => {
      clearTimeout(delayTimer);
      if (interval) clearInterval(interval);
    };
  }, [frames.length, frameInterval, delay, walking]);

  // 부드러운 바운스 (걷는 중일 때만)
  useEffect(() => {
    if (!walking) {
      bounce.setValue(0);
      return;
    }

    const loop = Animated.loop(
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
    );
    loop.start();

    return () => {
      loop.stop();
    };
  }, [walking, delay]);

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

const FRAMES_MAP: Record<CharacterType, ImageSourcePropType[]> = {
  boy: BOY_FRAMES,
  girl: GIRL_FRAMES,
};

export function WalkIllustration({
  mode,
  myName,
  partnerName,
  myCharacter = 'boy',
  partnerCharacter = 'girl',
}: WalkIllustrationProps) {
  const { t } = useTranslation(['common', 'home']);
  const displayMyName = myName ?? t('common:labels.me');
  const displayPartnerName = partnerName ?? t('common:fallback.partner-nickname');

  if (mode === 'couple') {
    return (
      <View style={styles.container}>
        <View style={styles.coupleArea}>
          {/* 나 (왼쪽) */}
          <View style={styles.figureWrapper}>
            <WalkingSprite
              frames={FRAMES_MAP[myCharacter]}
              size={80}
              delay={0}
            />
            <Text variant="caption" color="textSecondary" style={styles.nameText}>
              {displayMyName}
            </Text>
          </View>

          {/* 가운데 하트 + 떠오르는 하트 */}
          <View style={styles.heartCenter}>
            <FloatingHearts />
            <View style={styles.heartBubble}>
              <Icon name="heart" size={11} color={theme.colors.white} />
            </View>
          </View>

          {/* 상대방 (오른쪽) */}
          <View style={styles.figureWrapper}>
            <WalkingSprite
              frames={FRAMES_MAP[partnerCharacter]}
              size={80}
              delay={150}
            />
            <Text variant="caption" color="textSecondary" style={styles.nameText}>
              {displayPartnerName}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ─── Solo ───────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <View style={styles.soloArea}>
        <WalkingSprite frames={FRAMES_MAP[myCharacter]} size={80} />
      </View>
      <Text variant="bodySmall" color="textSecondary" mt="md" style={styles.nameText}>
        {t('home:solo.no-partner')}
      </Text>
      <Text variant="caption" color="primary" mt="xxs">
        {t('home:solo.connect-prompt')}
      </Text>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minHeight: 140,
  },
  coupleArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 0,
    marginTop: 4,
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
    marginTop: 8,
    zIndex: 2,
  },
});
