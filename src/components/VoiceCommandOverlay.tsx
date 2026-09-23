import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useVoiceCommand } from '../hooks/useVoiceCommand';
import { ViewType } from '../types';
import { SystemEvent } from './SystemEventsSidebar';

interface VoiceCommandOverlayProps {
  onNavigate: (view: ViewType) => void;
  onCaptureSnapshot: () => void;
  onNotifyEvent: (type: SystemEvent['type'], title: string, desc: string, meta?: string, sev?: SystemEvent['severity']) => void;
  inline?: boolean;
  className?: string;
}

export const VoiceCommandOverlay: React.FC<VoiceCommandOverlayProps> = ({ 
  onNavigate, 
  onCaptureSnapshot, 
  onNotifyEvent,
  inline = false,
  className = '',
}) => {
  const { isListening, lastCommand, toggleListening } = useVoiceCommand(onNavigate, onCaptureSnapshot, onNotifyEvent);

  const controls = (
    <>
      {isListening && (
        <div className="bg-[#070a12]/95 border border-cyan-500/40 text-cyan-300 px-3 py-1.5 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] font-mono text-[11px] flex items-center gap-2 backdrop-blur-xl animate-in fade-in slide-in-from-right-3 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="max-w-[140px] truncate">{lastCommand ? `"${lastCommand}"` : 'Listening...'}</span>
        </div>
      )}
      <button
        onClick={toggleListening}
        className={`h-10 w-10 rounded-xl border transition-all shadow-xl backdrop-blur-xl flex items-center justify-center cursor-pointer shrink-0 ${
          isListening 
            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.4)] animate-pulse'
            : 'bg-slate-900/90 border-slate-700 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-400'
        }`}
        title="Voice Command Bridge (Try: 'Open Vault' or 'Capture Snapshot')"
      >
        {isListening ? <Mic className="w-4 h-4 text-cyan-400" /> : <MicOff className="w-4 h-4 text-slate-400" />}
      </button>
    </>
  );

  if (inline) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {controls}
      </div>
    );
  }

  return (
    <div className={`fixed bottom-3 sm:bottom-4 right-24 sm:right-48 z-40 flex items-center gap-2 ${className}`}>
      {controls}
    </div>
  );
};
