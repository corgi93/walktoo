import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { Icon, Text } from '@/components/base';
import type { Coords } from '@/lib/location';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';

export interface WebMapMarker {
  id: string;
  coords: Coords;
  title?: string;
  subtitle?: string;
}

interface NaverMapWebViewProps {
  markers: readonly WebMapMarker[];
  center?: Coords;
  zoom?: number;
  height?: number;
  /** 선택된 마커 ID — 강조 표시 (펄스 + 라벨 표시) */
  activeMarkerId?: string | null;
  onMapPress?: (coords: Coords) => void;
  onMarkerPress?: (id: string) => void;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

const NAVER_MAP_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID ?? '';
const NAVER_MAP_WEB_BASE_URL =
  process.env.EXPO_PUBLIC_NAVER_MAP_WEB_BASE_URL ?? '';
const SEOUL_CENTER: Coords = { lat: 37.5665, lng: 126.978 };

type MapMessage =
  | { type: 'mapPress'; lat: number; lng: number }
  | { type: 'markerPress'; id: string };

const escapeScriptJson = (value: unknown) =>
  JSON.stringify(value).replace(/<\/script/gi, '<\\/script');

const buildHtml = ({
  clientId,
  markers,
  center,
  zoom,
}: {
  clientId: string;
  markers: readonly WebMapMarker[];
  center: Coords;
  zoom: number;
}) => {
  const markerJson = escapeScriptJson(markers);
  const centerJson = escapeScriptJson(center);

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>
    html, body, #map {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background: #f4eee9;
      overscroll-behavior: none;
      touch-action: none;
    }
    body {
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      user-select: none;
      -webkit-user-select: none;
    }
    #status {
      position: absolute;
      inset: 0;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      color: #8c8580;
      font-size: 13px;
      text-align: center;
      background: #f4eee9;
    }
    #status.hidden { display: none; }

    /* ── Marker — 원형 도트, 활성화 시 펄스 + 라벨 ── */
    .pinWrap {
      position: relative;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .pinDot {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #ef746f;
      border: 3px solid #ffffff;
      box-shadow: 0 4px 10px rgba(44, 44, 46, .28);
      transition: transform .18s ease, background .18s ease;
      position: relative;
      z-index: 2;
    }
    .pinWrap.active .pinDot {
      transform: scale(1.35);
      background: #df5d58;
      box-shadow: 0 6px 16px rgba(223, 93, 88, .55);
    }
    /* 활성화 펄스 링 */
    .pinPulse {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      background: rgba(223, 93, 88, .35);
      opacity: 0;
      pointer-events: none;
    }
    .pinWrap.active .pinPulse {
      animation: pulse 1.6s ease-out infinite;
    }
    @keyframes pulse {
      0%   { transform: translate(-50%, -50%) scale(1);   opacity: .6; }
      80%  { transform: translate(-50%, -50%) scale(3);   opacity: 0; }
      100% { transform: translate(-50%, -50%) scale(3);   opacity: 0; }
    }
    /* 활성화 라벨 */
    .pinLabel {
      position: absolute;
      bottom: calc(100% - 4px);
      left: 50%;
      transform: translateX(-50%) translateY(0);
      max-width: 160px;
      padding: 5px 11px;
      border-radius: 14px;
      background: #ffffff;
      color: #2c2c2e;
      font-size: 12px;
      font-weight: 700;
      line-height: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      box-shadow: 0 6px 14px rgba(44, 44, 46, .18);
      opacity: 0;
      pointer-events: none;
      transition: opacity .18s ease, transform .18s ease;
    }
    .pinWrap.active .pinLabel {
      opacity: 1;
      transform: translateX(-50%) translateY(-4px);
    }
  </style>
  <script src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}"></script>
