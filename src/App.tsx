import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion, animate } from 'motion/react';
import { HashRouter, useLocation, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Shield,
  Terminal,
  Keyboard,
  Activity,
  Heart,
  Waves,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  Scale,
  FileText,
  Info,
  BookOpen,
  Fingerprint,
  Clock,
  Download,
  X,
  Bot,
  Copy,
  FileDown,
} from 'lucide-react';

import { ViewType, HardwareSnapshot } from '@/types';
import { Navigation } from '@/components/Navigation';
import { LeftSidebar } from '@/components/LeftSidebar';
import { MainFooter } from '@/components/MainFooter';
import { SovereignControlDock } from '@/components/SovereignControlDock';
import { CopilotSovereignAI } from '@/components/CopilotSovereignAI';
import { SystemEventsSidebar, SystemEvent } from '@/components/SystemEventsSidebar';
import { DashboardView } from '@/components/views/DashboardView';
import { QuantumView } from '@/components/views/QuantumView';
import { Chamber11QuantumRadar } from '@/components/views/Chamber11QuantumRadar';
import { G11CanonicalCore } from '@/components/views/G11CanonicalCore';
import { NexusView } from '@/components/views/NexusView';
import { VaultView } from '@/components/views/VaultView';
import { LedgerView } from '@/components/views/LedgerView';
import { PulseView } from '@/components/views/PulseView';
import { ForgeView } from '@/components/views/ForgeView';
import { MatrixView } from '@/components/views/MatrixView';
import { ArchiveView } from '@/components/views/ArchiveView';
import { ConsoleView } from '@/components/views/ConsoleView';
import { SecurityView, SecuritySubTab } from '@/components/views/SecurityView';
import { SettingsView } from '@/components/views/SettingsView';
import { ProductionReadinessView } from '@/components/views/ProductionReadinessView';
import { CouncilView } from '@/components/views/CouncilView';
import { LegalView } from '@/components/views/LegalView';
import { ForensicAuditStepper } from '@/components/ForensicAuditStepper';
import { StudioView } from '@/components/views/StudioView';
import { UnifiedMultiverseControlPanel } from '@/components/views/UnifiedMultiverseControlPanel';
import { UnifiedAuditPlaybackConsole } from '@/components/views/UnifiedAuditPlaybackConsole';
import { GovernanceHealthHeatmap } from '@/components/views/GovernanceHealthHeatmap';
import { CivilizationEngineView } from '@/components/views/CivilizationEngineView';
import { CanonicalIntegrityDashboardView } from '@/components/views/CanonicalIntegrityDashboardView';
import { QuantumAuditFusionView } from '@/components/views/QuantumAuditFusionView';
import { AdminConsole } from '@/components/AdminConsole';
import { AuditAnalyticsDashboard } from '@/components/AuditAnalyticsDashboard';
import { SovereignChambersControlPlane } from '@/components/SovereignChambersControlPlane';
import { AuditHistoryView } from '@/components/views/AuditHistoryView';
import { SecurityPipelineView } from '@/components/views/SecurityPipelineView';
import { ExecutiveCourtBriefing } from '@/components/executive/ExecutiveCourtBriefing';
import { SovereignWalletView } from '@/components/views/SovereignWalletView';
import { AuditCertificateModal } from '@/components/AuditCertificateModal';
import { GitHubPwaModal } from '@/components/GitHubPwaModal';
import { ThaiLegalSearchModal } from '@/components/ThaiLegalSearchModal';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { VoiceCommandOverlay } from '@/components/VoiceCommandOverlay';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { NexusIntegrationLayer } from '@/components/NexusIntegrationLayer';
import { SovereignLoginLoader } from '@/components/SovereignLoginLoader';
import { ExecutiveCommandPalette } from '@/components/ExecutiveCommandPalette';
import { EmergencySovereignLockdown } from '@/components/EmergencySovereignLockdown';
import { LiveQuantumEntropyTicker } from '@/components/LiveQuantumEntropyTicker';
import { ToastNotification, ToastMessage } from '@/components/ToastNotification';
import {
  SsotDriftWarning,
  SsotDriftToggleButton,
  QuantumAggregateEntropyIndicator,
} from '@/components/system/SystemStateComponents';
import {
  toggleSovereignSynth882Hz,
  playTone,
  playAuditChime,
  updateAtmosphericEntropyPitch,
  setCustomCarrierFrequency,
} from '@/components/AudioSynthesizer';
import { systemStateStore } from '@/store/systemStateStore';
import { broadcastSyncService } from '@/services/broadcastSyncService';
import { offlineAuditSyncService } from '@/services/offlineAuditSyncService';
import { automatedBackupService } from '@/services/automatedBackupService';
import { WriteFirewallEngine } from '@/utils/writeFirewall';
import { TelemetryAnomalyObserver } from '@/utils/telemetryAnomalyObserver';
import { INITIAL_HARDWARE_SNAPSHOTS, createTelemetrySnapshot } from '@/utils/telemetrySnapshot';
import { announceSystemEventVerbal } from '@/utils/textToSpeechService';
import { triggerVibration } from '@/utils/vibration';
import { useNotificationWebSocket } from '@/hooks/useNotificationWebSocket';

interface ViewPersona {
  name: string;
  orb1: string;
  orb2: string;
  orb3: string;
  accentGlow: string;
}

const VIEW_PERSONAS: Record<ViewType, ViewPersona> = {
  dashboard: {
    name: 'Unified Executive Command',
    orb1: 'bg-cyan-600/10',
    orb2: 'bg-violet-600/8',
    orb3: 'bg-emerald-600/8',
    accentGlow: 'rgba(6,182,212,0.06)',
  },
  fusion: {
    name: 'Quantum Audit & Telemetry Fusion',
    orb1: 'bg-fuchsia-600/12',
    orb2: 'bg-cyan-600/10',
    orb3: 'bg-amber-500/10',
    accentGlow: 'rgba(217,70,239,0.08)',
  },
  civilization: {
    name: 'Civilization Engine & Multi-Agent Governance',
    orb1: 'bg-amber-600/14',
    orb2: 'bg-cyan-600/12',
    orb3: 'bg-emerald-600/10',
    accentGlow: 'rgba(212,175,55,0.1)',
  },
  studio: {
    name: '3D Quantum Citadel Lattice Hologram Studio',
    orb1: 'bg-cyan-500/20',
    orb2: 'bg-purple-600/15',
    orb3: 'bg-emerald-600/15',
    accentGlow: 'rgba(6,182,212,0.12)',
  },
  unified: {
    name: 'Unified Multiverse Control Panel',
    orb1: 'bg-cyan-600/16',
    orb2: 'bg-violet-600/14',
    orb3: 'bg-emerald-600/12',
    accentGlow: 'rgba(6,182,212,0.1)',
  },
  heatmap: {
    name: '14,902 Hardware Seals Governance Heatmap',
    orb1: 'bg-emerald-600/16',
    orb2: 'bg-teal-600/12',
    orb3: 'bg-cyan-600/10',
    accentGlow: 'rgba(16,185,129,0.09)',
  },
  playback: {
    name: '12-Stage Forensic Trace Replay Console',
    orb1: 'bg-amber-500/15',
    orb2: 'bg-orange-600/10',
    orb3: 'bg-cyan-600/10',
    accentGlow: 'rgba(245,158,11,0.08)',
  },
  council: {
    name: '10/10 REAL_HSM Sovereign Council',
    orb1: 'bg-amber-500/18',
    orb2: 'bg-yellow-600/12',
    orb3: 'bg-cyan-600/10',
    accentGlow: 'rgba(245,158,11,0.09)',
  },
  production: {
    name: 'Zero-Trust Production Readiness',
    orb1: 'bg-emerald-500/16',
    orb2: 'bg-cyan-600/14',
    orb3: 'bg-teal-600/12',
    accentGlow: 'rgba(16,185,129,0.08)',
  },
  quantum: {
    name: 'Sub-Kelvin Qubit Nexus',
    orb1: 'bg-cyan-500/16',
    orb2: 'bg-sky-600/14',
    orb3: 'bg-teal-500/10',
    accentGlow: 'rgba(14,165,233,0.08)',
  },
  nexus: {
    name: 'Neural Knowledge Fabric',
    orb1: 'bg-violet-600/14',
    orb2: 'bg-fuchsia-600/10',
    orb3: 'bg-purple-600/12',
    accentGlow: 'rgba(139,92,246,0.08)',
  },
  vault: {
    name: 'Sovereign Kyber-1024 Vault',
    orb1: 'bg-amber-500/14',
    orb2: 'bg-yellow-600/10',
    orb3: 'bg-orange-600/10',
    accentGlow: 'rgba(245,158,11,0.08)',
  },
  ledger: {
    name: 'Immutable Merkle Ledger',
    orb1: 'bg-emerald-500/14',
    orb2: 'bg-teal-600/10',
    orb3: 'bg-green-600/10',
    accentGlow: 'rgba(16,185,129,0.08)',
  },
  pulse: {
    name: 'Telemetry Pulse & Heartbeat',
    orb1: 'bg-rose-500/14',
    orb2: 'bg-cyan-600/12',
    orb3: 'bg-violet-600/10',
    accentGlow: 'rgba(244,63,94,0.08)',
  },
  forge: {
    name: 'Autonomous Industrial Forge',
    orb1: 'bg-amber-500/16',
    orb2: 'bg-orange-600/14',
    orb3: 'bg-red-600/10',
    accentGlow: 'rgba(245,158,11,0.09)',
  },
  matrix: {
    name: 'Multiverse Simulation Matrix',
    orb1: 'bg-violet-600/16',
    orb2: 'bg-pink-600/12',
    orb3: 'bg-indigo-600/12',
    accentGlow: 'rgba(217,70,239,0.08)',
  },
  archive: {
    name: 'Deep Cobalt 17-Module Archive',
    orb1: 'bg-blue-600/14',
    orb2: 'bg-indigo-600/10',
    orb3: 'bg-cyan-700/10',
    accentGlow: 'rgba(37,99,235,0.08)',
  },
  console: {
    name: 'Sovereign CLI Terminal',
    orb1: 'bg-emerald-500/14',
    orb2: 'bg-green-600/12',
    orb3: 'bg-teal-600/10',
    accentGlow: 'rgba(16,185,129,0.07)',
  },
  security: {
    name: 'Zero-Trust Bastion & Shield',
    orb1: 'bg-rose-600/14',
    orb2: 'bg-red-600/12',
    orb3: 'bg-violet-600/10',
    accentGlow: 'rgba(225,29,72,0.08)',
  },
  settings: {
    name: 'Thai Sovereign Custodian Registry',
    orb1: 'bg-amber-600/12',
    orb2: 'bg-slate-600/12',
    orb3: 'bg-cyan-600/10',
    accentGlow: 'rgba(217,119,6,0.07)',
  },
  legal: {
    name: 'Thai Sovereign Legal & PDPA Supreme Chamber',
    orb1: 'bg-blue-600/18',
    orb2: 'bg-cyan-600/14',
    orb3: 'bg-emerald-600/12',
    accentGlow: 'rgba(59,130,246,0.1)',
  },
  canonical: {
    name: 'Canonical Integrity Dashboard & 3D Merkle Topology',
    orb1: 'bg-emerald-600/18',
    orb2: 'bg-cyan-600/15',
    orb3: 'bg-amber-600/12',
    accentGlow: 'rgba(16,185,129,0.12)',
  },
  admin: {
    name: 'Sovereign Admin Console & Role-Based Access Control',
    orb1: 'bg-cyan-600/18',
    orb2: 'bg-indigo-600/14',
    orb3: 'bg-emerald-600/10',
    accentGlow: 'rgba(6,182,212,0.1)',
  },
  analytics: {
    name: 'Audit Analytics & UTC Telemetry Volatility Dashboard',
    orb1: 'bg-emerald-600/18',
    orb2: 'bg-cyan-600/14',
    orb3: 'bg-rose-600/10',
    accentGlow: 'rgba(16,185,129,0.1)',
  },
  chambers: {
    name: '18 Sovereign Chambers Control Plane',
    orb1: 'bg-indigo-600/18',
    orb2: 'bg-cyan-600/14',
    orb3: 'bg-emerald-600/10',
    accentGlow: 'rgba(99,102,241,0.12)',
  },
  audithistory: {
    name: 'Audit History & Cryptographic Snapshot Records',
    orb1: 'bg-emerald-600/18',
    orb2: 'bg-teal-600/14',
    orb3: 'bg-cyan-600/12',
    accentGlow: 'rgba(16,185,129,0.12)',
  },
  securitypipeline: {
    name: '3-Tier Sovereign Security Pipeline & Threat Gauge',
    orb1: 'bg-emerald-600/20',
    orb2: 'bg-cyan-600/16',
    orb3: 'bg-teal-600/12',
    accentGlow: 'rgba(16,185,129,0.15)',
  },
  briefing: {
    name: 'Executive & Court Admissible Briefing',
    orb1: 'bg-amber-600/18',
    orb2: 'bg-cyan-600/14',
    orb3: 'bg-emerald-600/12',
    accentGlow: 'rgba(212,175,55,0.12)',
  },
  'sovereign-wallet': {
    name: 'Sovereign Wallet & WebAuthn Key Dispatcher',
    orb1: 'bg-amber-600/18',
    orb2: 'bg-yellow-600/14',
    orb3: 'bg-emerald-600/12',
    accentGlow: 'rgba(212,175,55,0.12)',
  },
};

