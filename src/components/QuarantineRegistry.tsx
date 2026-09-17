import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Copy,
  Check,
  RefreshCw,
  Terminal,
  Activity,
  Workflow,
  Fingerprint,
} from 'lucide-react';
import { P1QuarantineLayer, QuarantineEvidenceRecord } from '../utils/p1QuarantineLayer';
import { writeFirewall, getWriteFirewallAuditLog, WriteFirewallAuditRecord } from '../utils/writeFirewall';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';

export const QuarantineRegistry: React.FC = () => {
  const [selectedSeal, setSelectedSeal] = useState<number>(14903);
  const [firewallTestOutput, setFirewallTestOutput] = useState<WriteFirewallAuditRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const quarantinedItems = P1QuarantineLayer.getQuarantineRegistry();
  const selectedItem = quarantinedItems.find((i) => i.observedSeal === selectedSeal) || quarantinedItems[0];
  const firewallAudits = getWriteFirewallAuditLog();

  const handleCopy = (id: string, text: string) => {
    copyToClipboard(text);
    setCopiedId(id);
    playTone(650, 0.03);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTestFirewall = (target: string, value: string) => {
    playTone(420, 0.08);
    const result = writeFirewall({
      targetProperty: target,
      requestedValue: value,
      actor: 'QUARANTINE_REGISTRY_INSPECTOR',
      origin: 'quarantine://writeFirewallProbe',
      reason: `Attempted mutation of canonical ${target} from Quarantine Registry`,
    });
    setFirewallTestOutput(result.auditRecord);
    setTimeout(() => setFirewallTestOutput(null), 6000);
  };

  return (
    <div className="space-y-6 font-mono text-xs text-zinc-300">
      {/* Quarantine Banner */}
      <div className="p-5 rounded-[24px] bg-gradient-to-br from-amber-950/40 via-[#0a0d14]/90 to-black border border-amber-500/40 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">QUARANTINE REGISTRY</h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                5 ISOLATED DELTA ENTRIES
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                PROMOTION = BLOCKED
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Isolated storage for runtime observed seals (#14,903–#14,907). Immutable metadata with Zero Canonical SSoT Mutation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTestFirewall('canonicalSeals', '14907')}
            className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-bold transition-all text-xs flex items-center gap-1.5 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
            title="Test writeFirewall by attempting to mutate Canonical Seals to 14,907"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Test Write Firewall</span>
          </button>
        </div>
      </div>

      {/* Write Firewall Alert Display */}
      {firewallTestOutput && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200 shadow-2xl">
          <div className="flex items-start sm:items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <div className="font-bold text-white">Write Firewall Intercepted State Mutation</div>
              <p className="text-[11px] text-rose-200">{firewallTestOutput.reason}</p>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                Audit ID: <code className="text-rose-300">{firewallTestOutput.auditId}</code> • Mutation Delta: <strong className="text-emerald-400">0</strong>
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-rose-500/30 text-rose-100 border border-rose-400/40 font-bold text-[10px] shrink-0 self-start sm:self-auto">
            {firewallTestOutput.status}
          </span>
        </div>
      )}

      {/* 5-Record Grid Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
        {quarantinedItems.map((item) => {
          const isSelected = item.observedSeal === selectedSeal;
          return (
            <button
              key={item.evidenceId}
              onClick={() => {
                setSelectedSeal(item.observedSeal);
                playTone(580 + (item.observedSeal - 14903) * 30, 0.03);
              }}
              className={`p-3.5 rounded-2xl text-left border transition-all relative overflow-hidden ${
                isSelected
                  ? 'bg-amber-500/20 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/40'
                  : 'bg-black/50 border-white/8 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 text-sm">#{item.observedSeal}</span>
                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[9px] font-bold">
                  {item.promotionStatus}
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 truncate mt-1">{item.evidenceId}</div>
              <div className="text-[9px] text-zinc-500 mt-0.5">{item.classification}</div>
            </button>
          );
        })}
      </div>

      {/* Selected Item Detailed Inspector */}
      {selectedItem && (
        <div className="p-5 rounded-[24px] bg-black/60 border border-amber-500/30 backdrop-blur-xl space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <Fingerprint className="w-5 h-5 text-amber-400" />
              <div>
                <span className="text-sm font-bold text-white">Quarantine Evidence Detail — #{selectedItem.observedSeal}</span>
                <span className="text-zinc-500 text-xs ml-2 font-mono">({selectedItem.evidenceId})</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                Classification: {selectedItem.classification}
              </span>
              <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                Promotion: {selectedItem.promotionStatus}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-[11px]">
            {/* Box 1: Origin & Observation */}
            <div className="p-3.5 rounded-xl bg-black/50 border border-white/5 space-y-1.5">
              <div className="text-[10px] text-amber-300 font-bold uppercase border-b border-white/5 pb-1">
                Origin &amp; Observation
              </div>
              <div>
                <span className="text-zinc-500">Source:</span> <span className="text-white">{selectedItem.source}</span>
              </div>
              <div>
                <span className="text-zinc-500">Observer:</span> {selectedItem.observerIdentity}
              </div>
              <div>
                <span className="text-zinc-500">Execution State:</span> <code className="text-zinc-300">{selectedItem.executionState}</code>
              </div>
            </div>

            {/* Box 2: Timestamps & Causality */}
            <div className="p-3.5 rounded-xl bg-black/50 border border-white/5 space-y-1.5">
              <div className="text-[10px] text-amber-300 font-bold uppercase border-b border-white/5 pb-1">
                Timestamps &amp; Causality
              </div>
              <div>
                <span className="text-zinc-500">Observed Timestamp:</span> {selectedItem.timestamp}
              </div>
              <div>
                <span className="text-zinc-500">Parent Pointer:</span> <span className="text-zinc-400 font-mono">{selectedItem.parentEvidence}</span>
              </div>
              <div>
                <span className="text-zinc-500">Provenance:</span> <strong className="text-amber-400">{selectedItem.provenanceStatus}</strong>
              </div>
            </div>

            {/* Box 3: Cryptography & Block Reference */}
            <div className="p-3.5 rounded-xl bg-black/50 border border-white/5 space-y-1.5">
              <div className="text-[10px] text-amber-300 font-bold uppercase border-b border-white/5 pb-1">
                Cryptography &amp; Block Ref
              </div>
              <div>
                <span className="text-zinc-500">Artifact SHA-256:</span>{' '}
                <span className="text-cyan-300 font-mono break-all">{selectedItem.artifactDigest}</span>
              </div>
              <div>
                <span className="text-zinc-500">Quarantine Status:</span> <span className="text-amber-300 font-bold">{selectedItem.quarantineStatus}</span>
              </div>
              <div>
                <span className="text-zinc-500">Promotion Gate:</span> <span className="text-rose-400 font-bold">{selectedItem.promotionStatus}</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-[11px] space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Quarantine Isolation Invariant:</span>
            </div>
            <p className="text-zinc-400">
              {selectedItem.notes} This record is isolated in the Quarantine Plane with zero promotion authority over Canonical SSoT.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
