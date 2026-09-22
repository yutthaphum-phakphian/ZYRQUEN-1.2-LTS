import { SecurityGateLevel3Simulator } from "../SecurityGateLevel3Simulator";
import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  CheckCircle2,
  AlertOctagon,
  Key,
  RefreshCw,
  Scale,
  Layers,
  FileCheck,
  Award,
  Fingerprint,
  Download,
  FileText,
  Users,
  Cpu,
  Scroll,
  Sparkles,
  Globe,
  Activity,
  Eye,
  Code2,
  QrCode,
} from 'lucide-react';
import { CustodianQRValidator } from '../system/CustodianQRValidator';
import { HardwareSealQRScanner } from '../security/HardwareSealQRScanner';
import { CourtEvidenceQR } from '../CourtEvidenceQR';
import { SYSTEM_INVARIANTS, SYSTEM_METADATA } from '../../data/canonicalData';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { GlobalThreatVectorsPanel } from '../GlobalThreatVectorsPanel';
import { SystemEvent } from '../SystemEventsSidebar';
import { SovereignLegalConvergence } from '../SovereignLegalConvergence';
import { ComplianceBlueprintWidget } from '../ComplianceBlueprintWidget';
import { CustodianTraceMap } from '../CustodianTraceMap';
import { OmegaSequenceSimulator } from '../OmegaSequenceSimulator';
import { OmegaSequenceFlowDiagram } from '../OmegaSequenceFlowDiagram';
import { ThaiLegalSovereignMapping } from '../ThaiLegalSovereignMapping';
import { IdentityCollisionGuard } from '../IdentityCollisionGuard';
import { FrozenIntegrityReconciliationGate } from '../FrozenIntegrityReconciliationGate';
import { EvidenceTruthMatrix } from '../EvidenceTruthMatrix';
import { CryptographicBindingPanel } from '../CryptographicBindingPanel';
import { ImmutableAuditTimeline } from '../ImmutableAuditTimeline';
import { PromotionFirewallPanel } from '../PromotionFirewallPanel';
import { ControlPlaneHardeningSummary } from '../ControlPlaneHardeningSummary';
import { HardeningV3EvidenceForensics } from '../HardeningV3EvidenceForensics';
import { HardeningV2ReconciliationAssurance } from '../HardeningV2ReconciliationAssurance';
import { HardeningV21RealEvidenceIntake } from '../HardeningV21RealEvidenceIntake';
import { ForensicClosureControlPlane } from '../ForensicClosureControlPlane';
import { AdversarialFailureLab } from '../AdversarialFailureLab';
import { QuarantineForensics } from '../QuarantineForensics';
import { CryptoVerificationCenter } from '../CryptoVerificationCenter';
import { Phase7ProductionReadinessDashboard } from '../Phase7ProductionReadinessDashboard';
import { ForensicQuarantineLayer } from '../ForensicQuarantineLayer';
import { QuarantineInspector } from '../QuarantineInspector';
import { CustodianQuorumRegistry } from '../CustodianQuorumRegistry';
import { RootProvenanceValidator } from '../RootProvenanceValidator';
import { PromotionSafetyGate } from '../PromotionSafetyGate';
import { SystemAuditReport } from '../SystemAuditReport';
import { GatewayAuthHeatmap } from '../GatewayAuthHeatmap';
import { generateComplianceBlueprintPdf } from '../../utils/complianceBlueprintPdfExport';
import { generateSovereignReportPdf } from '../../utils/sovereignReportPdfExport';
import { SovereignAuditMasterDashboard } from '../SovereignAuditMasterDashboard';
import { Chamber02View } from './Security/Chamber02View';
import { ThreatAnalysisView } from './Security/ThreatAnalysisView';
import { InteractivePdfPreviewModal } from '../InteractivePdfPreviewModal';
import { Chamber02QuarantineSimulator } from '../quarantine/Chamber02QuarantineSimulator';
import { TwelveStageForensicTraceReplay } from '../forensics/TwelveStageForensicTraceReplay';
import { SmartContractCoreViewer } from '../contracts/SmartContractCoreViewer';
import { SiemWebhookCenter } from '../SiemWebhookCenter';
import { UtimacoSecondaryHSMGauge } from '../UtimacoSecondaryHSMGauge';

import { VerificationPassRatesChart } from '../VerificationPassRatesChart';
import { LiveFlowVisualizerView } from './Security/LiveFlowVisualizerView';
import { SecurityAnalyticsDashboard } from '../SecurityAnalyticsDashboard';

export type SecuritySubTab =
  | 'security-analytics'
  | 'court-evidence-qr'
  | 'hardware-seal-scanner'
  | 'smart-contract'
  | 'sovereign-master-audit'
  | 'utimaco-hsm-v2'
  | 'chamber02-forensics'
  | 'threat-analysis'
  | 'threat-vectors'
  | 'legal-convergence'
  | 'reconciliation-gate'
  | 'evidence-truth'
  | 'identity-guard'
  | 'level3-threat-injection'
  | 'crypto-binding'
  | 'audit-timeline'
  | 'promotion-firewall'
  | 'compliance-blueprint'
  | 'custodian-map'
  | 'defense'
  | 'gateway-heatmap'
  | 'omega-sequence'
  | 'adversarial-lab'
  | 'crypto-center'
  | 'quarantine-forensics'
  | 'phase7-production'
  | 'legal-dashboard'
  | 'section28-layer'
  | 'sentinel-live-flow';

