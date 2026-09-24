// src/components/settings/AuditChimeSettingsCard.tsx
import React, { useState } from 'react';
import { Bell, BellOff, Volume2, VolumeX, Sliders, CheckCircle2, ShieldCheck, Play, Sparkles } from 'lucide-react';
import { useAuditChimeSettings } from '../../hooks/useAuditChimeSettings';
import { playSnapshotSealChime, playComplianceVerificationChime } from '../AudioSynthesizer';

interface AuditChimeSettingsCardProps {
  className?: string;
  compact?: boolean;
}

export const AuditChimeSettingsCard: React.FC<AuditChimeSettingsCardProps> = ({
  className = '',
  compact = false,
}) => {
  const { enabled, volume, volumePercent, setEnabled, setVolumePercent, toggleEnabled, testChime } =
    useAuditChimeSettings();
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  const handleTestChimeClick = () => {
    setIsPlayingTest(true);
    testChime();
    setTimeout(() => setIsPlayingTest(false), 600);
  };

  const handleTestSealClick = () => {
    setIsPlayingTest(true);
    playSnapshotSealChime();
    setTimeout(() => setIsPlayingTest(false), 600);
  };

  const handleTestComplianceClick = () => {
    setIsPlayingTest(true);
    playComplianceVerificationChime();
    setTimeout(() => setIsPlayingTest(false), 600);
  };

  if (compact) {
    return (
      <div className={`p-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex items-center justify-between gap-3 text-xs font-mono ${className}`}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleEnabled}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              enabled
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                : 'bg-zinc-800 text-zinc-500 border-zinc-700'
            }`}
            title={enabled ? 'Audit Chime: ENABLED' : 'Audit Chime: MUTED'}
          >
            {enabled ? <Bell className="w-3.5 h-3.5 animate-pulse" /> : <BellOff className="w-3.5 h-3.5" />}
          </button>
          <div>
            <div className="text-zinc-200 font-bold text-[11px] flex items-center gap-1.5">
              <span>Audit Chime</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-400'}`}>
                {enabled ? `${volumePercent}%` : 'OFF'}
              </span>
            </div>
            <div className="text-[10px] text-zinc-400">Forensic seal sound</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {enabled && (
            <input
              type="range"
              min="0"
              max="100"
              value={volumePercent}
              onChange={(e) => setVolumePercent(Number(e.target.value))}
              className="w-16 accent-amber-400 cursor-pointer h-1 bg-zinc-700 rounded-lg"
              title={`Audit Chime Volume: ${volumePercent}%`}
            />
          )}
          <button
            type="button"
            onClick={handleTestChimeClick}
            disabled={!enabled}
            className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed text-amber-300 border border-amber-500/40 text-[10px] flex items-center gap-1 cursor-pointer transition-all"
          >
            <Play className={`w-2.5 h-2.5 ${isPlayingTest ? 'animate-spin' : ''}`} />
            <span>Test</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-6 rounded-[28px] bg-[#0c1020]/80 border border-amber-500/30 backdrop-blur-xl shadow-xl space-y-5 font-mono text-xs ${className}`}
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all ${
              enabled
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                : 'bg-zinc-800/80 border-zinc-700 text-zinc-500'
            }`}
          >
            {enabled ? <Bell className="w-5 h-5 animate-bounce" /> : <BellOff className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm tracking-wide uppercase">
                Forensic Audit Chime &amp; Compliance Audio Feedback
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                  enabled
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                }`}
              >
                {enabled ? 'CHIME ACTIVE' : 'MUTED'}
              </span>
            </div>
            <p className="text-zinc-400 font-sans text-xs mt-0.5">
              Audio feedback triggered during successful forensic snapshot seals, compliance verification events, and Merkle root confirmations.
            </p>
          </div>
        </div>

        {/* Master Toggle Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={toggleEnabled}
            className={`px-4 py-2 rounded-2xl border font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              enabled
                ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:bg-amber-500/30'
                : 'bg-white/5 hover:bg-white/10 text-zinc-400 border-white/10'
            }`}
          >
            {enabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
            <span>{enabled ? 'AUDIT CHIME: ENABLED' : 'ENABLE AUDIT CHIME'}</span>
          </button>
        </div>
      </div>

      {/* Volume Controls & Live Level Bar */}
      <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Sliders className="w-4 h-4 text-zinc-400 shrink-0" />
          <span className="text-zinc-300 font-bold whitespace-nowrap">Chime Volume:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={volumePercent}
            disabled={!enabled}
            onChange={(e) => setVolumePercent(Number(e.target.value))}
            className="w-40 sm:w-56 accent-amber-400 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          />
          <span className="text-amber-300 font-bold w-12 text-right">{volumePercent}%</span>
        </div>

        {/* Volume Presets */}
        <div className="flex items-center gap-1.5 w-full md:w-auto justify-end">
          <span className="text-[10px] text-zinc-500 mr-1 uppercase">Presets:</span>
          {[25, 50, 75, 100].map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={!enabled}
              onClick={() => setVolumePercent(preset)}
              className={`px-2 py-1 rounded-lg text-[10px] border transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                volumePercent === preset
                  ? 'bg-amber-500/25 text-amber-200 border-amber-500/50 font-bold'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-400 border-white/5'
              }`}
            >
              {preset}%
            </button>
          ))}
        </div>
      </div>

      {/* Test Chimes & Preview Audio Triggers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Test 1: Standard Audit Chime */}
        <button
          type="button"
          disabled={!enabled}
          onClick={handleTestChimeClick}
          className="p-3 rounded-2xl bg-black/30 hover:bg-black/50 border border-amber-500/20 hover:border-amber-500/40 text-left transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group"
        >
          <div className="flex items-center justify-between text-amber-300 mb-1">
            <span className="font-bold flex items-center gap-1.5 text-xs">
              <Play className="w-3 h-3 group-hover:scale-125 transition-transform" />
              Standard Audit Chime
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">C5→E5→G5</span>
          </div>
          <p className="text-[11px] font-sans text-zinc-400 leading-snug">
            Emitted upon Merkle verification passes and manual ledger reconciliation.
          </p>
        </button>

        {/* Test 2: Snapshot Seal Harmonic */}
        <button
          type="button"
          disabled={!enabled}
          onClick={handleTestSealClick}
          className="p-3 rounded-2xl bg-black/30 hover:bg-black/50 border border-cyan-500/20 hover:border-cyan-500/40 text-left transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group"
        >
          <div className="flex items-center justify-between text-cyan-300 mb-1">
            <span className="font-bold flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-3 h-3 group-hover:scale-125 transition-transform" />
              Snapshot Seal Sound
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">C5→G5→C6</span>
          </div>
          <p className="text-[11px] font-sans text-zinc-400 leading-snug">
            Triggered when 14,902 hardware seals are anchored or forensic state is frozen.
          </p>
        </button>

        {/* Test 3: Compliance Ratification */}
        <button
          type="button"
          disabled={!enabled}
          onClick={handleTestComplianceClick}
          className="p-3 rounded-2xl bg-black/30 hover:bg-black/50 border border-emerald-500/20 hover:border-emerald-500/40 text-left transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group"
        >
          <div className="flex items-center justify-between text-emerald-300 mb-1">
            <span className="font-bold flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3 h-3 group-hover:scale-125 transition-transform" />
              Compliance Ratified
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">F5→A5→C6</span>
          </div>
          <p className="text-[11px] font-sans text-zinc-400 leading-snug">
            Emitted upon 16/16 stages unanimous pass and ETDA statutory ratification.
          </p>
        </button>
      </div>

      {/* Compliance Standard Badge */}
      <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-zinc-400">
        <div className="flex items-center gap-2 text-amber-300/90">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Statutory Auditory Feedback Loop (ETDA Electronic Transactions Standards)</span>
        </div>
        <span className="text-zinc-500 text-[10px]">
          State persisted in browser local storage (`zyrquen_audit_chime_*`)
        </span>
      </div>
    </div>
  );
};
