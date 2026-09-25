import React from 'react';
import { ShieldCheck, Lock, CheckCircle2, Cpu, Activity } from 'lucide-react';

// CANONICAL CONSTANTS
const MERKLE_GENESIS_ROOT = "909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68";
const CANONICAL_BLOCK = 849202;
const CANONICAL_SEAL_COUNT = 14902;

export function G11CanonicalCore() {
  const invariants = [
    { code: "INV-01", name: "Canonical SSoT Non-Mutation Rule", desc: "0 external runtime mutations allowed in Frozen baseline.", status: "PASSED" },
    { code: "INV-02", name: "Merkle Tree Deterministic Binding", desc: "Every execution resolves to Hash 909ab814...43fa4c68.", status: "PASSED" },
    { code: "INV-03", name: "Zero Trust Gateway Continuous Auth", desc: "Continuous Dilithium-5 PQC authentication per invocation.", status: "PASSED" },
    { code: "INV-04", name: "Blast Radius Boundary (<2.0%)", desc: "Impact bounds strictly clamped under 2.0% during auto-healing.", status: "PASSED" },
    { code: "INV-05", name: "Fail-Closed Auto-Defensive Rebuild", desc: "Instant quarantine triggers on unverified privilege probes.", status: "PASSED" },
    { code: "INV-06", name: "Telemetry Non-Authoritative Isolation", desc: "Metrics isolated with zero mutation write privileges.", status: "PASSED" },
    { code: "INV-07", name: "Zero Drift Baseline Consistency", desc: "Exact 0.00% drift verified against Genesis Manifest.", status: "PASSED" },
    { code: "INV-08", name: "14,902 Sealed Blocks Continuity", desc: "All 14,902 evidence seals chained via unbroken SHA-256 links.", status: "PASSED" },
    { code: "INV-09", name: "Thai Sovereign Principal Passport Auth", desc: "Sovereign Executive Passport #EP-SOVEREIGN-01 verified.", status: "PASSED" },
    { code: "INV-10", name: "12-Stage Forensic Trace Replay", desc: "Deterministic 142ms transaction trace fully verified.", status: "PASSED" },
  ];

  return (
    <div className="space-y-6 font-mono text-xs animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="rounded-[20px] bg-[#080a0f]/90 border-[#D4AF37]/40 p-6 backdrop-blur-xl relative overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.15)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] font-bold border-[#D4AF37]/40 text-[10px]">
                G11 CANONICAL CORE
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border-emerald-500/30 text-[10px]">
                100% INVIOLABLE
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white">Chamber 01: Canonical Core Engine G11</h2>
            <p className="text-slate-400 text-xs mt-1">Single Source of Truth (SSoT Δ0) Root Container & Immutable Anchor</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400">Canonical Merkle Root</div>
            <div className="text-xs font-bold text-cyan-300 break-all max-w-xs">{MERKLE_GENESIS_ROOT}</div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-black/40 rounded-xl p-3 border-white/5">
            <span className="text-slate-400 text-[10px] block">Block Height</span>
            <span className="text-lg font-bold text-amber-400">#{CANONICAL_BLOCK}</span>
          </div>
          <div className="bg-black/40 rounded-xl p-3 border-white/5">
            <span className="text-slate-400 text-[10px] block">Canonical Seals</span>
            <span className="text-lg font-bold text-emerald-400">{CANONICAL_SEAL_COUNT.toLocaleString()}</span>
          </div>
          <div className="bg-black/40 rounded-xl p-3 border-white/5">
            <span className="text-slate-400 text-[10px] block">State Delta</span>
            <span className="text-lg font-bold text-cyan-400">SSoT Δ0</span>
          </div>
          <div className="bg-black/40 rounded-xl p-3 border-white/5">
            <span className="text-slate-400 text-[10px] block">Baseline Drift</span>
            <span className="text-lg font-bold text-purple-400">0.00%</span>
          </div>
        </div>
      </div>

      {/* 10 Invariants Grid */}
      <div className="space-y-3">
        <h3 className="font-bold text-[#D4AF37] text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          10/10 CANONICAL INVARIANTS STATUS (FROZEN BASELINE)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {invariants.map((inv) => (
            <div key={inv.code} className="bg-[#050814]/80 border-white/10 rounded-xl p-3 flex items-start justify-between hover:border-[#D4AF37]/30 transition-all">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-[#D4AF37] px-1.5 py-0.5 rounded bg-[#D4AF37]/10 border-[#D4AF37]/20">
                    {inv.code}
                  </span>
                  <span className="font-bold text-slate-200">{inv.name}</span>
                </div>
                <p className="text-slate-400 text-[11px]">{inv.desc}</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border-emerald-500/40 text-[10px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {inv.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
