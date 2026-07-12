import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  PermissionStates,
  PermissionStatus,
  PermissionType,
} from '@/types/permission';

// ─── Types ──────────────────────────────────────────

interface PermissionStore {
  permissions: PermissionStates;
  hasCompletedOnboarding: boolean;

  setStatus: (type: PermissionType, status: PermissionStatus) => void;
  setOnboardingComplete: () => void;
  reset: () => void;
}

// ─── Initial State ──────────────────────────────────

const initialPermissions: PermissionStates = {
  location: { status: 'undetermined', lastCheckedAt: null },
  pedometer: { status: 'undetermined', lastCheckedAt: null },
  notifications: { status: 'undetermined', lastCheckedAt: null },
};

// ─── Store ──────────────────────────────────────────

export const usePermissionStore = create<PermissionStore>()(
  persist(
    set => ({
      permissions: initialPermissions,
      hasCompletedOnboarding: false,

      setStatus: (type, status) =>
        set(state => ({
          permissions: {
            ...state.permissions,
            [type]: { status, lastCheckedAt: Date.now() },
          },
        })),

      setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),

      reset: () =>
        set({
          permissions: initialPermissions,
          hasCompletedOnboarding: false,
        }),
    }),
    {
      name: 'permission-store',
      storage: createJSONStorage(() => AsyncStorage),
      // 온보딩 플래그만 persist, 권한 상태는 매번 OS에서 재확인
      partialize: state => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    },
  ),
);
