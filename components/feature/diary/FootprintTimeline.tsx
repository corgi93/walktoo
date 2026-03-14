import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Column, Row, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';
import { WalkDiary } from '@/types/diary';
import { formatSteps } from '@/utils';

// ─── Types ──────────────────────────────────────────────

interface FootprintTimelineProps {
  diaries: WalkDiary[];
  onItemPress?: (diary: WalkDiary) => void;
}

// ─── Component ──────────────────────────────────────────

export function FootprintTimeline({
  diaries,
  onItemPress,
}: FootprintTimelineProps) {
  return (
    <View style={styles.container}>
      {diaries.map((diary, index) => {
        const isLast = index === diaries.length - 1;

        const formattedDate = new Date(diary.date).toLocaleDateString(
          'ko-KR',
          { month: 'short', day: 'numeric' },
        );

        const weekday = new Date(diary.date).toLocaleDateString('ko-KR', {
          weekday: 'short',
        });

        return (
          <Pressable
            key={diary.id}
            style={styles.item}
            onPress={() => onItemPress?.(diary)}
          >
            {/* 타임라인 선 + 발자국 아이콘 */}
            <View style={styles.timeline}>
              <View style={styles.footprintDot}>
                <Text style={styles.footprintEmoji}>👣</Text>
              </View>
              {!isLast && <View style={styles.line} />}
            </View>

            {/* 콘텐츠 카드 */}
            <View style={styles.card}>
              {/* 날짜 + 위치 */}
              <Row style={styles.cardHeader}>
                <Text variant="caption" color="textMuted">
                  {formattedDate} ({weekday})
                </Text>
                {diary.steps > 0 && (
                  <Row style={styles.stepsBadge}>
                    <Ionicons
                      name="footsteps-outline"
                      size={11}
                      color={theme.colors.primary}
                    />
                    <Text variant="caption" color="primary" ml="xxs">
                      {formatSteps(diary.steps)}
                    </Text>
                  </Row>
                )}
              </Row>

              <Text variant="headingSmall" mt="xxs">
                {diary.locationName}
              </Text>

              {/* 사진 */}
              {diary.photos.length > 0 && (
                <View style={styles.photoArea}>
                  <View style={styles.photoPlaceholder}>
                    <Ionicons
                      name="image-outline"
                      size={24}
                      color={theme.colors.gray300}
                    />
                  </View>
                </View>
              )}

              {/* 메모 */}
              {diary.memo ? (
                <Text
                  variant="bodySmall"
                  color="textSecondary"
                  mt="sm"
                  numberOfLines={3}
                >
                  {diary.memo}
                </Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.xxl,
  },
  item: {
    flexDirection: 'row',
    minHeight: 80,
  },
  timeline: {
    width: 40,
    alignItems: 'center',
  },
  footprintDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  footprintEmoji: {
    fontSize: 14,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: theme.colors.primaryLight,
    marginTop: -2,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: SPACING.lg,
    marginLeft: SPACING.md,
    marginBottom: SPACING.lg,
    ...theme.shadows.card,
  },
  cardHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepsBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.primarySurface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: theme.radius.full,
  },
  photoArea: {
    marginTop: SPACING.sm,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  photoPlaceholder: {
    height: 120,
    backgroundColor: theme.colors.gray100,
    borderRadius: theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
