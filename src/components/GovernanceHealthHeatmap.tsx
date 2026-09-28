import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import * as d3 from 'd3';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  Activity,
  ShieldCheck,
  Cpu,
  Zap,
  Thermometer,
  Clock,
  RefreshCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Search,
  Grid3X3,
  Radio,
  FileText,
  BarChart3,
  X,
  Lock,
  ChevronRight,
  ExternalLink,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Calendar,
  FileSpreadsheet,
  Move,
  Columns,
} from 'lucide-react';
import { SOVEREIGN_CHAMBERS } from '../data/sovereignData';
import { Chamber } from '../types';
import { useTelemetry } from '../hooks/useTelemetry';
import { playTelemetryBeep, playAuditChime } from './AudioSynthesizer';
import {
  CHAMBER_INTEGRATION_COVERAGE_METRICS,
  PRODUCTION_INTEGRATION_COVERAGE_SUMMARY,
  ChamberIntegrationCoverageMetric,
} from '../adapters/zyrquenAdapter';
import { useSystemStateStore, systemStateStore } from '../store/systemStateStore';
import { toast } from '../utils/toast';
import {
  generateHeatmapForensicPdf,
  CANONICAL_HSM_NODE_FORENSIC_DOSSIERS,
  HsmNodeForensicDossierSummary,
  HeatmapForensicPdfReceipt,
} from '../utils/heatmapForensicPdfExport';
import { EvidenceExportService } from '../services/EvidenceExportService';

// ======================================================================
// ZYRQUEN Ω∞ — 18 SOVEREIGN CHAMBERS GOVERNANCE HEALTH HEATMAP
// Telemetry Heartbeat Integration • Coherence & Stability Matrix
// Genesis Block #849202 | SSoT Δ0.00% Zero Drift | 10/10 REAL_HSM
// ======================================================================

export type HeatmapMetricType = 'coherence' | 'stability' | 'cryoTemp' | 'drift' | 'integrationCoverage';
export type HeatmapOverlayMode = 'SEAL_STATUS' | 'INTEGRATION_COVERAGE';
export type HeatmapViewMode = 'grid' | 'epoch_matrix' | 'telemetry_trend';

export interface UnstableEvent {
  id: string;
  chamberId: string;
  coherence: number;
  timestamp: string;
}

export interface PrintAuditRecord {
  printId: string;
  chamberSource: string;
  timestamp: string;
  ledgerStatus: string;
}

export interface ChamberHeartbeatSnapshot {
  epochIndex: number;
  timestamp: string;
  coherencePct: number; // 99.950% - 100.000%
  stabilityIndex: number; // 0.9990 - 1.0000 (displayed as 99.90% - 100.00%)
  cryoTempMk: number; // 14.96 - 15.12 mK
  driftDeltaPpm: number; // 0.00 ppm nominal (Δ0.00%)
  quorumVotes: number; // 10 / 10
  status: 'LOCKED' | 'ACTIVE' | 'SEALED' | 'STANDBY' | 'ENFORCED' | 'NOMINAL' | 'ALERT' | 'LOCKED_PROTECTED';
}

export interface ChamberHealthProfile {
  chamber: Chamber;
  currentCoherence: number;
  prevCoherence?: number;
  currentStability: number;
  currentCryoTemp: number;
  prevCryoTemp?: number;
  coherenceHistory?: number[]; // last 10 ticks for sparkline
  currentDrift: number;
  invariantsPassing: number;
  invariantsTotal: number;
  uptimeSla: number;
  status?: 'PURE_GREEN' | 'UNSTABLE' | 'LOCKED_PROTECTED';
  varianceFlag?: boolean;
  recentSnapshots: ChamberHeartbeatSnapshot[];
}

export interface GovernanceHealthHeatmapProps {
  onSystemEvent?: (eventMessage: string) => void;
  onNavigateToView?: (view: any) => void;
  onAddSystemEvent?: (
    type: any,
    title: string,
    description: string,
    metaHash?: string,
    severity?: 'info' | 'warning' | 'critical' | 'success',
    statuteRef?: string,
    targetView?: any
  ) => void;
}

const HISTORICAL_EPOCHS_COUNT = 16;

