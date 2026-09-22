import React, { useState } from 'react';
import { Flame, ShieldAlert, RefreshCw, Zap } from 'lucide-react';
import { useWebAudioTelemetry } from '../hooks/useWebAudioTelemetry';

export const ChaosFaultInjector: React.FC = () => {
  const { playDissonantWarning, playQuarantineAlarm, playTelemetrySweep, stopAllAudio } = useWebAudioTelemetry();
  const [activeTest, setActiveTest] = useState<string | null>(null);

  const runDecoherenceTest = () => {
    setActiveTest('DECOHERENCE_SPIKE');
    playDissonantWarning();
  };

  const runPqcAttackTest = () => {
    setActiveTest('PQC_INTRUSION_ATTACK');
    playQuarantineAlarm();
  };

  const resetAutoHealing = () => {
    stopAllAudio();
    playTelemetrySweep();
    setActiveTest(null);
  };

  return (
    <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl font-mono text-zinc-100 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <Flame className="w-5 h-5 text-rose-400 animate-pulse" />
          <h2 className="text-sm font-bold uppercase">Chaos Engineering Engine</h2>
        </div>
        {activeTest && <span className="text-xs text-amber-400 font-bold">TEST ACTIVE: {activeTest}</span>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button type="button" onClick={runDecoherenceTest} className="p-3 bg-zinc-950 border border-amber-800/60 text-amber-300 rounded-xl text-xs font-bold hover:bg-amber-950/40">
          <Zap className="w-4 h-4 mb-1" />
          1. Trigger Decoherence
        </button>
        <button type="button" onClick={runPqcAttackTest} className="p-3 bg-zinc-950 border border-rose-800/60 text-rose-300 rounded-xl text-xs font-bold hover:bg-rose-950/40">
          <ShieldAlert className="w-4 h-4 mb-1" />
          2. PQC Attack Injection
        </button>
        <button type="button" onClick={resetAutoHealing} className="p-3 bg-emerald-950 border border-emerald-700 text-emerald-300 rounded-xl text-xs font-bold hover:bg-emerald-900">
          <RefreshCw className="w-4 h-4 mb-1" />
          3. Auto-Healing Restore
        </button>
      </div>
    </div>
  );
};
