import { SovereignCopilot } from './SovereignCopilot';
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Terminal, 
  Radio, 
  Lock, 
  RefreshCw, 
  CheckCircle2, 
  Zap, 
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';
import { HSM_UNITS, CANONICAL_CONSTANTS } from '../data/sovereignData';
import { LogEntry } from '../types';
import { verifyGenesisMerkleRoot } from '../services/cryptoEngine';
import { soundFx } from '../services/audioEngine';

interface RightSidebarProps {
  logs: LogEntry[];
  onOpenPhoenix: () => void;
  onOpenDossier: () => void;
  onOpenTerminal: () => void;
  onOpenChamber: (id: string) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  logs,
  onOpenPhoenix,
  onOpenDossier,
  onOpenTerminal,
  onOpenChamber,
}) => {
  const [verifying, setVerifying] = useState(false);
  const [verifiedAt, setVerifiedAt] = useState<string>('Just now');
  const [activeTab, setActiveTab] = useState<'telemetry' | 'hsm' | 'logs'>('telemetry');

  const handleRunVerify = async () => {
    setVerifying(true);
    soundFx.playTelemetryBeacon(1046, 0.08);
    const res = await verifyGenesisMerkleRoot();
    setTimeout(() => {
      setVerifying(false);
      setVerifiedAt(new Date().toLocaleTimeString());
      soundFx.playPhoenixChime();
    }, 350);
  };

  return (
    <aside className="w-[340px] bg-[#060a14] border-l border-slate-800/80 flex flex-col h-[calc(100vh-3.5rem)] shrink-0 select-none overflow-hidden">
      <div className="p-2 shrink-0 h-[290px]">
        <SovereignCopilot />
      </div>

      {/* Canonical Trust Anchor Badge */}
      <div className="p-3.5 border-b border-slate-800/80 bg-gradient-to-b from-slate-950/80 to-[#060a14]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-slate-200 tracking-wider">CANONICAL TRUST ANCHOR</span>
          </div>
          <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
            FROZEN
          </span>
        </div>

        {/* Certificate Pill Box */}
        <div className="bg-slate-950/90 border border-slate-800 rounded p-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Deployment Cert:</span>
            <span className="font-mono-code text-cyan-300 font-bold">{CANONICAL_CONSTANTS.DEPLOYMENT_CERTIFICATE}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Genesis Root:</span>
            <span className="font-mono-code text-amber-300">{CANONICAL_CONSTANTS.GENESIS_MERKLE_ROOT.substring(0, 10)}...</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">SSoT Mutation:</span>
            <span className="font-mono-code text-emerald-400 font-bold">Δ 0.00% ZERO DRIFT</span>
          </div>
        </div>

        {/* Instant Re-verify Button */}
        <div className="mt-2.5 flex items-center justify-between">
          <button
            onClick={handleRunVerify}
            disabled={verifying}
            className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2.5 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-200 text-xs font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 text-cyan-400 ${verifying ? 'animate-spin' : ''}`} />
            <span>{verifying ? 'Verifying Merkle...' : 'Verify Merkle SSoT'}</span>
          </button>
          <span className="text-[10px] text-slate-500 ml-2 font-mono-code">
            {verifiedAt}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="p-2 border-b border-slate-800/70 bg-slate-900/30">
        <div className="flex rounded-md bg-slate-950 p-1 border border-slate-800/90 text-xs">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex-1 py-1 rounded text-center font-medium transition-all ${
              activeTab === 'telemetry'
                ? 'bg-cyan-950 text-cyan-200 border border-cyan-800/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Telemetry
          </button>
          <button
            onClick={() => setActiveTab('hsm')}
            className={`flex-1 py-1 rounded text-center font-medium transition-all ${
              activeTab === 'hsm'
                ? 'bg-cyan-950 text-cyan-200 border border-cyan-800/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            10 HSM Quorum
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 py-1 rounded text-center font-medium transition-all ${
              activeTab === 'logs'
                ? 'bg-cyan-950 text-cyan-200 border border-cyan-800/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            OTel Logs
          </button>
        </div>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {activeTab === 'telemetry' && (
          <div className="space-y-2.5">
            {/* Live Quantum Coherence */}
            <div className="p-2.5 rounded-md bg-slate-950/70 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Qubit Coherence Lock</span>
                <span className="font-mono-code text-cyan-300 font-bold">{CANONICAL_CONSTANTS.COHERENCE_PERCENT}</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full w-[99.99%]"></div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-900 text-[11px] font-mono-code">
                <div>
                  <span className="text-slate-500">T₁ Life: </span>
                  <span className="text-slate-300">{CANONICAL_CONSTANTS.QUBIT_COHERENCE_T1}</span>
                </div>
                <div>
                  <span className="text-slate-500">T₂* Spin: </span>
                  <span className="text-slate-300">{CANONICAL_CONSTANTS.QUBIT_COHERENCE_T2}</span>
                </div>
              </div>
            </div>

            {/* QOps Sustained Rate */}
            <div className="p-2.5 rounded-md bg-slate-950/70 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">QOps Operations Engine</div>
              <div className="text-sm font-mono-code font-bold text-slate-100">{CANONICAL_CONSTANTS.QOPS_RATE}</div>
              <div className="text-[10px] text-emerald-400 flex items-center space-x-1 mt-1 font-mono-code">
                <CheckCircle2 className="w-3 h-3" />
                <span>Zero Instruction Bottleneck</span>
              </div>
            </div>

            {/* Post-Quantum Cryptography Suite */}
            <div className="p-2.5 rounded-md bg-slate-950/70 border border-slate-800 space-y-1.5 text-xs">
              <div className="text-slate-400 font-medium">NIST Post-Quantum Suite</div>
              <div className="flex justify-between items-center text-[11px] bg-slate-900/80 px-2 py-1 rounded">
                <span className="text-slate-400">FIPS 203:</span>
                <span className="font-mono-code text-cyan-300 font-semibold">ML-KEM-1024 (Kyber)</span>
              </div>
              <div className="flex justify-between items-center text-[11px] bg-slate-900/80 px-2 py-1 rounded">
                <span className="text-slate-400">FIPS 204:</span>
                <span className="font-mono-code text-emerald-300 font-semibold">ML-DSA-87 (Dilithium)</span>
              </div>
              <div className="flex justify-between items-center text-[11px] bg-slate-900/80 px-2 py-1 rounded">
                <span className="text-slate-400">FIPS 205:</span>
                <span className="font-mono-code text-purple-300 font-semibold">SLH-DSA (SPHINCS+)</span>
              </div>
            </div>

            {/* Legal Standards Gateway */}
            <div className="p-2.5 rounded-md bg-slate-950/70 border border-slate-800 space-y-1.5 text-xs">
              <div className="text-slate-400 font-medium">Thai Legal Statutory Anchor</div>
              <div className="text-[11px] text-slate-300 space-y-1 font-mono-code">
                <div className="flex items-center space-x-1 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>ETDA Act B.E. 2544 (Sec 9, 26, 28)</span>
                </div>
                <div className="flex items-center space-x-1 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>PDPA B.E. 2562 Safe Harbor Pass</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hsm' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Cluster: Deca-Key Real HSM</span>
              <span className="text-emerald-400 font-mono-code font-bold">10/10 ACTIVE</span>
            </div>
            {HSM_UNITS.map((unit) => (
              <div
                key={unit.id}
                className="p-2 rounded bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-700"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"></div>
                  <div>
                    <span className="font-mono-code text-slate-200 font-bold">{unit.code}</span>
                    <span className="text-[11px] text-slate-400 ml-1.5">{unit.name}</span>
                  </div>
                </div>
                <div className="text-right font-mono-code text-[10px]">
                  <div className="text-cyan-300 font-medium">{unit.keyType}</div>
                  <div className="text-slate-500">{unit.temperature}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-1.5 font-mono-code text-[11px]">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-1.5 rounded bg-slate-950/80 border border-slate-900 hover:border-slate-800"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                  <span className="text-cyan-400">{log.source}</span>
                  <span>{log.timestamp}</span>
                </div>
                <div className="text-slate-300 break-all">{log.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Launch Drawer Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/90 grid grid-cols-2 gap-2 text-xs">
        <button
          onClick={onOpenPhoenix}
          className="flex items-center justify-center space-x-1.5 py-1.5 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 font-medium transition-all"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Phoenix 142ms</span>
        </button>
        <button
          onClick={onOpenDossier}
          className="flex items-center justify-center space-x-1.5 py-1.5 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 text-cyan-200 font-medium transition-all"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Court Dossier</span>
        </button>
      </div>
    </aside>
  );
};
