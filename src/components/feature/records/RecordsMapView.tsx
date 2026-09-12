import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/base';
import {
  MarkerDetailSheet,
  type MarkerSelection,
} from '@/components/feature/records/MarkerDetailSheet';
import {
  NaverMapWebView,
  type WebMapMarker,
} from '@/components/feature/records/NaverMapWebView';
import type { Coords } from '@/lib/location';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';
import type { WalkDiary } from '@/types/diary';
import { isImageUri } from '@/utils/media';

interface RecordsMapViewProps {
  walks: readonly WalkDiary[];
  myName: string;
  partnerName: string;
  bottomInset: number;
  onMapInteractionStart?: () => void;
  onMapInteractionEnd?: () => void;
}

interface PinnedPlace extends MarkerSelection {
  id: string;
  coords: Coords;
  walkIds: Set<string>;
}

const SEOUL_CENTER: Coords = { lat: 37.5665, lng: 126.978 };
const RECORD_MAP_MARKER_LIMIT = 120;

function getFirstImageUri(
  ...photoGroups: (readonly string[] | undefined)[]
): string | undefined {
  for (const photos of photoGroups) {
    const imageUri = photos?.find(isImageUri);
    if (imageUri) return imageUri;
  }
  return undefined;
}

/**
 * 기록 탭 — 지도 모드.
 * walks 중 coords 있는 것만 마커로 표시.
 * 마커 탭 → 마커 활성화 + 하단 시트 슬라이드 업.
 * 시트 안 "자세히 보기" → diary-detail.
 */
export function RecordsMapView({
  walks,
  bottomInset,
  onMapInteractionStart,
  onMapInteractionEnd,
}: RecordsMapViewProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { pinnedPlaces, visitCount } = useMemo<{
    pinnedPlaces: PinnedPlace[];
    visitCount: number;
  }>(() => {
    const result: PinnedPlace[] = [];
    const placeIndexes = new Map<string, number>();
    let totalVisits = 0;

    const addPlace = (
      walk: WalkDiary,
      coords: Coords | undefined,
      placeName: string,
      thumbnailUrl?: string,
    ) => {
      if (
        !coords ||
        !Number.isFinite(coords.lat) ||
        !Number.isFinite(coords.lng)
      ) {
        return;
      }

      const normalizedName = placeName.trim().toLowerCase() || '장소';
      const key = `${normalizedName}:${coords.lat.toFixed(4)}:${coords.lng.toFixed(4)}`;
      const existingIndex = placeIndexes.get(key);
      if (existingIndex !== undefined) {
        const existing = result[existingIndex];
        if (!existing.walkIds.has(walk.id)) {
          existing.walkIds.add(walk.id);
          existing.visitCount += 1;
          totalVisits += 1;
        }
        return;
      }
      totalVisits += 1;
      if (result.length >= RECORD_MAP_MARKER_LIMIT) return;

      placeIndexes.set(key, result.length);
      result.push({
        id: `${walk.id}:${result.length}`,
        walk,
        coords,
        placeName: placeName.trim() || '우리의 장소',
        thumbnailUrl,
        visitCount: 1,
        walkIds: new Set([walk.id]),
      });
    };

    for (const walk of walks) {
      if (walk.locationCoords && (walk.isRevealed || walk.myEntry)) {
        addPlace(
          walk,
          walk.locationCoords,
          walk.locationName,
          getFirstImageUri(
            walk.myEntry?.photos,
            walk.isRevealed ? walk.partnerEntry?.photos : undefined,
          ),
        );
        continue;
      }

      addPlace(
        walk,
        walk.myEntry?.locationCoords,
        walk.myEntry?.locationName ?? '',
        getFirstImageUri(walk.myEntry?.photos),
      );
      if (walk.isRevealed) {
        addPlace(
          walk,
          walk.partnerEntry?.locationCoords,
          walk.partnerEntry?.locationName ?? '',
          getFirstImageUri(walk.partnerEntry?.photos),
        );
      }
    }
    return { pinnedPlaces: result, visitCount: totalVisits };
  }, [walks]);

  const initialCenter = pinnedPlaces[0]?.coords ?? SEOUL_CENTER;
  const markers = useMemo<WebMapMarker[]>(
    () =>
      pinnedPlaces.map(
        ({ id, walk, coords, placeName, thumbnailUrl, visitCount }) => ({
          id,
          coords,
          title: placeName,
          subtitle:
            visitCount > 1 ? `${walk.date} · ${visitCount}번 방문` : walk.date,
          thumbnailUrl,
        }),
      ),
    [pinnedPlaces],
  );

  const selectedPlace = useMemo(
    () => pinnedPlaces.find((place) => place.id === selectedId) ?? null,
    [pinnedPlaces, selectedId],
  );
  const countLabel =
    visitCount > pinnedPlaces.length
      ? `최근 ${pinnedPlaces.length}곳 · ${visitCount}번 방문`
      : `최근 ${pinnedPlaces.length}곳`;

  const handleMarkerPress = (placeId: string) => {
    setSelectedId(placeId);
  };

  const handleClose = () => {
    setSelectedId(null);
  };

  const handleOpenDetail = (walk: WalkDiary) => {
    setSelectedId(null);
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

  if (pinnedPlaces.length === 0) {
    return <EmptyState />;
  }

  return (
    <View style={styles.container}>
      <NaverMapWebView
        markers={markers}
        center={initialCenter}
        zoom={12}
        activeMarkerId={selectedId}
        onMarkerPress={handleMarkerPress}
        onInteractionStart={onMapInteractionStart}
        onInteractionEnd={onMapInteractionEnd}
      />

      <View style={styles.countBadge}>
        <Icon name="map-pin" size={11} color={theme.colors.primary} />
        <Text variant="caption" color="text" style={{ marginLeft: 4 }}>
          {countLabel}
        </Text>
      </View>

      <MarkerDetailSheet
        selection={selectedPlace}
        bottomInset={bottomInset}
        onClose={handleClose}
        onOpenDetail={handleOpenDetail}
      />
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
        지도에 표시할 장소가 아직 없어요
      </Text>
      <Text
        variant="caption"
        color="textMuted"
        align="center"
        mt="xs"
        style={{ paddingHorizontal: SPACING.xl, lineHeight: 18 }}
      >
        장소를 검색해 기록하면 사진과 함께 지도에 쌓여요
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: theme.colors.gray100,
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
    flex: 1,
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
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
