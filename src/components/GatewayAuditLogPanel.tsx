import React, { useState } from 'react';
import {
  ShieldCheck,
  X,
  Activity,
  AlertTriangle,
  Clock,
  Filter,
  Play,
  Pause,
  PlusCircle,
  ArrowRight,
  Award,
  Download,
  FileJson,
  CheckCircle2,
} from 'lucide-react';
import {
  GatewayStateAuditEntry,
  INITIAL_GATEWAY_AUDIT_LOGS,
} from '../utils/hologramMaterial';
import { ZYRQUEN_SIGNED_SNAPSHOT } from '../data/zyrquenSignedSnapshot';
import { playTone } from './AudioSynthesizer';

export type GatewayAuditSeverity = 'VERIFIED' | 'INFO' | 'WARNING' | 'CRITICAL';

export interface EnhancedGatewayAuditEntry extends GatewayStateAuditEntry {
  severity: GatewayAuditSeverity;
  sector: string;
  deltaDrift: string;
}

export const INITIAL_ENHANCED_GATEWAY_LOGS: EnhancedGatewayAuditEntry[] =
  INITIAL_GATEWAY_AUDIT_LOGS.map((entry, index) => ({
    ...entry,
    severity:
      index === 0 || index === 1
        ? 'VERIFIED'
        : index === 2
        ? 'WARNING'
        : index === 4
        ? 'VERIFIED'
        : 'INFO',
    sector:
      entry.dimensionCode === 'DIM-00'
        ? 'Sector 00-GENESIS'
        : entry.dimensionCode === 'DIM-01'
        ? 'Sector 01-UNIFIER'
        : entry.dimensionCode === 'DIM-02'
        ? 'Sector 02-GAMMA'
        : entry.dimensionCode === 'DIM-09'
        ? 'Sector 08-XF4'
        : 'Sector 10-NEXUS',
    deltaDrift: 'Δ0 = 0.000%',
  }));

export interface GatewayAuditLogSlideOutPanelProps {
  isOpen: boolean;
  onClose: () => void;
  logs: EnhancedGatewayAuditEntry[];
  onTriggerTransition: (customSeverity?: GatewayAuditSeverity) => void;
  onClearLogs?: () => void;
  autoStreamEnabled: boolean;
  onToggleAutoStream: () => void;
}

const SEVERITY_BADGE_STYLES: Record<
  GatewayAuditSeverity,
  { bg: string; border: string; text: string; label: string }
> = {
  VERIFIED: {
    bg: 'bg-emerald-950/70',
    border: 'border-emerald-500/50',
    text: 'text-emerald-300',
    label: 'GOLD SEAL VERIFIED',
  },
  INFO: {
    bg: 'bg-cyan-950/70',
    border: 'border-cyan-500/50',
    text: 'text-cyan-300',
    label: 'GATEWAY SYNC',
  },
  WARNING: {
    bg: 'bg-amber-950/70',
    border: 'border-amber-500/50',
    text: 'text-amber-300',
    label: 'SHIELD REROUTE',
  },
  CRITICAL: {
    bg: 'bg-rose-950/70',
    border: 'border-rose-500/50',
    text: 'text-rose-300',
    label: 'ANOMALY ISOLATED',
  },
};

