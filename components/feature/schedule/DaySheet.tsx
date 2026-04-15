import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Box, Icon, Row, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';
import type { WalkDiary } from '@/types/diary';
import type { CoupleSchedule } from '@/types/schedule';
import { SCHEDULE_CATEGORY_EMOJI } from '@/types/schedule';
import { formatDate, parseLocalDate } from '@/utils/date';

// ─── Types ──────────────────────────────────────────────

interface DaySheetProps {
  /** 'YYYY-MM-DD' */
  date: string;
  /** 오늘 날짜인지 */
  isToday: boolean;
  /** 이 날 산책 (없으면 null) */
  walk: WalkDiary | null;
  /** 이 날 발자국 스탬프 획득했는지 */
  hasStamp: boolean;
  /** 이 날 일정 목록 (본인 + 상대방) */
  schedules: CoupleSchedule[];
  /** 현재 사용자 id — owner 구분용 */
  myId: string | undefined;
  /** 내 닉네임 */
  myName: string;
  /** 상대 닉네임 */
  partnerName: string;
  /** 과거의 빈 날짜인지 (일정 추가 비활성) */
  isPast: boolean;
  /** 커플 연결 전 날짜인지 (모든 CTA 비활성) */
  isBeforeCouple: boolean;

  onClose: () => void;
  onOpenWalk: (walk: WalkDiary) => void;
  onCreateWalk: () => void;
  onAddSchedule: () => void;
  onEditSchedule: (schedule: CoupleSchedule) => void;
}

// ─── Component ──────────────────────────────────────────

/**
 * 날짜 셀 탭 시 열리는 바텀시트.
 *
 * Toss 철학: 하나의 탭 제스처 = 그 날의 **모든 정보**가 한 곳에.
 * - 산책 카드 (있으면) → 탭 시 diary-detail
 * - 발자국 받은 표시 (있으면)
 * - 일정 목록 (본인 것은 편집 가능, 상대방 것은 조회만)
 * - CTA:
 *   · 오늘 + 산책 없음 → "오늘의 산책 기록하기"
 *   · 일정 추가 (과거 이후 + 커플 연결 후이면 항상)
 */
