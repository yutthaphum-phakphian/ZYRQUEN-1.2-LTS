import React, { useState } from 'react';
import { OfficialSealLogo } from './OfficialSealLogo';
import { CheckCircle2, ShieldCheck, Sparkles, X } from 'lucide-react';

interface SealShowcaseProps {
  onClose?: () => void;
  className?: string;
}

export const SealShowcase: React.FC<SealShowcaseProps> = ({ onClose, className = "" }) => {
  const [lastStamped, setLastStamped] = useState<string | null>(null);

  const handleStampAction = (name: string) => {
    setLastStamped(name);
    setTimeout(() => setLastStamped(null), 3000);
  };

  return (
    <div className={`w-full max-w-5xl mx-auto p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-6 text-slate-100 font-sans ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold font-mono text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            OFFICIAL DIGITAL EVIDENCE SEALS
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            คลิกที่ตราประทับเพื่อจำลองการประทับตราดิจิทัล (Digital Stamping Action)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastStamped && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/80 border border-emerald-500/80 rounded-full text-xs font-mono text-emerald-300 animate-in fade-in duration-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Applied Seal: {lastStamped}</span>
            </div>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        {/* 1. Gold Sovereign */}
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center justify-between space-y-4 hover:border-amber-500/40 transition">
          <OfficialSealLogo
            variant="gold"
            size={190}
            titleText="ZYRQUEN Ω∞ GOLD MASTER"
            subText="100% VERIFIED FORENSIC SEAL"
            centerCode="GENESIS-01"
            onStamp={() => handleStampAction("Gold Master Sovereign")}
          />
          <div>
            <span className="text-xs font-mono font-bold text-amber-400 block">GOLD MASTER SOVEREIGN</span>
            <span className="text-[10px] text-slate-500 font-mono">สำหรับ Master Certificate &amp; Deployment Gate</span>
          </div>
        </div>

        {/* 2. Court Evidence Red Wax */}
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center justify-between space-y-4 hover:border-red-500/40 transition">
          <OfficialSealLogo
            variant="wax-red"
            size={190}
            titleText="COURT ADMISSIBLE EVIDENCE"
            subText="FROZEN FORENSIC PAYLOAD"
            centerCode="COURT-A3"
            onStamp={() => handleStampAction("Court Evidence Red Wax")}
          />
          <div>
            <span className="text-xs font-mono font-bold text-red-400 block">COURT EVIDENCE WAX</span>
            <span className="text-[10px] text-slate-500 font-mono">สำหรับนำส่งรายงานหลักฐานต่อศาล (PDF/A-3)</span>
          </div>
        </div>

        {/* 3. Cyber Cyan PQC */}
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center justify-between space-y-4 hover:border-cyan-500/40 transition">
          <OfficialSealLogo
            variant="cyber-cyan"
            size={190}
            titleText="PQC DILITHIUM-5 ATTESTED"
            subText="SSOT Δ0.00% ZERO DRIFT"
            centerCode="ML-DSA-87"
            onStamp={() => handleStampAction("Cyber Cyan PQC Security")}
          />
          <div>
            <span className="text-xs font-mono font-bold text-cyan-400 block">CYBER PQC SECURITY</span>
            <span className="text-[10px] text-slate-500 font-mono">สำหรับระบบนิติวิทยาศาสตร์และ Live Verification</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SealShowcase;
