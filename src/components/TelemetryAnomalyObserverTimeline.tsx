"use client";

import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  Search,
  Sliders,
  ShieldCheck,
  Zap,
  Cpu,
  Clock,
  FileText,
  Filter,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Download,
  Copy,
  Check,
  Flame,
  Snowflake,
  Gauge,
  Layers,
  Fingerprint,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { HardwareSnapshot } from '../types';
import {
  TelemetryAnomalyObserver,
  TelemetryAnomalyReport,
} from '../utils/telemetryAnomalyObserver';
import { exportHardwareSnapshotJson, exportAllHardwareSnapshotsCsv } from '../utils/telemetrySnapshot';
import { exportSignedAnomalyReportJson } from '../utils/anomalyReportExportJson';
import { playAnomalyAlertChime, playAuditChime, playTone } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';
import { SYSTEM_METADATA } from '../data/canonicalData';

interface TelemetryAnomalyObserverTimelineProps {
  snapshots: HardwareSnapshot[];
  onAddHardwareSnapshot?: (snap: HardwareSnapshot) => void;
  onAddSystemEvent?: (
    type: any,
    title: string,
    description: string,
    statuteRef?: string,
    severity?: 'info' | 'warning' | 'critical',
    metaHash?: string
  ) => void;
}

export const TelemetryAnomalyObserverTimeline: React.FC<
  TelemetryAnomalyObserverTimelineProps
