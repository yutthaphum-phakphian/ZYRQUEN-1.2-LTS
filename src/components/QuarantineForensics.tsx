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
  FileCode,
  ArrowRight,
  Clock,
  Search,
  Eye,
  GitCommit,
  Check,
  Copy,
} from 'lucide-react';
import { playTone, playAuditChime } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';
import { SYSTEM_INVARIANTS } from '../data/canonicalData';

export interface MismatchFieldDetail {
  fieldPath: string;
  expectedValue: string;
  actualValue: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description: string;
}

export interface QuarantineTimelineEvent {
  step: number;
  phase: string;
  timestamp: string;
  actor: string;
  status: 'PASSED' | 'FAILED' | 'BLOCKED' | 'QUARANTINED';
  detail: string;
}

export interface QuarantinedArtifactRecord {
  id: string;
  incidentId: string;
  artifactId: string;
  sourceFilename: string;
  tenantId: string;
  quarantineReason: string;
  quarantinedAt: string;
  expectedSha256: string;
  actualSha256: string;
  hardwareSlot: string;
  fieldMismatches: MismatchFieldDetail[];
  eventTimeline: QuarantineTimelineEvent[];
  quarantinedRawPayload: string;
  expectedPayloadReference: string;
  ssotMutationDelta: 0;
}

