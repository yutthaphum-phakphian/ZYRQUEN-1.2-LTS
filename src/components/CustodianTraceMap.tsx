import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  Award,
  Fingerprint,
  Cpu,
  Lock,
  Layers,
  ArrowRight,
  ExternalLink,
  Zap,
  Activity,
  Scale,
  Sparkles,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { THAI_CUSTODIANS, SYSTEM_METADATA } from '../data/canonicalData';
import { INITIAL_OMEGA_PHASES, OmegaPhase } from './OmegaSequenceSimulator';

interface CustodianBindingEdge {
  custodianId: string;
  phaseId: number;
  label: string;
  statute: string;
  color: string;
}

export const CustodianTraceMap: React.FC = () => {
  const [selectedCustodianId, setSelectedCustodianId] = useState<string>(THAI_CUSTODIANS[0].id);
  const [selectedPhaseId, setSelectedPhaseId] = useState<number>(1);
  const [isTracing, setIsTracing] = useState<boolean>(false);
  const [traceStep, setTraceStep] = useState<number>(-1);

  const selectedCustodian = THAI_CUSTODIANS.find((c) => c.id === selectedCustodianId) || THAI_CUSTODIANS[0];
  const selectedPhase = INITIAL_OMEGA_PHASES.find((p) => p.phase === selectedPhaseId) || INITIAL_OMEGA_PHASES[0];

  // Specific Legal Binding Links between Thai Custodian Registry & 12-Phase Omega Sequence
  const bindings: CustodianBindingEdge[] = [
    {
      custodianId: 'CUST-TH-01', // Yuththaphum (Principal)
      phaseId: 1, // Genesis Root
      label: 'Executive Root-of-Trust Non-Delegable Anchor',
      statute: 'พ.ร.บ. ธุรกรรมฯ ม. 9 (Root Genesis Authority)',
      color: '#06b6d4',
    },
    {
      custodianId: 'CUST-TH-01',
      phaseId: 6, // Sovereign Passport Sign-off
      label: 'Executive Passport #EP-SOVEREIGN-01 Veto Seal',
      statute: 'พ.ร.บ. ธุรกรรมฯ ม. 28 (Principal Signature Seal)',
      color: '#f59e0b',
    },
    {
      custodianId: 'CUST-TH-01',
      phaseId: 12, // Omega Ascension
      label: 'Sovereign Multiverse Finality Custody Seal',
      statute: 'พ.ร.บ. ธุรกรรมฯ ม. 26 & 28 (Immutable Finality)',
      color: '#10b981',
    },
    {
      custodianId: 'CUST-TH-02', // Somchai (Legal Counsel)
      phaseId: 3, // Identity Attestation
      label: 'ETDA Level 3+ Signer Identity Verification',
      statute: 'พ.ร.บ. ธุรกรรมฯ ม. 9 วรรคหนึ่ง (1)',
      color: '#8b5cf6',
    },
    {
      custodianId: 'CUST-TH-02',
      phaseId: 9, // Legal Attestation Bridge
      label: 'Court-Admissible Evidence Attestation Bridge',
      statute: 'พ.ร.บ. ธุรกรรมฯ ม. 11 & PDPA Sec 19/27/37',
      color: '#ec4899',
    },
    {
      custodianId: 'CUST-TH-03', // Kanchana (Cryo-Storage Auditor)
      phaseId: 2, // Cryogenic Key Forge
      label: 'Sub-Kelvin Hardware Security Verification',
      statute: 'NIST FIPS 140-3 Physical Vault Standard',
      color: '#3b82f6',
    },
    {
      custodianId: 'CUST-TH-03',
      phaseId: 10, // Custody Reconciliation
      label: 'TPM 2.0 Dual-Key Physical Hardware Binding',
      statute: 'พ.ร.บ. ธุรกรรมฯ ม. 28 (Physical Key Isolation)',
      color: '#06b6d4',
    },
    {
      custodianId: 'CUST-TH-04', // Prasert (NCSA Liaison)
      phaseId: 5, // qOps Invariant Lock
      label: 'Zero-Drift Merkle Invariant Continuous Audit',
      statute: 'NCSA Cybersecurity Act Sec 35 Compliance',
      color: '#10b981',
    },
    {
      custodianId: 'CUST-TH-04',
      phaseId: 7, // Audit Trail Emission
      label: 'Immutable Monotonic OTLP Trace Emission',
      statute: 'NCSA Critical Information Infrastructure Audit',
      color: '#f59e0b',
    },
  ];

  // Coordinates for SVG visualization
  // Left column: 4 Custodians (x: 100, y: 70, 160, 250, 340)
  // Right column: 12 Phases (x: 740, y: 35 + i * 32)
  const getCustodianPos = (idx: number) => ({ x: 130, y: 65 + idx * 95 });
  const getPhasePos = (idx: number) => ({ x: 730, y: 35 + idx * 31 });

  const handleSimulateTrace = () => {
    setIsTracing(true);
    let step = 0;
    setTraceStep(0);
    playTone(460, 0.08);

    const interval = setInterval(() => {
      step++;
      if (step < bindings.length) {
        setTraceStep(step);
        setSelectedCustodianId(bindings[step].custodianId);
        setSelectedPhaseId(bindings[step].phaseId);
        playTone(460 + step * 35, 0.06);
      } else {
        clearInterval(interval);
        setIsTracing(false);
        setTraceStep(-1);
        playAuditChime();
      }
    }, 600);
  };

  const activeBindings = bindings.filter((b) => b.custodianId === selectedCustodianId);

  return (
    <div className="rounded-[28px] bg-[#07080F]/95 border border-white/8 backdrop-blur-2xl p-6 sm:p-8 space-y-6 shadow-2xl font-mono">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/8 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.2)] shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Custodian Trace Map — Sovereign Registry $\leftrightarrow$ Omega Pipeline
              </h3>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
                DYNAMIC SVG BINDING GRAPH
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              Cryptographic and statutory mapping between Thai Custodians and ZYRQUEN Omega Sequence #EP-SOVEREIGN-01
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSimulateTrace}
            disabled={isTracing}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all border shadow-lg ${
              isTracing
                ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40 animate-pulse cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-emerald-500/20 hover:from-cyan-500/30 hover:to-emerald-500/30 text-cyan-200 border-cyan-500/40 hover:scale-[1.02]'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 text-cyan-300 ${isTracing ? 'animate-spin' : ''}`} />
            <span>{isTracing ? `Tracing Link ${traceStep + 1}/${bindings.length}...` : 'Simulate Full Trace Flow'}</span>
          </button>
        </div>
      </div>

      {/* SVG Interactive Canvas */}
      <div className="relative w-full overflow-x-auto rounded-2xl bg-black/60 border border-white/5 p-4 flex items-center justify-center">
        <svg viewBox="0 0 880 400" className="w-full max-w-5xl h-auto min-w-[760px] select-none">
          <defs>
            <filter id="traceGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* SVG Connection Paths */}
          {bindings.map((b, idx) => {
            const custIdx = THAI_CUSTODIANS.findIndex((c) => c.id === b.custodianId);
            const phaseIdx = b.phaseId - 1;
            const cPos = getCustodianPos(custIdx);
            const pPos = getPhasePos(phaseIdx);

            const isSelected = selectedCustodianId === b.custodianId;
            const isTraceActive = traceStep === idx;

            // Smooth cubic bezier curve from Custodian to Phase Node
            const pathData = `M ${cPos.x + 90} ${cPos.y} C ${cPos.x + 300} ${cPos.y}, ${pPos.x - 200} ${pPos.y}, ${pPos.x - 70} ${pPos.y}`;

            return (
              <g key={`${b.custodianId}-${b.phaseId}`} className="transition-all duration-300">
                <path
                  d={pathData}
                  fill="none"
                  stroke={isTraceActive ? '#f59e0b' : isSelected ? b.color : 'rgba(255,255,255,0.08)'}
                  strokeWidth={isTraceActive ? '3.5' : isSelected ? '2' : '1'}
                  strokeDasharray={isSelected ? undefined : '3 3'}
                  filter={isSelected || isTraceActive ? 'url(#traceGlow)' : undefined}
                />

                {/* Animated pulse dot on active path */}
                {(isSelected || isTraceActive) && (
                  <circle
                    r="4"
                    fill={isTraceActive ? '#f59e0b' : b.color}
                    className="animate-ping"
                  >
                    <animateMotion
                      path={pathData}
                      dur={isTraceActive ? '0.8s' : '2.5s'}
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </g>
            );
          })}

          {/* Left Column: Thai Custodian Nodes */}
          {THAI_CUSTODIANS.map((cust, idx) => {
            const pos = getCustodianPos(idx);
            const isSelected = selectedCustodianId === cust.id;

            return (
              <g
                key={cust.id}
                onClick={() => {
                  if (!isTracing) {
                    playTone(520 + idx * 30, 0.03);
                    setSelectedCustodianId(cust.id);
                  }
                }}
                className="cursor-pointer group"
                transform={`translate(${pos.x}, ${pos.y})`}
              >
                {/* Node Box */}
                <rect
                  x="-90"
                  y="-34"
                  width="180"
                  height="68"
                  rx="14"
                  fill={isSelected ? '#0e1726' : '#070a12'}
                  stroke={isSelected ? '#06b6d4' : 'rgba(255,255,255,0.12)'}
                  strokeWidth={isSelected ? '2' : '1'}
                  filter={isSelected ? 'url(#traceGlow)' : undefined}
                  className="transition-all duration-200 group-hover:stroke-white/40"
                />

                {/* Custodian Thai Name */}
                <text
                  x="-75"
                  y="-12"
                  fill={isSelected ? '#ffffff' : '#e2e8f0'}
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {cust.nameTh}
                </text>

                {/* Role / Passport */}
                <text
                  x="-75"
                  y="4"
                  fill="#94a3b8"
                  fontSize="8.5"
                  fontFamily="sans-serif"
                >
                  {cust.roleEn.slice(0, 24)}
                </text>

                {/* ID & Status */}
                <text
                  x="-75"
                  y="20"
                  fill={isSelected ? '#06b6d4' : '#64748b'}
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {cust.id} • {cust.status}
                </text>

                {/* Right Anchor Pin */}
                <circle
                  cx="90"
                  cy="0"
                  r="5"
                  fill={isSelected ? '#06b6d4' : '#334155'}
                  stroke="#07080F"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}

          {/* Right Column: 12 Omega Sequence Phases */}
          {INITIAL_OMEGA_PHASES.map((phase, idx) => {
            const pos = getPhasePos(idx);
            const isSelected = selectedPhaseId === phase.phase;
            const isBoundToSelectedCustodian = activeBindings.some((b) => b.phaseId === phase.phase);

            return (
              <g
                key={phase.phase}
                onClick={() => {
                  if (!isTracing) {
                    playTone(600 + idx * 20, 0.03);
                    setSelectedPhaseId(phase.phase);
                  }
                }}
                className="cursor-pointer group"
                transform={`translate(${pos.x}, ${pos.y})`}
              >
                {/* Node Box */}
                <rect
                  x="-70"
                  y="-12"
                  width="140"
                  height="24"
                  rx="6"
                  fill={
                    isSelected
                      ? '#1e1b4b'
                      : isBoundToSelectedCustodian
                      ? '#0f172a'
                      : '#05070d'
                  }
                  stroke={
                    isSelected
                      ? '#8b5cf6'
                      : isBoundToSelectedCustodian
                      ? phase.accentColor
                      : 'rgba(255,255,255,0.08)'
                  }
                  strokeWidth={isSelected || isBoundToSelectedCustodian ? '1.5' : '1'}
                  className="transition-all duration-150"
                />

                {/* Left Anchor Pin */}
                <circle
                  cx="-70"
                  cy="0"
                  r="4"
                  fill={isBoundToSelectedCustodian ? phase.accentColor : '#334155'}
                  stroke="#07080F"
                  strokeWidth="1"
                />

                {/* Text */}
                <text
                  x="-58"
                  y="4"
                  fill={isSelected ? '#ffffff' : isBoundToSelectedCustodian ? '#e2e8f0' : '#64748b'}
                  fontSize="8.5"
                  fontWeight={isBoundToSelectedCustodian ? 'bold' : 'normal'}
                  fontFamily="monospace"
                >
                  Φ{phase.phase} {phase.nameTh.slice(0, 14)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Custodian Binding Details */}
      <div className="p-5 sm:p-6 rounded-2xl bg-black/80 border border-white/10 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/8 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center font-bold text-sm shrink-0">
              {selectedCustodian.id.slice(-2)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm sm:text-base font-bold text-white">
                  {selectedCustodian.nameTh} ({selectedCustodian.nameEn})
                </h4>
                <span className="text-xs text-amber-300 font-mono">
                  Passport {selectedCustodian.passportNumber}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">{selectedCustodian.roleEn}</p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 self-start sm:self-auto">
            {activeBindings.length} ACTIVE STATUTORY BINDINGS
          </span>
        </div>

        {/* Bindings List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {activeBindings.map((b) => {
            const p = INITIAL_OMEGA_PHASES.find((ph) => ph.phase === b.phaseId);

            return (
              <div
                key={`${b.custodianId}-${b.phaseId}`}
                className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md border"
                    style={{
                      backgroundColor: `${b.color}15`,
                      color: b.color,
                      borderColor: `${b.color}35`,
                    }}
                  >
                    Φ{b.phaseId} {p?.nameTh}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">ENFORCED</span>
                </div>

                <div className="text-xs font-bold text-zinc-200">{b.label}</div>

                <div className="text-[11px] text-cyan-300 font-sans line-clamp-1">
                  {b.statute}
                </div>

                <div className="text-[10px] text-zinc-500 pt-1 border-t border-white/5 font-mono truncate">
                  Fingerprint: {selectedCustodian.keyFingerprint.slice(0, 24)}...
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