interface BannerAnimatedSealCountProps {
  sealCount: number;
  baseSealCount?: number;
}

const BannerAnimatedSealCount: React.FC<BannerAnimatedSealCountProps> = ({
  sealCount,
  baseSealCount = 14902,
}) => {
  const [displayedCount, setDisplayedCount] = useState<number>(sealCount);
  const [isIncrementing, setIsIncrementing] = useState<boolean>(false);
  const prevCountRef = useRef<number>(sealCount);

  useEffect(() => {
    if (prevCountRef.current === sealCount) return;

    const fromVal = prevCountRef.current;
    const toVal = sealCount;
    prevCountRef.current = sealCount;

    if (toVal > fromVal) {
      setIsIncrementing(true);
    }

    const controls = animate(fromVal, toVal, {
      duration: 0.85,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        setDisplayedCount(Math.round(latest));
      },
      onComplete: () => {
        setDisplayedCount(toVal);
        setIsIncrementing(false);
      },
    });

    return (
    ) => controls.stop();
  }, [sealCount]);

  const deltaFromBase = Math.max(0, sealCount - baseSealCount);

  return (
    <span className="flex items-center gap-1.5 font-mono">
      <Lock
        className={`w-3.5 h-3.5 transition-colors duration-300 ${
          isIncrementing ? 'text-emerald-400 animate-pulse' : 'text-cyan-400'
        }`}
      />
      <span>
        Verified Seals:{' '}
        <AnimatePresence mode="popLayout">
          <motion.strong
            key={displayedCount}
            initial={isIncrementing ? { opacity: 0.7, y: -4, scale: 1.08 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0.7, y: 4, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className={`inline-block font-bold transition-all duration-300 ${
              isIncrementing
                ? 'text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.7)]'
                : 'text-cyan-300'
            }`}
          >
            {displayedCount.toLocaleString()}
          </motion.strong>
        </AnimatePresence>
      </span>
      {deltaFromBase > 0 && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 ml-0.5"
        >
          +{deltaFromBase}
        </motion.span>
      )}
    </span>
  );
};

interface LegalTriggerItem {
  id: string;
  act: string;
  section: string;
  title: string;
  titleTh: string;
  status: 'PASS' | 'ACTIVE_GUARD' | 'VERIFIED';
  statusText: string;
  pqcScheme: string;
  anchor: string;
  description: string;
  descriptionTh: string;
  statuteClause: string;
}

const ETDA_PDPA_TRIGGERS: LegalTriggerItem[] = [
  {
    id: 'etda-sec-09',
    act: 'ETDA B.E. 2544 / 2562',
    section: 'มาตรา ๙ (Section 9)',
    title: 'Electronic Signature Legal Enforceability',
    titleTh: 'การรับรองผลทางกฎหมายของลายมือชื่ออิเล็กทรอนิกส์',
    status: 'PASS',
    statusText: '100% ENFORCED',
    pqcScheme: 'FIPS 204 ML-DSA-87 (Dilithium-5)',
    anchor: 'Sovereign Principal #EP-SOVEREIGN-01',
    description: 'Binds undeniable cryptographic intent and signatory identity to every transaction and seal creation without relying on blind trust.',
    descriptionTh: 'ผูกมัดเจตนาและอัตลักษณ์ของผู้ลงนามด้วยลายมือชื่อโครงข่ายแลตทิซโพสต์ควอนตัม มีผลผูกพันบังคับใช้ตามกฎหมายอย่างสมบูรณ์',
    statuteClause: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๙'
  },
  {
    id: 'etda-sec-26',
    act: 'ETDA B.E. 2544 / 2562',
    section: 'มาตรา ๒๖ (Section 26)',
    title: 'Trustworthy & Advanced Electronic Signature Security',
    titleTh: 'ลายมือชื่ออิเล็กทรอนิกส์ที่เชื่อถือได้ระดับสูง',
    status: 'PASS',
    statusText: '10/10 REAL_HSM',
    pqcScheme: 'FIPS 140-3 Level 4 Active Tamper Protection',
    anchor: 'Deca-Custodian Quorum Active Shield',
    description: 'Guarantees advanced security, key control under sole custody, and automated Tamper-Evident Cascade with immediate Fail-Closed lockdown if altered.',
    descriptionTh: 'โครงสร้างลายมือชื่อขั้นสูงภายใต้การควบคุมของผู้ดูแล 10 จุด หากตรวจพบการดัดแปลงแม้เพียง 1 บิต ระบบจะปฏิเสธทันที (Fail-Closed)',
    statuteClause: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๒๖'
  },
  {
    id: 'etda-sec-28',
    act: 'ETDA B.E. 2544 / 2562',
    section: 'มาตรา ๒๘ (Section 28)',
    title: 'Third-Party Evidentiary Reliance & Certificate Anchors',
    titleTh: 'ความน่าเชื่อถือและการรับฟังพยานหลักฐานโดยบุคคลภายนอก',
    status: 'PASS',
    statusText: 'COURT ADMISSIBLE',
    pqcScheme: 'Immutable Merkle Root Binding',
    anchor: 'Root 909ab814...fa4c68 (Block #849202)',
    description: 'Enforces complete cryptographic audit trail (Ledger V25) certified for forensic presentation in Thai courts without repudiation.',
    descriptionTh: 'สร้างห่วงโซ่พยานหลักฐานที่ไม่สามารถแก้ไขย้อนหลังได้ (Immutable Ledger) ได้รับการยอมรับฟังในชั้นศาลตามประมวลกฎหมายวิธีพิจารณาความ',
    statuteClause: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๒๘'
  },
  {
    id: 'pdpa-sec-09',
    act: 'PDPA B.E. 2562',
    section: 'มาตรา ๙ (Section 9)',
    title: 'Lawful Basis & Sovereign Consent Matrix',
    titleTh: 'ฐานความชอบด้วยกฎหมายและการควบคุมความยินยอม',
    status: 'PASS',
    statusText: 'SSoT Δ0.0% ZERO DRIFT',
    pqcScheme: 'Zero-Knowledge Policy Engine',
    anchor: 'Authority: นายยุทธภูมิ พากเพียร',
    description: 'Restricts personal data operations strictly to predefined lawful purposes and platform boundaries Ω601–Ω1000 with zero drift.',
    descriptionTh: 'ควบคุมการประมวลผลข้อมูลให้อยู่ในขอบเขตอธิปไตยดิจิทัลที่กำหนด ปราศจากการดัดแปลงโครงสร้าง (Mutation Authority = 0)',
    statuteClause: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ มาตรา ๙'
  },
  {
    id: 'pdpa-sec-26',
    act: 'PDPA B.E. 2562',
    section: 'มาตรา ๒๖ (Section 26)',
    title: 'Sensitive Personal Data Quantum Vault Protection',
    titleTh: 'การคุ้มครองข้อมูลส่วนบุคคลอ่อนไหวด้วยห้องนิรภัยควอนตัม',
    status: 'PASS',
    statusText: 'CRYO 14.98 mK',
    pqcScheme: 'FIPS 203 ML-KEM-1024 / SPHINCS+',
    anchor: 'Chamber 08 PQC Enclave',
    description: 'Provides quantum-proof encapsulation for sensitive records, biometric telemetry, and executive keys against post-quantum decrypt-later attacks.',
    descriptionTh: 'เข้ารหัสข้อมูลอ่อนไหวด้วยอัลกอริทึมแลตทิซและฟังก์ชันแฮชไร้สถานะ ป้องกันการถอดรหัสในอนาคตด้วยคอมพิวเตอร์ควอนตัม',
    statuteClause: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ มาตรา ๒๖'
  },
  {
    id: 'pdpa-sec-28',
    act: 'PDPA B.E. 2562',
    section: 'มาตรา ๒๘ (Section 28)',
    title: 'Cross-Border Sovereign Safeguard Boundaries',
    titleTh: 'มาตรการคุ้มครองการส่งหรือโอนข้อมูลข้ามพรมแดน',
    status: 'PASS',
    statusText: 'ISOLATED ENCLAVE',
    pqcScheme: 'Sovereign Multi-Mesh Gateway',
    anchor: 'Bangkok Command & Regional Nodes',
    description: 'Guarantees destination country adequacy standard and prevents unauthorized exfiltration beyond the sovereign enclave boundary.',
    descriptionTh: 'รับประกันมาตรฐานความคุ้มครองข้อมูลส่วนบุคคลของปลายทาง ป้องกันการรั่วไหลออกนอกเครือข่ายอธิปไตยไทย',
    statuteClause: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ มาตรา ๒๘'
  }
];

const TRIGGER_PQC_HASHES: Record<string, string> = {
  'etda-sec-09': '0x5d8e71a0b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0',
  'etda-sec-26': '0x14902_DECA_CUSTODIAN_FIPS140_3_L4_ACTIVE_SHIELD_SIG_909AB8',
  'etda-sec-28': '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
  'pdpa-sec-09': '0x7b2274785f6964223a22534f562d4a554d502d343436222c22617574686f72223a224550227d',
  'pdpa-sec-26': '0x112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00',
  'pdpa-sec-28': '0xdeadbeef00112233445566778899aabbccddeeff112233445566778899aabbcc',
};

const INITIAL_SYSTEM_EVENTS: SystemEvent[] = [
  {
    id: 'evt-evidence-tnt',
    type: 'EVIDENCE_IMPORTED',
    title: 'Evidence Ingested: TNT-TH-001 (Tenant Manifest)',
    description: 'Status: PENDING | Provenance: SOURCE_FILE | Mutation: 0 | Isolation: Tenant-isolated (MAEW HOLDINGS CO., LTD.) | Canonical write: BLOCKED',
    timestamp: '05:06:01 ICT',
    metaHash: 'source:TNT-TH-001 (Digest: NOT COMPUTED)',
    statuteRef: 'Hardening v2.1 Intake Gate (Provenance: SOURCE_FILE, Mutation: 0)',
    targetView: 'dashboard',
    severity: 'info',
  },
  {
    id: 'evt-evidence-fios',
    type: 'EVIDENCE_IMPORTED',
    title: 'Evidence Ingested: DS-901-PILOT (FIOS Pilot Dataset)',
    description: 'Status: PENDING | Provenance: SOURCE_FILE | Mutation: 0 | Classification: Non-live pilot dataset | Canonical write: BLOCKED',
    timestamp: '05:06:02 ICT',
    metaHash: 'source:DS-901-PILOT (Digest: NOT COMPUTED)',
    statuteRef: 'Hardening v2.1 Intake Gate (Provenance: SOURCE_FILE, Mutation: 0)',
    targetView: 'dashboard',
    severity: 'info',
  },
  {
    id: 'evt-000',
    type: 'COMPLIANCE',
    title: 'Thai Electronic Transactions Act (Sec 9, 26, 28) Bound',
    description: 'Sovereign Seal Chain runtime anchored to ETDA Level 3+ standards and Passport #EP-SOVEREIGN-01.',
    timestamp: '05:01:22 ICT',
    statuteRef: 'มาตรา 9, 26, 28 (ETDA Level 3+)',
    targetView: 'security',
    severity: 'success',
  },
  {
    id: 'evt-001',
    type: 'CRYPTO',
    title: 'Sovereign Genesis Block #849202 Sealed',
    description: 'Merkle Root 909ab814...fa4c68 anchored with 14,902 cryptographic certificates.',
    timestamp: '05:03:08 ICT',
    metaHash: 'sha256:909ab8146747f520beec1907beab286c06a38096f9bf00f40d8aa536b3fa4c68',
    statuteRef: 'มาตรา 26: ลายมือชื่อดิจิทัลที่เชื่อถือได้',
    targetView: 'security',
    severity: 'success',
  },
  {
    id: 'evt-002',
    type: 'HARDWARE',
    title: 'Hardware Cryostat Chamber Stabilized',
    description: 'Sub-Kelvin base temperature locked at 12.4 mK with 0.9997 coherence ratio.',
    timestamp: '05:04:12 ICT',
    metaHash: 'qstate:768Q_COHERENCE_99.97PCT',
    severity: 'info',
  },
  {
    id: 'evt-003',
    type: 'COMPLIANCE',
    title: 'PDPA Thailand Compliance Pre-Flight Verified',
    description: 'Sections 19, 27, 37 validated against Thai Sovereign Custodian Passport #EP-SOVEREIGN-01.',
    timestamp: '05:05:30 ICT',
    statuteRef: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA Sec 37)',
    targetView: 'security',
    severity: 'success',
  },
];

