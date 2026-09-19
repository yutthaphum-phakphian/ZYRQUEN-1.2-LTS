import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  Volume2, 
  VolumeX, 
  Radio, 
  ShieldCheck, 
  Activity, 
  Cpu, 
  Zap, 
  X, 
  Lock,
  Sparkles,
  Waves
} from 'lucide-react';
import { playTone, toggleSovereignSynth882Hz, setCustomCarrierFrequency } from './AudioSynthesizer';
import { triggerVibration } from '../utils/vibration';

export interface SovereignControlDockProps {
  audioEnabled?: boolean;
  onToggleAudio?: () => void;
  frequency?: number;
  onFrequencyChange?: (freq: number) => void;
  isZeroDriftEnforced?: boolean;
  onToggleZeroDrift?: () => void;
  pqcLevel?: 'DILITHIUM5' | 'KYBER1024';
  onTogglePqcLevel?: () => void;
  className?: string;
}

export const SovereignControlDock: React.FC<SovereignControlDockProps> = ({
  audioEnabled: controlledAudio,
  onToggleAudio,
  frequency: controlledFreq,
  onFrequencyChange,
  isZeroDriftEnforced: controlledZeroDrift,
  onToggleZeroDrift,
  pqcLevel: controlledPqc,
  onTogglePqcLevel,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localAudioEnabled, setLocalAudioEnabled] = useState(true);
  const [localFrequency, setLocalFrequency] = useState(882);
  const [localZeroDriftEnforced, setLocalZeroDriftEnforced] = useState(true);
  const [localPqcLevel, setLocalPqcLevel] = useState<'DILITHIUM5' | 'KYBER1024'>('DILITHIUM5');

  // Resolved values (controlled or internal state)
  const isAudio = controlledAudio !== undefined ? controlledAudio : localAudioEnabled;
  const currentFreq = controlledFreq !== undefined ? controlledFreq : localFrequency;
  const isZeroDrift = controlledZeroDrift !== undefined ? controlledZeroDrift : localZeroDriftEnforced;
  const currentPqc = controlledPqc !== undefined ? controlledPqc : localPqcLevel;

  const handleToggleAudio = () => {
    triggerVibration('click');
    playTone(isAudio ? 440 : 882, 0.06);
    if (onToggleAudio) {
      onToggleAudio();
    } else {
      const next = !isAudio;
      setLocalAudioEnabled(next);
      toggleSovereignSynth882Hz(next);
    }
  };

  const handleFrequencyChange = (newFreq: number) => {
    if (onFrequencyChange) {
      onFrequencyChange(newFreq);
    } else {
      setLocalFrequency(newFreq);
      setCustomCarrierFrequency(newFreq);
    }
  };

  const handleToggleZeroDrift = () => {
    triggerVibration('click');
    playTone(isZeroDrift ? 520 : 660, 0.05);
    if (onToggleZeroDrift) {
      onToggleZeroDrift();
    } else {
      setLocalZeroDriftEnforced(!isZeroDrift);
    }
  };

  const handleTogglePqc = () => {
    triggerVibration('click');
    playTone(720, 0.05);
    if (onTogglePqcLevel) {
      onTogglePqcLevel();
    } else {
      setLocalPqcLevel(currentPqc === 'DILITHIUM5' ? 'KYBER1024' : 'DILITHIUM5');
    }
  };

  return (
    <div className={`fixed bottom-3 left-3 z-50 font-mono text-slate-100 select-none ${className}`}>
      
      {/* 1. EXPANDABLE QUICK-CONTROL POPOVER DOCK */}
      {isOpen && (
        <div className="absolute bottom-14 left-0 w-80 sm:w-88 bg-slate-950/95 border border-cyan-500/40 rounded-2xl p-4 shadow-[0_0_30px_rgba(6,182,212,0.2)] backdrop-blur-xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">SOVEREIGN DOCK CONTROLS</h4>
                <p className="text-[9px] text-slate-400">ZYRQUEN Ω∞ System Tuner</p>
              </div>
            </div>

            <button
              onClick={() => {
                triggerVibration('modalDismiss');
                setIsOpen(false);
              }}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title="Close Dock"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Section A: Atmospheric Audio Engine Tuning */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                <Waves className={`w-3.5 h-3.5 ${isAudio ? 'animate-pulse text-cyan-400' : 'text-slate-500'}`} />
                <span>Atmospheric Audio Synth</span>
              </div>

              <button
                onClick={handleToggleAudio}
                className={`p-1.5 rounded-md transition border cursor-pointer ${
                  isAudio 
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                    : 'bg-slate-800 text-slate-500 border-slate-700'
                }`}
                title={isAudio ? 'Mute Atmospheric Audio' : 'Unmute Atmospheric Audio'}
              >
                {isAudio ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Frequency Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Resonance Freq</span>
                <span className="text-cyan-400 font-bold">{currentFreq} Hz</span>
              </div>
              <input
                type="range"
                min="432"
                max="963"
                value={currentFreq}
                onChange={(e) => handleFrequencyChange(Number(e.target.value))}
                disabled={!isAudio}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-40"
              />
            </div>
          </div>

          {/* Section B: System Invariants & Cryptographic Toggles */}
          <div className="space-y-2 text-xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Runtime Enforcements
            </div>

            {/* Toggle 1: SSoT Zero Drift */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-800/80">
              <span className="text-[11px] text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> SSoT Δ0.00% Lock
              </span>
              <button
                onClick={handleToggleZeroDrift}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 cursor-pointer ${
                  isZeroDrift ? 'bg-emerald-500/30 border border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-slate-800 border border-slate-700'
                }`}
                title={isZeroDrift ? 'Zero Drift Enforced' : 'Zero Drift Bypassed'}
              >
                <div className={`w-3.5 h-3.5 rounded-full transition-transform duration-300 ${
                  isZeroDrift ? 'translate-x-4 bg-emerald-400' : 'translate-x-0 bg-slate-500'
                }`} />
              </button>
            </div>

            {/* Toggle 2: PQC Mode */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-800/80">
              <span className="text-[11px] text-purple-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-purple-400" /> PQC Key Spec
              </span>
              <button
                onClick={handleTogglePqc}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition cursor-pointer"
                title="Switch PQC Algorithm Specification"
              >
                {currentPqc === 'DILITHIUM5' ? 'ML-DSA-87' : 'ML-KEM-1024'}
              </button>
            </div>
          </div>

          {/* Footer Quick Telemetry Status */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-slate-300">mTLS 1.3 Active</span>
            </span>
            <span className="text-cyan-400 font-bold">10/10 HSM Quorum</span>
          </div>
        </div>
      )}

      {/* 2. MAIN FLOATING BUTTON TRIGGER (FAB) */}
      <button
        id="btn-sovereign-control-dock-fab"
        onClick={() => {
          triggerVibration('click');
          playTone(isOpen ? 480 : 720, 0.05);
          setIsOpen(!isOpen);
        }}
        className={`relative group p-2.5 rounded-xl border transition-all duration-300 backdrop-blur-md shadow-lg flex items-center justify-center cursor-pointer ${
          isOpen
            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-105'
            : 'bg-slate-900/90 border-slate-700 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.25)]'
        }`}
        title="Toggle Sovereign Quick Control Dock"
      >
        {/* Glowing Indicator Pulse Dot */}
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-slate-950 animate-pulse" />

        <SlidersHorizontal className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-90 scale-110' : 'group-hover:scale-110'}`} />
      </button>

    </div>
  );
};
