import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Text } from '@/components/base';
import { NoCoupleCard } from '@/components/feature/couple';
import { ScheduleForm, type ScheduleFormResult } from '@/components/feature/schedule';
import { useToast } from '@/components/composite/toast/ToastProvider';
import { useCoupleMemoQuery } from '@/hooks/services/couple-memos/query';
import { useUpdateCoupleMemoMutation } from '@/hooks/services/couple-memos/mutation';
import {
  useCreateScheduleMutation,
  useDeleteScheduleMutation,
  useUpdateScheduleMutation,
} from '@/hooks/services/schedules/mutation';
import { useSchedulesByMonthQuery } from '@/hooks/services/schedules/query';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import { theme } from '@/styles/theme';
import { FONT_FAMILY, LAYOUT, SPACING } from '@/styles/type';
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

type PlannerMode = 'schedule' | 'memo';

interface MemoItem {
  id: string;
  text: string;
  done: boolean;
}

const MEMO_STORAGE_PREFIX = 'pairwalk-checklist-v1:';
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const createMemoItem = (text = ''): MemoItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  text,
  done: false,
});

const parseMemoItems = (content: string | undefined): MemoItem[] => {
  if (!content?.trim()) return [];
  if (!content.startsWith(MEMO_STORAGE_PREFIX)) {
    return [createMemoItem(content)];
  }

  try {
    const parsed = JSON.parse(content.slice(MEMO_STORAGE_PREFIX.length)) as
      | MemoItem[]
      | unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is MemoItem =>
          typeof item === 'object' &&
          item !== null &&
          'id' in item &&
          'text' in item &&
          'done' in item,
      )
      .map((item) => ({
        id: String(item.id),
        text: String(item.text),
        done: Boolean(item.done),
      }));
  } catch {
    return [];
  }
};

const serializeMemoItems = (items: readonly MemoItem[]) =>
  `${MEMO_STORAGE_PREFIX}${JSON.stringify(
    items
      .map((item) => ({ ...item, text: item.text.trim() }))
      .filter((item) => item.text.length > 0),
  )}`;