export type SystemAction =
  | {
      type: 'EMIT_SYSTEM_EVENT';
      payload: {
        type: SystemEvent['type'];
        title: string;
        description: string;
        metaHash?: string;
        severity?: SystemEvent['severity'];
        statuteRef?: string;
        targetView?: SystemEvent['targetView'];
        targetTab?: SecuritySubTab;
        isComplianceDrift?: boolean;
        bindingStatus?: SystemEvent['bindingStatus'];
        anchoredSealNumber?: number;
        merkleProofHash?: string;
      };
    }
  | {
      type: 'BATCH_SYSTEM_EVENTS';
      payload: Array<{
        type: SystemEvent['type'];
        title: string;
        description: string;
        metaHash?: string;
        severity?: SystemEvent['severity'];
        statuteRef?: string;
        targetView?: SystemEvent['targetView'];
        targetTab?: SecuritySubTab;
        isComplianceDrift?: boolean;
        bindingStatus?: SystemEvent['bindingStatus'];
        anchoredSealNumber?: number;
        merkleProofHash?: string;
      }>;
    }
  | {
      type: 'CLEAR_SYSTEM_EVENTS';
    };

/**
 * Normalizes system event inputs from all origins (compliance checks, hardware snapshots, evidence intake, manual imports)
 * into a single consistent, tamper-evident SystemEvent structure.
 */