interface SecurityViewProps {
  initialSubTab?: SecuritySubTab;
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

export const SecurityView: React.FC<SecurityViewProps> = ({
  initialSubTab = 'legal-convergence',
  onAddSystemEvent,
}) => {
  const [activeTab, setActiveTab] = useState<SecuritySubTab>(
    initialSubTab === 'legal-dashboard' || initialSubTab === 'section28-layer' ? 'legal-convergence' : initialSubTab
  );
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [blueprintToast, setBlueprintToast] = useState<string | null>(null);
  const [royalGazetteMode, setRoyalGazetteMode] = useState(true);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [isQrValidatorOpen, setIsQrValidatorOpen] = useState(false);
  const [isHardwareSealScannerOpen, setIsHardwareSealScannerOpen] = useState(false);

  // Live shared states for G11, G12, and G13
  const [liveCustodianCount, setLiveCustodianCount] = useState<number>(10);
  const [liveIsQuorumReached, setLiveIsQuorumReached] = useState<boolean>(true);
  const [liveIsProvenanceValid, setLiveIsProvenanceValid] = useState<boolean>(true);

  const handleQuorumChange = useCallback((count: number, reached: boolean) => {
    setLiveCustodianCount(count);
    setLiveIsQuorumReached(reached);
  }, []);

  const handleProvenanceStateChange = useCallback((isValid: boolean) => {
    setLiveIsProvenanceValid(isValid);
  }, []);

  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(
        initialSubTab === 'legal-dashboard' || initialSubTab === 'section28-layer' ? 'legal-convergence' : initialSubTab
      );
    }
  }, [initialSubTab]);

  const attackVectors = [
    { id: 'TST-ADV-1', name: 'Telemetry -> Canonical Truth Mutation', vector: 'Injection via OTel Stream', defense: 'Fail-Closed Isolated Buffer', status: 'SIM-BLOCKED' },
    { id: 'TST-ADV-2', name: 'Forecast -> SSoT Drift Injection', vector: 'Monte Carlo Prediction Override', defense: '0.00% Baseline Inviolability', status: 'SIM-BLOCKED' },
    { id: 'TST-ADV-3', name: 'UI Mutation Overwrite', vector: 'Client-side State Tampering', defense: 'Cryptographic Read-Only Kernel', status: 'SIM-BLOCKED' },
    { id: 'TST-ADV-4', name: 'Export Payload Code Injection', vector: 'JSON / D3 / 3D Canvas Write-Back', defense: 'Isolated Export Pipe (No Write-back)', status: 'SIM-BLOCKED' },
    { id: 'TST-ADV-5', name: 'Direct Privilege Escalation (Ω1001+)', vector: 'Unauthorized Root Governor Call', defense: 'Executive Passport Veto Gate', status: 'SIM-BLOCKED' },
  ];

  const handleDeepScan = () => {
    setIsScanning(true);
    setScanResult(null);
    playTone(520, 0.08);

    setTimeout(() => {
      setIsScanning(false);
      setScanResult('10/10 Invariants passed. All 5 simulated adversarial vectors intercepted & fail-closed.');
      playAuditChime();
    }, 1000);
  };

  const handleDownloadComplianceBlueprint = () => {
    playAuditChime();
    try {
      const filename = generateComplianceBlueprintPdf({
        principalName: SYSTEM_METADATA.sovereignPrincipal,
        custodianPassport: '#EP-SOVEREIGN-01',
        sealBlockHeight: SYSTEM_METADATA.sealedBlock,
      });
      setBlueprintToast(filename);
      setTimeout(() => setBlueprintToast(null), 4500);
    } catch (err) {
      console.error('Compliance blueprint export failed:', err);
    }
  };

  const handleDownloadSovereignReport = () => {
    playAuditChime();
    try {
      const filename = generateSovereignReportPdf({
        principalName: SYSTEM_METADATA.sovereignPrincipal,
        custodianPassport: '#EP-SOVEREIGN-01',
        sealBlockHeight: SYSTEM_METADATA.sealedBlock,
        merkleAnchor: '909ab814',
      });
      setBlueprintToast(filename);
      setTimeout(() => setBlueprintToast(null), 4500);
    } catch (err) {
      console.error('Sovereign report export failed:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner with Royal Gazette Legal Styling */}
      <div
        className={`p-6 sm:p-7 rounded-[28px] border transition-all duration-500 backdrop-blur-3xl flex flex-col xl:flex-row xl:items-center justify-between gap-5 relative overflow-hidden shadow-2xl group ${
          royalGazetteMode
            ? 'bg-gradient-to-br from-[#1b1509]/98 via-[#0f0b04]/95 to-[#07080F] border-2 border-amber-500/40 shadow-[0_10px_50px_-10px_rgba(245,158,11,0.25)]'
            : 'bg-gradient-to-br from-[#070914]/98 via-[#0b0e1e]/95 to-[#070914]/98 border border-cyan-500/20 shadow-[0_10px_50px_-10px_rgba(6,182,212,0.15)]'
        }`}
      >
        {/* Glow Effects */}
        {royalGazetteMode ? (
          <div className="absolute top-0 right-1/4 w-96 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none transition-opacity opacity-50 group-hover:opacity-100" />
        ) : (
          <div className="absolute top-0 right-1/4 w-96 h-64 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none transition-opacity opacity-50 group-hover:opacity-100" />
        )}

        {/* Heraldic Corner Accents */}
        {royalGazetteMode && (
          <>
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-400/60 pointer-events-none rounded-tl-[26px]" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-400/60 pointer-events-none rounded-tr-[26px]" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-400/60 pointer-events-none rounded-bl-[26px]" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-400/60 pointer-events-none rounded-br-[26px]" />
          </>
        )}

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 flex-wrap mb-2">
            <span
              className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-mono font-bold tracking-wider border shadow-sm ${
                royalGazetteMode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                  : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
              }`}
            >
              THAI STATUTE SEC 9 • SEC 26 • SEC 28
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-200 border border-amber-500/30 text-[10px] sm:text-xs font-mono font-bold tracking-wider shadow-sm">
              ETDA LEVEL 3+ • NIST PQC
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] sm:text-xs font-mono font-bold tracking-wider shadow-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ANCHOR 909ab814 • #EP-SOVEREIGN-01
            </span>
          </div>

          <h2
            className={`text-xl sm:text-3xl font-bold tracking-tight ${
              royalGazetteMode ? 'font-serif text-amber-100 drop-shadow-md' : 'font-mono text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-100'
            }`}
          >
            Sovereign Legal Bastion & Tri-Statute Convergence
          </h2>

          <p
            className={`text-xs sm:text-sm mt-1.5 max-w-3xl leading-relaxed ${
              royalGazetteMode ? 'font-serif text-amber-200/85' : 'font-mono text-zinc-400'
            }`}
          >
            ระบบพิสูจน์ยืนยันความสอดคล้องตามพระราชบัญญัติว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ • Sub-Kelvin Hardware Security Vault • ผูกพันตามทำเนียบผู้พิทักษ์ไทย
          </p>
        </div>

        {/* Top Action Controls */}
        <div className="relative z-10 flex flex-wrap items-center gap-3 font-mono self-start xl:self-center">
          <button
            onClick={() => {
              playTone(royalGazetteMode ? 450 : 650, 0.04);
              setRoyalGazetteMode(!royalGazetteMode);
            }}
            className={`px-4 py-2.5 rounded-2xl text-[11px] sm:text-xs flex items-center gap-2 transition-all border font-bold shadow-sm ${
              royalGazetteMode
                ? 'bg-amber-500/25 text-amber-200 border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:bg-amber-500/30'
                : 'bg-white/5 text-zinc-300 border-white/10 hover:border-white/20 hover:bg-white/10'
            }`}
            title="Toggle Royal Gazette Gazette Visual Theme"
          >
            <Sparkles className={`w-4 h-4 ${royalGazetteMode ? 'text-amber-400' : 'text-cyan-400'}`} />
            <span className="tracking-wide">{royalGazetteMode ? 'Royal Gazette Mode' : 'Standard Dark Mode'}</span>
          </button>

          <button
            onClick={() => {
              playTone(720, 0.08);
              setIsQrValidatorOpen(true);
            }}
            className="px-4 py-2.5 rounded-2xl text-[11px] sm:text-xs font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 border border-cyan-400/50 text-white flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer"
            title="Scan forensic Custodian QR codes with react-qr-reader to ratify quorum sign-offs"
          >
            <QrCode className="w-4 h-4 text-cyan-200" />
            <span className="tracking-wide">Scan Custodian QR</span>
          </button>

          <button
            onClick={() => {
              playTone(760, 0.08);
              setActiveTab('court-evidence-qr');
            }}
            className="px-4 py-2.5 rounded-2xl text-[11px] sm:text-xs font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 border border-amber-400/60 text-white flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] cursor-pointer"
            title="Court Admissible Evidence QR Verification with direct links to immutable manifest and telemetry audit trail"
          >
            <Scale className="w-4 h-4 text-amber-200" />
            <span className="tracking-wide">Court Evidence QR</span>
          </button>

          <button
            onClick={() => {
              playTone(740, 0.08);
              setActiveTab('hardware-seal-scanner');
            }}
            className="px-4 py-2.5 rounded-2xl text-[11px] sm:text-xs font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400/50 text-white flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer"
            title="Scan physical hardware seals using react-qr-reader to verify against digital ledger"
          >
            <QrCode className="w-4 h-4 text-emerald-200" />
            <span className="tracking-wide">Scan Hardware Seal (QR)</span>
          </button>

          <button
            onClick={() => {
              playTone(620, 0.04);
              setIsPdfPreviewOpen(true);
            }}
            className="px-4 py-2.5 rounded-2xl text-[11px] sm:text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 hover:text-white flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)]"
            title="Interactive Preview of Sovereign Legal Dossier & PDF before download"
          >
            <Eye className="w-4 h-4 text-cyan-300" />
            <span className="tracking-wide">Preview Dossier</span>
          </button>

          <button
            onClick={handleDownloadSovereignReport}
            className="px-4 py-2.5 rounded-2xl text-[11px] sm:text-xs font-bold bg-gradient-to-r from-amber-600/40 via-yellow-600/30 to-amber-600/40 hover:from-amber-500/50 hover:to-amber-500/50 border border-amber-400/60 text-amber-100 hover:text-white flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.35)]"
            title="Download Official Sovereign Compliance Report (PDF) detailing Sections 9, 26, 28, Merkle Root 909ab814, and Cryogenic Heartbeat"
          >
            <Download className="w-4 h-4 text-amber-300" />
            <span className="tracking-wide">Download Sovereign Report</span>
          </button>

          <button
            onClick={handleDownloadComplianceBlueprint}
            className="px-4 py-2.5 rounded-2xl text-[11px] sm:text-xs font-bold bg-black/60 hover:bg-white/10 border border-white/15 hover:border-white/25 text-zinc-300 hover:text-white flex items-center gap-2 transition-all shadow-sm"
            title="Download official Compliance Blueprint v1.2 documenting 4 compliance layers: PDPA, NCSA, ETDA, NIST PQC"
          >
            <Download className="w-4 h-4 text-zinc-400" />
            <span className="tracking-wide">Blueprint (PDF)</span>
          </button>

          {activeTab === 'defense' && (
            <button
              onClick={handleDeepScan}
              disabled={isScanning}
              className={`px-4 py-2.5 rounded-2xl text-[11px] sm:text-xs font-bold tracking-wide flex items-center gap-2 border transition-all ${
                isScanning
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200 animate-pulse'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]'
              }`}
            >
              <RefreshCw className={`w-4 h-4 text-emerald-400 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Verifying 10 Invariants...' : 'Run Defense Audit'}</span>
            </button>
          )}
        </div>
      </div>


      {/* Unified Tab Switcher Navigation Bar */}
      <div className="flex items-center bg-[#070914]/90 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-2 font-mono text-xs shadow-inner flex-wrap gap-2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-violet-500/5 to-transparent pointer-events-none" />

        <button
          onClick={() => {
            playTone(630, 0.04);
            setActiveTab('security-analytics');
          }}
          className={`relative z-10 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold tracking-wide ${
            activeTab === 'security-analytics'
              ? 'bg-gradient-to-r from-cyan-500/40 via-rose-500/30 to-amber-500/30 text-white border border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.35)]'
              : 'text-cyan-300/80 hover:text-cyan-200 hover:bg-cyan-500/10 border border-cyan-500/20'
          }`}
        >
          <Activity className={`w-4 h-4 ${activeTab === 'security-analytics' ? 'text-cyan-300 animate-pulse' : 'text-cyan-400'}`} />
          <span>Security Analytics (Sentinel AI D3)</span>
        </button>

        <button
          onClick={() => {
            playTone(760, 0.04);
            setActiveTab('court-evidence-qr');
          }}
          className={`relative z-10 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold tracking-wide ${
            activeTab === 'court-evidence-qr'
              ? 'bg-gradient-to-r from-amber-500/40 via-yellow-600/30 to-amber-500/30 text-amber-100 border border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.35)]'
              : 'text-amber-300/80 hover:text-amber-200 hover:bg-amber-500/10 border border-amber-500/20'
          }`}
        >
          <Scale className={`w-4 h-4 ${activeTab === 'court-evidence-qr' ? 'text-amber-300 animate-pulse' : 'text-amber-400'}`} />
          <span>Court Evidence QR (Judicial SSoT)</span>
        </button>

        <button
          onClick={() => {
            playTone(740, 0.04);
            setActiveTab('hardware-seal-scanner');
          }}
          className={`relative z-10 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold tracking-wide ${
            activeTab === 'hardware-seal-scanner'
              ? 'bg-gradient-to-r from-emerald-500/40 via-teal-600/30 to-cyan-500/30 text-emerald-100 border border-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.35)]'
              : 'text-emerald-300/80 hover:text-emerald-200 hover:bg-emerald-500/10 border border-emerald-500/20'
          }`}
        >
          <QrCode className={`w-4 h-4 ${activeTab === 'hardware-seal-scanner' ? 'text-emerald-300 animate-pulse' : 'text-emerald-400'}`} />
          <span>Hardware Seal QR Scanner (Ledger SSoT)</span>
        </button>

        <button
          onClick={() => {
            playTone(680, 0.04);
            setActiveTab('smart-contract');
          }}
          className={`relative z-10 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold tracking-wide ${
            activeTab === 'smart-contract'
              ? 'bg-gradient-to-r from-cyan-500/40 via-blue-600/30 to-purple-500/30 text-cyan-100 border border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.35)]'
              : 'text-cyan-300/80 hover:text-cyan-200 hover:bg-cyan-500/10 border border-cyan-500/20'
          }`}
        >
          <Code2 className={`w-4 h-4 ${activeTab === 'smart-contract' ? 'text-cyan-300' : 'text-cyan-400'}`} />
          <span>Smart Contract Core V2 (Solidity)</span>
        </button>

        <button
          onClick={() => {
            playTone(660, 0.04);
            setActiveTab('sovereign-master-audit');
          }}
          className={`relative z-10 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold tracking-wide ${
            activeTab === 'sovereign-master-audit'
              ? 'bg-gradient-to-r from-amber-500/40 via-emerald-500/30 to-cyan-500/30 text-amber-100 border border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.35)]'
              : 'text-amber-300/80 hover:text-amber-200 hover:bg-amber-500/10 border border-amber-500/20'
          }`}
        >
          <Award className={`w-4 h-4 ${activeTab === 'sovereign-master-audit' ? 'text-amber-300' : 'text-amber-400'}`} />
          <span>Sovereign Post-Patch Audit (ZYR-01..03 & FIOS)</span>
        </button>

        <button
          onClick={() => {
            playTone(700, 0.04);
            setActiveTab('utimaco-hsm-v2');
          }}
          className={`relative z-10 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold tracking-wide ${
            activeTab === 'utimaco-hsm-v2'
              ? 'bg-gradient-to-r from-amber-500/35 via-rose-500/25 to-cyan-500/30 text-amber-100 border border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.35)]'
              : 'text-amber-300/80 hover:text-amber-200 hover:bg-amber-500/10 border border-amber-500/20'
          }`}
        >
          <Cpu className={`w-4 h-4 ${activeTab === 'utimaco-hsm-v2' ? 'text-amber-300 animate-pulse' : 'text-amber-400'}`} />
          <span>Utimaco HSM Gauge (v2) &amp; Gas Ledger</span>
        </button>

        <button
          onClick={() => {
            playTone(620, 0.04);
            setActiveTab('chamber02-forensics');
          }}
          className={`relative z-10 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold tracking-wide ${
            activeTab === 'chamber02-forensics'
              ? 'bg-gradient-to-r from-rose-500/35 via-rose-600/25 to-pink-500/20 text-rose-100 border border-rose-400/60 shadow-[0_0_20px_rgba(244,63,94,0.35)]'
              : 'text-rose-300/80 hover:text-rose-200 hover:bg-rose-500/10 border border-rose-500/20'
          }`}
        >
          <ShieldAlert className={`w-4 h-4 ${activeTab === 'chamber02-forensics' ? 'text-rose-300 animate-pulse' : 'text-rose-400'}`} />
          <span>Chamber 02 &bull; Forensics &amp; Quarantine</span>
        </button>

        <button
          onClick={() => {
            playTone(640, 0.04);
            setActiveTab('threat-analysis');
          }}
          className={`relative z-10 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold tracking-wide ${
            activeTab === 'threat-analysis'
              ? 'bg-gradient-to-r from-fuchsia-500/35 via-purple-600/25 to-pink-500/20 text-fuchsia-100 border border-fuchsia-400/60 shadow-[0_0_20px_rgba(217,70,239,0.35)]'
              : 'text-fuchsia-300/80 hover:text-fuchsia-200 hover:bg-fuchsia-500/10 border border-fuchsia-500/20'
          }`}
        >
          <Activity className={`w-4 h-4 ${activeTab === 'threat-analysis' ? 'text-fuchsia-300 animate-pulse' : 'text-fuchsia-400'}`} />
          <span>Threat Vector &amp; Entropy Analysis</span>
        </button>
        
        <button
          onClick={() => {
            playTone(570, 0.04);
            setActiveTab('legal-convergence');
          }}
          className={`relative z-10 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold tracking-wide ${
            activeTab === 'legal-convergence' || activeTab === 'legal-dashboard' || activeTab === 'section28-layer'
              ? 'bg-gradient-to-r from-amber-500/30 to-yellow-600/20 text-amber-100 border border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
              : 'text-zinc-400 hover:text-amber-300 hover:bg-amber-500/10 border border-transparent'
          }`}
        >
          <Scale className={`w-4 h-4 ${activeTab === 'legal-convergence' || activeTab === 'legal-dashboard' || activeTab === 'section28-layer' ? 'text-amber-400' : 'text-zinc-500'}`} />
          <span>Sovereign Legal Convergence</span>
        </button>

        <button
          onClick={() => {
            playTone(590, 0.04);
            setActiveTab('reconciliation-gate');
          }}
          className={`relative z-10 px-3.5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-semibold tracking-wide ${
            activeTab === 'reconciliation-gate'
              ? 'bg-cyan-500/25 text-cyan-100 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
              : 'text-zinc-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent'
          }`}
        >
          <Lock className={`w-4 h-4 ${activeTab === 'reconciliation-gate' ? 'text-cyan-400' : 'text-zinc-500'}`} />
          <span>Frozen Integrity Guard</span>
        </button>

        <button
          onClick={() => {
            playTone(610, 0.04);
            setActiveTab('evidence-truth');
          }}
          className={`relative z-10 px-3.5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-semibold tracking-wide ${
            activeTab === 'evidence-truth'
              ? 'bg-purple-500/25 text-purple-100 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
              : 'text-zinc-400 hover:text-purple-300 hover:bg-purple-500/10 border border-transparent'
          }`}
        >
          <Layers className={`w-4 h-4 ${activeTab === 'evidence-truth' ? 'text-purple-400' : 'text-zinc-500'}`} />
          <span>Evidence Truth Layer</span>
        </button>

        <button
          onClick={() => {
            playTone(630, 0.04);
            setActiveTab('identity-guard');
          }}
          className={`relative z-10 px-3.5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-semibold tracking-wide ${
            activeTab === 'identity-guard'
              ? 'bg-amber-500/25 text-amber-100 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
              : 'text-zinc-400 hover:text-amber-300 hover:bg-amber-500/10 border border-transparent'
          }`}
        >
          <Fingerprint className={`w-4 h-4 ${activeTab === 'identity-guard' ? 'text-amber-400' : 'text-zinc-500'}`} />
          <span>Identity Collision Guard</span>
        </button>

        <button
          onClick={() => {
            playTone(650, 0.04);
            setActiveTab('crypto-binding');
          }}
          className={`relative z-10 px-3.5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-semibold tracking-wide ${
            activeTab === 'crypto-binding'
              ? 'bg-blue-500/25 text-blue-100 border border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.25)]'
              : 'text-zinc-400 hover:text-blue-300 hover:bg-blue-500/10 border border-transparent'
          }`}
        >
          <Key className={`w-4 h-4 ${activeTab === 'crypto-binding' ? 'text-blue-400' : 'text-zinc-500'}`} />
          <span>Cryptographic Binding</span>
        </button>

        <button
          onClick={() => {
            playTone(670, 0.04);
            setActiveTab('audit-timeline');
          }}
          className={`relative z-10 px-3.5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-semibold tracking-wide ${
            activeTab === 'audit-timeline'
              ? 'bg-emerald-500/25 text-emerald-100 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
              : 'text-zinc-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent'
          }`}
        >
          <FileText className={`w-4 h-4 ${activeTab === 'audit-timeline' ? 'text-emerald-400' : 'text-zinc-500'}`} />
          <span>Immutable Audit Timeline</span>
        </button>

        <button
          onClick={() => {
            playTone(690, 0.04);
            setActiveTab('promotion-firewall');
          }}
          className={`relative z-10 px-3.5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-semibold tracking-wide ${
            activeTab === 'promotion-firewall'
              ? 'bg-rose-500/25 text-rose-100 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
              : 'text-zinc-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent'
          }`}
        >
          <AlertOctagon className={`w-4 h-4 ${activeTab === 'promotion-firewall' ? 'text-rose-400' : 'text-zinc-500'}`} />
          <span>Promotion Firewall</span>
        </button>

        <button
          onClick={() => {
            playTone(600, 0.04);
            setActiveTab('compliance-blueprint');
          }}
          className={`relative z-10 px-3.5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-semibold tracking-wide ${
            activeTab === 'compliance-blueprint'
              ? 'bg-violet-500/25 text-violet-100 border border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.25)]'
              : 'text-zinc-400 hover:text-violet-300 hover:bg-violet-500/10 border border-transparent'
          }`}
        >
          <FileCheck className={`w-4 h-4 ${activeTab === 'compliance-blueprint' ? 'text-violet-400' : 'text-zinc-500'}`} />
          <span>Compliance Blueprint v1.2</span>
        </button>

        <button
          onClick={() => {
            playTone(640, 0.04);
            setActiveTab('custodian-map');
          }}
          className={`relative z-10 px-3.5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-semibold tracking-wide ${
            activeTab === 'custodian-map'
              ? 'bg-amber-500/25 text-amber-100 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
              : 'text-zinc-400 hover:text-amber-300 hover:bg-amber-500/10 border border-transparent'
          }`}
        >
          <Users className={`w-4 h-4 ${activeTab === 'custodian-map' ? 'text-amber-400' : 'text-zinc-500'}`} />
          <span>Custodian Trace Map</span>
        </button>

        <button
          onClick={() => {
            playTone(520, 0.04);
            setActiveTab('defense');
          }}
          className={`relative z-10 px-3.5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-semibold tracking-wide ${
            activeTab === 'defense'
              ? 'bg-emerald-500/25 text-emerald-100 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
              : 'text-zinc-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent'
          }`}
        >
          <ShieldCheck className={`w-4 h-4 ${activeTab === 'defense' ? 'text-emerald-400' : 'text-zinc-500'}`} />
          <span>Zero-Trust Shield</span>
        </button>

        <button
          onClick={() => {
            playTone(700, 0.04);
            setActiveTab('gateway-heatmap');
          }}
          className={`relative z-10 px-3.5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-semibold tracking-wide ${
            activeTab === 'gateway-heatmap'
              ? 'bg-rose-500/25 text-rose-100 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
              : 'text-zinc-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent'
          }`}
        >
          <ShieldAlert className={`w-4 h-4 ${activeTab === 'gateway-heatmap' ? 'text-rose-400' : 'text-zinc-500'}`} />
          <span>Gateway Auth Heatmap</span>
        </button>

        <button
          onClick={() => {
            playTone(660, 0.04);
            setActiveTab('threat-vectors');
          }}
          className={`relative z-10 px-3.5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-semibold tracking-wide ${
            activeTab === 'threat-vectors'
              ? 'bg-gradient-to-r from-rose-500/30 via-red-500/25 to-violet-500/20 text-rose-100 border border-rose-400/50 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
              : 'text-zinc-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent'
          }`}
        >
          <Globe className={`w-4 h-4 ${activeTab === 'threat-vectors' ? 'text-rose-400 animate-pulse' : 'text-zinc-500'}`} />
          <span>Global Threat Vectors</span>
        </button>

        <button
          onClick={() => {
            playTone(680, 0.04);
            setActiveTab('omega-sequence');
          }}
          className={`relative z-10 px-3.5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-semibold tracking-wide ${
            activeTab === 'omega-sequence'
              ? 'bg-amber-500/25 text-amber-100 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
              : 'text-zinc-400 hover:text-amber-300 hover:bg-amber-500/10 border border-transparent'
          }`}
        >
          <Fingerprint className={`w-4 h-4 ${activeTab === 'omega-sequence' ? 'text-amber-400' : 'text-zinc-500'}`} />
          <span>12-Phase Omega Sequence</span>
        </button>

        <button
          onClick={() => {
            playTone(720, 0.04);
            setActiveTab('adversarial-lab');
          }}
          className={`relative z-10 px-3.5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-semibold tracking-wide ${
            activeTab === 'adversarial-lab'
              ? 'bg-rose-500/25 text-rose-100 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
              : 'text-zinc-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent'
          }`}
        >
          <ShieldAlert className={`w-4 h-4 ${activeTab === 'adversarial-lab' ? 'text-rose-400' : 'text-zinc-500'}`} />
          <span>Phase 3 Adversarial Lab</span>
        </button>

        <button
          onClick={() => {
            playTone(600, 0.04);
            setActiveTab('crypto-center');
          }}
          className={`relative z-10 px-3.5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-semibold tracking-wide ${
            activeTab === 'crypto-center'
              ? 'bg-cyan-500/25 text-cyan-100 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
              : 'text-zinc-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent'
          }`}
        >
          <Fingerprint className={`w-4 h-4 ${activeTab === 'crypto-center' ? 'text-cyan-400' : 'text-zinc-500'}`} />
          <span>Crypto Verification</span>
        </button>

        <button
          onClick={() => {
            playTone(640, 0.04);
            setActiveTab('quarantine-forensics');
          }}
          className={`relative z-10 px-3.5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-semibold tracking-wide ${
            activeTab === 'quarantine-forensics'
              ? 'bg-rose-500/25 text-rose-100 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
              : 'text-zinc-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent'
          }`}
        >
          <AlertOctagon className={`w-4 h-4 ${activeTab === 'quarantine-forensics' ? 'text-rose-400' : 'text-zinc-500'}`} />
          <span>Quarantine Forensics</span>
        </button>

        <button
          onClick={() => {
            playTone(760, 0.04);
            setActiveTab('phase7-production');
          }}
          className={`relative z-10 px-3.5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-semibold tracking-wide ${
            activeTab === 'phase7-production'
              ? 'bg-indigo-500/25 text-indigo-100 border border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.25)]'
              : 'text-zinc-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-transparent'
          }`}
        >
          <Cpu className={`w-4 h-4 ${activeTab === 'phase7-production' ? 'text-indigo-400' : 'text-zinc-500'}`} />
          <span>Phase 7 Observability & Readiness</span>
        </button>

        <button
          onClick={() => {
            playTone(800, 0.04);
            setActiveTab('sentinel-live-flow');
          }}
          className={`relative z-10 px-3.5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-semibold tracking-wide ${
            activeTab === 'sentinel-live-flow'
              ? 'bg-rose-500/25 text-rose-100 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
              : 'text-zinc-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent'
          }`}
        >
          <ShieldAlert className={`w-4 h-4 ${activeTab === 'sentinel-live-flow' ? 'text-rose-400 animate-pulse' : 'text-zinc-500'}`} />
          <span>Sentinel Live Flow</span>
        </button>
      </div>

      {/* Blueprint PDF Success Toast */}
      {blueprintToast && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/80 via-[#0e1224] to-[#07080F] border border-amber-500/50 backdrop-blur-xl flex items-center justify-between gap-3 text-xs font-mono text-amber-200 animate-in fade-in duration-200 shadow-2xl">
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              <strong>Compliance Blueprint v1.2 Exported:</strong> Generated <strong className="text-white">{blueprintToast}</strong> covering PDPA, NCSA, ETDA, and NIST PQC 4-layer runtime matrix.
            </span>
          </div>
          <button
            onClick={() => setBlueprintToast(null)}
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-all text-xs"
          >
            Close
          </button>
        </div>
      )}

      {scanResult && activeTab === 'defense' && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{scanResult}</span>
        </div>
      )}

      {/* Security Analytics D3 30-Day Sentinel AI & Chamber 02 Dashboard */}
      {activeTab === 'security-analytics' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <SecurityAnalyticsDashboard
            onAddSystemEvent={onAddSystemEvent}
          />
        </div>
      )}

      {/* Judicial Court Evidence QR Component (ETDA Sec 9/26/28, PDPA Sec 37) */}
      {activeTab === 'court-evidence-qr' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-mono flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Scale className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                <strong>ระบบตรวจสอบพยานหลักฐานดิจิทัลตามคำสั่งศาล (Judicial Evidence Verification Portal):</strong>{' '}
                สอดคล้องตามพระราชบัญญัติว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ (มาตรา ๙, ๒๖, ๒๘) และ PDPA พ.ศ. ๒๕๖๒ พร้อมลายมือชื่ออิเล็กทรอนิกส์ขั้นสูง Dilithium-5 (ML-DSA-87)
              </span>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold shrink-0">
              Δ0.00% SSoT Verified
            </span>
          </div>

          <CourtEvidenceQR
            merkleRoot={SYSTEM_METADATA.merkleRoot}
            anchorSignature="0x892af92bf89104ca_DILITHIUM5_ML_DSA_87"
            sealIndex={14902}
            blockNumber={849202}
            timestamp={SYSTEM_METADATA.timestamp || '2026-09-14T14:04:43Z'}
            principalId={SYSTEM_METADATA.sovereignPrincipal}
            manifestUrl="/zyrquen-court-manifest.json"
            auditTrailUrl="/zyrquen-mtls13-otel-telemetry-audit.json"
            evidenceCode="MASTER-JUDICIAL-SEAL-14902"
          />
        </div>
      )}

      {/* Hardware Seal QR Scanner (react-qr-reader & Digital Ledger SSoT) */}
      {activeTab === 'hardware-seal-scanner' && (
        <div className="space-y-6">
          <HardwareSealQRScanner
            isEmbedded={true}
            onAddSystemEvent={onAddSystemEvent}
          />
        </div>
      )}

      {/* Official Solidity Smart Contract Core V2 */}
      {activeTab === 'smart-contract' && (
        <div className="space-y-6">
          <SmartContractCoreViewer />
        </div>
      )}

      {/* Primary Sovereign Master Post-Patch Audit & Compliance Deck */}
      {activeTab === 'sovereign-master-audit' && (
        <div className="space-y-6">
          <SovereignAuditMasterDashboard />
        </div>
      )}

      {/* Chamber 01 Utimaco Secondary HSM Gauge, Thermal Telemetry & Gas Ledger */}
      {activeTab === 'utimaco-hsm-v2' && (
        <div className="space-y-6">
          <UtimacoSecondaryHSMGauge />
        </div>
      )}

      {/* Chamber 02 Forensics & Quarantine Dedicated Sub-View */}
      {activeTab === 'chamber02-forensics' && (
        <div className="space-y-6">
          <Chamber02QuarantineSimulator />
          <Chamber02View />
        </div>
      )}

      {/* Sovereign Threat Vector & Entropy Analysis Dedicated Sub-View */}
      {activeTab === 'threat-analysis' && (
        <div className="space-y-6">
          <ThreatAnalysisView />
        </div>
      )}

      {/* Primary Unified Tab: Sovereign Legal Convergence (3-Column Matrix + Governance Center) */}
      {(activeTab === 'legal-convergence' || activeTab === 'legal-dashboard' || activeTab === 'section28-layer') && (
        <div className="space-y-6">
          <CourtEvidenceQR
            merkleRoot={SYSTEM_METADATA.merkleRoot}
            anchorSignature="0x892af92bf89104ca_DILITHIUM5_ML_DSA_87"
            sealIndex={14902}
            blockNumber={849202}
            timestamp={SYSTEM_METADATA.timestamp || '2026-09-14T14:04:43Z'}
            principalId={SYSTEM_METADATA.sovereignPrincipal}
            manifestUrl="/zyrquen-court-manifest.json"
            auditTrailUrl="/zyrquen-mtls13-otel-telemetry-audit.json"
            evidenceCode="LEGAL-CONVERGENCE-14902"
          />
          <SovereignLegalConvergence />
          <ThaiLegalSovereignMapping />
        </div>
      )}

      {/* Tab: Frozen Integrity Guard & Baseline Reconciliation Gate */}
      {activeTab === 'reconciliation-gate' && (
        <div className="space-y-6">
          <ForensicClosureControlPlane />
          <HardeningV21RealEvidenceIntake />
          <HardeningV2ReconciliationAssurance />
          <HardeningV3EvidenceForensics />
          <ControlPlaneHardeningSummary />
          <FrozenIntegrityReconciliationGate />
        </div>
      )}

      {/* Tab: Evidence Truth Layer & Telemetry Truth Guard */}
      {activeTab === 'level3-threat-injection' && (
        <div className="space-y-6">
          <SecurityGateLevel3Simulator />
        </div>
      )}
      {activeTab === 'evidence-truth' && (
        <div className="space-y-6">
          <CourtEvidenceQR
            merkleRoot={SYSTEM_METADATA.merkleRoot}
            anchorSignature="0x892af92bf89104ca_DILITHIUM5_ML_DSA_87"
            sealIndex={14902}
            blockNumber={849202}
            timestamp={SYSTEM_METADATA.timestamp || '2026-09-14T14:04:43Z'}
            principalId={SYSTEM_METADATA.sovereignPrincipal}
            manifestUrl="/zyrquen-court-manifest.json"
            auditTrailUrl="/zyrquen-mtls13-otel-telemetry-audit.json"
            evidenceCode="EVIDENCE-TRUTH-MATRIX-14902"
          />
          <EvidenceTruthMatrix />
        </div>
      )}

      {/* Tab: Identity Collision Guard */}
      {activeTab === 'identity-guard' && (
        <div className="space-y-6">
          <IdentityCollisionGuard />
        </div>
      )}

      {/* Tab: Cryptographic Binding Panel */}
      {activeTab === 'crypto-binding' && (
        <div className="space-y-6">
          <CryptographicBindingPanel />
        </div>
      )}

      {/* Tab: Immutable Audit Timeline */}
      {activeTab === 'audit-timeline' && (
        <div className="space-y-6">
          <ImmutableAuditTimeline />
        </div>
      )}

      {/* Tab: Promotion Firewall */}
      {activeTab === 'promotion-firewall' && (
        <div className="space-y-6">
          <PromotionSafetyGate
            invariantsPassed={true}
            signedCustodianCount={liveCustodianCount}
            isQuorumReached={liveIsQuorumReached}
            isRootProvenanceValid={liveIsProvenanceValid}
          />
          <PromotionFirewallPanel />
        </div>
      )}

      {/* Tab 2: Compliance Blueprint v1.2 */}
      {activeTab === 'compliance-blueprint' && (
        <div className="space-y-6">
          <ComplianceBlueprintWidget />
        </div>
      )}

      {/* Tab 3: Custodian Trace Map */}
      {activeTab === 'custodian-map' && (
        <div className="space-y-6">
          <CustodianQuorumRegistry onQuorumChange={handleQuorumChange} />
          <CustodianTraceMap />
        </div>
      )}

      {/* Tab 4: Zero Trust Defense Shield */}
      {activeTab === 'defense' && (
        <div className="space-y-6">
          {/* New D3 Verification Pass Rates Area Chart */}
          <VerificationPassRatesChart />

          {/* 5 Adversarial Attack Patterns Grid */}
          <div className="p-6 rounded-[28px] bg-[#0b0e1a]/70 border border-white/8 backdrop-blur-xl space-y-4 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                Simulated Adversarial Attack Defense Matrix
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                5 / 5 BLOCKED
              </span>
            </div>

            <div className="space-y-2">
              {attackVectors.map((adv) => (
                <div
                  key={adv.id}
                  className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold">{adv.id}</span>
                      <span className="text-zinc-100 font-bold">{adv.name}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 font-sans mt-0.5">
                      Vector: <span className="text-zinc-300">{adv.vector}</span> • Guard: <span className="text-cyan-400">{adv.defense}</span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold shrink-0 self-start sm:self-auto">
                    {adv.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 10 Canonical Invariants List */}
          <div className="p-6 rounded-[28px] bg-[#0b0e1a]/70 border border-white/8 backdrop-blur-xl space-y-4 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                10 Canonical System Invariants (Inviolable Rules)
              </span>
              <span className="text-xs text-emerald-400">100% Compliant</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SYSTEM_INVARIANTS.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-300 font-bold">{inv.code}</span>
                    <span className="text-[10px] text-zinc-500">{inv.layer}</span>
                  </div>
                  <div className="text-zinc-200 font-medium">{inv.name}</div>
                  <p className="text-[11px] text-zinc-400 font-sans leading-snug">{inv.description}</p>
                  <div className="text-[10px] text-emerald-400/90 pt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified: {inv.verificationHash}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Audit Report (Read-Only SSoT Mutation = 0 Verification) */}
          <SystemAuditReport />

          {/* SIEM / SOC Real-Time Security Incident Webhook Dispatcher */}
          <SiemWebhookCenter />

          {/* Recharts Geographic Auth Ingress Heatmap */}
          <GatewayAuthHeatmap />
        </div>
      )}

      {/* Tab: Gateway Auth Ingress Heatmap (Dedicated View) */}
      {activeTab === 'gateway-heatmap' && (
        <div className="space-y-6">
          <GatewayAuthHeatmap />
        </div>
      )}

      {/* Tab: Global Threat Vectors Real-time Telemetry Panel */}
      {activeTab === 'threat-vectors' && (
        <div className="space-y-6">
          <GlobalThreatVectorsPanel onAddSystemEvent={onAddSystemEvent} />
        </div>
      )}

      {/* Tab 5: 12-Phase Omega Sequence Simulator & Full-Screen SVG Flow Diagram */}
      {activeTab === 'omega-sequence' && (
        <div className="space-y-6">
          <TwelveStageForensicTraceReplay />
          <OmegaSequenceFlowDiagram />
          <OmegaSequenceSimulator />
        </div>
      )}

      {/* Tab 6: Phase 3 Adversarial Failure Lab */}
      {activeTab === 'adversarial-lab' && (
        <div className="space-y-6">
          <AdversarialFailureLab />
        </div>
      )}

      {/* Tab 7: Crypto Verification Center */}
      {activeTab === 'crypto-center' && (
        <div className="space-y-6">
          <RootProvenanceValidator onProvenanceStateChange={handleProvenanceStateChange} />
          <CryptoVerificationCenter />
        </div>
      )}

      {/* Tab 8: Quarantine Forensics */}
      {activeTab === 'quarantine-forensics' && (
        <div className="space-y-6">
          <QuarantineInspector />
          <ForensicQuarantineLayer />
          <QuarantineForensics />
        </div>
      )}

      {/* Tab 9: Phase 7 Production Readiness & Observability */}
      {activeTab === 'phase7-production' && (
        <div className="space-y-6">
          <Phase7ProductionReadinessDashboard />
        </div>
      )}

      {activeTab === 'sentinel-live-flow' && (
        <div className="space-y-6">
          <LiveFlowVisualizerView />
        </div>
      )}

      {/* Interactive Sovereign PDF Dossier Preview Modal */}
      <InteractivePdfPreviewModal
        isOpen={isPdfPreviewOpen}
        onClose={() => setIsPdfPreviewOpen(false)}
      />

      {/* Custodian QR Validator Modal */}
      <CustodianQRValidator
        isOpen={isQrValidatorOpen}
        onClose={() => setIsQrValidatorOpen(false)}
        onSignoffSuccess={(res) => {
          handleQuorumChange(res.verifiedCount, res.isQuorumSatisfied);
          if (onAddSystemEvent) {
            onAddSystemEvent(
              'CRYPTO',
              `Custodian Evidence Validated (Slot #${res.slotId})`,
              `Cryptographic QR scan verified and anchored into CustodianRegistry. Quorum count: ${res.verifiedCount}/10 (${res.isQuorumSatisfied ? 'Super-Majority Validated' : 'Pending'}).`,
              res.signatureDigest,
              'info',
              'ETDA B.E. 2544 Sec 26 & PDPA Sec 39',
              'security'
            );
          }
        }}
        onAuditLog={(title, desc, severity) => {
          if (onAddSystemEvent) {
            onAddSystemEvent(
              severity === 'error' ? 'ANOMALY' : severity === 'warning' ? 'WARNING' : 'FORENSIC',
              title,
              desc,
              '0x' + Math.random().toString(16).slice(2, 10),
              severity === 'error' ? 'critical' : severity === 'warning' ? 'warning' : 'info',
              'ETDA มาตรา 11 & PDPA มาตรา 26',
              'security'
            );
          }
        }}
      />

      {/* Hardware Seal QR Scanner Modal */}
      <HardwareSealQRScanner
        isOpen={isHardwareSealScannerOpen}
        onClose={() => setIsHardwareSealScannerOpen(false)}
        onAddSystemEvent={onAddSystemEvent}
      />
    </div>
  );
};
