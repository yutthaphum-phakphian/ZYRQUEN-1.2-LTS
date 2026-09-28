import React, { useState, useEffect } from 'react';
import { Activity, Radio, ShieldCheck, Zap, Globe, RefreshCw } from 'lucide-react';

interface SwarmNode {
  id: string;
  name: string;
  role: string;
  load: number;
  status: 'ONLINE' | 'STANDBY' | 'SYNCING';
  latency: number;
}

const INITIAL_NODES: SwarmNode[] = [
  { id: 'node-01', name: 'APEX-ALPHA-GATE', role: 'Leader Consensual', load: 38, status: 'ONLINE', latency: 12 },
  { id: 'node-02', name: 'NEURAL-SENTINEL-18', role: 'Inference Guard', load: 64, status: 'ONLINE', latency: 18 },
  { id: 'node-03', name: 'UTIMACO-HSM-PRIMARY', role: 'FIPS 140-2 L3', load: 22, status: 'ONLINE', latency: 4 },
  { id: 'node-04', name: 'ETDA-SAFEHARBOR-SEC28', role: 'Judicial Gateway', load: 45, status: 'ONLINE', latency: 24 },
  { id: 'node-05', name: 'DEEPFREEZE-COLD-VAULT', role: 'Airgap Ledger', load: 15, status: 'STANDBY', latency: 35 },
];

export const SwarmNetReactor: React.FC = () => {
  const [nodes, setNodes] = useState<SwarmNode[]>(INITIAL_NODES);
  const [reactorPower, setReactorPower] = useState<number>(98.6);

  useEffect(() => {
    const interval = setInterval(() => {
      setNodes((prev) =>
        prev.map((n) => ({
          ...n,
          load: Math.min(95, Math.max(10, n.load + (Math.random() * 6 - 3))),
          latency: Math.max(2, n.latency + Math.floor(Math.random() * 3 - 1)),
        }))
      );
      setReactorPower(+(98.4 + Math.random() * 0.5).toFixed(1));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 p-4 sm:p-5 shadow-xl font-mono space-y-4">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              SwarmNet &amp; Boundary Health Reactor
            </h3>
            <p className="text-[10px] text-slate-400">Multi-Agent Federated Consensus &amp; Mesh Heartbeat</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
            Reactor Efficiency: {reactorPower}%
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <div className="truncate">
                <div className="font-bold text-slate-200 truncate">{node.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{node.role}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0 text-right">
              <div className="hidden sm:block">
                <div className="text-[10px] text-slate-400">Load</div>
                <div className="font-bold text-cyan-300">{node.load.toFixed(0)}%</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">RTT</div>
                <div className="font-bold text-emerald-400">{node.latency} ms</div>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  node.status === 'ONLINE'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-950 text-amber-300 border-amber-500/30'
                }`}
              >
                {node.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SwarmNetReactor;
