import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import type { EventSubscription } from 'expo-modules-core';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useSavePushTokenMutation } from './services/notification/mutation';
import { useGetMeQuery } from './services/user/query';

// ─── Notification Handler 설정 ──────────────────────────

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {
  // Expo Go에서 네이티브 모듈 없으면 무시
  console.log('[Notification] Handler 설정 스킵 (Expo Go)');
}

// ─── Hook ────────────────────────────────────────────────

export function useNotificationSetup() {
  const { data: me } = useGetMeQuery();
  const savePushToken = useSavePushTokenMutation();
  const router = useRouter();

  const notificationListener = useRef<EventSubscription>(null);
  const responseListener = useRef<EventSubscription>(null);

  useEffect(() => {
    // 1. 푸시 토큰 등록
    if (me?.id) {
      registerForPushNotifications().then((token) => {
        if (token) {
          savePushToken.mutate({ userId: me.id, token });
        }
      });
    }

    // 2. 포그라운드 알림 수신 리스너
    try {
      notificationListener.current =
        Notifications.addNotificationReceivedListener((_notification) => {
          // 포그라운드에서 알림 수신 시 — UI 업데이트는 React Query refetch로 처리
        });

      // 3. 알림 탭 시 화면 이동
      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response.notification.request.content.data;

          if (data?.walkId) {
            router.push('/(tabs)/diary');
          } else if (data?.coupleId) {
            router.push('/(tabs)');
          }
        });
    } catch {
      // Expo Go에서 네이티브 모듈 없으면 무시
    }

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [me?.id]);
}

// ─── 푸시 토큰 등록 ──────────────────────────────────────

async function registerForPushNotifications(): Promise<string | null> {
  try {
    // 권한 확인
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notification] 알림 권한 거부됨');
      return null;
    }

    // Android 채널 설정
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'walkToo 알림',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF8B5C',
      });
    }

    // Expo Push Token 발급
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });
    return tokenData.data;
  } catch (error) {
    console.warn('[Notification] 토큰 발급 실패 (Expo Go에서는 정상):', error);
    return null;
  }
}
