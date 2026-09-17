import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useVoiceCommand } from '../hooks/useVoiceCommand';
import { ViewType } from '../types';

interface VoiceCommandOverlayProps {
  onNavigate: (view: ViewType) => void;
  onCaptureSnapshot: () => void;
  onNotifyEvent: (type: any, title: string, desc: string, meta?: string, sev?: string) => void;
}

export const VoiceCommandOverlay: React.FC<VoiceCommandOverlayProps> = ({ onNavigate, onCaptureSnapshot, onNotifyEvent }) => {
  const { isListening, lastCommand, toggleListening } = useVoiceCommand(onNavigate, onCaptureSnapshot, onNotifyEvent);

  return (
    <div className="fixed bottom-6 right-36 sm:right-40 z-40 flex items-center gap-3">
      {isListening && (
        <div className="bg-[#070a12] border border-cyan-500/30 text-cyan-300 px-4 py-2 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.2)] font-mono text-xs flex items-center gap-2 backdrop-blur-xl animate-in fade-in slide-in-from-right-4">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          {lastCommand ? `"${lastCommand}"` : 'Listening for command...'}
        </div>
      )}
      <button
        onClick={toggleListening}
        className={`p-3.5 rounded-2xl border transition-all shadow-xl backdrop-blur-xl flex items-center justify-center cursor-pointer ${
          isListening 
            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.4)] animate-pulse'
            : 'bg-[#070a12] border-white/10 text-zinc-400 hover:text-white hover:border-cyan-500/40 hover:bg-[#0a0f1e]'
        }`}
        title="Voice Command Bridge (Try: 'Open Vault' or 'Capture Snapshot')"
      >
        {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </button>
    </div>
  );
};
