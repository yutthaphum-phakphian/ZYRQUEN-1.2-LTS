import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  Shield,
  ShieldCheck,
  Search,
  Filter,
  Lock,
  ExternalLink,
  ChevronRight,
  Database,
  Radio,
  Sparkles,
  Info,
  X,
  Clock,
  Zap,
  Activity,
  AlertTriangle,
  Cpu,
  FileCheck,
  Terminal,
  Grid,
  ShieldAlert,
  Key,
  Scale,
  Gauge,
  Timer,
  Volume2,
  RefreshCw,
  Flame,
  ArrowRightLeft,
  Columns,
  Download
} from 'lucide-react';
import { CHAMBERS_DATA, ChamberData } from '../lib/ssot-data';
import { playTone, playAuditChime, playAnomalyAlarm } from './AudioSynthesizer';
import { ChamberDetailPanel } from './ChamberDetailPanel';
import { ViewType } from '../types';
import { EvidenceExportService } from '../services/EvidenceExportService';

export type TruthLevel =
  | 'CANONICAL'
  | 'CONSENSUS'
  | 'FORENSIC'
  | 'LEGAL_STATUTORY'
  | 'OPERATIONAL_RUNTIME'
  | 'PRESENTATION_BUFFER';

export type SystemPhaseStatus = 'RUNTIME_SIMULATION' | 'CANONICAL_FROZEN' | 'CONSENSUS_ACTIVE' | 'QUARANTINE_READY' | 'STATUTORY_SAFE';

export interface ChamberStatusItem extends ChamberData {
  chamberId: string;
  chamberNumber: string;
  name: string;
  truthLevel: TruthLevel;
  truthLabel: string;
  category: string;
  isVisited: boolean;
  visitCount: number;
  lastVisited: string;
  hashAnchor: string;
  targetView: ViewType;
  operationalMode: 'RUNTIME_TELEMETRY' | 'CANONICAL_CORE' | 'CONSENSUS_QUORUM' | 'FORENSIC_QUARANTINE' | 'STATUTORY_LEDGER';
  uptime?: string;
  lastSealId?: string;
  currentCoherenceLevel?: string;
}

export interface ChamberAnomalyData {
  truthPercentage: number;
  coherenceDrift: number;
  reason: string;
}

