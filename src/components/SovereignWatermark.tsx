import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Sliders, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { playTone } from './AudioSynthesizer';

export interface WatermarkConfig {
  enabled: boolean;
  opacity: number; // 0.01 to 0.15
  fontSize: number; // 12 to 28
  pattern: 'diagonal-grid' | 'corner-stamp' | 'center-halo';
  showGenesisMeta: boolean;
  showCustomNote: boolean;
  customNote: string;
}

const WATERMARK_STORAGE_KEY = 'zyrquen_watermark_overlay_cfg_v1';

export const DEFAULT_WATERMARK_CONFIG: WatermarkConfig = {
  enabled: true,
  opacity: 0.045,
  fontSize: 16,
  pattern: 'diagonal-grid',
  showGenesisMeta: true,
  showCustomNote: false,
  customNote: 'CONFIDENTIAL • COURT-READY ATTRIBUTION',
};

export function getStoredWatermarkConfig(): WatermarkConfig {
  if (typeof window === 'undefined') return DEFAULT_WATERMARK_CONFIG;
  try {
    const raw = localStorage.getItem(WATERMARK_STORAGE_KEY);
    if (!raw) return DEFAULT_WATERMARK_CONFIG;
    return { ...DEFAULT_WATERMARK_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_WATERMARK_CONFIG;
  }
}

export function saveStoredWatermarkConfig(cfg: WatermarkConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WATERMARK_STORAGE_KEY, JSON.stringify(cfg));
  } catch (err) {
    console.warn('Failed to save watermark config:', err);
  }
}

interface SovereignWatermarkOverlayProps {
  currentView?: string;
}

