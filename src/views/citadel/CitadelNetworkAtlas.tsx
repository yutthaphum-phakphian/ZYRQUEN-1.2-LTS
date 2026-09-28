/**
 * ZYRQUEN Ω∞ Citadel Network Atlas (Phase 9)
 * Multi-Agent Federation & Citadel Topology Map Visualization
 */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Network, Server, Shield, Activity, Sparkles } from 'lucide-react';
import { playTone } from '../../components/AudioSynthesizer';

interface CitadelNode {
  id: string;
  name: string;
  x: number;
  y: number;
  role: string;
  color: string;
  status: 'ONLINE' | 'FROZEN';
}

const CITADEL_NODES: CitadelNode[] = [
  { id: 'alpha', name: 'Alpha Citadel (Primary)', x: 100, y: 80, role: 'Consensus Core', color: '#06b6d4', status: 'ONLINE' },
  { id: 'beta', name: 'Beta Citadel (Kyber)', x: 300, y: 60, role: 'PQC Lattice Enclave', color: '#8b5cf6', status: 'ONLINE' },
  { id: 'gamma', name: 'Gamma Citadel (WORM)', x: 500, y: 90, role: 'Immutable Ledger', color: '#10b981', status: 'ONLINE' },
  { id: 'delta', name: 'Delta Citadel (Cryo)', x: 160, y: 220, role: 'Sub-Kelvin Bus', color: '#f59e0b', status: 'ONLINE' },
  { id: 'fabric', name: 'Invariant Fabric Mesh', x: 340, y: 230, role: 'Zero-Drift Interceptor', color: '#ec4899', status: 'ONLINE' },
  { id: 'merkle', name: 'Merkle Cathedral #849202', x: 500, y: 240, role: 'Root Anchor Enclave', color: '#38bdf8', status: 'FROZEN' },
];

const CITADEL_LINKS = [
  { from: 'alpha', to: 'beta' },
  { from: 'beta', to: 'gamma' },
  { from: 'alpha', to: 'delta' },
  { from: 'delta', to: 'fabric' },
  { from: 'fabric', to: 'merkle' },
  { from: 'gamma', to: 'merkle' },
  { from: 'beta', to: 'fabric' },
];

export const CitadelNetworkAtlas: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<CitadelNode | null>(CITADEL_NODES[0]);

  return (
    <div className="p-6 rounded-2xl bg-slate-950 border border-cyan-500/20 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase">
          <Network className="w-4 h-4 text-cyan-400" />
          <span>Sovereign Citadel Network Atlas</span>
        </div>
        <span className="text-emerald-400 text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
          6/6 CITADELS LINKED
        </span>
      </div>

      {/* SVG Canvas Topology */}
      <div className="relative w-full h-80 bg-[#030712] rounded-xl border border-white/5 flex items-center justify-center overflow-hidden">
        <svg viewBox="0 0 600 320" className="w-full h-full">
          {/* Grid Background Lines */}
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Links */}
          {CITADEL_LINKS.map((link, idx) => {
            const nodeFrom = CITADEL_NODES.find((n) => n.id === link.from)!;
            const nodeTo = CITADEL_NODES.find((n) => n.id === link.to)!;
            return (
              <g key={idx}>
                <line
                  x1={nodeFrom.x}
                  y1={nodeFrom.y}
                  x2={nodeTo.x}
                  y2={nodeTo.y}
                  stroke="rgba(6,182,212,0.3)"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
              </g>
            );
          })}

          {/* Nodes */}
          {CITADEL_NODES.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            return (
              <g
                key={node.id}
                onClick={() => {
                  playTone(660, 0.04);
                  setSelectedNode(node);
                }}
                className="cursor-pointer transition-transform"
              >
                {/* Glow ring */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isSelected ? 22 : 16}
                  fill={node.color}
                  fillOpacity={isSelected ? 0.4 : 0.15}
                  stroke={node.color}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />
                <circle cx={node.x} cy={node.y} r="7" fill="#ffffff" />
                <text
                  x={node.x}
                  y={node.y + 30}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {node.name.split(' ')[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/20 flex items-center justify-between font-mono text-xs">
          <div>
            <div className="text-white font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>{selectedNode.name}</span>
            </div>
            <span className="text-slate-400 text-[11px]">{selectedNode.role}</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-bold">
            {selectedNode.status}
          </span>
        </div>
      )}
    </div>
  );
};

export default CitadelNetworkAtlas;
