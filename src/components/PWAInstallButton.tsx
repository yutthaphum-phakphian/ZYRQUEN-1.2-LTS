import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, Share, PlusSquare } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-emerald-600/20 px-3 py-1.5 text-xs font-mono font-bold text-emerald-300 border border-emerald-500/40 shadow-sm hover:bg-emerald-600/30 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)]"
      >
        <Download className="w-3.5 h-3.5" />
        INSTALL ZYRQUEN Ω∞
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600/20 px-3 py-1.5 text-xs font-mono font-bold text-blue-300 border border-blue-500/40 shadow-sm hover:bg-blue-600/30 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          INSTALL ON IOS
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07080F]/90 backdrop-blur-xl p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#0b0e1a] border border-blue-500/30 p-6 shadow-2xl text-center font-sans relative overflow-hidden">
              <div className="w-12 h-12 mx-auto rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-4">
                <Share className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Install on iPhone / iPad</h3>
              <div className="text-sm text-zinc-300 space-y-3 font-mono text-left bg-black/40 p-4 rounded-xl border border-white/5">
                <p className="flex items-start gap-2">
                  <span className="bg-blue-500 text-black font-bold rounded w-5 h-5 flex items-center justify-center shrink-0">1</span>
                  <span>Tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline mx-1"/> in the Safari toolbar at the bottom.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="bg-blue-500 text-black font-bold rounded w-5 h-5 flex items-center justify-center shrink-0">2</span>
                  <span>Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1"/>.</span>
                </p>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-white/10 hover:bg-white/20 py-2.5 text-sm font-bold text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
