import React from 'react';
import { CloudResourcesPanel } from '../../components/telemetry/CloudResourcesPanel';
import { SwarmNetReactor } from '../../components/telemetry/SwarmNetReactor';
import { BoundaryHealth } from '../../components/telemetry/BoundaryHealth';
import { ChaosSimulator } from '../../components/security/ChaosSimulator';
import { VerificationGate } from '../../components/security/VerificationGate';
import { ExecutionTraceLogs } from '../../components/audit/ExecutionTraceLogs';

export const OperationsTab: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CloudResourcesPanel />
          <SwarmNetReactor />
          <BoundaryHealth />
        </div>

        <div className="space-y-6">
          <VerificationGate />
          <ChaosSimulator />
          <ExecutionTraceLogs />
        </div>
      </div>
    </div>
  );
};

export default OperationsTab;
