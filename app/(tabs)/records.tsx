import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Box, Icon, Row, Text } from '@/components/base';
import { NoCoupleCard } from '@/components/feature/couple';
import {
  CalendarGrid,
  CalendarMonthNav,
  CalendarMonthSummary,
} from '@/components/feature/calendar';
import { MonthlyWalksList } from '@/components/feature/records';
import { useCalendarMonthQuery } from '@/hooks/services/calendar/query';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import { theme } from '@/styles/theme';
import { LAYOUT } from '@/styles/type';
import type { WalkDiary } from '@/types/diary';
import {
  addMonths,
  getCurrentYearMonth,
  getLocalToday,
  getMonthKey,
} from '@/utils/date';

// ─── Screen ─────────────────────────────────────────────

export default function RecordsScreen() {
  const insets = useSafeAreaInsets();
  const { couple, isCoupleConnected } = usePartnerDerivation();
  const [{ year, month }, setYearMonth] = useState(getCurrentYearMonth);

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
}: {
  year: number;
  month: number;
  onChangeYearMonth: (next: { year: number; month: number }) => void;
  coupleStartDate?: string;
  insets: { top: number; bottom: number; left: number; right: number };
}) {
  const { t } = useTranslation(['home', 'calendar']);
  const router = useRouter();

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

  const handlePrev = () => onChangeYearMonth(addMonths(year, month, -1));
  const handleNext = () => onChangeYearMonth(addMonths(year, month, +1));
  const handleResetToCurrent = () => onChangeYearMonth(getCurrentYearMonth());

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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 탭 헤더 (뒤로가기 없음) */}
      <Row px="xxl" style={styles.header}>
        <Text variant="headingLarge" color="primary">
          {t('home:records-tab.title')}
        </Text>
      </Row>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + LAYOUT.sectionGap },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <CalendarMonthNav
          year={year}
          month={month}
          onPrev={handlePrev}
          onNext={handleNext}
          onTapMonth={isCurrentMonth ? undefined : handleResetToCurrent}
        />

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

        <CalendarMonthSummary
          walksCount={walks.length}
          stampsCount={stamps.length}
          reflection={reflection}
          isCurrentMonth={isCurrentMonth}
          onPressReflection={handleReflectionCta}
        />

        <MonthlyWalksList walks={walks} />
      </ScrollView>
    </View>
  );
}

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
  fallbackBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
