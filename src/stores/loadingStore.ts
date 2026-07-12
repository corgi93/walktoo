import { create } from 'zustand';

interface LoadingStore {
  isLoading: boolean;
  message: string | undefined;

  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

export const useLoadingStore = create<LoadingStore>(set => ({
  isLoading: false,
  message: undefined,

  showLoading: (message?: string) => set({ isLoading: true, message }),
  hideLoading: () => set({ isLoading: false, message: undefined }),
}));