export function DaySheet({
  date,
  isToday,
  walk,
  hasStamp,
  schedules,
  myId,
  myName,
  partnerName,
  isPast,
  isBeforeCouple,
  onClose,
  onOpenWalk,
  onCreateWalk,
  onAddSchedule,
  onEditSchedule,
}: DaySheetProps) {
  const { t } = useTranslation(['schedule', 'calendar']);

  const pretty = formatDate(parseLocalDate(date), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const showCreateWalkCta = isToday && !walk && !isBeforeCouple;
  const showAddScheduleCta = !isBeforeCouple;

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
        {/* grip */}
        <View style={styles.grip} />

        {/* 헤더 */}
        <Row style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text variant="headingSmall">{pretty}</Text>
            {isToday && (
              <Text variant="caption" color="primary" mt="xxs">
                {t('calendar:today')}
              </Text>
            )}
          </View>
          <Pressable onPress={onClose} hitSlop={8}>
            <Icon name="x" size={20} color={theme.colors.gray500} />
          </Pressable>
        </Row>

        <ScrollView
          style={{ maxHeight: 360 }}
          showsVerticalScrollIndicator={false}
        >
          {/* 산책 섹션 */}
          {walk && (
            <Pressable
              onPress={() => onOpenWalk(walk)}
              style={styles.walkCard}
            >
              <View style={styles.walkIcon}>
                <Icon
                  name="footprint"
                  size={16}
                  color={theme.colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="label" color="text">
                  {walk.locationName ?? t('schedule:day-sheet.walk-untitled')}
                </Text>
                <Text variant="caption" color="textSecondary" mt="xxs">
                  {walk.isRevealed
                    ? t('schedule:day-sheet.walk-revealed')
                    : t('schedule:day-sheet.walk-locked')}
                </Text>
              </View>
              <Icon
                name="chevron-right"
                size={14}
                color={theme.colors.gray400}
              />
            </Pressable>
          )}

          {/* 스탬프 */}
          {hasStamp && (
            <Box style={styles.stampRow}>
              <Text style={{ fontSize: 14 }}>⭐</Text>
              <Text variant="caption" color="textSecondary" ml="xs">
                {t('schedule:day-sheet.stamp-earned')}
              </Text>
            </Box>
          )}

          {/* 일정 섹션 제목 */}
          <Row style={styles.sectionHeader}>
            <Text variant="label" color="textSecondary">
              {t('schedule:day-sheet.schedules-title', {
                count: schedules.length,
              })}
            </Text>
          </Row>

          {/* 일정 목록 */}
          {schedules.length === 0 ? (
            <Box style={styles.emptySchedules}>
              <Text
                variant="caption"
                color="textMuted"
                align="center"
              >
                {t('schedule:day-sheet.schedules-empty')}
              </Text>
            </Box>
          ) : (
            schedules.map((s) => {
              const isMine = s.ownerId === myId;
              const ownerName = isMine ? myName : partnerName;
              const emoji = s.emoji ?? SCHEDULE_CATEGORY_EMOJI[s.category];
              return (
                <Pressable
                  key={s.id}
                  onPress={() => onEditSchedule(s)}
                  style={styles.scheduleItem}
                >
                  <View
                    style={[
                      styles.ownerBar,
                      {
                        backgroundColor: isMine
                          ? theme.colors.primary
                          : theme.colors.secondary,
                      },
                    ]}
                  />
                  <View style={styles.scheduleEmoji}>
                    <Text style={{ fontSize: 18 }}>{emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="label" color="text" numberOfLines={1}>
                      {s.title}
                    </Text>
                    <Text
                      variant="caption"
                      color="textSecondary"
                      mt="xxs"
                      numberOfLines={1}
                    >
                      {ownerName}
                      {s.note ? ` · ${s.note}` : ''}
                    </Text>
                  </View>
                  <Icon
                    name={isMine ? 'edit' : 'chevron-right'}
                    size={14}
                    color={theme.colors.gray400}
                  />
                </Pressable>
              );
            })
          )}
        </ScrollView>

        {/* CTA row */}
        {(showCreateWalkCta || showAddScheduleCta) && (
          <Row style={styles.ctaRow}>
            {showAddScheduleCta && (
              <Pressable
                onPress={onAddSchedule}
                style={[
                  styles.ctaButton,
                  styles.ctaSecondary,
                  !showCreateWalkCta && { flex: 1 },
                ]}
              >
                <Icon name="plus" size={14} color={theme.colors.primary} />
                <Text
                  variant="bodySmall"
                  ml="xs"
                  style={{ color: theme.colors.primary, fontWeight: '600' }}
                >
                  {t('schedule:day-sheet.cta-add-schedule')}
                </Text>
              </Pressable>
            )}
            {showCreateWalkCta && (
              <Pressable
                onPress={onCreateWalk}
                style={[styles.ctaButton, styles.ctaPrimary]}
              >
                <Icon name="footprint" size={14} color={theme.colors.white} />
                <Text
                  variant="bodySmall"
                  ml="xs"
                  style={{ color: theme.colors.white, fontWeight: '600' }}
                >
                  {t('schedule:day-sheet.cta-create-walk')}
                </Text>
              </Pressable>
            )}
          </Row>
        )}
      </Pressable>
    </Pressable>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(44, 44, 46, 0.4)',
    justifyContent: 'flex-end',
    zIndex: 60,
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxl,
    padding: 20,
    paddingBottom: 32,
    ...theme.pixel.borderThin,
  },
  grip: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.gray200,
    marginBottom: SPACING.md,
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  walkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primarySurface,
    borderRadius: theme.radius.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
  },
  walkIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  stampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    marginBottom: SPACING.sm,
  },
  sectionHeader: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptySchedules: {
    padding: SPACING.md,
    backgroundColor: theme.colors.gray100,
    borderRadius: theme.radius.md,
    marginBottom: SPACING.sm,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceWarm,
    borderRadius: theme.radius.md,
    paddingVertical: SPACING.sm,
    paddingRight: SPACING.md,
    marginBottom: SPACING.xs,
    overflow: 'hidden',
  },
  ownerBar: {
    width: 4,
    alignSelf: 'stretch',
    marginRight: SPACING.sm,
  },
  scheduleEmoji: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  ctaRow: {
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    flex: 1,
    borderWidth: 1.5,
  },
  ctaPrimary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  ctaSecondary: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.primary,
  },
});