export const QuarantineForensics: React.FC = () => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('INC-QRT-801');
  const [activeSubTab, setActiveSubTab] = useState<'DIFF' | 'FIELDS' | 'TIMELINE' | 'RAW_PAYLOAD'>('DIFF');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [incidents, setIncidents] = useState<QuarantinedArtifactRecord[]>([
    {
      id: 'REC-01',
      incidentId: 'INC-QRT-801',
      artifactId: 'TNT-TH-001-TAMPERED',
      sourceFilename: 'tenant_audit_manifest_TNT-TH-001.forged.json',
      tenantId: 'TNT-TH-001',
      quarantineReason: 'BYTE_DIGEST_MISMATCH & CANONICAL_ROOT_INJECTION_ATTEMPT',
      quarantinedAt: '2026-08-22 08:24:19 ICT',
      expectedSha256: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      actualSha256: 'deadbeef849202a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef012',
      hardwareSlot: 'HSM-SLOT-01-REJECTED',
      fieldMismatches: [
        {
          fieldPath: 'cryptographicProof',
          expectedValue: '"sha256_tenant_audit_tnt_th_001_sealed"',
          actualValue: '"0xUNAUTHORIZED_OVERWRITE_ATTEMPT"',
          severity: 'CRITICAL',
          description: 'Proof signature was maliciously substituted with unverified signature.',
        },
        {
          fieldPath: 'quota.maxStorageGb',
          expectedValue: '2000',
          actualValue: '999999 (Privilege Escalation)',
          severity: 'HIGH',
          description: 'Tenant storage quota requested arbitrary escalation beyond sovereign threshold.',
        },
        {
          fieldPath: 'canonicalRootTarget',
          expectedValue: 'READ_ONLY_FROZEN',
          actualValue: 'WRITE_MUTATE_REQUEST',
          severity: 'CRITICAL',
          description: 'Direct violation of Frozen Core Contract (SSoT Mutation = 0).',
        },
      ],
      eventTimeline: [
        {
          step: 1,
          phase: 'EVIDENCE_INGESTION',
          timestamp: '08:24:18.102 ICT',
          actor: 'INTAKE_GATEWAY',
          status: 'PASSED',
          detail: 'Raw file received from external staging buffer (1,512 bytes).',
        },
        {
          step: 2,
          phase: 'BYTE_DIGEST_CALCULATION',
          timestamp: '08:24:18.341 ICT',
          actor: 'WEBCRYPTO_ENGINE',
          status: 'FAILED',
          detail: 'Computed hash deadbeef8492... does not match expected canonical digest 909ab814... (DIFF DETECTED).',
        },
        {
          step: 3,
          phase: 'HARDWARE_ATTESTATION',
          timestamp: '08:24:18.590 ICT',
          actor: 'HSM_SLOT_01',
          status: 'BLOCKED',
          detail: 'Sovereign HSM refused attestation due to signature checksum failure.',
        },
        {
          step: 4,
          phase: 'FAIL_CLOSED_INTERCEPTION',
          timestamp: '08:24:18.820 ICT',
          actor: 'PROMOTION_FIREWALL',
          status: 'QUARANTINED',
          detail: 'Rule 7 triggered: Mismatched artifact isolated in quarantine sandbox. Zero Canonical writes.',
        },
        {
          step: 5,
          phase: 'AUDIT_LEDGER_SEAL',
          timestamp: '08:24:19.010 ICT',
          actor: 'EVIDENCE_STATE_MANAGER',
          status: 'PASSED',
          detail: 'Incident sealed with SSoT Mutation Delta = 0. Baseline Drift = 0.00%.',
        },
      ],
      expectedPayloadReference: JSON.stringify(
        {
          tenantId: 'TNT-TH-001',
          organization: 'MAEW HOLDINGS CO., LTD. (Sovereign HQ)',
          isolationMode: 'Sovereign Physical Hardware Isolation',
          quota: { cpuPercent: 32, storageGb: 480, maxStorageGb: 2000 },
          cryptographicProof: 'sha256_tenant_audit_tnt_th_001_sealed',
          canonicalWriteAuthority: false,
        },
        null,
        2
      ),
      quarantinedRawPayload: JSON.stringify(
        {
          tenantId: 'TNT-TH-001',
          organization: 'MAEW HOLDINGS CO., LTD. (FORGED_ESCALATION)',
          isolationMode: 'Sovereign Physical Hardware Isolation',
          quota: { cpuPercent: 32, storageGb: 480, maxStorageGb: 999999 },
          cryptographicProof: '0xUNAUTHORIZED_OVERWRITE_ATTEMPT',
          canonicalRootTarget: 'WRITE_MUTATE_REQUEST',
        },
        null,
        2
      ),
      ssotMutationDelta: 0,
    },
    {
      id: 'REC-02',
      incidentId: 'INC-QRT-802',
      artifactId: 'DS-901-UNAUTH-ROUTER',
      sourceFilename: 'maew_fios_pilot_dataset.broker_patch.json',
      tenantId: 'TNT-TH-001',
      quarantineReason: 'FINANCIAL_SAFETY_BREACH & LIVE_BROKER_SOCKET_REQUEST',
      quarantinedAt: '2026-08-22 08:35:44 ICT',
      expectedSha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
      actualSha256: '99887766554433221100aabbccddeeff99887766554433221100aabbccddeeff',
      hardwareSlot: 'HSM-SLOT-02-PILOT-INTERCEPT',
      fieldMismatches: [
        {
          fieldPath: 'executionMode',
          expectedValue: '"NON_LIVE_SIMULATION_SANDBOX"',
          actualValue: '"LIVE_FIX_PROTOCOL_BROKER_ROUTING"',
          severity: 'CRITICAL',
          description: 'Violation of Rule 8: Financial Safety Barrier. Live execution requested in sandbox dataset.',
        },
        {
          fieldPath: 'capitalMovementAuthority',
          expectedValue: 'false',
          actualValue: 'true (UNAUTHORIZED)',
          severity: 'CRITICAL',
          description: 'Simulation attempted to grant autonomous fund transfer capability.',
        },
      ],
      eventTimeline: [
        {
          step: 1,
          phase: 'EVIDENCE_INGESTION',
          timestamp: '08:35:43.010 ICT',
          actor: 'INTAKE_GATEWAY',
          status: 'PASSED',
          detail: 'Dataset pilot package ingested.',
        },
        {
          step: 2,
          phase: 'POLICY_EVALUATION',
          timestamp: '08:35:43.320 ICT',
          actor: 'POLICY_ENGINE',
          status: 'FAILED',
          detail: 'POL-04 Simulation Containment policy violated. LIVE_BROKER_SOCKET_DETECTED.',
        },
        {
          step: 3,
          phase: 'FIREWALL_DROP',
          timestamp: '08:35:44.110 ICT',
          actor: 'PROMOTION_FIREWALL',
          status: 'QUARANTINED',
          detail: 'Payload diverted to isolated quarantine vault. Broker connections disabled.',
        },
      ],
      expectedPayloadReference: JSON.stringify(
        {
          manifesto: 'MAEW Ω∞ FIOS ULTIMATE v2.1 LTS',
          datasetId: 'DS-901-PILOT',
          executionMode: 'NON_LIVE_SIMULATION_SANDBOX',
          capitalMovementAuthority: false,
        },
        null,
        2
      ),
      quarantinedRawPayload: JSON.stringify(
        {
          manifesto: 'MAEW Ω∞ FIOS ULTIMATE v2.1 LTS',
          datasetId: 'DS-901-PILOT',
          executionMode: 'LIVE_FIX_PROTOCOL_BROKER_ROUTING',
          capitalMovementAuthority: true,
        },
        null,
        2
      ),
      ssotMutationDelta: 0,
    },
  ]);

  const selectedIncident = incidents.find((inc) => inc.incidentId === selectedIncidentId) || incidents[0];

  const handleCopy = (text: string, key: string) => {
    copyToClipboard(text);
    setCopiedKey(key);
    playTone(700, 0.03);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#18070c] via-[#100408] to-[#080204] border-2 border-rose-500/40 space-y-6 shadow-2xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-400 text-rose-300 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-rose-100 font-serif">
                QUARANTINE FORENSICS &amp; MISMATCH DIFF LAB
              </h3>
              <span className="text-[10px] px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-400/50 font-bold">
                FAIL-CLOSED SANDBOX
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Side-by-Side Digest Comparison &bull; Field-Level Structural Diff &bull; Event Timeline &bull; SSoT Mutation = 0
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-rose-500/30 text-xs font-mono text-zinc-300 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span>Frozen Core: #849202 🔒</span>
          </div>
        </div>
      </div>

      {/* Incident Selector Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {incidents.map((inc) => (
          <button
            key={inc.incidentId}
            onClick={() => {
              setSelectedIncidentId(inc.incidentId);
              playTone(620, 0.02);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
              selectedIncidentId === inc.incidentId
                ? 'bg-rose-600/30 text-rose-100 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                : 'bg-black/50 text-zinc-400 border-white/10 hover:text-white hover:border-white/20'
            }`}
          >
            <FileWarning className="w-3.5 h-3.5 text-rose-400" />
            <span>{inc.incidentId}</span>
            <span className="text-[10px] text-zinc-400 font-mono">({inc.artifactId})</span>
          </button>
        ))}
      </div>

      {/* Incident Summary Card */}
      <div className="p-4 rounded-2xl bg-black/60 border border-rose-500/30 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-500/20 pb-2.5">
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span className="font-mono text-rose-400">{selectedIncident.incidentId}</span>
              <span>&bull;</span>
              <span>{selectedIncident.sourceFilename}</span>
            </div>
            <div className="text-[11px] text-rose-300/90 mt-0.5">
              <strong>Quarantine Reason:</strong> {selectedIncident.quarantineReason}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
              SSoT Mutation Delta: 0
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">{selectedIncident.quarantinedAt}</span>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => setActiveSubTab('DIFF')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'DIFF'
                ? 'bg-rose-500/20 text-rose-200 border border-rose-400/50'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Digest Comparison
          </button>
          <button
            onClick={() => setActiveSubTab('FIELDS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'FIELDS'
                ? 'bg-rose-500/20 text-rose-200 border border-rose-400/50'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>Field Mismatches</span>
            <span className="px-1.5 py-0.2 rounded bg-rose-500 text-black text-[9px] font-bold">
              {selectedIncident.fieldMismatches.length}
            </span>
          </button>
          <button
            onClick={() => setActiveSubTab('TIMELINE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'TIMELINE'
                ? 'bg-rose-500/20 text-rose-200 border border-rose-400/50'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Quarantine Timeline ({selectedIncident.eventTimeline.length} Steps)
          </button>
          <button
            onClick={() => setActiveSubTab('RAW_PAYLOAD')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'RAW_PAYLOAD'
                ? 'bg-rose-500/20 text-rose-200 border border-rose-400/50'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Side-by-Side JSON Payload
          </button>
        </div>
      </div>

      {/* Sub-Tab 1: Digest Comparison */}
      {activeSubTab === 'DIFF' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-black/70 border border-emerald-500/40 space-y-2">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  EXPECTED CANONICAL SHA-256 DIGEST
                </span>
                <button
                  onClick={() => handleCopy(selectedIncident.expectedSha256, 'exp-hash')}
                  className="text-zinc-400 hover:text-white text-[10px] flex items-center gap-1"
                >
                  {copiedKey === 'exp-hash' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'exp-hash' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-3 rounded-xl bg-black font-mono text-xs text-emerald-300 break-all border border-emerald-500/20">
                {selectedIncident.expectedSha256}
              </div>
              <div className="text-[11px] text-zinc-400">
                Derived from verified sovereign blueprint anchor under block #849202.
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-black/70 border border-rose-500/40 space-y-2">
              <div className="flex items-center justify-between text-xs text-rose-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-rose-400" />
                  ACTUAL COMPUTED TAMPERED DIGEST
                </span>
                <button
                  onClick={() => handleCopy(selectedIncident.actualSha256, 'act-hash')}
                  className="text-zinc-400 hover:text-white text-[10px] flex items-center gap-1"
                >
                  {copiedKey === 'act-hash' ? <Check className="w-3 h-3 text-rose-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'act-hash' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-3 rounded-xl bg-black font-mono text-xs text-rose-300 break-all border border-rose-500/20">
                {selectedIncident.actualSha256}
              </div>
              <div className="text-[11px] text-rose-300/80">
                Tampered hash generated by byte-level modification in quarantined artifact.
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-200 flex items-center gap-3">
            <Ban className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <strong>Cryptographic Verdict:</strong> Mismatch detected. System rejected canonical promotion and preserved
              immutable SSoT (Mutation Delta = 0).
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Field Mismatches */}
      {activeSubTab === 'FIELDS' && (
        <div className="space-y-3">
          {selectedIncident.fieldMismatches.map((field, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-black/60 border border-rose-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-rose-300">{field.fieldPath}</span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                  {field.severity} SEVERITY
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-300">
                  <span className="text-zinc-500 text-[10px] block">Expected Value:</span>
                  {field.expectedValue}
                </div>
                <div className="p-2 rounded-lg bg-rose-950/20 border border-rose-500/20 text-rose-300">
                  <span className="text-zinc-500 text-[10px] block">Quarantined Payload Value:</span>
                  {field.actualValue}
                </div>
              </div>

              <div className="text-[11px] text-zinc-400">{field.description}</div>
            </div>
          ))}
        </div>
      )}

      {/* Sub-Tab 3: Quarantine Timeline */}
      {activeSubTab === 'TIMELINE' && (
        <div className="space-y-2.5">
          {selectedIncident.eventTimeline.map((evt) => (
            <div
              key={evt.step}
              className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-start gap-3 text-xs"
            >
              <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 border border-rose-400/50 flex items-center justify-center font-mono font-bold shrink-0 text-[11px]">
                {evt.step}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{evt.phase}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">[{evt.actor}]</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-bold border ${
                        evt.status === 'PASSED'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : evt.status === 'FAILED'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {evt.status}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">{evt.timestamp}</span>
                  </div>
                </div>
                <p className="text-zinc-400 text-[11px]">{evt.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sub-Tab 4: Side-by-Side JSON Payload */}
      {activeSubTab === 'RAW_PAYLOAD' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Expected Canonical Schema</span>
            </div>
            <pre className="p-4 rounded-xl bg-black/80 border border-emerald-500/30 text-emerald-300/90 font-mono text-[11px] overflow-x-auto leading-relaxed max-h-[300px]">
              {selectedIncident.expectedPayloadReference}
            </pre>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4" />
              <span>Quarantined Payload (Tampered)</span>
            </div>
            <pre className="p-4 rounded-xl bg-black/80 border border-rose-500/30 text-rose-300/90 font-mono text-[11px] overflow-x-auto leading-relaxed max-h-[300px]">
              {selectedIncident.quarantinedRawPayload}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
