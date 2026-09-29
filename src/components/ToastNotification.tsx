import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Info, AlertTriangle, X, ExternalLink, Eye } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

export interface ToastMessage {
  id: string;
  message: string;
  type?: ToastType;
  action?: ToastAction;
  actionUrl?: string;
  actionLabel?: string;
}

interface ToastNotificationProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 sm:top-20 sm:right-6 z-[9999] flex flex-col gap-2.5 max-w-[calc(100vw-2rem)] sm:max-w-md pointer-events-none font-mono">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl min-w-[300px] max-w-md
              ${toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.25)]' : ''}
              ${toast.type === 'info' || !toast.type ? 'bg-[#0b0e1a]/95 border-cyan-500/40 text-cyan-100 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : ''}
              ${toast.type === 'warning' ? 'bg-amber-950/90 border-amber-500/40 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.25)]' : ''}
              ${toast.type === 'error' ? 'bg-rose-950/90 border-rose-500/40 text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.3)]' : ''}
            `}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {(toast.type === 'info' || !toast.type) && <Info className="w-5 h-5 text-cyan-400" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400" />}
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="text-xs sm:text-sm font-medium leading-relaxed">
                {toast.message}
              </div>

              {/* Action Button (e.g., 'View PDF' button for instant preview) */}
              {(toast.action || (toast.actionUrl && toast.actionLabel)) && (
                <div className="pt-1 flex items-center gap-2">
                  {toast.action ? (
                    <button
                      type="button"
                      onClick={() => {
                        toast.action?.onClick();
                      }}
                      className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-white border border-cyan-500/50 hover:border-cyan-400 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      {toast.action.icon || <Eye className="w-3.5 h-3.5 text-cyan-300" />}
                      <span>{toast.action.label}</span>
                    </button>
                  ) : toast.actionUrl ? (
                    <a
                      href={toast.actionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-white border border-cyan-500/50 hover:border-cyan-400 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-300" />
                      <span>{toast.actionLabel || 'View PDF'}</span>
                    </a>
                  ) : null}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-zinc-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10 shrink-0 cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
