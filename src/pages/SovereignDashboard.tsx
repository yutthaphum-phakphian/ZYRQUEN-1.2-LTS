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
    <main className="min-h-screen bg-cyber-950 text-gray-100 font-sans">
      <header className="border-b border-cyan-700/40 p-3 sm:p-6 text-center space-y-4 max-w-7xl mx-auto">
        <ZyrquenLogo variant="full" showTagline={true} showStatus={true} />
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-cyan-400 font-mono">
            ZYRQUEN Ω∞ Unified Sentinel &amp; Gateways Control Plane
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-400 mt-1 font-mono">
            Autonomous Self-Tuning Engine | ZYRQUEN Ω∞ Sovereign Control Plane (FROZEN v1.2.1 LTS)
          </p>
        </div>
      </header>

      <section className="py-3 sm:py-6 px-2 sm:px-4">
        <CommandCenterOperationsConsole
          embedded={true}
          initialModule={initialModule}
          stagedAiRequest={stagedAiRequest}
          onConsumeStagedAiRequest={onConsumeStagedAiRequest}
          onSystemAuditLog={onSystemAuditLog}
        />
      </section>

      <section className="py-4 sm:py-8 px-2 sm:px-4">
        <SentinelRemediation monitoringIntervalMs={4500} onAlertLevelChange={setAlertLevel} />
      </section>

      <section className="py-4 sm:py-8 px-2 sm:px-4">
        <SovereignGateways alertLevel={alertLevel} />
      </section>

      <footer className="border-t border-cyber-700/40 p-3 sm:p-4 text-center text-[11px] sm:text-xs text-gray-500 font-mono">
        SSoT Δ0.00% | 22 Master Verification Gates | PQC Dilithium-5 ↔ SPHINCS+
      </footer>
    </main>
  );
};

export default SovereignDashboard;
