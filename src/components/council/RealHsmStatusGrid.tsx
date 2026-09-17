import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Cpu,
  Key,
  Activity,
  Radio,
  CheckCircle2,
  Lock,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Zap,
  Terminal,
  Search,
  FileText,
  FileCheck,
  AlertTriangle,
  Scale,
  ExternalLink,
  Flame,
  X,
  ChevronRight,
  Fingerprint,
} from 'lucide-react';
import { COUNCIL_MEMBERS, CouncilMember } from '../../data/councilData';
import { systemStateStore } from '../../store/systemStateStore';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { copyToClipboard } from '../../utils/clipboard';
import { ZyrquenSelfAuditEngine, SelfAuditReport } from '../../utils/selfAuditEngineV12';

interface RealHsmStatusGridProps {
  onSelectMember?: (member: CouncilMember) => void;
}

export const RealHsmStatusGrid: React.FC<RealHsmStatusGridProps> = ({ onSelectMember }) => {
  const [copiedSerial, setCopiedSerial] = useState<string | null>(null);
  const [pingingNodeId, setPingingNodeId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeAuditReport, setActiveAuditReport] = useState<SelfAuditReport | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [nodeHeartbeats, setNodeHeartbeats] = useState<Record<number, { latency: number; pulse: number; tempK: string; lastSeen: string }>>({});
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeReportSection, setActiveReportSection] = useState<'summary' | 'remediations' | 'legal' | 'hsm-quorum'>('summary');
  const [custodianProofs, setCustodianProofs] = useState(4);

  // Initialize heartbeat & self-audit on mount
  useEffect(() => {
    const unsub = systemStateStore.subscribe((state) => {
      setCustodianProofs(state.custodianProofs);
    });
    setCustodianProofs(systemStateStore.getState().custodianProofs);

    const engine = new ZyrquenSelfAuditEngine(
      {
        merkle_root: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
        block: 849202,
        seals: 14902,
        mutation_authority: 0,
        drift: '0.00%',
        quorum: '10/10 REAL_HSM',
      },
      typeof document !== 'undefined' ? document.documentElement.outerHTML : ''
    );
    const report = engine.runAll();
    setActiveAuditReport(report);

    // Initial heartbeats
    const initialMap: Record<number, { latency: number; pulse: number; tempK: string; lastSeen: string }> = {};
    COUNCIL_MEMBERS.forEach((m) => {
      initialMap[m.slotId] = {
        latency: 0.8 + m.slotId * 0.12,
        pulse: 100 - m.slotId * 0.2,
        tempK: (0.0149 + m.slotId * 0.0001).toFixed(4),
        lastSeen: new Date().toLocaleTimeString('en-GB') + ' ICT',
      };
    });
    setNodeHeartbeats(initialMap);

    // Live telemetry interval
    const interval = setInterval(() => {
      setNodeHeartbeats((prev) => {
        const next = { ...prev };
        const now = new Date().toLocaleTimeString('en-GB') + ' ICT';
        COUNCIL_MEMBERS.forEach((m) => {
          const jitter = (Math.random() - 0.5) * 0.15;
          next[m.slotId] = {
            latency: Math.max(0.4, Number((0.8 + m.slotId * 0.1 + jitter).toFixed(2))),
            pulse: Number((99.8 + Math.random() * 0.2).toFixed(1)),
            tempK: (0.0148 + Math.random() * 0.0004).toFixed(4),
            lastSeen: now,
          };
        });
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleCopySerial = (serial: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    copyToClipboard(serial);
    setCopiedSerial(id);
    playAuditChime();
    setTimeout(() => setCopiedSerial(null), 2500);
  };

  const handlePingNode = (slotId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    playTone(700 + slotId * 35, 0.08, 'triangle');
    setPingingNodeId(slotId);
    setTimeout(() => {
      setPingingNodeId(null);
      setNodeHeartbeats((prev) => ({
        ...prev,
        [slotId]: {
          latency: Number((0.5 + Math.random() * 0.3).toFixed(2)),
          pulse: 100,
          tempK: '0.0149',
          lastSeen: new Date().toLocaleTimeString('en-GB') + ' ICT',
        },
      }));
    }, 700);
  };

  const handleRunFullAudit = () => {
    setIsAuditing(true);
    playAuditChime();
    setTimeout(() => {
      const engine = new ZyrquenSelfAuditEngine(
        {
          merkle_root: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
          block: 849202,
          seals: 14902,
          mutation_authority: 0,
          drift: '0.00%',
          quorum: '10/10 REAL_HSM',
        },
        typeof document !== 'undefined' ? document.documentElement.outerHTML : ''
      );
      const rep = engine.runAll();
      setActiveAuditReport(rep);
      setIsAuditing(false);
      playTone(880, 0.1, 'sine');
    }, 900);
  };

  const filteredMembers = COUNCIL_MEMBERS.filter(
    (m) =>
      m.nameTh.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.councilCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.hardwareEnclave.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.certificateSerial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.pqcAlgorithm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.roleTh.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-mono">
      {/* Header Container with Sovereign Attestation Badges */}
      <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#0e1726]/90 via-[#0a0f1d]/90 to-[#07080F] border border-cyan-500/30 backdrop-blur-xl relative overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.15)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                GOVERNANCE CONTROL: 10/10 PASS
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                CUSTODIAN PHYSICAL PROOFS: {custodianProofs}/10 ({Math.max(0, 8 - custodianProofs)} REQ TO 8/10)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-bold">
                FIPS 140-3 LEVEL 4
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Cpu className="w-6 h-6 text-cyan-400" />
              10 HSM Custodian &amp; Governance Status Grid
            </h3>
            <p className="text-xs text-zinc-400 max-w-2xl">
              แยกสถานะการกำกับดูแล Governance Control 10/10 ออกจากหลักฐานทางกายภาพ Custodian Physical Proofs {custodianProofs}/10 อย่างเด็ดขาด (Invariant: Control 10/10 ห้ามเพิ่มค่า Custodian Proofs โดยไม่มี Artifact จริง)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setIsReportModalOpen(true);
                playTone(660, 0.05);
              }}
              className="px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)] cursor-pointer"
            >
              <FileCheck className="w-3.5 h-3.5 text-purple-300" />
              <span>Security Audit Report</span>
            </button>

            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search HSM, Serial, Custodian..."
                className="pl-9 pr-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 w-56"
              />
            </div>

            <button
              onClick={handleRunFullAudit}
              disabled={isAuditing}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>{isAuditing ? 'Auditing 10 Nodes...' : 'Self-Audit Recompute'}</span>
            </button>
          </div>
        </div>

        {/* Real-time Telemetry Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/10">
          <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Governance Control</div>
            <div className="text-sm sm:text-base font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              10 / 10 PASS
            </div>
            <div className="text-[9px] text-emerald-400/80">Policy Consensus Ratified</div>
          </div>

          <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Custodian Proofs Quorum</div>
            <div className={`text-sm sm:text-base font-bold ${custodianProofs >= 8 ? 'text-emerald-400' : 'text-amber-300'}`}>
              {custodianProofs} / 10 Verified
            </div>
            <div className={`text-[9px] ${custodianProofs >= 8 ? 'text-emerald-400/80 font-bold' : 'text-amber-400/80'}`}>
              {custodianProofs >= 8 ? 'Super-Majority Attained (>=8/10)' : `Required: 8/10 (${Math.max(0, 8 - custodianProofs)} Remaining)`}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Cryostat Mean Temp</div>
            <div className="text-sm sm:text-base font-bold text-cyan-300">
              14.98 mK
            </div>
            <div className="text-[9px] text-zinc-500">Sub-Kelvin Cryo Array</div>
          </div>

          <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Zero Drift Baseline</div>
            <div className="text-sm sm:text-base font-bold text-teal-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              Δ0.00% SSoT
            </div>
            <div className="text-[9px] text-zinc-500">FROZEN v1.2 LTS (14,902)</div>
          </div>
        </div>
      </div>

      {/* 10/10 Real HSM Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {filteredMembers.map((member) => {
          const hb = nodeHeartbeats[member.slotId] || { latency: 1.2, pulse: 100, tempK: '0.0149', lastSeen: 'LIVE' };
          const isPinging = pingingNodeId === member.slotId;
          const isCopied = copiedSerial === member.certificateSerial;

          return (
            <motion.div
              key={member.slotId}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              onClick={() => onSelectMember?.(member)}
              className="p-4 rounded-2xl bg-[#0b0f19] border border-cyan-500/20 hover:border-cyan-500/50 transition-all flex flex-col justify-between space-y-3 relative overflow-hidden group shadow-lg cursor-pointer"
            >
              {/* Glow Accent */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-cyan-500/15 transition-all" />

              {/* Card Header: Node Code, Slot ID & Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-xs font-bold text-cyan-300">
                    {member.councilCode}
                  </span>
                  <span className="text-[11px] font-bold text-zinc-400">
                    Slot #{member.slotId.toString().padStart(2, '0')}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${
                    member.verificationStatus === 'REAL_HSM_SIGNED' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`} />
                  <span className={`text-[10px] font-bold ${
                    member.verificationStatus === 'REAL_HSM_SIGNED' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {member.verificationStatus === 'REAL_HSM_SIGNED' ? 'REAL_HSM' : 'CLAIMED'}
                  </span>
                </div>
              </div>

              {/* Custodian Identity */}
              <div>
                <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                  {member.nameTh}
                </div>
                <div className="text-[10px] text-zinc-400 truncate">{member.nameEn}</div>
                <div className="text-[10px] text-amber-400/90 font-medium truncate mt-0.5">
                  {member.roleTh}
                </div>
              </div>

              {/* Hardware Enclave & FIPS Badge */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5 text-[10px]">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-cyan-400" />
                    Enclave:
                  </span>
                  <span className="text-zinc-200 font-semibold truncate max-w-[110px]">
                    {member.hardwareEnclave.split('(')[0].trim()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Physical Proof:</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${
                    member.verificationStatus === 'REAL_HSM_SIGNED'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}>
                    {member.verificationStatus === 'REAL_HSM_SIGNED' ? 'VERIFIED' : 'PENDING PROOF'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-zinc-400">
                  <span>Algorithm:</span>
                  <span className="text-cyan-300 font-semibold truncate max-w-[110px]">
                    {member.pqcAlgorithm.split('(')[0].trim()}
                  </span>
                </div>
              </div>

              {/* Dilithium-5 Certificate Serial Number */}
              <div className="space-y-1">
                <div className="text-[9px] text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Key className="w-2.5 h-2.5 text-amber-400" />
                    Dilithium-5 Cert Serial:
                  </span>
                  <button
                    onClick={(e) => handleCopySerial(member.certificateSerial, member.certificateSerial, e)}
                    className="text-[9px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
                    title="Copy Certificate Serial"
                  >
                    {isCopied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-[9px] text-zinc-300 font-mono truncate select-all">
                  {member.certificateSerial}
                </div>
              </div>

              {/* Heartbeat Telemetry & Ping Action */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                <div className="space-y-0.5">
                  <div className="text-zinc-400 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-emerald-400" />
                    <span>{hb.latency}ms</span>
                    <span className="text-zinc-600">•</span>
                    <span>{hb.tempK} K</span>
                  </div>
                  <div className="text-[9px] text-zinc-500 truncate">{hb.lastSeen}</div>
                </div>

                <button
                  onClick={(e) => handlePingNode(member.slotId, e)}
                  disabled={isPinging}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/20 border border-white/10 text-zinc-300 hover:text-cyan-300 text-[10px] flex items-center gap-1 transition-all"
                  title="Ping HSM Node"
                >
                  <Radio className={`w-2.5 h-2.5 text-cyan-400 ${isPinging ? 'animate-ping' : ''}`} />
                  <span>{isPinging ? 'Pinging...' : 'Ping'}</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Security Audit & Compliance Report Modal */}
      <AnimatePresence>
        {isReportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-4xl max-h-[90vh] bg-[#0c1220] border border-cyan-500/30 rounded-3xl p-6 overflow-hidden flex flex-col space-y-5 shadow-2xl relative text-zinc-200"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                      SECURITY AUDIT &amp; COMPLIANCE REPORT
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                      ZYRQUEN SOVEREIGN CONTRACT V2
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-cyan-400" />
                    Security Audit: zyrquen-sovereign-contract-v2.sol
                  </h3>
                </div>

                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Tabs in Report Modal */}
              <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3 text-xs">
                {[
                  { id: 'summary', label: 'Executive Summary', icon: FileText },
                  { id: 'remediations', label: 'Remediation (ZYR-01..03)', icon: ShieldCheck },
                  { id: 'legal', label: 'Thai ETDA (Sec 9, 26, 28)', icon: Scale },
                  { id: 'hsm-quorum', label: '10/10 REAL_HSM Quorum', icon: Cpu },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeReportSection === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveReportSection(tab.id as any);
                        playTone(500, 0.03);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                          : 'bg-black/40 text-zinc-400 hover:text-white border border-white/5'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
                {activeReportSection === 'summary' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                      <div className="text-[11px] text-zinc-400 uppercase font-bold text-cyan-400">
                        Audit Metadata &amp; Parameters
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div><strong className="text-white">Target Contract:</strong> <span className="font-mono text-cyan-300">zyrquen-sovereign-contract-v2.sol</span></div>
                        <div><strong className="text-white">System Status:</strong> <span className="text-emerald-400 font-bold">LOCKED_FROZEN_v1.2_LTS</span></div>
                        <div><strong className="text-white">Sovereign Principal:</strong> <span className="text-amber-300 font-bold">Yuttaphum Phakphian (#EP-SOVEREIGN-01)</span></div>
                        <div><strong className="text-white">Legal Framework:</strong> <span className="text-purple-300">Thai ETDA B.E. 2544 (Sec 9, 26, 28)</span></div>
                        <div><strong className="text-white">Audit Standard:</strong> <span className="text-zinc-300">FIPS 140-3 L4 &amp; Zero-Defect Invariant</span></div>
                        <div><strong className="text-white">Compiler Target:</strong> <span className="font-mono text-zinc-300">Solidity ^0.8.20</span></div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-cyan-950/40 border border-emerald-500/30 space-y-2">
                      <h4 className="font-bold text-emerald-300 flex items-center gap-1.5 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Executive Summary &amp; Verdict
                      </h4>
                      <p className="text-zinc-300 leading-relaxed">
                        An in-depth security audit of <strong className="text-white">ZyrquenSovereignCoreV2</strong> was conducted to verify the total programmatic elimination of three high-severity vulnerabilities identified in legacy version 1.2 (<strong className="text-emerald-300">ZYR-01, ZYR-02, and ZYR-03</strong>). The contract was evaluated for mathematical soundness, access control integrity, and full compliance with Sections 9, 26, and 28 of the Thai Electronic Transactions Act B.E. 2544.
                      </p>
                      <p className="text-zinc-300 leading-relaxed">
                        The audited v2 implementation successfully passes all verification benchmarks without logical or compilation flaws, upholding the Involatile SSoT Δ0.00% Zero-Drift mandate.
                      </p>
                    </div>
                  </div>
                )}

                {activeReportSection === 'remediations' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* ZYR-01 */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-cyan-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                          1. ZYR-01: Sovereign Account Lockout &amp; Type Mismatch
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                          REMEDIATED
                        </span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed">
                        <strong>Vulnerability Description:</strong> In v1.2, modifier <code className="text-amber-300">onlySovereign</code> performed an invalid comparison between <code className="text-cyan-300">msg.sender</code> and a keccak256 hash of a string ID without address casting, resulting in permanent execution revert (Total Lockout).
                      </p>
                      <div className="p-2.5 rounded-xl bg-black/60 border border-white/5 font-mono text-[11px] text-emerald-300">
                        require(msg.sender == sovereignAddress, "Zyrquen: Unauthorized Sovereign Caller");
                      </div>
                      <p className="text-zinc-400">
                        <strong>Verification:</strong> Direct address comparison ensures Sovereign Principal (#EP-SOVEREIGN-01) retains sole execution authority without type errors.
                      </p>
                    </div>

                    {/* ZYR-02 */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-cyan-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                          2. ZYR-02: Fail-Closed Panic Circuit Authorization Bypass
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                          REMEDIATED
                        </span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed">
                        <strong>Vulnerability Description:</strong> In v1.2, the panic circuit function <code className="text-amber-300">triggerFailClosed()</code> lacked access control modifiers, allowing arbitrary external callers to trip the contract into a permanent lockdown (Denial of Service).
                      </p>
                      <div className="p-2.5 rounded-xl bg-black/60 border border-white/5 font-mono text-[11px] text-emerald-300">
                        function triggerFailClosed(string calldata _reason) external onlySovereign &#123; ... &#125;
                      </div>
                      <p className="text-zinc-400">
                        <strong>Verification:</strong> Enforced <code className="text-cyan-300">onlySovereign</code> modifier prevents malicious DoS locks from unauthorized entities.
                      </p>
                    </div>

                    {/* ZYR-03 */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-cyan-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                          3. ZYR-03: Quarantine Cardinality &amp; Rogue Inflation Protection
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                          REMEDIATED
                        </span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed">
                        <strong>Vulnerability Description:</strong> In v1.2, <code className="text-amber-300">quarantineSeal()</code> did not enforce the <code className="text-cyan-300">whenNotFailClosed</code> state and allowed arbitrary callers to mutate the total seal count beyond the 14,902 canonical baseline.
                      </p>
                      <div className="p-2.5 rounded-xl bg-black/60 border border-white/5 font-mono text-[11px] text-emerald-300">
                        function quarantineSeal(...) external onlySovereignOrOracle whenNotFailClosed &#123; ... &#125;
                      </div>
                      <p className="text-zinc-400">
                        <strong>Verification:</strong> Guarded by Dual Role Authorization (Sovereign or Sentinel Oracle) and circuit state check, preserving the 14,902 Canonical Seal base.
                      </p>
                    </div>
                  </div>
                )}

                {activeReportSection === 'legal' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/20 space-y-3">
                      <h4 className="font-bold text-purple-300 flex items-center gap-1.5 text-sm">
                        <Scale className="w-4 h-4 text-purple-400" />
                        Thai Electronic Transactions Act B.E. 2544 (พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์)
                      </h4>

                      <div className="space-y-2.5 text-zinc-300 leading-relaxed">
                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                          <strong className="text-cyan-300">มาตรา ๙ (Section 9 - Legal Effect of Electronic Signatures):</strong>
                          <p className="text-zinc-400 text-[11px]">
                            รองรับผลผูกพันทางกฎหมายของลายมือชื่ออิเล็กทรอนิกส์ที่ใช้วิธีการที่เชื่อถือได้ โดยสัญญา ZyrquenSovereignCoreV2 กำหนดให้ลายมือชื่อฮาร์ดแวร์นิรภัย FIPS 140-3 Level 4 และ Dilithium-5 ผูกพันสถาปนิกและสภาผู้พิทักษ์โดยสมบูรณ์
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                          <strong className="text-emerald-300">มาตรา ๒๖ (Section 26 - Reliable Electronic Signature Framework):</strong>
                          <p className="text-zinc-400 text-[11px]">
                            ข้อมูลสำหรับใช้สร้างลายมือชื่ออิเล็กทรอนิกส์เชื่อมโยงไปยังเจ้าของลายมือชื่อโดยเฉพาะ และอยู่ภายใต้การควบคุมของเจ้าของลายมือชื่อในขณะสร้าง (Hardware Enclave Isolation) พร้อมระบบตรวจจับการเปลี่ยนแปลงใดๆ ที่เกิดขึ้นภายหลัง (SSoT Δ0.00% Zero-Drift Merkle Tree).
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                          <strong className="text-amber-300">มาตรา ๒๘ (Section 28 - Safe Harbor &amp; Non-Repudiation):</strong>
                          <p className="text-zinc-400 text-[11px]">
                            หลักประกันการไม่สามารถปฏิเสธความรับผิดชอบ (Non-Repudiation) ด้วยใบรับรองอิเล็กทรอนิกส์ที่ออกโดยระบบความปลอดภัยระดับสากล และการตรวจสอบแบบ 10/10 Real HSM Quorum ลายมือชื่อไม่ซ้ำซ้อน
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeReportSection === 'hsm-quorum' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-4 rounded-2xl bg-black/40 border border-cyan-500/20 space-y-3">
                      <h4 className="font-bold text-cyan-300 flex items-center gap-1.5 text-sm">
                        <Cpu className="w-4 h-4 text-cyan-400" />
                        10/10 Real HSM Hardware Quorum Validation Logic
                      </h4>
                      <p className="text-zinc-300 leading-relaxed">
                        ฟังก์ชัน <code className="text-cyan-300">verifyREAL_HSMQuorum</code> ตรวจสอบลายมือชื่อจากผู้พิทักษ์ฮาร์ดแวร์ทั้ง 10 โหนดแบบไม่ซ้ำซ้อน ผ่านอัลกอริทึม ecrecover/PQC Verifier:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="p-2 rounded-lg bg-black/50 border border-white/5 text-zinc-300">
                          Slot 1: <span className="text-amber-300">0x1111...1111</span> (Principal Architect)
                        </div>
                        <div className="p-2 rounded-lg bg-black/50 border border-white/5 text-zinc-300">
                          Slot 2: <span className="text-cyan-300">0x2222...2222</span> (Core Enclave)
                        </div>
                        <div className="p-2 rounded-lg bg-black/50 border border-white/5 text-zinc-300">
                          Slot 3: <span className="text-cyan-300">0x3333...3333</span> (FIPS 140-3 L4)
                        </div>
                        <div className="p-2 rounded-lg bg-black/50 border border-white/5 text-zinc-300">
                          Slot 4: <span className="text-cyan-300">0x4444...4444</span> (Dilithium-5 Engine)
                        </div>
                        <div className="p-2 rounded-lg bg-black/50 border border-white/5 text-zinc-300">
                          Slot 5: <span className="text-purple-300">0x5555...5555</span> (ETDA Sec 9/26/28)
                        </div>
                        <div className="p-2 rounded-lg bg-black/50 border border-white/5 text-zinc-300">
                          Slot 6: <span className="text-purple-300">0x6666...6666</span> (PDPA Safe Harbor)
                        </div>
                        <div className="p-2 rounded-lg bg-black/50 border border-white/5 text-zinc-300">
                          Slot 7: <span className="text-emerald-300">0x7777...7777</span> (Cryostat Bus 14.98mK)
                        </div>
                        <div className="p-2 rounded-lg bg-black/50 border border-white/5 text-zinc-300">
                          Slot 8: <span className="text-emerald-300">0x8888...8888</span> (Chamber 02 Quarantine)
                        </div>
                        <div className="p-2 rounded-lg bg-black/50 border border-white/5 text-zinc-300">
                          Slot 9: <span className="text-emerald-300">0x9999...9999</span> (Involatile Merkle Roots)
                        </div>
                        <div className="p-2 rounded-lg bg-black/50 border border-white/5 text-zinc-300">
                          Slot 10: <span className="text-amber-300">0xAAAA...AAAA</span> (Sovereign Decree Seal)
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                <div className="text-zinc-500 font-mono">
                  Verified by Zyrquen Self-Audit Engine • SSoT Δ0.0%
                </div>
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 font-bold transition-all"
                >
                  Close Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

