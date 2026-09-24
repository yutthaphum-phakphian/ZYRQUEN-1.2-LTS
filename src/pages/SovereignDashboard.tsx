/**
 * ZYRQUEN Ω∞ Unified Sentinel & Gateways Control Plane
 * Sovereign Principal Architect: นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)
 */
import React, { useState } from 'react';
import { SentinelRemediation } from '../components/SentinelRemediation';
import { SovereignGateways } from '../components/SovereignGateways';

export const SovereignDashboard: React.FC = () => {
  const [alertLevel, setAlertLevel] = useState<'NOMINAL' | 'CRITICAL'>('NOMINAL');

  return (
  <main className="min-h-screen bg-cyber-950 text-gray-100 font-sans">
    <header className="border-b border-cyan-700/40 p-6 text-center">
      <h1 className="text-2xl font-bold text-cyan-400 font-mono">
        ZYRQUEN Ω∞ — Sovereign Control Plane
      </h1>
      <p className="text-xs text-gray-400 mt-1">
        Unified Sentinel &amp; Gateways Architecture | FROZEN v1.2.1 LTS
      </p>
    </header>

    <section className="py-8 px-4">
      <SentinelRemediation monitoringIntervalMs={4500} onAlertLevelChange={setAlertLevel} />
    </section>

    <section className="py-8 px-4">
      <SovereignGateways alertLevel={alertLevel} />
    </section>

    <footer className="border-t border-cyber-700/40 p-4 text-center text-xs text-gray-500 font-mono">
      SSoT Δ0.00% | 22 Master Verification Gates | PQC Dilithium-5 ↔ SPHINCS+
    </footer>
  </main>
  );
};

export default SovereignDashboard;
