import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  NaverMapMarkerOverlay,
  NaverMapView,
  type NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';

import type { Coords } from '@/lib/location';
import { theme } from '@/styles/theme';

interface MapPickerViewProps {
  /** 마커 위치 (선택된 장소). undefined면 마커 없음 */
  coords?: Coords;
  /** 사용자가 지도 탭 → 핀 드롭 */
  onMapTap?: (coords: Coords) => void;
  height?: number;
}

const SEOUL_CENTER: Coords = { lat: 37.5665, lng: 126.978 };

/**
 * 네이버 지도 미리보기 + 마커 + 탭으로 핀 드롭.
 *
 * ⚠️ 네이티브 모듈 — 처음 추가 시 user 측 작업 필요:
 *   1. NCP Maps Application 등록 → Client ID 발급
 *   2. .env에 `EXPO_PUBLIC_NAVER_MAP_CLIENT_ID` 추가
 *   3. `npx expo prebuild --clean` (config plugin 적용)
 *   4. `pnpm ios` / `pnpm android` (dev client 재빌드)
 */
export function MapPickerView({
  coords,
  onMapTap,
  height = 240,
}: MapPickerViewProps) {
  const mapRef = useRef<NaverMapViewRef>(null);
  const target = coords ?? SEOUL_CENTER;

  // coords 변경 시 카메라 이동
  useEffect(() => {
    if (!coords) return;
    mapRef.current?.animateCameraTo({
      latitude: coords.lat,
      longitude: coords.lng,
      zoom: 15,
      duration: 350,
    });
  }, [coords]);

  return (
    <View style={[styles.container, { height }]}>
      <NaverMapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialCamera={{
          latitude: target.lat,
          longitude: target.lng,
          zoom: 15,
        }}
        onTapMap={({ latitude, longitude }) =>
          onMapTap?.({ lat: latitude, lng: longitude })
        }
      >
        {coords && (
          <NaverMapMarkerOverlay
            latitude={coords.lat}
            longitude={coords.lng}
            anchor={{ x: 0.5, y: 1 }}
          />
        )}
      </NaverMapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: theme.colors.gray100,
    borderRadius: 12,
  },
});
