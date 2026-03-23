import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { Icon, Row, Text } from '@/components/base';
import { theme } from '@/styles/theme';

// ─── Types ──────────────────────────────────────────────

interface WalkIllustrationProps {
  mode: 'solo' | 'couple';
  myName?: string;
  partnerName?: string;
}

// ─── Pixel Grid ─────────────────────────────────────────
// 0=투명 1=머리카락 2=피부 3=볼터치 4=눈 5=옷 6=옷하이라이트
// 7=바지 8=신발 9=아웃라인 A=손(피부)

const PX = 3;

function PixelGrid({ grid, palette }: { grid: number[][]; palette: Record<number, string> }) {
  return (
    <View>
      {grid.map((row, y) => (
        <View key={y} style={styles.pixelRow}>
          {row.map((cell, x) => (
            <View
              key={x}
              style={{
                width: PX,
                height: PX,
                backgroundColor: palette[cell] ?? 'transparent',
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

// ─── 팔레트 ────────────────────────────────────────────

const _ = 0; // 투명

const BOY_PALETTE: Record<number, string> = {
  1: '#5C3D2E', // 머리카락
  2: '#FDDCB2', // 피부
  3: '#F4A69A', // 볼터치
  4: '#2C2C2E', // 눈
  5: '#D4584F', // 옷 (코랄 어두운)
  6: '#E8706A', // 옷 하이라이트
  7: '#8B5E4B', // 바지
  8: '#5C3D2E', // 신발
  9: '#3D2B1F', // 아웃라인
  10: '#FDDCB2', // 손(피부)
};

const GIRL_PALETTE: Record<number, string> = {
  1: '#5C3D2E', // 머리카락
  2: '#FDDCB2', // 피부
  3: '#F4A69A', // 볼터치
  4: '#2C2C2E', // 눈
  5: '#D4584F', // 옷 (코랄 어두운)
  6: '#E8706A', // 옷 하이라이트
  7: '#8B5E4B', // 치마/바지
  8: '#5C3D2E', // 신발
  9: '#3D2B1F', // 아웃라인
  10: '#FDDCB2', // 손(피부)
  11: '#E8706A', // 리본
};

const SOLO_PALETTE: Record<number, string> = {
  1: '#A8A4A0',
  2: '#FDDCB2',
  3: '#F4A69A',
  4: '#2C2C2E',
  5: '#C8C4BE',
  6: '#D8D4D0',
  7: '#A8A4A0',
  8: '#888480',
  9: '#6E6E73',
  10: '#FDDCB2',
};

// ── 남자 캐릭터 (정면, 걷는 포즈, 왼손 뻗음) 18x28 ──
// prettier-ignore
const BOY_GRID: number[][] = [
  [_,_,_,_,_,_,9,9,9,9,9,9,_,_,_,_,_,_],
  [_,_,_,_,_,9,1,1,1,1,1,1,9,_,_,_,_,_],
  [_,_,_,_,9,1,1,1,1,1,1,1,1,9,_,_,_,_],
  [_,_,_,9,1,1,1,1,1,1,1,1,1,1,9,_,_,_],
  [_,_,_,9,1,1,1,1,1,1,1,1,1,1,9,_,_,_],
  [_,_,_,9,2,2,2,2,2,2,2,2,2,2,9,_,_,_],
  [_,_,_,9,2,2,4,2,2,2,2,4,2,2,9,_,_,_],
  [_,_,_,9,2,2,4,2,2,2,2,4,2,2,9,_,_,_],
  [_,_,_,9,2,3,2,2,2,2,2,2,3,2,9,_,_,_],
  [_,_,_,_,9,2,2,2,5,5,2,2,2,9,_,_,_,_],
  [_,_,_,_,_,9,2,2,2,2,2,2,9,_,_,_,_,_],
  [_,_,_,_,_,_,9,9,9,9,9,9,_,_,_,_,_,_],
  [_,_,_,_,_,9,5,6,6,6,6,5,9,_,_,_,_,_],
  [_,_,_,_,9,5,5,6,6,6,6,5,5,9,_,_,_,_],
  [_,_,_,9,5,5,5,6,6,6,6,5,5,5,9,_,_,_],
  [_,_,10,9,5,5,5,6,6,6,6,5,5,5,9,_,_,_],
  [_,10,10,_,9,5,5,5,5,5,5,5,5,9,_,_,_,_],
  [_,_,_,_,9,5,5,5,5,5,5,5,5,9,_,_,_,_],
  [_,_,_,_,_,9,5,5,5,5,5,5,9,_,_,_,_,_],
  [_,_,_,_,_,9,7,7,7,7,7,7,9,_,_,_,_,_],
  [_,_,_,_,_,9,7,7,7,7,7,7,9,_,_,_,_,_],
  [_,_,_,_,_,9,7,7,7,7,7,7,9,_,_,_,_,_],
  [_,_,_,_,_,9,7,7,_,_,7,7,9,_,_,_,_,_],
  [_,_,_,_,_,9,7,7,_,_,7,7,9,_,_,_,_,_],
  [_,_,_,_,_,9,7,7,_,_,7,7,9,_,_,_,_,_],
  [_,_,_,_,_,9,8,8,_,_,8,8,9,_,_,_,_,_],
  [_,_,_,_,_,9,8,8,_,_,8,8,9,_,_,_,_,_],
  [_,_,_,_,_,_,9,9,_,_,_,9,9,_,_,_,_,_],
];

// ── 여자 캐릭터 (정면, 걷는 포즈, 오른손 뻗음 + 긴 머리 + 리본) 18x28 ──
// prettier-ignore
const GIRL_GRID: number[][] = [
  [_,_,_,_,_,_,9,9,9,9,9,9,_,_,_,_,_,_],
  [_,_,_,_,_,9,1,1,1,1,1,1,9,_,_,_,_,_],
  [_,_,_,_,9,1,1,1,1,1,11,1,1,9,_,_,_,_],
  [_,_,_,9,1,1,1,1,1,1,1,1,1,1,9,_,_,_],
  [_,_,_,9,1,1,1,1,1,1,1,1,1,1,9,_,_,_],
  [_,_,_,9,1,2,2,2,2,2,2,2,2,1,9,_,_,_],
  [_,_,_,9,2,2,4,2,2,2,2,4,2,2,9,_,_,_],
  [_,_,_,9,2,2,4,2,2,2,2,4,2,2,9,_,_,_],
  [_,_,_,9,2,3,2,2,2,2,2,2,3,2,9,_,_,_],
  [_,_,_,9,1,2,2,2,5,5,2,2,2,1,9,_,_,_],
  [_,_,_,9,1,_,9,2,2,2,2,9,_,1,9,_,_,_],
  [_,_,_,9,1,_,_,9,9,9,9,_,_,1,9,_,_,_],
  [_,_,_,9,1,_,9,6,6,6,6,9,_,1,9,_,_,_],
  [_,_,_,9,1,9,6,6,6,6,6,6,9,1,9,_,_,_],
  [_,_,_,_,9,5,5,6,6,6,6,5,5,9,_,_,_,_],
  [_,_,_,_,9,5,5,6,6,6,6,5,5,9,10,_,_,_],
  [_,_,_,_,_,9,5,5,5,5,5,5,9,_,10,10,_,_],
  [_,_,_,_,_,9,5,5,5,5,5,5,9,_,_,_,_,_],
  [_,_,_,_,_,_,9,6,6,6,6,9,_,_,_,_,_,_],
  [_,_,_,_,_,_,9,6,6,6,6,9,_,_,_,_,_,_],
  [_,_,_,_,_,_,9,6,6,6,6,9,_,_,_,_,_,_],
  [_,_,_,_,_,_,9,6,6,6,6,9,_,_,_,_,_,_],
  [_,_,_,_,_,_,9,7,_,_,7,9,_,_,_,_,_,_],
  [_,_,_,_,_,_,9,7,_,_,7,9,_,_,_,_,_,_],
  [_,_,_,_,_,_,9,7,_,_,7,9,_,_,_,_,_,_],
  [_,_,_,_,_,_,9,8,_,_,8,9,_,_,_,_,_,_],
  [_,_,_,_,_,_,9,8,_,_,8,9,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,9,_,_,9,_,_,_,_,_,_,_],
];

// ─── Gentle Walk Animation ──────────────────────────────

function WalkingCharacter({
  grid,
  palette,
  delay = 0,
}: {
  grid: number[][];
  palette: Record<number, string>;
  delay?: number;
}) {
  const bounce = useRef(new Animated.Value(0)).current;

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
      <PixelGrid grid={grid} palette={palette} />
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
            <WalkingCharacter grid={BOY_GRID} palette={BOY_PALETTE} delay={0} />
            <Text variant="caption" color="textSecondary" mt="xs" style={styles.nameText}>
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
            <WalkingCharacter grid={GIRL_GRID} palette={GIRL_PALETTE} delay={300} />
            <Text variant="caption" color="textSecondary" mt="xs" style={styles.nameText}>
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
        <WalkingCharacter grid={BOY_GRID} palette={SOLO_PALETTE} />
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
    minHeight: 180,
  },
  bgCircle: {
    position: 'absolute',
    top: 8,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: theme.colors.accentLight,
    opacity: 0.2,
  },
  coupleArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginTop: 16,
    zIndex: 2,
  },
  figureWrapper: {
    alignItems: 'center',
  },
  nameText: {
    textAlign: 'center',
  },
  heartCenter: {
    marginBottom: 44,
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
    marginTop: 24,
    zIndex: 2,
  },
  pixelRow: {
    flexDirection: 'row',
  },
  footprints: {
    gap: 8,
    marginTop: 10,
    zIndex: 1,
  },
  footprintEmoji: {
    fontSize: 11,
    color: theme.colors.accent,
  },
});
