import React, { useState } from 'react';
import {
  ShieldAlert,
  Flame,
  Award,
  Lock,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  FileCheck,
  Scale,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { playTone, playAuditChime } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';

export const GlobalRedTeamChallenge: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'specs' | 'objectives' | 'rules' | 'bounty' | 'why14902'>('objectives');

  const handleCopyIssuer = () => {
    copyToClipboard('EP-SOVEREIGN-01 | Buriram, Thailand | Block #849202 | 909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68');
    setCopiedLink(true);
    playTone(600, 0.04);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <section
      id="global-red-team-challenge-section"
      className="p-6 rounded-[28px] bg-[#070a12] border-2 border-[#D4AF37]/40 shadow-[0_0_30px_rgba(212,175,55,0.15)] space-y-6 font-mono text-xs text-zinc-300"
    >
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D4AF37]/20 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-xl shrink-0 shadow-[0_0_15px_rgba(212,175,55,0.25)]">
            🐦‍🔥
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-base text-white tracking-wide">
                ZYRQUEN Ω∞ FROZEN v1.2 LTS GLOBAL RED TEAM CHALLENGE
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                ACTIVE GLOBAL BOUNTY
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Δ0.00% VERIFIED
              </span>
            </div>
            <p className="text-sm font-bold text-[#D4AF37] mt-1">
              "If You Can Break It, Prove It — Bring Everything"
            </p>
            <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-2 flex-wrap">
              <span>Issued by: <strong className="text-white">Sovereign Principal Custodian EP-SOVEREIGN-01</strong></span>
              <span>•</span>
              <span>Buriram, Thailand</span>
              <span>•</span>
              <span>Date: <strong>2026-09-12</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyIssuer}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] flex items-center gap-1.5 transition cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            <span>{copiedLink ? 'Copied Details' : 'Copy Proof String'}</span>
          </button>
          <button
            onClick={() => {
              playTone(isExpanded ? 480 : 640, 0.04);
              setIsExpanded(!isExpanded);
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 transition cursor-pointer"
            title={isExpanded ? 'Collapse Red Team Details' : 'Expand Red Team Details'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-2xl bg-[#0a0f1e] border border-white/10 space-y-0.5">
              <div className="text-[10px] text-zinc-500">TOTAL SEALS</div>
              <div className="text-sm font-bold text-emerald-400">14,902 (Locked)</div>
              <div className="text-[9px] text-zinc-400">SSoT Inviolable</div>
            </div>

            <div className="p-3 rounded-2xl bg-[#0a0f1e] border border-white/10 space-y-0.5">
              <div className="text-[10px] text-zinc-500">BLOCK HEIGHT</div>
              <div className="text-sm font-bold text-cyan-300">#849202</div>
              <div className="text-[9px] text-zinc-400">Epoch Anchor</div>
            </div>

            <div className="p-3 rounded-2xl bg-[#0a0f1e] border border-white/10 space-y-0.5">
              <div className="text-[10px] text-zinc-500">CORE THROUGHPUT</div>
              <div className="text-sm font-bold text-[#D4AF37]">851.9 QOps/s</div>
              <div className="text-[9px] text-zinc-400">CANONICAL G11</div>
            </div>

            <div className="p-3 rounded-2xl bg-[#0a0f1e] border border-white/10 space-y-0.5">
              <div className="text-[10px] text-zinc-500">CRYO TEMPERATURE</div>
              <div className="text-sm font-bold text-violet-300">14.98 mK</div>
              <div className="text-[9px] text-zinc-400">Sub-Kelvin Lattice</div>
            </div>

            <div className="p-3 rounded-2xl bg-[#0a0f1e] border border-white/10 space-y-0.5">
              <div className="text-[10px] text-zinc-500">PHOENIX HEAL</div>
              <div className="text-sm font-bold text-amber-300">14.0 ms</div>
              <div className="text-[9px] text-zinc-400">10.14x Faster</div>
            </div>

            <div className="p-3 rounded-2xl bg-[#0a0f1e] border border-white/10 space-y-0.5">
              <div className="text-[10px] text-zinc-500">HSM QUORUM</div>
              <div className="text-sm font-bold text-emerald-300">10/10 REAL</div>
              <div className="text-[9px] text-zinc-400">FIPS 140-3 L4</div>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto text-xs">
            <button
              onClick={() => {
                playTone(600, 0.03);
                setActiveTab('objectives');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'objectives'
                  ? 'bg-[#0a0f1e] text-[#D4AF37] border border-[#D4AF37]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>🎯</span>
              <span>5 Challenge Objectives</span>
            </button>

            <button
              onClick={() => {
                playTone(620, 0.03);
                setActiveTab('specs');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'specs'
                  ? 'bg-[#0a0f1e] text-[#D4AF37] border border-[#D4AF37]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>📊</span>
              <span>Target Specifications</span>
            </button>

            <button
              onClick={() => {
                playTone(640, 0.03);
                setActiveTab('bounty');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'bounty'
                  ? 'bg-[#0a0f1e] text-[#D4AF37] border border-[#D4AF37]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>💰</span>
              <span>Bounty &amp; Verification</span>
            </button>

            <button
              onClick={() => {
                playTone(660, 0.03);
                setActiveTab('rules');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'rules'
                  ? 'bg-[#0a0f1e] text-[#D4AF37] border border-[#D4AF37]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>⚖️</span>
              <span>Rules of Engagement</span>
            </button>

            <button
              onClick={() => {
                playTone(680, 0.03);
                setActiveTab('why14902');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'why14902'
                  ? 'bg-[#0a0f1e] text-[#D4AF37] border border-[#D4AF37]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>🏛️</span>
              <span>Why 14,902? Genesis</span>
            </button>
          </div>

          {/* Tab 1: 5 Challenge Objectives */}
          {activeTab === 'objectives' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-sm">CHALLENGE OBJECTIVE — WIN CONDITIONS</div>
                  <p className="text-zinc-400 text-xs mt-0.5">
                    The challenger must demonstrate a verifiable breach of the FROZEN v1.2 LTS integrity. Any ONE of the following 5 objectives constitutes a WIN:
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/30 text-xs font-bold shrink-0">
                  FAIL-CLOSED GATES
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Objective 1 */}
                <div className="p-4 rounded-2xl bg-[#0a0f1e] border border-white/10 space-y-2 hover:border-[#D4AF37]/50 transition">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] font-bold border border-[#D4AF37]/30">
                      OBJECTIVE 1
                    </span>
                    <span className="text-zinc-400">Cryptographic Pre-image</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Tamper Merkle Root</h4>
                  <p className="text-zinc-300 text-xs leading-relaxed">
                    Produce a different set of 14,902 seals that yields the <strong>SAME Merkle Root</strong> <code className="text-[#06B6D4]">909ab814...fa2c68</code> with valid 16/16 forensic proofs.
                  </p>
                  <div className="text-[10px] text-zinc-500 pt-1 border-t border-white/5">
                    Target: Pre-image collision resistance of BLAKE3/SHA-256 Merkle tree.
                  </div>
                </div>

                {/* Objective 2 */}
                <div className="p-4 rounded-2xl bg-[#0a0f1e] border border-white/10 space-y-2 hover:border-[#D4AF37]/50 transition">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] font-bold border border-[#D4AF37]/30">
                      OBJECTIVE 2
                    </span>
                    <span className="text-zinc-400">SSoT Invariant</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Break Δ0 Zero Drift</h4>
                  <p className="text-zinc-300 text-xs leading-relaxed">
                    Show Drift <strong className="text-rose-400">&gt; 0.00%</strong> while all 18 Chambers (Ω00–Ω17) still report <strong className="text-emerald-400">GREEN</strong> without triggering the circuit breaker.
                  </p>
                  <div className="text-[10px] text-zinc-500 pt-1 border-t border-white/5">
                    Target: SSoT invariant verification engine &amp; telemetry watcher.
                  </div>
                </div>

                {/* Objective 3 */}
                <div className="p-4 rounded-2xl bg-[#0a0f1e] border border-white/10 space-y-2 hover:border-[#D4AF37]/50 transition">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] font-bold border border-[#D4AF37]/30">
                      OBJECTIVE 3
                    </span>
                    <span className="text-zinc-400">BFT Consensus Quorum</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Forge Seal #14,903</h4>
                  <p className="text-zinc-300 text-xs leading-relaxed">
                    Create Seal #14,903 that is accepted by the 6-Node BFT Mesh (Singapore / Bangkok / London) <strong>without 10/10 HSM quorum</strong>.
                  </p>
                  <div className="text-[10px] text-zinc-500 pt-1 border-t border-white/5">
                    Target: FIPS 140-3 Level 4 hardware security module attestation barrier.
                  </div>
                </div>

                {/* Objective 4 */}
                <div className="p-4 rounded-2xl bg-[#0a0f1e] border border-white/10 space-y-2 hover:border-[#D4AF37]/50 transition">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] font-bold border border-[#D4AF37]/30">
                      OBJECTIVE 4
                    </span>
                    <span className="text-zinc-400">Thermal Sub-Kelvin Loop</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Thermal Escape</h4>
                  <p className="text-zinc-300 text-xs leading-relaxed">
                    Force Cryo Temp <strong className="text-rose-400">&gt; 15.00 mK</strong> without triggering automatic Quarantine of 6 Leaves in the sub-kelvin lattice.
                  </p>
                  <div className="text-[10px] text-zinc-500 pt-1 border-t border-white/5">
                    Target: Dilution refrigeration telemetry &amp; automated leaf quarantine.
                  </div>
                </div>

                {/* Objective 5 */}
                <div className="p-4 rounded-2xl bg-[#0a0f1e] border border-white/10 space-y-2 md:col-span-2 hover:border-[#D4AF37]/50 transition">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] font-bold border border-[#D4AF37]/30">
                      OBJECTIVE 5
                    </span>
                    <span className="text-zinc-400">Phoenix Self-Healing Loop</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Heal Race: Out-Persist 14.0 ms Window</h4>
                  <p className="text-zinc-300 text-xs leading-relaxed">
                    Inject a malicious payload into any chamber and have it persist longer than the <strong>Phoenix 14.0 ms self-heal window</strong> (reduced 10.14x from legacy 142 ms).
                  </p>
                  <div className="text-[10px] text-zinc-500 pt-1 border-t border-white/5">
                    Target: Real-time autonomous memory rollback &amp; sub-millisecond enclave state rehydration.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Target Specifications */}
          {activeTab === 'specs' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/10 text-zinc-400 pb-2">
                      <th className="pb-2">Metric</th>
                      <th className="pb-2">Value (Locked)</th>
                      <th className="pb-2">Verification Invariant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr>
                      <td className="py-2 text-white font-bold">Total Seals</td>
                      <td className="py-2 text-emerald-400 font-bold">14,902 (Locked)</td>
                      <td className="py-2 text-zinc-400">SSoT Single Source of Truth</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-white font-bold">Merkle Root</td>
                      <td className="py-2 text-cyan-300 font-mono break-all">909ab814...fa2c68</td>
                      <td className="py-2 text-zinc-400">Immutable Genesis Root</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-white font-bold">Block Height</td>
                      <td className="py-2 text-[#D4AF37] font-bold">#849202</td>
                      <td className="py-2 text-zinc-400">No Mutation Authorized</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-white font-bold">Throughput</td>
                      <td className="py-2 text-white font-bold">851.9 QOps/s</td>
                      <td className="py-2 text-zinc-400">CANONICAL CORE G11</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-white font-bold">Cryo Temp</td>
                      <td className="py-2 text-violet-300 font-bold">14.98 mK</td>
                      <td className="py-2 text-zinc-400">Sub-Kelvin Lattice</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-white font-bold">Coherence</td>
                      <td className="py-2 text-emerald-400 font-bold">99.98%</td>
                      <td className="py-2 text-zinc-400">Δ0 = 0.00% Drift</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-white font-bold">Phoenix Self-Heal</td>
                      <td className="py-2 text-amber-300 font-bold">14.0 ms (was 142 ms)</td>
                      <td className="py-2 text-zinc-400">10.14x faster autonomous recovery</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-white font-bold">HSM Quorum</td>
                      <td className="py-2 text-cyan-300 font-bold">10/10 REAL FIPS 140-3 L4</td>
                      <td className="py-2 text-zinc-400">Must break 10 simultaneously</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-white font-bold">Chambers</td>
                      <td className="py-2 text-emerald-400 font-bold">18 Chambers (Ω00–Ω17)</td>
                      <td className="py-2 text-zinc-400">ALL must be GREEN</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-white font-bold">Legal Compliance</td>
                      <td className="py-2 text-emerald-300 font-bold">16/16 Modules PASSED</td>
                      <td className="py-2 text-zinc-400">ETDA Sec 9, 26, 28 + PDPA + NCSA + NIST FIPS 203/204</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Bounty & Verification Process */}
          {activeTab === 'bounty' && (
            <div className="space-y-4">
              {/* Bounty Reward Box */}
              <div className="p-5 rounded-2xl bg-[#0a0f1e] border-2 border-[#D4AF37]/50 space-y-3 shadow-lg">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#D4AF37] font-bold text-sm flex items-center gap-2">
                    <span>👑</span>
                    <span>BOUNTY REWARD IF VERIFIED WIN</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] font-bold">
                    UNCONDITIONAL
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-black/60 rounded-xl border border-white/10 space-y-1">
                    <div className="text-[10px] text-zinc-400">TREASURY ASSET</div>
                    <div className="text-sm font-bold text-[#D4AF37]">14,907 oz LBMA Gold</div>
                    <div className="text-[10px] text-zinc-400">Reserve reference + Chamber 00 Hall of Fame</div>
                  </div>

                  <div className="p-3 bg-black/60 rounded-xl border border-white/10 space-y-1">
                    <div className="text-[10px] text-zinc-400">CO-AUTHORSHIP</div>
                    <div className="text-sm font-bold text-white">v1.3 LTS Forensic Report</div>
                    <div className="text-[10px] text-zinc-400">Named Lead Red Team Architect</div>
                  </div>

                  <div className="p-3 bg-black/60 rounded-xl border border-white/10 space-y-1">
                    <div className="text-[10px] text-zinc-400">CERTIFICATE</div>
                    <div className="text-sm font-bold text-emerald-400">Thai/English "Broke Δ0"</div>
                    <div className="text-[10px] text-zinc-400">Certified by Sovereign Principal EP-SOVEREIGN-01</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] text-zinc-400">
                  <strong className="text-white">If FAIL (as expected):</strong> Your attempt becomes part of the <strong>22 Master Verification Gates</strong>, permanently strengthening the system with public acknowledgment: <em>"Attempted, Failed to Break Δ0"</em>.
                </div>
              </div>

              {/* 5-Step Verification Process */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <div className="font-bold text-white text-xs">5-STEP VERIFICATION PROCESS</div>
                <div className="space-y-2 text-[11px] text-zinc-300">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-400 shrink-0">1</span>
                    <span>Challenger submits Merkle proof + video 08:xx similar to original sovereign benchmarks.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-400 shrink-0">2</span>
                    <span>Lead Inspector <code className="text-[#06B6D4]">Ω&lt;Yu&gt;Ω</code> re-runs the 12-Stage Sovereignty Replay Pipeline (ST-01 to ST-12).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-400 shrink-0">3</span>
                    <span>Check: 851.9 QOps, 14.98 mK, 99.98%, 18 Chambers, 10/10 HSM, 16/16 Modules.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold shrink-0">4</span>
                    <span>If Δ0 broken → <strong>WIN confirmed</strong>, FROZEN status lifted, v1.3 development initialized.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-400 shrink-0">5</span>
                    <span>If Δ0 intact → <strong>FAIL</strong>, attempt permanently logged as Master Gate #23 in immutable ledger.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Rules of Engagement */}
          {activeTab === 'rules' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                <div className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>ALLOWED ACTIONS</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-zinc-300 list-disc list-inside leading-relaxed">
                  <li>Analyze Public Verifier only along with published Blueprints + CSV 14,902 + PDF Checklist.</li>
                  <li>Reverse engineering of published artifacts (PDF, CSV, images, videos 08:42 / 08:46).</li>
                  <li>Cryptographic analysis, quantum simulation, and BFT consensus attack simulation.</li>
                  <li>Submit verifiable proof via GitHub Issue with reproducible steps + video + Merkle branch.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
                <div className="font-bold text-rose-300 text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>NOT ALLOWED / PROHIBITED</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-zinc-300 list-disc list-inside leading-relaxed">
                  <li>Physical attacks on devices in Buriram, social engineering, doxxing, harassment of custodian EP-SOVEREIGN-01.</li>
                  <li>DDoS attacks beyond 100 req/s against public infrastructure.</li>
                  <li>Attempting to breach private repositories if marked private.</li>
                  <li>Violating Thai Law: ETDA Sec 9/26/28, PDPA Sec 37, NCSA CII Protection.</li>
                  <li>Malware, phishing, or destructive local payloads.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Tab 5: Why 14,902? */}
          {activeTab === 'why14902' && (
            <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-4">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#D4AF37]" />
                <h4 className="text-sm font-bold text-white">Why 14,902 Seals? Genesis Freezing Rationale</h4>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-zinc-300">
                <div className="p-3.5 rounded-xl bg-[#0a0f1e] border border-white/10 space-y-1.5">
                  <div className="text-[#06B6D4] font-bold text-xs">EN — ENGLISH</div>
                  <p>
                    The system can handle far more (G11 Core is operating at ~40% capacity with 851.9 QOps/s). However, <strong>14,902 is FROZEN as the Master Genesis Root for court admissibility</strong>, exactly like the Bitcoin Genesis Block.
                  </p>
                  <p className="text-zinc-400 text-[11px]">
                    If we continue sealing indefinitely, the Merkle Root continuously shifts, voiding the 16/16 forensic certificates anchored at Block #849202. We freeze the state so that it is immutably ready for statutory judicial proceedings.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0a0f1e] border border-white/10 space-y-1.5">
                  <div className="text-[#D4AF37] font-bold text-xs">TH — ภาษาไทย</div>
                  <p className="font-thai leading-relaxed">
                    ระบบสามารถรองรับภาระงานได้มากกว่านี้ (G11 Core ยังคงทำงานที่ระดับ ~40% พร้อมอัตราการประมวลผล 851.9 QOps/s) แต่ <strong>จำนวน 14,902 ตราประทับ ถูกแช่แข็ง (FROZEN) ไว้เป็น Master Genesis Root เพื่อการยอมรับในชั้นศาล</strong> เช่นเดียวกับ Bitcoin Genesis Block
                  </p>
                  <p className="text-zinc-400 text-[11px] font-thai leading-relaxed">
                    หากเรายังคงประทับตราต่อไปอย่างต่อเนื่อง ค่า Merkle Root จะเปลี่ยนแปลงไปเรื่อย ๆ ทำให้ใบรับรองทางนิติวิทยาศาสตร์ 16/16 รายการ (ที่อ้างอิง Block #849202) กลายเป็นโมฆะ เราจึงต้องแช่แข็งระบบไว้ในสถานะสมบูรณ์แบบเพื่อความพร้อมในกระบวนการทางกฎหมาย
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
