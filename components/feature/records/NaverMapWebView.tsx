import React, { useMemo } from 'react';
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
    .pinWrap {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transform: translateY(-6px);
    }
    .pinBubble {
      max-width: 112px;
      min-width: 42px;
      height: 34px;
      padding: 0 10px 0 8px;
      border-radius: 17px;
      display: flex;
      align-items: center;
      gap: 5px;
      background: linear-gradient(135deg, #ef746f 0%, #df5d58 100%);
      color: #fff;
      border: 2px solid #fff;
      box-shadow: 0 7px 14px rgba(44, 44, 46, .22);
      font-size: 12px;
      font-weight: 800;
      line-height: 1;
      white-space: nowrap;
      box-sizing: border-box;
    }
    .pinHeart {
      width: 18px;
      height: 18px;
      border-radius: 9px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, .22);
      font-size: 12px;
      flex: 0 0 auto;
    }
    .pinText {
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .pinTail {
      width: 12px;
      height: 12px;
      margin-top: -5px;
      background: #df5d58;
      border-right: 2px solid #fff;
      border-bottom: 2px solid #fff;
      transform: rotate(45deg);
      box-shadow: 5px 5px 9px rgba(44, 44, 46, .14);
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

    const bounds = new naver.maps.LatLngBounds();
    markers.forEach((item, index) => {
      const position = new naver.maps.LatLng(item.coords.lat, item.coords.lng);
      bounds.extend(position);
      const marker = new naver.maps.Marker({
        position,
        map,
        title: item.title || '',
        icon: {
          content: '<div class="pinWrap"><div class="pinBubble"><span class="pinHeart">♥</span><span class="pinText">' + escapeHtml(item.title) + '</span></div><div class="pinTail"></div></div>',
          anchor: new naver.maps.Point(56, 46)
        }
      });
      naver.maps.Event.addListener(marker, 'click', () => send({ type: 'markerPress', id: item.id }));
    });

    if (markers.length > 1) {
      map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
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
  onMapPress,
  onMarkerPress,
  onInteractionStart,
  onInteractionEnd,
}: NaverMapWebViewProps) {
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
    borderRadius: theme.radius.md,
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
