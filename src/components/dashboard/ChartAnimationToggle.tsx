import React from 'react';
import { Zap, Activity, Sparkles, Gauge, BatteryCharging, Check } from 'lucide-react';
import { useChartAnimationPreference } from '../../hooks/useChartAnimationPreference';
import { playTone } from '../AudioSynthesizer';

export interface ChartAnimationToggleProps {
  variant?: 'compact' | 'full' | 'card' | 'badge';
  className?: string;
  showLabel?: boolean;
}

export const ChartAnimationToggle: React.FC<ChartAnimationToggleProps> = ({
  variant = 'compact',
  className = '',
  showLabel = true,
}) => {
  const { animationsEnabled, performanceMode, toggleAnimations, setPerformanceMode } =
    useChartAnimationPreference();

  const handleToggle = () => {
    playTone(animationsEnabled ? 520 : 740, 0.04);
    toggleAnimations();
  };

  if (variant === 'badge') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        title={
          animationsEnabled
            ? 'Smooth chart animations active (Click to switch to High-Performance Mode)'
            : 'High-Performance Mode active for low-power devices (Click to enable animations)'
        }
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all duration-150 border cursor-pointer ${
          performanceMode
            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
            : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/25'
        } ${className}`}
      >
        {performanceMode ? (
          <>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>High-Perf Mode (0ms)</span>
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Chart Animations (60FPS)</span>
          </>
        )}
      </button>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={`p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 space-y-3 ${className}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {performanceMode ? (
                <Zap className="w-4 h-4 text-amber-400" />
              ) : (
                <Sparkles className="w-4 h-4 text-cyan-400" />
              )}
              <h4 className="text-sm font-bold text-white font-mono tracking-tight">
                Chart Rendering Performance
              </h4>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  performanceMode
                    ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                    : 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                }`}
              >
                {performanceMode ? 'HIGH-PERFORMANCE (LOW-POWER)' : 'STANDARD ANIMATIONS (60FPS)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Toggle dynamic D3 transition easings and live animation loops on telemetry charts.
              Disabling animations provides instant 0ms chart updates, saving battery and CPU cycles on
              low-power devices.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={animationsEnabled}
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
              animationsEnabled ? 'bg-cyan-600' : 'bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                animationsEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Quick Mode Switch Tabs */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              playTone(700, 0.03);
              setPerformanceMode(false);
            }}
            className={`p-2.5 rounded-lg border text-left text-xs font-mono transition-all cursor-pointer ${
              animationsEnabled
                ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Smooth Motion
              </span>
              {animationsEnabled && <Check className="w-3.5 h-3.5 text-cyan-400" />}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Dynamic D3 transitions &amp; fluid 60FPS interpolations
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              playTone(550, 0.03);
              setPerformanceMode(true);
            }}
            className={`p-2.5 rounded-lg border text-left text-xs font-mono transition-all cursor-pointer ${
              performanceMode
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                High-Performance
              </span>
              {performanceMode && <Check className="w-3.5 h-3.5 text-amber-400" />}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Instant 0ms render updates &amp; minimal battery draw
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Default compact button
  return (
    <button
      type="button"
      onClick={handleToggle}
      title={
        animationsEnabled
          ? 'Chart Animations: Enabled (Click to enable High-Performance Mode for low-power devices)'
          : 'High-Performance Mode: Active (Click to re-enable 60FPS chart animations)'
      }
      className={`px-3 py-2 rounded-xl text-xs font-mono font-semibold flex items-center gap-2 transition-all duration-150 border cursor-pointer ${
        performanceMode
          ? 'bg-amber-950/40 hover:bg-amber-900/40 border-amber-500/40 hover:border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
          : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-700/80 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-200'
      } ${className}`}
    >
      {performanceMode ? (
        <>
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          {showLabel && (
            <div className="text-left leading-none">
              <div className="text-[11px] text-amber-300 font-bold">High-Perf Mode</div>
              <div className="text-[9px] text-amber-400/80 font-normal">Animations Off</div>
            </div>
          )}
        </>
      ) : (
        <>
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          {showLabel && (
            <div className="text-left leading-none">
              <div className="text-[11px] text-slate-200 font-bold">Chart Animations</div>
              <div className="text-[9px] text-cyan-400/80 font-normal">60FPS Active</div>
            </div>
          )}
        </>
      )}
    </button>
  );
};
