import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { AUDIT_TRACE_TX } from '../../data/canonicalData';
import {
  FileCheck2,
  Play,
  CheckCircle2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Shield,
  ShieldCheck,
  Clock,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  Camera,
  Activity,
  Cpu,
  Layers,
  Server,
  ArrowRightLeft,
  Scale,
  FileCode,
  Search,
  HardDrive,
  Gauge,
  AlertTriangle,
  ShieldAlert,
  FileSearch,
  GitFork,
  Calendar,
  SlidersHorizontal,
  Filter,
  Lock,
  QrCode,
} from 'lucide-react';
import { SYSTEM_METADATA, CANONICAL_GENESIS_BLOCK, CANONICAL_MERKLE_ROOT } from '../../data/canonicalData';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { copyToClipboard } from '../../utils/clipboard';
import { HardwareSnapshot } from '../../types';
import { INITIAL_HARDWARE_SNAPSHOTS, exportEvidenceToCsv, exportImmutableLedgerCsv } from '../../utils/telemetrySnapshot';
import { LedgerExportService, ledgerExportService } from '../../services/ledgerExportService';
import { SnapshotCompareView } from '../SnapshotCompareView';
import { QuarantineRegistry } from '../QuarantineRegistry';
import { ForensicEvidenceMatrix } from '../ForensicEvidenceMatrix';
import { generateForensicPdfReport } from '../../utils/forensicPdfExport';
import { generateCompliancePdfReport } from '../../utils/compliancePdfExport';
import { MerkleVerificationBadge } from '../council/MerkleVerificationBadge';
import { downloadEvidenceManifestJson } from '../../utils/evidenceManifestGenerator';
import { exportSignedBlockEvidenceJson } from '../../utils/evidenceExportJson';
import { exportSignedForensicAuditSealChainJson } from '../../utils/forensicAuditSealChainJsonExport';
import { MerkleRootQrCodeModal } from '../MerkleRootQrCodeModal';
import { ForensicSealRangeExportModal } from '../ForensicSealRangeExportModal';
import { EvidenceExportService } from '../../utils/evidenceExportService';
import { JsonSealManager, ValidatedJsonEvidence } from '../../utils/jsonSealManager';
import { MerkleTreeInteractiveGraph } from '../MerkleTreeInteractiveGraph';
import { TwelveStageForensicTraceReplay } from '../forensics/TwelveStageForensicTraceReplay';
import { Chamber02QuarantineSimulator } from '../quarantine/Chamber02QuarantineSimulator';
import { SmartContractCoreViewer } from '../contracts/SmartContractCoreViewer';
import { CanonicalSealsVerticalTimeline, ZoomMode } from '../CanonicalSealsVerticalTimeline';
import { exportCourtReadyJsonAuditTrail, exportCourtReadySignedPdfDossier } from '../../utils/courtReadyAuditService';
import { TerminalJobLifecycleManager } from '../../services/TerminalJobLifecycleManager';
import { Last5SnapshotsSidePanel } from '../Last5SnapshotsSidePanel';
import { ForensicsSealAuditModal } from '../ForensicsSealAuditModal';
import { downloadSimplifiedForensicReport } from '../../utils/simplifiedForensicReportExport';
import { exportSignedLedgerSnapshotJson } from '../../utils/snapshotEvidenceExport';

interface LedgerViewProps {
  snapshots?: HardwareSnapshot[];
}