export const SovereignWatermarkOverlay: React.FC<SovereignWatermarkOverlayProps> = ({ currentView }) => {
  const [config, setConfig] = useState<WatermarkConfig>(DEFAULT_WATERMARK_CONFIG);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  useEffect(() => {
    setConfig(getStoredWatermarkConfig());

    const handleStorage = (e: StorageEvent) => {
      if (e.key === WATERMARK_STORAGE_KEY && e.newValue) {
        try {
          setConfig(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const updateConfig = (patch: Partial<WatermarkConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      saveStoredWatermarkConfig(next);
      return next;
    });
  };

  if (!config.enabled) {
    return (
      <div className="fixed bottom-2 left-2 z-30 pointer-events-auto">
        <button
          onClick={() => {
            playTone(660, 0.05);
            updateConfig({ enabled: true });
          }}
          className="p-1.5 rounded-lg bg-black/40 hover:bg-black/80 border border-white/5 hover:border-cyan-500/30 text-zinc-600 hover:text-cyan-400 text-[10px] font-mono transition-all backdrop-blur-md opacity-40 hover:opacity-100 flex items-center gap-1 shadow-sm"
          title="Enable ZYRQUEN Ω∞ Subtle Watermark Overlay"
        >
          <Eye className="w-3 h-3" />
          <span className="hidden sm:inline">Watermark Off</span>
        </button>
      </div>
    );
  }

  // Pre-generate grid repetition points for diagonal pattern
  const gridRows = [0, 1, 2, 3, 4, 5, 6, 7];
  const gridCols = [0, 1, 2, 3, 4, 5];

  return (
    <>
      {/* Non-interactive, click-through subtle watermark layer spanning entire viewport */}
      <aside
        aria-hidden="true"
        aria-label="Watermark overlay"
        className="fixed inset-0 pointer-events-none z-[15] overflow-hidden select-none"
        style={{ opacity: config.opacity }}
      >
        {config.pattern === 'diagonal-grid' && (
          <div className="w-full h-full flex flex-col justify-around py-8">
            {gridRows.map((row) => (
              <div
                key={row}
                className="flex justify-around items-center whitespace-nowrap transform -rotate-12 translate-x-[-5%]"
              >
                {gridCols.map((col) => (
                  <div
                    key={col}
                    className="flex flex-col items-center justify-center font-mono font-black tracking-widest text-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.3)] mx-6 my-4"
                    style={{ fontSize: `${config.fontSize}px` }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400">⚡</span>
                      <span>ZYRQUEN Ω∞</span>
                      <span className="text-[0.65em] font-light px-1.5 py-0.5 rounded border border-cyan-400/40 text-cyan-200">
                        SOVEREIGN
                      </span>
                    </div>
                    {config.showGenesisMeta && (
                      <div className="text-[0.55em] font-normal tracking-normal text-slate-300/90 mt-0.5 flex items-center gap-1">
                        <span>#849202</span>
                        <span>•</span>
                        <span>SSoT Δ0.00%</span>
                        {currentView && (
                          <>
                            <span>•</span>
                            <span className="uppercase text-cyan-400">{currentView}</span>
                          </>
                        )}
                      </div>
                    )}
                    {config.showCustomNote && config.customNote && (
                      <div className="text-[0.45em] font-normal tracking-wider text-amber-300/80 uppercase">
                        {config.customNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {config.pattern === 'corner-stamp' && (
          <div className="w-full h-full relative p-6 flex flex-col justify-between">
            {/* Top Left */}
            <div className="font-mono text-cyan-300 flex items-center gap-2" style={{ fontSize: `${config.fontSize}px` }}>
              <span className="font-black">ZYRQUEN Ω∞</span>
              <span className="text-xs text-slate-400">#849202 • CANONICAL SSoT</span>
            </div>
            {/* Top Right */}
            <div className="self-end font-mono text-cyan-300 text-right" style={{ fontSize: `${config.fontSize * 0.9}px` }}>
              <span className="font-bold">DOC-SOV-HSM-1010-2026-V9</span>
              <div className="text-xs text-amber-400 font-normal">FIPS 140-3 L4 • ETDA SEC 9/26/28</div>
            </div>
            {/* Bottom Left */}
            <div className="font-mono text-cyan-300" style={{ fontSize: `${config.fontSize * 0.85}px` }}>
              <div>SOVEREIGN WORLD ENGINE • ATTRIBUTION STAMP</div>
              <div className="text-xs text-slate-400">0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68</div>
            </div>
            {/* Bottom Right */}
            <div className="self-end font-mono text-cyan-300 text-right" style={{ fontSize: `${config.fontSize * 0.9}px` }}>
              <div className="font-black text-amber-400">ZYRQUEN Ω∞ MAINNET</div>
              <div className="text-xs text-slate-400">ARCHITECT: นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)</div>
            </div>
          </div>
        )}

        {config.pattern === 'center-halo' && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center font-mono select-none" style={{ transform: 'scale(1.2)' }}>
              <div
                className="font-black tracking-[0.35em] text-cyan-300 uppercase leading-none drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                style={{ fontSize: `${config.fontSize * 2.8}px` }}
              >
                ZYRQUEN Ω∞
              </div>
              <div className="text-lg tracking-[0.2em] text-amber-400/90 font-bold mt-3">
                SOVEREIGN WORLD ENGINE • GENESIS #849202
              </div>
              <div className="text-xs text-slate-300 font-mono tracking-widest mt-1 opacity-80">
                SSoT Δ0.00% ZERO-DRIFT • PQC DILITHIUM-5 & SPHINCS+
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Floating subtle trigger button at bottom-left corner */}
      <div className="fixed bottom-2 left-2 z-30 pointer-events-auto">
        <button
          onClick={() => {
            playTone(720, 0.05);
            setIsCustomizeOpen((prev) => !prev);
          }}
          className="group flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/40 hover:bg-slate-900/90 border border-white/10 hover:border-cyan-500/40 text-zinc-400 hover:text-cyan-300 text-[10px] font-mono transition-all backdrop-blur-md opacity-40 hover:opacity-100 shadow-sm cursor-pointer"
          title="Customize ZYRQUEN Ω∞ Subtle Watermark Overlay"
        >
          <Sparkles className="w-3 h-3 text-cyan-400 group-hover:rotate-45 transition-transform" />
          <span className="hidden sm:inline font-bold">ZYRQUEN Ω∞ Watermark</span>
          <span className="text-[9px] text-zinc-500 font-normal">({Math.round(config.opacity * 100)}%)</span>
          <Sliders className="w-2.5 h-2.5 opacity-60" />
        </button>
      </div>

      {/* Watermark Customization Drawer Modal */}
      <AnimatePresence>
        {isCustomizeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-md bg-slate-950/95 border border-cyan-500/30 rounded-2xl p-5 shadow-[0_0_40px_rgba(6,182,212,0.25)] font-mono text-zinc-200"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-cyan-300">
                      ZYRQUEN Ω∞ Watermark Overlay
                    </h3>
                    <p className="text-[10px] text-zinc-400">
                      Subtle visual branding &amp; document attribution controls
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCustomizeOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Controls */}
              <div className="space-y-4 text-xs">
                {/* Enable / Disable Toggle */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-semibold text-zinc-300">Overlay Active</span>
                  <button
                    onClick={() => {
                      playTone(config.enabled ? 440 : 880, 0.05);
                      updateConfig({ enabled: !config.enabled });
                    }}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] border transition-all ${
                      config.enabled
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {config.enabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>

                {/* Opacity Slider */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-zinc-400">Opacity (Subtle Intensity):</span>
                    <span className="text-cyan-400 font-bold font-mono">
                      {(config.opacity * 100).toFixed(1)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.15"
                    step="0.005"
                    value={config.opacity}
                    onChange={(e) => updateConfig({ opacity: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500 mt-0.5">
                    <span>Ultra Subtle (1%)</span>
                    <span>Recommended (4.5%)</span>
                    <span>Prominent (15%)</span>
                  </div>
                </div>

                {/* Font Size Slider */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-zinc-400">Font Size:</span>
                    <span className="text-cyan-400 font-bold font-mono">{config.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="26"
                    step="1"
                    value={config.fontSize}
                    onChange={(e) => updateConfig({ fontSize: parseInt(e.target.value, 10) })}
                    className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Pattern Selector */}
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1.5">Watermark Pattern:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'diagonal-grid', label: 'Diagonal Grid', desc: 'Tiled repeating matrix' },
                      { id: 'corner-stamp', label: 'Corner Stamp', desc: 'Court certificate stamp' },
                      { id: 'center-halo', label: 'Center Halo', desc: 'Supreme central seal' },
                    ].map((pat) => (
                      <button
                        key={pat.id}
                        onClick={() => {
                          playTone(700, 0.05);
                          updateConfig({ pattern: pat.id as any });
                        }}
                        className={`p-2 rounded-xl text-left border transition-all text-[10px] ${
                          config.pattern === pat.id
                            ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)] font-bold'
                            : 'bg-slate-900 border-slate-800 text-zinc-400 hover:border-slate-700 hover:text-zinc-200'
                        }`}
                      >
                        <div className="font-semibold">{pat.label}</div>
                        <div className="text-[8px] opacity-70 mt-0.5">{pat.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Toggles */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-zinc-400">Include Genesis Metadata (#849202, SSoT)</span>
                    <input
                      type="checkbox"
                      checked={config.showGenesisMeta}
                      onChange={(e) => updateConfig({ showGenesisMeta: e.target.checked })}
                      className="accent-cyan-400 rounded cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-zinc-400">Include Custom Attribution Note</span>
                    <input
                      type="checkbox"
                      checked={config.showCustomNote}
                      onChange={(e) => updateConfig({ showCustomNote: e.target.checked })}
                      className="accent-cyan-400 rounded cursor-pointer"
                    />
                  </label>
                  {config.showCustomNote && (
                    <input
                      type="text"
                      value={config.customNote}
                      onChange={(e) => updateConfig({ customNote: e.target.value })}
                      placeholder="e.g. COURT EXHIBIT ATTRIBUTION"
                      className="w-full mt-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-400"
                    />
                  )}
                </div>

                {/* Reset & Done Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <button
                    onClick={() => {
                      playTone(500, 0.05);
                      setConfig(DEFAULT_WATERMARK_CONFIG);
                      saveStoredWatermarkConfig(DEFAULT_WATERMARK_CONFIG);
                    }}
                    className="text-zinc-500 hover:text-zinc-300 text-[10px] underline cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                  <button
                    onClick={() => {
                      playTone(880, 0.06);
                      setIsCustomizeOpen(false);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs hover:opacity-95 shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SovereignWatermarkOverlay;
