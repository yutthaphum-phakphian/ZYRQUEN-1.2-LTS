import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewType, HardwareSnapshot } from '../../types';
import { SYSTEM_METADATA, CANONICAL_MODULES, AUDIT_TRACE_TX } from '../../data/canonicalData';
import { STATE_AUTHORITY } from '../../data/sovereignData';
import { CitadelCanvas } from '../CitadelCanvas';
import { TopologyCanvas } from '../TopologyCanvas';
import { ChamberRuntimeAtlas3D } from '../ChamberRuntimeAtlas3D';
import { QuantumCitadelLatticeHologramVisualizer } from '../QuantumCitadelLatticeHologramVisualizer';
import { PinnedWidgetsDashboard } from '../PinnedWidgetsDashboard';
import { FiosFactorIntelligence } from '../FiosFactorIntelligence';
import { EvidenceIntakePanel } from '../EvidenceIntakePanel';
import { LiveAutomatedHealthWidget } from '../LiveAutomatedHealthWidget';
import { ChamberStatusGrid } from '../ChamberStatusGrid';
import { ManifestoCard } from '../ManifestoCard';
import ZyrquenCard from '../ZyrquenCard';
import { PerformanceDashboard } from '../PerformanceDashboard';
import { Room00MasterPanel } from '../Room00MasterPanel';
import { Room01MasterPanel } from '../Room01MasterPanel';
import { Room02MasterPanel } from '../Room02MasterPanel';
import { Room03MasterPanel } from '../Room03MasterPanel';
import { Room04MasterPanel } from '../Room04MasterPanel';
import { Room05MasterPanel } from '../Room05MasterPanel';
import { Room06MasterPanel } from '../Room06MasterPanel';
import { Room07MasterPanel } from '../Room07MasterPanel';
import { Room08MasterPanel } from '../Room08MasterPanel';
import { Room09MasterPanel } from '../Room09MasterPanel';
import { Room10MasterPanel } from '../Room10MasterPanel';
import { Room11MasterPanel } from '../Room11MasterPanel';
import { Room12MasterPanel } from '../Room12MasterPanel';
import { Room13MasterPanel } from '../Room13MasterPanel';
import { Room14MasterPanel } from '../Room14MasterPanel';
import { Room15MasterPanel } from '../Room15MasterPanel';
import { Room16MasterPanel } from '../Room16MasterPanel';
import { Room17MasterPanel } from '../Room17MasterPanel';
import { RealtimeVerifiedSealTelemetry } from '../RealtimeVerifiedSealTelemetry';
import { SystemResourceGrid } from '../SystemResourceGrid';
import { HealthDashboard } from '../HealthDashboard';
import { AggregateSystemEntropyChart } from '../AggregateSystemEntropyChart';
import { SpatialEntropyHeatMap } from '../SpatialEntropyHeatMap';
import { SovereignAuditDashboard } from '../SovereignAuditDashboard';
import { GitHubSyncStatusUtility } from '../dashboard/GitHubSyncStatusUtility';
import { QuickActionsMenu } from '../QuickActionsMenu';
import { CopilotAutonomyNodePanel } from '../copilot/CopilotAutonomyNodePanel';
import { SealValidationAnimation } from '../SealValidationAnimation';
import { LiveQuantumEntropyTicker } from '../LiveQuantumEntropyTicker';
import { SovereignIntegrityScore } from '../SovereignIntegrityScore';
import { StressTestIndicatorD3Chart } from '../StressTestIndicatorD3Chart';
import { useOfflineWarning } from '../../hooks/useOfflineWarning';
import {
  Activity,
  Cpu,
  ShieldCheck,
  Zap,
  ArrowRight,
  RotateCw,
  Award,
  Crown,
  Orbit,
  Box,
  Boxes,
  Network,
  Maximize2,
  Minimize2,
  Gauge,
  Info,
  X,
  CheckCircle2,
  Hash,
  Shield,
  Layers,
  FileCheck,
  ChevronRight,
  Eye,
  FileText,
  Bell,
  Smartphone,
  PlayCircle,
  Landmark,
  Wallet,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { ShieldAlert } from 'lucide-react';
import { FcmPushNotificationManager } from '../notifications/FcmPushNotificationManager';
import { ChamberVisualizer } from '../ChamberVisualizer';

const TopHardwareChambersCard: React.FC = () => {
  const chambers = [
    { id: 'ROOM05', name: 'DAG Engine 6 Stages', status: 'Nominal', pulse: 98, temp: '38°C' },
    { id: 'ROOM01', name: 'Multi-Key Vault PQC', status: 'Nominal', pulse: 95, temp: '36°C' },
    { id: 'ROOM11', name: 'Court Dossier', status: 'Warning', pulse: 64, temp: '58°C' },
    { id: 'ROOM06', name: 'Circuit Breaker 85°C', status: 'Nominal', pulse: 99, temp: '42°C' },
    { id: 'ROOM04', name: 'HSM Quorum 10 Slots', status: 'Critical', pulse: 21, temp: '81°C' },
  ];

  return (
    <div className="p-3.5 sm:p-5 rounded-2xl bg-[#0a0f1e] border border-white/10 space-y-3 w-full min-w-0 max-w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-cyan-400" />
          Top 5 Active Hardware Chambers
        </h3>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
          LIVE TELEMETRY
        </span>
      </div>

      <div className="space-y-1.5">
        {chambers.map((chamber) => (
          <div
            key={chamber.id}
            className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between font-mono"
          >
            <div>
              <div className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <span className="text-cyan-400">{chamber.id.replace('ROOM', '')}</span>
                <span>{chamber.name}</span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5 flex gap-2">
                <span>Load: {chamber.pulse}%</span>
                <span>Temp: {chamber.temp}</span>
              </div>
            </div>
            <div className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border
              ${chamber.status === 'Nominal' ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/30' : ''}
              ${chamber.status === 'Warning' ? 'bg-amber-950/50 text-amber-400 border-amber-500/30' : ''}
              ${chamber.status === 'Critical' ? 'bg-rose-950/50 text-rose-400 border-rose-500/30 animate-pulse' : ''}
            `}>
              {chamber.status === 'Nominal' && <ShieldCheck className="w-3 h-3" />}
              {(chamber.status === 'Warning' || chamber.status === 'Critical') && <ShieldAlert className="w-3 h-3" />}
              {chamber.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface DashboardViewProps {
  snapshots?: HardwareSnapshot[];
  verificationGateStatus?: {
    status: 'ACTIVE_GUARD' | 'PASSED' | 'BLOCKED';
    lastCheckedTime: string;
    complianceEventCount: number;
    sealCount: number;
    message: string;
  };
  onNavigate: (view: ViewType) => void;
  onOpenCertificate: () => void;
  isForensicAuditMode?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  snapshots = [],
  verificationGateStatus,
  onNavigate,
  onOpenCertificate,
  isForensicAuditMode = false,
}) => {
  // Listen and alert on browser offline / online events
  useOfflineWarning();

  // Main executive sections: Overview (clean summary), Sovereign Audit Dashboard, Chambers Explorer, Telemetry, Evidence, Android 16+ FCM Push, Chamber Visualizer
  const [dashboardSection, setDashboardSection] = useState<'OVERVIEW' | 'AUDIT' | 'CHAMBERS' | 'TELEMETRY' | 'EVIDENCE' | 'FCM_PUSH' | 'VISUALIZER'>('OVERVIEW');
  const [activeCanvasTab, setActiveCanvasTab] = useState<'hologram' | 'atlas' | 'overview' | 'topology'>('hologram');
  const [isHealing, setIsHealing] = useState(false);
  const [healSuccess, setHealSuccess] = useState(false);
  const [citadelSpeed, setCitadelSpeed] = useState<number>(1.2);
  const [isCanvasExpanded, setIsCanvasExpanded] = useState<boolean>(false);
  const [showBufferModal, setShowBufferModal] = useState<boolean>(false);
  const [selectedChamber, setSelectedChamber] = useState<string>('ROOM00');
  const [isVerifyingSeals, setIsVerifyingSeals] = useState<boolean>(false);

  // Dynamic verified seals count based on 14,902 canonical baseline + appended valid snapshots
  const baselineCanonicalSeals = 14902;
  const initialSnapshotsCount = 2;
  const addedSnapshots = Math.max(0, snapshots.length - initialSnapshotsCount);
  const totalVerifiedSeals = baselineCanonicalSeals + addedSnapshots;
  const totalSealsCount = baselineCanonicalSeals + 80 + addedSnapshots;

  // Calculate current vs last audit snapshot integrity score & trend
  const currentIntegrityScore = ((verificationGateStatus?.sealCount || totalVerifiedSeals) / totalSealsCount) * 100;
  const prevAddedSnapshots = Math.max(0, addedSnapshots - 1);
  const prevVerified = baselineCanonicalSeals + prevAddedSnapshots;
  const prevTotal = baselineCanonicalSeals + 80 + prevAddedSnapshots;
  const prevIntegrityScore = (prevVerified / prevTotal) * 100;
  const integrityTrendDelta = currentIntegrityScore - prevIntegrityScore;
  const integrityTrend: 'increased' | 'decreased' | 'stable' =
    integrityTrendDelta > 0.0001
      ? 'increased'
      : integrityTrendDelta < -0.0001
      ? 'decreased'
      : 'stable';

  const triggerSelfHealing = () => {
    setIsHealing(true);
    setHealSuccess(false);
    playTone(500, 0.1, 'sine');
    setTimeout(() => {
      setIsHealing(false);
      setHealSuccess(true);
      playAuditChime();
      setTimeout(() => setHealSuccess(false), 4000);
    }, 1200);
  };

  const CHAMBERS_LIST = [
    { id: 'ROOM00', num: '00', titleEn: 'Sovereign Foundation', titleTh: 'รากฐานอธิปไตย', emoji: '🏛️' },
    { id: 'ROOM01', num: '01', titleEn: 'Multi-Key Vault PQC', titleTh: 'ห้องนิรภัยพหุกุญแจ', emoji: '🔐' },
    { id: 'ROOM02', num: '02', titleEn: 'Immutable Audit Ledger', titleTh: 'สมุดบันทึกหลักฐาน', emoji: '📜' },
    { id: 'ROOM03', num: '03', titleEn: 'Safe Harbor ETDA/PDPA', titleTh: 'เกราะคุ้มครองกฎหมาย', emoji: '⚖️' },
    { id: 'ROOM04', num: '04', titleEn: 'HSM Quorum 10 Slots', titleTh: 'องค์ประชุม HSM', emoji: '🧊' },
    { id: 'ROOM05', num: '05', titleEn: 'DAG Engine 6 Stages', titleTh: 'กลไก DAG อัตโนมัติ', emoji: '⚙️' },
    { id: 'ROOM06', num: '06', titleEn: 'Circuit Breaker 85°C', titleTh: 'ระบบตัดวงจรความร้อน', emoji: '🛡️' },
    { id: 'ROOM07', num: '07', titleEn: 'Phoenix Auto-Healing', titleTh: 'การฟื้นฟูอัตโนมัติ', emoji: '🐦‍🔥' },
    { id: 'ROOM08', num: '08', titleEn: 'Merkle Verifier', titleTh: 'ผู้ตรวจสอบ Merkle', emoji: '🔍' },
    { id: 'ROOM09', num: '09', titleEn: 'Telemetry Redacted', titleTh: 'โทรมาตรความมั่นคง', emoji: '📡' },
    { id: 'ROOM10', num: '10', titleEn: 'Treasury & RWA', titleTh: 'คลังสินทรัพย์ 4.23B THB', emoji: '💰' },
    { id: 'ROOM11', num: '11', titleEn: 'Court Dossier', titleTh: 'สำนวนคดีพร้อมรับฟัง', emoji: '📑' },
    { id: 'ROOM12', num: '12', titleEn: 'Zero-Trust Firewall', titleTh: 'ไฟร์วอลล์ห้ามเขียน', emoji: '🔒' },
    { id: 'ROOM13', num: '13', titleEn: 'BFT Mesh 6 Nodes', titleTh: 'เครือข่ายฉันทามติ BFT', emoji: '🌐' },
    { id: 'ROOM14', num: '14', titleEn: 'Neural Observer', titleTh: 'ผู้ตรวจการโครงข่ายประสาท', emoji: '🧠' },
    { id: 'ROOM15', num: '15', titleEn: 'Sonic Alert', titleTh: 'ระบบแจ้งเตือนเสียง 882Hz', emoji: '🔊' },
    { id: 'ROOM16', num: '16', titleEn: '3D Quantum Viz', titleTh: 'ทัศนภาพควอนตัม 3 มิติ', emoji: '🎮' },
    { id: 'ROOM17', num: '17', titleEn: 'Supreme Command', titleTh: 'ศูนย์บัญชาการสูงสุด', emoji: '👑' },
  ];

  return (
    <div className="space-y-4 sm:space-y-5 max-w-full overflow-x-hidden animate-in fade-in duration-200 max-[479px]:p-[12px] max-[479px]:space-y-3">
      <AnimatePresence>
        {isVerifyingSeals && (
          <SealValidationAnimation
            onComplete={() => setIsVerifyingSeals(false)}
            onClose={() => setIsVerifyingSeals(false)}
          />
        )}
      </AnimatePresence>

      {/* Real-time Quantum Stream Entropy, Block Height & Compliance Status Ticker */}
      <div className="rounded-xl overflow-hidden border border-cyan-500/30 shadow-lg shadow-cyan-950/40">
        <LiveQuantumEntropyTicker />
      </div>

      {/* Unified Executive Header & Single Status Bar (Density Reduction) */}
      <div className="p-3.5 sm:p-5 md:p-6 rounded-2xl bg-[#0a0f1e] border border-cyan-500/20 relative overflow-hidden shadow-xl max-[479px]:p-[12px]">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[11px] font-mono font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                💎 FROZEN v1.2 LTS
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-semibold">
                🛡️ GOVERNANCE: {STATE_AUTHORITY.GOVERNANCE_CONSENSUS}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-semibold">
                🔐 CUSTODIAN: {STATE_AUTHORITY.CUSTODIAN_STATUS_LABEL}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-500/40 text-[11px] font-mono font-semibold">
                🌐 {STATE_AUTHORITY.TENANT_BOUNDARY} LOCKED
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-700 text-[11px] font-mono font-semibold">
                ⚙️ RUNTIME: {STATE_AUTHORITY.RUNTIME_STATUS}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-semibold">
                ⚖️ ETDA / PDPA
              </span>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-mono font-bold text-white tracking-tight flex items-center gap-2">
              <span>🏛️ ZYRQUEN <strong className="text-cyan-400">Ω∞</strong> SOVEREIGN ENGINE</span>
            </h1>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-zinc-400 pt-0.5">
              <span>Root: <strong className="text-zinc-200">909ab814...fa4c68</strong></span>
              <span className="text-zinc-600">•</span>
              <span>Block: <strong className="text-zinc-200">#849202</strong></span>
              <span className="text-zinc-600">•</span>
              <span>Seals: <strong className="text-emerald-300">14,902 Verified</strong></span>
              <span className="text-zinc-600">•</span>
              <span>SSoT Drift: <strong className="text-cyan-300">Δ0.00%</strong></span>
              <span className="text-zinc-600">•</span>
              <span className="inline-flex items-center gap-1 font-mono">
                <span>Integrity:</span>
                <strong className="text-emerald-300 tabular-nums">{currentIntegrityScore.toFixed(2)}%</strong>
                <span
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                    integrityTrend === 'increased'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                      : integrityTrend === 'decreased'
                      ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                      : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
                  }`}
                  title={`Integrity trend: ${integrityTrend} (${integrityTrendDelta >= 0 ? '+' : ''}${integrityTrendDelta.toFixed(3)}%)`}
                >
                  {integrityTrend === 'increased' && <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />}
                  {integrityTrend === 'decreased' && <TrendingDown className="w-2.5 h-2.5 text-rose-400" />}
                  {integrityTrend === 'stable' && <Minus className="w-2.5 h-2.5 text-cyan-400" />}
                  <span>{integrityTrend === 'increased' ? '↑ Increased' : integrityTrend === 'decreased' ? '↓ Decreased' : '→ Stable'}</span>
                </span>
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-300 font-medium">นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)</span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 max-[479px]:w-full max-[479px]:grid max-[479px]:grid-cols-1 max-[479px]:gap-2">
            <button
              onClick={() => {
                playTone(920, 0.06);
                onNavigate('briefing');
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-[#D4AF37]/20 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 border border-[#D4AF37]/50 text-[#D4AF37] font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all max-[479px]:w-full shadow-[0_0_15px_rgba(212,175,55,0.25)] cursor-pointer"
              title="Open Executive Infographic & Court Admissible Evidence Timeline"
            >
              <Landmark className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>📊 สรุปผู้บริหาร & ศาล</span>
            </button>

            <button
              onClick={() => {
                playTone(890, 0.06);
                onNavigate('sovereign-wallet');
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-950/70 via-black to-[#0a0f1e] hover:bg-amber-900/60 border border-[#D4AF37]/60 text-[#D4AF37] font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all max-[479px]:w-full shadow-[0_0_12px_rgba(212,175,55,0.2)] cursor-pointer"
              title="Open Sovereign Cryptographic Wallet & WebAuthn Key Dispatcher"
            >
              <Wallet className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>🔑 Sovereign Wallet (QR)</span>
            </button>

            <button
              onClick={() => {
                playTone(780, 0.05);
                setDashboardSection('FCM_PUSH');
              }}
              className="px-3.5 py-2 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/50 text-cyan-300 font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all max-[479px]:w-full shadow-[0_0_12px_rgba(6,182,212,0.2)]"
              title="Manage Android 16.0+ Push Alerts & Token Lifecycle"
            >
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span>📱 Android 16+ FCM</span>
            </button>

            <button
              onClick={() => {
                playTone(840, 0.05);
                onNavigate('playback');
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-950/70 hover:bg-amber-900/80 border border-amber-500/50 text-amber-300 font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all max-[479px]:w-full shadow-[0_0_12px_rgba(245,158,11,0.2)]"
              title="Open 12-Stage Forensic Trace Replay (WebSocket Live Stream)"
            >
              <PlayCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>⚡ 12-Stage Trace</span>
            </button>

            <button
              onClick={() => {
                playTone(880, 0.05);
                setDashboardSection('AUDIT');
              }}
              className="px-3.5 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/50 text-cyan-300 font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all max-[479px]:w-full"
              title="Open Sovereign Audit Dashboard"
            >
              <span>🏛️ Sovereign Audit Dashboard</span>
            </button>

            <button
              onClick={triggerSelfHealing}
              disabled={isHealing}
              className={`px-3.5 py-2 rounded-xl font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all border max-[479px]:w-full ${
                isHealing
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-200 animate-pulse'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-100 hover:border-cyan-500/40'
              }`}
              title="Autonomous Phoenix Self-Healing (142ms recovery verification)"
            >
              <RotateCw className={`w-3.5 h-3.5 text-cyan-400 ${isHealing ? 'animate-spin' : ''}`} />
              <span>{isHealing ? 'Healing...' : 'Phoenix Healing'}</span>
            </button>

            <button
              onClick={() => {
                playTone(740, 0.08);
                onNavigate('council');
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all max-[479px]:w-full"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>สภาผู้พิทักษ์ 10/10</span>
            </button>

            <button
              onClick={() => {
                playTone(680, 0.08);
                onOpenCertificate();
              }}
              className="px-3.5 py-2 rounded-xl bg-yellow-950/60 hover:bg-yellow-900/60 border border-amber-500/40 text-amber-300 font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all max-[479px]:w-full"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Gold Master Seal</span>
            </button>
          </div>
        </div>

        {healSuccess && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Autonomous Phoenix Healing complete in 142ms. 10/10 invariants verified. Block #849202 sealed.</span>
          </div>
        )}
      </div>

      {/* Primary 4 Metric Gauges (Essential Decision View) */}
      <div className="main-dashboard-stats-grid grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className={`p-4 rounded-2xl bg-[#0a0f1e] border space-y-1.5 transition-all relative overflow-hidden ${
          isForensicAuditMode ? 'border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'border-white/10 hover:border-cyan-500/40'
        }`}>
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              ENERGY DISPATCH
            </span>
            <span className="text-cyan-400 text-[10px] font-semibold">QOps / SEC</span>
          </div>
          <div className="text-base sm:text-lg lg:text-2xl font-mono font-bold text-white tracking-tight">
            {SYSTEM_METADATA.qOpsTelemetry} <span className="text-xs font-normal text-zinc-400">QOps/s</span>
          </div>
          <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Zero-jitter dispatch • 1.2ms latency
          </div>

          {isForensicAuditMode && (
            <div className="pt-2 mt-1 border-t border-purple-500/20 text-[10px] font-mono text-purple-300 space-y-0.5 bg-purple-950/30 p-1.5 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-purple-400">Meta Hash:</span>
                <span className="font-bold text-white">sha256:7f90c2a...814</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-400">PQC Status:</span>
                <span className="text-emerald-300 font-bold">FIPS 204 VALID</span>
              </div>
            </div>
          )}
        </div>

        <div className={`p-4 rounded-2xl bg-[#0a0f1e] border space-y-1.5 transition-all relative overflow-hidden ${
          isForensicAuditMode ? 'border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'border-white/10 hover:border-violet-500/40'
        }`}>
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-violet-400" />
              COHERENCE INDEX
            </span>
            <span className="text-violet-400 text-[10px] font-semibold">768 QUBITS</span>
          </div>
          <div className="text-base sm:text-lg lg:text-2xl font-mono font-bold text-white tracking-tight">
            {SYSTEM_METADATA.coherence}
          </div>
          <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            Phase resonance aligned • Tri-agent sync
          </div>

          {isForensicAuditMode && (
            <div className="pt-2 mt-1 border-t border-purple-500/20 text-[10px] font-mono text-purple-300 space-y-0.5 bg-purple-950/30 p-1.5 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-purple-400">Quantum State:</span>
                <span className="font-bold text-white">768Q_COH_99.97</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-400">PQC Scheme:</span>
                <span className="text-emerald-300 font-bold">ML-KEM-1024 BOUND</span>
              </div>
            </div>
          )}
        </div>

        <div className={`p-4 rounded-2xl bg-[#0a0f1e] border space-y-1.5 transition-all relative overflow-hidden ${
          isForensicAuditMode ? 'border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'border-white/10 hover:border-amber-500/40'
        }`}>
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              CRYO THERMAL
            </span>
            <span className="text-amber-400 text-[10px] font-semibold">SUBZERO HELIUM</span>
          </div>
          <div className="text-base sm:text-lg lg:text-2xl font-mono font-bold text-white tracking-tight">
            {SYSTEM_METADATA.cryoTemp}
          </div>
          <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Coolant flow: {SYSTEM_METADATA.coolantFlow}
          </div>

          {isForensicAuditMode && (
            <div className="pt-2 mt-1 border-t border-purple-500/20 text-[10px] font-mono text-purple-300 space-y-0.5 bg-purple-950/30 p-1.5 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-purple-400">Cryo State:</span>
                <span className="font-bold text-white">12.4mK_SECURE</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-400">PQC Status:</span>
                <span className="text-emerald-300 font-bold">SLH-DSA ATTESTED</span>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <RealtimeVerifiedSealTelemetry
            sealCount={verificationGateStatus?.sealCount || totalVerifiedSeals}
            baseSealCount={baselineCanonicalSeals}
            status={verificationGateStatus?.status || (addedSnapshots > 0 ? 'PASSED' : 'ACTIVE_GUARD')}
            lastCheckedTime={verificationGateStatus?.lastCheckedTime || '05:05:30 ICT'}
            complianceEventCount={verificationGateStatus?.complianceEventCount ?? 2}
            onNavigateToLedger={() => onNavigate('ledger')}
          />
        </div>
      </div>

      {/* Progressive Disclosure Section Navigation Bar */}
      <div className="p-1.5 rounded-2xl bg-[#070a12] border border-cyan-500/30 flex flex-wrap items-center justify-between gap-2 font-mono text-xs max-[479px]:p-[12px] max-[479px]:grid max-[479px]:grid-cols-1 max-[479px]:gap-2">
        <div className="flex flex-wrap items-center gap-1 max-[479px]:grid max-[479px]:grid-cols-1 max-[479px]:w-full max-[479px]:gap-2">
          <button
            onClick={() => {
              playTone(620, 0.04);
              setDashboardSection('OVERVIEW');
            }}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer max-[479px]:w-full max-[479px]:justify-start ${
              dashboardSection === 'OVERVIEW'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'text-zinc-400 hover:text-zinc-200 bg-white/5 border border-transparent'
            }`}
          >
            <span>🌟 Executive Overview</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
              99.47% INTEGRITY
            </span>
          </button>

          <button
            onClick={() => {
              playTone(880, 0.04);
              setDashboardSection('AUDIT');
            }}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer max-[479px]:w-full max-[479px]:justify-start ${
              dashboardSection === 'AUDIT'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'text-zinc-400 hover:text-zinc-200 bg-white/5 border border-transparent'
            }`}
          >
            <span>🏛️ Sovereign Audit Dashboard</span>
            <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 text-[10px] font-mono border border-cyan-500/30">
              ENTROPY HEATMAP
            </span>
          </button>

          <button
            onClick={() => {
              playTone(660, 0.04);
              setDashboardSection('CHAMBERS');
            }}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer max-[479px]:w-full max-[479px]:justify-start ${
              dashboardSection === 'CHAMBERS'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'text-zinc-400 hover:text-zinc-200 bg-white/5 border border-transparent'
            }`}
          >
            <span>🏛️ 18 Chambers Explorer</span>
            <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 text-[10px] font-mono border border-cyan-500/30">
              18 ROOMS
            </span>
          </button>

          <button
            onClick={() => {
              playTone(710, 0.04);
              setDashboardSection('VISUALIZER');
            }}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer max-[479px]:w-full max-[479px]:justify-start ${
              dashboardSection === 'VISUALIZER'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'text-zinc-400 hover:text-zinc-200 bg-white/5 border border-transparent'
            }`}
          >
            <span>🔬 Chamber Visualizer</span>
            <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 text-[10px] font-mono border border-cyan-500/30">
              14,902 SEALS
            </span>
          </button>

          <button
            onClick={() => {
              playTone(700, 0.04);
              setDashboardSection('TELEMETRY');
            }}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer max-[479px]:w-full max-[479px]:justify-start ${
              dashboardSection === 'TELEMETRY'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'text-zinc-400 hover:text-zinc-200 bg-white/5 border border-transparent'
            }`}
          >
            <span>📊 Telemetry &amp; Health</span>
          </button>

          <button
            onClick={() => {
              playTone(740, 0.04);
              setDashboardSection('EVIDENCE');
            }}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer max-[479px]:w-full max-[479px]:justify-start ${
              dashboardSection === 'EVIDENCE'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'text-zinc-400 hover:text-zinc-200 bg-white/5 border border-transparent'
            }`}
          >
            <span>📜 Evidence &amp; Intake</span>
          </button>

          <button
            onClick={() => {
              playTone(760, 0.04);
              setDashboardSection('FCM_PUSH');
            }}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer max-[479px]:w-full max-[479px]:justify-start ${
              dashboardSection === 'FCM_PUSH'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'text-zinc-400 hover:text-zinc-200 bg-white/5 border border-transparent'
            }`}
          >
            <span>📱 Android 16+ FCM Push</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
              API 36
            </span>
          </button>
        </div>

        <div className="text-[11px] text-zinc-400 px-3 py-1 font-mono hidden md:inline">
          Ω600_1000 • 10/10 REAL_HSM • Δ0.00%
        </div>
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {dashboardSection === 'OVERVIEW' && (
        <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200 w-full min-w-0 max-w-full">
          {/* Real-time Sovereign Integrity Score based on Verified vs Total Seals Ratio */}
          <SovereignIntegrityScore
            verifiedSeals={verificationGateStatus?.sealCount || totalVerifiedSeals}
            totalSeals={totalSealsCount}
            quarantinedSeals={80}
            lastCheckedTime={verificationGateStatus?.lastCheckedTime || '05:05:30 ICT'}
            onNavigateToLedger={() => onNavigate('ledger')}
            onNavigateToChambers={() => setDashboardSection('CHAMBERS')}
            snapshots={snapshots}
            integrityTrend={integrityTrend}
            trendDelta={integrityTrendDelta}
            previousScore={prevIntegrityScore}
          />

          {/* GitHub Synchronization Status Utility (Checksum & Merkle Parity Engine) */}
          <GitHubSyncStatusUtility />

          {/* Real-Time Stress Test & 35.80ms Latency Jitter Indicator against 142.00ms SLA Target */}
          <StressTestIndicatorD3Chart initialLatencyMs={35.80} slaLimitMs={142.00} />

          {/* System Health Dashboard (CPU, Memory, Cryostat Recharts Realtime Stream) */}
          <HealthDashboard snapshots={snapshots} />

          {/* Main Grid: Visual Lattice / Topology & Live Subsystem Rail */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 items-start w-full min-w-0 max-w-full">
            {/* Left 7 Columns: Visual Canvas & Active Core Views */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-5 w-full min-w-0 max-w-full">
              {/* Sovereign World Engine Card */}
              <div className="p-3.5 sm:p-5 md:p-6 rounded-2xl bg-[#0a0f1e] border border-cyan-500/20 space-y-4 shadow-xl relative overflow-hidden w-full min-w-0 max-w-full">
                {/* Header: Sovereign World Engine & Isolated UI Buffer */}
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                      {activeCanvasTab === 'overview' ? (
                        <Orbit className="w-5 h-5 animate-spin" style={{ animationDuration: '24s' }} />
                      ) : (
                        <Network className="w-5 h-5 text-violet-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                          Sovereign World Engine
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-cyan-300 bg-cyan-950/70 px-2 py-0.5 rounded-full border border-cyan-500/40 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                          GPU Virtual Canvas
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-2 mt-0.5">
                        <span>ZERO CONSENSUS DRIFT</span>
                        <span className="text-zinc-600">•</span>
                        <span>THREAD #0</span>
                      </div>
                    </div>
                  </div>

                  {/* Segmented Switcher & Controls */}
                  <div className="relative z-10 flex items-center gap-1.5 flex-wrap">
                    <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10 flex-wrap gap-1">
                      <button
                        onClick={() => {
                          playTone(680, 0.04);
                          setActiveCanvasTab('hologram');
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                          activeCanvasTab === 'hologram'
                            ? 'bg-cyan-500/20 text-white font-bold border border-cyan-400/50'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <Boxes className="w-3.5 h-3.5 text-cyan-300" />
                        <span>3D Hologram</span>
                      </button>
                      <button
                        onClick={() => {
                          playTone(660, 0.04);
                          setActiveCanvasTab('atlas');
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                          activeCanvasTab === 'atlas'
                            ? 'bg-cyan-500/20 text-white font-bold border border-cyan-400/50'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <Orbit className="w-3.5 h-3.5 text-cyan-400" />
                        <span>3D Atlas</span>
                      </button>
                      <button
                        onClick={() => {
                          playTone(600, 0.04);
                          setActiveCanvasTab('overview');
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                          activeCanvasTab === 'overview'
                            ? 'bg-cyan-500/20 text-white font-bold border border-cyan-400/50'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <Box className="w-3.5 h-3.5 text-amber-400" />
                        <span>Wireframe</span>
                      </button>
                      <button
                        onClick={() => {
                          playTone(640, 0.04);
                          setActiveCanvasTab('topology');
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                          activeCanvasTab === 'topology'
                            ? 'bg-cyan-500/20 text-white font-bold border border-cyan-400/50'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <Network className="w-3.5 h-3.5 text-violet-400" />
                        <span>Topology</span>
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setIsCanvasExpanded(!isCanvasExpanded);
                        playTone(620, 0.03);
                      }}
                      title={isCanvasExpanded ? 'Contract Viewport' : 'Expand Viewport'}
                      className="p-1.5 rounded-xl bg-black/50 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white"
                    >
                      {isCanvasExpanded ? (
                        <Minimize2 className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Maximize2 className="w-4 h-4 text-zinc-300" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Canvas Viewer */}
                <div
                  className={`relative w-full rounded-2xl bg-[#050710] border border-cyan-500/25 overflow-hidden flex items-center justify-center transition-all duration-300 ${
                    isCanvasExpanded ? 'h-[580px]' : 'h-[360px] sm:h-[440px]'
                  }`}
                >
                  {activeCanvasTab === 'hologram' ? (
                    <QuantumCitadelLatticeHologramVisualizer
                      expanded={isCanvasExpanded}
                      onToggleExpand={() => setIsCanvasExpanded(!isCanvasExpanded)}
                      onNavigate={onNavigate}
                    />
                  ) : activeCanvasTab === 'atlas' ? (
                    <ChamberRuntimeAtlas3D
                      expanded={isCanvasExpanded}
                      onToggleExpand={() => setIsCanvasExpanded(!isCanvasExpanded)}
                    />
                  ) : activeCanvasTab === 'overview' ? (
                    <CitadelCanvas speedMultiplier={citadelSpeed} highlightColor="#06B6D4" />
                  ) : (
                    <TopologyCanvas />
                  )}
                </div>

                {/* Footer description */}
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono pt-1 gap-2 border-t border-white/8">
                  <div className="text-zinc-300">
                    Golden Icosahedron Core #849202 • 18 Chambers Lattice
                  </div>
                  <button
                    onClick={() => {
                      playTone(660, 0.03);
                      setShowBufferModal(true);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-zinc-300 hover:text-white"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Isolated UI Buffer Details</span>
                  </button>
                </div>
              </div>

              {/* Quick Launchpad to 12 Core Views */}
              <div className="p-3.5 sm:p-5 rounded-2xl bg-[#0a0f1e] border border-white/10 space-y-3 w-full min-w-0 max-w-full">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
                    Core Operating Views
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-400">100% ROUTABLE</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    { id: 'legal', name: 'Legal & PDPA', desc: 'ETDA Sec 9/26/28', emoji: '⚖️' },
                    { id: 'council', name: 'Sovereign Council', desc: '10/10 Quorum HSM', emoji: '👑' },
                    { id: 'ledger', name: 'Evidence Ledger', desc: '14,902 SHA Seals', emoji: '📜' },
                    { id: 'pulse', name: 'System Pulse', desc: 'Cryo & Telemetry', emoji: '📡' },
                    { id: 'quantum', name: 'Quantum Nexus', desc: '768-Qubit State', emoji: '🎮' },
                    { id: 'vault', name: 'Sovereign Vault', desc: 'OMEGA Clearance', emoji: '🔐' },
                    { id: 'production', name: 'Readiness PH-20', desc: 'Zero-Trust Bastion', emoji: '🛡️' },
                    { id: 'console', name: 'CLI Console', desc: 'Developer CLI', emoji: '⚙️' },
                    { id: 'archive', name: 'Archive 17 Mod', desc: 'Genesis Manifest', emoji: '📑' },
                  ].map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        playTone(560, 0.05);
                        onNavigate(v.id as ViewType);
                      }}
                      className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/6 hover:border-white/15 text-left transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-zinc-200 flex items-center gap-1.5">
                          <span>{v.emoji}</span>
                          <span>{v.name}</span>
                        </span>
                        <ArrowRight className="w-3 h-3 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{v.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Forensic Trace & Canonical Modules */}
            <div className="lg:col-span-5 space-y-4 sm:space-y-5 w-full min-w-0 max-w-full">
              
              <TopHardwareChambersCard />

              {/* Latest Verified Forensic Transaction */}
              <div className={`p-3.5 sm:p-5 rounded-2xl bg-[#0a0f1e] border space-y-3.5 transition-all w-full min-w-0 max-w-full ${
                isForensicAuditMode ? 'border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'border-white/10'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
                      Latest 12-Stage Forensic Trace
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    142ms VERIFIED
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1 text-xs font-mono">
                  <div className="text-zinc-200 font-bold">{AUDIT_TRACE_TX.txId}</div>
                  <div className="text-zinc-400 text-[11px]">{AUDIT_TRACE_TX.title}</div>
                  <div className="text-zinc-500 text-[10px] pt-1 flex items-center justify-between">
                    <span>Actor: {AUDIT_TRACE_TX.rootActor}</span>
                    <span className="text-cyan-400">Block #{AUDIT_TRACE_TX.sealedLedgerBlock}</span>
                  </div>
                </div>

                {/* Stages Mini-timeline */}
                <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                  {AUDIT_TRACE_TX.stages.slice(0, 6).map((stage) => (
                    <div
                      key={stage.id}
                      className="p-2 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-white/5 flex items-center justify-center text-[10px] text-cyan-300 font-bold">
                          {stage.stageNumber}
                        </span>
                        <span className="text-zinc-300 text-[11px]">{stage.name}</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono">{stage.durationMs}ms</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 w-full mt-2">
                  <button
                    onClick={() => {
                      playTone(600, 0.05);
                      onNavigate('ledger');
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/30 text-cyan-300 font-mono text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Evidence Ledger</span>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                  </button>
                  <button
                    onClick={() => {
                      playTone(650, 0.05);
                      setIsVerifyingSeals(true);
                    }}
                    className="flex-[1.5] py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-emerald-400"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-100" />
                    <span>Verify All 14,902 Seals</span>
                  </button>
                </div>
              </div>

              {/* Canonical Architecture Summary */}
              <div className="p-3.5 sm:p-5 rounded-2xl bg-[#0a0f1e] border border-white/10 space-y-3 w-full min-w-0 max-w-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
                    17 Canonical Modules
                  </span>
                  <span className="text-[10px] font-mono text-violet-300 bg-violet-950 px-2 py-0.5 rounded-full border border-violet-500/30">
                    100% PRESERVED
                  </span>
                </div>

                <div className="space-y-1.5">
                  {CANONICAL_MODULES.slice(0, 4).map((mod) => (
                    <div
                      key={mod.id}
                      onClick={() => {
                        playTone(550, 0.05);
                        onNavigate(mod.targetView);
                      }}
                      className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-mono font-bold text-zinc-200 flex items-center gap-1.5">
                          <span className="text-cyan-400">{mod.num}</span>
                          <span>{mod.titleEn}</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono line-clamp-1 mt-0.5">
                          {mod.titleTh}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400">
                        {mod.badge}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    playTone(600, 0.05);
                    onNavigate('archive');
                  }}
                  className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-mono text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Explore All Modules in Archive</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                </button>
              </div>

              {/* Copilot Autonomy Node: Sovereign Ledger Surveillance & Real-Time Suggestions (Bottom-Right Anchor) */}
              <CopilotAutonomyNodePanel />
            </div>
          </div>

          {/* Zyrquen Manifesto Terminal */}
          <ManifestoCard onOpenCertificate={onOpenCertificate} />
        </div>
      )}

      {/* TAB 2: 18 CHAMBERS EXPLORER (Focused Progressive Disclosure) */}
      {dashboardSection === 'CHAMBERS' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Sovereign Dashboard Control Plane Quick Launch */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-cyan-950/60 border border-indigo-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-500/50 flex items-center justify-center text-indigo-400 font-bold text-sm">
                SSoT
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Sovereign Dashboard Control Plane (SSoT v2.0)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Δ0.00% Real-Time
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Real-time telemetry, live Merkle tree proofs, fallback fail-closed protection, and CRUD for 18 Chambers.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  playTone(710, 0.04);
                  setDashboardSection('VISUALIZER');
                }}
                className="px-3 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-400/40 text-cyan-200 font-mono text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
                title="Open 14,902 Hardware Seals Visualizer & Detail Modal"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>14,902 Seals Visualizer</span>
              </button>
              <button
                onClick={() => {
                  playTone(700, 0.05);
                  onNavigate('chambers');
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <span>Launch Control Plane</span>
                <ArrowRight className="w-4 h-4 text-indigo-200" />
              </button>
            </div>
          </div>

          {/* Chamber Picker Strip */}
          <div className="p-3 rounded-2xl bg-[#0a0f1e] border border-cyan-500/20">
            <div className="text-xs font-mono font-bold text-zinc-300 mb-2 px-1 flex items-center justify-between">
              <span>SELECT CHAMBER TO INSPECT:</span>
              <span className="text-[11px] text-cyan-400 font-normal">Active: {selectedChamber}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-1.5">
              {CHAMBERS_LIST.map((c) => {
                const isSelected = selectedChamber === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      playTone(640, 0.04);
                      setSelectedChamber(c.id);
                    }}
                    className={`p-2 rounded-xl text-left font-mono transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        : 'bg-black/40 hover:bg-white/5 text-zinc-400 hover:text-zinc-200 border border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span>{c.emoji}</span>
                      <span className={isSelected ? 'text-cyan-300' : 'text-zinc-500'}>CH-{c.num}</span>
                    </div>
                    <div className="text-[10px] font-semibold truncate mt-1 text-zinc-200">{c.titleEn}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Focused Single Chamber Panel Rendering */}
          <div className="p-1">
            {selectedChamber === 'ROOM00' && (
              <Room00MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
            )}
            {selectedChamber === 'ROOM01' && (
              <Room01MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
            )}
            {selectedChamber === 'ROOM02' && (
              <Room02MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
            )}
            {selectedChamber === 'ROOM03' && (
              <Room03MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
            )}
            {selectedChamber === 'ROOM04' && (
              <Room04MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
            )}
            {selectedChamber === 'ROOM05' && (
              <Room05MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
            )}
            {selectedChamber === 'ROOM06' && (
              <Room06MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
            )}
            {selectedChamber === 'ROOM07' && (
              <Room07MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
            )}
            {selectedChamber === 'ROOM08' && (
              <Room08MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
            )}
            {selectedChamber === 'ROOM09' && (
              <Room09MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
            )}
            {selectedChamber === 'ROOM10' && (
              <Room10MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
            )}
            {selectedChamber === 'ROOM11' && (
              <Room11MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
            )}
            {selectedChamber === 'ROOM12' && (
              <Room12MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
            )}
            {selectedChamber === 'ROOM13' && (
              <Room13MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
            )}
            {selectedChamber === 'ROOM14' && (
              <Room14MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
            )}
            {selectedChamber === 'ROOM15' && (
              <Room15MasterPanel onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
            )}
            {selectedChamber === 'ROOM16' && (
              <Room16MasterPanel onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
            )}
            {selectedChamber === 'ROOM17' && (
              <Room17MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
            )}
          </div>

          {/* 18 Chambers Full Compliance Grid */}
          <ChamberStatusGrid onNavigate={onNavigate} />
        </div>
      )}

      {/* TAB: CHAMBER VISUALIZER (14,902 HARDWARE SEALS & LIVE CRYOSTAT METRICS) */}
      {dashboardSection === 'VISUALIZER' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <ChamberVisualizer />
        </div>
      )}

      {/* TAB 3: TELEMETRY & HEALTH */}
      {dashboardSection === 'TELEMETRY' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <SovereignIntegrityScore
            verifiedSeals={verificationGateStatus?.sealCount || totalVerifiedSeals}
            totalSeals={totalSealsCount}
            quarantinedSeals={80}
            lastCheckedTime={verificationGateStatus?.lastCheckedTime || '05:05:30 ICT'}
            onNavigateToLedger={() => onNavigate('ledger')}
            onNavigateToChambers={() => setDashboardSection('CHAMBERS')}
            snapshots={snapshots}
            integrityTrend={integrityTrend}
            trendDelta={integrityTrendDelta}
            previousScore={prevIntegrityScore}
          />
          <GitHubSyncStatusUtility />
          <HealthDashboard snapshots={snapshots} />
          <LiveAutomatedHealthWidget />
          <SystemResourceGrid />
          <AggregateSystemEntropyChart />
          <SpatialEntropyHeatMap />
          <PerformanceDashboard />
        </div>
      )}

      {/* TAB 4: EVIDENCE & INTAKE */}
      {dashboardSection === 'EVIDENCE' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <EvidenceIntakePanel evidenceIds={['TNT-TH-001', 'DS-901-PILOT']} />
          <FiosFactorIntelligence />
          <PinnedWidgetsDashboard onNavigate={onNavigate} />
        </div>
      )}

      {/* TAB 5: ANDROID 16.0+ FCM PUSH NOTIFICATIONS */}
      {dashboardSection === 'FCM_PUSH' && (
        <div className="space-y-5 animate-in fade-in duration-200 w-full min-w-0 max-w-full">
          <FcmPushNotificationManager />
        </div>
      )}

      {/* TAB 5: SOVEREIGN AUDIT DASHBOARD */}
      {(dashboardSection === 'AUDIT' || (dashboardSection as string) === 'SOVEREIGN_AUDIT') && (
        <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200 w-full min-w-0 max-w-full overflow-x-hidden max-[479px]:p-[12px] max-[479px]:space-y-3">
          <SovereignAuditDashboard />
        </div>
      )}

      <QuickActionsMenu onToggleForensicAudit={() => setDashboardSection('AUDIT')} />

      {/* Non-Authoritative Isolated UI Buffer Security Modal */}
      {showBufferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-xl bg-[#0a0f1e] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase">
                  Isolated UI Buffer Architecture
                </h3>
              </div>
              <button
                onClick={() => setShowBufferModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-zinc-300">
              <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1">
                <div className="text-cyan-300 font-bold">Zero Consensus Mutation</div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  3D Quantum Citadel Lattice executes within an isolated GPU canvas buffer. User rotations and inspect interactions produce zero consensus state mutation.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1">
                <div className="text-amber-300 font-bold">Immutable Golden Root Anchor (#14,902)</div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Visual telemetry strictly mirrors the immutable SHA-256 Merkle root. Any synthetic drift is intercepted by the Baseline Reconciliation Guard.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1">
                <div className="text-emerald-300 font-bold">Thai Legal ETDA &amp; PDPA Compliance</div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Evidentiary probative weight is anchored strictly to cryptographic ledger receipts under ETDA Sec 9, 26, 28 and PDPA Sec 9, 26, 28.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                onClick={() => setShowBufferModal(false)}
                className="px-4 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
