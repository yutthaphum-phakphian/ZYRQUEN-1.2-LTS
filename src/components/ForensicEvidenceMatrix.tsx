import React, { useState } from 'react';
import {
  FileSearch,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  ShieldAlert,
  GitBranch,
  Lock,
  Radio,
  FileCheck2,
  Activity,
  Layers,
  Sparkles,
  Search,
} from 'lucide-react';
import { P2ForensicEngine, ForensicRecord } from '../utils/p2ForensicEngine';
import { useAuditLedger } from '../hooks/useAuditLedger';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';
import { exportSignedForensicAuditSealChainJson } from '../utils/forensicAuditSealChainJsonExport';

export const ForensicEvidenceMatrix: React.FC = () => {
  const [records, setRecords] = useState<readonly ForensicRecord[]>(() => P2ForensicEngine.getForensicRecords());
  const [selectedRecord, setSelectedRecord] = useState<ForensicRecord | null>(records[0] || null);
  const [activeDossierTab, setActiveDossierTab] = useState<'matrix' | 'dossier' | 'provenance_gate' | 'audit_log'>('matrix');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { auditLog, isVerifying, runCompleteForensicAudit } = useAuditLedger();

  const handleVerify = async (record: ForensicRecord) => {
    playTone(640, 0.04);
    await runCompleteForensicAudit(record);
    const updated = P2ForensicEngine.getForensicRecords();
    setRecords(updated);
    const sel = updated.find((r) => r.evidenceId === record.evidenceId) || updated[0];
    setSelectedRecord(sel);
    playAuditChime();
  };

  const handleCopy = (id: string, text: string) => {
    copyToClipboard(text);
    setCopiedId(id);
    playTone(700, 0.03);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportSignedSealChain = async () => {
    playAuditChime();
    try {
      await exportSignedForensicAuditSealChainJson();
    } catch (e) {
      console.error('Failed to export signed seal chain:', e);
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs text-zinc-300">
      {/* Top Banner */}
      <div className="p-5 rounded-[24px] bg-gradient-to-br from-indigo-950/40 via-[#0a0d18]/90 to-black border-indigo-500/40 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.25)]">
            <FileSearch className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">FORENSIC EVIDENCE MATRIX</h3>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border-indigo-500/40 text-[10px] font-bold">
                5 CRITICAL CHECKS
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border-rose-500/40 text-[10px] font-bold">
                FAIL-CLOSED
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Explicit validation mapping: Provenance, Artifact Digest, Merkle Root Proof, Block Ref Claim, Signature Policy.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-[11px] text-zinc-400 hidden sm:block">
            Canonical Core: <strong className="text-cyan-300">#849202 (Immutable)</strong>
          </div>
          <button
            onClick={handleExportSignedSealChain}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600/40 via-cyan-600/30 to-fuchsia-600/40 hover:from-indigo-500/50 hover:to-cyan-500/50 border-cyan-400/50 text-white font-mono text-[11px] font-bold flex items-center gap-1.5 transition shadow-lg shadow-cyan-500/20"
            title="Export full 14,902 Seal Chain & Evidence Log as Signed JSON for Off-Chain Storage"
          >
            <Lock className="w-3.5 h-3.5 text-cyan-300" />
            <span>Export Signed Seal Chain (JSON)</span>
          </button>
        </div>
      </div>

      {/* Forensic Evidence Matrix Table */}
      <div className="overflow-x-auto rounded-2xl border-white/10 bg-black/60 shadow-xl">
        <table className="w-full text-left text-[11px] font-mono border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10 text-zinc-400">
              <th className="p-3.5">Evidence</th>
              <th className="p-3.5">1. Provenance</th>
              <th className="p-3.5">2. Digest (SHA-256)</th>
              <th className="p-3.5">3. Merkle Proof</th>
              <th className="p-3.5">4. Block Reference</th>
              <th className="p-3.5">5. Signature Policy</th>
              <th className="p-3.5">Classification</th>
              <th className="p-3.5">Promotion</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {records.map((item) => {
              const isSelected = selectedRecord?.evidenceId === item.evidenceId;
              return (
                <tr
                  key={item.evidenceId}
                  onClick={() => {
                    setSelectedRecord(item);
                    playTone(600, 0.02);
                  }}
                  className={`hover:bg-indigo-500/10 cursor-pointer transition-colors ${
                    isSelected ? 'bg-indigo-500/15 ring-1 ring-inset ring-indigo-500/30' : ''
                  }`}
                >
                  <td className="p-3.5 font-bold text-white">
                    <div className="text-amber-300 font-bold">#{item.observedSeal}</div>
                    <div className="text-[9px] text-zinc-500 truncate max-w-[120px]">{item.evidenceId}</div>
                  </td>

                  {/* 1. Provenance Check */}
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px] font-bold flex items-center gap-1 w-fit">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      {item.provenanceStatus}
                    </span>
                  </td>

                  {/* 2. Digest Check */}
                  <td className="p-3.5">
                    <div className="text-cyan-300 font-mono text-[10px] truncate max-w-[110px]">
                      {item.artifactDigest.slice(0, 10)}...
                    </div>
                    <div className="text-[9px] text-zinc-400">
                      Status: <strong className="text-amber-300">{item.digestStatus}</strong>
                    </div>
                  </td>

                  {/* 3. Merkle Proof */}
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px] font-bold flex items-center gap-1 w-fit">
                      <XCircle className="w-3 h-3 text-rose-400" />
                      {item.merkleProofStatus}
                    </span>
                  </td>

                  {/* 4. Block Reference */}
                  <td className="p-3.5">
                    <div className="text-zinc-200 font-bold">{item.blockReference}</div>
                    <div className="text-[9px] text-rose-400">Genesis Anchor: {item.genesisAnchorStatus}</div>
                  </td>

                  {/* 5. Signature Policy */}
                  <td className="p-3.5">
                    <div className="text-zinc-200">{item.signatureAlgorithm}</div>
                    <div className="text-[9px] text-amber-300">{item.signatureStatus}</div>
                  </td>

                  {/* Classification */}
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] font-bold">
                      {item.classification}
                    </span>
                  </td>

                  {/* Promotion */}
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px] font-bold">
                      {item.promotionStatus}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="p-3.5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVerify(item);
                      }}
                      disabled={isVerifying}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border-indigo-500/40 text-[10px] font-bold transition-all disabled:opacity-50 flex items-center gap-1 ml-auto shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                    >
                      <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} />
                      <span>{isVerifying ? 'Probing...' : 'Run Forensic Step'}</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Sub-Tabs: Dossier & 6-Layer Provenance Gate & Audit Trail */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveDossierTab('matrix')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeDossierTab === 'matrix'
              ? 'bg-indigo-500/25 text-indigo-200 border-indigo-500/40'
              : 'text-zinc-400 hover:text-white bg-white/5 border-transparent'
          }`}
        >
          Detailed Dossier (P3)
        </button>
        <button
          onClick={() => setActiveDossierTab('provenance_gate')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeDossierTab === 'provenance_gate'
              ? 'bg-rose-500/25 text-rose-200 border-rose-500/40'
              : 'text-zinc-400 hover:text-white bg-white/5 border-transparent'
          }`}
        >
          6-Layer Provenance Gate (P4)
        </button>
        <button
          onClick={() => setActiveDossierTab('audit_log')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeDossierTab === 'audit_log'
              ? 'bg-cyan-500/25 text-cyan-200 border-cyan-500/40'
              : 'text-zinc-400 hover:text-white bg-white/5 border-transparent'
          }`}
        >
          Audit Ledger Stream ({auditLog.length})
        </button>
      </div>

      {/* Selected Row Detail View: Dossier */}
      {activeDossierTab === 'matrix' && selectedRecord && (
        <div className="p-5 rounded-[24px] bg-black/60 border-indigo-500/30 backdrop-blur-xl space-y-3 shadow-xl animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-indigo-400" />
              <span className="font-bold text-white text-sm">
                Five-Seal Forensic Dossier (P3): Seal #{selectedRecord.observedSeal}
              </span>
            </div>
            <span className="text-xs text-rose-400 font-bold">
              SSoT Mutation Delta = 0 (INVIOLABLE)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
            <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1.5">
              <div className="text-[10px] text-zinc-500 uppercase font-bold">1. Origin & Causality</div>
              <div>
                <span className="text-zinc-500">Evidence ID:</span> <span className="text-white font-mono">{selectedRecord.evidenceId}</span>
              </div>
              <div>
                <span className="text-zinc-500">Source:</span> {selectedRecord.sourceId} ({selectedRecord.sourceType})
              </div>
              <div>
                <span className="text-zinc-500">Observer:</span> {selectedRecord.observerIdentity}
              </div>
              <div>
                <span className="text-zinc-500">Parent Digest:</span> <code className="text-zinc-400 text-[10px]">{selectedRecord.parentDigest.slice(0, 16)}...</code>
              </div>
              <div>
                <span className="text-zinc-500">Causality Status:</span>{' '}
                <strong className="text-emerald-400">{selectedRecord.causalityStatus}</strong>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1.5">
              <div className="text-[10px] text-zinc-500 uppercase font-bold">2. Genesis & Merkle Anchors</div>
              <div>
                <span className="text-zinc-500">Genesis Block:</span>{' '}
                <strong className="text-rose-300">#849202 (Anchor Status: {selectedRecord.genesisAnchorStatus})</strong>
              </div>
              <div>
                <span className="text-zinc-500">Block Claim:</span> <span className="text-amber-300">{selectedRecord.blockReference}</span>
              </div>
              <div>
                <span className="text-zinc-500">Merkle Path:</span> <code className="text-zinc-400">{selectedRecord.merklePath}</code>
              </div>
              <div>
                <span className="text-zinc-500">Merkle Proof:</span>{' '}
                <strong className="text-rose-400">{selectedRecord.merkleProofStatus}</strong>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1.5">
              <div className="text-[10px] text-zinc-500 uppercase font-bold">3. Crypto & Promotion Gate</div>
              <div>
                <span className="text-zinc-500">Algorithm:</span> {selectedRecord.signatureAlgorithm}
              </div>
              <div>
                <span className="text-zinc-500">Signature Status:</span> <strong className="text-amber-300">{selectedRecord.signatureStatus}</strong>
              </div>
              <div>
                <span className="text-zinc-500">Classification:</span> <span className="text-amber-400 font-bold">{selectedRecord.classification}</span>
              </div>
              <div>
                <span className="text-zinc-500">Promotion Verdict:</span> <strong className="text-rose-400">{selectedRecord.promotionStatus} (FAIL-CLOSED)</strong>
              </div>
              <div>
                <span className="text-zinc-500">Dossier Reason:</span>{' '}
                <span className="text-zinc-400 text-[10px]">{selectedRecord.classificationReason}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6-Layer Provenance Gate View (P4) */}
      {activeDossierTab === 'provenance_gate' && selectedRecord && (
        <div className="p-5 rounded-[24px] bg-black/60 border-rose-500/30 backdrop-blur-xl space-y-3 shadow-xl animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span className="font-bold text-white text-sm">
                P4 — 6-Layer Provenance Gate Evaluation (Seal #{selectedRecord.observedSeal})
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border-rose-500/40 text-[10px] font-bold">
              PROVENANCE = INCOMPLETE &rarr; PROMOTION = BLOCKED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-[11px]">
            {/* Layer 1: Source Identity */}
            <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-bold">1. Source Identity</span>
                <span className="text-[10px] text-amber-300">UNATTESTED</span>
              </div>
              <p className="text-[10px] text-zinc-400">
                Source: {selectedRecord.sourceId} ({selectedRecord.sourceType}). Missing hardware-enclaved attestation.
              </p>
            </div>

            {/* Layer 2: Timestamp Integrity */}
            <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-bold">2. Timestamp Integrity</span>
                <span className="text-[10px] text-emerald-400">SYNCHRONIZED</span>
              </div>
              <p className="text-[10px] text-zinc-400">
                Event: {selectedRecord.eventTimestamp}. Ingestion delta &lt; 1.0s.
              </p>
            </div>

            {/* Layer 3: Artifact SHA-256 */}
            <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-bold">3. Artifact SHA-256</span>
                <span className="text-[10px] text-cyan-300">{selectedRecord.digestStatus}</span>
              </div>
              <p className="text-[10px] text-zinc-400 truncate">
                Digest: {selectedRecord.artifactDigest.slice(0, 20)}...
              </p>
            </div>

            {/* Layer 4: Parent Evidence */}
            <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-bold">4. Parent Evidence</span>
                <span className="text-[10px] text-amber-300">{selectedRecord.causalityStatus}</span>
              </div>
              <p className="text-[10px] text-zinc-400">
                Parent: {selectedRecord.parentEvidenceId}. Non-canonical lineage branch.
              </p>
            </div>

            {/* Layer 5: Genesis Anchor */}
            <div className="p-3 rounded-xl bg-black/40 border-rose-500/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-rose-300 font-bold">5. Genesis Anchor</span>
                <span className="text-[10px] text-rose-400 font-bold">{selectedRecord.genesisAnchorStatus}</span>
              </div>
              <p className="text-[10px] text-zinc-400">
                Target: Block #849202. Evaluated: {selectedRecord.blockReference}. Mismatch against Genesis state.
              </p>
            </div>

            {/* Layer 6: Cryptographic Signature */}
            <div className="p-3 rounded-xl bg-black/40 border-rose-500/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-rose-300 font-bold">6. Cryptographic Signature</span>
                <span className="text-[10px] text-rose-400 font-bold">{selectedRecord.signatureStatus}</span>
              </div>
              <p className="text-[10px] text-zinc-400">
                Scheme: {selectedRecord.signatureAlgorithm}. Lacks dual-custody authorization from Genesis keyholders.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Stream */}
      {activeDossierTab === 'audit_log' && (
        <div className="p-5 rounded-[24px] bg-black/60 border-cyan-500/30 backdrop-blur-xl space-y-3 shadow-xl animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white text-sm">
                Immutable Forensic Audit Trail (Auto-Recorded in SystemEvents)
              </span>
            </div>
            <span className="text-[10px] text-zinc-400">
              Total Logged: <strong className="text-cyan-300">{auditLog.length} steps</strong>
            </span>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {auditLog.map((ev) => (
              <div
                key={ev.eventId}
                className="p-2.5 rounded-xl bg-black/40 border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-bold">
                      {ev.type}
                    </span>
                    <strong className="text-white">{ev.operation}</strong>
                    <span className="text-zinc-500 text-[10px]">[{ev.evidenceId}]</span>
                  </div>
                  <div className="text-zinc-400 text-[10px]">{ev.reason}</div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    ev.result.includes('BLOCKED') || ev.result.includes('INVALID')
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {ev.result}
                  </span>
                  <div className="text-[9px] text-zinc-500">{ev.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
