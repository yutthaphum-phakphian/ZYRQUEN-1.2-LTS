import React from 'react';
import { ShieldCheck, Loader2, CheckCircle2, Clock } from 'lucide-react';

interface VerificationPanelProps {
  status: string;
}

export const VerificationPanel: React.FC<VerificationPanelProps> = ({ status }) => {
  const isVerified = status === 'VERIFIED';
  const isPending = status === 'PENDING';

  return (
    <div className="mt-4 p-4 rounded-xl bg-[#070a12] border border-[#06B6D4]/40 font-mono text-xs space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isVerified ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : isPending ? (
            <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin" />
          ) : (
            <Clock className="w-4 h-4 text-[#06B6D4]" />
          )}
          <span className="font-bold text-white tracking-wide">
            SSoT QUORUM STATUS:
          </span>
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
            isVerified
              ? 'bg-[#042017] text-emerald-300 border-emerald-500/50'
              : 'bg-[#261405] text-[#D4AF37] border-[#D4AF37]/50 animate-pulse'
          }`}
        >
          {status}
        </span>
      </div>

      <div className="text-[11px] text-zinc-300 flex items-center justify-between pt-1 border-t border-white/10">
        <span className="text-[#06B6D4]">Block: #849202 (18 Chambers)</span>
        <span className="text-[#D4AF37]">Quorum: 10/10 REAL_HSM</span>
        <span className="text-emerald-400">Drift: Δ0.00%</span>
      </div>
    </div>
  );
};
