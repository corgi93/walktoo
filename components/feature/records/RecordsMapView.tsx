import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, UIManager, View } from 'react-native';
import {
  NaverMapMarkerOverlay,
  NaverMapView,
} from '@mj-studio/react-native-naver-map';

import { Icon, Text } from '@/components/base';
import type { Coords } from '@/lib/location';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';
import type { WalkDiary } from '@/types/diary';

interface RecordsMapViewProps {
  walks: readonly WalkDiary[];
  myName: string;
  partnerName: string;
}

interface PinnedWalk {
  walk: WalkDiary;
  coords: Coords;
}

const SEOUL_CENTER: Coords = { lat: 37.5665, lng: 126.978 };
const HAS_NATIVE_NAVER_MARKER =
  typeof UIManager.hasViewManagerConfig === 'function' &&
  UIManager.hasViewManagerConfig('RNCNaverMapMarker');

/**
 * 기록 탭 — 지도 모드.
 * walks 중 coords 있는 것만 마커로 표시. 마커 탭 → diary-detail.
 *
 * coords 없는 산책은 표시 안 됨 (legacy / 텍스트만 입력한 기록).
 */
export function RecordsMapView({ walks }: RecordsMapViewProps) {
  const router = useRouter();

  // coords 있는 walks만 추림
  const pinnedWalks = useMemo<PinnedWalk[]>(() => {
    const result: PinnedWalk[] = [];
    for (const w of walks) {
      const c =
        w.locationCoords ??
        w.myEntry?.locationCoords ??
        w.partnerEntry?.locationCoords;
      if (c && Number.isFinite(c.lat) && Number.isFinite(c.lng)) {
        result.push({ walk: w, coords: c });
      }
    }
    return result;
  }, [walks]);

  // 카메라 초기 위치 — 첫 핀, 없으면 서울 중심
  const initialCenter = pinnedWalks[0]?.coords ?? SEOUL_CENTER;

  const handleMarkerPress = (walk: WalkDiary) => {
    router.push({
      pathname: '/diary-detail',
      params: {
        id: walk.id,
        date: walk.date,
        locationName: walk.locationName,
        kind: walk.kind,
        isRevealed: String(walk.isRevealed),
        myEntry: walk.myEntry ? JSON.stringify(walk.myEntry) : '',
        partnerEntry: walk.partnerEntry
          ? JSON.stringify(walk.partnerEntry)
          : '',
      },
    });
  };

  if (pinnedWalks.length === 0) {
    return <EmptyState />;
  }

  return (
    <View style={styles.container}>
      <NaverMapView
        style={StyleSheet.absoluteFill}
        initialCamera={{
          latitude: initialCenter.lat,
          longitude: initialCenter.lng,
          zoom: 12,
        }}
      >
        {HAS_NATIVE_NAVER_MARKER &&
          pinnedWalks.map(({ walk, coords }) => (
            <NaverMapMarkerOverlay
              key={walk.id}
              latitude={coords.lat}
              longitude={coords.lng}
              anchor={{ x: 0.5, y: 1 }}
              caption={{
                text: walk.locationName || ' ',
                color: theme.colors.text,
                haloColor: '#FFFFFF',
                textSize: 11,
              }}
              onTap={() => handleMarkerPress(walk)}
            />
          ))}
      </NaverMapView>

      {/* 카운트 배지 */}
      <View style={styles.countBadge}>
        <Icon name="map-pin" size={11} color={theme.colors.primary} />
        <Text variant="caption" color="text" style={{ marginLeft: 4 }}>
          {pinnedWalks.length}곳
        </Text>
      </View>
    </View>
  );
}

// ─── Empty State ────────────────────────────────────────

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Icon name="map-pin" size={28} color={theme.colors.gray400} />
      </View>
      <Text variant="bodyMedium" color="textSecondary" align="center" mt="md">
        지도에 표시할 산책이 아직 없어요
      </Text>
      <Text
        variant="caption"
        color="textMuted"
        align="center"
        mt="xs"
        style={{ paddingHorizontal: SPACING.xl, lineHeight: 18 }}
      >
        장소를 검색해서 기록하면 여기 지도에 마커로 쌓여요
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 480,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.gray100,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    position: 'relative',
  },
  countBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyContainer: {
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.gray200,
    borderStyle: 'dashed',
  },
});
