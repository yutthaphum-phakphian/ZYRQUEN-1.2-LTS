import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Compass } from 'lucide-react';
import { SwipeFeedback, VIEW_LABELS } from '../../hooks/useSwipeNavigation';
import { ViewType } from '../../types';

interface MobileSwipeIndicatorProps {
  currentView: ViewType;
  nextView: ViewType;
  prevView: ViewType;
  swipeFeedback: SwipeFeedback | null;
  onNavigate: (view: ViewType) => void;
}

export const MobileSwipeIndicator: React.FC<MobileSwipeIndicatorProps> = ({
  currentView,
  nextView,
  prevView,
  swipeFeedback,
  onNavigate,
}) => {
  const currentLabel = VIEW_LABELS[currentView] || { en: currentView, th: currentView };
  const prevLabel = VIEW_LABELS[prevView] || { en: prevView, th: prevView };
  const nextLabel = VIEW_LABELS[nextView] || { en: nextView, th: nextView };

  return (
    <>
      {/* Floating Dynamic Feedback Toast during / right after Swipe */}
      <AnimatePresence>
        {swipeFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none px-3.5 py-1.5 rounded-full bg-cyan-950/90 border border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.4)] backdrop-blur-md flex items-center gap-2 text-cyan-200 text-xs font-mono"
          >
            {swipeFeedback.direction === 'prev' && (
              <ChevronLeft className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
            )}
            <Compass className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-bold text-white">{swipeFeedback.targetLabelEn}</span>
              <span className="text-[10px] text-cyan-400/80">({swipeFeedback.targetLabelTh})</span>
            </div>
            {swipeFeedback.direction === 'next' && (
              <ChevronRight className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Swipe Quick Action Strip (Compact, at the top of content on small screens) */}
      <div className="md:hidden w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl bg-black/40 border border-cyan-500/20 backdrop-blur-md text-[11px] font-mono text-zinc-400">
        <button
          type="button"
          onClick={() => onNavigate(prevView)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 active:bg-cyan-500/20 active:text-cyan-300 border border-white/5 transition-all cursor-pointer truncate max-w-[45%]"
          title={`Swipe right or tap to go to ${prevLabel.en}`}
        >
          <ChevronLeft className="w-3 h-3 text-cyan-400 shrink-0" />
          <span className="truncate">{prevLabel.en}</span>
        </button>

        <div className="flex items-center gap-1 text-[10px] text-cyan-400/70 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="hidden sm:inline">Swipe</span>
        </div>

        <button
          type="button"
          onClick={() => onNavigate(nextView)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 active:bg-cyan-500/20 active:text-cyan-300 border border-white/5 transition-all cursor-pointer truncate max-w-[45%] justify-end"
          title={`Swipe left or tap to go to ${nextLabel.en}`}
        >
          <span className="truncate">{nextLabel.en}</span>
          <ChevronRight className="w-3 h-3 text-cyan-400 shrink-0" />
        </button>
      </div>
    </>
  );
};