// 18 Chambers comprehensive 6x3 status data
export const CHAMBERS_18_STATUS_DATA: ChamberStatusItem[] = [
  // ROW 1: 00 - 05
  {
    ...CHAMBERS_DATA[0],
    chamberId: 'room00',
    chamberNumber: '00',
    name: 'EXECUTIVE OVERVIEW',
    truthLevel: 'CANONICAL',
    truthLabel: 'L1 Canonical SSoT',
    category: 'Core & Overview',
    isVisited: true,
    visitCount: 48,
    lastVisited: '2026-09-01T20:28:05.741Z',
    hashAnchor: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    targetView: 'dashboard',
    operationalMode: 'CANONICAL_CORE',
  },
  {
    ...CHAMBERS_DATA[1],
    chamberId: 'room01',
    chamberNumber: '01',
    name: 'G11 CONSENSUS CORE',
    truthLevel: 'CANONICAL',
    truthLabel: 'L1 Canonical Core',
    category: 'Consensus & Core',
    isVisited: true,
    visitCount: 39,
    lastVisited: '2026-09-01T20:27:12.110Z',
    hashAnchor: 'e28f89b28b7a44f0a992bc9098711425667102e3b0c44298fc1c149afbf4c899',
    targetView: 'council',
    operationalMode: 'CANONICAL_CORE',
  },
  {
    ...CHAMBERS_DATA[2],
    chamberId: 'room02',
    chamberNumber: '02',
    name: 'FORENSICS & QUARANTINE',
    truthLevel: 'FORENSIC',
    truthLabel: 'L3 Forensic Isolation',
    category: 'Security & Forensics',
    isVisited: true,
    visitCount: 64,
    lastVisited: '2026-09-01T20:26:40.892Z',
    hashAnchor: '7b88a99014299831ffbc11289947aa1029348bc1209384bcda90192834bfa012',
    targetView: 'security',
    operationalMode: 'FORENSIC_QUARANTINE',
  },
  {
    ...CHAMBERS_DATA[3],
    chamberId: 'room03',
    chamberNumber: '03',
    name: 'CUSTODIAN TRACKER & HSM',
    truthLevel: 'CONSENSUS',
    truthLabel: 'L2 Consensus Quorum',
    category: 'Governance & Keys',
    isVisited: true,
    visitCount: 27,
    lastVisited: '2026-09-01T20:25:01.330Z',
    hashAnchor: '98a123fbc01928471bcca89012398571829012384a8bc901238947bc10293847',
    targetView: 'council',
    operationalMode: 'CONSENSUS_QUORUM',
  },
  {
    ...CHAMBERS_DATA[4],
    chamberId: 'room04',
    chamberNumber: '04',
    name: 'INVARIANTS 10/10 SHIELD',
    truthLevel: 'OPERATIONAL_RUNTIME',
    truthLabel: 'L2 Operational Shield',
    category: 'Integrity & Rules',
    isVisited: true,
    visitCount: 52,
    lastVisited: '2026-09-01T20:24:19.450Z',
    hashAnchor: '1092837465abcdeffedcba09876543211234567890abcdef1234567890abcdef',
    targetView: 'production',
    operationalMode: 'RUNTIME_TELEMETRY',
  },
  {
    ...CHAMBERS_DATA[5],
    chamberId: 'room05',
    chamberNumber: '05',
    name: 'MASTER GATES 22/22',
    truthLevel: 'CONSENSUS',
    truthLabel: 'L2 Multi-Gate Attestation',
    category: 'Quality & Verification',
    isVisited: true,
    visitCount: 31,
    lastVisited: '2026-09-01T20:22:55.670Z',
    hashAnchor: '4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a',
    targetView: 'production',
    operationalMode: 'CONSENSUS_QUORUM',
  },

  // ROW 2: 06 - 11
  {
    ...CHAMBERS_DATA[6],
    chamberId: 'room06',
    chamberNumber: '06',
    name: 'PHOENIX SELF-HEALING',
    truthLevel: 'OPERATIONAL_RUNTIME',
    truthLabel: 'L2 Operational Recovery',
    category: 'Resilience & Healing',
    isVisited: true,
    visitCount: 19,
    lastVisited: '2026-09-01T20:20:10.010Z',
    hashAnchor: '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
    targetView: 'pulse',
    operationalMode: 'RUNTIME_TELEMETRY',
  },
  {
    ...CHAMBERS_DATA[7],
    chamberId: 'room07',
    chamberNumber: '07',
    name: 'FIOS ASSET TREASURY',
    truthLevel: 'LEGAL_STATUTORY',
    truthLabel: 'L3 Statutory Asset Ledger',
    category: 'Treasury & RWA',
    isVisited: true,
    visitCount: 44,
    lastVisited: '2026-09-01T20:18:42.920Z',
    hashAnchor: '3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b',
    targetView: 'vault',
    operationalMode: 'STATUTORY_LEDGER',
  },
  {
    ...CHAMBERS_DATA[8],
    chamberId: 'room08',
    chamberNumber: '08',
    name: 'DILITHIUM-5 PQC ENGINE',
    truthLevel: 'OPERATIONAL_RUNTIME',
    truthLabel: 'L2 PQC Cryptography',
    category: 'Post-Quantum Crypto',
    isVisited: true,
    visitCount: 57,
    lastVisited: '2026-09-01T20:15:20.100Z',
    hashAnchor: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
    targetView: 'quantum',
    operationalMode: 'RUNTIME_TELEMETRY',
  },
  {
    ...CHAMBERS_DATA[9],
    chamberId: 'room09',
    chamberNumber: '09',
    name: 'PHASE REGISTRY 40/40',
    truthLevel: 'CONSENSUS',
    truthLabel: 'L2 Phase Convergence',
    category: 'Lifecycle & State',
    isVisited: true,
    visitCount: 22,
    lastVisited: '2026-09-01T20:12:05.412Z',
    hashAnchor: 'fedcba98765432100123456789abcdefabcdef0123456789abcdef0123456789',
    targetView: 'archive',
    operationalMode: 'CONSENSUS_QUORUM',
  },
  {
    ...CHAMBERS_DATA[10],
    chamberId: 'room10',
    chamberNumber: '10',
    name: 'THAI LEGAL & COURT SAFE',
    truthLevel: 'LEGAL_STATUTORY',
    truthLabel: 'L3 ETDA / PDPA Statutory',
    category: 'Statutory & Compliance',
    isVisited: true,
    visitCount: 71,
    lastVisited: '2026-09-01T20:10:48.880Z',
    hashAnchor: '8492027bca190248a19284710293847102938471029384710293847102938471',
    targetView: 'legal',
    operationalMode: 'STATUTORY_LEDGER',
  },
  {
    ...CHAMBERS_DATA[11],
    chamberId: 'room11',
    chamberNumber: '11',
    name: '8K QUANTUM RADAR',
    truthLevel: 'OPERATIONAL_RUNTIME',
    truthLabel: 'L2 Threat Interception',
    category: 'Radar & Sentinel AI',
    isVisited: true,
    visitCount: 83,
    lastVisited: '2026-09-01T20:09:12.300Z',
    hashAnchor: '7689012384710293847102938471029384710293847102938471029384710293',
    targetView: 'quantum',
    operationalMode: 'RUNTIME_TELEMETRY',
  },

  // ROW 3: 12 - 17
  {
    ...CHAMBERS_DATA[12],
    chamberId: 'room12',
    chamberNumber: '12',
    name: 'SOVEREIGN CLI CONSOLE',
    truthLevel: 'PRESENTATION_BUFFER',
    truthLabel: 'L4 POSIX Shell Sandbox',
    category: 'Terminal & CLI',
    isVisited: true,
    visitCount: 60,
    lastVisited: '2026-09-01T20:05:33.190Z',
    hashAnchor: '0912837410293847102938471029384710293847102938471029384710293847',
    targetView: 'console',
    operationalMode: 'RUNTIME_TELEMETRY',
  },
  {
    ...CHAMBERS_DATA[13],
    chamberId: 'room13',
    chamberNumber: '13',
    name: 'MULTIVERSE CITADEL MAP',
    truthLevel: 'PRESENTATION_BUFFER',
    truthLabel: 'L4 Navigation Matrix',
    category: 'Topology & Views',
    isVisited: true,
    visitCount: 38,
    lastVisited: '2026-09-01T20:01:21.050Z',
    hashAnchor: '5678901234567890abcdefabcdef0123456789abcdef0123456789abcdef0123',
    targetView: 'matrix',
    operationalMode: 'RUNTIME_TELEMETRY',
  },
  {
    ...CHAMBERS_DATA[14],
    chamberId: 'room14',
    chamberNumber: '14',
    name: 'WARP PATH ACCELERATOR',
    truthLevel: 'OPERATIONAL_RUNTIME',
    truthLabel: 'L2 Warp Pipeline',
    category: 'Hardware & Throughput',
    isVisited: true,
    visitCount: 26,
    lastVisited: '2026-09-01T19:58:14.610Z',
    hashAnchor: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
    targetView: 'nexus',
    operationalMode: 'RUNTIME_TELEMETRY',
  },
  {
    ...CHAMBERS_DATA[15],
    chamberId: 'room15',
    chamberNumber: '15',
    name: 'QUANTUM FUEL & CRYO',
    truthLevel: 'OPERATIONAL_RUNTIME',
    truthLabel: 'L2 Subzero Dilution',
    category: 'Cryo & Subzero Bus',
    isVisited: true,
    visitCount: 45,
    lastVisited: '2026-09-01T19:55:02.820Z',
    hashAnchor: '1234567890abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    targetView: 'quantum',
    operationalMode: 'RUNTIME_TELEMETRY',
  },
  {
    ...CHAMBERS_DATA[16],
    chamberId: 'room16',
    chamberNumber: '16',
    name: 'RUNTIME DECK FROZEN',
    truthLevel: 'CANONICAL',
    truthLabel: 'L1 SSoT Immutable Deck',
    category: 'Memory & Immutability',
    isVisited: true,
    visitCount: 50,
    lastVisited: '2026-09-01T19:50:30.400Z',
    hashAnchor: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    targetView: 'archive',
    operationalMode: 'CANONICAL_CORE',
  },
  {
    ...CHAMBERS_DATA[17],
    chamberId: 'room17',
    chamberNumber: '17',
    name: 'AUDIT TRAIL EVIDENCE',
    truthLevel: 'FORENSIC',
    truthLabel: 'L3 ISO 27037 Evidence',
    category: 'Audit & Provenance',
    isVisited: true,
    visitCount: 68,
    lastVisited: '2026-09-01T19:45:10.950Z',
    hashAnchor: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    targetView: 'ledger',
    operationalMode: 'FORENSIC_QUARANTINE',
  },
  {
    ...CHAMBERS_DATA[18],
    chamberId: 'room18',
    chamberNumber: '18',
    name: 'NEURAL SENTINEL & PREDICTIVE GOVERNANCE',
    truthLevel: 'OPERATIONAL_RUNTIME',
    truthLabel: 'L5 Neural Sentinel Telemetry',
    category: 'Intelligence & Predictive Governance',
    isVisited: true,
    visitCount: 92,
    lastVisited: '2026-09-01T19:55:00.000Z',
    hashAnchor: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    targetView: 'dashboard',
    operationalMode: 'RUNTIME_TELEMETRY',
  },
];

interface ChamberStatusGridProps {
  onNavigate: (view: ViewType) => void;
}

