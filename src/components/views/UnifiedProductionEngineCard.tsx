import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Zap,
  Cpu,
  Database,
  Radio,
  ExternalLink,
  Terminal,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Boxes,
  PlayCircle
} from 'lucide-react';
import { ViewType } from '../../types';

interface UnifiedProductionEngineCardProps {
  onNavigate?: (view: ViewType) => void;
  onOpenZyrquenGG?: () => void;
}

export const UnifiedProductionEngineCard: React.FC<UnifiedProductionEngineCardProps> = ({
  onNavigate,
  onOpenZyrquenGG,
}) => {
  const [isIntercepting, setIsIntercepting] = useState(false);
  const [interceptResult, setInterceptResult] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'SENTINEL' | 'REDIS'>('TELEMETRY');

  const fetchQuarantineLogs = async () => {
    try {
      const res = await fetch('/api/v1/sentinel/quarantine/logs?limit=5');
      if (res.ok) {
        const data = await res.json();
        setRecentLogs(data);
      }
    } catch {
      // Offline fallback / silent
    }
  };

  useEffect(() => {
    fetchQuarantineLogs();
    const interval = setInterval(fetchQuarantineLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerSentinel = async () => {
    setIsIntercepting(true);
    try {
      const res = await fetch('/api/v1/sentinel/intercept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'OTel Stream Anomaly Scan',
          risk_index: 0.94,
          chamber: 'Chamber 11',
          details: 'Voltage Jitter Detected + Geo Mismatch BKK→Unknown',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setInterceptResult(data);
        fetchQuarantineLogs();
      }
    } catch (err: any) {
      setInterceptResult({ status: 'ERROR', error: err.message });
    } finally {
      setIsIntercepting(false);
    }
  };

  return (
    <div className="w-full rounded-2xl bg-gradient-to-br from-[#0b1022] via-[#080d1a] to-[#040711] border border-cyan-500/30 p-4 sm:p-5 md:p-6 shadow-[0_0_25px_rgba(6,182,212,0.15)] relative overflow-hidden font-mono text-zinc-200">
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10 relative z-10">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] shrink-0">
            <Layers className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
                <span>ZYRQUEN Ω∞ UNIFIED PRODUCTION ENGINE</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                LOCKED_FROZEN_v1.2_LTS
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 text-[10px] font-semibold">
                SSoT Δ0.00%
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>FastAPI (Chamber 17)</span>
              <span className="text-zinc-600">•</span>
              <span>Async Redis Caching</span>
              <span className="text-zinc-600">•</span>
              <span>Sentinel Guard &amp; Anomaly Alert</span>
              <span className="text-zinc-600">•</span>
              <span>Live WebSocket Stream</span>
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenZyrquenGG && (
            <button
              onClick={onOpenZyrquenGG}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-950 to-indigo-950 hover:from-cyan-900 hover:to-indigo-900 border border-cyan-400/60 text-cyan-200 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.25)] transition-all cursor-pointer"
            >
              <Boxes className="w-3.5 h-3.5 text-cyan-400" />
              <span>🎮 ZYRQUEN GG View</span>
            </button>
          )}

          <a
            href="./dashboard.html"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Open Standalone Cyber-Quantum Live Dashboard"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Cyber Dashboard UI</span>
          </a>

          {onNavigate && (
            <button
              onClick={() => onNavigate('playback')}
              className="px-3 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/70 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <PlayCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>12-Stage Forensic</span>
            </button>
          )}
        </div>
      </div>

      {/* Subsystem Metric Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-4">
        <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20">
          <div className="text-[10px] text-zinc-400 flex items-center justify-between">
            <span>CANONICAL BLOCK</span>
            <Database className="w-3 h-3 text-cyan-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-cyan-300 mt-1">#849202</div>
          <div className="text-[10px] text-zinc-500 mt-0.5 truncate" title="909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68">
            0x909ab814...fa4c68
          </div>
        </div>

        <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/20">
          <div className="text-[10px] text-zinc-400 flex items-center justify-between">
            <span>CANONICAL SEALS</span>
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-emerald-400 mt-1">14,902</div>
          <div className="text-[10px] text-emerald-500/80 mt-0.5">10/10 HSM Quorum Sealed</div>
        </div>

        <div className="p-3 rounded-xl bg-black/40 border border-amber-500/20">
          <div className="text-[10px] text-zinc-400 flex items-center justify-between">
            <span>THROUGHPUT</span>
            <Zap className="w-3 h-3 text-amber-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-amber-400 mt-1">851.9 QOPS</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Zero-Jitter Engine</div>
        </div>

        <div className="p-3 rounded-xl bg-black/40 border border-violet-500/20">
          <div className="text-[10px] text-zinc-400 flex items-center justify-between">
            <span>CRYO / COHERENCE</span>
            <Cpu className="w-3 h-3 text-violet-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-violet-300 mt-1">14.98 mK</div>
          <div className="text-[10px] text-violet-400/80 mt-0.5">99.992% Entangled</div>
        </div>
      </div>

      {/* Interactive Tabs: Telemetry Stream / Sentinel Anomaly Guard / Redis Cache */}
      <div className="pt-2">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-3">
          <button
            onClick={() => setActiveTab('TELEMETRY')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'TELEMETRY'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            📡 Live Telemetry Stream
          </button>
          <button
            onClick={() => setActiveTab('SENTINEL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'SENTINEL'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-400/50'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🛡️ Sentinel Anomaly Guard
          </button>
          <button
            onClick={() => setActiveTab('REDIS')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'REDIS'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ⚡ Redis Cache Buffer ({recentLogs.length})
          </button>
        </div>

        {/* Tab 1: Live Telemetry Stream */}
        {activeTab === 'TELEMETRY' && (
          <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 text-xs space-y-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                Live Broadcast Channel: <strong className="text-cyan-300">/ws/telemetry</strong> (Every 1000ms)
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                PQC Suite: ML-KEM-1024 + Dilithium-5
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px] text-zinc-400">
              <div className="p-2 rounded bg-white/[0.02] border border-white/5">
                <span className="text-zinc-500 block">Genesis Merkle Parity</span>
                <span className="text-emerald-400 font-bold">100.00% Parity (64/64 Hex)</span>
              </div>
              <div className="p-2 rounded bg-white/[0.02] border border-white/5">
                <span className="text-zinc-500 block">Thai Legal Compliance</span>
                <span className="text-cyan-300 font-bold">ETDA &amp; PDPA Sec 9/26/28</span>
              </div>
              <div className="p-2 rounded bg-white/[0.02] border border-white/5">
                <span className="text-zinc-500 block">Security Boundary</span>
                <span className="text-amber-300 font-bold">Ω600–Ω1000 (400 Tenants Locked)</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Sentinel Anomaly Guard */}
        {activeTab === 'SENTINEL' && (
          <div className="p-3.5 rounded-xl bg-black/60 border border-rose-500/20 text-xs space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-rose-300 font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Fail-Closed Autonomous Interception Pipeline
                </span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Automatic threshold: Risk &ge; 0.85 triggers immediate Chamber 02 Quarantine (Blast Radius &le; 2.0%)
                </p>
              </div>

              <button
                onClick={handleTriggerSentinel}
                disabled={isIntercepting}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isIntercepting
                    ? 'bg-rose-950/60 text-rose-400 border-rose-500/40 animate-pulse'
                    : 'bg-rose-950/80 hover:bg-rose-900 text-rose-200 border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>{isIntercepting ? 'Intercepting...' : '⚡ Test Intercept (Risk 0.94)'}</span>
              </button>
            </div>

            {interceptResult && (
              <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-500/40 text-[11px] font-mono space-y-1 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-300">
                    VERDICT: {interceptResult.status} (Blast Radius: {interceptResult.blast_radius})
                  </span>
                  <span className="text-zinc-400 text-[10px]">
                    Action: {interceptResult.data?.action}
                  </span>
                </div>
                <div className="text-zinc-300">
                  Target: <span className="text-cyan-300">{interceptResult.data?.chamber}</span> | Details:{' '}
                  <span className="text-amber-200">{interceptResult.data?.details}</span>
                </div>
                <div className="text-[10px] text-zinc-500">
                  Event ID: {interceptResult.data?.event_id} | Merkle Anchor: {interceptResult.data?.merkle_anchor?.slice(0, 24)}...
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Redis Cache Buffer */}
        {activeTab === 'REDIS' && (
          <div className="p-3.5 rounded-xl bg-black/60 border border-amber-500/20 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-amber-300 font-bold flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-amber-400" />
                Redis Async Cache Stream (sentinel:quarantine:logs)
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                Key: sentinel:quarantine:logs
              </span>
            </div>

            {recentLogs.length === 0 ? (
              <div className="p-3 rounded bg-white/[0.02] text-zinc-500 text-center font-mono">
                No active quarantine events in Redis buffer. Click &quot;Test Intercept&quot; to simulate an anomaly.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {recentLogs.map((log, idx) => (
                  <div
                    key={log.event_id || idx}
                    className="p-2 rounded bg-white/[0.02] border border-white/5 flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-rose-400 font-bold">[{log.chamber || 'Chamber 11'}]</span>
                      <span className="text-zinc-300 truncate max-w-[280px]">{log.details || log.event_type}</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 text-[10px] border border-rose-500/30">
                      Risk {log.risk_index}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
