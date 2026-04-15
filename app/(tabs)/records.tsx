import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Box, Icon, Row, Text } from '@/components/base';
import { useToast } from '@/components/composite/toast/ToastProvider';
import { NoCoupleCard } from '@/components/feature/couple';
import {
  CalendarGrid,
  CalendarMonthNav,
  MonthYearPicker,
} from '@/components/feature/calendar';
import type { ScheduleIndicator } from '@/components/feature/calendar/CalendarDayCell';
import { FootprintTimeline } from '@/components/feature/diary';
import { MonthStrip, RecentWalksWidget } from '@/components/feature/records';
import {
  DaySheet,
  ScheduleForm,
  type ScheduleFormResult,
} from '@/components/feature/schedule';
import { useCalendarMonthQuery } from '@/hooks/services/calendar/query';
import { useReflectionProgressQuery } from '@/hooks/services/reflections/query';
import {
  useCreateScheduleMutation,
  useDeleteScheduleMutation,
  useUpdateScheduleMutation,
} from '@/hooks/services/schedules/mutation';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import { theme } from '@/styles/theme';
import { LAYOUT, SPACING } from '@/styles/type';
import type { WalkDiary } from '@/types/diary';
import type { CoupleSchedule } from '@/types/schedule';
import {
  addMonths,
  getCurrentYearMonth,
  getLocalToday,
  getMonthKey,
} from '@/utils/date';

type ViewMode = 'calendar' | 'list';

// ─── Sheet state (reducer-ish) ──────────────────────────
//
// Bottom sheet + form modal state is kept in a single discriminated union
// to avoid "two half-open modals at once" bugs.

type SheetState =
  | { kind: 'none' }
  | { kind: 'day'; date: string }
  | { kind: 'create'; date: string }
  | { kind: 'edit'; schedule: CoupleSchedule };

// ─── Screen ─────────────────────────────────────────────

export default function RecordsScreen() {
  const insets = useSafeAreaInsets();
  const { couple, isCoupleConnected } = usePartnerDerivation();
  const [{ year, month }, setYearMonth] = useState(getCurrentYearMonth);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');

  if (!isCoupleConnected) {
    return <RecordsNoCoupleFallback insets={insets} />;
  }

  return (
    <RecordsContent
      year={year}
      month={month}
      onChangeYearMonth={setYearMonth}
      coupleStartDate={couple?.startDate}
      insets={insets}
      viewMode={viewMode}
      onChangeViewMode={setViewMode}
    />
  );
}

// ─── Content ────────────────────────────────────────────

