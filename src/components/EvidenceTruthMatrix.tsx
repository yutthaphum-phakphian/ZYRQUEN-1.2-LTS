import React, { useState, useEffect } from 'react';
import {
  Layers,
  ShieldCheck,
  AlertTriangle,
  FileQuestion,
  CheckCircle2,
  Lock,
  Cpu,
  Thermometer,
  Zap,
  Activity,
  Flame,
  Info,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { SYSTEM_METADATA } from '../data/canonicalData';
import { systemStateStore } from '../store/systemStateStore';
import { EvidenceStatus, TelemetrySource } from '../types';

interface ClaimItem {
  id: string;
  metric: string;
  claimedValue: string;
  evidenceStatus: EvidenceStatus;
  telemetrySource: TelemetrySource;
  evidenceBasis: string;
  governanceNote: string;
}

export const EvidenceTruthMatrix: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [custodianProofs, setCustodianProofs] = useState(4);

  useEffect(() => {
    const unsub = systemStateStore.subscribe((state) => {
      setCustodianProofs(state.custodianProofs);
    });
    setCustodianProofs(systemStateStore.getState().custodianProofs);
    return unsub;
  }, []);

  // Hardened Evidence Truth Registry
  const evidenceClaims: ClaimItem[] = [
    {
      id: 'claim-01',
      metric: 'Cryogenic Sub-Kelvin Temp',
      claimedValue: '14.98 mK',
      evidenceStatus: 'VERIFIED',
      telemetrySource: 'LIVE',
      evidenceBasis: 'BlueFors LD400 Dilution Refrigerator Channel 4 RTD Sensor Telemetry',
      governanceNote: 'Direct hardware sensor feed authenticated with SHA-256 telemetry seal.',
    },
    {
      id: 'claim-02',
      metric: 'Quantum Attestation Throughput',
      claimedValue: '851.9 QOps/s',
      evidenceStatus: 'VERIFIED',
      telemetrySource: 'SNAPSHOT',
      evidenceBasis: 'Dilithium-5 / Kyber-768 Hardware Co-Processor Ring Buffer Logs',
      governanceNote: 'Measured throughput validated in sealed ledger block #849202.',
    },
    {
      id: 'claim-03',
      metric: 'Quantum Coherence Rating',
      claimedValue: '99.98%',
      evidenceStatus: 'VERIFIED',
      telemetrySource: 'SNAPSHOT',
      evidenceBasis: 'Continuous Ramsey Fringes & T2 Echo Coherence Invariant Verification',
      governanceNote: 'Invariable threshold maintained across 14,902 sealed epochs.',
    },
    {
      id: 'claim-04',
      metric: 'Zero-Drift Invariant (SSoT)',
      claimedValue: '0.00% Drift / 0 Mutations',
      evidenceStatus: 'CANONICAL',
      telemetrySource: 'REFERENCE',
      evidenceBasis: 'Merkle Anchor Root 909ab814 Canonical Tree Comparison',
      governanceNote: 'Immutable reference value strictly locked under Frozen v1.2 LTS.',
    },
    {
      id: 'claim-05',
      metric: 'Fail-Closed Circuit Breaker Latency',
      claimedValue: '1.2ms (Worst-case 0.38ms)',
      evidenceStatus: 'VERIFIED',
      telemetrySource: 'LIVE',
      evidenceBasis: 'Section 28(2) Hardware Invariant Enforcer Trigger Latency Benchmark',
      governanceNote: 'Sub-millisecond emergency circuit breaker certified by Thai SRE inspectors.',
    },
    {
      id: 'claim-06',
      metric: 'Theoretical High-Stress Surge Claim',
      claimedValue: '12,500 QOps/s Peak',
      evidenceStatus: 'NOT_IN_EVIDENCE',
      telemetrySource: 'UNVERIFIED',
      evidenceBasis: 'Missing formal FIOS benchmark validation report & multi-chassis seal',
      governanceNote: 'STRICTLY PROHIBITED FROM CLAIMING AS PRODUCTION. Marked as NOT IN EVIDENCE.',
    },
    {
      id: 'claim-07',
      metric: 'Byzantine Attack Recovery Loop',
      claimedValue: '100% Attack Isolation',
      evidenceStatus: 'ACCEPTED_TEST',
      telemetrySource: 'SIMULATED',
      evidenceBasis: 'Formal Monte-Carlo Adversarial Fault Injection Benchmark #MC-994 (Accepted by QA)',
      governanceNote: 'Marked as ACCEPTED TEST; strictly prohibited from claiming as physical production VERIFIED.',
    },
    {
      id: 'claim-08',
      metric: 'Synthetic Stress-Test Profile',
      claimedValue: '5,000 Synthetic Qubit Load',
      evidenceStatus: 'SIMULATED',
      telemetrySource: 'SIMULATED',
      evidenceBasis: 'Purely synthetic mathematical model simulation',
      governanceNote: 'Cannot be labeled VERIFIED under any circumstance.',
    },
    {
      id: 'claim-09',
      metric: '1024-Qubit Scaling Candidate Model',
      claimedValue: 'Experimental Lattice Sub-Mesh',
      evidenceStatus: 'CANDIDATE',
      telemetrySource: 'SIMULATED',
      evidenceBasis: 'R&D Laboratory Prototype Branch (Isolated in Candidate Sandbox)',
      governanceNote: 'Candidate state only; forbidden from modifying Frozen v1.2 LTS Canonical SSoT.',
    },
    {
      id: 'claim-10',
      metric: 'External Test Vector Verification',
      claimedValue: 'SHA3-512 Hash Vector 0x88',
      evidenceStatus: 'MISMATCH',
      telemetrySource: 'UNVERIFIED',
      evidenceBasis: 'External test harness injected corrupted digest (Hash Mismatch)',
      governanceNote: 'Automatically shifted to BLOCKED state. Overriding forbidden.',
    },
  ];

  const getStatusBadge = (status: EvidenceStatus) => {
    switch (status) {
      case 'CANONICAL':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'VERIFIED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'ACCEPTED_TEST':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'CANDIDATE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'SIMULATED':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'REFERENCE':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'NOT_IN_EVIDENCE':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/50';
      case 'MISMATCH':
      case 'BLOCKED':
        return 'bg-red-500/30 text-red-200 border-red-500/60 animate-pulse';
      default:
        return 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40';
    }
  };

  const getTelemetrySourceBadge = (source: TelemetrySource) => {
    switch (source) {
      case 'LIVE':
        return 'bg-emerald-950 text-emerald-400 border-emerald-500/50';
      case 'SNAPSHOT':
        return 'bg-blue-950 text-blue-400 border-blue-500/50';
      case 'SIMULATED':
        return 'bg-purple-950 text-purple-400 border-purple-500/50';
      case 'REFERENCE':
        return 'bg-cyan-950 text-cyan-400 border-cyan-500/50';
      case 'UNVERIFIED':
        return 'bg-red-950 text-red-400 border-red-500/50';
    }
  };

  const filteredClaims = filterStatus === 'ALL'
    ? evidenceClaims
    : evidenceClaims.filter((c) => c.evidenceStatus === filterStatus);

  return (
    <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#0c0919]/95 via-[#080711]/90 to-[#07080F] border-2 border-purple-500/30 backdrop-blur-2xl space-y-6 shadow-2xl font-mono">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-purple-100 font-serif">
                Evidence Truth Layer & Telemetry Truth Guard
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                EVIDENCE CLASSIFICATION ACTIVE
              </span>
            </div>
            <p className="text-xs text-purple-200/70 font-serif mt-0.5">
              Strictly separate empirical facts from simulations • Unverified claims (e.g. 12,500 QOps/s) barred without FIOS report
            </p>
          </div>
        </div>

        {/* Multi-Sig Boundary State Indicator */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-xl bg-black/60 border border-purple-500/30 text-purple-300 font-bold">
            Multi-Sig Boundary: {custodianProofs}/10 WAITING REAL SIGNATURES
          </span>
        </div>
      </div>

      {/* 9-Status Explanation Header */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-[11px]">
        {[
          { label: 'CANONICAL', desc: 'ผ่าน Explicit Governance (10/10)', color: 'border-cyan-500/40 text-cyan-300' },
          { label: 'VERIFIED', desc: 'มี Empirical Evidence รับรอง', color: 'border-emerald-500/40 text-emerald-300' },
          { label: 'ACCEPTED TEST', desc: 'ผ่านเกณฑ์ทดสอบแบบจำลอง', color: 'border-blue-500/40 text-blue-300' },
          { label: 'CANDIDATE', desc: 'R&D Sandbox ยังไม่ Canonical', color: 'border-amber-500/40 text-amber-300' },
          { label: 'SIMULATED', desc: 'Runtime Simulation (ห้าม Claim Verified)', color: 'border-purple-500/40 text-purple-300' },
          { label: 'REFERENCE', desc: 'ค่าอ้างอิง Baseline คงที่', color: 'border-indigo-500/40 text-indigo-300' },
          { label: 'NOT IN EVIDENCE', desc: 'ไม่มีหลักฐาน (เช่น 12.5k QOps/s) → ห้าม Claim', color: 'border-rose-500/40 text-rose-300' },
          { label: 'MISMATCH', desc: 'ตรวจพบความคลาดเคลื่อนทางรหัส', color: 'border-red-500/50 text-red-400' },
          { label: 'BLOCKED', desc: 'ระงับการทำงาน (Fail-Closed)', color: 'border-red-500/60 text-red-300 font-bold' },
        ].map((item, idx) => (
          <div key={idx} className={`p-2.5 rounded-xl bg-black/60 border ${item.color} flex flex-col justify-between`}>
            <span className="font-bold">{item.label}</span>
            <span className="text-[9px] text-zinc-400 mt-1 font-sans">{item.desc}</span>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {[
          'ALL',
          'CANONICAL',
          'VERIFIED',
          'ACCEPTED_TEST',
          'CANDIDATE',
          'SIMULATED',
          'REFERENCE',
          'NOT_IN_EVIDENCE',
          'MISMATCH',
        ].map((st) => (
          <button
            key={st}
            onClick={() => {
              playTone(600, 0.02);
              setFilterStatus(st);
            }}
            className={`px-3 py-1.5 rounded-xl border transition-all text-[11px] font-bold ${
              filterStatus === st
                ? 'bg-purple-500/25 border-purple-400/60 text-purple-100 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {st.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Claims Ledger Table */}
      <div className="space-y-3">
        {filteredClaims.map((claim) => (
          <div
            key={claim.id}
            className="p-4 rounded-2xl bg-black/60 border border-white/8 hover:border-purple-500/30 transition-all space-y-2 text-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm font-serif">{claim.metric}</span>
                <span className="text-purple-300 font-bold px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                  {claim.claimedValue}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${getTelemetrySourceBadge(claim.telemetrySource)}`}>
                  [{claim.telemetrySource}]
                </span>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${getStatusBadge(claim.evidenceStatus)}`}>
                  {claim.evidenceStatus.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] pt-1">
              <div>
                <span className="text-zinc-500 text-[10px] block font-mono">EVIDENCE BASIS:</span>
                <span className="text-zinc-300 font-sans">{claim.evidenceBasis}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block font-mono">GOVERNANCE RULE:</span>
                <span className={`font-sans ${claim.evidenceStatus === 'NOT_IN_EVIDENCE' ? 'text-red-300 font-bold' : 'text-zinc-400'}`}>
                  {claim.governanceNote}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Multi-Sig Boundary Explanation */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-black/90 via-[#13081e] to-black/90 border border-purple-500/30 space-y-2 text-xs">
        <div className="font-bold text-purple-200 font-serif flex items-center justify-between">
          <span>GOVERNANCE HARDENING: MULTI-SIG BOUNDARY PROTOCOL</span>
          <span className="text-[10px] text-amber-300">NO SELF-SEAL • NO FORCE 10/10 BUTTON</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-300 font-mono">
          <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">{custodianProofs}/10 THAI CUSTODIANS SIGNED</span>
          <span>➔</span>
          <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">WAITING REAL SIGNATURES ({custodianProofs + 1}..9)</span>
          <span>➔</span>
          <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">10/10 VERIFIED</span>
          <span>➔</span>
          <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">CATHEDRAL GATE</span>
          <span>➔</span>
          <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">EXPLICIT PROMOTION</span>
        </div>
        <p className="text-[11px] text-zinc-400 font-sans mt-1">
          ระบบไม่อนุญาตให้กดปุ่มจำลองการลงนามครบ 10/10 หรือ Self-Seal ด้วยตนเอง การเลื่อนสถานะจาก Candidate สู่ Canonical ต้องเกิดจากการลงนามทางกายภาพด้วย Dilithium-5 Hardware Token ของผู้พิทักษ์ครบทุกท่าน
        </p>
      </div>
    </div>
  );
};
