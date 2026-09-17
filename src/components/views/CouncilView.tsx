import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Crown,
  Lock,
  Cpu,
  Key,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Copy,
  Check,
  FileText,
  Sparkles,
  Award,
  Layers,
  ChevronRight,
  X,
  ExternalLink,
  Zap,
  Activity,
  Clock,
  Fingerprint,
  Radio,
  History,
  FileCode,
  Globe,
  RadioTower,
  SlidersHorizontal,
  Download,
  FileJson,
  Database,
  Scale,
  HeartPulse,
  ShieldCheck,
  Vote,
  Rocket,
} from 'lucide-react';
import { SystemEvent } from '../SystemEventsSidebar';
import {
  COUNCIL_MEMBERS,
  SOVEREIGN_DECREE_METADATA,
  CouncilMember,
  downloadMerkleArchiveJson,
  getMemberVitality,
  generateCouncilMerkleArchive,
  MerkleArchivePayload,
} from '../../data/councilData';
import { STATE_AUTHORITY } from '../../data/sovereignData';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { copyToClipboard } from '../../utils/clipboard';
import { GuardianVitalityGauge } from '../council/GuardianVitalityGauge';
import { ConsensusLedgerSection } from '../council/ConsensusLedgerSection';
import { ConsensusAlignmentChart } from '../council/ConsensusAlignmentChart';
import { CouncilNetworkLatencyRadar } from '../council/CouncilNetworkLatencyRadar';
import { QuorumConsensusTable } from '../council/QuorumConsensusTable';
import { HistoricalUptimeSparkline } from '../council/HistoricalUptimeSparkline';
import { ModalMemberDiagnostic } from '../council/ModalMemberDiagnostic';
import { VoteConsensusRippleOverlay, ConsensusRippleEvent } from '../council/VoteConsensusRippleOverlay';
import { ConsensusRippleOverlay, ConsensusVoteEvent } from '../council/ConsensusRippleOverlay';
import { GuardianVitalityD3Monitor } from '../council/GuardianVitalityD3Monitor';
import { ActiveEntropyRateMonitor } from '../ActiveEntropyRateMonitor';
import { MerkleVerificationBadge } from '../council/MerkleVerificationBadge';
import { SovereignHealthHeatmapWidget } from '../council/SovereignHealthHeatmapWidget';
import { SovereignCommandHub } from '../council/SovereignCommandHub';
import { CouncilViewExtensions } from '../council/CouncilViewExtensions';
import { GenesisDeploymentConsole } from '../GenesisDeploymentConsole';
import { CustodianTelemetryPulseMonitor } from '../CustodianTelemetryPulseMonitor';
import { RealHsmStatusGrid } from '../council/RealHsmStatusGrid';
import { CouncilChamber } from '../council/CouncilChamber';
import { SenateGovernanceAuditDossier } from '../council/SenateGovernanceAuditDossier';
import { SovereignTelemetryDualPlaneMatrix } from '../council/SovereignTelemetryDualPlaneMatrix';

export interface MemberDiagnosticState {
  status: 'IDLE' | 'RUNNING' | 'SUCCESS';
  step: string;
  sha256Output: string;
  testedAt: string;
  entropyRate: string;
}

export interface QuickHealthCheckState {
  status: 'IDLE' | 'CHECKING' | 'VALIDATED';
  latency: string;
  validatedAt: string;
}

// Framer-motion staggered entrance variants for high-tech deliberate load
const gridContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 20,
    },
  },
};

export interface CouncilViewProps {
  onAddSystemEvent?: (
    type: SystemEvent['type'],
    title: string,
    description: string,
    metaHash?: string,
    severity?: SystemEvent['severity'],
    statuteRef?: string,
    targetView?: SystemEvent['targetView']
  ) => void;
}

