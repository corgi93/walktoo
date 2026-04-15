import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Column, Icon, Row, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';
import { WalkDiary } from '@/types/diary';
import { formatDate, parseLocalDate } from '@/utils/date';

// ─── Types ──────────────────────────────────────────────

interface FootprintTimelineProps {
  diaries: WalkDiary[];
  myName?: string;
  partnerName?: string;
  onItemPress?: (diary: WalkDiary) => void;
  onNudge?: (diary: WalkDiary) => void;
  nudgeLoading?: boolean;
}

interface YearGroup {
  year: number;
  items: WalkDiary[];
}

// ─── Component ──────────────────────────────────────────

export function FootprintTimeline({
  diaries,
  myName,
  partnerName,
  onItemPress,
  onNudge,
  nudgeLoading,
}: FootprintTimelineProps) {
  const { t } = useTranslation(['diary', 'common']);

  // 연도별로 그룹화 (이미 최신순으로 정렬되어 있다고 가정)
  const yearGroups = useMemo<YearGroup[]>(() => {
    const groups: YearGroup[] = [];
    for (const diary of diaries) {
      const year = parseLocalDate(diary.date).getFullYear();
      const last = groups[groups.length - 1];
      if (last && last.year === year) {
        last.items.push(diary);
      } else {
        groups.push({ year, items: [diary] });
      }
    }
    return groups;
  }, [diaries]);

  return (
    <View style={styles.container}>
      {yearGroups.map((group, groupIdx) => (
        <View key={group.year}>
          {/* 연도 섹션 헤더 */}
          <View
            style={[
              styles.yearHeader,
              groupIdx > 0 && styles.yearHeaderSpaced,
            ]}
          >
            <View style={styles.yearLine} />
            <Text variant="label" color="textMuted" style={styles.yearLabel}>
              {t('timeline.year-label', { year: group.year })}
            </Text>
            <View style={styles.yearLine} />
          </View>

          {group.items.map((diary, index) => {
            const isLastInGroup = index === group.items.length - 1;
            const isLastGroup = groupIdx === yearGroups.length - 1;
            const isLast = isLastInGroup && isLastGroup;
            const d = parseLocalDate(diary.date);
            const month = d.getMonth() + 1;
            const day = d.getDate();
            const weekday = formatDate(d, { weekday: 'short' });

            return (
              <Pressable
                key={diary.id}
                style={styles.item}
                onPress={() => onItemPress?.(diary)}
              >
                {/* 좌측 날짜 태그 */}
                <View style={styles.dateTag}>
                  <Text style={styles.dateMonth}>
                    {month}
                    {t('common:labels.month-suffix')}
                  </Text>
                  <Text style={styles.dateDay}>{day}</Text>
                  <Text style={styles.dateWeekday}>{weekday}</Text>
                </View>

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
                      size={12}
                      color={diary.isRevealed ? theme.colors.primary : theme.colors.gray500}
                    />
                  </View>
                  {!isLast && <View style={styles.line} />}
                </View>

                {/* 카드 */}
                {diary.isRevealed ? (
                  <RevealedCard diary={diary} />
                ) : (
                  <LockedCard
                    diary={diary}
                    myName={myName}
                    partnerName={partnerName}
                    onNudge={onNudge}
                    nudgeLoading={nudgeLoading}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ─── Locked Card ────────────────────────────────────────

function LockedCard({
  diary,
  myName: myNameProp,
  partnerName: partnerNameProp,
  onNudge,
  nudgeLoading,
}: {
  diary: WalkDiary;
  myName?: string;
  partnerName?: string;
  onNudge?: (diary: WalkDiary) => void;
  nudgeLoading?: boolean;
}) {
  const { t } = useTranslation(['diary', 'common']);
  const hasMyEntry = !!diary.myEntry;
  const hasPartnerEntry = !!diary.partnerEntry;
  const myLabel = myNameProp ?? t('diary:timeline.status-mine-empty');
  const partnerLabel = partnerNameProp ?? t('diary:timeline.status-partner-empty');
  const canNudge = hasMyEntry && !hasPartnerEntry;

  return (
    <View style={[styles.card, styles.cardLocked]}>
      <Text variant="headingSmall">
        {diary.locationName}
      </Text>

      {/* 상태 표시 — 누가 썼는지 한눈에 */}
      <View style={styles.lockStatus}>
        <View
          style={[
            styles.lockChip,
            hasMyEntry ? styles.lockChipDone : styles.lockChipEmpty,
          ]}
        >
          <Icon
            name={hasMyEntry ? 'check-circle' : 'edit'}
            size={13}
            color={hasMyEntry ? theme.colors.secondary : theme.colors.gray400}
          />
          <Text
            variant="caption"
            ml="xs"
            style={{
              color: hasMyEntry ? theme.colors.secondary : theme.colors.gray500,
              fontWeight: hasMyEntry ? '600' : '400',
            }}
          >
            {hasMyEntry ? `${myLabel} ✓` : myLabel}
          </Text>
        </View>
        <View
          style={[
            styles.lockChip,
            hasPartnerEntry ? styles.lockChipDone : styles.lockChipEmpty,
          ]}
        >
          <Icon
            name={hasPartnerEntry ? 'check-circle' : 'edit'}
            size={13}
            color={hasPartnerEntry ? theme.colors.secondary : theme.colors.gray400}
          />
          <Text
            variant="caption"
            ml="xs"
            style={{
              color: hasPartnerEntry ? theme.colors.secondary : theme.colors.gray500,
              fontWeight: hasPartnerEntry ? '600' : '400',
            }}
          >
            {hasPartnerEntry ? `${partnerLabel} ✓` : partnerLabel}
          </Text>
        </View>
      </View>

      {/* 내가 쓴 내용은 미리 보여줌 */}
      {hasMyEntry && diary.myEntry && (
        <View style={styles.myEntryPreview}>
          {diary.myEntry.memo ? (
            <Text variant="bodySmall" color="text" numberOfLines={3}>
              {diary.myEntry.memo}
            </Text>
          ) : null}
          {diary.myEntry.photos && diary.myEntry.photos.length > 0 && (
            <Text variant="caption" color="textMuted" mt="xxs">
              📷 {t('common:units.photos-count', { count: diary.myEntry.photos.length })}
            </Text>
          )}
        </View>
      )}

      <Text variant="caption" color="textMuted" mt="sm" align="center">
        {hasMyEntry && !hasPartnerEntry
          ? t('diary:timeline.locked-waiting-partner')
          : !hasMyEntry && hasPartnerEntry
            ? t('diary:timeline.locked-waiting-mine')
            : t('diary:timeline.locked-both-empty')}
      </Text>

      {/* 톡톡 버튼 */}
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
            {nudgeLoading ? t('diary:timeline.nudge-sending') : t('diary:timeline.nudge-button')}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Revealed Card ──────────────────────────────────────

function RevealedCard({
  diary,
}: {
  diary: WalkDiary;
}) {
  return (
    <View style={styles.card}>
      <Text variant="headingSmall">
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
  yearHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  yearHeaderSpaced: {
    marginTop: SPACING.xl,
  },
  yearLine: {
    flex: 1,
    height: 2,
    backgroundColor: theme.colors.gray200,
  },
  yearLabel: {
    fontSize: 12,
    letterSpacing: 1,
    color: theme.colors.gray500,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 80,
  },
  dateTag: {
    width: 30,
    alignItems: 'center',
    paddingTop: 2,
    marginRight: 4,
  },
  dateMonth: {
    fontSize: 10,
    lineHeight: 12,
    color: theme.colors.gray500,
    fontFamily: 'NeoDunggeunmo',
  },
  dateDay: {
    fontSize: 20,
    lineHeight: 22,
    marginTop: 1,
    color: theme.colors.text,
    fontFamily: 'NeoDunggeunmo',
    fontWeight: '600',
  },
  dateWeekday: {
    fontSize: 10,
    lineHeight: 12,
    marginTop: 1,
    color: theme.colors.gray500,
    fontFamily: 'NeoDunggeunmo',
  },
  timeline: {
    width: 28,
    alignItems: 'center',
    paddingTop: 4,
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
  lockStatus: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  lockChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  lockChipDone: {
    backgroundColor: `${theme.colors.secondary}14`,
    borderColor: `${theme.colors.secondary}40`,
  },
  lockChipEmpty: {
    backgroundColor: theme.colors.gray100,
    borderColor: theme.colors.gray200,
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
    marginTop: SPACING.md,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    backgroundColor: theme.colors.primarySurface,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.primaryLight,
  },
  nudgeBtnDisabled: {
    opacity: 0.6,
  },
  nudgeEmoji: {
    fontSize: 14,
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
