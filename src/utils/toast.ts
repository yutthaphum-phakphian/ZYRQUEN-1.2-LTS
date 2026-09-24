// src/utils/toast.ts
import { ToastType } from '../components/ToastNotification';

export interface ToastOptions {
  toastId?: string;
  durationMs?: number;
}

const activeToastIds = new Set<string>();

export const toast = {
  show: (message: string, type: ToastType = 'info', options?: ToastOptions) => {
    const toastId = options?.toastId;
    if (toastId) {
      if (activeToastIds.has(toastId)) {
        return; // Prevent duplicate toasts
      }
      activeToastIds.add(toastId);
      setTimeout(() => {
        activeToastIds.delete(toastId);
      }, options?.durationMs || 4000);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('zyrquen-toast', {
          detail: {
            message,
            type,
            id: toastId,
          },
        })
      );
    }
  },

  info: (message: string, options?: ToastOptions) => {
    toast.show(message, 'info', options);
  },

  success: (message: string, options?: ToastOptions) => {
    toast.show(message, 'success', options);
  },

  warning: (message: string, options?: ToastOptions) => {
    toast.show(message, 'warning', options);
  },

  error: (message: string, options?: ToastOptions) => {
    toast.show(message, 'error', options);
  },
};
