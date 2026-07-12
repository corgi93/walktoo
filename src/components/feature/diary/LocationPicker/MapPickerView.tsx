import React, { useMemo } from 'react';
import { View } from 'react-native';

import { NaverMapWebView, type WebMapMarker } from '@/components/feature/records/NaverMapWebView';
import type { Coords } from '@/lib/location';

interface MapPickerViewProps {
  /** 마커 위치 (선택된 장소). undefined면 마커 없음 */
  coords?: Coords;
  /** 사용자가 지도 탭 → 핀 드롭 */
  onMapTap?: (coords: Coords) => void;
  onMapInteractionStart?: () => void;
  onMapInteractionEnd?: () => void;
  height?: number;
}

const SEOUL_CENTER: Coords = { lat: 37.5665, lng: 126.978 };

/**
 * 네이버 지도 WebView 미리보기 + 마커 + 탭으로 핀 드롭.
 */
export function MapPickerView({
  coords,
  onMapTap,
  onMapInteractionStart,
  onMapInteractionEnd,
  height = 240,
}: MapPickerViewProps) {
  const target = coords ?? SEOUL_CENTER;
  const markers = useMemo<WebMapMarker[]>(() => {
    if (!coords) return [];
    return [{ id: 'selected-location', coords, title: '선택 위치' }];
  }, [coords]);

  return (
    <View style={{ height }}>
      <NaverMapWebView
        markers={markers}
        center={target}
        zoom={15}
        height={height}
        onMapPress={onMapTap}
        onInteractionStart={onMapInteractionStart}
        onInteractionEnd={onMapInteractionEnd}
      />
    </View>
  );
}
