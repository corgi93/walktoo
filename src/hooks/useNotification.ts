import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { useSavePushTokenMutation } from './services/notification/mutation';
import { useGetMeQuery } from './services/user/query';
import { usePermissionStore } from '@/stores/permissionStore';

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
  if (__DEV__) console.log('[Notification] Handler 설정 스킵 (Expo Go)');
}

// ─── Hook ────────────────────────────────────────────────

type RemovableSubscription = {
  remove: () => void;
};

export function useNotificationSetup() {
  const { data: me } = useGetMeQuery();
  const savePushToken = useSavePushTokenMutation();
  const router = useRouter();
  const hasCompletedOnboarding = usePermissionStore(
    state => state.hasCompletedOnboarding,
  );

  // router ref: 리스너 클로저가 항상 최신 router를 참조하되 effect를 재실행하지 않음
  const routerRef = useRef(router);
  useEffect(() => { routerRef.current = router; });

  const notificationListener = useRef<RemovableSubscription | null>(null);
  const responseListener = useRef<RemovableSubscription | null>(null);

  // 중복 저장 방지 — 세션 내 마지막으로 저장한 토큰
  const savedTokenRef = useRef<string | null>(null);

  const registerAndSave = useCallback(
    async (requestIfNeeded: boolean) => {
      if (!me?.id) return;
      const token = await registerForPushNotifications(requestIfNeeded);
      if (token && token !== savedTokenRef.current) {
        savedTokenRef.current = token;
        savePushToken.mutate({ userId: me.id, token });
      }
    },
    // savePushToken(useMutation 반환값)은 렌더마다 새 참조라 deps에서 제외
    // (포함 시 콜백이 매 렌더 재생성되어 AppState 리스너가 계속 재등록됨)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [me?.id],
  );

  // 온보딩 화면이 권한 설명과 시스템 요청을 담당한다.
  // 루트에서는 이미 허용된 권한만 등록해 중복 시스템 다이얼로그를 막는다.
  useEffect(() => {
    registerAndSave(false);
  }, [registerAndSave, hasCompletedOnboarding]);

  // 포그라운드 복귀 시 재시도 — 사용자가 설정에서 알림을 뒤늦게 켠 경우,
  // 앱 재시작 없이도 토큰을 등록해 푸시(공개/톡톡 알림)가 살아나게 한다.
  // 이미 거부 상태면 requestIfNeeded=false라 시스템 다이얼로그를 다시 띄우지 않는다.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      // 아직 토큰을 못 받은 경우에만 재시도 — 한 번 등록되면 매 복귀마다
      // 토큰을 다시 발급받지 않는다.
      if (next === 'active' && !savedTokenRef.current) registerAndSave(false);
    });
    return () => sub.remove();
  }, [registerAndSave]);

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

async function registerForPushNotifications(
  requestIfNeeded: boolean,
): Promise<string | null> {
  try {
    // 권한 확인
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // requestIfNeeded=false면 시스템 다이얼로그를 띄우지 않는다(포그라운드 재시도용).
    if (existingStatus !== 'granted' && requestIfNeeded) {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
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
    const projectId =
      process.env.EXPO_PUBLIC_PROJECT_ID ??
      Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch (error) {
    console.warn('[Notification] 토큰 발급 실패 (Expo Go에서는 정상):', error);
    return null;
  }
}
