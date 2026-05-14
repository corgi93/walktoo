import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/base';
import {
  NaverMapWebView,
  type WebMapMarker,
} from '@/components/feature/records/NaverMapWebView';
import type { Coords } from '@/lib/location';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';
import type { WalkDiary } from '@/types';

interface HomeMapWidgetProps {
  walks: readonly WalkDiary[];
  onMapInteractionStart?: () => void;
  onMapInteractionEnd?: () => void;
}

const SEOUL_CENTER: Coords = { lat: 37.5665, lng: 126.978 };

const pickCoords = (walk: WalkDiary): Coords | null =>
  walk.locationCoords ??
  walk.myEntry?.locationCoords ??
  walk.partnerEntry?.locationCoords ??
  null;

export function HomeMapWidget({
  walks,
  onMapInteractionStart,
  onMapInteractionEnd,
}: HomeMapWidgetProps) {
  const router = useRouter();

  const markers = useMemo<WebMapMarker[]>(
    () => {
      const nextMarkers: WebMapMarker[] = [];
      walks.forEach((walk) => {
        const coords = pickCoords(walk);
        if (coords) {
          nextMarkers.push({
            id: walk.id,
            coords,
            title: walk.locationName || '우리 기록',
            subtitle: walk.date,
          });
        }
      });
      return nextMarkers;
    },
    [walks],
  );

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
              우리 지도
            </Text>
            <Text variant="caption" color="textMuted" style={styles.subtitle}>
              함께 남긴 위치를 한눈에 봐요
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/(tabs)/records')}
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
        {markers.length > 0 ? (
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
              아직 지도에 표시할 기록이 없어요
            </Text>
            <Text variant="caption" color="textMuted" mt="xxs" align="center">
              기록을 남길 때 위치를 추가하면 여기에 보여요
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text variant="caption" color="textMuted">
          이번 달 위치 기록
        </Text>
        <View style={styles.countBadge}>
          <Text variant="caption" color="primary" weight="700">
            {markers.length}
          </Text>
        </View>
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
    height: 188,
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
    paddingHorizontal: 2,
  },
  countBadge: {
    minWidth: 28,
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryLight,
  },
});
