/**
 * ZYRQUEN Ω∞ Sovereign Gateway Control Plane
 * Sovereign Principal Architect: นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)
 */
import React from 'react';
import { SOVEREIGN_CONFIG } from '../config/sovereign.config';

interface GatewayStatus {
  name: string;
  endpoint: string;
  purpose: string;
  status: 'OPERATIONAL' | 'ALERT';
}

const GATEWAYS: Omit<GatewayStatus, 'status'>[] = [
  {
    name: 'Quantum Satellite Gateway',
    endpoint: 'telemetry://quantum-satellite',
    purpose: 'Telemetric signal and 99.992% coherence monitoring',
  },
  {
    name: 'Legal Smart Contract Gateway',
    endpoint: 'legal://etda-sec-26-28',
    purpose: 'ETDA Sections 26 and 28 verification',
  },
  {
    name: 'Cryo-Thermal Bus Gateway',
    endpoint: 'cryo://thermal-bus',
    purpose: 'Sub-Kelvin 14.98 mK stability monitoring',
  },
];

interface SovereignGatewaysProps {
  alertLevel?: 'NOMINAL' | 'CRITICAL';
}

export const SovereignGateways: React.FC<SovereignGatewaysProps> = ({ alertLevel = 'NOMINAL' }) => (
  <section className="bg-cyber-800/80 border-cyan-500/30 rounded-2xl p-6 backdrop-blur-md shadow-xl text-gray-100 max-w-4xl mx-auto font-sans">
    <div className="flex flex-col sm:flex-row justify-between gap-3 pb-4 border-b border-cyber-700">
      <div>
        <h2 className="text-lg font-bold text-cyan-300 font-mono">Sovereign Gateway Mesh</h2>
        <p className="text-xs text-gray-400 mt-1">Fail-closed API surface anchored to {SOVEREIGN_CONFIG.genesisBlockHeight}</p>
      </div>
      <span className="self-start text-xs font-mono text-emerald-400 border-emerald-500/40 rounded-lg px-3 py-1.5">
        SSoT Δ{SOVEREIGN_CONFIG.baselineSystemDriftPercent.toFixed(2)}%
      </span>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
      {GATEWAYS.map((gateway) => (
        <article key={gateway.endpoint} className="bg-cyber-900/70 border-cyber-700 rounded-xl p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-gray-100">{gateway.name}</h3>
            <span className={`text-[10px] font-mono ${alertLevel === 'CRITICAL' ? 'text-rose-400' : 'text-emerald-400'}`}>
              {alertLevel === 'CRITICAL' ? 'ALERT' : 'OPERATIONAL'}
            </span>
          </div>
          <p className="text-xs font-mono text-cyan-300 mt-2 break-all">{gateway.endpoint}</p>
          <p className="text-xs text-gray-400 mt-2">{gateway.purpose}</p>
        </article>
      ))}
    </div>

    <p className="text-[10px] text-gray-500 font-mono mt-5">
      PQC: {SOVEREIGN_CONFIG.pqcCryptography.primarySignature} | HSM: {SOVEREIGN_CONFIG.hardwareSecurityEnclave.status}
    </p>
  </section>
);

export default SovereignGateways;
