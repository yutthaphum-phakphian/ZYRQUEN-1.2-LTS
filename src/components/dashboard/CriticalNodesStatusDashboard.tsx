import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Zap,
  Activity,
  Cpu,
  Radio,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { AUTHORITATIVE_CONSTANTS } from '../../lib/canonicalResolver';

export type NodeOperationalStatus = 'PURE GREEN' | 'QUARANTINED' | 'REMEDIATING';

export interface CriticalNodeTelemetry {
  nodeId: string;
  regionLabel: string;
  roleTitle: string;
  status: NodeOperationalStatus;
  confidencePct: number;
  phaseJitterFs: number;
  latencyMs: number;
  pqcLatticeState: 'ML-DSA-87 ALIGNED' | 'LATTICE_FLUC_DETECTED' | 'RECALIBRATING';
  hsmQuorum: string;
  ssotDrift: string;
  lastUpdatedIso: string;
}

export interface CriticalNodesStatusDashboardProps {
  bk01Status: NodeOperationalStatus;
  isRemediating: boolean;
  remediationProgress: number;
  onTriggerBk01Quarantine: () => void;
  onRunBk01Remediation: () => void;
}

const OTHER_CRITICAL_NODES: CriticalNodeTelemetry[] = [
  {
    nodeId: 'SG02',
    regionLabel: 'Singapore Core Cluster (SG-01..10)',
    roleTitle: 'Fallback Port 8443 Stream Relay',
    status: 'PURE GREEN',
    confidencePct: 99.94,
    phaseJitterFs: 1.28,
    latencyMs: 18.4,
    pqcLatticeState: 'ML-DSA-87 ALIGNED',
    hsmQuorum: '10/10 VALID',
    ssotDrift: '0.00%',
    lastUpdatedIso: '2026-09-27T07:53:05.177Z',
  },
  {
    nodeId: 'TY03',
    regionLabel: 'Tokyo Sub-Kelvin Cryo Node',
    roleTitle: 'PQC Dilithium-5 Verifier',
    status: 'PURE GREEN',
    confidencePct: 99.91,
    phaseJitterFs: 1.31,
    latencyMs: 29.2,
    pqcLatticeState: 'ML-DSA-87 ALIGNED',
    hsmQuorum: '10/10 VALID',
    ssotDrift: '0.00%',
    lastUpdatedIso: '2026-09-27T07:53:05.177Z',
  },
  {
    nodeId: 'ZH04',
    regionLabel: 'Zurich WORM Ledger Vault',
    roleTitle: '14,902 Canonical Seals Anchor',
    status: 'PURE GREEN',
    confidencePct: 99.97,
    phaseJitterFs: 1.22,
    latencyMs: 34.6,
    pqcLatticeState: 'ML-DSA-87 ALIGNED',
    hsmQuorum: '10/10 VALID',
    ssotDrift: '0.00%',
    lastUpdatedIso: '2026-09-27T07:53:05.177Z',
  },
  {
    nodeId: 'SV05',
    regionLabel: 'Silicon Valley Quantum Sentinel',
    roleTitle: 'Neural Vector Topology Guard',
    status: 'PURE GREEN',
    confidencePct: 99.89,
    phaseJitterFs: 1.35,
    latencyMs: 38.1,
    pqcLatticeState: 'ML-DSA-87 ALIGNED',
    hsmQuorum: '10/10 VALID',
    ssotDrift: '0.00%',
    lastUpdatedIso: '2026-09-27T07:53:05.177Z',
  },
  {
    nodeId: 'LD06',
    regionLabel: 'London Legal Safe Harbor Node',
    roleTitle: 'ETDA Sec.9/26/28 & PDPA Sec.37',
    status: 'PURE GREEN',
    confidencePct: 99.95,
    phaseJitterFs: 1.29,
    latencyMs: 33.5,
    pqcLatticeState: 'ML-DSA-87 ALIGNED',
    hsmQuorum: '10/10 VALID',
    ssotDrift: '0.00%',
    lastUpdatedIso: '2026-09-27T07:53:05.177Z',
  },
];