</head>
<body>
  <div id="map"></div>
  <div id="status">지도를 불러오는 중이에요</div>
  <script>
    window.onerror = function () {
      const status = document.getElementById('status');
      if (status) status.textContent = '지도 로드에 실패했어요. Naver Maps JavaScript API 키와 Web 서비스 URL을 확인해주세요.';
    };

    if (!window.naver || !window.naver.maps) {
      throw new Error('Naver Maps JavaScript API is unavailable');
    }

    const markers = ${markerJson};
    const fallbackCenter = ${centerJson};
    const status = document.getElementById('status');
    const send = (payload) => {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    };
    const escapeHtml = (value) => String(value || '기록').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);

    const map = new naver.maps.Map('map', {
      center: new naver.maps.LatLng(fallbackCenter.lat, fallbackCenter.lng),
      zoom: ${zoom},
      minZoom: 6,
      scaleControl: false,
      logoControl: true,
      mapDataControl: false,
      zoomControl: true,
      zoomControlOptions: { position: naver.maps.Position.RIGHT_CENTER }
    });

    // id → naver Marker — active 토글에 필요
    const markerMap = {};

    const buildContent = (item, isActive) => {
      const label = escapeHtml(item.title);
      const activeCls = isActive ? ' active' : '';
      return '<div class="pinWrap' + activeCls + '" data-id="' + item.id + '">'
        + '<div class="pinPulse"></div>'
        + '<div class="pinDot"></div>'
        + '<div class="pinLabel">' + label + '</div>'
        + '</div>';
    };

    const bounds = new naver.maps.LatLngBounds();
    markers.forEach((item) => {
      const position = new naver.maps.LatLng(item.coords.lat, item.coords.lng);
      bounds.extend(position);
      const marker = new naver.maps.Marker({
        position,
        map,
        title: item.title || '',
        icon: {
          content: buildContent(item, false),
          anchor: new naver.maps.Point(20, 20)
        }
      });
      markerMap[item.id] = { marker, item };
      naver.maps.Event.addListener(marker, 'click', () => send({ type: 'markerPress', id: item.id }));
    });

    // RN → Web: 활성 마커 변경
    window.__setActiveMarker = function (id) {
      Object.keys(markerMap).forEach((key) => {
        const entry = markerMap[key];
        const isActive = key === id;
        entry.marker.setIcon({
          content: buildContent(entry.item, isActive),
          anchor: new naver.maps.Point(20, 20)
        });
        // 활성 마커는 zIndex 끌어올려 라벨이 다른 마커 위에 보이게
        entry.marker.setZIndex(isActive ? 1000 : 100);
      });
      // 활성 마커로 부드럽게 panTo
      if (id && markerMap[id]) {
        map.panTo(markerMap[id].marker.getPosition());
      }
    };

    if (markers.length > 1) {
      map.fitBounds(bounds, { top: 48, right: 48, bottom: 120, left: 48 });
    } else if (markers.length === 1) {
      map.setCenter(new naver.maps.LatLng(markers[0].coords.lat, markers[0].coords.lng));
      map.setZoom(${zoom});
    }

    naver.maps.Event.addListener(map, 'click', (event) => {
      send({ type: 'mapPress', lat: event.coord.lat(), lng: event.coord.lng() });
    });

    if (status) status.className = 'hidden';
  </script>
</body>
</html>`;
};

export function NaverMapWebView({
  markers,
  center,
  zoom = 14,
  height,
  activeMarkerId,
  onMapPress,
  onMarkerPress,
  onInteractionStart,
  onInteractionEnd,
}: NaverMapWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const resolvedCenter = center ?? markers[0]?.coords ?? SEOUL_CENTER;
  const html = useMemo(
    () =>
      NAVER_MAP_CLIENT_ID
        ? buildHtml({
            clientId: NAVER_MAP_CLIENT_ID,
            markers,
            center: resolvedCenter,
            zoom,
          })
        : '',
    [markers, resolvedCenter, zoom],
  );

  // 활성 마커가 바뀌면 WebView 안에 주입
  useEffect(() => {
    if (!webViewRef.current) return;
    const safe = activeMarkerId ? JSON.stringify(activeMarkerId) : 'null';
    webViewRef.current.injectJavaScript(
      `window.__setActiveMarker && window.__setActiveMarker(${safe}); true;`,
    );
  }, [activeMarkerId]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as MapMessage;
      if (message.type === 'mapPress') {
        onMapPress?.({ lat: message.lat, lng: message.lng });
      }
      if (message.type === 'markerPress') {
        onMarkerPress?.(message.id);
      }
    } catch {
      // Ignore messages that are not part of the map bridge.
    }
  };

  if (!NAVER_MAP_CLIENT_ID || !NAVER_MAP_WEB_BASE_URL) {
    return (
      <View style={[styles.fallback, height ? { height } : null]}>
        <Icon name="map-pin" size={24} color={theme.colors.gray400} />
        <Text variant="bodySmall" color="textMuted" align="center" mt="sm">
          네이버 지도 설정이 필요해요
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, height ? { height } : null]}
      onTouchStart={onInteractionStart}
      onTouchMove={onInteractionStart}
      onTouchEnd={onInteractionEnd}
      onTouchCancel={onInteractionEnd}
    >
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html, baseUrl: NAVER_MAP_WEB_BASE_URL }}
        javaScriptEnabled
        domStorageEnabled
        geolocationEnabled={false}
        mixedContentMode="always"
        onMessage={handleMessage}
        nestedScrollEnabled={false}
        overScrollMode="never"
        scrollEnabled={false}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
    overflow: 'hidden',
    backgroundColor: theme.colors.gray100,
  },
  webview: {
    flex: 1,
    backgroundColor: theme.colors.gray100,
  },
  fallback: {
    width: '100%',
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    backgroundColor: theme.colors.gray100,
    borderRadius: theme.radius.md,
  },
});
