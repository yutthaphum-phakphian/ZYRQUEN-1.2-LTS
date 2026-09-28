import React from 'react';
import { Bot, Cpu, GitMerge, ShieldCheck, Sparkles, Network } from 'lucide-react';

export const AgentsReasoningMesh: React.FC = () => {
  const agents = [
    { name: 'Agent-01: Invariant Sentinel', task: 'Formally verifying Chamber 15 entropy decay rate', confidence: '99.98%', status: 'RESOLVED' },
    { name: 'Agent-02: Cryptographic Arbiter', task: 'Checking FIPS 204 ML-DSA-87 signatures', confidence: '100.0%', status: 'CONFIRMED' },
    { name: 'Agent-03: Judicial Compliance Guard', task: 'Validating ETDA Section 28 Thai Legal Non-Repudiation', confidence: '99.94%', status: 'APPROVED' },
    { name: 'Agent-04: Chaos Resilience Orchestrator', task: 'Validating Sub-Kelvin 35.80ms SLA margin', confidence: '99.89%', status: 'NOMINAL' },
  ];

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 p-4 sm:p-5 shadow-xl font-mono space-y-4">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Agents Reasoning Mesh
            </h3>
            <p className="text-[10px] text-slate-400">Collaborative Multi-Agent Deterministic Synthesis</p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
          <Network className="w-3 h-3" />
          4 AGENTS ACTIVE
        </span>
      </div>

      <div className="space-y-2">
        {agents.map((agent, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-2 text-xs"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-indigo-300">{agent.name}</span>
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5 truncate">{agent.task}</div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-emerald-400 font-bold block">{agent.confidence}</span>
              <span className="text-[9px] font-bold text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                {agent.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentsReasoningMesh;
