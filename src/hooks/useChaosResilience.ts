import { useState, useCallback, useEffect } from 'react';
import {
  computeQuantarisResilienceScore,
  QuantarisResilienceEvaluation,
} from '../utils/hologramMaterial';

export interface ChaosRuntimeBlock {
  id: string;
  blockCode: string;
  moduleName: string;
  chamberRef: string;
  integrityPct: number;
  recoveryMs: number;
  status: 'NOMINAL' | 'GLITCH_DETECTED' | 'AUTO_HEALING' | 'SEALED';
  hashDigest: string;
}

export type HealingStatusType =
  | 'NOMINAL_STANDBY'
  | 'GLITCH_ISOLATING'
  | 'BLOOM_AUTO_HEALING'
  | 'VERIFIED_142MS';

export type PhoenixRecoveryPhase =
  | 'PHASE_1_DETECTION'
  | 'PHASE_2_RESPONSE'
  | 'PHASE_3_RECOVERY'
  | 'PHASE_4_ASSURANCE';

export const INITIAL_RUNTIME_BLOCKS: ChaosRuntimeBlock[] = [
  {
    id: 'rb-01',
    blockCode: 'BLK-CORE-01',
    moduleName: 'Quantum Runtime Unifier',
    chamberRef: 'Chamber 00 / 01',
    integrityPct: 100.0,
    recoveryMs: 18.4,
    status: 'SEALED',
    hashDigest: '0x909ab814...fa4c68',
  },
  {
    id: 'rb-02',
    blockCode: 'BLK-GRID-02',
    moduleName: 'Navigation Grid Mk-III',
    chamberRef: 'Chamber 16 / 17',
    integrityPct: 100.0,
    recoveryMs: 24.1,
    status: 'NOMINAL',
    hashDigest: '0x7e4a91bc...32d108',
  },
  {
    id: 'rb-03',
    blockCode: 'BLK-ROUT-03',
    moduleName: 'Sovereign Dimension Router Shield',
    chamberRef: 'Chamber 11 / 13',
    integrityPct: 100.0,
    recoveryMs: 31.2,
    status: 'NOMINAL',
    hashDigest: '0x3c9d08fa...849202',
  },
  {
    id: 'rb-04',
    blockCode: 'BLK-OTEL-04',
    moduleName: 'Telemetry Core (Port 8443)',
    chamberRef: 'Chamber 09 / 14',
    integrityPct: 100.0,
    recoveryMs: 35.8,
    status: 'SEALED',
    hashDigest: '0x5b7f19e0...c4410a',
  },
  {
    id: 'rb-05',
    blockCode: 'BLK-CHAM-02',
    moduleName: 'Chamber 02 Buffer Gamma [STANDBY]',
    chamberRef: 'Chamber 02 Quarantine',
    integrityPct: 99.47,
    recoveryMs: 0.8,
    status: 'SEALED',
    hashDigest: '0x43fa4c68...909ab8',
  },
  {
    id: 'rb-06',
    blockCode: 'BLK-PHNX-07',
    moduleName: 'Chaos-Resilience Auto-Healer',
    chamberRef: 'Chamber 07 Phoenix',
    integrityPct: 100.0,
    recoveryMs: 142.0,
    status: 'NOMINAL',
    hashDigest: '0x1b5e8820...f00142',
  },
];