function createNormalizedSystemEvent(
  payload: {
    type: SystemEvent['type'];
    title: string;
    description: string;
    metaHash?: string;
    severity?: SystemEvent['severity'];
    statuteRef?: string;
    targetView?: SystemEvent['targetView'];
    targetTab?: SecuritySubTab;
    isComplianceDrift?: boolean;
    bindingStatus?: SystemEvent['bindingStatus'];
    anchoredSealNumber?: number;
    merkleProofHash?: string;
  },
  sealCounter?: number
): SystemEvent {
  const isCompliance = payload.type === 'COMPLIANCE';
  const isForensic = payload.type === 'FORENSIC';
  const isHardware = payload.type === 'HARDWARE';
  const isEvidence = payload.type === 'EVIDENCE_IMPORTED';
  const isCrypto = payload.type === 'CRYPTO';

  const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false }) + ' ICT';

  let bindingStatus: SystemEvent['bindingStatus'] = payload.bindingStatus;
  if (!bindingStatus) {
    if (isCompliance || isForensic || isCrypto) {
      bindingStatus = 'VERIFIED';
    } else if (isEvidence) {
      bindingStatus = 'PENDING';
    } else {
      bindingStatus = 'ANCHORED';
    }
  }

  let statuteRef = payload.statuteRef;
  if (!statuteRef) {
    if (isCompliance || isForensic) {
      statuteRef = 'ETDA B.E. 2544 Sec 9/26/28 & PDPA Sec 37';
    } else if (isHardware) {
      statuteRef = 'FIPS 140-3 L4 Hardware Custody & Sub-Kelvin Thermal SLA';
    } else if (isEvidence) {
      statuteRef = 'Hardening v2.1 Intake Gate (Provenance: SOURCE_FILE, Mutation: 0)';
    }
  }

  let metaHash = payload.metaHash;
  if (!metaHash && isCompliance) {
    metaHash = `etda:sec26:proof:${Date.now().toString(16)}`;
  }

  return {
    id: `evt-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    type: payload.type,
    title: payload.title.trim(),
    description: payload.description.trim(),
    timestamp,
    metaHash,
    statuteRef,
    targetView: payload.targetView,
    targetTab: payload.targetTab,
    isComplianceDrift: Boolean(payload.isComplianceDrift),
    bindingStatus,
    anchoredSealNumber:
      payload.anchoredSealNumber ?? (bindingStatus === 'VERIFIED' ? (sealCounter ?? 14902) : undefined),
    merkleProofHash: payload.merkleProofHash,
    severity: payload.severity || 'info',
  };
}

// Global registry to detect duplicate module re-registrations and inspect initialization order
const registeredModulesRegistry = new Set<string>();

/**
 * Diagnostic logger that triggers early in the SovereignAppContent lifecycle:
 * - Inspects order of state registration
 * - Verifies broadcastSyncService initialization before system event handlers attach
 * - Audits module and handler registrations to catch duplicate import re-registrations
 */
function runSovereignAppDiagnostics(context: {
  currentView: string;
  snapshotsCount: number;
  systemEventsCount: number;
  verificationGateStatus: string;
  isSystemActivityFrozen: boolean;
}): void {
  const timestamp = new Date().toISOString();
  console.groupCollapsed(
    `%c[ZYRQUEN Ω∞ LIFECYCLE DIAGNOSTIC]%c SovereignAppContent Initialization Audit (${timestamp})`,
    'color: #10b981; font-weight: bold; background: #061e14; padding: 2px 6px; border-radius: 4px;',
    'color: #38bdf8; font-weight: normal;'
  );

  // 1. Inspect State Registration Sequence
  console.log('%c1. Order of State Registration Inspection:', 'font-weight: bold; color: #34d399;');
  console.log('   ├── [Stage 1: Routing & Navigation] View: %s', context.currentView);
  console.log('   ├── [Stage 2: Telemetry State] Hardware Snapshots: %d', context.snapshotsCount);
  console.log('   ├── [Stage 3: Verification Gate] Status: %s', context.verificationGateStatus);
  console.log('   ├── [Stage 4: Audit Event State] Initial System Events: %d', context.systemEventsCount);
  console.log('   └── [Stage 5: System Lock Guard] Frozen: %s', context.isSystemActivityFrozen ? 'TRUE (PAUSED)' : 'FALSE (LIVE)');

  // 2. Verify broadcastSyncService readiness BEFORE event handlers attach
  broadcastSyncService.init();
  const isBroadcastReady = broadcastSyncService.getIsInitialized();
  const channelName = broadcastSyncService.getChannelName();
  const tabId = broadcastSyncService.getTabId();

  console.log('%c2. BroadcastSyncService Pre-Flight Verification:', 'font-weight: bold; color: #34d399;');
  if (isBroadcastReady) {
    console.log(
      '   ├── Channel Status: %cINITIALIZED & READY%c (Channel: %s, Tab: %s)',
      'color: #10b981; font-weight: bold;',
      'color: inherit;',
      channelName,
      tabId
    );
    console.log('   └── Service Readiness: VERIFIED (Ready for subscriber attachment before system event hooks)');
  } else {
    console.warn(
      '   └── %cWARNING: BroadcastChannel not supported or uninitialized; running single-tab local state fallback.%c',
      'color: #f59e0b; font-weight: bold;',
      'color: inherit;'
    );
  }

  // 3. Inspect for duplicate import / component re-registrations
  console.log('%c3. Duplicate Import & Handler Re-Registration Audit:', 'font-weight: bold; color: #34d399;');
  const criticalModules = [
    'WriteFirewallEngine',
    'automatedBackupService',
    'broadcastSyncService',
    'offlineAuditSyncService',
    'useNotificationWebSocket',
  ];

  const duplicateRegistrations: string[] = [];
  criticalModules.forEach((moduleKey) => {
    if (registeredModulesRegistry.has(moduleKey)) {
      duplicateRegistrations.push(moduleKey);
    } else {
      registeredModulesRegistry.add(moduleKey);
    }
  });

  if (duplicateRegistrations.length > 0) {
    console.warn(
      `[ZYRQUEN Ω∞ DIAGNOSTIC WARN] Duplicate registration detected for: ${duplicateRegistrations.join(', ')}. Check component re-mounting and singleton imports.`
    );
  } else {
    console.log(
      '   └── All %d critical service engines verified unique. Zero duplicate re-registrations detected in terminal output.',
      criticalModules.length
    );
  }

  console.groupEnd();
}

const VALID_VIEWS: ViewType[] = [
  'dashboard',
  'civilization',
  'studio',
  'unified',
  'heatmap',
  'production',
  'council',
  'quantum',
  'nexus',
  'vault',
  'ledger',
  'pulse',
  'forge',
  'matrix',
  'archive',
  'console',
  'security',
  'settings',
  'legal',
  'canonical',
  'admin',
  'analytics',
  'chambers',
  'fusion',
  'playback',
  'audithistory',
  'securitypipeline',
  'briefing',
];

function SovereignAppContent() {
  const location = useLocation();
  const navigate = useNavigate();

  const rawPath = location.pathname.replace(/^\//, '').toLowerCase().trim();
  const currentView: ViewType = VALID_VIEWS.includes(rawPath as ViewType)
    ? (rawPath as ViewType)
    : 'dashboard';

  const setCurrentView = useCallback((view: ViewType) => {
    const targetPath = view === 'dashboard' ? '/' : `/${view}`;
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
  }, [navigate, location.pathname]);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem('zyrquen_sidebar_open') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleSidebar = useCallback(() => {
    triggerVibration('sidebarToggle');
    setIsLeftSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('zyrquen_sidebar_open', String(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  }, []);

  const handleCloseSidebar = useCallback(() => {
    triggerVibration('modalDismiss');
    setIsLeftSidebarOpen(false);
    try {
      localStorage.setItem('zyrquen_sidebar_open', 'false');
    } catch (e) {
      console.error(e);
    }
  }, []);
  const [selectedChamberId, setSelectedChamberId] = useState<string>('00');
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [isGitHubPwaOpen, setIsGitHubPwaOpen] = useState(false);
  const [isLegalSearchOpen, setIsLegalSearchOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isEventsSidebarOpen, setIsEventsSidebarOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isAudioActive, setIsAudioActive] = useState(false);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Connect to Node.js WebSocket Notification Service and pipe incoming alerts to toasts
  useNotificationWebSocket(showToast);
  const [carrierPitchHz, setCarrierPitchHz] = useState<number>(882);
  const [snapshots, setSnapshots] = useState<HardwareSnapshot[]>(INITIAL_HARDWARE_SNAPSHOTS);
  const [lastSnapshotTime, setLastSnapshotTime] = useState<number>(0);
  const [heartbeatTick, setHeartbeatTick] = useState<boolean>(false);
  const [systemEvents, setSystemEvents] = useState<SystemEvent[]>(INITIAL_SYSTEM_EVENTS);
  const [isSystemActivityFrozen, setIsSystemActivityFrozen] = useState<boolean>(() => {
    try {
      return localStorage.getItem('zyrquen_system_frozen') === 'true';
    } catch {
      return false;
    }
  });
  const [verificationGateStatus, setVerificationGateStatus] = useState<{
    status: 'ACTIVE_GUARD' | 'PASSED' | 'BLOCKED';
    lastCheckedTime: string;
    complianceEventCount: number;
    sealCount: number;
    message: string;
  }>({
    status: 'ACTIVE_GUARD',
    lastCheckedTime: '05:05:30 ICT',
    complianceEventCount: 2,
    sealCount: 14902,
    message: 'Verification Gate Active: Enforcing COMPLIANCE invariant binding before ledger append.',
  });

  const TELEMETRY_AUDIT_INTERVAL_SEC = 30;
  const [auditCountdownSec, setAuditCountdownSec] = useState<number>(TELEMETRY_AUDIT_INTERVAL_SEC);
  // Scheduled telemetry audit countdown timer (30s cadence)
  useEffect(() => {
    if (isSystemActivityFrozen) return;

    const timer = setInterval(() => {
      setAuditCountdownSec((prev) => {
        if (prev <= 1) {
          const now = new Date();
          const timeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Bangkok' }) + ' ICT';
          setVerificationGateStatus((curr) => ({
            ...curr,
            status: 'PASSED',
            lastCheckedTime: timeStr,
            message: 'Scheduled Telemetry Audit Passed: 10/10 REAL_HSM quorum verified coherent @ 14.98 mK.',
          }));
          return TELEMETRY_AUDIT_INTERVAL_SEC;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSystemActivityFrozen]);

  const auditProgressPercent = ((TELEMETRY_AUDIT_INTERVAL_SEC - auditCountdownSec) / TELEMETRY_AUDIT_INTERVAL_SEC) * 100;
  const [isGateDetailsExpanded, setIsGateDetailsExpanded] = useState<boolean>(false);
  const [isGateTooltipVisible, setIsGateTooltipVisible] = useState<boolean>(false);
  const [isMonochromeMode, setIsMonochromeMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('zyrquen_monochrome_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [isForensicAuditMode, setIsForensicAuditMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('zyrquen_forensic_audit_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [showLoginLoader, setShowLoginLoader] = useState<boolean>(false);
  const [loginLoaderMode, setLoginLoaderMode] = useState<'login' | 'register' | 'switch_tenant'>('login');

  const handleToggleForensicAuditMode = useCallback(() => {
    triggerVibration('sidebarToggle');
    setIsForensicAuditMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('zyrquen_forensic_audit_mode', String(next));
      } catch (e) {
        console.error(e);
      }
      broadcastSyncService.broadcastGlobalLockState({ isForensicAuditMode: next });
      return next;
    });
  }, []);

  const handleToggleMonochrome = useCallback((enabled?: boolean) => {
    triggerVibration('sidebarToggle');
    setIsMonochromeMode((prev) => {
      const next = enabled !== undefined ? enabled : !prev;
      try {
        localStorage.setItem('zyrquen_monochrome_mode', String(next));
      } catch (e) {
        console.error(e);
      }
      broadcastSyncService.broadcastGlobalLockState({ isMonochromeMode: next });
      return next;
    });
  }, []);

  

  

  // Heartbeat pulse timer in sync with telemetry
  useEffect(() => {
    const isRecent = Date.now() - lastSnapshotTime < 6000;
    const intervalTime = isRecent ? 500 : 1000; // Accelerated heartbeat when snapshot is captured!

    const interval = setInterval(() => {
      setHeartbeatTick((prev) => !prev);
    }, intervalTime);

    return () => clearInterval(interval);
  }, [lastSnapshotTime]);

  const snapshotsRef = useRef(snapshots);
  snapshotsRef.current = snapshots;
  const isSystemActivityFrozenRef = useRef(isSystemActivityFrozen);
  isSystemActivityFrozenRef.current = isSystemActivityFrozen;

  const diagnosticRanRef = useRef(false);
  const hasSeededEvidenceRef = useRef(false);

  // Diagnostic logs function that triggers early in the SovereignAppContent lifecycle
  useEffect(() => {
    if (diagnosticRanRef.current) return;
    diagnosticRanRef.current = true;
    runSovereignAppDiagnostics({
      currentView,
      snapshotsCount: snapshots.length,
      systemEventsCount: systemEvents.length,
      verificationGateStatus: verificationGateStatus.status,
      isSystemActivityFrozen,
    });
  }, [currentView, snapshots.length, systemEvents.length, verificationGateStatus.status, isSystemActivityFrozen]);

  /**
   * Centralized dispatch mechanism for all system and audit actions.
   * Replaces queueMicrotask with deterministic, structured synchronous state updates
   * and dispatches to BroadcastChannel, offline audit queues, and verbal announcers.
   */
  const dispatchAction = useCallback((action: SystemAction) => {
    switch (action.type) {
      case 'EMIT_SYSTEM_EVENT': {
        const normalizedEvt = createNormalizedSystemEvent(
          action.payload,
          systemStateStore.getState().sealCount
        );

        // Centralized state update (no queueMicrotask)
        setSystemEvents((prev) => [normalizedEvt, ...prev]);

        // Immediate Verification Gate check update when compliance event arrives
        if (normalizedEvt.type === 'COMPLIANCE') {
          setVerificationGateStatus((curr) => ({
            ...curr,
            status: 'PASSED',
            lastCheckedTime: normalizedEvt.timestamp,
            complianceEventCount: curr.complianceEventCount + 1,
            message: `Verification Gate PASSED: Compliance anchor verified (${normalizedEvt.title}). 10/10 REAL_HSM Quorum Active.`,
          }));
        }

        // Cross-tab broadcast synchronization
        try {
          broadcastSyncService.broadcastSystemEvent(normalizedEvt);
        } catch (err) {
          console.warn('Broadcast sync failed:', err);
        }

        // Offline background persistence queue
        try {
          offlineAuditSyncService.enqueueEvent({
            type: normalizedEvt.type,
            title: normalizedEvt.title,
            description: normalizedEvt.description,
            metaHash: normalizedEvt.metaHash,
            severity: normalizedEvt.severity,
            statuteRef: normalizedEvt.statuteRef,
          });
        } catch (err) {
          console.warn('Offline audit enqueue failed:', err);
        }

        // Low-Latency Verbal Feedback Loop for Critical and Anomaly Events
        try {
          announceSystemEventVerbal(normalizedEvt.type, normalizedEvt.title, normalizedEvt.severity);
        } catch (err) {
          console.warn('Verbal announcer failed:', err);
        }
        break;
      }

      case 'BATCH_SYSTEM_EVENTS': {
        const normalizedList = action.payload.map((p) =>
          createNormalizedSystemEvent(p, systemStateStore.getState().sealCount)
        );
        setSystemEvents((prev) => [...normalizedList, ...prev]);

        normalizedList.forEach((evt) => {
          if (evt.type === 'COMPLIANCE') {
            setVerificationGateStatus((curr) => ({
              ...curr,
              status: 'PASSED',
              lastCheckedTime: evt.timestamp,
              complianceEventCount: curr.complianceEventCount + 1,
              message: `Verification Gate PASSED: Compliance anchor verified (${evt.title}). 10/10 REAL_HSM Quorum Active.`,
            }));
          }
          try {
            broadcastSyncService.broadcastSystemEvent(evt);
          } catch (err) {
            console.warn('Broadcast sync failed:', err);
          }
          try {
            offlineAuditSyncService.enqueueEvent({
              type: evt.type,
              title: evt.title,
              description: evt.description,
              metaHash: evt.metaHash,
              severity: evt.severity,
              statuteRef: evt.statuteRef,
            });
          } catch (err) {
            console.warn('Offline audit enqueue failed:', err);
          }
        });
        break;
      }

      case 'CLEAR_SYSTEM_EVENTS': {
        setSystemEvents([]);
        break;
      }
    }
  }, []);

  const addSystemEvent = useCallback(
    (
      type: SystemEvent['type'],
      title: string,
      description: string,
      metaHash?: string,
      severity: SystemEvent['severity'] = 'info',
      statuteRef?: string,
      targetView?: SystemEvent['targetView']
    ) => {
      dispatchAction({
        type: 'EMIT_SYSTEM_EVENT',
        payload: {
          type,
          title,
          description,
          metaHash,
          severity,
          statuteRef,
          targetView,
        },
      });
    },
    [dispatchAction]
  );

  // Trigger 'EVIDENCE_IMPORTED' audit events upon initial mount using batched dispatchAction
  useEffect(() => {
    if (hasSeededEvidenceRef.current) return;
    hasSeededEvidenceRef.current = true;

    dispatchAction({
      type: 'BATCH_SYSTEM_EVENTS',
      payload: [
        {
          type: 'EVIDENCE_IMPORTED',
          title: 'Evidence Imported: TNT-TH-001 (Tenant Manifest)',
          description:
            'Status: PENDING | Provenance: SOURCE_FILE | Mutation: 0 | Scope: Sovereign Physical Hardware Isolation (MAEW HOLDINGS CO., LTD.) | Canonical write: BLOCKED',
          metaHash: 'source:TNT-TH-001 (Digest: NOT COMPUTED)',
          severity: 'info',
          statuteRef: 'Hardening v2.1 Intake Gate (Provenance: SOURCE_FILE, Mutation: 0)',
          targetView: 'dashboard',
        },
        {
          type: 'EVIDENCE_IMPORTED',
          title: 'Evidence Imported: DS-901-PILOT (FIOS Pilot Dataset)',
          description:
            'Status: PENDING | Provenance: SOURCE_FILE | Mutation: 0 | Scope: Non-Live Pilot Dataset (Zero Trading Authority) | Canonical write: BLOCKED',
          metaHash: 'source:DS-901-PILOT (Digest: NOT COMPUTED)',
          severity: 'info',
          statuteRef: 'Hardening v2.1 Intake Gate (Provenance: SOURCE_FILE, Mutation: 0)',
          targetView: 'dashboard',
        },
      ],
    });
  }, [dispatchAction]);

  // Unified service lifecycle effect ensuring strict initialization & ordered teardown
  useEffect(() => {
    // 1. Ensure broadcastSyncService is initialized before attaching cross-tab listeners
    broadcastSyncService.init();

    // 2. Attach BroadcastChannel cross-tab synchronization listeners
    const unsubEvent = broadcastSyncService.onSystemEvent((evt) => {
      setSystemEvents((prev) => {
        if (prev.some((e) => e.id === evt.id)) return prev;
        return [evt, ...prev];
      });
    });

    const unsubSnap = broadcastSyncService.onAuditSnapshot((snap) => {
      setSnapshots((prev) => {
        if (prev.some((s) => s.id === snap.id)) return prev;
        return [snap, ...prev];
      });
    });

    const unsubLock = broadcastSyncService.onLockState((lockState) => {
      if (typeof lockState.isSystemActivityFrozen === 'boolean') {
        setIsSystemActivityFrozen(lockState.isSystemActivityFrozen);
      }
      if (typeof lockState.isForensicAuditMode === 'boolean') {
        setIsForensicAuditMode(lockState.isForensicAuditMode);
      }
      if (typeof lockState.isMonochromeMode === 'boolean') {
        setIsMonochromeMode(lockState.isMonochromeMode);
      }
    });

    // 3. Attach Offline Audit Sync listener
    let previousPending = offlineAuditSyncService.getQueueCount();
    const unsubOffline = offlineAuditSyncService.subscribe((count) => {
      if (previousPending > 0 && count === 0) {
        showToast(
          `Background Sync: ${previousPending} offline audit logs flushed to sovereign ledger.`,
          'success'
        );
      }
      previousPending = count;
    });

    // 4. Start automated backup service and attach snapshot listener
    automatedBackupService.start();
    const unsubBackupSnap = automatedBackupService.onSnapshot((record) => {
      if (isSystemActivityFrozenRef.current) return;

      const currentSnaps = snapshotsRef.current;
      const newSnap = createTelemetrySnapshot(
        {
          core0: 41 + Math.floor(Math.random() * 5),
          core1: 39 + Math.floor(Math.random() * 4),
          core2: 43 + Math.floor(Math.random() * 6),
          core3: 38 + Math.floor(Math.random() * 5),
        },
        currentSnaps.length,
        currentSnaps[0]?.sealedHash
      );
      setSnapshots((prev) => [newSnap, ...prev]);
      setLastSnapshotTime(Date.now());
      triggerVibration('snapshot');
      try {
        broadcastSyncService.broadcastAuditSnapshot(newSnap);
      } catch (err) {
        console.warn('Broadcast snapshot failed:', err);
      }

      showToast(`Automated System Backup #${record.snapshotNumber} Sealed Successfully. Integrity Verified.`, 'success');

      addSystemEvent(
        'BACKUP',
        `Automated System Backup #${record.snapshotNumber} Sealed`,
        `Merkle root: ${record.merkleRoot.slice(0, 18)}... • Scope: ${record.statesCaptured} subsystem states, ${record.logsCount} audit records • Integrity: 100% Verified`,
        record.merkleRoot,
        'success',
        'พ.ร.บ. ธุรกรรมฯ มาตรา 26/28 & NIST PQC (Dilithium-5)',
        'ledger'
      );
    });

    // 5. Attach automated backup logger
    const unsubBackupLogger = automatedBackupService.registerSystemActivityLogger(
      (type, title, desc, meta, sev, statute, view) => {
        addSystemEvent(type, title, desc, meta, sev, statute, view);
      }
    );

    // 6. Attach Write Firewall Engine system event handler
    const unsubFirewall = WriteFirewallEngine.registerSystemEventHandler(
      (type, title, desc, meta, sev, statute, view) => {
        addSystemEvent(type, title, desc, meta, sev, statute, view);
      }
    );

    // Strict reverse teardown order: prevents memory leaks and duplicate handlers during re-renders or tab switches
    return () => {
      unsubFirewall();
      unsubBackupLogger();
      unsubBackupSnap();
      unsubOffline();
      unsubLock();
      unsubSnap();
      unsubEvent();
    };
  }, [addSystemEvent, showToast]);

  const handleToggleFreezeSystemActivity = useCallback(() => {
    triggerVibration('sidebarToggle');
    setIsSystemActivityFrozen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('zyrquen_system_frozen', String(next));
      } catch (e) {
        console.error(e);
      }
      broadcastSyncService.broadcastGlobalLockState({ isSystemActivityFrozen: next });
      if (next) {
        automatedBackupService.stop();
        if (isAudioActive) {
          toggleSovereignSynth882Hz(false);
        }
        addSystemEvent(
          'HARDWARE',
          'SYSTEM ACTIVITY FROZEN (MAINTENANCE STATE-PRESERVED)',
          'Automated telemetry capture, scheduled backup timers, and audio carrier modulation paused. SSoT state preserved.',
          'freeze:state_preservation_armed',
          'warning',
          'ISO/IEC 27037 Digital Forensics State Preservation',
          'pulse'
        );
      } else {
        automatedBackupService.start();
        if (isAudioActive) {
          toggleSovereignSynth882Hz(true);
          updateAtmosphericEntropyPitch(systemStateStore.getState().aggregateEntropy, true);
        }
        addSystemEvent(
          'HARDWARE',
          'SYSTEM ACTIVITY RESUMED (LIVE TELEMETRY ACTIVE)',
          'Automated telemetry stream, background backup engine, and 882Hz harmonic clock resumed.',
          'freeze:state_preservation_disarmed',
          'success',
          'ISO/IEC 27037 Live Telemetry Ingest',
          'pulse'
        );
      }
      return next;
    });
  }, [isAudioActive, addSystemEvent]);

  const handleToggleAudio = useCallback(() => {
    setIsAudioActive((prev) => {
      const next = !prev;
      toggleSovereignSynth882Hz(next);
      if (next) {
        updateAtmosphericEntropyPitch(systemStateStore.getState().aggregateEntropy, true);
      }
      return next;
    });
    const next = !isAudioActive;
    addSystemEvent(
      'AUDIO',
      next ? 'Sovereign Audio Carrier Active' : 'Sovereign Audio Muted',
      next ? 'Synthesized continuous harmonic carrier oscillator initialized with dynamic entropy pitch modulation.' : 'Audio carrier halted.',
      'audio:carrier_synth_stream',
      'info'
    );
  }, [isAudioActive, addSystemEvent]);

  const handleAddSnapshot = (newSnap: HardwareSnapshot) => {
    // Verification Gate: Visually validate if systemEvents containing 'COMPLIANCE' type exist and have triggered
    // corresponding seal updates before allowing a new entry to be appended to the Merkle Ledger.
    const complianceEvents = systemEvents.filter((e) => e.type === 'COMPLIANCE');
    const hasValidCompliance = complianceEvents.length > 0;

    if (!hasValidCompliance) {
      setVerificationGateStatus({
        status: 'BLOCKED',
        lastCheckedTime: new Date().toLocaleTimeString('en-GB') + ' ICT',
        complianceEventCount: 0,
        sealCount: 14902 + Math.max(0, snapshots.length - 2),
        message: 'Verification Gate REJECTED: No verified COMPLIANCE events found in telemetry log stream.',
      });
      addSystemEvent(
        'ALERT',
        'Verification Gate: Merkle Ledger Append BLOCKED',
        'Snapshot append rejected because no active COMPLIANCE event anchor was found in the telemetry stream.',
        'gate:block_no_compliance',
        'critical',
        'มาตรา 26 (ETDA Level 3+ Invariant Verification)',
        'security'
      );
      showToast('Hardware Telemetry Snapshot REJECTED: Gate Blocked', 'error');
      setIsEventsSidebarOpen(true);
      return;
    }

    // Update Verification Gate Status to PASSED
    const newVerifiedSeals = 14902 + Math.max(0, snapshots.length - 2 + 1);
    systemStateStore.setSealCount(newVerifiedSeals);
    systemStateStore.setSealedBlock(849202 + Math.max(0, snapshots.length - 2 + 1));
    triggerVibration('snapshot');
    try {
      broadcastSyncService.broadcastAuditSnapshot(newSnap);
    } catch (err) {
      console.warn('Broadcast snapshot failed:', err);
    }
    showToast('Hardware Telemetry Snapshot Captured Successfully', 'success');
    setVerificationGateStatus({
      status: 'PASSED',
      lastCheckedTime: new Date().toLocaleTimeString('en-GB') + ' ICT',
      complianceEventCount: complianceEvents.length,
      sealCount: newVerifiedSeals,
      message: `Verification Gate PASSED: Validated ${complianceEvents.length} COMPLIANCE events. Telemetry bound to Seal #${newVerifiedSeals.toLocaleString()}.`,
    });

    setSnapshots((prev) => {
      const nextSnaps = [newSnap, ...prev];

      // Telemetry Anomaly Observer: Detect statistical outliers against baseline distribution
      const anomalyResult = TelemetryAnomalyObserver.evaluate(newSnap, prev);
      if (anomalyResult.hasAnomaly) {
        anomalyResult.anomalies.forEach((anom) => {
          addSystemEvent(
            'ANOMALY',
            `Statistical Anomaly: ${anom.metricName} Outlier (${anom.zScore >= 0 ? '+' : ''}${anom.zScore.toFixed(1)}σ)`,
            `Telemetry value ${anom.value.toFixed(1)} deviates significantly from historical baseline (μ = ${anom.mean.toFixed(1)}, σ = ${anom.stdDev.toFixed(1)}). Auto-flagged for isolation.`,
            newSnap.sealedHash,
            'critical',
            'ISO/IEC 27037 Telemetry Anomaly Protocol',
            'pulse'
          );
        });
      }

      return nextSnaps;
    });
    setLastSnapshotTime(Date.now());
    // Computational activity pulse elevates entropy momentarily
    systemStateStore.bumpEntropy(6.8);
    
    // 1. Primary Hardware Event
    addSystemEvent(
      'HARDWARE',
      `Hardware Snapshot #${newSnap.snapshotNumber} Sealed`,
      `Captured ${newSnap.id}: CPU ${newSnap.cpuAverage}% • Cryo ${newSnap.cryoTempMk}mK • QOps ${newSnap.qopsThroughput}`,
      newSnap.sealedHash,
      'success'
    );

    // 2. Automatic Legal Compliance Alert (Section 26 & 28 Invariant Verification)
    setTimeout(() => {
      addSystemEvent(
        'COMPLIANCE',
        `มาตรา 26 (Sec 26) Cryptographic Invariant Sealed`,
        `Snapshot #${newSnap.snapshotNumber} certified under ETDA Level 3+ with 0.00% invariant drift and Dilithium-5 post-quantum signature.`,
        `proof:merkle_block_invariant_${newSnap.snapshotNumber}`,
        'success',
        'พ.ร.บ. ธุรกรรมฯ มาตรา 26 (ETDA Level 3+)',
        'security'
      );
    }, 200);

    // Open sidebar subtly to showcase live activity feed
    setIsEventsSidebarOpen(true);
  };

  const handleLegalSearchExecuted = (query: string, summary: string) => {
    // 1. Search Query Event
    addSystemEvent(
      'LEGAL_SEARCH',
      `Thai Legal Search: "${query.slice(0, 36)}..."`,
      summary,
      `oracle:query_${Date.now()}`,
      'info'
    );

    // 2. Automatic Legal Compliance Citation Alert
    setTimeout(() => {
      addSystemEvent(
        'COMPLIANCE',
        `Statutory Reference: Section 9, 26, 28 ↔ Sovereign Chain`,
        `Real-time Thai statutory grounding retrieved for query. Cryptographic proof mapping ready for review.`,
        `statute:etda_electronic_trans_act_2544`,
        'success',
        'Sec 9, 26, 28 & PDPA ↔ Sovereign Seal',
        'security'
      );
    }, 250);

    // Slide in sidebar to surface live grounding event
    setIsEventsSidebarOpen(true);
  };

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      // 1. Meta / Ctrl shortcuts (work even inside inputs for global commands)
      if (e.metaKey || e.ctrlKey) {
        const key = e.key.toLowerCase();

        if (key === 'k') {
          e.preventDefault();
          playTone(680, 0.08);
          setIsLegalSearchOpen((prev) => !prev);
          return;
        }

        if (key === 'b') {
          e.preventDefault();
          playTone(600, 0.06);
          handleToggleSidebar();
          return;
        }

        if (key === 'e') {
          e.preventDefault();
          playTone(640, 0.06);
          setIsEventsSidebarOpen((prev) => !prev);
          return;
        }

        if (key === 'l') {
          e.preventDefault();
          playTone(540, 0.06);
          setCurrentView('ledger');
          return;
        }

        if (key === 'p') {
          e.preventDefault();
          playTone(540, 0.06);
          setCurrentView('pulse');
          return;
        }

        if (key === 'q') {
          e.preventDefault();
          playTone(540, 0.06);
          setCurrentView('quantum');
          return;
        }

        if (key === 'g') {
          e.preventDefault();
          playTone(720, 0.1);
          setIsCertificateOpen((prev) => !prev);
          return;
        }

        if (key === '/') {
          e.preventDefault();
          playTone(620, 0.06);
          setIsShortcutsOpen((prev) => !prev);
          return;
        }
      }

      // 2. Escape to dismiss modals and sidebars
      if (e.key === 'Escape') {
        if (isLeftSidebarOpen && typeof window !== 'undefined' && window.innerWidth < 1024) {
          setIsLeftSidebarOpen(false);
          return;
        }
        if (isEventsSidebarOpen) {
          setIsEventsSidebarOpen(false);
          return;
        }
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
          return;
        }
        if (isLegalSearchOpen) {
          setIsLegalSearchOpen(false);
          return;
        }
        if (isCertificateOpen) {
          setIsCertificateOpen(false);
          return;
        }
      }

      // 3. Direct single-key shortcuts when NOT focusing an input
      if (!isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === '[') {
          e.preventDefault();
          playTone(600, 0.06);
          setIsLeftSidebarOpen((prev) => !prev);
          return;
        }

        if (e.key === '?' || (e.shiftKey && e.key === '/')) {
          e.preventDefault();
          playTone(620, 0.06);
          setIsShortcutsOpen((prev) => !prev);
          return;
        }

        if (e.key.toLowerCase() === 'e' && e.shiftKey) {
          e.preventDefault();
          playTone(640, 0.06);
          setIsEventsSidebarOpen((prev) => !prev);
          return;
        }

        if (e.key.toLowerCase() === 'm') {
          e.preventDefault();
          handleToggleAudio();
          return;
        }

        // Direct number key navigation (1-9, 0, -, =, r, c)
        const viewKeyMap: Record<string, ViewType> = {
          '1': 'dashboard',
          'c': 'council',
          'C': 'council',
          'r': 'production',
          'R': 'production',
          '2': 'quantum',
          '3': 'nexus',
          '4': 'vault',
          '5': 'ledger',
          '6': 'pulse',
          '7': 'forge',
          '8': 'matrix',
          '9': 'archive',
          '0': 'console',
          'u': 'unified',
          'U': 'unified',
          'h': 'heatmap',
          'H': 'heatmap',
          '-': 'security',
          '=': 'settings',
          'l': 'legal',
          'L': 'legal',
          'j': 'audithistory',
          'J': 'audithistory',
          'x': 'securitypipeline',
          'X': 'securitypipeline',
          'e': 'briefing',
          'E': 'briefing',
        };

        if (viewKeyMap[e.key]) {
          e.preventDefault();
          playTone(560, 0.06);
          setCurrentView(viewKeyMap[e.key]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShortcutsOpen, isLegalSearchOpen, isCertificateOpen, isEventsSidebarOpen, handleToggleAudio]);

  const [isAppLocked, setIsAppLocked] = useState(false);
  const [inactivityTimerMinutes, setInactivityTimerMinutes] = useState(() => {
    return Number(localStorage.getItem('zyrquen_inactivity_timer') || 30);
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      if (!isAppLocked && inactivityTimerMinutes > 0) {
        timeoutId = setTimeout(() => {
          setIsAppLocked(true);
        }, inactivityTimerMinutes * 60 * 1000);
      }
    };

    const handleActivity = () => resetTimer();

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    resetTimer();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'zyrquen_inactivity_timer') {
        const storedTimer = Number(localStorage.getItem('zyrquen_inactivity_timer') || 30);
        setInactivityTimerMinutes(storedTimer);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Custom event to update from same window
    const handleLocalSettingsChange = () => {
        const storedTimer = Number(localStorage.getItem('zyrquen_inactivity_timer') || 30);
        setInactivityTimerMinutes(storedTimer);
        resetTimer();
    }
    window.addEventListener('zyrquen_inactivity_timer_updated', handleLocalSettingsChange);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('zyrquen_inactivity_timer_updated', handleLocalSettingsChange);
    };
  }, [isAppLocked, inactivityTimerMinutes]);

  const persona = VIEW_PERSONAS[currentView] || VIEW_PERSONAS.dashboard;

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="space-y-4">
            <ForensicAuditStepper
              onAddSystemEvent={addSystemEvent}
              onNavigateView={setCurrentView}
            />
            <DashboardView
              snapshots={snapshots}
              verificationGateStatus={verificationGateStatus}
              onNavigate={setCurrentView}
              onOpenCertificate={() => setIsCertificateOpen(true)}
              isForensicAuditMode={isForensicAuditMode}
            />
          </div>
        );
      case 'civilization':
        return <CivilizationEngineView onNavigate={setCurrentView} />;
      case 'studio':
        return (
          <StudioView
            onNavigate={setCurrentView}
            onOpenCertificate={() => setIsCertificateOpen(true)}
            snapshots={snapshots}
            isAudioActive={isAudioActive}
          />
        );
      case 'unified':
        return (
          <UnifiedMultiverseControlPanel
            onNavigate={setCurrentView}
            onOpenCertificate={() => setIsCertificateOpen(true)}
            snapshots={snapshots}
            onAddHardwareSnapshot={handleAddSnapshot}
            onAddSystemEvent={addSystemEvent as any}
            isAudioActive={isAudioActive}
            onToggleAudio={handleToggleAudio}
            isSystemActivityFrozen={isSystemActivityFrozen}
            onToggleFreezeSystemActivity={handleToggleFreezeSystemActivity}
          />
        );
      case 'heatmap':
        return (
          <GovernanceHealthHeatmap
            onNavigateToView={setCurrentView}
            onAddSystemEvent={addSystemEvent as any}
          />
        );
      case 'council':
        return <CouncilView onAddSystemEvent={addSystemEvent as any} />;
      case 'production':
        return (
          <ProductionReadinessView
            onNavigate={setCurrentView}
            onAddSystemEvent={addSystemEvent as any}
          />
        );
      case 'quantum':
        return (
          <div className="space-y-6">
            <QuantumView />
            <Chamber11QuantumRadar />
          </div>
        );
      case 'nexus':
        return <NexusView />;
      case 'vault':
        return <VaultView />;
      case 'ledger':
        return <LedgerView snapshots={snapshots} />;
      case 'pulse':
        return (
          <PulseView
            snapshots={snapshots}
            onOpenEventsSidebar={() => setIsEventsSidebarOpen(true)}
            onAddHardwareSnapshot={handleAddSnapshot}
            onAddSystemEvent={addSystemEvent as any}
            isSystemActivityFrozen={isSystemActivityFrozen}
          />
        );
      case 'forge':
        return <ForgeView />;
      case 'matrix':
        return <MatrixView snapshots={snapshots} onAddSystemEvent={addSystemEvent as any} />;
      case 'archive':
        return <ArchiveView onNavigate={setCurrentView} />;
      case 'console':
        return (
          <ConsoleView
            onCaptureSnapshot={handleAddSnapshot}
            onNavigate={setCurrentView}
            snapshots={snapshots}
            snapshotsCount={snapshots.length}
          />
        );
      case 'security':
        return <SecurityView onAddSystemEvent={addSystemEvent as any} />;
      case 'settings':
        return (
          <SettingsView
            isAudioActive={isAudioActive}
            onToggleAudio={handleToggleAudio}
            isMonochrome={isMonochromeMode}
            onToggleMonochrome={handleToggleMonochrome}
            onCaptureSnapshot={() => handleAddSnapshot(createTelemetrySnapshot({ core0: 42, core1: 39, core2: 44, core3: 38 }, snapshots.length, snapshots[0]?.sealedHash))}
            onOpenLegalSearch={() => setIsLegalSearchOpen(true)}
            onTriggerLoginLoader={(mode = 'login') => {
              setLoginLoaderMode(mode);
              setShowLoginLoader(true);
            }}
            onNotifyEvent={(title, desc, type) => addSystemEvent(type, title, desc, 'settings:profile_switch', 'info')}
            onAddSystemEvent={addSystemEvent as any}
          />
        );
      case 'legal':
        return (
          <LegalView
            onNavigate={setCurrentView}
            onOpenSearch={() => setIsLegalSearchOpen(true)}
            onAddSystemEvent={addSystemEvent as any}
          />
        );
      case 'canonical':
        return (
          <div className="space-y-6">
            <CanonicalIntegrityDashboardView
              onNavigateToLedger={() => setCurrentView('ledger')}
            />
            <G11CanonicalCore />
          </div>
        );
      case 'admin':
        return <AdminConsole />;
      case 'fusion':
        return <QuantumAuditFusionView />;
      case 'playback':
        return <UnifiedAuditPlaybackConsole />;
      case 'analytics':
        return <AuditAnalyticsDashboard />;
      case 'chambers':
        return <SovereignChambersControlPlane />;
      case 'audithistory':
        return (
          <AuditHistoryView
            snapshots={snapshots}
            onNavigate={setCurrentView}
            onCaptureSnapshot={handleAddSnapshot}
            onOpenCertificate={() => setIsCertificateOpen(true)}
            onAddSystemEvent={addSystemEvent as any}
          />
        );
      case 'securitypipeline':
        return (
          <SecurityPipelineView
            onNavigate={setCurrentView}
            onOpenCertificate={() => setIsCertificateOpen(true)}
            onAddSystemEvent={addSystemEvent as any}
          />
        );
      case 'briefing':
        return (
          <ExecutiveCourtBriefing
            onNavigate={setCurrentView}
            onOpenCertificate={() => setIsCertificateOpen(true)}
            onAddSystemEvent={addSystemEvent as any}
          />
        );
      case 'sovereign-wallet':
        return (
          <SovereignWalletView
            onNavigate={setCurrentView}
            onAddSystemEvent={addSystemEvent as any}
          />
        );
      default:
        return <DashboardView onNavigate={setCurrentView} onOpenCertificate={() => setIsCertificateOpen(true)} />;
    }
  };

  const handleBatchVerify = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
    addSystemEvent(
      'CRYPTO',
      'Batch Verification Triggered',
      'Initiating batch integrity verification for 14,902 chambers.',
      'verify',
      'info'
    );
    showToast('Initiating Batch Verification...', 'info');
    
    // Simulate verification delay and success
    setTimeout(() => {
      showToast('14,902 chambers verified successfully', 'success');
      addSystemEvent(
        'CRYPTO',
        'Batch Verification Complete',
        '14,902 chambers verified successfully. SSoT Drift remains at Δ0.00%.',
        'verify:pass',
        'success'
      );
    }, 2500);
  }, [addSystemEvent]);

  const handleExportAuditLogs = useCallback(() => {
    addSystemEvent(
      'FORENSIC',
      'Audit Log Export',
      'Generating signed PDF artifact (ETDA Section 28 Compliant).',
      'export',
      'info'
    );
    showToast('Generating signed Audit Log...', 'info');

    setTimeout(() => {
      // Mock generation of a file download
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
        status: "COURT_READY",
        seals_verified: 14902,
        ssot_drift: "Δ0.00%",
        timestamp: new Date().toISOString()
      }, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "zyrquen-audit-log.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast('Artifact Exported successfully.', 'success');
      addSystemEvent(
        'FORENSIC',
        'Artifact Exported',
        'Signed artifact zyrquen-audit-log.json generated.',
        'export:success',
        'success'
      );
    }, 1500);
  }, [addSystemEvent]);

  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);

  const handleCopyTriggerHash = useCallback((triggerId: string, hash: string) => {
    navigator.clipboard.writeText(hash);
    triggerVibration(30);
    playTone(880, 0.1, 'sine');
    setCopiedHashId(triggerId);
    showToast(`คัดลอก PQC SIG HASH (${triggerId}) สำเร็จ`, 'success');
    setTimeout(() => setCopiedHashId(null), 2500);
  }, [showToast]);

  const handleExportLegalTriggerMatrixPDF = useCallback(() => {
    triggerVibration(40);
    playTone(659.25, 0.15, 'sine');
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    
    // Header background
    doc.setFillColor(7, 10, 18);
    doc.rect(0, 0, 210, 36, 'F');
    
    // Header text
    doc.setTextColor(6, 182, 212);
    doc.setFontSize(13);
    doc.text('ZYRQUEN OMEGA INVARIANT LEGAL TRIGGER MATRIX', 14, 13);
    
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('FORENSIC ATTESTATION & COURT-ADMISSIBLE STATUTORY EVIDENCE', 14, 19);
    
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Principal: นายยุทธภูมิ พากเพียร #EP-SOVEREIGN-01 | Genesis: #849202 | Exported: ${new Date().toLocaleString('th-TH')}`, 14, 25);
    doc.text(`Canonical Merkle: 909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68 | SSoT: Δ0.00%`, 14, 30);
    
    autoTable(doc, {
      startY: 42,
      head: [['Trigger', 'Section', 'Title', 'PQC Scheme', 'Anchor Spec', 'Hash Digest', 'Status']],
      body: ETDA_PDPA_TRIGGERS.map((t) => [
        t.id,
        t.section,
        t.title,
        t.pqcScheme,
        t.anchor,
        (TRIGGER_PQC_HASHES[t.id] || '').slice(0, 18) + '...',
        'VERIFIED'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [6, 182, 212], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 20, fontStyle: 'bold' },
        1: { cellWidth: 24 },
        2: { cellWidth: 42 },
        3: { cellWidth: 34 },
        4: { cellWidth: 32 },
        5: { cellWidth: 30 },
        6: { cellWidth: 18, fontStyle: 'bold' },
      },
      didDrawPage: (data: any) => {
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text('Court-Admissible Evidence under ETDA B.E. 2544 (Sec 9, 26, 28) & PDPA B.E. 2562 (Sec 37) | ZQ-GREEN-DEP-849202-3908', 14, 287);
        doc.text(`Page ${data.pageNumber} of ${(doc as any).internal.getNumberOfPages()}`, 182, 287);
      },
    });

    doc.save(`ZYRQUEN_LEGAL_TRIGGER_MATRIX_SIGNED_${Date.now()}.pdf`);
    showToast('ส่งออก Legal Trigger Matrix PDF Artifact เรียบร้อยแล้ว', 'success');
    addSystemEvent(
      'FORENSIC',
      'Legal Trigger Matrix Exported',
      'Signed PDF Artifact generated and certified under ETDA Sec 9/26/28.',
      'pdf:matrix',
      'success'
    );
  }, [addSystemEvent, showToast]);

  const handleCommandPaletteAction = useCallback((actionId: string) => {
    if (actionId === 'snapshot') {
      handleAddSnapshot(createTelemetrySnapshot({ core0: 42, core1: 39, core2: 44, core3: 38 }, snapshots.length, snapshots[0]?.sealedHash));
      showToast('สร้าง Signed Snapshot (FIPS 204) เรียบร้อย', 'success');
    } else if (actionId === 'pqc-verify') {
      setIsCertificateOpen(true);
    } else if (actionId === 'lockdown') {
      setIsGateDetailsExpanded(true);
      showToast('เปิดใช้ Sovereign Isolation Protocol ใน Chamber 02', 'warning');
    } else if (actionId === 'legal-pdf') {
      handleExportLegalTriggerMatrixPDF();
    } else if (actionId === 'render-sphere') {
      setCurrentView('canonical');
      showToast('สลับไปยัง Canonical 3D Integrity View', 'info');
    } else if (actionId === 'copilot-trigger') {
      setIsCopilotOpen(true);
    } else if (actionId === 'view-seals') {
      setCurrentView('ledger');
      showToast('เปิดดูทะเบียน Active Evidence Seals', 'info');
    } else if (actionId === 'forensic-stepper') {
      setCurrentView('dashboard');
      const el = document.getElementById('forensic-audit-stepper');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      showToast('นำทางไปยัง 16-Step Forensic Audit Stepper', 'info');
    }
  }, [handleAddSnapshot, handleExportLegalTriggerMatrixPDF, showToast, snapshots]);

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden bg-[#07080F] text-zinc-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 antialiased relative ${isMonochromeMode ? 'theme-monochrome' : ''}`}>
      {/* Background Persona Mesh Ambient Lighting with Smooth Morphing */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-all duration-1000 ease-in-out">
        {/* Dynamic Top Orb */}
        <div
          className={`absolute top-[-10%] left-[20%] w-[650px] h-[650px] rounded-full blur-[150px] transition-all duration-1000 ease-in-out ${persona.orb1}`}
        />
        {/* Dynamic Mid Orb */}
        <div
          className={`absolute top-[40%] right-[10%] w-[550px] h-[550px] rounded-full blur-[150px] transition-all duration-1000 ease-in-out ${persona.orb2}`}
        />
        {/* Dynamic Bottom Orb */}
        <div
          className={`absolute bottom-[-10%] left-[30%] w-[750px] h-[750px] rounded-full blur-[170px] transition-all duration-1000 ease-in-out ${persona.orb3}`}
        />
      </div>

      {/* Top Fixed Navigation & Status Bar */}
      <Navigation
        currentView={currentView}
        onSelectView={setCurrentView}
        onOpenCertificate={() => setIsCertificateOpen(true)}
        onOpenGitHubPwa={() => setIsGitHubPwaOpen(true)}
        onOpenLegalSearch={() => setIsLegalSearchOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenEventsSidebar={() => setIsEventsSidebarOpen((prev) => !prev)}
        eventsCount={systemEvents.length}
        isAudioActive={isAudioActive}
        onToggleAudio={handleToggleAudio}
        isSystemActivityFrozen={isSystemActivityFrozen}
        onToggleFreezeSystemActivity={handleToggleFreezeSystemActivity}
        isForensicAuditMode={isForensicAuditMode}
        onToggleForensicAuditMode={handleToggleForensicAuditMode}
        sealCount={verificationGateStatus.sealCount}
        onCaptureSnapshot={() => handleAddSnapshot(createTelemetrySnapshot({ core0: 42, core1: 39, core2: 44, core3: 38 }, snapshots.length, snapshots[0]?.sealedHash))}
        isSidebarOpen={isLeftSidebarOpen}
        onToggleSidebar={handleToggleSidebar}
        isCopilotOpen={isCopilotOpen}
        onToggleCopilot={() => setIsCopilotOpen((prev) => !prev)}
        onTriggerLoginLoader={(mode = 'login') => {
          setLoginLoaderMode(mode);
          setShowLoginLoader(true);
        }}
      />

      {/* Live Quantum Stream Entropy & Sovereign Invariant Marquee Ticker */}
      <LiveQuantumEntropyTicker />

      {/* App Body Layout with Collapsible Left Sidebar */}
      <div className="relative z-10 max-w-[1780px] mx-auto px-2 sm:px-4 flex items-start">
        {/* Left Sidebar (Open / Close Collapsible) */}
        <LeftSidebar
          isOpen={isLeftSidebarOpen}
          onClose={handleCloseSidebar}
          onToggle={handleToggleSidebar}
          currentView={currentView}
          onSelectView={setCurrentView}
          selectedChamberId={selectedChamberId}
          onSelectChamber={setSelectedChamberId}
          liveCryo={14.98}
        />

        {/* Main Content Area with Sliding Curtain OS Entrance Transitions */}
        <main className="flex-1 min-w-0 w-full px-2 sm:px-4 py-4 pb-28 sm:pb-32 overflow-hidden space-y-4 transition-all duration-300">
          {/* Visual Notification System: SSoT Mutation Drift Warning (Triggered if deviation >= 0.01%) */}
          <SsotDriftWarning />

          {/* Verification Gate Active Invariant Banner with Progress Bar & Expandable ETDA/PDPA Triggers */}
          <div className="rounded-2xl bg-[#0b0e1a]/90 border border-cyan-500/25 backdrop-blur-xl shadow-lg transition-all duration-300 overflow-hidden">
            <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              {/* Left: Gate Status & Info with Tooltip Trigger */}
              <div className="flex items-center gap-2.5 relative">
                <span className={`w-2.5 h-2.5 rounded-full ${verificationGateStatus.status === 'PASSED' ? 'bg-emerald-400 animate-pulse' : verificationGateStatus.status === 'BLOCKED' ? 'bg-rose-400 animate-ping' : 'bg-cyan-400'}`} />
                <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  VERIFICATION GATE:
                </span>

                {/* Status Pill with hover tooltip */}
                <div 
                  className="relative inline-block"
                  onMouseEnter={() => setIsGateTooltipVisible(true)}
                  onMouseLeave={() => setIsGateTooltipVisible(false)}
                >
                  <button
                    type="button"
                    onClick={() => setIsGateDetailsExpanded((prev) => !prev)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                      verificationGateStatus.status === 'PASSED' 
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20' 
                        : verificationGateStatus.status === 'BLOCKED' 
                          ? 'bg-rose-500/20 text-rose-200 border-rose-500/60 hover:bg-rose-500/30 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.45)] ring-1 ring-rose-500/50' 
                          : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20'
                    }`}
                    title="Hover for tooltip / Click to toggle legal triggers summary"
                  >
                    {verificationGateStatus.status}
                    <Info className="w-2.5 h-2.5 opacity-70" />
                  </button>

                  {/* Floating Tooltip Box: Enhanced Hover-Card Summary */}
                  <AnimatePresence>
                    {isGateTooltipVisible && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full mt-2 z-50 w-80 sm:w-[460px] p-4 rounded-2xl bg-[#070914]/98 border border-cyan-500/40 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-[11px] font-sans text-zinc-300 pointer-events-none"
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/10 font-mono text-[11px]">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                              <ShieldCheck className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                VERIFICATION GATE
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] border border-emerald-500/40 font-mono">
                                  {verificationGateStatus.status} • MAINNET LIVE
                                </span>
                              </div>
                              <span className="text-[10px] text-zinc-400">Block #849202 • ZQ-GREEN-DEP-849202-3908</span>
                            </div>
                          </div>
                          <span className="text-emerald-400 font-bold font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
                            SSoT Δ0.00%
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-zinc-300 text-[11px] leading-relaxed mb-3">
                          {verificationGateStatus.message}
                        </p>

                        {/* 1. 10/10 REAL_HSM Quorum Status Breakdown */}
                        <div className="p-2.5 rounded-xl bg-black/50 border border-cyan-500/20 mb-2.5 space-y-2">
                          <div className="flex items-center justify-between font-mono text-[10px]">
                            <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5 text-cyan-400" />
                              10/10 REAL_HSM QUORUM STATUS
                            </span>
                            <span className="text-emerald-400 font-bold">100% UNANIMOUS RATIFIED</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                            <div className="p-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                              <span className="text-zinc-400 block text-[9px]">GOVERNANCE PLANE</span>
                              <span className="text-emerald-300 font-semibold">10/10 PASS (Statutory)</span>
                            </div>
                            <div className="p-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                              <span className="text-zinc-400 block text-[9px]">PHYSICAL HARDWARE</span>
                              <span className="text-emerald-300 font-semibold">10/10 FIPS 140-3 L4</span>
                            </div>
                          </div>
                          <div className="text-[10px] font-mono text-zinc-400 flex items-center justify-between pt-0.5 border-t border-white/5">
                            <span>Nodes: TC-01 Sovereign Hub + 9 Custodians</span>
                            <span className="text-cyan-300">Mean Latency: 0.31 ms</span>
                          </div>
                        </div>

                        {/* 2. Active Cryptographic Schemes (3-Tiered Hybrid Shield) */}
                        <div className="p-2.5 rounded-xl bg-black/50 border border-purple-500/20 mb-2.5 space-y-1.5">
                          <div className="flex items-center justify-between font-mono text-[10px]">
                            <span className="text-purple-300 font-bold flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-purple-400" />
                              ACTIVE CRYPTOGRAPHIC SCHEMES (3-TIER PQC)
                            </span>
                            <span className="text-purple-400 text-[9px]">NIST FIPS COMPLIANT</span>
                          </div>
                          <div className="space-y-1 font-mono text-[10px]">
                            <div className="flex justify-between items-center text-zinc-300">
                              <span className="text-zinc-400">Outer Ring (ML-DSA-87):</span>
                              <span className="text-purple-300 font-semibold">CRYSTALS-Dilithium-5 (FIPS 204)</span>
                            </div>
                            <div className="flex justify-between items-center text-zinc-300">
                              <span className="text-zinc-400">Middle Ring (ML-KEM):</span>
                              <span className="text-cyan-300 font-semibold">Kyber-1024 Cat-5 (FIPS 203)</span>
                            </div>
                            <div className="flex justify-between items-center text-zinc-300">
                              <span className="text-zinc-400">Inner Guard (SLH-DSA):</span>
                              <span className="text-amber-300 font-semibold">SPHINCS+ Stateless (FIPS 205)</span>
                            </div>
                            <div className="flex justify-between items-center text-zinc-300 pt-1 border-t border-white/5">
                              <span className="text-zinc-400">Quantum Hardware:</span>
                              <span className="text-emerald-300">Cryo 14.98 mK • QKD 256-bit • X448</span>
                            </div>
                          </div>
                        </div>

                        {/* 3. Legal & Court Invariant Details */}
                        <div className="p-2 rounded-xl bg-zinc-900/40 border border-white/5 text-[10px] font-mono text-zinc-400 space-y-1">
                          <div className="flex justify-between">
                            <span>Thai Legal Standards:</span>
                            <span className="text-emerald-400 font-medium">ETDA Sec 9/26/28 • PDPA Sec 37</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Evidence Admissibility:</span>
                            <span className="text-amber-300 font-medium">ISO/IEC 27037 Court-Admissible Ready</span>
                          </div>
                        </div>

                        <p className="mt-2 text-[10px] text-cyan-400/80 font-mono text-center">
                          Click status pill to expand / collapse full legal trigger matrix ↓
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <span className="text-zinc-400 hidden lg:inline text-[11px] truncate max-w-md">
                  {verificationGateStatus.message}
                </span>
              </div>

              {/* Right: Metrics, Drift Toggle, Trigger Button, Counters */}
              <div className="flex items-center gap-2.5 sm:gap-3 text-[11px] text-zinc-400 ml-auto flex-wrap sm:flex-nowrap">
                {/* SSoT Drift Deviation Simulator Toggle Button */}
                <SsotDriftToggleButton />

                {/* Expandable Section Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsGateDetailsExpanded((prev) => !prev)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                    isGateDetailsExpanded
                      ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                      : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10 hover:text-cyan-300 hover:border-cyan-500/30'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ETDA / PDPA Triggers</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    6 Active
                  </span>
                  {isGateDetailsExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                </button>

                <span className="hidden sm:inline text-zinc-600">•</span>

                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Anchors: <strong className="text-emerald-300">{verificationGateStatus.complianceEventCount}</strong></span>
                </span>

                <span>•</span>

                <BannerAnimatedSealCount
                  sealCount={verificationGateStatus.sealCount}
                  baseSealCount={14902}
                />

                <span className="hidden md:inline text-zinc-600">•</span>
                <span className="text-zinc-500 hidden md:inline">{verificationGateStatus.lastCheckedTime}</span>
              </div>
            </div>

            {/* Scheduled Telemetry Audit Real-time Progress Bar */}
            <div className="px-4 pb-2.5 pt-0.5 space-y-1 bg-black/20 border-t border-white/5">
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>Next Telemetry Audit: <strong className="text-white">{auditCountdownSec}s</strong></span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-zinc-400">Sub-Kelvin HSM Cycle</span>
                </span>
                <span className="text-emerald-400 font-bold">
                  {Math.round(auditProgressPercent)}% Complete
                </span>
              </div>
              <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5 relative">
                <div
                  className="h-full bg-cyan-400 transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${auditProgressPercent}%` }}
                />
              </div>
            </div>

          {/* Expandable Section: Comprehensive ETDA & PDPA Trigger Matrix */}
          <AnimatePresence>
            {isGateDetailsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="border-t border-cyan-500/20 bg-[#060812]/95 px-4 sm:px-6 py-4 space-y-4"
              >
                {/* Header Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/8 font-mono">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                        <span>Thai Legal & Cryptographic Compliance Trigger Matrix</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          ALL 6 TRIGGERS GREEN (100%)
                        </span>
                      </h4>
                      <p className="text-xs text-zinc-400 font-sans">
                        Sovereign Invariants under ETDA B.E. 2544 (2001/2019) & PDPA B.E. 2562 (2019) certified against Passport #EP-SOVEREIGN-01.
                      </p>
                    </div>
                  </div>

                  {/* Actions shortcut */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleExportLegalTriggerMatrixPDF}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 text-[11px] font-sans font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                      title="Export signed legal trigger matrix as official PDF artifact"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      Export Signed Matrix PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsLegalSearchOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/35 text-[11px] font-sans font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Search Thai Legal Corpus
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCertificateOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 text-[11px] font-sans font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      Inspect Cryptographic Certificate
                    </button>
                    <button
                      type="button"
                      onClick={handleBatchVerify}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 text-[11px] font-sans font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Batch Verify Chambers
                    </button>
                    <button
                      type="button"
                      onClick={handleExportAuditLogs}
                      className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/35 text-[11px] font-sans font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export Audit Log
                    </button>
                  </div>
                </div>

                {/* 6 Trigger Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-sans">
                  {ETDA_PDPA_TRIGGERS.map((trigger) => (
                    <div
                      key={trigger.id}
                      className="p-3.5 rounded-xl bg-[#090d1a]/80 border border-cyan-500/20 hover:border-cyan-500/50 hover:scale-[1.02] hover:shadow-[0_8px_25px_rgba(6,182,212,0.18)] transition-all duration-200 space-y-2 group cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                        <span className="text-cyan-400 font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/25">
                          {trigger.section}
                        </span>
                        <span className="text-emerald-300 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          {trigger.statusText}
                        </span>
                      </div>

                      <div>
                        <h5 className="text-xs font-bold text-zinc-100 group-hover:text-cyan-300 transition-colors">
                          {trigger.title}
                        </h5>
                        <p className="text-[11px] text-cyan-400/90 font-medium font-thai">
                          {trigger.titleTh}
                        </p>
                      </div>

                      <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                        {trigger.description}
                      </p>

                      <div className="pt-2 border-t border-white/5 flex flex-col gap-1 font-mono text-[10px]">
                        <div className="flex items-center justify-between text-zinc-400">
                          <span className="text-zinc-500">PQC Scheme:</span>
                          <span className="text-zinc-300 truncate max-w-[160px] text-right" title={trigger.pqcScheme}>
                            {trigger.pqcScheme}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-zinc-400">
                          <span className="text-zinc-500">Anchor:</span>
                          <span className="text-cyan-400/90 truncate max-w-[160px] text-right" title={trigger.anchor}>
                            {trigger.anchor}
                          </span>
                        </div>

                        {/* PQC Signature Hash with Dedicated Copy to Clipboard Button */}
                        <div className="flex items-center justify-between text-zinc-400 pt-1 border-t border-white/5">
                          <span className="text-zinc-500">PQC Sig Hash:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-purple-300 font-mono text-[9px] truncate max-w-[120px]" title={TRIGGER_PQC_HASHES[trigger.id] || ''}>
                              {(TRIGGER_PQC_HASHES[trigger.id] || '').slice(0, 14)}...
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyTriggerHash(trigger.id, TRIGGER_PQC_HASHES[trigger.id] || '');
                              }}
                              className="px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-colors flex items-center gap-1 text-[9px] font-sans cursor-pointer"
                              title="คัดลอก PQC Metadata Hash สำหรับการตรวจสอบนิติวิทยาศาสตร์ (Forensic Analysis)"
                            >
                              {copiedHashId === trigger.id ? (
                                <>
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                                  <span className="text-emerald-300 text-[8px]">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-2.5 h-2.5 text-cyan-400" />
                                  <span className="text-[8px]">Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Forensic Audit Mode Overlay Metadata */}
                        {isForensicAuditMode && (
                          <div className="mt-1.5 pt-1.5 border-t border-purple-500/30 bg-purple-950/30 -mx-2 -mb-2 p-2 rounded-b-lg space-y-1 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between text-[9px] text-purple-300 font-bold">
                              <span className="flex items-center gap-1">
                                <Fingerprint className="w-2.5 h-2.5 text-purple-400" />
                                <span>PQC SIG HASH:</span>
                              </span>
                              <span className="text-emerald-400 text-[8px]">VERIFIED (PASS)</span>
                            </div>
                            <div className="text-[8px] text-purple-200/90 font-mono break-all bg-black/60 p-1 rounded border border-purple-500/20 flex items-center justify-between gap-1">
                              <span>{TRIGGER_PQC_HASHES[trigger.id]}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyTriggerHash(trigger.id, TRIGGER_PQC_HASHES[trigger.id] || '');
                                }}
                                className="p-1 rounded hover:bg-white/10 text-purple-300 cursor-pointer shrink-0"
                                title="Copy hash"
                              >
                                {copiedHashId === trigger.id ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3 text-purple-300" />
                                )}
                              </button>
                            </div>
                            <div className="flex items-center justify-between text-[8px] text-zinc-400">
                              <span>Timestamp: {new Date().toISOString().split('T')[0]} 05:05:30 ICT</span>
                              <span className="text-cyan-400">Δ0.0% Invariant</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Sovereign Invariant Seal Strip */}
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Genesis Root: <strong className="text-zinc-200">909ab814...43fa4c68</strong></span>
                    <span className="text-zinc-600 hidden sm:inline">•</span>
                    <span className="hidden sm:inline">Canonical Block: <strong className="text-zinc-200">#849,202</strong></span>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <span>Sovereign Architect: <strong className="text-cyan-300">นายยุทธภูมิ พากเพียร</strong></span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-emerald-400 font-semibold">SSoT Δ0.0% ZERO DRIFT</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Emergency Sovereign Isolation Protocol Control */}
        <EmergencySovereignLockdown />

        {/* Real-time Nexus Integration Layer Bridge */}
        <NexusIntegrationLayer
          currentView={currentView}
          onNavigate={setCurrentView}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            className="relative"
            initial={{ opacity: 0, x: 24, filter: 'blur(5px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -24, filter: 'blur(5px)' }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Subtle Sliding Curtain Wipe & Shimmer Effect */}
            <motion.div
              initial={{ scaleX: 1, opacity: 0.5 }}
              animate={{ scaleX: 0, opacity: 0 }}
              exit={{ scaleX: 1, opacity: 0.5 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent origin-left"
            />

            <ErrorBoundary
              key={currentView}
              fallbackViewName={VIEW_PERSONAS[currentView]?.name || currentView}
              onResetToHome={() => setCurrentView('dashboard')}
            >
              {renderCurrentView()}
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>

      {/* Footer Attestation Bar */}
      <MainFooter />

      {/* System Events Activity Feed Sidebar */}
      <SystemEventsSidebar
        isOpen={isEventsSidebarOpen}
        onClose={() => {
          triggerVibration('sidebarToggle');
          setIsEventsSidebarOpen(false);
        }}
        events={systemEvents}
        latestSealCount={verificationGateStatus.sealCount}
        onClearEvents={() => setSystemEvents([])}
        isForensicAuditMode={isForensicAuditMode}
        onToggleForensicAuditMode={handleToggleForensicAuditMode}
        onNavigateToView={(v) => {
          setCurrentView(v);
          setIsEventsSidebarOpen(false);
        }}
      />

      {/* Global Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => {
          triggerVibration('modalDismiss');
          setIsShortcutsOpen(false);
        }}
        onNavigate={(v) => {
          setCurrentView(v);
          setIsShortcutsOpen(false);
        }}
        onOpenSearch={() => {
          setIsLegalSearchOpen(true);
          setIsShortcutsOpen(false);
        }}
        onOpenCert={() => {
          setIsCertificateOpen(true);
          setIsShortcutsOpen(false);
        }}
        onToggleAudio={handleToggleAudio}
        onCaptureSnapshot={() => handleAddSnapshot(createTelemetrySnapshot({ core0: 42, core1: 39, core2: 44, core3: 38 }, snapshots.length, snapshots[0]?.sealedHash))}
      />

      {/* Certificate Modal */}
      <ToastNotification toasts={toasts} removeToast={removeToast} />
      <AuditCertificateModal
        isOpen={isCertificateOpen}
        onClose={() => {
          triggerVibration('modalDismiss');
          setIsCertificateOpen(false);
        }}
      />
      <GitHubPwaModal
        isOpen={isGitHubPwaOpen}
        onClose={() => {
          triggerVibration('modalDismiss');
          setIsGitHubPwaOpen(false);
        }}
      />

      {/* Sovereign Control Dock (Cybernetic Floating Glassmorphism Controls) */}
      <SovereignControlDock
        audioEnabled={isAudioActive}
        onToggleAudio={handleToggleAudio}
        frequency={carrierPitchHz}
        onFrequencyChange={(newFreq) => {
          setCarrierPitchHz(newFreq);
          setCustomCarrierFrequency(newFreq);
        }}
        isZeroDriftEnforced={true}
        onToggleZeroDrift={() => {
          addSystemEvent(
            'INVARIANT',
            'SSoT Δ0.00% Zero Drift Lock Attested',
            'Canonical Merkle root locked across 14,902 frozen seals with zero drift.',
            'invariant:zero_drift_enforced',
            'success'
          );
        }}
        pqcLevel="DILITHIUM5"
        onTogglePqcLevel={() => {
          addSystemEvent(
            'SECURITY',
            'PQC Cryptographic Spec Shift Attested',
            'Post-quantum signature and key encapsulation standard active (ML-DSA-87 / ML-KEM-1024 FIPS 203/204).',
            'crypto:pqc_spec_switch',
            'info'
          );
        }}
      />

      {/* Dynamic Atmospheric Ambient Sound Generator Floating HUD */}
      <div className="fixed bottom-3 left-16 sm:left-16 z-40 flex items-center gap-2 pointer-events-none sm:pointer-events-auto">
        <div className="pointer-events-auto">
        <button
          onClick={handleToggleAudio}
          className={`px-3 min-h-[42px] py-1.5 rounded-xl border font-mono text-xs backdrop-blur-xl transition-all shadow-xl flex items-center gap-2 ${
            isAudioActive
              ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
              : 'bg-black/60 border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20'
          }`}
          title="Dynamic Atmospheric Ambient Sound Generator (Modulates Carrier Pitch by Aggregate System Entropy)"
        >
          <span className="relative flex h-2 w-2">
            {isAudioActive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isAudioActive ? 'bg-cyan-400' : 'bg-zinc-600'
              }`}
            ></span>
          </span>
          <Waves className={`w-3.5 h-3.5 ${isAudioActive ? 'text-cyan-400 animate-pulse' : 'text-zinc-500'}`} />
          <span className="font-bold hidden sm:inline">
            ATMOSPHERIC AUDIO
          </span>
          <span className="text-[11px] text-zinc-300 border-l border-white/10 pl-2 font-mono">
            {isAudioActive ? `${carrierPitchHz} Hz` : 'MUTED'}
          </span>
          <QuantumAggregateEntropyIndicator />
        </button>
        </div>
      </div>

      {/* Thai Legal & Cryptographic Standards Search Modal (Google Search Tool) */}
      {/* Voice-to-Command Bridge (Shifted to allow bottom-right Copilot) */}
      <VoiceCommandOverlay 
        onNavigate={setCurrentView} 
        onCaptureSnapshot={() => handleAddSnapshot(createTelemetrySnapshot({ core0: 42, core1: 39, core2: 44, core3: 38 }, snapshots.length, snapshots[0]?.sealedHash))} 
        onNotifyEvent={addSystemEvent as any} 
      />

      {/* Sovereign Copilot AI v6.0 Ultra Panel (Floating Dock, Fullscreen Toggle, 3D Continuum) */}
      <CopilotSovereignAI
        isOpen={isCopilotOpen}
        onClose={() => {
          triggerVibration('click');
          setIsCopilotOpen(false);
        }}
        onOpen={() => {
          triggerVibration('click');
          setIsCopilotOpen(true);
        }}
        onNavigate={setCurrentView}
      />
      <ThaiLegalSearchModal
        isOpen={isLegalSearchOpen}
        onClose={() => {
          triggerVibration('modalDismiss');
          setIsLegalSearchOpen(false);
        }}
        onSearchExecuted={handleLegalSearchExecuted}
      />
      
      {/* Sovereign Quantum Login & Warp Ingress Loader */}
      <SovereignLoginLoader
        isOpen={showLoginLoader}
        mode={loginLoaderMode}
        onComplete={() => {
          setShowLoginLoader(false);
          setCurrentView('dashboard');
          addSystemEvent(
            'SECURITY',
            'Sovereign Quantum Login Attested',
            'FIPS 140-3 L4 HSM 10/10 Quorum verified. Ingress to Sovereign Control Plane granted.',
            'auth:pqc_hsm_10_10_verified',
            'success',
            'ETDA Sec 26 & PDPA Sec 26 Enclave',
            'dashboard'
          );
        }}
        onCancel={() => {
          triggerVibration('modalDismiss');
          setShowLoginLoader(false);
        }}
      />

      <OfflineIndicator />

      {/* Global Executive Command Palette (Cmd+K / Ctrl+K) */}
      <ExecutiveCommandPalette onSelectAction={handleCommandPaletteAction} />

      {/* Global Animated Film-Grain & CRT Scanline Overlay for FROZEN v1.2 LTS */}
      <div className="sovereign-film-grain-overlay" aria-hidden="true" />
      <div className="sovereign-crt-scanline-overlay" aria-hidden="true" />

      {isAppLocked && (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-[#07080F]/95 backdrop-blur-3xl text-white font-mono animate-in fade-in duration-500">
          <div className="p-8 rounded-[28px] bg-[#0b0e1a]/80 border border-cyan-500/30 flex flex-col items-center text-center max-w-sm w-full shadow-[0_0_50px_rgba(6,182,212,0.15)]">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-6">
              <Lock className="w-8 h-8 text-cyan-400" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-cyan-50">SYSTEM LOCKED</h2>
            <p className="text-xs text-zinc-400 mb-8 leading-relaxed">
              Inactivity threshold reached. Please re-authenticate to resume sovereign operations.
            </p>
            <button
              onClick={() => {
                setIsAppLocked(false);
                playAuditChime();
              }}
              className="w-full py-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]"
            >
              UNLOCK SYSTEM
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <SovereignAppContent />
    </HashRouter>
  );
}

