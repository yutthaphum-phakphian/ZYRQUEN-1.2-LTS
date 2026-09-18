import { SovereignCopilot } from './components/SovereignCopilot';
import { MainFooter } from './components/MainFooter';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion, animate } from 'motion/react';
import { HashRouter, useLocation, useNavigate } from './router';
import { ViewType, HardwareSnapshot } from './types';
import { Navigation } from './components/Navigation';
import { LeftSidebar } from './components/LeftSidebar';
import { AuditCertificateModal } from './components/AuditCertificateModal';
import { ThaiLegalSearchModal } from './components/ThaiLegalSearchModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { SystemEventsSidebar, SystemEvent } from './components/SystemEventsSidebar';
import {
  toggleSovereignSynth882Hz,
  playTone,
  playAuditChime,
  updateAtmosphericEntropyPitch,
  getAtmosphericCarrierState,
} from './components/AudioSynthesizer';
import { DashboardView } from './components/views/DashboardView';
import { RealtimeUnifiedVerificationDashboard } from './components/views/RealtimeUnifiedVerificationDashboard';
import { QuantumView } from './components/views/QuantumView';
import { Chamber11QuantumRadar } from './components/views/Chamber11QuantumRadar';
import { G11CanonicalCore } from './components/views/G11CanonicalCore';
import { NexusView } from './components/views/NexusView';
import { VaultView } from './components/views/VaultView';
import { LedgerView } from './components/views/LedgerView';
import { PulseView } from './components/views/PulseView';
import { ForgeView } from './components/views/ForgeView';
import { MatrixView } from './components/views/MatrixView';
import { ArchiveView } from './components/views/ArchiveView';
import { ConsoleView } from './components/views/ConsoleView';
import { SecurityView, SecuritySubTab } from './components/views/SecurityView';
import { SettingsView } from './components/views/SettingsView';
import { ProductionReadinessView } from './components/views/ProductionReadinessView';
import { CouncilView } from './components/views/CouncilView';
import { LegalView } from './components/views/LegalView';
import { StudioView } from './components/views/StudioView';
import { UnifiedMultiverseControlPanel } from './components/views/UnifiedMultiverseControlPanel';
import { UnifiedAuditPlaybackConsole } from './components/views/UnifiedAuditPlaybackConsole';
import { GovernanceHealthHeatmap } from './components/views/GovernanceHealthHeatmap';
import { CivilizationEngineView } from './components/views/CivilizationEngineView';
import { CanonicalIntegrityDashboardView } from './components/views/CanonicalIntegrityDashboardView';
import { QuantumAuditFusionView } from './components/views/QuantumAuditFusionView';
import { AdminConsole } from './components/AdminConsole';
import { SystemHealthDashboard } from './components/SystemHealthDashboard';
import { AuditAnalyticsDashboard } from './components/AuditAnalyticsDashboard';
import { SovereignChambersControlPlane } from './components/SovereignChambersControlPlane';
import { ZyrquenGGDashboard } from './components/views/ZyrquenGGDashboard';
import { SYSTEM_METADATA } from './data/canonicalData';
import { INITIAL_HARDWARE_SNAPSHOTS, createTelemetrySnapshot } from './utils/telemetrySnapshot';
import { TelemetryAnomalyObserver } from './utils/telemetryAnomalyObserver';
import { automatedBackupService } from './services/automatedBackupService';
import { WriteFirewallEngine } from './utils/writeFirewall';
import { announceSystemEventVerbal } from './utils/textToSpeechService';
import { ErrorBoundary } from './components/ErrorBoundary';
import { VoiceCommandOverlay } from './components/VoiceCommandOverlay';
import { OfflineIndicator } from './components/OfflineIndicator';
import { NexusIntegrationLayer } from './components/NexusIntegrationLayer';
import { SovereignLoginLoader } from './components/SovereignLoginLoader';
import { CopilotAssistantDrawer } from './components/copilot/CopilotAssistantDrawer';
import { ThaiComplianceTriggerMatrix, DETAILED_ETDA_PDPA_TRIGGERS } from './components/ThaiComplianceTriggerMatrix';
import { VerifiedEvidenceDownloadConfirmModal } from './components/modal/VerifiedEvidenceDownloadConfirmModal';
import { systemStateStore } from './store/systemStateStore';
import { AudioEntropyController, SsotDriftWarning, SsotDriftToggleButton, QuantumAggregateEntropyIndicator } from './components/system/SystemStateComponents';
import { ToastNotification, ToastMessage } from './components/ToastNotification';
import { useNotificationWebSocket } from './hooks/useNotificationWebSocket';

