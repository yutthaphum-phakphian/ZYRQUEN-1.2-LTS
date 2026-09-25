import React, { useState } from 'react';
import { AlertOctagon, Flame, ShieldAlert, RefreshCw, Radio, Zap } from 'lucide-react';
import { useSystemStateStore } from '../stores/systemStateStore';
import { useWebAudioTelemetry } from '../hooks/useWebAudioTelemetry';
import { maskPII, generateZKProof } from '../utils/ZeroKnowledgePrivacyEngine';

export interface ChaosFaultInjectorProps {
  onChaosEventTriggered?: (eventName: string, details: string) => void;
}

/**
 * ZYRQUEN Ω∞ Sovereign Kernel v4.16 (v1.2 LTS)
 * Chaos Engineering & Fault Injector Engine Component.
 * Enables interactive simulation of high-stress security attacks and auto-healing hooks.
 */
export const ChaosFaultInjector: React.FC<ChaosFaultInjectorProps> = ({
  onChaosEventTriggered,
}) => {
  const {
    triggerQuarantineIsolation,
    updateCoherence,
    resetToSSoTBaseline,
    logSystemEvent,
    isQuarantineIsolated,
    coherenceScore,
  } = useSystemStateStore();

  const {
    playDissonantWarning,
    playQuarantineAlarm,
    playCascadingSiren,
    playTelemetrySweep,
    stopAllAudio,
  } = useWebAudioTelemetry();

  const [activeSimulation, setActiveSimulation] = useState<string | null>(null);

  // 1. Trigger Cryo Decoherence Spike (Sub-Kelvin Thermal Anomaly)
  const handleTriggerDecoherence = () => {
    setActiveSimulation('DECOHERENCE_SPIKE');
    updateCoherence(0.742);
    playDissonantWarning();

    logSystemEvent({
      id: `chaos-decoherence-${Date.now()}`,
      title: '🚨 CHAOS TEST: Sub-Kelvin Cryo Decoherence Spike',
      description: 'Chamber CH-003 Coherence dropped to 74.20% (Temp: 29.4 mK)',
      severity: 'warn',
      handler: () => console.warn('Decoherence spike active'),
    });

    onChaosEventTriggered?.('DECOHERENCE_SPIKE', 'Chamber CH-003 Coherence dropped to 74.20%');
  };

  // 2. Trigger Post-Quantum Signature Attack & Injection
  const handleTriggerPqcAttack = () => {
    setActiveSimulation('PQC_INTRUSION_ATTACK');
    playQuarantineAlarm();

    const fakePayload = {
      userEmail: 'attacker.vector@shadow.net',
      nationalId: '1-1002-99831-22-1',
      payload: 'SELECT * FROM sovereign_ledger WHERE 1=1; -- EXFILTRATE',
    };

    const masked = maskPII(fakePayload.userEmail, 'email');
    const zkProof = generateZKProof(fakePayload.payload, '0x849202_CHAMBER_02');

    triggerQuarantineIsolation(`PQC Forgery Detected (ZK-Proof: 0x${zkProof.proofHash.slice(0, 10)}..., Masked PII: ${masked})`);

    onChaosEventTriggered?.('PQC_INTRUSION_ATTACK', 'High-Risk Payload Isolated in Chamber 02 Buffer');
  };

  // 3. Trigger Physical Hardware Tamper & Phoenix Recovery
  const handleTriggerHardwareTamper = () => {
    setActiveSimulation('HARDWARE_TAMPER_PHOENIX');
    playCascadingSiren();

    logSystemEvent({
      id: `chaos-hardware-${Date.now()}`,
      title: '⚡ CHAOS TEST: Physical Tamper Foil Breach',
      description: 'Hardware Foil Tamper Breach on Node TC-03 -> Ephemeral RAM Zeroized (0.48ms) -> Fallback SPHINCS+',
      severity: 'critical',
      handler: () => console.error('Hardware zeroization active'),
    });

    setTimeout(() => {
      playTelemetrySweep();
      setActiveSimulation('PHOENIX_RECOVERED');
    }, 1200);

    onChaosEventTriggered?.('HARDWARE_TAMPER_PHOENIX', 'Active Zeroization Triggered & SPHINCS+ Fallback Engaged');
  };

  // 4. Auto-Healing & SSoT Baseline Recovery
  const handleAutoHealingReset = () => {
    stopAllAudio();
    playTelemetrySweep();
    resetToSSoTBaseline();
    setActiveSimulation(null);

    logSystemEvent({
      id: `chaos-reset-${Date.now()}`,
      title: '🟢 AUTO-HEALING: SSoT Baseline Restored',
      description: 'System re-anchored to Genesis Block #849202 (Zero Drift 0.00% Verified)',
      severity: 'ratified',
      handler: () => console.log('SSoT Baseline restored'),
    });

    onChaosEventTriggered?.('AUTO_HEALING_RESET', 'System Restored to SSoT Baseline #849202');
  };

  return (
    <div className="p-5 bg-zinc-900 border-zinc-800 rounded-2xl font-mono text-zinc-100 shadow-xl space-y-4">
      {/* Engine Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-950/80 border-rose-800/60 rounded-xl text-rose-400">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
              Chaos Engineering & Fault Injector Engine
            </h2>
            <p className="text-[11px] text-zinc-500">
              Interactive Stress-Testing & Auto-Healing Validation Unit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500">Coherence:</span>
          <span
            className={`font-bold ${
              coherenceScore < 0.92 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
            }`}
          >
            {(coherenceScore * 100).toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Control Buttons Cluster */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Button 1: Decoherence Spike */}
        <button
          type="button"
          onClick={handleTriggerDecoherence}
          className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-950 border-amber-800/60 text-amber-300 hover:bg-amber-950/40 text-xs font-bold transition cursor-pointer"
        >
          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="text-left">
            <p>1. Cryo Decoherence</p>
            <p className="text-[10px] text-zinc-500 font-normal">Spike Temp to 29.4mK</p>
          </div>
        </button>

        {/* Button 2: PQC Intrusion Attack */}
        <button
          type="button"
          onClick={handleTriggerPqcAttack}
          className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-950 border-rose-800/60 text-rose-300 hover:bg-rose-950/40 text-xs font-bold transition cursor-pointer"
        >
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <div className="text-left">
            <p>2. PQC Intrusion</p>
            <p className="text-[10px] text-zinc-500 font-normal">Trigger Chamber 02</p>
          </div>
        </button>

        {/* Button 3: Physical Tamper */}
        <button
          type="button"
          onClick={handleTriggerHardwareTamper}
          className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-950 border-purple-800/60 text-purple-300 hover:bg-purple-950/40 text-xs font-bold transition cursor-pointer"
        >
          <AlertOctagon className="w-4 h-4 text-purple-400 shrink-0" />
          <div className="text-left">
            <p>3. Hardware Breach</p>
            <p className="text-[10px] text-zinc-500 font-normal">Zeroization & Phoenix</p>
          </div>
        </button>

        {/* Button 4: Auto-Healing Reset */}
        <button
          type="button"
          onClick={handleAutoHealingReset}
          className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-950/80 border-emerald-700/80 text-emerald-300 hover:bg-emerald-900 text-xs font-bold transition cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="text-left">
            <p>4. Auto-Healing</p>
            <p className="text-[10px] text-emerald-400/80 font-normal">Restore SSoT Baseline</p>
          </div>
        </button>
      </div>

      {/* Live Active Simulation Indicator */}
      {activeSimulation && (
        <div className="p-3 bg-zinc-950 border-zinc-800 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-ping" />
            <span className="text-zinc-400">Active Simulation:</span>
            <span className="text-cyan-300 font-bold uppercase">{activeSimulation}</span>
          </div>

          <span className="text-[10px] text-zinc-500">
            {isQuarantineIsolated ? '🚨 QUARANTINE ENFORCED' : '⚡ LIVE STRESS MODE'}
          </span>
        </div>
      )}
    </div>
  );
};

export default ChaosFaultInjector;
