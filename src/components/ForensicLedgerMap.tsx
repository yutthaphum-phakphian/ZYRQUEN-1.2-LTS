"use client";

import React, { useState } from 'react';
import {
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Lock,
  ShieldCheck,
  Layers,
  Database,
  Search,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { SSOT } from '../lib/ssot-data';
import { playTone, playAuditChime } from './AudioSynthesizer';

interface EvidenceItem {
  id: string;
  claimTh: string;
  claimEn: string;
  sourceType: string;
  designation: 'CANONICAL' | 'OBSERVED' | 'PROPOSED' | 'REJECTED';
  verificationStatus: 'VERIFIED' | 'STALE' | 'UNVERIFIED' | 'MISSING';
  confidence: number;
  digest: string | null;
  signatureScheme: string;
  details: string;
}

const CANONICAL_EVIDENCE: EvidenceItem[] = [
  {
    id: 'EVID-01-FROZEN-SSOT',
    claimTh: 'แกนกลาง SSoT ถูกแช่แข็งถาวรที่ v1.2 LTS (Delta === 0) ไม่อนุญาตให้มีการแก้ไขใดๆ',
    claimEn: 'SSoT Core is permanently frozen at v1.2 LTS (Delta === 0) with zero mutation allowed.',
    sourceType: 'HARDWARE_HSM (NitroKey FIPS 140-3 L4)',
    designation: 'CANONICAL',
    verificationStatus: 'VERIFIED',
    confidence: 100,
    digest: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    signatureScheme: 'CRYSTALS-Dilithium-5 (ML-DSA-87)',
    details: 'ประทับตราปฐมบทโดย สถาปนิกสูงสุด นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
  },
  {
    id: 'EVID-02-DECA-QUORUM',
    claimTh: 'สภาผู้พิทักษ์กุญแจฮาร์ดแวร์ 10/10 REAL_HSM ลงนามรับรองธรรมนูญครบถ้วนเอกฉันท์',
    claimEn: 'Deca-Key 10/10 Hardware HSM Custodians have fully signed and ratified the governance charter.',
    sourceType: 'HARDWARE_HSM (10 Distinct Hardware Tokens)',
    designation: 'CANONICAL',
    verificationStatus: 'VERIFIED',
    confidence: 100,
    digest: '7528e18501da86fc4691763a43fa4c68909ab814479844d8a14816bed34cdbb0',
    signatureScheme: 'FALCON-1024 / ML-DSA-87 / SPHINCS+',
    details: 'มติเอกฉันท์ 10 โหนด (TC-01 ถึง TC-10) เวลาฉันทามติ 42ms',
  },
  {
    id: 'EVID-03-RWA-GOLD-BACKING',
    claimTh: 'ทองคำแท่งกายภาพ LBMA 99.99% จำนวน 14,902.00 troy oz ค้ำประกันคลังหลวง THB-SOV',
    claimEn: '14,902.00 troy oz LBMA 99.99% physical gold bullion collateralizes the THB-SOV treasury.',
    sourceType: 'PHYSICAL_DEPOSITORY (Bangkok Sovereign Vault A1)',
    designation: 'CANONICAL',
    verificationStatus: 'VERIFIED',
    confidence: 100,
    digest: '43fa4c68909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a',
    signatureScheme: 'SPHINCS+ State-Free Hash Proof',
    details: 'มูลค่าเทียบเท่า ฿1,490,200,000.00 THB ตรวจสอบโดยผู้ตรวจการ 15-Layer Deep Audit',
  },
  {
    id: 'EVID-04-THAI-ETA-2544',
    claimTh: 'ธุรกรรมและลายมือชื่ออิเล็กทรอนิกส์สอดคล้องตาม พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544',
    claimEn: 'Electronic transactions and digital signatures comply with Thai ETA B.E. 2544 (Sec 9, 26, 28).',
    sourceType: 'STATUTORY_LAW (ETDA & Royal Gazette Vol 118)',
    designation: 'CANONICAL',
    verificationStatus: 'VERIFIED',
    confidence: 100,
    digest: '7e819ac2190f84a861d8a12903fe5918bbda2094892c90fa1893c83091e8430a',
    signatureScheme: 'PQC Dilithium-5 Legal Binding',
    details: 'รับรองผลผูกพันทางกฎหมาย มีน้ำหนักพยานหลักฐานสูงสุดในชั้นศาลไทย',
  },
  {
    id: 'EVID-05-EXTERNAL-ORACLE-RATE',
    claimTh: 'สายธารข้อมูลราคาอัตราแลกเปลี่ยน USD/THB จาก Third-Party Oracle ภายนอก',
    claimEn: 'Global spot USD/THB exchange rate feed from third-party decentralized price oracle.',
    sourceType: 'EXTERNAL_ORACLE (Unauthenticated Bridge)',
    designation: 'OBSERVED',
    verificationStatus: 'STALE',
    confidence: 64,
    digest: '16bed34cdbb07528e18501da86fc4691763a43fa4c68909ab814479844d8a148',
    signatureScheme: 'ECDSA secp256k1 (Classical)',
    details: 'สถานะ Stale เกิน 120 นาที ถูกแยกกักกันใน Buffer สังเกตการณ์',
  },
  {
    id: 'EVID-06-AI-PROPOSED-ALLOCATION',
    claimTh: 'ข้อเสนอแนะปรับพอร์ตสำรอง 5% โดยโมเดล Bio-AI Autonomous Recommendation',
    claimEn: 'Autonomous recommendation to rebalance 5.0% of liquid THB reserves into physical gold.',
    sourceType: 'AI_AGENT_OUTPUT (Sandboxed AI Enclave)',
    designation: 'PROPOSED',
    verificationStatus: 'UNVERIFIED',
    confidence: 45,
    digest: 'a18f91a3c091811eb242e1b87d00f28ac37a109e3f19e48cd41d04f29a28a30f',
    signatureScheme: 'UNSIGNED (Ambient Authority = 0%)',
    details: 'ข้อเสนอแนะไม่มีสิทธิ์เขียน SSoT ต้องการมติสภา 10/10 ก่อนดำเนินการ',
  },
  {
    id: 'EVID-07-OFFSHORE-ESCROW-PROOF',
    claimTh: 'คำกล่าวอ้างสินทรัพย์ค้ำประกันภายนอก 50M USD โดยไม่มีหลักฐานการลงนามควอนตัม',
    claimEn: 'Purported secondary escrow vault holding 50M USD offshore backing token.',
    sourceType: 'UNAUTHENTICATED_INPUT (Untrusted Origin)',
    designation: 'REJECTED',
    verificationStatus: 'MISSING',
    confidence: 0,
    digest: null,
    signatureScheme: 'NONE',
    details: 'ละเมิดนโยบาย Zero-Mock Evidence ถูกปฏิเสธและกักกันทันที',
  },
];

const REPLAY_STAGES = [
  'STAGE-01 INGEST',
  'STAGE-02 DECODE',
  'STAGE-03 CRYPTO-CHECK',
  'STAGE-04 QUORUM-ASSERT',
  'STAGE-05 INVARIANT-TEST',
  'STAGE-06 MERKLE-VALIDATE',
  'STAGE-07 SHADOW-REPLAY',
  'STAGE-08 CRYO-SYNC',
  'STAGE-09 LAW-EVAL',
  'STAGE-10 AUDIT-APPEND',
  'STAGE-11 SEAL-EMIT',
  'STAGE-12 CLOSURE',
];

export const ForensicLedgerMap: React.FC = () => {
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem>(CANONICAL_EVIDENCE[0]);
  const [isReplaying, setIsReplaying] = useState(false);
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(-1);

  const handleRunReplay = async () => {
    setIsReplaying(true);
    playTone(500, 0.04);

    for (let i = 0; i < REPLAY_STAGES.length; i++) {
      setCurrentStageIdx(i);
      playTone(580 + i * 25, 0.02);
      await new Promise((r) => setTimeout(r, 60)); // ~142ms total replay speed
    }

    setIsReplaying(false);
    playAuditChime();
  };

  return (
    <div className="bg-zinc-950/90 border border-violet-500/40 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/40 flex items-center justify-center text-violet-400">
            <FileSearch className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-violet-950/80 text-violet-300 border border-violet-700/60">
                12-STAGE DETERMINISTIC REPLAY
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                142ms &bull; 7 EVIDENCE OBJECTS
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold font-mono text-zinc-100 mt-0.5">
              Forensic Ledger Map &amp; Evidence Matrix
            </h3>
          </div>
        </div>

        <button
          onClick={handleRunReplay}
          disabled={isReplaying}
          className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-semibold flex items-center gap-2 border transition-all self-start sm:self-auto ${
            isReplaying
              ? 'bg-violet-500/20 border-violet-500/50 text-violet-200 animate-pulse'
              : 'bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/40 text-violet-300 shadow-md'
          }`}
        >
          <RotateCw className={`w-3.5 h-3.5 text-violet-400 ${isReplaying ? 'animate-spin' : ''}`} />
          <span>{isReplaying ? 'Replaying 12 Stages...' : 'Execute 142ms Trace Replay'}</span>
        </button>
      </div>

      {/* 12-Stage Visual Ribbon */}
      <div className="bg-black/60 border border-zinc-800 p-3 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <span>12-Stage Forensic Trace Replay Timeline</span>
          <span className="text-cyan-400">Replay SLO: 142.1 ms</span>
        </div>
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
          {REPLAY_STAGES.map((stage, idx) => {
            const isActive = isReplaying && currentStageIdx === idx;
            const isPassed = !isReplaying && currentStageIdx >= 0;
            return (
              <div
                key={idx}
                className={`p-1.5 rounded text-[9px] font-mono text-center truncate transition-all ${
                  isActive
                    ? 'bg-violet-500 text-white font-bold scale-105 shadow-md shadow-violet-500/30'
                    : isPassed
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
                    : 'bg-zinc-900/80 text-zinc-500 border border-zinc-800'
                }`}
                title={stage}
              >
                {idx + 1}
              </div>
            );
          })}
        </div>
      </div>

      {/* 7 Evidence Objects List & Detailed Inspector */}
      <div className="space-y-2.5">
        <label className="text-xs font-mono text-zinc-400 block font-semibold">
          คลังวัตถุพยานหลักฐาน 7 ชุด (Canonical &amp; Non-Canonical):
        </label>
        <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
          {CANONICAL_EVIDENCE.map((ev) => {
            const isSelected = selectedEvidence.id === ev.id;
            return (
              <div
                key={ev.id}
                onClick={() => {
                  playTone(600, 0.02);
                  setSelectedEvidence(ev);
                }}
                className={`p-3 rounded-xl border transition cursor-pointer space-y-1.5 ${
                  isSelected
                    ? 'bg-zinc-900/90 border-violet-400 shadow-md shadow-violet-500/10'
                    : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">
                      {ev.id}
                    </span>
                    <span className="text-xs font-bold text-zinc-200 line-clamp-1">
                      {ev.claimTh}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      ev.verificationStatus === 'VERIFIED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                        : ev.verificationStatus === 'STALE'
                        ? 'bg-amber-950 text-amber-300 border border-amber-700/60'
                        : 'bg-rose-950 text-rose-300 border border-rose-700/60'
                    }`}
                  >
                    {ev.verificationStatus}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 font-sans">{ev.details}</p>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-zinc-500 pt-1 border-t border-zinc-800/60">
                  <span>Scheme: {ev.signatureScheme}</span>
                  <span>Confidence: {ev.confidence}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Evidence Digest Box */}
      <div className="p-3 bg-black/80 border border-zinc-800 rounded-xl space-y-1 font-mono text-[11px]">
        <div className="flex justify-between text-zinc-400">
          <span>Active Selection: {selectedEvidence.id}</span>
          <span className="text-[#FACC15]">{selectedEvidence.designation}</span>
        </div>
        <div className="text-zinc-300 truncate text-[10px]">
          Digest: {selectedEvidence.digest || 'NULL (No mock / Zero-mock enforced)'}
        </div>
      </div>
    </div>
  );
};
