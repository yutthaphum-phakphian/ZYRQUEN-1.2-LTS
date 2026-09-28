import React from 'react';
import { FailsafeDiagnostics } from '../../components/audit/FailsafeDiagnostics';
import { ExecutionTraceLogs } from '../../components/audit/ExecutionTraceLogs';
import { AgentsReasoningMesh } from '../../components/audit/AgentsReasoningMesh';
import { MerklePathTracker } from '../../components/security/MerklePathTracker';
import { BoundaryHealth } from '../../components/telemetry/BoundaryHealth';

export const ForensicsTab: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <FailsafeDiagnostics />
          <AgentsReasoningMesh />
          <BoundaryHealth />
        </div>

        <div className="space-y-6">
          <MerklePathTracker />
          <ExecutionTraceLogs />
        </div>
      </div>
    </div>
  );
};

export default ForensicsTab;