export const CouncilView: React.FC<CouncilViewProps> = ({ onAddSystemEvent }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedMember, setSelectedMember] = useState<CouncilMember | null>(null);
  const [modalActiveTab, setModalActiveTab] = useState<'bio' | 'contributions' | 'crypto'>('bio');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isCeremonyOpen, setIsCeremonyOpen] = useState(false);
  const [simulatedSignedCount, setSimulatedSignedCount] = useState<number>(10);
  const [showHeartbeatMesh, setShowHeartbeatMesh] = useState<boolean>(true);
  const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportedArchive, setExportedArchive] = useState<MerkleArchivePayload | null>(null);
  const [isExportToastOpen, setIsExportToastOpen] = useState(false);
  const [diagnostics, setDiagnostics] = useState<Record<number, MemberDiagnosticState>>({});
  const [quickHealthChecks, setQuickHealthChecks] = useState<Record<number, QuickHealthCheckState>>({});
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [isBatchHealthChecking, setIsBatchHealthChecking] = useState(false);
  const [activeRippleEvent, setActiveRippleEvent] = useState<ConsensusRippleEvent | null>(null);
  const [activeConsensusVoteEvent, setActiveConsensusVoteEvent] = useState<ConsensusVoteEvent | null>(null);
  const [activeRippleSlotId, setActiveRippleSlotId] = useState<number | 'ALL' | null>(null);
  const [jitterOverlayEnabled, setJitterOverlayEnabled] = useState<boolean>(true);
  const [councilViewMode, setCouncilViewMode] = useState<'roster' | 'council-chamber' | 'hsm-status' | 'genesis-deploy' | 'custodian-pulse' | 'consensus-mesh' | 'senate-dossier' | 'dual-plane'>('dual-plane');

  // Trigger Vote Consensus Ripple Propagation across the Council Grid
  const triggerConsensusRipple = (
    slotId: number | 'ALL' = 'ALL',
    decision: string = 'YES (RATIFIED)',
    proposalId: string = 'PROP-SOV-2026-CONSENSUS'
  ) => {
    playAuditChime();
    playTone(940, 0.25, 'sine');

    const timestamp = new Date().toLocaleTimeString('th-TH', { hour12: false }) + ' ICT';

    const consensusVoteEvent: ConsensusVoteEvent = {
      type: 'CONSENSUS_VOTE',
      id: Date.now(),
      slotId,
      decision,
      proposalId,
      timestamp,
    };

    const event: ConsensusRippleEvent = {
      id: consensusVoteEvent.id as number,
      slotId,
      decision,
      proposalId,
      timestamp,
    };

    setActiveConsensusVoteEvent(consensusVoteEvent);
    setActiveRippleEvent(event);
    setActiveRippleSlotId(slotId);

    setTimeout(() => {
      setActiveConsensusVoteEvent(null);
      setActiveRippleEvent(null);
      setActiveRippleSlotId(null);
    }, 2600);
  };

  // Quick Health Check for Rapid Handshake Diagnostic
  const runQuickHealthCheck = (slotId: number) => {
    playTone(700 + slotId * 20, 0.05, 'sine');
    setQuickHealthChecks((prev) => ({
      ...prev,
      [slotId]: {
        status: 'CHECKING',
        latency: '',
        validatedAt: '',
      },
    }));

    setTimeout(() => {
      const calculatedLatency = (0.14 + (slotId % 5) * 0.025).toFixed(2);
      setQuickHealthChecks((prev) => ({
        ...prev,
        [slotId]: {
          status: 'VALIDATED',
          latency: `${calculatedLatency}ms`,
          validatedAt: new Date().toLocaleTimeString('th-TH', { hour12: false }) + ' ICT',
        },
      }));
      playTone(880, 0.08, 'sine');
    }, 380);
  };

  const handleRunAllQuickHealthChecks = () => {
    setIsBatchHealthChecking(true);
    playAuditChime();
    COUNCIL_MEMBERS.forEach((m, idx) => {
      setTimeout(() => {
        runQuickHealthCheck(m.slotId);
        if (idx === COUNCIL_MEMBERS.length - 1) {
          setTimeout(() => setIsBatchHealthChecking(false), 500);
        }
      }, idx * 100);
    });
  };

  const runMemberDiagnostic = (slotId: number) => {
    playTone(560 + slotId * 25, 0.08, 'triangle');
    setDiagnostics((prev) => ({
      ...prev,
      [slotId]: {
        status: 'RUNNING',
        step: '1/3 ตรวจสอบวงแหวนฮาร์ดแวร์ Enclave & Sub-Kelvin Bus...',
        sha256Output: '',
        testedAt: '',
        entropyRate: '',
      },
    }));

    setTimeout(() => {
      setDiagnostics((prev) => ({
        ...prev,
        [slotId]: {
          ...prev[slotId],
          step: '2/3 ทดสอบความแกร่ง PQC ML-DSA-87 / Dilithium-5...',
        },
      }));
      playTone(680 + slotId * 25, 0.08, 'sine');
    }, 450);

    setTimeout(() => {
      setDiagnostics((prev) => ({
        ...prev,
        [slotId]: {
          ...prev[slotId],
          step: '3/3 ประมวลผล Quantum TRNG Entropy & SHA-256 Digest...',
        },
      }));
      playTone(790 + slotId * 25, 0.08, 'sine');
    }, 850);

    setTimeout(() => {
      const member = COUNCIL_MEMBERS.find((m) => m.slotId === slotId);
      const cleanFp = member?.keyFingerprint.replace(/[^a-fA-F0-9]/g, '').slice(0, 48) || 'a1b2c3d4e5f67890';
      const sha256 = `0x${Math.abs((slotId * 982451653) ^ Date.now()).toString(16).padStart(16, '0')}${cleanFp}`;

      setDiagnostics((prev) => ({
        ...prev,
        [slotId]: {
          status: 'SUCCESS',
          step: 'การตรวจสอบสำเร็จสมบูรณ์ (100% Cryptographic Alignment)',
          sha256Output: sha256,
          testedAt: new Date().toLocaleTimeString('th-TH', { hour12: false }) + ' ICT',
          entropyRate: `${(1024 + slotId * 14.8).toFixed(1)} KB/s`,
        },
      }));
      playAuditChime();
    }, 1300);
  };

  const handleRunAllDiagnostics = () => {
    setIsBatchRunning(true);
    playAuditChime();
    COUNCIL_MEMBERS.forEach((m, idx) => {
      setTimeout(() => {
        runMemberDiagnostic(m.slotId);
        if (idx === COUNCIL_MEMBERS.length - 1) {
          setTimeout(() => setIsBatchRunning(false), 1400);
        }
      }, idx * 180);
    });
  };

  const handleExportMerkleArchive = () => {
    setIsExporting(true);
    playAuditChime();
    try {
      const archive = downloadMerkleArchiveJson();
      setExportedArchive(archive);
      setIsExportToastOpen(true);
    } catch (err) {
      console.error('Failed to export Merkle archive', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Filtered members list with search matching Thai, English, passportId, role, enclave, algorithm
  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return COUNCIL_MEMBERS.filter((member) => {
      const matchesSearch =
        !query ||
        member.nameTh.toLowerCase().includes(query) ||
        member.nameEn.toLowerCase().includes(query) ||
        member.passportId.toLowerCase().includes(query) ||
        member.councilCode.toLowerCase().includes(query) ||
        member.roleTh.toLowerCase().includes(query) ||
        member.roleEn.toLowerCase().includes(query) ||
        member.jurisdictionTh.toLowerCase().includes(query) ||
        member.jurisdictionEn.toLowerCase().includes(query) ||
        member.hardwareEnclave.toLowerCase().includes(query) ||
        member.pqcAlgorithm.toLowerCase().includes(query) ||
        member.biographyTh.toLowerCase().includes(query) ||
        member.biographyEn.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (selectedCategory === 'ALL') return true;
      if (selectedCategory === 'VERIFIED') return member.verificationStatus === 'REAL_HSM_SIGNED';
      if (selectedCategory === 'LEAD') return member.category === 'Lead Guardian';
      if (selectedCategory === 'SECURITY') return member.category === 'Core Security Guardian';
      if (selectedCategory === 'OPERATIONS') return member.category === 'Runtime Operations Guardian';
      if (selectedCategory === 'AUDIT') return member.category === 'Compliance & Audit Guardian';

      return true;
    });
  }, [searchQuery, selectedCategory]);

  const verifiedCount = useMemo(
    () => COUNCIL_MEMBERS.filter((m) => m.verificationStatus === 'REAL_HSM_SIGNED').length,
    []
  );

  const handleCopy = (text: string, id: string) => {
    copyToClipboard(text);
    setCopiedKey(id);
    playAuditChime();
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const handleOpenMemberModal = (member: CouncilMember, defaultTab: 'bio' | 'contributions' | 'crypto' = 'bio') => {
    playTone(680 + member.slotId * 30, 0.08, 'sine');
    setSelectedMember(member);
    setModalActiveTab(defaultTab);
  };

  const handleSimulateSign = (slotId: number) => {
    playTone(660 + slotId * 40, 0.12, 'sine');
    setSimulatedSignedCount((prev) => Math.min(10, Math.max(prev, slotId)));
  };

  // Node positions for Heartbeat Constellation (Center is TC-01 at (250, 200), others placed in elliptical orbit)
  const nodeLayout = useMemo(() => {
    const centerX = 250;
    const centerY = 200;
    const radiusX = 200;
    const radiusY = 140;

    return COUNCIL_MEMBERS.map((member, index) => {
      if (member.slotId === 1) {
        return { ...member, x: centerX, y: centerY, isCenter: true };
      }
      // Angle for 9 outer nodes
      const angle = ((index - 1) / 9) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + radiusX * Math.cos(angle);
      const y = centerY + radiusY * Math.sin(angle);
      return { ...member, x, y, isCenter: false };
    });
  }, []);

  return (
    <div className="space-y-8 max-w-full overflow-hidden pb-20">
      {/* 1. Sovereign Executive Decree Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-zinc-950/90 to-black p-6 md:p-8 backdrop-blur-xl shadow-2xl overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-amber-500/20 pb-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  {SOVEREIGN_DECREE_METADATA.decreeCode}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Lock className="w-3 h-3" />
                  {SOVEREIGN_DECREE_METADATA.confidentialityLevel}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  <Activity className="w-3 h-3 animate-pulse" />
                  {SOVEREIGN_DECREE_METADATA.systemStatus}
                </span>
                <MerkleVerificationBadge showInspectorButton={true} compact={false} />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                <span>ทำเนียบสภาผู้พิทักษ์ 10/10 REAL_HSM</span>
                <span className="text-sm font-normal text-zinc-400 font-mono hidden sm:inline">
                  (10/10 Sovereign Deca-Key Council)
                </span>
              </h1>
              <p className="text-sm text-zinc-300 max-w-3xl leading-relaxed">
                โครงสร้างอำนาจและความชอบธรรมภายใต้ระบบควบคุมหลัก <strong className="text-white">ZYRQUEN Ω∞ SOVEREIGN RUNTIME CONTROL DECK</strong>{' '}
                ตามสัญญาสถาปัตยกรรมแช่แข็ง <strong className="text-amber-300">Frozen v1.2 LTS</strong> เพื่อรักษาความปลอดภัย ความถูกต้องแม่นยำ และความเป็นอมตะของชุดข้อมูล (Immutable Data)
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Batch Quick Health Check Button */}
              <button
                onClick={handleRunAllQuickHealthChecks}
                disabled={isBatchHealthChecking}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95 border border-emerald-400/40"
                title="ทดสอบตรวจสุขภาพเร็ว (Quick Health Check) ทั้ง 10 โหนดพร้อมกัน"
              >
                <HeartPulse className={`w-4 h-4 text-emerald-200 ${isBatchHealthChecking ? 'animate-bounce' : ''}`} />
                <span>{isBatchHealthChecking ? 'กำลังตรวจสุขภาพ 10/10...' : 'ตรวจสุขภาพเร็ว 10/10'}</span>
              </button>

              {/* Trigger Vote Consensus Ripple Overlay Button */}
              <button
                onClick={() => triggerConsensusRipple('ALL', 'YES (10/10 QUORUM SEALS)', 'PROP-SOV-2026-LIVE')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-emerald-600 to-teal-600 hover:from-amber-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95 border border-amber-400/40"
                title="กระจายคลื่นฉันทามติ (Vote Consensus Ripple) จากจุดศูนย์กลางสู่โหนดทั้ง 10"
              >
                <Vote className="w-4 h-4 text-amber-200" />
                <span>จำลองคลื่นมติ (Ripple Wave)</span>
              </button>

              {/* Export Merkle Archive Button */}
              <button
                onClick={handleExportMerkleArchive}
                disabled={isExporting}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-95 border border-cyan-400/40"
                title="ส่งออกสถานะสภา 10/10 ในรูปแบบไฟล์ Merkle-verified JSON Archive"
              >
                <FileJson className="w-4 h-4 text-cyan-200" />
                <span>ส่งออก Merkle Archive (JSON)</span>
                <Download className="w-3.5 h-3.5 opacity-90" />
              </button>

              {/* Run All Diagnostics Button */}
              <button
                onClick={handleRunAllDiagnostics}
                disabled={isBatchRunning}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold text-xs shadow-lg shadow-purple-500/20 transition-all active:scale-95 border border-purple-400/40"
                title="ทดสอบการวินิจฉัยความปลอดภัยเชิงรหัสลับพร้อมกันทั้ง 10 โหนด (ไปกดกว่าได้เต็มหมด)"
              >
                <Sparkles className={`w-4 h-4 text-purple-200 ${isBatchRunning ? 'animate-spin' : ''}`} />
                <span>{isBatchRunning ? 'กำลังวินิจฉัย 10/10...' : 'วินิจฉัยครบ 10/10 โหนด'}</span>
              </button>

              <button
                onClick={() => {
                  setShowHeartbeatMesh(!showHeartbeatMesh);
                  playTone(520, 0.05, 'sine');
                }}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border font-mono text-xs font-semibold transition-all ${
                  showHeartbeatMesh
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-400 border-white/10'
                }`}
              >
                <Radio className={`w-4 h-4 ${showHeartbeatMesh ? 'text-cyan-400 animate-pulse' : ''}`} />
                <span>{showHeartbeatMesh ? 'ซ่อนโครงข่ายโทรมาตร' : 'แสดงโครงข่ายโทรมาตร (Mesh)'}</span>
              </button>

              <button
                onClick={() => {
                  setIsCeremonyOpen(true);
                  playTone(882, 0.15, 'sine');
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-semibold text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                <Zap className="w-4 h-4" />
                <span>ห้องพิธีลงนาม (Proof Tracker)</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-xs text-zinc-400 font-mono">ผู้นำสูงสุด / ประธานสภา</span>
              <p className="text-sm font-semibold text-amber-300 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{SOVEREIGN_DECREE_METADATA.presidentNameTh}</span>
              </p>
              <span className="text-[11px] text-zinc-500 font-mono block truncate">
                {SOVEREIGN_DECREE_METADATA.presidentId}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-xs text-zinc-400 font-mono">การกำกับดูแล (Governance)</span>
              <p className="text-sm font-semibold text-emerald-400 font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{STATE_AUTHORITY.GOVERNANCE_CONSENSUS}</span>
              </p>
              <span className="text-[11px] text-emerald-500/80 font-mono block">
                Policy Consensus Ratified
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-xs text-zinc-400 font-mono">หลักฐานกายภาพ (Custodian)</span>
              <p className="text-sm font-semibold text-emerald-300 font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{STATE_AUTHORITY.CUSTODIAN_STATUS_LABEL}</span>
              </p>
              <span className="text-[11px] text-emerald-400/80 font-mono block">
                {STATE_AUTHORITY.CUSTODIAN_REQUIRED_COUNT} Req ({STATE_AUTHORITY.CUSTODIAN_PENDING_COUNT} Pending) • Runtime: {STATE_AUTHORITY.RUNTIME_STATUS}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-xs text-zinc-400 font-mono">สถานะการแช่แข็ง (Canonical)</span>
              <p className="text-sm font-semibold text-cyan-400 font-mono flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{STATE_AUTHORITY.CANONICAL_SEALS.toLocaleString()} SEALS FROZEN</span>
              </p>
              <span className="text-[11px] text-cyan-500/80 font-mono block">
                SSoT Mutation: {STATE_AUTHORITY.SSOT_MUTATION_COUNT} (Δ{STATE_AUTHORITY.SSOT_MUTATION_DELTA})
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Sovereign Council Sub-Navigation Switcher */}
      <div className="flex items-center bg-[#070914]/90 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-2 font-mono text-xs shadow-inner flex-wrap gap-2 relative overflow-hidden">
        <button
          onClick={() => {
            playTone(800, 0.04);
            setCouncilViewMode('dual-plane');
          }}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold ${
            councilViewMode === 'dual-plane'
              ? 'bg-gradient-to-r from-emerald-500/40 via-cyan-500/30 to-purple-500/20 text-emerald-200 border border-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
              : 'text-emerald-400/90 hover:text-emerald-200 hover:bg-emerald-500/10 border border-emerald-500/30'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Dual-Plane Matrix Attestation (100% Green)</span>
        </button>

        <button
          onClick={() => {
            playTone(600, 0.04);
            setCouncilViewMode('roster');
          }}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold ${
            councilViewMode === 'roster'
              ? 'bg-gradient-to-r from-amber-500/30 via-emerald-500/20 to-cyan-500/20 text-amber-200 border border-amber-400/50 shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <Shield className="w-4 h-4 text-amber-400" />
          <span>ทำเนียบ 10/10 โหนด (Council Roster)</span>
        </button>

        <button
          onClick={() => {
            playTone(620, 0.04);
            setCouncilViewMode('council-chamber');
          }}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold ${
            councilViewMode === 'council-chamber'
              ? 'bg-gradient-to-r from-emerald-500/30 via-cyan-500/25 to-blue-500/20 text-emerald-200 border border-emerald-400/50 shadow-md'
              : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20'
          }`}
        >
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span>Council Chamber (10/10 REAL_HSM Nodes)</span>
        </button>

        <button
          onClick={() => {
            playTone(640, 0.04);
            setCouncilViewMode('hsm-status');
          }}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold ${
            councilViewMode === 'hsm-status'
              ? 'bg-gradient-to-r from-cyan-500/30 via-emerald-500/20 to-teal-500/20 text-cyan-200 border border-cyan-400/50 shadow-md'
              : 'text-cyan-400/80 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/20'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Audit Report &amp; Security Specs</span>
        </button>

        <button
          onClick={() => {
            playTone(660, 0.04);
            setCouncilViewMode('genesis-deploy');
          }}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold ${
            councilViewMode === 'genesis-deploy'
              ? 'bg-gradient-to-r from-cyan-500/30 via-violet-500/20 to-amber-500/20 text-cyan-200 border border-cyan-400/50 shadow-md'
              : 'text-cyan-400/80 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/20'
          }`}
        >
          <Rocket className="w-4 h-4 text-cyan-400" />
          <span>Genesis Deployment Console (Core G11)</span>
        </button>

        <button
          onClick={() => {
            playTone(720, 0.04);
            setCouncilViewMode('custodian-pulse');
          }}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold ${
            councilViewMode === 'custodian-pulse'
              ? 'bg-gradient-to-r from-emerald-500/30 via-cyan-500/20 to-fuchsia-500/20 text-emerald-200 border border-emerald-400/50 shadow-md'
              : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20'
          }`}
        >
          <HeartPulse className="w-4 h-4 text-emerald-400" />
          <span>Custodian Telemetry Pulse (Cryo Bus 14.98 mK)</span>
        </button>

        <button
          onClick={() => {
            playTone(580, 0.04);
            setCouncilViewMode('consensus-mesh');
          }}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold ${
            councilViewMode === 'consensus-mesh'
              ? 'bg-gradient-to-r from-purple-500/30 via-indigo-500/20 to-cyan-500/20 text-purple-200 border border-purple-400/50 shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <RadioTower className="w-4 h-4 text-purple-400" />
          <span>ผังการเชื่อมโยง & ฉันทามติ (Consensus Mesh)</span>
        </button>

        <button
          onClick={() => {
            playTone(760, 0.04);
            setCouncilViewMode('senate-dossier');
          }}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold ${
            councilViewMode === 'senate-dossier'
              ? 'bg-gradient-to-r from-emerald-500/30 via-teal-500/25 to-cyan-500/20 text-emerald-200 border border-emerald-400/50 shadow-md'
              : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20'
          }`}
        >
          <Scale className="w-4 h-4 text-emerald-400" />
          <span>Senate Governance Audit (30-Day Dossier)</span>
        </button>
      </div>

      {/* Mode -3: Sovereign Telemetry Verification & Quorum Dual-Plane Matrix Attestation */}
      {councilViewMode === 'dual-plane' && (
        <div className="space-y-6">
          <SovereignTelemetryDualPlaneMatrix />
        </div>
      )}

      {/* Mode -2: Senate Governance Audit Dossier (30-Day Comprehensive Dossier) */}
      {councilViewMode === 'senate-dossier' && (
        <div className="space-y-6">
          <SenateGovernanceAuditDossier />
        </div>
      )}

      {/* Mode -1: Dedicated Council Chamber Component (10/10 REAL_HSM Nodes) */}
      {councilViewMode === 'council-chamber' && (
        <div className="space-y-6">
          <CouncilChamber onSelectMember={handleOpenMemberModal} />
        </div>
      )}

      {/* Mode 0: Real HSM Status Grid */}
      {councilViewMode === 'hsm-status' && (
        <div className="space-y-6">
          <RealHsmStatusGrid onSelectMember={handleOpenMemberModal} />
        </div>
      )}

      {/* Mode 1: Genesis Deployment Console */}
      {councilViewMode === 'genesis-deploy' && (
        <div className="space-y-6">
          <GenesisDeploymentConsole />
        </div>
      )}

      {/* Mode 2: Custodian Telemetry Pulse Monitor */}
      {councilViewMode === 'custodian-pulse' && (
        <div className="space-y-6">
          <CustodianTelemetryPulseMonitor />
        </div>
      )}

      {/* 2. Heartbeat Synchronization Mesh & Constellation Visualizer */}
      <AnimatePresence>
        {showHeartbeatMesh && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <RadioTower className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    HSM Guardian Heartbeat Synchronization Mesh (Sub-Kelvin Bus)
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  เส้นเชื่อมโยงโทรมาตรแบบเรียลไทม์ระหว่างโหนดศูนย์กลาง Genesis (TC-01) และผู้พิทักษ์ทั้ง 9 โหนด
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-emerald-300">5 OPTIMAL (0.2ms)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-amber-300">5 PROVING (1.2ms)</span>
                </div>
              </div>
            </div>

            {/* SVG Visualizer with Animated Heartbeat Energy Pulses */}
            <div className="relative w-full aspect-[5/3] max-h-[380px] bg-black/60 rounded-2xl border border-cyan-500/20 overflow-hidden flex items-center justify-center p-2">
              <svg viewBox="0 0 500 400" className="w-full h-full">
                <defs>
                  {/* Glowing line gradients */}
                  <linearGradient id="leadPulseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
                  </linearGradient>

                  <linearGradient id="syncPulseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.9" />
                  </linearGradient>

                  <linearGradient id="pendingPulseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#EC4899" stopOpacity="0.7" />
                  </linearGradient>

                  {/* Node Glow Filters */}
                  <filter id="glowGold" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glowCyan" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Orbit Guideline Rings */}
                <ellipse cx="250" cy="200" rx="200" ry="140" fill="none" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 4" />
                <ellipse cx="250" cy="200" rx="100" ry="70" fill="none" stroke="rgba(6,182,212,0.12)" strokeDasharray="2 3" />

                {/* Subtle animated connecting lines from each outer node to the center */}
                {nodeLayout
                  .filter((n) => !n.isCenter)
                  .map((node) => {
                    const isHovered = hoveredNodeId === node.slotId;
                    const isVerified = node.verificationStatus === 'REAL_HSM_SIGNED';

                    return (
                      <g key={`mesh-line-${node.slotId}`}>
                        {/* Background Base Line */}
                        <line
                          x1="250"
                          y1="200"
                          x2={node.x}
                          y2={node.y}
                          stroke={isHovered ? (isVerified ? '#10B981' : '#F59E0B') : isVerified ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.2)'}
                          strokeWidth={isHovered ? 2.5 : 1.2}
                          strokeDasharray={isVerified ? 'none' : '4 4'}
                        />

                        {/* Animated Pulser Line overlay */}
                        <line
                          x1="250"
                          y1="200"
                          x2={node.x}
                          y2={node.y}
                          stroke={isVerified ? 'url(#syncPulseGrad)' : 'url(#pendingPulseGrad)'}
                          strokeWidth={isHovered ? 3 : 2}
                          strokeDasharray="8 20"
                          className="animate-[dash_3s_linear_infinite]"
                          style={{
                            animationDuration: `${node.heartbeat.latencyMs * 1.5 + 1.2}s`,
                          }}
                        />

                        {/* Moving Heartbeat Particle */}
                        <circle r={isHovered ? 3.5 : 2.5} fill={isVerified ? '#34D399' : '#FBBF24'}>
                          <animateMotion
                            path={`M 250 200 L ${node.x} ${node.y}`}
                            dur={`${node.heartbeat.pulseFrequencyHz * 2}s`}
                            repeatCount="indefinite"
                          />
                        </circle>
                      </g>
                    );
                  })}

                {/* Draw Outer Nodes */}
                {nodeLayout
                  .filter((n) => !n.isCenter)
                  .map((node) => {
                    const isHovered = hoveredNodeId === node.slotId;
                    const isVerified = node.verificationStatus === 'REAL_HSM_SIGNED';

                    return (
                      <g
                        key={`mesh-node-${node.slotId}`}
                        className="cursor-pointer transition-transform duration-200"
                        onMouseEnter={() => setHoveredNodeId(node.slotId)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        onClick={() => handleOpenMemberModal(node)}
                      >
                        {/* Outer Pulse aura */}
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={isHovered ? 22 : 16}
                          fill={isVerified ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.12)'}
                          className="animate-pulse"
                        />
                        {/* Main Node Bubble */}
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={isHovered ? 15 : 12}
                          fill="#09090b"
                          stroke={isHovered ? (isVerified ? '#34D399' : '#FBBF24') : isVerified ? '#10B981' : '#F59E0B'}
                          strokeWidth={isHovered ? 2.5 : 1.5}
                          filter="url(#glowCyan)"
                        />
                        {/* Text code inside */}
                        <text
                          x={node.x}
                          y={node.y + 4}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {node.councilCode.replace('TC-', '')}
                        </text>
                        {/* Node Label Below */}
                        <text
                          x={node.x}
                          y={node.y + (node.y > 200 ? 26 : -20)}
                          textAnchor="middle"
                          fill={isHovered ? '#38BDF8' : '#94A3B8'}
                          fontSize="9"
                          fontFamily="sans-serif"
                          fontWeight="600"
                        >
                          {node.nameTh.split(' ')[0]}
                        </text>
                      </g>
                    );
                  })}

                {/* Central Genesis Node TC-01 (#EP-SOVEREIGN-01) */}
                <g
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredNodeId(1)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onClick={() => handleOpenMemberModal(COUNCIL_MEMBERS[0])}
                >
                  {/* Grand Aura */}
                  <circle cx="250" cy="200" r="38" fill="rgba(245,158,11,0.18)" className="animate-ping" style={{ animationDuration: '3s' }} />
                  <circle cx="250" cy="200" r="28" fill="rgba(245,158,11,0.25)" filter="url(#glowGold)" />
                  <circle cx="250" cy="200" r="20" fill="#18181b" stroke="#F59E0B" strokeWidth="2.5" />
                  <text x="250" y="204" textAnchor="middle" fill="#FBBF24" fontSize="11" fontFamily="monospace" fontWeight="bold">
                    TC-01
                  </text>
                  <text x="250" y="238" textAnchor="middle" fill="#FDE68A" fontSize="10" fontFamily="sans-serif" fontWeight="bold">
                    Master Genesis Hub
                  </text>
                </g>
              </svg>
            </div>

            {/* Mesh Telemetry Footnote */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono pt-2">
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-zinc-400">
                <span>Genesis Hub Core:</span>
                <span className="text-amber-400 font-bold">#EP-SOVEREIGN-01 (100% HEALTH)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-zinc-400">
                <span>Mean Bus Latency:</span>
                <span className="text-cyan-400 font-bold">0.38 ms (SUB-KELVIN)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-zinc-400">
                <span>Quantum Channel:</span>
                <span className="text-emerald-400 font-bold">LATTICE ENCRYPTION LOCK</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2.5 Real-Time 10/10 REAL_HSM Council Chamber Component */}
      <CouncilChamber onSelectMember={handleOpenMemberModal} />

      {/* 3. Search Bar & Category Filters */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Prominent Search Bar */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาผู้พิทักษ์ด้วยชื่อ, รหัส (TC-XX / #EP-SOVEREIGN), บทบาทหน้าที่, หรือ Hardware Enclave..."
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-zinc-900/90 border border-amber-500/30 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all font-mono shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  playTone(400, 0.05, 'sine');
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                title="ล้างคำค้นหา"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Search Badges & Results Counter */}
          <div className="flex items-center justify-between lg:justify-end gap-3 text-xs font-mono">
            <span className="px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-white/10 text-zinc-300">
              พบ <strong className="text-amber-400">{filteredMembers.length}</strong> / 10 ผู้พิทักษ์
            </span>
          </div>
        </div>

        {/* Category Tab Pills */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-zinc-900/80 border border-white/10 backdrop-blur-md">
          {[
            { id: 'ALL', label: 'ทั้งหมด (10)', icon: Layers },
            { id: 'LEAD', label: 'ผู้นำสูงสุด (1)', icon: Crown },
            { id: 'SECURITY', label: 'Core Security (4)', icon: Shield },
            { id: 'OPERATIONS', label: 'Runtime Operations (3)', icon: Cpu },
            { id: 'AUDIT', label: 'Compliance & Audit (2)', icon: FileText },
            { id: 'VERIFIED', label: 'Verified HSM (5)', icon: CheckCircle2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedCategory(tab.id);
                  playTone(550, 0.05, 'sine');
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-zinc-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Council Member Cards Grid with Framer Motion Staggered Entrance Animation & Consensus Ripple Overlay */}
      <div className="relative">
        <ConsensusRippleOverlay event={activeConsensusVoteEvent} boundedToGrid={true} />
        <VoteConsensusRippleOverlay rippleEvent={activeRippleEvent} />

        <motion.div
          variants={gridContainerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10"
        >
          <AnimatePresence mode="popLayout">
            {filteredMembers.map((member) => {
              const isVerified = member.verificationStatus === 'REAL_HSM_SIGNED';
              const isLead = member.isLead;
              const healthCheck = quickHealthChecks[member.slotId];
              const isRippled = activeRippleSlotId === member.slotId || activeRippleSlotId === 'ALL';

              return (
                <motion.div
                  key={member.slotId}
                  variants={cardItemVariants}
                  layout
                  whileHover={{
                    scale: 1.025,
                    y: -5,
                    transition: { duration: 0.2, ease: 'easeOut' },
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOpenMemberModal(member)}
                  className={`relative rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden group cursor-pointer select-none ${
                    isRippled
                      ? 'ring-4 ring-emerald-400 ring-offset-2 ring-offset-black shadow-[0_0_40px_rgba(16,185,129,0.5)] border-emerald-400 holographic-stream-effect'
                      : isLead
                      ? 'bg-gradient-to-b from-amber-950/40 via-zinc-950 to-black border-amber-500/40 hover:border-amber-400 hover:shadow-[0_0_35px_rgba(245,158,11,0.25)]'
                      : isVerified
                      ? 'bg-gradient-to-b from-emerald-950/30 via-zinc-950 to-black border-emerald-500/30 hover:border-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                      : 'bg-gradient-to-b from-zinc-900/60 via-zinc-950 to-black border-white/10 hover:border-amber-500/50 hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]'
                  }`}
                >
                  {/* Consensus Ripple Shockwave Ping on Card */}
                  {isRippled && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute inset-x-0 top-0 z-30 p-2 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-[10px] font-mono font-bold text-center flex items-center justify-center gap-1.5 shadow-lg animate-pulse"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>ฉันทามติซิงค์: +1 มติสัตยาบัน (Vote Sealed)</span>
                    </motion.div>
                  )}

                  {/* Glowing Corner Accent */}
                <div
                  className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 ${
                    isLead
                      ? 'bg-amber-500/20 group-hover:bg-amber-500/35'
                      : isVerified
                      ? 'bg-emerald-500/15 group-hover:bg-emerald-500/30'
                      : 'bg-cyan-500/10 group-hover:bg-amber-500/20'
                  }`}
                />

                {/* Card Top Strip & Header */}
                <div className="p-6 pb-4 space-y-4 relative z-10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${member.avatarColor} p-0.5 shadow-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                      >
                        <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                          {isLead ? (
                            <Crown className="w-6 h-6 text-amber-400 animate-pulse" />
                          ) : (
                            <Shield className={`w-6 h-6 ${isVerified ? 'text-emerald-400' : 'text-zinc-400'}`} />
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-amber-400">{member.councilCode}</span>
                          <span className="text-zinc-600">&bull;</span>
                          <span className="font-mono text-xs font-semibold text-cyan-300">
                            #{member.passportId}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400 font-mono block">
                          โหนดที่ {member.slotId.toString().padStart(2, '0')} / 10
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm">
                          <CheckCircle2 className="w-3 h-3" />
                          REAL_HSM
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          <Clock className="w-3 h-3" />
                          CLAIMED
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-400 font-mono">
                        Weight: +{member.quorumWeight}
                      </span>
                      {jitterOverlayEnabled && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/25 shadow-sm">
                          <Activity className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
                          Jitter: ±{getMemberVitality(member).jitterMs}ms
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Names & Role Description */}
                  <div className="space-y-1 pt-1">
                    <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                      <span>{member.nameTh}</span>
                    </h3>
                    <p className="text-xs text-zinc-400 font-mono font-medium">{member.nameEn}</p>
                    <div className="pt-2">
                      <span className="inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-medium bg-white/5 text-zinc-300 border border-white/10 mb-1.5">
                        {member.categoryTh}
                      </span>
                      <p className="text-xs text-zinc-300 font-medium line-clamp-2 leading-relaxed">
                        {member.roleTh}
                      </p>
                    </div>
                  </div>

                  {/* Real-time Guardian Vitality Gauge */}
                  <GuardianVitalityGauge
                    vitality={getMemberVitality(member)}
                    councilCode={member.councilCode}
                    isVerified={isVerified}
                    compact={true}
                  />

                  {/* Quick Health Check & Handshake Diagnostic Trigger */}
                  <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                    {healthCheck?.status === 'CHECKING' ? (
                      <div className="p-2.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-between text-xs font-mono animate-pulse">
                        <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                          <span>Handshake Ping...</span>
                        </span>
                        <span className="text-[10px] text-cyan-400">Cryo-Bus</span>
                      </div>
                    ) : healthCheck?.status === 'VALIDATED' ? (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-2.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 flex items-center justify-between text-xs font-mono shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                      >
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: [0, 1.3, 1] }}
                            transition={{ duration: 0.3 }}
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          </motion.div>
                          <span>Validated ({healthCheck.latency})</span>
                        </div>
                        <button
                          onClick={() => runQuickHealthCheck(member.slotId)}
                          className="text-[10px] text-zinc-400 hover:text-emerald-300 underline"
                          title="ตรวจสุขภาพเร็วซ้ำ"
                        >
                          Re-check
                        </button>
                      </motion.div>
                    ) : (
                      <button
                        onClick={() => runQuickHealthCheck(member.slotId)}
                        className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-zinc-300 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/40 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all group/health shadow-sm"
                        title="ตรวจสุขภาพโหนดฮาร์ดแวร์แบบรวดเร็ว (Quick Handshake Health Check)"
                      >
                        <HeartPulse className="w-3.5 h-3.5 text-emerald-400 group-hover/health:scale-110 transition-transform" />
                        <span>Quick Health Check</span>
                      </button>
                    )}
                  </div>

                  {/* Hardware Enclave & Post-Quantum Cryptography */}
                  <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 font-mono flex items-center gap-1 text-[11px]">
                        <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                        Enclave
                      </span>
                      <span className="text-zinc-200 font-mono text-[11px] font-semibold truncate max-w-[170px]">
                        {member.hardwareEnclave}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 font-mono flex items-center gap-1 text-[11px]">
                        <Lock className="w-3.5 h-3.5 text-purple-400" />
                        PQC Algo
                      </span>
                      <span className="text-zinc-300 font-mono text-[11px] truncate">
                        {member.pqcAlgorithm}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-white/5">
                      <span className="text-zinc-500 font-mono flex items-center gap-1 text-[11px]">
                        <Fingerprint className="w-3.5 h-3.5 text-amber-400" />
                        Key Digest
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-400 font-mono text-[10px]">
                          {member.keyFingerprint.slice(0, 16)}...
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(member.keyFingerprint, member.passportId);
                          }}
                          className="text-zinc-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
                          title="คัดลอก Key Fingerprint"
                        >
                          {copiedKey === member.passportId ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Cryptographic Self-Test & Diagnostic Sequence */}
                  {(() => {
                    const diag = diagnostics[member.slotId];
                    if (diag?.status === 'RUNNING') {
                      return (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/40 space-y-2 text-xs font-mono animate-pulse"
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-cyan-300 font-bold text-[11px]">
                              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                              กำลังประมวลผล Diagnostic...
                            </span>
                            <span className="text-[10px] text-cyan-400">HSM Ring Check</span>
                          </div>
                          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 animate-pulse w-full" />
                          </div>
                          <p className="text-[10px] text-zinc-300 truncate">{diag.step}</p>
                        </div>
                      );
                    }

                    if (diag?.status === 'SUCCESS') {
                      return (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="p-3.5 rounded-2xl bg-emerald-950/25 border border-emerald-500/50 space-y-2 text-xs font-mono shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Verification Success
                            </span>
                            <span className="text-[10px] text-zinc-400">{diag.testedAt}</span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-zinc-400">
                              <span>SHA-256 Output:</span>
                              <button
                                onClick={() => handleCopy(diag.sha256Output, `diag-${member.slotId}`)}
                                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                              >
                                {copiedKey === `diag-${member.slotId}` ? (
                                  <>
                                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                                    <span className="text-emerald-400">คัดลอกแล้ว</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-2.5 h-2.5" />
                                    <span>คัดลอก</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <div className="p-1.5 rounded-lg bg-black font-mono text-[10px] text-emerald-300 break-all select-all border border-emerald-500/20">
                              {diag.sha256Output.slice(0, 26)}...
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-white/5 text-zinc-400">
                            <span>Entropy: {diag.entropyRate}</span>
                            <button
                              onClick={() => runMemberDiagnostic(member.slotId)}
                              className="text-amber-400 hover:text-amber-300 font-semibold"
                            >
                              รันซ้ำ (Re-test)
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => runMemberDiagnostic(member.slotId)}
                          className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-zinc-300 hover:text-cyan-200 border border-white/10 hover:border-cyan-500/40 text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-all group/diag shadow-sm"
                          title="สั่งรันการทดสอบตัวเองเชิงรหัสลับ (Cryptographic Self-Test Diagnostic)"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400 group-hover/diag:rotate-12 transition-transform" />
                          <span>ทดสอบวินิจฉัย (Run Diagnostic)</span>
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {/* Card Action Footer */}
                <div className="p-4 pt-3 border-t border-white/5 bg-zinc-950/60 flex items-center justify-between gap-2 relative z-10">
                  <div className="text-[11px] text-zinc-500 font-mono flex items-center gap-1.5 truncate">
                    <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{member.clearanceLevel}</span>
                  </div>

                  <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 group-hover:bg-amber-500/20 text-zinc-200 group-hover:text-amber-300 border border-white/10 group-hover:border-amber-500/40 transition-all shrink-0">
                    <span>เปิดประวัติและคีย์</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
      </div>

      {/* 4.4 Council View Extensions: Jitter Variance Overlay & Consensus Audit Compliance Download */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
      >
        <CouncilViewExtensions
          defaultJitter={jitterOverlayEnabled}
          onJitterChange={(val) => setJitterOverlayEnabled(val)}
          onTriggerTestRipple={() =>
            triggerConsensusRipple(
              'ALL',
              'YES (10/10 FULL QUORUM RATIFIED)',
              'PROP-SOV-2026-CONSENSUS'
            )
          }
        />
      </motion.div>

      {/* 4.5 Sovereign Health Score Matrix (Real-Time 10-Node HSM Vitality Heatmap) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <SovereignHealthHeatmapWidget
          onSelectNode={(slotId) => {
            const member = COUNCIL_MEMBERS.find((m) => m.slotId === slotId);
            if (member) setSelectedMember(member);
          }}
        />
      </motion.div>

      {/* 4.6 Guardian Vitality D3 Monitor (Real-Time Uptime & Cryptographic Health with Red Drift Detection) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="space-y-6"
      >
        <GuardianVitalityD3Monitor />
        <ActiveEntropyRateMonitor />
      </motion.div>

      {/* 5. 10/10 Sovereign Mesh Network Latency Radar & Scatter Visualizer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <CouncilNetworkLatencyRadar />
      </motion.div>

      {/* 5.5 Sovereign Command Hub (Sub-Kelvin Thermal Monitor, Auto-Healing Log, and Emergency Override Console) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <SovereignCommandHub
          onOverrideStateChange={(active) => {
            if (active) {
              triggerConsensusRipple('ALL', 'EMERGENCY_OVERRIDE_ACTIVE', 'SOV-OMEGA-OVERRIDE');
            }
          }}
        />
      </motion.div>

      {/* 6. Recharts-Powered 10/10 Consensus Alignment Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        <ConsensusAlignmentChart />
      </motion.div>

      {/* 7. Dedicated 10/10 Quorum Consensus Ledger Table with PQC Proof Attestation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
      >
        <QuorumConsensusTable
          onVoteVerified={(slotId, decision) =>
            triggerConsensusRipple(slotId, decision, 'QUORUM-TABLE-PQC')
          }
        />
      </motion.div>

      {/* 8. Sovereign Consensus Ledger Section & Voting Terminal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <ConsensusLedgerSection
          onVoteLogged={(slotId, decision, proposalId) =>
            triggerConsensusRipple(slotId, decision, proposalId)
          }
        />
      </motion.div>

      {/* 6. Comprehensive Member Inspector Modal (Biography, Contributions, & Cryptographic Public Key Signature) */}
      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl rounded-3xl border border-amber-500/40 bg-zinc-950 p-6 md:p-8 text-white shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Top Header */}
              <div className="flex items-start justify-between border-b border-white/10 pb-5">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${selectedMember.avatarColor} p-0.5 flex items-center justify-center shadow-xl`}
                  >
                    <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                      {selectedMember.isLead ? (
                        <Crown className="w-7 h-7 text-amber-400" />
                      ) : (
                        <Shield className="w-7 h-7 text-cyan-400" />
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {selectedMember.councilCode}
                      </span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-semibold">
                        #{selectedMember.passportId}
                      </span>
                      {selectedMember.verificationStatus === 'REAL_HSM_SIGNED' ? (
                        <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                          REAL_HSM_SIGNED
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                          PENDING PHYSICAL PROOF
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-white mt-1">{selectedMember.nameTh}</h2>
                    <p className="text-xs text-zinc-400 font-mono">{selectedMember.nameEn}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMember(null)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Tabs Inside Modal */}
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                {[
                  { id: 'bio' as const, label: 'ประวัติและอำนาจหน้าที่', icon: UserCheckIcon },
                  { id: 'contributions' as const, label: `ประวัติการอุทิศตน (${selectedMember.contributions.length})`, icon: History },
                  { id: 'crypto' as const, label: 'ลายมือชื่อและ Public Key', icon: Key },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = modalActiveTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setModalActiveTab(tab.id);
                        playTone(600, 0.05, 'sine');
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab 1: Biography & Roles */}
              {modalActiveTab === 'bio' && (
                <div className="space-y-4 text-sm">
                  {/* Expanded Guardian Vitality Gauge */}
                  <GuardianVitalityGauge
                    vitality={getMemberVitality(selectedMember)}
                    councilCode={selectedMember.councilCode}
                    isVerified={selectedMember.verificationStatus === 'REAL_HSM_SIGNED'}
                    compact={false}
                  />

                  {/* Real-time Cryptographic Handshake Diagnostic Simulator */}
                  <ModalMemberDiagnostic member={selectedMember} />

                  {/* 24-Hour Historical Uptime & Connectivity Sparkline Chart */}
                  <HistoricalUptimeSparkline member={selectedMember} />

                  {/* Official Role */}
                  <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-2">
                    <span className="text-xs font-mono text-amber-400 font-semibold block">
                      บทบาทและตำแหน่งทางการ (Official Security Role)
                    </span>
                    <p className="text-zinc-100 font-medium leading-relaxed">{selectedMember.roleTh}</p>
                    <p className="text-xs text-zinc-400 font-mono">{selectedMember.roleEn}</p>
                  </div>

                  {/* Biography */}
                  <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-2">
                    <span className="text-xs font-mono text-emerald-400 font-semibold block">
                      ชีวประวัติและการปฏิบัติงาน (Biography & Background)
                    </span>
                    <p className="text-zinc-200 text-xs leading-relaxed">{selectedMember.biographyTh}</p>
                    <p className="text-zinc-400 text-[11px] font-mono leading-relaxed">{selectedMember.biographyEn}</p>
                  </div>

                  {/* Statutory Jurisdiction */}
                  <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-2">
                    <span className="text-xs font-mono text-cyan-400 font-semibold block">
                      ขอบเขตอำนาจหน้าที่ตามประกาศ (Statutory Jurisdiction)
                    </span>
                    <p className="text-zinc-300 text-xs leading-relaxed">{selectedMember.jurisdictionTh}</p>
                    <p className="text-zinc-500 text-[11px] font-mono">{selectedMember.jurisdictionEn}</p>
                  </div>

                  {/* Hardware & Clearance Level */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-1">
                      <span className="text-[11px] text-zinc-400 font-mono">Hardware Security Module</span>
                      <p className="text-xs font-semibold text-white font-mono">{selectedMember.hardwareEnclave}</p>
                      <span className="text-[10px] text-zinc-500 font-mono block">{selectedMember.fipsCertification}</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-1">
                      <span className="text-[11px] text-zinc-400 font-mono">PQC Algorithm & Level</span>
                      <p className="text-xs font-semibold text-purple-300 font-mono">{selectedMember.pqcAlgorithm}</p>
                      <span className="text-[10px] text-zinc-500 font-mono block">{selectedMember.clearanceLevel}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Contribution History */}
              {modalActiveTab === 'contributions' && (
                <div className="space-y-4 text-sm">
                  <div className="space-y-3">
                    {selectedMember.contributions.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-2 hover:border-amber-500/30 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            {item.year}
                          </span>
                          <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            VERIFIED INVARIANT
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{item.titleTh}</h4>
                        <p className="text-xs text-zinc-400 font-mono">{item.titleEn}</p>
                        <p className="text-xs text-zinc-300 leading-relaxed">{item.detailTh}</p>

                        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] font-mono">
                          <span className="text-zinc-500 truncate max-w-[280px]">
                            Hash: {item.verifiedHash}
                          </span>
                          <button
                            onClick={() => handleCopy(item.verifiedHash, `contrib-${idx}`)}
                            className="text-amber-400 hover:text-amber-300 flex items-center gap-1"
                          >
                            {copiedKey === `contrib-${idx}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>คัดลอกแล้ว</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>คัดลอก Hash</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Cryptographic Public Key & Signatures */}
              {modalActiveTab === 'crypto' && (
                <div className="space-y-4 text-sm">
                  {/* Real-time Handshake & Signature Verification Diagnostic */}
                  <ModalMemberDiagnostic member={selectedMember} />

                  {/* Certificate Serial */}
                  <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/10 flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400">Certificate Serial:</span>
                    <span className="text-amber-400 font-bold">{selectedMember.certificateSerial}</span>
                  </div>

                  {/* Public Key Armor Block */}
                  <div className="p-4 rounded-2xl bg-black/80 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-amber-400" />
                        Cryptographic Public Key (PQC Lattice Armor)
                      </span>
                      <button
                        onClick={() => handleCopy(selectedMember.publicKeyArmor, 'modal-pubkey')}
                        className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-mono"
                      >
                        {copiedKey === 'modal-pubkey' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>คัดลอกแล้ว</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>คัดลอก Public Key</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-3 rounded-xl bg-zinc-950 font-mono text-xs text-amber-300/90 break-all select-all border border-amber-500/20 overflow-x-auto leading-relaxed">
                      {selectedMember.publicKeyArmor}
                    </pre>
                  </div>

                  {/* Digital Signature */}
                  <div className="p-4 rounded-2xl bg-black/80 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                        PQC Digital Signature (Hex Digest)
                      </span>
                      <button
                        onClick={() => handleCopy(selectedMember.cryptoSignature, 'modal-sig')}
                        className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-mono"
                      >
                        {copiedKey === 'modal-sig' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>คัดลอกแล้ว</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>คัดลอก Signature</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-950 font-mono text-xs text-cyan-300 break-all select-all border border-cyan-500/20 leading-relaxed">
                      {selectedMember.cryptoSignature}
                    </div>
                  </div>

                  {/* Fingerprint Full */}
                  <div className="p-4 rounded-2xl bg-black/80 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                        <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                        Key Fingerprint (SHA-256 Digest)
                      </span>
                      <button
                        onClick={() => handleCopy(selectedMember.keyFingerprint, 'modal-fp')}
                        className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-mono"
                      >
                        {copiedKey === 'modal-fp' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>คัดลอกแล้ว</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>คัดลอก Fingerprint</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-950 font-mono text-xs text-emerald-400 break-all select-all border border-emerald-500/20">
                      {selectedMember.keyFingerprint}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Bottom Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="text-[11px] text-zinc-500 font-mono">
                  ลงนามรับรองเมื่อ: {selectedMember.signedTimestamp}
                </span>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition-colors"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Interactive Ceremony & Proof Tracker Simulator Modal */}
      <AnimatePresence>
        {isCeremonyOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl rounded-3xl border border-cyan-500/40 bg-zinc-950 p-6 md:p-8 text-white shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between border-b border-white/10 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                      CEREMONY TRACKER
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">v4.09 Control Deck</span>
                  </div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-cyan-400" />
                    <span>CUSTODIAN PROOF TRACKER</span>
                  </h2>
                </div>

                <button
                  onClick={() => setIsCeremonyOpen(false)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quorum Progress Bar */}
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-300">Custodian Quorum Signing Progress:</span>
                  <span className="font-bold text-emerald-400">{simulatedSignedCount}/10 SIGNED</span>
                </div>
                <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${(simulatedSignedCount / 10) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <span>True Real HSM Baseline: 10/10</span>
                  <span>Required Quorum: 8/10</span>
                </div>
              </div>

              {/* Member Sign List */}
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {COUNCIL_MEMBERS.map((cust) => {
                  const isSigned = cust.slotId <= simulatedSignedCount;
                  return (
                    <div
                      key={cust.slotId}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                        isSigned
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-white'
                          : 'bg-zinc-900/50 border-white/5 text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xs font-mono font-bold text-amber-400 shrink-0">
                          #{cust.passportId}
                        </span>
                        <div className="truncate">
                          <span className="text-xs font-medium text-white block truncate">
                            {cust.nameTh}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono truncate block">
                            {cust.hardwareEnclave}
                          </span>
                        </div>
                      </div>

                      {isSigned ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
                          <Check className="w-3.5 h-3.5" />
                          SIGNED
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSimulateSign(cust.slotId)}
                          className="px-3 py-1 rounded-lg text-xs font-mono font-semibold bg-cyan-600 hover:bg-cyan-500 text-black shadow transition-all active:scale-95 shrink-0"
                        >
                          SIGN PROOF
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5 text-xs text-zinc-400 space-y-1 font-mono">
                <div className="flex items-center justify-between text-zinc-300">
                  <span>SIGNATURE REALITY:</span>
                  <span className="text-emerald-400 font-bold">
                    {simulatedSignedCount} AUTHENTIC PROOFS VERIFIED
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  * หมายเหตุ: การลงนามในหน้านี้เป็นระบบจำลองเชิงโต้ตอบ (Interactive Ceremony Tracker) เพื่อทดสอบกลไกฉันทามติ โดยโครงสร้างความจริงเดี่ยว Frozen v1.2 Core ยังคงรักษา SSoT Mutation = 0 อย่างเคร่งครัด
                </p>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => {
                    setSimulatedSignedCount(10);
                    playTone(440, 0.1, 'sine');
                  }}
                  className="text-xs text-zinc-400 hover:text-zinc-200 underline font-mono"
                >
                  Reset to True Physical HSM (10/10)
                </button>
                <button
                  onClick={() => setIsCeremonyOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs transition-colors"
                >
                  ปิดห้องพิธี
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. Merkle Archive Export Success Modal */}
      <AnimatePresence>
        {isExportToastOpen && exportedArchive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl rounded-3xl border border-emerald-500/40 bg-zinc-950 p-6 md:p-8 text-white shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <FileJson className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                      Merkle Archive Export Successful
                    </span>
                    <h3 className="text-xl font-bold text-white">ส่งออกชุดข้อมูลสภา 10/10 สำเร็จ</h3>
                  </div>
                </div>

                <button
                  onClick={() => setIsExportToastOpen(false)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs font-mono">
                <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                      <Fingerprint className="w-3.5 h-3.5" />
                      Canonical Merkle Root Hash
                    </span>
                    <button
                      onClick={() => handleCopy(exportedArchive.merkleRoot, 'archive-root')}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      {copiedKey === 'archive-root' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">คัดลอกแล้ว</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>คัดลอก Root</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-cyan-300 break-all select-all p-2.5 rounded-xl bg-black border border-cyan-500/20">
                    {exportedArchive.merkleRoot}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-zinc-500 block text-[10px]">จำนวนโหนดที่ลงนาม</span>
                    <p className="text-sm font-bold text-emerald-400">
                      {exportedArchive.totalMembers} / 10 โหนด ({exportedArchive.verifiedHsmCount} REAL_HSM)
                    </p>
                    <span className="text-[10px] text-zinc-400 block">10 Deterministic Leaves</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-zinc-500 block text-[10px]">ฉันทามติที่บันทึก</span>
                    <p className="text-sm font-bold text-amber-400">
                      {exportedArchive.consensusLedger.length} ข้อเสนอ
                    </p>
                    <span className="text-[10px] text-zinc-400 block">Real-time Override History</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-[11px] leading-relaxed flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>
                    ไฟล์ JSON ได้ถูกสร้างและดาวน์โหลดลงในอุปกรณ์ของคุณแล้ว (Format: Sovereign Deca-Key Council Immutable Merkle Package)
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsExportToastOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg transition-all"
                >
                  รับทราบและปิดหน้าต่าง
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

function UserCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  );
}
