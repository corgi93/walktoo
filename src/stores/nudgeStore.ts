import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// ─── Types ───────────────────────────────────────────────

interface NudgeStore {
  /** reveal 순간 커플 패스 넛지를 마지막으로 보여준 시각(ms). null = 미노출 */
  lastRevealNudgeAt: number | null;

  markRevealNudgeShown: () => void;
  reset: () => void;
}

// ─── Store ───────────────────────────────────────────────
//
// 과금 유도 넛지의 노출 이력만 보관한다. 실제 결제/이용권 상태는
// useEntitlement(서버 소스)를 따르고, 여기엔 "언제 마지막으로 권했나"만 둔다.

export const useNudgeStore = create<NudgeStore>()(
  persist(
    (set) => ({
      lastRevealNudgeAt: null,

      markRevealNudgeShown: () => set({ lastRevealNudgeAt: Date.now() }),

      reset: () => set({ lastRevealNudgeAt: null }),
    }),
    {
      name: 'nudge-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