export const CriticalNodesStatusDashboard: React.FC<CriticalNodesStatusDashboardProps> = ({
  bk01Status,
  isRemediating,
  remediationProgress,
  onTriggerBk01Quarantine,
  onRunBk01Remediation,
}) => {
  const bk01Node: CriticalNodeTelemetry = {
    nodeId: 'BK01',
    regionLabel: 'Bangkok Sovereign Primary Node',
    roleTitle: `Genesis #${AUTHORITATIVE_CONSTANTS.GENESIS_BLOCK_HEIGHT} Master Authority`,
    status: isRemediating ? 'REMEDIATING' : bk01Status,
    confidencePct: bk01Status === 'QUARANTINED' ? 98.4 : 99.98,
    phaseJitterFs: bk01Status === 'QUARANTINED' ? 5.82 : 1.33,
    latencyMs: bk01Status === 'QUARANTINED' ? 142.6 : 35.8,
    pqcLatticeState:
      isRemediating
        ? 'RECALIBRATING'
        : bk01Status === 'QUARANTINED'
          ? 'LATTICE_FLUC_DETECTED'
          : 'ML-DSA-87 ALIGNED',
    hsmQuorum: '10/10 VALID',
    ssotDrift: '0.00%',
    lastUpdatedIso: '2026-09-27T07:53:05.177Z',
  };

  const allNodes = [bk01Node, ...OTHER_CRITICAL_NODES];
  const pureGreenCount = allNodes.filter((n) => n.status === 'PURE GREEN').length;

  const renderStatusIndicator = (status: NodeOperationalStatus) => {
    if (status === 'PURE GREEN') {
      return (
        <span
          data-testid="status-indicator-pure-green"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
          PURE GREEN
        </span>
      );
    }
    if (status === 'REMEDIATING') {
      return (
        <span
          data-testid="status-indicator-remediating"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50"
        >
          <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
          REMEDIATING ({remediationProgress}%)
        </span>
      );
    }
    return (
      <span
        data-testid="status-indicator-quarantined"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50"
      >
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
        QUARANTINED
      </span>
    );
  };

  return (
    <div
      data-testid="critical-nodes-status-dashboard"
      className="bg-slate-900/85 border border-slate-800 rounded-xl p-5 space-y-4 font-mono"
    >
      {/* Top Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              CRITICAL NODES TELEMETRY MATRIX
            </span>
            <span className="text-[11px] font-bold text-emerald-400">
              {pureGreenCount}/{allNodes.length} NODES PURE GREEN
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-100">
            🌐 Real-Time Critical Nodes Status Dashboard (BK01 Sovereign Focus)
          </h3>
        </div>

        {/* Interactive BK01 Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onTriggerBk01Quarantine}
            disabled={isRemediating || bk01Status === 'QUARANTINED'}
            className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 disabled:opacity-40 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Simulate BK01 Anomaly (Quarantine)</span>
          </button>

          <button
            type="button"
            onClick={onRunBk01Remediation}
            disabled={isRemediating}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-950/50 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>
              {isRemediating
                ? `Remediating BK01 (${remediationProgress}%)...`
                : 'Initiate BK01 Remediation Sequence'}
            </span>
          </button>
        </div>
      </div>

      {/* Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {allNodes.map((node) => {
          const isBk01 = node.nodeId === 'BK01';
          const isQuarantined = node.status === 'QUARANTINED';
          const isNodeRemediating = node.status === 'REMEDIATING';

          return (
            <div
              key={node.nodeId}
              data-testid={`critical-node-card-${node.nodeId}`}
              data-status={node.status}
              data-isolation-zone={isQuarantined ? 'ACTIVE' : 'INACTIVE'}
              className={`relative overflow-hidden p-4 rounded-xl border transition-all space-y-3 ${
                isQuarantined
                  ? `isolation-zone-pulse ${
                      isBk01 ? 'bk01-isolation-zone' : ''
                    } bg-rose-950/35 border-amber-500/80 shadow-lg shadow-rose-950/40`
                  : isNodeRemediating
                    ? 'bg-amber-950/25 border-amber-500/60 shadow-lg shadow-amber-950/30'
                    : isBk01
                      ? 'bg-slate-950 border-emerald-500/50 shadow-lg shadow-emerald-950/20'
                      : 'bg-slate-950/90 border-slate-800'
              }`}
            >
              {isQuarantined && (
                <div
                  data-testid={`isolation-zone-overlay-${node.nodeId}`}
                  aria-hidden="true"
                  className={`isolation-zone-overlay ${
                    isBk01 ? 'bk01-isolation-zone-overlay' : ''
                  }`}
                />
              )}

              <div className="relative z-10 space-y-3">
                {isQuarantined && (
                  <div
                    data-testid={`isolation-zone-banner-${node.nodeId}`}
                    className="flex items-center justify-between gap-2 px-2.5 py-1 rounded-lg bg-rose-950/80 border border-amber-500/60 text-[9px] font-bold tracking-wider uppercase text-amber-300"
                  >
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-rose-400 animate-pulse shrink-0" />
                      <span>ISOLATION ZONE • CHAMBER 02 QUARANTINE</span>
                    </span>
                    <span className="text-rose-300">RING-04</span>
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">{node.nodeId}</span>
                      {isBk01 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold">
                          PRIMARY ANCHOR
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-300 font-semibold mt-0.5">
                      {node.regionLabel}
                    </div>
                    <div className="text-[10px] text-slate-500">{node.roleTitle}</div>
                  </div>

                  {renderStatusIndicator(node.status)}
                </div>

                {/* Telemetry Metrics Bar */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[10px]">
                  <div className="bg-slate-900/70 p-2 rounded border border-slate-800/60">
                    <div className="text-slate-500">PHASE JITTER</div>
                    <div
                      className={`font-bold mt-0.5 ${
                        node.phaseJitterFs > 3.0 ? 'text-rose-400' : 'text-cyan-300'
                      }`}
                    >
                      {node.phaseJitterFs.toFixed(2)} fs
                    </div>
                  </div>
                  <div className="bg-slate-900/70 p-2 rounded border border-slate-800/60">
                    <div className="text-slate-500">PORT 8443 SLA</div>
                    <div
                      className={`font-bold mt-0.5 ${
                        node.latencyMs > 100 ? 'text-amber-400' : 'text-emerald-300'
                      }`}
                    >
                      {node.latencyMs.toFixed(1)} ms
                    </div>
                  </div>
                  <div className="bg-slate-900/70 p-2 rounded border border-slate-800/60">
                    <div className="text-slate-500">SSoT DRIFT</div>
                    <div className="font-bold text-emerald-400 mt-0.5">{node.ssotDrift}</div>
                  </div>
                </div>

                {/* PQC & Quorum Footer */}
                <div className="flex items-center justify-between text-[10px] pt-1">
                  <span
                    className={`font-semibold ${
                      node.pqcLatticeState === 'ML-DSA-87 ALIGNED'
                        ? 'text-emerald-400'
                        : node.pqcLatticeState === 'RECALIBRATING'
                          ? 'text-amber-300'
                          : 'text-rose-400'
                    }`}
                  >
                    PQC: {node.pqcLatticeState}
                  </span>
                  <span className="text-slate-400">HSM: {node.hsmQuorum}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
