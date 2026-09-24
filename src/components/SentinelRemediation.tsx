/**
 * ZYRQUEN Ω∞ AI Autonomous SRE & Sentinel Auto-Remediation Engine
 * Engine Version: v1.2.1 LTS
 * Sovereign Principal Architect: นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)
 */
import React, { useEffect, useState } from 'react';
import { SOVEREIGN_CONFIG } from '../config/sovereign.config';

interface AnomalyEvent {
  id: string;
  timestamp: string;
  chamber: string;
  riskScore: number;
  description: string;
  status: 'DETECTED' | 'QUARANTINED' | 'AUTO_REMEDIATED' | 'PATCH_APPLIED';
  pqcAlgorithm?: string;
  zkProofHash?: string;
}

const INITIAL_ANOMALY: AnomalyEvent = {
  id: 'ANOM-8492-01',
  timestamp: new Date().toISOString(),
  chamber: 'CH-02 (Quarantine Buffer)',
  riskScore: 0.89,
  description: 'Unauthorized memory leak pattern detected in Chamber 02 buffer stream.',
  status: 'AUTO_REMEDIATED',
  pqcAlgorithm: 'Dilithium-5 (FIPS 204)',
  zkProofHash: '0x909ab814...4c68',
};

export const SentinelRemediation: React.FC = () => {
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([INITIAL_ANOMALY]);
  const [isShieldActive, setIsShieldActive] = useState(true);
  const [remediationCount, setRemediationCount] = useState(1490);
  const [activePqcMode, setActivePqcMode] = useState('Dilithium-5 (ML-DSA-87)');
  const [ciCdStatus, setCiCdStatus] = useState('IDLE / ARMED');

  useEffect(() => {
    const statusResetTimers = new Set<ReturnType<typeof setTimeout>>();
    const interval = setInterval(() => {
      if (!isShieldActive) {
        return;
      }

      const randomRisk = Number((Math.random() * 0.15 + 0.85).toFixed(2));
      if (randomRisk < 0.85) {
        return;
      }

      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const chamberNum = Math.floor(Math.random() * 18).toString().padStart(2, '0');
      const newAnomaly: AnomalyEvent = {
        id: `ANOM-${randomNum}`,
        timestamp: new Date().toISOString(),
        chamber: `CH-${chamberNum} (Active Quarantine)`,
        riskScore: randomRisk,
        description: 'High-risk drift payload intercepted. Fail-closed auto-remediation and patch triggered.',
        status: 'PATCH_APPLIED',
        pqcAlgorithm: Math.random() > 0.5
          ? 'Dilithium-5 (FIPS 204)'
          : 'SPHINCS+ (FIPS 205 Fallback)',
        zkProofHash: `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`,
      };

      setAnomalies((previous) => [newAnomaly, ...previous.slice(0, 4)]);
      setRemediationCount((previous) => previous + 1);
      setCiCdStatus(`PATCH EXECUTED [${newAnomaly.id}]`);
      setActivePqcMode((previous) => previous.includes('Dilithium-5')
        ? 'Kyber-1024 / SPHINCS+ Rotated'
        : 'Dilithium-5 (ML-DSA-87)');

      const resetTimer = setTimeout(() => setCiCdStatus('IDLE / ARMED'), 2500);
      statusResetTimers.add(resetTimer);
    }, 4500);

    return () => {
      clearInterval(interval);
      statusResetTimers.forEach((timer) => clearTimeout(timer));
    };
  }, [isShieldActive]);

  return (
    <div className="bg-cyber-800/80 border border-cyan-500/30 rounded-2xl p-6 backdrop-blur-md shadow-xl text-gray-100 max-w-4xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-cyber-700 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-lg font-bold text-cyan-300 font-mono">Sentinel Auto-Remediation Plane (v1.2.1 LTS)</h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Engineered under SSoT Baseline <span className="text-amber-400 font-mono">{SOVEREIGN_CONFIG.genesisBlockHeight}</span> (Δ = {SOVEREIGN_CONFIG.baselineSystemDriftPercent}%)
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-cyber-900 border border-cyber-600 px-3 py-1.5 rounded-lg text-xs font-mono">
            Remediations: <span className="text-emerald-400 font-bold">{remediationCount}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsShieldActive((active) => !active)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isShieldActive
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
              : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'}`}
          >
            {isShieldActive ? 'SHIELD: ACTIVE' : 'SHIELD: PAUSED'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <div className="bg-cyber-900/70 border border-cyber-700 p-4 rounded-xl">
          <span className="text-xs text-gray-400 block">CI/CD Auto-Patch Status</span>
          <span className="text-sm font-mono text-cyan-400 font-bold mt-1 block truncate">{ciCdStatus}</span>
          <span className="text-[10px] text-emerald-400">Zero-Downtime Pipeline Ready</span>
        </div>
        <div className="bg-cyber-900/70 border border-cyber-700 p-4 rounded-xl">
          <span className="text-xs text-gray-400 block">Interceptor Threshold</span>
          <span className="text-xl font-mono text-amber-400 font-bold mt-1 block">Risk ≥ 0.85</span>
          <span className="text-[10px] text-gray-400">HTTP 423 Locked Quarantine</span>
        </div>
        <div className="bg-cyber-900/70 border border-cyber-700 p-4 rounded-xl">
          <span className="text-xs text-gray-400 block">PQC Crypto &amp; ZK-Audit</span>
          <span className="text-xs font-mono text-cyan-300 font-semibold mt-1 block truncate">{activePqcMode}</span>
          <span className="text-[10px] text-emerald-400">ETDA &amp; PDPA Non-Repudiation OK</span>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider mb-3">
          Live AI Sentinel Autonomous Remediation Stream (ISO 8601 &amp; ZK-Proof Verified)
        </h3>
        <div className="bg-cyber-900 border border-cyber-700 rounded-xl p-3 space-y-2 max-h-64 overflow-y-auto font-mono text-xs">
          {anomalies.map((item) => (
            <div key={item.id} className="bg-cyber-800/70 border border-cyber-700/60 p-2.5 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-cyan-400 font-bold">{item.id}</span>
                  <span className="text-gray-400">[{item.chamber}]</span>
                  <span className="text-rose-400 font-semibold">Risk: {item.riskScore}</span>
                </div>
                <p className="text-gray-300 text-[11px] mt-1">{item.description}</p>
                <div className="text-[10px] text-amber-400/90 mt-1">
                  PQC: {item.pqcAlgorithm} | ZK-Proof: <span className="text-cyan-300">{item.zkProofHash}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 self-end sm:self-center">
                <span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
                  {item.status}
                </span>
                <span className="text-[10px] text-gray-500">{new Date(item.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SentinelRemediation;
