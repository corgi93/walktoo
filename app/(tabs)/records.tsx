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

type ViewMode = 'list' | 'map';

// ─── Screen ─────────────────────────────────────────────

export default function RecordsScreen() {
  const insets = useSafeAreaInsets();
  const { isCoupleConnected } = usePartnerDerivation();
  const [{ year, month }, setYearMonth] = useState(getCurrentYearMonth);
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
  viewMode,
  onChangeViewMode,
}: {
  year: number;
  month: number;
  onChangeYearMonth: (next: { year: number; month: number }) => void;
  insets: { top: number; bottom: number; left: number; right: number };
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

  // 우리 기록 탭은 같이 산책(together)만 노출. 각자 기록은 홈 탭에서.
  const filteredWalks = useMemo(
    () => walks.filter((w) => w.kind === 'together'),
    [walks],
  );

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

  // 공통 헤더 (제목 + 추가 + 토글 + 월)
  const headerBlock = (
    <>
      <Row px="xxl" style={styles.header}>
        <Text variant="headingLarge" color="primary">
          {t('home:records-tab.title')}
        </Text>
        <Row style={styles.headerActions}>
          <Pressable
            onPress={handleAddRecord}
            style={styles.addButton}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="기록 추가"
          >
            <Icon name="plus" size={13} color={theme.colors.primary} />
            <Text variant="caption" style={styles.addButtonText}>
              추가
            </Text>
          </Pressable>
          <ViewToggle mode={viewMode} onChange={onChangeViewMode} />
        </Row>
      </Row>

      <CalendarMonthNav
        year={year}
        month={month}
        onPrev={handlePrev}
        onNext={handleNext}
        onTapMonth={() => setShowPicker(true)}
      />
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
  headerActions: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  addButtonText: {
    color: theme.colors.primaryDark,
    fontWeight: '700',
    marginLeft: 2,
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
