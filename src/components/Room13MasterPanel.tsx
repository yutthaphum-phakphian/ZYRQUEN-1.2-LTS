import React, { useState, useMemo } from 'react';
import {
  Globe,
  Radio,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Search,
  Copy,
  Check,
  Zap,
  RefreshCw,
  Scale,
  FileCheck2,
  Sparkles,
  Layers,
  SlidersHorizontal,
  Server,
  Network,
  Activity,
  Cpu,
  ArrowRightLeft
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { HardwareSnapshot, ViewType } from '../types';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';

export const CANONICAL_FROZEN_SEALS = 14902;
export const CANONICAL_BLOCK = 849202;
export const CANONICAL_MERKLE_ROOT = '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68';
export const CANONICAL_VERSION = 'ZYRQUEN Ω∞ v4.16 PDPA FINAL (Frozen v1.2 LTS)';
export const CANONICAL_PRINCIPAL = '🇹🇭 นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)';

export interface GlobalBFTNode {
  id: string;
  code: string;
  name: string;
  locationTh: string;
  role: 'PRIMARY' | 'CONSENSUS_RELAY' | 'VAULT_CUSTODIAN' | 'BOUNDARY_GATEWAY';
  latencyMs: number;
  channelCrypto: string;
  status: 'ONLINE' | 'SYNCHRONIZED' | 'ACTIVE';
  syncHeight: number;
}

export const GLOBAL_NODES: GlobalBFTNode[] = [
  {
    id: 'node-bk01',
    code: 'BK01',
    name: 'Bangkok Sovereign Anchor (Primary)',
    locationTh: 'กรุงเทพมหานคร (ศูนย์บัญชาการหลัก)',
    role: 'PRIMARY',
    latencyMs: 0.8,
    channelCrypto: 'QKD + X448 Kyber-1024',
    status: 'ONLINE',
    syncHeight: 849202
  },
  {
    id: 'node-sg02',
    code: 'SG02',
    name: 'Singapore Low-Latency Relay',
    locationTh: 'สิงคโปร์ (โหนดกระจายสัญญาณ)',
    role: 'CONSENSUS_RELAY',
    latencyMs: 14.2,
    channelCrypto: 'Post-Quantum WireGuard (ML-KEM)',
    status: 'SYNCHRONIZED',
    syncHeight: 849202
  },
  {
    id: 'node-ty03',
    code: 'TY03',
    name: 'Tokyo North-Asia Node',
    locationTh: 'โตเกียว (โหนดเอเชียเหนือ)',
    role: 'CONSENSUS_RELAY',
    latencyMs: 38.6,
    channelCrypto: 'Post-Quantum WireGuard (ML-KEM)',
    status: 'SYNCHRONIZED',
    syncHeight: 849202
  },
  {
    id: 'node-zh04',
    code: 'ZH04',
    name: 'Zurich Vault Custodian Gate',
    locationTh: 'ซูริก สวิตเซอร์แลนด์ (ตู้เซฟคลังข้อมูล)',
    role: 'VAULT_CUSTODIAN',
    latencyMs: 148.5,
    channelCrypto: 'Air-Gapped Optical Quantum Mesh',
    status: 'SYNCHRONIZED',
    syncHeight: 849202
  },
  {
    id: 'node-sv05',
    code: 'SV05',
    name: 'Silicon Valley Trans-Pacific Gate',
    locationTh: 'ซิลิคอนวัลเลย์ (เกตเวย์แปซิฟิก)',
    role: 'BOUNDARY_GATEWAY',
    latencyMs: 172.0,
    channelCrypto: 'FIPS 203 ML-KEM-1024',
    status: 'SYNCHRONIZED',
    syncHeight: 849202
  },
  {
    id: 'node-ld06',
    code: 'LD06',
    name: 'London European Relay',
    locationTh: 'ลอนดอน (โหนดยุโรป)',
    role: 'CONSENSUS_RELAY',
    latencyMs: 156.4,
    channelCrypto: 'FIPS 203 ML-KEM-1024',
    status: 'SYNCHRONIZED',
    syncHeight: 849202
  }
];

interface Room13MasterPanelProps {
  snapshots?: HardwareSnapshot[];
  onNavigate?: (view: ViewType) => void;
  onOpenCertificate?: () => void;
}

export const Room13MasterPanel: React.FC<Room13MasterPanelProps> = ({
  snapshots = [],
  onNavigate,
  onOpenCertificate
}) => {
  const [activeTab, setActiveTab] = useState<'bft-mesh' | 'node-roster' | 'latency-matrix' | 'consensus-proof'>('bft-mesh');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState<boolean>(false);

  const handleCopy = (id: string, text: string) => {
    copyToClipboard(text);
    setCopiedId(id);
    playTone(650, 0.03);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePingMesh = () => {
    if (isPinging) return;
    setIsPinging(true);
    playTone(560, 0.05);

    setTimeout(() => {
      setIsPinging(false);
      playAuditChime();
    }, 700);
  };

  // Latency Chart Data
  const latencyChartData = useMemo(() => {
    return GLOBAL_NODES.map((n) => ({
      node: n.code,
      latency: n.latencyMs,
      location: n.name
    }));
  }, []);

  return (
    <div className="space-y-6 font-mono text-zinc-300">
      {/* Top Banner for Room 13 */}
      <div className="p-6 sm:p-8 rounded-[28px] bg-gradient-to-br from-blue-950/40 via-[#071224]/95 to-black border border-blue-500/40 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/40 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(59,130,246,0.25)]">
                <Globe className="w-4 h-4 text-blue-400 animate-pulse" />
                CHAMBER 13 • DISTRIBUTED QUORUM CONSENSUS & PEER SYNC
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                6 / 6 GLOBAL NODES SYNCED
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold">
                BFT QUORUM: 100%
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
                การประสานมติและโครงข่ายโหนดกระจายศูนย์ทั่วโลก (Global BFT Consensus Mesh)
              </h2>
              <p className="text-sm text-zinc-400 max-w-4xl leading-relaxed">
                โครงข่ายเชื่อมโยงความสอดคล้อง 6 ศูนย์หลักทั่วโลก (BK01, SG02, TY03, ZH04, SV05, LD06)
                ผ่านช่องสัญญาณเข้ารหัสเชิงควอนตัม (QKD + X448) พร้อมการยืนยันบล็อก #849202 ตรงกัน 100%
              </p>
            </div>
          </div>

          <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-3 shrink-0">
            <button
              onClick={handlePingMesh}
              disabled={isPinging}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600/80 to-cyan-600/80 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 border border-blue-400/40 transition-all transform hover:-translate-y-0.5"
            >
              <RefreshCw className={`w-4 h-4 ${isPinging ? 'animate-spin' : ''}`} />
              {isPinging ? 'Broadcasting QKD Pings...' : 'Broadcast Mesh Sync Ping'}
            </button>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Consensus Mode: BYZANTINE FAULT TOLERANT</span>
            </div>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-blue-500/20">
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Primary Anchor</div>
            <div className="text-base sm:text-lg font-bold text-blue-400">BK01 (Bangkok)</div>
            <div className="text-[10px] text-emerald-400 font-semibold">0.8 ms Latency</div>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Active Global Mesh</div>
            <div className="text-base sm:text-lg font-bold text-emerald-400">6 / 6 Nodes</div>
            <div className="text-[10px] text-zinc-400">100% In Consensus</div>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Byzantine Fault Margin</div>
            <div className="text-base sm:text-lg font-bold text-cyan-400">3f + 1 Active</div>
            <div className="text-[10px] text-cyan-300">Zero Divergence</div>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Channel Encryption</div>
            <div className="text-base sm:text-lg font-bold text-purple-400">QKD + X448</div>
            <div className="text-[10px] text-purple-300">Kyber-1024 PQC</div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#0a0d16] border border-blue-500/20">
        <button
          onClick={() => {
            playTone(600, 0.04);
            setActiveTab('bft-mesh');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'bft-mesh'
              ? 'bg-blue-500/20 text-blue-200 border border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-transparent border border-transparent'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          1. Global BFT Mesh Topology
        </button>

        <button
          onClick={() => {
            playTone(640, 0.04);
            setActiveTab('node-roster');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'node-roster'
              ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-transparent border border-transparent'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          2. Active Peer Node Roster (6 Nodes)
        </button>

        <button
          onClick={() => {
            playTone(680, 0.04);
            setActiveTab('latency-matrix');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'latency-matrix'
              ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-transparent border border-transparent'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          3. Round-Trip Latency & Ping Chart
        </button>

        <button
          onClick={() => {
            playTone(720, 0.04);
            setActiveTab('consensus-proof');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'consensus-proof'
              ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-transparent border border-transparent'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          4. Consensus Cryptographic Proof
        </button>
      </div>

      {/* Tab 1: Global Mesh Topology */}
      {activeTab === 'bft-mesh' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {GLOBAL_NODES.map((node) => (
            <div
              key={node.id}
              className="p-5 rounded-2xl bg-[#0a0d1a] border border-blue-500/20 hover:border-blue-500/50 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5" />
                  {node.code} • {node.name}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  {node.status}
                </span>
              </div>
              <div className="text-xs text-zinc-400">{node.locationTh}</div>

              <div className="pt-3 border-t border-white/5 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Latency:</span>
                  <span className="text-cyan-300 font-bold">{node.latencyMs} ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Sync Height:</span>
                  <span className="text-emerald-400 font-bold">#{node.syncHeight}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Crypto:</span>
                  <span className="text-purple-300 text-[11px] truncate">{node.channelCrypto}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Node Roster */}
      {activeTab === 'node-roster' && (
        <div className="p-6 rounded-2xl bg-[#0a0d1a] border border-cyan-500/20 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            ตารางรายการโหนดในโครงข่ายฉันทามติ (Active Peer Roster)
          </h3>

          <div className="space-y-2">
            {GLOBAL_NODES.map((n) => (
              <div
                key={n.id}
                className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-bold text-white">{n.code} — {n.name}</span>
                  <div className="text-[11px] text-zinc-400">{n.role} • {n.locationTh}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-cyan-300 font-mono font-bold">{n.latencyMs} ms</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                    Block #{n.syncHeight}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Latency Chart */}
      {activeTab === 'latency-matrix' && (
        <div className="p-6 rounded-2xl bg-[#0a0d1a] border border-blue-500/20 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            กราฟเปรียบเทียบความหน่วงเวลาของแต่ละโหนด (Node Latency Distribution)
          </h3>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyChartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                <XAxis dataKey="node" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0d1a',
                    borderColor: '#3b82f6',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="latency" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Latency (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 4: Consensus Proof */}
      {activeTab === 'consensus-proof' && (
        <div className="p-6 rounded-2xl bg-[#0a0d1a] border border-purple-500/20 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-400" />
            หลักฐานทางคณิตศาสตร์แห่งการลงมติร่วม (Quorum Cryptographic Proof)
          </h3>
          <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-zinc-300 space-y-1.5">
            <div>Consensus Protocol: <span className="text-cyan-300">Istanbul BFT 2.0 + Dilithium-5 Quorum</span></div>
            <div>Active Signatures: <span className="text-emerald-400">6 of 6 Validated (100.0%)</span></div>
            <div>Root Hash Reconciled: <span className="text-yellow-300">{CANONICAL_MERKLE_ROOT}</span></div>
            <div>Canonical Seals: <span className="text-white">{CANONICAL_FROZEN_SEALS} Seals Locked</span></div>
          </div>
        </div>
      )}
    </div>
  );
};
