import React, { useState } from 'react';
import { HardwareSnapshot } from '../../types';
import { Box, Hash, Clock, Cpu, MemoryStick, Activity, Network } from 'lucide-react';
import { copyToClipboard } from '../../utils/clipboard';

interface Props {
  snapshots: HardwareSnapshot[];
}

export const BlocksVisualizationTool: React.FC<Props> = ({ snapshots }) => {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  
  const selectedSnapshot = snapshots.find(s => s.id === selectedBlockId) || null;

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Block List / Grid */}
      <div className="w-full md:w-1/3 max-h-[700px] overflow-y-auto custom-scrollbar p-2 bg-[#0b0e1a]/70 rounded-2xl border border-white/5 space-y-3">
        <h3 className="text-sm font-mono font-bold text-blue-300 px-2 py-1 sticky top-0 bg-[#0b0e1a]/95 backdrop-blur-md z-10 border-b border-blue-500/20">
          Immutable Block Ledger
        </h3>
        {snapshots.map((snap) => (
          <div
            key={snap.id}
            onClick={() => setSelectedBlockId(snap.id)}
            className={`p-3 rounded-xl border font-mono cursor-pointer transition-all ${
              selectedBlockId === snap.id
                ? 'bg-blue-500/20 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] text-white'
                : 'bg-black/40 border-white/5 hover:border-blue-500/50 hover:bg-black/60 text-zinc-400'
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold flex items-center gap-2 text-xs">
                <Box className="w-3.5 h-3.5" /> Block #{snap.snapshotNumber}
              </span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full ${
                selectedBlockId === snap.id ? 'bg-blue-500/30 text-blue-200' : 'bg-emerald-500/10 text-emerald-400'
              }`}>
                {snap.status}
              </span>
            </div>
            <div className="text-[10px] text-zinc-500 truncate mt-1">
              {snap.sealedHash}
            </div>
          </div>
        ))}
      </div>

      {/* Block Details Pane */}
      <div className="w-full md:w-2/3 bg-black/50 rounded-2xl border border-white/5 p-6 space-y-6">
        {!selectedSnapshot ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 font-mono text-sm space-y-4 py-20">
            <Box className="w-16 h-16 opacity-20" />
            <p>Select a block from the ledger to view immutable details.</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-200 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl font-mono font-bold text-blue-300 flex items-center gap-3">
                  <Box className="w-6 h-6 text-blue-400" /> Block #{selectedSnapshot.snapshotNumber} Details
                </h2>
                <div className="text-xs font-mono text-zinc-400 mt-1 flex items-center gap-2">
                  <Clock className="w-3 h-3" /> {selectedSnapshot.timestampUtc || selectedSnapshot.timestampIct}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 block uppercase font-mono">Status</span>
                <span className="px-3 py-1 bg-emerald-500/15 text-emerald-300 rounded border border-emerald-500/30 text-xs font-mono font-bold">
                  {selectedSnapshot.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono font-bold border-b border-white/5 pb-2">
                  <Hash className="w-4 h-4" /> Cryptographic Identity
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block">SEALED HASH</span>
                  <div className="flex items-start gap-2">
                    <p className="text-xs text-blue-300 font-mono break-all flex-1">
                      {selectedSnapshot.sealedHash}
                    </p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(selectedSnapshot.sealedHash); }}
                      className="text-blue-400 hover:text-white p-1 rounded-md bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 transition-all flex-shrink-0"
                      title="Copy Hash"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block mt-2">PARENT HASH</span>
                  <div className="flex items-start gap-2">
                    <p className="text-xs text-zinc-400 font-mono break-all flex-1">
                      {selectedSnapshot.parentHash}
                    </p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(selectedSnapshot.parentHash); }}
                      className="text-zinc-400 hover:text-white p-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex-shrink-0"
                      title="Copy Parent Hash"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono font-bold border-b border-white/5 pb-2">
                  <Activity className="w-4 h-4" /> Telemetry Metadata
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-zinc-500 block">CPU LOAD</span>
                    <span className="text-white flex items-center gap-1.5"><Cpu className="w-3 h-3 text-blue-400"/> {selectedSnapshot.cpuAverage}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">MEMORY USED</span>
                    <span className="text-white flex items-center gap-1.5"><MemoryStick className="w-3 h-3 text-violet-400"/> {selectedSnapshot.memoryUsedMb} MB</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">NETWORK I/O</span>
                    <span className="text-white flex items-center gap-1.5"><Network className="w-3 h-3 text-emerald-400"/> {"0xN/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">ACTOR</span>
                    <span className="text-amber-300">{selectedSnapshot.actor}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-black/40 rounded-xl border border-white/5">
              <span className="text-[10px] text-zinc-500 block font-mono mb-2">RAW PAYLOAD PREVIEW</span>
              <pre className="text-[10px] font-mono text-emerald-300/80 bg-black/60 p-3 rounded-lg overflow-x-auto border border-emerald-500/10">
{JSON.stringify({
  snapshotNumber: selectedSnapshot.snapshotNumber,
  actor: selectedSnapshot.actor,
  timestampUtc: selectedSnapshot.timestampUtc,
  cpuAverage: selectedSnapshot.cpuAverage,
  memoryUsedMb: selectedSnapshot.memoryUsedMb,
  cryoTempMk: selectedSnapshot.cryoTempMk,
  sealedHash: selectedSnapshot.sealedHash
}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
