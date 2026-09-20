import React from 'react';
import { ViewType, HardwareSnapshot } from '@/types';
import { SystemEvent } from '@/components/SystemEventsSidebar';

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
import { SecurityView } from '@/components/views/SecurityView';
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

export interface ViewRegistryProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  snapshots: HardwareSnapshot[];
  handleAddSnapshot: (snapshot: HardwareSnapshot) => void;
  addSystemEvent: (
    type: SystemEvent['type'],
    title: string,
    description: string,
    source?: string,
    severity?: SystemEvent['severity']
  ) => void;
  verificationGateStatus: {
    status: 'BLOCKED' | 'PASSED' | 'ACTIVE_GUARD';
    lastCheckedTime: string;
    complianceEventCount: number;
    sealCount: number;
    message: string;
  };
  isForensicAuditMode: boolean;
  setIsCertificateOpen: (open: boolean) => void;
  isAudioActive: boolean;
  handleToggleAudio: () => void;
  isSystemActivityFrozen: boolean;
  handleToggleFreezeSystemActivity: () => void;
  setIsEventsSidebarOpen: (open: boolean) => void;
  isMonochromeMode: boolean;
  handleToggleMonochrome: () => void;
  setIsLegalSearchOpen: (open: boolean) => void;
  setLoginLoaderMode: (mode: 'login' | 'register' | 'switch_tenant') => void;
  setShowLoginLoader: (show: boolean) => void;
  createTelemetrySnapshot: (cores: { core0: number; core1: number; core2: number; core3: number }, count: number, prevHash?: string) => HardwareSnapshot;
}

export const ViewRenderer: React.FC<ViewRegistryProps> = ({
  currentView,
  setCurrentView,
  snapshots,
  handleAddSnapshot,
  addSystemEvent,
  verificationGateStatus,
  isForensicAuditMode,
  setIsCertificateOpen,
  isAudioActive,
  handleToggleAudio,
  isSystemActivityFrozen,
  handleToggleFreezeSystemActivity,
  setIsEventsSidebarOpen,
  isMonochromeMode,
  handleToggleMonochrome,
  setIsLegalSearchOpen,
  setLoginLoaderMode,
  setShowLoginLoader,
  createTelemetrySnapshot,
}) => {
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
          onCaptureSnapshot={() =>
            handleAddSnapshot(
              createTelemetrySnapshot({ core0: 42, core1: 39, core2: 44, core3: 38 }, snapshots.length, snapshots[0]?.sealedHash)
            )
          }
          onOpenLegalSearch={() => setIsLegalSearchOpen(true)}
          onTriggerLoginLoader={(mode: 'login' | 'register' | 'switch_tenant' = 'login') => {
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
      return (
        <DashboardView
          onNavigate={setCurrentView}
          onOpenCertificate={() => setIsCertificateOpen(true)}
        />
      );
  }
};
