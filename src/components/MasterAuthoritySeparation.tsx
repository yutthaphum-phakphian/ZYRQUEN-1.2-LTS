import React from 'react';
import { MASTER_STATE_SEPARATION } from '../data/sovereignData';

export const MasterAuthoritySeparation: React.FC = () => {
  return (
    <section id="authority-separation-section" className="bg-[#0a0f1e] border border-[#17233f] p-4 mb-8">
      <div className="flex items-center justify-between border-b border-[#17233f] pb-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-[#D4AF37] flex items-center gap-2">
            <span>🛡️</span> MASTER STATE AUTHORITY SEPARATION (INVARIANT MANDATE)
          </h2>
          <p className="text-xs text-[#9CA3AF] mt-0.5 font-mono">
            การแยกสิทธิ์สถานะเด็ดขาด — ป้องกันการอนุมานสิทธิ์ข้ามมิติในระบอบอธิปไตยดิจิทัล
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 bg-[#070a12] text-[#06B6D4] border border-[#17233f]">
          FAIL-CLOSED ARMED
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
        {MASTER_STATE_SEPARATION.map((item, index) => (
          <div
            key={index}
            id={`separation-rule-${index}`}
            className="p-3 bg-[#070a12] border border-[#17233f] hover:border-[#D4AF37] transition-colors"
          >
            <div className="flex items-center justify-between font-bold mb-1">
              <span className="text-[#06B6D4] text-[11px] truncate max-w-[45%]">
                {item.left}
              </span>
              <span className="text-[#EF4444] font-bold text-sm px-2">
                {item.sign}
              </span>
              <span className="text-[#D4AF37] text-[11px] truncate max-w-[45%] text-right">
                {item.right}
              </span>
            </div>
            <p className="text-[11px] text-[#9CA3AF] mt-2 border-t border-[#17233f] pt-1.5">
              {item.meaning}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 p-2 bg-[#070a12] border border-[#10B981] flex flex-wrap items-center justify-between text-xs font-mono text-[#F3F4F6]">
        <div className="flex items-center gap-2">
          <span className="text-[#10B981]">✅ INVARIANT AUDIT:</span>
          <span>Δ0.00% ZERO DRIFT</span>
        </div>
        <div className="text-[#9CA3AF]">
          Promotion Protocol: <span className="text-[#EF4444] font-bold">FAIL-CLOSED</span> | Auto-Reseal: <span className="text-[#EF4444] font-bold">BLOCKED</span>
        </div>
        <div className="text-[#D4AF37]">
          Boundary: Ω600_1000
        </div>
      </div>
    </section>
  );
};
