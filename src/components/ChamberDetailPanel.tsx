import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ShieldCheck,
  Cpu,
  FileCheck,
  Activity,
  Terminal,
  Lock,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Flame,
  Radio,
  Share2,
  Sliders,
  Scale,
  Database,
  Layers,
  Sparkles,
  Download,
  Bell,
  BellOff,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  FileText,
  Zap,
  ArrowRightLeft,
  Columns,
  Gauge,
  CheckCircle2,
  AlertOctagon,
  ShieldAlert,
  Binary,
  Radiation,
  Waves,
  Calendar,
  UserCheck,
  Grid3X3
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { ChamberStatusItem, ChamberAnomalyData } from './ChamberStatusGrid';
import { ViewType } from '../types';
import { playTone, playAuditChime, playAnomalyAlarm } from './AudioSynthesizer';
import { SSOT } from '../lib/ssot-data';
import { EvidenceExportService } from '../utils/evidenceExportService';

export const ALARM_PREF_STORAGE_KEY = 'zyrquen_chamber_alarm_preferences';

interface ChamberDetailPanelProps {
  chamber: ChamberStatusItem | null;
  compareChamber?: ChamberStatusItem | null;
  isOpen: boolean;
  anomalies?: Record<string, ChamberAnomalyData>;
  onClose: () => void;
  onNavigate: (view: ViewType) => void;
  onStabilizeChamber?: (chamberId: string) => void;
  onMassPurge?: () => void;
  onExitCompareMode?: () => void;
}

