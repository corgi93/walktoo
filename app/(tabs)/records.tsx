import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Box, Icon, Row, Text } from '@/components/base';
import { NoCoupleCard } from '@/components/feature/couple';
import {
  CalendarMonthNav,
  MonthYearPicker,
} from '@/components/feature/calendar';
import { FootprintTimeline } from '@/components/feature/diary';
import { RecordsMapView } from '@/components/feature/records/RecordsMapView';
import { useCalendarMonthQuery } from '@/hooks/services/calendar/query';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import { theme } from '@/styles/theme';
import { LAYOUT, SPACING } from '@/styles/type';
import type { WalkDiary } from '@/types/diary';
import { addMonths, getCurrentYearMonth } from '@/utils/date';

type KindFilter = 'all' | 'together' | 'each';
type PersonFilter = 'me' | 'partner';
type ViewMode = 'list' | 'map';

// ─── Screen ─────────────────────────────────────────────

export default function RecordsScreen() {
  const insets = useSafeAreaInsets();
  const { isCoupleConnected } = usePartnerDerivation();
  const [{ year, month }, setYearMonth] = useState(getCurrentYearMonth);
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [personFilter, setPersonFilter] = useState<PersonFilter>('me');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

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
      personFilter={personFilter}
      onChangePersonFilter={setPersonFilter}
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
  insets,
  kindFilter,
  onChangeKindFilter,
  personFilter,
  onChangePersonFilter,
  viewMode,
  onChangeViewMode,
}: {
  year: number;
  month: number;
  onChangeYearMonth: (next: { year: number; month: number }) => void;
  insets: { top: number; bottom: number; left: number; right: number };
  kindFilter: KindFilter;
  onChangeKindFilter: (f: KindFilter) => void;
  personFilter: PersonFilter;
  onChangePersonFilter: (p: PersonFilter) => void;
  viewMode: ViewMode;
  onChangeViewMode: (m: ViewMode) => void;
}) {
  const { t } = useTranslation(['home', 'calendar']);
  const router = useRouter();
  const { couple, myName, partnerName } = usePartnerDerivation();
  const [showPicker, setShowPicker] = useState(false);
  const [isMapInteracting, setIsMapInteracting] = useState(false);
  const mapInteractionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coupleStartDate = couple?.startDate;

  const { walks, stamps } = useCalendarMonthQuery(year, month);

  // kind 필터 + (각자일 때만) 사람 필터 적용
  // - 'each' 선택 시 personFilter('me'|'partner')에 따라 그 사람의 엔트리가
  //   있는 walk만 남김. 'together'/'all'에선 personFilter 무시.
  const filteredWalks = useMemo(() => {
    const byKind =
      kindFilter === 'all'
        ? walks
        : walks.filter((w) => w.kind === kindFilter);

    if (kindFilter !== 'each') return byKind;

    return byKind.filter((w) =>
      personFilter === 'me' ? !!w.myEntry : !!w.partnerEntry,
    );
  }, [walks, kindFilter, personFilter]);

  const handlePrev = () => onChangeYearMonth(addMonths(year, month, -1));
  const handleNext = () => onChangeYearMonth(addMonths(year, month, +1));

  const handleAddRecord = () => {
    router.push({ pathname: '/footprint-create', params: { kind: 'together' } });
  };

  const handleItemPress = (walk: WalkDiary) => {
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

  const lockMapScroll = useCallback(() => {
    if (mapInteractionTimer.current) {
      clearTimeout(mapInteractionTimer.current);
      mapInteractionTimer.current = null;
    }
    setIsMapInteracting(true);
  }, []);

  const unlockMapScroll = useCallback(() => {
    if (mapInteractionTimer.current) {
      clearTimeout(mapInteractionTimer.current);
    }
    mapInteractionTimer.current = setTimeout(() => {
      setIsMapInteracting(false);
      mapInteractionTimer.current = null;
    }, 300);
  }, []);

  useEffect(
    () => () => {
      if (mapInteractionTimer.current) {
        clearTimeout(mapInteractionTimer.current);
      }
    },
    [],
  );

  // 공통 헤더 (제목 + 토글 + 월 + 필터)
  const headerBlock = (
    <>
      <Row px="xxl" style={styles.header}>
        <Text variant="headingLarge" color="primary">
          {t('home:records-tab.title')}
        </Text>
        <ViewToggle mode={viewMode} onChange={onChangeViewMode} />
      </Row>

      <CalendarMonthNav
        year={year}
        month={month}
        onPrev={handlePrev}
        onNext={handleNext}
        onTapMonth={() => setShowPicker(true)}
      />

      <KindFilterBar
        value={kindFilter}
        onChange={onChangeKindFilter}
        onAdd={handleAddRecord}
      />

      {kindFilter === 'each' && (
        <PersonFilterBar
          value={personFilter}
          onChange={onChangePersonFilter}
          myName={myName}
          partnerName={partnerName}
        />
      )}
    </>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 지도 모드: 헤더 + 전체 영역 지도 (ScrollView 밖) */}
      {viewMode === 'map' ? (
        <>
          {headerBlock}
          <View style={styles.mapArea}>
            <RecordsMapView
              walks={filteredWalks}
              myName={myName}
              partnerName={partnerName}
              bottomInset={insets.bottom}
              onMapInteractionStart={lockMapScroll}
              onMapInteractionEnd={unlockMapScroll}
            />
          </View>
        </>
      ) : (
        // 리스트 모드: 기존 ScrollView
        <ScrollView
          scrollEnabled={!isMapInteracting}
          nestedScrollEnabled={false}
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + LAYOUT.sectionGap },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {headerBlock}

          {/* 산책·발자국 카운트 — 리스트 모드에서만 노출 */}
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
      )}

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

// ─── ViewToggle (리스트/지도) ────────────────────────────

function ViewToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
}) {
  return (
    <Row style={toggleStyles.container}>
      {(['list', 'map'] as const).map((m) => {
        const active = mode === m;
        return (
          <Pressable
            key={m}
            onPress={() => onChange(m)}
            style={[
              toggleStyles.button,
              active && toggleStyles.buttonActive,
            ]}
            hitSlop={4}
          >
            <Icon
              name={m === 'list' ? 'list' : 'map-pin'}
              size={13}
              color={active ? theme.colors.white : theme.colors.gray500}
            />
            <Text
              variant="caption"
              style={{
                color: active ? theme.colors.white : theme.colors.textSecondary,
                fontWeight: active ? '700' : '500',
                marginLeft: 4,
              }}
            >
              {m === 'list' ? '리스트' : '지도'}
            </Text>
          </Pressable>
        );
      })}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  buttonActive: {
    backgroundColor: theme.colors.primary,
  },
});


