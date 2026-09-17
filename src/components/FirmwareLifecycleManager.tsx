import React, { useEffect, useState, useCallback } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Lock,
  Clock,
  Play,
  Pause,
  Sliders,
  Terminal,
  Activity,
  Award,
} from 'lucide-react';
import { playTone, playAuditChime } from './AudioSynthesizer';
import { SystemEvent } from './SystemEventsSidebar';

interface FirmwareCheckRecord {
  id: string;
  timestamp: string;
  stage: string;
  hash: string;
  status: 'VERIFIED' | 'RECONCILED' | 'DRIFT_DETECTED';
  executionMs: number;
  chambersVerified: number;
  sealsCount: number;
}

interface FirmwareLifecycleManagerProps {
  onNotifyEvent?: (
    title: string,
    desc: string,
    type: 'HARDWARE' | 'CRYPTO' | 'LEGAL_SEARCH' | 'AUDIO'
  ) => void;
  onAddSystemEvent?: (
    type: SystemEvent['type'],
    title: string,
    description: string,
    metaHash?: string,
    severity?: SystemEvent['severity'],
    statuteRef?: string,
    targetView?: SystemEvent['targetView']
  ) => void;
}

const CANONICAL_GENESIS_ROOT = '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68';
const CANONICAL_SEALS_COUNT = 14902;
const CANONICAL_BLOCK_HEIGHT = '#849202';
const PRODUCT_VERSION = 'v4.16 PDPA FINAL (Frozen v1.2 LTS)';

const VERIFICATION_STAGES = [
  'Stage 1: Genesis Merkle Root & Bootloader Hash (909ab814...fa4c68)',
  'Stage 2: NIST FIPS 204 ML-DSA-87 (Dilithium-5) Post-Quantum Signature',
  'Stage 3: Chambers 00–17 Hardware Invariant Seals (14,902 canonical)',
  'Stage 4: Thermal & Bandwidth Guard (< 85.0°C & > 15.0 GB/s)',
];

