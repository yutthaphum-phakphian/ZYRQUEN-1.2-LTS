import React from 'react';
import { AnimatePresence, motion, Variants } from 'motion/react';
import { CheckCircle2, Info, AlertTriangle, AlertOctagon, X } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  message: string;
  type?: ToastType;
  shake?: boolean;
  animationState?: 'initial' | 'animate' | 'shake' | 'exit';
}

interface ToastNotificationProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
  shake?: boolean;
}

export const toastVariants: Variants = {
  initial: {
    opacity: 0,
    x: 50,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: 'easeOut',
    },
  },
  // 'shake' animation state: 0.5s keyframe oscillation to emphasize system issues
  shake: {
    opacity: 1,
    scale: 1,
    x: [0, -12, 12, -9, 9, -5, 5, -2, 2, 0],
    rotate: [0, -1.2, 1.2, -0.8, 0.8, -0.4, 0.4, 0],
    transition: {
      duration: 0.5, // exactly 0.5s
      ease: 'easeInOut',
    },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    x: 40,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  toasts,
  removeToast,
  shake: globalShake = false,
}) => {
  return (
    <div
      id="toast-notification-container"
      className="fixed top-20 right-6 z-[9999] flex flex-col gap-3 pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const isError = toast.type === 'error';
          // Any toast with the 'error' type triggers the 'shake' animation state for 0.5s
          const shouldShake =
            isError ||
            toast.shake === true ||
            toast.animationState === 'shake' ||
            globalShake;
          const targetAnimationState = shouldShake ? 'shake' : 'animate';

          return (
            <motion.div
              key={toast.id}
              id={`toast-item-${toast.id}`}
              variants={toastVariants}
              initial="initial"
              animate={targetAnimationState}
              exit="exit"
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl min-w-[300px] max-w-md
                ${toast.type === 'success' ? 'bg-emerald-950/85 border-emerald-500/40 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : ''}
                ${toast.type === 'info' || !toast.type ? 'bg-[#0b0e1a]/95 border-cyan-500/40 text-cyan-100 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : ''}
                ${toast.type === 'warning' ? 'bg-amber-950/90 border-amber-500/50 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.25)]' : ''}
                ${isError ? 'bg-rose-950/95 border-rose-500/80 text-rose-100 shadow-[0_0_35px_rgba(244,63,94,0.45)] ring-1 ring-rose-400/50' : ''}
              `}
            >
              <div className="mt-0.5 shrink-0">
                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {(toast.type === 'info' || !toast.type) && <Info className="w-5 h-5 text-cyan-400" />}
                {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {isError && (
                  <div className="relative">
                    <AlertOctagon className="w-5 h-5 text-rose-400 animate-pulse" />
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 text-sm font-medium">
                {isError && (
                  <div className="text-[10px] font-mono font-bold tracking-wider uppercase text-rose-400 mb-0.5 flex items-center gap-1.5">
                    <span>Critical System Issue</span>
                    <span className="px-1.5 py-0.2 rounded bg-rose-900/80 border border-rose-500/50 text-[9px]">FAIL-CLOSED</span>
                  </div>
                )}
                <div className="text-zinc-200 leading-snug">
                  {toast.message}
                </div>
              </div>
              <button
                id={`toast-close-btn-${toast.id}`}
                onClick={() => removeToast(toast.id)}
                className="text-zinc-400 hover:text-white transition-colors p-0.5 rounded hover:bg-white/10"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
