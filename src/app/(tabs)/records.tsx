import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Box, Button, Icon, Row, TabScreenHeader, Text } from '@/components/base';
import { NoCoupleCard } from '@/components/feature/couple';
import { FootprintTimeline } from '@/components/feature/diary';
import { RecordsMapView } from '@/components/feature/records/RecordsMapView';
import { useDiaryListQuery } from '@/hooks/services/diary/query';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import { theme } from '@/styles/theme';
import { LAYOUT, SPACING } from '@/styles/type';
import type { WalkDiary } from '@/types/diary';

type ViewMode = 'list' | 'map';

// ─── Screen ─────────────────────────────────────────────

export default function RecordsScreen() {
  const insets = useSafeAreaInsets();
  const { isCoupleConnected } = usePartnerDerivation();
  const params = useLocalSearchParams<{ view?: string }>();
  const [viewMode, setViewMode] = useState<ViewMode>(
    params.view === 'map' ? 'map' : 'list',
  );

  useEffect(() => {
    if (params.view === 'map' || params.view === 'list') {
      setViewMode(params.view);
    }
  }, [params.view]);

  if (!isCoupleConnected) {
    return <RecordsNoCoupleFallback insets={insets} />;
  }

  return (
    <RecordsContent
      insets={insets}
      viewMode={viewMode}
      onChangeViewMode={setViewMode}
    />
  );
}

// ─── Content ────────────────────────────────────────────

function RecordsContent({
  insets,
  viewMode,
  onChangeViewMode,
}: {
  insets: { top: number; bottom: number; left: number; right: number };
  viewMode: ViewMode;
  onChangeViewMode: (m: ViewMode) => void;
}) {
  const { t } = useTranslation(['home', 'calendar']);
  const router = useRouter();
  const { myName, partnerName } = usePartnerDerivation();
  const [isMapInteracting, setIsMapInteracting] = useState(false);
  const mapInteractionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
  } = useDiaryListQuery();
  const walks = useMemo(
    () => data?.pages.flatMap((page) => page) ?? [],
    [data],
  );

  // 우리 기록 탭은 같이 산책(together)만 노출. 각자 기록은 홈 탭에서.
  const filteredWalks = useMemo(
    () => walks.filter((w) => w.kind === 'together'),
    [walks],
  );
  const mapPlaceCount = useMemo(
    () => filteredWalks.filter(hasWalkCoords).length,
    [filteredWalks],
  );

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

  useEffect(() => {
    if (viewMode !== 'map') return;
    if (!hasNextPage || isFetchingNextPage) return;
    fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, viewMode, walks.length]);

  const headerActions = (
    <>
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
    </>
  );

  const renderHeaderBlock = (padded = true) => (
    <TabScreenHeader
      title={t('home:records-tab.title')}
      subtitle={t('home:records-tab.subtitle')}
      actions={headerActions}
      padded={padded}
    />
  );

  const renderStatBlock = (padded = true) => (
    <Row style={[padded && styles.horizontalPadding, styles.statRow]}>
      <View style={styles.stat}>
        <Icon name="footprint" size={14} color={theme.colors.primary} />
        <Text variant="caption" color="textSecondary" ml="xxs">
          우리 기록 {filteredWalks.length}
        </Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.stat}>
        <Icon name="map-pin" size={14} color={theme.colors.accent} />
        <Text variant="caption" color="textSecondary" ml="xxs">
          지도 {mapPlaceCount}곳
        </Text>
      </View>
    </Row>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 지도 모드: 헤더 + 전체 영역 지도 (ScrollView 밖) */}
      {viewMode === 'map' ? (
        <>
          {renderHeaderBlock()}
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
      ) : isLoading || filteredWalks.length === 0 ? (
        <ScrollView
          scrollEnabled={!isMapInteracting}
          nestedScrollEnabled={false}
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + LAYOUT.sectionGap },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {renderHeaderBlock()}
          {renderStatBlock()}
          <View style={styles.listMode}>
            {isLoading ? (
              <Box px="xxl">
                <Text variant="bodySmall" color="textMuted" align="center">
                  기록을 불러오는 중...
                </Text>
              </Box>
            ) : (
              <EmptyRecordsState onCreate={handleAddRecord} />
            )}
          </View>
        </ScrollView>
      ) : (
        <FootprintTimeline
          diaries={filteredWalks}
          myName={myName}
          partnerName={partnerName}
          onItemPress={handleItemPress}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{
            paddingBottom: insets.bottom + LAYOUT.sectionGap,
          }}
          ListHeaderComponent={
            <>
              {renderHeaderBlock(false)}
              {renderStatBlock(false)}
            </>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <Text variant="caption" color="textMuted" align="center" mt="md">
                기록을 더 불러오는 중...
              </Text>
            ) : null
          }
        />
      )}

    </View>
  );
}

function EmptyRecordsState({ onCreate }: { onCreate: () => void }) {
  const { t } = useTranslation('home');

  return (
    <Box px="xxl" style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Icon name="heart" size={24} color={theme.colors.primary} />
      </View>
      <Text variant="headingSmall" align="center">
        {t('records-tab.empty-title')}
      </Text>
      <Text
        variant="bodySmall"
        color="textSecondary"
        align="center"
        mt="sm"
        style={styles.emptyDescription}
      >
        {t('records-tab.empty-description')}
      </Text>
      <Button onPress={onCreate} mt="lg">
        <>
          <Icon name="plus" size={16} color={theme.colors.white} />
          <Text variant="bodyMedium" color="white" ml="sm" weight="700">
            {t('records-tab.empty-cta')}
          </Text>
        </>
      </Button>
    </Box>
  );
}

const hasWalkCoords = (walk: WalkDiary) => {
  const coords =
    walk.locationCoords ??
    walk.myEntry?.locationCoords ??
    walk.partnerEntry?.locationCoords;
  return !!coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng);
};

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
      <TabScreenHeader title={t('home:records-tab.title')} />
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
  horizontalPadding: {
    paddingHorizontal: LAYOUT.screenPx,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.xxxl,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.primarySurface,
    shadowColor: theme.colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  emptyDescription: {
    maxWidth: 260,
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
