import React, { useState, useEffect } from 'react';
import { Eye, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  onToggleForensicMode?: (enabled: boolean) => void;
  isForensicModeActive?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleForensicMode,
  isForensicModeActive,
}) => {
  const [forensicMode, setForensicMode] = useState<boolean>(isForensicModeActive ?? false);

  useEffect(() => {
    if (isForensicModeActive !== undefined) {
      setForensicMode(isForensicModeActive);
    }
  }, [isForensicModeActive]);

  useEffect(() => {
    const rootClassList = document.documentElement.classList;
    if (forensicMode) {
      rootClassList.add('forensic-mode');
    } else {
      rootClassList.remove('forensic-mode');
    }
    onToggleForensicMode?.(forensicMode);
  }, [forensicMode, onToggleForensicMode]);

  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-slate-950 border-b border-slate-800 text-slate-100 font-mono">
      <div className="flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-emerald-400" />
        <span className="font-bold tracking-wider text-sm">GOVERNANCE ENGINE // SYSTEM ARCHIVE</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/60 px-3 py-1.5 rounded-md">
          <Eye className={`w-4 h-4 ${forensicMode ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
          <span className="text-xs uppercase tracking-wide font-semibold text-slate-300">Forensic CRT</span>
          <button
            onClick={() => setForensicMode(!forensicMode)}
            className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
              forensicMode ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
            }`}
            aria-label="Toggle Forensic Mode"
          >
            <div className="w-3.5 h-3.5 bg-slate-950 rounded-full shadow-md" />
          </button>
        </div>
      </div>
    </nav>
  );
};
