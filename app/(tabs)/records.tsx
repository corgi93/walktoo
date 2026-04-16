import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Box, Icon, Row, Text } from '@/components/base';
import { NoCoupleCard } from '@/components/feature/couple';
import {
  CalendarGrid,
  CalendarMonthNav,
  MonthYearPicker,
} from '@/components/feature/calendar';
import { FootprintTimeline } from '@/components/feature/diary';
import { MonthStrip, RecentWalksWidget } from '@/components/feature/records';
import { useCalendarMonthQuery } from '@/hooks/services/calendar/query';
import { useReflectionProgressQuery } from '@/hooks/services/reflections/query';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import { theme } from '@/styles/theme';
import { LAYOUT, SPACING } from '@/styles/type';
import type { WalkDiary } from '@/types/diary';
import { addMonths, getCurrentYearMonth, getLocalToday, getMonthKey } from '@/utils/date';

type ViewMode = 'calendar' | 'list';

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
  const { t } = useTranslation(['home', 'calendar']);
  const router = useRouter();
  const { myName, partnerName } = usePartnerDerivation();
  const [showPicker, setShowPicker] = useState(false);

  const { walks, stamps, reflection, isLoading } = useCalendarMonthQuery(
    year,
    month,
  );

  // 산책 날짜 맵 (셀 인디케이터 + tap lookup)
  const walksByDate = useMemo(() => {
    const map = new Map<string, WalkDiary>();
    for (const w of walks) {
      map.set(w.date, w);
    }
    return map;
  }, [walks]);

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

  const handlePrev = () => onChangeYearMonth(addMonths(year, month, -1));
  const handleNext = () => onChangeYearMonth(addMonths(year, month, +1));

  const handleSelectDay = (yyyyMmDd: string) => {
    const walk = walksByDate.get(yyyyMmDd);
    if (walk) {
      router.push({
        pathname: '/diary-detail',
        params: {
          id: walk.id,
          date: walk.date,
          locationName: walk.locationName,
          isRevealed: String(walk.isRevealed),
          myEntry: walk.myEntry ? JSON.stringify(walk.myEntry) : '',
          partnerEntry: walk.partnerEntry ? JSON.stringify(walk.partnerEntry) : '',
        },
      });
      return;
    }
    if (yyyyMmDd === today) {
      router.push('/footprint-create');
    }
  };

  const handleReflectionCta = () => {
    if (isCurrentMonth) {
      router.push('/reflection');
    } else if (reflection?.isRevealed) {
      router.push({ pathname: '/reflection', params: { id: reflection.id } });
    }
  };

  const handleItemPress = (walk: WalkDiary) => {
    router.push({
      pathname: '/diary-detail',
      params: {
        id: walk.id,
        date: walk.date,
        locationName: walk.locationName,
        isRevealed: String(walk.isRevealed),
        myEntry: walk.myEntry ? JSON.stringify(walk.myEntry) : '',
        partnerEntry: walk.partnerEntry ? JSON.stringify(walk.partnerEntry) : '',
      },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 탭 헤더 + 뷰 토글 */}
      <Row px="xxl" style={styles.header}>
        <Text variant="headingLarge" color="primary">
          {t('home:records-tab.title')}
        </Text>
        <ViewToggle viewMode={viewMode} onChange={onChangeViewMode} />
      </Row>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + LAYOUT.sectionGap },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 월 네비게이션 (두 모드 공통) */}
        <CalendarMonthNav
          year={year}
          month={month}
          onPrev={handlePrev}
          onNext={handleNext}
          onTapMonth={() => setShowPicker(true)}
        />

        {/* 한 줄 요약 strip — 산책·발자국·회고 inline */}
        <MonthStrip
          walksCount={walks.length}
          stampsCount={stamps.length}
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
                coupleStartDate={coupleStartDate}
                onSelectDay={handleSelectDay}
              />
            </View>

            {/* 최근 산책 3개 horizontal — 월이 아니라 전체 최신 3개 */}
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

      {showPicker && (
        <MonthYearPicker
          year={year}
          month={month}
          coupleStartDate={coupleStartDate}
          onSelect={onChangeYearMonth}
          onClose={() => setShowPicker(false)}
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