export default function PlannerScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { me, isCoupleConnected, myName, partnerName } = usePartnerDerivation();
  const [mode, setMode] = useState<PlannerMode>('schedule');
  const [visibleMonth, setVisibleMonth] = useState(getCurrentYearMonth);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<CoupleSchedule | null>(
    null,
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getLocalToday);

  const { data: schedules = [] } = useSchedulesByMonthQuery(
    visibleMonth.year,
    visibleMonth.month,
  );
  const createSchedule = useCreateScheduleMutation();
  const updateSchedule = useUpdateScheduleMutation();
  const deleteSchedule = useDeleteScheduleMutation();

  const { data: memo } = useCoupleMemoQuery();
  const updateMemo = useUpdateCoupleMemoMutation();
  const [memoItems, setMemoItems] = useState<MemoItem[]>([]);

  useEffect(() => {
    setMemoItems(parseMemoItems(memo?.content));
  }, [memo?.content]);

  const schedulesByDate = useMemo(() => {
    const groups = new Map<string, CoupleSchedule[]>();
    schedules.forEach((schedule) => {
      const daySchedules = groups.get(schedule.date) ?? [];
      daySchedules.push(schedule);
      groups.set(schedule.date, daySchedules);
    });
    return groups;
  }, [schedules]);

  const selectedSchedules = schedulesByDate.get(selectedDate) ?? [];

  const moveMonth = (delta: number) => {
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

  const handleSaveMemo = () => {
    updateMemo.mutate(serializeMemoItems(memoItems), {
      onSuccess: () => toast.success('메모를 저장했어요'),
      onError: (error) =>
        toast.error(getErrorMessage(error, '메모를 저장하지 못했어요')),
    });
  };

  const updateMemoItem = (id: string, patch: Partial<MemoItem>) => {
    setMemoItems((items) =>
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const removeMemoItem = (id: string) => {
    setMemoItems((items) => items.filter((item) => item.id !== id));
  };

  const addMemoItem = () => {
    setMemoItems((items) => [...items, createMemoItem()]);
  };

  if (!isCoupleConnected) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text variant="displaySmall" color="primary">
            공유
          </Text>
        </View>
        <View style={styles.noCoupleWrap}>
          <NoCoupleCard />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <View>
          <Text variant="displaySmall" color="primary">
            공유
          </Text>
          <Text variant="bodySmall" color="textSecondary" mt="xs">
            일정과 메모를 둘이 같이 관리해요
          </Text>
        </View>
      </View>

      <View style={styles.segment}>
        <SegmentButton
          active={mode === 'schedule'}
          icon="calendar"
          label="일정"
          onPress={() => setMode('schedule')}
        />
        <SegmentButton
          active={mode === 'memo'}
          icon="file-text"
          label="메모"
          onPress={() => setMode('memo')}
        />
      </View>

      {mode === 'schedule' ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <ScheduleCalendar
            year={visibleMonth.year}
            month={visibleMonth.month}
            selectedDate={selectedDate}
            schedulesByDate={schedulesByDate}
            onPrev={() => moveMonth(-1)}
            onNext={() => moveMonth(1)}
            onSelectDate={setSelectedDate}
          />

          <View style={styles.selectedPanel}>
            <View style={styles.selectedHeader}>
              <View>
                <Text variant="headingSmall">
                  {formatDate(parseLocalDate(selectedDate), {
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short',
                  })}
                </Text>
                <Text variant="caption" color="textMuted" mt="xxs">
                  일정 {selectedSchedules.length}개
                </Text>
              </View>
              <Pressable
                onPress={() => setShowCreateForm(true)}
                style={styles.smallAddButton}
              >
                <Icon name="plus" size={15} color={theme.colors.white} />
                <Text variant="caption" color="white" ml="xxs" weight="700">
                  추가
                </Text>
              </Pressable>
            </View>

            {selectedSchedules.length === 0 ? (
              <View style={styles.scheduleEmpty}>
                <Text variant="bodySmall" color="textSecondary">
                  선택한 날짜에 일정이 없어요
                </Text>
              </View>
            ) : (
              <View style={styles.scheduleList}>
                {selectedSchedules.map((schedule) => {
                  const isMine = schedule.ownerId === me?.id;
                  const owner = isMine ? myName : partnerName;
                  return (
                    <Pressable
                      key={schedule.id}
                      onPress={() => setEditingSchedule(schedule)}
                      style={styles.scheduleCard}
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
                            color={isMine ? 'primary' : 'textSecondary'}
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
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.memoCard}>
            <View style={styles.memoHeader}>
              <View>
                <Text variant="headingSmall">커플 메모장</Text>
                <Text variant="caption" color="textMuted" mt="xxs">
                  장보기, 데이트 아이디어, 서로 볼 내용을 남겨요
                </Text>
              </View>
              <View style={styles.memoBadge}>
                <Icon name="heart" size={14} color={theme.colors.primary} />
              </View>
            </View>

            <View style={styles.memoList}>
              {memoItems.map((item) => (
                <View key={item.id} style={styles.memoItem}>
                  <Pressable
                    onPress={() => updateMemoItem(item.id, { done: !item.done })}
                    style={[styles.checkBox, item.done && styles.checkBoxDone]}
                  >
                    {item.done && (
                      <Icon name="check" size={14} color={theme.colors.white} />
                    )}
                  </Pressable>
                  <TextInput
                    value={item.text}
                    onChangeText={(text) => updateMemoItem(item.id, { text })}
                    placeholder="메모를 입력하세요"
                    placeholderTextColor={theme.colors.gray400}
                    style={[
                      styles.memoItemInput,
                      item.done && styles.memoItemInputDone,
                    ]}
                  />
                  <Pressable
                    onPress={() => removeMemoItem(item.id)}
                    hitSlop={8}
                    style={styles.memoRemoveButton}
                  >
                    <Icon name="x" size={16} color={theme.colors.gray400} />
                  </Pressable>
                </View>
              ))}

              {memoItems.length === 0 && (
                <View style={styles.memoEmpty}>
                  <Text variant="bodySmall" color="textSecondary">
                    아직 메모가 없어요
                  </Text>
                </View>
              )}
            </View>

            <Pressable onPress={addMemoItem} style={styles.addMemoButton}>
              <Icon name="plus" size={15} color={theme.colors.primary} />
              <Text variant="bodySmall" color="primary" ml="xs" weight="700">
                메모 추가
              </Text>
            </Pressable>

            <View style={styles.memoFooter}>
              <Text variant="caption" color="textMuted">
                {memo?.updatedAt
                  ? `${formatDate(new Date(memo.updatedAt), {
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })} 저장`
                  : '아직 저장된 메모가 없어요'}
              </Text>
              <Pressable
                onPress={handleSaveMemo}
                disabled={updateMemo.isPending}
                style={[
                  styles.saveMemoButton,
                  updateMemo.isPending && styles.disabledButton,
                ]}
              >
                <Icon name="check" size={15} color={theme.colors.white} />
                <Text variant="caption" color="white" ml="xxs" weight="700">
                  저장
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      )}

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

function ScheduleCalendar({
  year,
  month,
  selectedDate,
  schedulesByDate,
  onPrev,
  onNext,
  onSelectDate,
}: {
  year: number;
  month: number;
  selectedDate: string;
  schedulesByDate: Map<string, CoupleSchedule[]>;
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
            const isSelected = selectedDate === date;
            const isToday = today === date;

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
                  variant="bodySmall"
                  color={isSelected ? 'white' : isToday ? 'primary' : 'text'}
                  weight={isSelected || isToday ? '700' : undefined}
                >
                  {day}
                </Text>
                <View style={styles.scheduleDots}>
                  {schedules.slice(0, 3).map((schedule) => (
                    <View key={schedule.id} style={styles.scheduleDot} />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function SegmentButton({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: 'calendar' | 'file-text';
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.segmentButton, active && styles.segmentButtonActive]}
    >
      <Icon
        name={icon}
        size={16}
        color={active ? theme.colors.white : theme.colors.textSecondary}
      />
      <Text
        variant="bodySmall"
        color={active ? 'white' : 'textSecondary'}
        ml="xs"
        weight="700"
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: LAYOUT.screenPx,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  noCoupleWrap: {
    paddingHorizontal: LAYOUT.screenPx,
    paddingTop: SPACING.lg,
  },
  segment: {
    flexDirection: 'row',
    marginHorizontal: LAYOUT.screenPx,
    padding: 4,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.gray100,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    height: 40,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  scroll: {
    paddingHorizontal: LAYOUT.screenPx,
    paddingTop: SPACING.lg,
    paddingBottom: LAYOUT.bottomSafe,
    gap: SPACING.md,
  },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  calendarCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: SPACING.md,
    shadowColor: theme.colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
    borderBottomColor: theme.colors.gray100,
    marginBottom: SPACING.xs,
  },
  weekHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  calendarWeek: {
    flexDirection: 'row',
  },
  calendarCell: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarCellToday: {
    backgroundColor: theme.colors.primarySurface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  calendarCellSelected: {
    backgroundColor: theme.colors.primary,
    borderWidth: 0,
  },
  scheduleDots: {
    flexDirection: 'row',
    height: 5,
    gap: 2,
    marginTop: 2,
  },
  scheduleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.accent,
  },
  addScheduleButton: {
    height: 48,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    marginBottom: SPACING.sm,
  },
  emptyCard: {
    minHeight: 180,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  dayGroup: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  dayLabel: {
    width: 48,
    alignItems: 'center',
    paddingTop: SPACING.sm,
  },
  scheduleList: {
    flex: 1,
    gap: SPACING.sm,
  },
  selectedPanel: {
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.surface,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  smallAddButton: {
    height: 36,
    paddingHorizontal: SPACING.md,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
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
  memoCard: {
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
    gap: SPACING.md,
  },
  memoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  memoBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryLight,
  },
  memoInput: {
    minHeight: 280,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.surfaceWarm,
    padding: SPACING.md,
    color: theme.colors.text,
    fontFamily: FONT_FAMILY.pixel,
    fontSize: 14,
    lineHeight: 22,
    includeFontPadding: false,
  },
  memoList: {
    gap: SPACING.sm,
  },
  memoItem: {
    minHeight: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.surfaceWarm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: SPACING.md,
    paddingRight: SPACING.sm,
    gap: SPACING.sm,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  checkBoxDone: {
    backgroundColor: theme.colors.primary,
  },
  memoItemInput: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 8,
    color: theme.colors.text,
    fontFamily: FONT_FAMILY.pixel,
    fontSize: 14,
    lineHeight: 20,
    includeFontPadding: false,
  },
  memoItemInputDone: {
    color: theme.colors.textMuted,
    textDecorationLine: 'line-through',
  },
  memoRemoveButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoEmpty: {
    minHeight: 96,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceWarm,
  },
  addMemoButton: {
    height: 44,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySurface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  saveMemoButton: {
    minWidth: 74,
    height: 36,
    paddingHorizontal: SPACING.md,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
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
