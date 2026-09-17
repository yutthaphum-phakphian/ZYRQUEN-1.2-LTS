import React, { useState } from 'react';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  Cpu,
  Hash,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Layers,
  Copy,
  Check,
} from 'lucide-react';
import { AUDIT_TRACE_TX, CANONICAL_MERKLE_ROOT, CANONICAL_GENESIS_BLOCK } from '../../data/canonicalData';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { copyToClipboard } from '../../utils/clipboard';

export const ForensicTraceReplay: React.FC = () => {
  const [activeStageIdx, setActiveStageIdx] = useState<number>(11); // Default to full completion
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const stages = AUDIT_TRACE_TX.stages;

  const handlePlayReplay = () => {
    setIsPlaying(true);
    setActiveStageIdx(0);
    playAuditChime();

    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current < stages.length) {
        setActiveStageIdx(current);
        playTone(500 + current * 40, 0.04);
      } else {
        clearInterval(interval);
        setIsPlaying(false);
        playTone(880, 0.08);
      }
    }, 450);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setActiveStageIdx(stages.length - 1);
    playTone(450, 0.04);
  };

  const handleCopy = (text: string, id: string) => {
    copyToClipboard(text);
    setCopiedHash(id);
    playTone(700, 0.04);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Replay Control Header */}
      <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">{AUDIT_TRACE_TX.txId}</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
              12/12 DETERMINISTIC
            </span>
          </div>
          <div className="text-zinc-400 text-[11px] mt-0.5">
            Total Latency: <span className="text-cyan-300 font-bold">{AUDIT_TRACE_TX.totalLatencyMs}ms</span> • Sealed Block: <span className="text-amber-300 font-bold">#{AUDIT_TRACE_TX.sealedLedgerBlock}</span> • Root Actor: <span className="text-zinc-300">{AUDIT_TRACE_TX.rootActor}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePlayReplay}
            disabled={isPlaying}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isPlaying ? 'Replaying...' : 'Replay Trace'}</span>
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Full Trace</span>
          </button>
        </div>
      </div>

      {/* 12-Stage Step Flow */}
      <div className="space-y-2">
        {stages.map((st, idx) => {
          const isCurrentOrPassed = idx <= activeStageIdx;
          const isSelected = selectedStage === idx;

          return (
            <div
              key={st.id}
              onClick={() => {
                playTone(isSelected ? 450 : 600, 0.03);
                setSelectedStage(isSelected ? null : idx);
              }}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isCurrentOrPassed
                  ? 'bg-black/50 border-white/10 hover:border-cyan-500/40'
                  : 'bg-black/20 border-white/5 opacity-40'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] ${
                      isCurrentOrPassed
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/5 text-zinc-600'
                    }`}
                  >
                    {st.stageNumber}
                  </span>
                  <div>
                    <span className="font-bold text-white text-xs">{st.name}</span>
                    <span className="text-zinc-500 text-[11px] ml-2 hidden sm:inline">{st.shortDesc}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-zinc-400 text-[10px] hidden md:inline">{st.durationMs}ms</span>
                  <span className="text-[10px] text-zinc-500 font-mono hidden lg:inline">{st.actor}</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    PASS
                  </span>
                  {isSelected ? (
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                  )}
                </div>
              </div>

              {isSelected && (
                <div className="mt-3 pt-3 border-t border-white/5 text-[11px] grid grid-cols-1 md:grid-cols-2 gap-3 bg-white/[0.01] p-3 rounded-lg">
                  <div className="space-y-1">
                    <div className="text-zinc-500 text-[10px] uppercase font-bold">Source Module &amp; Actor</div>
                    <div className="text-zinc-300 font-bold">{st.sourceModule}</div>
                    <div className="text-cyan-300 text-[10px]">{st.actor}</div>

                    <div className="text-zinc-500 text-[10px] uppercase font-bold pt-2">Stage Metadata</div>
                    <div className="space-y-0.5">
                      {Object.entries(st.metadata).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-[10px]">
                          <span className="text-zinc-500">{k}:</span>
                          <span className="text-zinc-200 font-bold">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-zinc-500 text-[10px] uppercase font-bold">Cryptographic Hashes</div>
                    <div className="space-y-1 text-[10px]">
                      <div>
                        <span className="text-zinc-500">Parent: </span>
                        <code className="text-zinc-400">{st.parentHash}</code>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <div className="truncate">
                          <span className="text-zinc-500">Output: </span>
                          <code className="text-emerald-400">{st.outputHash}</code>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(st.outputHash, st.id);
                          }}
                          className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-zinc-300 text-[9px] shrink-0"
                        >
                          {copiedHash === st.id ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
