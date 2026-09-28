/**
 * ZYRQUEN Ω∞ Federation Simulation Engine (Phase 21)
 * Multi-Domain Consensus & Impact Simulation Runtime for Sovereign Federation
 */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  ShieldAlert,
  TrendingUp,
  Scale,
  CheckCircle2,
  Clock,
  Zap,
  Play,
  RotateCw,
  Cpu,
  Lock,
} from 'lucide-react';
import { playTone, playAuditChime } from '../../components/AudioSynthesizer';

export interface SimulationResult {
  id: number;
  scenario: string;
  domain: string;
  outcome: string;
  consensus: 'Federation Agreed' | 'Partial Agreement' | 'Pending Escalation';
  stabilityScore: string;
  timestamp: string;
}

const INITIAL_SIMULATIONS: SimulationResult[] = [
  {
    id: 1,
    scenario: 'Security Threat Vector in CIV-FED-001 (Boundary Infiltration)',
    domain: 'Security & PQC',
    outcome: 'Zero-Trust Quarantine & Invariant Containment Successful',
    consensus: 'Federation Agreed',
    stabilityScore: '99.4%',
    timestamp: '2026-09-28 20:50 ICT',
  },
  {
    id: 2,
    scenario: 'High-Velocity Economic Shock in CIV-FED-002 (Quota Surge)',
    domain: 'Resource & Economy',
    outcome: 'Decentralized Microsecond Backoff & Stabilization Activated',
    consensus: 'Federation Agreed',
    stabilityScore: '94.2%',
    timestamp: '2026-09-28 20:52 ICT',
  },
  {
    id: 3,
    scenario: 'Statutory Policy Conflict (ETDA Sec 26 vs Cross-Border Schema)',
    domain: 'Governance & Legal',
    outcome: 'Escalated to Sovereign Deca-Custodian Kernel Quorum #849202',
    consensus: 'Pending Escalation',
    stabilityScore: '88.5%',
    timestamp: '2026-09-28 20:55 ICT',
  },
];

export const FederationSimulationEngine: React.FC = () => {
  const [results, setResults] = useState<SimulationResult[]>(INITIAL_SIMULATIONS);
  const [isSimulating, setIsSimulating] = useState(false);

  const runNewSimulation = () => {
    playTone(660, 0.04);
    setIsSimulating(true);

    setTimeout(() => {
      setIsSimulating(false);
      playAuditChime();
      const newSim: SimulationResult = {
        id: Date.now(),
        scenario: 'Dynamic AI Swarm Partitioning & Resynchronization Test',
        domain: 'Multi-Agent Mesh',
        outcome: 'Sub-Kelvin Partition Resealed with Zero Invariant Drift',
        consensus: 'Federation Agreed',
        stabilityScore: '98.9%',
        timestamp: new Date().toLocaleTimeString('th-TH') + ' ICT',
      };
      setResults((prev) => [newSim, ...prev]);
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-[#080d1a] border border-cyan-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl sm:text-2xl font-mono font-black text-white">
              Federation Simulation Engine (Phase 21)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-sans">
            ระบบจำลองสถานการณ์ความมั่นคง เศรษฐกิจ และการตัดสินใจเชิงอธิปไตยของสหพันธรัฐอัจฉริยะ (Consensus Simulation)
          </p>
        </div>

        <button
          type="button"
          onClick={runNewSimulation}
          disabled={isSimulating}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-700 hover:from-cyan-400 hover:to-violet-600 text-white font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50"
        >
          <Play className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
          <span>{isSimulating ? 'Running Swarm Simulation...' : 'Run New Scenario Simulation'}</span>
        </button>
      </div>

      {/* Simulation Results Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs text-slate-300">
            <thead className="bg-black/40 text-violet-400 text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-4">Simulation Scenario</th>
                <th className="p-4">Domain</th>
                <th className="p-4">Outcome &amp; Mitigation</th>
                <th className="p-4">Federation Consensus</th>
                <th className="p-4">Stability</th>
                <th className="p-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {results.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-bold text-white flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    {r.scenario}
                  </td>
                  <td className="p-4 text-slate-400">{r.domain}</td>
                  <td className="p-4 text-emerald-300">{r.outcome}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 w-fit ${
                        r.consensus === 'Federation Agreed'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                          : r.consensus === 'Partial Agreement'
                          ? 'bg-amber-950 text-amber-300 border-amber-500/30'
                          : 'bg-rose-950 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {r.consensus}
                    </span>
                  </td>
                  <td className="p-4 text-cyan-300 font-bold">{r.stabilityScore}</td>
                  <td className="p-4 text-slate-400 text-[11px]">{r.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulation Metrics Grid */}
      <div className="p-6 rounded-2xl bg-black/80 border border-slate-800 text-slate-300 font-mono text-xs shadow-xl space-y-4">
        <h3 className="text-sm font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-400" />
          <span>Real-time Federation Stability Indices</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
            <span className="text-slate-500 text-[10px] block">SECURITY STABILITY</span>
            <span className="text-emerald-400 font-bold text-lg">99.40%</span>
            <span className="text-[10px] text-slate-400 block">Zero-Trust Boundaries Intact</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
            <span className="text-slate-500 text-[10px] block">ECONOMIC RESILIENCE</span>
            <span className="text-cyan-400 font-bold text-lg">96.80%</span>
            <span className="text-[10px] text-slate-400 block">Dynamic Quota Balancing</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
            <span className="text-slate-500 text-[10px] block">GOVERNANCE CONSENSUS</span>
            <span className="text-violet-400 font-bold text-lg">92.50%</span>
            <span className="text-[10px] text-slate-400 block">Deca-Custodian Ratification</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
            <span className="text-slate-500 text-[10px] block">AGENT ALIGNMENT</span>
            <span className="text-amber-400 font-bold text-lg">98.90%</span>
            <span className="text-[10px] text-slate-400 block">Constitution-Bounded Execution</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FederationSimulationEngine;
