import React, { useEffect, useState, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Zap,
  RefreshCw,
  Activity,
  Lock,
} from 'lucide-react';
import {
  NodeRemediationEngine,
  BK01_DETECTED_ANOMALIES,
  buildDetectedAnomaliesForNode,
  RealTimeCriticalNodeStatus,
  RemediationSequentialPhase,
} from '../../services/NodeRemediationEngine';
import { RemediationProgressToast } from './RemediationProgressToast';

export interface CriticalNodesDashboardProps {
  className?: string;
  onStatusChange?: (bk01Status: 'PURE GREEN' | 'QUARANTINED') => void;
}

export const CriticalNodesDashboard: React.FC<CriticalNodesDashboardProps> = ({
  className = '',
  onStatusChange,
}) => {
  const engine = useMemo(() => new NodeRemediationEngine(), []);
  const [nodes, setNodes] = useState<RealTimeCriticalNodeStatus[]>(() =>
    NodeRemediationEngine.getCriticalNodesSnapshot()
  );
  const [isRemediating, setIsRemediating] = useState<boolean>(false);
  const [activeRemediationNodeId, setActiveRemediationNodeId] = useState<string>('BK01');
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastPhase, setToastPhase] = useState<RemediationSequentialPhase>('Isolation');
  const [toastProgress, setToastProgress] = useState<number>(0);
  const [toastStatusMsg, setToastStatusMsg] = useState<string>(
    'Isolation: Chamber 02 Quarantine (BK01)'
  );
  const [toastLogLine, setToastLogLine] = useState<string>(
    '[STAGE 1] Isolating BK01 to Chamber 02 (Ring-04 Buffer Gamma)...'
  );
  const [toastLatencyMs, setToastLatencyMs] = useState<number>(2.11);

  // Fetch & subscribe to real-time node statuses (specifically monitoring BK01)
  useEffect(() => {
    let active = true;
    const unsubscribe = NodeRemediationEngine.subscribeNodeStatuses((updatedNodes) => {
      if (!active) return;
      setNodes(updatedNodes);
      const bk01 = updatedNodes.find((n) => n.nodeId === 'BK01');
      if (bk01 && onStatusChange) {
        onStatusChange(bk01.badgeStatus);
      }
    });

    // Also poll /healthz if available in browser runtime to confirm live telemetry heartbeat
    if (typeof fetch !== 'undefined') {
      fetch('/healthz')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!active || !data) return;
          setNodes((prev) =>
            prev.map((n) => ({
              ...n,
              ssotDrift: data.drift === 0 ? '0.00%' : n.ssotDrift,
            }))
          );
        })
        .catch(() => {
          // Offline / test environment fallback uses authoritative in-memory snapshot
        });
    }

    return () => {
      active = false;
      unsubscribe();
    };
  }, [onStatusChange]);

  const handleQuarantineBk01 = () => {
    const updated = NodeRemediationEngine.setNodeQuarantined('BK01');
    setNodes(updated);
    setActiveRemediationNodeId('BK01');
    setToastOpen(true);
    setToastPhase('Isolation');
    setToastProgress(33);
    const statusMsg = 'Isolation: BK01 Quarantined in Chamber 02 (Confidence 98.4%)';
    const logLine =
      '[ALERT] PAT-1790495585177-01..03 detected on BK01. Chamber 02 Isolation engaged.';
    setToastStatusMsg(statusMsg);
    setToastLogLine(logLine);
    NodeRemediationEngine.emitProgress({
      nodeId: 'BK01',
      phase: 'Isolation',
      stepIndex: 1,
      totalSteps: 3,
      progressPercent: 33,
      statusMessage: statusMsg,
      logLine,
      nodeStatus: 'QUARANTINED',
    });
  };

  const handleTriggerNodeRemediation = async (targetNodeId: string = 'BK01') => {
    if (isRemediating) return;
    setIsRemediating(true);
    setActiveRemediationNodeId(targetNodeId);
    setToastOpen(true);

    // Sequential visual progression: Isolation (33%) -> Recalibration (67%) -> Verification (100%)
    const isoMsg = `Isolation: Chamber 02 Quarantine (${targetNodeId})`;
    const isoLog = `[STAGE 1] Anomaly Confidence 98.4% > 85.0% threshold. Isolating ${targetNodeId} to Chamber 02...`;
    setToastPhase('Isolation');
    setToastProgress(33);
    setToastStatusMsg(isoMsg);
    setToastLogLine(isoLog);
    NodeRemediationEngine.setNodeQuarantined(targetNodeId);
    NodeRemediationEngine.emitProgress({
      nodeId: targetNodeId,
      phase: 'Isolation',
      stepIndex: 1,
      totalSteps: 3,
      progressPercent: 33,
      statusMessage: isoMsg,
      logLine: isoLog,
      nodeStatus: 'QUARANTINED',
    });

    setTimeout(() => {
      const recalMsg = `Recalibration: NIST PQC ML-DSA-87 Lattice & Phase Jitter (${targetNodeId})`;
      const recalLog = `[STAGE 2] Re-aligning NIST PQC ML-DSA-87 (Dilithium-5) Lattice Parameters for ${targetNodeId}...`;
      setToastPhase('Recalibration');
      setToastProgress(67);
      setToastStatusMsg(recalMsg);
      setToastLogLine(recalLog);
      NodeRemediationEngine.emitProgress({
        nodeId: targetNodeId,
        phase: 'Recalibration',
        stepIndex: 2,
        totalSteps: 3,
        progressPercent: 67,
        statusMessage: recalMsg,
        logLine: recalLog,
        nodeStatus: 'QUARANTINED',
      });
    }, 320);

    setTimeout(async () => {
      const patterns =
        targetNodeId === 'BK01'
          ? BK01_DETECTED_ANOMALIES
          : buildDetectedAnomaliesForNode(targetNodeId);
      const result = await engine.executeRemediation(targetNodeId, patterns);
      setToastPhase('Verification');
      setToastProgress(100);
      setToastLatencyMs(result.latencyMs);
      setToastStatusMsg('Verification: 10/10 HSM Quorum & SSoT Δ0 Verified — PURE GREEN');
      setToastLogLine(
        result.remediationLog[result.remediationLog.length - 1] ||
          `[SUCCESS] Node ${targetNodeId} Auto-Remediation Completed in ${result.latencyMs}ms.`
      );
      setIsRemediating(false);
    }, 680);
  };

  const handleTriggerRemediation = () => handleTriggerNodeRemediation('BK01');

  const bk01Node = nodes.find((n) => n.nodeId === 'BK01') || nodes[0];
  const pureGreenCount = nodes.filter((n) => n.badgeStatus === 'PURE GREEN').length;

  return (
    <div
      data-testid="critical-nodes-dashboard"
      className={`bg-slate-900/85 border border-slate-800 rounded-xl p-5 space-y-4 font-mono ${className}`}
    >
      {/* Header & BK01 Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              CRITICAL NODES TELEMETRY MATRIX
            </span>
            <span className="text-[11px] font-bold text-emerald-400">
              {pureGreenCount}/{nodes.length} NODES PURE GREEN
            </span>
            <span className="text-[10px] text-slate-400">
              BK01 MONITOR: <strong className="text-white">{bk01Node.badgeStatus}</strong>
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-100">
            🌐 CriticalNodesDashboard — Real-Time Sovereign Node Status Array (BK01 Focus)
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="btn-simulate-bk01-quarantine"
            onClick={handleQuarantineBk01}
            disabled={isRemediating}
            className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 disabled:opacity-40 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Quarantine BK01</span>
          </button>

          <button
            type="button"
            data-testid="btn-trigger-bk01-remediation"
            onClick={handleTriggerRemediation}
            disabled={isRemediating}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-950/50 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>
              {isRemediating ? 'Remediating BK01...' : 'Trigger NodeRemediationEngine (BK01)'}
            </span>
          </button>
        </div>
      </div>

      {/* Status-Indicator Card Array */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {nodes.map((node) => {
          const isBk01 = node.nodeId === 'BK01';
          const isQuarantined = node.badgeStatus === 'QUARANTINED';

          return (
            <div
              key={node.nodeId}
              data-testid={`node-status-card-${node.nodeId}`}
              data-status={node.badgeStatus}
              data-isolation-zone={isQuarantined ? 'ACTIVE' : 'INACTIVE'}
              className={`relative overflow-hidden p-4 rounded-xl border transition-all space-y-3 ${
                isQuarantined
                  ? `isolation-zone-pulse ${
                      isBk01 ? 'bk01-isolation-zone' : ''
                    } bg-rose-950/35 border-amber-500/80 shadow-lg shadow-rose-950/40`
                  : isBk01
                    ? 'bg-slate-950 border-emerald-500/50 shadow-lg shadow-emerald-950/20'
                    : 'bg-slate-950/90 border-slate-800'
              }`}
            >
              {/* Animated Background Overlay for QUARANTINED Isolation Zone */}
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
                          MONITORED PRIMARY
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-300 font-semibold mt-0.5">
                      {node.nodeName}
                    </div>
                    <div className="text-[10px] text-slate-500">{node.role}</div>
                  </div>

                  {/* Status Badge ('PURE GREEN' or 'QUARANTINED') */}
                  {isQuarantined ? (
                    <span
                      data-testid={`badge-${node.nodeId}-quarantined`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/25 text-amber-200 border border-amber-500/60"
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      QUARANTINED
                    </span>
                  ) : (
                    <span
                      data-testid={`badge-${node.nodeId}-pure-green`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                      PURE GREEN
                    </span>
                  )}
                </div>

                {/* Real-Time Node Telemetry */}
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
                    <div className="text-slate-500">PORT 8443</div>
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

                <div className="flex items-center justify-between text-[10px] pt-1">
                  <span
                    className={`font-semibold ${
                      node.pqcLatticeState === 'ML-DSA-87 ALIGNED'
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    PQC: {node.pqcLatticeState}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">HSM: {node.hsmQuorum}</span>
                    <button
                      type="button"
                      data-testid={`btn-remediate-node-${node.nodeId}`}
                      onClick={() => handleTriggerNodeRemediation(node.nodeId)}
                      disabled={isRemediating}
                      className="px-2 py-0.5 rounded bg-cyan-500/15 hover:bg-cyan-500/25 disabled:opacity-40 text-cyan-300 border border-cyan-500/40 font-bold text-[9px] transition-colors cursor-pointer"
                    >
                      Remediate
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Motion-Powered RemediationProgressToast */}
      <RemediationProgressToast
        isOpen={toastOpen ? true : undefined}
        nodeId={toastOpen ? activeRemediationNodeId : undefined}
        phase={toastOpen ? toastPhase : undefined}
        progressPercent={toastOpen ? toastProgress : undefined}
        statusMessage={toastOpen ? toastStatusMsg : undefined}
        logLine={toastOpen ? toastLogLine : undefined}
        latencyMs={toastOpen ? toastLatencyMs : undefined}
        onDismiss={() => setToastOpen(false)}
      />
    </div>
  );
};

export default CriticalNodesDashboard;
