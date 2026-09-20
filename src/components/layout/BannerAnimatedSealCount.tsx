import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion, animate } from 'motion/react';
import { Lock } from 'lucide-react';

export interface BannerAnimatedSealCountProps {
  sealCount: number;
  baseSealCount?: number;
}

export const BannerAnimatedSealCount: React.FC<BannerAnimatedSealCountProps> = ({
  sealCount,
  baseSealCount = 14902,
}) => {
  const [displayedCount, setDisplayedCount] = useState<number>(sealCount);
  const [isIncrementing, setIsIncrementing] = useState<boolean>(false);
  const prevCountRef = useRef<number>(sealCount);

  useEffect(() => {
    if (prevCountRef.current === sealCount) return;

    const fromVal = prevCountRef.current;
    const toVal = sealCount;
    prevCountRef.current = sealCount;

    if (toVal > fromVal) {
      setIsIncrementing(true);
    }

    const controls = animate(fromVal, toVal, {
      duration: 0.85,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        setDisplayedCount(Math.round(latest));
      },
      onComplete: () => {
        setDisplayedCount(toVal);
        setIsIncrementing(false);
      },
    });

    return () => controls.stop();
  }, [sealCount]);

  const deltaFromBase = Math.max(0, sealCount - baseSealCount);

  return (
    <span className="flex items-center gap-1.5 font-mono">
      <Lock
        className={`w-3.5 h-3.5 transition-colors duration-300 ${
          isIncrementing ? 'text-emerald-400 animate-pulse' : 'text-cyan-400'
        }`}
      />
      <span>
        Verified Seals:{' '}
        <AnimatePresence mode="popLayout">
          <motion.strong
            key={displayedCount}
            initial={isIncrementing ? { opacity: 0.7, y: -4, scale: 1.08 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0.7, y: 4, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className={`inline-block font-bold transition-all duration-300 ${
              isIncrementing
                ? 'text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.7)]'
                : 'text-cyan-300'
            }`}
          >
            {displayedCount.toLocaleString()}
          </motion.strong>
        </AnimatePresence>
      </span>
      {deltaFromBase > 0 && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 ml-0.5"
        >
          +{deltaFromBase}
        </motion.span>
      )}
    </span>
  );
};
