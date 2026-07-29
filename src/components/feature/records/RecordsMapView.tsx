import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/base';
import { MarkerDetailSheet } from '@/components/feature/records/MarkerDetailSheet';
import { NaverMapWebView, type WebMapMarker } from '@/components/feature/records/NaverMapWebView';
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

interface PinnedWalk {
  walk: WalkDiary;
  coords: Coords;
  thumbnailUrl?: string;
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

  const { pinnedWalks, placeCount } = useMemo<{
    pinnedWalks: PinnedWalk[];
    placeCount: number;
  }>(() => {
    const result: PinnedWalk[] = [];
    let count = 0;
    for (const w of walks) {
      if (
        w.locationCoords &&
        Number.isFinite(w.locationCoords.lat) &&
        Number.isFinite(w.locationCoords.lng)
      ) {
        count += 1;
        if (result.length < RECORD_MAP_MARKER_LIMIT) {
          result.push({
            walk: w,
            coords: w.locationCoords,
            thumbnailUrl: getFirstImageUri(
              w.myEntry?.photos,
              w.partnerEntry?.photos,
            ),
          });
        }
        continue;
      }
      if (
        w.myEntry?.locationCoords &&
        Number.isFinite(w.myEntry.locationCoords.lat) &&
        Number.isFinite(w.myEntry.locationCoords.lng)
      ) {
        count += 1;
        if (result.length < RECORD_MAP_MARKER_LIMIT) {
          result.push({
            walk: w,
            coords: w.myEntry.locationCoords,
            thumbnailUrl: getFirstImageUri(
              w.myEntry.photos,
              w.partnerEntry?.photos,
            ),
          });
        }
        continue;
      }
      if (
        w.partnerEntry?.locationCoords &&
        Number.isFinite(w.partnerEntry.locationCoords.lat) &&
        Number.isFinite(w.partnerEntry.locationCoords.lng)
      ) {
        count += 1;
        if (result.length < RECORD_MAP_MARKER_LIMIT) {
          result.push({
            walk: w,
            coords: w.partnerEntry.locationCoords,
            thumbnailUrl: getFirstImageUri(
              w.partnerEntry.photos,
              w.myEntry?.photos,
            ),
          });
        }
      }
    }
    return { pinnedWalks: result, placeCount: count };
  }, [walks]);

  const initialCenter = pinnedWalks[0]?.coords ?? SEOUL_CENTER;
  const markers = useMemo<WebMapMarker[]>(
    () =>
      pinnedWalks.map(({ walk, coords, thumbnailUrl }) => ({
        id: walk.id,
        coords,
        title: walk.locationName || '기록',
        subtitle: walk.date,
        thumbnailUrl,
      })),
    [pinnedWalks],
  );

  const selectedWalk = useMemo(
    () => pinnedWalks.find((p) => p.walk.id === selectedId)?.walk ?? null,
    [pinnedWalks, selectedId],
  );
  const countLabel =
    placeCount > pinnedWalks.length
      ? `최근 ${pinnedWalks.length}곳`
      : `${pinnedWalks.length}곳`;

  const handleMarkerPress = (walkId: string) => {
    setSelectedId(walkId);
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
        partnerEntry: walk.partnerEntry ? JSON.stringify(walk.partnerEntry) : '',
      },
    });
  };

  if (pinnedWalks.length === 0) {
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
        walk={selectedWalk}
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
