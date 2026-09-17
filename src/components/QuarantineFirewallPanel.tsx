import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertOctagon,
  Flame,
  Lock,
  RotateCcw,
  CheckCircle2,
  FileWarning,
  Bug,
  Terminal,
  Layers,
  Sparkles,
  Ban,
  Radio,
} from 'lucide-react';
import { playTone, playAuditChime } from './AudioSynthesizer';

export interface QuarantinedIncident {
  incidentId: string;
  timestamp: string;
  sourceArtifact: string;
  mismatchType: string;
  claimedValue: string;
  canonicalInvariant: string;
  firewallAction: 'QUARANTINED_FAIL_CLOSED';
  canonicalStatePreserved: boolean;
  forensicSummary: string;
}

export const QuarantineFirewallPanel: React.FC = () => {
  const [isInjectingChaos, setIsInjectingChaos] = useState(false);
  const [quarantineIncidents, setQuarantineIncidents] = useState<QuarantinedIncident[]>([
    {
      incidentId: 'INC-QRT-2026-0822-01',
      timestamp: '08:24:19 ICT',
      sourceArtifact: 'corrupted_tnt_payload_mock.json',
      mismatchType: 'CANONICAL_ROOT_COLLISION_ATTEMPT',
      claimedValue: '0x9999-FAKEROOT-INJECT',
      canonicalInvariant: '909ab814...fa4c68 🔒',
      firewallAction: 'QUARANTINED_FAIL_CLOSED',
      canonicalStatePreserved: true,
      forensicSummary: 'Attempted rewrite of frozen Merkle Root. Firewall triggered instant fail-closed drop.',
    },
  ]);

  const handleSimulateChaosMismatch = () => {
    setIsInjectingChaos(true);
    playTone(320, 0.08);

    setTimeout(() => {
      const newIncident: QuarantinedIncident = {
        incidentId: `INC-QRT-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toLocaleTimeString() + ' ICT',
        sourceArtifact: 'unauthorized_patch_ds901.json',
        mismatchType: 'UNAUTHORIZED_CANONICAL_PROMOTION_PAYLOAD',
        claimedValue: 'STATUS: CANONICAL_MUTATION_REQ',
        canonicalInvariant: 'SSOT MUTATION = 0 (INVIOLABLE)',
        firewallAction: 'QUARANTINED_FAIL_CLOSED',
        canonicalStatePreserved: true,
        forensicSummary: 'Source payload requested direct promotion without hardware multi-sig. Auto-quarantined with 0 mutations.',
      };

      setQuarantineIncidents((prev) => [newIncident, ...prev]);
      setIsInjectingChaos(false);
      playTone(400, 0.06);
    }, 600);
  };

  const handleClearQuarantineLog = () => {
    playTone(500, 0.03);
    setQuarantineIncidents([]);
  };

  return (
    <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#1c080e] via-[#14060b] to-[#0a0205] border-2 border-rose-500/40 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-400 text-rose-300 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-rose-100 font-serif">
                MODULE 2: EVIDENCE QUARANTINE &amp; FAIL-CLOSED FIREWALL
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-400/40 font-bold">
                FAIL-CLOSED ACTIVE
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Zero Canonical Overwrite &bull; Mismatch Isolation Sandbox &bull; Never Automatically &ldquo;Fixes&rdquo; Artifacts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSimulateChaosMismatch}
            disabled={isInjectingChaos}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(244,63,94,0.4)]"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{isInjectingChaos ? 'TESTING FIREWALL...' : 'INJECT CHAOS MISMATCH TEST'}</span>
          </button>
        </div>
      </div>

      {/* 3 Status Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-black/60 border border-rose-500/30 space-y-1">
          <div className="text-[10px] text-zinc-400 font-bold flex items-center justify-between">
            <span>FIREWALL RULE 7</span>
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-rose-300 font-bold text-sm">MISMATCH &rarr; QUARANTINE</div>
          <p className="text-[10px] text-zinc-400 leading-relaxed">
            Conflicts never overwrite canonical values and are isolated immediately in zero-trust memory containers.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-black/60 border border-emerald-500/30 space-y-1">
          <div className="text-[10px] text-zinc-400 font-bold flex items-center justify-between">
            <span>CANONICAL IMMUTABILITY</span>
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-emerald-300 font-bold text-sm">ZERO MUTATION (0)</div>
          <p className="text-[10px] text-zinc-400 leading-relaxed">
            Core Merkle Root, Block #849202, and 14,902 Seals remain 100% frozen regardless of incoming payloads.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-black/60 border border-amber-500/30 space-y-1">
          <div className="text-[10px] text-zinc-400 font-bold flex items-center justify-between">
            <span>ARTIFACT INTEGRITY</span>
            <FileWarning className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-amber-300 font-bold text-sm">PRESERVE RAW INPUTS</div>
          <p className="text-[10px] text-zinc-400 leading-relaxed">
            Never deletes conflicting evidence. Never silently &ldquo;fixes&rdquo; or alters raw external source files.
          </p>
        </div>
      </div>

      {/* Quarantined Incident Table */}
      <div className="p-4 rounded-2xl bg-black/70 border border-rose-500/30 space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
            <span className="text-xs font-bold text-rose-200 uppercase">
              QUARANTINE ISOLATION LOG ({quarantineIncidents.length} INCIDENTS)
            </span>
          </div>
          {quarantineIncidents.length > 0 && (
            <button
              onClick={handleClearQuarantineLog}
              className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset View</span>
            </button>
          )}
        </div>

        {quarantineIncidents.length === 0 ? (
          <div className="py-6 text-center text-xs text-zinc-500">
            No quarantine breaches active. Zero-trust firewall monitoring in real time.
          </div>
        ) : (
          <div className="space-y-2.5 text-xs">
            {quarantineIncidents.map((inc) => (
              <div
                key={inc.incidentId}
                className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-rose-200">{inc.incidentId}</span>
                    <span className="text-[10px] px-2 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                      {inc.mismatchType}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400">{inc.timestamp}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-black/60 border border-white/5">
                    <span className="text-zinc-500">Claimed Payload: </span>
                    <span className="text-rose-300 font-mono font-bold">{inc.claimedValue}</span>
                  </div>
                  <div className="p-2 rounded bg-black/60 border border-white/5">
                    <span className="text-zinc-500">Canonical Lock: </span>
                    <span className="text-emerald-400 font-mono font-bold">{inc.canonicalInvariant}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-zinc-400 pt-1 border-t border-white/5">
                  <div>
                    <strong className="text-zinc-300">Forensic Trace:</strong> {inc.forensicSummary}
                  </div>
                  <span className="text-emerald-400 font-bold shrink-0">
                    CANONICAL MUTATION = 0 &bull; FAIL-CLOSED ENFORCED
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
