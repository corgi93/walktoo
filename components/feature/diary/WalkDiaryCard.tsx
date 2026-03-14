import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Column, Row, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';
import { WalkDiary } from '@/types/diary';
import { formatSteps } from '@/utils';

// ─── Types ──────────────────────────────────────────────

interface WalkDiaryCardProps {
  diary: WalkDiary;
  onPress?: (diary: WalkDiary) => void;
}

// ─── Component ──────────────────────────────────────────

export function WalkDiaryCard({ diary, onPress }: WalkDiaryCardProps) {
  const formattedDate = new Date(diary.date).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  return (
    <Pressable
      style={styles.card}
      onPress={() => onPress?.(diary)}
      android_ripple={{ color: theme.colors.gray100 }}
    >
      {/* 헤더: 날짜 + 위치 */}
      <Row style={styles.header}>
        <Column style={{ flex: 1 }}>
          <Text variant="caption" color="textMuted">
            {formattedDate}
          </Text>
          <Row style={styles.locationRow}>
            <Ionicons
              name="location-outline"
              size={14}
              color={theme.colors.primary}
            />
            <Text variant="headingSmall" ml="xs">
              {diary.locationName}
            </Text>
          </Row>
        </Column>
        <View style={styles.footprintBadge}>
          <Text style={styles.footprintEmoji}>👣</Text>
        </View>
      </Row>

      {/* 사진 영역 */}
      {diary.photos.length > 0 ? (
        <View style={styles.photoArea}>
          <View style={styles.photoPlaceholder}>
            <Ionicons name="image-outline" size={32} color={theme.colors.gray300} />
          </View>
        </View>
      ) : null}

      {/* 메모 */}
      {diary.memo ? (
        <Text variant="bodyMedium" color="text" mt="md">
          {diary.memo}
        </Text>
      ) : null}

      {/* 걸음수 */}
      <Row style={styles.statsRow}>
        <Ionicons name="footsteps-outline" size={14} color={theme.colors.textMuted} />
        <Text variant="label" color="text" ml="xs">
          {formatSteps(diary.steps)}
        </Text>
        <Text variant="caption" color="textMuted" ml="xxs">
          걸음
        </Text>
      </Row>
    </Pressable>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xxl,
    padding: SPACING.xl,
    ...theme.shadows.card,
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  locationRow: {
    alignItems: 'center',
    marginTop: SPACING.xxs,
  },
  footprintBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footprintEmoji: {
    fontSize: 16,
  },
  photoArea: {
    marginTop: SPACING.md,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  photoPlaceholder: {
    height: 180,
    backgroundColor: theme.colors.gray100,
    borderRadius: theme.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.gray200,
    alignItems: 'center',
  },
});