export function useChaosResilience() {
  const [runtimeBlocks, setRuntimeBlocks] = useState<ChaosRuntimeBlock[]>(INITIAL_RUNTIME_BLOCKS);
  const [healingStatus, setHealingStatus] = useState<HealingStatusType>('NOMINAL_STANDBY');
  const [recoveryPhase, setRecoveryPhase] = useState<PhoenixRecoveryPhase>('PHASE_4_ASSURANCE');
  const [glitchIntensity, setGlitchIntensity] = useState<number>(0);
  const [latencyMs, setLatencyMs] = useState<number>(35.80);
  const [healingRatePct, setHealingRatePct] = useState<number>(99.4);
  const [stabilityIndexPct, setStabilityIndexPct] = useState<number>(99.8);
  const [latencyHistory, setLatencyHistory] = useState<number[]>([
    35.8, 35.6, 36.1, 35.9, 35.7, 35.8, 36.0, 35.8, 35.5, 35.8, 35.9, 35.8,
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLatencyHistory((prev) => {
        const jitter = (Math.random() - 0.5) * 0.8;
        const nextVal = +(Math.max(28, latencyMs + jitter)).toFixed(2);
        return [...prev.slice(-15), nextVal];
      });
    }, 2400);
    return () => clearInterval(interval);
  }, [latencyMs]);

  const resilienceEval: QuantarisResilienceEvaluation = computeQuantarisResilienceScore(
    latencyMs,
    healingRatePct,
    stabilityIndexPct
  );

  const simulateChaosAndAutoHeal = useCallback(() => {
    // Phase-1: Detection (Quantum Telemetry Hooks + Glitch Overlay)
    setRecoveryPhase('PHASE_1_DETECTION');
    setHealingStatus('GLITCH_ISOLATING');
    setGlitchIntensity(0.88);
    setLatencyMs(118.4);
    setHealingRatePct(68.0);
    setStabilityIndexPct(72.5);
    setLatencyHistory((prev) => [...prev.slice(-15), 118.4]);

    setRuntimeBlocks((prev) =>
      prev.map((b, i) =>
        i === 1 || i === 2
          ? { ...b, status: 'GLITCH_DETECTED', integrityPct: 86.4 }
          : b
      )
    );

    // Phase-2: Response (Sovereign Router Shield + Auto-Healing Runtime Blocks)
    setTimeout(() => {
      setRecoveryPhase('PHASE_2_RESPONSE');
      setHealingStatus('BLOOM_AUTO_HEALING');
      setGlitchIntensity(0.45);
      setLatencyMs(64.2);
      setHealingRatePct(88.5);
      setStabilityIndexPct(89.2);
      setLatencyHistory((prev) => [...prev.slice(-15), 64.2]);

      setRuntimeBlocks((prev) =>
        prev.map((b) =>
          b.status === 'GLITCH_DETECTED'
            ? { ...b, status: 'AUTO_HEALING', integrityPct: 96.8 }
            : b
        )
      );
    }, 420);

    // Phase-3: Recovery (Phoenix Dashboard G16 + Cosmic Bloom)
    setTimeout(() => {
      setRecoveryPhase('PHASE_3_RECOVERY');
      setGlitchIntensity(0.15);
      setLatencyMs(41.2);
      setHealingRatePct(96.4);
      setStabilityIndexPct(97.8);
      setLatencyHistory((prev) => [...prev.slice(-15), 41.2]);
    }, 820);

    // Phase-4: Assurance (Gold Seal Verification + Sovereign Verified 90–100)
    setTimeout(() => {
      setRecoveryPhase('PHASE_4_ASSURANCE');
      setHealingStatus('VERIFIED_142MS');
      setGlitchIntensity(0);
      setLatencyMs(35.80);
      setHealingRatePct(99.6);
      setStabilityIndexPct(99.9);
      setLatencyHistory((prev) => [...prev.slice(-15), 35.80]);
      setRuntimeBlocks(
        INITIAL_RUNTIME_BLOCKS.map((b) => ({
          ...b,
          status: 'SEALED',
          integrityPct: b.id === 'rb-05' ? 99.47 : 100.0,
        }))
      );
    }, 1250);
  }, []);

  return {
    runtimeBlocks,
    healingStatus,
    recoveryPhase,
    glitchIntensity,
    latencyMs,
    healingRatePct,
    stabilityIndexPct,
    latencyHistory,
    resilienceEval,
    simulateChaosAndAutoHeal,
  };
}
