import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal as RNModal,
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
type ViewMode = 'list' | 'map';

// ─── Screen ─────────────────────────────────────────────

export default function RecordsScreen() {
  const insets = useSafeAreaInsets();
  const { isCoupleConnected } = usePartnerDerivation();
  const [{ year, month }, setYearMonth] = useState(getCurrentYearMonth);
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
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
  viewMode,
  onChangeViewMode,
}: {
  year: number;
  month: number;
  onChangeYearMonth: (next: { year: number; month: number }) => void;
  insets: { top: number; bottom: number; left: number; right: number };
  kindFilter: KindFilter;
  onChangeKindFilter: (f: KindFilter) => void;
  viewMode: ViewMode;
  onChangeViewMode: (m: ViewMode) => void;
}) {
  const { t } = useTranslation(['home', 'calendar']);
  const router = useRouter();
  const { couple, myName, partnerName } = usePartnerDerivation();
  const [showPicker, setShowPicker] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [isMapInteracting, setIsMapInteracting] = useState(false);
  const mapInteractionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coupleStartDate = couple?.startDate;

  const { walks, stamps } = useCalendarMonthQuery(year, month);

  // kind 필터 적용
  const filteredWalks = useMemo(() => {
    if (kindFilter === 'all') return walks;
    return walks.filter((w) => w.kind === kindFilter);
  }, [walks, kindFilter]);

  const handlePrev = () => onChangeYearMonth(addMonths(year, month, -1));
  const handleNext = () => onChangeYearMonth(addMonths(year, month, +1));

  const handleAddRecord = (kind: 'together' | 'each') => {
    setAddSheetOpen(false);
    router.push({
      pathname: '/footprint-create',
      params: { kind },
    });
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 탭 헤더 — 화면 제목과 보기 전환만 배치 */}
      <Row px="xxl" style={styles.header}>
        <Text variant="headingLarge" color="primary">
          {t('home:records-tab.title')}
        </Text>
        <ViewToggle mode={viewMode} onChange={onChangeViewMode} />
      </Row>

      <ScrollView
        scrollEnabled={!isMapInteracting}
        nestedScrollEnabled={false}
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
        <KindFilterBar
          value={kindFilter}
          onChange={onChangeKindFilter}
          onAdd={() => setAddSheetOpen(true)}
        />

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

        {/* 리스트 / 지도 모드 */}
        {viewMode === 'map' ? (
          <RecordsMapView
            walks={filteredWalks}
            myName={myName}
            partnerName={partnerName}
            onMapInteractionStart={lockMapScroll}
            onMapInteractionEnd={unlockMapScroll}
          />
        ) : (
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

      <AddRecordSheet
        open={addSheetOpen}
        bottomInset={insets.bottom}
        onClose={() => setAddSheetOpen(false)}
        onPick={handleAddRecord}
      />
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

function AddRecordSheet({
  open,
  bottomInset,
  onClose,
  onPick,
}: {
  open: boolean;
  bottomInset: number;
  onClose: () => void;
  onPick: (kind: 'together' | 'each') => void;
}) {
  return (
    <RNModal
      visible={open}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={sheetStyles.overlay} onPress={onClose}>
        <Pressable
          style={[sheetStyles.sheet, { paddingBottom: bottomInset + SPACING.lg }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={sheetStyles.handle} />
          <Text variant="headingSmall" style={sheetStyles.title}>
            어떤 기록을 남길까요?
          </Text>
          <Text variant="bodySmall" color="textSecondary" style={sheetStyles.subtitle}>
            지도에 남길 데이트는 우리의 하루로 기록해요.
          </Text>

          <Pressable
            onPress={() => onPick('together')}
            style={[sheetStyles.option, sheetStyles.optionPrimary]}
          >
            <View style={[sheetStyles.optionIcon, sheetStyles.optionIconPrimary]}>
              <Icon name="heart" size={18} color={theme.colors.primary} />
            </View>
            <View style={sheetStyles.optionText}>
              <Text variant="bodyMedium" style={sheetStyles.optionTitle}>
                우리의 하루
              </Text>
              <Text variant="caption" color="textSecondary" style={sheetStyles.optionDesc}>
                함께 간 장소를 지도 마커로 남겨요
              </Text>
            </View>
            <Icon name="chevron-right" size={18} color={theme.colors.gray400} />
          </Pressable>

          <Pressable
            onPress={() => onPick('each')}
            style={sheetStyles.option}
          >
            <View style={sheetStyles.optionIcon}>
              <Icon name="sun" size={18} color={theme.colors.gray600} />
            </View>
            <View style={sheetStyles.optionText}>
              <Text variant="bodyMedium" style={sheetStyles.optionTitle}>
                오늘의 나
              </Text>
              <Text variant="caption" color="textSecondary" style={sheetStyles.optionDesc}>
                각자의 일상을 가볍게 남겨요
              </Text>
            </View>
            <Icon name="chevron-right" size={18} color={theme.colors.gray400} />
          </Pressable>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const sheetStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(44, 44, 46, 0.42)',
  },
  sheet: {
    paddingTop: SPACING.sm,
    paddingHorizontal: LAYOUT.screenPx,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxl,
    borderTopWidth: 1,
    borderColor: theme.colors.gray200,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.gray300,
    marginBottom: SPACING.lg,
  },
  title: {
    color: theme.colors.text,
  },
  subtitle: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  option: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceWarm,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    marginTop: SPACING.sm,
  },
  optionPrimary: {
    backgroundColor: theme.colors.primarySurface,
    borderColor: theme.colors.primaryLight,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.gray100,
  },
  optionIconPrimary: {
    backgroundColor: theme.colors.white,
  },
  optionText: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  optionTitle: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  optionDesc: {
    marginTop: 2,
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
