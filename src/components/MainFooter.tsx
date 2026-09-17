import React from 'react';
import { SocialFooter } from './SocialFooter';

export const MainFooter: React.FC = () => {
  return (
    <footer className="w-full bg-slate-950 border-t border-slate-800/80 px-6 py-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs font-mono text-slate-500">
          <span>ZYRQUEN Ω∞ v1.2.0-LTS</span>
          <span className="mx-2">•</span>
          <span>Genesis Block #849202</span>
        </div>

        {/* Bottom-Right Social Integration */}
        <div className="flex items-center sm:justify-end w-full sm:w-auto">
          <SocialFooter />
        </div>
      </div>
    </footer>
  );
};
