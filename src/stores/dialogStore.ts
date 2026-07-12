import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────

interface DialogButton {
  label: string;
  variant?: 'primary' | 'cancel';
  onPress?: () => void;
}

interface DialogConfig {
  title: string;
  message?: string;
  buttons: DialogButton[];
}

interface DialogStore {
  visible: boolean;
  config: DialogConfig | null;

  showDialog: (config: DialogConfig) => void;
  hideDialog: () => void;

  /** 간편 확인 팝업 */
  confirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmLabel?: string,
  ) => void;

  /** 간편 알림 팝업 */
  alert: (title: string, message?: string) => void;
}

// ─── Store ───────────────────────────────────────────────

export const useDialogStore = create<DialogStore>((set, get) => ({
  visible: false,
  config: null,

  showDialog: (config) => set({ visible: true, config }),
  hideDialog: () => set({ visible: false, config: null }),

  confirm: (title, message, onConfirm, confirmLabel = '확인') =>
    set({
      visible: true,
      config: {
        title,
        message,
        buttons: [
          { label: '취소', variant: 'cancel' },
          { label: confirmLabel, variant: 'primary', onPress: onConfirm },
        ],
      },
    }),

  alert: (title, message) =>
    set({
      visible: true,
      config: {
        title,
        message,
        buttons: [{ label: '확인', variant: 'primary' }],
      },
    }),
}));
