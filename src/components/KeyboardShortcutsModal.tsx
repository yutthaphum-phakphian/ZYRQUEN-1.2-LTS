import React from 'react';
import { Command, Keyboard, X, ArrowRight, Sparkles, Scale, FileCheck2, Activity, Terminal, Shield, Award } from 'lucide-react';
import { ViewType } from '../types';
import { playTone } from './AudioSynthesizer';

interface KeyboardShortcutsModalProps {
  onCaptureSnapshot?: () => void;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: ViewType) => void;
  onSelectView?: (view: ViewType) => void;
  onOpenSearch?: () => void;
  onOpenLegalSearch?: () => void;
  onOpenCert?: () => void;
  onOpenCertificate?: () => void;
  onToggleAudio?: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectView,
  onOpenSearch,
  onOpenLegalSearch,
  onOpenCert,
  onOpenCertificate,
  onToggleAudio,
}) => {
  if (!isOpen) return null;

  const handleNav = (v: ViewType) => {
    if (onNavigate) onNavigate(v);
    else if (onSelectView) onSelectView(v);
  };

  const handleSearch = () => {
    if (onOpenSearch) onOpenSearch();
    else if (onOpenLegalSearch) onOpenLegalSearch();
  };

  const handleCert = () => {
    if (onOpenCert) onOpenCert();
    else if (onOpenCertificate) onOpenCertificate();
  };

  const coreShortcuts = [
    { keyCombo: 'Ctrl + B / [', label: 'Toggle Sidebar Menu (Open / Close)', action: () => { onClose(); }, tag: 'SIDEBAR' },
    { keyCombo: 'Ctrl + K / ⌘K', label: 'Thai Laws & Cryptographic Search', action: () => { onClose(); handleSearch(); }, tag: 'SEARCH' },
    { keyCombo: 'Ctrl + E / ⇧E', label: 'System Events Notification Feed', action: () => { onClose(); }, tag: 'EVENTS' },
    { keyCombo: 'Ctrl + L / ⌘L', label: 'Navigate to Ledger & Forensics Trace', action: () => { onClose(); handleNav('ledger'); }, tag: 'LEDGER' },
    { keyCombo: 'Ctrl + P / ⌘P', label: 'Navigate to Pulse & Telemetry Recharts', action: () => { onClose(); handleNav('pulse'); }, tag: 'TELEMETRY' },
    { keyCombo: 'Ctrl + Q / ⌘Q', label: 'Navigate to Quantum Nexus Coherence', action: () => { onClose(); handleNav('quantum'); }, tag: 'QUANTUM' },
    { keyCombo: 'Ctrl + G / ⌘G', label: 'Open Gold Master Attestation Certificate', action: () => { onClose(); handleCert(); }, tag: 'CERT' },
    { keyCombo: 'Key M', label: 'Toggle Sovereign Harmonic Audio Synth', action: () => { if (onToggleAudio) onToggleAudio(); }, tag: 'AUDIO' },
  ];

  const viewNumberShortcuts = [
    { key: '1', view: 'dashboard' as ViewType, name: 'Dashboard' },
    { key: 'U', view: 'unified' as ViewType, name: 'Multiverse Panel' },
    { key: 'H', view: 'heatmap' as ViewType, name: '14.9K Seals Heatmap' },
    { key: 'C', view: 'council' as ViewType, name: 'Council 10/10' },
    { key: 'R', view: 'production' as ViewType, name: 'Readiness (PH-20)' },
    { key: '2', view: 'quantum' as ViewType, name: 'Quantum' },
    { key: '3', view: 'nexus' as ViewType, name: 'Nexus' },
    { key: '4', view: 'vault' as ViewType, name: 'Vault' },
    { key: '5', view: 'ledger' as ViewType, name: 'Ledger' },
    { key: '6', view: 'pulse' as ViewType, name: 'Pulse' },
    { key: '7', view: 'forge' as ViewType, name: 'Forge' },
    { key: '8', view: 'matrix' as ViewType, name: 'Matrix' },
    { key: '9', view: 'archive' as ViewType, name: 'Archive' },
    { key: '0', view: 'console' as ViewType, name: 'Console' },
    { key: '-', view: 'security' as ViewType, name: 'Security' },
    { key: 'L', view: 'legal' as ViewType, name: 'Legal & PDPA (ETDA/พ.ร.บ.)' },
    { key: '=', view: 'settings' as ViewType, name: 'Settings' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-[28px] bg-[#07080F] border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden font-mono">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-cyan-950/40 via-violet-950/30 to-black/80 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Global Keyboard Shortcuts & Fast Switcher</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  SYSTEM HOTKEYS
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Press any key combination anywhere in the OS for instantaneous navigation
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playTone(400, 0.05);
              onClose();
            }}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Main Action Shortcuts */}
          <div className="space-y-3">
            <div className="text-xs text-zinc-400 uppercase tracking-wider font-bold">
              Core Actions & Modals
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {coreShortcuts.map((sc, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    playTone(600, 0.05);
                    sc.action();
                  }}
                  className="p-3 rounded-2xl bg-[#0b0e1a]/80 hover:bg-cyan-950/40 border border-white/8 hover:border-cyan-500/40 flex items-center justify-between text-left transition-all group"
                >
                  <div>
                    <div className="text-xs text-zinc-200 group-hover:text-white font-medium">
                      {sc.label}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{sc.tag}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-cyan-300 group-hover:bg-cyan-500/20 text-[11px] font-bold shrink-0">
                    {sc.keyCombo}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 12 Core Views Direct Number Access */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 uppercase tracking-wider font-bold">
                12 Core Views Quick Keys (Press 1-9, 0, -, =)
              </span>
              <span className="text-[10px] text-zinc-500">Also works with Alt + [Key]</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {viewNumberShortcuts.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    playTone(550, 0.05);
                    onClose();
                    onSelectView?.(item.view);
                  }}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-cyan-500/10 border border-white/8 hover:border-cyan-500/30 flex items-center justify-between text-left transition-all"
                >
                  <span className="text-xs text-zinc-300 font-medium truncate">{item.name}</span>
                  <span className="w-5 h-5 rounded-lg bg-white/10 text-cyan-300 flex items-center justify-center text-xs font-bold shrink-0">
                    {item.key}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tips Footer */}
          <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Press <strong className="text-cyan-300">?</strong> anytime to toggle this helper modal.</span>
            </span>
            <button
              onClick={() => {
                playTone(500, 0.04);
                onClose();
              }}
              className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
