export interface ToastOptions {
  description?: string;
}

type ToastListener = (item: {
  id: string;
  tone: "success" | "error" | "info";
  title: string;
  description?: string;
}) => void;

const listeners = new Set<ToastListener>();

function emit(
  tone: "success" | "error" | "info",
  title: string,
  options?: ToastOptions
): void {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  for (const listener of listeners) {
    listener({ id, tone, title, description: options?.description });
  }
}

export const toast = {
  success: (title: string, options?: ToastOptions) =>
    emit("success", title, options),
  error: (title: string, options?: ToastOptions) =>
    emit("error", title, options),
  info: (title: string, options?: ToastOptions) =>
    emit("info", title, options),
  subscribe: (listener: ToastListener): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
