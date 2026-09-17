import React, { useState } from 'react';
import { Share2, Globe, Database, HardDrive, Wifi, Server, CheckCircle2, ArrowUpRight, Layers, ShieldCheck, TrendingDown, Sparkles } from 'lucide-react';
import { playTone } from '../AudioSynthesizer';
import { ChambersExplorer } from '../ChambersExplorer';
import { QuantumReliabilitySuite } from '../QuantumReliabilitySuite';
import { FederationKnowledgeDriftHeatmap } from '../FederationKnowledgeDriftHeatmap';
import { InfinityNexusPortal } from '../InfinityNexusPortal';
import { SupremeEternumNexusCodex } from '../SupremeEternumNexusCodex';
import { SupremeWarpCivilizationEngine } from '../SupremeWarpCivilizationEngine';
import { SovereignAuditDashboard } from '../SovereignAuditDashboard';

export const NexusView: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'nexus_portal' | 'warp_civilization' | 'codex_hub' | 'federation_drift' | 'chambers_explorer' | 'reliability_suite' | 'mesh' | 'audit_dashboard'>('nexus_portal');
  const [selectedRegion, setSelectedRegion] = useState<string>('bkk');

  const nodes = [
    { id: 'bkk', code: 'ASEAN-BK01', location: 'Bangkok Sovereign Node', ping: '1.2ms', status: 'PRIMARY', throughput: '4.2 GB/s', role: 'Civilization Intelligence Master' },
    { id: 'sin', code: 'ASEAN-SG01', location: 'Singapore Quantum Grid', ping: '14.8ms', status: 'ACTIVE', throughput: '3.1 GB/s', role: 'Regional Low-Latency Cache' },
    { id: 'tyo', code: 'APAC-TY01', location: 'Tokyo Vector Codex Node', ping: '42.1ms', status: 'ACTIVE', throughput: '2.8 GB/s', role: 'High-Density 768-D Shard' },
    { id: 'fra', code: 'EU-FR01', location: 'Frankfurt Post-Quantum Gateway', ping: '128.4ms', status: 'ACTIVE', throughput: '1.9 GB/s', role: 'Cross-Domain Treaty Bridge' },
    { id: 'iad', code: 'US-VA01', location: 'Virginia Cloud Run Replica', ping: '184.2ms', status: 'ACTIVE', throughput: '2.4 GB/s', role: 'Disaster Recovery Warm Mirror' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-x-hidden animate-in fade-in duration-300 max-[479px]:p-[12px] max-[479px]:space-y-3">
      {/* View Switcher Ribbon */}
      <div className="flex flex-wrap items-center gap-2 bg-zinc-950/80 border border-zinc-800/80 p-2 rounded-2xl max-[479px]:p-[12px] max-[479px]:grid max-[479px]:grid-cols-1 max-[479px]:gap-2">
        <button
          onClick={() => {
            playTone(600, 0.03);
            setActiveMode('nexus_portal');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 max-[479px]:w-full max-[479px]:justify-start max-[479px]:py-2.5 max-[479px]:px-3 ${
            activeMode === 'nexus_portal'
              ? 'bg-[#0a0f1e] text-[#D4AF37] border border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.25)]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <span>0. Infinity Nexus Portal &amp; Universal API Federation</span>
        </button>

        <button
          onClick={() => {
            playTone(600, 0.03);
            setActiveMode('warp_civilization');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 max-[479px]:w-full max-[479px]:justify-start max-[479px]:py-2.5 max-[479px]:px-3 ${
            activeMode === 'warp_civilization'
              ? 'bg-[#0a0f1e] text-[#D4AF37] border border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.25)]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>🌌 Supreme Warp Civilization Engine</span>
        </button>

        <button
          onClick={() => {
            playTone(600, 0.03);
            setActiveMode('codex_hub');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 max-[479px]:w-full max-[479px]:justify-start max-[479px]:py-2.5 max-[479px]:px-3 ${
            activeMode === 'codex_hub'
              ? 'bg-[#0a0f1e] text-[#D4AF37] border border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.25)]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>📑 Supreme Eternum Codex &amp; Merkle Hub</span>
        </button>

        <button
          onClick={() => {
            playTone(600, 0.03);
            setActiveMode('federation_drift');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 max-[479px]:w-full max-[479px]:justify-start max-[479px]:py-2.5 max-[479px]:px-3 ${
            activeMode === 'federation_drift'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <TrendingDown className="w-4 h-4 text-cyan-400" />
          <span>1. Federation Knowledge Drift &amp; Runtimes (v13/v14)</span>
        </button>

        <button
          onClick={() => {
            playTone(600, 0.03);
            setActiveMode('chambers_explorer');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 max-[479px]:w-full max-[479px]:justify-start max-[479px]:py-2.5 max-[479px]:px-3 ${
            activeMode === 'chambers_explorer'
              ? 'bg-[#D4AF37]/20 text-[#FACC15] border border-[#D4AF37] shadow'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>2. 18 Chambers SSoT Explorer &amp; Notes</span>
        </button>

        <button
          onClick={() => {
            playTone(600, 0.03);
            setActiveMode('reliability_suite');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 max-[479px]:w-full max-[479px]:justify-start max-[479px]:py-2.5 max-[479px]:px-3 ${
            activeMode === 'reliability_suite'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500 shadow'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>3. Quantum Reliability Suite &amp; Forensics</span>
        </button>

        <button
          onClick={() => {
            playTone(600, 0.03);
            setActiveMode('mesh');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 max-[479px]:w-full max-[479px]:justify-start max-[479px]:py-2.5 max-[479px]:px-3 ${
            activeMode === 'mesh'
              ? 'bg-blue-950 text-blue-300 border border-blue-500 shadow'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>4. Global Data Fabric &amp; Nodes Mesh</span>
        </button>

        <button
          onClick={() => {
            playTone(880, 0.03);
            setActiveMode('audit_dashboard');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 max-[479px]:w-full max-[479px]:justify-start max-[479px]:py-2.5 max-[479px]:px-3 ${
            activeMode === 'audit_dashboard'
              ? 'bg-[#0a0f1e] text-[#06B6D4] border border-[#06B6D4] shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>🏛️</span>
          <span>5. Sovereign Audit Dashboard</span>
        </button>
      </div>

      {activeMode === 'nexus_portal' && (
        <InfinityNexusPortal />
      )}

      {activeMode === 'warp_civilization' && (
        <SupremeWarpCivilizationEngine />
      )}

      {activeMode === 'codex_hub' && (
        <SupremeEternumNexusCodex />
      )}

      {activeMode === 'federation_drift' && (
        <FederationKnowledgeDriftHeatmap />
      )}

      {activeMode === 'chambers_explorer' && (
        <ChambersExplorer />
      )}

      {activeMode === 'reliability_suite' && (
        <QuantumReliabilitySuite />
      )}

      {activeMode === 'audit_dashboard' && (
        <div className="w-full min-w-0 max-w-full overflow-x-hidden max-[479px]:p-[12px]">
          <SovereignAuditDashboard />
        </div>
      )}

      {activeMode === 'mesh' && (
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#0d1428]/90 via-[#0b0e1a]/80 to-[#07080F] border border-white/8 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-mono">
                  GLOBAL DATA FABRIC
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-mono">
                  100% REGIONAL SYNC
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-mono font-bold text-white mt-1">
                Global Data Fabric & Network Nodes Mesh
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Distributed Vector Store • 768 Dimensions • Real-Time OTLP Protocol Streams • 1.4 TB / 10 TB Allocated
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3.5 py-2 rounded-2xl bg-white/4 border border-white/8 text-xs font-mono">
                <span className="text-zinc-500 block text-[10px]">CACHE HIT RATIO</span>
                <span className="text-emerald-400 font-bold text-sm">98.2% (1.4 TB)</span>
              </div>
              <div className="px-3.5 py-2 rounded-2xl bg-white/4 border border-white/8 text-xs font-mono">
                <span className="text-zinc-500 block text-[10px]">GLOBAL BANDWIDTH</span>
                <span className="text-cyan-400 font-bold text-sm">14.4 GB/s</span>
              </div>
            </div>
          </div>

          {/* Global Regional Nodes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nodes.map((node) => {
              const isSelected = selectedRegion === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => {
                    playTone(500, 0.04);
                    setSelectedRegion(node.id);
                  }}
                  className={`p-5 rounded-[24px] border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'bg-blue-950/20 border-blue-500/40 shadow-[0_0_25px_rgba(59,130,246,0.15)]'
                      : 'bg-[#0b0e1a]/70 border-white/8 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-blue-400">{node.code}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono">
                      {node.status}
                    </span>
                  </div>

                  <div>
                    <div className="text-sm font-mono font-bold text-zinc-100">{node.location}</div>
                    <div className="text-xs text-zinc-400 font-mono mt-0.5">{node.role}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs font-mono">
                    <div>
                      <span className="text-zinc-500 text-[10px] block">PING LATENCY</span>
                      <span className="text-zinc-200 font-semibold">{node.ping}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] block">THROUGHPUT</span>
                      <span className="text-cyan-400 font-semibold">{node.throughput}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vector Store 768-D & Memory Codex */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-[28px] bg-[#0b0e1a]/70 border border-white/8 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
                  Vector Codex & High-Density Embeddings
                </span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  768-D HNSW INDEX
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3 font-mono text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Total Indexed Vectors:</span>
                  <span className="text-white font-bold">1,849,202 vectors</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Dimension Depth:</span>
                  <span className="text-cyan-400 font-bold">768 Float32</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Approx Nearest Neighbor Latency:</span>
                  <span className="text-emerald-400 font-bold">0.42 ms</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Similarity Metric:</span>
                  <span className="text-zinc-200 font-bold">Cosine + Dot Product</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-mono text-zinc-400">Vector Storage Distribution</div>
                <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden flex">
                  <div className="h-full bg-cyan-500" style={{ width: '45%' }} title="Knowledge Fabric (45%)" />
                  <div className="h-full bg-violet-500" style={{ width: '30%' }} title="Episodic Memory (30%)" />
                  <div className="h-full bg-amber-500" style={{ width: '15%' }} title="Policy Rules (15%)" />
                  <div className="h-full bg-emerald-500" style={{ width: '10%' }} title="Free Buffer (10%)" />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-zinc-500 pt-1">
                  <span>Knowledge (45%)</span>
                  <span>Episodic (30%)</span>
                  <span>Policy (15%)</span>
                  <span>Buffer (10%)</span>
                </div>
              </div>
            </div>

            {/* Real-time Data Transformation Streams */}
            <div className="p-6 rounded-[28px] bg-[#0b0e1a]/70 border border-white/8 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
                  Active Data Pipeline Chains
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  ETL STREAMING
                </span>
              </div>

              <div className="space-y-2">
                {[
                  { name: 'OTel Metric Ingest Pipeline', speed: '12,400 ev/sec', status: 'STREAMING', latency: '2.1ms' },
                  { name: 'Knowledge Graph Semantic Linker', speed: '340 claims/sec', status: 'STREAMING', latency: '4.8ms' },
                  { name: 'Merkle Leaf Hash Generation', speed: '1,024 blocks/sec', status: 'VERIFIED', latency: '0.8ms' },
                  { name: 'Vector Embedding Batch Sync', speed: '500 docs/sec', status: 'SYNCHRONIZED', latency: '12ms' },
                ].map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <div className="font-bold text-zinc-200">{p.name}</div>
                      <div className="text-[11px] text-zinc-500">{p.speed} • {p.latency}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px]">
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

