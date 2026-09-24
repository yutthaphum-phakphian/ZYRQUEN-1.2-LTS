// src/components/dashboard/Chamber18NeuralSentinel.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Activity, ShieldAlert, Cpu, Radio, Zap, AlertTriangle, 
  CheckCircle2, Lock, Download, Bell, X, Sliders, AlertOctagon, 
  Table, Trash2, ToggleLeft, ToggleRight, FileSpreadsheet,
  TrendingUp, Flame, BarChart3, Binary, Settings2, BarChart2,
  Maximize2, Code, Layers, CloudOff, Cloud
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine 
} from 'recharts';
import { 
  TelemetrySpan, GovernanceMetrics, DetectedPattern, 
  Chamber18NeuralSentinelEngine 
} from '../../chambers/chamber18/neuralSentinelEngine';
import { queueAuditLog, useOfflineAuditSync } from '../../utils/offlineAuditSync';
import { CANONICAL_PHASE_JITTER_EVENTS } from '../../data/phaseJitterDecoherenceEvents';

interface ToastAlert {
  id: string;
  anomalyScore: number;
  timestamp: number;
  message: string;
}

interface AnomalyDataPoint {
  time: string;
  score: number;
  timestampMs: number;
}

export interface BreachEvent {
  id: string;
  timestamp: number;
  nodeId: string;
  anomalyScore: number;
  triggerType: string;
  telemetrySnapshot?: TelemetrySpan; // แนบ Snapshot ข้อมูล Telemetry ฉบับเต็ม
}

export interface CSVColumnConfig {
  id: boolean;
  timestamp: boolean;
  nodeId: boolean;
  anomalyScore: boolean;
  triggerType: boolean;
}

export interface Chamber18NeuralSentinelProps {
  className?: string;
  onNavigateToQuarantine?: () => void;
  onNavigateToLedger?: () => void;
}

const STORAGE_KEY = 'zyrquen_chamber18_breach_events';
const sentinelEngine = new Chamber18NeuralSentinelEngine();

const DEFAULT_BREACHES: BreachEvent[] = CANONICAL_PHASE_JITTER_EVENTS.map(rec => ({
  id: rec.eventId,
  timestamp: rec.timestampMs,
  nodeId: rec.nodeId,
  anomalyScore: rec.anomalyScorePct / 100,
  triggerType: rec.triggerType,
  telemetrySnapshot: {
    traceId: `tr-${rec.nodeId.toLowerCase()}-${rec.eventId.replace('BRK-', '')}`,
    spanId: `sp-${rec.eventId.replace('BRK-', '')}`,
    timestamp: rec.timestampMs,
    durationMs: 148.2,
    phaseJitterFs: 5.82,
    quantumCoherenceRatio: 0.9912,
    nodeId: rec.nodeId
  }
}));

