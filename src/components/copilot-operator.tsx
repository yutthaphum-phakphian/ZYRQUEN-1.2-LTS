import React, { useState } from 'react';
import { VerificationPanel } from './verification-panel';

export function OperatorCopilot() {
  const [status, setStatus] = useState('VERIFIED');

  const handleAudit = () => {
    setStatus('PENDING');
    setTimeout(() => setStatus('VERIFIED'), 3000);
  };

  return (
    <div className="bg-[#0a0f1e] border-[#06B6D4]/30 p-6 rounded-2xl text-white font-mono shadow-[0_0_30px_rgba(6,182,212,0.15)]">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-wide text-white flex items-center gap-2">
          <span>👑 Sovereign Assistant & Operator Copilot</span>
        </h2>
        <span className="text-xs px-2.5 py-1 rounded-full bg-[#070a12] text-[#D4AF37] border-[#D4AF37]/40 font-bold">
          OMEGA-1
        </span>
      </div>

      <VerificationPanel status={status} />

      <button
        onClick={handleAudit}
        className="mt-4 px-5 py-2.5 bg-[#D4AF37] hover:bg-[#c49f27] text-black rounded-xl font-bold text-xs transition-all shadow-[0_0_15px_rgba(212,175,55,0.4)] flex items-center gap-2"
      >
        <span>Re-Run Verification Audit</span>
      </button>
    </div>
  );
}
