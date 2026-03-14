import { create } from 'zustand';

import { CoupleProfile } from '@/types';

// ─── Types ──────────────────────────────────────────────

interface CoupleStore {
  couple: CoupleProfile | null;
  setCouple: (couple: CoupleProfile) => void;
  clearCouple: () => void;
}

// ─── Store ──────────────────────────────────────────────

export const useCoupleStore = create<CoupleStore>(set => ({
  couple: null,
  setCouple: couple => set({ couple }),
  clearCouple: () => set({ couple: null }),
}));
