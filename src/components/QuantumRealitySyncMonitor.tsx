import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Globe2,
  Radio,
  ShieldCheck,
  Cpu,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Lock,
  Search,
  ExternalLink,
  Sparkles,
  Zap,
  Terminal,
  FileCode2,
  Share2
} from 'lucide-react';
import { INITIAL_QUANTUM_SYNCS, QuantumRealitySyncRecord, deployQuantumSync } from '../data/quantumSyncData';
import { playAuditChime, playTone } from './AudioSynthesizer';

interface QuantumRealitySyncMonitorProps {
  onNavigate?: (tab: string) => void;
}

export const QuantumRealitySyncMonitor: React.FC<QuantumRealitySyncMonitorProps> = ({ onNavigate }) => {
  const [syncRecords, setSyncRecords] = useState<QuantumRealitySyncRecord[]>(INITIAL_QUANTUM_SYNCS);
  const [deployingRoom, setDeployingRoom] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'SEALED' | 'QUARANTINED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const handleTriggerDeploy = (roomId: string, currentStatus: 'ACTIVE' | 'SEALED' | 'QUARANTINED' | 'STANDBY') => {
    playTone(700, 0.08, 'sine');
    setDeployingRoom(roomId);

    setTimeout(() => {
      // Toggle or redeploy
      const newStatus = currentStatus === 'ACTIVE' ? 'SEALED' : currentStatus === 'SEALED' ? 'ACTIVE' : currentStatus;
      const updated = deployQuantumSync(roomId, newStatus);
      
      setSyncRecords((prev) =>
        prev.map((r) => (r.chamber === roomId ? updated : r))
      );
      setDeployingRoom(null);
      playAuditChime();
    }, 600);
  };

  const filtered = syncRecords.filter((r) => {
    const matchesFilter = activeFilter === 'ALL' || r.status === activeFilter;
    const matchesSearch =
      r.chamber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.roomNameTh.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.roomNameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.attestation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.pqcAlgorithm.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const activeCount = syncRecords.filter((r) => r.status === 'ACTIVE').length;
  const sealedCount = syncRecords.filter((r) => r.status === 'SEALED').length;
  const quarantinedCount = syncRecords.filter((r) => r.status === 'QUARANTINED').length;

  return (
    <div className="p-6 sm:p-8 rounded-[28px] bg-gradient-to-br from-[#0c1222] via-[#080c18] to-[#04060d] border border-cyan-500/25 backdrop-blur-2xl relative overflow-hidden shadow-2xl space-y-6 font-mono">
      {/* Background radial aura */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Globe2 className="w-4 h-4 text-cyan-400 animate-pulse" />
              18 CHAMBERS QUANTUM REALITY SYNC
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              POST-QUANTUM DILITHIUM-5
            </span>
            <span className="px-3 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs font-bold">
              SPHINCS+ ATTESTATION
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-cyan-400" />
            Chambers 00–17 &amp; Vault Reality Sync Pipeline
          </h2>
          <p className="text-xs text-zinc-300 max-w-3xl leading-relaxed">
            ระบบตรวจสอบการประสานสถานะความจริงเชิงควอนตัม (Quantum Reality Sync) ครอบคลุมทั้ง 18 ห้องปฏิบัติการและ Sovereign Vault เพื่อรับรองความเป็นหนึ่งเดียวตาม SSoT Δ0.0% ป้องกันการกลายพันธุ์ของโครงสร้างข้อมูล (Zero Unauthorized Mutation)
          </p>
        </div>

        {/* Global Summary Stats */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{activeCount} ACTIVE</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{sealedCount} SEALED</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>{quarantinedCount} QUARANTINED</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/50 border border-white/10 w-fit">
          {(['ALL', 'ACTIVE', 'SEALED', 'QUARANTINED'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => {
                playTone(600, 0.03);
                setActiveFilter(filter);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFilter === filter
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาห้องปฏิบัติการ, อัลกอริทึม, หรือแฮช..."
            className="pl-9 pr-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 w-full sm:w-72"
          />
        </div>
      </div>

      {/* Quantum Sync Chamber Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filtered.map((record) => {
          const isDeploying = deployingRoom === record.chamber;
          const statusColors = {
            ACTIVE: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
            SEALED: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/30',
            QUARANTINED: 'text-rose-300 bg-rose-500/15 border-rose-500/30',
            STANDBY: 'text-amber-300 bg-amber-500/15 border-amber-500/30'
          }[record.status];

          return (
            <motion.div
              key={record.chamber}
              whileHover={{ y: -2 }}
              className="p-4 rounded-2xl bg-black/40 border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3 relative group overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-black text-white">
                    {record.chamber}
                  </span>
                  <span className="text-[11px] font-bold text-zinc-300 truncate max-w-[130px]">
                    {record.roomNameEn}
                  </span>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors}`}>
                  {record.status}
                </span>
              </div>

              <div className="text-xs text-zinc-300 line-clamp-1 font-sans">
                {record.roomNameTh}
              </div>

              {/* Technical Specifications */}
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-white/5 space-y-1 text-[10px]">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>PQC Cryptography:</span>
                  <span className="text-cyan-300 font-semibold">{record.pqcAlgorithm}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Cryo Sub-Kelvin:</span>
                  <span className="text-amber-300 font-semibold">{record.currentTempMk} mK</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Attestation:</span>
                  <span className="text-emerald-300 truncate max-w-[140px]">{record.attestation}</span>
                </div>
              </div>

              {/* Merkle Leaf Hash snippet */}
              <div className="text-[9px] text-zinc-500 truncate select-all">
                Hash: {record.merkleLeafHash}
              </div>

              {/* Action: Deploy / Sync */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-[9px] text-zinc-500">
                  {new Date(record.timestamp).toLocaleTimeString('th-TH')} ICT
                </span>

                <button
                  onClick={() => handleTriggerDeploy(record.chamber, record.status)}
                  disabled={isDeploying}
                  className="px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold flex items-center gap-1.5 transition-all"
                >
                  <Zap className={`w-3 h-3 text-cyan-400 ${isDeploying ? 'animate-spin' : ''}`} />
                  <span>{isDeploying ? 'Deploying...' : 'Reality Sync'}</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
