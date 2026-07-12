import { create } from 'zustand';

import { UserResponse } from '@/types/user';

interface AuthStore {
  user: UserResponse | null;
  isAuthenticated: boolean;

  setUser: (user: UserResponse) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthStore>(set => ({
  user: null,
  isAuthenticated: false,

  setUser: user => set({ user, isAuthenticated: true }),
  clearUser: () => set({ user: null, isAuthenticated: false }),
}));
