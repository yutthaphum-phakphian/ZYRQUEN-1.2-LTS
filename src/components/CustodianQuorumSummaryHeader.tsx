import React from 'react';
import { Users, ShieldAlert, CheckCircle2, Lock, Shield } from 'lucide-react';

interface CustodianQuorumSummaryHeaderProps {
  realHsmSignedCount: number;
  totalSlots: number;
  requiredQuorum: number;
  remainingCount: number;
  isQuorumSatisfied: boolean;
  aggregateStatus: 'PENDING' | 'QUORUM_SATISFIED';
  promotionStatus: 'FAIL-CLOSED' | 'PENDING_FINAL_GATES';
}

export const CustodianQuorumSummaryHeader: React.FC<CustodianQuorumSummaryHeaderProps> = ({
  realHsmSignedCount,
  totalSlots = 10,
  requiredQuorum = 8,
  remainingCount,
  isQuorumSatisfied,
  aggregateStatus,
  promotionStatus,
}) => {
  // Generate physical block bar: e.g. █████░░░░░
  const visualProgressBar = Array.from({ length: totalSlots }, (_, i) =>
    i < realHsmSignedCount ? '█' : '░'
  ).join('');

  return (
    <div
      id="custodian-quorum-summary-header"
      className="p-5 rounded-2xl bg-gradient-to-r from-black via-[#090d19] to-black border-2 border-amber-500/40 space-y-4 font-mono text-xs shadow-xl"
    >
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
              PHYSICAL HSM CUSTODIAN QUORUM
            </span>
          </div>
          <div className="text-base sm:text-lg font-bold text-white flex items-center gap-3 flex-wrap">
            <span className="text-emerald-400 font-extrabold">{realHsmSignedCount} / {totalSlots}</span>
            <span className="text-zinc-200">REAL HSM SIGNED</span>
            <span className="text-emerald-400 font-mono tracking-widest text-sm sm:text-base bg-black/80 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
              {visualProgressBar}
            </span>
          </div>
        </div>

        {/* Quorum and Promotion Badge */}
        <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                isQuorumSatisfied
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              {isQuorumSatisfied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>QUORUM SATISFIED ({realHsmSignedCount}/{totalSlots})</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>STATUS: {aggregateStatus} ({realHsmSignedCount}/{totalSlots} REAL HSM)</span>
                </>
              )}
            </span>
            <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold border bg-rose-500/20 text-rose-300 border-rose-500/40 flex items-center gap-1">
              <Lock className="w-3 h-3 text-rose-400" />
              <span>PROMOTION: {promotionStatus}</span>
            </span>
          </div>
          <div className="text-[10px] text-zinc-400">
            SSoT Mutation: <strong className="text-emerald-400">0</strong> &bull; Write Authority: <strong className="text-rose-400">NONE</strong>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] pt-1">
        <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-0.5">
          <div className="text-zinc-400 text-[10px]">REQUIRED THRESHOLD</div>
          <div className="text-white font-bold text-sm">{requiredQuorum} / {totalSlots} HSMs</div>
          <div className="text-[10px] text-zinc-500">Immutable ETDA / Sovereign Gate</div>
        </div>

        <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-0.5">
          <div className="text-zinc-400 text-[10px]">REMAINING PROOFS NEEDED</div>
          <div className={`font-bold text-sm ${remainingCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {remainingCount} REAL HSM {remainingCount === 1 ? 'Proof' : 'Proofs'}
          </div>
          <div className="text-[10px] text-zinc-500">
            {remainingCount > 0 ? 'Awaiting Physical Keyholders' : 'Threshold Reached'}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-0.5">
          <div className="text-zinc-400 text-[10px]">AGGREGATE STATUS</div>
          <div className={`font-bold text-sm ${isQuorumSatisfied ? 'text-emerald-400' : 'text-amber-400'}`}>
            {aggregateStatus}
          </div>
          <div className="text-[10px] text-zinc-500">Derived strictly from Real HSMs</div>
        </div>

        <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-0.5">
          <div className="text-rose-400 text-[10px] font-bold">PROMOTION CIRCUIT</div>
          <div className="text-rose-300 font-bold text-sm">{promotionStatus}</div>
          <div className="text-[10px] text-zinc-500">Non-Bypassable Fail-Closed Invariant</div>
        </div>
      </div>
    </div>
  );
};
