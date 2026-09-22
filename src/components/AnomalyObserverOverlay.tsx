import React, { useState, useEffect } from 'react';
import { Eye, ShieldAlert, CheckCircle2, RefreshCw, Radio, Sparkles, Filter, Zap } from 'lucide-react';
import { playTone } from './AudioSynthesizer';

export interface AnomalyLog {
  id: string;
  timestamp: string;
  chamber: string;
  threatType: string;
  confidence: number;
  status: 'NEUTRALIZED' | 'MONITORING' | 'MITIGATED';
  vector: string;
  mitigationLatency: string;
}

export const AnomalyObserverOverlay: React.FC = () => {
  const [anomalies, setAnomalies] = useState<AnomalyLog[]>([
    {
      id: 'ANM-8891',
      timestamp: '21:58:12',
      chamber: 'CH-06 Chaos Injector Shield',
      threatType: 'Entropy Fluctuation Spike',
      confidence: 99.4,
      status: 'NEUTRALIZED',
      vector: 'SYND-FLOOD-V4',
      mitigationLatency: '24ms',
    },
    {
      id: 'ANM-8892',
      timestamp: '21:59:45',
      chamber: 'CH-03 GH Pages Gateway',
      threatType: 'Merkle Drift Deviation Attempt',
      confidence: 98.7,
      status: 'MITIGATED',
      vector: 'STATE_FORGE_0X',
      mitigationLatency: '38ms',
    },
    {
      id: 'ANM-8893',
      timestamp: '22:01:04',
      chamber: 'CH-05 ZK Privacy Engine',
      threatType: 'Synthetic State Divergence',
      confidence: 99.9,
      status: 'NEUTRALIZED',
      vector: 'ZK_POW_MOCK',
      mitigationLatency: '16ms',
    },
    {
      id: 'ANM-8894',
      timestamp: '22:02:18',
      chamber: 'CH-08 Fail-Closed Sentinel Gate',
      threatType: 'Quantum Echo Interference',
      confidence: 99.1,
      status: 'NEUTRALIZED',
      vector: 'DECOH_STORM',
      mitigationLatency: '29ms',
    },
  ]);

  const [aiStatus, setAiStatus] = useState<string>('AI_ACTIVE_SCANNING');
  const [filter, setFilter] = useState<'ALL' | 'NEUTRALIZED' | 'MITIGATED' | 'MONITORING'>('ALL');
  const [isManualPurge, setIsManualPurge] = useState(false);

  useEffect(() => {
    // Simulated AI Observer scanning loop on Presentation Layer (Read-Only)
    const interval = setInterval(() => {
      const now = new Date().toLocaleTimeString('en-US', { hour12: false });
      const threatChambers = [
        { chamber: 'CH-05 ZK Privacy Engine', threat: 'Zero-Knowledge State Replay attempt', vector: 'ZK-REPLAY-PREV' },
        { chamber: 'CH-07 PQC Dilithium Vault', threat: 'Post-Quantum Side-Channel Probe', vector: 'SPECTRE-LATTICE' },
        { chamber: 'CH-04 HSM Quorum Vault', threat: 'Unauthorized Quorum Polling', vector: 'HSM-PROBE-09' },
        { chamber: 'CH-02 Senate Gate', threat: 'Synthetic Invariant Bypass', vector: 'BYPASS_V4_SIM' },
      ];
      const selected = threatChambers[Math.floor(Math.random() * threatChambers.length)];

      const newAnomaly: AnomalyLog = {
        id: `ANM-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: now,
        chamber: selected.chamber,
        threatType: selected.threat,
        confidence: +(98.2 + Math.random() * 1.7).toFixed(1),
        status: 'NEUTRALIZED',
        vector: selected.vector,
        mitigationLatency: `${Math.floor(15 + Math.random() * 25)}ms`,
      };

      setAnomalies(prev => [newAnomaly, ...prev.slice(0, 5)]);
      setAiStatus('NEUTRALIZED_SUCCESS');

      setTimeout(() => {
        setAiStatus('AI_ACTIVE_SCANNING');
      }, 2200);
    }, 6500);

    return () => clearInterval(interval);
  }, []);

  const triggerForceScan = () => {
    setIsManualPurge(true);
    setAiStatus('DEEP_AI_INSPECTION');
    try {
      playTone(960, 0.08);
    } catch {
      // Audio fallback
    }

    setTimeout(() => {
      const now = new Date().toLocaleTimeString('en-US', { hour12: false });
      const purgedAnomaly: AnomalyLog = {
        id: `ANM-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: now,
        chamber: 'CH-08 Fail-Closed Sentinel Gate',
        threatType: 'AI Deep Threat Sweep Complete (Clean)',
        confidence: 100.0,
        status: 'NEUTRALIZED',
        vector: 'GLOBAL_PURGE',
        mitigationLatency: '12ms',
      };
      setAnomalies(prev => [purgedAnomaly, ...prev.slice(0, 5)]);
      setAiStatus('ALL_THREATS_NEUTRALIZED');
      setIsManualPurge(false);

      setTimeout(() => {
        setAiStatus('AI_ACTIVE_SCANNING');
      }, 2500);
    }, 1200);
  };

  const filteredList = anomalies.filter(item => {
    if (filter === 'ALL') return true;
    return item.status === filter;
  });

  return (
    <div
      id="ai-anomaly-observer-overlay-widget"
      className="bg-slate-950/90 border border-cyan-500/30 rounded-xl p-5 text-cyan-400 font-mono shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-cyan-500/50 my-4"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/20 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-cyan-950/80 border border-cyan-500/40 rounded-lg">
            <Eye className="w-5 h-5 text-cyan-300 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-cyan-200 tracking-wide flex items-center gap-2">
              AI-Driven Anomaly Observer &amp; Threat Neutralization
            </h3>
            <p className="text-xs text-slate-400">
              Layer: <span className="text-cyan-300 font-semibold">Control Plane Presentation</span> | AI Observer: <span className={`font-semibold ${aiStatus.includes('SUCCESS') || aiStatus.includes('NEUTRALIZED') ? 'text-emerald-400' : 'text-cyan-400'}`}>{aiStatus}</span> | Core: <span className="text-emerald-400 font-semibold">LOCKED_FROZEN_v1.2_LTS</span> (Δ0.00%)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="anomaly-observer-deep-scan-btn"
            onClick={triggerForceScan}
            disabled={isManualPurge}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600/30 to-violet-600/30 hover:from-cyan-600/50 hover:to-violet-600/50 border border-cyan-400/50 rounded-lg text-xs text-white font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isManualPurge ? 'animate-spin text-cyan-300' : 'text-violet-400'}`} />
            <span>{isManualPurge ? 'Deep Scanning...' : 'Run Deep AI Threat Sweep'}</span>
          </button>
        </div>
      </div>

      {/* Aggregate AI Sentinel Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        <div className="bg-slate-900/80 border border-cyan-500/20 rounded-lg p-2.5">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Radio className="w-3 h-3 text-cyan-400 animate-ping" />
            AI SCANNER
          </div>
          <div className="text-sm sm:text-base font-bold text-cyan-300 truncate">768Q Active</div>
        </div>
        <div className="bg-slate-900/80 border border-cyan-500/20 rounded-lg p-2.5">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-emerald-400" />
            NEUTRALIZATION RATE
          </div>
          <div className="text-sm sm:text-base font-bold text-emerald-400">100.00%</div>
        </div>
        <div className="bg-slate-900/80 border border-cyan-500/20 rounded-lg p-2.5">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            MEAN MITIGATION
          </div>
          <div className="text-sm sm:text-base font-bold text-amber-300">22.4 ms</div>
        </div>
        <div className="bg-slate-900/80 border border-cyan-500/20 rounded-lg p-2.5">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-violet-400" />
            CONFIDENCE
          </div>
          <div className="text-sm sm:text-base font-bold text-violet-300">&gt; 99.2%</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-3 text-xs">
        <span className="text-slate-400 text-[11px] flex items-center gap-1">
          <Filter className="w-3 h-3 text-slate-400" />
          FILTER:
        </span>
        {(['ALL', 'NEUTRALIZED', 'MITIGATED', 'MONITORING'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
              filter === f
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/50 font-bold'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Anomaly Stream List */}
      <div className="space-y-2.5">
        {filteredList.map(item => (
          <div
            key={item.id}
            className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-200 hover:shadow-lg"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="text-cyan-400 font-bold">{item.timestamp}</span>
                <span>•</span>
                <span className="text-slate-300 font-semibold">{item.id}</span>
                <span>•</span>
                <span className="text-amber-300">{item.chamber}</span>
                <span>•</span>
                <span className="text-slate-500">Vector: {item.vector}</span>
              </div>
              <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span className="text-rose-400">🛡️ Threat:</span>
                <span>{item.threatType}</span>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 text-right shrink-0">
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <span>AI CONFIDENCE</span>
                <span className="font-bold text-cyan-300">{item.confidence}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">Latency: {item.mitigationLatency}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    item.status === 'NEUTRALIZED'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                      : item.status === 'MITIGATED'
                      ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
                      : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {item.status === 'NEUTRALIZED' && <CheckCircle2 className="w-3 h-3 inline mr-1 text-emerald-400" />}
                  {item.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