export const Chamber18NeuralSentinel: React.FC<Chamber18NeuralSentinelProps> = ({
  className = '',
  onNavigateToQuarantine,
  onNavigateToLedger
}) => {
  const [metrics, setMetrics] = useState<GovernanceMetrics>({
    anomalyScore: 0.02,
    predictiveDriftRisk: 0.00,
    failClosedProximity: 1.42,
    coherenceHealthIndex: 99.98,
    detectedPatterns: []
  });

  const [threshold, setThreshold] = useState<number>(0.85);
  const [isAutoClearEnabled, setIsAutoClearEnabled] = useState<boolean>(false);
  const [isAutoCSVExportEnabled, setIsAutoCSVExportEnabled] = useState<boolean>(false);
  const [showColConfig, setShowColConfig] = useState<boolean>(false);
  
  // Offline Audit Sync Engine Hook
  const { pendingCount, isOnline, syncNow } = useOfflineAuditSync();

  // Modal State สำหรับ 'Expand to View' Full Telemetry Snapshot
  const [selectedBreachModal, setSelectedBreachModal] = useState<BreachEvent | null>(null);

  const [csvColumns, setCsvColumns] = useState<CSVColumnConfig>({
    id: true,
    timestamp: true,
    nodeId: true,
    anomalyScore: true,
    triggerType: true
  });

  const [history60s, setHistory60s] = useState<AnomalyDataPoint[]>([]);

  // 1. LocalStorage Persistence Restore
  const [breachEvents, setBreachEvents] = useState<BreachEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (err) {
      console.error('Failed to restore breach events:', err);
    }
    return DEFAULT_BREACHES;
  });

  const [isQuarantineActive, setIsQuarantineActive] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastAlert[]>([]);

  // LocalStorage Synchronizer
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(breachEvents));
    } catch (err) {
      console.error('Failed to persist breach events:', err);
    }
  }, [breachEvents]);

  const isNearThreshold = metrics.anomalyScore >= Math.max(0, threshold - 0.10);

  // Automated Forensic Log & CSV Exporter Handler
  const triggerAutomatedForensicCapture = (event: BreachEvent, currentThreshold: number) => {
    console.warn(`[SENTINEL FORENSIC AUTO-CAPTURE] Threshold breach detected on Node ${event.nodeId}`, {
      eventId: event.id,
      timestampISO: new Date(event.timestamp).toISOString(),
      nodeId: event.nodeId,
      anomalyScore: `${(event.anomalyScore * 100).toFixed(2)}%`,
      triggerType: event.triggerType,
      activeThreshold: `${(currentThreshold * 100).toFixed(0)}%`
    });

    // Queue audit log to Service Worker / IndexedDB Background Sync
    queueAuditLog({
      id: event.id,
      source: 'Chamber18NeuralSentinel',
      action: 'THRESHOLD_BREACH_DETECTED',
      nodeId: event.nodeId,
      anomalyScore: event.anomalyScore,
      triggerType: event.triggerType,
      details: {
        activeThreshold: currentThreshold,
        telemetrySnapshot: event.telemetrySnapshot
      },
      timestamp: event.timestamp
    }).catch(err => console.warn('[Sentinel] Offline audit queue notice:', err));

    if (isAutoCSVExportEnabled) {
      executeBreachCSVExport([event]);
    }
  };

  // Telemetry Loop
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const isSpike = Math.random() < 0.20;
      
      const mockSpan: TelemetrySpan = {
        traceId: `tr-${Math.random().toString(36).substring(2, 8)}`,
        spanId: `sp-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: now,
        durationMs: isSpike ? 142.6 : 35.8 + (Math.random() * 4 - 2),
        phaseJitterFs: isSpike ? 5.40 : 1.33 + (Math.random() * 0.4 - 0.2),
        quantumCoherenceRatio: isSpike ? 0.9840 : 0.9998,
        nodeId: (['BK01', 'SG02', 'TY03', 'ZH04', 'SV05', 'LD06'] as const)[Math.floor(Math.random() * 6)]
      };

      const newMetrics = sentinelEngine.ingestSpan(mockSpan);
      setMetrics(newMetrics);

      const timeLabel = new Date(now).toLocaleTimeString('en-US', { 
        hour12: false, minute: '2-digit', second: '2-digit' 
      });

      setHistory60s(prev => {
        const updated = [...prev, {
          time: timeLabel,
          score: Number((newMetrics.anomalyScore * 100).toFixed(2)),
          timestampMs: now
        }];
        return updated.filter(point => now - point.timestampMs <= 60000);
      });

      if (newMetrics.anomalyScore >= threshold) {
        const triggerType = mockSpan.phaseJitterFs > 3.0 
          ? 'PHASE_JITTER_DECOHERENCE' 
          : mockSpan.durationMs > 100 
            ? 'CROSS_MESH_LATENCY_SPIKE' 
            : 'FAIL_CLOSED_THRESHOLD_BREACH';

        const newBreach: BreachEvent = {
          id: `BRK-${Math.floor(10000 + Math.random() * 90000)}`,
          timestamp: now,
          nodeId: mockSpan.nodeId,
          anomalyScore: newMetrics.anomalyScore,
          triggerType,
          telemetrySnapshot: mockSpan
        };

        setBreachEvents(prev => {
          const updated = [newBreach, ...prev];
          return isAutoClearEnabled ? updated.slice(0, 5) : updated.slice(0, 50);
        });

        triggerAutomatedForensicCapture(newBreach, threshold);

        if (!isQuarantineActive) setIsQuarantineActive(true);

        const toastId = `ALERT-${now}`;
        const newToast: ToastAlert = {
          id: toastId,
          anomalyScore: newMetrics.anomalyScore,
          timestamp: now,
          message: `Node ${mockSpan.nodeId} reached ${(newMetrics.anomalyScore * 100).toFixed(1)}% (Threshold: ${(threshold * 100).toFixed(0)}%)`
        };

        setToasts(prev => [newToast, ...prev].slice(0, 3));
        setTimeout(() => removeToast(toastId), 4500);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [threshold, isQuarantineActive, isAutoClearEnabled, isAutoCSVExportEnabled, csvColumns]);

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const handleClearBreachLogs = () => {
    setBreachEvents([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  // 60-Second Trend Summaries
  const { average60sScore, peak60sScore } = useMemo(() => {
    if (history60s.length === 0) return { average60sScore: 0, peak60sScore: 0 };
    const total = history60s.reduce((acc, curr) => acc + curr.score, 0);
    const max = Math.max(...history60s.map(curr => curr.score));
    return {
      average60sScore: total / history60s.length,
      peak60sScore: max
    };
  }, [history60s]);

  // FEATURE 1: Dedicated Export for 'Detected Anomaly Patterns' with simplified mapping
  const handleExportPatternsCSV = () => {
    if (metrics.detectedPatterns.length === 0) {
      // โค้ดจำลองข้อมูลสำหรับ Export กรณีที่ยังไม่มีข้อมูลเรียลไทม์
      const samplePatterns: DetectedPattern[] = [
        {
          id: 'PAT-101',
          timestamp: Date.now() - 120000,
          affectedNode: 'SG02',
          patternType: 'PHASE_DECOHERENCE_JITTER',
          severity: 'WARNING',
          confidence: 0.942,
          description: 'High jitter variance on sub-kelvin link'
        },
        {
          id: 'PAT-102',
          timestamp: Date.now() - 450000,
          affectedNode: 'LD06',
          patternType: 'CROSS_MESH_LATENCY_SPIKE',
          severity: 'CRITICAL',
          confidence: 0.985,
          description: 'Mesh interconnect latency exceeded 100ms'
        }
      ];
      exportPatternsToCSV(samplePatterns);
      return;
    }

    exportPatternsToCSV(metrics.detectedPatterns);
  };

  const exportPatternsToCSV = (patterns: DetectedPattern[]) => {
    // Simplified Mapping: Pattern ID, Node ID, Severity Level, Pattern Type, Confidence (%), Timestamp
    const headers = ["Pattern ID", "Node ID", "Severity Level", "Pattern Type", "Confidence (%)", "Timestamp (ISO)"];
    const rows = patterns.map(p => [
      p.id,
      p.affectedNode,
      p.severity,
      p.patternType,
      (p.confidence * 100).toFixed(2),
      new Date(p.timestamp).toISOString()
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ZYRQUEN_Detected_Anomaly_Patterns_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Histogram Frequency Distribution (Last 60 mins)
  const scoreHistogramData = useMemo(() => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const breaches60m = breachEvents.filter(b => b.timestamp >= oneHourAgo);

    const bins = [
      { binRange: '50-60%', min: 0.50, max: 0.60, count: 0 },
      { binRange: '60-70%', min: 0.60, max: 0.70, count: 0 },
      { binRange: '70-80%', min: 0.70, max: 0.80, count: 0 },
      { binRange: '80-90%', min: 0.80, max: 0.90, count: 0 },
      { binRange: '90-100%', min: 0.90, max: 1.01, count: 0 },
    ];

    breaches60m.forEach(b => {
      const matchedBin = bins.find(bin => b.anomalyScore >= bin.min && b.anomalyScore < bin.max);
      if (matchedBin) matchedBin.count += 1;
    });

    return bins;
  }, [breachEvents]);

  // Export Breaches CSV
  const executeBreachCSVExport = (eventsToExport: BreachEvent[]) => {
    if (eventsToExport.length === 0) {
      alert("No breach events available to export.");
      return;
    }

    const headers: string[] = [];
    if (csvColumns.id) headers.push("Event ID");
    if (csvColumns.timestamp) headers.push("Timestamp (ISO)");
    if (csvColumns.nodeId) headers.push("Node ID");
    if (csvColumns.anomalyScore) headers.push("Anomaly Score (%)");
    if (csvColumns.triggerType) headers.push("Trigger Type");

    if (headers.length === 0) {
      alert("Please select at least one column in the CSV configuration menu.");
      return;
    }

    const rows = eventsToExport.map(b => {
      const row: string[] = [];
      if (csvColumns.id) row.push(b.id);
      if (csvColumns.timestamp) row.push(new Date(b.timestamp).toISOString());
      if (csvColumns.nodeId) row.push(b.nodeId);
      if (csvColumns.anomalyScore) row.push((b.anomalyScore * 100).toFixed(2));
      if (csvColumns.triggerType) row.push(`"${b.triggerType.replace(/"/g, '""')}"`);
      return row.join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ZYRQUEN_Breach_Export_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalBreachesCount = breachEvents.length;
  const last24hBreachesCount = breachEvents.filter(
    b => Date.now() - b.timestamp <= 24 * 60 * 60 * 1000
  ).length;

  return (
    <div className={`relative bg-slate-950 text-slate-100 p-4 sm:p-6 pb-8 sm:pb-10 rounded-2xl border border-slate-800 shadow-2xl space-y-6 font-mono ${className}`}>
      
      {/* CSS Keyframes & Animations */}
      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes thresholdGlowPulse {
          0%, 100% {
            stroke: #f43f5e;
            stroke-width: 2px;
            filter: drop-shadow(0px 0px 3px #f43f5e);
          }
          50% {
            stroke: #fda4af;
            stroke-width: 4px;
            filter: drop-shadow(0px 0px 10px #f43f5e);
          }
        }
        .pulsing-threshold-line line {
          animation: thresholdGlowPulse 1.2s ease-in-out infinite;
        }
      `}</style>

      {/* 1. TOAST CONTAINER: Fixed Top-Right with pointer-events-none so clicks pass through to 16-step buttons */}
      {typeof document !== 'undefined' && createPortal(
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0 pt-[env(safe-area-inset-top,0px)]" aria-live="polite">
          {toasts.map(toast => (
            <div 
              key={toast.id}
              className="pointer-events-auto bg-rose-950/95 border border-rose-500/60 text-rose-100 p-3.5 rounded-xl shadow-2xl backdrop-blur-md flex items-start justify-between gap-3 animate-slide-down text-xs"
            >
              <div className="flex items-start gap-2.5">
                <Bell className="w-4 h-4 text-rose-400 animate-bounce shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-rose-300 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    Threshold Exceeded
                  </h4>
                  <p className="text-[11px] text-rose-100 mt-0.5 leading-snug">{toast.message}</p>
                  <span className="text-[9px] text-rose-400/80 mt-1 block font-mono">
                    {new Date(toast.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => removeToast(toast.id)} 
                className="text-rose-400 hover:text-white p-1 transition-colors cursor-pointer shrink-0"
                aria-label="Close alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}

      {/* FEATURE 3: MODAL POPUP FOR 'EXPAND TO VIEW' TELEMETRY SNAPSHOT */}
      {selectedBreachModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4 font-mono text-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-lg">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    TELEMETRY CAPTURE SNAPSHOT
                    <span className="text-[10px] px-2 py-0.5 bg-rose-950 text-rose-400 border border-rose-800 rounded font-bold">
                      {selectedBreachModal.id}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Exact telemetry metrics recorded at breach moment</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedBreachModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Target Node</span>
                <span className="font-bold text-cyan-400 text-sm">{selectedBreachModal.nodeId}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Anomaly Score</span>
                <span className="font-bold text-rose-400 text-sm">{(selectedBreachModal.anomalyScore * 100).toFixed(2)}%</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500 block">Trigger Type</span>
                <span className="font-bold text-amber-400 text-[11px]">{selectedBreachModal.triggerType}</span>
              </div>
            </div>

            {/* Detailed Span Breakdown */}
            {selectedBreachModal.telemetrySnapshot && (
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/80 pb-1.5">
                  <span className="flex items-center gap-1 font-bold text-slate-300">
                    <Code className="w-3.5 h-3.5 text-cyan-400" />
                    SPAN METRICS (IEEE-754)
                  </span>
                  <span>Trace: {selectedBreachModal.telemetrySnapshot.traceId}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-500">Span ID:</span>{' '}
                    <span className="text-slate-200">{selectedBreachModal.telemetrySnapshot.spanId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Duration Latency:</span>{' '}
                    <span className="text-emerald-400 font-bold">{selectedBreachModal.telemetrySnapshot.durationMs.toFixed(2)} ms</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Phase Jitter:</span>{' '}
                    <span className="text-amber-400 font-bold">{selectedBreachModal.telemetrySnapshot.phaseJitterFs.toFixed(2)} fs</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Quantum Coherence:</span>{' '}
                    <span className="text-cyan-400 font-bold">{(selectedBreachModal.telemetrySnapshot.quantumCoherenceRatio * 100).toFixed(3)}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Raw JSON Snapshot View */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Layers className="w-3 h-3 text-slate-500" />
                RAW TELEMETRY JSON DATA
              </span>
              <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[10px] text-emerald-400 overflow-x-auto max-h-36 font-mono">
                {JSON.stringify(selectedBreachModal.telemetrySnapshot || selectedBreachModal, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedBreachModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                CLOSE SNAPSHOT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wider text-slate-100 flex items-center gap-2">
              CHAMBER 18: NEURAL SENTINEL
              <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 rounded-full">
                ACTIVE INGEST
              </span>
            </h2>
            <p className="text-xs text-slate-400">Real-time Anomaly Detection & Telemetry Audit Engine</p>
          </div>
        </div>

        {/* FEATURE 1: Dedicated Export Button for Detected Anomaly Patterns */}
        <div className="flex items-center gap-3">
          {/* Offline Audit Sync Indicator */}
          {pendingCount > 0 ? (
            <button
              onClick={() => syncNow()}
              className="text-[11px] font-bold px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/60 text-amber-300 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg transition-all animate-pulse"
              title="Click to trigger immediate background sync to server"
            >
              <CloudOff className="w-3.5 h-3.5 text-amber-400" />
              <span>{pendingCount} OFFLINE QUEUED (SYNC)</span>
            </button>
          ) : (
            <span className="text-[11px] font-bold px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-xl flex items-center gap-1.5" title={isOnline ? 'All audit logs synchronized with server' : 'Running in offline cached mode'}>
              <Cloud className={`w-3.5 h-3.5 ${isOnline ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{isOnline ? 'AUDIT IN SYNC' : 'OFFLINE MODE'}</span>
            </span>
          )}

          <button
            onClick={handleExportPatternsCSV}
            className="px-3.5 py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            title="Export simplified anomaly patterns mapping to CSV"
          >
            <Download className="w-4 h-4" />
            EXPORT PATTERNS (CSV)
          </button>

          <span className="text-xs font-bold px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-md">
            Δ0.00% Zero Drift
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className={`p-4 rounded-xl border transition-all ${
          metrics.anomalyScore >= threshold 
            ? 'bg-rose-950/40 border-rose-500/60 animate-pulse' 
            : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className="flex justify-between items-center text-slate-400 text-xs mb-2">
            <span>ANOMALY SCORE</span>
            <Activity className={`w-4 h-4 ${metrics.anomalyScore >= threshold ? 'text-rose-400' : 'text-cyan-400'}`} />
          </div>
          <div className={`text-2xl font-black ${metrics.anomalyScore >= threshold ? 'text-rose-400' : 'text-slate-100'}`}>
            {(metrics.anomalyScore * 100).toFixed(2)}
            <span className="text-xs text-slate-500 font-normal"> / 100</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${metrics.anomalyScore >= threshold ? 'bg-rose-500' : 'bg-cyan-500'}`}
              style={{ width: `${Math.min(metrics.anomalyScore * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-2">
            <span>PREDICTIVE DRIFT</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">
            {metrics.predictiveDriftRisk.toFixed(3)}%
          </div>
          <p className="text-[10px] text-slate-500 mt-2">Invariant Delta: 0.05%</p>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-2">
            <span>FAIL-CLOSED PROXIMITY</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-slate-100">
            {metrics.failClosedProximity.toFixed(2)}%
          </div>
          <p className="text-[10px] text-slate-500 mt-2">Threshold: {(threshold * 100).toFixed(0)}%</p>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-2">
            <span>COHERENCE HEALTH</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {metrics.coherenceHealthIndex.toFixed(3)}%
          </div>
          <p className="text-[10px] text-slate-500 mt-2">14.98 mK Sub-Kelvin Loop</p>
        </div>

        <div className="bg-gradient-to-br from-rose-950/30 to-slate-900 p-4 rounded-xl border border-rose-500/30 space-y-1">
          <div className="flex justify-between items-center text-rose-400 text-xs">
            <span className="font-bold">BREACH LOGS</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-slate-100">{totalBreachesCount}</div>
          <div className="flex justify-between text-[10px] text-slate-400 pt-1">
            <span>Last 24h: <strong className="text-rose-400">{last24hBreachesCount}</strong></span>
            <span className="text-emerald-400">LocalStorage</span>
          </div>
        </div>
      </div>

      {/* Real-time Chart & Trend Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold text-slate-300 tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              REAL-TIME ANOMALY TREND (LAST 60 SECONDS)
            </h3>
            {isNearThreshold && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full animate-pulse">
                PROXIMITY WARNING (&lt;10% TO THRESHOLD)
              </span>
            )}
          </div>
          <div className="h-48 w-full bg-slate-950 p-2 rounded-lg border border-slate-900">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history60s}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} unit="%" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#334155', 
                    borderRadius: '8px', 
                    fontSize: '11px',
                    color: '#f8fafc'
                  }} 
                />
                <ReferenceLine 
                  y={threshold * 100} 
                  stroke="#f43f5e" 
                  strokeDasharray="4 4" 
                  strokeWidth={2}
                  className={isNearThreshold ? 'pulsing-threshold-line' : ''}
                  label={{ 
                    value: `Threshold (${(threshold * 100).toFixed(0)}%)`, 
                    fill: isNearThreshold ? '#fda4af' : '#f43f5e', 
                    fontSize: 10,
                    position: 'top' 
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#22d3ee" 
                  strokeWidth={2} 
                  dot={false} 
                  isAnimationActive={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 60s Window Trend Summary */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-slate-300 tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                TREND SUMMARY
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">60s Window</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <BarChart3 className="w-3 h-3 text-cyan-400" />
                  AVERAGE SCORE
                </span>
                <span className="text-slate-500">60s Mean</span>
              </div>
              <div className="text-xl font-black text-cyan-300">
                {average60sScore.toFixed(2)}%
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-cyan-400 h-full transition-all duration-300" 
                  style={{ width: `${Math.min(average60sScore, 100)}%` }} 
                />
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  PEAK SCORE
                </span>
                <span className="text-slate-500">60s High</span>
              </div>
              <div className={`text-xl font-black ${peak60sScore >= threshold * 100 ? 'text-rose-400' : 'text-amber-400'}`}>
                {peak60sScore.toFixed(2)}%
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${peak60sScore >= threshold * 100 ? 'bg-rose-500' : 'bg-amber-400'}`} 
                  style={{ width: `${Math.min(peak60sScore, 100)}%` }} 
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Binary className="w-3 h-3 text-emerald-400" />
              LocalStorage:
            </span>
            <span className="text-emerald-400 font-bold">{breachEvents.length} Saved</span>
          </div>
        </div>
      </div>

      {/* BREACH EVENTS AUDIT TABLE WITH FEATURE 3: 'EXPAND TO VIEW' */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3 relative">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-xs font-semibold text-slate-300 tracking-wider flex items-center gap-2">
              <Table className="w-4 h-4 text-rose-400" />
              DETAILED THRESHOLD BREACH EVENTS AUDIT
            </h3>
            <span className="text-[10px] text-slate-500">
              Persisted in LocalStorage • Auto-logged on Score ≥ {(threshold * 100).toFixed(0)}%
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Auto-Clear Toggle */}
            <button
              onClick={() => setIsAutoClearEnabled(!isAutoClearEnabled)}
              className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isAutoClearEnabled 
                  ? 'bg-amber-950/60 text-amber-400 border-amber-500/40' 
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="Retains only the 5 most recent breach events"
            >
              {isAutoClearEnabled ? <ToggleRight className="w-4 h-4 text-amber-400" /> : <ToggleLeft className="w-4 h-4 text-slate-500" />}
              <span>AUTO-CLEAR</span>
            </button>

            {/* CSV Column Configuration Popup Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowColConfig(!showColConfig)}
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  showColConfig 
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500' 
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>CSV COLUMNS</span>
              </button>

              {showColConfig && (
                <div className="absolute right-0 top-10 z-30 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl w-56 space-y-2 text-xs">
                  <div className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 flex justify-between items-center">
                    <span>Export CSV Columns</span>
                    <button onClick={() => setShowColConfig(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    {Object.keys(csvColumns).map((colKey) => (
                      <label key={colKey} className="flex items-center gap-2 text-slate-300 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={csvColumns[colKey as keyof CSVColumnConfig]}
                          onChange={(e) => setCsvColumns(prev => ({ ...prev, [colKey]: e.target.checked }))}
                          className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0 cursor-pointer"
                        />
                        <span className="capitalize">{colKey.replace(/([A-Z])/g, ' $1')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Clear Logs Button */}
            <button
              onClick={handleClearBreachLogs}
              disabled={breachEvents.length === 0}
              className="px-2.5 py-1.5 bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 disabled:opacity-40 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              CLEAR LOGS
            </button>

            {/* Export Standalone CSV Button */}
            <button
              onClick={() => executeBreachCSVExport(breachEvents)}
              disabled={breachEvents.length === 0}
              className="px-2.5 py-1.5 bg-rose-950/50 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 hover:text-white disabled:opacity-40 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              EXPORT CSV
            </button>
          </div>
        </div>

        {/* Breach Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <div className="max-h-56 overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Event ID</th>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Node ID</th>
                  <th className="py-2.5 px-4">Anomaly Score</th>
                  <th className="py-2.5 px-4">Trigger Type</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                {breachEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500 text-xs">
                      No threshold breach events recorded in history buffer.
                    </td>
                  </tr>
                ) : (
                  breachEvents.map(event => (
                    <tr key={event.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-slate-300">{event.id}</td>
                      <td className="py-2.5 px-4 text-slate-400">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 bg-slate-800 text-cyan-400 rounded border border-slate-700 text-[10px] font-bold">
                          {event.nodeId}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-rose-400">
                        {(event.anomalyScore * 100).toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-4 text-slate-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                        {event.triggerType}
                      </td>
                      
                      {/* FEATURE 3: 'Expand to View' Button */}
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedBreachModal(event)}
                          className="px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 hover:text-white text-[10px] font-bold rounded-md transition-all flex items-center gap-1 ml-auto cursor-pointer"
                          title="Expand to view full telemetry snapshot"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span>Expand to View</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Histogram Chart (60 Mins Frequency) */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-semibold text-slate-300 tracking-wider flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-amber-400" />
            ANOMALY SCORE FREQUENCY DISTRIBUTION (LAST 60 MINUTES)
          </h3>
          <span className="text-[10px] text-amber-400 font-mono">
            60-Min Breach Histogram
          </span>
        </div>
        <div className="h-36 w-full bg-slate-950 p-2 rounded-lg border border-slate-900">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scoreHistogramData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="binRange" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis allowDecimals={false} stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderColor: '#334155', 
                  borderRadius: '8px', 
                  fontSize: '11px',
                  color: '#f8fafc' 
                }} 
                formatter={(value: any) => [`${value} Breaches`, 'Frequency']}
              />
              <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Controls & Pattern Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold text-slate-300 tracking-wider">DETECTED ANOMALY PATTERNS</h3>
            <span className="text-[10px] text-slate-500">{metrics.detectedPatterns.length} Patterns Active</span>
          </div>

          {metrics.detectedPatterns.length === 0 ? (
            <div className="flex items-center justify-center p-8 border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              NO DEVIATIONS DETECTED — TELEMETRY NOMINAL
            </div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {metrics.detectedPatterns.map(pattern => (
                <div key={pattern.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-start justify-between text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-bold text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      {pattern.patternType}
                      <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded">
                        Node {pattern.affectedNode}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{pattern.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-500 block">Confidence</span>
                    <span className="font-bold text-slate-200">{(pattern.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-300 tracking-wider">FAIL-CLOSED SENSITIVITY TUNING</h3>
            
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 font-bold text-slate-300">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  FAIL-CLOSED THRESHOLD
                </span>
                <span className="text-cyan-400 font-black text-sm">
                  {(threshold * 100).toFixed(0)}%
                </span>
              </div>
              <input 
                type="range" 
                min="0.10" 
                max="1.00" 
                step="0.01"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>10% (Strict)</span>
                <span>50% (Balanced)</span>
                <span>100% (Relaxed)</span>
              </div>
            </div>
          </div>

          {isQuarantineActive ? (
            <div className="space-y-2">
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs text-center font-bold flex items-center justify-center gap-2">
                <Lock className="w-4 h-4 animate-bounce" />
                CHAMBER 02 QUARANTINE ENGAGED
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsQuarantineActive(false)}
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] rounded-lg transition-all cursor-pointer"
                >
                  RESET STATE
                </button>
                {onNavigateToQuarantine && (
                  <button
                    onClick={onNavigateToQuarantine}
                    className="flex-1 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 font-semibold text-[11px] rounded-lg transition-all border border-rose-500/40 cursor-pointer"
                  >
                    VIEW CH-02
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsQuarantineActive(true)}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              TRIGGER MANUAL QUARANTINE
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chamber18NeuralSentinel;