function KindFilterBar({
  value,
  onChange,
  onAdd,
}: {
  value: KindFilter;
  onChange: (v: KindFilter) => void;
  onAdd: () => void;
}) {
  const { t } = useTranslation('home');
  const items: { key: KindFilter; label: string; icon?: 'heart' | 'sun' }[] = [
    { key: 'all', label: t('records-tab.filter-all') },
    { key: 'together', label: t('records-tab.filter-together'), icon: 'heart' },
    { key: 'each', label: t('records-tab.filter-each'), icon: 'sun' },
  ];

  return (
    <Row px="xxl" style={filterStyles.container}>
      <View style={filterStyles.chipRow}>
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
                style={filterStyles.chipText}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={onAdd}
        style={filterStyles.addButton}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="기록 추가"
      >
        <Icon name="plus" size={13} color={theme.colors.primary} />
        <Text variant="caption" style={filterStyles.addText}>
          추가
        </Text>
      </Pressable>
    </Row>
  );
}

// ─── PersonFilterBar (각자일 때만 — 나/상대 토글) ────────

function PersonFilterBar({
  value,
  onChange,
  myName,
  partnerName,
}: {
  value: PersonFilter;
  onChange: (v: PersonFilter) => void;
  myName: string;
  partnerName: string;
}) {
  const items: { key: PersonFilter; label: string }[] = [
    { key: 'me', label: myName },
    { key: 'partner', label: partnerName },
  ];

  return (
    <Row px="xxl" style={personFilterStyles.container}>
      {items.map((item) => {
        const active = value === item.key;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            style={[
              personFilterStyles.tab,
              active && personFilterStyles.tabActive,
            ]}
            hitSlop={4}
          >
            <Text
              variant="caption"
              color={active ? 'primary' : 'textMuted'}
              style={{
                fontWeight: active ? '700' : '500',
              }}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </Row>
  );
}

const personFilterStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.colors.primary,
  },
});

const filterStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginTop: SPACING.xxs,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flexShrink: 1,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  chipText: {
    fontWeight: '600',
    marginLeft: 4,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  addText: {
    color: theme.colors.primaryDark,
    fontWeight: '700',
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
  mapArea: {
    flex: 1,
    marginTop: SPACING.sm,
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
