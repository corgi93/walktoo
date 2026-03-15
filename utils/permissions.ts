import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';
import { Linking, Platform } from 'react-native';

// expo-notifications는 Expo Go(SDK 53+)에서 지원되지 않으므로
// 안전하게 optional import 처리
let Notifications: typeof import('expo-notifications') | null = null;
try {
  Notifications = require('expo-notifications');
} catch {
  // Expo Go에서는 무시
}

import { PermissionStatus, PermissionType } from '@/types/permission';

// ─── Status Normalization ───────────────────────────

/**
 * Expo의 권한 상태를 앱 내부 PermissionStatus로 정규화.
 * denied + canAskAgain=false → 'blocked' (설정에서 직접 변경 필요)
 */
const normalizeStatus = (
  status: string,
  canAskAgain: boolean,
): PermissionStatus => {
  if (status === 'granted') return 'granted';
  if (status === 'undetermined') return 'undetermined';
  if (status === 'denied' && !canAskAgain) return 'blocked';
  return 'denied';
};

// ─── Check (OS 다이얼로그 없이 현재 상태만 확인) ────

export const checkPermission = async (
  type: PermissionType,
): Promise<PermissionStatus> => {
  switch (type) {
    case 'location': {
      const { status, canAskAgain } =
        await Location.getForegroundPermissionsAsync();
      return normalizeStatus(status, canAskAgain);
    }
    case 'pedometer': {
      const { status, canAskAgain } = await Pedometer.getPermissionsAsync();
      return normalizeStatus(status, canAskAgain);
    }
    case 'notifications': {
      if (!Notifications) return 'denied';
      const { status, canAskAgain } =
        await Notifications.getPermissionsAsync();
      return normalizeStatus(status, canAskAgain);
    }
  }
};

// ─── Request (OS 시스템 다이얼로그 트리거) ──────────

export const requestPermission = async (
  type: PermissionType,
): Promise<PermissionStatus> => {
  switch (type) {
    case 'location': {
      const foreground = await Location.requestForegroundPermissionsAsync();
      if (foreground.status !== 'granted') {
        return normalizeStatus(foreground.status, foreground.canAskAgain);
      }
      // Android 10+: 백그라운드 위치는 별도 요청
      if (Platform.OS === 'android') {
        const background =
          await Location.requestBackgroundPermissionsAsync();
        return normalizeStatus(background.status, background.canAskAgain);
      }
      // iOS: Always 권한은 OS가 나중에 자동 follow-up
      return 'granted';
    }
    case 'pedometer': {
      const { status, canAskAgain } =
        await Pedometer.requestPermissionsAsync();
      return normalizeStatus(status, canAskAgain);
    }
    case 'notifications': {
      if (!Notifications) return 'denied';
      const { status, canAskAgain } =
        await Notifications.requestPermissionsAsync();
      return normalizeStatus(status, canAskAgain);
    }
  }
};

// ─── Check All ──────────────────────────────────────

export const checkAllPermissions = async (): Promise<
  Record<PermissionType, PermissionStatus>
> => {
  const [location, pedometer, notifications] = await Promise.all([
    checkPermission('location'),
    checkPermission('pedometer'),
    checkPermission('notifications'),
  ]);
  return { location, pedometer, notifications };
};

// ─── Open System Settings ───────────────────────────

export const openAppSettings = (): void => {
  Linking.openSettings();
};
