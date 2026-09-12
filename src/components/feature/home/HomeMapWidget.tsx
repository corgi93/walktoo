import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/base';
import {
  NaverMapWebView,
  type WebMapMarker,
} from '@/components/feature/records/NaverMapWebView';
import type { Coords } from '@/lib/location';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';
import { getWalkLocationSummary, type WalkDiary } from '@/types';
import { isImageUri } from '@/utils/media';

interface HomeMapWidgetProps {
  walks: readonly WalkDiary[];
  isLoading?: boolean;
  onMapInteractionStart?: () => void;
  onMapInteractionEnd?: () => void;
}

const SEOUL_CENTER: Coords = { lat: 37.5665, lng: 126.978 };
const HOME_MAP_MARKER_LIMIT = 12;

interface PlacePoint {
  id: string;
  coords: Coords;
  title: string;
  thumbnailUrl?: string;
}

const getPlacePoints = (walk: WalkDiary): PlacePoint[] => {
  if (walk.locationCoords && (walk.isRevealed || walk.myEntry)) {
    return [
      {
        id: `${walk.id}:together`,
        coords: walk.locationCoords,
        title: getWalkLocationSummary(walk) || '우리의 장소',
        thumbnailUrl: [
          ...(walk.myEntry?.photos ?? []),
          ...(walk.isRevealed ? (walk.partnerEntry?.photos ?? []) : []),
        ].find(isImageUri),
      },
    ];
  }

  const points: PlacePoint[] = [];
  if (walk.myEntry?.locationCoords) {
    points.push({
      id: `${walk.id}:mine`,
      coords: walk.myEntry.locationCoords,
      title: walk.myEntry.locationName || '나의 장소',
      thumbnailUrl: walk.myEntry.photos.find(isImageUri),
    });
  }
  if (walk.isRevealed && walk.partnerEntry?.locationCoords) {
    points.push({
      id: `${walk.id}:partner`,
      coords: walk.partnerEntry.locationCoords,
      title: walk.partnerEntry.locationName || '연인의 장소',
      thumbnailUrl: walk.partnerEntry.photos.find(isImageUri),
    });
  }
  return points;
};

export function HomeMapWidget({
  walks,
  isLoading = false,
  onMapInteractionStart,
  onMapInteractionEnd,
}: HomeMapWidgetProps) {
  const router = useRouter();

  const markers = useMemo<WebMapMarker[]>(() => {
    const nextMarkers: WebMapMarker[] = [];
    const seenPlaces = new Set<string>();
    for (const walk of walks) {
      for (const point of getPlacePoints(walk)) {
        if (nextMarkers.length >= HOME_MAP_MARKER_LIMIT) break;
        const placeKey = `${point.title.trim().toLowerCase()}:${point.coords.lat.toFixed(4)}:${point.coords.lng.toFixed(4)}`;
        if (seenPlaces.has(placeKey)) continue;
        seenPlaces.add(placeKey);
        nextMarkers.push({
          id: point.id,
          coords: point.coords,
          title: point.title,
          subtitle: walk.date,
          thumbnailUrl: point.thumbnailUrl,
        });
      }
      if (nextMarkers.length >= HOME_MAP_MARKER_LIMIT) break;
    }
    return nextMarkers;
  }, [walks]);

  const center = markers[0]?.coords ?? SEOUL_CENTER;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <View style={styles.iconBadge}>
            <Icon name="map-pin" size={16} color={theme.colors.primary} />
          </View>
          <View>
            <Text variant="bodySmall" weight="700">
              둘만의 장소
            </Text>
            <Text variant="caption" color="textMuted" style={styles.subtitle}>
              걸으며 발견한 사진과 추억
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() =>
            router.push({
              pathname: '/(tabs)/records',
              params: { view: 'map' },
            })
          }
          style={styles.mapButton}
          hitSlop={8}
        >
          <Icon name="map-pin" size={13} color={theme.colors.primary} />
          <Text variant="caption" color="primary" ml="xxs">
            전체
          </Text>
        </Pressable>
      </View>

      <View style={styles.mapFrame}>
        {isLoading ? (
          <View style={styles.empty}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text variant="caption" color="textMuted" mt="sm">
              장소를 불러오는 중...
            </Text>
          </View>
        ) : markers.length > 0 ? (
          <NaverMapWebView
            markers={markers}
            center={center}
            zoom={13}
            onInteractionStart={onMapInteractionStart}
            onInteractionEnd={onMapInteractionEnd}
          />
        ) : (
          <View style={styles.empty}>
            <Icon name="map-pin" size={28} color={theme.colors.gray400} />
            <Text variant="bodySmall" color="textSecondary" mt="sm">
              아직 둘만의 장소가 없어요
            </Text>
            <Text variant="caption" color="textMuted" mt="xxs" align="center">
              다녀온 곳을 남기면 사진이 지도에 쌓여요
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.placeCount}>
          <Icon name="map-pin" size={12} color={theme.colors.primary} />
          <Text variant="caption" color="textMuted" ml="xxs">
            최근 장소 {markers.length}곳
          </Text>
        </View>
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/footprint-create',
              params: { kind: 'together' },
            })
          }
          style={({ pressed }) => [
            styles.archiveCta,
            pressed && styles.archiveCtaPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="오늘 다녀온 곳 남기기"
        >
          <Icon name="plus" size={14} color={theme.colors.white} />
          <Text variant="bodySmall" color="white" ml="xs">
            오늘 다녀온 곳 남기기
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    padding: SPACING.sm,
    shadowColor: theme.colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    gap: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  titleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  subtitle: {
    fontSize: 10,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primarySurface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  mapFrame: {
    height: 172,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.gray100,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    backgroundColor: theme.colors.surfaceWarm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    paddingHorizontal: 2,
  },
  placeCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  archiveCta: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  archiveCtaPressed: {
    opacity: 0.86,
    transform: [{ translateX: 1 }, { translateY: 1 }],
  },
});
