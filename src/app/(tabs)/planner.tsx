import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, TabScreenHeader, Text } from '@/components/base';
import { NoCoupleCard } from '@/components/feature/couple';
import { ScheduleForm, type ScheduleFormResult } from '@/components/feature/schedule';
import { useToast } from '@/components/composite/toast/ToastProvider';
import {
  useCreateScheduleMutation,
  useDeleteScheduleMutation,
  useUpdateScheduleMutation,
} from '@/hooks/services/schedules/mutation';
import { useSchedulesByMonthQuery } from '@/hooks/services/schedules/query';
import { useDiaryByMonthQuery } from '@/hooks/services/diary/query';
import { useKeyboardBottomInset } from '@/hooks/useKeyboardBottomInset';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import { theme } from '@/styles/theme';
import { FONT_FAMILY, LAYOUT, SPACING } from '@/styles/type';
import type { WalkDiary } from '@/types/diary';
import type { CoupleSchedule } from '@/types/schedule';
import {
  addMonths,
  formatDate,
  getCurrentYearMonth,
  getDaysInMonth,
  getFirstDayOfMonth,
  getLocalToday,
  getMonthKey,
  parseLocalDate,
} from '@/utils/date';
import { isImageUri } from '@/utils/media';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function PlannerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { me, isCoupleConnected, myName, partnerName } = usePartnerDerivation();
  const keyboardBottomInset = useKeyboardBottomInset(SPACING.xl);
  const [visibleMonth, setVisibleMonth] = useState(getCurrentYearMonth);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<CoupleSchedule | null>(
    null,
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getLocalToday);
  const [showDayDetails, setShowDayDetails] = useState(false);

  const { data: schedules = [] } = useSchedulesByMonthQuery(
    visibleMonth.year,
    visibleMonth.month,
  );
  const { data: walks = [] } = useDiaryByMonthQuery(
    visibleMonth.year,
    visibleMonth.month,
    'together',
  );
  const createSchedule = useCreateScheduleMutation();
  const updateSchedule = useUpdateScheduleMutation();
  const deleteSchedule = useDeleteScheduleMutation();

  const schedulesByDate = useMemo(() => {
    const groups = new Map<string, CoupleSchedule[]>();
    schedules.forEach((schedule) => {
      const daySchedules = groups.get(schedule.date) ?? [];
      daySchedules.push(schedule);
      groups.set(schedule.date, daySchedules);
    });
    return groups;
  }, [schedules]);

  const walksByDate = useMemo(() => {
    const groups = new Map<string, WalkDiary[]>();
    walks.forEach((walk) => {
      if (walk.kind !== 'together') return;
      const dayWalks = groups.get(walk.date) ?? [];
      dayWalks.push(walk);
      groups.set(walk.date, dayWalks);
    });
    return groups;
  }, [walks]);

  const selectedSchedules = schedulesByDate.get(selectedDate) ?? [];
  const selectedWalks = walksByDate.get(selectedDate) ?? [];

  const moveMonth = (delta: number) => {
    setShowDayDetails(false);
    setVisibleMonth((current) => {
      const next = addMonths(current.year, current.month, delta);
      setSelectedDate(`${getMonthKey(next.year, next.month)}-01`);
      return next;
    });
  };

  const handleCreate = (result: ScheduleFormResult) => {
    createSchedule.mutate(result, {
      onSuccess: () => {
        setShowCreateForm(false);
        toast.success('일정을 추가했어요');
      },
      onError: (error) =>
        toast.error(getErrorMessage(error, '일정을 저장하지 못했어요')),
    });
  };

  const handleUpdate = (result: ScheduleFormResult) => {
    if (!editingSchedule) return;
    updateSchedule.mutate(
      {
        id: editingSchedule.id,
        ...result,
      },
      {
        onSuccess: () => {
          setEditingSchedule(null);
          toast.success('일정을 수정했어요');
        },
        onError: (error) =>
          toast.error(getErrorMessage(error, '일정을 수정하지 못했어요')),
      },
    );
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleDelete = () => {
    if (!editingSchedule) return;
    deleteSchedule.mutate(editingSchedule.id, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        setEditingSchedule(null);
        toast.success('일정을 삭제했어요');
      },
      onError: (error) =>
        toast.error(getErrorMessage(error, '일정을 삭제하지 못했어요')),
    });
  };

  const handleCalendarDatePress = (date: string) => {
    setSelectedDate(date);
    setShowDayDetails(true);
  };

  const handleWalkPress = (walk: WalkDiary) => {
    setShowDayDetails(false);
    router.push({
      pathname: '/diary-detail',
      params: {
        id: walk.id,
        date: walk.date,
        locationName: walk.locationName,
        kind: walk.kind,
        isRevealed: String(walk.isRevealed),
        myEntry: walk.myEntry ? JSON.stringify(walk.myEntry) : '',
        partnerEntry: walk.partnerEntry ? JSON.stringify(walk.partnerEntry) : '',
      },
    });
  };

  const handleAddSchedule = () => {
    setShowDayDetails(false);
    setShowCreateForm(true);
  };

  const handleEditSchedule = (schedule: CoupleSchedule) => {
    setShowDayDetails(false);
    setEditingSchedule(schedule);
  };

  if (!isCoupleConnected) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TabScreenHeader
          title="캘린더"
          titleVariant="displaySmall"
        />
        <ScrollView
          contentContainerStyle={[
            styles.noCoupleScroll,
            { paddingBottom: insets.bottom + LAYOUT.bottomSafe + keyboardBottomInset },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.noCoupleWrap}>
            <NoCoupleCard />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TabScreenHeader
        title="캘린더"
        subtitle="일정과 우리 기록을 둘이 같이 봐요"
        titleVariant="displaySmall"
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: LAYOUT.bottomSafe + keyboardBottomInset },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        <ScheduleCalendar
          year={visibleMonth.year}
          month={visibleMonth.month}
          selectedDate={selectedDate}
          schedulesByDate={schedulesByDate}
          walksByDate={walksByDate}
          myUserId={me?.id}
          onPrev={() => moveMonth(-1)}
          onNext={() => moveMonth(1)}
          onSelectDate={handleCalendarDatePress}
        />
      </ScrollView>

      <DayDetailsSheet
        visible={showDayDetails}
        date={selectedDate}
        schedules={selectedSchedules}
        walks={selectedWalks}
        myUserId={me?.id}
        myName={myName}
        partnerName={partnerName}
        bottomInset={insets.bottom}
        onClose={() => setShowDayDetails(false)}
        onAddSchedule={handleAddSchedule}
        onEditSchedule={handleEditSchedule}
        onOpenWalk={handleWalkPress}
      />

      {showCreateForm && (
        <ScheduleForm
          defaultDate={selectedDate}
          onClose={() => setShowCreateForm(false)}
          onSubmit={handleCreate}
          submitting={createSchedule.isPending}
        />
      )}

      {editingSchedule && (
        <ScheduleForm
          initial={editingSchedule}
          onClose={() => setEditingSchedule(null)}
          onSubmit={handleUpdate}
          onDelete={confirmDelete}
          submitting={updateSchedule.isPending || deleteSchedule.isPending}
          canEdit={editingSchedule.ownerId === me?.id}
        />
      )}

      {showDeleteConfirm && (
        <Pressable
          style={styles.confirmOverlay}
          onPress={() => setShowDeleteConfirm(false)}
        >
          <Pressable
            style={styles.confirmModal}
            onPress={(event) => event.stopPropagation()}
          >
            <Text variant="headingSmall">일정 삭제</Text>
            <Text variant="bodySmall" color="textSecondary" mt="sm">
              이 일정을 삭제할까요?
            </Text>
            <View style={styles.confirmActions}>
              <Pressable
                onPress={() => setShowDeleteConfirm(false)}
                style={styles.confirmCancel}
              >
                <Text variant="bodySmall" color="textSecondary">
                  취소
                </Text>
              </Pressable>
              <Pressable
                onPress={handleDelete}
                disabled={deleteSchedule.isPending}
                style={[
                  styles.confirmDelete,
                  deleteSchedule.isPending && styles.disabledButton,
                ]}
              >
                <Text variant="bodySmall" color="white" weight="700">
                  삭제
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      )}
    </KeyboardAvoidingView>
  );
}

