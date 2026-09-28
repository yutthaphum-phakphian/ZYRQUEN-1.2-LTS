/**
 * ZYRQUEN Ω∞ Civilization Agent Operating Model (Phase 19)
 * Workforce Layer, Authority Boundaries & Human-Agent-Institution Coordination
 */
import React from 'react';
import { motion } from 'motion/react';
import { Users, Shield, Cpu, Lock, CheckCircle2, Award, Zap } from 'lucide-react';

interface AgentRole {
  id: string;
  name: string;
  type: string;
  authority: string;
  responsibility: string;
  status: 'ACTIVE' | 'STANDBY' | 'QUARANTINED';
}

const AGENTS: AgentRole[] = [
  {
    id: 'AGENT-001',
    name: 'Sovereign Risk Assessor',
    type: 'Reasoning Agent',
    authority: 'READ_SECURITY_EVENT_ONLY',
    responsibility: 'Analyze entropy, drift & cross-border anomalies',
    status: 'ACTIVE',
  },
  {
    id: 'AGENT-002',
    name: 'Pipeline Synthesizer',
    type: 'Execution Agent',
    authority: 'DEPLOY_APPROVED_INFRASTRUCTURE',
    responsibility: 'Execute validated 6-Gate staged workflows',
    status: 'ACTIVE',
  },
  {
    id: 'AGENT-003',
    name: 'Constitution Sentinel',
    type: 'Guardian Agent',
    authority: 'BLOCK_UNAUTHORIZED_ACTION',
    responsibility: 'Enforce 0-Mutation lock & Fail-closed thresholds',
    status: 'ACTIVE',
  },
  {
    id: 'AGENT-004',
    name: 'Forensic Evidence Notary',
    type: 'Attestation Agent',
    authority: 'WRITE_WORM_AUDIT_LOG',
    responsibility: 'Cryptographically sign & anchor court-ready records',
    status: 'ACTIVE',
  },
];

export const CivilizationAgentOperatingModel: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-[#080d1a] border border-cyan-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl sm:text-2xl font-mono font-black text-white">
              Civilization Agent Operating Model (Phase 19)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-sans">
            โครงสร้างการแบ่งบทบาทและอำนาจหน้าที่ของตัวแทนปัญญาประดิษฐ์ (Agent Workforce Layer) ภายใต้รัฐธรรมนูญและขอบเขตอำนาจ
          </p>
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs text-slate-300">
            <thead className="bg-black/40 text-violet-400 text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-4">Agent ID</th>
                <th className="p-4">Agent Classification</th>
                <th className="p-4">Statutory Authority</th>
                <th className="p-4">Primary Responsibility</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {AGENTS.map((a) => (
                <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-bold text-cyan-300">{a.id}</td>
                  <td className="p-4 text-white font-semibold flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-violet-400" />
                    {a.name} ({a.type})
                  </td>
                  <td className="p-4 text-amber-300 text-[11px]">{a.authority}</td>
                  <td className="p-4 text-slate-300">{a.responsibility}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Human-Agent-Institution Coordination Pipeline */}
      <div className="p-6 rounded-2xl bg-black/80 border border-cyan-500/30 text-slate-300 font-mono text-xs shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
          <h3 className="text-sm font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Human–Agent–Institution Coordination Flow</span>
          </h3>
          <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
            DETERMINISTIC
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 font-mono text-xs leading-relaxed text-slate-200">
          <span className="text-cyan-400 font-bold">Human Intent</span>
          <span className="text-slate-500"> → </span>
          <span className="text-violet-400 font-bold">Institution Authority</span>
          <span className="text-slate-500"> → </span>
          <span className="text-amber-400 font-bold">AI Reasoning</span>
          <span className="text-slate-500"> → </span>
          <span className="text-emerald-400 font-bold">Agent Execution</span>
          <span className="text-slate-500"> → </span>
          <span className="text-sky-400 font-bold">Evidence Validation</span>
          <span className="text-slate-500"> → </span>
          <span className="text-purple-400 font-bold">Immutable WORM Ledger Commit</span>
        </div>
      </div>
    </div>
  );
};

export default CivilizationAgentOperatingModel;
