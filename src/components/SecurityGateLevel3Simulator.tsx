import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Fingerprint, Lock, ShieldCheck, Activity, Terminal, AlertTriangle, FileDown, Cpu, ServerCrash, RefreshCcw, FileText } from 'lucide-react';

type SimState = 'IDLE' | 'AUTHORIZED' | 'THREAT_INJECTED' | 'ZEROIZATION' | 'PQC_SWITCH' | 'TRACE_REPLAY' | 'LOCKED_SECURE';

export const SecurityGateLevel3Simulator: React.FC = () => {
  const [simState, setSimState] = useState<SimState>('IDLE');
  const [logs, setLogs] = useState<string[]>([]);
  const [traceStage, setTraceStage] = useState<number>(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toISOString().split('T')[1].slice(0,-1)}] ${msg}`]);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleAuthorize = () => {
    setSimState('AUTHORIZED');
    addLog('OMEGA-1 Authorization Accepted. Executive Passport #EP-SOVEREIGN-01 Verified.');
    addLog('Security Gate Level 3 (Sovereign Vault & Emergency Control Gate) Unlocked.');
    addLog('System Status: MAINNET LIVE 100% GREEN');
  };

  const handleInjectThreat = () => {
    setSimState('THREAT_INJECTED');
    addLog('WARNING: External threat injected. Simulating Physical Drill on TC-03 (NitroKey HSM-PQC-05).');
    
    setTimeout(() => {
      setSimState('ZEROIZATION');
      addLog('CRITICAL: Tamper Foil breached. Voltage glitch detected.');
      addLog('ACTION: Active Zeroization triggered.');
      addLog('ACTION: Dilithium-5 secrets purged from RAM in 0.48ms.');
    }, 1500);

    setTimeout(() => {
      setSimState('PQC_SWITCH');
      addLog('SYSTEM: Hardware state transitioned to FAIL-CLOSED.');
      addLog('ACTION: Crypto-Agility Fallback activated.');
      addLog('ACTION: Switched to Stateless Hash-based SPHINCS+ (SLH-DSA-192).');
    }, 3500);

    setTimeout(() => {
      setSimState('TRACE_REPLAY');
      addLog('SYSTEM: Initiating 12-Stage Forensic Trace Replay on affected block.');
      startTraceReplay();
    }, 5500);
  };

  const startTraceReplay = () => {
    let currentStage = 1;
    const stages = [
      "STG-01: INGEST (4.2ms)",
      "STG-02: ML-DSA-87 (12.4ms)",
      "STG-03: ML-KEM-1024 (10.8ms)",
      "STG-04: SLH-DSA (14.2ms)",
      "STG-05: LEAF-HASH (8.5ms)",
      "STG-06: MERKLE-ROOT (15.3ms)",
      "STG-07: HSM-QUORUM (16.2ms)",
      "STG-08: SENTINEL (9.1ms)",
      "STG-09: LEGAL-PDPA (14.5ms)",
      "STG-10: WARP-RELAY (16.4ms)",
      "STG-11: MINT-SEAL (10.9ms)",
      "STG-12: CERT-EMISSION (9.5ms)"
    ];

    const interval = setInterval(() => {
      if (currentStage <= 12) {
        setTraceStage(currentStage);
        addLog(`TRACE: ${stages[currentStage - 1]} VERIFIED.`);
        currentStage++;
      } else {
        clearInterval(interval);
        setSimState('LOCKED_SECURE');
        addLog('SYSTEM: 12-Stage Forensic Trace Replay completed in 35.80ms.');
        addLog('SYSTEM: Threat neutralized. System locked in secure state (SSoT Δ0).');
        addLog('REPORT: zyrquen-official-forensic-audit-report.pdf generated.');
      }
    }, 400);
  };

  const resetSim = () => {
    setSimState('IDLE');
    setLogs([]);
    setTraceStage(0);
  };

  return (
    <div className="space-y-6 font-mono text-xs text-zinc-300">
      {/* Header */}
      <div className="p-6 bg-[#0b0d18] border border-rose-500/30 rounded-2xl shadow-[0_0_30px_rgba(244,63,94,0.1)] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <ShieldAlert className="w-32 h-32 text-rose-500" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-rose-400 tracking-widest">SECURITY GATE LEVEL 3</h2>
              <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/50 rounded text-[10px] font-bold tracking-wider">
                THREAT INJECTION LAB
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 max-w-2xl">
              Sovereign Vault & Emergency Control Gate Simulation. Verify Fail-Closed isolation, Active Zeroization (&lt;1.2ms), and 12-Stage Forensic Trace Replay against ETA Section 28 compliance.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Controls & Status */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-black/40 border border-white/10 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              Command Center
            </h3>
            
            {simState === 'IDLE' && (
              <button 
                onClick={handleAuthorize}
                className="w-full py-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Fingerprint className="w-5 h-5" />
                APPROVE OMEGA-1 CLEARANCE
              </button>
            )}

            {simState === 'AUTHORIZED' && (
              <button 
                onClick={handleInjectThreat}
                className="w-full py-3 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-400 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(244,63,94,0.2)] animate-pulse"
              >
                <ServerCrash className="w-5 h-5" />
                INJECT TC-03 PHYSICAL THREAT
              </button>
            )}

            {(simState !== 'IDLE' && simState !== 'AUTHORIZED') && (
              <button 
                onClick={resetSim}
                disabled={simState !== 'LOCKED_SECURE'}
                className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors ${
                  simState === 'LOCKED_SECURE' 
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600' 
                    : 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                }`}
              >
                <RefreshCcw className="w-5 h-5" />
                RESET SIMULATION
              </button>
            )}
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Real-time Hardware Status
            </h3>
            
            <div className="space-y-3">
              <StatusRow 
                label="TC-03 Node State" 
                value={simState === 'IDLE' || simState === 'AUTHORIZED' ? 'ONLINE (DILITHIUM-5)' : 'ISOLATED (ZEROIZED)'}
                color={simState === 'IDLE' || simState === 'AUTHORIZED' ? 'text-emerald-400' : 'text-rose-400'}
              />
              <StatusRow 
                label="Promotion Gate" 
                value={(simState === 'THREAT_INJECTED' || simState === 'ZEROIZATION' || simState === 'PQC_SWITCH' || simState === 'TRACE_REPLAY' || simState === 'LOCKED_SECURE') ? 'FAIL-CLOSED' : 'SECURE-OPEN'}
                color={(simState === 'THREAT_INJECTED' || simState === 'ZEROIZATION' || simState === 'PQC_SWITCH' || simState === 'TRACE_REPLAY' || simState === 'LOCKED_SECURE') ? 'text-rose-400' : 'text-emerald-400'}
              />
              <StatusRow 
                label="Active Crypto" 
                value={simState === 'LOCKED_SECURE' || simState === 'TRACE_REPLAY' || simState === 'PQC_SWITCH' ? 'SPHINCS+ (FALLBACK)' : 'DILITHIUM-5 (PRIMARY)'}
                color={simState === 'LOCKED_SECURE' || simState === 'TRACE_REPLAY' || simState === 'PQC_SWITCH' ? 'text-purple-400' : 'text-cyan-400'}
              />
              <StatusRow 
                label="Baseline Drift" 
                value="0.00% (SSoT Δ0)"
                color="text-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Console & Trace Replay */}
        <div className="lg:col-span-2 space-y-6">
          {/* Output Console */}
          <div className="bg-[#050810] border border-white/10 rounded-xl overflow-hidden flex flex-col h-[280px]">
            <div className="p-3 bg-white/5 border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-bold text-zinc-300">Level 3 Gate Telemetry Console</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50"></div>
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1 font-mono text-[11px] leading-relaxed">
              {logs.length === 0 ? (
                <div className="text-zinc-600 italic">Waiting for Omega-1 Authorization...</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className={`${
                    log.includes('CRITICAL') ? 'text-rose-400 font-bold' : 
                    log.includes('WARNING') ? 'text-amber-400' :
                    log.includes('ACTION') ? 'text-cyan-300' :
                    log.includes('VERIFIED') ? 'text-emerald-400' :
                    log.includes('REPORT') ? 'text-purple-400 font-bold' :
                    'text-zinc-400'
                  }`}>
                    {log}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>

          {/* Trace Replay Pipeline UI */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                12-Stage Trace Replay Pipeline
              </div>
              <span className="text-[10px] text-zinc-500 bg-white/5 px-2 py-1 rounded">SLA: &lt;142ms</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {[...Array(12)].map((_, i) => {
                const stageNum = i + 1;
                let bgClass = "bg-zinc-900 border-white/5 text-zinc-600";
                let icon = <Lock className="w-3 h-3" />;
                
                if (traceStage >= stageNum) {
                  bgClass = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]";
                  icon = <ShieldCheck className="w-3 h-3" />;
                } else if (traceStage === stageNum - 1 && simState === 'TRACE_REPLAY') {
                  bgClass = "bg-amber-500/10 border-amber-500/50 text-amber-400 animate-pulse";
                  icon = <Activity className="w-3 h-3" />;
                }

                return (
                  <div key={stageNum} className={`p-2 rounded border flex flex-col items-center justify-center text-center gap-1.5 transition-all duration-300 ${bgClass}`}>
                    {icon}
                    <span className="text-[9px] font-bold">STG-{stageNum.toString().padStart(2, '0')}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Report Download */}
          {simState === 'LOCKED_SECURE' && (
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <FileText className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-purple-300">zyrquen-official-forensic-audit-report.pdf</div>
                  <div className="text-[10px] text-purple-400/70">Generated at {new Date().toISOString()} • SHA-256 Verified</div>
                </div>
              </div>
              <button className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-2">
                <FileDown className="w-4 h-4" />
                DOWNLOAD REPORT
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

const StatusRow = ({ label, value, color }: { label: string, value: string, color: string }) => (
  <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
    <span className="text-zinc-500">{label}</span>
    <span className={`font-bold ${color}`}>{value}</span>
  </div>
);