function DayDetailsSheet({
  visible,
  date,
  schedules,
  walks,
  myUserId,
  myName,
  partnerName,
  bottomInset,
  onClose,
  onAddSchedule,
  onEditSchedule,
  onOpenWalk,
}: {
  visible: boolean;
  date: string;
  schedules: CoupleSchedule[];
  walks: WalkDiary[];
  myUserId?: string;
  myName: string;
  partnerName: string;
  bottomInset: number;
  onClose: () => void;
  onAddSchedule: () => void;
  onEditSchedule: (schedule: CoupleSchedule) => void;
  onOpenWalk: (walk: WalkDiary) => void;
}) {
  if (!visible) return null;

  return (
    <View style={styles.daySheetLayer}>
      <Pressable style={styles.daySheetBackdrop} onPress={onClose} />
      <View style={[styles.daySheet, { paddingBottom: bottomInset + SPACING.md }]}>
        <View style={styles.daySheetHandle} />
        <View style={styles.daySheetHeader}>
          <View style={styles.daySheetTitleWrap}>
            <Text variant="caption" color="primary" weight="700">
              선택한 날짜
            </Text>
            <Text variant="headingMedium" mt="xxs">
              {formatDate(parseLocalDate(date), {
                month: 'long',
                day: 'numeric',
                weekday: 'short',
              })}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            style={styles.daySheetClose}
            accessibilityRole="button"
            accessibilityLabel="날짜 상세 닫기"
          >
            <Icon name="x" size={20} color={theme.colors.gray500} />
          </Pressable>
        </View>

        <View style={styles.daySheetSummary}>
          <View style={styles.daySheetSummaryItem}>
            <Icon name="calendar" size={15} color={theme.colors.primary} />
            <Text variant="caption" color="textSecondary" ml="xs">
              일정 {schedules.length}
            </Text>
          </View>
          <View style={styles.daySheetSummaryDivider} />
          <View style={styles.daySheetSummaryItem}>
            <Icon name="footprint" size={15} color={theme.colors.secondary} />
            <Text variant="caption" color="textSecondary" ml="xs">
              우리 기록 {walks.length}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.daySheetScroll}
          contentContainerStyle={styles.daySheetContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {walks.length === 0 && schedules.length === 0 ? (
            <View style={styles.scheduleEmpty}>
              <Text variant="bodySmall" color="textSecondary">
                선택한 날짜에 일정이나 기록이 없어요
              </Text>
            </View>
          ) : (
            <View style={styles.scheduleList}>
              {walks.length > 0 && (
                <View style={styles.walkGroup}>
                  <View style={styles.daySectionHeader}>
                    <View style={styles.daySectionTitle}>
                      <Icon name="book-open" size={15} color={theme.colors.secondary} />
                      <Text variant="bodySmall" weight="700" ml="xs">
                        우리 기록
                      </Text>
                    </View>
                    <Text variant="caption" color="textMuted" style={styles.daySectionCount}>
                      {walks.length}
                    </Text>
                  </View>
                  {walks.map((walk) => (
                    <Pressable
                      key={walk.id}
                      onPress={() => onOpenWalk(walk)}
                      style={({ pressed }) => [
                        styles.walkCard,
                        pressed && styles.daySheetRowPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="우리 기록 자세히 보기"
                    >
                      <WalkPreviewImage walk={walk} />
                      <View style={styles.scheduleBody}>
                        <Text variant="bodySmall" weight="700" numberOfLines={1}>
                          {getWalkPreviewTitle(walk)}
                        </Text>
                        <Text variant="caption" color="textSecondary" mt="xxs">
                          {getWalkPreviewText(walk)}
                        </Text>
                      </View>
                      <Icon
                        name="chevron-right"
                        size={16}
                        color={theme.colors.textMuted}
                      />
                    </Pressable>
                  ))}
                </View>
              )}

              {schedules.length > 0 && (
                <View style={styles.walkGroup}>
                  <View style={styles.daySectionHeader}>
                    <View style={styles.daySectionTitle}>
                      <Icon name="calendar" size={15} color={theme.colors.primary} />
                      <Text variant="bodySmall" weight="700" ml="xs">
                        일정
                      </Text>
                    </View>
                    <Text variant="caption" color="textMuted" style={styles.daySectionCount}>
                      {schedules.length}
                    </Text>
                  </View>
                  {schedules.map((schedule) => {
                    const isMine = schedule.ownerId === myUserId;
                    const owner = isMine ? myName : partnerName;
                    return (
                      <Pressable
                        key={schedule.id}
                        onPress={() => onEditSchedule(schedule)}
                        style={({ pressed }) => [
                          styles.scheduleCard,
                          isMine
                            ? styles.scheduleCardMine
                            : styles.scheduleCardPartner,
                          pressed && styles.daySheetRowPressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`${schedule.title} 일정 수정`}
                      >
                        <View style={styles.scheduleEmoji}>
                          <Text variant="bodyLarge">{schedule.emoji ?? '📌'}</Text>
                        </View>
                        <View style={styles.scheduleBody}>
                          <View style={styles.scheduleTitleRow}>
                            <Text
                              variant="bodySmall"
                              weight="700"
                              numberOfLines={1}
                              style={styles.scheduleTitle}
                            >
                              {schedule.title}
                            </Text>
                            <Text
                              variant="caption"
                              style={[
                                styles.scheduleOwnerBadge,
                                isMine
                                  ? styles.scheduleOwnerMine
                                  : styles.scheduleOwnerPartner,
                              ]}
                            >
                              {owner}
                            </Text>
                          </View>
                          {!!schedule.note && (
                            <Text
                              variant="caption"
                              color="textSecondary"
                              numberOfLines={2}
                              mt="xxs"
                            >
                              {schedule.note}
                            </Text>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <Pressable onPress={onAddSchedule} style={styles.daySheetAddButton}>
          <Icon name="plus" size={16} color={theme.colors.white} />
          <Text variant="bodySmall" color="white" ml="xs" weight="700">
            일정 추가
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const getEntryPreviewText = (
  entry: WalkDiary['myEntry'] | WalkDiary['partnerEntry'],
) =>
  entry?.diaryAnswer?.trim() ||
  entry?.memo?.trim() ||
  entry?.locationName?.trim() ||
  '';

const getWalkPreviewImageUri = (walk: WalkDiary) => {
  const uris = [
    ...(walk.myEntry?.photos ?? []),
    ...(walk.partnerEntry?.photos ?? []),
  ];
  return uris.find(isImageUri) ?? null;
};

const getWalkPreviewTitle = (walk: WalkDiary) =>
  walk.locationName?.trim() || getEntryPreviewText(walk.myEntry) || '우리 기록';

const getWalkPreviewText = (walk: WalkDiary) =>
  getEntryPreviewText(walk.myEntry) ||
  getEntryPreviewText(walk.partnerEntry) ||
  (walk.isRevealed ? '둘 다 남긴 기록' : '함께 산책');

function WalkPreviewImage({ walk }: { walk: WalkDiary }) {
  const uri = getWalkPreviewImageUri(walk);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={styles.walkThumbSmall}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={[
        styles.walkThumbSmall,
        styles.walkThumbEmpty,
      ]}
    >
      <Icon
        name="footprint"
        size={11}
        color={walk.isRevealed ? theme.colors.primary : theme.colors.secondary}
      />
    </View>
  );
}

function ScheduleCalendar({
  year,
  month,
  selectedDate,
  schedulesByDate,
  walksByDate,
  myUserId,
  onPrev,
  onNext,
  onSelectDate,
}: {
  year: number;
  month: number;
  selectedDate: string;
  schedulesByDate: Map<string, CoupleSchedule[]>;
  walksByDate: Map<string, WalkDiary[]>;
  myUserId?: string;
  onPrev: () => void;
  onNext: () => void;
  onSelectDate: (date: string) => void;
}) {
  const monthKey = getMonthKey(year, month);
  const today = getLocalToday();

  const cells = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const nextCells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i += 1) nextCells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) nextCells.push(day);
    while (nextCells.length % 7 !== 0) nextCells.push(null);
    return nextCells;
  }, [year, month]);

  return (
    <View style={styles.calendarCard}>
      <View style={styles.calendarHeader}>
        <Pressable onPress={onPrev} style={styles.iconButton}>
          <Icon name="chevron-left" size={22} color={theme.colors.text} />
        </Pressable>
        <Text variant="headingMedium">{`${year}년 ${month}월`}</Text>
        <Pressable onPress={onNext} style={styles.iconButton}>
          <Icon name="chevron-right" size={22} color={theme.colors.text} />
        </Pressable>
      </View>

      <View style={styles.weekHeader}>
        {WEEKDAYS.map((weekday, index) => (
          <View key={weekday} style={styles.weekHeaderCell}>
            <Text
              variant="caption"
              color={
                index === 0
                  ? 'primary'
                  : index === 6
                    ? 'textSecondary'
                    : 'textMuted'
              }
            >
              {weekday}
            </Text>
          </View>
        ))}
      </View>

      {Array.from({ length: Math.ceil(cells.length / 7) }).map((_, weekIdx) => (
        <View key={weekIdx} style={styles.calendarWeek}>
          {cells.slice(weekIdx * 7, weekIdx * 7 + 7).map((day, dayIdx) => {
            if (!day) {
              return (
                <View
                  key={`empty-${weekIdx}-${dayIdx}`}
                  style={styles.calendarCell}
                />
              );
            }
            const date = `${monthKey}-${String(day).padStart(2, '0')}`;
            const schedules = schedulesByDate.get(date) ?? [];
            const walks = walksByDate.get(date) ?? [];
            const isSelected = selectedDate === date;
            const isToday = today === date;
            const previewSchedules = schedules.slice(0, 1);
            const previewWalk = walks[0];
            const extraCount =
              Math.max(schedules.length - previewSchedules.length, 0) +
              Math.max(walks.length - (previewWalk ? 1 : 0), 0);

            return (
              <Pressable
                key={date}
                onPress={() => onSelectDate(date)}
                style={[
                  styles.calendarCell,
                  isToday && styles.calendarCellToday,
                  isSelected && styles.calendarCellSelected,
                ]}
              >
                <Text
                  variant="caption"
                  color={isSelected || isToday ? 'primary' : 'text'}
                  weight={isSelected || isToday ? '700' : undefined}
                  style={[
                    styles.dayNumber,
                    isSelected && styles.dayNumberSelected,
                  ]}
                >
                  {day}
                </Text>

                <View style={styles.dayContent}>
                  {previewSchedules.map((schedule) => {
                    const isMine = schedule.ownerId === myUserId;
                    return (
                      <View
                        key={schedule.id}
                        style={[
                          styles.calendarScheduleChip,
                          isMine
                            ? styles.calendarScheduleMine
                            : styles.calendarSchedulePartner,
                        ]}
                      >
                        <Text
                          style={[
                            styles.calendarScheduleText,
                            isMine
                              ? styles.calendarScheduleTextMine
                              : styles.calendarScheduleTextPartner,
                          ]}
                          numberOfLines={2}
                        >
                          {schedule.title}
                        </Text>
                      </View>
                    );
                  })}

                  {previewWalk && (
                    <View style={styles.calendarWalkPreview}>
                      <WalkPreviewImage walk={previewWalk} />
                    </View>
                  )}

                  {extraCount > 0 && (
                    <Text style={styles.calendarMoreText} numberOfLines={1}>
                      +{extraCount}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}

      <View style={styles.calendarLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, styles.calendarScheduleMine]} />
          <Text variant="caption" color="textMuted" ml="xxs">
            내 일정
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, styles.calendarSchedulePartner]} />
          <Text variant="caption" color="textMuted" ml="xxs">
            연인 일정
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendPhoto} />
          <Text variant="caption" color="textMuted" ml="xxs">
            우리 기록
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  noCoupleWrap: {
    paddingHorizontal: LAYOUT.screenPx,
    paddingTop: SPACING.lg,
  },
  noCoupleScroll: {
    flexGrow: 1,
  },
  scroll: {
    paddingHorizontal: 10,
    paddingTop: SPACING.xs,
    gap: SPACING.md,
  },
  calendarCard: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceWarm,
    paddingHorizontal: 0,
    paddingVertical: SPACING.xs,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  weekHeader: {
    flexDirection: 'row',
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
  },
  weekHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  calendarWeek: {
    flexDirection: 'row',
    minHeight: 100,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
  },
  calendarCell: {
    flex: 1,
    paddingHorizontal: 1.5,
    paddingTop: 3,
    paddingBottom: 4,
  },
  calendarCellToday: {
    backgroundColor: 'transparent',
  },
  calendarCellSelected: {
    borderTopWidth: 2,
    borderTopColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySurface,
  },
  dayNumber: {
    fontSize: 13,
    lineHeight: 15,
    alignSelf: 'flex-start',
    marginBottom: 2,
    minWidth: 16,
    height: 16,
    textAlign: 'left',
    overflow: 'hidden',
  },
  dayNumberSelected: {
    backgroundColor: 'transparent',
  },
  dayContent: {
    flex: 1,
    gap: 2,
    alignItems: 'stretch',
  },
  calendarScheduleChip: {
    minHeight: 22,
    borderRadius: theme.radius.xs,
    borderWidth: 0,
    paddingHorizontal: 3,
    paddingVertical: 2,
    justifyContent: 'center',
  },
  calendarScheduleMine: {
    backgroundColor: '#F8C9C5',
  },
  calendarSchedulePartner: {
    backgroundColor: '#BFE3D1',
  },
  calendarScheduleText: {
    fontFamily: FONT_FAMILY.pixel,
    fontSize: 9,
    lineHeight: 10,
    fontWeight: '700',
    includeFontPadding: false,
  },
  calendarScheduleTextMine: {
    color: theme.colors.primaryDark,
  },
  calendarScheduleTextPartner: {
    color: '#426B58',
  },
  calendarWalkPreview: {
    alignItems: 'center',
    marginTop: 0,
  },
  calendarMoreText: {
    fontFamily: FONT_FAMILY.pixel,
    fontSize: 8,
    lineHeight: 10,
    color: theme.colors.textMuted,
    includeFontPadding: false,
  },
  calendarLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendSwatch: {
    width: 18,
    height: 10,
    borderRadius: theme.radius.xs,
    borderWidth: 1,
  },
  legendPhoto: {
    width: 14,
    height: 10,
    borderRadius: theme.radius.xs,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.white,
  },
  daySheetLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
    elevation: 10,
  },
  daySheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(44, 44, 46, 0.38)',
  },
  daySheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '78%',
    paddingHorizontal: LAYOUT.screenPx,
    paddingTop: SPACING.sm,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.card,
  },
  daySheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: SPACING.md,
    backgroundColor: theme.colors.gray300,
  },
  daySheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  daySheetTitleWrap: {
    flex: 1,
  },
  daySheetClose: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.surface,
  },
  daySheetSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    paddingHorizontal: SPACING.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  daySheetSummaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  daySheetSummaryDivider: {
    width: 1,
    height: 16,
    backgroundColor: theme.colors.borderLight,
  },
  daySheetScroll: {
    flexShrink: 1,
  },
  daySheetContent: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  daySheetAddButton: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.primaryDark,
    backgroundColor: theme.colors.primary,
  },
  daySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 24,
  },
  daySectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daySectionCount: {
    minWidth: 22,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    textAlign: 'center',
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.gray100,
    overflow: 'hidden',
  },
  daySheetRowPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },
  scheduleList: {
    gap: SPACING.sm,
  },
  walkGroup: {
    gap: SPACING.sm,
  },
  walkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceWarm,
    borderWidth: 1.5,
    borderColor: theme.colors.secondaryLight,
  },
  walkThumbSmall: {
    width: 30,
    height: 30,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.white,
    backgroundColor: theme.colors.gray100,
    transform: [{ rotate: '-2deg' }],
  },
  walkThumbEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleEmpty: {
    minHeight: 74,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceWarm,
    padding: SPACING.md,
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.borderLight,
  },
  scheduleCardMine: {
    backgroundColor: theme.colors.primarySurface,
    borderColor: theme.colors.primaryLight,
  },
  scheduleCardPartner: {
    backgroundColor: '#F4FBF7',
    borderColor: theme.colors.secondaryLight,
  },
  scheduleEmoji: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySurface,
  },
  scheduleBody: {
    flex: 1,
  },
  scheduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  scheduleTitle: {
    flex: 1,
  },
  scheduleOwnerBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: theme.radius.xs,
    overflow: 'hidden',
    fontSize: 10,
    lineHeight: 14,
  },
  scheduleOwnerMine: {
    color: theme.colors.primaryDark,
    backgroundColor: theme.colors.primaryLight,
  },
  scheduleOwnerPartner: {
    color: '#426B58',
    backgroundColor: theme.colors.secondaryLight,
  },
  disabledButton: {
    opacity: 0.5,
  },
  confirmOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(44, 44, 46, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 120,
    paddingHorizontal: LAYOUT.screenPx,
  },
  confirmModal: {
    width: '100%',
    maxWidth: 360,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: SPACING.lg,
    shadowColor: theme.colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  confirmCancel: {
    height: 40,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDelete: {
    height: 40,
    minWidth: 72,
    paddingHorizontal: SPACING.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.error,
  },
});
