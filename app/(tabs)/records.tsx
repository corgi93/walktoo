import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Box, Icon, Row, Text } from '@/components/base';
import { NoCoupleCard } from '@/components/feature/couple';
import {
  CalendarMonthNav,
  MonthYearPicker,
} from '@/components/feature/calendar';
import { FootprintTimeline } from '@/components/feature/diary';
import { useCalendarMonthQuery } from '@/hooks/services/calendar/query';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import { theme } from '@/styles/theme';
import { LAYOUT, SPACING } from '@/styles/type';
import type { WalkDiary } from '@/types/diary';
import { addMonths, getCurrentYearMonth } from '@/utils/date';

type KindFilter = 'all' | 'together' | 'each';

// ─── Screen ─────────────────────────────────────────────

export default function RecordsScreen() {
  const insets = useSafeAreaInsets();
  const { isCoupleConnected } = usePartnerDerivation();
  const [{ year, month }, setYearMonth] = useState(getCurrentYearMonth);
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');

  if (!isCoupleConnected) {
    return <RecordsNoCoupleFallback insets={insets} />;
  }

  return (
    <RecordsContent
      year={year}
      month={month}
      onChangeYearMonth={setYearMonth}
      insets={insets}
      kindFilter={kindFilter}
      onChangeKindFilter={setKindFilter}
    />
  );
}

// ─── Content ────────────────────────────────────────────

function RecordsContent({
  year,
  month,
  onChangeYearMonth,
  insets,
  kindFilter,
  onChangeKindFilter,
}: {
  year: number;
  month: number;
  onChangeYearMonth: (next: { year: number; month: number }) => void;
  insets: { top: number; bottom: number; left: number; right: number };
  kindFilter: KindFilter;
  onChangeKindFilter: (f: KindFilter) => void;
}) {
  const { t } = useTranslation(['home', 'calendar']);
  const router = useRouter();
  const { couple, myName, partnerName } = usePartnerDerivation();
  const [showPicker, setShowPicker] = useState(false);
  const coupleStartDate = couple?.startDate;

  const { walks, stamps } = useCalendarMonthQuery(year, month);

  // kind 필터 적용
  const filteredWalks = useMemo(() => {
    if (kindFilter === 'all') return walks;
    return walks.filter((w) => w.kind === kindFilter);
  }, [walks, kindFilter]);

  const handlePrev = () => onChangeYearMonth(addMonths(year, month, -1));
  const handleNext = () => onChangeYearMonth(addMonths(year, month, +1));

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
      {/* 탭 헤더 */}
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
        {/* 월 네비게이션 (두 모드 공통) */}
        <CalendarMonthNav
          year={year}
          month={month}
          onPrev={handlePrev}
          onNext={handleNext}
          onTapMonth={() => setShowPicker(true)}
        />

        {/* 우리/각자 필터 */}
        <KindFilterBar value={kindFilter} onChange={onChangeKindFilter} />

        {/* 산책·발자국 카운트 (회고 관련 제거됨 — 기록에 집중) */}
        <Row px="xxl" style={styles.statRow}>
          <View style={styles.stat}>
            <Icon name="footprint" size={14} color={theme.colors.primary} />
            <Text variant="caption" color="textSecondary" ml="xxs">
              산책 {filteredWalks.length}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Icon name="star" size={14} color={theme.colors.accent} />
            <Text variant="caption" color="textSecondary" ml="xxs">
              발자국 {stamps.length}
            </Text>
          </View>
        </Row>

        {/* 리스트 전용 — 달력 토글 제거 */}
        <View style={styles.listMode}>
          {filteredWalks.length === 0 ? (
            <Box px="xxl">
              <Text variant="bodySmall" color="textMuted" align="center">
                {t('home:records-tab.walks-empty')}
              </Text>
            </Box>
          ) : (
            <FootprintTimeline
              diaries={filteredWalks}
              myName={myName}
              partnerName={partnerName}
              onItemPress={handleItemPress}
            />
          )}
        </View>
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

// ─── KindFilterBar (같이/각자 필터) ─────────────────────

function KindFilterBar({
  value,
  onChange,
}: {
  value: KindFilter;
  onChange: (v: KindFilter) => void;
}) {
  const { t } = useTranslation('home');
  const items: { key: KindFilter; label: string; icon?: 'heart' | 'sun' }[] = [
    { key: 'all', label: t('records-tab.filter-all') },
    { key: 'together', label: t('records-tab.filter-together'), icon: 'heart' },
    { key: 'each', label: t('records-tab.filter-each'), icon: 'sun' },
  ];

  return (
    <Row px="xxl" style={filterStyles.container}>
      {items.map((item) => {
        const active = value === item.key;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            style={[filterStyles.chip, active && filterStyles.chipActive]}
            hitSlop={4}
          >
            {item.icon && (
              <Icon
                name={item.icon}
                size={12}
                color={active ? theme.colors.white : theme.colors.primary}
              />
            )}
            <Text
              variant="caption"
              color={active ? 'white' : 'text'}
              style={{ fontWeight: '600', marginLeft: item.icon ? 4 : 0 }}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </Row>
  );
}

const filterStyles = StyleSheet.create({
  container: {
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
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
  listMode: {
    marginTop: SPACING.md,
  },
  statRow: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    gap: SPACING.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: theme.colors.gray300,
  },
  fallbackBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
