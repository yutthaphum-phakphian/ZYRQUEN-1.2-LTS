import React, { useState } from 'react';
import {
  Flame,
  ShieldCheck,
  AlertTriangle,
  Lock,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  Users,
  AlertOctagon,
  EyeOff,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { PromotionFirewallItem } from '../types';

export const PromotionFirewallPanel: React.FC = () => {
  const [selectedItemId, setSelectedItemId] = useState<string>('prom-01');

  // Strict 5-Stage Promotion Items
  const promotionItems: PromotionFirewallItem[] = [
    {
      id: 'prom-01',
      moduleName: 'ZYRQUEN Frozen v1.2 Core (Merkle Root 909ab814)',
      currentStage: 'CANONICAL',
      evidenceScore: 100.0,
      fiosReportAttached: true,
      dilithiumVerified: true,
      quorumSignedCount: 10,
      directPromotionBlocked: false,
      notes: 'Full 10/10 multi-sig completed, sealed block #849202, immutable SSoT.',
    },
    {
      id: 'prom-02',
      moduleName: 'High-Stress Surge Engine (12,500 QOps/s Claim)',
      currentStage: 'CANDIDATE',
      evidenceScore: 0.0,
      fiosReportAttached: false,
      dilithiumVerified: false,
      quorumSignedCount: 0,
      directPromotionBlocked: true,
      notes: 'Lacks formal FIOS benchmark validation report. DIRECT CANONICAL PROMOTION STRICTLY BLOCKED.',
    },
    {
      id: 'prom-03',
      moduleName: '1024-Qubit Next-Gen Lattice Sub-Mesh',
      currentStage: 'CANDIDATE',
      evidenceScore: 42.5,
      fiosReportAttached: false,
      dilithiumVerified: true,
      quorumSignedCount: 2,
      directPromotionBlocked: true,
      notes: 'Under lab evaluation in isolated candidate sandbox. Waiting for 10/10 physical multi-sig.',
    },
    {
      id: 'prom-04',
      moduleName: 'Cross-Border ASEAN PQC Handshake Protocol',
      currentStage: 'VERIFICATION',
      evidenceScore: 84.0,
      fiosReportAttached: true,
      dilithiumVerified: true,
      quorumSignedCount: 4,
      directPromotionBlocked: true,
      notes: 'Evidence verified; awaiting remaining 6 Thai Custodians physical token signatures.',
    },
  ];

  const stages = [
    { key: 'CANDIDATE', label: '1. Candidate', desc: 'R&D Draft Sandbox' },
    { key: 'EVIDENCE', label: '2. Evidence', desc: 'Empirical Logs / FIOS' },
    { key: 'VERIFICATION', label: '3. Verification', desc: 'PQC Lattice Proof' },
    { key: 'GOVERNANCE', label: '4. Governance', desc: '10/10 Multi-Sig' },
    { key: 'EXPLICIT_PROMOTION', label: '5. Explicit Promotion', desc: 'Cathedral Gate Seal' },
  ];

  const selectedItem = promotionItems.find((p) => p.id === selectedItemId) || promotionItems[0];

  const getStageIndex = (stage: string) => {
    switch (stage) {
      case 'CANDIDATE':
        return 0;
      case 'EVIDENCE':
        return 1;
      case 'VERIFICATION':
        return 2;
      case 'GOVERNANCE':
        return 3;
      case 'EXPLICIT_PROMOTION':
      case 'CANONICAL':
        return 4;
      default:
        return 0;
    }
  };

  const currentItemStageIndex = getStageIndex(selectedItem.currentStage);

  return (
    <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#120808]/95 via-[#0b0507]/90 to-[#07080F] border-2 border-red-500/35 backdrop-blur-2xl space-y-6 shadow-2xl font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-red-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-red-100 font-serif">
                Promotion Firewall & Governance Gate
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 font-bold">
                NO DIRECT CANDIDATE ➔ CANONICAL
              </span>
            </div>
            <p className="text-xs text-red-200/80 font-serif mt-0.5">
              Candidate ➔ Evidence ➔ Verification ➔ Governance ➔ Explicit Promotion
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-xl bg-black/60 border border-red-500/30 text-red-300 font-bold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Firewall Active: Inviolable</span>
          </span>
        </div>
      </div>

      {/* 5-Stage Promotion Firewall Pipeline Visualization */}
      <div className="p-5 rounded-2xl bg-black/60 border border-white/8 space-y-3">
        <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
          <span>5-STAGE GOVERNANCE PROMOTION HIGHWAY</span>
          <span className="text-[10px] text-red-400">SHORTCUTS FORBIDDEN</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {stages.map((st, idx) => {
            const isCompleted = currentItemStageIndex > idx || selectedItem.currentStage === 'CANONICAL';
            const isCurrent = currentItemStageIndex === idx && selectedItem.currentStage !== 'CANONICAL';

            return (
              <div
                key={st.key}
                className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2 transition-all ${
                  isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                    : isCurrent
                    ? 'bg-amber-500/20 border-amber-400/60 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'bg-white/[0.02] border-white/5 text-zinc-500 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span>{st.label}</span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  ) : (
                    <Lock className="w-3 h-3 text-zinc-600" />
                  )}
                </div>
                <div className="text-[10px] font-sans opacity-80">{st.desc}</div>
                <div className="pt-1 border-t border-white/5 text-[9px] font-bold">
                  {isCompleted ? 'VERIFIED PASSED' : isCurrent ? 'GATING STAGE' : 'LOCKED'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Module Selector & Promotion Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Module List */}
        <div className="p-4 rounded-2xl bg-black/60 border border-white/8 space-y-2 lg:col-span-1">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider pb-1">
            MODULE GOVERNANCE PIPELINE
          </div>
          <div className="space-y-1.5">
            {promotionItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  playTone(540, 0.03);
                  setSelectedItemId(item.id);
                }}
                className={`w-full p-3 rounded-xl border text-left transition-all text-xs ${
                  selectedItemId === item.id
                    ? 'bg-red-500/20 border-red-400/60 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                    : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="font-bold truncate text-[11px] text-zinc-200">{item.moduleName}</div>
                <div className="flex items-center justify-between text-[10px] mt-1 font-mono">
                  <span className="text-zinc-500">Stage: {item.currentStage}</span>
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${
                      item.currentStage === 'CANONICAL'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {item.currentStage === 'CANONICAL' ? 'CANONICAL' : 'ISOLATED'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Promotion Details & Multi-Sig Requirements */}
        <div className="p-5 rounded-2xl bg-black/70 border border-red-500/30 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-xs font-bold text-red-200 font-serif">
              PROMOTION GATE INSPECTOR: {selectedItem.moduleName}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                selectedItem.currentStage === 'CANONICAL'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-red-500/20 text-red-300 border-red-500/30'
              }`}
            >
              {selectedItem.currentStage === 'CANONICAL' ? 'PROMOTED CANONICAL' : 'DIRECT PROMOTION BLOCKED'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <div className="text-[10px] text-zinc-500">FIOS REPORT:</div>
                <div className={`font-bold text-[11px] ${selectedItem.fiosReportAttached ? 'text-emerald-400' : 'text-red-400'}`}>
                  {selectedItem.fiosReportAttached ? 'ATTACHED & CERTIFIED' : 'MISSING / REJECTED'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <div className="text-[10px] text-zinc-500">DILITHIUM-5 PROOF:</div>
                <div className={`font-bold text-[11px] ${selectedItem.dilithiumVerified ? 'text-emerald-400' : 'text-red-400'}`}>
                  {selectedItem.dilithiumVerified ? 'VERIFIED INVIOLABLE' : 'UNVERIFIED'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <div className="text-[10px] text-zinc-500">QUORUM SIGNATURES:</div>
                <div className="font-bold text-[11px] text-amber-300">
                  {selectedItem.quorumSignedCount}/10 Custodians
                </div>
              </div>
            </div>

            {/* Governance Notes */}
            <div className="p-3 rounded-xl bg-red-500/[0.05] border border-red-500/20 space-y-1">
              <div className="text-[10px] text-red-400 font-bold">GOVERNANCE ENFORCEMENT MANDATE:</div>
              <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">{selectedItem.notes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Non-Authoritative Presentation Layer Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-black/90 via-[#150a0a] to-black/90 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <EyeOff className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="font-sans text-zinc-300 text-[11px]">
            <strong className="text-amber-200 font-mono">NON-AUTHORITATIVE PRESENTATION LAYER NOTICE:</strong> Royal Gazette theme, Legal Dashboard, Quantum visualizer, and 3D Citadel Lattice are purely cosmetic rendering layers. Under no circumstance can UI interactions or themes alter, promote, or override underlying cryptographic evidence states.
          </div>
        </div>
      </div>
    </div>
  );
};