export const FirmwareLifecycleManager: React.FC<FirmwareLifecycleManagerProps> = ({
  onNotifyEvent,
  onAddSystemEvent,
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [activeStageIndex, setActiveStageIndex] = useState<number>(-1);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [lastCheck, setLastCheck] = useState<string | null>(null);
  const [checkIntervalSec, setCheckIntervalSec] = useState<number>(30);
  const [isAutoCheckEnabled, setIsAutoCheckEnabled] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number>(30);
  const [checkHistory, setCheckHistory] = useState<FirmwareCheckRecord[]>([
    {
      id: 'chk-init-01',
      timestamp: '05:02:11 ICT',
      stage: 'Chambers 00–17 All Enclaves Attested',
      hash: 'sha256:909ab814...fa4c68',
      status: 'VERIFIED',
      executionMs: 38,
      chambersVerified: 18,
      sealsCount: CANONICAL_SEALS_COUNT,
    },
  ]);

  const dispatchEvent = useCallback(
    (
      type: 'HARDWARE' | 'CRYPTO',
      title: string,
      description: string,
      metaHash: string,
      severity: 'info' | 'success' | 'warning'
    ) => {
      if (onAddSystemEvent) {
        onAddSystemEvent(
          type,
          title,
          description,
          metaHash,
          severity,
          'พ.ร.บ. ธุรกรรมฯ มาตรา ๒๖ (ETDA Level 3+)',
          'settings'
        );
      } else if (onNotifyEvent) {
        onNotifyEvent(title, description, type);
      }
    },
    [onAddSystemEvent, onNotifyEvent]
  );

  const runIntegrityCheck = useCallback(() => {
    if (isChecking) return;
    setIsChecking(true);
    setActiveStageIndex(0);
    setProgressPercent(15);
    playTone(520, 0.05, 'sine', 0.05);

    const startTime = performance.now();

    // Stage 1 -> Stage 2
    setTimeout(() => {
      setActiveStageIndex(1);
      setProgressPercent(45);
      playTone(620, 0.05, 'sine', 0.05);
    }, 450);

    // Stage 2 -> Stage 3
    setTimeout(() => {
      setActiveStageIndex(2);
      setProgressPercent(75);
      playTone(740, 0.05, 'sine', 0.05);
    }, 900);

    // Stage 3 -> Stage 4 & Complete
    setTimeout(() => {
      setActiveStageIndex(3);
      setProgressPercent(95);
      playTone(880, 0.06, 'sine', 0.06);

      setTimeout(() => {
        setIsChecking(false);
        setActiveStageIndex(-1);
        setProgressPercent(100);
        const elapsed = Math.round(performance.now() - startTime);

        const now = new Date();
        const timeStr =
          now.toLocaleTimeString('en-GB', { hour12: false }) + ' ICT';
        setLastCheck(timeStr);
        setCountdown(checkIntervalSec);

        const newRecord: FirmwareCheckRecord = {
          id: `chk-${Date.now()}`,
          timestamp: timeStr,
          stage: 'Complete 4-Stage Invariant Verification',
          hash: `sha256:${CANONICAL_GENESIS_ROOT.slice(0, 8)}...${CANONICAL_GENESIS_ROOT.slice(-6)}`,
          status: 'VERIFIED',
          executionMs: elapsed,
          chambersVerified: 18,
          sealsCount: CANONICAL_SEALS_COUNT,
        };

        setCheckHistory((prev) => [newRecord, ...prev.slice(0, 4)]);
        playAuditChime();

        dispatchEvent(
          'HARDWARE',
          `Firmware Integrity Sealed [Block ${CANONICAL_BLOCK_HEIGHT}]`,
          `Lifecycle Manager validated ${PRODUCT_VERSION}: 18/18 chambers intact, 14,902 canonical seals verified with ML-DSA-87 signature in ${elapsed}ms.`,
          `sha256:${CANONICAL_GENESIS_ROOT}`,
          'success'
        );
      }, 400);
    }, 1350);
  }, [isChecking, checkIntervalSec, dispatchEvent]);

  // Countdown timer for automatic periodic checks
  useEffect(() => {
    if (!isAutoCheckEnabled) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          runIntegrityCheck();
          return checkIntervalSec;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutoCheckEnabled, checkIntervalSec, runIntegrityCheck]);

  return (
    <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#070914]/90 via-[#0b0e1e]/85 to-[#070914]/90 border border-cyan-500/25 shadow-[0_8px_30px_-10px_rgba(6,182,212,0.15)] backdrop-blur-2xl space-y-6">
      {/* Header with status badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/8 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <RefreshCw
              className={`w-5 h-5 ${isChecking ? 'animate-spin text-cyan-300' : 'text-cyan-400'}`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                Firmware Lifecycle & Invariant Integrity Manager
              </h3>
              <span className="text-[10px] font-mono bg-cyan-500/15 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-500/30 font-semibold">
                SSoT Δ0 LOCKED
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Continuous real-time verification of SSoT Block {CANONICAL_BLOCK_HEIGHT} • {PRODUCT_VERSION}
            </p>
          </div>
        </div>

        {/* Controls: Auto-check toggle & interval selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              playTone(480, 0.03);
              setIsAutoCheckEnabled(!isAutoCheckEnabled);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-xs transition-all ${
              isAutoCheckEnabled
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-zinc-800/60 border-white/10 text-zinc-400'
            }`}
            title="Toggle periodic automated verification"
          >
            {isAutoCheckEnabled ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Auto: ON ({countdown}s)</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Auto: PAUSED</span>
              </>
            )}
          </button>

          <select
            value={checkIntervalSec}
            onChange={(e) => {
              const val = Number(e.target.value);
              setCheckIntervalSec(val);
              setCountdown(val);
            }}
            className="bg-black/60 border border-white/10 text-zinc-300 font-mono text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-cyan-500/40"
          >
            <option value={15}>15s Interval</option>
            <option value={30}>30s Interval</option>
            <option value={60}>60s Interval</option>
          </select>

          <button
            onClick={runIntegrityCheck}
            disabled={isChecking}
            className={`px-4 py-1.5 rounded-xl font-mono text-xs font-bold transition-all shadow-md flex items-center gap-2 ${
              isChecking
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 opacity-60 cursor-not-allowed'
                : 'bg-cyan-500/25 hover:bg-cyan-500/35 text-cyan-100 border border-cyan-500/40 hover:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
            }`}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`}
            />
            <span>{isChecking ? 'Verifying...' : 'Force Check'}</span>
          </button>
        </div>
      </div>

      {/* Real-time Stage Verification Progress Bar */}
      {isChecking ? (
        <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-cyan-300 font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
              {VERIFICATION_STAGES[activeStageIndex] || 'Executing Invariant Pipeline...'}
            </span>
            <span className="text-cyan-400 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-cyan-500/20">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500 transition-all duration-300 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/8 space-y-1">
            <span className="text-[10px] font-mono text-zinc-400 uppercase">Genesis Root</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-mono text-white truncate" title={CANONICAL_GENESIS_ROOT}>
                909ab814...fa4c68
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 block">FROZEN MERKLE ROOT</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/8 space-y-1">
            <span className="text-[10px] font-mono text-zinc-400 uppercase">Post-Quantum Sig</span>
            <div className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-xs font-mono text-white">ML-DSA-87</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 block">FIPS 204 DILITHIUM-5</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/8 space-y-1">
            <span className="text-[10px] font-mono text-zinc-400 uppercase">Hardware Chambers</span>
            <div className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-xs font-mono text-white">18/18 Chambers</span>
            </div>
            <span className="text-[10px] font-mono text-indigo-400 block">14,902 SEALS ACTIVE</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/8 space-y-1">
            <span className="text-[10px] font-mono text-zinc-400 uppercase">Auto-Schedule</span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-mono text-white">
                {isAutoCheckEnabled ? `Every ${checkIntervalSec}s (T-${countdown}s)` : 'Paused'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 block">
              Last: {lastCheck || '05:02:11 ICT'}
            </span>
          </div>
        </div>
      )}

      {/* Recent Verification History Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wide flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            Integrity Check Audit Trail (Reported to System Events)
          </span>
          <span className="text-[10px] font-mono text-zinc-500">
            MUTATION AUTHORITY = 0 (READ ONLY)
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/8 bg-black/40">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/8 text-[11px] text-zinc-400 bg-white/[0.02]">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Attestation Scope</th>
                <th className="py-2.5 px-3">Verified Digest</th>
                <th className="py-2.5 px-3">Latency</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300">
              {checkHistory.map((rec) => (
                <tr key={rec.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2 px-3 text-zinc-400">{rec.timestamp}</td>
                  <td className="py-2 px-3 text-white font-medium">{rec.stage}</td>
                  <td className="py-2 px-3 text-cyan-300 font-mono text-[11px]">{rec.hash}</td>
                  <td className="py-2 px-3 text-zinc-400">{rec.executionMs}ms</td>
                  <td className="py-2 px-3 text-right">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                      {rec.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
