import { useState } from 'react';

// ZYRQUEN Ω∞ APEX ULTIMATE MASTER EDITION FROZEN v1.2 LTS
// Principal: นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01) | Corrected Name
// Boundary: Ω600_1000 (400 Tenants LOCKED)
export default function ZyrquenCard({ standalone = true }: { standalone?: boolean }) {
  const [isBlinking, setIsBlinking] = useState(true);

  return (
    <div className={`${standalone ? 'min-h-screen' : 'w-full py-6'} bg-[#070a12] flex items-center justify-center p-4 font-mono relative overflow-hidden`}>
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#0a0f1e 1px, transparent 1px), linear-gradient(90deg, #0a0f1e 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div
        className={`relative w-full max-w-[580px] rounded-[24px] bg-[#0a0f1e]/90 backdrop-blur-xl border-2 p-6 shadow-2xl transition-all ${
          isBlinking ? 'animate-zyrquen' : 'border-[#D4AF37]/30'
        }`}
      >
        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="text-4xl font-black tracking-wider text-[#06B6D4] animate-pulse">
            ZYRQUEN Ω∞
          </h1>
          <p className="text-[11px] text-cyan-200/80 mt-1 tracking-[0.2em] font-bold">
            APEX ULTIMATE MASTER EDITION FROZEN v1.2 LTS
          </p>
          <p className="text-[10px] text-white/50 mt-1">
            Sovereign Operating System & Civilization Intelligence Control Plane
          </p>
        </div>

        {/* Status */}
        <div className="flex gap-2 justify-center mb-5 flex-wrap">
          <span className="px-2.5 py-1 rounded-full bg-purple-500/20 border-purple-400/30 text-[10px] text-purple-200">
            Status: LOCKED_FROZEN_v1.2_LTS
          </span>
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border-amber-400/30 text-[10px] text-amber-200">
            Δ 0.00% ZERO DRIFT
          </span>
          <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 border-cyan-400/30 text-[10px] text-cyan-200">
            Quorum: 10/10 REAL_HSM
          </span>
        </div>

        {/* Block & Merkle */}
        <div className="space-y-3 text-[12px]">
          <div className="flex gap-2">
            <span>🔒</span>
            <div>
              <p className="text-white/90 font-bold">Block & Merkle Proof</p>
              <p className="text-[#D4AF37] mt-1 break-all">
                #849202 | Merkle: 909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68
              </p>
            </div>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex gap-2">
            <span>🏆</span>
            <div>
              <p className="text-white/90 font-bold">Sovereign Certificate</p>
              <p className="text-amber-200/80 mt-1">Cert: ZQ-GOLD-DEP-849202-3908</p>
              <p className="text-cyan-200/80">
                Seals: 14,902 Verified | Ω600_1000 = 400 Tenants LOCKED | Δ0.00% SSoT
              </p>
            </div>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex gap-2">
            <span>👑</span>
            <div>
              <p className="text-white font-bold">
                Principal: นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01) Clearance: OMEGA-1
              </p>
            </div>
          </div>
        </div>

        {/* ASCII Logo */}
        <div className="mt-6 p-3 bg-black/40 rounded-xl border-white/5 text-center">
          <div className="text-[8px] leading-[8px] text-cyan-300/70 font-mono tracking-widest">
            ███████╗██╗   ██╗██████╗  ██████╗ ██╗   ██╗███████╗<br />
            ╚══███╔╝╚██╗ ██╔╝██╔══██╗██╔═══██╗██║   ██║██╔════╝<br />
            &nbsp;&nbsp;███╔╝&nbsp;&nbsp;╚████╔╝&nbsp;██████╔╝██║&nbsp;&nbsp;&nbsp;██║██║&nbsp;&nbsp;&nbsp;██║█████╗<br />
            &nbsp;███╔╝&nbsp;&nbsp;&nbsp;&nbsp;╚██╔╝&nbsp;&nbsp;██╔══██╗██║▄▄&nbsp;██║██║&nbsp;&nbsp;&nbsp;██║██╔══╝
          </div>
          <p className="text-[9px] text-white/40 mt-2">
            Sovereign Operating System & Civilization Intelligence Control Plane
          </p>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <div
            className={`inline-block px-6 py-2 rounded-full bg-emerald-500/10 border-emerald-400/40 text-emerald-300 text-[12px] font-bold tracking-widest ${
              isBlinking ? 'animate-pulse' : ''
            }`}
          >
            RUNTIME-VERIFIED 100% GREEN
          </div>
        </div>

        {/* Toggle */}
        <div className="mt-5 flex justify-center">
          <button
            onClick={() => setIsBlinking(!isBlinking)}
            className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border-white/10 text-[11px] text-white/70 transition cursor-pointer"
          >
            {isBlinking ? '⏸️ หยุดกระพริบ' : '▶️ เปิดกระพริบ'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes zyrquen {
          0% { border-color: #06B6D4; box-shadow: 0 0 20px #06B6D4, 0 0 60px rgba(6,182,212,0.2), inset 0 0 20px rgba(6,182,212,0.1); }
          33% { border-color: #D4AF37; box-shadow: 0 0 30px #D4AF37, 0 0 70px rgba(212,175,55,0.3), inset 0 0 25px rgba(212,175,55,0.15); }
          66% { border-color: #a855f7; box-shadow: 0 0 25px #a855f7, 0 0 60px rgba(168,85,247,0.25), inset 0 0 20px rgba(168,85,247,0.12); }
          100% { border-color: #06B6D4; box-shadow: 0 0 20px #06B6D4, 0 0 60px rgba(6,182,212,0.2), inset 0 0 20px rgba(6,182,212,0.1); }
        }
        .animate-zyrquen { animation: zyrquen 2.2s infinite ease-in-out; }
      `}</style>
    </div>
  );
}
