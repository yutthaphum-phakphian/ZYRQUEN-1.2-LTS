import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ViewType } from '../../types';
import {
  Crown,
  Sparkles,
  Shield,
  Layers,
  Activity,
  Cpu,
  Globe,
  Radio,
  Flame,
  Scale,
  Ticket,
  ChevronRight,
  Zap,
  CheckCircle2,
  Terminal,
  Compass,
} from 'lucide-react';
import { playTone, playAuditChime } from '../AudioSynthesizer';

interface CivilizationSphere {
  id: string;
  name: string;
  thaiName: string;
  status: 'OPTIMAL' | 'SYNCHRONIZED' | 'LOCKED';
  metric: string;
  metricLabel: string;
  description: string;
  targetView: ViewType;
  accentColor: string;
}

const CIVILIZATION_SPHERES: CivilizationSphere[] = [
  {
    id: 'sph-1',
    name: 'Post-Quantum Cryptographic Citadel',
    thaiName: 'ป้อมปราการการเข้ารหัสลับหลังควอนตัม',
    status: 'OPTIMAL',
    metric: 'ML-DSA-87',
    metricLabel: 'PQC Lattice Signature',
    description: 'Enforcing quantum-resistant security shields across all civilizational communications and ledger seals.',
    targetView: 'quantum',
    accentColor: '#06B6D4',
  },
  {
    id: 'sph-2',
    name: 'Statutory SSoT Legal Sovereign Anchor',
    thaiName: 'สมอยึดโยงทางกฎหมายอธิปไตย SSoT',
    status: 'LOCKED',
    metric: 'ETDA Sec 26',
    metricLabel: 'B.E. 2544 / PDPA Sec 37',
    description: 'Constitutional and electronic transaction statutory invariance guaranteed by Thai Sovereign Custodian #EP-SOVEREIGN-01.',
    targetView: 'legal',
    accentColor: '#D4AF37',
  },
  {
    id: 'sph-3',
    name: 'Sub-Kelvin Thermal & Energy Grid',
    thaiName: 'โครงข่ายพลังงานและความเย็นระดับอนุเคลวิน',
    status: 'OPTIMAL',
    metric: '0.015 K',
    metricLabel: 'Cryo Equilibrium',
    description: 'Zero-thermal-drift cryogenic boundary preserving superconducting Qubit arrays and TRNG entropy regulators.',
    targetView: 'pulse',
    accentColor: '#10B981',
  },
  {
    id: 'sph-4',
    name: '18 Sovereign Chambers Federation',
    thaiName: 'สหพันธ์ 18 ห้องอธิปไตยแห่งรัฐดิจิทัล',
    status: 'SYNCHRONIZED',
    metric: '18 / 18 SSoT',
    metricLabel: 'Active Chambers',
    description: 'Integrated multi-chamber governance grid coordinating policy, economics, defense, and quantum telemetry.',
    targetView: 'chambers',
    accentColor: '#6366F1',
  },
  {
    id: 'sph-5',
    name: 'AI Senate OPA Rego Decision Gate',
    thaiName: 'เกตสภาสูงดิจิทัล OPA Rego',
    status: 'OPTIMAL',
    metric: '10/10 Quorum',
    metricLabel: 'Supermajority Gate',
    description: 'Automated Rego policy compilation with fail-closed circuit breaker protection against unauthorized entropy surges.',
    targetView: 'council',
    accentColor: '#38BDF8',
  },
  {
    id: 'sph-6',
    name: 'Cinema Ticket Management System',
    thaiName: 'ระบบจัดการบัตรชมภาพยนตร์ C++ Native',
    status: 'OPTIMAL',
    metric: '96 Seats Mutex',
    metricLabel: 'Thread-Safe I/O',
    description: 'High-performance C++20 ported reservation architecture ensuring zero duplicate bookings with binary file records.',
    targetView: 'unified',
    accentColor: '#EC4899',
  },
];

