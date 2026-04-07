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
  CalendarMonthSummary,
} from '@/components/feature/calendar';
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

// ─── Component ──────────────────────────────────────────

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation('calendar');
  const { couple, isCoupleConnected } = usePartnerDerivation();

  // 보고 있는 달
  const [{ year, month }, setYearMonth] = useState(getCurrentYearMonth);

  const isCoupleConnectedSafe = isCoupleConnected;

  // ─── 미연결 가드 ──
  if (!isCoupleConnectedSafe) {
    return <NoCoupleFallback insets={insets} onBack={() => router.back()} />;
  }

  return (
    <ConnectedCalendar
      year={year}
      month={month}
      onChangeYearMonth={setYearMonth}
      coupleStartDate={couple?.startDate}
      insets={insets}
      onBack={() => router.back()}
    />
  );
}

// ─── Connected Calendar ─────────────────────────────────

function ConnectedCalendar({
  year,
  month,
  onChangeYearMonth,
  coupleStartDate,
  insets,
  onBack,
}: {
  year: number;
  month: number;
  onChangeYearMonth: (next: { year: number; month: number }) => void;
  coupleStartDate?: string;
  insets: { top: number; bottom: number; left: number; right: number };
  onBack: () => void;
}) {
  const { t } = useTranslation('calendar');
  const router = useRouter();

  const { walks, stamps, reflection, isLoading } = useCalendarMonthQuery(
    year,
    month,
  );

  // 산책 날짜 셋 (셀 인디케이터용) + 날짜 → walk lookup
  const walksByDate = useMemo(() => {
    const map = new Map<string, WalkDiary>();
    for (const w of walks) {
      map.set(w.date, w);
    }
    return map;
  }, [walks]);

  const walkDateSet = useMemo(() => new Set(walksByDate.keys()), [walksByDate]);
  const stampDateSet = useMemo(() => new Set(stamps), [stamps]);

  // 이번 달인지
  const todayMonthKey = getLocalToday().slice(0, 7);
  const currentMonthKey = getMonthKey(year, month);
  const isCurrentMonth = todayMonthKey === currentMonthKey;
  const today = getLocalToday();

  // 월 이동
  const handlePrev = () => onChangeYearMonth(addMonths(year, month, -1));
  const handleNext = () => onChangeYearMonth(addMonths(year, month, +1));
  const handleResetToCurrent = () => onChangeYearMonth(getCurrentYearMonth());

  // 셀 탭 핸들러
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

  // 회고 CTA
  const handleReflectionCta = () => {
    if (isCurrentMonth) {
      router.push('/reflection');
    } else if (reflection?.isRevealed) {
      router.push({ pathname: '/reflection', params: { id: reflection.id } });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── 헤더 ── */}
      <Row px="xxl" style={styles.header}>
        <Pressable onPress={onBack} hitSlop={8}>
          <Icon name="arrow-left" size={22} color={theme.colors.text} />
        </Pressable>
        <Text variant="headingMedium">{t('title')}</Text>
        <View style={{ width: 22 }} />
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
          onTapMonth={isCurrentMonth ? undefined : handleResetToCurrent}
        />

        {/* 그리드 */}
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

        {/* 월 요약 */}
        <CalendarMonthSummary
          walksCount={walks.length}
          stampsCount={stamps.length}
          reflection={reflection}
          isCurrentMonth={isCurrentMonth}
          onPressReflection={handleReflectionCta}
        />

        {/* 빈 달 안내 */}
        {!isLoading && walks.length === 0 && stamps.length === 0 && (
          <Box px="xxl" style={styles.emptyHint}>
            <Text variant="caption" color="textMuted" align="center">
              {t('empty-month')}
            </Text>
          </Box>
        )}
      </ScrollView>
    </View>
  );
}

// ─── No Couple Fallback ─────────────────────────────────

function NoCoupleFallback({
  insets,
  onBack,
}: {
  insets: { top: number; bottom: number; left: number; right: number };
  onBack: () => void;
}) {
  const { t } = useTranslation('calendar');
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Row px="xxl" style={styles.header}>
        <Pressable onPress={onBack} hitSlop={8}>
          <Icon name="arrow-left" size={22} color={theme.colors.text} />
        </Pressable>
        <Text variant="headingMedium">{t('title')}</Text>
        <View style={{ width: 22 }} />
      </Row>
      <View style={styles.fallbackBody}>
        <Box px="xxl" style={{ alignItems: 'center' }}>
          <Icon name="calendar" size={48} color={theme.colors.gray300} />
          <Text variant="headingSmall" mt="lg" align="center">
            {t('no-couple-title')}
          </Text>
          <Text variant="bodySmall" color="textMuted" mt="sm" align="center">
            {t('no-couple-description')}
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
  emptyHint: {
    marginTop: LAYOUT.sectionGap,
  },
  fallbackBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