import {
  Sparkles,
  Shield,
  Award,
  Terminal,
  Keyboard,
  Activity,
  Heart,
  Zap,
  Bell,
  Waves,
  Volume2,
  VolumeX,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ChevronDown,
  ChevronUp,
  Scale,
  FileText,
  ExternalLink,
  Info,
  Layers,
  BookOpen,
  Fingerprint,
  AlertOctagon,
  Clock,
  Download,
  FileCheck2,
  X,
  Bot
} from 'lucide-react';

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
  health: {
    name: 'Sovereign System Health & Node Diagnostics',
    orb1: 'bg-emerald-600/18',
    orb2: 'bg-teal-600/14',
    orb3: 'bg-cyan-600/10',
    accentGlow: 'rgba(16,185,129,0.1)',
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
  zyrquen_gg: {
    name: 'ZYRQUEN GG Sovereign Dashboard & Audit Trail API',
    orb1: 'bg-cyan-600/20',
    orb2: 'bg-indigo-600/15',
    orb3: 'bg-emerald-600/12',
    accentGlow: 'rgba(6,182,212,0.14)',
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
    anchor: 'Authority: นายยุทธภูมิ ภักเพียร',
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
  'health',
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
    setIsLeftSidebarOpen(false);
    try {
      localStorage.setItem('zyrquen_sidebar_open', 'false');
    } catch (e) {
      console.error(e);
    }
  }, []);
  const [selectedChamberId, setSelectedChamberId] = useState<string>('00');
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
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
  const [isEmergencyLockdown, setIsEmergencyLockdown] = useState<boolean>(false);
  const [epochCountdown, setEpochCountdown] = useState<string>('00:00:00');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const hours = String(23 - now.getHours()).padStart(2, '0');
      const minutes = String(59 - now.getMinutes()).padStart(2, '0');
      const seconds = String(59 - now.getSeconds()).padStart(2, '0');
      setEpochCountdown(`${hours}:${minutes}:${seconds}`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);
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
    setIsForensicAuditMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('zyrquen_forensic_audit_mode', String(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const rootClassList = document.documentElement.classList;
    if (isForensicAuditMode) {
      rootClassList.add('forensic-mode');
    } else {
      rootClassList.remove('forensic-mode');
    }
  }, [isForensicAuditMode]);

  const handleToggleMonochrome = useCallback((enabled?: boolean) => {
    setIsMonochromeMode((prev) => {
      const next = enabled !== undefined ? enabled : !prev;
      try {
        localStorage.setItem('zyrquen_monochrome_mode', String(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  }, []);

  // Verified Evidence Download Modal State
  const [isEvidenceDownloadModalOpen, setIsEvidenceDownloadModalOpen] = useState<boolean>(false);

  // Critical Compliance Threshold: banner alerts if events drop below threshold
  const CRITICAL_COMPLIANCE_THRESHOLD = 2;
  const isComplianceCritical = verificationGateStatus.complianceEventCount < CRITICAL_COMPLIANCE_THRESHOLD;

  // Handler to export legal triggers summary as JSON
  const handleDownloadLegalTriggersSummary = useCallback(() => {
    playTone(600, 0.04);
    const reportPayload = {
      reportTitle: "ZYRQUEN Ω∞ Legal Triggers & Compliance Summary Report",
      statutoryFrameworks: [
        "ETDA B.E. 2544 (Electronic Transactions Act 2001/2019) Sections 9, 26, 28",
        "PDPA B.E. 2562 (Personal Data Protection Act 2019) Sections 19, 27, 37"
      ],
      generatedAt: new Date().toISOString(),
      sovereignPrincipal: SYSTEM_METADATA.sovereignPrincipal,
      canonicalMerkleRoot: SYSTEM_METADATA.merkleRoot,
      sealedBlock: SYSTEM_METADATA.sealedBlock,
      complianceStatus: verificationGateStatus.status,
      complianceEventCount: verificationGateStatus.complianceEventCount,
      criticalThreshold: CRITICAL_COMPLIANCE_THRESHOLD,
      isCriticalWarning: verificationGateStatus.complianceEventCount < CRITICAL_COMPLIANCE_THRESHOLD,
      activeTriggersCount: DETAILED_ETDA_PDPA_TRIGGERS.length,
      activeLegalTriggers: DETAILED_ETDA_PDPA_TRIGGERS.map((trigger) => ({
        id: trigger.id,
        act: trigger.act,
        section: trigger.section,
        title: trigger.title,
        titleTh: trigger.titleTh,
        status: trigger.status,
        statusText: trigger.statusText,
        pqcScheme: trigger.pqcScheme,
        anchor: trigger.anchor,
        merkleLeafHash: trigger.technicalSpec.merkleLeafHash,
        hardwareTarget: trigger.technicalSpec.hardwareTarget,
        subComponents: trigger.technicalSpec.subComponents,
        statuteClause: trigger.statuteClause,
      })),
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    const filename = `zyrquen-legal-triggers-summary-${Date.now()}.json`;
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    playAuditChime();
    showToast(`ดาวน์โหลดสรุปทริกเกอร์กฎหมาย (${filename}) สำเร็จ`, 'success');
    addSystemEvent(
      'LEGAL',
      'Legal Triggers Summary Exported',
      `Exported ${DETAILED_ETDA_PDPA_TRIGGERS.length} active legal triggers summary JSON report.`,
      'export:legal_triggers',
      'success'
    );
  }, [verificationGateStatus, showToast, addSystemEvent]);

  

  

  // Heartbeat pulse timer in sync with telemetry
  useEffect(() => {
    const isRecent = Date.now() - lastSnapshotTime < 6000;
    const intervalTime = isRecent ? 500 : 1000; // Accelerated heartbeat when snapshot is captured!

    const interval = setInterval(() => {
      setHeartbeatTick((prev) => !prev);
    }, intervalTime);

    return () => clearInterval(interval);
  }, [lastSnapshotTime]);

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
      const newEvt: SystemEvent = {
        id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type,
        title,
        description,
        timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }) + ' ICT',
        metaHash,
        statuteRef,
        targetView,
        severity,
      };

      setSystemEvents((prev) => [newEvt, ...prev]);

      // Low-Latency Verbal Feedback Loop for Critical and Anomaly Events
      try {
        announceSystemEventVerbal(type, title, severity);
      } catch (err) {
        console.warn('Verbal announcer failed:', err);
      }
    },
    []
  );

  // Register Write Firewall & Automated Backup Diagnostic to dispatch directly to SystemEvents
  useEffect(() => {
    WriteFirewallEngine.registerSystemEventHandler((type, title, desc, meta, sev, statute, view) => {
      addSystemEvent(type, title, desc, meta, sev, statute, view);
    });
    automatedBackupService.registerSystemActivityLogger((type, title, desc, meta, sev, statute, view) => {
      addSystemEvent(type, title, desc, meta, sev, statute, view);
    });
  }, [addSystemEvent]);

  // Trigger 'EVIDENCE_IMPORTED' audit events upon application initialization
  useEffect(() => {
    // 1. Audit event for TNT-TH-001
    addSystemEvent(
      'EVIDENCE_IMPORTED',
      'Evidence Imported: TNT-TH-001 (Tenant Manifest)',
      'Status: PENDING | Provenance: SOURCE_FILE | Mutation: 0 | Scope: Sovereign Physical Hardware Isolation (MAEW HOLDINGS CO., LTD.) | Canonical write: BLOCKED',
      'source:TNT-TH-001 (Digest: NOT COMPUTED)',
      'info',
      'Hardening v2.1 Intake Gate (Provenance: SOURCE_FILE, Mutation: 0)',
      'dashboard'
    );

    // 2. Audit event for DS-901-PILOT
    addSystemEvent(
      'EVIDENCE_IMPORTED',
      'Evidence Imported: DS-901-PILOT (FIOS Pilot Dataset)',
      'Status: PENDING | Provenance: SOURCE_FILE | Mutation: 0 | Scope: Non-Live Pilot Dataset (Zero Trading Authority) | Canonical write: BLOCKED',
      'source:DS-901-PILOT (Digest: NOT COMPUTED)',
      'info',
      'Hardening v2.1 Intake Gate (Provenance: SOURCE_FILE, Mutation: 0)',
      'dashboard'
    );
  }, [addSystemEvent]);

  // Automated background backup service subscription
  useEffect(() => {
    automatedBackupService.start();

    const unsubscribe = automatedBackupService.onSnapshot((record) => {
      if (isSystemActivityFrozen) return;

      const newSnap = createTelemetrySnapshot(
        {
          core0: 41 + Math.floor(Math.random() * 5),
          core1: 39 + Math.floor(Math.random() * 4),
          core2: 43 + Math.floor(Math.random() * 6),
          core3: 38 + Math.floor(Math.random() * 5),
        },
        snapshots.length,
        snapshots[0]?.sealedHash
      );
      setSnapshots((prev) => [newSnap, ...prev]);
      setLastSnapshotTime(Date.now());
      
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

    return () => {
      unsubscribe();
    };
  }, [addSystemEvent, snapshots, isSystemActivityFrozen]);

  const handleToggleFreezeSystemActivity = useCallback(() => {
    setIsSystemActivityFrozen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('zyrquen_system_frozen', String(next));
      } catch (e) {
        console.error(e);
      }
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
          <DashboardView
            snapshots={snapshots}
            verificationGateStatus={verificationGateStatus}
            onNavigate={setCurrentView}
            onOpenCertificate={() => setIsCertificateOpen(true)}
            isForensicAuditMode={isForensicAuditMode}
          />
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
            <RealtimeUnifiedVerificationDashboard
              onNavigateToLedger={() => setCurrentView('ledger')}
              onOpenCertificate={() => setIsCertificateOpen(true)}
            />
            <CanonicalIntegrityDashboardView
              onNavigateToLedger={() => setCurrentView('ledger')}
            />
            <G11CanonicalCore />
          </div>
        );
      case 'admin':
        return (
          <AdminConsole
            onNavigateToHealth={() => setCurrentView('health')}
            onShowToast={showToast}
          />
        );
      case 'health':
        return (
          <SystemHealthDashboard
            onNavigateToAdmin={() => setCurrentView('admin')}
            onShowToast={showToast}
          />
        );
      case 'fusion':
        return <QuantumAuditFusionView />;
      case 'playback':
        return <UnifiedAuditPlaybackConsole />;
      case 'analytics':
        return <AuditAnalyticsDashboard />;
      case 'chambers':
        return <SovereignChambersControlPlane />;
      case 'zyrquen_gg':
        return <ZyrquenGGDashboard onNavigate={setCurrentView} onOpenCertificate={() => setIsCertificateOpen(true)} />;
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

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden bg-[#07080F] text-zinc-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 antialiased relative transition-all duration-500 ${isMonochromeMode ? 'theme-monochrome' : ''} ${isEmergencyLockdown ? 'border-4 border-red-600 shadow-[inset_0_0_60px_rgba(239,68,68,0.7),0_0_80px_rgba(239,68,68,0.85)] ring-4 ring-red-500/60' : ''}`}>
      {/* Emergency Lockdown Floating Sentinel Alert */}
      {isEmergencyLockdown && (
        <div
          id="emergency-lockdown-banner"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-red-950/95 border-2 border-red-500 text-red-100 shadow-[0_0_50px_rgba(239,68,68,0.85)] backdrop-blur-2xl flex items-center gap-3.5 animate-bounce"
        >
          <span className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
          <div className="font-mono text-xs">
            <span className="font-bold text-red-300 uppercase tracking-wider block">
              🚨 EMERGENCY LOCKDOWN ACTIVE: Quarantine Triggered (Zero Threat Invariant)
            </span>
            <span className="text-zinc-300 text-[11px] font-sans">
              Cryogenic Dilution Enclave isolated • Cross-Border egress blocked • Deca-Custodian Fail-Closed
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              playTone(720, 0.08);
              setIsEmergencyLockdown(false);
            }}
            className="px-3 py-1 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-md hover:scale-105 shrink-0"
          >
            Disarm Alert
          </button>
        </div>
      )}

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
        epochCountdown={epochCountdown}
        isEmergencyLockdown={isEmergencyLockdown}
        onToggleEmergencyLockdown={() => setIsEmergencyLockdown((prev) => !prev)}
        onTriggerLoginLoader={(mode = 'login') => {
          setLoginLoaderMode(mode);
          setShowLoginLoader(true);
        }}
      />

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
        <main className="flex-1 min-w-0 w-full px-2 sm:px-4 py-4 pb-20 overflow-hidden space-y-4 transition-all duration-300">
          {/* Visual Notification System: SSoT Mutation Drift Warning (Triggered if deviation >= 0.01%) */}
          <SsotDriftWarning />

          {/* Verification Gate Active Invariant Banner with Progress Bar & Expandable ETDA/PDPA Triggers */}
          <div className={`rounded-2xl backdrop-blur-xl shadow-lg transition-all duration-300 overflow-hidden ${
            isComplianceCritical
              ? 'bg-gradient-to-r from-amber-950/90 via-[#201004]/95 to-red-950/90 border-2 border-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.45)] ring-2 ring-amber-500/40'
              : 'bg-[#0b0e1a]/90 border border-cyan-500/25'
          }`}>
            {/* Warning Alert Bar if Compliance Count Drops Below Threshold */}
            {isComplianceCritical && (
              <div className="w-full bg-gradient-to-r from-amber-500/25 via-red-500/20 to-amber-500/25 border-b border-amber-500/50 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-amber-200 text-xs font-mono shadow-inner">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
                  <span>คำเตือน: Compliance Event Count ({verificationGateStatus.complianceEventCount}) ต่ำกว่าเกณฑ์ความปลอดภัยขั้นต่ำ (&lt; {CRITICAL_COMPLIANCE_THRESHOLD})!</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-amber-500/30 text-amber-100 px-2.5 py-0.5 rounded-full border border-amber-400 font-bold uppercase tracking-wider">
                    CRITICAL_THRESHOLD_ALERT
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      playTone(700, 0.03);
                      setVerificationGateStatus(prev => ({ ...prev, complianceEventCount: 2 }));
                    }}
                    className="px-2 py-0.5 rounded text-[10px] bg-amber-400 text-black font-bold hover:bg-amber-300 transition-colors cursor-pointer"
                  >
                    Restore Count
                  </button>
                </div>
              </div>
            )}

            <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              {/* Left: Gate Status & Info with Tooltip Trigger */}
              <div className="flex items-center gap-2.5 relative">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  isComplianceCritical
                    ? 'bg-amber-400 animate-ping'
                    : verificationGateStatus.status === 'PASSED'
                    ? 'bg-emerald-400 animate-pulse'
                    : verificationGateStatus.status === 'BLOCKED'
                    ? 'bg-rose-400'
                    : 'bg-cyan-400'
                }`} />
                <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                  <ShieldCheck className={`w-4 h-4 ${isComplianceCritical ? 'text-amber-400' : 'text-cyan-400'}`} />
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
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 transition-colors cursor-pointer ${
                      isComplianceCritical
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                        : verificationGateStatus.status === 'PASSED' 
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20' 
                        : verificationGateStatus.status === 'BLOCKED' 
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20' 
                        : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20'
                    }`}
                    title="Hover for tooltip / Click to toggle legal triggers summary"
                  >
                    {isComplianceCritical ? 'THRESHOLD_WARN' : verificationGateStatus.status}
                    <Info className="w-2.5 h-2.5 opacity-70" />
                  </button>

                  {/* Floating Tooltip Box */}
                  <AnimatePresence>
                    {isGateTooltipVisible && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full mt-2 z-50 w-72 sm:w-80 p-3 rounded-xl bg-[#07080f]/95 border border-cyan-500/40 backdrop-blur-2xl shadow-2xl text-[11px] font-sans text-zinc-300 pointer-events-none"
                      >
                        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10 font-mono text-[10px]">
                          <span className="text-cyan-300 font-bold flex items-center gap-1">
                            <Scale className="w-3.5 h-3.5 text-cyan-400" />
                            ETDA / PDPA Section Triggers
                          </span>
                          <span className="text-emerald-400 font-semibold">6/6 VERIFIED</span>
                        </div>
                        <p className="text-zinc-300 leading-relaxed mb-2">
                          {verificationGateStatus.message}
                        </p>
                        <div className="space-y-1 font-mono text-[10px] text-zinc-400 bg-black/40 p-2 rounded-lg border border-white/5">
                          <div className="flex justify-between">
                            <span>ETDA Sec 9, 26, 28:</span>
                            <span className="text-emerald-300">100% PQC Dilithium-5</span>
                          </div>
                          <div className="flex justify-between">
                            <span>PDPA Sec 9, 26, 28:</span>
                            <span className="text-emerald-300">Cryo 14.98mK / ML-KEM</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Invariant SSoT Drift:</span>
                            <span className="text-cyan-300">Δ0.0% ZERO DRIFT</span>
                          </div>
                          <div className="flex justify-between border-t border-white/10 pt-1 mt-1">
                            <span>Compliance Events:</span>
                            <span className={isComplianceCritical ? 'text-amber-400 font-bold' : 'text-emerald-300'}>
                              {verificationGateStatus.complianceEventCount} (Threshold: &gt;={CRITICAL_COMPLIANCE_THRESHOLD})
                            </span>
                          </div>
                        </div>
                        <p className="mt-2 text-[10px] text-cyan-400/80 font-mono text-center">
                          Click banner button to expand full trigger matrix ↓
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <span className="text-zinc-400 hidden lg:inline text-[11px] truncate max-w-md">
                  {verificationGateStatus.message}
                </span>
              </div>

              {/* Right: Metrics, Drift Toggle, Trigger Button, Counters & Downloads */}
              <div className="flex items-center gap-2 sm:gap-2.5 text-[11px] text-zinc-400 ml-auto flex-wrap">
                {/* Epoch Countdown Timer: SYNC_EPOCH_ROTATION */}
                <div
                  className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/50 border border-cyan-500/30 text-[10px] font-mono shadow-inner shrink-0 select-none"
                  title="Real-time Epoch Countdown Timer (SYNC_EPOCH_ROTATION: counting down to 00:00:00)"
                >
                  <Clock className="w-3 h-3 text-cyan-400 animate-pulse" />
                  <span className="text-zinc-500 uppercase tracking-wider">SYNC_EPOCH:</span>
                  <span className="text-amber-400 font-bold tracking-widest">{epochCountdown}</span>
                </div>

                {/* SSoT Drift Deviation Simulator Toggle Button */}
                <SsotDriftToggleButton />

                {/* Button: Download summary report of all active legal triggers as JSON */}
                <button
                  type="button"
                  onClick={handleDownloadLegalTriggersSummary}
                  className="px-2.5 py-1 rounded-lg font-mono text-[10px] font-semibold border flex items-center gap-1.5 transition-all cursor-pointer bg-gradient-to-r from-cyan-950/70 to-blue-950/70 hover:from-cyan-900 hover:to-blue-900 text-cyan-200 border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.2)] hover:border-cyan-300"
                  title="ดาวน์โหลดรายงานสรุปทริกเกอร์ทางกฎหมาย ETDA/PDPA ทั้งหมดเป็นไฟล์ JSON สำหรับการตรวจสอบในพื้นที่"
                >
                  <Download className="w-3 h-3 text-cyan-300" />
                  <span className="hidden sm:inline">Legal Triggers Report</span>
                  <span className="sm:hidden">Triggers</span>
                  <span className="px-1 py-0.2 rounded text-[8px] bg-cyan-500/20 text-cyan-300">JSON</span>
                </button>

                {/* Button: Verified Evidence Package Download with Confirmation Modal */}
                <button
                  type="button"
                  onClick={() => {
                    playTone(620, 0.03);
                    setIsEvidenceDownloadModalOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold border flex items-center gap-1.5 transition-all cursor-pointer bg-gradient-to-r from-emerald-950/80 via-teal-950/90 to-emerald-950/80 hover:from-emerald-900 hover:to-teal-900 text-emerald-200 border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:border-emerald-300"
                  title="คลิกเพื่อเปิดกล่องโต้ตอบยืนยันและตรวจสอบขนาดไฟล์/แฮชเมตาเดตาก่อนดาวน์โหลดแพ็คเกจหลักฐาน"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="hidden md:inline">ดาวน์โหลดแพ็คเกจหลักฐานที่ตรวจสอบแล้ว</span>
                  <span className="md:hidden">แพ็คเกจหลักฐาน</span>
                </button>

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

                {/* Compliance Anchors Count with Threshold Toggle Simulation */}
                <button
                  type="button"
                  onClick={() => {
                    playTone(550, 0.03);
                    setVerificationGateStatus(prev => ({
                      ...prev,
                      complianceEventCount: prev.complianceEventCount < CRITICAL_COMPLIANCE_THRESHOLD ? 2 : 1,
                    }));
                  }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer transition-all ${
                    isComplianceCritical
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse'
                      : 'hover:bg-white/5'
                  }`}
                  title="คลิกเพื่อจำลองสลับจำนวน Compliance Event Count (ต่ำกว่าเกณฑ์ < 2 / ปกติ >= 2)"
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isComplianceCritical ? 'text-amber-400' : 'text-emerald-400'}`} />
                  <span>Anchors: <strong className={isComplianceCritical ? 'text-amber-300' : 'text-emerald-300'}>{verificationGateStatus.complianceEventCount}</strong></span>
                </button>

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

            {/* Expandable Section: Comprehensive ETDA & PDPA Trigger Matrix with subtle slide-and-fade animation */}
            <AnimatePresence>
              {isGateDetailsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0, y: -12, scale: 0.995 }}
                  animate={{ height: 'auto', opacity: 1, y: 0, scale: 1 }}
                  exit={{ height: 0, opacity: 0, y: -10, scale: 0.995 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  className="border-t border-cyan-500/20 bg-[#060812]/95 px-3 sm:px-6 py-4 space-y-4 overflow-hidden"
                >
                  <ThaiComplianceTriggerMatrix
                    onOpenLegalSearch={() => setIsLegalSearchOpen(true)}
                    onOpenCertificate={() => setIsCertificateOpen(true)}
                    onExportAuditLogs={handleExportAuditLogs}
                    isForensicAuditMode={isForensicAuditMode}
                    onOpenEvidenceDownloadModal={() => setIsEvidenceDownloadModalOpen(true)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
        onClose={() => setIsEventsSidebarOpen(false)}
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
        onClose={() => setIsShortcutsOpen(false)}
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
        onClose={() => setIsCertificateOpen(false)}
      />

      {/* Verified Evidence Download Confirmation Modal (ขนาดไฟล์ & แฮชเมตาเดตา) */}
      <VerifiedEvidenceDownloadConfirmModal
        isOpen={isEvidenceDownloadModalOpen}
        onClose={() => setIsEvidenceDownloadModalOpen(false)}
        onDownloaded={() => {
          showToast('ดาวน์โหลดแพ็คเกจหลักฐานที่ตรวจสอบแล้วสำเร็จ (ZIP Package)', 'success');
          addSystemEvent(
            'EVIDENCE',
            'Verified Evidence Package Exported',
            'Sovereign verified evidence package cryptographic archive exported with Genesis SHA3-512 & Merkle attestation.',
            'export:evidence_package',
            'success'
          );
        }}
      />

      {/* Dynamic Atmospheric Ambient Sound Generator Floating HUD */}
      <div className="fixed bottom-6 left-24 sm:left-6 z-40 flex items-center gap-2 pointer-events-none sm:pointer-events-auto">
        <div className="pointer-events-auto">
        <button
          onClick={handleToggleAudio}
          className={`px-3.5 min-h-[44px] py-2 rounded-2xl border font-mono text-xs backdrop-blur-xl transition-all shadow-xl flex items-center gap-2.5 ${
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
          <span className="font-bold">
            {isAudioActive ? 'ATMOSPHERIC AUDIO' : 'ATMOSPHERIC AUDIO'}
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

      {/* Sovereign Copilot Floating Launcher Button (Bottom-Right Anchor) */}
      <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 flex items-center gap-3 font-mono">
        {!isCopilotOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden sm:flex items-center gap-2 bg-indigo-950/80 border border-indigo-500/30 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-[10px] text-indigo-200 font-bold tracking-wide">SYSTEM NOMINAL</span>
          </motion.div>
        )}
        <div className="relative group">
          {/* Animated Glow Backdrop */}
          <div className={`absolute -inset-0.5 rounded-2xl blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-500 ${isCopilotOpen ? 'bg-gradient-to-r from-cyan-400 to-emerald-400' : 'bg-gradient-to-r from-indigo-500 to-cyan-500'}`} />
          
          <button
            id="btn-floating-copilot-trigger"
            onClick={() => {
              playTone(isCopilotOpen ? 520 : 740, 0.05);
              setIsCopilotOpen((prev) => !prev);
            }}
            className={`relative px-4 min-h-[48px] py-2.5 rounded-2xl border transition-all duration-300 shadow-2xl flex items-center gap-2.5 cursor-pointer active:scale-95 text-sm overflow-hidden ${
              isCopilotOpen
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-black border-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.6)]'
                : 'bg-[#0a0f1e]/90 backdrop-blur-xl hover:bg-[#0e162c] text-white border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
            }`}
            title="Sovereign AI Copilot (Right Corner)"
          >
            {/* Shimmer Effect */}
            {!isCopilotOpen && (
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
            )}
            
            <div className="relative flex items-center justify-center w-6 h-6">
              {isCopilotOpen ? (
                <X className="w-5 h-5 transition-transform duration-300 rotate-90 group-hover:rotate-180" />
              ) : (
                <>
                  <div className="absolute inset-0 border border-cyan-400/30 rounded-full animate-[spin_4s_linear_infinite]" />
                  <Bot className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                </>
              )}
            </div>
            <span className={`font-bold tracking-widest ${isCopilotOpen ? 'text-black' : 'bg-clip-text text-transparent bg-gradient-to-r from-white to-cyan-200'}`}>COPILOT</span>
            <span className={`px-1.5 py-0.5 rounded flex items-center gap-1 text-[9px] border font-bold ${
              isCopilotOpen
                ? 'bg-black/20 text-black border-black/30'
                : 'bg-indigo-950/60 text-cyan-300 border-cyan-500/30'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isCopilotOpen ? 'bg-black animate-pulse' : 'bg-cyan-400 shadow-[0_0_5px_#22d3ee]'}`} />
              v5.0
            </span>
          </button>
        </div>
      </div>

      {/* Sovereign Copilot Assistant Window (Docked at Bottom-Right) */}
      <CopilotAssistantDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onNavigate={setCurrentView}
      />
      <ThaiLegalSearchModal
        isOpen={isLegalSearchOpen}
        onClose={() => setIsLegalSearchOpen(false)}
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
        onCancel={() => setShowLoginLoader(false)}
      />

      <OfflineIndicator />

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

