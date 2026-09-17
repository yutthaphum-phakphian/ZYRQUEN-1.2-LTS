import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { playTone } from './AudioSynthesizer';

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
        onClick={() => {
          playTone(650, 0.05);
          install();
        }}
        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
      >
        <span>📱</span>
        <span>ติดตั้งแอป (Install App)</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => {
            playTone(600, 0.05);
            setShowIOSGuide(true);
          }}
          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 transition-all flex items-center gap-1.5"
        >
          <span>📱</span>
          <span>ติดตั้งบน iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 font-mono">
            <div className="w-full max-w-sm rounded-2xl bg-[#0a0f1e] border border-cyan-500/40 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>📱</span>
                  <span>ติดตั้งบน iPhone / iPad</span>
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-zinc-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed space-y-1">
                ๑. แตะปุ่ม <strong>แชร์ (Share)</strong> ที่แถบเมนูด้านล่างของ Safari<br />
                ๒. เลื่อนลงแล้วเลือก <strong>"เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)</strong><br />
                ๓. แตะ <strong>"เพิ่ม" (Add)</strong> เพื่อใช้งานแบบ Standalone
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all"
              >
                เข้าใจแล้ว (Close)
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