export const GatewayAuditLogSlideOutPanel: React.FC<GatewayAuditLogSlideOutPanelProps> = ({
  isOpen,
  onClose,
  logs,
  onTriggerTransition,
  onClearLogs,
  autoStreamEnabled,
  onToggleAutoStream,
}) => {
  const [severityFilter, setSeverityFilter] = useState<'ALL' | GatewayAuditSeverity>('ALL');
  const [dimensionFilter, setDimensionFilter] = useState<string>('ALL');
  const [activeDrawerTab, setActiveDrawerTab] = useState<'TRANSITIONS' | 'SNAPSHOT'>('TRANSITIONS');

  if (!isOpen) return null;

  const filteredLogs = logs.filter((item) => {
    const matchSev = severityFilter === 'ALL' || item.severity === severityFilter;
    const matchDim = dimensionFilter === 'ALL' || item.dimensionCode === dimensionFilter;
    return matchSev && matchDim;
  });

  const handleDownloadSnapshot = () => {
    playTone(740, 0.04);
    const jsonString = JSON.stringify(ZYRQUEN_SIGNED_SNAPSHOT, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'zyrquen-signed-snapshot.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-out Audit Log Panel */}
      <aside
        aria-label="Gold Seal Verification Console Gateway Audit Log"
        className="w-full max-w-2xl bg-[#060a15] border-l border-[#D4AF37]/40 h-full flex flex-col justify-between shadow-2xl font-mono text-xs overflow-hidden"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0a1022] via-[#0c1428] to-[#080c18] border-b border-white/10 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider">
                  GOLD SEAL VERIFICATION CONSOLE · REAL-TIME AUDIT LOG &amp; SIGNED SNAPSHOT
                </span>
              </div>
              <h3 className="text-base font-bold text-white">
                Sovereign Dimension Gateway State Transitions
              </h3>
              <p className="text-[11px] text-zinc-400 font-sans">
                Monitors every dimension gateway state transition in real-time with PQC HSM quorum signatures, timestamps, severity indicators, and Signed Snapshot ({ZYRQUEN_SIGNED_SNAPSHOT.snapshot_header.snapshot_id}).
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                playTone(520, 0.03);
                onClose();
              }}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white cursor-pointer"
              title="Close Audit Log Slide-Out Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer View Mode Selector + Download Signed Snapshot */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-black/50 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  playTone(620, 0.03);
                  setActiveDrawerTab('TRANSITIONS');
                }}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-colors ${
                  activeDrawerTab === 'TRANSITIONS'
                    ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Gateway Transitions ({logs.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  playTone(660, 0.03);
                  setActiveDrawerTab('SNAPSHOT');
                }}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
                  activeDrawerTab === 'SNAPSHOT'
                    ? 'bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/50'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <FileJson className="w-3.5 h-3.5" />
                <span>zyrquen-signed-snapshot.json</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadSnapshot}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/50 text-emerald-300 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Signed JSON</span>
            </button>
          </div>

          {activeDrawerTab === 'TRANSITIONS' && (
            <>
              {/* Live Stream & Simulation Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      playTone(680, 0.04);
                      onTriggerTransition('VERIFIED');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/50 text-[#D4AF37] font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Log Gateway Seal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playTone(580, 0.04);
                      onTriggerTransition('WARNING');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/70 border border-amber-500/40 text-amber-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Simulate Shield Reroute</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playTone(460, 0.04);
                      onTriggerTransition('CRITICAL');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/70 border border-rose-500/40 text-rose-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Activity className="w-3.5 h-3.5 text-rose-400" />
                    <span>Test Anomaly Isolate</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    playTone(640, 0.03);
                    onToggleAutoStream();
                  }}
                  className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 cursor-pointer ${
                    autoStreamEnabled
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                      : 'bg-black/50 border-white/10 text-zinc-400'
                  }`}
                >
                  {autoStreamEnabled ? (
                    <Pause className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                  <span>{autoStreamEnabled ? 'Live Capture: ON' : 'Live Capture: PAUSED'}</span>
                </button>
              </div>

              {/* Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                <div className="flex items-center gap-1 flex-wrap">
                  <Filter className="w-3.5 h-3.5 text-cyan-400 mr-1" />
                  {(['ALL', 'VERIFIED', 'INFO', 'WARNING', 'CRITICAL'] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverityFilter(sev)}
                      className={`px-2 py-0.5 rounded text-[10px] border cursor-pointer ${
                        severityFilter === sev
                          ? 'bg-cyan-500/20 border-cyan-400 text-white font-semibold'
                          : 'bg-black/40 border-white/10 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>

                <select
                  value={dimensionFilter}
                  onChange={(e) => setDimensionFilter(e.target.value)}
                  className="bg-black/60 border border-white/15 rounded px-2 py-1 text-[11px] text-cyan-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="ALL">All Dimensions (DIM-00..11)</option>
                  <option value="DIM-00">DIM-00 (Genesis Anchor)</option>
                  <option value="DIM-01">DIM-01 (Runtime Unifier)</option>
                  <option value="DIM-02">DIM-02 (Buffer Gamma)</option>
                  <option value="DIM-09">DIM-09 (Telemetry 8443)</option>
                  <option value="DIM-10">DIM-10 (Router Shield)</option>
                  <option value="DIM-11">DIM-11 (Celestial-Haven)</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Scrollable Content Area */}
        {activeDrawerTab === 'TRANSITIONS' ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 tabular-nums">
            {filteredLogs.map((log) => {
              const style = SEVERITY_BADGE_STYLES[log.severity];
              return (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-[#0a1020] border border-white/10 hover:border-cyan-500/30 transition-colors space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold text-[11px]">
                        {log.dimensionCode}
                      </span>
                      <span className="text-white font-semibold">{log.gatewayName}</span>
                      <span className="text-[10px] text-zinc-400">({log.sector})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${style.bg} ${style.border} ${style.text}`}
                      >
                        {style.label}
                      </span>
                      <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span>{log.timestamp}</span>
                      </span>
                    </div>
                  </div>

                  {/* State Transition Flow */}
                  <div className="p-2 rounded-lg bg-black/50 border border-white/5 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-zinc-400">{log.previousState}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span className="text-emerald-300 font-semibold">{log.newState}</span>
                    </div>
                    <div className="text-[11px] text-cyan-300">
                      Latency: <strong>{log.latencyMs.toFixed(2)} ms</strong> · {log.deltaDrift}
                    </div>
                  </div>

                  {/* Cryptographic Attestation Metadata */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-zinc-400">
                    <span>Quorum: <strong className="text-zinc-200">{log.quorumSignature}</strong></span>
                    <span>Merkle: <strong className="text-amber-300">{log.merkleProof}</strong></span>
                    <span>Actor: <strong className="text-cyan-300">{log.actor}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 tabular-nums">
            <div className="p-3 rounded-xl bg-[#0a1020] border border-[#D4AF37]/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#D4AF37] font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{ZYRQUEN_SIGNED_SNAPSHOT.snapshot_header.snapshot_id}</span>
                </span>
                <span className="text-emerald-300 font-bold">
                  {ZYRQUEN_SIGNED_SNAPSHOT.signature_proof.verifier_status}
                </span>
              </div>
              <div className="text-[11px] text-zinc-300">
                Principal: <strong>{ZYRQUEN_SIGNED_SNAPSHOT.snapshot_header.sovereign_principal.name}</strong> ({ZYRQUEN_SIGNED_SNAPSHOT.snapshot_header.sovereign_principal.id})
              </div>
              <div className="text-[11px] text-cyan-300 break-all">
                Merkle Root: {ZYRQUEN_SIGNED_SNAPSHOT.ledger_state.merkle_root_hash}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-300 pt-1">
                <div>Canonical / Local: #{ZYRQUEN_SIGNED_SNAPSHOT.ledger_state.canonical_block_height} / #{ZYRQUEN_SIGNED_SNAPSHOT.ledger_state.local_block_height}</div>
                <div>Drift: <strong className="text-emerald-400">{ZYRQUEN_SIGNED_SNAPSHOT.ledger_state.consensus_drift}</strong></div>
                <div>Active Seals: <strong>{ZYRQUEN_SIGNED_SNAPSHOT.seal_registry.active_intact_seals.toLocaleString()}</strong> / {ZYRQUEN_SIGNED_SNAPSHOT.seal_registry.total_seals_in_pool.toLocaleString()}</div>
                <div>Quarantine: <strong className="text-amber-300">{ZYRQUEN_SIGNED_SNAPSHOT.seal_registry.quarantined_seals} Seals ({ZYRQUEN_SIGNED_SNAPSHOT.seal_registry.quarantine_chamber})</strong></div>
              </div>
            </div>

            <pre className="p-3 rounded-xl bg-[#040710] border border-white/10 text-[11px] text-cyan-200 overflow-x-auto leading-relaxed select-all">
              {JSON.stringify(ZYRQUEN_SIGNED_SNAPSHOT, null, 2)}
            </pre>
          </div>
        )}

        {/* Footer Summary */}
        <div className="p-4 bg-[#080d1a] border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400 tabular-nums">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            <span>
              Total Transitions Logged: <strong className="text-white">{logs.length}</strong> · SSoT Δ0 = 0.000%
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onClearLogs && (
              <button
                type="button"
                onClick={onClearLogs}
                className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 cursor-pointer"
              >
                Reset Baseline
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 font-semibold cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default GatewayAuditLogSlideOutPanel;
