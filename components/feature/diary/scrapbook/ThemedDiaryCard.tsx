import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import type { DiaryTheme } from '@/styles/diaryThemes';

interface ThemedDiaryCardProps {
  theme: DiaryTheme;
  /** 카드 상단 라벨 */
  title: string;
  /** 카드 우측 상단 작은 배지 (선택) */
  badge?: string;
  /** 질문 — 액센트 좌측 보더 + tint[0] 배경 */
  question: string;
  /** @deprecated 회전 제거됨 — prop은 남겨두고 무시 (호출처 변경 최소화) */
  rotate?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * 다이어리 카드 wrapper — title + question + body.
 * 회전·와시테이프 없이 항상 깔끔한 박스. 테마별 paper/line/ink 색만 적용.
 */
export function ThemedDiaryCard({
  theme: t,
  title,
  badge,
  children,
  question,
  style,
}: ThemedDiaryCardProps) {
  return (
    <View style={style}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: t.paper,
            borderColor: t.line,
          },
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
            <View style={[styles.badge, { backgroundColor: t.accent }]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
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