export const ChamberStatusGrid: React.FC<ChamberStatusGridProps> = ({ onNavigate }) => {
  const [chambers] = useState<ChamberStatusItem[]>(CHAMBERS_18_STATUS_DATA);
  const [selectedChamber, setSelectedChamber] = useState<ChamberStatusItem | null>(null);
  const [compareChamber, setCompareChamber] = useState<ChamberStatusItem | null>(null);
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [truthFilter, setTruthFilter] = useState<string>('ALL');
  const [showInvariantAudit, setShowInvariantAudit] = useState<boolean>(false);

  // Critical Anomaly State Tracking (triggers when truth < 85% or coherence drifts)
  const [anomalies, setAnomalies] = useState<Record<string, ChamberAnomalyData>>({});

  const hasActiveAnomalies = Object.keys(anomalies).length > 0;

  // Helper to check if alarm is enabled for a specific chamber
  const isChamberAlarmEnabled = (chamberId: string) => {
    try {
      const raw = localStorage.getItem('zyrquen_chamber_alarm_preferences');
      if (raw) {
        const map = JSON.parse(raw);
        if (typeof map[chamberId] === 'boolean') {
          return map[chamberId];
        }
      }
    } catch {
      // ignore
    }
    return true;
  };

  // Toggle Critical Anomaly Simulation (Drill test)
  const handleToggleAnomalySimulation = () => {
    if (hasActiveAnomalies) {
      setAnomalies({});
      playAuditChime();
    } else {
      // Inject Critical Anomaly: drops Chamber 02 truth to 78.4% (<85%) with +0.48% coherence drift
      const ch02 = chambers.find((c) => c.chamberNumber === '02') || chambers[2];
      setAnomalies({
        [ch02.chamberId]: {
          truthPercentage: 78.4,
          coherenceDrift: 0.48,
          reason: 'Decoherence Drift: Truth level dropped to 78.4% (<85.0% Fail-Closed threshold)',
        },
      });

      // Sound warning audio chime if chamber alarm preference is enabled
      if (isChamberAlarmEnabled(ch02.chamberId)) {
        playAnomalyAlarm();
      } else {
        playTone(550, 0.06);
      }
    }
  };

  const handleStabilizeChamber = (chamberId: string) => {
    setAnomalies((prev) => {
      const next = { ...prev };
      delete next[chamberId];
      return next;
    });
    playAuditChime();
  };

  const handleClearAllAnomalies = () => {
    setAnomalies({});
    playAuditChime();
  };

  // Filter logic
  const filteredChambers = chambers.filter((ch) => {
    const matchesSearch =
      ch.num.includes(searchQuery) ||
      ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.titleTh.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTruth = truthFilter === 'ALL' || ch.truthLevel === truthFilter;
    return matchesSearch && matchesTruth;
  });

  // Color-coded styling configuration based on Truth Level & Status
  const getTruthStyle = (level: TruthLevel, isVisited: boolean, operationalMode: string) => {
    // Quarantined / Enclave Sandbox (Gray)
    if (operationalMode === 'FORENSIC_QUARANTINE' || level === 'FORENSIC') {
      return {
        truthBadgeBg: 'bg-zinc-800/90 text-zinc-300 border-zinc-600/80',
        truthDot: 'bg-zinc-400',
        glowBorder: 'border-zinc-600/40 hover:border-zinc-400/60 shadow-[0_0_20px_rgba(113,113,122,0.15)]',
        accentText: 'text-zinc-400',
        typeLabel: 'L3 QUARANTINE',
      };
    }

    // Primary status indicator badge
    switch (level) {
      case 'CANONICAL':
        return {
          truthBadgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
          truthDot: 'bg-amber-400',
          glowBorder: 'border-amber-500/30 hover:border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.12)]',
          accentText: 'text-amber-400',
          typeLabel: 'L1 CANONICAL',
        };
      case 'CONSENSUS':
        return {
          truthBadgeBg: 'bg-violet-500/15 text-violet-300 border-violet-500/40',
          truthDot: 'bg-violet-400',
          glowBorder: 'border-violet-500/30 hover:border-violet-400/60 shadow-[0_0_20px_rgba(139,92,246,0.12)]',
          accentText: 'text-violet-400',
          typeLabel: 'L2 CONSENSUS',
        };
      case 'LEGAL_STATUTORY':
        return {
          truthBadgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
          truthDot: 'bg-emerald-400',
          glowBorder: 'border-emerald-500/30 hover:border-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.12)]',
          accentText: 'text-emerald-400',
          typeLabel: 'L3 STATUTORY',
        };
      case 'OPERATIONAL_RUNTIME':
      default:
        return {
          truthBadgeBg: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
          truthDot: 'bg-blue-400',
          glowBorder: 'border-blue-500/30 hover:border-blue-400/60 shadow-[0_0_20px_rgba(59,130,246,0.12)]',
          accentText: 'text-blue-400',
          typeLabel: 'L2 RUNTIME/SIM',
        };
    }
  };

  // Helper to retrieve detailed metadata for hover tooltips: Uptime, Last Seal ID, and Current Coherence Level
  const getChamberTelemetry = (chamber: ChamberStatusItem) => {
    const chamberIdx = parseInt(chamber.chamberNumber, 10) || 0;
    const anomaly = anomalies[chamber.chamberId];

    if (anomaly) {
      return {
        uptime: `98.120% (DEGRADED — ${anomaly.truthPercentage.toFixed(1)}% TRUTH)`,
        lastSealId: `ALERT-DRIFT#${chamber.hashAnchor.slice(0, 10).toUpperCase()}`,
        coherence: `${(100 - anomaly.coherenceDrift).toFixed(3)}% (DRIFT +${anomaly.coherenceDrift}%)`,
        anomaly
      };
    }
    
    // Uptime calculation (high-availability sovereign cluster)
    const baseUptimeHours = 8492 + chamberIdx * 17;
    const uptime = chamber.uptime || `99.99${(9 - (chamberIdx % 3))}% (${baseUptimeHours}h 41m continuous)`;

    // Last Seal ID (Merkle Leaf anchor ID formatted)
    const leafIndex = (14884 + chamberIdx).toString();
    const lastSealId = chamber.lastSealId || `SEAL-${leafIndex}#${chamber.hashAnchor.slice(0, 10).toUpperCase()}`;

    // Current Coherence Level (quantum / state coherence baseline)
    const coherence = chamber.currentCoherenceLevel || 
      (chamber.operationalMode === 'CANONICAL_CORE'
        ? '100.000% (Absolute Zero-Drift SSoT Δ0)'
        : chamber.operationalMode === 'FORENSIC_QUARANTINE'
        ? '99.988% (Enclave Quarantine Isolation)'
        : chamber.operationalMode === 'CONSENSUS_QUORUM'
        ? '99.998% (10/10 Hardware HSM Quorum)'
        : `99.99${(6 - (chamberIdx % 5))}% (Sub-Kelvin 14.98 mK Synced)`);

    return { uptime, lastSealId, coherence, anomaly: undefined };
  };

  return (
    <div className="space-y-5 rounded-[28px] bg-gradient-to-br from-[#0a0e1c]/95 via-[#070a14]/90 to-[#04060c] border-cyan-500/30 p-6 sm:p-7 backdrop-blur-xl shadow-2xl relative overflow-hidden font-mono">
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Telemetry Strip */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border-cyan-500/30 text-xs font-bold flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5 text-cyan-400" />
              <span>CHAMBER STATUS GRID (6×3 MATRIX)</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>STATUS: ALL 18 VISITED (100%)</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border-blue-500/30 text-xs flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-blue-400" />
              <span>RUNTIME & TELEMETRY SYNCED</span>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>6×3 Chamber Status Grid • ผังสถานะ 18 ห้องปฏิบัติการ</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
            ตารางพิกัด 6 คอลัมน์ × 3 แถว แสดงสถานะ 18 ห้องปฏิบัติการ พร้อมตัวชี้วัดสี:
            <span className="text-emerald-400 font-bold ml-1">● เขียว (Visited)</span>,
            <span className="text-blue-400 font-bold ml-1">● น้ำเงิน (Runtime / Telemetry / Simulation)</span>,
            <span className="text-amber-400 font-bold ml-1">● ทอง (Canonical SSoT)</span>,
            <span className="text-rose-400 font-bold ml-1">● แดง/กุหลาบ (Forensic / Quarantine)</span>
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Download 18 Chambers Telemetry Evidence Manifest */}
          <button
            onClick={() => {
              playTone(880, 0.06);
              EvidenceExportService.exportToJsonFile(
                {
                  dossierType: 'ZYRQUEN_18_CHAMBERS_MATRIX_EVIDENCE',
                  chamberId: 'CHAMBERS-MATRIX-00-17',
                  chamberName: '18 Sovereign Chambers Status Grid Matrix (6x3)',
                  canonicalBlock: 849202,
                  canonicalGenesisMerkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
                  canonicalSealsCount: 14902,
                  latestLiveSealIndex: 14915,
                  principalAuthority: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
                  clearanceLevel: 'OMEGA-1 SUPREME CLEARANCE',
                  telemetryData: {
                    matrixDimensions: '6 Columns × 3 Rows (18 Chambers Active)',
                    entropyScore: 0.325,
                    temperatureC: 36.7,
                    bandwidth: '4.2 G/s',
                    allVisited100Pct: true,
                    chambers: chambers.map((c) => ({
                      chamberId: c.chamberId,
                      chamberNumber: c.chamberNumber,
                      name: c.name,
                      category: c.category,
                      operationalMode: c.operationalMode,
                      truthLevel: c.truthLevel,
                      hashAnchor: c.hashAnchor,
                      lastVisited: c.lastVisited,
                      status: 'RUNTIME-VERIFIED'
                    }))
                  },
                  forensicVerdict: {
                    zeroDrift: '0.00% SSoT ZERO DRIFT',
                    failClosedThreshold: '85.0°C / Coherence < 85.0%',
                    decaKeyQuorum: '10/10 REAL_HSM QUORUM RATIFIED',
                    status: 'RUNTIME-VERIFIED'
                  }
                },
                'zyrquen-18-chambers-matrix-evidence'
              );
              playAuditChime();
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border-emerald-500/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            title="Download full 18 Chambers status manifest JSON"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>DOWNLOAD EVIDENCE</span>
          </button>

          {/* Compare Chambers Toggle Button */}
          <button
            onClick={() => {
              const next = !isCompareMode;
              setIsCompareMode(next);
              if (!next) {
                setCompareChamber(null);
              }
              playTone(next ? 880 : 440, 0.05);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 cursor-pointer ${
              isCompareMode
                ? 'bg-purple-500/25 text-purple-200 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] ring-1 ring-purple-400'
                : 'bg-black/40 text-zinc-300 border-white/10 hover:border-purple-500/50 hover:text-purple-300'
            }`}
            title="Compare two chambers side-by-side"
          >
            <Columns className="w-4 h-4 text-purple-400" />
            <span>{isCompareMode ? 'COMPARE MODE: ON' : 'COMPARE CHAMBERS'}</span>
          </button>

          {/* Anomaly Alarm Simulation Drill Button */}
          <button
            onClick={handleToggleAnomalySimulation}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 cursor-pointer ${
              hasActiveAnomalies
                ? 'bg-rose-500/25 text-rose-200 border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.5)] animate-pulse'
                : 'bg-black/40 text-zinc-300 border-white/10 hover:border-rose-500/50 hover:text-rose-300'
            }`}
            title="Simulate Critical Anomaly Alarm: Truth drops below 85% or coherence drifts"
          >
            <AlertTriangle className={`w-4 h-4 ${hasActiveAnomalies ? 'text-rose-400 animate-bounce' : 'text-rose-400'}`} />
            <span>{hasActiveAnomalies ? 'ALARM ACTIVE: CLEAR' : 'SIMULATE ANOMALY (<85%)'}</span>
          </button>

          <button
            onClick={() => {
              playTone(680, 0.05);
              setShowInvariantAudit(!showInvariantAudit);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 ${
              showInvariantAudit
                ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/50 shadow-md'
                : 'bg-black/40 text-zinc-300 border-white/10 hover:border-cyan-500/40 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>{showInvariantAudit ? 'ซ่อนการตรวจสอบ (Hide Audit)' : 'G11 Invariant Audit (10/10)'}</span>
          </button>
        </div>
      </div>

      {/* COMPARE MODE BANNER (When Compare Mode is Enabled) */}
      {isCompareMode && (
        <div className="relative z-20 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-950/90 via-indigo-950/80 to-purple-950/90 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.3)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border-purple-400 flex items-center justify-center text-purple-300 shrink-0">
              <Columns className="w-4 h-4 text-purple-400 animate-pulse" />
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-2 flex-wrap">
                <span className="text-purple-300 tracking-wider">COMPARE CHAMBERS MODE ACTIVE:</span>
                <span className="px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 text-[10px] font-bold">
                  {selectedChamber && compareChamber
                    ? `COMPARING CH-${selectedChamber.chamberNumber} VS CH-${compareChamber.chamberNumber}`
                    : selectedChamber
                    ? `PRIMARY: CH-${selectedChamber.chamberNumber} (SELECT 2ND CHAMBER)`
                    : 'SELECT 2 CHAMBERS FROM GRID'}
                </span>
              </div>
              <div className="text-[11px] text-purple-200/80 font-sans mt-0.5">
                คลิกเลือกห้องปฏิบัติการ 2 ห้องเพื่อแสดงข้อมูล Manifest, Cryo Telemetry และ Coherence แบบ Side-by-Side ในแผงรายละเอียด
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {selectedChamber && (
              <button
                onClick={() => {
                  setSelectedChamber(null);
                  setCompareChamber(null);
                  playTone(450, 0.04);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/10 text-zinc-300 hover:text-white border-white/10 text-xs font-bold transition cursor-pointer"
              >
                RESET SELECTION
              </button>
            )}
            <button
              onClick={() => {
                setIsCompareMode(false);
                setCompareChamber(null);
                playTone(400, 0.04);
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-500/30 border-purple-400/60 text-purple-200 hover:bg-purple-500/50 transition text-xs font-bold cursor-pointer"
            >
              EXIT COMPARE
            </button>
          </div>
        </div>
      )}

      {/* CRITICAL ANOMALY ALARM BANNER (Flashing Red + Sound Trigger) */}
      {hasActiveAnomalies && (
        <div className="relative z-20 p-4 rounded-2xl bg-gradient-to-r from-rose-950/90 via-red-900/80 to-rose-950/90 border-2 border-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.6)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/30 border-rose-400 flex items-center justify-center text-rose-300 shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-2 flex-wrap">
                <span className="text-rose-300 tracking-wider">CRITICAL ANOMALY DETECTED:</span>
                <span className="px-2 py-0.5 rounded bg-rose-500/40 text-rose-200 text-[10px] font-bold">
                  TRUTH LEVEL DROPPED &lt; 85.0% / COHERENCE DRIFT
                </span>
                <span className="px-2 py-0.5 rounded bg-black/60 text-amber-300 text-[10px] font-bold">
                  QUARANTINE ARMED (85.0°C FAIL-CLOSED)
                </span>
              </div>
              <div className="text-[11px] text-rose-200/90 font-sans mt-0.5">
                ตรวจพบความคลาดเคลื่อนของระดับสัจธรรมต่ำกว่า 85.0% หรือมีสัญญาณควอนตัมหลุดเฟส — เซลล์ที่ได้รับผลกระทบกำลังกะพริบขอบสีแดงฉุกเฉินพร้อมเสียงเตือน
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => playAnomalyAlarm()}
              className="px-3 py-1.5 rounded-xl bg-rose-500/25 border-rose-400/60 text-rose-200 hover:bg-rose-500/40 transition text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              title="Re-play Warning Audio Chime"
            >
              <Volume2 className="w-3.5 h-3.5 text-rose-300" />
              <span>SOUND ALARM</span>
            </button>
            <button
              onClick={handleClearAllAnomalies}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border-emerald-500/60 text-emerald-300 hover:bg-emerald-500/40 transition text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>STABILIZE ALL (RESTORE Δ0)</span>
            </button>
          </div>
        </div>
      )}

      {/* Color Code Legend Strip */}
      <div className="relative z-10 flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-black/40 border-white/8 text-[11px]">
        <span className="text-zinc-400 uppercase font-bold text-[10px] flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>Color Legend:</span>
        </span>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Green = Visited Status (18/18)</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-500/10 border-blue-500/30 text-blue-300 font-bold">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span>Blue = Runtime / Telemetry / Simulation</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/10 border-amber-500/30 text-amber-300 font-bold">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Amber = Canonical SSoT (Genesis)</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-violet-500/10 border-violet-500/30 text-violet-300 font-bold">
          <span className="w-2 h-2 rounded-full bg-violet-400" />
          <span>Violet = Consensus & HSM Quorum</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-rose-500/10 border-rose-500/30 text-rose-300 font-bold">
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          <span>Rose = Forensic & Fail-Closed Quarantine</span>
        </div>
      </div>

      {/* Interactive G11 Threat Vectors & Invariant Protection Audit Panel */}
      {showInvariantAudit && (
        <div className="relative z-10 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0d1326] to-[#080d1a] border-cyan-500/40 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  ZYRQUEN G11 Core - Threat Vectors & Invariant Protection Audit
                </h3>
                <div className="text-[10px] text-zinc-400 flex flex-wrap items-center gap-2 mt-0.5">
                  <span>Block #849202</span>
                  <span>•</span>
                  <span>Root: 909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">14,902 Seals (SSoT Delta 0.00%)</span>
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border-emerald-500/50 text-[10px] font-bold">
              10/10 ALL GREEN PASSED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1.5 p-3 rounded-xl bg-black/50 border-white/5">
              <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-1">
                10 Invariant Laws (10/10 PASSED):
              </span>
              <div className="space-y-1 text-[11px] text-zinc-300 font-mono">
                <div className="flex justify-between">
                  <span>INV-01 Canonical SSoT Non-Mutation</span>
                  <span className="text-emerald-400 font-bold">PASSED (0 mutations)</span>
                </div>
                <div className="flex justify-between">
                  <span>INV-02 Merkle Deterministic Binding</span>
                  <span className="text-emerald-400 font-bold">PASSED (Genesis 909a...)</span>
                </div>
                <div className="flex justify-between">
                  <span>INV-03 Zero Trust Continuous Auth</span>
                  <span className="text-emerald-400 font-bold">PASSED (Dilithium-5)</span>
                </div>
                <div className="flex justify-between">
                  <span>INV-04 Blast Radius Boundary &lt;2.0%</span>
                  <span className="text-emerald-400 font-bold">PASSED (Auto-heal limit)</span>
                </div>
                <div className="flex justify-between">
                  <span>INV-05 Fail-Closed Auto-Defense</span>
                  <span className="text-rose-400 font-bold">PASSED (Quarantine Ch 02)</span>
                </div>
                <div className="flex justify-between">
                  <span>INV-06 Telemetry Non-Authoritative</span>
                  <span className="text-blue-400 font-bold">PASSED (Metrics isolated)</span>
                </div>
                <div className="flex justify-between">
                  <span>INV-07 Zero Drift Baseline</span>
                  <span className="text-emerald-400 font-bold">PASSED (Δ0.00%)</span>
                </div>
                <div className="flex justify-between">
                  <span>INV-08 14,902 Sealed Blocks Continuity</span>
                  <span className="text-amber-400 font-bold">PASSED (SHA-256)</span>
                </div>
                <div className="flex justify-between">
                  <span>INV-09 Thai Principal Passport</span>
                  <span className="text-emerald-400 font-bold">PASSED (EP-SOVEREIGN-01)</span>
                </div>
                <div className="flex justify-between">
                  <span>INV-10 12-Stage Forensic Trace Replay</span>
                  <span className="text-emerald-400 font-bold">PASSED (39.4ms &lt; 142ms)</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 p-3 rounded-xl bg-black/50 border-white/5">
              <span className="text-[10px] uppercase font-bold text-rose-400 block">
                Threat Simulation - INV-05 Fail-Closed Action:
              </span>
              <div className="space-y-1.5 text-[11px] text-zinc-300">
                <div className="p-1.5 rounded-lg bg-rose-950/30 border-rose-500/20 flex items-start gap-1.5">
                  <span className="text-rose-400 font-bold shrink-0">1.</span>
                  <span>Physical HSM Tamper → Active Zeroization + Fail-Closed → <strong>Chamber 02</strong></span>
                </div>
                <div className="p-1.5 rounded-lg bg-white/[0.02] border-white/5 flex items-start gap-1.5">
                  <span className="text-cyan-400 font-bold shrink-0">2.</span>
                  <span>Bot Signature Forgery → Sentinel AI Risk 1.00 Block (Chamber 11)</span>
                </div>
                <div className="p-1.5 rounded-lg bg-white/[0.02] border-white/5 flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold shrink-0">3.</span>
                  <span>Replay Flood → Nonce + Merkle inclusion fail → Drop</span>
                </div>
                <div className="p-1.5 rounded-lg bg-white/[0.02] border-white/5 flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold shrink-0">4.</span>
                  <span>Hash Distortion → SHA-256 chain break → Forensic Ring Flush</span>
                </div>
              </div>
              <div className="text-[10px] text-zinc-400 pt-1 border-t border-white/5">
                Benchmark: 12-Stage replay 39.4ms | Cryo 14.98 mK | QOps 851.9 | Module 17 V24
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="relative z-10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาห้อง (เช่น 00, G11, Radar, Sec 9, Cryo, Forensic)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/40 border-white/10 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <button
            onClick={() => {
              playTone(600, 0.02);
              setTruthFilter('ALL');
            }}
            className={`px-2.5 py-1 rounded-lg border transition ${
              truthFilter === 'ALL'
                ? 'bg-white/15 text-white border-white/40 font-bold'
                : 'bg-black/30 text-zinc-400 border-white/5 hover:text-zinc-200'
            }`}
          >
            All 18 (6×3)
          </button>
          <button
            onClick={() => {
              playTone(620, 0.02);
              setTruthFilter('CANONICAL');
            }}
            className={`px-2.5 py-1 rounded-lg border transition ${
              truthFilter === 'CANONICAL'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                : 'bg-black/30 text-zinc-400 border-white/5 hover:text-amber-300'
            }`}
          >
            Canonical (L1)
          </button>
          <button
            onClick={() => {
              playTone(640, 0.02);
              setTruthFilter('CONSENSUS');
            }}
            className={`px-2.5 py-1 rounded-lg border transition ${
              truthFilter === 'CONSENSUS'
                ? 'bg-violet-500/20 text-violet-300 border-violet-500/50 font-bold'
                : 'bg-black/30 text-zinc-400 border-white/5 hover:text-violet-300'
            }`}
          >
            Consensus (L2)
          </button>
          <button
            onClick={() => {
              playTone(660, 0.02);
              setTruthFilter('OPERATIONAL_RUNTIME');
            }}
            className={`px-2.5 py-1 rounded-lg border transition ${
              truthFilter === 'OPERATIONAL_RUNTIME'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 font-bold'
                : 'bg-black/30 text-zinc-400 border-white/5 hover:text-blue-300'
            }`}
          >
            Runtime / Sim (L2)
          </button>
          <button
            onClick={() => {
              playTone(680, 0.02);
              setTruthFilter('FORENSIC');
            }}
            className={`px-2.5 py-1 rounded-lg border transition ${
              truthFilter === 'FORENSIC'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold'
                : 'bg-black/30 text-zinc-400 border-white/5 hover:text-rose-300'
            }`}
          >
            Forensic (L3)
          </button>
          <button
            onClick={() => {
              playTone(700, 0.02);
              setTruthFilter('LEGAL_STATUTORY');
            }}
            className={`px-2.5 py-1 rounded-lg border transition ${
              truthFilter === 'LEGAL_STATUTORY'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                : 'bg-black/30 text-zinc-400 border-white/5 hover:text-emerald-300'
            }`}
          >
            Statutory (L3)
          </button>
        </div>
      </div>

      {/* THE 6x3 GRID STRUCTURE (6 COLUMNS x 3 ROWS) */}
      <div className="relative z-10 space-y-4 pt-2">
        {truthFilter === 'ALL' && !searchQuery ? (
          <>
            {/* Row 1 Header Tag */}
            <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-white/5 pb-1">
              <span className="font-bold text-zinc-300">ROW 1 (CHAMBERS 00 - 05) • CORE CONSENSUS & ATTESTATION</span>
              <span className="text-zinc-500 text-[10px]">6 UNITS</span>
            </div>

            {/* Row 1: 6 Columns */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
              {filteredChambers.slice(0, 6).map((chamber) => renderChamberCard(chamber))}
            </div>

            {/* Row 2 Header Tag */}
            <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-white/5 pb-1 pt-3">
              <span className="font-bold text-zinc-300">ROW 2 (CHAMBERS 06 - 11) • RESILIENCE, PQC & SENTINEL RADAR</span>
              <span className="text-zinc-500 text-[10px]">6 UNITS</span>
            </div>

            {/* Row 2: 6 Columns */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
              {filteredChambers.slice(6, 12).map((chamber) => renderChamberCard(chamber))}
            </div>

            {/* Row 3 Header Tag */}
            <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-white/5 pb-1 pt-3">
              <span className="font-bold text-zinc-300">ROW 3 (CHAMBERS 12 - 17) • ACCELERATION, CRYO & FORENSIC AUDIT</span>
              <span className="text-zinc-500 text-[10px]">6 UNITS</span>
            </div>

            {/* Row 3: 6 Columns */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
              {filteredChambers.slice(12, 18).map((chamber) => renderChamberCard(chamber))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-white/5 pb-1">
              <span className="font-bold text-cyan-300">FILTERED CHAMBERS: {filteredChambers.length} MATCHING UNITS</span>
              <span className="text-zinc-500 text-[10px]">6-COLUMN RESPONSIVE LAYOUT</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
              {filteredChambers.map((chamber) => renderChamberCard(chamber))}
            </div>
          </>
        )}
      </div>

      {/* Small, Persistent Terminal Status Legend at Bottom */}
      <div className="mt-5 border-t border-white/10 rounded-2xl bg-[#060812]/95 border-cyan-500/20 p-3.5 sm:p-4 text-xs font-mono backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
          {/* Terminal Header */}
          <div className="flex items-center gap-2 text-[11px] text-zinc-400 shrink-0">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-cyan-300 tracking-wider">CHAMBER_STATUS_LEGEND:</span>
            <span className="text-[10px] text-zinc-500 hidden sm:inline">// COLOR-CODED TRUTH MAP</span>
          </div>

          {/* Color-Coding Explanations with Terminal-Styled Icons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-[10px]">
            {/* Green = Visited */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>GREEN = VISITED (x18 SEALED)</span>
            </div>

            {/* Blue = Active / Runtime */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border-blue-500/30 text-blue-300 font-bold">
              <Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>BLUE = ACTIVE RUNTIME / SIM</span>
            </div>

            {/* Amber = Canonical SSoT */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border-amber-500/30 text-amber-300 font-bold">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>AMBER = CANONICAL SSoT</span>
            </div>

            {/* Purple = Consensus Quorum */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border-purple-500/30 text-purple-300 font-bold">
              <Key className="w-3.5 h-3.5 text-purple-400" />
              <span>PURPLE = 10/10 HSM QUORUM</span>
            </div>

            {/* Gray = Quarantined */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/90 border-zinc-600 text-zinc-300 font-bold">
              <ShieldAlert className="w-3.5 h-3.5 text-zinc-400" />
              <span>GRAY = QUARANTINED (80 SEALS)</span>
            </div>

            {/* Flashing Red = Critical Anomaly */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 border-rose-500 text-rose-300 font-bold animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>FLASHING RED = CRITICAL ANOMALY (TRUTH &lt;85% / DRIFT)</span>
            </div>
          </div>
        </div>

        {/* Dim9 & Dim10 Invariant Certification Gates */}
        <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-[10px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-zinc-500 flex items-center gap-1 font-bold">
              <Radio className="w-3 h-3 text-cyan-400" />
              <span>DIMENSIONAL GATES:</span>
            </span>

            {/* Dim 9 Badge */}
            <button
              onClick={() => {
                const ch09 = chambers.find((c) => c.chamberNumber === '09');
                if (ch09) {
                  playTone(720, 0.06);
                  setSelectedChamber(ch09);
                }
              }}
              className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/40 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400 transition cursor-pointer"
              title="Click to inspect Chamber 09 (Phase Registry 40/40) & DIM-09 External Feeds Contract"
            >
              <Cpu className="w-3 h-3 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-cyan-200">DIM-9 [EXTERNAL FEEDS GATE]:</span>
              <span className="text-zinc-400 group-hover:text-cyan-200 font-sans">CH-09 Phase 40/40</span>
              <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-[9px] text-cyan-300 font-bold">ACTIVE</span>
            </button>

            {/* Dim 10 Badge */}
            <button
              onClick={() => {
                const ch10 = chambers.find((c) => c.chamberNumber === '10');
                if (ch10) {
                  playTone(840, 0.06);
                  setSelectedChamber(ch10);
                }
              }}
              className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/40 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-400 transition cursor-pointer"
              title="Click to inspect Chamber 10 (Thai Legal & Court Safe) & DIM-10 Live Runtime Execution"
            >
              <Scale className="w-3 h-3 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-indigo-200">DIM-10 [LIVE RUNTIME EXEC]:</span>
              <span className="text-zinc-400 group-hover:text-indigo-200 font-sans">CH-10 Legal Safe</span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-[9px] text-indigo-300 font-bold">LOCKED</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>SUB-KELVIN TELEMETRY (14.98 mK) • SSoT Δ0.0% ZERO-DRIFT</span>
          </div>
        </div>
      </div>

      {/* RIGHT-ALIGNED SLIDING CHAMBER DETAIL PANEL */}
      <ChamberDetailPanel
        chamber={selectedChamber}
        compareChamber={compareChamber}
        isOpen={!!selectedChamber}
        anomalies={anomalies}
        onClose={() => {
          setSelectedChamber(null);
          setCompareChamber(null);
        }}
        onNavigate={onNavigate}
        onStabilizeChamber={handleStabilizeChamber}
        onMassPurge={handleClearAllAnomalies}
        onExitCompareMode={() => {
          setIsCompareMode(false);
          setCompareChamber(null);
        }}
      />
    </div>
  );

  // Helper render for single chamber card in the 6x3 grid
  function renderChamberCard(chamber: ChamberStatusItem) {
    const style = getTruthStyle(chamber.truthLevel, chamber.isVisited, chamber.operationalMode);
    const isSelected = selectedChamber?.chamberId === chamber.chamberId;
    const isCompareSelected = compareChamber?.chamberId === chamber.chamberId;
    const telemetry = getChamberTelemetry(chamber);
    const anomaly = anomalies[chamber.chamberId];
    const hasAnomaly = !!anomaly;

    return (
      <div
        key={chamber.chamberId}
        onClick={() => {
          if (hasAnomaly) {
            if (isChamberAlarmEnabled(chamber.chamberId)) {
              playAnomalyAlarm();
            } else {
              playTone(650, 0.03);
            }
          } else {
            playTone(650, 0.03);
          }

          if (isCompareMode) {
            if (!selectedChamber) {
              setSelectedChamber(chamber);
            } else if (selectedChamber.chamberId === chamber.chamberId) {
              setSelectedChamber(null);
            } else if (!compareChamber) {
              setCompareChamber(chamber);
              playAuditChime();
            } else if (compareChamber.chamberId === chamber.chamberId) {
              setCompareChamber(null);
            } else {
              setCompareChamber(chamber);
              playAuditChime();
            }
          } else {
            setSelectedChamber(chamber);
          }
        }}
        className={`p-3.5 rounded-2xl bg-[#080c18]/90 border transition-all cursor-pointer relative group flex flex-col justify-between ${
          hasAnomaly
            ? 'border-2 border-rose-500 ring-2 ring-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.7)] animate-pulse bg-rose-950/40'
            : style.glowBorder
        } ${
          isSelected
            ? 'ring-2 ring-cyan-400/80 bg-cyan-950/30 scale-[1.02]'
            : isCompareSelected
            ? 'ring-2 ring-purple-400/80 bg-purple-950/30 scale-[1.02]'
            : 'hover:bg-white/[0.04]'
        }`}
      >
        <div>
          {/* Top Row: Chamber Number Badge + Visited & Truth Indicators */}
          <div className="flex items-center justify-between gap-1 mb-2">
            <div className="flex items-center gap-1.5">
              <span className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs transition ${
                hasAnomaly
                  ? 'bg-rose-500/20 border-rose-500 text-rose-200'
                  : isCompareSelected
                  ? 'bg-purple-500/20 border-purple-500 text-purple-200'
                  : 'bg-white/5 border-white/10 text-white group-hover:border-cyan-400/60 group-hover:text-cyan-300'
              }`}>
                {chamber.chamberNumber}
              </span>

              {/* Green Visited Indicator */}
              <div
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border-emerald-500/30 text-[9px] text-emerald-400 font-bold"
                title={`Visited Status: Active (Count: ${chamber.visitCount})`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>VISITED</span>
              </div>
            </div>

            {/* Truth-Level Status Badge or Critical Anomaly Alarm Badge or Compare Badge */}
            {hasAnomaly ? (
              <span className="px-1.5 py-0.5 rounded text-[8px] border font-bold bg-rose-500/30 text-rose-200 border-rose-500 flex items-center gap-1 animate-pulse">
                <AlertTriangle className="w-2.5 h-2.5 text-rose-300 animate-bounce" />
                <span>&lt;85% ANOMALY</span>
              </span>
            ) : isCompareMode && isSelected ? (
              <span className="px-1.5 py-0.5 rounded text-[8px] border font-bold bg-cyan-500/30 text-cyan-200 border-cyan-400">
                PRIMARY [A]
              </span>
            ) : isCompareMode && isCompareSelected ? (
              <span className="px-1.5 py-0.5 rounded text-[8px] border font-bold bg-purple-500/30 text-purple-200 border-purple-400 animate-pulse">
                COMPARE [B]
              </span>
            ) : (
              <span className={`px-1.5 py-0.5 rounded text-[8px] border font-bold ${style.truthBadgeBg}`}>
                {style.typeLabel}
              </span>
            )}
          </div>

          {/* Chamber Name */}
          <h4 className={`text-xs font-bold transition-colors line-clamp-1 ${
            hasAnomaly ? 'text-rose-200 font-mono tracking-tight' : 'text-zinc-100 group-hover:text-cyan-300'
          }`}>
            {chamber.name}
          </h4>
          <p className="text-[10px] text-zinc-400 font-sans line-clamp-1 mt-0.5">
            {chamber.titleTh}
          </p>

          {/* Runtime / Telemetry or Critical Anomaly Alert Indicator */}
          {hasAnomaly ? (
            <div className="mt-2 p-1.5 rounded-lg bg-rose-950/70 border-rose-500/60 text-[9px] flex items-center justify-between text-rose-200">
              <span className="flex items-center gap-1 font-bold text-rose-300">
                <AlertTriangle className="w-3 h-3 text-rose-400 animate-bounce" />
                <span>TRUTH {anomaly.truthPercentage.toFixed(1)}% (&lt;85%)</span>
              </span>
              <span className="text-rose-300 text-[8px] font-mono">+{anomaly.coherenceDrift}% DRIFT</span>
            </div>
          ) : (
            <div className="mt-2 p-1.5 rounded-lg bg-black/40 border-white/5 text-[9px] flex items-center justify-between">
              <div className="flex items-center gap-1 text-blue-300">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                <span className="truncate">
                  {chamber.operationalMode === 'RUNTIME_TELEMETRY'
                    ? 'RUNTIME/SIM'
                    : chamber.operationalMode === 'CANONICAL_CORE'
                    ? 'FROZEN SSoT'
                    : chamber.operationalMode === 'CONSENSUS_QUORUM'
                    ? '10/10 HSM'
                    : chamber.operationalMode === 'FORENSIC_QUARANTINE'
                    ? 'QUARANTINE'
                    : 'STATUTORY'}
                </span>
              </div>
              <span className="text-zinc-300 font-bold ml-1 shrink-0">
                {chamber.metrics?.[0]?.value || 'PASS'}
              </span>
            </div>
          )}
        </div>

        {/* Footer: Quick Inspect Action */}
        <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] text-zinc-500">
          {hasAnomaly ? (
            <span className="text-rose-400 font-bold flex items-center gap-1">
              <Flame className="w-2.5 h-2.5" />
              <span>FAIL-CLOSED 85°C</span>
            </span>
          ) : (
            <span className="text-zinc-500">x{chamber.visitCount} visits</span>
          )}
          <span className={`group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-bold ${
            hasAnomaly ? 'text-rose-300' : 'text-cyan-400'
          }`}>
            <span>{hasAnomaly ? 'INSPECT ALARM' : 'INSPECT'}</span>
            <ChevronRight className="w-2.5 h-2.5" />
          </span>
        </div>

        {/* HOVER-BASED TOOLTIP: Reveals detailed metadata (Uptime, Last Seal ID, Current Coherence Level) */}
        <div className={`pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-64 sm:w-72 p-3 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 backdrop-blur-md font-mono text-[10px] space-y-2 ${
          hasAnomaly
            ? 'bg-[#18080c]/95 border-2 border-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.5)]'
            : 'bg-[#04060e]/95 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.35)]'
        }`}>
          {/* Tooltip Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <div className="flex items-center gap-1.5">
              <span className={`w-4 h-4 rounded flex items-center justify-center font-bold text-[9px] ${
                hasAnomaly ? 'bg-rose-500/30 text-rose-200' : 'bg-cyan-500/20 text-cyan-300'
              }`}>
                {chamber.chamberNumber}
              </span>
              <span className="font-bold text-white tracking-wide truncate max-w-[150px]">
                {chamber.name}
              </span>
            </div>
            {hasAnomaly ? (
              <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-rose-500/30 text-rose-200 border-rose-500">
                CRITICAL ALARM
              </span>
            ) : (
              <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${style.truthBadgeBg}`}>
                {chamber.truthLevel}
              </span>
            )}
          </div>

          {/* Anomaly Alarm Warning Box in Tooltip */}
          {hasAnomaly && (
            <div className="p-2 rounded-lg bg-rose-950/90 border-rose-500/80 text-rose-200 text-[9px] space-y-1 animate-pulse">
              <div className="flex items-center gap-1 font-bold text-rose-300">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span>CRITICAL ANOMALY: TRUTH LEVEL &lt; 85%</span>
              </div>
              <div className="text-[8.5px] text-rose-200/90">
                Truth: <span className="font-bold text-white">{anomaly.truthPercentage.toFixed(1)}%</span> (Baseline Threshold: 85.0%)
              </div>
              <div className="text-[8.5px] text-rose-200/90">
                Coherence Drift: <span className="font-bold text-rose-300">+{anomaly.coherenceDrift}%</span> (Sub-Kelvin Decoupled)
              </div>
            </div>
          )}

          {/* Tooltip Metadata Rows: Uptime, Last Seal ID, Current Coherence Level */}
          <div className="space-y-1.5">
            {/* Uptime */}
            <div className="flex items-center justify-between bg-black/40 px-2 py-1 rounded-lg border-white/5">
              <span className="text-zinc-400 flex items-center gap-1">
                <Timer className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>Uptime:</span>
              </span>
              <span className={`font-bold ${hasAnomaly ? 'text-rose-400' : 'text-emerald-400'}`}>
                {telemetry.uptime}
              </span>
            </div>

            {/* Last Seal ID */}
            <div className="flex items-center justify-between bg-black/40 px-2 py-1 rounded-lg border-white/5">
              <span className="text-zinc-400 flex items-center gap-1">
                <FileCheck className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Last Seal ID:</span>
              </span>
              <span className="font-bold text-amber-300 tracking-wider text-[9px] truncate max-w-[140px]" title={telemetry.lastSealId}>
                {telemetry.lastSealId}
              </span>
            </div>

            {/* Current Coherence Level */}
            <div className="flex items-center justify-between bg-black/40 px-2 py-1 rounded-lg border-white/5">
              <span className="text-zinc-400 flex items-center gap-1">
                <Gauge className="w-3 h-3 text-purple-400 shrink-0" />
                <span>Current Coherence:</span>
              </span>
              <span className={`font-bold ${hasAnomaly ? 'text-rose-300' : 'text-purple-300'}`}>
                {telemetry.coherence}
              </span>
            </div>
          </div>

          {/* Tooltip Footer Sub-details */}
          <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[8px] text-zinc-500">
            <span className="truncate text-zinc-400">{chamber.category}</span>
            <span className={hasAnomaly ? 'text-rose-400 font-bold' : 'text-cyan-400'}>
              Click cell to open detail panel
            </span>
          </div>

          {/* Tooltip Arrow pointing downward */}
          <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 ${
            hasAnomaly ? 'bg-[#18080c] border-r border-b border-rose-500' : 'bg-[#04060e] border-r border-b border-cyan-500/50'
          }`} />
        </div>
      </div>
    );
  }
};
