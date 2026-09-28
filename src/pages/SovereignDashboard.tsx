/**
 * ZYRQUEN Ω∞ Unified Sentinel & Gateways Control Plane
 * Sovereign Principal Architect: นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)
 */
import React, { useState } from 'react';
import { SentinelRemediation } from '../components/SentinelRemediation';
import { SovereignGateways } from '../components/SovereignGateways';
import {
  CommandCenterOperationsConsole,
  type StagedAiCommandRequest,
} from '../components/CommandCenterOperationsConsole';
import { ZyrquenLogo } from '../components/ZyrquenLogo';

export interface SovereignDashboardProps {
  initialModule?: 'operations' | 'self-tuning' | 'voice-builder';
  stagedAiRequest?: StagedAiCommandRequest | null;
  onConsumeStagedAiRequest?: () => void;
  onSystemAuditLog?: (action: string, details: string, status: 'VERIFIED' | 'BLOCKED') => void;
}

export const SovereignDashboard: React.FC<SovereignDashboardProps> = ({
  initialModule = 'operations',
  stagedAiRequest = null,
  onConsumeStagedAiRequest,
  onSystemAuditLog,
}) => {
  const [alertLevel, setAlertLevel] = useState<'NOMINAL' | 'CRITICAL'>('NOMINAL');

  return (
    <div className="bg-cyber-950 text-gray-100 font-sans space-y-6">
      <section className="px-1 sm:px-2">
        <CommandCenterOperationsConsole
          embedded={true}
          initialModule={initialModule}
          stagedAiRequest={stagedAiRequest}
          onConsumeStagedAiRequest={onConsumeStagedAiRequest}
          onSystemAuditLog={onSystemAuditLog}
        />
      </section>

      <section className="px-1 sm:px-2">
        <SentinelRemediation monitoringIntervalMs={4500} onAlertLevelChange={setAlertLevel} />
      </section>

      <section className="px-1 sm:px-2">
        <SovereignGateways alertLevel={alertLevel} />
      </section>
    </div>
  );
};

export default SovereignDashboard;
