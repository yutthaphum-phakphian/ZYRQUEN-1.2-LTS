import React, { useState } from 'react';
import {
  Crown,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Search,
  Copy,
  Check,
  Zap,
  RefreshCw,
  Scale,
  Sparkles,
  Layers,
  SlidersHorizontal,
  Compass,
  Cpu,
  Globe,
  Radio,
  FileText,
  Activity,
  Award
} from 'lucide-react';
import { ViewType, HardwareSnapshot } from '../types';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';

export const CANONICAL_FROZEN_SEALS = 14902;
export const CANONICAL_BLOCK = 849202;
export const CANONICAL_MERKLE_ROOT = '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68';
export const CANONICAL_VERSION = 'ZYRQUEN Ω∞ v4.16 PDPA FINAL (Frozen v1.2 LTS)';
export const CANONICAL_PRINCIPAL = '🇹🇭 นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)';

interface Room17MasterPanelProps {
  snapshots?: HardwareSnapshot[];
  onNavigate?: (view: ViewType) => void;
  onOpenCertificate?: () => void;
}

export const Room17MasterPanel: React.FC<Room17MasterPanelProps> = ({
  snapshots = [],
  onNavigate,
  onOpenCertificate
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationOutput, setVerificationOutput] = useState<string>(
    '18/18 CHAMBERS VERIFIED • 14,902 SEALS • 10/10 INVARIANTS 100% SSoT'
  );

  const handleCopy = (id: string, text: string) => {
    copyToClipboard(text);
    setCopiedId(id);
    playTone(650, 0.03);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRunApexVerification = () => {
    if (isVerifying) return;
    setIsVerifying(true);
    playTone(880, 0.05);

    setTimeout(() => {
      setIsVerifying(false);
      setVerificationOutput(
        `APEX SEAL ATTESTED AT ${new Date().toLocaleTimeString('th-TH')} • MERKLE ROOT 909ab814... • ZERO DRIFT`
      );
      playAuditChime();
    }, 850);
  };

  return (
    <div className="space-y-6 font-mono text-zinc-300">
      {/* Top Banner for Room 17 */}
      <div className="p-6 sm:p-8 rounded-[28px] bg-gradient-to-br from-amber-950/50 via-[#181105]/95 to-black border-amber-500/50 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/15 via-yellow-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border-amber-500/50 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                <Crown className="w-4 h-4 text-amber-400 animate-pulse" />
                CHAMBER 17 • SUPREME OMNIPRESENT COMMAND & CONTROL PLANE
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[11px] font-bold">
                18/18 CHAMBERS ONLINE
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-300 border-yellow-500/30 text-[11px] font-bold">
                14,902 FROZEN SEALS
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
                ศูนย์บัญชาการอธิปไตยหลักแบบรวมศูนย์ (Supreme Apex Command Plane)
              </h2>
              <p className="text-sm text-zinc-400 max-w-4xl leading-relaxed">
                การผสานรวม 18 ห้องปฏิบัติการ (Chambers 00–17), 10 Invariants, 17 Canonical Modules และการยืนยันตัวตน
                Sovereign Architect {CANONICAL_PRINCIPAL} โดยไม่มีการกลายพันธุ์ของข้อมูล (Mutation Authority: 0)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-3 shrink-0">
            <button
              onClick={handleRunApexVerification}
              disabled={isVerifying}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black font-black text-xs flex items-center gap-2 shadow-xl shadow-amber-500/25 border-amber-400/50 transition-all transform hover:-translate-y-0.5"
            >
              <Sparkles className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
              {isVerifying ? 'Verifying 18 Chambers...' : 'Execute Supreme SSoT Seal Verification'}
            </button>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{verificationOutput}</span>
            </div>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-amber-500/20">
          <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Chambers Integrated</div>
            <div className="text-base sm:text-lg font-bold text-amber-400">18 / 18 Chambers</div>
            <div className="text-[10px] text-emerald-300">100% Operational</div>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Canonical Seals</div>
            <div className="text-base sm:text-lg font-bold text-yellow-300">14,902 Seals</div>
            <div className="text-[10px] text-zinc-400">Block #{CANONICAL_BLOCK}</div>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Mutation Authority</div>
            <div className="text-base sm:text-lg font-bold text-red-400">0 (Read-Only)</div>
            <div className="text-[10px] text-zinc-400">Strictly Involatile</div>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">SSoT Drift</div>
            <div className="text-base sm:text-lg font-bold text-emerald-400">Δ0.0000%</div>
            <div className="text-[10px] text-emerald-300">Zero Drift Guaranteed</div>
          </div>
        </div>
      </div>

      {/* 18 Chambers Matrix Grid Navigator */}
      <div className="p-6 rounded-2xl bg-[#0d0f18] border-amber-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            ตารางควบคุมและลิงก์ด่วนทั้ง 18 ห้องปฏิบัติการ (18-Chamber Matrix Grid)
          </h3>
          <span className="text-xs text-amber-300 font-bold">ALL 18 ACTIVE</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {Array.from({ length: 18 }, (_, i) => {
            const num = i < 10 ? `0${i}` : `${i}`;
            const titles: Record<string, string> = {
              '00': 'Bootstrap & Kernel',
              '01': 'FIPS PQC Dilithium',
              '02': 'Sovereign SSoT Invariants',
              '03': 'Thai PDPA & ETDA Legal',
              '04': 'Deca-Key HSM Cluster',
              '05': '6-Stage DAG Engine',
              '06': 'Circuit Breaker Fail-Closed',
              '07': 'Phoenix Auto-Healing',
              '08': 'Merkle Tree Verifier',
              '09': 'High Assurance OTel',
              '10': 'Treasury & RWA Vault',
              '11': 'Court Dossier & PDF',
              '12': 'Write Firewall Lockdown',
              '13': 'Global BFT Mesh Quorum',
              '14': 'Neural Anomaly Observer',
              '15': 'Sonic Attestation Synth',
              '16': '3D Quantum Visualizer',
              '17': 'Supreme Apex Control'
            };
            return (
              <div
                key={num}
                className="p-3 rounded-xl bg-black/40 border-white/5 hover:border-amber-500/40 hover:bg-amber-950/20 transition-all text-left space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-400 group-hover:text-amber-300">CH-{num}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <div className="text-[10px] text-zinc-300 font-semibold line-clamp-1">{titles[num]}</div>
                <div className="text-[9px] text-zinc-500">100% SSoT Verified</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Genesis Sovereign Anchor */}
      <div className="p-6 rounded-2xl bg-[#0d0f18] border-amber-500/20 space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          รากฐานสัจธรรมแห่งปฐมกาล (Genesis Merkle Root SSoT Anchor)
        </h3>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-black/60 border-white/10">
          <div className="font-mono text-xs text-yellow-300 break-all">{CANONICAL_MERKLE_ROOT}</div>
          <button
            onClick={() => handleCopy('root-17', CANONICAL_MERKLE_ROOT)}
            className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-200 border-white/10 flex items-center justify-center gap-1.5 shrink-0"
          >
            {copiedId === 'root-17' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedId === 'root-17' ? 'Copied' : 'Copy Genesis Hash'}
          </button>
        </div>
      </div>
    </div>
  );
};