function RecordsContent({
  year,
  month,
  onChangeYearMonth,
  coupleStartDate,
  insets,
  viewMode,
  onChangeViewMode,
}: {
  year: number;
  month: number;
  onChangeYearMonth: (next: { year: number; month: number }) => void;
  coupleStartDate?: string;
  insets: { top: number; bottom: number; left: number; right: number };
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
}) {
  const { t } = useTranslation(['home', 'calendar', 'schedule']);
  const router = useRouter();
  const toast = useToast();
  const { me, myName, partnerName } = usePartnerDerivation();
  const [showPicker, setShowPicker] = useState(false);
  const [sheet, setSheet] = useState<SheetState>({ kind: 'none' });

  const { walks, stamps, schedules, reflection, isLoading } =
    useCalendarMonthQuery(year, month);

  // 산책 날짜 맵
  const walksByDate = useMemo(() => {
    const map = new Map<string, WalkDiary>();
    for (const w of walks) map.set(w.date, w);
    return map;
  }, [walks]);

  // 일정 날짜 맵 (DaySheet 조회 + 셀 인디케이터용)
  const schedulesByDate = useMemo(() => {
    const map = new Map<string, CoupleSchedule[]>();
    for (const s of schedules) {
      const arr = map.get(s.date) ?? [];
      arr.push(s);
      map.set(s.date, arr);
    }
    return map;
  }, [schedules]);

  // 셀 인디케이터 맵 (owner 정보만)
  const scheduleIndicatorMap = useMemo(() => {
    const map = new Map<string, ScheduleIndicator[]>();
    for (const s of schedules) {
      const arr = map.get(s.date) ?? [];
      arr.push({ owner: s.ownerId === me?.id ? 'mine' : 'partner' });
      map.set(s.date, arr);
    }
    return map;
  }, [schedules, me?.id]);

  const walkDateSet = useMemo(() => new Set(walksByDate.keys()), [walksByDate]);
  const stampDateSet = useMemo(() => new Set(stamps), [stamps]);

  const todayMonthKey = getLocalToday().slice(0, 7);
  const currentMonthKey = getMonthKey(year, month);
  const isCurrentMonth = todayMonthKey === currentMonthKey;
  const today = getLocalToday();

  // 현재 월 회고 진행 상태 (워딩 분기용)
  const { data: reflectionProgress } = useReflectionProgressQuery(
    isCurrentMonth ? reflection?.id : undefined,
  );

  // ─── Mutations ────────────────────────────────────────

  const createMut = useCreateScheduleMutation();
  const updateMut = useUpdateScheduleMutation();
  const deleteMut = useDeleteScheduleMutation();

  const handleCreateSubmit = (result: ScheduleFormResult) => {
    createMut.mutate(
      {
        title: result.title,
        date: result.date,
        category: result.category,
        note: result.note,
      },
      {
        onSuccess: () => {
          toast.success(t('schedule:toast.create-success'));
          setSheet({ kind: 'day', date: result.date });
        },
        onError: () => toast.error(t('schedule:toast.create-failed')),
      },
    );
  };

  const handleUpdateSubmit = (
    schedule: CoupleSchedule,
    result: ScheduleFormResult,
  ) => {
    updateMut.mutate(
      {
        id: schedule.id,
        title: result.title,
        date: result.date,
        category: result.category,
        note: result.note,
      },
      {
        onSuccess: () => {
          toast.success(t('schedule:toast.update-success'));
          setSheet({ kind: 'day', date: result.date });
        },
        onError: () => toast.error(t('schedule:toast.update-failed')),
      },
    );
  };

  const handleDelete = (schedule: CoupleSchedule) => {
    deleteMut.mutate(schedule.id, {
      onSuccess: () => {
        toast.success(t('schedule:toast.delete-success'));
        setSheet({ kind: 'day', date: schedule.date });
      },
      onError: () => toast.error(t('schedule:toast.delete-failed')),
    });
  };

  // ─── Handlers ─────────────────────────────────────────

  const handlePrev = () => onChangeYearMonth(addMonths(year, month, -1));
  const handleNext = () => onChangeYearMonth(addMonths(year, month, +1));

  const handleSelectDay = (yyyyMmDd: string) => {
    setSheet({ kind: 'day', date: yyyyMmDd });
  };

  const handleReflectionCta = () => {
    if (isCurrentMonth) {
      router.push('/reflection');
    } else if (reflection?.isRevealed) {
      router.push({ pathname: '/reflection', params: { id: reflection.id } });
    }
  };

  const handleItemPress = (walk: WalkDiary) => {
    navigateToWalk(walk);
  };

  const navigateToWalk = (walk: WalkDiary) => {
    router.push({
      pathname: '/diary-detail',
      params: {
        id: walk.id,
        date: walk.date,
        locationName: walk.locationName,
        isRevealed: String(walk.isRevealed),
        myEntry: walk.myEntry ? JSON.stringify(walk.myEntry) : '',
        partnerEntry: walk.partnerEntry
          ? JSON.stringify(walk.partnerEntry)
          : '',
      },
    });
  };

  // 현재 시트에 해당하는 날짜 (헤더 + 이 날 추가 CTA 의 기본값)
  const sheetDate = (() => {
    if (sheet.kind === 'day') return sheet.date;
    if (sheet.kind === 'create') return sheet.date;
    if (sheet.kind === 'edit') return sheet.schedule.date;
    return null;
  })();

  const daySheetContext = (() => {
    if (sheet.kind !== 'day') return null;
    const d = sheet.date;
    const walk = walksByDate.get(d) ?? null;
    const daySchedules = schedulesByDate.get(d) ?? [];
    const hasStamp = stampDateSet.has(d);
    const isToday = d === today;
    const isPast = d < today;
    const isBeforeCouple =
      !!coupleStartDate && d < coupleStartDate.slice(0, 10);
    return { walk, daySchedules, hasStamp, isToday, isPast, isBeforeCouple };
  })();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 탭 헤더 + 뷰 토글 + 일정 추가 */}
      <Row px="xxl" style={styles.header}>
        <Text variant="headingLarge" color="primary">
          {t('home:records-tab.title')}
        </Text>
        <Row style={{ gap: SPACING.sm, alignItems: 'center' }}>
          <Pressable
            onPress={() => setSheet({ kind: 'create', date: today })}
            hitSlop={6}
            style={styles.headerAddBtn}
          >
            <Icon name="plus" size={14} color={theme.colors.primary} />
            <Text
              variant="caption"
              ml="xxs"
              style={{ color: theme.colors.primary, fontWeight: '600' }}
            >
              {t('schedule:header.add')}
            </Text>
          </Pressable>
          <ViewToggle viewMode={viewMode} onChange={onChangeViewMode} />
        </Row>
      </Row>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + LAYOUT.sectionGap },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 월 네비게이션 */}
        <CalendarMonthNav
          year={year}
          month={month}
          onPrev={handlePrev}
          onNext={handleNext}
          onTapMonth={() => setShowPicker(true)}
        />

        {/* 한 줄 요약 strip */}
        <MonthStrip
          walksCount={walks.length}
          stampsCount={stamps.length}
          schedulesCount={schedules.length}
          reflection={reflection}
          isCurrentMonth={isCurrentMonth}
          myAnsweredCount={reflectionProgress?.myAnswered}
          onPressReflection={handleReflectionCta}
          onPressReflectionTimeline={() => router.push('/reflection-timeline')}
        />

        {viewMode === 'calendar' ? (
          <>
            <View style={[isLoading && styles.dimmed]}>
              <CalendarGrid
                year={year}
                month={month}
                walkDates={walkDateSet}
                stampDates={stampDateSet}
                schedulesByDate={scheduleIndicatorMap}
                coupleStartDate={coupleStartDate}
                onSelectDay={handleSelectDay}
              />
            </View>

            {/* 최근 산책 3개 horizontal */}
            <RecentWalksWidget limit={3} />
          </>
        ) : (
          <View style={styles.listMode}>
            {walks.length === 0 ? (
              <Box px="xxl">
                <Text variant="bodySmall" color="textMuted" align="center">
                  {t('home:records-tab.walks-empty')}
                </Text>
              </Box>
            ) : (
              <FootprintTimeline
                diaries={walks}
                myName={myName}
                partnerName={partnerName}
                onItemPress={handleItemPress}
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* Month/Year Picker */}
      {showPicker && (
        <MonthYearPicker
          year={year}
          month={month}
          coupleStartDate={coupleStartDate}
          onSelect={onChangeYearMonth}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Day Bottom Sheet */}
      {sheet.kind === 'day' && daySheetContext && (
        <DaySheet
          date={sheet.date}
          isToday={daySheetContext.isToday}
          walk={daySheetContext.walk}
          hasStamp={daySheetContext.hasStamp}
          schedules={daySheetContext.daySchedules}
          myId={me?.id}
          myName={myName}
          partnerName={partnerName}
          isPast={daySheetContext.isPast}
          isBeforeCouple={daySheetContext.isBeforeCouple}
          onClose={() => setSheet({ kind: 'none' })}
          onOpenWalk={(w) => {
            setSheet({ kind: 'none' });
            navigateToWalk(w);
          }}
          onCreateWalk={() => {
            setSheet({ kind: 'none' });
            router.push('/footprint-create');
          }}
          onAddSchedule={() =>
            setSheet({ kind: 'create', date: sheet.date })
          }
          onEditSchedule={(schedule) => {
            if (schedule.ownerId === me?.id) {
              setSheet({ kind: 'edit', schedule });
            } else {
              // 상대 일정은 read-only form 으로 열되, 저장 비활성화
              setSheet({ kind: 'edit', schedule });
            }
          }}
        />
      )}

      {/* Create Schedule Form */}
      {sheet.kind === 'create' && (
        <ScheduleForm
          defaultDate={sheet.date}
          onClose={() => {
            // 이전에 day 시트가 열려있었으면 복귀, 아니면 닫기
            if (sheetDate) {
              setSheet({ kind: 'day', date: sheetDate });
            } else {
              setSheet({ kind: 'none' });
            }
          }}
          onSubmit={handleCreateSubmit}
          submitting={createMut.isPending}
          canEdit
        />
      )}

      {/* Edit Schedule Form */}
      {sheet.kind === 'edit' && (
        <ScheduleForm
          initial={sheet.schedule}
          onClose={() =>
            setSheet({ kind: 'day', date: sheet.schedule.date })
          }
          onSubmit={(result) => handleUpdateSubmit(sheet.schedule, result)}
          onDelete={() => handleDelete(sheet.schedule)}
          submitting={updateMut.isPending || deleteMut.isPending}
          canEdit={sheet.schedule.ownerId === me?.id}
        />
      )}
    </View>
  );
}

// ─── ViewToggle (segmented control) ─────────────────────

function ViewToggle({
  viewMode,
  onChange,
}: {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <Row style={toggleStyles.container}>
      <Pressable
        style={[
          toggleStyles.button,
          viewMode === 'calendar' && toggleStyles.buttonActive,
        ]}
        onPress={() => onChange('calendar')}
        hitSlop={4}
      >
        <Icon
          name="calendar"
          size={14}
          color={
            viewMode === 'calendar' ? theme.colors.white : theme.colors.gray500
          }
        />
      </Pressable>
      <Pressable
        style={[
          toggleStyles.button,
          viewMode === 'list' && toggleStyles.buttonActive,
        ]}
        onPress={() => onChange('list')}
        hitSlop={4}
      >
        <Icon
          name="list"
          size={14}
          color={
            viewMode === 'list' ? theme.colors.white : theme.colors.gray500
          }
        />
      </Pressable>
    </Row>
  );
}

const toggleStyles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.gray100,
    borderRadius: theme.radius.sm,
    padding: 2,
    gap: 2,
  },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: {
    backgroundColor: theme.colors.primary,
  },
});

// ─── No Couple Fallback ─────────────────────────────────

function RecordsNoCoupleFallback({
  insets,
}: {
  insets: { top: number; bottom: number; left: number; right: number };
}) {
  const { t } = useTranslation(['home', 'calendar']);
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Row px="xxl" style={styles.header}>
        <Text variant="headingLarge" color="primary">
          {t('home:records-tab.title')}
        </Text>
      </Row>
      <View style={styles.fallbackBody}>
        <Box px="xxl" style={{ alignItems: 'center' }}>
          <Icon name="calendar" size={48} color={theme.colors.gray300} />
          <Text variant="headingSmall" mt="lg" align="center">
            {t('calendar:no-couple-title')}
          </Text>
          <Text variant="bodySmall" color="textMuted" mt="sm" align="center">
            {t('calendar:no-couple-description')}
          </Text>
        </Box>
      </View>
      <View style={{ paddingBottom: insets.bottom }}>
        <NoCoupleCard />
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: LAYOUT.headerPy,
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  scroll: {
    flexGrow: 1,
  },
  dimmed: {
    opacity: 0.5,
  },
  listMode: {
    marginTop: SPACING.md,
  },
  fallbackBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
