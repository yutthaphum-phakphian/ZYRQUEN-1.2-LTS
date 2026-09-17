"use client";

import React, { useState } from 'react';
import {
  Zap,
  ShieldAlert,
  AlertTriangle,
  Flame,
  Activity,
  Cpu,
  RefreshCw,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { SSOT } from '../lib/ssot-data';
import { playTone, playAuditChime } from './AudioSynthesizer';

interface ThreatSimulation {
  id: string;
  name: string;
  type: string;
  riskScore: number;
  expectedRoute: 'CLEARED_NORMAL' | 'ESCROW_PENDING' | 'BLOCKED_FRAUD';
  description: string;
}

const THREAT_PRESETS: ThreatSimulation[] = [
  {
    id: 'SIM-01',
    name: 'Classical Ed25519 Signature Forgery',
    type: 'Cryptographic Downgrade Injection',
    riskScore: 0.98,
    expectedRoute: 'BLOCKED_FRAUD',
    description: 'พยายามใช้ลายเซ็นคลาสสิก Ed25519 เพื่อปลอมแปลงแทน Dilithium-5 (ML-DSA-87)',
  },
  {
    id: 'SIM-02',
    name: 'Anomalous High-Value Webhook Surge',
    type: 'Escrow Risk Routing',
    riskScore: 0.86,
    expectedRoute: 'ESCROW_PENDING',
    description: 'ธุรกรรมยอดสูงผิดปกติ (Risk 0.86) ถูกกักกันเข้าสู่ Escrow Buffer รอสภาผู้พิทักษ์ 10/10 ตรวจสอบ',
  },
  {
    id: 'SIM-03',
    name: 'Thermal Surge +0.082 J/K (Adiabatic Spike)',
    type: 'Cryogenic Entropy Shock',
    riskScore: 0.91,
    expectedRoute: 'ESCROW_PENDING',
    description: 'การฉีดจำลองความร้อนกระชากในบัส Helium-4 14.98 mK เพื่อทดสอบ Fail-Closed Tripping',
  },
  {
    id: 'SIM-04',
    name: 'Standard Canonical Telemetry Stream',
    type: 'Normal Ingest Payload',
    riskScore: 0.12,
    expectedRoute: 'CLEARED_NORMAL',
    description: 'โทรมาตรปกติจากโหนดพันธมิตรที่ผ่านการลงนาม 10/10 REAL_HSM ครบถ้วน',
  },
];

export const QuantumAnomalyPredictor: React.FC = () => {
  const [activeSimulation, setActiveSimulation] = useState<ThreatSimulation | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [coreTemp, setCoreTemp] = useState<number>(42.5);
  const [memBandwidth, setMemBandwidth] = useState<number>(24.8);
  const [simulationLog, setSimulationLog] = useState<string[]>([]);

  const handleRunSimulation = async (sim: ThreatSimulation) => {
    setIsSimulating(true);
    setActiveSimulation(sim);
    playTone(450, 0.05);

    const log: string[] = [
      `[${new Date().toLocaleTimeString()}] SENTINEL AI: Ingesting payload "${sim.name}"...`,
    ];
    setSimulationLog([...log]);

    await new Promise((r) => setTimeout(r, 200));
    playTone(550, 0.04);
    log.push(`[${new Date().toLocaleTimeString()}] PARSER: Threat Vector = ${sim.type}`);
    log.push(`[${new Date().toLocaleTimeString()}] RISK ENGINE: Evaluated Risk Score = ${sim.riskScore.toFixed(2)}`);
    setSimulationLog([...log]);

    await new Promise((r) => setTimeout(r, 250));

    if (sim.expectedRoute === 'BLOCKED_FRAUD') {
      playTone(320, 0.1);
      log.push(`[${new Date().toLocaleTimeString()}] FAIL-CLOSED TRIGGER: Risk > 0.95 -> ROUTED TO BLOCKED_FRAUD!`);
      log.push(`[${new Date().toLocaleTimeString()}] QUARANTINE: Preserved in Chamber 02 with zero SSoT modification.`);
    } else if (sim.expectedRoute === 'ESCROW_PENDING') {
      playTone(480, 0.08);
      log.push(`[${new Date().toLocaleTimeString()}] SENTINEL INTERCEPTOR: Risk > 0.80 -> ROUTED TO ESCROW_PENDING.`);
      log.push(`[${new Date().toLocaleTimeString()}] BUFFER: Isolated in shadow reconciliation memory.`);
    } else {
      playAuditChime();
      log.push(`[${new Date().toLocaleTimeString()}] DISPATCH: Risk < 0.80 -> CLEARED FOR EXECUTION.`);
    }

    setSimulationLog([...log]);
    setIsSimulating(false);
  };

  return (
    <div className="bg-zinc-950/90 border border-cyan-500/40 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700/60">
                SENTINEL-LEDGER AI INTERCEPTOR
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                FAIL-CLOSED TRIPWIRE
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold font-mono text-zinc-100 mt-0.5">
              Quantum Anomaly & Threat Predictor
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
            Cryo Temp: <span className="text-cyan-400 font-bold">{SSOT.cryoTemp}</span>
          </div>
        </div>
      </div>

      {/* Hardware Telemetry Threshold Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
          <div className="text-zinc-400 text-[11px] flex justify-between">
            <span>Core Temp</span>
            <span className="text-emerald-400">Safe (&lt;85.0°C)</span>
          </div>
          <div className="text-base font-bold text-zinc-100">{coreTemp.toFixed(1)}°C</div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all"
              style={{ width: `${(coreTemp / 85.0) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
          <div className="text-zinc-400 text-[11px] flex justify-between">
            <span>Memory Bandwidth</span>
            <span className="text-cyan-400">&gt; 15.0 GB/s Safe</span>
          </div>
          <div className="text-base font-bold text-cyan-300">{memBandwidth.toFixed(1)} GB/s</div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-cyan-500 h-full transition-all"
              style={{ width: `${(memBandwidth / 32.0) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
          <div className="text-zinc-400 text-[11px] flex justify-between">
            <span>QOps Energy Core</span>
            <span className="text-[#FACC15]">851.9 QOps/s</span>
          </div>
          <div className="text-base font-bold text-[#FDE68A]">Fuel: {SSOT.fuel}</div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-400 h-full transition-all"
              style={{ width: `88.5%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Threat Injection Simulator Buttons */}
      <div className="space-y-2">
        <label className="text-xs font-mono text-zinc-400 block font-semibold">
          จำลองสถานการณ์ภัยคุกคาม (Interactive Threat Injection):
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {THREAT_PRESETS.map((sim) => (
            <button
              key={sim.id}
              onClick={() => handleRunSimulation(sim)}
              disabled={isSimulating}
              className={`p-2.5 rounded-xl border text-left text-xs font-mono transition flex flex-col justify-between gap-1.5 ${
                activeSimulation?.id === sim.id
                  ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200 shadow-md'
                  : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 text-zinc-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-zinc-200">{sim.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    sim.expectedRoute === 'BLOCKED_FRAUD'
                      ? 'bg-rose-950 text-rose-300 border border-rose-700/60'
                      : sim.expectedRoute === 'ESCROW_PENDING'
                      ? 'bg-amber-950 text-amber-300 border border-amber-700/60'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                  }`}
                >
                  {sim.expectedRoute}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans line-clamp-1">
                {sim.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Real-Time Simulation Output Terminal */}
      {simulationLog.length > 0 && (
        <div className="p-3 bg-black/90 border border-zinc-800 rounded-xl space-y-1 font-mono text-[11px] text-zinc-300 max-h-[160px] overflow-y-auto">
          <div className="text-[10px] text-cyan-400 border-b border-zinc-800 pb-1 flex items-center justify-between">
            <span>TERMINAL &bull; REAL-TIME INTERCEPTION STREAM</span>
            <span>STATUS: {isSimulating ? 'INTERCEPTING...' : 'COMPLETED'}</span>
          </div>
          {simulationLog.map((line, idx) => (
            <div key={idx} className="leading-relaxed">
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
