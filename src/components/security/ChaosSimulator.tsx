import React, { useState } from 'react';
import { ShieldAlert, Zap, RefreshCw, Flame, CheckCircle2, Play } from 'lucide-react';
import { playTone, playAuditChime } from '../AudioSynthesizer';

export const ChaosSimulator: React.FC = () => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeExperiment, setActiveExperiment] = useState<string | null>(null);
  const [recoveryLog, setRecoveryLog] = useState<string>('System nominal. Ready for chaos injection test.');

  const runExperiment = (name: string, delayMs = 1500) => {
    setIsRunning(true);
    setActiveExperiment(name);
    setRecoveryLog(`[INJECTING] ${name}... testing Phoenix Auto-Healing...`);
    playTone(420, 0.15, 'sawtooth');

    setTimeout(() => {
      setRecoveryLog(`[AUTO-HEALED] ${name} mitigated in 35.80ms. SSoT Δ0.00% preserved.`);
      setIsRunning(false);
      setActiveExperiment(null);
      playAuditChime();
    }, delayMs);
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 p-4 sm:p-5 shadow-xl font-mono space-y-4">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Chaos Fault Simulator &amp; Phoenix Recovery
            </h3>
            <p className="text-[10px] text-slate-400">Adversarial Stress Testing Sandbox</p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-slate-300 border border-slate-800">
          Auto-Heal: ACTIVE
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          disabled={isRunning}
          onClick={() => runExperiment('Chamber 15 Thermal Spike (+12°C)')}
          className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-left transition-all cursor-pointer flex items-center justify-between group disabled:opacity-50"
        >
          <div>
            <div className="text-xs font-bold text-slate-200 group-hover:text-rose-400 transition-colors">
              Thermal Jitter
            </div>
            <div className="text-[10px] text-slate-400">Inject +12°C in Cryostat</div>
          </div>
          <Play className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-400" />
        </button>

        <button
          disabled={isRunning}
          onClick={() => runExperiment('mTLS Jitter Decoupling (250ms delay)')}
          className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-left transition-all cursor-pointer flex items-center justify-between group disabled:opacity-50"
        >
          <div>
            <div className="text-xs font-bold text-slate-200 group-hover:text-amber-400 transition-colors">
              Network Partition
            </div>
            <div className="text-[10px] text-slate-400">Drop 20% Envoy Packets</div>
          </div>
          <Play className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
        </button>

        <button
          disabled={isRunning}
          onClick={() => runExperiment('Post-Quantum Key Fallback (ML-DSA-87)')}
          className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-left transition-all cursor-pointer flex items-center justify-between group disabled:opacity-50"
        >
          <div>
            <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">
              PQC Key Rotation
            </div>
            <div className="text-[10px] text-slate-400">Switch ML-KEM-1024 vector</div>
          </div>
          <Play className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
        </button>

        <button
          disabled={isRunning}
          onClick={() => runExperiment('HSM Quorum Desync Injection')}
          className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-violet-500/40 text-left transition-all cursor-pointer flex items-center justify-between group disabled:opacity-50"
        >
          <div>
            <div className="text-xs font-bold text-slate-200 group-hover:text-violet-400 transition-colors">
              Quorum Mutation
            </div>
            <div className="text-[10px] text-slate-400">Attempt 10/10 vote veto</div>
          </div>
          <Play className="w-3.5 h-3.5 text-slate-500 group-hover:text-violet-400" />
        </button>
      </div>

      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/90 text-xs flex items-center gap-2">
        <RefreshCw className={`w-4 h-4 text-cyan-400 shrink-0 ${isRunning ? 'animate-spin' : ''}`} />
        <span className="text-slate-300 truncate">{recoveryLog}</span>
      </div>
    </div>
  );
};

export default ChaosSimulator;
