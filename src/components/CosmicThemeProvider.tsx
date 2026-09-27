import React, { createContext, useContext, useState } from 'react';
import {
  verifySovereignIdentityGate,
  SovereignIdentityGateState,
  computeQuantarisResilienceScore,
} from '../utils/hologramMaterial';
import { ShieldCheck, Sparkles, Lock } from 'lucide-react';

export interface CosmicThemeContextValue {
  paletteMode: 'FROZEN_QUANTUM' | 'SOVEREIGN_GOLD';
  setPaletteMode: (mode: 'FROZEN_QUANTUM' | 'SOVEREIGN_GOLD') => void;
  identityGate: SovereignIdentityGateState;
  hologramBloomEnabled: boolean;
  setHologramBloomEnabled: (v: boolean) => void;
  resilienceScore: number;
}

const CosmicThemeContext = createContext<CosmicThemeContextValue>({
  paletteMode: 'FROZEN_QUANTUM',
  setPaletteMode: () => {},
  identityGate: verifySovereignIdentityGate(),
  hologramBloomEnabled: true,
  setHologramBloomEnabled: () => {},
  resilienceScore: 99.6,
});

export const useCosmicTheme = () => useContext(CosmicThemeContext);

export interface CosmicThemeProviderProps {
  children: React.ReactNode;
  resilienceScore?: number;
}

export const CosmicThemeProvider: React.FC<CosmicThemeProviderProps> = ({
  children,
  resilienceScore = 99.6,
}) => {
  const [paletteMode, setPaletteMode] = useState<'FROZEN_QUANTUM' | 'SOVEREIGN_GOLD'>('FROZEN_QUANTUM');
  const [hologramBloomEnabled, setHologramBloomEnabled] = useState<boolean>(true);
  const identityGate = verifySovereignIdentityGate();

  const evalTier = computeQuantarisResilienceScore(35.8, resilienceScore, resilienceScore);

  // Dynamic Neon Gradient Mesh surface shifting based on Resilience Score
  const meshSurfaceClass =
    resilienceScore >= 90
      ? 'from-[#050712] via-[#0b0f24] to-[#060916] border-violet-500/35'
      : resilienceScore >= 75
      ? 'from-[#040914] via-[#071526] to-[#040812] border-cyan-500/35'
      : resilienceScore >= 50
      ? 'from-[#120b05] via-[#1b1106] to-[#0a0704] border-amber-500/35'
      : 'from-[#160609] via-[#22080d] to-[#0c0406] border-rose-500/40';

  const primaryGlowHex =
    resilienceScore >= 90
      ? 'rgba(139, 92, 246, 0.14)'
      : resilienceScore >= 75
      ? 'rgba(6, 182, 212, 0.14)'
      : resilienceScore >= 50
      ? 'rgba(245, 158, 11, 0.14)'
      : 'rgba(239, 68, 68, 0.16)';

  const secondaryGlowHex =
    resilienceScore >= 90
      ? 'rgba(6, 182, 212, 0.12)'
      : resilienceScore >= 75
      ? 'rgba(59, 130, 246, 0.12)'
      : resilienceScore >= 50
      ? 'rgba(212, 175, 55, 0.12)'
      : 'rgba(244, 63, 94, 0.14)';

  return (
    <CosmicThemeContext.Provider
      value={{
        paletteMode,
        setPaletteMode,
        identityGate,
        hologramBloomEnabled,
        setHologramBloomEnabled,
        resilienceScore,
      }}
    >
      <div
        className={`relative rounded-2xl bg-gradient-to-br ${meshSurfaceClass} border p-4 sm:p-6 shadow-2xl overflow-hidden transition-colors duration-500`}
        data-theme-palette={paletteMode}
      >
        {/* Dynamic Neon Gradient Mesh — Frozen-Quantum palette surface responsive to resilience score */}
        {hologramBloomEnabled && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl transition-all duration-500"
              style={{ backgroundColor: primaryGlowHex }}
            />
            <div
              className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-3xl transition-all duration-500"
              style={{ backgroundColor: secondaryGlowHex }}
            />
          </div>
        )}

        {/* Top Federation Identity Gate & Neon Gradient Mesh Status Strip */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-white/10 font-mono text-xs tabular-nums">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-semibold flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>FEDERATION IDENTITY GATE: {identityGate.gateStatus}</span>
            </span>
            <span className="text-zinc-300">
              Principal: <strong className="text-[#D4AF37]">{identityGate.principalName} ({identityGate.principalId})</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded-md border text-[11px] font-semibold flex items-center gap-1"
              style={{
                backgroundColor: `${evalTier.accentHex}18`,
                borderColor: `${evalTier.accentHex}55`,
                color: evalTier.accentHex,
              }}
            >
              <Sparkles className="w-3 h-3" />
              <span>Neon Gradient Mesh: {evalTier.tierLabel} ({resilienceScore.toFixed(1)})</span>
            </span>

            <button
              type="button"
              onClick={() => setHologramBloomEnabled((v) => !v)}
              className="px-2.5 py-0.5 rounded-md bg-black/50 hover:bg-black/70 border border-white/15 text-zinc-300 text-[11px] cursor-pointer"
            >
              {hologramBloomEnabled ? 'Cosmic Bloom: ON' : 'Cosmic Bloom: OFF'}
            </button>
          </div>
        </div>

        <div className="relative z-10">{children}</div>
      </div>
    </CosmicThemeContext.Provider>
  );
};
