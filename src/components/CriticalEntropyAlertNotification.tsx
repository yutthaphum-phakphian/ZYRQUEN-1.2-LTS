import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  ShieldAlert,
  Zap,
  Sliders,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { playTone } from './AudioSynthesizer';
import { SystemEvent } from './SystemEventsSidebar';
import {
  ZYRQUEN_ENTROPY_CONFIG,
  shouldTriggerCriticalAlert,
} from '../utils/circuitBreakerSafety';

interface CriticalEntropyAlertNotificationProps {
  currentRateKBps: number;
  thresholdKBps?: number;
  onOpenSidebar?: () => void;
  onTriggerSidebarAlert?: (rate: number) => void;
  isSimulatedLow?: boolean;
  onToggleSimulatedLow?: (low: boolean) => void;
  className?: string;
}

export const CriticalEntropyAlertNotification: React.FC<CriticalEntropyAlertNotificationProps> = ({
  currentRateKBps,
  thresholdKBps = ZYRQUEN_ENTROPY_CONFIG.criticalThresholdKBps,
  onOpenSidebar,
  onTriggerSidebarAlert,
  isSimulatedLow = false,
  onToggleSimulatedLow,
  className = '',
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const [lastDispatchedAt, setLastDispatchedAt] = useState<string | null>(null);
  const hasAutoTriggeredRef = useRef(false);

  // Use CH-06 circuit breaker safety logic: threshold 15,000 KBps + pass authorized TRNG surges (14,300 - 14,900)
  const isExceeded = (shouldTriggerCriticalAlert(currentRateKBps) || (currentRateKBps > thresholdKBps)) && !isSimulatedLow;
  const deltaKBps = +(currentRateKBps - thresholdKBps).toFixed(1);
  const surgeMultiple = +(currentRateKBps / thresholdKBps).toFixed(1);

  // Automatically trigger Critical Entropy Alert in system sidebar whenever rate exceeds threshold
  useEffect(() => {
    if (isExceeded) {
      if (!hasAutoTriggeredRef.current) {
        hasAutoTriggeredRef.current = true;
        setLastDispatchedAt(new Date().toLocaleTimeString('en-GB') + ' ICT');
        if (!soundMuted) {
          playTone(440, 0.08, 'sawtooth', 0.06);
          setTimeout(() => playTone(660, 0.1, 'sine', 0.05), 100);
        }
        if (onTriggerSidebarAlert) {
          onTriggerSidebarAlert(currentRateKBps);
        }
      }
    } else {
      // Reset so next transition over threshold will trigger again
      hasAutoTriggeredRef.current = false;
    }
  }, [isExceeded, currentRateKBps, onTriggerSidebarAlert, soundMuted]);

  const handleOpenSidebar = () => {
    playTone(640, 0.05);
    if (onOpenSidebar) onOpenSidebar();
  };

  const handleManualRetrigger = () => {
    if (!soundMuted) {
      playTone(440, 0.12, 'sawtooth', 0.08);
      setTimeout(() => playTone(660, 0.1, 'sine', 0.06), 120);
    }
    setLastDispatchedAt(new Date().toLocaleTimeString('en-GB') + ' ICT');
    if (onTriggerSidebarAlert) {
      onTriggerSidebarAlert(currentRateKBps);
    }
  };

  if (!isExceeded && !isSimulatedLow) {
    return (
      <div
        id="critical-entropy-alert-banner"
        className={`p-4 rounded-2xl bg-[#08151e]/80 border-cyan-500/30 font-mono text-xs text-zinc-300 flex items-center justify-between gap-4 backdrop-blur-xl ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border-emerald-500/30 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                Active Entropy Nominal
              </span>
              <span className="text-[10px] text-zinc-400 px-2 py-0.5 rounded bg-black/40 border-white/5">
                {currentRateKBps.toLocaleString()} KBps &le; {thresholdKBps} KBps Threshold
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
              Quantum noise rate is currently below critical surveillance limits.
            </p>
          </div>
        </div>

        {onToggleSimulatedLow && (
          <button
            onClick={() => onToggleSimulatedLow(false)}
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30 text-[11px] font-bold transition-all"
          >
            Simulate Rate &gt; 15,000 KBps
          </button>
        )}
      </div>
    );
  }

  if (isDismissed) {
    return (
      <div
        id="critical-entropy-alert-banner"
        className={`p-3 rounded-2xl bg-[#1a0f12]/80 border-rose-500/30 font-mono text-xs flex items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-2 text-rose-300">
          <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
          <span className="font-bold">Critical Entropy Alert (Muted / Acknowledged)</span>
          <span className="text-zinc-400 text-[11px]">
            {currentRateKBps.toLocaleString()} KBps (&gt; {thresholdKBps} KBps)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDismissed(false)}
            className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[11px] font-bold transition-colors"
          >
            Expand Alert
          </button>
          {onOpenSidebar && (
            <button
              onClick={handleOpenSidebar}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-[11px] flex items-center gap-1"
            >
              <Bell className="w-3 h-3 text-cyan-400" />
              <span>Sidebar</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      id="critical-entropy-alert-banner"
      className={`p-5 rounded-[24px] bg-gradient-to-r from-[#200d14]/95 via-[#180b13]/90 to-[#0d0914]/90 border-2 border-rose-500/50 shadow-[0_0_28px_rgba(244,63,94,0.22)] backdrop-blur-xl relative overflow-hidden font-mono ${className}`}
    >
      {/* Animated warning scanline glow */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-rose-500/5 via-rose-500/15 to-transparent animate-pulse" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Column: Warning Icon & Information */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border-rose-500/50 flex items-center justify-center shadow-[0_0_14px_rgba(244,63,94,0.4)]">
              <ShieldAlert className="w-6 h-6 text-rose-400 animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/25 text-rose-200 border-rose-500/50 text-[11px] font-bold flex items-center gap-1.5 tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
                CRITICAL ENTROPY ALERT
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-950/70 text-rose-300 border-rose-500/30 text-[10px] font-bold">
                THRESHOLD: &gt; {thresholdKBps}.0 KBps EXCEEDED
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border-amber-500/30 text-[10px]">
                {surgeMultiple}x CRITICAL CEILING
              </span>
            </div>

            <div className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
              <span>Active Entropy Rate:</span>
              <span className="text-rose-300 font-mono text-base tracking-tight bg-black/60 px-2 py-0.5 rounded-lg border-rose-500/30">
                {currentRateKBps.toLocaleString()} KBps
              </span>
              <span className="text-xs text-rose-400 font-normal">
                (+{deltaKBps.toLocaleString()} KBps above nominal 85 KBps limit)
              </span>
            </div>

            <p className="text-xs text-zinc-300 font-sans max-w-2xl">
              Physical TRNG quantum noise surge registered across hardware enclaves. Security Event dispatched to the System Sidebar under NIST SP 800-90B and Thai Electronic Transactions Act Sec. 28.
            </p>
          </div>
        </div>

        {/* Right Column: Interactive Actions */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          {/* View in System Sidebar Button */}
          {onOpenSidebar && (
            <button
              onClick={handleOpenSidebar}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border-cyan-500/40 text-cyan-200 hover:text-white text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_12px_rgba(6,182,212,0.25)] hover:scale-105"
              title="Open System Events Sidebar to inspect the Critical Entropy Alert event"
            >
              <Bell className="w-3.5 h-3.5 text-cyan-300 animate-bounce" />
              <span>Inspect in Sidebar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Manual Retrigger / Dispatch Button */}
          <button
            onClick={handleManualRetrigger}
            className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/40 text-rose-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Dispatch a fresh Critical Entropy Alert audit event to System Events Sidebar"
          >
            <Zap className="w-3.5 h-3.5 text-rose-300" />
            <span>Retrigger Event</span>
          </button>

          {/* Toggle Simulated Low (< 85 KBps) if available */}
          {onToggleSimulatedLow && (
            <button
              onClick={() => onToggleSimulatedLow(true)}
              className="px-3 py-2 rounded-xl bg-black/50 hover:bg-black/80 border-white/15 text-zinc-300 hover:text-white text-xs transition-colors flex items-center gap-1"
              title="Simulate safe rate under 85 KBps to test alert recovery"
            >
              <Sliders className="w-3 h-3 text-emerald-400" />
              <span>Simulate &lt;85 KBps</span>
            </button>
          )}

          {/* Mute Sound Button */}
          <button
            onClick={() => setSoundMuted(!soundMuted)}
            className="p-2 rounded-xl bg-black/50 hover:bg-black/80 border-white/15 text-zinc-400 hover:text-zinc-200 transition-colors"
            title={soundMuted ? 'Unmute alert tone' : 'Mute alert tone'}
          >
            {soundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-rose-400" />}
          </button>

          {/* Dismiss / Acknowledge Banner */}
          <button
            onClick={() => setIsDismissed(true)}
            className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border-white/10 text-zinc-400 hover:text-white text-xs transition-colors"
            title="Acknowledge and minimize this alert banner"
          >
            Acknowledge
          </button>
        </div>
      </div>

      {lastDispatchedAt && (
        <div className="mt-2.5 pt-2 border-t border-rose-500/20 text-[10px] text-rose-300/80 flex items-center justify-between">
          <span>Last Security Event Dispatched: {lastDispatchedAt}</span>
          <span className="text-emerald-400">System Sidebar Synchronized</span>
        </div>
      )}
    </div>
  );
};
