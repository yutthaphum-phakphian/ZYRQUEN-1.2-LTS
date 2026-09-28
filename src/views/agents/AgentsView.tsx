/**
 * ZYRQUEN Ω∞ AI Agents Management View (Phase 4)
 * Autonomous Agent Enclaves & Reasoning Mesh Governance
 */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Cpu,
  Activity,
  ShieldCheck,
  Zap,
  Power,
  Trash2,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { playTone } from '../../components/AudioSynthesizer';

export interface SovereignAgent {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'inactive' | 'error';
  cpuUsage: string;
  memoryUsage: string;
  enclave: string;
  verifiedSeals: number;
}

const INITIAL_AGENTS: SovereignAgent[] = [
  {
    id: 'agent-01',
    name: 'Invariant Sentinel Agent',
    role: 'Real-time Entropy & Zero-Drift Guardian',
    status: 'active',
    cpuUsage: '14.2%',
    memoryUsage: '340 MB',
    enclave: 'SGX Cryo-01',
    verifiedSeals: 14902,
  },
  {
    id: 'agent-02',
    name: 'Cryptographic Arbitrator Agent',
    role: 'NIST FIPS 204 ML-DSA-87 Verifier',
    status: 'active',
    cpuUsage: '22.8%',
    memoryUsage: '512 MB',
    enclave: 'HSM Enclave 02',
    verifiedSeals: 14902,
  },
  {
    id: 'agent-03',
    name: 'Telemetry Ingestion Agent',
    role: 'High-Throughput OTLP Stream Parser',
    status: 'inactive',
    cpuUsage: '0.0%',
    memoryUsage: '64 MB',
    enclave: 'Standby Buffer',
    verifiedSeals: 14820,
  },
  {
    id: 'agent-04',
    name: 'Chaos Resilience Orchestrator',
    role: 'Fault Injection & Auto-Healing Monitor',
    status: 'active',
    cpuUsage: '8.4%',
    memoryUsage: '256 MB',
    enclave: 'Phoenix Sandbox',
    verifiedSeals: 14902,
  },
];

export const AgentsView: React.FC = () => {
  const [agents, setAgents] = useState<SovereignAgent[]>(INITIAL_AGENTS);
  const [activeCount, setActiveCount] = useState<number>(3);

  const toggleStatus = (id: string) => {
    playTone(660, 0.04);
    setAgents((prev) =>
      prev.map((agent) => {
        if (agent.id === id) {
          const nextStatus = agent.status === 'active' ? 'inactive' : 'active';
          return {
            ...agent,
            status: nextStatus,
            cpuUsage: nextStatus === 'active' ? '12.5%' : '0.0%',
          };
        }
        return agent;
      })
    );
  };

  const deleteAgent = (id: string) => {
    playTone(440, 0.06);
    setAgents((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-[#080d1a] border border-cyan-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-violet-400" />
            <h2 className="text-xl sm:text-2xl font-mono font-black text-white">
              AI Agents Management (Phase 4)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-sans">
            ควบคุมและตรวจสอบสถานะการทำงานของ Autonomous Enclave Agents ในโครงข่าย Multi-Agent Mesh
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {agents.filter((a) => a.status === 'active').length} / {agents.length} AGENTS ACTIVE
          </span>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-violet-500/40 shadow-lg transition-all space-y-4 group"
          >
            {/* Header of Card */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-violet-400">
                    {agent.id}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      agent.status === 'active'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                        : agent.status === 'inactive'
                        ? 'bg-slate-800 text-slate-400 border-slate-700'
                        : 'bg-rose-950 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    ● {agent.status.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-base font-mono font-bold text-white mt-1 group-hover:text-cyan-300 transition-colors">
                  {agent.name}
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  {agent.role}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-slate-400">
                <Cpu className="w-5 h-5 text-violet-400" />
              </div>
            </div>

            {/* Telemetry Metrics */}
            <div className="grid grid-cols-3 gap-2 font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                <span className="text-[10px] text-slate-500 block">CPU LOAD</span>
                <span className="text-slate-200 font-bold">{agent.cpuUsage}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                <span className="text-[10px] text-slate-500 block">RAM ALLOC</span>
                <span className="text-slate-200 font-bold">{agent.memoryUsage}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                <span className="text-[10px] text-slate-500 block">ENCLAVE</span>
                <span className="text-cyan-300 font-bold truncate block">{agent.enclave}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => toggleStatus(agent.id)}
                className={`py-2 px-4 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  agent.status === 'active'
                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{agent.status === 'active' ? 'Deactivate' : 'Activate'}</span>
              </button>

              <button
                type="button"
                onClick={() => deleteAgent(agent.id)}
                className="py-2 px-3 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 text-rose-400 hover:text-rose-200 border border-rose-500/20 text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5"
                title="Decommission Agent"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Decommission</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentsView;
