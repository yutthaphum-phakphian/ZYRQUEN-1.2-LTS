import React, { useState } from 'react';
import { ShieldAlert, Lock, CheckCircle2, ShieldCheck } from 'lucide-react';
import { triggerVibration } from '../utils/vibration';
import { playTone } from './AudioSynthesizer';

interface EmergencySovereignLockdownProps {
  onLockdownChange?: (isLocked: boolean) => void;
}

export const EmergencySovereignLockdown: React.FC<EmergencySovereignLockdownProps> = ({ onLockdownChange }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const triggerLockdown = () => {
    setIsExecuting(true);
    triggerVibration(100);
    playTone(isLocked ? 523.25 : 220, 0.2, 'sawtooth');

    setTimeout(() => {
      setIsExecuting(false);
      const nextState = !isLocked;
      setIsLocked(nextState);
      if (onLockdownChange) {
        onLockdownChange(nextState);
      }
      playTone(nextState ? 440 : 880, 0.25, 'triangle');
      triggerVibration([80, 50, 80]);
    }, 1200);
  };

  return (
    <div
      className={`p-4 rounded-2xl border transition-all duration-300 font-mono ${
        isLocked
          ? 'bg-red-950/40 border-red-500/60 shadow-[0_0_30px_rgba(239,68,68,0.2)]'
          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border shrink-0 ${
              isLocked
                ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-amber-400'
            }`}
          >
            {isLocked ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex flex-wrap items-center gap-2">
              <span>SOVEREIGN ISOLATION PROTOCOL</span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-semibold border ${
                  isLocked
                    ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {isLocked ? 'CHAMBER 02 QUARANTINE ACTIVE' : 'AIR-GAP READY'}
              </span>
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
              {isLocked
                ? 'ระบบอยู่ในสถานะ Fall-Closed และตัดการรับส่งข้อมูลภายนอกทั้งหมดเรียบร้อยแล้ว'
                : 'ตัดการเชื่อมต่อและกักกันข้อมูลเสี่ยงเข้าสู่ Chamber 02 Quarantine ทันที'}
            </p>
          </div>
        </div>

        <button
          onClick={triggerLockdown}
          disabled={isExecuting}
          className={`px-4 py-2 rounded-xl text-xs font-bold border transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0 ${
            isLocked
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
              : 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
          }`}
        >
          {isExecuting ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin inline-block">🌀</span>
              <span>กำลังประมวลผล...</span>
            </span>
          ) : isLocked ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>ยกเลิกการกักกัน (Resume Normal)</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 text-red-400" />
              <span>สั่ง Isolation ฉุกเฉิน</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
