import React from 'react';
import { Github, ExternalLink } from 'lucide-react';

const GITHUB_REPO_URL = 'https://github.com/yutthaphum-phakphian/ZYRQUEN-1.2-LTS';

export const SocialFooter: React.FC = () => {
  return (
    <div className="flex items-center space-x-3">
      <a
        href={GITHUB_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center space-x-2 px-3 py-1.5 text-xs font-mono text-slate-400 hover:text-emerald-400 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-full transition-all duration-200"
      >
        <Github className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
        <span className="font-medium">GitHub Repository</span>
        <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </a>
    </div>
  );
};
