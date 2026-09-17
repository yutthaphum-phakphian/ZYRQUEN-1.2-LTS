import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Thermometer, Zap, ShieldCheck, Activity, RefreshCw } from 'lucide-react';
import { playAuditChime, playTone } from '../AudioSynthesizer';

interface ThermalNode {
  id: number;
  label: string;
  temp: string; // Kelvin e.g., "0.012K"
  tempNum: number;
  entropyRate: string; // Mbps
  stabilityPct: number;
  enclaveType: string;
}

const INITIAL_THERMAL_NODES: ThermalNode[] = [
  { id: 1, label: 'CRYPTO-BUS #1 (GENESIS)', temp: '0.012K', tempNum: 0.012, entropyRate: '2048 Mbps', stabilityPct: 99.99, enclaveType: 'NitroKey PQC-01' },
  { id: 2, label: 'CRYPTO-BUS #2 (DEFENSE)', temp: '0.015K', tempNum: 0.015, entropyRate: '1920 Mbps', stabilityPct: 99.95, enclaveType: 'YubiHSM-PQC-02' },
  { id: 3, label: 'CRYPTO-BUS #3 (QUANTUM)', temp: '0.018K', tempNum: 0.018, entropyRate: '2450 Mbps', stabilityPct: 99.98, enclaveType: 'Thales Luna-PQC-03' },
  { id: 4, label: 'CRYPTO-BUS #4 (SRE-CORE)', temp: '0.021K', tempNum: 0.021, entropyRate: '1780 Mbps', stabilityPct: 99.92, enclaveType: 'Ledger Donjon-PQC-04' },
];

export const SubKelvinThermalMonitor: React.FC = () => {
  const [nodes, setNodes] = useState<ThermalNode[]>(INITIAL_THERMAL_NODES);
  const [isCalibrating, setIsCalibrating] = useState(false);

  const handleCalibrateCryo = () => {
    setIsCalibrating(true);
    playAuditChime();

    setTimeout(() => {
      setNodes((prev) =>
        prev.map((n) => {
          const newT = Number((0.011 + Math.random() * 0.006).toFixed(3));
          const newE = 1800 + Math.floor(Math.random() * 500);
          return {
            ...n,
            temp: `${newT}K`,
            tempNum: newT,
            entropyRate: `${newE} Mbps`,
          };
        })
      );
      setIsCalibrating(false);
      playTone(880, 0.15, 'sine');
    }, 600);
  };

  return (
    <div className="bg-[#0b0f17]/95 border border-cyan-500/30 rounded-3xl p-6 backdrop-blur-2xl shadow-xl space-y-4 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <Thermometer className="w-4 h-4" />
            </div>
            <h3 className="text-cyan-400 font-bold text-sm sm:text-base tracking-wide flex items-center gap-2 font-mono">
              <span>Sub-Kelvin Thermal & Quantum Entropy Bus</span>
            </h3>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Cryogenic operating thresholds & hardware random state telemetry
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            BUS STABLE &lt; 0.03K
          </span>

          <button
            onClick={handleCalibrateCryo}
            disabled={isCalibrating}
            className="p-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-all text-xs disabled:opacity-50"
            title="ปรับพิกัดอุณหภูมิ Cryogenic"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCalibrating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {nodes.map((node) => (
          <motion.div
            key={node.id}
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-slate-900/80 border border-cyan-500/20 hover:border-cyan-400/50 p-4 rounded-2xl transition-all shadow-sm flex flex-col justify-between space-y-2"
          >
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="font-bold text-cyan-200">{node.label}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                {node.stabilityPct}%
              </span>
            </div>

            <div>
              <div className="text-2xl font-bold font-mono text-cyan-300 tracking-tight drop-shadow">
                {node.temp}
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                {node.enclaveType}
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Entropy Rate:</span>
              <span className="text-emerald-400 font-bold">{node.entropyRate}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
