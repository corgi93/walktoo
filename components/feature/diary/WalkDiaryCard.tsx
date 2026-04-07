import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Column, Icon, Row, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';
import { WalkDiary } from '@/types/diary';

// ─── Types ──────────────────────────────────────────────

interface WalkDiaryCardProps {
  diary: WalkDiary;
  onPress?: (diary: WalkDiary) => void;
  onNudge?: (diary: WalkDiary) => void;
  nudgeLoading?: boolean;
}

// ─── Component ──────────────────────────────────────────

export function WalkDiaryCard({
  diary,
  onPress,
  onNudge,
  nudgeLoading,
}: WalkDiaryCardProps) {
  const formattedDate = new Date(diary.date).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  if (!diary.isRevealed) {
    return (
      <LockedFeedCard
        diary={diary}
        formattedDate={formattedDate}
        onPress={onPress}
        onNudge={onNudge}
        nudgeLoading={nudgeLoading}
      />
    );
  }

  return <RevealedFeedCard diary={diary} formattedDate={formattedDate} onPress={onPress} />;
}

// ─── Locked Feed Card ───────────────────────────────────

function LockedFeedCard({
  diary,
  formattedDate,
  onPress,
  onNudge,
  nudgeLoading,
}: {
  diary: WalkDiary;
  formattedDate: string;
  onPress?: (diary: WalkDiary) => void;
  onNudge?: (diary: WalkDiary) => void;
  nudgeLoading?: boolean;
}) {
  const hasMyEntry = !!diary.myEntry;
  const hasPartnerEntry = !!diary.partnerEntry;
  // 내가 기록했고, 상대방은 아직 → 톡톡 가능
  const canNudge = hasMyEntry && !hasPartnerEntry;

  return (
    <Pressable
      style={[styles.card, styles.cardLocked]}
      onPress={() => onPress?.(diary)}
    >
      {/* 헤더 */}
      <Row style={styles.header}>
        <Column style={{ flex: 1 }}>
          <Text variant="caption" color="textMuted">
            {formattedDate}
          </Text>
          <Row style={styles.locationRow}>
            <Icon name="map-pin" size={13} color={theme.colors.gray500} />
            <Text variant="headingSmall" color="textSecondary" ml="xs">
              {diary.locationName}
            </Text>
          </Row>
        </Column>
        <Icon name="lock" size={18} color={theme.colors.gray400} />
      </Row>

      {/* 잠금 상태 */}
      <View style={styles.lockArea}>
        <Row style={styles.lockStatusRow}>
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
        </Row>
        {/* 내가 쓴 내용 미리보기 */}
        {hasMyEntry && diary.myEntry && (
          <View style={styles.myEntryPreview}>
            {diary.myEntry.memo ? (
              <Text variant="bodySmall" color="text" numberOfLines={3}>
                {diary.myEntry.memo}
              </Text>
            ) : null}
            {diary.myEntry.photos && diary.myEntry.photos.length > 0 && (
              <Text variant="caption" color="textMuted" mt="xxs">
                📷 사진 {diary.myEntry.photos.length}장
              </Text>
            )}
          </View>
        )}

        <Text variant="caption" color="textMuted" mt="sm" align="center">
          {hasMyEntry
            ? '연인의 기록을 기다리는 중...'
            : '나의 하루를 먼저 남겨주세요'}
        </Text>

        {/* ── 톡톡 버튼 ── */}
        {canNudge && onNudge && (
          <Pressable
            style={[styles.nudgeBtn, nudgeLoading && styles.nudgeBtnDisabled]}
            onPress={() => !nudgeLoading && onNudge(diary)}
            disabled={nudgeLoading}
          >
            <Text style={styles.nudgeEmoji}>
              {nudgeLoading ? '...' : '👆'}
            </Text>
            <Text variant="label" color="primary" ml="xs">
              {nudgeLoading ? '보내는 중' : '톡톡! 두드리기'}
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

// ─── Revealed Feed Card ─────────────────────────────────

function RevealedFeedCard({
  diary,
  formattedDate,
  onPress,
}: {
  diary: WalkDiary;
  formattedDate: string;
  onPress?: (diary: WalkDiary) => void;
}) {
  return (
    <Pressable
      style={styles.card}
      onPress={() => onPress?.(diary)}
    >
      {/* 헤더: 날짜 + 위치 */}
      <Row style={styles.header}>
        <Column style={{ flex: 1 }}>
          <Text variant="caption" color="textMuted">
            {formattedDate}
          </Text>
          <Row style={styles.locationRow}>
            <Icon name="map-pin" size={13} color={theme.colors.primary} />
            <Text variant="headingSmall" ml="xs">
              {diary.locationName}
            </Text>
          </Row>
        </Column>
        <Icon name="footprint" size={20} color={theme.colors.primary} />
      </Row>

      {/* 둘의 기록 나란히 */}
      <Row style={styles.dualEntries}>
        {diary.myEntry && (
          <Column style={styles.entryCol}>
            <Text variant="label" color="primary" mb="xs">
              {diary.myEntry.nickname}
            </Text>
            {diary.myEntry.photos.length > 0 && (
              <View style={styles.entryPhoto}>
                <Image
                  source={{ uri: diary.myEntry.photos[0] }}
                  style={styles.entryPhotoImage}
                />
              </View>
            )}
            {diary.myEntry.memo ? (
              <Text
                variant="bodySmall"
                color="textSecondary"
                mt="xs"
                numberOfLines={3}
              >
                {diary.myEntry.memo}
              </Text>
            ) : null}
          </Column>
        )}
        {diary.partnerEntry && (
          <Column style={styles.entryCol}>
            <Text variant="label" color="primary" mb="xs">
              {diary.partnerEntry.nickname}
            </Text>
            {diary.partnerEntry.photos.length > 0 && (
              <View style={styles.entryPhoto}>
                <Image
                  source={{ uri: diary.partnerEntry.photos[0] }}
                  style={styles.entryPhotoImage}
                />
              </View>
            )}
            {diary.partnerEntry.memo ? (
              <Text
                variant="bodySmall"
                color="textSecondary"
                mt="xs"
                numberOfLines={3}
              >
                {diary.partnerEntry.memo}
              </Text>
            ) : null}
          </Column>
        )}
      </Row>

    </Pressable>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: SPACING.lg,
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
    shadowOpacity: 0,
    elevation: 0,
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  locationRow: {
    alignItems: 'center',
    marginTop: SPACING.xxs,
  },
  lockArea: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  lockStatusRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  lockChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray100,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
  },
  myEntryPreview: {
    width: '100%',
    marginTop: SPACING.md,
    backgroundColor: theme.colors.surfaceWarm,
    borderRadius: theme.radius.md,
    padding: SPACING.md,
  },
  nudgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    backgroundColor: theme.colors.primarySurface,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.primaryLight,
  },
  nudgeBtnDisabled: {
    opacity: 0.6,
  },
  nudgeEmoji: {
    fontSize: 16,
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
    height: 100,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.gray100,
  },
});
