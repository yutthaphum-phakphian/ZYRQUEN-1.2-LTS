import React from 'react';
import { ExternalLink, Github, Bot } from 'lucide-react';

const REPO_URL = 'https://github.com/hugeplease66-debug/zyrquen-frozen-v1.2-lts';

export const SovereignCopilot: React.FC = () => {
  const handleViewSource = () => {
    window.open(REPO_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <Bot className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Sovereign Copilot</h3>
            <span className="text-[10px] font-mono text-slate-400">PQC Active Zeroization Engine</span>
          </div>
        </div>

        <button
          onClick={handleViewSource}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium font-mono text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-md transition shadow-sm active:scale-95"
          title="Open Repository on GitHub"
        >
          <Github className="w-3.5 h-3.5 text-slate-300" />
          <span>View Source</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-slate-300">
        <p className="text-emerald-400">[0.00ms] INGRESS Chamber 11 Ready.</p>
        <p className="text-slate-500 mt-2">Ready for query execution or trace verification...</p>
      </div>
    </div>
  );
};
