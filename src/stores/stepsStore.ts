import { create } from 'zustand';

interface StepsStore {
  mySteps: number;
  sensorAvailable: boolean;
  setMySteps: (steps: number) => void;
  setSensorAvailable: (available: boolean) => void;
}

export const useStepsStore = create<StepsStore>((set) => ({
  mySteps: 0,
  sensorAvailable: false,
  setMySteps: (steps) => set({ mySteps: Math.max(0, Math.floor(steps)) }),
  setSensorAvailable: (sensorAvailable) => set({ sensorAvailable }),
}));

