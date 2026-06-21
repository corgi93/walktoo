import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { usePermissionStore } from '@/stores/permissionStore';
import { PermissionStatus, PermissionType } from '@/types/permission';
import {
  checkPermission,
  openAppSettings,
  requestPermission,
} from '@/utils/permissions';

// ─── Types ──────────────────────────────────────────

interface UsePermissionReturn {
  status: PermissionStatus;
  isGranted: boolean;
  isDenied: boolean;
  isBlocked: boolean;
  isUndetermined: boolean;
  check: () => Promise<PermissionStatus>;
  request: () => Promise<PermissionStatus>;
  openSettings: () => void;
}

// ─── Hook ───────────────────────────────────────────

export const usePermission = (type: PermissionType): UsePermissionReturn => {
  const { permissions, setStatus } = usePermissionStore();
  const state = permissions[type];

  const check = useCallback(async () => {
    const status = await checkPermission(type);
    setStatus(type, status);
    return status;
  }, [type, setStatus]);

  const request = useCallback(async () => {
    const status = await requestPermission(type);
    setStatus(type, status);
    return status;
  }, [type, setStatus]);

  // 마운트 시 현재 상태 확인
  useEffect(() => {
    check();
  }, [check]);

  // 설정에서 돌아왔을 때 자동 재확인
  const appStateRef = useRef(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        check();
      }
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, [check]);

  return {
    status: state.status,
    isGranted: state.status === 'granted',
    isDenied: state.status === 'denied',
    isBlocked: state.status === 'blocked',
    isUndetermined: state.status === 'undetermined',
    check,
    request,
    openSettings: openAppSettings,
  };
};