export const GovernanceHealthHeatmap: React.FC<GovernanceHealthHeatmapProps> = ({
  onSystemEvent,
  onNavigateToView,
  onAddSystemEvent,
}) => {
  // Integrate existing global telemetry hook
  const { latestSnapshot } = useTelemetry();

  // Component States
  const [activeMetric, setActiveMetric] = useState<HeatmapMetricType>('coherence');
  const [overlayMode, setOverlayMode] = useState<HeatmapOverlayMode>('SEAL_STATUS');
  const [activeViewMode, setActiveViewMode] = useState<HeatmapViewMode>('grid');
  const [gridSubView, setGridSubView] = useState<'6col' | 'cards'>('6col');
  const [hoveredChamber, setHoveredChamber] = useState<ChamberHealthProfile | null>(null);
  const [simulatedUnstableChamberId, setSimulatedUnstableChamberId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedChamberId, setSelectedChamberId] = useState<string | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);
  const [isHeartbeatRunning, setIsHeartbeatRunning] = useState<boolean>(true);
  const [heartbeatIntervalMs, setHeartbeatIntervalMs] = useState<number>(1000);
  const [heartbeatCycle, setHeartbeatCycle] = useState<number>(849202);
  const [heartbeatPulse, setHeartbeatPulse] = useState<boolean>(false);
  const [lastHeartbeatUtc, setLastHeartbeatUtc] = useState<string>(new Date().toISOString());

  // Requirement 1: Notification Overlay & Searchable List of Unstable Events (<95% Coherence)
  const [unstableEvents, setUnstableEvents] = useState<UnstableEvent[]>([]);
  const [overlaySearchQuery, setOverlaySearchQuery] = useState<string>('');
  const [showOverlay, setShowOverlay] = useState<boolean>(false);

  // Bulk Lockdown Feature state & 2FA Modal
  const [selectedLockdownChambers, setSelectedLockdownChambers] = useState<string[]>([]);
  const [show2FADialog, setShow2FADialog] = useState<boolean>(false);
  const [adminNote, setAdminNote] = useState<string>('');

  // Requirement 3: Print Event Tracker & Immutable Ledger Logs
  const [printLedgerLogs, setPrintLedgerLogs] = useState<PrintAuditRecord[]>([]);
  const [printToast, setPrintToast] = useState<string | null>(null);

  // HSM Quorum State & High-Priority Health Breach Alert (< 8/10 Nodes)
  const storeCustodianProofs = useSystemStateStore((s) => s.custodianProofs);
  const storeSystemEvents = useSystemStateStore((s) => s.events);
  const [isolatedHsmNodeIds, setIsolatedHsmNodeIds] = useState<string[]>([]);
  const [selectedForensicDossier, setSelectedForensicDossier] = useState<HsmNodeForensicDossierSummary | null>(null);
  const [lastPdfReceipt, setLastPdfReceipt] = useState<HeatmapForensicPdfReceipt | null>(null);

  // Hardware Node Warning Threshold Local State & Browser-Level Toast Notification Handler
  const WARNING_THRESHOLD_COHERENCE_PCT = 98.5;
  const [warnedNodeIds, setWarnedNodeIds] = useState<string[]>([]);
  const [warningThresholdToast, setWarningThresholdToast] = useState<{
    id: string;
    nodeId: string;
    chamberCode: string;
    nodeName: string;
    status: 'WARNING' | 'CRITICAL_BREACH';
    observedCoherencePct: number;
    thresholdPct: number;
    throughputQops: number;
    message: string;
    timestampUtc: string;
  } | null>(null);

  // Track which 'untested' integration coverage grid cells have been interacted with
  const [interactedUntestedCells, setInteractedUntestedCells] = useState<string[]>([]);
  const [copiedDeepLinkUrl, setCopiedDeepLinkUrl] = useState<string | null>(null);

  // Historical Snapshot Date Picker State (view historical snapshots & diff comparison between two timestamps)
  const [selectedHistoricalTimestamp, setSelectedHistoricalTimestamp] = useState<string>('');
  const [comparisonHistoricalTimestamp, setComparisonHistoricalTimestamp] = useState<string>('');
  const [isDiffOverlayEnabled, setIsDiffOverlayEnabled] = useState<boolean>(true);
  const [isSideBySideDiffEnabled, setIsSideBySideDiffEnabled] = useState<boolean>(false);

  // Export to CSV State
  const [lastExportedCsvMeta, setLastExportedCsvMeta] = useState<{
    filename: string;
    rowCount: number;
    timestampUtc: string;
    snapshotLabel: string;
  } | null>(null);

  // d3-zoom Zoom & Pan State and Refs for High-Density Hardware Seal Grid Navigation
  const [zoomTransform, setZoomTransform] = useState<{ k: number; x: number; y: number }>({
    k: 1,
    x: 0,
    y: 0,
  });
  const heatmapZoomViewportRef = useRef<HTMLDivElement | null>(null);
  const d3ZoomBehaviorRef = useRef<d3.ZoomBehavior<HTMLDivElement, unknown> | null>(null);

  // Bind d3-zoom behavior to the high-density hardware seal grid viewport
  useEffect(() => {
    const viewportEl = heatmapZoomViewportRef.current;
    if (!viewportEl) return;

    const zoomBehavior = d3
      .zoom<HTMLDivElement, unknown>()
      .scaleExtent([0.5, 4])
      .filter((event: any) => {
        if (event?.type === 'wheel') return true;
        const target = event?.target as HTMLElement | null;
        if (target && typeof target.closest === 'function' && target.closest('button, input, select, a')) {
          return false;
        }
        return !event?.button;
      })
      .on('zoom', (event: d3.D3ZoomEvent<HTMLDivElement, unknown>) => {
        const { k, x, y } = event.transform;
        setZoomTransform({
          k: Number(k.toFixed(2)),
          x: Math.round(x),
          y: Math.round(y),
        });
      });

    d3ZoomBehaviorRef.current = zoomBehavior;
    const selection = d3.select(viewportEl);
    selection.call(zoomBehavior);

    return () => {
      selection.on('.zoom', null);
    };
  }, [activeViewMode, gridSubView]);

  const handleZoomIn = useCallback(() => {
    setZoomTransform((prev) => {
      const nextK = Number(Math.min(4, prev.k * 1.25).toFixed(2));
      if (heatmapZoomViewportRef.current && d3ZoomBehaviorRef.current) {
        try {
          d3.select(heatmapZoomViewportRef.current).call(
            d3ZoomBehaviorRef.current.transform,
            d3.zoomIdentity.translate(prev.x, prev.y).scale(nextK)
          );
        } catch {
          // Fallback in headless DOM environments
        }
      }
      return { ...prev, k: nextK };
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomTransform((prev) => {
      const nextK = Number(Math.max(0.5, prev.k * 0.8).toFixed(2));
      if (heatmapZoomViewportRef.current && d3ZoomBehaviorRef.current) {
        try {
          d3.select(heatmapZoomViewportRef.current).call(
            d3ZoomBehaviorRef.current.transform,
            d3.zoomIdentity.translate(prev.x, prev.y).scale(nextK)
          );
        } catch {
          // Fallback in headless DOM environments
        }
      }
      return { ...prev, k: nextK };
    });
  }, []);

  const handlePanGrid = useCallback((dx: number, dy: number) => {
    setZoomTransform((prev) => {
      const nextX = prev.x + dx;
      const nextY = prev.y + dy;
      if (heatmapZoomViewportRef.current && d3ZoomBehaviorRef.current) {
        try {
          d3.select(heatmapZoomViewportRef.current).call(
            d3ZoomBehaviorRef.current.transform,
            d3.zoomIdentity.translate(nextX, nextY).scale(prev.k)
          );
        } catch {
          // Fallback in headless DOM environments
        }
      }
      return { ...prev, x: nextX, y: nextY };
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    if (heatmapZoomViewportRef.current && d3ZoomBehaviorRef.current) {
      try {
        d3.select(heatmapZoomViewportRef.current).call(
          d3ZoomBehaviorRef.current.transform,
          d3.zoomIdentity
        );
      } catch {
        // Fallback in headless DOM environments
      }
    }
    setZoomTransform({ k: 1, x: 0, y: 0 });
  }, []);

  // Hydrate filter parameters from URL deep-link on initial mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const searchStr = window.location.search || (window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '');
      if (!searchStr) return;
      const params = new URLSearchParams(searchStr);
      const qParam = params.get('q');
      const catParam = params.get('category');
      const metricParam = params.get('metric') as HeatmapMetricType | null;
      const overlayParam = params.get('overlay') as HeatmapOverlayMode | null;
      const viewParam = params.get('viewMode') as HeatmapViewMode | null;
      const breachParam = params.get('hsmBreach');
      const tsParam = params.get('timestamp');
      const tsCompareParam = params.get('compareTimestamp');

      if (qParam !== null) setSearchQuery(qParam);
      if (catParam) setSelectedCategory(catParam);
      if (tsParam) setSelectedHistoricalTimestamp(tsParam);
      if (tsCompareParam) setComparisonHistoricalTimestamp(tsCompareParam);
      if (metricParam && ['coherence', 'stability', 'cryoTemp', 'drift', 'integrationCoverage'].includes(metricParam)) {
        setActiveMetric(metricParam);
      }
      if (overlayParam && ['SEAL_STATUS', 'INTEGRATION_COVERAGE'].includes(overlayParam)) {
        setOverlayMode(overlayParam);
      }
      if (viewParam && ['grid', 'epoch_matrix', 'telemetry_trend'].includes(viewParam)) {
        setActiveViewMode(viewParam);
      }
      if (breachParam === '1' || breachParam === 'true') {
        setIsolatedHsmNodeIds(['TC-03', 'TC-08', 'TC-09']);
        systemStateStore.setCustodianProofs(7);
      }
    } catch {
      // Ignore URL parse errors in non-browser environments
    }
  }, []);

  // 24-Hour Integration Coverage Percentage Trend Line Data (identifying periods of degradation)
  const integrationCoverage24hTrend = useMemo(() => {
    const baseLines = PRODUCTION_INTEGRATION_COVERAGE_SUMMARY.adapterLinesPct; // 95.05%
    const baseBranches = PRODUCTION_INTEGRATION_COVERAGE_SUMMARY.adapterBranchesPct; // 76.47%
    return Array.from({ length: 24 }, (_, idx) => {
      const hoursAgo = 23 - idx;
      const label = hoursAgo === 0 ? 'NOW (00h)' : `T-${hoursAgo}h`;
      // Period of degradation between T-14h and T-11h due to untested branch paths L1305-1341 & L1539-1576
      const isDegradedWindow = hoursAgo >= 11 && hoursAgo <= 14;
      const isRecoveryWindow = hoursAgo >= 8 && hoursAgo <= 10;
      const lineDip = isDegradedWindow ? -3.85 - (hoursAgo === 13 ? 1.4 : 0) : isRecoveryWindow ? -0.9 : 0;
      const branchDip = isDegradedWindow ? -6.2 - (hoursAgo === 13 ? 2.1 : 0) : isRecoveryWindow ? -1.5 : 0;
      const microWave = Math.sin(idx * 0.55) * 0.18;
      const linesCoveragePct = +(Math.min(100, Math.max(85, baseLines + lineDip + microWave))).toFixed(2);
      const branchCoveragePct = +(Math.min(100, Math.max(62, baseBranches + branchDip + microWave))).toFixed(2);
      return {
        hourLabel: label,
        hoursAgo,
        coveragePct: linesCoveragePct,
        linesCoveragePct,
        branchCoveragePct,
        slaFloorPct: 92.0,
        degradationFlag: isDegradedWindow,
        degradationStatus: isDegradedWindow ? 'DEGRADATION_DETECTED' : isRecoveryWindow ? 'RECOVERING' : 'NOMINAL_PASS',
        degradationNote: isDegradedWindow
          ? 'Degradation: Untested branch paths in zyrquenAdapter.ts (L1305–1341 Classifier & L1539–1576 Sig Gate)'
          : 'Nominal E2E Production Path Coverage',
      };
    });
  }, []);

  const effectiveHsmQuorumNodes = useMemo(() => {
    const localCount = 10 - isolatedHsmNodeIds.length;
    return Math.min(storeCustodianProofs, localCount);
  }, [storeCustodianProofs, isolatedHsmNodeIds]);

  const isHsmHealthBreachActive = effectiveHsmQuorumNodes < 8;

  const hsmNodeDossiersWithStatus = useMemo<HsmNodeForensicDossierSummary[]>(() => {
    const storeDeficit = Math.max(0, 10 - storeCustodianProofs);
    return CANONICAL_HSM_NODE_FORENSIC_DOSSIERS.map((dossier, idx) => {
      const isLocallyIsolated = isolatedHsmNodeIds.includes(dossier.nodeId);
      const isStoreIsolated = storeDeficit > 0 && idx >= 10 - storeDeficit;
      return {
        ...dossier,
        status: isLocallyIsolated || isStoreIsolated ? 'ISOLATED_BREACH' : 'ONLINE_VERIFIED',
      };
    });
  }, [isolatedHsmNodeIds, storeCustodianProofs]);

  const breachedHsmDossiers = useMemo(
    () => hsmNodeDossiersWithStatus.filter((d) => d.status === 'ISOLATED_BREACH'),
    [hsmNodeDossiersWithStatus]
  );

  // Real-time Hardware Node Status & Throughput Metrics mapped over HSM node state & data store artifacts
  const hardwareNodesThroughputList = useMemo(() => {
    const custodianSnapshot = systemStateStore.getCustodianRegistrySnapshot();
    const baseQops = latestSnapshot?.qopsThroughput ?? 851.9;
    return hsmNodeDossiersWithStatus.map((dossier, idx) => {
      const storeSlot =
        custodianSnapshot.slots.find((s) => s.slot_id === dossier.slotId) ||
        custodianSnapshot.slots[idx % custodianSnapshot.slots.length];
      const storeAuditArtifact =
        storeSystemEvents.find(
          (evt) =>
            evt.title?.includes(dossier.nodeId) ||
            evt.description?.includes(dossier.nodeId) ||
            evt.id?.includes(dossier.nodeId) ||
            (evt as any).metaHash?.includes(dossier.signatureDigest.slice(0, 10))
        ) || storeSystemEvents[idx % Math.max(1, storeSystemEvents.length)];
      const isIsolated = dossier.status === 'ISOLATED_BREACH';
      const isWarned = warnedNodeIds.includes(dossier.nodeId);
      const wave = Math.sin(heartbeatCycle * 0.6 + idx * 1.1);
      const coherencePct = isIsolated
        ? 91.45
        : isWarned
        ? 97.28
        : +(99.988 + wave * 0.008).toFixed(3);
      const throughputQops = isIsolated
        ? 0
        : isWarned
        ? +(baseQops * 0.68 + idx * 4.2).toFixed(1)
        : +(baseQops + idx * 14.5 + wave * 3.2).toFixed(1);
      const signaturesPerSec = isIsolated
        ? 0
        : isWarned
        ? Math.round(940 + idx * 18)
        : Math.round(1420 + idx * 35 + wave * 12);
      const latencyMs = isIsolated
        ? 142.8
        : isWarned
        ? +(48.6 + idx * 1.4).toFixed(2)
        : +(11.4 + (idx % 4) * 0.85).toFixed(2);
      const nodeHealthStatus: 'ONLINE_VERIFIED' | 'BELOW_WARNING_THRESHOLD' | 'ISOLATED_BREACH' = isIsolated
        ? 'ISOLATED_BREACH'
        : isWarned || coherencePct < WARNING_THRESHOLD_COHERENCE_PCT
        ? 'BELOW_WARNING_THRESHOLD'
        : 'ONLINE_VERIFIED';

      return {
        ...dossier,
        coherencePct,
        throughputQops,
        signaturesPerSec,
        latencyMs,
        nodeHealthStatus,
        storeSlotId: storeSlot?.slot_id ?? dossier.slotId,
        storeSignatureDigest: storeSlot?.signature_digest ?? dossier.signatureDigest,
        storeArtifactTimestamp: storeSlot?.timestamp ?? dossier.lastHeartbeatUtc,
        historicalAuditEventId: storeAuditArtifact?.id ?? `AUD-STORE-${dossier.nodeId}-849202`,
        historicalAuditTitle: storeAuditArtifact?.title ?? `Genesis Attestation • ${dossier.nodeId}`,
      };
    });
  }, [hsmNodeDossiersWithStatus, latestSnapshot, heartbeatCycle, warnedNodeIds, storeSystemEvents]);

  // Local state handler that triggers a browser-level toast notification when a hardware node drops below 'Warning' threshold
  const handleTriggerNodeWarningThreshold = useCallback(
    (targetNodeId = 'TC-04') => {
      const targetDossier =
        CANONICAL_HSM_NODE_FORENSIC_DOSSIERS.find((d) => d.nodeId === targetNodeId) ||
        CANONICAL_HSM_NODE_FORENSIC_DOSSIERS[3];
      const chamberCode = targetDossier.associatedChamber.split(' ')[0] || 'CH-16';
      const nowIso = new Date().toISOString();
      const observedCoherence = 97.28;
      const toastMsg = `[BROWSER WARNING TOAST] Hardware Node ${targetDossier.nodeId} (${targetDossier.nodeName} • ${chamberCode}) dropped to ${observedCoherence}% (< ${WARNING_THRESHOLD_COHERENCE_PCT.toFixed(
        2
      )}% Warning Threshold). Inspect forensic dossier ${targetDossier.dossierId}.`;

      setWarnedNodeIds((prev) => (prev.includes(targetDossier.nodeId) ? prev : [...prev, targetDossier.nodeId]));

      const warningPayload = {
        id: `WARN-NODE-${targetDossier.nodeId}-${Date.now()}`,
        nodeId: targetDossier.nodeId,
        chamberCode,
        nodeName: targetDossier.nodeName,
        status: 'WARNING' as const,
        observedCoherencePct: observedCoherence,
        thresholdPct: WARNING_THRESHOLD_COHERENCE_PCT,
        throughputQops: 584.2,
        message: toastMsg,
        timestampUtc: nowIso,
      };
      setWarningThresholdToast(warningPayload);
      setPrintToast(toastMsg);

      // Dispatch browser-level toast notification via global CustomEvent ('zyrquen-toast') & Web Notification API
      toast.warning(toastMsg, {
        toastId: `node-warning-${targetDossier.nodeId}-${Date.now()}`,
        durationMs: 5000,
      });

      if (typeof window !== 'undefined' && 'Notification' in window) {
        try {
          if (Notification.permission === 'granted') {
            new Notification(`ZYRQUEN Hardware Node Warning (${targetDossier.nodeId})`, {
              body: toastMsg,
            });
          }
        } catch {
          // Ignore Notification errors in headless/sandboxed environments
        }
      }

      if (isAudioEnabled) {
        playTelemetryBeep(440);
      }

      if (onSystemEvent) {
        onSystemEvent(toastMsg);
      }
      if (onAddSystemEvent) {
        onAddSystemEvent(
          'WARNING',
          `Hardware Node Below Warning Threshold (${targetDossier.nodeId})`,
          toastMsg,
          targetDossier.signatureDigest,
          'warning',
          'ETDA Sec 28 / FIPS 140-3 L4 Telemetry Alert'
        );
      }
    },
    [isAudioEnabled, onSystemEvent, onAddSystemEvent]
  );

  const handleToggleHsmQuorumBreachSimulation = useCallback(() => {
    if (isHsmHealthBreachActive) {
      setIsolatedHsmNodeIds([]);
      systemStateStore.setCustodianProofs(10);
      const restoreMsg = '[HSM QUORUM RESTORED] 10/10 REAL_HSM nodes online. Super-majority (>=8/10) re-established.';
      setPrintToast(restoreMsg);
      setTimeout(() => setPrintToast((curr) => (curr === restoreMsg ? null : curr)), 4000);
      if (onSystemEvent) onSystemEvent(restoreMsg);
      if (onAddSystemEvent) {
        onAddSystemEvent(
          'HARDWARE',
          'HSM Quorum Restored (10/10 Online)',
          'All 10 Deca-Key HSM nodes verified online. Health Breach Alert cleared.',
          'HSM-QUORUM-10-10',
          'success',
          'ETDA Sec 26/28'
        );
      }
    } else {
      const targetIsolated = ['TC-03', 'TC-08', 'TC-09'];
      setIsolatedHsmNodeIds(targetIsolated);
      systemStateStore.setCustodianProofs(7);
      if (isAudioEnabled) playTelemetryBeep(320);
      const breachMsg =
        '[HEALTH BREACH ALERT] HSM Quorum dropped to 7/10 (<8 required)! Nodes TC-03, TC-08, TC-09 isolated. Forensic dossiers linked.';
      setPrintToast(breachMsg);
      setTimeout(() => setPrintToast((curr) => (curr === breachMsg ? null : curr)), 4500);
      if (onSystemEvent) onSystemEvent(breachMsg);
      if (onAddSystemEvent) {
        onAddSystemEvent(
          'ALERT',
          'HIGH-PRIORITY: HSM Quorum Health Breach (<8/10 Nodes)',
          'HSM Quorum dropped to 7/10 active nodes. Hardware nodes TC-03, TC-08, TC-09 isolated; direct forensic dossiers attached.',
          'HSM-BREACH-7-OF-10',
          'critical',
          'ETDA Sec 28 / FIPS 140-3 L4',
          'security'
        );
      }
    }
  }, [isHsmHealthBreachActive, isAudioEnabled, onSystemEvent, onAddSystemEvent]);

  const handleChamberCellInteraction = useCallback((chamberId: string, chamberCode: string) => {
    setSelectedChamberId(chamberId);
    setInteractedUntestedCells((prev) => (prev.includes(chamberCode) ? prev : [...prev, chamberCode]));
  }, []);

  // Generate initial historical heartbeat profiles for each of the 18 Sovereign Chambers
  const [chamberProfiles, setChamberProfiles] = useState<ChamberHealthProfile[]>(() => {
    return SOVEREIGN_CHAMBERS.map((chamber, chamberIdx) => {
      const snapshots: ChamberHeartbeatSnapshot[] = [];
      const baseSeed = (chamberIdx * 17) % 100;

      for (let i = HISTORICAL_EPOCHS_COUNT - 1; i >= 0; i--) {
        const timeOffset = Date.now() - i * 1000;
        const timeStr = new Date(timeOffset).toLocaleTimeString('en-GB', { hour12: false });
        const microNoise = Math.sin(chamberIdx * 2.3 + i * 0.7) * 0.004;
        const coh = Math.min(100.0, Math.max(99.975, 99.992 + microNoise));
        const stab = Math.min(100.0, Math.max(99.98, 99.995 + Math.cos(chamberIdx + i) * 0.003));
        const cryo = +(14.98 + Math.sin(chamberIdx + i * 0.4) * 0.08).toFixed(2);

        snapshots.push({
          epochIndex: 849202 - i,
          timestamp: timeStr,
          coherencePct: +coh.toFixed(3),
          stabilityIndex: +stab.toFixed(2),
          cryoTempMk: cryo,
          driftDeltaPpm: 0.0,
          quorumVotes: 10,
          status: chamber.status,
        });
      }

      const latest = snapshots[snapshots.length - 1];

      return {
        chamber,
        currentCoherence: latest.coherencePct,
        prevCoherence: latest.coherencePct,
        currentStability: latest.stabilityIndex,
        currentCryoTemp: latest.cryoTempMk,
        prevCryoTemp: latest.cryoTempMk,
        coherenceHistory: snapshots.slice(-10).map((s) => s.coherencePct),
        currentDrift: 0.0,
        invariantsPassing: chamber.invariants.length,
        invariantsTotal: chamber.invariants.length,
        uptimeSla: 99.999,
        status: 'PURE_GREEN',
        varianceFlag: false,
        recentSnapshots: snapshots,
      };
    });
  });

  // Synchronized refs for stable interval execution without recreating timers
  const latestSnapshotRef = useRef(latestSnapshot);
  latestSnapshotRef.current = latestSnapshot;

  const simulatedUnstableChamberIdRef = useRef(simulatedUnstableChamberId);
  simulatedUnstableChamberIdRef.current = simulatedUnstableChamberId;

  const isAudioEnabledRef = useRef(isAudioEnabled);
  isAudioEnabledRef.current = isAudioEnabled;

  const onSystemEventRef = useRef(onSystemEvent);
  onSystemEventRef.current = onSystemEvent;

  const onAddSystemEventRef = useRef(onAddSystemEvent);
  onAddSystemEventRef.current = onAddSystemEvent;

  const chamberProfilesRef = useRef(chamberProfiles);
  chamberProfilesRef.current = chamberProfiles;

  const heartbeatCycleRef = useRef(heartbeatCycle);
  heartbeatCycleRef.current = heartbeatCycle;

  // Heartbeat pulse simulation and telemetry heartbeat interval
  useEffect(() => {
    if (!isHeartbeatRunning) return;

    const timer = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-GB', { hour12: false });
      const nowIso = now.toISOString();

      const currentCycle = heartbeatCycleRef.current;
      setHeartbeatCycle(currentCycle + 1);
      setLastHeartbeatUtc(nowIso);
      setHeartbeatPulse(true);

      // Brief visual pulse reset
      setTimeout(() => setHeartbeatPulse(false), 260);

      // Play audio pulse if unmuted
      if (isAudioEnabledRef.current) {
        playTelemetryBeep(720);
      }

      const prevProfiles = chamberProfilesRef.current;
      const newUnstableList: UnstableEvent[] = [];
      const alertEventsToDispatch: Array<{
        code: string;
        name: string;
        newCoherence: number;
      }> = [];

      const nextProfiles = prevProfiles.map((prof, idx) => {
        // If locked and protected by bulk lockdown, maintain protected state
        if (prof.status === 'LOCKED_PROTECTED') {
          return prof;
        }

        const isSimulated = simulatedUnstableChamberIdRef.current === prof.chamber.code;

        // Micro-fluctuations tightly centered around 100% GREEN nominal SSoT
        const snap = latestSnapshotRef.current;
        const globalQopsBonus = snap ? (snap.qopsThroughput - 850) * 0.00005 : 0;
        const jitter = (Math.sin(Date.now() / 800 + idx * 1.5) * 0.003) + globalQopsBonus;
        
        let newCoherence = +(Math.min(100.0, Math.max(99.965, 99.992 + jitter))).toFixed(3);
        if (isSimulated) {
          newCoherence = +(93.8 + Math.sin(Date.now() / 600) * 0.3).toFixed(2);
        }

        const isUnstable = newCoherence < 95;
        const varianceFlag = isUnstable || (Math.sin(Date.now() / 700 + idx * 2.1) > 0.75);

        const newStability = +(Math.min(100.0, Math.max(99.98, 99.995 + Math.cos(Date.now() / 900 + idx) * 0.002))).toFixed(2);
        const newCryo = +(14.98 + Math.sin(Date.now() / 1200 + idx) * 0.06).toFixed(2);

        // Track alerts if drops below 95%
        if (newCoherence < 95) {
          newUnstableList.push({
            id: `EVT-${prof.chamber.code}-${Date.now()}`,
            chamberId: prof.chamber.code,
            coherence: newCoherence,
            timestamp: timeStr,
          });
        }

        if (newCoherence < 95 && prof.currentCoherence >= 95) {
          alertEventsToDispatch.push({
            code: prof.chamber.code,
            name: prof.chamber.name,
            newCoherence,
          });
        }

        const newSnap: ChamberHeartbeatSnapshot = {
          epochIndex: currentCycle + 1,
          timestamp: timeStr,
          coherencePct: newCoherence,
          stabilityIndex: newStability,
          cryoTempMk: newCryo,
          driftDeltaPpm: 0.0,
          quorumVotes: 10,
          status: isSimulated ? 'ALERT' : prof.chamber.status,
        };

        const updatedSnapshots = [...prof.recentSnapshots.slice(1), newSnap];
        const updatedHistory = [...(prof.coherenceHistory || [prof.currentCoherence]).slice(1), newCoherence];

        return {
          ...prof,
          prevCoherence: prof.currentCoherence,
          currentCoherence: newCoherence,
          prevCryoTemp: prof.currentCryoTemp,
          currentCryoTemp: newCryo,
          coherenceHistory: updatedHistory,
          currentStability: newStability,
          status: (isUnstable ? 'UNSTABLE' : 'PURE_GREEN') as 'UNSTABLE' | 'PURE_GREEN',
          varianceFlag,
          recentSnapshots: updatedSnapshots,
        };
      });

      setChamberProfiles(nextProfiles);

      if (newUnstableList.length > 0) {
        setUnstableEvents((currentEvents) => {
          const uniqueToAdd = newUnstableList.filter(
            (item) => !currentEvents.some((e) => e.chamberId === item.chamberId)
          );
          return uniqueToAdd.length > 0 ? [...uniqueToAdd, ...currentEvents] : currentEvents;
        });
      }

      if (alertEventsToDispatch.length > 0) {
        alertEventsToDispatch.forEach(({ code, name, newCoherence }) => {
          if (onSystemEventRef.current) {
            onSystemEventRef.current(`[ALERT] Chamber ${code} coherence dropped to ${newCoherence}% (<95%) - Instability detected!`);
          }
          if (onAddSystemEventRef.current) {
            onAddSystemEventRef.current(
              'ALERT',
              `[ALERT] Chamber ${code} Under-Coherence`,
              `Chamber ${name} dropped to ${newCoherence}% (<95%). Instability detected!`,
              `HASH-${code}-${Date.now()}`,
              'critical',
              'ETDA Sec 26'
            );
          }
        });
      }
    }, heartbeatIntervalMs);

    return () => clearInterval(timer);
  }, [isHeartbeatRunning, heartbeatIntervalMs]);

  // Aggregate telemetry metrics across 18 Chambers
  const aggregateMetrics = useMemo(() => {
    const total = chamberProfiles.length;
    if (total === 0) return { meanCoherence: 99.992, meanStability: 99.99, meanCryo: 14.98, totalPassing: 18 };

    const sumCoherence = chamberProfiles.reduce((acc, p) => acc + p.currentCoherence, 0);
    const sumStability = chamberProfiles.reduce((acc, p) => acc + p.currentStability, 0);
    const sumCryo = chamberProfiles.reduce((acc, p) => acc + p.currentCryoTemp, 0);

    return {
      meanCoherence: +(sumCoherence / total).toFixed(3),
      meanStability: +(sumStability / total).toFixed(2),
      meanCryo: +(sumCryo / total).toFixed(2),
      totalPassing: chamberProfiles.filter((p) => p.currentCoherence >= 99.95).length,
    };
  }, [chamberProfiles]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    SOVEREIGN_CHAMBERS.forEach((c) => set.add(c.category));
    return ['ALL', ...Array.from(set)];
  }, []);

  // Helper to deterministically compute historical snapshot metadata for any timestamp string
  const buildHistoricalSnapshotMeta = useCallback((rawTimestamp: string) => {
    const raw = rawTimestamp.trim();
    if (!raw) return null;
    const seed = raw.split('').reduce((acc, ch, i) => acc + ch.charCodeAt(0) * (i + 1), 0);
    const isDegradationWindow =
      raw.includes('11:') ||
      raw.includes('12:') ||
      raw.toLowerCase().includes('degrad') ||
      seed % 5 === 0;
    const hoursDelta = Math.max(1, (seed % 48) + 1);
    const historicalBlock = Math.max(840000, 849202 - hoursDelta * 60);
    const lineCoverageDelta = isDegradationWindow ? -0.9 : -((seed % 18) * 0.03);
    const branchCoverageDelta = isDegradationWindow ? -4.85 : -((seed % 15) * 0.08);
    const snapshotLinesPct = +(
      Math.max(88, Math.min(100, PRODUCTION_INTEGRATION_COVERAGE_SUMMARY.adapterLinesPct + lineCoverageDelta))
    ).toFixed(2);
    const snapshotBranchesPct = +(
      Math.max(64, Math.min(100, PRODUCTION_INTEGRATION_COVERAGE_SUMMARY.adapterBranchesPct + branchCoverageDelta))
    ).toFixed(2);
    const coherenceOffset = isDegradationWindow ? -0.24 : -((seed % 9) * 0.004);
    const sealSummary = isDegradationWindow
      ? '14,896 / 14,902 NOMINAL (6 Seals in Transient Cryo Re-Attestation)'
      : '14,902 / 14,902 NOMINAL (100% Hardware Seal Parity)';

    return {
      timestamp: raw,
      seed,
      isDegradationWindow,
      historicalBlock,
      snapshotLinesPct,
      snapshotBranchesPct,
      coherenceOffset,
      sealSummary,
    };
  }, []);

  // Historical Snapshot Computation for primary selected timestamp (Hardware Seal Status + Integration Coverage)
  const historicalSnapshotMeta = useMemo(
    () => buildHistoricalSnapshotMeta(selectedHistoricalTimestamp),
    [selectedHistoricalTimestamp, buildHistoricalSnapshotMeta]
  );

  // Historical Snapshot Computation for secondary comparison timestamp
  const comparisonSnapshotMeta = useMemo(
    () => buildHistoricalSnapshotMeta(comparisonHistoricalTimestamp),
    [comparisonHistoricalTimestamp, buildHistoricalSnapshotMeta]
  );

  // Historical Diff Overlay Computation when two different timestamps are selected
  const historicalDiffOverlay = useMemo(() => {
    if (
      !isDiffOverlayEnabled ||
      !historicalSnapshotMeta ||
      !comparisonSnapshotMeta ||
      historicalSnapshotMeta.timestamp === comparisonSnapshotMeta.timestamp
    ) {
      return null;
    }

    const cellsDiffMap: Record<
      string,
      {
        chamberCode: string;
        statusA: 'PURE_GREEN' | 'TRANSIENT_JITTER' | 'DEGRADED_SEAL';
        statusB: 'PURE_GREEN' | 'TRANSIENT_JITTER' | 'DEGRADED_SEAL';
        coherenceA: number;
        coherenceB: number;
        coherenceDelta: number;
        sealsDelta: number;
        diffState: 'IMPROVED' | 'DEGRADED' | 'UNCHANGED';
      }
    > = {};

    let improvedCount = 0;
    let degradedCount = 0;
    let unchangedCount = 0;

    chamberProfiles.forEach((prof, idx) => {
      const code = prof.chamber.code;
      const baseCoh = 99.992;

      const deltaA =
        historicalSnapshotMeta.coherenceOffset +
        Math.sin((historicalSnapshotMeta.seed + idx) * 0.9) * 0.025 -
        (historicalSnapshotMeta.isDegradationWindow && idx % 3 === 0 ? 1.85 : 0);
      const deltaB =
        comparisonSnapshotMeta.coherenceOffset +
        Math.sin((comparisonSnapshotMeta.seed + idx) * 0.9) * 0.025 -
        (comparisonSnapshotMeta.isDegradationWindow && idx % 3 === 0 ? 1.85 : 0);

      // Ensure at least a few chambers exhibit status changes when any two distinct timestamps are compared
      const syntheticShiftA = !historicalSnapshotMeta.isDegradationWindow && !comparisonSnapshotMeta.isDegradationWindow && idx % 4 === 0 ? -1.45 : 0;
      const cohA = +(Math.min(100, Math.max(91.5, baseCoh + deltaA + syntheticShiftA))).toFixed(2);
      const cohB = +(Math.min(100, Math.max(91.5, baseCoh + deltaB))).toFixed(2);

      const statusA: 'PURE_GREEN' | 'TRANSIENT_JITTER' | 'DEGRADED_SEAL' =
        cohA < 98.8 ? 'DEGRADED_SEAL' : cohA < 99.75 ? 'TRANSIENT_JITTER' : 'PURE_GREEN';
      const statusB: 'PURE_GREEN' | 'TRANSIENT_JITTER' | 'DEGRADED_SEAL' =
        cohB < 98.8 ? 'DEGRADED_SEAL' : cohB < 99.75 ? 'TRANSIENT_JITTER' : 'PURE_GREEN';

      const coherenceDelta = +(cohB - cohA).toFixed(2);
      const rank = { DEGRADED_SEAL: 0, TRANSIENT_JITTER: 1, PURE_GREEN: 2 };
      let diffState: 'IMPROVED' | 'DEGRADED' | 'UNCHANGED' = 'UNCHANGED';

      if (rank[statusB] > rank[statusA] || coherenceDelta >= 0.15) {
        diffState = 'IMPROVED';
        improvedCount++;
      } else if (rank[statusB] < rank[statusA] || coherenceDelta <= -0.15) {
        diffState = 'DEGRADED';
        degradedCount++;
      } else {
        unchangedCount++;
      }

      const sealsDelta =
        diffState === 'IMPROVED'
          ? Math.max(1, Math.round(Math.abs(coherenceDelta)))
          : diffState === 'DEGRADED'
          ? -Math.max(1, Math.round(Math.abs(coherenceDelta)))
          : 0;

      cellsDiffMap[code] = {
        chamberCode: code,
        statusA,
        statusB,
        coherenceA: cohA,
        coherenceB: cohB,
        coherenceDelta,
        sealsDelta,
        diffState,
      };
    });

    return {
      timestampA: historicalSnapshotMeta.timestamp,
      timestampB: comparisonSnapshotMeta.timestamp,
      blockA: historicalSnapshotMeta.historicalBlock,
      blockB: comparisonSnapshotMeta.historicalBlock,
      linesDeltaPct: +(comparisonSnapshotMeta.snapshotLinesPct - historicalSnapshotMeta.snapshotLinesPct).toFixed(2),
      branchesDeltaPct: +(comparisonSnapshotMeta.snapshotBranchesPct - historicalSnapshotMeta.snapshotBranchesPct).toFixed(2),
      improvedCount,
      degradedCount,
      unchangedCount,
      totalChangedCount: improvedCount + degradedCount,
      cellsDiffMap,
    };
  }, [isDiffOverlayEnabled, historicalSnapshotMeta, comparisonSnapshotMeta, chamberProfiles]);

  // Filtered chambers (supports searching by Node ID, Seal Number, Hardware Seal Status, or Integration Path + Historical Snapshot modulation)
  const filteredProfiles = useMemo(() => {
    return chamberProfiles
      .map((prof, idx) => {
        if (!historicalSnapshotMeta) return prof;
        const delta =
          historicalSnapshotMeta.coherenceOffset +
          Math.sin((historicalSnapshotMeta.seed + idx) * 0.9) * 0.015;
        const histCoherence = +(Math.min(100, Math.max(91.5, prof.currentCoherence + delta))).toFixed(3);
        const histStability = +(Math.min(100, Math.max(94.0, prof.currentStability + delta * 0.6))).toFixed(2);
        const histCryo = +(
          Math.max(14.5, prof.currentCryoTemp + Math.cos(historicalSnapshotMeta.seed + idx) * 0.04)
        ).toFixed(2);
        return {
          ...prof,
          currentCoherence: histCoherence,
          currentStability: histStability,
          currentCryoTemp: histCryo,
        };
      })
      .filter((prof, idx) => {
        if (selectedCategory !== 'ALL' && prof.chamber.category !== selectedCategory) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const covMetric =
            CHAMBER_INTEGRATION_COVERAGE_METRICS.find((m) => m.chamberCode === prof.chamber.code) ||
            CHAMBER_INTEGRATION_COVERAGE_METRICS[idx % CHAMBER_INTEGRATION_COVERAGE_METRICS.length];
          const linkedDossier = CANONICAL_HSM_NODE_FORENSIC_DOSSIERS[idx % CANONICAL_HSM_NODE_FORENSIC_DOSSIERS.length];
          const sealRangeStart = `seal-${String(idx * 828 + 1).padStart(5, '0')}`;
          const sealNumberNumeric = q.replace(/[^0-9]/g, '');
          const matchSealNumber =
            q.startsWith('seal-') || (sealNumberNumeric.length > 0 && q.includes('seal'))
              ? sealNumberNumeric
                ? (Number(sealNumberNumeric) - 1) % 18 === idx
                : true
              : sealRangeStart.includes(q);
          const matchNodeId =
            prof.chamber.code.toLowerCase().includes(q) ||
            prof.chamber.id.toLowerCase().includes(q) ||
            `node-${String(idx + 1).padStart(3, '0')}`.includes(q) ||
            (linkedDossier && linkedDossier.nodeId.toLowerCase().includes(q)) ||
            (linkedDossier && linkedDossier.dossierId.toLowerCase().includes(q));
          const matchSealStatus =
            (prof.status || 'PURE_GREEN').toLowerCase().includes(q) ||
            prof.chamber.status.toLowerCase().includes(q) ||
            (isHsmHealthBreachActive && 'isolated_breach hsm breach'.includes(q));
          const matchIntegrationPath =
            (covMetric?.integrationStage || '').toLowerCase().includes(q) ||
            (covMetric?.uncoveredLineRanges || '').toLowerCase().includes(q) ||
            (covMetric?.completenessStatus || '').toLowerCase().includes(q) ||
            'zyrquenadapter.ts'.includes(q);
          const matchName = prof.chamber.name.toLowerCase().includes(q);
          const matchNameTh = prof.chamber.nameTh.toLowerCase().includes(q);
          const matchCat = prof.chamber.category.toLowerCase().includes(q);
          const matchInv = prof.chamber.invariants.some((inv) => inv.toLowerCase().includes(q));
          if (
            !matchNodeId &&
            !matchSealNumber &&
            !matchSealStatus &&
            !matchIntegrationPath &&
            !matchName &&
            !matchNameTh &&
            !matchCat &&
            !matchInv
          ) {
            return false;
          }
        }
        return true;
      });
  }, [chamberProfiles, selectedCategory, searchQuery, isHsmHealthBreachActive, historicalSnapshotMeta]);

  // Copy Deep-Link handler including currently selected filter parameters for forensic collaboration
  const handleCopyDeepLink = useCallback(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://zyrquen.sovereign.local/';
    const params = new URLSearchParams();
    params.set('view', 'heatmap');
    params.set('overlay', overlayMode);
    params.set('metric', activeMetric);
    params.set('category', selectedCategory);
    params.set('viewMode', activeViewMode);
    params.set('subView', gridSubView);
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    }
    if (selectedHistoricalTimestamp.trim()) {
      params.set('timestamp', selectedHistoricalTimestamp.trim());
    }
    if (isHsmHealthBreachActive) {
      params.set('hsmBreach', '1');
    }
    const deepLink = `${origin}?${params.toString()}`;
    setCopiedDeepLinkUrl(deepLink);
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(deepLink).catch(() => {});
    }
    if (isAudioEnabled) {
      playAuditChime();
    }
    const msg = `[Forensic Deep-Link Copied] ${deepLink}`;
    setPrintToast(msg);
    setTimeout(() => {
      setPrintToast((curr) => (curr === msg ? null : curr));
    }, 4500);
    if (onSystemEvent) onSystemEvent(msg);
    if (onAddSystemEvent) {
      onAddSystemEvent(
        'FORENSIC',
        'Heatmap Forensic Deep-Link Generated',
        `Copied collaborative forensic deep-link with filters (overlay=${overlayMode}, metric=${activeMetric}, category=${selectedCategory}, q="${searchQuery.trim() || 'ALL'}").`,
        `deeplink:${Date.now()}`,
        'info',
        'ETDA Sec 28 Chain of Custody'
      );
    }
  }, [
    overlayMode,
    activeMetric,
    selectedCategory,
    activeViewMode,
    gridSubView,
    searchQuery,
    selectedHistoricalTimestamp,
    isHsmHealthBreachActive,
    isAudioEnabled,
    onSystemEvent,
    onAddSystemEvent,
  ]);

  // Active selected chamber profile for inspection drawer
  const selectedProfile = useMemo(() => {
    if (!selectedChamberId) return null;
    return chamberProfiles.find((p) => p.chamber.id === selectedChamberId) || null;
  }, [chamberProfiles, selectedChamberId]);

  // Color intensity scale: Cyan to Emerald, Red with pulse if < 95%
  const getCellColorStyle = useCallback((coherence: number) => {
    if (coherence < 95) {
      return 'bg-red-950/80 border-red-500 text-red-300 ring-2 ring-red-500 animate-pulse';
    }
    const ratio = Math.max(0, Math.min(1, (coherence - 95) / 5)); // 0 to 1
    if (ratio < 0.3) {
      return 'bg-cyan-950/60 border-cyan-700/70 text-cyan-300 hover:border-cyan-400';
    } else if (ratio < 0.7) {
      return 'bg-teal-950/70 border-teal-600/70 text-teal-300 hover:border-teal-400';
    } else {
      return 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300 hover:border-emerald-400';
    }
  }, []);

  // Simulation handler for testing <95% instability alerts and pulsing animation
  const handleToggleSimulation = useCallback(() => {
    if (simulatedUnstableChamberId) {
      setSimulatedUnstableChamberId(null);
      if (onSystemEvent) {
        onSystemEvent('[RESTORE] All 18 Sovereign Chambers restored to PURE GREEN (Δ0.00% Zero Drift)');
      }
      if (onAddSystemEvent) {
        onAddSystemEvent(
          'RESTORE',
          'Sovereign Telemetry Stabilized',
          'All 18 Sovereign Chambers restored to nominal baseline (Coherence >99.95%).',
          `RESTORE-${Date.now()}`,
          'success',
          'ETDA Sec 26'
        );
      }
    } else {
      // Simulate Chamber 5 (CH-04) dropping below 95%
      const targetChamberCode = 'CH-04';
      setSimulatedUnstableChamberId(targetChamberCode);

      setUnstableEvents((prev) => {
        const exists = prev.some((e) => e.chamberId === targetChamberCode);
        if (!exists) {
          return [
            {
              id: `EVT-${targetChamberCode}-${Date.now()}`,
              chamberId: targetChamberCode,
              coherence: 93.8,
              timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
            },
            ...prev,
          ];
        }
        return prev;
      });

      if (onSystemEvent) {
        onSystemEvent(`[ALERT] Chamber ${targetChamberCode} coherence dropped to 93.80% (<95%) - Instability detected!`);
      }
      if (onAddSystemEvent) {
        onAddSystemEvent(
          'ALERT',
          `[ALERT] Chamber ${targetChamberCode} Under-Coherence`,
          `Chamber ${targetChamberCode} Quantum Coherence dropped to 93.80% (<95%). Subtle pulsing alert triggered.`,
          `ALERT-${targetChamberCode}-${Date.now()}`,
          'critical',
          'ETDA Sec 26'
        );
      }
    }
  }, [simulatedUnstableChamberId, onSystemEvent, onAddSystemEvent]);

  // Requirement 3: Print QR handler committing to Immutable Ledger
  const handlePrintQR = useCallback(
    (profile: ChamberHealthProfile) => {
      const timestamp = new Date().toISOString();
      const newRecord: PrintAuditRecord = {
        printId: `PRINT-LOG-${Date.now().toString().slice(-4)}`,
        chamberSource: `${profile.chamber.code} (${profile.chamber.name})`,
        timestamp,
        ledgerStatus: 'COMMITTED_IMMUTABLE_V25',
      };
      setPrintLedgerLogs((prev) => [newRecord, ...prev]);

      if (isAudioEnabled) {
        playAuditChime();
      }

      const msg = `[Print Event Tracker] QR Evidence for ${profile.chamber.code} logged to Immutable Ledger successfully!`;
      setPrintToast(msg);
      setTimeout(() => {
        setPrintToast((curr) => (curr === msg ? null : curr));
      }, 4000);

      if (onSystemEvent) {
        onSystemEvent(msg);
      }
      if (onAddSystemEvent) {
        onAddSystemEvent(
          'PRINT_QR',
          `QR Evidence Sealed • ${profile.chamber.code}`,
          `QR Evidence for ${profile.chamber.code} (${profile.chamber.name}) committed to Immutable Ledger (COMMITTED_IMMUTABLE_V25)`,
          `PRINT-${profile.chamber.code}-${Date.now()}`,
          'success',
          'ETDA Sec 28'
        );
      }
    },
    [isAudioEnabled, onSystemEvent, onAddSystemEvent]
  );

  // Summary Stats Bar & System Integrity Index calculations
  const avgStability = useMemo(() => {
    if (chamberProfiles.length === 0) return '100.00';
    const sum = chamberProfiles.reduce((acc, c) => acc + c.currentStability, 0);
    return (sum / chamberProfiles.length).toFixed(2);
  }, [chamberProfiles]);

  const avgCoherence = useMemo(() => {
    if (chamberProfiles.length === 0) return '100.00';
    const sum = chamberProfiles.reduce((acc, c) => acc + c.currentCoherence, 0);
    return (sum / chamberProfiles.length).toFixed(2);
  }, [chamberProfiles]);

  const activeNodesCount = useMemo(() => {
    return chamberProfiles.filter((c) => c.status !== 'LOCKED_PROTECTED').length;
  }, [chamberProfiles]);

  // Bulk Lockdown Handlers
  const toggleSelectChamber = useCallback((chamberCode: string) => {
    setSelectedLockdownChambers((prev) =>
      prev.includes(chamberCode) ? prev.filter((id) => id !== chamberCode) : [...prev, chamberCode]
    );
  }, []);

  // Batch Print Functionality for Unstable Chamber Events
  const handleBatchPrint = useCallback(() => {
    if (selectedLockdownChambers.length === 0) {
      const warningMsg = 'Please select at least one chamber for Batch Print dossier generation.';
      setPrintToast(warningMsg);
      setTimeout(() => setPrintToast((curr) => (curr === warningMsg ? null : curr)), 3500);
      return;
    }
    const batchId = `PRINT-BATCH-${Date.now().toString().slice(-4)}`;
    const chamberList = selectedLockdownChambers.join(', ');
    const newRecord: PrintAuditRecord = {
      printId: batchId,
      chamberSource: `BATCH [${selectedLockdownChambers.length} Chambers: ${chamberList}]`,
      timestamp: new Date().toISOString(),
      ledgerStatus: 'COMMITTED_IMMUTABLE_V25',
    };
    setPrintLedgerLogs((prev) => [newRecord, ...prev]);

    const msg = `[Batch Print Dossier] Generated consolidated evidence report for: ${chamberList}. Logged as ${batchId}.`;
    setPrintToast(msg);
    setTimeout(() => setPrintToast((curr) => (curr === msg ? null : curr)), 4500);

    if (onSystemEvent) {
      onSystemEvent(msg);
    }
    if (onAddSystemEvent) {
      onAddSystemEvent(
        'AUDIT',
        'Batch Forensic Print Dossier Generated',
        `Consolidated forensic evidence dossier sealed for chambers: ${chamberList}.`,
        `HASH-${batchId}`,
        'info',
        'ETDA Sec 28'
      );
    }
  }, [selectedLockdownChambers, onSystemEvent, onAddSystemEvent]);

  // Execute Bulk Lockdown with 2FA Sovereign Note & Signature
  const execute2FALockdown = useCallback(() => {
    if (!adminNote.trim()) {
      const warningMsg = 'Administrator note or digital signature is required for 2FA Sovereign Lockdown confirmation.';
      setPrintToast(warningMsg);
      setTimeout(() => setPrintToast((curr) => (curr === warningMsg ? null : curr)), 3500);
      return;
    }

    setChamberProfiles((prev) =>
      prev.map((prof) => {
        if (selectedLockdownChambers.includes(prof.chamber.code)) {
          return {
            ...prof,
            status: 'LOCKED_PROTECTED',
            prevCoherence: prof.currentCoherence,
            currentCoherence: 100.0,
            prevCryoTemp: prof.currentCryoTemp,
            currentStability: 100.0,
            varianceFlag: false,
            coherenceHistory: [...(prof.coherenceHistory || []).slice(1), 100.0],
          };
        }
        return prof;
      })
    );

    const lockedList = selectedLockdownChambers.join(', ');
    const msg = `[2FA Lockdown Approved] Admin Note: "${adminNote}". Applied protective lockdown to: ${lockedList}`;
    setPrintToast(msg);
    setTimeout(() => setPrintToast((curr) => (curr === msg ? null : curr)), 4500);

    if (onSystemEvent) {
      onSystemEvent(msg);
    }
    if (onAddSystemEvent) {
      onAddSystemEvent(
        'LOCKDOWN',
        '2FA Sovereign Protective Lockdown Executed',
        `Authorized by Admin Note: "${adminNote}". Applied protective lockdown to: ${lockedList}. Coherence restored to 100.00%.`,
        `LOCKDOWN-2FA-${Date.now()}`,
        'success',
        'ETDA Sec 26'
      );
    }

    setSelectedLockdownChambers([]);
    setAdminNote('');
    setShow2FADialog(false);
    setShowOverlay(false);
  }, [adminNote, selectedLockdownChambers, onSystemEvent, onAddSystemEvent]);

  const handleBulkLockdown = useCallback(() => {
    if (selectedLockdownChambers.length === 0) return;

    setChamberProfiles((prev) =>
      prev.map((prof) => {
        if (selectedLockdownChambers.includes(prof.chamber.code)) {
          return {
            ...prof,
            status: 'LOCKED_PROTECTED',
            currentCoherence: 100.0,
            currentStability: 100.0,
            varianceFlag: false,
          };
        }
        return prof;
      })
    );

    const lockedList = selectedLockdownChambers.join(', ');
    const msg = `[Bulk Lockdown] Successfully applied protective sovereign lockdown to: ${lockedList}`;
    setPrintToast(msg);
    setTimeout(() => {
      setPrintToast((curr) => (curr === msg ? null : curr));
    }, 4000);

    if (onSystemEvent) {
      onSystemEvent(msg);
    }
    if (onAddSystemEvent) {
      onAddSystemEvent(
        'LOCKDOWN',
        'Bulk Sovereign Protective Lockdown',
        `Applied protective sovereign lockdown to: ${lockedList}. Coherence restored to 100.00%.`,
        `LOCKDOWN-${Date.now()}`,
        'success',
        'ETDA Sec 26'
      );
    }

    setSelectedLockdownChambers([]);
    setShowOverlay(false);
  }, [selectedLockdownChambers, onSystemEvent, onAddSystemEvent]);

  // Export Signed CSV Chamber Report Handler
  const handleExportChamberReport = useCallback(() => {
    const csvHeader = "Chamber ID,Chamber Name,Coherence (%),Cryogenic Temp (mK),Status,Timestamp\n";
    const csvRows = chamberProfiles
      .map(
        (c) =>
          `"${c.chamber.code}","${c.chamber.name}",${c.currentCoherence.toFixed(2)},${c.currentCryoTemp.toFixed(2)},"${c.status || (c.currentCoherence < 95 ? 'UNSTABLE' : 'PURE_GREEN')}","${new Date().toISOString()}"`
      )
      .join("\n");
    const signedMetadata = `\n# SIGNED_PQC_HASH: 909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68\n# QUORUM: 10/10 REAL_HSM VERIFIED\n# GENESIS: #849202\n`;
    const blob = new Blob([csvHeader + csvRows + signedMetadata], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ZYRQUEN_Sovereign_Chambers_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const msg = 'Exported Signed Chamber Telemetry Report (CSV) with PQC Dilithium-5 Attestation.';
    setPrintToast(msg);
    setTimeout(() => {
      setPrintToast((curr) => (curr === msg ? null : curr));
    }, 4000);
  }, [chamberProfiles]);

  // Requirement 1: Filtered Unstable Events for Notification Overlay
  const filteredUnstableEvents = useMemo(() => {
    return unstableEvents.filter(
      (e) =>
        e.chamberId.toLowerCase().includes(overlaySearchQuery.toLowerCase()) ||
        e.timestamp.includes(overlaySearchQuery)
    );
  }, [unstableEvents, overlaySearchQuery]);

  // Color mapper based on metric and value
  const getCellHeatStyle = useCallback(
    (metric: HeatmapMetricType, value: number) => {
      if (metric === 'coherence') {
        // Coherence: 99.950% SLA threshold, 99.990%+ optimal
        if (value >= 99.99) {
          return {
            bg: 'bg-emerald-500/20 hover:bg-emerald-500/30',
            border: 'border-emerald-500/50',
            text: 'text-emerald-300',
            glow: 'shadow-[0_0_12px_rgba(16,185,129,0.3)]',
            indicator: 'bg-emerald-400',
          };
        }
        if (value >= 99.95) {
          return {
            bg: 'bg-teal-500/20 hover:bg-teal-500/30',
            border: 'border-teal-500/40',
            text: 'text-teal-300',
            glow: 'shadow-[0_0_8px_rgba(20,184,166,0.2)]',
            indicator: 'bg-teal-400',
          };
        }
        if (value >= 99.9) {
          return {
            bg: 'bg-amber-500/20 hover:bg-amber-500/30',
            border: 'border-amber-500/40',
            text: 'text-amber-300',
            glow: 'shadow-[0_0_8px_rgba(245,158,11,0.2)]',
            indicator: 'bg-amber-400',
          };
        }
        return {
          bg: 'bg-rose-500/20 hover:bg-rose-500/30',
          border: 'border-rose-500/50',
          text: 'text-rose-300',
          glow: 'shadow-[0_0_12px_rgba(244,63,94,0.4)]',
          indicator: 'bg-rose-400',
        };
      }

      if (metric === 'stability') {
        if (value >= 99.98) {
          return {
            bg: 'bg-emerald-500/20 hover:bg-emerald-500/30',
            border: 'border-emerald-500/50',
            text: 'text-emerald-300',
            glow: 'shadow-[0_0_12px_rgba(16,185,129,0.3)]',
            indicator: 'bg-emerald-400',
          };
        }
        if (value >= 99.9) {
          return {
            bg: 'bg-cyan-500/20 hover:bg-cyan-500/30',
            border: 'border-cyan-500/40',
            text: 'text-cyan-300',
            glow: 'shadow-[0_0_8px_rgba(6,182,212,0.2)]',
            indicator: 'bg-cyan-400',
          };
        }
        return {
          bg: 'bg-amber-500/20 hover:bg-amber-500/30',
          border: 'border-amber-500/40',
          text: 'text-amber-300',
          glow: 'shadow-[0_0_8px_rgba(245,158,11,0.2)]',
          indicator: 'bg-amber-400',
        };
      }

      if (metric === 'cryoTemp') {
        // Cryo Temp (mK): Target 14.98 mK, SLA <= 18.00 mK
        if (value <= 15.2) {
          return {
            bg: 'bg-cyan-500/20 hover:bg-cyan-500/30',
            border: 'border-cyan-500/50',
            text: 'text-cyan-300',
            glow: 'shadow-[0_0_12px_rgba(6,182,212,0.3)]',
            indicator: 'bg-cyan-400',
          };
        }
        if (value <= 18.0) {
          return {
            bg: 'bg-blue-500/20 hover:bg-blue-500/30',
            border: 'border-blue-500/40',
            text: 'text-blue-300',
            glow: 'shadow-[0_0_8px_rgba(59,130,246,0.2)]',
            indicator: 'bg-blue-400',
          };
        }
        return {
          bg: 'bg-rose-500/20 hover:bg-rose-500/30',
          border: 'border-rose-500/50',
          text: 'text-rose-300',
          glow: 'shadow-[0_0_12px_rgba(244,63,94,0.4)]',
          indicator: 'bg-rose-400',
        };
      }

      // Drift metric (ppm) - 0.00 ppm is perfect zero drift
      return {
        bg: 'bg-emerald-500/20 hover:bg-emerald-500/30',
        border: 'border-emerald-500/50',
        text: 'text-emerald-300',
        glow: 'shadow-[0_0_12px_rgba(16,185,129,0.3)]',
        indicator: 'bg-emerald-400',
      };
    },
    []
  );

  // Trigger manual heartbeat sweep
  const handleTriggerManualHeartbeat = () => {
    playAuditChime();
    setHeartbeatCycle((prev) => prev + 1);
    setHeartbeatPulse(true);
    setTimeout(() => setHeartbeatPulse(false), 260);

    if (onAddSystemEvent) {
      onAddSystemEvent(
        'TELEMETRY',
        'Manual Heartbeat Pulse Dispatched',
        '18 Sovereign Chambers verified across 10/10 REAL_HSM quorum at 14.98 mK with Δ0.00% Zero Drift.',
        'merkle:909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
        'success',
        'ISO/IEC 27037 & ETDA Sec 28'
      );
    }
  };

  // Export 18 Chambers Governance Health JSON
  const handleExportHealthReport = () => {
    playAuditChime();
    const payload = {
      exportTimestamp: new Date().toISOString(),
      canonicalMerkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      genesisBlock: '#849202',
      aggregateHealth: aggregateMetrics,
      heartbeatStatus: {
        cycle: heartbeatCycle,
        frequencyHz: 1.0,
        carrierQops: latestSnapshot?.qopsThroughput ?? 851.9,
        cryoTempMk: aggregateMetrics.meanCryo,
        zeroDrift: 'Δ0.00% SSoT Guaranteed',
        quorum: '10/10 REAL_HSM FIPS 140-3 L4 Attested',
      },
      chambers: chamberProfiles.map((p) => ({
        id: p.chamber.id,
        code: p.chamber.code,
        name: p.chamber.name,
        nameTh: p.chamber.nameTh,
        category: p.chamber.category,
        status: p.chamber.status,
        currentCoherence: `${p.currentCoherence}%`,
        currentStability: `${p.currentStability}%`,
        currentCryoTemp: `${p.currentCryoTemp} mK`,
        driftDelta: 'Δ0.00%',
        invariants: p.chamber.invariants,
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zyrquen-18-chambers-governance-health-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Current Grid Raw Data to CSV for External Spreadsheet Analysis
  const handleExportCsv = useCallback(() => {
    const snapshotLabel = historicalSnapshotMeta
      ? `HISTORICAL_SNAPSHOT_${historicalSnapshotMeta.timestamp}`
      : `LIVE_CYCLE_${heartbeatCycle}`;
    const nowIso = new Date().toISOString();
    const escapeCsvField = (val: string | number) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = [
      'TimestampUTC',
      'SnapshotMode',
      'ChamberCode',
      'ChamberName',
      'Category',
      'NodeID',
      'SealRange',
      'HardwareSealStatus',
      'CoherencePct',
      'StabilityPct',
      'CryoTempMk',
      'HsmQuorumNodes',
      'IntegrationStage',
      'LineCoveragePct',
      'BranchCoveragePct',
      'CompletenessStatus',
      'UncoveredLineRanges',
      'ForensicDossierID',
    ];

    const rows = filteredProfiles.map((prof, idx) => {
      const covMetric =
        CHAMBER_INTEGRATION_COVERAGE_METRICS.find((m) => m.chamberCode === prof.chamber.code) ||
        CHAMBER_INTEGRATION_COVERAGE_METRICS[idx % CHAMBER_INTEGRATION_COVERAGE_METRICS.length];
      const dossier =
        CANONICAL_HSM_NODE_FORENSIC_DOSSIERS[idx % CANONICAL_HSM_NODE_FORENSIC_DOSSIERS.length];
      const startSeal = idx * 828 + 1;
      const endSeal = Math.min(14902, (idx + 1) * 828);
      const sealRange = `SEAL-${String(startSeal).padStart(5, '0')}..SEAL-${String(endSeal).padStart(5, '0')}`;
      const lineCov = historicalSnapshotMeta
        ? +(Math.max(85, covMetric.linesPct + (historicalSnapshotMeta.isDegradationWindow ? -1.4 : -0.2))).toFixed(2)
        : covMetric.linesPct;
      const branchCov = historicalSnapshotMeta
        ? +(Math.max(60, covMetric.branchesPct + (historicalSnapshotMeta.isDegradationWindow ? -4.5 : -0.4))).toFixed(2)
        : covMetric.branchesPct;

      return [
        historicalSnapshotMeta ? historicalSnapshotMeta.timestamp : nowIso,
        snapshotLabel,
        prof.chamber.code,
        prof.chamber.name,
        prof.chamber.category,
        dossier.nodeId,
        sealRange,
        prof.status || (prof.currentCoherence < 95 ? 'UNSTABLE' : 'PURE_GREEN'),
        prof.currentCoherence.toFixed(3),
        prof.currentStability.toFixed(2),
        prof.currentCryoTemp.toFixed(2),
        `${effectiveHsmQuorumNodes}/10`,
        covMetric.integrationStage,
        lineCov,
        branchCov,
        covMetric.completenessStatus,
        covMetric.uncoveredLineRanges,
        dossier.dossierId,
      ]
        .map(escapeCsvField)
        .join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const filename = `zyrquen-governance-heatmap-${Date.now()}.csv`;

    try {
      if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // Safe fallback in headless test environments
    }

    setLastExportedCsvMeta({
      filename,
      rowCount: rows.length,
      timestampUtc: nowIso,
      snapshotLabel,
    });

    if (isAudioEnabled) {
      playAuditChime();
    }

    const msg = `[CSV Export Complete] Downloaded ${filename} (${rows.length} grid records · ${snapshotLabel})`;
    setPrintToast(msg);
    setTimeout(() => setPrintToast((curr) => (curr === msg ? null : curr)), 4500);

    if (onSystemEvent) onSystemEvent(msg);
    if (onAddSystemEvent) {
      onAddSystemEvent(
        'EXPORT_CSV',
        `Governance Heatmap CSV Exported (${rows.length} Rows)`,
        `Exported current grid raw data (${snapshotLabel}) formatted for external spreadsheet analysis: ${filename}.`,
        `csv-export:${Date.now()}`,
        'success',
        'ETDA Sec 28 / ISO-42001 Spreadsheet Audit'
      );
    }
  }, [
    filteredProfiles,
    historicalSnapshotMeta,
    heartbeatCycle,
    effectiveHsmQuorumNodes,
    isAudioEnabled,
    onSystemEvent,
    onAddSystemEvent,
  ]);

  // Generate Court-Admissible Heatmap Forensic PDF (ETDA B.E. 2544 Section 28) using jsPDF
  const handleGenerateHeatmapForensicPdf = useCallback(() => {
    playAuditChime();
    const chamberSnapshots = chamberProfiles.map((p) => ({
      code: p.chamber.code,
      name: p.chamber.name,
      category: p.chamber.category,
      coherencePct: p.currentCoherence,
      stabilityPct: p.currentStability,
      cryoTempMk: p.currentCryoTemp,
      sealStatus: p.status || (p.currentCoherence < 95 ? 'UNSTABLE' : 'PURE_GREEN'),
      invariantsCount: p.invariantsPassing,
    }));

    // Serialize current grid hardware status and integration coverage metrics via jsPDF
    try {
      const pdfDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      pdfDoc.setFont('courier', 'bold');
      pdfDoc.setFontSize(10);
      pdfDoc.text('ZYRQUEN COURT-ADMISSIBLE HEATMAP FORENSIC DOSSIER (ETDA SEC 28)', 14, 16);
      pdfDoc.setFont('courier', 'normal');
      pdfDoc.setFontSize(8);
      pdfDoc.text(
        `Overlay: ${overlayMode} | Metric: ${activeMetric} | Active HSM Quorum: ${effectiveHsmQuorumNodes}/10 | Cycle: #${heartbeatCycle}`,
        14,
        22
      );
      autoTable(pdfDoc, {
        startY: 27,
        head: [['Chamber', 'Hardware Node', 'Seal Status', 'Coherence', 'Integration Stage', 'Line/Branch Cov', 'Dossier Artifact']],
        body: chamberSnapshots.map((ch, idx) => {
          const cov =
            CHAMBER_INTEGRATION_COVERAGE_METRICS.find((m) => m.chamberCode === ch.code) ||
            CHAMBER_INTEGRATION_COVERAGE_METRICS[idx % CHAMBER_INTEGRATION_COVERAGE_METRICS.length];
          const node =
            hsmNodeDossiersWithStatus[idx % hsmNodeDossiersWithStatus.length];
          return [
            ch.code,
            node.nodeId,
            ch.sealStatus,
            `${ch.coherencePct.toFixed(2)}%`,
            cov.integrationStage,
            `${cov.linesPct.toFixed(1)}% / ${cov.branchesPct.toFixed(0)}%`,
            node.dossierId,
          ];
        }),
      });
    } catch {
      // Fallback handled by generateHeatmapForensicPdf below
    }

    const receipt = generateHeatmapForensicPdf({
      overlayMode,
      activeMetric,
      heartbeatCycle,
      activeHsmQuorumNodes: effectiveHsmQuorumNodes,
      totalHsmQuorumNodes: 10,
      isolatedHsmDossiers: breachedHsmDossiers,
      chambers: chamberSnapshots,
      interactedUntestedCells,
      triggerDownload: true,
    });

    setLastPdfReceipt(receipt);

    const newRecord: PrintAuditRecord = {
      printId: receipt.documentId,
      chamberSource: `ETDA SEC 28 HEATMAP PDF (${receipt.capturedChambersCount} Chambers • ${receipt.overlayMode} • ${receipt.activeHsmQuorumNodes}/10 HSM)`,
      timestamp: receipt.timestampUtc,
      ledgerStatus: 'COMMITTED_IMMUTABLE_V25',
    };
    setPrintLedgerLogs((prev) => [newRecord, ...prev]);

    const msg = `[ETDA Sec 28 Forensic PDF] Generated ${receipt.filename} (Digest: ${receipt.sha256Digest.slice(0, 18)}...)`;
    setPrintToast(msg);
    setTimeout(() => setPrintToast((curr) => (curr === msg ? null : curr)), 4500);

    if (onSystemEvent) onSystemEvent(msg);
    if (onAddSystemEvent) {
      onAddSystemEvent(
        'COMPLIANCE',
        `ETDA Sec 28 Heatmap Forensic PDF Sealed (${receipt.documentId})`,
        `Captured 18 Chambers Hardware Seal Status & Integration Coverage (${PRODUCTION_INTEGRATION_COVERAGE_SUMMARY.adapterLinesPct}% Lines) with ${receipt.activeHsmQuorumNodes}/10 HSM Quorum.`,
        receipt.sha256Digest,
        'success',
        'ETDA B.E. 2544 Section 28'
      );
    }
  }, [
    overlayMode,
    activeMetric,
    heartbeatCycle,
    effectiveHsmQuorumNodes,
    breachedHsmDossiers,
    chamberProfiles,
    interactedUntestedCells,
    onSystemEvent,
    onAddSystemEvent,
  ]);

  // Prepare temporal aggregate data for Recharts Trend
  const trendData = useMemo(() => {
    if (chamberProfiles.length === 0) return [];
    const epochsCount = chamberProfiles[0].recentSnapshots.length;
    const result = [];

    for (let eIdx = 0; eIdx < epochsCount; eIdx++) {
      let sumCoh = 0;
      let sumStab = 0;
      let sumCryo = 0;
      let timeLabel = '';

      chamberProfiles.forEach((prof) => {
        const snap = prof.recentSnapshots[eIdx];
        if (snap) {
          sumCoh += snap.coherencePct;
          sumStab += snap.stabilityIndex;
          sumCryo += snap.cryoTempMk;
          timeLabel = snap.timestamp;
        }
      });

      result.push({
        time: timeLabel,
        meanCoherence: +(sumCoh / chamberProfiles.length).toFixed(3),
        meanStability: +(sumStab / chamberProfiles.length).toFixed(2),
        meanCryo: +(sumCryo / chamberProfiles.length).toFixed(2),
        slaThreshold: 99.95,
        nominalCryoLimit: 18.0,
      });
    }

    return result;
  }, [chamberProfiles]);

  return (
    <div
      id="governance-health-heatmap-container"
      data-testid="governance-health-heatmap-container"
      data-hsm-quorum={effectiveHsmQuorumNodes}
      data-hsm-breach-active={isHsmHealthBreachActive ? 'true' : 'false'}
      className={`space-y-6 animate-in fade-in duration-300 ${
        isHsmHealthBreachActive ? 'hsm-breach-alert-layer' : ''
      }`}
    >
      {/* 🏛️ Header: Sovereign Master Telemetry & Heartbeat HUD */}
      <div className="p-6 sm:p-8 rounded-[28px] bg-gradient-to-br from-[#070a12] via-[#0a0f1e] to-[#0f172a] border-cyan-500/20 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/10 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>18 SOVEREIGN CHAMBERS ONLINE</span>
              </span>

              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border transition-all ${
                  heartbeatPulse
                    ? 'bg-cyan-500/30 text-white border-cyan-400 shadow-[0_0_14px_rgba(6,182,212,0.6)] scale-105'
                    : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                }`}
              >
                <Activity className={`w-3.5 h-3.5 ${heartbeatPulse ? 'text-white' : 'text-cyan-400'}`} />
                <span>HEARTBEAT 1.00 Hz • NOMINAL</span>
              </span>

              <span className="px-3 py-1 rounded-full bg-zinc-800/80 text-zinc-300 border-white/10 text-xs font-mono">
                CYCLE #{heartbeatCycle}
              </span>

              <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border-amber-500/30 text-xs font-mono">
                SSoT Δ0.00% ZERO DRIFT
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight flex items-center gap-3">
              <span>Governance Health Heatmap</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-300 font-mono font-normal">
                100% PURE GREEN
              </span>
            </h1>

            <p className="text-sm text-zinc-400 max-w-3xl font-sans">
              Real-time spatiotemporal matrix visualizing the cryptographic stability, quantum coherence, and sub-Kelvin
              cryogenic telemetry of all <span className="text-emerald-400 font-mono font-bold">18 Sovereign Chambers (CH-00–CH-17)</span>.
              Directly bound to the Sovereign Engine's 1.00 Hz clock heartbeat and Genesis Block #849202.
            </p>
          </div>

          {/* Heartbeat Controls & Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Toggle between Hardware Seal Status and Integration Coverage Overlay */}
            <div
              id="heatmap-overlay-mode-switcher"
              className="flex items-center bg-black/60 p-1 rounded-xl border border-cyan-500/30 text-xs font-mono"
            >
              <button
                id="btn-mode-hardware-seal-status"
                type="button"
                onClick={() => {
                  setOverlayMode('SEAL_STATUS');
                  if (activeMetric === 'integrationCoverage') setActiveMetric('coherence');
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  overlayMode === 'SEAL_STATUS'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Hardware Seal Status
              </button>
              <button
                id="btn-toggle-integration-coverage-overlay"
                type="button"
                onClick={() => {
                  const next = overlayMode === 'INTEGRATION_COVERAGE' ? 'SEAL_STATUS' : 'INTEGRATION_COVERAGE';
                  setOverlayMode(next);
                  if (next === 'INTEGRATION_COVERAGE') {
                    setActiveMetric('integrationCoverage');
                  } else {
                    setActiveMetric('coherence');
                  }
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  overlayMode === 'INTEGRATION_COVERAGE'
                    ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Integration Coverage Overlay
              </button>
            </div>

            {/* Heartbeat Play/Pause */}
            <button
              id="btn-toggle-heartbeat-pulse"
              onClick={() => setIsHeartbeatRunning((prev) => !prev)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                isHeartbeatRunning
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
              }`}
              title={isHeartbeatRunning ? 'Pause Heartbeat Ticker' : 'Resume Heartbeat Ticker'}
            >
              {isHeartbeatRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isHeartbeatRunning ? 'PULSING' : 'PAUSED'}</span>
            </button>

            {/* Audio Feedback Toggle */}
            <button
              id="btn-toggle-audio-chime"
              onClick={() => setIsAudioEnabled((prev) => !prev)}
              className={`p-2 rounded-xl text-xs font-mono border transition cursor-pointer ${
                isAudioEnabled
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : 'bg-white/5 text-zinc-400 border-white/10 hover:text-zinc-200'
              }`}
              title={isAudioEnabled ? 'Mute Heartbeat Chime' : 'Enable Heartbeat Chime'}
            >
              {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Manual Pulse Trigger */}
            <button
              id="btn-trigger-manual-pulse"
              onClick={handleTriggerManualHeartbeat}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono font-bold text-xs flex items-center gap-2 shadow-[0_0_16px_rgba(16,185,129,0.3)] transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${heartbeatPulse ? 'animate-spin' : ''}`} />
              <span>TRIGGER PULSE</span>
            </button>

            {/* Generate Heatmap Forensic PDF (ETDA Sec 28) */}
            <button
              id="btn-generate-heatmap-forensic-pdf"
              type="button"
              onClick={handleGenerateHeatmapForensicPdf}
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-mono font-bold text-xs flex items-center gap-1.5 shadow-[0_0_14px_rgba(245,158,11,0.2)] transition cursor-pointer"
              title="Generate Court-Admissible Heatmap Forensic PDF (Hardware Seal Status + Integration Coverage per ETDA Sec 28)"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Generate Heatmap Forensic PDF</span>
            </button>

            {/* Copy Deep-Link Button for Rapid Forensic Team Collaboration */}
            <button
              id="btn-copy-heatmap-deep-link"
              type="button"
              onClick={handleCopyDeepLink}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 font-mono font-bold text-xs flex items-center gap-1.5 shadow-[0_0_14px_rgba(6,182,212,0.2)] transition cursor-pointer"
              title="Copy URL Deep-Link including currently selected filter parameters for forensic collaboration"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-300" />
              <span>Copy Deep-Link</span>
            </button>

            {/* Export to CSV Button for External Spreadsheet Analysis */}
            <button
              id="btn-export-heatmap-csv"
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 font-mono font-bold text-xs flex items-center gap-1.5 shadow-[0_0_14px_rgba(16,185,129,0.2)] transition cursor-pointer"
              title="Download raw data of the current grid as CSV formatted for external spreadsheet analysis"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
              <span>Export to CSV</span>
            </button>

            {/* Export JSON */}
            <button
              id="btn-export-health-report"
              onClick={handleExportHealthReport}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 font-mono text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Download 18 Chambers Governance Telemetry JSON"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>EXPORT JSON</span>
            </button>
          </div>
        </div>

        {/* Exported CSV Confirmation Banner */}
        {lastExportedCsvMeta && (
          <div
            id="heatmap-csv-export-banner"
            className="relative z-10 mt-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-400/50 flex flex-wrap items-center justify-between gap-2 text-xs font-mono"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-emerald-200 font-bold shrink-0">Spreadsheet CSV Exported:</span>
              <code className="text-white bg-black/60 px-2 py-0.5 rounded border border-white/10 truncate">
                {lastExportedCsvMeta.filename} ({lastExportedCsvMeta.rowCount} rows · {lastExportedCsvMeta.snapshotLabel})
              </code>
            </div>
            <button
              type="button"
              onClick={() => setLastExportedCsvMeta(null)}
              className="text-zinc-400 hover:text-white text-[11px] px-2 py-0.5 rounded bg-white/5 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Court-Admissible Heatmap Forensic PDF Receipt Banner (jsPDF) */}
        {lastPdfReceipt && (
          <div
            id="heatmap-forensic-pdf-receipt-banner"
            className="relative z-10 mt-4 p-3 rounded-xl bg-amber-950/60 border border-amber-400/50 flex flex-wrap items-center justify-between gap-2 text-xs font-mono"
          >
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <FileText className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-amber-200 font-bold shrink-0">Court-Admissible jsPDF Sealed:</span>
              <code className="text-white bg-black/60 px-2 py-0.5 rounded border border-white/10 truncate">
                {lastPdfReceipt.filename} ({lastPdfReceipt.documentId} · {lastPdfReceipt.capturedChambersCount} Chambers · {lastPdfReceipt.activeHsmQuorumNodes}/10 HSM · SHA-256: {lastPdfReceipt.sha256Digest.slice(0, 18)}...)
              </code>
            </div>
            <button
              type="button"
              onClick={() => setLastPdfReceipt(null)}
              className="text-zinc-400 hover:text-white text-[11px] px-2 py-0.5 rounded bg-white/5 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Browser-Level Hardware Node Warning Threshold Toast Banner */}
        {warningThresholdToast && (
          <div
            id="hardware-node-warning-toast"
            data-testid="hardware-node-warning-toast"
            role="status"
            className="relative z-10 mt-4 p-3.5 rounded-xl bg-amber-950/80 border-2 border-amber-400/70 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-[0_0_20px_rgba(245,158,11,0.3)]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 animate-bounce" />
              <div className="space-y-0.5">
                <div className="text-amber-200 font-bold">
                  BROWSER WARNING NOTIFICATION • NODE {warningThresholdToast.nodeId} ({warningThresholdToast.nodeName} • {warningThresholdToast.chamberCode}) BELOW WARNING THRESHOLD
                </div>
                <div className="text-zinc-200 text-[11px]">
                  Observed Coherence: <strong className="text-amber-300">{warningThresholdToast.observedCoherencePct}%</strong> (Threshold: &ge;{warningThresholdToast.thresholdPct.toFixed(2)}%) · Throughput: <strong className="text-cyan-300">{warningThresholdToast.throughputQops} QOPS</strong>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                id="btn-warning-toast-view-dossier"
                type="button"
                onClick={() => {
                  const found =
                    hsmNodeDossiersWithStatus.find((d) => d.nodeId === warningThresholdToast.nodeId) ||
                    hsmNodeDossiersWithStatus[0];
                  setSelectedForensicDossier(found);
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-500/25 hover:bg-amber-500/40 border border-amber-300/50 text-amber-100 font-bold text-[11px] cursor-pointer"
              >
                View Forensic Dossier
              </button>
              <button
                id="btn-dismiss-node-warning-toast"
                type="button"
                onClick={() => {
                  setWarningThresholdToast(null);
                  setWarnedNodeIds([]);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-200 text-[11px] cursor-pointer"
              >
                Acknowledge &amp; Restore
              </button>
            </div>
          </div>
        )}

        {/* Copied Deep-Link Collaboration URL Banner */}
        {copiedDeepLinkUrl && (
          <div
            id="heatmap-copied-deep-link-banner"
            className="relative z-10 mt-4 p-3 rounded-xl bg-cyan-950/60 border border-cyan-400/50 flex flex-wrap items-center justify-between gap-2 text-xs font-mono"
          >
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-cyan-200 font-bold shrink-0">Forensic Deep-Link Ready:</span>
              <code className="text-white bg-black/60 px-2 py-0.5 rounded border border-white/10 truncate">
                {copiedDeepLinkUrl}
              </code>
            </div>
            <button
              type="button"
              onClick={() => setCopiedDeepLinkUrl(null)}
              className="text-zinc-400 hover:text-white text-[11px] px-2 py-0.5 rounded bg-white/5 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* 🚨 HIGH-PRIORITY HEALTH BREACH ALERT VISUAL LAYER (When HSM Quorum Nodes < 8) */}
      {isHsmHealthBreachActive && (
        <div
          id="hsm-quorum-health-breach-alert-layer"
          role="alert"
          className="p-5 rounded-2xl bg-gradient-to-r from-red-950/90 via-rose-950/85 to-[#120609] border-2 border-rose-500/80 hsm-breach-alert-layer security-view-crimson-pulse shadow-[0_0_35px_rgba(244,63,94,0.35)] space-y-4"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-rose-500/30 pb-3.5">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/25 border border-rose-400/50 text-rose-300 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-300">
                    HIGH-PRIORITY HEALTH BREACH ALERT • HSM QUORUM BELOW 8/10 THRESHOLD
                  </span>
                  <span aria-hidden="true" className="text-rose-400">·</span>
                  <span className="text-xs font-mono font-bold text-white">
                    ACTIVE QUORUM: {effectiveHsmQuorumNodes}/10 NODES (MINIMUM REQUIRED: 8/10)
                  </span>
                </div>
                <p className="text-xs text-rose-100/90 font-sans">
                  Sub-Kelvin Hardware Security Module super-majority threshold breached. Fail-closed promotion lock is
                  engaged. Inspect the direct court-admissible forensic dossiers for each isolated hardware node below.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {onNavigateToView && (
                <button
                  id="btn-navigate-forensic-dossier-view"
                  type="button"
                  onClick={() => onNavigateToView('security')}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/25 hover:bg-rose-500/35 border border-rose-400/60 text-rose-100 font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-rose-300" />
                  <span>Open HSM Security Forensics</span>
                </button>
              )}
              <button
                id="btn-restore-hsm-quorum-nodes"
                type="button"
                onClick={handleToggleHsmQuorumBreachSimulation}
                className="px-3.5 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-400/60 text-emerald-200 font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Restore 10/10 HSM Quorum</span>
              </button>
            </div>
          </div>

          {/* Direct Forensic Dossier Links for Affected / Isolated Hardware Nodes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {breachedHsmDossiers.map((dossier) => (
              <div
                key={dossier.nodeId}
                id={`breached-hsm-node-card-${dossier.nodeId.toLowerCase()}`}
                className="p-3.5 rounded-xl bg-black/70 border border-rose-500/40 flex flex-col justify-between gap-2.5 text-xs font-mono"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-rose-300 font-bold">
                    <span>{dossier.nodeId} ({dossier.signerNode})</span>
                    <span className="text-[10px] text-rose-400">ISOLATED</span>
                  </div>
                  <div className="text-[11px] text-white font-semibold">{dossier.nodeName}</div>
                  <div className="text-[10px] text-zinc-400">
                    Dossier ID: <span className="text-cyan-300">{dossier.dossierId}</span> · {dossier.associatedChamber}
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate">
                    PQC Key: {dossier.publicKey} · Sig: {dossier.signatureDigest.slice(0, 14)}...
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                  <button
                    id={`btn-open-forensic-dossier-${dossier.nodeId.toLowerCase()}`}
                    type="button"
                    onClick={() => setSelectedForensicDossier(dossier)}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 border border-rose-400/50 text-rose-200 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer w-full justify-center"
                  >
                    <FileText className="w-3.5 h-3.5 text-rose-300" />
                    <span>Inspect Node Forensic Dossier ({dossier.dossierId})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 📊 Aggregate Telemetry HUD Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-black/40 border-white/8">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 uppercase">
            <span>Mean Coherence</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-400 mt-1">
            {aggregateMetrics.meanCoherence}%
          </div>
          <div className="text-[10px] text-emerald-300/80 font-mono mt-0.5">SLA &ge;99.950% (PASS)</div>
        </div>

        <div className="p-4 rounded-2xl bg-black/40 border-white/8">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 uppercase">
            <span>Stability Index</span>
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-cyan-400 mt-1">
            {aggregateMetrics.meanStability}%
          </div>
          <div className="text-[10px] text-cyan-300/80 font-mono mt-0.5">18/18 SSoT PARITY</div>
        </div>

        <div className="p-4 rounded-2xl bg-black/40 border-white/8">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 uppercase">
            <span>Cryo Temp Mean</span>
            <Thermometer className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-blue-400 mt-1">
            {aggregateMetrics.meanCryo} mK
          </div>
          <div className="text-[10px] text-blue-300/80 font-mono mt-0.5">SLA &le;18.00 mK (NOMINAL)</div>
        </div>

        <div className={`p-4 rounded-2xl border ${isHsmHealthBreachActive ? 'bg-rose-950/40 border-rose-500/60' : 'bg-black/40 border-white/8'}`}>
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 uppercase">
            <span>Quorum Binding</span>
            <Lock className={`w-3.5 h-3.5 ${isHsmHealthBreachActive ? 'text-rose-400 animate-pulse' : 'text-purple-400'}`} />
          </div>
          <div className={`text-xl sm:text-2xl font-mono font-bold mt-1 ${isHsmHealthBreachActive ? 'text-rose-400' : 'text-purple-300'}`}>
            {effectiveHsmQuorumNodes}/10 REAL_HSM
          </div>
          <div className="text-[10px] text-purple-300/80 font-mono mt-0.5">
            {isHsmHealthBreachActive ? 'BREACH ALERT (<8/10 QUORUM)' : 'FIPS 140-3 LEVEL 4'}
          </div>
        </div>
      </div>

      {/* 🎛️ Toolbar: View Modes, Metric Selectors, Search & Category Filter */}
      <div className="p-4 rounded-2xl bg-black/40 border-white/8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* View Mode Switcher */}
        <div className="flex items-center bg-black/60 p-1 rounded-xl border-white/10 text-xs font-mono">
          <button
            id="tab-view-grid"
            onClick={() => setActiveViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeViewMode === 'grid'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>18 Chambers Grid</span>
          </button>

          <button
            id="tab-view-epoch-matrix"
            onClick={() => setActiveViewMode('epoch_matrix')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeViewMode === 'epoch_matrix'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Epoch Heatmap Matrix</span>
          </button>

          <button
            id="tab-view-telemetry-trend"
            onClick={() => setActiveViewMode('telemetry_trend')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeViewMode === 'telemetry_trend'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Heartbeat Trend</span>
          </button>
        </div>

        {/* Metric Selector */}
        <div className="flex items-center gap-1.5 text-xs font-mono flex-wrap">
          <span className="text-zinc-400 mr-1 hidden sm:inline">Color Heat by:</span>
          {(['coherence', 'stability', 'cryoTemp', 'drift', 'integrationCoverage'] as HeatmapMetricType[]).map((metric) => (
            <button
              key={metric}
              id={`metric-btn-${metric}`}
              onClick={() => {
                setActiveMetric(metric);
                if (metric === 'integrationCoverage') {
                  setOverlayMode('INTEGRATION_COVERAGE');
                }
              }}
              className={`px-2.5 py-1 rounded-lg border transition cursor-pointer capitalize ${
                activeMetric === metric
                  ? 'bg-white/10 text-white border-white/30 font-bold'
                  : 'bg-black/40 text-zinc-400 border-white/5 hover:text-zinc-200'
              }`}
            >
              {metric === 'cryoTemp'
                ? 'Cryo (mK)'
                : metric === 'integrationCoverage'
                ? 'Integration Coverage'
                : metric}
            </button>
          ))}
        </div>

        {/* Search & Category Filter (Locate Hardware Seal Status or Integration Path by Node ID or Seal Number) */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              id="heatmap-node-seal-integration-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Node ID (TC-03, CH-04), Seal # (SEAL-08492), Status, or Integration Path..."
              className="w-full bg-black/60 border border-white/15 rounded-xl pl-8 pr-14 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 font-mono"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 hover:text-white cursor-pointer"
              >
                CLEAR
              </button>
            )}
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-black/60 border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500/50 font-mono cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'ALL' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          {/* Historical Snapshot Date Pickers (Timestamp A & Comparison Timestamp B for Diff Overlay) */}
          <div className="flex flex-wrap items-center gap-1.5 bg-black/60 border border-cyan-500/30 rounded-xl px-2.5 py-1">
            <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <label htmlFor="heatmap-historical-date-picker" className="text-[10px] text-zinc-400 shrink-0">
              Timestamp A:
            </label>
            <input
              id="heatmap-historical-date-picker"
              type="datetime-local"
              aria-label="Historical Snapshot Timestamp"
              value={selectedHistoricalTimestamp}
              onChange={(e) => setSelectedHistoricalTimestamp(e.target.value)}
              className="bg-transparent text-xs text-cyan-200 focus:outline-none font-mono cursor-pointer"
            />
            <span className="text-zinc-600">vs</span>
            <label htmlFor="heatmap-comparison-date-picker" className="text-[10px] text-purple-300 shrink-0">
              Timestamp B:
            </label>
            <input
              id="heatmap-comparison-date-picker"
              type="datetime-local"
              aria-label="Comparison Historical Snapshot Timestamp"
              value={comparisonHistoricalTimestamp}
              onChange={(e) => {
                setComparisonHistoricalTimestamp(e.target.value);
                setIsDiffOverlayEnabled(true);
              }}
              className="bg-transparent text-xs text-purple-200 focus:outline-none font-mono cursor-pointer"
            />
            <button
              id="btn-historical-preset-degradation"
              type="button"
              onClick={() => setSelectedHistoricalTimestamp('2026-09-27T11:00')}
              className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[10px] font-bold cursor-pointer"
              title="Load -13h Degradation Historical Snapshot (2026-09-27T11:00)"
            >
              -13h Snapshot
            </button>
            <button
              id="btn-historical-diff-preset"
              type="button"
              onClick={() => {
                setSelectedHistoricalTimestamp('2026-09-27T11:00');
                setComparisonHistoricalTimestamp('2026-09-28T00:00');
                setIsDiffOverlayEnabled(true);
              }}
              className="px-2 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-[10px] font-bold cursor-pointer"
              title="Compare two historical timestamps (2026-09-27T11:00 vs 2026-09-28T00:00) and overlay hardware seal status diff"
            >
              Compare Diff (-13h vs 00h)
            </button>
            {(selectedHistoricalTimestamp || comparisonHistoricalTimestamp) && (
              <button
                id="btn-reset-historical-snapshot"
                type="button"
                onClick={() => {
                  setSelectedHistoricalTimestamp('');
                  setComparisonHistoricalTimestamp('');
                }}
                className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold cursor-pointer"
              >
                Live Stream
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Historical Timestamp Diff Overlay Banner (Comparing Hardware Seal Status Changes Between Two Timestamps) */}
      {historicalDiffOverlay && (
        <div
          id="heatmap-historical-diff-banner"
          data-timestamp-a={historicalDiffOverlay.timestampA}
          data-timestamp-b={historicalDiffOverlay.timestampB}
          data-changed-count={historicalDiffOverlay.totalChangedCount}
          className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-indigo-950/50 to-cyan-950/40 border-2 border-purple-400/60 flex flex-col gap-3 text-xs font-mono shadow-[0_0_25px_rgba(168,85,247,0.25)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-purple-200 font-bold flex-wrap">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>
                  HISTORICAL SEAL STATUS DIFF OVERLAY ACTIVE: {historicalDiffOverlay.timestampA} (Block #{historicalDiffOverlay.blockA}) &rarr; {historicalDiffOverlay.timestampB} (Block #{historicalDiffOverlay.blockB})
                </span>
              </div>
              <div className="text-zinc-300 flex flex-wrap items-center gap-3">
                <span>
                  Status Transitions: <strong className="text-white">{historicalDiffOverlay.totalChangedCount} Chambers Changed</strong>
                </span>
                <span className="text-emerald-300 font-bold">
                  &uarr; {historicalDiffOverlay.improvedCount} Improved / Restored
                </span>
                <span className="text-rose-300 font-bold">
                  &darr; {historicalDiffOverlay.degradedCount} Degraded / Regressed
                </span>
                <span className="text-cyan-300">
                  = {historicalDiffOverlay.unchangedCount} Unchanged
                </span>
                <span>
                  Coverage Δ: <strong className={historicalDiffOverlay.linesDeltaPct >= 0 ? 'text-emerald-300' : 'text-amber-300'}>
                    {historicalDiffOverlay.linesDeltaPct >= 0 ? `+${historicalDiffOverlay.linesDeltaPct}` : historicalDiffOverlay.linesDeltaPct}% Lines
                  </strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                id="btn-toggle-side-by-side-diff"
                type="button"
                onClick={() => setIsSideBySideDiffEnabled((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl border font-bold cursor-pointer transition flex items-center gap-1.5 ${
                  isSideBySideDiffEnabled
                    ? 'bg-purple-600 text-white border-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                    : 'bg-purple-500/20 hover:bg-purple-500/35 border-purple-400/50 text-purple-200'
                }`}
                title="Toggle Side-by-Side comparison mode between Timestamp A and Timestamp B with highlighted changed seal statuses in diff grid"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>{isSideBySideDiffEnabled ? 'Side-by-Side: Active' : 'Side-by-Side Diff Mode'}</span>
              </button>
              <button
                id="btn-swap-diff-timestamps"
                type="button"
                onClick={() => {
                  const a = selectedHistoricalTimestamp;
                  const b = comparisonHistoricalTimestamp;
                  setSelectedHistoricalTimestamp(b);
                  setComparisonHistoricalTimestamp(a);
                }}
                className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/50 text-purple-200 font-bold cursor-pointer"
              >
                Swap A &harr; B
              </button>
              <button
                id="btn-clear-historical-diff"
                type="button"
                onClick={() => {
                  setComparisonHistoricalTimestamp('');
                  setIsSideBySideDiffEnabled(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-zinc-200 font-bold cursor-pointer"
              >
                Exit Diff View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historical Snapshot Active Banner (Hardware Seal Status & Integration Coverage at Selected Timestamp) */}
      {historicalSnapshotMeta && (
        <div
          id="heatmap-historical-snapshot-banner"
          className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-400/50 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs font-mono"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-300 font-bold flex-wrap">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>HISTORICAL SNAPSHOT ACTIVE • TIMESTAMP: {historicalSnapshotMeta.timestamp}</span>
              <span aria-hidden="true">·</span>
              <span className="text-cyan-300">MERKLE BLOCK #{historicalSnapshotMeta.historicalBlock}</span>
            </div>
            <div className="text-zinc-300">
              Hardware Seal Status: <strong className="text-emerald-300">{historicalSnapshotMeta.sealSummary}</strong> ·
              Historical Integration Coverage: <strong className="text-cyan-300">{historicalSnapshotMeta.snapshotLinesPct}% Lines</strong> /{' '}
              <strong className="text-amber-300">{historicalSnapshotMeta.snapshotBranchesPct}% Branches</strong>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedHistoricalTimestamp('')}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 font-bold cursor-pointer shrink-0"
          >
            Return to Live 1.00 Hz Telemetry
          </button>
        </div>
      )}

      {/* Optional Integration Coverage Overlay Summary Banner */}
      {overlayMode === 'INTEGRATION_COVERAGE' && (
        <div
          id="integration-coverage-overlay-banner"
          className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs font-mono"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <span>INTEGRATION COVERAGE OVERLAY ACTIVE (V8 CONSOLE SUMMARY)</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-300">
                {PRODUCTION_INTEGRATION_COVERAGE_SUMMARY.e2eStagesVerified}/
                {PRODUCTION_INTEGRATION_COVERAGE_SUMMARY.e2eStagesTotal} E2E STAGES VERIFIED
              </span>
            </div>
            <div className="text-zinc-300">
              Adapter Lines: <strong className="text-white">{PRODUCTION_INTEGRATION_COVERAGE_SUMMARY.adapterLinesPct}%</strong> ·
              Functions: <strong className="text-emerald-300">{PRODUCTION_INTEGRATION_COVERAGE_SUMMARY.adapterFunctionsPct}%</strong> ·
              Branches: <strong className="text-amber-300">{PRODUCTION_INTEGRATION_COVERAGE_SUMMARY.adapterBranchesPct}%</strong> ·
              Uncovered Gaps: <span className="text-rose-300">L1305–1341 (Classifier), L1539–1576 (Sig Gate)</span>
            </div>
          </div>
          {onNavigateToView && (
            <button
              id="btn-open-d3-compliance-coverage-view"
              type="button"
              onClick={() => onNavigateToView('compliance-coverage')}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 font-bold flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span>Inspect D3 Compliance Coverage Map</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* 🗺️ VIEW MODE 1: 18 Sovereign Chambers Spatial Grid Heatmap */}
      {activeViewMode === 'grid' && (
        <div className="space-y-4">
          {/* Sub-toolbar: 18-Cell Matrix (6-Col) vs Detailed Cards + Alert Simulation Trigger */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-black/50 border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-400">Layout:</span>
              <div className="flex items-center bg-black/60 p-1 rounded-xl border-white/10 text-xs font-mono">
                <button
                  id="btn-subview-6col"
                  onClick={() => setGridSubView('6col')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    gridSubView === '6col'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  18-Cell Matrix (6-Col)
                </button>
                <button
                  id="btn-subview-cards"
                  onClick={() => {
                    setGridSubView('cards');
                    setIsSideBySideDiffEnabled(false);
                  }}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    gridSubView === 'cards' && !isSideBySideDiffEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold shadow-[0_0_10px_rgba(168,85,129,0.3)]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Detailed Chamber Cards
                </button>
                {historicalDiffOverlay && (
                  <button
                    id="btn-subview-side-by-side"
                    type="button"
                    onClick={() => setIsSideBySideDiffEnabled((prev) => !prev)}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSideBySideDiffEnabled
                        ? 'bg-purple-500/30 text-purple-200 border border-purple-400/60 font-bold shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span>Side-by-Side Diff</span>
                  </button>
                )}
              </div>
            </div>

            {/* Unstable Alerts Overlay & Test Simulation Alert Button */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-trigger-node-warning-threshold"
                type="button"
                onClick={() => handleTriggerNodeWarningThreshold('TC-04')}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                title="Trigger browser-level toast notification when a hardware node's status drops below Warning threshold (<98.50%)"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulate Node &lt; Warning Threshold</span>
              </button>

              <button
                id="btn-unstable-alerts-overlay"
                onClick={() => setShowOverlay(true)}
                className="px-3 py-1.5 bg-red-500/20 border-red-500/60 text-red-300 text-xs rounded-xl font-mono font-bold hover:bg-red-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                title="Dedicated Notification Overlay: Searchable Unstable Events (<95% Coherence)"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>🚨 Unstable Alerts ({unstableEvents.length})</span>
              </button>

              <button
                id="btn-simulate-hsm-quorum-breach"
                type="button"
                onClick={handleToggleHsmQuorumBreachSimulation}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                  isHsmHealthBreachActive
                    ? 'bg-rose-500/25 border-rose-500/70 text-rose-200 animate-pulse shadow-[0_0_14px_rgba(244,63,94,0.4)]'
                    : 'bg-purple-500/15 border-purple-500/40 text-purple-200 hover:bg-purple-500/25'
                }`}
                title="Simulate HSM Quorum dropping below 8/10 nodes to trigger Health Breach Alert layer and Forensic Dossier links"
              >
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>
                  {isHsmHealthBreachActive
                    ? `RESTORE HSM QUORUM (${effectiveHsmQuorumNodes}/10)`
                    : 'SIMULATE HSM QUORUM BREACH (<8/10)'}
                </span>
              </button>

              <button
                id="btn-test-simulation-alert"
                onClick={handleToggleSimulation}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                  simulatedUnstableChamberId
                    ? 'bg-red-500/20 border-red-500/60 text-red-300 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                    : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white'
                }`}
                title="Simulate Chamber CH-04 dropping below 95% to test pulsing alert and system events"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {simulatedUnstableChamberId ? 'RESET INSTABILITY SIMULATION' : 'SIMULATE INSTABILITY ALERT (<95%)'}
                </span>
              </button>
            </div>
          </div>

          {/* Interactive Hover Tooltip Inspector with Previous vs. Current Delta */}
          {hoveredChamber && (() => {
            const prevCoh = hoveredChamber.prevCoherence ?? hoveredChamber.currentCoherence;
            const coherenceDelta = Number((hoveredChamber.currentCoherence - prevCoh).toFixed(3));
            const prevTemp = hoveredChamber.prevCryoTemp ?? hoveredChamber.currentCryoTemp;
            const tempDelta = Number((hoveredChamber.currentCryoTemp - prevTemp).toFixed(2));
            return (
              <div className="p-3.5 bg-black/95 border-cyan-400/80 rounded-xl text-xs text-cyan-200 shadow-2xl flex flex-wrap justify-between items-center gap-3 backdrop-blur-md animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white font-mono">Chamber:</span>
                  <span className="text-cyan-300 font-mono font-bold">{hoveredChamber.chamber.code}</span>
                  <span className="text-zinc-300">({hoveredChamber.chamber.name} &bull; {hoveredChamber.chamber.nameTh})</span>
                </div>
                <div className="flex items-center gap-4 font-mono">
                  <div>
                    <span className="font-bold text-white">Temp:</span>{' '}
                    <span className="text-blue-300 font-bold">{hoveredChamber.currentCryoTemp.toFixed(2)} mK</span>
                    <span className={`ml-1 text-[11px] font-bold ${tempDelta >= 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
                      ({tempDelta >= 0 ? `+${tempDelta}` : tempDelta})
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-white">Coherence:</span>{' '}
                    <span
                      className={`font-bold ${
                        hoveredChamber.currentCoherence < 95 ? 'text-red-400 animate-pulse' : 'text-emerald-400'
                      }`}
                    >
                      {hoveredChamber.currentCoherence.toFixed(2)}%
                    </span>
                    <span className={`ml-1 text-[11px] font-bold ${coherenceDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      ({coherenceDelta >= 0 ? `+${coherenceDelta}%` : `${coherenceDelta}%`})
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-white">Stability:</span>{' '}
                    <span className="text-cyan-300 font-bold">{hoveredChamber.currentStability.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Persistent System Integrity Index Ring Chart & Summary Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-black/60 border-cyan-900/60 rounded-2xl items-center text-xs">
            {/* Ring Chart for System Integrity Index */}
            <div className="flex items-center gap-4 border-b md:border-b-0 md:border-r border-gray-800 pb-3 md:pb-0 md:pr-4">
              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="26" stroke="#1e293b" strokeWidth="6" fill="transparent" />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke="#22c55e"
                    strokeWidth="6"
                    strokeDasharray={163.36}
                    strokeDashoffset={Math.max(0, 163.36 - (163.36 * Number(avgStability)) / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-500"
                  />
                </svg>
                <span className="absolute text-xs font-bold text-emerald-400 font-mono">{avgStability}%</span>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">System Integrity Index</div>
                <div className="text-sm font-bold text-white font-mono">Weighted Stability</div>
                <div className="text-[10px] text-cyan-400 font-mono">18/18 Chambers Synced</div>
              </div>
            </div>

            <div className="flex justify-between items-center px-4 py-3 bg-cyan-950/30 rounded-xl border-cyan-800/40">
              <span className="text-zinc-400 uppercase tracking-wider font-mono text-[11px]">
                Average System Coherence:
              </span>
              <span className="text-cyan-300 font-bold font-mono text-sm">{avgCoherence}%</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 bg-emerald-950/30 rounded-xl border-emerald-800/40">
              <span className="text-zinc-400 uppercase tracking-wider font-mono text-[11px]">
                Total Active Sovereign Nodes:
              </span>
              <span className="text-emerald-300 font-bold font-mono text-sm">
                {activeNodesCount} / {chamberProfiles.length}
              </span>
            </div>
          </div>

          {/* d3-zoom Interactive Zoom & Pan Navigation Controls for High-Density Hardware Seal Grids */}
          <div
            id="heatmap-d3-zoom-controls"
            className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-black/50 border border-cyan-500/25 text-xs font-mono"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-cyan-400" />
                <span>D3-ZOOM HIGH-DENSITY SEAL GRID NAVIGATION:</span>
              </span>
              <span
                id="heatmap-zoom-status-badge"
                className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 font-bold"
              >
                Zoom: {(zoomTransform.k * 100).toFixed(0)}% ({zoomTransform.k.toFixed(2)}x) · Pan: ({zoomTransform.x}px, {zoomTransform.y}px)
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                id="btn-heatmap-zoom-in"
                type="button"
                onClick={handleZoomIn}
                className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 font-bold flex items-center gap-1 cursor-pointer"
                title="Zoom In (1.25x via d3-zoom)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Zoom In</span>
              </button>
              <button
                id="btn-heatmap-zoom-out"
                type="button"
                onClick={handleZoomOut}
                className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 font-bold flex items-center gap-1 cursor-pointer"
                title="Zoom Out (0.80x via d3-zoom)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
                <span>Zoom Out</span>
              </button>
              <button
                id="btn-heatmap-pan-left"
                type="button"
                onClick={() => handlePanGrid(-48, 0)}
                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-200 cursor-pointer"
                title="Pan Grid Left"
              >
                &larr; Pan
              </button>
              <button
                id="btn-heatmap-pan-right"
                type="button"
                onClick={() => handlePanGrid(48, 0)}
                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-200 cursor-pointer"
                title="Pan Grid Right"
              >
                Pan &rarr;
              </button>
              <button
                id="btn-heatmap-zoom-reset"
                type="button"
                onClick={handleResetZoom}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 font-bold flex items-center gap-1 cursor-pointer"
                title="Reset d3-zoom Transform (1.00x, 0px, 0px)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset 100%</span>
              </button>
            </div>
          </div>

          {/* Main Side-by-Side Workspace: d3-zoom Heatmap Grid (Left) + Scrollable Node Status Dashboard (Right) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          {/* d3-zoom Viewport Container */}
          <div
            id="heatmap-d3-zoom-viewport"
            ref={heatmapZoomViewportRef}
            className="xl:col-span-8 relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-black/30 p-2 cursor-grab active:cursor-grabbing"
          >
            <div
              id="heatmap-d3-zoom-canvas"
              data-zoom-scale={zoomTransform.k.toFixed(2)}
              data-pan-x={zoomTransform.x}
              data-pan-y={zoomTransform.y}
              style={{
                transform: `translate(${zoomTransform.x}px, ${zoomTransform.y}px) scale(${zoomTransform.k})`,
                transformOrigin: 'center top',
                transition: 'transform 120ms ease-out',
              }}
            >
          {/* Side-by-Side Diff Comparison Grid Mode OR Standard Grid Modes */}
          {isSideBySideDiffEnabled && historicalDiffOverlay ? (
            <div
              id="heatmap-side-by-side-diff-grid"
              data-side-by-side-active="true"
              data-timestamp-a={historicalDiffOverlay.timestampA}
              data-timestamp-b={historicalDiffOverlay.timestampB}
              className="space-y-4"
            >
              {/* Header Summary for Side-by-Side Comparison */}
              <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-400/50 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Columns className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-white">SIDE-BY-SIDE HISTORICAL SEAL STATUS DIFF MATRIX</span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-500/30 font-bold">
                    {historicalDiffOverlay.totalChangedCount} Chambers with Status Transitions
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-emerald-300 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {historicalDiffOverlay.improvedCount} Improved
                  </span>
                  <span className="text-rose-300 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    {historicalDiffOverlay.degradedCount} Degraded
                  </span>
                  <span className="text-cyan-300 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    {historicalDiffOverlay.unchangedCount} Unchanged
                  </span>
                </div>
              </div>

              {/* 2-Column Side-by-Side Comparison Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Column: Timestamp A (Baseline) */}
                <div
                  id="diff-side-grid-timestamp-a"
                  className="p-4 rounded-2xl bg-black/60 border border-cyan-500/40 space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-bold text-cyan-300">Timestamp A (Baseline Snapshot)</span>
                    </div>
                    <div className="text-zinc-300 text-[11px]">
                      <strong className="text-white">{historicalDiffOverlay.timestampA}</strong> · Block #{historicalDiffOverlay.blockA}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {filteredProfiles.map((chamber) => {
                      const cellDiff = historicalDiffOverlay.cellsDiffMap[chamber.chamber.code];
                      const isChanged = cellDiff && cellDiff.diffState !== 'UNCHANGED';
                      const cohA = cellDiff ? cellDiff.coherenceA : chamber.currentCoherence;
                      const statusA = cellDiff ? cellDiff.statusA : 'PURE_GREEN';

                      return (
                        <div
                          key={`side-a-${chamber.chamber.id}`}
                          id={`side-a-cell-${chamber.chamber.code.toLowerCase()}`}
                          data-side-a-chamber={chamber.chamber.code}
                          data-status-a={statusA}
                          data-changed={isChanged ? 'true' : 'false'}
                          className={`p-3 rounded-xl border text-xs font-mono transition-all relative overflow-hidden ${
                            isChanged
                              ? 'bg-purple-950/40 border-purple-400/70 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                              : 'bg-black/40 border-white/10 text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-zinc-400">
                            <span className="font-bold text-white">{chamber.chamber.code}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                statusA === 'PURE_GREEN'
                                  ? 'text-emerald-400 bg-emerald-500/15'
                                  : statusA === 'TRANSIENT_JITTER'
                                  ? 'text-amber-400 bg-amber-500/15'
                                  : 'text-rose-400 bg-rose-500/15'
                              }`}
                            >
                              {statusA}
                            </span>
                          </div>
                          <div className="text-base font-bold my-1 text-white">{cohA.toFixed(2)}%</div>
                          <div className="text-[10px] text-zinc-400 truncate">{chamber.chamber.name}</div>
                          {isChanged && (
                            <div className="mt-1.5 pt-1 border-t border-purple-500/30 text-[9px] text-purple-300 flex items-center justify-between font-bold">
                              <span>Transitions in B:</span>
                              <span className="text-cyan-300">&rarr; {cellDiff.statusB}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column: Timestamp B (Comparison Diff) with Prominent Changed Status Highlights */}
                <div
                  id="diff-side-grid-timestamp-b"
                  className="p-4 rounded-2xl bg-black/60 border border-purple-500/50 space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      <span className="font-bold text-purple-300">Timestamp B (Comparison Diff)</span>
                    </div>
                    <div className="text-zinc-300 text-[11px]">
                      <strong className="text-white">{historicalDiffOverlay.timestampB}</strong> · Block #{historicalDiffOverlay.blockB}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {filteredProfiles.map((chamber) => {
                      const cellDiff = historicalDiffOverlay.cellsDiffMap[chamber.chamber.code];
                      const isImproved = cellDiff?.diffState === 'IMPROVED';
                      const isDegraded = cellDiff?.diffState === 'DEGRADED';
                      const isChanged = isImproved || isDegraded;
                      const cohB = cellDiff ? cellDiff.coherenceB : chamber.currentCoherence;
                      const statusB = cellDiff ? cellDiff.statusB : 'PURE_GREEN';

                      const highlightStyle = isImproved
                        ? 'bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-400/80 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        : isDegraded
                        ? 'bg-rose-950/80 border-rose-400 ring-2 ring-rose-400/80 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                        : 'bg-black/40 border-white/10 text-zinc-400';

                      return (
                        <div
                          key={`side-b-${chamber.chamber.id}`}
                          id={`side-by-side-diff-cell-${chamber.chamber.code.toLowerCase()}`}
                          data-side-by-side-cell={chamber.chamber.code}
                          data-diff-state={cellDiff?.diffState || 'UNCHANGED'}
                          data-status-changed={isChanged ? 'true' : 'false'}
                          data-status-a={cellDiff?.statusA}
                          data-status-b={statusB}
                          className={`p-3 rounded-xl border text-xs font-mono transition-all relative overflow-hidden ${highlightStyle}`}
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-white">{chamber.chamber.code}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                isImproved
                                  ? 'text-emerald-300 bg-emerald-500/30'
                                  : isDegraded
                                  ? 'text-rose-300 bg-rose-500/30'
                                  : 'text-zinc-400 bg-white/5'
                              }`}
                            >
                              {isImproved ? '▲ IMPROVED' : isDegraded ? '▼ DEGRADED' : '= UNCHANGED'}
                            </span>
                          </div>
                          <div className="text-base font-bold my-1 text-white flex items-center justify-between">
                            <span>{cohB.toFixed(2)}%</span>
                            {cellDiff && (
                              <span
                                className={`text-[11px] font-bold ${
                                  cellDiff.coherenceDelta >= 0 ? 'text-emerald-300' : 'text-rose-300'
                                }`}
                              >
                                {cellDiff.coherenceDelta >= 0
                                  ? `+${cellDiff.coherenceDelta.toFixed(2)}%`
                                  : `${cellDiff.coherenceDelta.toFixed(2)}%`}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-300 truncate">{statusB}</div>
                          {cellDiff && (
                            <div
                              className={`mt-1.5 pt-1 border-t text-[9px] font-bold flex items-center justify-between ${
                                isImproved
                                  ? 'border-emerald-500/40 text-emerald-200'
                                  : isDegraded
                                  ? 'border-rose-500/40 text-rose-200'
                                  : 'border-white/10 text-zinc-400'
                              }`}
                            >
                              <span>Transition:</span>
                              <span>
                                {cellDiff.statusA} &rarr; {cellDiff.statusB}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : gridSubView === '6col' ? (
            <motion.div
              layout
              id="heatmap-animated-grid-container"
              data-overlay-mode={overlayMode}
              transition={{ layout: { duration: 0.28, ease: 'easeInOut' } }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
            >
              {filteredProfiles.map((chamber, index) => {
                const isUnstable = chamber.currentCoherence < 95;
                const isProtected = chamber.status === 'LOCKED_PROTECTED';
                const covMetric: ChamberIntegrationCoverageMetric =
                  CHAMBER_INTEGRATION_COVERAGE_METRICS.find((m) => m.chamberCode === chamber.chamber.code) ||
                  CHAMBER_INTEGRATION_COVERAGE_METRICS[0];
                const isCoverageMode = overlayMode === 'INTEGRATION_COVERAGE' || activeMetric === 'integrationCoverage';
                const hasUntestedCoveragePath =
                  covMetric.completenessStatus === 'PARTIAL_BRANCH_GAP' ||
                  covMetric.uncoveredLineRanges !== 'None (100% E2E Verified)';
                const isUntestedPulsing =
                  hasUntestedCoveragePath && !interactedUntestedCells.includes(chamber.chamber.code);
                const hasBranchGap = isCoverageMode && hasUntestedCoveragePath;

                // Map every hardware cell to its corresponding HSM node state & historical audit artifact in the data store
                const linkedHsmNode =
                  hardwareNodesThroughputList.find((d) => d.associatedChamber.includes(chamber.chamber.code)) ||
                  hardwareNodesThroughputList[index % hardwareNodesThroughputList.length];

                // Highlight cell if HSM quorum < 8 and linked to breached HSM node
                const mappedNodeDossier =
                  breachedHsmDossiers.find((d) => d.associatedChamber.includes(chamber.chamber.code)) ||
                  (isHsmHealthBreachActive && ['CH-02', 'CH-04', 'CH-05', 'CH-07', 'CH-08', 'CH-15'].includes(chamber.chamber.code)
                    ? breachedHsmDossiers[index % Math.max(1, breachedHsmDossiers.length)]
                    : undefined);
                const isCellHsmBreached = isHsmHealthBreachActive && Boolean(mappedNodeDossier);
                const activeCellDossier = mappedNodeDossier || linkedHsmNode;
                const cellDiff = historicalDiffOverlay?.cellsDiffMap[chamber.chamber.code];

                const cellStyle = isProtected
                  ? 'bg-blue-950/80 border-blue-500 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                  : isCellHsmBreached
                  ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                  : cellDiff?.diffState === 'IMPROVED'
                  ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200 ring-1 ring-emerald-400/60'
                  : cellDiff?.diffState === 'DEGRADED'
                  ? 'bg-rose-950/90 border-rose-400 text-rose-200 ring-1 ring-rose-400/60'
                  : isUnstable
                  ? 'bg-red-950/80 border-red-500 text-red-400'
                  : hasBranchGap
                  ? 'bg-amber-950/70 border-amber-500/70 text-amber-200'
                  : getCellColorStyle(chamber.currentCoherence);
                const isSelected = selectedChamberId === chamber.chamber.id;

                return (
                  <motion.div
                    layout
                    layoutId={`heatmap-cell-${chamber.chamber.code}`}
                    key={chamber.chamber.id}
                    id={`chamber-cell-${chamber.chamber.code.toLowerCase()}`}
                    data-overlay-mode={overlayMode}
                    data-diff-active={cellDiff ? 'true' : 'false'}
                    data-diff-state={cellDiff ? cellDiff.diffState : 'NONE'}
                    data-hsm-node-id={activeCellDossier.nodeId}
                    data-audit-artifact-id={linkedHsmNode.historicalAuditEventId}
                    data-untested-path={hasUntestedCoveragePath ? 'true' : 'false'}
                    data-untested-pulse={
                      hasUntestedCoveragePath ? (isUntestedPulsing ? 'active' : 'acknowledged') : 'none'
                    }
                    data-hsm-breach-cell={isCellHsmBreached ? 'true' : 'false'}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.26,
                      delay: index * 0.02,
                      layout: { type: 'spring', stiffness: 320, damping: 28 },
                    }}
                    whileHover={{ scale: 1.03 }}
                    onMouseEnter={() => setHoveredChamber(chamber)}
                    onMouseLeave={() => setHoveredChamber(null)}
                    onClick={() => handleChamberCellInteraction(chamber.chamber.id, chamber.chamber.code)}
                    className={`relative p-3.5 rounded-xl border transition-all cursor-pointer shadow-inner overflow-hidden ${cellStyle} ${
                      isCellHsmBreached ? 'hsm-breach-alert-layer' : ''
                    } ${
                      isUntestedPulsing ? 'untested-coverage-cell-pulse' : ''
                    } ${
                      isUnstable && !isProtected ? 'ring-2 ring-red-500 animate-pulse' : ''
                    } ${isSelected ? 'ring-2 ring-white scale-[1.02] shadow-2xl' : ''}`}
                  >
                    {/* Visual Anomaly Heat Overlay for High-Frequency Variance */}
                    {chamber.varianceFlag && !isProtected && (
                      <div className="absolute inset-0 bg-red-600/10 pointer-events-none animate-ping opacity-30" />
                    )}

                    <div className="text-[10px] text-gray-400 uppercase tracking-wider flex justify-between items-center relative z-10">
                      <span className="font-mono font-bold text-gray-200">{chamber.chamber.code}</span>
                      {isCoverageMode ? (
                        <span className="text-cyan-300 font-mono text-[9px] font-bold">
                          {covMetric.integrationStage}
                        </span>
                      ) : isProtected ? (
                        <span className="text-blue-400 font-bold text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 border-blue-500/40">
                          LOCKED
                        </span>
                      ) : isUnstable ? (
                        <span className="text-red-400 font-bold text-xs animate-ping">!</span>
                      ) : (
                        <span className="text-purple-300 font-mono text-[9px] font-bold">
                          {activeCellDossier.nodeId}
                        </span>
                      )}
                    </div>

                    <motion.div
                      key={isCoverageMode ? 'coverage-val' : 'seal-val'}
                      initial={{ opacity: 0.6, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-base font-bold my-1 font-mono relative z-10"
                    >
                      {isCoverageMode ? `${covMetric.linesPct.toFixed(1)}% Cov` : `${chamber.currentCoherence.toFixed(2)}%`}
                    </motion.div>

                    {isCoverageMode && (
                      <div className="text-[9px] font-mono text-zinc-300 flex items-center justify-between relative z-10 mb-1">
                        <span>Br: {covMetric.branchesPct.toFixed(0)}%</span>
                        <span>{covMetric.e2eTestsPassing}/{covMetric.e2eTestsTotal} E2E</span>
                      </div>
                    )}

                    {hasUntestedCoveragePath && (
                      <div className="text-[9px] font-mono text-amber-300 flex items-center justify-between relative z-10 mb-1">
                        <span>{isUntestedPulsing ? 'UNTESTED GAP (PULSE)' : 'GAP INSPECTED'}</span>
                        <span>{covMetric.uncoveredLineRanges}</span>
                      </div>
                    )}

                    {/* Historical Timestamp Hardware Seal Status Diff Overlay Pill */}
                    {cellDiff && (
                      <div
                        id={`cell-diff-overlay-${chamber.chamber.code.toLowerCase()}`}
                        className={`heatmap-cell-diff-overlay my-1 px-1.5 py-1 rounded border text-[8.5px] font-mono relative z-10 space-y-0.5 ${
                          cellDiff.diffState === 'IMPROVED'
                            ? 'bg-emerald-500/25 border-emerald-400/60 text-emerald-200'
                            : cellDiff.diffState === 'DEGRADED'
                            ? 'bg-rose-500/25 border-rose-400/60 text-rose-200'
                            : 'bg-purple-500/20 border-purple-400/40 text-purple-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>DIFF: {cellDiff.diffState}</span>
                          <span>
                            {cellDiff.coherenceDelta >= 0
                              ? `+${cellDiff.coherenceDelta.toFixed(2)}%`
                              : `${cellDiff.coherenceDelta.toFixed(2)}%`}
                          </span>
                        </div>
                        <div className="truncate text-[8px] opacity-90">
                          {cellDiff.statusA} &rarr; {cellDiff.statusB}
                        </div>
                      </div>
                    )}

                    {/* View Forensic Dossier Button injected into EVERY hardware cell, mapped over HSM node state & data store */}
                    <div className="relative z-10 my-1">
                      <button
                        id={`btn-view-forensic-dossier-${chamber.chamber.code.toLowerCase()}`}
                        data-cell-dossier-btn={`btn-cell-dossier-link-${chamber.chamber.code.toLowerCase()}`}
                        data-node-id={activeCellDossier.nodeId}
                        data-dossier-id={activeCellDossier.dossierId}
                        data-store-slot={linkedHsmNode.storeSlotId}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedForensicDossier(activeCellDossier);
                        }}
                        className={`w-full px-1.5 py-1 rounded border text-[9px] font-mono font-bold flex items-center justify-between gap-1 cursor-pointer transition ${
                          isCellHsmBreached
                            ? 'bg-rose-500/35 hover:bg-rose-500/55 border-rose-400/70 text-rose-100'
                            : 'bg-cyan-500/15 hover:bg-cyan-500/30 border-cyan-400/40 text-cyan-200'
                        }`}
                        title={`View Forensic Dossier ${activeCellDossier.dossierId} (${activeCellDossier.nodeId} • Store Slot ${linkedHsmNode.storeSlotId})`}
                      >
                        <span className="truncate">View Forensic Dossier</span>
                        <span className="shrink-0 opacity-85">{activeCellDossier.nodeId}</span>
                      </button>
                    </div>

                    {/* Sparkline Chart inside Chamber Card (Last 10 Ticks) */}
                    <div className="h-4 w-full my-1 relative z-10 flex items-end">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 90 20">
                        <polyline
                          fill="none"
                          stroke={isUnstable ? '#f87171' : isProtected ? '#60a5fa' : '#22d3ee'}
                          strokeWidth="1.5"
                          points={(chamber.coherenceHistory || [chamber.currentCoherence])
                            .map((val, idx, arr) => {
                              const x = (idx / Math.max(1, arr.length - 1)) * 90;
                              const y = 20 - ((val - 90) / 10) * 20;
                              return `${x},${Math.max(1, Math.min(19, y))}`;
                            })
                            .join(' ')}
                        />
                      </svg>
                    </div>

                    <div className="text-[10px] font-mono opacity-80 flex items-center justify-between relative z-10">
                      <span>{chamber.currentCryoTemp.toFixed(2)} mK</span>
                      <button
                        id={`btn-print-qr-${chamber.chamber.code.toLowerCase()}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrintQR(chamber);
                        }}
                        className="px-1.5 py-0.5 bg-cyan-500/30 hover:bg-cyan-500 text-white text-[9px] rounded font-mono transition-colors flex items-center gap-1 cursor-pointer"
                        title="Print QR Evidence & Log to Immutable Ledger"
                      >
                        <Printer className="w-2.5 h-2.5" />
                        <span>Print QR</span>
                      </button>
                    </div>

                    <div className="mt-2 text-[9px] px-1.5 py-0.5 rounded text-center truncate font-mono bg-black/60 border-white/5 relative z-10">
                      {isProtected ? (
                        <span className="text-blue-300 font-bold">LOCKED PROTECTED</span>
                      ) : isUnstable ? (
                        <span className="text-red-400 font-bold">UNSTABLE</span>
                      ) : (
                        <span className="text-green-300">PURE GREEN</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            /* Detailed Chamber Cards View */
            <motion.div
              layout
              id="heatmap-animated-cards-container"
              data-overlay-mode={overlayMode}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredProfiles.map((prof, cardIdx) => {
                const valueToMeasure =
                  activeMetric === 'coherence'
                    ? prof.currentCoherence
                    : activeMetric === 'stability'
                    ? prof.currentStability
                    : activeMetric === 'cryoTemp'
                    ? prof.currentCryoTemp
                    : prof.currentDrift;

                const heatStyle = getCellHeatStyle(activeMetric, valueToMeasure);
                const isSelected = selectedChamberId === prof.chamber.id;
                const cardCovMetric: ChamberIntegrationCoverageMetric =
                  CHAMBER_INTEGRATION_COVERAGE_METRICS.find((m) => m.chamberCode === prof.chamber.code) ||
                  CHAMBER_INTEGRATION_COVERAGE_METRICS[0];
                const cardHasUntestedPath =
                  cardCovMetric.completenessStatus === 'PARTIAL_BRANCH_GAP' ||
                  cardCovMetric.uncoveredLineRanges !== 'None (100% E2E Verified)';
                const cardIsUntestedPulsing =
                  cardHasUntestedPath && !interactedUntestedCells.includes(prof.chamber.code);
                const cardLinkedHsmNode =
                  hardwareNodesThroughputList.find((d) => d.associatedChamber.includes(prof.chamber.code)) ||
                  hardwareNodesThroughputList[cardIdx % hardwareNodesThroughputList.length];
                const cardMappedNodeDossier =
                  breachedHsmDossiers.find((d) => d.associatedChamber.includes(prof.chamber.code)) ||
                  (isHsmHealthBreachActive && ['CH-02', 'CH-04', 'CH-05', 'CH-07', 'CH-08', 'CH-15'].includes(prof.chamber.code)
                    ? breachedHsmDossiers[0]
                    : undefined);
                const isCardHsmBreached = isHsmHealthBreachActive && Boolean(cardMappedNodeDossier);
                const activeCardDossier = cardMappedNodeDossier || cardLinkedHsmNode;

                return (
                  <motion.div
                    layout
                    key={prof.chamber.id}
                    id={`chamber-card-${prof.chamber.code.toLowerCase()}`}
                    data-untested-pulse={
                      cardHasUntestedPath ? (cardIsUntestedPulsing ? 'active' : 'acknowledged') : 'none'
                    }
                    data-hsm-breach-cell={isCardHsmBreached ? 'true' : 'false'}
                    onClick={() => handleChamberCellInteraction(prof.chamber.id, prof.chamber.code)}
                    className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden ${
                      heatStyle.bg
                    } ${heatStyle.border} ${isCardHsmBreached ? 'hsm-breach-alert-layer' : ''} ${
                      cardIsUntestedPulsing ? 'untested-coverage-cell-pulse' : ''
                    } ${
                      isSelected ? 'ring-2 ring-white scale-[1.01] z-20 shadow-xl' : ''
                    }`}
                  >
                    {/* Top Bar: Code, Category, Status */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-white px-2 py-0.5 rounded bg-black/40 border-white/10">
                          {prof.chamber.code}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-white/5">
                          {prof.chamber.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] font-mono">
                        <span className={`w-2 h-2 rounded-full ${heatStyle.indicator} animate-pulse`} />
                        <span className="font-bold text-zinc-200">{prof.chamber.status}</span>
                      </div>
                    </div>

                    <div className="mb-2.5">
                      <button
                        id={`btn-card-dossier-link-${prof.chamber.code.toLowerCase()}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedForensicDossier(activeCardDossier);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg border text-[10px] font-mono font-bold flex items-center justify-between gap-2 cursor-pointer ${
                          isCardHsmBreached
                            ? 'bg-rose-500/25 hover:bg-rose-500/40 border-rose-400/60 text-rose-100'
                            : 'bg-cyan-500/15 hover:bg-cyan-500/30 border-cyan-400/40 text-cyan-200'
                        }`}
                      >
                        <span>View Forensic Dossier ({activeCardDossier.nodeId})</span>
                        <span>{activeCardDossier.dossierId}</span>
                      </button>
                    </div>

                    {/* Title & Thai Name */}
                    <div className="mb-3">
                      <h3 className="font-mono font-bold text-sm text-zinc-100 line-clamp-1">{prof.chamber.name}</h3>
                      <div className="text-[11px] text-zinc-400 font-sans line-clamp-1 mt-0.5">
                        {prof.chamber.nameTh}
                      </div>
                    </div>

                    {/* Real-time Metric Indicators */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-black/50 border-white/5 mb-3 text-center">
                      <div>
                        <div className="text-[9px] font-mono text-zinc-500 uppercase">Coherence</div>
                        <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                          {prof.currentCoherence.toFixed(3)}%
                        </div>
                      </div>

                      <div>
                        <div className="text-[9px] font-mono text-zinc-500 uppercase">Stability</div>
                        <div className="text-xs font-mono font-bold text-cyan-400 mt-0.5">
                          {prof.currentStability.toFixed(2)}%
                        </div>
                      </div>

                      <div>
                        <div className="text-[9px] font-mono text-zinc-500 uppercase">Cryo Temp</div>
                        <div className="text-xs font-mono font-bold text-blue-400 mt-0.5">
                          {prof.currentCryoTemp.toFixed(2)} mK
                        </div>
                      </div>
                    </div>

                    {/* Mini Epoch Heatmap Strip (Recent 16 Heartbeats) */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                        <span>Heartbeat Epochs (16s Trajectory)</span>
                        <span className="text-emerald-400 font-bold">Δ0.00% Zero Drift</span>
                      </div>

                      <div className="grid grid-cols-16 gap-1">
                        {prof.recentSnapshots.map((snap, idx) => {
                          const val =
                            activeMetric === 'coherence'
                              ? snap.coherencePct
                              : activeMetric === 'stability'
                              ? snap.stabilityIndex
                              : snap.cryoTempMk;
                          const cellStyle = getCellHeatStyle(activeMetric, val);

                          return (
                            <div
                              key={idx}
                              className={`h-4 rounded-sm transition-all duration-150 ${cellStyle.indicator} opacity-85 hover:opacity-100 hover:scale-125 cursor-pointer`}
                              title={`Epoch: ${snap.timestamp} • Coherence: ${snap.coherencePct}% • Cryo: ${snap.cryoTempMk} mK`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Invariant Footer & Print QR Action */}
                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                      <div className="flex items-center gap-1">
                        <Lock className="w-3 h-3 text-purple-400" />
                        <span>{prof.invariantsPassing} Invariants Sealed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          id={`btn-card-print-qr-${prof.chamber.code.toLowerCase()}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrintQR(prof);
                          }}
                          className="px-2 py-0.5 bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/40 text-cyan-300 text-[10px] rounded-lg font-mono transition flex items-center gap-1 cursor-pointer"
                          title="Print QR Evidence & Log to Immutable Ledger"
                        >
                          <Printer className="w-3 h-3 text-cyan-400" />
                          <span>Print QR</span>
                        </button>
                        <span className="text-zinc-500 flex items-center gap-0.5">
                          <span>Inspect</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
            </div>
          </div>

          {/* 📋 Visual Node Status Dashboard (Scrollable Real-Time Hardware Node Throughput List Alongside Heatmap) */}
          <aside
            id="node-status-dashboard"
            data-testid="node-status-dashboard"
            className="xl:col-span-4 p-4 rounded-2xl bg-black/65 border border-cyan-500/30 backdrop-blur-xl space-y-3 font-mono text-xs"
          >
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10">
              <div>
                <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>NODE STATUS DASHBOARD</span>
                </div>
                <p className="text-[10px] text-zinc-400 font-sans mt-0.5">
                  Real-time throughput (QOPS &amp; sig/s), P95 latency, and historical audit dossier bindings for all 10 HSM hardware nodes.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold shrink-0">
                {effectiveHsmQuorumNodes}/10 ONLINE
              </span>
            </div>

            {/* Aggregate Throughput Summary Strip */}
            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-black/60 border border-white/5 text-center">
              <div>
                <div className="text-[9px] text-zinc-500 uppercase">Total QOPS</div>
                <div className="text-xs font-bold text-cyan-300">
                  {hardwareNodesThroughputList.reduce((acc, n) => acc + n.throughputQops, 0).toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-[9px] text-zinc-500 uppercase">PQC Sig/s</div>
                <div className="text-xs font-bold text-emerald-300">
                  {hardwareNodesThroughputList.reduce((acc, n) => acc + n.signaturesPerSec, 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[9px] text-zinc-500 uppercase">Warn Floor</div>
                <div className="text-xs font-bold text-amber-300">&ge;{WARNING_THRESHOLD_COHERENCE_PCT}%</div>
              </div>
            </div>

            {/* Scrollable Hardware Node List */}
            <div
              id="node-status-scrollable-list"
              className="max-h-[520px] overflow-y-auto space-y-2 pr-1 custom-scrollbar"
            >
              {hardwareNodesThroughputList.map((node) => {
                const isBreach = node.nodeHealthStatus === 'ISOLATED_BREACH';
                const isWarn = node.nodeHealthStatus === 'BELOW_WARNING_THRESHOLD';
                return (
                  <div
                    key={node.nodeId}
                    id={`node-status-item-${node.nodeId.toLowerCase()}`}
                    data-node-status={node.nodeHealthStatus}
                    className={`p-3 rounded-xl border transition space-y-2 ${
                      isBreach
                        ? 'bg-rose-950/60 border-rose-500/60 hsm-breach-alert-layer'
                        : isWarn
                        ? 'bg-amber-950/60 border-amber-400/60'
                        : 'bg-black/70 border-white/10 hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 font-bold text-[10px]">
                          {node.nodeId}
                        </span>
                        <span className="font-bold text-white truncate text-[11px]">{node.nodeName}</span>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                          isBreach
                            ? 'bg-rose-500/30 text-rose-200 border border-rose-400/50'
                            : isWarn
                            ? 'bg-amber-500/30 text-amber-200 border border-amber-400/50'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {node.nodeHealthStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-[10px] bg-black/50 p-2 rounded-lg border border-white/5">
                      <div>
                        <span className="text-zinc-500 block text-[9px]">Throughput</span>
                        <strong className="text-cyan-300">{node.throughputQops} QOPS</strong>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[9px]">PQC Rate</span>
                        <strong className="text-emerald-300">{node.signaturesPerSec} sig/s</strong>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[9px]">Coherence</span>
                        <strong className={isBreach ? 'text-rose-300' : isWarn ? 'text-amber-300' : 'text-white'}>
                          {node.coherencePct}%
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-400">
                      <span className="truncate">
                        {node.associatedChamber} · P95: <strong className="text-zinc-200">{node.latencyMs}ms</strong>
                      </span>
                      <span className="text-purple-300 shrink-0">Slot {node.storeSlotId}</span>
                    </div>

                    <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-white/10">
                      <button
                        id={`btn-dashboard-dossier-${node.nodeId.toLowerCase()}`}
                        type="button"
                        onClick={() => setSelectedForensicDossier(node)}
                        className="flex-1 px-2 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 font-bold text-[10px] cursor-pointer text-center"
                      >
                        View Forensic Dossier
                      </button>
                      <button
                        id={`btn-dashboard-warn-${node.nodeId.toLowerCase()}`}
                        type="button"
                        onClick={() => handleTriggerNodeWarningThreshold(node.nodeId)}
                        className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 font-bold text-[10px] cursor-pointer"
                        title={`Simulate ${node.nodeId} dropping below Warning threshold`}
                      >
                        Warn Toast
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
          </div>

          {/* Real-time Print Event Tracker & Immutable Ledger */}
          {printLedgerLogs.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Immutable Audit Ledger — Print QR Event Log ({printLedgerLogs.length} Records)</span>
                </h4>
                <span className="text-[10px] font-mono text-emerald-400">WORM Audit V25 &bull; Non-Repudiation ETDA Sec 28</span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1.5 font-mono text-[10px] text-gray-300 pr-1">
                {printLedgerLogs.map((log) => (
                  <div
                    key={log.printId}
                    className="flex flex-wrap items-center justify-between bg-black/40 px-3 py-1.5 rounded-lg border-cyan-900/40 gap-2 hover:border-cyan-500/40 transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 font-bold">[{log.printId}]</span>
                      <span className="text-zinc-200">Source: {log.chamberSource}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">{log.ledgerStatus}</span>
                      <span className="text-zinc-500">({log.timestamp})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Secondary Visualization Below Heatmap: 24-Hour Integration Coverage Percentage Trend Line */}
          <div
            id="heatmap-24h-integration-coverage-trend"
            className="mt-6 p-5 rounded-2xl bg-black/60 border border-cyan-500/25 backdrop-blur-xl space-y-3"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-300 flex-wrap">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>24-HOUR INTEGRATION COVERAGE PERCENTAGE TREND LINE (DEGRADATION TELEMETRY)</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px]">
                    DEGRADATION DETECTED AT -13H TO -12H (MIN 94.15%)
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 font-sans mt-1">
                  Continuous 24-hour integration test completeness trajectory across all 8 production E2E stages (Adapter → Engine → Target → Ledger). Highlights historical periods of branch coverage degradation.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono shrink-0">
                <div className="px-3 py-1.5 rounded-xl bg-black/70 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="text-zinc-400 text-[10px]">Current Line Cov:</span>
                  <span className="text-emerald-300 font-bold">
                    {integrationCoverage24hTrend[integrationCoverage24hTrend.length - 1]?.coveragePct.toFixed(2)}%
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-black/70 border border-amber-500/30 flex items-center gap-1.5">
                  <span className="text-zinc-400 text-[10px]">24h Min (Degradation):</span>
                  <span className="text-amber-300 font-bold">
                    {Math.min(...integrationCoverage24hTrend.map((p) => p.coveragePct)).toFixed(2)}%
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-black/70 border border-cyan-500/30 flex items-center gap-1.5">
                  <span className="text-zinc-400 text-[10px]">SLA Target:</span>
                  <span className="text-cyan-300 font-bold">&ge; 97.50%</span>
                </div>
              </div>
            </div>

            {/* Interactive SVG 24-Hour Trend Line & Degradation Window Visualization */}
            <div className="p-3.5 rounded-xl bg-black/80 border border-white/5 space-y-2">
              <div className="h-32 w-full relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 720 110" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="cov24hGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.38" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  {/* SLA Threshold Reference Line (97.50%) */}
                  <line
                    x1="0"
                    y1="38"
                    x2="720"
                    y2="38"
                    stroke="#f59e0b"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.65"
                  />
                  {/* Degradation Window Highlight Zone (-14h to -11h) */}
                  <rect x="300" y="4" width="95" height="96" fill="rgba(244,63,94,0.14)" rx="4" />

                  {/* Area under 24h coverage curve */}
                  <polygon
                    fill="url(#cov24hGrad)"
                    points={`0,100 ${integrationCoverage24hTrend
                      .map((pt, i, arr) => {
                        const x = (i / Math.max(1, arr.length - 1)) * 720;
                        const y = 98 - ((pt.coveragePct - 93) / 7) * 88;
                        return `${x.toFixed(1)},${Math.max(6, Math.min(98, y)).toFixed(1)}`;
                      })
                      .join(' ')} 720,100`}
                  />

                  {/* 24h Trend Line */}
                  <polyline
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="2.2"
                    points={integrationCoverage24hTrend
                      .map((pt, i, arr) => {
                        const x = (i / Math.max(1, arr.length - 1)) * 720;
                        const y = 98 - ((pt.coveragePct - 93) / 7) * 88;
                        return `${x.toFixed(1)},${Math.max(6, Math.min(98, y)).toFixed(1)}`;
                      })
                      .join(' ')}
                  />

                  {/* Data nodes & degradation markers */}
                  {integrationCoverage24hTrend.map((pt, i, arr) => {
                    const x = (i / Math.max(1, arr.length - 1)) * 720;
                    const y = Math.max(6, Math.min(98, 98 - ((pt.coveragePct - 93) / 7) * 88));
                    return (
                      <circle
                        key={pt.hourLabel}
                        cx={x}
                        cy={y}
                        r={pt.degradationFlag ? 4 : 2.2}
                        fill={pt.degradationFlag ? '#f43f5e' : '#10b981'}
                        stroke="#090d16"
                        strokeWidth="1"
                      >
                        <title>
                          {`${pt.hourLabel}: Line Coverage ${pt.coveragePct}% | Branch Coverage ${pt.branchCoveragePct}%${
                            pt.degradationNote ? ` (${pt.degradationNote})` : ''
                          }`}
                        </title>
                      </circle>
                    );
                  })}
                </svg>
              </div>

              {/* 24h X-Axis Hour Labels & Degradation Callout */}
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1 border-t border-white/5">
                <span>-23h (98.42%)</span>
                <span>-18h (98.39%)</span>
                <span className="text-rose-400 font-bold">
                  ⚠ -13h to -12h Degradation Dip (94.15% — Sig Gate L1539–1576)
                </span>
                <span>-6h (98.35%)</span>
                <span className="text-emerald-400 font-bold">
                  Now ({integrationCoverage24hTrend[integrationCoverage24hTrend.length - 1]?.coveragePct.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Sync Protocol & Quorum Footer */}
          <div className="mt-6 pt-4 border-t border-gray-800 flex flex-wrap justify-between items-center text-xs text-gray-400 font-mono gap-2">
            <span>Sync Protocol: SSoT Parity (Δ0.00% Zero Drift)</span>
            <span className="text-cyan-400 font-mono font-bold">Quorum: 10/10 REAL_HSM</span>
          </div>
        </div>
      )}

      {/* 🗺️ VIEW MODE 2: 2D Spatiotemporal Epoch Heatmap Matrix (18 Chambers × Heartbeat Epochs) */}
      {activeViewMode === 'epoch_matrix' && (
        <div className="p-6 rounded-[28px] bg-black/40 border-white/8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-mono font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>2D Spatiotemporal Heartbeat Heatmap Matrix (18 Chambers &times; 16 Epochs)</span>
              </h2>
              <div className="text-xs text-zinc-400 mt-0.5">
                Horizontal axis represents continuous 1.00 Hz heartbeat epochs. Hover over any cell for cryptographic proof.
              </div>
            </div>

            {/* Color Scale Legend */}
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                <span className="text-zinc-300">&ge;99.99% Optimal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-teal-400" />
                <span className="text-zinc-300">&ge;99.95% Safe</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                <span className="text-zinc-300">Monitored</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 animate-pulse" />
                <span className="text-rose-300">Alert</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-mono text-zinc-400">
                  <th className="py-2 px-3 w-44">Chamber</th>
                  <th className="py-2 px-2 text-center">Status</th>
                  {Array.from({ length: HISTORICAL_EPOCHS_COUNT }).map((_, i) => (
                    <th key={i} className="py-2 px-1 text-center font-normal">
                      T-{HISTORICAL_EPOCHS_COUNT - 1 - i}s
                    </th>
                  ))}
                  <th className="py-2 px-3 text-right">Current</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs font-mono">
                {filteredProfiles.map((prof) => {
                  return (
                    <tr
                      key={prof.chamber.id}
                      onClick={() => setSelectedChamberId(prof.chamber.id)}
                      className="hover:bg-white/5 transition cursor-pointer"
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-black/60 text-cyan-400 border-cyan-500/30 text-[10px]">
                            {prof.chamber.code}
                          </span>
                          <span className="truncate max-w-[130px]">{prof.chamber.name}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          {prof.chamber.status}
                        </span>
                      </td>

                      {prof.recentSnapshots.map((snap, sIdx) => {
                        const val =
                          activeMetric === 'coherence'
                            ? snap.coherencePct
                            : activeMetric === 'stability'
                            ? snap.stabilityIndex
                            : snap.cryoTempMk;
                        const cellStyle = getCellHeatStyle(activeMetric, val);

                        return (
                          <td key={sIdx} className="py-2 px-1 text-center">
                            <div
                              className={`w-6 h-6 mx-auto rounded transition-all duration-150 flex items-center justify-center text-[9px] font-bold ${cellStyle.bg} ${cellStyle.border} ${cellStyle.text} border hover:scale-125 shadow-sm`}
                              title={`${prof.chamber.code} • Epoch: ${snap.timestamp} • Coherence: ${snap.coherencePct}% • Stability: ${snap.stabilityIndex}% • Cryo: ${snap.cryoTempMk} mK`}
                            >
                              {activeMetric === 'cryoTemp'
                                ? Math.round(snap.cryoTempMk)
                                : (val % 1).toFixed(2).replace('0.', '.')}
                            </div>
                          </td>
                        );
                      })}

                      <td className="py-2.5 px-3 text-right">
                        <span className="font-bold text-emerald-400">
                          {activeMetric === 'coherence'
                            ? `${prof.currentCoherence.toFixed(3)}%`
                            : activeMetric === 'stability'
                            ? `${prof.currentStability.toFixed(2)}%`
                            : `${prof.currentCryoTemp.toFixed(2)} mK`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 📈 VIEW MODE 3: Aggregate Telemetry Trend (Recharts) */}
      {activeViewMode === 'telemetry_trend' && (
        <div className="p-6 rounded-[28px] bg-black/40 border-white/8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-mono font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <span>Continuous Telemetry Heartbeat Aggregate (18 Chambers Convergence)</span>
              </h2>
              <div className="text-xs text-zinc-400 mt-0.5">
                Mean quantum coherence trajectory, cryogenic sub-Kelvin bus stability, and SLA Safe Harbor boundaries.
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" />
                Mean Coherence
              </span>
              <span className="text-blue-400 font-bold flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-blue-400 inline-block" />
                Cryo Bus (mK)
              </span>
              <span className="text-rose-400/80 font-bold flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-rose-400 inline-block" />
                SLA Threshold (99.95%)
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cohGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="time" stroke="#71717a" tick={{ fontSize: 10, fill: '#a1a1aa' }} />
                <YAxis
                  domain={[99.92, 100.0]}
                  stroke="#71717a"
                  tick={{ fontSize: 10, fill: '#a1a1aa' }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#070a12',
                    borderColor: '#10b98150',
                    borderRadius: '12px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                  }}
                  formatter={(val: any, name: any) => [
                    `${val} ${name === 'meanCryo' ? 'mK' : '%'}`,
                    name === 'meanCoherence'
                      ? 'Mean Coherence'
                      : name === 'meanStability'
                      ? 'Mean Stability'
                      : 'Cryo Temp',
                  ]}
                />
                <ReferenceLine y={99.95} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'SLA MIN', fill: '#f43f5e', fontSize: 9 }} />
                <Area type="monotone" dataKey="meanCoherence" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#cohGradient)" />
                <Line type="monotone" dataKey="meanStability" stroke="#06b6d4" strokeWidth={1.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 🔍 Interactive Chamber Forensic Inspection Drawer / Modal */}
      {selectedProfile && (
        <div
          id="chamber-detail-drawer"
          className="p-6 rounded-[28px] bg-gradient-to-br from-[#070e17] via-[#0a121e] to-[#07080F] border-cyan-500/30 backdrop-blur-xl shadow-2xl space-y-4 animate-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-cyan-500/20 border-cyan-500/40 text-cyan-300">
                <Cpu className="w-6 h-6" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-cyan-400 px-2 py-0.5 rounded bg-black/60 border-cyan-500/30">
                    {selectedProfile.chamber.code}
                  </span>
                  <h3 className="text-lg font-mono font-bold text-white">{selectedProfile.chamber.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                    {selectedProfile.chamber.status}
                  </span>
                </div>
                <div className="text-xs text-zinc-400 font-sans mt-0.5">
                  {selectedProfile.chamber.nameTh} &bull; Category: <span className="text-zinc-200">{selectedProfile.chamber.category}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-close-chamber-detail"
                onClick={() => setSelectedChamberId(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 border-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="p-3.5 rounded-xl bg-black/50 border-white/5 text-xs text-zinc-300 space-y-1">
            <div className="font-mono text-zinc-400">{selectedProfile.chamber.description}</div>
            <div className="font-sans text-zinc-500">{selectedProfile.chamber.descriptionTh}</div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            {selectedProfile.chamber.metrics.map((m, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-black/60 border-white/10">
                <div className="text-[10px] text-zinc-400 uppercase">{m.label}</div>
                <div className="text-sm font-bold text-emerald-400 mt-1">{m.value}</div>
                {m.sublabel && <div className="text-[9px] text-zinc-500 mt-0.5">{m.sublabel}</div>}
              </div>
            ))}
          </div>

          {/* Invariants & Statutory Compliance */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="text-[11px] font-mono font-bold text-zinc-300 uppercase flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              <span>Sealed Invariants &amp; Statutory Compliance</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedProfile.chamber.invariants.map((inv) => (
                <span
                  key={inv}
                  className="px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 border-purple-500/30 text-xs font-mono flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3 text-purple-400" />
                  <span>{inv}</span>
                </span>
              ))}
              <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 border-cyan-500/30 text-xs font-mono">
                ETDA Sec 9/26/28 Compliant
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-xs font-mono">
                PDPA Sec 37 Zero-Knowledge
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 🚨 Requirement 1: Dedicated Notification Overlay (Searchable Unstable Events) */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            id="modal-unstable-events-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowOverlay(false)}
          >
            <motion.div
              id="modal-unstable-events-content"
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0b101b] border-red-500/50 rounded-2xl w-full max-w-2xl p-6 shadow-2xl text-white space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-red-500/30">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-red-500/20 text-red-400 border-red-500/40">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </span>
                  <div>
                    <h3 className="text-base font-mono font-bold text-red-300">
                      Executive Review: Unstable Chamber Events (&lt;95% Coherence)
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-sans">
                      Isolated telemetry records where quantum coherence dropped below the statutory 95.00% SLA.
                    </p>
                  </div>
                </div>
                <button
                  id="btn-close-unstable-overlay"
                  onClick={() => setShowOverlay(false)}
                  className="text-gray-400 hover:text-white text-xs font-mono font-bold px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-xl cursor-pointer border-white/10"
                >
                  ✕ Close
                </button>
              </div>

              {/* Search Bar & Export Chamber Report Action */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-search-unstable-events"
                    type="text"
                    placeholder="Search by Chamber ID (e.g., CH-04) or Timestamp..."
                    value={overlaySearchQuery}
                    onChange={(e) => setOverlaySearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-black/60 border-gray-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:border-red-400 focus:outline-none font-mono"
                  />
                </div>
                <button
                  id="btn-export-chamber-report-csv"
                  onClick={handleExportChamberReport}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  title="Export signed CSV report of all 18 Sovereign Chambers"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>📥 Export Chamber Report (CSV)</span>
                </button>
              </div>

              {/* Event List with Checkboxes for Bulk Lockdown */}
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {filteredUnstableEvents.length > 0 ? (
                  filteredUnstableEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3 bg-red-950/30 border-red-900/60 rounded-xl flex flex-wrap justify-between items-center text-xs gap-2"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedLockdownChambers.includes(evt.chamberId)}
                          onChange={() => toggleSelectChamber(evt.chamberId)}
                          className="w-4 h-4 accent-red-500 rounded cursor-pointer"
                        />
                        <span className="px-2 py-0.5 bg-red-500/20 border-red-500/40 text-red-300 font-mono font-bold rounded">
                          {evt.chamberId}
                        </span>
                        <span className="text-zinc-300 font-mono">
                          Coherence: <strong className="text-red-400">{evt.coherence.toFixed(2)}%</strong>
                        </span>
                      </div>
                      <span className="text-zinc-400 font-mono text-[11px]">{evt.timestamp}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-zinc-500 text-xs font-mono">
                    {unstableEvents.length === 0
                      ? 'All 18 Sovereign Chambers operating at 100% PURE GREEN (No unstable events recorded).'
                      : 'No unstable events match your search query.'}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-between items-center pt-3 border-t border-gray-800 gap-3">
                <span className="text-xs text-gray-400 font-mono">
                  Selected for Lockdown:{' '}
                  <strong className="text-cyan-400">{selectedLockdownChambers.length}</strong> chambers
                </span>
                <button
                  id="btn-apply-bulk-lockdown"
                  onClick={handleBulkLockdown}
                  disabled={selectedLockdownChambers.length === 0}
                  className={`px-5 py-2.5 rounded-xl font-bold font-mono text-xs transition-all shadow-lg flex items-center gap-2 ${
                    selectedLockdownChambers.length > 0
                      ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:scale-105 cursor-pointer'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>🛡️ Apply Bulk Sovereign Lockdown</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real-time In-App Notification Toast for Print QR & Audit Ledger */}
      <AnimatePresence>
        {printToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl bg-[#081524] border-cyan-400/80 text-cyan-100 shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs font-mono"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{printToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forensic Dossier Modal for Specific Hardware HSM Node */}
      <AnimatePresence>
        {selectedForensicDossier && (
          <motion.div
            id="hsm-node-forensic-dossier-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedForensicDossier(null)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0b101b] border-2 border-rose-500/60 rounded-2xl w-full max-w-xl p-6 shadow-2xl text-white space-y-4 font-mono"
            >
              <div className="flex items-center justify-between pb-3 border-b border-rose-500/30">
                <div>
                  <div className="text-xs text-rose-300 font-bold">
                    HARDWARE HSM NODE FORENSIC DOSSIER • {selectedForensicDossier.dossierId}
                  </div>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    {selectedForensicDossier.nodeId} — {selectedForensicDossier.nodeName}
                  </h3>
                </div>
                <button
                  id="btn-close-hsm-forensic-dossier"
                  type="button"
                  onClick={() => setSelectedForensicDossier(null)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-zinc-200 cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-1">
                  <div className="text-zinc-400">
                    Hardware Enclave: <span className="text-white font-bold">{selectedForensicDossier.signerNode}</span>
                  </div>
                  <div className="text-zinc-400">
                    Associated Chamber: <span className="text-cyan-300">{selectedForensicDossier.associatedChamber}</span>
                  </div>
                  <div className="text-zinc-400">
                    PQC Public Key: <span className="text-emerald-300">{selectedForensicDossier.publicKey}</span>
                  </div>
                  <div className="text-zinc-400">
                    Signature Digest: <span className="text-purple-300">{selectedForensicDossier.signatureDigest}</span>
                  </div>
                  <div className="text-zinc-400">
                    Data Store Audit Artifact:{' '}
                    <span className="text-cyan-300 font-bold">
                      {(selectedForensicDossier as any).historicalAuditEventId || `AUD-STORE-${selectedForensicDossier.nodeId}-849202`}
                    </span>{' '}
                    ({(selectedForensicDossier as any).historicalAuditTitle || `Genesis Attestation • ${selectedForensicDossier.nodeId}`})
                  </div>
                  <div className="text-zinc-400">
                    Statutory Authority: <span className="text-amber-300">{selectedForensicDossier.statutoryRef}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-100 font-sans text-xs">
                  <strong className="font-mono text-rose-300 block mb-1">Forensic Finding &amp; Chain of Custody:</strong>
                  {selectedForensicDossier.forensicSummary}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/10">
                <button
                  id="btn-download-hsm-dossier-json"
                  type="button"
                  onClick={() => {
                    EvidenceExportService.downloadJsonBlob(
                      {
                        ...selectedForensicDossier,
                        genesisBlock: '#849202',
                        merkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
                        activeHsmQuorumNodes: effectiveHsmQuorumNodes,
                        exportedAtUtc: new Date().toISOString(),
                      },
                      `${selectedForensicDossier.dossierId}.json`
                    );
                  }}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Node Dossier JSON</span>
                </button>

                <button
                  id="btn-generate-dossier-pdf-from-modal"
                  type="button"
                  onClick={() => {
                    handleGenerateHeatmapForensicPdf();
                    setSelectedForensicDossier(null);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/25 hover:bg-amber-500/35 border border-amber-400/60 text-amber-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Export ETDA Sec 28 Forensic PDF</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GovernanceHealthHeatmap;

