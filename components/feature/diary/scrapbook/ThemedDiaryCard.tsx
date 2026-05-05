import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import type { DiaryTheme } from '@/styles/diaryThemes';

import { ImageTape } from './ImageTape';
import { WashiTape } from './WashiTape';

interface ThemedDiaryCardProps {
  theme: DiaryTheme;
  /** 카드 상단 라벨 — 손글씨 폰트로 표시 */
  title: string;
  /** 카드 우측 상단 작은 배지 (선택) */
  badge?: string;
  /** 질문 — 액센트 좌측 보더 + tint[0] 배경 */
  question: string;
  /** 회전 — grid_minimal에서는 무시 */
  rotate?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * 다이어리 카드 wrapper — title + question + body.
 * 다꾸 테마: paper 배경 + 살짝 회전 + 윗면 와시테이프 1~2개.
 * grid_minimal 테마: 회전·테이프 모두 비활성, 깔끔한 박스만.
 */
export function ThemedDiaryCard({
  theme: t,
  title,
  badge,
  question,
  rotate = 0,
  children,
  style,
}: ThemedDiaryCardProps) {
  const isMinimal = t.id === 'grid_minimal';
  const rot = isMinimal ? 0 : rotate;

  return (
    <View
      style={[
        {
          transform: [{ rotate: `${rot}deg` }],
        },
        style,
      ]}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: t.paper,
            borderColor: t.line,
          },
          !isMinimal && styles.cardShadow,
        ]}
      >
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              {
                fontFamily: t.handFont,
                fontWeight: t.handWeight,
                color: t.ink,
              },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {badge ? (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: t.accent,
                  transform: isMinimal ? [] : [{ rotate: '2deg' }],
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { fontFamily: t.monoFont, color: '#FFFFFF' },
                ]}
                numberOfLines={1}
              >
                {badge}
              </Text>
            </View>
          ) : null}
        </View>

        {/* 질문 박스 — question 비어있으면 숨김 (오늘의 나처럼 freeform 입력일 때) */}
        {question.trim().length > 0 && (
          <View
            style={[
              styles.questionBox,
              {
                backgroundColor: t.tints[0],
                borderLeftColor: t.accent,
              },
            ]}
          >
            <Text
              style={[
                styles.questionText,
                {
                  fontFamily: t.bodyFont,
                  fontWeight: t.bodyWeight,
                  color: t.ink,
                },
              ]}
            >
              <Text style={{ color: t.accent, fontWeight: '700' }}>Q. </Text>
              {question}
            </Text>
          </View>
        )}

        <View style={styles.body}>{children}</View>
      </View>

      {!isMinimal && (
        <>
          {t.imgTapes[0] ? (
            <ImageTape
              id={t.imgTapes[0]}
              width={80}
              rotate={-8}
              style={{ top: -10, left: 18 }}
            />
          ) : (
            <WashiTape
              width={60}
              height={14}
              rotate={-8}
              color={t.tapes[0].color}
              pattern={t.tapes[0].pattern}
              patternColor={t.tapes[0].patternColor}
              style={{ top: -8, left: 14 }}
            />
          )}
          {t.imgTapes[1] ? (
            <ImageTape
              id={t.imgTapes[1]}
              width={62}
              rotate={9}
              style={{ top: -8, right: 22 }}
            />
          ) : (
            t.tapes[1] && (
              <WashiTape
                width={46}
                height={12}
                rotate={9}
                color={t.tapes[1].color}
                pattern={t.tapes[1].pattern}
                patternColor={t.tapes[1].patternColor}
                style={{ top: -6, right: 18 }}
              />
            )
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    position: 'relative',
  },
  cardShadow: {
    shadowColor: '#2E2622',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 0,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  title: {
    fontSize: 17,
    lineHeight: 20,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    maxWidth: 110,
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.3,
  },
  questionBox: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderLeftWidth: 3,
  },
  questionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  body: {
    marginTop: 10,
  },
});
