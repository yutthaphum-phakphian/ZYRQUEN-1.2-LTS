import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  Flame,
  Lock,
  RotateCcw,
  Zap,
  Radio,
  Terminal,
  FileSearch,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Eye,
  Activity,
  Cpu,
  RefreshCw,
  Sparkles,
  Layers,
} from 'lucide-react';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { copyToClipboard } from '../../utils/clipboard';

export interface QuarantineThreatIncident {
  incidentId: string;
  timestamp: string;
  attackVector: string;
  targetChamber: string;
  injectedPayload: string;
  detectedHash: string;
  expectedHash: string;
  temperatureC: number;
  circuitState: 'TRIPPED_FAIL_CLOSED' | 'CLEANSED_LOCKED';
  forensicEvidenceId: string;
}

const CANONICAL_SSOT_ROOT = '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68';

export const Chamber02QuarantineSimulator: React.FC = () => {
  const [circuitState, setCircuitState] = useState<'IDLE_MONITORING' | 'TRIGGERING' | 'FAIL_CLOSED_QUARANTINE' | 'CLEANSING'>('IDLE_MONITORING');
  const [temperatureC, setTemperatureC] = useState<number>(37.2);
  const [activeVector, setActiveVector] = useState<string>('MERKLE_ROOT_MUTATION');
  const [incidentLog, setIncidentLog] = useState<QuarantineThreatIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<QuarantineThreatIncident | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [telemetryTicks, setTelemetryTicks] = useState<number>(0);

  // Normal temperature jitter when idle
  useEffect(() => {
    if (circuitState !== 'IDLE_MONITORING') return;
    const timer = setInterval(() => {
      setTemperatureC(Number((37.0 + Math.random() * 0.4).toFixed(2)));
      setTelemetryTicks((t) => t + 1);
    }, 2000);
    return () => clearInterval(timer);
  }, [circuitState]);

  const handleInjectTamper = (vector: string) => {
    setActiveVector(vector);
    setCircuitState('TRIGGERING');
    playTone(300, 0.1, 'sawtooth');

    // Simulate rapid heat surge to 85.0°C Fail-Closed threshold
    let temp = 37.2;
    const ramp = setInterval(() => {
      temp += 9.6;
      if (temp >= 85.0) {
        temp = 85.0;
        clearInterval(ramp);
        setTemperatureC(85.0);
        setCircuitState('FAIL_CLOSED_QUARANTINE');
        playTone(180, 0.35, 'sawtooth');

        const newIncident: QuarantineThreatIncident = {
          incidentId: `INC-${Date.now().toString(36).toUpperCase()}`,
          timestamp: new Date().toISOString(),
          attackVector: vector,
          targetChamber: 'Chamber 02 (Cryptographic Quarantine Vault)',
          injectedPayload:
            vector === 'MERKLE_ROOT_MUTATION'
              ? 'MUTATE ROOT => 0xBADF00D479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68'
              : vector === 'CUSTODIAN_SIGNATURE_TAMPER'
              ? 'FORGED REAL_HSM SIGNATURE ON SLOT #01 (#EP-SOVEREIGN-01)'
              : vector === 'DRIFT_INJECTION_ATTEMPT'
              ? 'SET SSoT_DRIFT = +0.02% (VIOLATES ZERO DRIFT INVARIANT)'
              : 'DIRECT MEMORY WRITE TO INVOLATILE SSoT CONSTANTS',
          detectedHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
          expectedHash: CANONICAL_SSOT_ROOT,
          temperatureC: 85.0,
          circuitState: 'TRIPPED_FAIL_CLOSED',
          forensicEvidenceId: `EVD-QUARANTINE-${Math.floor(1000 + Math.random() * 9000)}`,
        };

        setIncidentLog((prev) => [newIncident, ...prev]);
        setSelectedIncident(newIncident);
      } else {
        setTemperatureC(Number(temp.toFixed(1)));
        playTone(400 + temp * 5, 0.04, 'square');
      }
    }, 80);
  };

  const handleCleanseAndRestore = () => {
    setCircuitState('CLEANSING');
    playTone(600, 0.08, 'sine');

    let temp = 85.0;
    const cool = setInterval(() => {
      temp -= 9.5;
      if (temp <= 37.2) {
        temp = 37.2;
        clearInterval(cool);
        setTemperatureC(37.2);
        setCircuitState('IDLE_MONITORING');
        playAuditChime();
      } else {
        setTemperatureC(Number(temp.toFixed(1)));
        playTone(550 - (85 - temp) * 4, 0.04, 'sine');
      }
    }, 90);
  };

  const handleCopy = (text: string, label: string) => {
    copyToClipboard(text);
    setCopiedText(label);
    playAuditChime();
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleExportIncidentJson = (incident: QuarantineThreatIncident) => {
    const blob = new Blob([JSON.stringify(incident, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QUARANTINE-INCIDENT-${incident.incidentId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    playAuditChime();
  };

  return (
    <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#130d1b]/95 via-[#0d0f1a]/95 to-[#07080F] border border-red-500/30 backdrop-blur-xl space-y-6 font-mono shadow-2xl">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-bold flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5" />
              CHAMBER 02: QUARANTINE SHIELD
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              85.0°C FAIL-CLOSED THRESHOLD
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              ZERO MUTATION (0.00% DRIFT)
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-400" />
            Chamber 02 Quarantine &amp; Fail-Closed Circuit Simulator
          </h3>
          <p className="text-xs text-zinc-400">
            Simulate adversarial mutation injections, watch the automatic 85.0°C thermal lockdown trigger, and verify isolated threat containment in Chamber 02.
          </p>
        </div>

        {/* Current Thermal & Circuit State Badge */}
        <div className="flex items-center gap-3">
          <div
            className={`px-4 py-2 rounded-2xl border flex items-center gap-3 transition-all ${
              circuitState === 'FAIL_CLOSED_QUARANTINE'
                ? 'bg-red-500/25 border-red-500 text-red-200 shadow-[0_0_25px_rgba(239,68,68,0.4)] animate-pulse'
                : circuitState === 'TRIGGERING'
                ? 'bg-amber-500/20 border-amber-500 text-amber-200 animate-pulse'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}
          >
            <Flame
              className={`w-5 h-5 ${
                circuitState === 'FAIL_CLOSED_QUARANTINE'
                  ? 'text-red-400 animate-bounce'
                  : circuitState === 'TRIGGERING'
                  ? 'text-amber-400 animate-spin'
                  : 'text-emerald-400'
              }`}
            />
            <div>
              <div className="text-[10px] uppercase font-bold text-zinc-400">Cryostat Thermal Core</div>
              <div className="text-base font-bold tracking-tight">
                {temperatureC}°C{' '}
                <span className="text-xs font-normal">
                  ({circuitState === 'FAIL_CLOSED_QUARANTINE' ? 'QUARANTINED' : 'NORMAL (Δ0.0%)'})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Controls & Circuit Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Adversarial Mutation Injector */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-red-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                Adversarial Mutation Test Vectors
              </span>
              <span className="text-[10px] text-zinc-500">Auto-Quarantine</span>
            </div>

            <p className="text-[11px] text-zinc-400">
              Select an unauthorized mutation attempt to test the automatic Fail-Closed Circuit breaker:
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleInjectTamper('MERKLE_ROOT_MUTATION')}
                disabled={circuitState !== 'IDLE_MONITORING'}
                className="w-full p-3 rounded-xl bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 text-left transition-all group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center justify-between text-xs font-bold text-red-300 group-hover:text-red-200">
                  <span>1. Merkle Root Hash Tamper</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20">Root Invariant</span>
                </div>
                <div className="text-[10px] text-zinc-400 mt-1">
                  Inject altered bytes into Genesis Merkle Root <span className="font-mono text-zinc-300">[909ab814...]</span>.
                </div>
              </button>

              <button
                onClick={() => handleInjectTamper('CUSTODIAN_SIGNATURE_TAMPER')}
                disabled={circuitState !== 'IDLE_MONITORING'}
                className="w-full p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 text-left transition-all group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center justify-between text-xs font-bold text-amber-300 group-hover:text-amber-200">
                  <span>2. Forged REAL_HSM Signature</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20">Quorum Breach</span>
                </div>
                <div className="text-[10px] text-zinc-400 mt-1">
                  Simulate invalid Dilithium-5 signature without hardware enclave token.
                </div>
              </button>

              <button
                onClick={() => handleInjectTamper('DRIFT_INJECTION_ATTEMPT')}
                disabled={circuitState !== 'IDLE_MONITORING'}
                className="w-full p-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/25 border border-purple-500/30 text-left transition-all group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center justify-between text-xs font-bold text-purple-300 group-hover:text-purple-200">
                  <span>3. SSoT Drift Violation (+0.02%)</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20">Zero Drift</span>
                </div>
                <div className="text-[10px] text-zinc-400 mt-1">
                  Attempt state discrepancy beyond the strict Δ0.0% zero-drift boundary.
                </div>
              </button>

              <button
                onClick={() => handleInjectTamper('MEMORY_INVOLATILE_WRITE')}
                disabled={circuitState !== 'IDLE_MONITORING'}
                className="w-full p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 text-left transition-all group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center justify-between text-xs font-bold text-rose-300 group-hover:text-rose-200">
                  <span>4. Involatile Memory Write Override</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20">Mutation Authority 0</span>
                </div>
                <div className="text-[10px] text-zinc-400 mt-1">
                  Inject write instruction to immutable 14,902 Sealed Blocks ledger array.
                </div>
              </button>
            </div>

            {/* Cleanse & Restore Button */}
            {circuitState === 'FAIL_CLOSED_QUARANTINE' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-2"
              >
                <button
                  onClick={handleCleanseAndRestore}
                  className="w-full py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Execute Cryogenic Cleanse &amp; Restore SSoT Δ0.0%</span>
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right 7 Cols: Real-time Threat Containment Vault & Incident Details */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-black/50 border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  Chamber 02 Quarantine Vault State
                </span>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  {circuitState === 'FAIL_CLOSED_QUARANTINE'
                    ? 'SECURITY LOCKDOWN: THREAT CONTAINED'
                    : circuitState === 'CLEANSING'
                    ? 'PURGING THREAT VECTORS & COOLING CORE...'
                    : circuitState === 'TRIGGERING'
                    ? 'SURGE DETECTED - TRIPPING CIRCUIT...'
                    : 'STANDBY: 100% AIR-GAPPED ZERO-DRIFT SHIELD'}
                </h4>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                  circuitState === 'FAIL_CLOSED_QUARANTINE'
                    ? 'bg-red-500/20 text-red-300 border-red-500/50'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {circuitState}
              </span>
            </div>

            {selectedIncident ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-red-300 font-bold flex items-center gap-1.5">
                      <AlertOctagon className="w-4 h-4 text-red-400" />
                      Isolated Threat Payload #{selectedIncident.incidentId}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {selectedIncident.timestamp}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-black/60 font-mono text-[10px] text-red-200 break-all select-all">
                    {selectedIncident.injectedPayload}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                    <span className="text-zinc-500 text-[10px] block">Target Isolation Cell:</span>
                    <span className="text-zinc-200 font-semibold block">{selectedIncident.targetChamber}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                    <span className="text-zinc-500 text-[10px] block">Thermal Cutoff:</span>
                    <span className="text-amber-300 font-semibold block">{selectedIncident.temperatureC}°C (Tripped)</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-zinc-400 flex items-center justify-between">
                    <span>Expected Canonical Hash:</span>
                    <span className="text-emerald-400 font-mono">[909ab814...] Valid SSoT</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5 font-mono text-[9px] text-zinc-400 break-all">
                    {selectedIncident.expectedHash}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={() => handleExportIncidentJson(selectedIncident)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Download Forensic Report (.json)</span>
                  </button>

                  <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mutation Prevented (Authority: 0)
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-black/30 border border-white/5 text-center space-y-2">
                <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
                <div className="text-xs font-bold text-white">Zero Active Violations in Quarantine</div>
                <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                  The SSoT is fully intact at 0.00% drift. Inject a test vector on the left to observe how Chamber 02 isolates unauthorized attempts at 85.0°C.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
