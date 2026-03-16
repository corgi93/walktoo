import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Column, Icon, Row, Text } from '@/components/base';
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
            {/* 타임라인 선 + 발자국 */}
            <View style={styles.timeline}>
              <View
                style={[
                  styles.dot,
                  diary.isRevealed ? styles.dotRevealed : styles.dotLocked,
                ]}
              >
                <Icon
                  name={diary.isRevealed ? 'footprint' : 'lock'}
                  size={13}
                  color={diary.isRevealed ? theme.colors.primary : theme.colors.gray500}
                />
              </View>
              {!isLast && <View style={styles.line} />}
            </View>

            {/* 카드 */}
            {diary.isRevealed ? (
              <RevealedCard
                diary={diary}
                formattedDate={formattedDate}
                weekday={weekday}
              />
            ) : (
              <LockedCard
                diary={diary}
                formattedDate={formattedDate}
                weekday={weekday}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Locked Card ────────────────────────────────────────

function LockedCard({
  diary,
  formattedDate,
  weekday,
}: {
  diary: WalkDiary;
  formattedDate: string;
  weekday: string;
}) {
  const hasMyEntry = !!diary.myEntry;
  const hasPartnerEntry = !!diary.partnerEntry;

  return (
    <View style={[styles.card, styles.cardLocked]}>
      <Text variant="caption" color="textMuted">
        {formattedDate} ({weekday})
      </Text>
      <Text variant="headingSmall" mt="xxs">
        {diary.locationName}
      </Text>

      {/* 상태 표시 */}
      <View style={styles.lockStatus}>
        <View style={styles.lockChip}>
          <Icon
            name={hasMyEntry ? 'check-circle' : 'clock'}
            size={13}
            color={hasMyEntry ? theme.colors.secondary : theme.colors.gray400}
          />
          <Text variant="caption" color="textSecondary" ml="xs">
            나
          </Text>
        </View>
        <View style={styles.lockChip}>
          <Icon
            name={hasPartnerEntry ? 'check-circle' : 'clock'}
            size={13}
            color={hasPartnerEntry ? theme.colors.secondary : theme.colors.gray400}
          />
          <Text variant="caption" color="textSecondary" ml="xs">
            연인
          </Text>
        </View>
      </View>

      <Text variant="caption" color="textMuted" mt="sm" align="center">
        {hasMyEntry
          ? '연인의 기록을 기다리는 중...'
          : '나의 하루를 먼저 남겨주세요'}
      </Text>
    </View>
  );
}

// ─── Revealed Card ──────────────────────────────────────

function RevealedCard({
  diary,
  formattedDate,
  weekday,
}: {
  diary: WalkDiary;
  formattedDate: string;
  weekday: string;
}) {
  return (
    <View style={styles.card}>
      <Row style={styles.cardHeader}>
        <Text variant="caption" color="textMuted">
          {formattedDate} ({weekday})
        </Text>
        {diary.steps > 0 && (
          <View style={styles.stepsBadge}>
            <Icon name="shoe-sneaker" size={12} color={theme.colors.primary} />
            <Text variant="caption" color="primary" ml="xxs">
              {formatSteps(diary.steps)}
            </Text>
          </View>
        )}
      </Row>

      <Text variant="headingSmall" mt="xxs">
        {diary.locationName}
      </Text>

      {/* 둘의 기록 나란히 */}
      <Row style={styles.dualEntries}>
        {diary.myEntry && (
          <EntryColumn entry={diary.myEntry} />
        )}
        {diary.partnerEntry && (
          <EntryColumn entry={diary.partnerEntry} />
        )}
      </Row>
    </View>
  );
}

// ─── Entry Column (각 사람의 기록) ──────────────────────

function EntryColumn({
  entry,
}: {
  entry: NonNullable<WalkDiary['myEntry']>;
}) {
  return (
    <Column style={styles.entryCol}>
      <Text variant="label" color="primary" mb="xs">
        {entry.nickname}
      </Text>

      {/* 사진 */}
      {entry.photos.length > 0 && (
        <View style={styles.entryPhoto}>
          <Image
            source={{ uri: entry.photos[0] }}
            style={styles.entryPhotoImage}
          />
        </View>
      )}

      {/* 메모 */}
      {entry.memo ? (
        <Text
          variant="bodySmall"
          color="textSecondary"
          mt="xs"
          numberOfLines={4}
        >
          {entry.memo}
        </Text>
      ) : null}
    </Column>
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
  dot: {
    width: 28,
    height: 28,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    borderWidth: 2,
  },
  dotRevealed: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySurface,
  },
  dotLocked: {
    borderColor: theme.colors.gray400,
    backgroundColor: theme.colors.gray200,
  },
  line: {
    width: 3,
    flex: 1,
    backgroundColor: theme.colors.gray300,
    marginTop: -2,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: SPACING.lg,
    marginLeft: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    // 픽셀 솔리드 그림자
    shadowColor: theme.colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  cardLocked: {
    borderColor: theme.colors.gray400,
    borderStyle: 'dashed',
    alignItems: 'center',
    shadowOpacity: 0,
    elevation: 0,
  },
  cardHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primarySurface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: 4,
  },
  lockStatus: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  lockChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray100,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
  },
  dualEntries: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  entryCol: {
    flex: 1,
    backgroundColor: theme.colors.surfaceWarm,
    borderRadius: theme.radius.md,
    padding: SPACING.md,
  },
  entryPhoto: {
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
  },
  entryPhotoImage: {
    width: '100%',
    height: 80,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.gray100,
  },
});
