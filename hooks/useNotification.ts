import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
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

  // router ref: 리스너 클로저가 항상 최신 router를 참조하되 effect를 재실행하지 않음
  const routerRef = useRef(router);
  useEffect(() => { routerRef.current = router; });

  const notificationListener =
    useRef<ReturnType<typeof Notifications.addNotificationReceivedListener> | null>(null);
  const responseListener =
    useRef<ReturnType<typeof Notifications.addNotificationResponseReceivedListener> | null>(null);

  // 푸시 토큰 등록 — me.id 바뀔 때만
  useEffect(() => {
    if (!me?.id) return;
    registerForPushNotifications().then((token) => {
      if (token) {
        savePushToken.mutate({ userId: me.id, token });
      }
    });
    // savePushToken은 useMutation 반환값이라 렌더마다 새 참조 → deps 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id]);

  // 알림 리스너 — 마운트 1회만 등록
  useEffect(() => {
    try {
      notificationListener.current =
        Notifications.addNotificationReceivedListener((_notification) => {
          // 포그라운드에서 알림 수신 시 — UI 업데이트는 React Query refetch로 처리
        });

      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response.notification.request.content.data;
          if (data?.walkId) {
            routerRef.current.push('/diary-list');
          } else if (data?.coupleId) {
            routerRef.current.push('/(tabs)');
          }
        });
    } catch {
      // Expo Go에서 네이티브 모듈 없으면 무시
    }

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);
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
