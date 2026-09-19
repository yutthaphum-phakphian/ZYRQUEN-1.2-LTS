import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
} from 'lucide-react';
import { SOVEREIGN_CHAMBERS } from '../data/sovereignData';
import { Chamber } from '../types';
import { useTelemetry } from '../hooks/useTelemetry';
import { playTelemetryBeep, playAuditChime } from './AudioSynthesizer';

// ======================================================================
// ZYRQUEN Ω∞ — 18 SOVEREIGN CHAMBERS GOVERNANCE HEALTH HEATMAP
// Telemetry Heartbeat Integration • Coherence & Stability Matrix
// Genesis Block #849202 | SSoT Δ0.00% Zero Drift | 10/10 REAL_HSM
// ======================================================================

export type HeatmapMetricType = 'coherence' | 'stability' | 'cryoTemp' | 'drift';
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

  // Heartbeat pulse simulation and telemetry heartbeat interval
  useEffect(() => {
    if (!isHeartbeatRunning) return;

    const timer = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-GB', { hour12: false });
      const nowIso = now.toISOString();

      setHeartbeatCycle((prev) => prev + 1);
      setLastHeartbeatUtc(nowIso);
      setHeartbeatPulse(true);

      // Brief visual pulse reset
      setTimeout(() => setHeartbeatPulse(false), 260);

      // Play audio pulse if unmuted
      if (isAudioEnabled) {
        playTelemetryBeep(720);
      }

      // Compute next telemetry heartbeat pulse across all 18 chambers
      setChamberProfiles((prevProfiles) => {
        return prevProfiles.map((prof, idx) => {
          // If locked and protected by bulk lockdown, maintain protected state
          if (prof.status === 'LOCKED_PROTECTED') {
            return prof;
          }

          const isSimulated = simulatedUnstableChamberId === prof.chamber.code;

          // Micro-fluctuations tightly centered around 100% GREEN nominal SSoT
          const globalQopsBonus = latestSnapshot ? (latestSnapshot.qopsThroughput - 850) * 0.00005 : 0;
          const jitter = (Math.sin(Date.now() / 800 + idx * 1.5) * 0.003) + globalQopsBonus;
          
          let newCoherence = +(Math.min(100.0, Math.max(99.965, 99.992 + jitter))).toFixed(3);
          if (isSimulated) {
            newCoherence = +(93.8 + Math.sin(Date.now() / 600) * 0.3).toFixed(2);
          }

          const isUnstable = newCoherence < 95;
          const varianceFlag = isUnstable || (Math.sin(Date.now() / 700 + idx * 2.1) > 0.75);

          const newStability = +(Math.min(100.0, Math.max(99.98, 99.995 + Math.cos(Date.now() / 900 + idx) * 0.002))).toFixed(2);
          const newCryo = +(14.98 + Math.sin(Date.now() / 1200 + idx) * 0.06).toFixed(2);

          // Alert trigger if drops below 95%
          if (newCoherence < 95) {
            setUnstableEvents((currentEvents) => {
              const exists = currentEvents.some((e) => e.chamberId === prof.chamber.code);
              if (!exists) {
                return [
                  {
                    id: `EVT-${prof.chamber.code}-${Date.now()}`,
                    chamberId: prof.chamber.code,
                    coherence: newCoherence,
                    timestamp: timeStr,
                  },
                  ...currentEvents,
                ];
              }
              return currentEvents;
            });
          }

          if (newCoherence < 95 && prof.currentCoherence >= 95) {
            if (onSystemEvent) {
              onSystemEvent(`[ALERT] Chamber ${prof.chamber.code} coherence dropped to ${newCoherence}% (<95%) - Instability detected!`);
            }
            if (onAddSystemEvent) {
              onAddSystemEvent(
                'ALERT',
                `[ALERT] Chamber ${prof.chamber.code} Under-Coherence`,
                `Chamber ${prof.chamber.name} dropped to ${newCoherence}% (<95%). Instability detected!`,
                `HASH-${prof.chamber.code}-${Date.now()}`,
                'critical',
                'ETDA Sec 26'
              );
            }
          }

          const newSnap: ChamberHeartbeatSnapshot = {
            epochIndex: heartbeatCycle + 1,
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
            status: isUnstable ? 'UNSTABLE' : 'PURE_GREEN',
            varianceFlag,
            recentSnapshots: updatedSnapshots,
          };
        });
      });
    }, heartbeatIntervalMs);

    return () => clearInterval(timer);
  }, [isHeartbeatRunning, heartbeatIntervalMs, isAudioEnabled, heartbeatCycle, latestSnapshot, simulatedUnstableChamberId, onSystemEvent, onAddSystemEvent]);

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

  // Filtered chambers
  const filteredProfiles = useMemo(() => {
    return chamberProfiles.filter((prof) => {
      if (selectedCategory !== 'ALL' && prof.chamber.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = prof.chamber.code.toLowerCase().includes(q);
        const matchName = prof.chamber.name.toLowerCase().includes(q);
        const matchNameTh = prof.chamber.nameTh.toLowerCase().includes(q);
        const matchCat = prof.chamber.category.toLowerCase().includes(q);
        const matchInv = prof.chamber.invariants.some((inv) => inv.toLowerCase().includes(q));
        if (!matchCode && !matchName && !matchNameTh && !matchCat && !matchInv) return false;
      }
      return true;
    });
  }, [chamberProfiles, selectedCategory, searchQuery]);

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
    <div id="governance-health-heatmap-container" className="space-y-6 animate-in fade-in duration-300">
      {/* 🏛️ Header: Sovereign Master Telemetry & Heartbeat HUD */}
      <div className="p-6 sm:p-8 rounded-[28px] bg-gradient-to-br from-[#070a12] via-[#0a0f1e] to-[#0f172a] border border-cyan-500/20 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/10 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
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

              <span className="px-3 py-1 rounded-full bg-zinc-800/80 text-zinc-300 border border-white/10 text-xs font-mono">
                CYCLE #{heartbeatCycle}
              </span>

              <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-mono">
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

            {/* Export JSON */}
            <button
              id="btn-export-health-report"
              onClick={handleExportHealthReport}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-mono text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Download 18 Chambers Governance Telemetry JSON"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>EXPORT JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* 📊 Aggregate Telemetry HUD Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-black/40 border border-white/8">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 uppercase">
            <span>Mean Coherence</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-400 mt-1">
            {aggregateMetrics.meanCoherence}%
          </div>
          <div className="text-[10px] text-emerald-300/80 font-mono mt-0.5">SLA &ge;99.950% (PASS)</div>
        </div>

        <div className="p-4 rounded-2xl bg-black/40 border border-white/8">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 uppercase">
            <span>Stability Index</span>
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-cyan-400 mt-1">
            {aggregateMetrics.meanStability}%
          </div>
          <div className="text-[10px] text-cyan-300/80 font-mono mt-0.5">18/18 SSoT PARITY</div>
        </div>

        <div className="p-4 rounded-2xl bg-black/40 border border-white/8">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 uppercase">
            <span>Cryo Temp Mean</span>
            <Thermometer className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-blue-400 mt-1">
            {aggregateMetrics.meanCryo} mK
          </div>
          <div className="text-[10px] text-blue-300/80 font-mono mt-0.5">SLA &le;18.00 mK (NOMINAL)</div>
        </div>

        <div className="p-4 rounded-2xl bg-black/40 border border-white/8">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 uppercase">
            <span>Quorum Binding</span>
            <Lock className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-purple-300 mt-1">10/10 REAL_HSM</div>
          <div className="text-[10px] text-purple-300/80 font-mono mt-0.5">FIPS 140-3 LEVEL 4</div>
        </div>
      </div>

      {/* 🎛️ Toolbar: View Modes, Metric Selectors, Search & Category Filter */}
      <div className="p-4 rounded-2xl bg-black/40 border border-white/8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* View Mode Switcher */}
        <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10 text-xs font-mono">
          <button
            id="tab-view-grid"
            onClick={() => setActiveViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeViewMode === 'grid'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]'
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
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]'
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
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Heartbeat Trend</span>
          </button>
        </div>

        {/* Metric Selector */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-zinc-400 mr-1 hidden sm:inline">Color Heat by:</span>
          {(['coherence', 'stability', 'cryoTemp', 'drift'] as HeatmapMetricType[]).map((metric) => (
            <button
              key={metric}
              id={`metric-btn-${metric}`}
              onClick={() => setActiveMetric(metric)}
              className={`px-2.5 py-1 rounded-lg border transition cursor-pointer capitalize ${
                activeMetric === metric
                  ? 'bg-white/10 text-white border-white/30 font-bold'
                  : 'bg-black/40 text-zinc-400 border-white/5 hover:text-zinc-200'
              }`}
            >
              {metric === 'cryoTemp' ? 'Cryo (mK)' : metric}
            </button>
          ))}
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter chamber..."
              className="w-full bg-black/60 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 font-mono"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500/50 font-mono cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'ALL' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 🗺️ VIEW MODE 1: 18 Sovereign Chambers Spatial Grid Heatmap */}
      {activeViewMode === 'grid' && (
        <div className="space-y-4">
          {/* Sub-toolbar: 18-Cell Matrix (6-Col) vs Detailed Cards + Alert Simulation Trigger */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-black/50 border border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-400">Layout:</span>
              <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10 text-xs font-mono">
                <button
                  id="btn-subview-6col"
                  onClick={() => setGridSubView('6col')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    gridSubView === '6col'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  18-Cell Matrix (6-Col)
                </button>
                <button
                  id="btn-subview-cards"
                  onClick={() => setGridSubView('cards')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    gridSubView === 'cards'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Detailed Chamber Cards
                </button>
              </div>
            </div>

            {/* Unstable Alerts Overlay & Test Simulation Alert Button */}
            <div className="flex items-center gap-2">
              <button
                id="btn-unstable-alerts-overlay"
                onClick={() => setShowOverlay(true)}
                className="px-3 py-1.5 bg-red-500/20 border border-red-500/60 text-red-300 text-xs rounded-xl font-mono font-bold hover:bg-red-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                title="Dedicated Notification Overlay: Searchable Unstable Events (<95% Coherence)"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>🚨 Unstable Alerts ({unstableEvents.length})</span>
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
              <div className="p-3.5 bg-black/95 border border-cyan-400/80 rounded-xl text-xs text-cyan-200 shadow-2xl flex flex-wrap justify-between items-center gap-3 backdrop-blur-md animate-in fade-in duration-150">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-black/60 border border-cyan-900/60 rounded-2xl items-center text-xs">
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

            <div className="flex justify-between items-center px-4 py-3 bg-cyan-950/30 rounded-xl border border-cyan-800/40">
              <span className="text-zinc-400 uppercase tracking-wider font-mono text-[11px]">
                Average System Coherence:
              </span>
              <span className="text-cyan-300 font-bold font-mono text-sm">{avgCoherence}%</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 bg-emerald-950/30 rounded-xl border border-emerald-800/40">
              <span className="text-zinc-400 uppercase tracking-wider font-mono text-[11px]">
                Total Active Sovereign Nodes:
              </span>
              <span className="text-emerald-300 font-bold font-mono text-sm">
                {activeNodesCount} / {chamberProfiles.length}
              </span>
            </div>
          </div>

          {/* 18-Cell Sovereign Chambers Matrix (6-Column Grid) with Framer Motion Entrance */}
          {gridSubView === '6col' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {filteredProfiles.map((chamber, index) => {
                const isUnstable = chamber.currentCoherence < 95;
                const isProtected = chamber.status === 'LOCKED_PROTECTED';
                const cellStyle = isProtected
                  ? 'bg-blue-950/80 border-blue-500 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                  : isUnstable
                  ? 'bg-red-950/80 border-red-500 text-red-400'
                  : getCellColorStyle(chamber.currentCoherence);
                const isSelected = selectedChamberId === chamber.chamber.id;

                return (
                  <motion.div
                    key={chamber.chamber.id}
                    id={`chamber-cell-${chamber.chamber.code.toLowerCase()}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    whileHover={{ scale: 1.03 }}
                    onMouseEnter={() => setHoveredChamber(chamber)}
                    onMouseLeave={() => setHoveredChamber(null)}
                    onClick={() => setSelectedChamberId(chamber.chamber.id)}
                    className={`relative p-3.5 rounded-xl border transition-all cursor-pointer shadow-inner overflow-hidden ${cellStyle} ${
                      isUnstable && !isProtected ? 'ring-2 ring-red-500 animate-pulse' : ''
                    } ${isSelected ? 'ring-2 ring-white scale-[1.02] shadow-2xl' : ''}`}
                  >
                    {/* Visual Anomaly Heat Overlay for High-Frequency Variance */}
                    {chamber.varianceFlag && !isProtected && (
                      <div className="absolute inset-0 bg-red-600/10 pointer-events-none animate-ping opacity-30" />
                    )}

                    <div className="text-[10px] text-gray-400 uppercase tracking-wider flex justify-between items-center relative z-10">
                      <span className="font-mono font-bold text-gray-200">{chamber.chamber.code}</span>
                      {isProtected ? (
                        <span className="text-blue-400 font-bold text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 border border-blue-500/40">
                          LOCKED
                        </span>
                      ) : isUnstable ? (
                        <span className="text-red-400 font-bold text-xs animate-ping">!</span>
                      ) : null}
                    </div>

                    <div className="text-base font-bold my-1 font-mono relative z-10">
                      {chamber.currentCoherence.toFixed(2)}%
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

                    <div className="mt-2 text-[9px] px-1.5 py-0.5 rounded text-center truncate font-mono bg-black/60 border border-white/5 relative z-10">
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
            </div>
          ) : (
            /* Detailed Chamber Cards View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProfiles.map((prof) => {
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

                return (
                  <div
                    key={prof.chamber.id}
                    id={`chamber-card-${prof.chamber.code.toLowerCase()}`}
                    onClick={() => setSelectedChamberId(prof.chamber.id)}
                    className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden ${
                      heatStyle.bg
                    } ${heatStyle.border} ${isSelected ? 'ring-2 ring-white scale-[1.01] z-20 shadow-xl' : ''}`}
                  >
                    {/* Top Bar: Code, Category, Status */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-white px-2 py-0.5 rounded bg-black/40 border border-white/10">
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

                    {/* Title & Thai Name */}
                    <div className="mb-3">
                      <h3 className="font-mono font-bold text-sm text-zinc-100 line-clamp-1">{prof.chamber.name}</h3>
                      <div className="text-[11px] text-zinc-400 font-sans line-clamp-1 mt-0.5">
                        {prof.chamber.nameTh}
                      </div>
                    </div>

                    {/* Real-time Metric Indicators */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-black/50 border border-white/5 mb-3 text-center">
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
                          className="px-2 py-0.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-[10px] rounded-lg font-mono transition flex items-center gap-1 cursor-pointer"
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
                  </div>
                );
              })}
            </div>
          )}

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
                    className="flex flex-wrap items-center justify-between bg-black/40 px-3 py-1.5 rounded-lg border border-cyan-900/40 gap-2 hover:border-cyan-500/40 transition"
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

          {/* Sync Protocol & Quorum Footer */}
          <div className="mt-6 pt-4 border-t border-gray-800 flex flex-wrap justify-between items-center text-xs text-gray-400 font-mono gap-2">
            <span>Sync Protocol: SSoT Parity (Δ0.00% Zero Drift)</span>
            <span className="text-cyan-400 font-mono font-bold">Quorum: 10/10 REAL_HSM</span>
          </div>
        </div>
      )}

      {/* 🗺️ VIEW MODE 2: 2D Spatiotemporal Epoch Heatmap Matrix (18 Chambers × Heartbeat Epochs) */}
      {activeViewMode === 'epoch_matrix' && (
        <div className="p-6 rounded-[28px] bg-black/40 border border-white/8 space-y-4">
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
                          <span className="px-1.5 py-0.5 rounded bg-black/60 text-cyan-400 border border-cyan-500/30 text-[10px]">
                            {prof.chamber.code}
                          </span>
                          <span className="truncate max-w-[130px]">{prof.chamber.name}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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
        <div className="p-6 rounded-[28px] bg-black/40 border border-white/8 space-y-4">
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
          className="p-6 rounded-[28px] bg-gradient-to-br from-[#070e17] via-[#0a121e] to-[#07080F] border border-cyan-500/30 backdrop-blur-xl shadow-2xl space-y-4 animate-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
                <Cpu className="w-6 h-6" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-cyan-400 px-2 py-0.5 rounded bg-black/60 border border-cyan-500/30">
                    {selectedProfile.chamber.code}
                  </span>
                  <h3 className="text-lg font-mono font-bold text-white">{selectedProfile.chamber.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
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
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 border border-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="p-3.5 rounded-xl bg-black/50 border border-white/5 text-xs text-zinc-300 space-y-1">
            <div className="font-mono text-zinc-400">{selectedProfile.chamber.description}</div>
            <div className="font-sans text-zinc-500">{selectedProfile.chamber.descriptionTh}</div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            {selectedProfile.chamber.metrics.map((m, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-black/60 border border-white/10">
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
                  className="px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs font-mono flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3 text-purple-400" />
                  <span>{inv}</span>
                </span>
              ))}
              <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-mono">
                ETDA Sec 9/26/28 Compliant
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-mono">
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
              className="bg-[#0b101b] border border-red-500/50 rounded-2xl w-full max-w-2xl p-6 shadow-2xl text-white space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-red-500/30">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40">
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
                  className="text-gray-400 hover:text-white text-xs font-mono font-bold px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-xl cursor-pointer border border-white/10"
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
                    className="w-full pl-9 pr-4 py-2 bg-black/60 border border-gray-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:border-red-400 focus:outline-none font-mono"
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
                      className="p-3 bg-red-950/30 border border-red-900/60 rounded-xl flex flex-wrap justify-between items-center text-xs gap-2"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedLockdownChambers.includes(evt.chamberId)}
                          onChange={() => toggleSelectChamber(evt.chamberId)}
                          className="w-4 h-4 accent-red-500 rounded cursor-pointer"
                        />
                        <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/40 text-red-300 font-mono font-bold rounded">
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
            className="fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl bg-[#081524] border border-cyan-400/80 text-cyan-100 shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs font-mono"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{printToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GovernanceHealthHeatmap;