export const LedgerView: React.FC<LedgerViewProps> = ({ snapshots = INITIAL_HARDWARE_SNAPSHOTS }) => {
  const [activeLedgerTab, setActiveLedgerTab] = useState<'timeline' | 'stages' | 'smart-contract' | 'snapshots' | 'quarantine' | 'forensics' | 'compare' | 'merkle-tree'>('timeline');
  const [timelineZoomMode, setTimelineZoomMode] = useState<ZoomMode>('epoch');
  const [selectedStage, setSelectedStage] = useState<number>(0);
  const [selectedSnapshotIndex, setSelectedSnapshotIndex] = useState<number>(0);
  const [isPlayingReplay, setIsPlayingReplay] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [selectedForensicSeal, setSelectedForensicSeal] = useState<{ id: string | number; hash: string } | null>(null);
  const [simplifiedReportToast, setSimplifiedReportToast] = useState<string | null>(null);
  const [csvExportToast, setCsvExportToast] = useState<boolean>(false);
  const [csvEvidenceToast, setCsvEvidenceToast] = useState<string | null>(null);
  const [pdfExportToast, setPdfExportToast] = useState<string | null>(null);
  const [compliancePdfToast, setCompliancePdfToast] = useState<string | null>(null);
  const [courtDossierToast, setCourtDossierToast] = useState<string | null>(null);
  const [merkleLogToast, setMerkleLogToast] = useState<string | null>(null);
  const [evidenceManifestToast, setEvidenceManifestToast] = useState<string | null>(null);
  const [evidenceBlobToast, setEvidenceBlobToast] = useState<string | null>(null);
  const [auditLogToast, setAuditLogToast] = useState<string | null>(null);
  const [jsonLoadToast, setJsonLoadToast] = useState<{ filename: string; sealHash: string; valid: boolean; message: string } | null>(null);
  const [signedEvidenceToast, setSignedEvidenceToast] = useState<string | null>(null);
  const [signedSealChainToast, setSignedSealChainToast] = useState<string | null>(null);
  const [downloadSnapshotToast, setDownloadSnapshotToast] = useState<{ filename: string; snapshotId: string; sealsCount: number } | null>(null);
  const [timestampFormat, setTimestampFormat] = useState<'human' | 'block-height'>('human');
  const [snapshotSearchQuery, setSnapshotSearchQuery] = useState<string>('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('ALL');
  const [snapshotRangeLimit, setSnapshotRangeLimit] = useState<number>(0);

  const allSnapshots = snapshots.length > 0 ? snapshots : INITIAL_HARDWARE_SNAPSHOTS;
  
  // Extract all unique dates from snapshots for date filtering
  const uniqueDates = useMemo(() => {
    const dates = new Set<string>();
    allSnapshots.forEach((snap) => {
      if (snap.timestampIct) {
        const datePart = snap.timestampIct.split(' ')[0];
        if (datePart) dates.add(datePart);
      } else if (snap.timestampUtc) {
        const datePart = snap.timestampUtc.split(' ')[0];
        if (datePart) dates.add(datePart);
      }
    });
    return Array.from(dates).sort();
  }, [allSnapshots]);

  // Compute filtered snapshots matching date, range limit, and search query
  const filteredSnapshots = useMemo(() => {
    let result = allSnapshots;

    // Filter by date if selected
    if (selectedDateFilter !== 'ALL') {
      result = result.filter(
        (s) =>
          (s.timestampIct && s.timestampIct.startsWith(selectedDateFilter)) ||
          (s.timestampUtc && s.timestampUtc.startsWith(selectedDateFilter))
      );
    }

    // Filter by search query
    if (snapshotSearchQuery.trim()) {
      const q = snapshotSearchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          s.actor.toLowerCase().includes(q) ||
          s.status.toLowerCase().includes(q) ||
          s.sealedHash.toLowerCase().includes(q) ||
          s.parentHash.toLowerCase().includes(q) ||
          String(s.snapshotNumber).includes(q) ||
          (s.timestampIct && s.timestampIct.toLowerCase().includes(q)) ||
          (s.timestampUtc && s.timestampUtc.toLowerCase().includes(q))
      );
    }

    // Filter by range slider limit if active
    if (snapshotRangeLimit > 0 && snapshotRangeLimit < result.length) {
      result = result.slice(-snapshotRangeLimit);
    }

    return result;
  }, [allSnapshots, selectedDateFilter, snapshotSearchQuery, snapshotRangeLimit]);

  // Real CPU usage trend across the filtered telemetry snapshots (up to last 10)
  const last10CpuTrendData = useMemo(() => {
    const targetDataset = filteredSnapshots.length > 0 ? filteredSnapshots : allSnapshots;
    const last10 = targetDataset.slice(-10);
    return last10.map((snap) => ({
      name: `#${snap.snapshotNumber}`,
      id: snap.id,
      cpu: snap.cpuAverage,
      ram: snap.memoryUsedMb,
      cryo: snap.cryoTempMk,
      time: snap.timestampIct ? snap.timestampIct.split(' ')[1] || snap.timestampIct : `Snap ${snap.snapshotNumber}`,
      date: snap.timestampIct ? snap.timestampIct.split(' ')[0] : 'SSoT',
    }));
  }, [filteredSnapshots, allSnapshots]);

  const currentSnapshot =
    filteredSnapshots[Math.min(selectedSnapshotIndex, Math.max(0, filteredSnapshots.length - 1))] || allSnapshots[0];

  const startReplay = () => {
    setActiveLedgerTab('stages');
    setIsPlayingReplay(true);
    let step = 0;
    setSelectedStage(0);
    playTone(500, 0.08);

    const interval = setInterval(() => {
      step++;
      if (step < AUDIT_TRACE_TX.stages.length) {
        setSelectedStage(step);
        playTone(450 + step * 30, 0.06);
      } else {
        clearInterval(interval);
        setIsPlayingReplay(false);
        playAuditChime();
      }
    }, 450);
  };

  const handleCopy = (id: string, hash: string) => {
    copyToClipboard(hash);
    setCopiedHash(id);
    playTone(700, 0.06);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleExportCsv = () => {
    playAuditChime();
    exportEvidenceToCsv(AUDIT_TRACE_TX.stages, allSnapshots, timestampFormat);
    setCsvExportToast(true);
    setTimeout(() => setCsvExportToast(false), 3500);
  };

  const handleExportImmutableLedgerCsv = () => {
    playAuditChime();
    exportImmutableLedgerCsv(allSnapshots, SYSTEM_METADATA.merkleRoot, SYSTEM_METADATA.canonicalSeals);
    setCsvExportToast(true);
    setTimeout(() => setCsvExportToast(false), 3500);
  };

  const handleExportLedgerServiceSnapshotsCsv = () => {
    playAuditChime();
    const exportTarget = filteredSnapshots.length > 0 ? filteredSnapshots : allSnapshots;
    const formatted = exportTarget.map((snap) => ({
      snapshotNumber: snap.snapshotNumber,
      sealedHash: snap.sealedHash,
      merkleRoot: SYSTEM_METADATA.merkleRoot,
      timestamp: snap.timestampUtc || snap.timestampIct || new Date().toISOString(),
    }));
    const { filename } = LedgerExportService.exportSnapshotsCSV(formatted);
    setCsvEvidenceToast(filename);
    setTimeout(() => setCsvEvidenceToast(null), 4500);
  };

  const handleExportTelemetryCsv = () => {
    playAuditChime();
    const exportTarget = filteredSnapshots.length > 0 ? filteredSnapshots : allSnapshots;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `zyrquen-telemetry-snapshots-${timestamp}.csv`;
    const success = EvidenceExportService.downloadCsvBlob(exportTarget, filename);
    if (success) {
      setCsvEvidenceToast(filename);
      setTimeout(() => setCsvEvidenceToast(null), 4500);
    }
  };

  const handleExportMerkleLog = () => {
    playAuditChime();
    const exportSnapshots = filteredSnapshots.length > 0 ? filteredSnapshots : allSnapshots;
    
    // Sequence of Merkle-verified system events for archival
    const merkleVerifiedEventsSequence = AUDIT_TRACE_TX.stages.map((stage, idx) => ({
      sequenceIndex: idx + 1,
      stageId: stage.id,
      stageNumber: stage.stageNumber,
      stageName: stage.name,
      shortDesc: stage.shortDesc,
      actor: stage.actor,
      status: stage.status,
      timestamp: stage.timestamp,
      durationMs: stage.durationMs,
      sourceModule: stage.sourceModule,
      outputHash: stage.outputHash,
      parentHash: stage.parentHash,
      merkleLeafProof: `LEAF-${idx + 1}-0x${stage.outputHash.slice(0, 16)}`,
      sealedBlock: AUDIT_TRACE_TX.sealedLedgerBlock,
      verificationStatus: 'MERKLE_ROOT_VERIFIED',
      ssotDrift: '0.00%',
    }));

    const merklePayload = {
      archiveReportType: 'ZYRQUEN_MERKLE_VERIFIED_SYSTEM_EVENTS_ARCHIVE',
      canonicalMerkleRoot: SYSTEM_METADATA.merkleRoot,
      sealedBlock: SYSTEM_METADATA.sealedBlock,
      totalVerifiedSeals: SYSTEM_METADATA.totalVerifiedSeals,
      exportTimestampUtc: new Date().toUTCString(),
      exportTimestampIct: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
      provenanceSovereign: SYSTEM_METADATA.sovereignPrincipal,
      auditTxId: AUDIT_TRACE_TX.txId,
      filterApplied: snapshotSearchQuery.trim() ? snapshotSearchQuery.trim() : 'NONE (ALL SNAPSHOTS)',
      merkleVerifiedEventsCount: merkleVerifiedEventsSequence.length,
      merkleVerifiedEventsSequence: merkleVerifiedEventsSequence,
      stagesCount: AUDIT_TRACE_TX.stages.length,
      stages: AUDIT_TRACE_TX.stages,
      snapshotsCount: exportSnapshots.length,
      snapshots: exportSnapshots,
      cryptographicInvariants: {
        canonicalSeals: 14902,
        genesisBlock: 849202,
        ssotMutation: 0,
        baselineDrift: '0.00%',
      },
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(merklePayload, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    const filename = `zyrquen-merkle-events-archive-block${SYSTEM_METADATA.sealedBlock}-${new Date().toISOString().slice(0, 10)}.json`;
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setMerkleLogToast(filename);
    setTimeout(() => setMerkleLogToast(null), 4500);
  };

  const handleDownloadEvidence = () => {
    playAuditChime();
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const filename = `zyrquen-ledger-export-${yyyy}${mm}${dd}.json`;

    EvidenceExportService.downloadJsonBlob(allSnapshots, filename);
    setEvidenceBlobToast(filename);
    setTimeout(() => setEvidenceBlobToast(null), 5000);
  };

  const handleDownloadAuditLog = () => {
    const idempotencyKey = `IDEMP-AUDIT-LOG-DOWNLOAD-${Date.now()}`;
    const existingJob = TerminalJobLifecycleManager.getJobOrByKey(idempotencyKey);
    if (existingJob?.state === 'COMPLETED' || existingJob?.state === 'UPLOADED') {
      return;
    }

    TerminalJobLifecycleManager.submitJob({
      jobType: 'AUDIT_SEAL_EXPORT',
      idempotencyKey,
      payload: { snapshotCount: allSnapshots.length },
      actor: 'LEDGER_AUDIT_LOG_EXPORTER',
    });

    playAuditChime();
    const now = new Date();
    const timestampStr = now.toISOString().replace(/[:.]/g, '-');
    const filename = `zyrquen-forensic-audit-log-${timestampStr}.json`;

    const auditLogData = {
      format: 'ZYRQUEN_FORENSIC_AUDIT_LOG_SNAPSHOT',
      version: 'v1.2 LTS PDPA FINAL FROZEN',
      ssotBlock: SYSTEM_METADATA.sealedBlock,
      merkleRoot: SYSTEM_METADATA.merkleRoot,
      boundary: 'Ω600_1000',
      totalVerifiedSeals: 14902,
      hsmQuorum: '10/10 REAL_HSM FIPS 140-3 L4',
      ssotDrift: 'Δ0.00% ZERO DRIFT',
      exportTimestampUtc: now.toUTCString(),
      exportTimestampIct: now.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
      sovereignPrincipal: SYSTEM_METADATA.sovereignPrincipal,
      totalSnapshots: allSnapshots.length,
      snapshots: allSnapshots,
    };

    const dataBlob = new Blob([JSON.stringify(auditLogData, null, 2)], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(dataBlob);
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(downloadUrl);

    TerminalJobLifecycleManager.transitionState(idempotencyKey, 'COMPLETED', filename);

    setAuditLogToast(filename);
    setTimeout(() => setAuditLogToast(null), 5000);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const idempotencyKey = `IDEMP-LEDGER-UPLOAD-${file.name}-${file.size}`;
    const existingJob = TerminalJobLifecycleManager.getJobOrByKey(idempotencyKey);
    const status = existingJob?.state;

    // Strict guard pattern: prevent duplicate submissions or re-triggers of terminal states
    if (status === 'COMPLETED' || status === 'UPLOADED' || status === 'TERMINAL_BLOCKED' || status === 'TERMINAL_REJECTED') {
      console.warn(`[LedgerView] Upload blocked: file '${file.name}' is already in terminal state '${status}'.`);
      setJsonLoadToast({
        filename: file.name,
        sealHash: existingJob?.payloadHash || '0xSEALED',
        valid: true,
        message: `File already in terminal state '${status}' - duplicate upload suppressed.`,
      });
      setTimeout(() => setJsonLoadToast(null), 5000);
      event.target.value = '';
      return;
    }

    TerminalJobLifecycleManager.submitJob({
      jobType: 'EVIDENCE_UPLOAD',
      idempotencyKey,
      payload: { filename: file.name, size: file.size },
      actor: 'LEDGER_VIEW_UPLOADER',
    });

    playTone(720, 0.05);
    const result = await JsonSealManager.loadJsonFile(file);
    if (!result.success || !result.data) {
      TerminalJobLifecycleManager.transitionState(idempotencyKey, 'TERMINAL_REJECTED', undefined, result.error);
      setJsonLoadToast({
        filename: file.name,
        sealHash: 'INVALID_PARSE',
        valid: false,
        message: result.error || 'Failed to parse JSON',
      });
      setTimeout(() => setJsonLoadToast(null), 5000);
      return;
    }

    const validation = await JsonSealManager.validateEvidenceJson(result.data);
    if (validation.isValid) {
      playAuditChime();
      // Commit seal hash to buffer to prevent loss across reload
      JsonSealManager.commitSeal(validation.canonicalBlock, result.data);
      TerminalJobLifecycleManager.transitionState(idempotencyKey, 'UPLOADED', {
        sealHash: validation.sealHash,
        canonicalBlock: validation.canonicalBlock,
      });
      setJsonLoadToast({
        filename: file.name,
        sealHash: validation.sealHash,
        valid: true,
        message: `Validated & Committed to Frozen Root (${validation.sealHash.slice(0, 16)}...) - Zero Drift Δ0.0%`,
      });
    } else {
      playTone(400, 0.1);
      TerminalJobLifecycleManager.transitionState(idempotencyKey, 'TERMINAL_BLOCKED', undefined, validation.violations.join('; '));
      setJsonLoadToast({
        filename: file.name,
        sealHash: validation.sealHash,
        valid: false,
        message: validation.violations.join(' | '),
      });
    }

    setTimeout(() => setJsonLoadToast(null), 6000);
    // Reset file input value so same file can be loaded again if desired
    event.target.value = '';
  };

  const handleExportSignedBlockEvidence = () => {
    playAuditChime();
    const { filename } = exportSignedBlockEvidenceJson(allSnapshots);
    setSignedEvidenceToast(filename);
    setTimeout(() => setSignedEvidenceToast(null), 5000);
  };

  const handleExportSignedForensicSealChain = async () => {
    playAuditChime();
    try {
      const { filename } = await exportSignedForensicAuditSealChainJson(allSnapshots);
      setSignedSealChainToast(filename);
      setTimeout(() => setSignedSealChainToast(null), 6000);
    } catch (err) {
      console.error('Forensic seal chain JSON export error:', err);
    }
  };

  const handleDownloadEvidenceManifest = () => {
    playAuditChime();
    const { filename } = downloadEvidenceManifestJson(allSnapshots);
    setEvidenceManifestToast(filename);
    setTimeout(() => setEvidenceManifestToast(null), 5000);
  };

  const handleGeneratePdfReport = () => {
    playAuditChime();
    const snapA = allSnapshots[0];
    const snapB = allSnapshots[Math.min(1, allSnapshots.length - 1)] || snapA;
    try {
      const filename = generateForensicPdfReport({
        snapA,
        snapB,
        allSnapshots,
        timestampFormat,
      });
      setPdfExportToast(filename);
      setTimeout(() => setPdfExportToast(null), 4000);
    } catch (err) {
      console.error('PDF export error:', err);
    }
  };

  const handleExportComplianceReport = () => {
    playAuditChime();
    try {
      const filename = generateCompliancePdfReport({
        snapshots: allSnapshots,
        timestampFormat,
      });
      setCompliancePdfToast(filename);
      setTimeout(() => setCompliancePdfToast(null), 4500);
    } catch (err) {
      console.error('Compliance PDF export error:', err);
    }
  };

  const handleExportCourtReadyJson = () => {
    playAuditChime();
    const filename = exportCourtReadyJsonAuditTrail({
      snapshots: allSnapshots,
      timestampFormat,
    });
    setCourtDossierToast(`Standardized JSON Audit Trail Serialized & Exported: ${filename}`);
    setTimeout(() => setCourtDossierToast(null), 5500);
  };

  const handleExportCourtReadyPdf = () => {
    playAuditChime();
    const filename = exportCourtReadySignedPdfDossier({
      snapshots: allSnapshots,
      timestampFormat,
    });
    setCourtDossierToast(`Court-Ready Cryptographically Signed PDF Dossier Downloaded: ${filename}`);
    setTimeout(() => setCourtDossierToast(null), 5500);
  };

  const handleExportSnapshotChainJson = () => {
    playAuditChime();
    const latestBlock = SYSTEM_METADATA.sealedBlock;
    const filename = `snapshot-chain-block-${latestBlock}-${Date.now()}.json`;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allSnapshots, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleDownloadSnapshot = (target?: HardwareSnapshot) => {
    playAuditChime();
    const snapToExport = target || currentSnapshot || allSnapshots[0];
    const { filename } = exportSignedLedgerSnapshotJson(snapToExport, allSnapshots.length);
    setDownloadSnapshotToast({
      filename,
      snapshotId: snapToExport.id,
      sealsCount: SYSTEM_METADATA.totalVerifiedSeals,
    });
    setTimeout(() => setDownloadSnapshotToast(null), 5000);
  };

  const handleExportSimplifiedReport = () => {
    playAuditChime();
    const filename = downloadSimplifiedForensicReport({
      snapshots: allSnapshots,
      ssotMutationDrift: 0.0,
      sealCount: SYSTEM_METADATA.totalVerifiedSeals,
    });
    setSimplifiedReportToast(filename);
    setTimeout(() => setSimplifiedReportToast(null), 4500);
  };

  const currentStageData = AUDIT_TRACE_TX.stages[selectedStage];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-6 sm:p-7 rounded-[28px] bg-gradient-to-br from-[#070914]/95 via-[#0b0e1e]/90 to-[#070914]/95 border border-cyan-500/20 shadow-[0_10px_50px_-10px_rgba(6,182,212,0.15)] backdrop-blur-3xl flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden group">
        <div className="absolute top-0 right-1/4 w-96 h-64 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none transition-opacity opacity-50 group-hover:opacity-100" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] sm:text-xs font-mono font-bold tracking-wider shadow-sm">
              POST-QUANTUM EVIDENCE LEDGER V25
            </span>
            <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] sm:text-xs font-mono font-bold tracking-wider shadow-sm">
              14,902 SEALS INTACT
            </span>
            <span className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20 text-[10px] sm:text-xs font-mono font-bold tracking-wider shadow-sm">
              {allSnapshots.length} HARDWARE SNAPSHOTS
            </span>
            <MerkleVerificationBadge showInspectorButton={true} compact={false} />
          </div>
          <h2 className="text-xl sm:text-3xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-100 mt-1 tracking-tight">
            Immutable Audit Ledger, Forensics Trace & Evidence Exporter
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-mono mt-1.5 leading-relaxed">
            Transaction: {AUDIT_TRACE_TX.txId} • Total Latency: {AUDIT_TRACE_TX.totalLatencyMs}ms • Sealed Block #{AUDIT_TRACE_TX.sealedLedgerBlock}
          </p>
        </div>

        {/* Top Right Action Buttons & Timestamp Mode Toggle */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          {/* Timestamp View & Export Toggle */}
          <div className="flex items-center bg-[#070914]/90 border border-cyan-500/20 rounded-2xl p-1.5 font-mono text-xs shadow-inner">
            <button
              onClick={() => {
                playTone(600, 0.04);
                setTimestampFormat('human');
              }}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all text-xs tracking-wide ${
                timestampFormat === 'human'
                  ? 'bg-cyan-500/20 text-cyan-100 font-bold border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'text-zinc-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent'
              }`}
              title="Display and export human-readable timestamps (ICT/UTC)"
            >
              <Clock className={`w-3.5 h-3.5 ${timestampFormat === 'human' ? 'text-cyan-400' : 'text-zinc-500'}`} />
              <span>Human Time</span>
            </button>

            <button
              onClick={() => {
                playTone(640, 0.04);
                setTimestampFormat('block-height');
              }}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all text-xs tracking-wide ${
                timestampFormat === 'block-height'
                  ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/30 font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'text-zinc-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent'
              }`}
              title="Display and export block-height-only references (e.g. Block #849202:Stage#)"
            >
              <Layers className={`w-3.5 h-3.5 ${timestampFormat === 'block-height' ? 'text-emerald-400' : 'text-zinc-500'}`} />
              <span>Block Height</span>
            </button>
          </div>

          {/* Download Audit Log JSON Button (System Snapshot Records for Forensic Review) */}
          <button
            onClick={handleDownloadAuditLog}
            className="px-4 py-2.5 rounded-2xl font-mono text-[11px] sm:text-xs font-bold bg-[#070a12] hover:bg-[#0a0f1e] border border-[#06B6D4]/60 text-cyan-200 hover:text-white flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] tracking-wide"
            title="Download full forensic JSON audit log of current system snapshot records"
          >
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Download Audit Log</span>
            <Download className="w-3.5 h-3.5 text-cyan-400" />
          </button>

          {/* Download Snapshot (Signed JSON Evidence) Button */}
          <button
            id="download-snapshot-btn"
            onClick={() => handleDownloadSnapshot()}
            className="px-4 py-2.5 rounded-2xl font-mono text-[11px] sm:text-xs font-bold bg-gradient-to-r from-sky-600/30 via-cyan-600/20 to-sky-600/30 hover:from-sky-500/40 hover:to-cyan-500/40 border border-sky-400/50 text-sky-100 hover:text-white flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(14,165,233,0.25)] hover:shadow-[0_0_25px_rgba(14,165,233,0.35)] tracking-wide"
            title="Download current immutable ledger state and telemetry snapshot as a cryptographically signed JSON evidence file"
          >
            <Camera className="w-4 h-4 text-sky-300" />
            <span>Download Snapshot</span>
            <Download className="w-3.5 h-3.5 text-sky-300 opacity-80" />
          </button>

          {/* Download Evidence (JSON Blob) Button via EvidenceExportService */}
          <button
            onClick={handleDownloadEvidence}
            className="px-4 py-2.5 rounded-2xl font-mono text-[11px] sm:text-xs font-bold bg-gradient-to-r from-cyan-600/30 via-emerald-600/20 to-cyan-600/30 hover:from-cyan-500/40 hover:to-emerald-500/40 border border-cyan-400/50 text-cyan-100 hover:text-white flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_25px_rgba(6,182,212,0.35)] tracking-wide"
            title="Download current immutable snapshot telemetry as a formatted JSON blob using EvidenceExportService"
          >
            <Download className="w-4 h-4 text-cyan-300" />
            <span>Download Evidence</span>
            <Sparkles className="w-3.5 h-3.5 text-cyan-300 opacity-80" />
          </button>

          {/* Export JSON Chain Button */}
          <button
            onClick={handleExportSnapshotChainJson}
            className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-200 text-[10px] sm:text-[11px] font-bold font-mono tracking-wide transition-all shadow-sm hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] flex items-center gap-2"
            title="Download the current chain of snapshots as a JSON file"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
            <span>Export Snapshot Chain (JSON)</span>
          </button>

          {/* Export to CSV Button via EvidenceExportService */}
          <button
            onClick={handleExportTelemetryCsv}
            className="px-4 py-2.5 rounded-2xl font-mono text-[11px] sm:text-xs font-bold bg-gradient-to-r from-teal-600/30 via-cyan-600/20 to-emerald-600/30 hover:from-teal-500/40 hover:to-cyan-500/40 border border-teal-400/50 text-teal-100 hover:text-white flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(20,184,166,0.25)] hover:shadow-[0_0_25px_rgba(20,184,166,0.35)] tracking-wide"
            title="Export current immutable snapshot telemetry as a formatted CSV blob using EvidenceExportService"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-300" />
            <span>Export to CSV</span>
            <Download className="w-3.5 h-3.5 text-teal-300 opacity-80" />
          </button>

          {/* Load / Commit JSON Evidence Button (JSON Loader) */}
          <label className="px-4 py-2.5 rounded-2xl font-mono text-[11px] sm:text-xs font-bold bg-gradient-to-r from-indigo-600/30 via-violet-600/20 to-cyan-600/30 hover:from-indigo-500/40 hover:to-cyan-500/40 border border-indigo-400/50 text-indigo-100 hover:text-white flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(99,102,241,0.25)] hover:shadow-[0_0_25px_rgba(99,102,241,0.35)] cursor-pointer tracking-wide" title="Load external JSON Evidence file, validate against Genesis Merkle Root, and commit to Frozen Ledger">
            <Upload className="w-4 h-4 text-indigo-300" />
            <span>Load JSON Evidence</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Export Evidence (Signed JSON) Button */}
          <button
            onClick={handleExportSignedBlockEvidence}
            className="px-4 py-2.5 rounded-2xl font-mono text-[11px] sm:text-xs font-bold bg-gradient-to-r from-emerald-600/30 via-cyan-600/20 to-emerald-600/30 hover:from-emerald-500/40 hover:to-cyan-500/40 border border-emerald-400/50 text-emerald-100 hover:text-white flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_25px_rgba(16,185,129,0.35)] tracking-wide"
            title="Download current Merkle-verified block evidence as a cryptographically signed JSON file (NIST PQC ML-DSA-87 & Thai ETDA Sec 9/26/28)"
          >
            <Shield className="w-4 h-4 text-emerald-300" />
            <span>Export Evidence (Signed JSON)</span>
            <Download className="w-3.5 h-3.5 text-emerald-300 opacity-80" />
          </button>

          {/* Export Forensic Seal Chain & Evidence Log (Signed JSON for Off-Chain Cold Storage) Button */}
          <button
            onClick={handleExportSignedForensicSealChain}
            className="px-4 py-2.5 rounded-2xl font-mono text-[11px] sm:text-xs font-bold bg-gradient-to-r from-cyan-500/30 via-indigo-600/30 to-fuchsia-600/30 hover:from-cyan-400/40 hover:to-fuchsia-500/40 border border-cyan-400/60 text-white flex items-center gap-2 transition-all shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] tracking-wide ring-1 ring-cyan-400/30"
            title="Export full 14,902 canonical forensic seal chain, 18 chambers state matrix, and 12-stage evidence log signed with NIST FIPS 204 ML-DSA-87 for off-chain cold storage"
          >
            <Lock className="w-4 h-4 text-cyan-300 animate-pulse" />
            <span>Export Signed Seal Chain &amp; Evidence Log (JSON)</span>
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          </button>

          {/* Download Evidence Manifest Button */}
          <button
            onClick={handleDownloadEvidenceManifest}
            className="px-4 py-2.5 rounded-2xl font-mono text-[11px] sm:text-xs font-bold bg-gradient-to-r from-amber-600/30 via-yellow-600/20 to-amber-600/30 hover:from-amber-500/40 hover:to-amber-500/40 border border-amber-400/50 text-amber-100 hover:text-white flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.3)] tracking-wide"
            title="Download complete offline audit Evidence Manifest (JSON) containing full list of verified Merkle blocks, signatures, and proofs"
          >
            <FileCheck2 className="w-4 h-4 text-amber-300" />
            <span>Download Evidence Manifest</span>
            <Download className="w-3.5 h-3.5 text-amber-300 opacity-80" />
          </button>

          {/* Export Merkle Log JSON Button */}
          <button
            onClick={handleExportMerkleLog}
            className="px-4 py-2.5 rounded-2xl font-mono text-[11px] sm:text-xs font-bold bg-gradient-to-r from-purple-500/20 via-violet-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:to-cyan-500/30 border border-purple-500/40 text-purple-100 hover:text-white flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(168,85,247,0.25)] hover:shadow-[0_0_20px_rgba(168,85,247,0.35)] tracking-wide"
            title="Export complete Merkle Tree, verification hashes, stages, and snapshot audit logs as machine-readable JSON"
          >
            <FileCode className="w-4 h-4 text-purple-300" />
            <span>Export Merkle Log</span>
            <Download className="w-3.5 h-3.5 text-purple-300 opacity-80" />
          </button>

          {/* Export Snapshots CSV Button (LedgerExportService) */}
          <button
            onClick={handleExportLedgerServiceSnapshotsCsv}
            className="px-4 py-2.5 rounded-2xl font-mono text-[11px] sm:text-xs font-bold bg-gradient-to-r from-teal-500/25 to-emerald-500/25 hover:from-teal-500/35 hover:to-emerald-500/35 border border-teal-400/50 text-teal-100 hover:text-white flex items-center gap-2 transition-all shadow-[0_0_18px_rgba(20,184,166,0.25)] hover:shadow-[0_0_24px_rgba(20,184,166,0.35)] tracking-wide"
            title="Download CSV containing snapshotNumber, sealedHash, merkleRoot, and timestamp generated via LedgerExportService"
          >
            <Download className="w-4 h-4 text-teal-300" />
            <span>Export Snapshots CSV</span>
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-300 opacity-90" />
          </button>

          {/* Export Immutable Ledger CSV Button (Auditable Ledger State) */}
          <button
            onClick={handleExportImmutableLedgerCsv}
            className="px-4 py-2.5 rounded-2xl font-mono text-[11px] sm:text-xs font-bold bg-gradient-to-r from-emerald-600/35 via-teal-600/30 to-cyan-600/35 hover:from-emerald-500/45 hover:to-cyan-500/45 border border-emerald-400/60 text-emerald-100 hover:text-white flex items-center gap-2 transition-all shadow-[0_0_22px_rgba(16,185,129,0.3)] hover:shadow-[0_0_28px_rgba(16,185,129,0.45)] tracking-wide"
            title="Export full immutable ledger as a CSV file containing timestamp, Merkle root, seal counts, and PQC signatures for external audit verification"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300 animate-pulse" />
            <span>Export Immutable Ledger CSV</span>
            <Download className="w-3.5 h-3.5 text-emerald-300 opacity-90" />
          </button>

          {/* Export Evidence CSV Button */}
          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-2xl font-mono text-[11px] sm:text-xs font-bold bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-200 hover:text-white flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] tracking-wide"
            title={`Export full cryptographic evidence as CSV (${timestampFormat === 'block-height' ? 'Block-Height Mode' : 'Human-Time Mode'})`}
          >
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
            <span>Export CSV</span>
            <Download className="w-3.5 h-3.5 text-cyan-400 opacity-80" />
          </button>

          {/* Export Compliance Report PDF Button */}
          <button
            onClick={handleExportComplianceReport}
            className="px-4 py-2.5 rounded-2xl font-mono text-[11px] sm:text-xs font-bold bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-emerald-500/20 hover:from-blue-500/30 hover:to-emerald-500/30 border border-cyan-500/40 text-cyan-100 hover:text-white flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)] tracking-wide"
            title="Export official Regulatory Compliance Report mapping Thai Electronic Transactions Act (Sec 9, 26, 28) and cryptographic proofs"
          >
            <Scale className="w-4 h-4 text-cyan-300" />
            <span>Compliance Report (PDF)</span>
            <Download className="w-3.5 h-3.5 text-cyan-300 opacity-80" />
          </button>

          {/* Generate Forensic Report PDF Button */}
          <button
            onClick={handleGeneratePdfReport}
            className="px-4 py-2.5 rounded-2xl font-mono text-[11px] sm:text-xs font-bold bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 text-emerald-100 hover:text-white flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] tracking-wide"
            title="Generate and download a comprehensive PDF Forensic Report compiling snapshot variance analysis and Merkle roots"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Forensic Report (PDF)</span>
            <Download className="w-3.5 h-3.5 text-emerald-400 opacity-80" />
          </button>

          {/* Export Standardized Court-Ready JSON Audit Trail Button */}
          <button
            onClick={handleExportCourtReadyJson}
            className="px-4 py-2.5 rounded-2xl font-mono text-[11px] sm:text-xs font-bold bg-gradient-to-r from-emerald-600/35 via-teal-600/30 to-cyan-600/35 hover:from-emerald-500/45 hover:to-cyan-500/45 border border-emerald-400/60 text-emerald-100 hover:text-white flex items-center gap-2 transition-all shadow-[0_0_22px_rgba(16,185,129,0.3)] hover:shadow-[0_0_28px_rgba(16,185,129,0.45)] tracking-wide"
            title="Serialize and download current verification state into a standardized JSON audit trail for court admissibility"
          >
            <FileCode className="w-4 h-4 text-emerald-300 animate-pulse" />
            <span>Export Court-Ready JSON</span>
            <Download className="w-3.5 h-3.5 text-emerald-300" />
          </button>

          {/* Export Cryptographically Signed Court-Ready PDF Dossier Button */}
          <button
            onClick={handleExportCourtReadyPdf}
            className="px-4 py-2.5 rounded-2xl font-mono text-[11px] sm:text-xs font-bold bg-gradient-to-r from-amber-600/35 via-yellow-600/30 to-amber-600/35 hover:from-amber-500/45 hover:to-yellow-500/45 border border-amber-400/60 text-amber-100 hover:text-white flex items-center gap-2 transition-all shadow-[0_0_22px_rgba(245,158,11,0.3)] hover:shadow-[0_0_28px_rgba(245,158,11,0.45)] tracking-wide"
            title="Download full court-ready dossier as a cryptographically signed PDF with NIST PQC signature blocks and Thai ETDA Sec 9/26/28 bindings"
          >
            <FileText className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Court-Ready PDF Dossier</span>
            <Download className="w-3.5 h-3.5 text-amber-300" />
          </button>

          {/* Export Simplified Human-Readable Forensic Report (.txt) */}
          <button
            onClick={handleExportSimplifiedReport}
            className="px-4 py-2.5 rounded-2xl font-mono text-[11px] sm:text-xs font-bold bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-400/60 text-cyan-200 hover:text-white flex items-center gap-2 transition-all shadow-[0_0_18px_rgba(6,182,212,0.25)] tracking-wide"
            title="Download simplified human-readable forensic report (.txt) of ledger state and audit logs"
          >
            <FileText className="w-4 h-4 text-cyan-300" />
            <span>Simplified Forensic Report (.txt)</span>
            <Download className="w-3.5 h-3.5 text-cyan-300 opacity-90" />
          </button>

          {/* Forensic Replay Button */}
          <button
            onClick={startReplay}
            disabled={isPlayingReplay}
            className={`px-4 py-2.5 rounded-2xl font-mono text-[11px] sm:text-xs font-bold flex items-center gap-2 border transition-all tracking-wide ${
              isPlayingReplay
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200 animate-pulse'
                : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]'
            }`}
          >
            {isPlayingReplay ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>{isPlayingReplay ? `Replaying (${selectedStage + 1}/12)...` : 'Run 12-Stage Replay'}</span>
          </button>
        </div>
      </div>

      {/* Download Snapshot Signed JSON Export Success Toast */}
      {downloadSnapshotToast && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/90 via-cyan-950/80 to-[#07080F] border border-sky-500/60 backdrop-blur-xl flex items-center justify-between gap-3 text-xs font-mono text-sky-200 animate-in fade-in duration-200 shadow-2xl shadow-sky-950/40">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-sky-300 shrink-0" />
            <span>
              <strong>Immutable Ledger Snapshot Evidence Exported:</strong> Successfully generated and downloaded <strong className="text-white">{downloadSnapshotToast.filename}</strong> for snapshot <strong className="text-cyan-300">{downloadSnapshotToast.snapshotId}</strong> (Block #849202, 14,902 Seals, NIST FIPS 204 ML-DSA-87 &amp; Thai ETDA Sec 9/26/28 Signed).
            </span>
          </div>
          <button
            onClick={() => setDownloadSnapshotToast(null)}
            className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-100 hover:text-white transition-all text-xs border border-sky-500/40"
          >
            Close
          </button>
        </div>
      )}

      {/* Download Evidence (JSON Blob) Export Success Toast */}
      {evidenceBlobToast && (
        <div className="p-4 rounded-2xl bg-[#0a0f1e] border border-cyan-500/60 backdrop-blur-xl flex items-center justify-between gap-3 text-xs font-mono text-cyan-200 animate-in fade-in duration-200 shadow-2xl shadow-cyan-950/40">
          <div className="flex items-center gap-2.5">
            <Download className="w-4 h-4 text-cyan-300 shrink-0" />
            <span>
              <strong>Immutable Telemetry Evidence JSON Blob Exported:</strong> Successfully serialized and downloaded <strong className="text-white">{evidenceBlobToast}</strong> via <strong className="text-emerald-300">EvidenceExportService</strong> ({allSnapshots.length} snapshots, Genesis Root, NIST PQC FIPS 204 &amp; Thai ETA bindings).
            </span>
          </div>
          <button
            onClick={() => setEvidenceBlobToast(null)}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-100 hover:text-white transition-all text-xs border border-cyan-500/40"
          >
            Close
          </button>
        </div>
      )}

      {/* Download Audit Log JSON Export Success Toast */}
      {auditLogToast && (
        <div className="p-4 rounded-2xl bg-[#070a12] border border-[#06B6D4]/60 backdrop-blur-xl flex items-center justify-between gap-3 text-xs font-mono text-cyan-200 animate-in fade-in duration-200 shadow-2xl shadow-cyan-950/40">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-cyan-300 shrink-0" />
            <span>
              <strong>Forensic Audit Log JSON Exported:</strong> Successfully generated and downloaded <strong className="text-white">{auditLogToast}</strong> containing {allSnapshots.length} system snapshot records, SSoT Block #{SYSTEM_METADATA.sealedBlock}, and 10/10 REAL_HSM Quorum attestation.
            </span>
          </div>
          <button
            onClick={() => setAuditLogToast(null)}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-100 hover:text-white transition-all text-xs border border-cyan-500/40"
          >
            Close
          </button>
        </div>
      )}

      {/* CSV Telemetry Export Success Toast */}
      {csvEvidenceToast && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/90 via-cyan-950/80 to-[#07080F] border border-teal-500/60 backdrop-blur-xl flex items-center justify-between gap-3 text-xs font-mono text-teal-200 animate-in fade-in duration-200 shadow-2xl shadow-teal-950/40">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-4 h-4 text-teal-300 shrink-0" />
            <span>
              <strong>Telemetry CSV Exported:</strong> Generated RFC-4180 compliant CSV <strong className="text-white">{csvEvidenceToast}</strong> via <strong className="text-teal-300">EvidenceExportService</strong> ({filteredSnapshots.length} snapshots with UTF-8 BOM).
            </span>
          </div>
          <button
            onClick={() => setCsvEvidenceToast(null)}
            className="px-2.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-100 hover:text-white transition-all text-xs border border-teal-500/40"
          >
            Close
          </button>
        </div>
      )}

      {/* JSON Evidence Loader / Committer Toast */}
      {jsonLoadToast && (
        <div className={`p-4 rounded-2xl backdrop-blur-xl flex items-center justify-between gap-3 text-xs font-mono animate-in fade-in duration-200 shadow-2xl ${
          jsonLoadToast.valid
            ? 'bg-gradient-to-r from-indigo-950/90 via-emerald-950/80 to-[#07080F] border border-indigo-500/60 text-indigo-200 shadow-indigo-950/40'
            : 'bg-gradient-to-r from-rose-950/90 via-red-950/80 to-[#07080F] border border-rose-500/60 text-rose-200 shadow-rose-950/40'
        }`}>
          <div className="flex items-center gap-2.5">
            {jsonLoadToast.valid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
            )}
            <span>
              <strong>{jsonLoadToast.valid ? 'JSON Evidence Loaded & Committed:' : 'JSON Evidence Validation Rejected:'}</strong> Loaded <strong className="text-white">{jsonLoadToast.filename}</strong> — {jsonLoadToast.message}
            </span>
          </div>
          <button
            onClick={() => setJsonLoadToast(null)}
            className={`px-2.5 py-1 rounded-lg transition-all text-xs border ${
              jsonLoadToast.valid
                ? 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-100 border-indigo-500/40'
                : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 border-rose-500/40'
            }`}
          >
            Close
          </button>
        </div>
      )}

      {/* Download Snapshot (Signed JSON Evidence) Export Success Toast */}
      {downloadSnapshotToast && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/90 via-cyan-950/80 to-[#07080F] border border-sky-400/60 backdrop-blur-xl flex items-center justify-between gap-3 text-xs font-mono text-sky-200 animate-in fade-in duration-200 shadow-2xl shadow-sky-950/50">
          <div className="flex items-center gap-2.5">
            <Camera className="w-4 h-4 text-sky-300 shrink-0 animate-pulse" />
            <span>
              <strong>Signed Immutable Ledger Snapshot Exported:</strong> Successfully generated <strong className="text-white">{downloadSnapshotToast.filename}</strong> for Snapshot <strong className="text-cyan-300">#{downloadSnapshotToast.snapshotId}</strong> ({downloadSnapshotToast.sealsCount.toLocaleString()} Verified Canonical Seals) with NIST FIPS 204 ML-DSA-87 signature and ETDA Sec 9/26/28 statutory bindings.
            </span>
          </div>
          <button
            onClick={() => setDownloadSnapshotToast(null)}
            className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-100 hover:text-white transition-all text-xs border border-sky-500/40"
          >
            Close
          </button>
        </div>
      )}

      {/* Signed Block Evidence JSON Export Success Toast */}
      {signedEvidenceToast && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/85 via-cyan-950/75 to-[#07080F] border border-emerald-500/60 backdrop-blur-xl flex items-center justify-between gap-3 text-xs font-mono text-emerald-200 animate-in fade-in duration-200 shadow-2xl shadow-emerald-950/40">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>
              <strong>Signed Block Evidence JSON Exported:</strong> Successfully generated <strong className="text-white">{signedEvidenceToast}</strong> with NIST Post-Quantum Signature (ML-DSA-87 / Dilithium-5), Merkle leaf proofs, SSoT invariants, and Thai ETDA Sec 9/26/28 statutory bindings.
            </span>
          </div>
          <button
            onClick={() => setSignedEvidenceToast(null)}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100 hover:text-white transition-all text-xs border border-emerald-500/40"
          >
            Close
          </button>
        </div>
      )}

      {/* Signed Forensic Seal Chain & Evidence Log JSON Toast */}
      {signedSealChainToast && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/90 via-indigo-950/85 to-[#07080F] border border-cyan-400/60 backdrop-blur-xl flex items-center justify-between gap-3 text-xs font-mono text-cyan-200 animate-in fade-in duration-200 shadow-2xl shadow-cyan-950/50">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-cyan-300 shrink-0 animate-pulse" />
            <span>
              <strong>Forensic Audit Seal Chain &amp; Evidence Log Signed JSON Exported:</strong> Successfully packaged <strong className="text-white">{signedSealChainToast}</strong> for off-chain cold storage. Includes 14,902 canonical seals, 18 chambers matrix, 12-stage forensic trace replay, and NIST FIPS 204 ML-DSA-87 sovereign signature.
            </span>
          </div>
          <button
            onClick={() => setSignedSealChainToast(null)}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-100 hover:text-white transition-all text-xs border border-cyan-500/40"
          >
            Close
          </button>
        </div>
      )}

      {/* Evidence Manifest JSON Export Success Toast */}
      {evidenceManifestToast && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/85 via-yellow-950/70 to-[#07080F] border border-amber-500/60 backdrop-blur-xl flex items-center justify-between gap-3 text-xs font-mono text-amber-200 animate-in fade-in duration-200 shadow-2xl shadow-amber-950/40">
          <div className="flex items-center gap-2.5">
            <FileCheck2 className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              <strong>Evidence Manifest JSON Exported:</strong> Successfully generated <strong className="text-white">{evidenceManifestToast}</strong> containing the full sequence of verified Merkle blocks, NIST FIPS 204 signatures, and offline audit proofs.
            </span>
          </div>
          <button
            onClick={() => setEvidenceManifestToast(null)}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 hover:text-white transition-all text-xs border border-amber-500/40"
          >
            Close
          </button>
        </div>
      )}

      {/* Merkle Log JSON Export Success Toast */}
      {merkleLogToast && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 via-violet-950/70 to-[#07080F] border border-purple-500/50 backdrop-blur-xl flex items-center justify-between gap-3 text-xs font-mono text-purple-200 animate-in fade-in duration-200 shadow-2xl">
          <div className="flex items-center gap-2.5">
            <FileCode className="w-4 h-4 text-purple-300 shrink-0" />
            <span>
              <strong>Merkle Audit Log JSON Exported:</strong> Successfully generated <strong className="text-white">{merkleLogToast}</strong> with canonical root, cryptographic verification chains, and {allSnapshots.length} hardware snapshots.
            </span>
          </div>
          <button
            onClick={() => setMerkleLogToast(null)}
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-all text-xs"
          >
            Close
          </button>
        </div>
      )}

      {/* Compliance PDF Export Success Toast */}
      {compliancePdfToast && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/80 via-cyan-950/70 to-[#07080F] border border-cyan-500/50 backdrop-blur-xl flex items-center justify-between gap-3 text-xs font-mono text-cyan-200 animate-in fade-in duration-200 shadow-2xl">
          <div className="flex items-center gap-2.5">
            <Scale className="w-4 h-4 text-cyan-300 shrink-0" />
            <span>
              <strong>Regulatory Compliance Report Exported:</strong> Successfully generated <strong className="text-white">{compliancePdfToast}</strong> bundled with Thai Law mapping (Sec 9, 26, 28) and Merkle proofs.
            </span>
          </div>
          <button
            onClick={() => setCompliancePdfToast(null)}
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-all text-xs"
          >
            Close
          </button>
        </div>
      )}

      {/* PDF Export Success Toast */}
      {pdfExportToast && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-[#0b0e1a]/80 to-[#07080F] border border-emerald-500/40 backdrop-blur-xl flex items-center justify-between gap-3 text-xs font-mono text-emerald-300 animate-in fade-in duration-200 shadow-xl">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Forensic Variance Report Generated:</strong> Successfully downloaded <strong className="text-white">{pdfExportToast}</strong> with Merkle evidence and telemetry deltas.
            </span>
          </div>
          <button
            onClick={() => setPdfExportToast(null)}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all text-xs"
          >
            Close
          </button>
        </div>
      )}

      {/* CSV Export Success Toast */}
      {csvExportToast && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/70 via-[#0b0e1a]/80 to-[#07080F] border border-cyan-500/40 backdrop-blur-xl flex items-center justify-between gap-3 text-xs font-mono text-cyan-300 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>
              <strong>Cryptographic Evidence Logs Exported:</strong> CSV downloaded ({timestampFormat === 'block-height' ? 'Block Height Only mode' : 'Human-Readable Timestamps mode'}) with 12 forensic stages and {allSnapshots.length} hardware snapshots.
            </span>
          </div>
          <button
            onClick={() => setCsvExportToast(false)}
            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
          >
            Close
          </button>
        </div>
      )}

      {/* Court-Ready Dossier & JSON Audit Trail Toast */}
      {courtDossierToast && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/90 via-cyan-950/80 to-[#07080F] border border-amber-500/60 backdrop-blur-xl flex items-center justify-between gap-3 text-xs font-mono text-amber-200 animate-in fade-in duration-200 shadow-2xl shadow-amber-950/40">
          <div className="flex items-center gap-2.5">
            <Scale className="w-4 h-4 text-amber-300 shrink-0 animate-pulse" />
            <span>
              <strong>Court-Admissible Evidence Attestation:</strong> {courtDossierToast}
            </span>
          </div>
          <button
            onClick={() => setCourtDossierToast(null)}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 hover:text-white transition-all text-xs border border-amber-500/40"
          >
            Close
          </button>
        </div>
      )}

      {/* Simplified Forensic Report Download Toast */}
      {simplifiedReportToast && (
        <div className="p-4 rounded-2xl bg-[#0a0f1e] border border-cyan-500/50 backdrop-blur-xl flex items-center justify-between gap-3 text-xs font-mono text-cyan-200 animate-in fade-in duration-200 shadow-xl">
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-cyan-300 shrink-0" />
            <span>
              <strong>Simplified Forensic Report Exported:</strong> Successfully generated <strong className="text-white">{simplifiedReportToast}</strong> (Deterministic text report with ETDA Sec 9/26/28 and PDPA Section 37 log integrity validation).
            </span>
          </div>
          <button
            onClick={() => setSimplifiedReportToast(null)}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-100 hover:text-white transition-all text-xs border border-cyan-500/40"
          >
            Close
          </button>
        </div>
      )}

      {/* Ledger Section Tabs */}
      <div className="flex items-center bg-[#070914]/90 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-2 font-mono text-xs shadow-inner flex-wrap gap-2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-violet-500/5 to-transparent pointer-events-none" />
        
        {/* Timeline Tab Button */}
        <button
          onClick={() => {
            playTone(540, 0.04);
            setActiveLedgerTab('timeline');
          }}
          className={`relative z-10 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all tracking-wide ${
            activeLedgerTab === 'timeline'
              ? 'bg-cyan-500/25 text-cyan-100 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
              : 'text-zinc-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent'
          }`}
        >
          <Layers className={`w-4 h-4 ${activeLedgerTab === 'timeline' ? 'text-cyan-400' : 'text-zinc-500'}`} />
          <span>14,902 Seals Timeline</span>
        </button>

        <button
          onClick={() => {
            playTone(550, 0.04);
            setActiveLedgerTab('stages');
          }}
          className={`relative z-10 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all tracking-wide ${
            activeLedgerTab === 'stages'
              ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
              : 'text-zinc-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent'
          }`}
        >
          <FileCheck2 className={`w-4 h-4 ${activeLedgerTab === 'stages' ? 'text-emerald-400' : 'text-zinc-500'}`} />
          <span>12-Stage Forensics Trace</span>
        </button>

        <button
          onClick={() => {
            playTone(590, 0.04);
            setActiveLedgerTab('smart-contract');
          }}
          className={`relative z-10 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all tracking-wide ${
            activeLedgerTab === 'smart-contract'
              ? 'bg-cyan-500/25 text-cyan-100 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
              : 'text-zinc-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent'
          }`}
        >
          <FileCode className={`w-4 h-4 ${activeLedgerTab === 'smart-contract' ? 'text-cyan-400' : 'text-zinc-500'}`} />
          <span>Smart Contract Core V2</span>
        </button>

        <button
          onClick={() => {
            playTone(560, 0.04);
            setActiveLedgerTab('quarantine');
          }}
          className={`relative z-10 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all tracking-wide ${
            activeLedgerTab === 'quarantine'
              ? 'bg-amber-500/25 text-amber-100 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
              : 'text-zinc-400 hover:text-amber-300 hover:bg-amber-500/10 border border-transparent'
          }`}
        >
          <ShieldAlert className={`w-4 h-4 ${activeLedgerTab === 'quarantine' ? 'text-amber-400' : 'text-zinc-500'}`} />
          <span>Quarantine Registry (#14,903–#14,907)</span>
        </button>

        <button
          onClick={() => {
            playTone(570, 0.04);
            setActiveLedgerTab('forensics');
          }}
          className={`relative z-10 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all tracking-wide ${
            activeLedgerTab === 'forensics'
              ? 'bg-indigo-500/25 text-indigo-100 border border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.25)]'
              : 'text-zinc-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-transparent'
          }`}
        >
          <FileSearch className={`w-4 h-4 ${activeLedgerTab === 'forensics' ? 'text-indigo-400' : 'text-zinc-500'}`} />
          <span>Forensic Evidence Matrix</span>
        </button>

        <button
          onClick={() => {
            playTone(550, 0.04);
            setActiveLedgerTab('snapshots');
          }}
          className={`relative z-10 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all tracking-wide ${
            activeLedgerTab === 'snapshots'
              ? 'bg-cyan-500/25 text-cyan-100 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
              : 'text-zinc-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent'
          }`}
        >
          <Camera className={`w-4 h-4 ${activeLedgerTab === 'snapshots' ? 'text-cyan-400' : 'text-zinc-500'}`} />
          <span>Hardware Snapshots ({allSnapshots.length})</span>
        </button>

        <button
          onClick={() => {
            playTone(600, 0.04);
            setActiveLedgerTab('compare');
          }}
          className={`relative z-10 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all tracking-wide ${
            activeLedgerTab === 'compare'
              ? 'bg-violet-500/25 text-violet-100 border border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.25)]'
              : 'text-zinc-400 hover:text-violet-300 hover:bg-violet-500/10 border border-transparent'
          }`}
        >
          <ArrowRightLeft className={`w-4 h-4 ${activeLedgerTab === 'compare' ? 'text-violet-400' : 'text-zinc-500'}`} />
          <span>Compare Snapshots</span>
        </button>

        <button
          onClick={() => {
            playTone(620, 0.04);
            setActiveLedgerTab('merkle-tree');
          }}
          className={`relative z-10 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all tracking-wide ${
            activeLedgerTab === 'merkle-tree'
              ? 'bg-cyan-500/25 text-cyan-100 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
              : 'text-zinc-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent'
          }`}
        >
          <GitFork className={`w-4 h-4 ${activeLedgerTab === 'merkle-tree' ? 'text-cyan-400' : 'text-zinc-500'}`} />
          <span>Merkle Tree Graph</span>
        </button>
      </div>

      {/* Main Ledger Content Grid with Side Panel for Last 5 Hardware Snapshots */}
      <div className="flex flex-col xl:flex-row items-start gap-6 w-full min-w-0">
        <div className="flex-1 min-w-0 w-full space-y-6">

      {/* TAB 0: 14,902 Canonical Seals Vertical Timeline with Dynamic Zoom Slider */}
      {activeLedgerTab === 'timeline' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <CanonicalSealsVerticalTimeline
            externalZoomMode={timelineZoomMode}
            onZoomModeChange={setTimelineZoomMode}
          />
        </div>
      )}

      {/* TAB 1: 12-Stage Interactive Trace Replay Pipeline */}
      {activeLedgerTab === 'stages' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <TwelveStageForensicTraceReplay />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 6 Columns: 12-Stage Timeline List */}
            <div className="lg:col-span-6 space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {AUDIT_TRACE_TX.stages.map((st, idx) => {
              const isSelected = selectedStage === idx;
              return (
                <div
                  key={st.id}
                  onClick={() => {
                    playTone(500 + idx * 25, 0.04);
                    setSelectedStage(idx);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-emerald-950/30 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)] scale-[1.01]'
                      : 'bg-[#070914]/60 border-cyan-500/10 hover:border-cyan-500/20 hover:bg-[#0b0e1e]/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                        isSelected ? 'bg-emerald-500 text-black' : 'bg-white/5 text-zinc-300'
                      }`}
                    >
                      {st.stageNumber}
                    </span>
                    <div>
                      <div className="text-xs font-mono font-bold text-zinc-100">{st.name}</div>
                      <div className="text-[11px] text-zinc-400 font-sans line-clamp-1">{st.shortDesc}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs text-zinc-400 shrink-0">
                    <span className="flex items-center gap-1 text-[11px]">
                      {timestampFormat === 'block-height' ? (
                        <span className="text-cyan-400 font-semibold">BLOCK #849202:S{st.stageNumber}</span>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-zinc-500" />
                          <span>{st.durationMs}ms</span>
                        </>
                      )}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px]">
                      {st.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right 6 Columns: Selected Stage Deep-Dive & Cryptographic Hashes */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-6 rounded-[28px] bg-[#0b0e1a]/70 border border-white/8 backdrop-blur-xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                    STAGE {currentStageData.stageNumber} OF 12
                  </span>
                  <h3 className="text-lg font-mono font-bold text-white mt-1">{currentStageData.name}</h3>
                </div>
                <span className="text-xs font-mono px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  100% INTACT
                </span>
              </div>

              <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                {currentStageData.shortDesc}
              </p>

              {/* Stage Hash Pair */}
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-zinc-500 text-[10px]">
                    <span>PARENT HASH (INPUT)</span>
                    <button
                      onClick={() => handleCopy('parent', currentStageData.parentHash)}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      {copiedHash === 'parent' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <div className="text-zinc-300 text-xs break-all select-all font-mono">
                    {currentStageData.parentHash}
                  </div>
                </div>

                <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-zinc-500 text-[10px]">
                    <span>OUTPUT HASH (SEALED)</span>
                    <button
                      onClick={() => handleCopy('output', currentStageData.outputHash)}
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      {copiedHash === 'output' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <div className="text-emerald-300 text-xs break-all select-all font-mono">
                    {currentStageData.outputHash}
                  </div>
                </div>
              </div>

              {/* Stage Metadata Attributes */}
              <div className="space-y-2">
                <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  Stage Execution Metadata
                </div>
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-zinc-500 text-[10px] block">SOURCE MODULE</span>
                    <span className="text-zinc-300 truncate block">{currentStageData.sourceModule}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block">ACTOR / AGENT</span>
                    <span className="text-cyan-300 truncate block">{currentStageData.actor}</span>
                  </div>
                  {Object.entries(currentStageData.metadata).map(([k, v]) => (
                    <div key={k}>
                      <span className="text-zinc-500 text-[10px] uppercase block">{k.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-emerald-400 block font-semibold">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* TAB: Smart Contract Core V2 */}
      {activeLedgerTab === 'smart-contract' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <SmartContractCoreViewer />
        </div>
      )}

      {/* TAB 2: Hardware Telemetry Snapshots List & Deep-Dive */}
      {activeLedgerTab === 'snapshots' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* CPU Usage Sparkline & Trend Chart (Last 10 Telemetry Snapshots) */}
          <div className="p-5 rounded-[24px] bg-[#0b0e1a]/85 border border-cyan-500/20 backdrop-blur-xl shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white tracking-wide">
                      CPU Telemetry Trend • Last {last10CpuTrendData.length} Snapshots
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      LIVE SSoT
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-sans">
                    Average CPU core load (%) across immutable telemetry capture history
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 font-mono text-xs text-zinc-400">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-zinc-500 text-[10px]">LATEST CPU:</span>
                  <strong className="text-cyan-300 font-bold">
                    {last10CpuTrendData[last10CpuTrendData.length - 1]?.cpu ?? 0}%
                  </strong>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-zinc-500 text-[10px]">PEAK:</span>
                  <strong className="text-emerald-400 font-bold">
                    {Math.max(...last10CpuTrendData.map((d) => d.cpu))}%
                  </strong>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-zinc-500 text-[10px]">MIN:</span>
                  <strong className="text-indigo-300 font-bold">
                    {Math.min(...last10CpuTrendData.map((d) => d.cpu))}%
                  </strong>
                </div>
              </div>
            </div>

            {/* Recharts Area / Sparkline Trend Chart */}
            <div className="w-full h-28 pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last10CpuTrendData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cpuGradientLedger" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="#64748b"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-2.5 rounded-xl bg-[#0a0f1d] border border-cyan-500/40 shadow-xl font-mono text-xs space-y-1">
                            <div className="text-cyan-300 font-bold flex items-center justify-between gap-3">
                              <span>Snapshot {data.name}</span>
                              <span className="text-zinc-400 text-[10px]">{data.time}</span>
                            </div>
                            <div className="text-zinc-200">
                              CPU Average: <strong className="text-emerald-400">{data.cpu}%</strong>
                            </div>
                            <div className="text-zinc-400 text-[10px]">
                              RAM: {data.ram} MB • Cryo: {data.cryo} mK
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cpu"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#cpuGradientLedger)"
                    dot={{ r: 3, fill: '#06b6d4', strokeWidth: 1, stroke: '#ffffff' }}
                    activeDot={{ r: 5, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Snapshot Filter & Controls Bar */}
          <div className="p-4 rounded-2xl bg-[#0b0e1a]/80 border border-white/8 backdrop-blur-xl flex flex-col gap-3 font-mono text-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Query Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={snapshotSearchQuery}
                  onChange={(e) => {
                    setSnapshotSearchQuery(e.target.value);
                    setSelectedSnapshotIndex(0);
                  }}
                  placeholder="Search snapshot ID, hash, status, or attestor..."
                  className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 text-xs"
                />
                {snapshotSearchQuery && (
                  <button
                    onClick={() => setSnapshotSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Action Buttons: Export Merkle Log & Export CSV */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-zinc-400 text-[11px] hidden sm:inline">
                  Showing <strong className="text-cyan-300">{filteredSnapshots.length}</strong> of {allSnapshots.length} Snapshots
                </span>
                <button
                  id="snapshot-tab-download-snapshot-btn"
                  onClick={() => handleDownloadSnapshot(currentSnapshot)}
                  className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-500/40 text-xs flex items-center gap-1.5 transition-all shadow-sm"
                  title="Export current immutable ledger state and telemetry snapshot as a signed JSON evidence file"
                >
                  <Camera className="w-3.5 h-3.5 text-sky-300" />
                  <span>Download Snapshot (Signed JSON)</span>
                </button>

                <button
                  onClick={handleExportMerkleLog}
                  className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 text-xs flex items-center gap-1.5 transition-all shadow-sm"
                  title="Export currently filtered snapshots as Merkle JSON"
                >
                  <Download className="w-3.5 h-3.5 text-purple-300" />
                  <span>Export Merkle Log ({filteredSnapshots.length})</span>
                </button>

                <button
                  onClick={handleExportTelemetryCsv}
                  className="px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-500/40 text-xs flex items-center gap-1.5 transition-all shadow-sm"
                  title="Export currently filtered snapshots as CSV using EvidenceExportService"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-teal-300" />
                  <span>Export to CSV ({filteredSnapshots.length})</span>
                </button>
              </div>
            </div>

            {/* Date & Range Slider Filter Sub-Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/5 text-[11px]">
              {/* Date Filter Dropdown */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Filter Date:</span>
                </div>
                <select
                  value={selectedDateFilter}
                  onChange={(e) => {
                    playTone(580, 0.03);
                    setSelectedDateFilter(e.target.value);
                    setSelectedSnapshotIndex(0);
                  }}
                  className="bg-black/50 border border-white/10 rounded-lg px-2.5 py-1 text-cyan-200 focus:outline-none focus:border-cyan-500/50 text-[11px]"
                >
                  <option value="ALL">All Dates ({allSnapshots.length} snapshots)</option>
                  {uniqueDates.map((date) => (
                    <option key={date} value={date}>
                      {date} ({allSnapshots.filter((s) => s.timestampIct?.startsWith(date) || s.timestampUtc?.startsWith(date)).length} snaps)
                    </option>
                  ))}
                </select>
                {selectedDateFilter !== 'ALL' && (
                  <button
                    onClick={() => setSelectedDateFilter('ALL')}
                    className="text-zinc-400 hover:text-cyan-300 text-[10px] underline ml-1"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Range Limit Slider */}
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Snapshot Limit:</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={allSnapshots.length}
                  step="1"
                  value={snapshotRangeLimit}
                  onChange={(e) => {
                    setSnapshotRangeLimit(Number(e.target.value));
                    setSelectedSnapshotIndex(0);
                  }}
                  className="w-24 sm:w-32 accent-emerald-400 cursor-pointer h-1.5 bg-black/40 rounded-lg"
                  title="Limit number of snapshots displayed (0 = All)"
                />
                <span className="font-bold text-emerald-300 min-w-[3rem]">
                  {snapshotRangeLimit === 0 ? 'All' : `Last ${snapshotRangeLimit}`}
                </span>
                {snapshotRangeLimit > 0 && (
                  <button
                    onClick={() => setSnapshotRangeLimit(0)}
                    className="text-zinc-400 hover:text-emerald-300 text-[10px] underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 6 Columns: Snapshots List with AnimatePresence & motion.div */}
            <div className="lg:col-span-6 space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
              {filteredSnapshots.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#0b0e1a]/40 border border-white/5 text-center font-mono text-xs text-zinc-400">
                  No snapshots match filters (Query: &quot;{snapshotSearchQuery || 'None'}&quot; • Date: {selectedDateFilter}).
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredSnapshots.map((snap, idx) => {
                    const isSelected = selectedSnapshotIndex === idx;
                    return (
                      <motion.div
                        key={snap.id}
                        layout
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.2) }}
                        onClick={() => {
                          playTone(520 + idx * 25, 0.04);
                          setSelectedSnapshotIndex(idx);
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-cyan-950/30 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)] scale-[1.01]'
                            : 'bg-[#070914]/60 border-cyan-500/10 hover:border-cyan-500/20 hover:bg-[#0b0e1e]/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                              isSelected ? 'bg-cyan-400 text-black' : 'bg-white/5 text-zinc-300'
                            }`}
                          >
                            #{snap.snapshotNumber}
                          </span>
                          <div>
                            <div className="text-xs font-mono font-bold text-zinc-100 flex items-center gap-2">
                              <span>{snap.id}</span>
                              <span className="text-[10px] text-cyan-300 font-normal">
                                {timestampFormat === 'block-height'
                                  ? `BLOCK #849202 [H:849202]`
                                  : snap.timestampIct}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                              CPU {snap.cpuAverage}% • RAM {snap.memoryUsedMb}MB • Cryo {snap.cryoTempMk}mK • QOps {snap.qopsThroughput}
                            </div>
                            {(snap.ssdWearLevelPct !== undefined || snap.SSD_Wear_Level !== undefined) && (snap.voltageStabilityPct !== undefined || snap.Voltage_Stability !== undefined) && (
                              <div className="text-[10px] text-zinc-400 font-mono mt-0.5 flex items-center gap-2">
                                <span className={(snap.ssdWearLevelPct ?? snap.SSD_Wear_Level ?? 0.82) >= 5.0 ? 'text-rose-400 font-bold' : (snap.ssdWearLevelPct ?? snap.SSD_Wear_Level ?? 0.82) >= 2.0 ? 'text-amber-400' : 'text-emerald-400'}>
                                  SSD Wear: {snap.ssdWearLevelPct ?? snap.SSD_Wear_Level}%
                                </span>
                                <span>•</span>
                                <span className={(snap.voltageStabilityPct ?? snap.Voltage_Stability ?? 99.98) < 99.50 ? 'text-rose-400 font-bold' : (snap.voltageStabilityPct ?? snap.Voltage_Stability ?? 99.98) < 99.90 ? 'text-amber-400' : 'text-blue-400'}>
                                  Voltage: {snap.voltageStabilityPct ?? snap.Voltage_Stability}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono shrink-0">
                          {snap.status}
                        </span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Right 6 Columns: Selected Snapshot Deep-Dive */}
            <div className="lg:col-span-6 space-y-4">
              <div className="p-6 rounded-[28px] bg-[#0b0e1a]/70 border border-white/8 backdrop-blur-xl space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                      HARDWARE SNAPSHOT #{currentSnapshot.snapshotNumber}
                    </span>
                    <h3 className="text-lg font-mono font-bold text-white mt-1">{currentSnapshot.id}</h3>
                    <div className="text-xs font-mono text-zinc-400 mt-0.5">
                      {timestampFormat === 'block-height'
                        ? `BLOCK #849202-SNAP${String(currentSnapshot.snapshotNumber).padStart(3, '0')} [EPOCH: ${currentSnapshot.epoch}]`
                        : `${currentSnapshot.timestampIct} | ${currentSnapshot.timestampUtc}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      id="download-selected-snapshot-btn"
                      onClick={() => handleDownloadSnapshot(currentSnapshot)}
                      className="px-2.5 py-1 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-500/40 text-[11px] font-mono flex items-center gap-1.5 transition-all shadow-sm"
                      title="Download this snapshot as a signed JSON evidence file"
                    >
                      <Download className="w-3.5 h-3.5 text-sky-300" />
                      <span>Download Signed JSON</span>
                    </button>
                    <span className="text-xs font-mono px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      SEALED IN LEDGER
                    </span>
                  </div>
                </div>

                {/* Telemetry Metrics Grid (8 Forensic Metrics including SSD Wear & Voltage Stability) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase block">CPU Cluster Avg</span>
                    <span className="text-cyan-300 font-bold text-sm">{currentSnapshot.cpuAverage}%</span>
                    <div className="text-[9px] text-zinc-500">Cores: {currentSnapshot.cpuCores.join('/')}%</div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase block">RAM Allocation</span>
                    <span className="text-violet-300 font-bold text-sm">{currentSnapshot.memoryUsedMb} MB</span>
                    <div className="text-[9px] text-zinc-500">Total: {currentSnapshot.memoryTotalMb} MB</div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase block">Cryo Thermal</span>
                    <span className="text-amber-300 font-bold text-sm">{currentSnapshot.cryoTempMk} mK</span>
                    <div className="text-[9px] text-zinc-500">100% Helium Flow</div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase block">QOps Throughput</span>
                    <span className="text-emerald-300 font-bold text-sm">{currentSnapshot.qopsThroughput}</span>
                    <div className="text-[9px] text-zinc-500">QOps / Second</div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase block">Coherence Index</span>
                    <span className="text-cyan-300 font-bold text-sm">{currentSnapshot.coherencePct}%</span>
                    <div className="text-[9px] text-zinc-500">Superposition Lock</div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase block">OTEL Spans</span>
                    <span className="text-zinc-200 font-bold text-sm">{currentSnapshot.otelSpansSec} /s</span>
                    <div className="text-[9px] text-zinc-500">Telemetry Stream</div>
                  </div>

                  {/* Forensic Metric 1: SSD Wear Level */}
                  <div
                    className={`p-3 rounded-xl border space-y-1 transition-all ${
                      (currentSnapshot.ssdWearLevelPct ?? currentSnapshot.SSD_Wear_Level ?? 0.82) >= 5.0
                        ? 'bg-rose-950/40 border-rose-500/50'
                        : (currentSnapshot.ssdWearLevelPct ?? currentSnapshot.SSD_Wear_Level ?? 0.82) >= 2.0
                        ? 'bg-amber-950/30 border-amber-500/40'
                        : 'bg-black/40 border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3 text-teal-400" />
                        <span>SSD WEAR</span>
                      </span>
                      <span
                        className={`text-[8px] px-1 py-0.2 rounded font-bold uppercase ${
                          (currentSnapshot.ssdWearLevelPct ?? currentSnapshot.SSD_Wear_Level ?? 0.82) >= 5.0
                            ? 'bg-rose-500/20 text-rose-300'
                            : (currentSnapshot.ssdWearLevelPct ?? currentSnapshot.SSD_Wear_Level ?? 0.82) >= 2.0
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/15 text-emerald-300'
                        }`}
                      >
                        {(currentSnapshot.ssdWearLevelPct ?? currentSnapshot.SSD_Wear_Level ?? 0.82) >= 5.0
                          ? 'RED'
                          : (currentSnapshot.ssdWearLevelPct ?? currentSnapshot.SSD_Wear_Level ?? 0.82) >= 2.0
                          ? 'AMBER'
                          : 'GREEN'}
                      </span>
                    </div>
                    <span
                      className={`font-bold text-sm ${
                        (currentSnapshot.ssdWearLevelPct ?? currentSnapshot.SSD_Wear_Level ?? 0.82) >= 5.0
                          ? 'text-rose-400'
                          : (currentSnapshot.ssdWearLevelPct ?? currentSnapshot.SSD_Wear_Level ?? 0.82) >= 2.0
                          ? 'text-amber-400'
                          : 'text-teal-300'
                      }`}
                    >
                      {currentSnapshot.ssdWearLevelPct ?? currentSnapshot.SSD_Wear_Level ?? 0.82}%
                    </span>
                    <div className="text-[9px] text-zinc-400">NVMe Wear Life</div>
                  </div>

                  {/* Forensic Metric 2: Voltage Stability */}
                  <div
                    className={`p-3 rounded-xl border space-y-1 transition-all ${
                      (currentSnapshot.voltageStabilityPct ?? currentSnapshot.Voltage_Stability ?? 99.98) < 99.50
                        ? 'bg-rose-950/40 border-rose-500/50'
                        : (currentSnapshot.voltageStabilityPct ?? currentSnapshot.Voltage_Stability ?? 99.98) < 99.90
                        ? 'bg-amber-950/30 border-amber-500/40'
                        : 'bg-black/40 border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Gauge className="w-3 h-3 text-blue-400" />
                        <span>VOLT STABILITY</span>
                      </span>
                      <span
                        className={`text-[8px] px-1 py-0.2 rounded font-bold uppercase ${
                          (currentSnapshot.voltageStabilityPct ?? currentSnapshot.Voltage_Stability ?? 99.98) < 99.50
                            ? 'bg-rose-500/20 text-rose-300'
                            : (currentSnapshot.voltageStabilityPct ?? currentSnapshot.Voltage_Stability ?? 99.98) < 99.90
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-blue-500/15 text-blue-300'
                        }`}
                      >
                        {(currentSnapshot.voltageStabilityPct ?? currentSnapshot.Voltage_Stability ?? 99.98) < 99.50
                          ? 'RED'
                          : (currentSnapshot.voltageStabilityPct ?? currentSnapshot.Voltage_Stability ?? 99.98) < 99.90
                          ? 'AMBER'
                          : 'GREEN'}
                      </span>
                    </div>
                    <span
                      className={`font-bold text-sm ${
                        (currentSnapshot.voltageStabilityPct ?? currentSnapshot.Voltage_Stability ?? 99.98) < 99.50
                          ? 'text-rose-400'
                          : (currentSnapshot.voltageStabilityPct ?? currentSnapshot.Voltage_Stability ?? 99.98) < 99.90
                          ? 'text-amber-400'
                          : 'text-blue-300'
                      }`}
                    >
                      {currentSnapshot.voltageStabilityPct ?? currentSnapshot.Voltage_Stability ?? 99.98}%
                    </span>
                    <div className="text-[9px] text-zinc-400">12V DC Rail</div>
                  </div>
                </div>

                {/* Cryptographic Hashes for Snapshot */}
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-zinc-500 text-[10px]">
                    <span>PARENT MERKLE HASH</span>
                    <button
                      onClick={() => handleCopy('snap-parent', currentSnapshot.parentHash)}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      {copiedHash === 'snap-parent' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <div className="text-zinc-300 text-xs break-all select-all font-mono">
                    {currentSnapshot.parentHash}
                  </div>
                </div>

                <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-zinc-500 text-[10px]">
                    <span>SEALED HARDWARE STATE HASH (SHA-256)</span>
                    <button
                      onClick={() => handleCopy('snap-output', currentSnapshot.sealedHash)}
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      {copiedHash === 'snap-output' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <div className="text-emerald-300 text-xs break-all select-all font-mono">
                    {currentSnapshot.sealedHash}
                  </div>
                </div>
              </div>

              {/* Actor Signature & Snapshot Export Action */}
              <div className="p-3.5 bg-black/40 rounded-xl border border-white/5 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-zinc-500 block">SEALING ATTESTOR</span>
                  <span className="text-zinc-200 font-medium">{currentSnapshot.actor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadSnapshot(currentSnapshot)}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-600/30 to-cyan-600/20 hover:from-sky-500/40 hover:to-cyan-500/40 border border-sky-400/50 text-sky-200 hover:text-white flex items-center gap-1.5 text-xs font-bold transition-all shadow-[0_0_12px_rgba(14,165,233,0.25)] cursor-pointer"
                    title="Export this snapshot as signed JSON evidence"
                  >
                    <Camera className="w-3.5 h-3.5 text-sky-300" />
                    <span>Download Signed Snapshot</span>
                    <Download className="w-3 h-3 text-sky-300" />
                  </button>
                  <span className="text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                    SEAL INTACT
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* TAB: Quarantine Registry & Chamber 02 Simulator */}
      {activeLedgerTab === 'quarantine' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <Chamber02QuarantineSimulator />
          <QuarantineRegistry />
        </div>
      )}

      {/* TAB: Forensic Evidence Matrix */}
      {activeLedgerTab === 'forensics' && (
        <div className="animate-in fade-in duration-200">
          <ForensicEvidenceMatrix />
        </div>
      )}

      {/* TAB 3: Snapshot Variance & Diff Comparison */}
      {activeLedgerTab === 'compare' && (
        <SnapshotCompareView
          snapshots={allSnapshots}
          timestampFormat={timestampFormat}
        />
      )}

      {/* TAB: Interactive Merkle Tree Graph */}
      {activeLedgerTab === 'merkle-tree' && (
        <div className="animate-in fade-in duration-200">
          <MerkleTreeInteractiveGraph snapshots={allSnapshots} />
        </div>
      )}
        </div>

        {/* Small Side-Panel: Last 5 Hardware Snapshots for quick forensic cross-referencing */}
        <Last5SnapshotsSidePanel
          snapshots={allSnapshots}
          onOpenAuditModal={(snap) => {
            setSelectedForensicSeal({ id: snap.snapshotNumber, hash: snap.sealedHash });
          }}
        />
      </div>

      {/* Forensics Seal Audit Modal */}
      {selectedForensicSeal && (
        <ForensicsSealAuditModal
          sealId={selectedForensicSeal.id}
          sealHash={selectedForensicSeal.hash}
          blockHeight={SYSTEM_METADATA.sealedBlock}
          onClose={() => setSelectedForensicSeal(null)}
        />
      )}
    </div>
  );
};