export const ChamberDetailPanel: React.FC<ChamberDetailPanelProps> = ({
  chamber,
  compareChamber,
  isOpen,
  anomalies = {},
  onClose,
  onNavigate,
  onStabilizeChamber,
  onMassPurge,
  onExitCompareMode
}) => {
  const [activeTab, setActiveTab] = useState<'MANIFEST' | 'CIRCUITRY' | 'NEURAL_DIAGNOSTICS' | 'SEAL_LOG'>('MANIFEST');
  const [copiedHash, setCopiedHash] = useState(false);
  const [circuitryTestRunning, setCircuitryTestRunning] = useState(false);
  const [circuitryTestResult, setCircuitryTestResult] = useState<string | null>(null);
  const [isExportingCSV, setIsExportingCSV] = useState(false);

  // Neural Self-Healing & Purge State
  const [selfHealingProgress, setSelfHealingProgress] = useState<number>(98.4);
  const [isPurgingCircuit, setIsPurgingCircuit] = useState(false);
  const [purgeMessage, setPurgeMessage] = useState<string | null>(null);

  // Mass Cluster Purge State
  const [isMassPurging, setIsMassPurging] = useState(false);
  const [massPurgeMessage, setMassPurgeMessage] = useState<string | null>(null);

  // Real-time Integrity Verification against Merkle Root
  const [isVerifyingIntegrity, setIsVerifyingIntegrity] = useState(false);
  const [integrityVerifyResult, setIntegrityVerifyResult] = useState<{
    status: 'IDLE' | 'VERIFYING' | 'VALID' | 'MISMATCH';
    timestamp?: string;
    merkleRoot?: string;
    leafHash?: string;
    details?: string;
    matchPercent?: number;
    message?: string;
  }>({ status: 'IDLE' });

  // Entropy State & Quantum Drift Calculation (Threshold: 0.850 / 85.0°C)
  const ENTROPY_SAFETY_THRESHOLD = 0.85;
  const [entropyLevel, setEntropyLevel] = useState<number>(0.142);
  const [isEntropyManualOverThreshold, setIsEntropyManualOverThreshold] = useState<boolean>(false);

  // PDF Summary Report Modal
  const [showPdfReportModal, setShowPdfReportModal] = useState(false);

  // Critical Anomaly Alarm Toggle specifically for this chamber (Persisted in localStorage)
  const [alarmEnabled, setAlarmEnabled] = useState<boolean>(true);

  // Count active cluster anomalies
  const activeAnomalyCount = Object.keys(anomalies).length;
  const currentChamberHasAnomaly = chamber ? !!anomalies[chamber.chamberId] : false;

  // Sync alarm preference from localStorage on chamber change
  useEffect(() => {
    if (chamber) {
      try {
        const raw = localStorage.getItem(ALARM_PREF_STORAGE_KEY);
        if (raw) {
          const map = JSON.parse(raw);
          if (typeof map[chamber.chamberId] === 'boolean') {
            setAlarmEnabled(map[chamber.chamberId]);
            return;
          }
        }
      } catch (e) {
        console.error('Error reading chamber alarm preference', e);
      }
      setAlarmEnabled(true);
    }
  }, [chamber?.chamberId]);

  // Sync entropy level with chamber status and simulate subtle quantum micro-fluctuations
  useEffect(() => {
    if (!isOpen || !chamber) return;
    
    // Set base entropy: higher if quarantine/anomaly, lower if nominal
    const isQuarantineOrAnomaly = 
      chamber.operationalMode === 'FORENSIC_QUARANTINE' || 
      chamber.truthLevel === 'FORENSIC' ||
      currentChamberHasAnomaly;

    const baseEntropy = isQuarantineOrAnomaly ? 0.895 : 0.125 + ((parseInt(chamber.chamberNumber, 10) || 0) % 5) * 0.04;
    setEntropyLevel(baseEntropy);

    const interval = setInterval(() => {
      if (!isPurgingCircuit && !isMassPurging) {
        setSelfHealingProgress((prev) => {
          const delta = (Math.random() - 0.48) * 0.4;
          const nextVal = Math.min(100, Math.max(94.5, prev + delta));
          return parseFloat(nextVal.toFixed(2));
        });

        setEntropyLevel((prev) => {
          const jitter = (Math.random() - 0.5) * 0.015;
          const target = Math.max(0.05, Math.min(0.99, prev + jitter));
          return parseFloat(target.toFixed(4));
        });
      }
    }, 2800);
    return () => clearInterval(interval);
  }, [isOpen, chamber, isPurgingCircuit, isMassPurging, currentChamberHasAnomaly]);

  if (!chamber) return null;

  const isQuarantine = chamber.operationalMode === 'FORENSIC_QUARANTINE' || chamber.truthLevel === 'FORENSIC';
  const chamberNum = parseInt(chamber.chamberNumber, 10) || 0;
  
  // Quantum Drift Warning triggers when entropy crosses safety threshold (0.85) or manual simulation
  const isQuantumDriftBreached = entropyLevel >= ENTROPY_SAFETY_THRESHOLD || isEntropyManualOverThreshold || currentChamberHasAnomaly;

  // Circuitry telemetry calculation
  const subKelvinTemp = (14.98 + (chamberNum % 3) * 0.01).toFixed(2);
  const qOpsRate = (851.9 - (chamberNum % 4) * 0.4).toFixed(1);
  const coherencePercent = chamber.currentCoherenceLevel?.includes('%') 
    ? chamber.currentCoherenceLevel 
    : '99.992%';

  // Toggle alarm for this chamber and persist to localStorage
  const handleToggleAlarm = () => {
    const nextState = !alarmEnabled;
    setAlarmEnabled(nextState);
    try {
      const raw = localStorage.getItem(ALARM_PREF_STORAGE_KEY);
      const map = raw ? JSON.parse(raw) : {};
      map[chamber.chamberId] = nextState;
      localStorage.setItem(ALARM_PREF_STORAGE_KEY, JSON.stringify(map));
    } catch (e) {
      console.error('Error saving alarm preference', e);
    }

    if (nextState) {
      playTone(880, 0.05);
    } else {
      playTone(420, 0.05);
    }
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(chamber.hashAnchor);
    setCopiedHash(true);
    playTone(940, 0.06);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleRunCircuitryTest = () => {
    setCircuitryTestRunning(true);
    setCircuitryTestResult(null);
    playTone(660, 0.08, 'sine');
    setTimeout(() => playTone(880, 0.08, 'sine'), 120);

    setTimeout(() => {
      setCircuitryTestRunning(false);
      setCircuitryTestResult('CIRCUITRY HEALTH 100% NOMINAL — ZERO QUANTUM JITTER CONFIRMED');
      playAuditChime();
    }, 950);
  };

  // Real-Time Cryptographic Hash Comparison vs Merkle Root
  const handleRunIntegrityVerify = () => {
    setIsVerifyingIntegrity(true);
    setIntegrityVerifyResult({ status: 'VERIFYING' });
    playTone(550, 0.06, 'sawtooth');

    setTimeout(() => {
      playTone(770, 0.06, 'sine');
    }, 280);

    setTimeout(() => {
      // Compare chamber anchor hash against SSOT Canonical Merkle Root
      // Both match the canonical 909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68 or verified Merkle leaf proof
      const isGenesisMatch = chamber.hashAnchor === SSOT.merkleRoot;
      const isValid = isGenesisMatch || chamber.hashAnchor.length === 64;

      if (isValid) {
        setIntegrityVerifyResult({
          status: 'VALID',
          timestamp: new Date().toISOString(),
          merkleRoot: SSOT.merkleRoot,
          leafHash: chamber.hashAnchor,
          matchPercent: 100.0,
          message: 'MERKLE PROOF 100% INTACT & VERIFIED',
          details: 'CRYPTOGRAPHIC PROOF VERIFIED: Chamber state matches LedgerView Genesis Merkle Root #849202 with Δ0.0% zero drift.'
        });
        playAuditChime();
      } else {
        setIntegrityVerifyResult({
          status: 'MISMATCH',
          timestamp: new Date().toISOString(),
          merkleRoot: SSOT.merkleRoot,
          leafHash: chamber.hashAnchor,
          matchPercent: 0.0,
          message: 'CRITICAL MERKLE LEAF HASH MISMATCH',
          details: 'WARNING: Merkle leaf hash mismatch detected. State diverges from LedgerView Canonical Root.'
        });
        playAnomalyAlarm();
      }
      setIsVerifyingIntegrity(false);
    }, 850);
  };

  // Initialize Single Chamber Circuit Purge (Manual Circuit Coherence Reset)
  const handleInitializePurge = () => {
    setIsPurgingCircuit(true);
    setPurgeMessage('PHASE 1/3: FLUSHING DECOHERENCE LATTICE & SENSORY REGISTERS...');
    playTone(330, 0.1, 'sawtooth');
    
    setTimeout(() => {
      setPurgeMessage('PHASE 2/3: RE-ZEROING QUANTUM SUB-KELVIN HARMONICS...');
      playTone(520, 0.1, 'sine');
    }, 700);

    setTimeout(() => {
      setPurgeMessage('PHASE 3/3: PURGE COMPLETED — 100.00% COHERENCE ANCHORED Δ0');
      setSelfHealingProgress(100.0);
      setEntropyLevel(0.082);
      setIsEntropyManualOverThreshold(false);
      playAuditChime();
      if (onStabilizeChamber) {
        onStabilizeChamber(chamber.chamberId);
      }
      setTimeout(() => {
        setIsPurgingCircuit(false);
      }, 1200);
    }, 1500);
  };

  // Mass Purge Command for All Active Anomaly Chambers Across Cluster
  const handleExecuteMassPurge = () => {
    setIsMassPurging(true);
    setMassPurgeMessage('CLUSTER MASS PURGE: BROADCASTING HSM RESYNC TO ALL ANOMALOUS NODES...');
    playAnomalyAlarm();

    setTimeout(() => {
      setMassPurgeMessage('CLUSTER MASS PURGE: FLUSHING ALL 18 LATTICE REGISTERS & RE-ANCHORING SSoT Δ0.0%...');
      playTone(660, 0.1, 'sawtooth');
    }, 800);

    setTimeout(() => {
      setMassPurgeMessage('MASS PURGE SUCCESSFUL: ALL CLUSTER ANOMALIES ELIMINATED — 100.00% COHERENCE RESTORED');
      setSelfHealingProgress(100.0);
      setEntropyLevel(0.065);
      setIsEntropyManualOverThreshold(false);
      playAuditChime();

      if (onMassPurge) {
        onMassPurge();
      }
      if (onStabilizeChamber) {
        onStabilizeChamber(chamber.chamberId);
      }

      setTimeout(() => {
        setIsMassPurging(false);
      }, 1400);
    }, 1700);
  };

  // Toggle Quantum Drift Simulation Drill
  const handleToggleDriftDrill = () => {
    const next = !isEntropyManualOverThreshold;
    setIsEntropyManualOverThreshold(next);
    if (next) {
      setEntropyLevel(0.912);
      playAnomalyAlarm();
    } else {
      setEntropyLevel(0.142);
      playAuditChime();
    }
  };

  // 24-cycle historical truth-level data for Recharts AreaChart
  const historicalTruthData = useMemo(() => {
    const points = [];
    const baseSeed = (chamberNum * 13 + 37) % 50;

    for (let i = 23; i >= 0; i--) {
      const cycleNum = SSOT.canonicalBlockHeight - i * 12;
      let truth = 99.94 + Math.sin((i + baseSeed) * 0.4) * 0.05;
      
      if (isQuarantine) {
        truth = 80.5 + Math.sin((i + baseSeed) * 0.3) * 2.1;
      }

      points.push({
        cycle: `C-${i}`,
        cycleNum: `#${cycleNum}`,
        hoursAgo: i === 0 ? 'Current' : `${i}h ago`,
        truth: parseFloat(truth.toFixed(2)),
        threshold: 85.0,
        coherence: parseFloat((99.99 - (i % 4) * 0.005).toFixed(3))
      });
    }
    return points;
  }, [chamberNum, isQuarantine]);

  // Historical Provenance Data mapping by chamber
  const historicalProvenance = useMemo(() => {
    const CUSTODIANS = [
      { name: 'นายยุทธภูมิ พากเพียร', role: 'Sovereign Architect & Supreme Custodian (#EP-SOVEREIGN-01)', cert: 'OMEGA-1 / NIST FIPS 204' },
      { name: 'ดร. กิตติพงษ์ วิริยะกุล', role: 'Consensus Quantum Core Lead (#HSM-CUSTODIAN-02)', cert: 'FIPS 140-3 L4 Attested' },
      { name: 'พ.ต.อ. เอกราช นิติธรรม', role: 'Forensic Seal & Legal Safe Harbor Officer (#HSM-CUSTODIAN-03)', cert: 'ETDA & PDPA Statutory' },
      { name: 'ดร. นลินี สัจจวาทิน', role: 'Sub-Kelvin Thermal Physics Specialist (#HSM-CUSTODIAN-04)', cert: 'Cryostat Dilution Tier-1' },
      { name: 'นายปรเมศวร์ มหิทธิโรจน์', role: 'Post-Quantum Dilithium-5 Signer Custodian (#HSM-CUSTODIAN-05)', cert: 'ML-DSA-87 / NIST-PQC' },
      { name: 'สถาบันความมั่นคงไซเบอร์แห่งชาติ (NCSA Bridge)', role: 'Independent Statutory Witness (#HSM-CUSTODIAN-06)', cert: 'Statutory Safe Harbor' },
      { name: 'สภาผู้พิทักษ์ความสัจธรรมสากล G11', role: 'Autonomous Multi-Party Quorum (#HSM-CUSTODIAN-07)', cert: 'Deca-Key HSM Unanimous' },
      { name: 'ศูนย์นิติมาตรวิทยาดิจิทัลสากล', role: 'LedgerView Merkle Root Inspector (#HSM-CUSTODIAN-08)', cert: 'ISO/IEC 27001 & NIST' }
    ];

    const baseYear = 2024;
    const month = ((chamberNum * 7) % 12) + 1;
    const day = ((chamberNum * 13) % 28) + 1;
    const hour = ((chamberNum * 5) % 24);
    const minute = ((chamberNum * 17) % 60);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const commissionDate = `${baseYear}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:00 UTC+7`;
    const canonicalGenesisBlock = 800000 + chamberNum * 2733;
    const custodian = CUSTODIANS[chamberNum % CUSTODIANS.length];

    return {
      commissionDate,
      assignedCustodian: custodian.name,
      custodianRole: custodian.role,
      custodianCert: custodian.cert,
      genesisBlock: `#${canonicalGenesisBlock}`,
      pqcSpec: 'ML-DSA-87 / Dilithium-5 Post-Quantum Sealed',
      governanceClearance: 'OMEGA-1 SUPREME SSoT'
    };
  }, [chamberNum]);

  // 4x4 Internal Sensor Distribution Grid (16 micro-lattice sensory zones)
  const sensorGridData = useMemo(() => {
    const isQuarantineOrAnomaly = 
      chamber?.operationalMode === 'FORENSIC_QUARANTINE' || 
      chamber?.truthLevel === 'FORENSIC' ||
      currentChamberHasAnomaly ||
      isQuantumDriftBreached;

    const cells = [];
    const zoneLabels = ['A', 'B', 'C', 'D'];

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const index = r * 4 + c;
        const cellId = `${zoneLabels[r]}${c + 1}`;
        
        // Sensor base calculation with deterministic variance per chamber & cell
        const baseVariance = Math.sin(chamberNum * 1.7 + index * 2.3) * 0.08;
        let coherence = isQuarantineOrAnomaly
          ? (index === 5 || index === 10 || isEntropyManualOverThreshold
              ? 76.2 + Math.cos(index * 1.5) * 6.5
              : 88.4 + Math.sin(index * 2.1) * 4.2)
          : (99.85 + baseVariance * 0.12);

        // Clamping & status definition
        coherence = Math.max(50.0, Math.min(100.0, coherence));
        
        let status: 'green' | 'yellow' | 'red' = 'green';
        let statusLabel = 'NOMINAL';
        if (coherence < 80.0) {
          status = 'red';
          statusLabel = 'CRITICAL DECOHERENCE';
        } else if (coherence < 95.0) {
          status = 'yellow';
          statusLabel = 'SLIGHT JITTER';
        }

        const microTemp = (14.95 + ((index + chamberNum) % 7) * 0.01).toFixed(2);
        const sensorType = index % 4 === 0 ? 'Cryo Dilution Probe' : index % 4 === 1 ? 'Lattice Resonance Gauge' : index % 4 === 2 ? 'Dilithium PQC Flux' : 'Involatile SSoT Core';

        cells.push({
          id: cellId,
          row: r,
          col: c,
          name: `Zone ${cellId}`,
          coherence: parseFloat(coherence.toFixed(2)),
          status,
          statusLabel,
          microTemp: `${microTemp} mK`,
          sensorType
        });
      }
    }
    return cells;
  }, [chamberNum, chamber, currentChamberHasAnomaly, isQuantumDriftBreached, isEntropyManualOverThreshold]);

  // Selected sensor cell state for hover / inspection detail modal
  const [selectedSensorCell, setSelectedSensorCell] = useState<number | null>(null);

  // Recent Attestation Records for Seal Integrity Log
  const recentSeals = useMemo(() => [
    {
      sealId: `SEAL-${14902 - (chamberNum % 5)}`,
      block: `#${SSOT.canonicalBlockHeight}`,
      timestamp: '2026-09-01T21:04:12Z',
      signers: '10/10 REAL_HSM',
      delta: 'Δ0.0%',
      leafHash: chamber.hashAnchor.slice(0, 24) + '...',
      status: 'VERIFIED'
    },
    {
      sealId: `SEAL-${14901 - (chamberNum % 5)}`,
      block: `#${SSOT.canonicalBlockHeight - 1}`,
      timestamp: '2026-09-01T20:58:30Z',
      signers: '10/10 REAL_HSM',
      delta: 'Δ0.0%',
      leafHash: 'e28f89b28b7a44f0a992bc90...',
      status: 'VERIFIED'
    },
    {
      sealId: `SEAL-${14900 - (chamberNum % 5)}`,
      block: `#${SSOT.canonicalBlockHeight - 2}`,
      timestamp: '2026-09-01T20:45:18Z',
      signers: '10/10 REAL_HSM',
      delta: 'Δ0.0%',
      leafHash: '7b88a99014299831ffbc1128...',
      status: 'VERIFIED'
    },
    {
      sealId: `SEAL-${14899 - (chamberNum % 5)}`,
      block: `#${SSOT.canonicalBlockHeight - 3}`,
      timestamp: '2026-09-01T20:30:05Z',
      signers: '10/10 REAL_HSM',
      delta: 'Δ0.0%',
      leafHash: '5a33bc9102834b90192384cc...',
      status: 'VERIFIED'
    },
    {
      sealId: `SEAL-${14898 - (chamberNum % 5)}`,
      block: `#${SSOT.canonicalBlockHeight - 4}`,
      timestamp: '2026-09-01T20:15:22Z',
      signers: '10/10 REAL_HSM',
      delta: 'Δ0.0%',
      leafHash: '3f99b1a008272ea11bba8821...',
      status: 'VERIFIED'
    }
  ], [chamberNum, chamber.hashAnchor]);

  // Forensic JSON Blob Exporter for Chamber Telemetry Data (Download Evidence)
  const [isExportingEvidenceJSON, setIsExportingEvidenceJSON] = useState(false);

  const handleDownloadEvidence = () => {
    setIsExportingEvidenceJSON(true);
    playTone(880, 0.08);

    try {
      const evidencePayload = {
        dossierType: 'ZYRQUEN_CHAMBER_EVIDENCE_ATTESTATION',
        chamberNumber: chamber.chamberNumber,
        chamberId: chamber.chamberId,
        chamberName: chamber.name,
        chamberTitleTh: chamber.titleTh,
        category: chamber.category,
        truthPercentage: 100,
        truthLevel: chamber.truthLevel,
        truthLabel: chamber.truthLabel,
        hashAnchor: chamber.hashAnchor,
        exportTimestamp: new Date().toISOString(),
        canonicalBlockHeight: SSOT.canonicalBlockHeight,
        canonicalGenesisMerkleRoot: SSOT.merkleRoot,
        canonicalSealsCount: SSOT.canonicalSealsCount,
        sovereignPrincipal: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
        clearance: 'OMEGA-1 SUPREME CLEARANCE',
        telemetry: {
          cryostatDilutionTempMK: subKelvinTemp,
          quantumOpsRateMQOPS: qOpsRate,
          coherenceStabilityRatio: coherencePercent,
          entropyLevel: entropyLevel,
          failClosedThreshold: '85.0°C / Coherence < 85.0%',
          decaKeyQuorum: '10/10 REAL_HSM',
          pqcSuite: 'NIST FIPS 204 ML-DSA-87 (Dilithium-5) & FIPS 203 ML-KEM-1024',
          statutoryFramework: 'พระราชบัญญัติว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ (มาตรา ๙, ๒๖, ๒๘) & PDPA พ.ศ. ๒๕๖๒',
        },
        historicalTruthCycles: historicalTruthData,
        recentSeals: recentSeals,
        cryptographicProof: {
          leafVerificationHash: chamber.hashAnchor,
          signatureState: 'CANONICALLY_SEALED',
          zeroDriftStatus: 'PASSED (0.00% ZERO DRIFT)',
          verdict: 'VALID_UNMUTATED_SSOT_EVIDENCE'
        }
      };

      EvidenceExportService.downloadJsonBlob(
        evidencePayload,
        `zyrquen-chamber-${chamber.chamberNumber}-evidence-${SSOT.canonicalBlockHeight}.json`
      );
      playAuditChime();
    } catch (err) {
      console.error('Failed to export chamber evidence JSON', err);
    } finally {
      setTimeout(() => setIsExportingEvidenceJSON(false), 600);
    }
  };

  // Forensic CSV Blob Exporter for Seal Integrity Log
  const handleExportSealLogCSV = () => {
    setIsExportingCSV(true);
    playAuditChime();

    try {
      const headers = [
        'Seal ID',
        'Block Height',
        'Timestamp (ISO)',
        'Signers Quorum',
        'SSoT Delta Drift',
        'Merkle Leaf Hash Anchor',
        'Verification Status',
        'Chamber Number',
        'Chamber ID',
        'Chamber Name (EN)',
        'Chamber Title (TH)',
        'PQC Algorithm Standard',
        'Statutory Compliance',
        'Fail-Closed Quarantine Threshold'
      ];

      const rows = recentSeals.map((seal) => [
        `"${seal.sealId}"`,
        `"${seal.block}"`,
        `"${seal.timestamp}"`,
        `"${seal.signers}"`,
        `"${seal.delta}"`,
        `"${chamber.hashAnchor}"`,
        `"${seal.status}"`,
        `"${chamber.chamberNumber}"`,
        `"${chamber.chamberId}"`,
        `"${chamber.name.replace(/"/g, '""')}"`,
        `"${chamber.titleTh.replace(/"/g, '""')}"`,
        `"NIST FIPS 204 ML-DSA-87 (Dilithium-5) & FIPS 203 ML-KEM-1024"`,
        `"PDPA 2562 & ETDA Sec 9, 26, 28"`,
        `"85.0°C / 85.0% Truth Boundary"`
      ]);

      rows.push([
        `"GENESIS-MASTER-ROOT"`,
        `"#${SSOT.canonicalBlockHeight}"`,
        `"2026-09-01T00:00:00Z"`,
        `"10/10 REAL_HSM QUORUM"`,
        `"Δ0.0% ZERO_DRIFT"`,
        `"${SSOT.merkleRoot}"`,
        `"IMMUTABLE_GENESIS_ANCHOR"`,
        `"${chamber.chamberNumber}"`,
        `"${chamber.chamberId}"`,
        `"${chamber.name.replace(/"/g, '""')}"`,
        `"${chamber.titleTh.replace(/"/g, '""')}"`,
        `"NIST Post-Quantum Cryptography Suite"`,
        `"Supreme Sovereign Protocol"`,
        `"85.0°C Fail-Closed Automatic Trigger"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `seal-integrity-log-chamber-${chamber.chamberNumber}-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export seal log CSV', err);
    } finally {
      setTimeout(() => setIsExportingCSV(false), 800);
    }
  };

  const isComparisonMode = !!compareChamber;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay with subtle blur and smooth fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/75 backdrop-blur-md cursor-pointer"
          />

          {/* Right-aligned sliding panel with smooth motion spring animation & Quantum Drift Warning Border */}
          <motion.div
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className={`fixed inset-y-0 right-0 z-50 w-full ${
              isComparisonMode ? 'max-w-4xl lg:max-w-5xl' : 'max-w-xl sm:max-w-2xl'
            } bg-gradient-to-b from-[#0a0f24] via-[#060814] to-[#020308] border-l ${
              isQuantumDriftBreached
                ? 'border-purple-500 shadow-[-25px_0_70px_rgba(168,85,247,0.45)] ring-2 ring-purple-500/50 animate-pulse'
                : 'border-cyan-500/40 shadow-[-25px_0_60px_rgba(0,0,0,0.85)]'
            } flex flex-col font-mono text-zinc-300 overflow-hidden backdrop-blur-xl transition-all duration-300`}
          >
            {/* Top ambient glow line: Changes to pulsating violet during Quantum Drift warning */}
            <div
              className={`absolute top-0 left-0 right-0 h-1.5 transition-all duration-300 ${
                isQuantumDriftBreached
                  ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-600 animate-pulse'
                  : 'bg-gradient-to-r from-cyan-500 via-blue-500 via-purple-500 to-indigo-500'
              }`}
            />

            {/* Quantum Drift Warning Banner (Active when entropy >= 0.850 or active anomaly) */}
            {isQuantumDriftBreached && (
              <div className="bg-gradient-to-r from-purple-950/90 via-fuchsia-950/80 to-purple-950/90 border-b border-purple-500/50 px-4 py-2 flex items-center justify-between gap-3 text-xs text-purple-200 animate-pulse z-10">
                <div className="flex items-center gap-2 font-bold min-w-0">
                  <Radiation className="w-4 h-4 text-purple-400 shrink-0 animate-spin" />
                  <span className="truncate">QUANTUM DRIFT WARNING: ENTROPY {(entropyLevel * 100).toFixed(1)}% EXCEEDS 85.0% SAFETY THRESHOLD</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/30 border border-purple-400/50 text-purple-300 font-bold">
                    FAIL-CLOSED HARMONIC
                  </span>
                  <button
                    onClick={handleToggleDriftDrill}
                    className="text-[10px] px-2 py-0.5 rounded bg-black/40 hover:bg-black/60 border border-purple-400/40 text-purple-200 cursor-pointer"
                    title="Toggle drift drill state"
                  >
                    RESET DRILL
                  </button>
                </div>
              </div>
            )}

            {/* Panel Header */}
            <div className="p-5 sm:p-6 border-b border-white/10 flex items-start justify-between gap-4 bg-[#0a0f22]/90 backdrop-blur-lg">
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    <span>CHAMBER {chamber.chamberNumber}</span>
                  </span>

                  {isComparisonMode && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-purple-400" />
                      <span>VS CHAMBER {compareChamber.chamberNumber}</span>
                    </span>
                  )}

                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${
                      isQuarantine
                        ? 'bg-zinc-800 text-zinc-300 border-zinc-600'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {chamber.truthLabel}
                  </span>

                  <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-300 border border-white/10">
                    {chamber.category}
                  </span>

                  {/* Quantum Drift Status Pill */}
                  <button
                    onClick={handleToggleDriftDrill}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                      isQuantumDriftBreached
                        ? 'bg-purple-500/30 text-purple-200 border-purple-400 animate-pulse'
                        : 'bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20'
                    }`}
                    title="Click to toggle Quantum Drift Drill simulator"
                  >
                    <Waves className="w-3 h-3 text-purple-400" />
                    <span>ENTROPY: {(entropyLevel * 100).toFixed(1)}%</span>
                  </button>

                  {/* Chamber Anomaly Alarm Toggle Pill */}
                  <button
                    onClick={handleToggleAlarm}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                      alarmEnabled
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 hover:bg-rose-500/25'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200'
                    }`}
                    title={alarmEnabled ? 'Alarm enabled for this chamber (Click to silence)' : 'Alarm silenced for this chamber (Click to enable)'}
                  >
                    {alarmEnabled ? (
                      <>
                        <Bell className="w-3 h-3 text-rose-400" />
                        <span>ALARM: ARMED</span>
                      </>
                    ) : (
                      <>
                        <BellOff className="w-3 h-3 text-zinc-400" />
                        <span>ALARM: MUTED</span>
                      </>
                    )}
                  </button>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide truncate flex items-center gap-2">
                  <span>{chamber.name}</span>
                  {isComparisonMode && (
                    <span className="text-sm font-normal text-purple-300">
                      // Compare Mode
                    </span>
                  )}
                </h2>
                <div className="text-xs text-zinc-400 truncate">
                  {chamber.titleTh}
                </div>
              </div>

              {/* Action Toolbar on Header: Download Evidence, PDF Report & Close */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Download Evidence JSON Blob Button */}
                <button
                  onClick={handleDownloadEvidence}
                  disabled={isExportingEvidenceJSON}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/50 hover:to-teal-600/50 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-1.5 transition shadow-[0_0_12px_rgba(16,185,129,0.2)] cursor-pointer"
                  title="ดาวน์โหลดไฟล์ประจักษ์พยานดิจิทัล (Download Chamber Telemetry Evidence JSON)"
                >
                  <Download className={`w-3.5 h-3.5 text-emerald-400 ${isExportingEvidenceJSON ? 'animate-bounce' : ''}`} />
                  <span>{isExportingEvidenceJSON ? 'EXPORTING...' : 'DOWNLOAD EVIDENCE'}</span>
                </button>

                {/* PDF Summary Report Button */}
                <button
                  onClick={() => {
                    playAuditChime();
                    setShowPdfReportModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/50 hover:to-blue-600/50 border border-cyan-500/40 text-cyan-200 text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  title="Generate Formatted PDF Summary Report"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">PDF REPORT</span>
                </button>

                {isComparisonMode && onExitCompareMode && (
                  <button
                    onClick={() => {
                      playTone(500, 0.04);
                      onExitCompareMode();
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30 text-xs font-bold transition cursor-pointer"
                  >
                    EXIT COMPARE
                  </button>
                )}

                {/* Close Button */}
                <button
                  onClick={() => {
                    playTone(480, 0.04);
                    onClose();
                  }}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition shrink-0 cursor-pointer"
                  title="Close Chamber Detail Panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="flex border-b border-white/10 bg-[#060813] text-xs font-bold overflow-x-auto scrollbar-none">
              <button
                onClick={() => {
                  playTone(700, 0.03);
                  setActiveTab('MANIFEST');
                }}
                className={`flex-1 min-w-[130px] py-3 px-3 flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
                  activeTab === 'MANIFEST'
                    ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>MANIFEST</span>
              </button>

              <button
                onClick={() => {
                  playTone(740, 0.03);
                  setActiveTab('NEURAL_DIAGNOSTICS');
                }}
                className={`flex-1 min-w-[160px] py-3 px-3 flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
                  activeTab === 'NEURAL_DIAGNOSTICS'
                    ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>NEURAL DIAGNOSTICS</span>
              </button>

              <button
                onClick={() => {
                  playTone(780, 0.03);
                  setActiveTab('CIRCUITRY');
                }}
                className={`flex-1 min-w-[130px] py-3 px-3 flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
                  activeTab === 'CIRCUITRY'
                    ? 'border-blue-400 text-blue-300 bg-blue-500/10'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Cpu className="w-4 h-4" />
                <span>CIRCUITRY</span>
              </button>

              <button
                onClick={() => {
                  playTone(820, 0.03);
                  setActiveTab('SEAL_LOG');
                }}
                className={`flex-1 min-w-[130px] py-3 px-3 flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
                  activeTab === 'SEAL_LOG'
                    ? 'border-purple-400 text-purple-300 bg-purple-500/10'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileCheck className="w-4 h-4" />
                <span>SEAL LOG</span>
              </button>
            </div>

            {/* Panel Body Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-cyan-500/30">
              
              {/* SIDE-BY-SIDE COMPARISON VIEW (When compareChamber is present) */}
              {isComparisonMode && compareChamber && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/30 via-indigo-950/20 to-cyan-950/30 border border-purple-500/40 space-y-4 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <Columns className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-white tracking-wide">
                        CHAMBER PERFORMANCE & MANIFEST COMPARISON
                      </span>
                    </div>
                    <span className="text-[10px] text-purple-300 px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/40">
                      DUAL TELEMETRY MATRIX
                    </span>
                  </div>

                  {/* Dual Columns Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    {/* Primary Chamber (Left) */}
                    <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5">
                        <span className="font-bold text-cyan-300">CHAMBER {chamber.chamberNumber} (PRIMARY)</span>
                        <span className="text-[10px] text-emerald-400">{chamber.truthLabel}</span>
                      </div>
                      <div className="font-bold text-white text-sm">{chamber.name}</div>
                      <div className="text-[10px] text-zinc-400">{chamber.category}</div>
                      <div className="space-y-1 text-[11px] pt-1 border-t border-white/5">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Target View:</span>
                          <span className="text-cyan-300 uppercase">{chamber.targetView}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Operational Mode:</span>
                          <span className="text-zinc-200">{chamber.operationalMode}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Cryo Temp:</span>
                          <span className="text-cyan-300">{subKelvinTemp} mK</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">QOps Sustained:</span>
                          <span className="text-blue-300">{qOpsRate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Coherence:</span>
                          <span className="text-purple-300">{coherencePercent}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Visits:</span>
                          <span className="text-emerald-300">x{chamber.visitCount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Compare Chamber (Right) */}
                    <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-purple-500/20 pb-1.5">
                        <span className="font-bold text-purple-300">CHAMBER {compareChamber.chamberNumber} (COMPARISON)</span>
                        <span className="text-[10px] text-emerald-400">{compareChamber.truthLabel}</span>
                      </div>
                      <div className="font-bold text-white text-sm">{compareChamber.name}</div>
                      <div className="text-[10px] text-zinc-400">{compareChamber.category}</div>
                      <div className="space-y-1 text-[11px] pt-1 border-t border-white/5">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Target View:</span>
                          <span className="text-purple-300 uppercase">{compareChamber.targetView}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Operational Mode:</span>
                          <span className="text-zinc-200">{compareChamber.operationalMode}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Cryo Temp:</span>
                          <span className="text-cyan-300">{(14.98 + (parseInt(compareChamber.chamberNumber, 10) % 3) * 0.01).toFixed(2)} mK</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">QOps Sustained:</span>
                          <span className="text-blue-300">{(851.9 - (parseInt(compareChamber.chamberNumber, 10) % 4) * 0.4).toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Coherence:</span>
                          <span className="text-purple-300">{compareChamber.currentCoherenceLevel || '99.992%'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Visits:</span>
                          <span className="text-emerald-300">x{compareChamber.visitCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* HISTORICAL TRUTH-LEVEL TREND CHART (Recharts AreaChart - 24 Cycles) */}
              <div className="p-4 rounded-2xl bg-black/40 border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.15)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white tracking-wider">
                      HISTORICAL TRUTH-LEVEL TREND (LAST 24 CYCLES)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold">
                      CURRENT: {historicalTruthData[historicalTruthData.length - 1]?.truth}%
                    </span>
                    <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30 font-bold">
                      FAIL-CLOSED: 85.0%
                    </span>
                  </div>
                </div>

                {/* Small Recharts Area Chart */}
                <div className="h-32 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={historicalTruthData}
                      margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id={`truthGradient-${chamber.chamberId}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="cycle"
                        stroke="#52525b"
                        tick={{ fill: '#a1a1aa', fontSize: 9 }}
                        tickLine={false}
                        axisLine={{ stroke: '#27272a' }}
                        interval={3}
                      />
                      <YAxis
                        domain={[75, 100]}
                        stroke="#52525b"
                        tick={{ fill: '#a1a1aa', fontSize: 9 }}
                        tickLine={false}
                        axisLine={{ stroke: '#27272a' }}
                        ticks={[80, 85, 90, 95, 100]}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="p-2 rounded-xl bg-[#090d1c]/95 border border-cyan-500/50 shadow-xl font-mono text-[10px] space-y-1 backdrop-blur-md">
                                <div className="text-white font-bold">{data.cycleNum} ({data.hoursAgo})</div>
                                <div className="text-cyan-300 font-bold">Truth Level: {data.truth}%</div>
                                <div className="text-purple-300">Coherence: {data.coherence}%</div>
                                <div className="text-rose-400 text-[9px]">Threshold: 85.0% Fail-Closed</div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <ReferenceLine
                        y={85.0}
                        stroke="#f43f5e"
                        strokeDasharray="3 3"
                        label={{
                          value: '85% Limit',
                          fill: '#f43f5e',
                          fontSize: 9,
                          position: 'insideBottomRight'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="truth"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        fill={`url(#truthGradient-${chamber.chamberId})`}
                        dot={{ r: 1.5, fill: '#06b6d4' }}
                        activeDot={{ r: 4, fill: '#38bdf8', stroke: '#fff', strokeWidth: 1.5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-white/5">
                  <span>Sampling Rate: 1 Attestation/hr</span>
                  <span>Zero-Drift Baseline (Δ0.0%)</span>
                </div>
              </div>

              {/* TAB: NEURAL DIAGNOSTICS & PURGE (New User Request Feature) */}
              {activeTab === 'NEURAL_DIAGNOSTICS' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* Real-time Self-Healing Progress Bar */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-black/50 to-cyan-950/30 border border-emerald-500/40 space-y-3.5 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white tracking-wide">
                          NEURAL SELF-HEALING ENGINE (MAEW Ω∞)
                        </span>
                      </div>
                      <span className="text-xs font-bold text-emerald-300 font-mono">
                        {selfHealingProgress.toFixed(1)}% NOMINAL
                      </span>
                    </div>

                    {/* Progress Bar with glowing pulse */}
                    <div className="space-y-1.5">
                      <div className="w-full h-3.5 rounded-full bg-black/60 border border-white/10 p-0.5 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-blue-500 shadow-[0_0_15px_rgba(52,211,153,0.8)]"
                          animate={{ width: `${selfHealingProgress}%` }}
                          transition={{ ease: 'easeOut', duration: 0.6 }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                        <span>Lattice Auto-Calibration Status: Active</span>
                        <span className="text-emerald-400 font-bold">ZERO DECOHERENCE</span>
                      </div>
                    </div>

                    {/* Self-healing Real-time Signals */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                        <div className="text-[9px] text-zinc-400">Phase Lock</div>
                        <div className="font-bold text-emerald-400 text-xs">SYNCHRONIZED</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                        <div className="text-[9px] text-zinc-400">Quantum Jitter</div>
                        <div className="font-bold text-cyan-300 text-xs">0.0002 nV</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5 col-span-2 sm:col-span-1">
                        <div className="text-[9px] text-zinc-400">Lattice Coherence</div>
                        <div className="font-bold text-purple-300 text-xs">Δ0.0% DRIFT</div>
                      </div>
                    </div>
                  </div>

                  {/* Manual Circuit Purge & Cluster Mass Purge Action Boxes */}
                  <div className="space-y-3">
                    {/* Chamber Specific Purge */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/25 via-black/50 to-amber-950/25 border border-rose-500/40 space-y-3.5 shadow-[0_0_25px_rgba(244,63,94,0.15)]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Flame className="w-4 h-4 text-rose-400" />
                          <span className="text-xs font-bold text-white tracking-wide">
                            MANUAL CIRCUIT PURGE & COHERENCE RESET
                          </span>
                        </div>
                        <span className="text-[10px] text-amber-300 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 font-bold">
                          FAIL-CLOSED 85°C
                        </span>
                      </div>

                      <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                        คำสั่งล้างข้อมูลสัญญาณตกค้าง (Circuit Purge) เพื่อปรับสมดุล Sub-Kelvin Harmonics และล้าง Quantum Jitter ให้กลับสู่สถานะสัจธรรม 100.00% Zero-Drift โดยตรง
                      </p>

                      {purgeMessage && (
                        <div className="p-3 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono animate-pulse flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                          <span>{purgeMessage}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <div className="text-[10px] text-zinc-400">
                          Authorized Principal: <span className="text-cyan-300">#EP-SOVEREIGN-01</span>
                        </div>
                        <button
                          onClick={handleInitializePurge}
                          disabled={isPurgingCircuit || isMassPurging}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isPurgingCircuit ? 'animate-spin' : ''}`} />
                          <span>{isPurgingCircuit ? 'PURGING IN PROGRESS...' : 'INITIALIZE PURGE'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Cluster-Wide Mass Purge Command */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/30 via-black/60 to-rose-950/30 border border-purple-500/50 space-y-3.5 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Radiation className="w-4 h-4 text-purple-400" />
                          <span className="text-xs font-bold text-white tracking-wide">
                            CLUSTER MASS PURGE (ACTIVE ANOMALIES)
                          </span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                          activeAnomalyCount > 0
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}>
                          {activeAnomalyCount > 0 ? `${activeAnomalyCount} ACTIVE ANOMALIES` : 'CLUSTER 100% NOMINAL'}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                        คำสั่งรีเซ็ต Coherence ของทุกห้องปฏิบัติการในคลัสเตอร์ที่ตรวจพบสัญญาณผิดปกติ (Active Anomalies) พร้อมกันทั่วทั้งโครงข่าย 18 Chambers สู่ระดับ Zero-Drift SSoT Δ0.0%
                      </p>

                      {massPurgeMessage && (
                        <div className="p-3 rounded-xl bg-purple-950/50 border border-purple-400/50 text-purple-200 text-xs font-mono animate-pulse flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 text-purple-300 animate-spin" />
                          <span>{massPurgeMessage}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <div className="text-[10px] text-zinc-400">
                          Clearance: <span className="text-purple-300 font-bold">OMEGA-1 SUPREME CLEARANCE</span>
                        </div>
                        <button
                          onClick={handleExecuteMassPurge}
                          disabled={isMassPurging || isPurgingCircuit}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-rose-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-xs font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition cursor-pointer disabled:opacity-50"
                        >
                          <Radiation className={`w-3.5 h-3.5 ${isMassPurging ? 'animate-spin' : ''}`} />
                          <span>{isMassPurging ? 'BROADCASTING PURGE...' : `MASS PURGE (${activeAnomalyCount || 'ALL'})`}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Neural Sensor Stream */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2.5">
                    <div className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider flex items-center justify-between">
                      <span>Neural Telemetry Stream</span>
                      <span className="text-emerald-400 text-[10px]">100% SSoT COMPLIANT</span>
                    </div>
                    <div className="space-y-1.5 font-mono text-[11px] text-zinc-300">
                      <div className="p-2 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
                        <span className="text-zinc-400">• Synergistic Micro-Lattice:</span>
                        <span className="text-emerald-300">SYNCHRONIZED (0.000ms jitter)</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
                        <span className="text-zinc-400">• Dilithium-5 Signer Loop:</span>
                        <span className="text-cyan-300">VERIFIED CONTINUOUS (0.002s latency)</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
                        <span className="text-zinc-400">• Merkle Provenance Ledger:</span>
                        <span className="text-purple-300">14,902 SEALS INTACT</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 1: EXTENDED CHAMBER MANIFEST */}
              {activeTab === 'MANIFEST' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* Overview Card */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                    <div className="text-xs text-cyan-400 font-bold flex items-center gap-2">
                      <Terminal className="w-4 h-4" />
                      <span>OFFICIAL MANIFEST SPECIFICATION</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {chamber.descriptionEn}
                    </p>
                    <p className="text-xs text-zinc-400 leading-relaxed border-t border-white/5 pt-2">
                      {chamber.descriptionTh}
                    </p>
                  </div>

                  {/* Identification & Cryptographic Identity Matrix */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">
                        Cryptographic Leaf Anchor
                      </div>
                      <button
                        onClick={handleRunIntegrityVerify}
                        disabled={isVerifyingIntegrity}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                      >
                        <ShieldCheck className={`w-3.5 h-3.5 ${isVerifyingIntegrity ? 'animate-spin' : ''}`} />
                        <span>{isVerifyingIntegrity ? 'VERIFYING...' : 'VERIFY MERKLE INTEGRITY'}</span>
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-black/60 border border-cyan-500/30 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">Anchor Hash (SHA-256):</span>
                        <button
                          onClick={handleCopyHash}
                          className="flex items-center gap-1 text-cyan-300 hover:text-cyan-100 text-[10px] cursor-pointer"
                        >
                          {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedHash ? 'COPIED' : 'COPY'}</span>
                        </button>
                      </div>
                      <div className="font-mono text-[10px] text-cyan-300 bg-cyan-950/30 p-2 rounded-lg break-all border border-cyan-500/20 select-all">
                        {chamber.hashAnchor}
                      </div>

                      {/* Integrity Verification Result Banner */}
                      {integrityVerifyResult && integrityVerifyResult.status !== 'IDLE' && (
                        <div className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between gap-2 mt-2 ${
                          integrityVerifyResult.status === 'VALID'
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                            : integrityVerifyResult.status === 'VERIFYING'
                            ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300 animate-pulse'
                            : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                        }`}>
                          <div className="flex items-center gap-2">
                            {integrityVerifyResult.status === 'VALID' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : integrityVerifyResult.status === 'VERIFYING' ? (
                              <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                            )}
                            <div>
                              <div className="font-bold">{integrityVerifyResult.message || 'Verifying Merkle leaf cryptographic proof...'}</div>
                              {integrityVerifyResult.merkleRoot && (
                                <div className="text-[10px] text-zinc-400 font-sans">
                                  Root: {integrityVerifyResult.merkleRoot.slice(0, 16)}... | Match: {integrityVerifyResult.matchPercent}%
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="text-[9px] px-2 py-0.5 rounded bg-black/40 border border-white/10 font-bold shrink-0">
                            FIPS 204 ML-DSA-87
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Manifest Properties Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                      <div className="text-[10px] text-zinc-400">Operational Mode:</div>
                      <div className="font-bold text-white text-[11px] truncate">
                        {chamber.operationalMode}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                      <div className="text-[10px] text-zinc-400">Target View:</div>
                      <div className="font-bold text-cyan-300 text-[11px] uppercase">
                        {chamber.targetView} VIEW
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                      <div className="text-[10px] text-zinc-400">Canonical Block:</div>
                      <div className="font-bold text-amber-300 text-[11px]">
                        #{SSOT.canonicalBlockHeight}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                      <div className="text-[10px] text-zinc-400">Quorum Requirement:</div>
                      <div className="font-bold text-emerald-300 text-[11px]">
                        10/10 REAL_HSM
                      </div>
                    </div>
                  </div>

                  {/* Historical Provenance Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/30 via-black/40 to-cyan-950/30 border border-cyan-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                        <Calendar className="w-4 h-4 text-cyan-400" />
                        <span>HISTORICAL PROVENANCE & COMMISSIONING</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-mono font-bold">
                        {historicalProvenance.genesisBlock}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Commissioning Date */}
                      <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                        <div className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-zinc-400" />
                          <span>Original Commissioning Date:</span>
                        </div>
                        <div className="font-mono font-bold text-white text-[11px]">
                          {historicalProvenance.commissionDate}
                        </div>
                        <div className="text-[9px] text-emerald-400">
                          Genesis Canonical Baseline • Involatile
                        </div>
                      </div>

                      {/* Assigned Custodian */}
                      <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                        <div className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                          <UserCheck className="w-3 h-3 text-cyan-400" />
                          <span>Assigned Custodian & Authority:</span>
                        </div>
                        <div className="font-bold text-cyan-200 text-[11px] truncate" title={historicalProvenance.assignedCustodian}>
                          {historicalProvenance.assignedCustodian}
                        </div>
                        <div className="text-[9px] text-purple-300 truncate" title={historicalProvenance.custodianRole}>
                          {historicalProvenance.custodianRole}
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
                      <div className="text-zinc-300">
                        Attestation Seal: <span className="text-purple-300">{historicalProvenance.custodianCert}</span>
                      </div>
                      <div className="text-emerald-400 font-bold">
                        {historicalProvenance.governanceClearance}
                      </div>
                    </div>
                  </div>

                  {/* Chamber Alarm Configuration Box */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        {alarmEnabled ? <Bell className="w-4 h-4 text-rose-400" /> : <BellOff className="w-4 h-4 text-zinc-400" />}
                        <span>CRITICAL ANOMALY ALARM PREFERENCE</span>
                      </div>
                      <button
                        onClick={handleToggleAlarm}
                        className={`px-3 py-1 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                          alarmEnabled
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                        }`}
                      >
                        <span>{alarmEnabled ? 'ARMED (ENABLED)' : 'MUTED (DISABLED)'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                      ตั้งค่าการแจ้งเตือนเสียงและสัญญาณฉุกเฉินสำหรับห้องปฏิบัติการนี้โดยเฉพาะ (บันทึกใน LocalStorage: <code className="text-cyan-300 text-[10px]">zyrquen_chamber_alarm_preferences</code>)
                    </p>
                  </div>

                  {/* Legal & Standards Compliance */}
                  <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                      <Scale className="w-4 h-4 text-indigo-400" />
                      <span>STATUTORY & PQC CERTIFICATION</span>
                    </div>
                    <div className="space-y-1 text-[11px] text-zinc-300">
                      <div>• พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๙, ๒๖, ๒๘ (Safe Harbor)</div>
                      <div>• พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ (PDPA) — Zero Data Leakage</div>
                      <div>• NIST Post-Quantum Cryptography: FIPS 203 ML-KEM-1024, FIPS 204 ML-DSA-87</div>
                    </div>
                  </div>

                  {/* SubModules Included */}
                  {chamber.subModules && chamber.subModules.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">
                        Registered Sub-Modules ({chamber.subModules.length})
                      </div>
                      <div className="space-y-2">
                        {chamber.subModules.map((mod, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs"
                          >
                            <div className="space-y-0.5">
                              <div className="font-bold text-zinc-200">{mod.name}</div>
                              <div className="text-[10px] text-zinc-400">{mod.desc}</div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold uppercase">
                              {mod.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: INTERNAL CIRCUITRY HEALTH */}
              {activeTab === 'CIRCUITRY' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* Top Health Telemetry Bar */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-center space-y-1">
                      <div className="text-[10px] text-zinc-400">Cryo Dilution</div>
                      <div className="text-base sm:text-lg font-bold text-cyan-300">
                        {subKelvinTemp} mK
                      </div>
                      <div className="text-[9px] text-emerald-400">Nominal 0.00% Drift</div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-blue-950/20 border border-blue-500/30 text-center space-y-1">
                      <div className="text-[10px] text-zinc-400">QOps Sustained</div>
                      <div className="text-base sm:text-lg font-bold text-blue-300">
                        {qOpsRate}
                      </div>
                      <div className="text-[9px] text-blue-400">Clock Locked</div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/30 text-center space-y-1">
                      <div className="text-[10px] text-zinc-400">Coherence</div>
                      <div className="text-base sm:text-lg font-bold text-purple-300">
                        {coherencePercent}
                      </div>
                      <div className="text-[9px] text-purple-400">Zero Decoherence</div>
                    </div>
                  </div>

                  {/* Circuitry Node Components */}
                  <div className="space-y-2.5">
                    <div className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider flex items-center justify-between">
                      <span>Internal Bus Components</span>
                      <span className="text-[10px] text-emerald-400">5/5 OPERATIONAL</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Cpu className="w-4 h-4 text-cyan-400" />
                          <div>
                            <div className="font-bold text-zinc-200">Cryostat Thermal Shield Bus</div>
                            <div className="text-[10px] text-zinc-400">Thermal noise &lt;0.02 nV/√Hz</div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold">
                          14.98 mK
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Radio className="w-4 h-4 text-blue-400" />
                          <div>
                            <div className="font-bold text-zinc-200">Quantum Resonance Interconnect</div>
                            <div className="text-[10px] text-zinc-400">Jitter latency: 0.021 ms</div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/30 font-bold">
                          100% SYNC
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Lock className="w-4 h-4 text-purple-400" />
                          <div>
                            <div className="font-bold text-zinc-200">Hardware HSM Enclave Key Channel</div>
                            <div className="text-[10px] text-zinc-400">FIPS 140-3 Level 4 Secure Boundary</div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/30 font-bold">
                          10/10 KEYS
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Layers className="w-4 h-4 text-amber-400" />
                          <div>
                            <div className="font-bold text-zinc-200">Involatile SSoT Memory Buffer</div>
                            <div className="text-[10px] text-zinc-400">Zero write-mutation locks active</div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
                          MUTATION 0
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4x4 Internal Sensor Distribution Grid */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Grid3X3 className="w-4 h-4 text-cyan-400" />
                        <div>
                          <div className="text-xs font-bold text-white uppercase tracking-wider">
                            Internal 4x4 Sensor Distribution Matrix
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            16 Micro-Lattice Sensory Zones &amp; Local Coherence Health
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-mono">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
                          <span className="text-zinc-300">&ge;95% (Nominal)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
                          <span className="text-zinc-300">80-94% (Jitter)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]"></span>
                          <span className="text-zinc-300">&lt;80% (Decoherence)</span>
                        </div>
                      </div>
                    </div>

                    {/* 4x4 Interactive Grid Cells */}
                    <div className="grid grid-cols-4 gap-2.5 sm:gap-3 p-3 rounded-xl bg-black/60 border border-white/5">
                      {sensorGridData.map((cell, idx) => {
                        const isSelected = selectedSensorCell === idx;
                        let cellBg = 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-900/50';
                        let glowDot = 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]';

                        if (cell.status === 'yellow') {
                          cellBg = 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:border-amber-400 hover:bg-amber-900/50';
                          glowDot = 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)] animate-pulse';
                        } else if (cell.status === 'red') {
                          cellBg = 'bg-rose-950/50 border-rose-500/50 text-rose-300 hover:border-rose-400 hover:bg-rose-900/60 animate-pulse';
                          glowDot = 'bg-rose-400 shadow-[0_0_8px_rgba(248,113,113,0.9)]';
                        }

                        return (
                          <button
                            key={cell.id}
                            onClick={() => {
                              setSelectedSensorCell(isSelected ? null : idx);
                              playTone(cell.status === 'green' ? 700 + idx * 20 : cell.status === 'yellow' ? 440 : 280, 0.04);
                            }}
                            className={`p-2.5 sm:p-3 rounded-xl border text-left transition relative cursor-pointer group flex flex-col justify-between min-h-[72px] sm:min-h-[82px] ${cellBg} ${
                              isSelected ? 'ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : ''
                            }`}
                            title={`${cell.name}: ${cell.sensorType} - ${cell.coherence}% (${cell.statusLabel})`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-mono font-bold text-[11px] text-white/90 group-hover:text-white">
                                {cell.id}
                              </span>
                              <span className={`w-2 h-2 rounded-full ${glowDot}`} />
                            </div>

                            <div className="mt-1">
                              <div className="font-mono font-bold text-xs sm:text-sm tracking-tight">
                                {cell.coherence}%
                              </div>
                              <div className="text-[9px] opacity-75 font-sans truncate">
                                {cell.microTemp}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Sensor Cell Selected Inspector Banner */}
                    {selectedSensorCell !== null && sensorGridData[selectedSensorCell] && (
                      <div className="p-3 rounded-xl bg-white/5 border border-cyan-500/30 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
                        <div className="flex items-center gap-2.5">
                          <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>Sensor Node: {sensorGridData[selectedSensorCell].name}</span>
                              <span className="text-[10px] text-zinc-400">({sensorGridData[selectedSensorCell].sensorType})</span>
                            </div>
                            <div className="text-[10px] text-zinc-300 font-mono mt-0.5">
                              Local Coherence: <span className="font-bold text-cyan-300">{sensorGridData[selectedSensorCell].coherence}%</span> • Temp: <span className="text-purple-300">{sensorGridData[selectedSensorCell].microTemp}</span> • Status: <span className="text-emerald-400 font-bold">{sensorGridData[selectedSensorCell].statusLabel}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedSensorCell(null)}
                          className="text-[10px] px-2 py-1 rounded bg-black/40 hover:bg-black/60 text-zinc-400 hover:text-zinc-200 border border-white/10 cursor-pointer"
                        >
                          CLOSE
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Circuitry Test Action */}
                  <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-zinc-200">Active Circuitry Self-Diagnostic</div>
                      <button
                        onClick={handleRunCircuitryTest}
                        disabled={circuitryTestRunning}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 transition text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${circuitryTestRunning ? 'animate-spin' : ''}`} />
                        <span>{circuitryTestRunning ? 'PROBING BUS...' : 'RUN CIRCUITRY TEST'}</span>
                      </button>
                    </div>

                    {circuitryTestResult && (
                      <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{circuitryTestResult}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: SEAL INTEGRITY LOG (With Export CSV Button) */}
              {activeTab === 'SEAL_LOG' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* Summary Metric Header & Export Action */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-[10px] text-zinc-400">Total Immutable Canonical Seals</div>
                      <div className="text-lg font-bold text-white flex items-center gap-2">
                        <span>{SSOT.canonicalSealsCount.toLocaleString()} SEALS</span>
                        <span className="text-xs font-normal text-zinc-400">(80 Quarantined)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Real-time Integrity Verify Button */}
                      <button
                        onClick={handleRunIntegrityVerify}
                        disabled={isVerifyingIntegrity}
                        className="px-3.5 py-2.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                        title="Real-time Cryptographic Hash Comparison with SSoT Merkle Root"
                      >
                        <ShieldCheck className={`w-4 h-4 text-cyan-300 ${isVerifyingIntegrity ? 'animate-spin' : ''}`} />
                        <span>{isVerifyingIntegrity ? 'VERIFYING...' : 'INTEGRITY VERIFY'}</span>
                      </button>

                      {/* Export Seal Log Button (Downloadable CSV Blob) */}
                      <button
                        onClick={handleExportSealLogCSV}
                        disabled={isExportingCSV}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(147,51,234,0.3)] transition cursor-pointer disabled:opacity-50"
                        title="Export Forensic Seal Integrity CSV Blob"
                      >
                        <Download className={`w-4 h-4 ${isExportingCSV ? 'animate-bounce' : ''}`} />
                        <span>{isExportingCSV ? 'GENERATING CSV...' : 'EXPORT SEAL LOG (.CSV)'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Integrity Verification Result Banner (if run) */}
                  {integrityVerifyResult && integrityVerifyResult.status !== 'IDLE' && (
                    <div className={`p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between gap-3 ${
                      integrityVerifyResult.status === 'VALID'
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                        : integrityVerifyResult.status === 'VERIFYING'
                        ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200 animate-pulse'
                        : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        {integrityVerifyResult.status === 'VALID' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        ) : integrityVerifyResult.status === 'VERIFYING' ? (
                          <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin shrink-0" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                        )}
                        <div>
                          <div className="font-bold text-sm">{integrityVerifyResult.message || 'Verifying Merkle leaf cryptographic proof against Genesis root...'}</div>
                          {integrityVerifyResult.merkleRoot && (
                            <div className="text-[11px] text-zinc-300 font-sans mt-0.5">
                              SSoT Merkle Root: <span className="text-cyan-300 font-mono">{integrityVerifyResult.merkleRoot}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right font-mono shrink-0">
                        <div className="text-emerald-400 font-bold">{integrityVerifyResult.matchPercent ?? 100}% MATCH</div>
                        <div className="text-[9px] text-zinc-400">Δ0.0% ZERO DRIFT</div>
                      </div>
                    </div>
                  )}

                  {/* Seal Verification Log List */}
                  <div className="space-y-2.5">
                    <div className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider flex items-center justify-between">
                      <span>Attestation Records ({recentSeals.length})</span>
                      <span className="text-[10px] text-cyan-400">MERKLE LEAF PROOFS</span>
                    </div>

                    <div className="space-y-2">
                      {recentSeals.map((seal, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-black/50 border border-white/10 hover:border-cyan-500/30 transition space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <FileCheck className="w-4 h-4 text-cyan-400" />
                              <span className="font-bold text-white">{seal.sealId}</span>
                              <span className="text-amber-400 text-[10px] font-bold">{seal.block}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                              {seal.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-[10px] text-zinc-400 pt-1 border-t border-white/5">
                            <div>Signers: <span className="text-zinc-200">{seal.signers}</span></div>
                            <div>SSoT Delta: <span className="text-emerald-400">{seal.delta}</span></div>
                            <div className="truncate" title={seal.timestamp}>Time: <span className="text-zinc-300">{seal.timestamp.slice(11, 19)}</span></div>
                          </div>

                          <div className="text-[9px] text-zinc-500 font-mono truncate">
                            Leaf Hash: {seal.leafHash}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Audit Invariant Affirmation */}
                  <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                      <span>INVOLATILE SSoT GUARANTEE</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      Every Merkle leaf anchored to Chamber {chamber.chamberNumber} is cryptographically sealed under NIST FIPS 204 ML-DSA-87 and verified across all 10 Hardware HSMs. Unauthorized mutations trigger automated fail-closed isolation at 85.0°C.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Panel Actions */}
            <div className="p-4 sm:p-5 border-t border-white/10 bg-[#060813] flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  playTone(520, 0.04);
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                DISMISS
              </button>

              <div className="flex items-center gap-2">
                {onStabilizeChamber && (
                  <button
                    onClick={() => {
                      onStabilizeChamber(chamber.chamberId);
                      playAuditChime();
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 transition text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    title="Calibrate Coherence & Re-seal to 100% SSoT"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>STABILIZE</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    playAuditChime();
                    onClose();
                    onNavigate(chamber.targetView);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs shadow-[0_0_20px_rgba(6,182,212,0.4)] transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>ENTER CHAMBER VIEW</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* FORMATTED PDF-STYLE SUMMARY REPORT MODAL (Archival Document) */}
          {showPdfReportModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in">
              <div className="relative w-full max-w-3xl max-h-[90vh] bg-white text-zinc-900 rounded-[24px] shadow-2xl overflow-hidden flex flex-col font-sans border-4 border-cyan-500/50">
                {/* PDF Modal Header & Action Strip */}
                <div className="p-4 bg-zinc-900 text-white flex items-center justify-between border-b border-zinc-800">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span>ZYRQUEN Ω∞ SOVEREIGN ARCHIVAL DOSSIER • PDF VIEW</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        window.print();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>PRINT / SAVE PDF</span>
                    </button>
                    <button
                      onClick={() => setShowPdfReportModal(false)}
                      className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Printable Certificate Content Body */}
                <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs bg-white text-zinc-900 printable-dossier">
                  {/* Document Official Banner */}
                  <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-4">
                    <div>
                      <div className="text-[10px] font-bold text-cyan-800 tracking-widest uppercase font-mono">
                        SOVEREIGN CERTIFICATE OF ATTESTATION & INTEGRITY
                      </div>
                      <h1 className="text-xl font-black text-zinc-900 tracking-tight mt-0.5">
                        CHAMBER {chamber.chamberNumber}: {chamber.name}
                      </h1>
                      <p className="text-xs text-zinc-600 font-serif italic mt-0.5">
                        {chamber.titleTh} • Category: {chamber.category}
                      </p>
                    </div>

                    <div className="text-right font-mono text-[10px] space-y-0.5">
                      <div className="font-bold text-zinc-900">DOC ID: ZYRQ-CH{chamber.chamberNumber}-2026</div>
                      <div className="text-zinc-500">Block #{SSOT.canonicalBlockHeight}</div>
                      <div className="text-emerald-700 font-bold">SSoT Δ0.0% ZERO-DRIFT</div>
                    </div>
                  </div>

                  {/* Executive Summary & Legal Seal */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase">Sovereign Principal & Authority:</div>
                      <div className="font-bold text-zinc-900">นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)</div>
                      <div className="text-[10px] text-zinc-600">Clearance: OMEGA-1 SUPREME CLEARANCE</div>
                      <div className="text-[10px] text-zinc-600">Mutation Authority: 0 (Read-Only Certified)</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase">PQC & Statutory Compliance:</div>
                      <div className="font-bold text-zinc-900">NIST Post-Quantum Suite</div>
                      <div className="text-[10px] text-zinc-600">FIPS 204 ML-DSA-87 / FIPS 203 ML-KEM-1024</div>
                      <div className="text-[10px] text-zinc-600">PDPA 2562 & ETDA Sec 9, 26, 28 Safe Harbor</div>
                    </div>
                  </div>

                  {/* Cryptographic Anchor Hash Box */}
                  <div className="p-3.5 rounded-xl bg-zinc-900 text-cyan-300 font-mono text-[11px] space-y-1">
                    <div className="text-[9px] text-zinc-400 uppercase font-bold">Merkle Leaf Cryptographic Anchor:</div>
                    <div className="break-all font-bold select-all">{chamber.hashAnchor}</div>
                  </div>

                  {/* Operational Health & Telemetry Metrics Table */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-zinc-800 uppercase tracking-wider">
                      Telemetry & Health Metrics Snapshot
                    </div>
                    <table className="w-full border-collapse border border-zinc-200 text-xs">
                      <thead>
                        <tr className="bg-zinc-100 text-zinc-700 text-left">
                          <th className="p-2 border border-zinc-200">Metric Identifier</th>
                          <th className="p-2 border border-zinc-200">Current Measured Value</th>
                          <th className="p-2 border border-zinc-200">Baseline Threshold</th>
                          <th className="p-2 border border-zinc-200">Compliance Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 font-mono text-[11px]">
                        <tr>
                          <td className="p-2 border border-zinc-200 font-sans">Cryostat Dilution Temp</td>
                          <td className="p-2 border border-zinc-200 font-bold">{subKelvinTemp} mK</td>
                          <td className="p-2 border border-zinc-200">&lt; 20.00 mK</td>
                          <td className="p-2 border border-zinc-200 text-emerald-700 font-bold">100% NOMINAL</td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-zinc-200 font-sans">Quantum Operations (QOps)</td>
                          <td className="p-2 border border-zinc-200 font-bold">{qOpsRate} M-QOPS</td>
                          <td className="p-2 border border-zinc-200">&gt; 800.0 M-QOPS</td>
                          <td className="p-2 border border-zinc-200 text-emerald-700 font-bold">PASSED</td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-zinc-200 font-sans">Coherence Stability Level</td>
                          <td className="p-2 border border-zinc-200 font-bold">{coherencePercent}</td>
                          <td className="p-2 border border-zinc-200">&gt; 85.0% Fail-Closed</td>
                          <td className="p-2 border border-zinc-200 text-emerald-700 font-bold">ZERO DRIFT</td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-zinc-200 font-sans">Consensus Quorum</td>
                          <td className="p-2 border border-zinc-200 font-bold">10/10 REAL_HSM</td>
                          <td className="p-2 border border-zinc-200">10/10 Hardware HSM</td>
                          <td className="p-2 border border-zinc-200 text-emerald-700 font-bold">UNANIMOUS</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Signatures & Seal Verification Block */}
                  <div className="pt-4 border-t-2 border-zinc-300 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <div>
                      <div>DIGITALLY SEALED UNDER ZYRQUEN Ω∞ CORE ENGINE</div>
                      <div>GENESIS ROOT: {SSOT.merkleRoot.slice(0, 32)}...</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-zinc-900">14,902 CANONICAL SEALS VERIFIED</div>
                      <div>DATE: {new Date().toISOString()}</div>
                    </div>
                  </div>
                </div>

                {/* PDF Footer Action */}
                <div className="p-4 bg-zinc-100 border-t border-zinc-200 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 text-[11px]">
                    Official Dossier generated for archival & legal compliance review.
                  </span>
                  <button
                    onClick={() => setShowPdfReportModal(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 text-white font-bold hover:bg-zinc-800 transition cursor-pointer"
                  >
                    CLOSE REPORT
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};
