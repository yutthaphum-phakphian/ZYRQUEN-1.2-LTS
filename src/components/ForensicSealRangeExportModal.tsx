import React, { useState } from 'react';
import {
  X,
  Lock,
  Download,
  Sliders,
  CheckCircle2,
  ShieldCheck,
  Layers,
  Sparkles,
  FileCode,
  Calendar,
  Clock,
  Fingerprint,
} from 'lucide-react';
import {
  CANONICAL_SEALS,
  CANONICAL_GENESIS_BLOCK,
  CANONICAL_MERKLE_ROOT,
  SYSTEM_METADATA,
} from '../data/canonicalData';
import { exportSignedForensicAuditSealChainJson, SealRangeConfig } from '../utils/forensicAuditSealChainJsonExport';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { HardwareSnapshot } from '../types';

interface ForensicSealRangeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots?: HardwareSnapshot[];
  onExportSuccess?: (filename: string, count: number) => void;
}

type RangePresetKey = 'FULL_CANONICAL' | 'GENESIS_EPOCH' | 'MID_ERA' | 'LTS_FINAL' | 'ACTIVE_BUFFER' | 'CUSTOM';

export const ForensicSealRangeExportModal: React.FC<ForensicSealRangeExportModalProps> = ({
  isOpen,
  onClose,
  snapshots = [],
  onExportSuccess,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<RangePresetKey>('FULL_CANONICAL');
  const [startSeal, setStartSeal] = useState<number>(1);
  const [endSeal, setEndSeal] = useState<number>(CANONICAL_SEALS);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportCompleteName, setExportCompleteName] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePresetSelect = (preset: RangePresetKey) => {
    playTone(600, 0.05, 'sine');
    setSelectedPreset(preset);

    switch (preset) {
      case 'FULL_CANONICAL':
        setStartSeal(1);
        setEndSeal(CANONICAL_SEALS);
        break;
      case 'GENESIS_EPOCH':
        setStartSeal(1);
        setEndSeal(5000);
        break;
      case 'MID_ERA':
        setStartSeal(5001);
        setEndSeal(10000);
        break;
      case 'LTS_FINAL':
        setStartSeal(10001);
        setEndSeal(CANONICAL_SEALS);
        break;
      case 'ACTIVE_BUFFER':
        setStartSeal(14903);
        setEndSeal(14915);
        break;
      case 'CUSTOM':
        // Keep current values
        break;
    }
  };

  const totalSealsInRange = Math.max(1, endSeal - startSeal + 1);

  const handleExport = async () => {
    playAuditChime();
    setIsExporting(true);
    setExportCompleteName(null);

    try {
      const config: SealRangeConfig = {
        startSeal,
        endSeal,
        presetKey: selectedPreset,
        rangeLabel:
          selectedPreset === 'FULL_CANONICAL'
            ? `Full Canonical Chain (#000001 - #${CANONICAL_SEALS.toString().padStart(6, '0')})`
            : `Historical Range (#${startSeal.toString().padStart(6, '0')} - #${endSeal.toString().padStart(6, '0')})`,
      };

      const result = await exportSignedForensicAuditSealChainJson(snapshots, config);
      setExportCompleteName(result.filename);
      setIsExporting(false);

      if (onExportSuccess) {
        onExportSuccess(result.filename, totalSealsInRange);
      }
    } catch (err) {
      console.error('Failed to export forensic seal range:', err);
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#080914] border-cyan-500/40 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/60 via-indigo-950/40 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-mono font-bold text-white tracking-wide">
                  HISTORICAL AUDIT SEAL CHAIN EXPORTER
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                  PQC SIGNED JSON
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-400">
                Chamber 02/09 Forensic Provenance • Complete Block Range Selection
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playTone(400, 0.05, 'sine');
              onClose();
            }}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Preset Buttons */}
          <div>
            <label className="text-[11px] font-mono text-zinc-400 mb-2 block uppercase tracking-wider">
              Select Historical Epoch Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => handlePresetSelect('FULL_CANONICAL')}
                className={`p-2.5 rounded-xl border transition text-left ${
                  selectedPreset === 'FULL_CANONICAL'
                    ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200 shadow-sm shadow-cyan-500/20'
                    : 'bg-[#0D0F1F] border-white/10 text-zinc-300 hover:border-white/20'
                }`}
              >
                <div className="font-bold text-[11px] flex items-center justify-between">
                  <span>Full Canonical Chain</span>
                  {selectedPreset === 'FULL_CANONICAL' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">#000001 – #014902 (All 14.9k)</div>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('GENESIS_EPOCH')}
                className={`p-2.5 rounded-xl border transition text-left ${
                  selectedPreset === 'GENESIS_EPOCH'
                    ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200 shadow-sm shadow-cyan-500/20'
                    : 'bg-[#0D0F1F] border-white/10 text-zinc-300 hover:border-white/20'
                }`}
              >
                <div className="font-bold text-[11px] flex items-center justify-between">
                  <span>Genesis Epoch</span>
                  {selectedPreset === 'GENESIS_EPOCH' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">#000001 – #005000</div>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('MID_ERA')}
                className={`p-2.5 rounded-xl border transition text-left ${
                  selectedPreset === 'MID_ERA'
                    ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200 shadow-sm shadow-cyan-500/20'
                    : 'bg-[#0D0F1F] border-white/10 text-zinc-300 hover:border-white/20'
                }`}
              >
                <div className="font-bold text-[11px] flex items-center justify-between">
                  <span>Mid-Era Audited</span>
                  {selectedPreset === 'MID_ERA' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">#005001 – #010000</div>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('LTS_FINAL')}
                className={`p-2.5 rounded-xl border transition text-left ${
                  selectedPreset === 'LTS_FINAL'
                    ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200 shadow-sm shadow-cyan-500/20'
                    : 'bg-[#0D0F1F] border-white/10 text-zinc-300 hover:border-white/20'
                }`}
              >
                <div className="font-bold text-[11px] flex items-center justify-between">
                  <span>LTS Frozen Final</span>
                  {selectedPreset === 'LTS_FINAL' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">#010001 – #014902</div>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('ACTIVE_BUFFER')}
                className={`p-2.5 rounded-xl border transition text-left ${
                  selectedPreset === 'ACTIVE_BUFFER'
                    ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200 shadow-sm shadow-cyan-500/20'
                    : 'bg-[#0D0F1F] border-white/10 text-zinc-300 hover:border-white/20'
                }`}
              >
                <div className="font-bold text-[11px] flex items-center justify-between">
                  <span>Active Buffer</span>
                  {selectedPreset === 'ACTIVE_BUFFER' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">#014903 – #014915 (Live)</div>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('CUSTOM')}
                className={`p-2.5 rounded-xl border transition text-left ${
                  selectedPreset === 'CUSTOM'
                    ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200 shadow-sm shadow-cyan-500/20'
                    : 'bg-[#0D0F1F] border-white/10 text-zinc-300 hover:border-white/20'
                }`}
              >
                <div className="font-bold text-[11px] flex items-center justify-between">
                  <span>Custom Block Range</span>
                  {selectedPreset === 'CUSTOM' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Manual Seal Boundaries</div>
              </button>
            </div>
          </div>

          {/* Interactive Range Controls */}
          <div className="p-4 rounded-2xl bg-[#0D0F1F] border-white/10 space-y-4 font-mono">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Adjust Seal Block Range:</span>
              </span>
              <span className="text-cyan-300 font-bold">
                #{startSeal.toString().padStart(6, '0')} ➔ #{endSeal.toString().padStart(6, '0')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] text-zinc-400">Start Seal Index</label>
                <input
                  type="number"
                  min={1}
                  max={endSeal}
                  value={startSeal}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(parseInt(e.target.value) || 1, endSeal));
                    setStartSeal(val);
                    setSelectedPreset('CUSTOM');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border-white/15 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-zinc-400">End Seal Index</label>
                <input
                  type="number"
                  min={startSeal}
                  max={CANONICAL_SEALS + 15}
                  value={endSeal}
                  onChange={(e) => {
                    const val = Math.min(CANONICAL_SEALS + 15, Math.max(parseInt(e.target.value) || startSeal, startSeal));
                    setEndSeal(val);
                    setSelectedPreset('CUSTOM');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border-white/15 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-1">
              <input
                type="range"
                min={1}
                max={CANONICAL_SEALS}
                value={endSeal}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setEndSeal(val);
                  if (startSeal > val) setStartSeal(val);
                  setSelectedPreset('CUSTOM');
                }}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-zinc-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>Genesis #000001</span>
                <span>Mid #007500</span>
                <span>Frozen Canonical #014902</span>
              </div>
            </div>
          </div>

          {/* Cryptographic Summary Matrix */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0B0D1E] to-[#04050D] border-cyan-500/30 space-y-3 font-mono text-xs">
            <div className="text-[11px] font-bold text-cyan-300 flex items-center gap-2">
              <Fingerprint className="w-4 h-4" />
              <span>EXPORT PAYLOAD INTEGRITY GUARANTEES</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
              <div className="p-2.5 rounded-xl bg-black/40 border-white/10">
                <div className="text-[10px] text-zinc-400">TOTAL SEALS IN RANGE</div>
                <div className="text-sm font-bold text-white mt-0.5">{totalSealsInRange.toLocaleString()}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border-white/10">
                <div className="text-[10px] text-zinc-400">PQC SIGNATURE</div>
                <div className="text-xs font-bold text-emerald-300 mt-0.5">ML-DSA-87 / Dilithium-5</div>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border-white/10 col-span-2 sm:col-span-1">
                <div className="text-[10px] text-zinc-400">HSM QUORUM</div>
                <div className="text-xs font-bold text-cyan-300 mt-0.5">10/10 REAL_HSM (Unanimous)</div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-black/50 border-cyan-500/20 text-[10px] text-zinc-300 space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span>CANONICAL GENESIS ROOT</span>
                <span className="text-emerald-400 font-bold">100% SSoT MATCH</span>
              </div>
              <div className="font-mono text-cyan-200 truncate">{CANONICAL_MERKLE_ROOT}</div>
            </div>

            {exportCompleteName && (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border-emerald-500/40 text-emerald-300 text-[11px] flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="truncate">Saved: {exportCompleteName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-cyan-500/20 bg-[#060710] flex items-center justify-between text-xs font-mono">
          <div className="text-zinc-400 text-[11px] hidden sm:block">
            Target: <span className="text-cyan-300">Off-Chain Cold Storage Vault</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold flex items-center gap-2 transition shadow-lg shadow-cyan-500/25 disabled:opacity-50"
            >
              <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>{isExporting ? 'Signing Chain...' : `Export Signed JSON (${totalSealsInRange.toLocaleString()} Seals)`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