export const SovereignCivilizationView: React.FC<{
  onNavigate?: (view: ViewType) => void;
}> = ({ onNavigate }) => {
  const [activeDirective, setActiveDirective] = useState<string>('EXPAND_CANONICAL_SEALS');
  const [dispatchLogs, setDispatchLogs] = useState<string[]>([
    '[CIVILIZATION DISPATCH] Epoch 849,205 initiated. 14,902 canonical seals verified across cluster.',
    '[CIVILIZATION DISPATCH] Merkle Root 909ab814... confirmed uncorrupted. SSoT drift: Δ0.00%.',
    '[CIVILIZATION DISPATCH] Thai Sovereign Custodian Passport #EP-SOVEREIGN-01 active in legislative council.',
  ]);

  const handleDispatchDirective = (directive: string) => {
    setActiveDirective(directive);
    playAuditChime();
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    setDispatchLogs(prev => [
      `[CIVILIZATION DISPATCH ${timestamp}] Directive "${directive}" broadcasted to 18 Sovereign Chambers. Quorum confirmed.`,
      ...prev.slice(0, 8),
    ]);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950/30 via-zinc-900/60 to-purple-950/30 border border-amber-500/30 rounded-2xl p-6 backdrop-blur-xl shadow-[0_0_35px_rgba(245,158,11,0.12)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)] shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  Sovereign Civilization Intelligence & Matrix Governance Ω∞
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Ω∞ LTS SOVEREIGN CORE
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  WARP COHERENCE: 99.98%
                </span>
              </div>
              <p className="text-zinc-400 text-xs sm:text-sm mt-1">
                ศูนย์บัญชาการยุทธศาสตร์อารยธรรมดิจิทัลอธิปไตย เชื่อมโยง 18 ห้องอธิปไตย SSoT, นโยบาย OPA Rego และเครื่องยนต์ภาพยนตร์ C++ เข้ากับแกนกลาง
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-right font-mono">
              <div className="text-[10px] text-zinc-400 uppercase">Canonical Seals</div>
              <div className="text-xs font-bold text-amber-300">14,902 SEALED</div>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-right font-mono">
              <div className="text-[10px] text-zinc-400 uppercase">SSoT Drift</div>
              <div className="text-xs font-bold text-emerald-300">Δ0.00% ZERO DRIFT</div>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Spheres Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-400" />
            Civilizational Matrix Spheres (มิติยุทธศาสตร์อารยธรรมอธิปไตย)
          </h2>
          <span className="text-xs font-mono text-zinc-400">6 Spheres Synchronized</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CIVILIZATION_SPHERES.map(sphere => (
            <div
              key={sphere.id}
              className="bg-zinc-900/60 border border-white/10 hover:border-amber-500/40 rounded-2xl p-5 backdrop-blur-xl transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold"
                    style={{
                      backgroundColor: `${sphere.accentColor}20`,
                      color: sphere.accentColor,
                      border: `1px solid ${sphere.accentColor}40`,
                    }}
                  >
                    {sphere.status}
                  </span>
                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-white">{sphere.metric}</div>
                    <div className="text-[9px] text-zinc-400">{sphere.metricLabel}</div>
                  </div>
                </div>

                <h3 className="font-bold text-white text-sm mb-0.5">{sphere.name}</h3>
                <div className="text-[11px] text-amber-300/80 mb-2">{sphere.thaiName}</div>
                <p className="text-xs text-zinc-400 leading-relaxed">{sphere.description}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-500">Route: /{sphere.targetView}</span>
                {onNavigate && (
                  <button
                    onClick={() => {
                      playTone(520, 0.04);
                      onNavigate(sphere.targetView);
                    }}
                    className="px-3 py-1.5 rounded-xl font-mono text-xs font-bold text-zinc-200 hover:text-white bg-black/40 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <span>Launch</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Directive Dispatcher & Live Log Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Directives (5 cols) */}
        <div className="lg:col-span-5 bg-zinc-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                Supreme Directives (คำสั่งการระดับอธิปไตย)
              </h3>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { id: 'EXPAND_CANONICAL_SEALS', label: 'Ratify 14,902 Canonical Seals', desc: 'Seal zero-drift Merkle block attestations across cluster' },
              { id: 'ACTIVATE_CIRCUIT_BREAKER', label: 'Verify Rule 7 Circuit Breaker', desc: 'Affirm 15,000 KBps hard ceiling against TRNG surges' },
              { id: 'LOCK_FIPS_HSM', label: 'Attest FIPS 140-3 Level 4 Hardware', desc: 'Enforce tamper-resistant physical cryptographic keys' },
              { id: 'SYNC_18_CHAMBERS', label: 'Broadcast SSoT Invariance to 18 Chambers', desc: 'Harmonize policy engines across all civilizational domains' },
            ].map(d => {
              const isActive = activeDirective === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => handleDispatchDirective(d.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/20 border-amber-500/80 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : 'bg-black/30 hover:bg-zinc-800/50 border-white/5 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{d.label}</span>
                    {isActive && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1">{d.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Terminal Log (7 cols) */}
        <div className="lg:col-span-7 bg-zinc-950 border border-white/10 rounded-2xl p-5 backdrop-blur-xl font-mono text-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 text-zinc-400">
            <span className="flex items-center gap-2 text-amber-400 font-bold">
              <Terminal className="w-4 h-4" />
              Civilization Matrix Dispatch Stream
            </span>
            <span className="text-[10px]">COUNCIL NODE #01</span>
          </div>

          <div className="space-y-2 text-zinc-300 max-h-64 overflow-y-auto custom-scrollbar">
            {dispatchLogs.map((log, i) => (
              <div key={i} className="leading-relaxed border-l-2 border-amber-500/40 pl-2">
                <span className="text-zinc-400">{log.slice(0, 24)}</span>
                <span className="text-amber-200">{log.slice(24)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
