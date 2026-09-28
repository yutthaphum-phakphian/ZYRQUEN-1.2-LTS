import React from 'react';
import { HardwareSealClock } from '../../components/core/HardwareSealClock';
import { IntegrityScoreCard } from '../../components/core/IntegrityScoreCard';
import { CloudResourcesPanel } from '../../components/telemetry/CloudResourcesPanel';
import { SwarmNetReactor } from '../../components/telemetry/SwarmNetReactor';
import { ChaosSimulator } from '../../components/security/ChaosSimulator';
import { VerificationGate } from '../../components/security/VerificationGate';
import { MerklePathTracker } from '../../components/security/MerklePathTracker';
import { FailsafeDiagnostics } from '../../components/audit/FailsafeDiagnostics';
import { ExecutionTraceLogs } from '../../components/audit/ExecutionTraceLogs';
import { AgentsReasoningMesh } from '../../components/audit/AgentsReasoningMesh';

export interface OverviewTabProps {
  onInspectAudit?: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ onInspectAudit }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Row 1: Key System Metrics (2-Column Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <HardwareSealClock />
        <IntegrityScoreCard onInspect={onInspectAudit} />
      </div>

      {/* Row 2: Main Telemetry & Active Control (2/3 + 1/3 layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CloudResourcesPanel />
          <SwarmNetReactor />
        </div>
        <div className="space-y-6">
          <ChaosSimulator />
          <VerificationGate />
        </div>
      </div>

      {/* Row 3: Audit, Diagnostics & Merkle Proofs (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <MerklePathTracker />
          <AgentsReasoningMesh />
        </div>
        <div className="space-y-6">
          <FailsafeDiagnostics />
          <ExecutionTraceLogs />
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
