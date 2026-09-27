import React from 'react';
import { Github, ExternalLink, Globe } from 'lucide-react';

const GITHUB_REPO_URL = 'https://github.com/yutthaphum-phakphian/ZYRQUEN-1.2-LTS';
const GITHUB_PAGES_URL = 'https://yutthaphum-phakphian.github.io/ZYRQUEN-1.2-LTS/';

export const SocialFooter: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={GITHUB_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center space-x-2 px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-emerald-400 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-full transition-all duration-200"
      >
        <Github className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
        <span className="font-medium">GitHub Repository</span>
        <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </a>
      <a
        href={GITHUB_PAGES_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center space-x-2 px-3 py-1.5 text-xs font-mono text-cyan-300 hover:text-cyan-200 bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-500/30 hover:border-cyan-400/60 rounded-full transition-all duration-200"
      >
        <Globe className="w-3.5 h-3.5 text-cyan-400 transition-colors" />
        <span className="font-medium">GitHub Pages Live</span>
        <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </a>
    </div>
  );
};