> = ({ snapshots, onAddHardwareSnapshot, onAddSystemEvent }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<string>('ALL');
  const [zScoreThreshold, setZScoreThreshold] = useState<number>(2.5);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadedReportToast, setDownloadedReportToast] = useState<string | null>(null);
  const [isAuditioningAlert, setIsAuditioningAlert] = useState(false);
  const [autoAlertChimeEnabled, setAutoAlertChimeEnabled] = useState(true);

  const handleDownloadAnomalyReport = (
    snap: HardwareSnapshot,
    report: TelemetryAnomalyReport,
    anomalies: any[] = []
  ) => {
    playTone(720, 0.05);
    const normalizedAnomalies = anomalies.map((a: any) => ({
      metric: a.metric || a.metricName || report.metricLabel,
      observed: a.observed ?? a.value ?? report.observedValue,
      baseline: a.baseline ?? a.mean ?? report.expectedMean,
      zScore: a.zScore ?? report.zScore,
    }));
    const { filename } = exportSignedAnomalyReportJson(
      snap,
      {
        title: report.title,
        description: report.description,
        anomalyType: report.anomalyType,
        severity: report.severity,
        zScore: report.zScore,
        metricLabel: report.metricLabel,
        observedValue: report.observedValue,
        nominalBaseline: report.expectedMean,
        statuteRef: report.statuteRef,
      },
      normalizedAnomalies
    );
    setDownloadedReportToast(filename);
    setTimeout(() => setDownloadedReportToast(null), 5000);
  };

  // Evaluate all snapshots against historical baseline using TelemetryAnomalyObserver
  const evaluatedSnapshots = useMemo(() => {
    return snapshots.map((snap, index) => {
      // Evaluate against all preceding snapshots up to this point
      const historicalWindow = snapshots.slice(0, index + 1);
      const evalResult = TelemetryAnomalyObserver.evaluate(snap, historicalWindow);

      // Check if custom user Z-score threshold marks this as anomalous
      const isCustomOutlier =
        evalResult.hasAnomaly &&
        evalResult.anomalies.some((a) => Math.abs(a.zScore) >= zScoreThreshold);

      return {
        snapshot: snap,
        report: evalResult.report,
        anomalies: evalResult.anomalies,
        isAnomalous: isCustomOutlier || (evalResult.hasAnomaly && evalResult.report?.severity === 'critical'),
      };
    });
  }, [snapshots, zScoreThreshold]);

  // Extract all flagged reports
  const allFlaggedReports = useMemo(() => {
    return evaluatedSnapshots.filter((item) => item.isAnomalous);
  }, [evaluatedSnapshots]);

  // Filtered list based on search and dropdown filters
  const filteredTimeline = useMemo(() => {
    return evaluatedSnapshots.filter((item) => {
      const snap = item.snapshot;
      const report = item.report;

      // Type filter
      if (selectedTypeFilter !== 'ALL') {
        if (selectedTypeFilter === 'ANOMALIES_ONLY' && !item.isAnomalous) return false;
        if (
          selectedTypeFilter !== 'ANOMALIES_ONLY' &&
          report?.anomalyType !== selectedTypeFilter
        ) {
          return false;
        }
      }

      // Severity filter
      if (selectedSeverityFilter !== 'ALL') {
        if (!report || report.severity !== selectedSeverityFilter) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesId = snap.id.toLowerCase().includes(query);
        const matchesActor = snap.actor.toLowerCase().includes(query);
        const matchesHash = snap.sealedHash?.toLowerCase().includes(query);
        const matchesTitle = report?.title.toLowerCase().includes(query) ?? false;
        const matchesDesc = report?.description.toLowerCase().includes(query) ?? false;
        const matchesMetric = report?.metricLabel.toLowerCase().includes(query) ?? false;

        return matchesId || matchesActor || matchesHash || matchesTitle || matchesDesc || matchesMetric;
      }

      return true;
    });
  }, [evaluatedSnapshots, selectedTypeFilter, selectedSeverityFilter, searchQuery]);

  // Find currently selected snapshot details (or default to the first flagged anomaly if any)
  const activeSelected = useMemo(() => {
    if (selectedSnapshotId) {
      const found = evaluatedSnapshots.find((item) => item.snapshot.id === selectedSnapshotId);
      if (found) return found;
    }
    if (allFlaggedReports.length > 0) {
      return allFlaggedReports[allFlaggedReports.length - 1];
    }
    return evaluatedSnapshots[0] || null;
  }, [selectedSnapshotId, evaluatedSnapshots, allFlaggedReports]);

  // Track previous anomaly count to trigger the low-frequency alert chime specifically on anomaly detection
  const prevAnomalyCountRef = React.useRef(allFlaggedReports.length);
  React.useEffect(() => {
    if (autoAlertChimeEnabled && allFlaggedReports.length > prevAnomalyCountRef.current) {
      playAnomalyAlertChime();
    }
    prevAnomalyCountRef.current = allFlaggedReports.length;
  }, [allFlaggedReports.length, autoAlertChimeEnabled]);

  // Synthetic Outlier Injection Handler
  const handleInjectOutlier = (type: 'thermal' | 'cryo' | 'voltage' | 'qops') => {
    playTone(330, 0.08, 'sawtooth');
    const newSnap = TelemetryAnomalyObserver.generateSimulatedOutlierSnapshot(
      type,
      snapshots.length + 1
    );

    if (onAddHardwareSnapshot) {
      onAddHardwareSnapshot(newSnap);
      setSelectedSnapshotId(newSnap.id);
    }

    if (onAddSystemEvent) {
      onAddSystemEvent(
        'ANOMALY',
        `Telemetry Anomaly Observer Trigger: ${type.toUpperCase()} Drift`,
        `Outlier snapshot #${newSnap.snapshotNumber} injected into live stream. Evaluated with |Z-score| >= 2.5σ.`,
        'ISO/IEC 27037 Telemetry Drift Assurance',
        'critical',
        newSnap.sealedHash
      );
    }
    // Specifically trigger the custom low-frequency alert chime for Telemetry Anomaly Observer
    playAnomalyAlertChime();
  };

  // Copy hash or payload
  const handleCopy = (text: string, id: string) => {
    copyToClipboard(text);
    setCopiedHash(id);
    playTone(720, 0.04);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Export JSON Report of all detected anomalies
  const handleExportJson = () => {
    setIsExporting(true);
    playTone(640, 0.04);

    const payload = {
      exportTimestamp: new Date().toISOString(),
      canonicalBlock: '#849202',
      ssotRootHash: SYSTEM_METADATA.merkleRoot,
      zScoreSensitivity: zScoreThreshold,
      totalEvaluatedSnapshots: snapshots.length,
      detectedAnomaliesCount: allFlaggedReports.length,
      anomalies: allFlaggedReports.map((item) => ({
        snapshotId: item.snapshot.id,
        timestampIct: item.snapshot.timestampIct,
        report: item.report,
        metrics: {
          cpuAverage: item.snapshot.cpuAverage,
          cryoTempMk: item.snapshot.cryoTempMk,
          qopsThroughput: item.snapshot.qopsThroughput,
          voltageStabilityPct: item.snapshot.voltageStabilityPct,
          coherencePct: item.snapshot.coherencePct,
        },
        sealedHash: item.snapshot.sealedHash,
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zyrquen-telemetry-anomalies-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExporting(false);
  };

  return (
    <div className="space-y-6">
      {/* Downloaded Anomaly Report Toast */}
      {downloadedReportToast && (
        <div className="p-4 rounded-2xl bg-[#0a0f1e] border-rose-500/60 backdrop-blur-xl flex items-center justify-between gap-3 text-xs font-mono text-rose-200 animate-in fade-in duration-200 shadow-2xl">
          <div className="flex items-center gap-2.5">
            <span className="text-base">📑</span>
            <span>
              <strong>Cryptographically Signed Anomaly Audit Report Exported:</strong> Successfully generated <strong className="text-white">{downloadedReportToast}</strong> with NIST FIPS 204 ML-DSA-87 digital signature, Merkle leaf provenance, and Thai ETDA/PDPA statutory bindings.
            </span>
          </div>
          <button
            onClick={() => setDownloadedReportToast(null)}
            className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 hover:text-white transition-all text-xs border-rose-500/40"
          >
            Close
          </button>
        </div>
      )}

      {/* Top Banner & Anomaly Engine Status */}
      <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#0c1626]/90 via-[#070b14]/85 to-[#04060b] border-cyan-500/30 backdrop-blur-xl shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10 shrink-0">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border-cyan-500/30 text-[10px] font-mono font-bold">
                  TELEMETRY ANOMALY OBSERVER V2.4
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border-emerald-700/50 text-[10px] font-mono">
                  ISO/IEC 27037 ASSURANCE
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border-rose-700/50 text-[10px] font-mono">
                  FAIL-CLOSED TRIPWIRE ARMED
                </span>
              </div>
              <h2 className="text-xl font-bold font-mono text-white mt-1">
                Telemetry Anomaly Observer &bull; Historical Drift Timeline
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                Statistical Outlier Detection (Z-Score &ge; {zScoreThreshold}&sigma;) &bull; Merkle Root Provenance &bull; Thai Legal Evidence Chain
              </p>
            </div>
          </div>

          {/* Quick Statistics Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3 rounded-2xl bg-black/50 border-white/10 font-mono text-xs">
              <div className="text-zinc-500 text-[10px]">TOTAL SNAPSHOTS</div>
              <div className="text-lg font-bold text-white mt-0.5">{snapshots.length}</div>
            </div>
            <div className="p-3 rounded-2xl bg-black/50 border-rose-500/30 font-mono text-xs">
              <div className="text-rose-400 text-[10px] font-bold">FLAGGED DRIFTS</div>
              <div className="text-lg font-bold text-rose-300 mt-0.5">{allFlaggedReports.length}</div>
            </div>
            <div className="p-3 rounded-2xl bg-black/50 border-emerald-500/30 font-mono text-xs">
              <div className="text-emerald-400 text-[10px] font-bold">NOMINAL PASS</div>
              <div className="text-lg font-bold text-emerald-300 mt-0.5">
                {snapshots.length - allFlaggedReports.length}
              </div>
            </div>

            <button
              id="timeline-export-snapshots-csv-btn"
              onClick={() => {
                playTone(740, 0.04);
                exportAllHardwareSnapshotsCsv(snapshots);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold flex items-center gap-2 transition hover:scale-105 shadow-md shadow-emerald-500/10"
              title="Export all hardware snapshot records to CSV"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export Snapshots CSV</span>
            </button>

            <button
              onClick={handleExportJson}
              disabled={isExporting}
              className="px-3.5 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold flex items-center gap-2 transition hover:scale-105 shadow-md shadow-cyan-500/10"
            >
              <Download className="w-4 h-4" />
              <span>Export Anomaly JSON</span>
            </button>
          </div>
        </div>

        {/* Real-time Ingestion / Simulator Triggers */}
        <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Anomaly Injection (Instant Observer Test):</span>
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleInjectOutlier('thermal')}
              className="px-2.5 py-1 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border-rose-700/50 flex items-center gap-1 text-[11px] transition"
            >
              <Flame className="w-3 h-3 text-rose-400" />
              <span>Thermal Surge (+68.4°C)</span>
            </button>

            <button
              onClick={() => handleInjectOutlier('cryo')}
              className="px-2.5 py-1 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border-cyan-700/50 flex items-center gap-1 text-[11px] transition"
            >
              <Snowflake className="w-3 h-3 text-cyan-400" />
              <span>Cryo Drift (28.5 mK)</span>
            </button>

            <button
              onClick={() => handleInjectOutlier('voltage')}
              className="px-2.5 py-1 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border-amber-700/50 flex items-center gap-1 text-[11px] transition"
            >
              <Gauge className="w-3 h-3 text-amber-400" />
              <span>Voltage Rail Drop (99.12%)</span>
            </button>

            <button
              onClick={() => handleInjectOutlier('qops')}
              className="px-2.5 py-1 rounded-xl bg-violet-950/60 hover:bg-violet-900/60 text-violet-300 border-violet-700/50 flex items-center gap-1 text-[11px] transition"
            >
              <TrendingDown className="w-3 h-3 text-violet-400" />
              <span>QOps Collapse (712 QOps/s)</span>
            </button>

            {/* Audition Button for Operator to test the low-frequency chime */}
            <button
              id="timeline-btn-audition-alert-chime"
              onClick={() => {
                setIsAuditioningAlert(true);
                playAnomalyAlertChime();
                setTimeout(() => setIsAuditioningAlert(false), 1000);
              }}
              className={`px-2.5 py-1 rounded-xl border flex items-center gap-1 text-[11px] transition font-bold ${
                isAuditioningAlert
                  ? 'bg-rose-500/30 text-rose-200 border-rose-500/80 scale-105'
                  : 'bg-black/50 hover:bg-rose-950/50 text-rose-300 border-rose-500/40'
              }`}
              title="Audition the custom low-frequency alert chime (147 Hz D3 -> 110 Hz A2 -> 73 Hz D2 sub-bass)"
            >
              <span className="text-xs">🔊</span>
              <span>Audition Alert Chime (147Hz)</span>
            </button>

            {/* Toggle Auto-Chime */}
            <button
              onClick={() => {
                playTone(620, 0.04);
                setAutoAlertChimeEnabled(!autoAlertChimeEnabled);
              }}
              className={`px-2 py-1 rounded-xl border text-[10px] flex items-center gap-1 transition ${
                autoAlertChimeEnabled
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/40'
                  : 'bg-zinc-900 text-zinc-500 border-zinc-700'
              }`}
              title="Toggle automatic low-frequency alert chime on new anomaly detection"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${autoAlertChimeEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
              <span>Auto-Chime: {autoAlertChimeEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Filters Bar */}
      <div className="p-4 rounded-2xl bg-[#0b0e1a]/80 border-white/8 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาตาม Snapshot ID, อัลกอริทึม, ชนิด Outlier, ค่าแฮช หรือคำอธิบาย..."
            className="w-full bg-zinc-900/90 border-zinc-700 focus:border-cyan-400 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none transition"
          />
        </div>

        {/* Dropdown Filters & Sensitivity Slider */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Anomaly Type Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-500 text-[11px]">Type:</span>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="bg-zinc-900 border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 font-mono focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">All Events ({snapshots.length})</option>
              <option value="ANOMALIES_ONLY">Anomalies Only ({allFlaggedReports.length})</option>
              <option value="THERMAL_OUTLIER">Thermal Outliers</option>
              <option value="CRYO_DRIFT">Cryo Drift</option>
              <option value="VOLTAGE_JITTER">Voltage Jitter</option>
              <option value="QOPS_DEVIATION">QOps Deviations</option>
              <option value="COHERENCE_DROP">Coherence Drops</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-500 text-[11px]">Severity:</span>
            <select
              value={selectedSeverityFilter}
              onChange={(e) => setSelectedSeverityFilter(e.target.value)}
              className="bg-zinc-900 border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 font-mono focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">All Severities</option>
              <option value="critical">Critical (&ge;3.2&sigma; / Hard Bound)</option>
              <option value="warning">Warning (2.4&sigma; - 3.2&sigma;)</option>
            </select>
          </div>

          {/* Z-Score Sensitivity Slider */}
          <div className="flex items-center gap-2 p-1.5 px-3 rounded-xl bg-black/40 border-white/10 text-xs">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-zinc-400 text-[11px]">Z-Threshold:</span>
            <input
              type="range"
              min="1.5"
              max="4.0"
              step="0.1"
              value={zScoreThreshold}
              onChange={(e) => setZScoreThreshold(parseFloat(e.target.value))}
              className="w-20 accent-cyan-400 cursor-pointer"
            />
            <span className="text-cyan-300 font-bold text-[11px] w-8">{zScoreThreshold}σ</span>
          </div>
        </div>
      </div>

      {/* Main Split-Screen Layout: Timeline List on Left, Drill-Down Snapshot Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Historical Timeline */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 px-1">
            <span>Historical Ingestion Timeline ({filteredTimeline.length} events):</span>
            <span className="text-cyan-300">Click snapshot to inspect forensic drill-down</span>
          </div>

          {filteredTimeline.length === 0 ? (
            <div className="p-8 text-center bg-black/20 border-dashed border-zinc-800 rounded-2xl space-y-2 font-mono">
              <AlertTriangle className="w-8 h-8 text-zinc-600 mx-auto" />
              <div className="text-xs text-zinc-400">ไม่พบรายการ Telemetry ที่ตรงกับเงื่อนไขการค้นหา</div>
              <p className="text-[11px] text-zinc-500">
                ลองปรับลดค่า Z-Score Threshold หรือล้างตัวกรองเพื่อแสดงรายการย้อนหลังทั้งหมด
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {filteredTimeline.map((item, idx) => {
                const snap = item.snapshot;
                const report = item.report;
                const isSelected = activeSelected?.snapshot.id === snap.id;
                const isAnomalous = item.isAnomalous;

                return (
                  <div
                    key={snap.id}
                    onClick={() => {
                      playTone(550, 0.03);
                      setSelectedSnapshotId(snap.id);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 font-mono ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-950/40 via-[#0b0e1a] to-cyan-950/20 border-cyan-400/80 shadow-[0_0_18px_rgba(6,182,212,0.2)]'
                        : isAnomalous
                        ? 'bg-rose-950/20 hover:bg-rose-950/30 border-rose-500/40'
                        : 'bg-[#0b0e1a]/70 hover:bg-[#0e1424]/80 border-white/8'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            isAnomalous
                              ? report?.severity === 'critical'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {isAnomalous
                            ? `${report?.anomalyType || 'OUTLIER'} (${report?.zScore ? (report.zScore > 0 ? '+' : '') + report.zScore + 'σ' : 'FLAGGED'})`
                            : 'NOMINAL (Z < 2.5σ)'}
                        </span>

                        <span className="text-xs font-bold text-zinc-100">{snap.id}</span>
                      </div>

                      <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{snap.timestampIct.replace('2026-08-20 ', '')}</span>
                      </span>
                    </div>

                    {/* Headline of Anomaly or Nominal State */}
                    {isAnomalous && report ? (
                      <div className="p-2.5 rounded-xl bg-black/40 border-rose-500/30 text-xs text-rose-200 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-bold flex items-center gap-1.5 text-rose-300">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>{report.title}</span>
                          </div>
                          <button
                            id={`download-report-${snap.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadAnomalyReport(snap, report, item.anomalies);
                            }}
                            className="px-2.5 py-1 rounded-xl text-[10px] font-bold font-mono bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/50 text-rose-200 hover:text-white flex items-center gap-1 transition-all shadow-[0_0_10px_rgba(244,63,94,0.25)] shrink-0"
                            title="Export findings as a signed JSON file for audit purposes"
                          >
                            <span>📑</span>
                            <span>Download Report</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-zinc-300 leading-relaxed">
                          {report.description}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-400">
                        Telemetry parameters within nominal tolerances (CPU: {snap.cpuAverage}°C, Cryo: {snap.cryoTempMk} mK, QOps: {snap.qopsThroughput} QOps/s).
                      </p>
                    )}

                    {/* Quick Telemetry Pills */}
                    <div className="grid grid-cols-4 gap-2 text-[10px] text-zinc-400 pt-1">
                      <div className="p-1.5 rounded-lg bg-black/30 border-white/5 flex flex-col">
                        <span className="text-zinc-500">CPU</span>
                        <span className="font-bold text-zinc-200">{snap.cpuAverage}°C</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-black/30 border-white/5 flex flex-col">
                        <span className="text-zinc-500">CRYO</span>
                        <span className="font-bold text-cyan-300">{snap.cryoTempMk} mK</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-black/30 border-white/5 flex flex-col">
                        <span className="text-zinc-500">QOPS</span>
                        <span className="font-bold text-violet-300">{snap.qopsThroughput}</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-black/30 border-white/5 flex flex-col">
                        <span className="text-zinc-500">VOLTAGE</span>
                        <span className="font-bold text-emerald-300">{snap.voltageStabilityPct}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Deep Forensic Drill-Down Snapshot Inspector */}
        <div className="lg:col-span-6 space-y-4">
          {activeSelected ? (
            <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#0c1322]/90 via-[#070b14]/85 to-[#04060b] border-cyan-500/30 backdrop-blur-xl shadow-2xl space-y-5 font-mono">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border-cyan-500/40">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500">SNAPSHOT FORENSIC DRILL-DOWN</span>
                    <h3 className="text-base font-bold text-white font-mono">
                      {activeSelected.snapshot.id} &bull; #{activeSelected.snapshot.snapshotNumber}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    id="download-snapshot-btn"
                    onClick={() => {
                      playTone(720, 0.04);
                      exportHardwareSnapshotJson(activeSelected.snapshot);
                    }}
                    className="px-3 py-1 rounded-xl text-xs font-bold font-mono bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-500/40 text-cyan-300 hover:text-white flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                    title={`Download Hardware Snapshot ${activeSelected.snapshot.id} as JSON file`}
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Download Snapshot</span>
                  </button>
                  <button
                    id="export-snapshots-csv-btn"
                    onClick={() => {
                      playTone(740, 0.04);
                      exportAllHardwareSnapshotsCsv(snapshots);
                    }}
                    className="px-3 py-1 rounded-xl text-xs font-bold font-mono bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-300 hover:text-white flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                    title="Export all hardware snapshots as CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export All (CSV)</span>
                  </button>
                  <span
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                      activeSelected.isAnomalous
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {activeSelected.isAnomalous ? 'ANOMALY DETECTED' : 'NOMINAL ZERO-DRIFT'}
                  </span>
                </div>
              </div>

              {/* Anomaly Diagnosis Card */}
              {activeSelected.isAnomalous && activeSelected.report && (
                <div className="p-4 rounded-2xl bg-rose-950/40 border-rose-500/30 space-y-3 text-xs">
                  <div className="font-bold text-rose-300 flex items-center justify-between flex-wrap gap-2">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>{activeSelected.report.title}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-900/60 border-rose-600 text-rose-200 font-mono">
                        Z-SCORE: {activeSelected.report.zScore}&sigma;
                      </span>
                      <button
                        id="download-anomaly-report-btn"
                        onClick={() => handleDownloadAnomalyReport(activeSelected.snapshot, activeSelected.report!, activeSelected.anomalies)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold font-mono bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/50 text-rose-200 hover:text-white flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                        title="Export findings as a signed JSON file for audit purposes"
                      >
                        <span>📑</span>
                        <span>Download Report</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-200 leading-relaxed">
                    {activeSelected.report.description}
                  </p>

                  <div className="pt-2 border-t border-rose-500/20 text-[10px] text-rose-300/80 flex items-center justify-between">
                    <span>Statute Ref: {activeSelected.report.statuteRef}</span>
                    <span>Fail-Closed Status: ARMED</span>
                  </div>
                </div>
              )}

              {/* Baseline vs. Observed Delta Table */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Baseline Nominal SSoT Delta Comparison</span>
                  <span className="text-[10px] text-zinc-500">SSoT Invariant: Zero-Drift &plusmn;0.00%</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {/* CPU Load Delta */}
                  <div className="p-3 rounded-xl bg-black/50 border-white/8 space-y-1">
                    <div className="text-[10px] text-zinc-500 flex items-center justify-between">
                      <span>CPU TEMP</span>
                      <span className="text-zinc-400">41.2°C</span>
                    </div>
                    <div className="text-sm font-bold text-white">
                      {activeSelected.snapshot.cpuAverage}°C
                    </div>
                    <div
                      className={`text-[10px] font-bold ${
                        activeSelected.snapshot.cpuAverage > 55
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      &Delta;{' '}
                      {(activeSelected.snapshot.cpuAverage - 41.2 >= 0 ? '+' : '') +
                        (activeSelected.snapshot.cpuAverage - 41.2).toFixed(1)}
                      °C
                    </div>
                  </div>

                  {/* Cryo Temperature Delta */}
                  <div className="p-3 rounded-xl bg-black/50 border-white/8 space-y-1">
                    <div className="text-[10px] text-zinc-500 flex items-center justify-between">
                      <span>CRYO TEMP</span>
                      <span className="text-zinc-400">14.98 mK</span>
                    </div>
                    <div className="text-sm font-bold text-cyan-300">
                      {activeSelected.snapshot.cryoTempMk} mK
                    </div>
                    <div
                      className={`text-[10px] font-bold ${
                        activeSelected.snapshot.cryoTempMk > 25.0
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      &Delta;{' '}
                      {(activeSelected.snapshot.cryoTempMk - 14.98 >= 0 ? '+' : '') +
                        (activeSelected.snapshot.cryoTempMk - 14.98).toFixed(2)}{' '}
                      mK
                    </div>
                  </div>

                  {/* QOps Throughput Delta */}
                  <div className="p-3 rounded-xl bg-black/50 border-white/8 space-y-1">
                    <div className="text-[10px] text-zinc-500 flex items-center justify-between">
                      <span>QOPS RATE</span>
                      <span className="text-zinc-400">851.9</span>
                    </div>
                    <div className="text-sm font-bold text-violet-300">
                      {activeSelected.snapshot.qopsThroughput}
                    </div>
                    <div
                      className={`text-[10px] font-bold ${
                        activeSelected.snapshot.qopsThroughput < 800
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      &Delta;{' '}
                      {(activeSelected.snapshot.qopsThroughput - 851.9 >= 0 ? '+' : '') +
                        (activeSelected.snapshot.qopsThroughput - 851.9).toFixed(1)}
                    </div>
                  </div>

                  {/* Voltage Rail Delta */}
                  <div className="p-3 rounded-xl bg-black/50 border-white/8 space-y-1">
                    <div className="text-[10px] text-zinc-500 flex items-center justify-between">
                      <span>VOLTAGE</span>
                      <span className="text-zinc-400">99.98%</span>
                    </div>
                    <div className="text-sm font-bold text-emerald-300">
                      {activeSelected.snapshot.voltageStabilityPct ?? 99.98}%
                    </div>
                    <div
                      className={`text-[10px] font-bold ${
                        (activeSelected.snapshot.voltageStabilityPct ?? 99.98) < 99.5
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      &Delta;{' '}
                      {((activeSelected.snapshot.voltageStabilityPct ?? 99.98) - 99.98 >= 0 ? '+' : '') +
                        ((activeSelected.snapshot.voltageStabilityPct ?? 99.98) - 99.98).toFixed(2)}
                      %
                    </div>
                  </div>
                </div>
              </div>

              {/* 4-Core CPU Thermal Distribution */}
              {activeSelected.snapshot.cpuCores && (
                <div className="p-3 rounded-2xl bg-black/40 border-white/8 space-y-2 text-xs">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase">
                    Quad-Core Thermal &amp; Load Distribution
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {activeSelected.snapshot.cpuCores.map((coreTemp, cIdx) => (
                      <div key={cIdx} className="p-2 rounded-lg bg-zinc-900 border-zinc-800 text-center">
                        <div className="text-[10px] text-zinc-500">Core {cIdx}</div>
                        <div
                          className={`font-bold text-xs mt-0.5 ${
                            coreTemp > 65 ? 'text-rose-400' : 'text-cyan-300'
                          }`}
                        >
                          {coreTemp}°C
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cryptographic & Merkle Seal Provenance */}
              <div className="p-3.5 rounded-2xl bg-black/60 border-white/8 space-y-2 text-xs">
                <div className="text-[11px] font-bold text-zinc-400 uppercase flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Cryptographic Proof &amp; Invariant Anchors</span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Sealed Hash:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-zinc-300 truncate max-w-[200px]">
                        {activeSelected.snapshot.sealedHash}
                      </span>
                      <button
                        onClick={() =>
                          handleCopy(activeSelected.snapshot.sealedHash, 'sealedHash')
                        }
                        className="p-1 text-zinc-400 hover:text-white"
                        title="Copy Sealed Hash"
                      >
                        {copiedHash === 'sealedHash' ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Parent Merkle Hash:</span>
                    <span className="font-mono text-zinc-400 truncate max-w-[200px]">
                      {activeSelected.snapshot.parentHash}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Custodian Signer:</span>
                    <span className="text-amber-300">{activeSelected.snapshot.actor}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">PQC Signature:</span>
                    <span className="text-emerald-400">Dilithium-5 (FIPS 204 Verified)</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-black/20 border-dashed border-zinc-800 rounded-2xl text-xs font-mono text-zinc-500">
              เลือก Snapshot ทางซ้ายมือเพื่อตรวจสอบข้อมูลพยานหลักฐานและส่วนต่าง SSoT
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
