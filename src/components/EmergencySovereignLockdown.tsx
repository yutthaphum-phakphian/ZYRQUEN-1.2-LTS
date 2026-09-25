import React, { useState } from 'react';
import { ShieldAlert, Lock, CheckCircle2, ShieldCheck, Fingerprint, KeyRound, Sparkles } from 'lucide-react';
import { triggerVibration } from '../utils/vibration';
import { playTone, playAuditChime } from './AudioSynthesizer';
import { announceSecurityLockdown } from '../utils/textToSpeechService';
import { webAuthnService, WebAuthnAuthenticationResult } from '../services/webAuthnService';
import { WebAuthnModal } from './auth/WebAuthnModal';

interface EmergencySovereignLockdownProps {
  onLockdownChange?: (isLocked: boolean) => void;
}

export const EmergencySovereignLockdown: React.FC<EmergencySovereignLockdownProps> = ({ onLockdownChange }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isWebAuthnModalOpen, setIsWebAuthnModalOpen] = useState(false);
  const [biometricUnlockSuccess, setBiometricUnlockSuccess] = useState<string | null>(null);

  const performLockdownTransition = (nextState: boolean, authMethod: 'manual' | 'webauthn_biometric' = 'manual') => {
    setIsExecuting(false);
    setIsLocked(nextState);
    if (onLockdownChange) {
      onLockdownChange(nextState);
    }
    playTone(nextState ? 440 : 880, 0.25, 'triangle');
    triggerVibration([80, 50, 80]);

    if (!nextState && authMethod === 'webauthn_biometric') {
      playAuditChime();
      setBiometricUnlockSuccess('Biometric Hardware Key Verified (ETDA Sec 9/26 Non-repudiation)');
      setTimeout(() => setBiometricUnlockSuccess(null), 5000);
    }

    // Announce lockdown status change verbally for hands-free operations
    try {
      announceSecurityLockdown(nextState ? 'engaged' : 'released', {
        chamber: 'Chamber 02 Quarantine',
        reason: nextState
          ? 'Operator initiated Sovereign Isolation Protocol'
          : authMethod === 'webauthn_biometric'
          ? 'Authorized Biometric Hardware Key Re-entry by Sovereign Principal'
          : 'Normal operations restored',
      });
    } catch (err) {
      console.warn('Verbal alert failed:', err);
    }
  };

  const triggerLockdown = () => {
    setIsExecuting(true);
    triggerVibration(100);
    playTone(isLocked ? 523.25 : 220, 0.2, 'sawtooth');

    setTimeout(() => {
      performLockdownTransition(!isLocked, 'manual');
    }, 1200);
  };

  // Direct fast biometric unlock handler
  const handleBiometricUnlockDirect = async () => {
    setIsExecuting(true);
    triggerVibration(60);
    playTone(740, 0.08);

    try {
      const result = await webAuthnService.authenticateWithPasskey({
        customChallenge: `SOVEREIGN_LOCKDOWN_REENTRY_${Date.now()}`,
      });

      if (result.success) {
        performLockdownTransition(false, 'webauthn_biometric');
      } else {
        // If direct prompt fails or requires credential selection modal, open full modal
        setIsExecuting(false);
        setIsWebAuthnModalOpen(true);
      }
    } catch (err) {
      setIsExecuting(false);
      setIsWebAuthnModalOpen(true);
    }
  };

  const handleWebAuthnModalSuccess = (result: WebAuthnAuthenticationResult) => {
    setIsWebAuthnModalOpen(false);
    performLockdownTransition(false, 'webauthn_biometric');
  };

  return (
    <>
      <div
        className={`p-4 rounded-2xl border transition-all duration-300 font-mono ${
          isLocked
            ? 'bg-red-950/40 border-red-500/60 shadow-[0_0_35px_rgba(239,68,68,0.25)]'
            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                {isLocked && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold border bg-purple-500/20 text-purple-300 border-purple-500/40 flex items-center gap-1">
                    <Fingerprint className="w-3 h-3 text-purple-400" />
                    <span>WEBAUTHN READY</span>
                  </span>
                )}
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                {isLocked
                  ? 'ระบบอยู่ในสถานะ Fail-Closed ตัดการรับส่งข้อมูลภายนอกทั้งหมดเรียบร้อยแล้ว ใช้คีย์ชีวมาตร (Biometrics/YubiKey) เพื่อปลดล็อกเข้าสู่ระบบอย่างรวดเร็ว'
                  : 'ตัดการเชื่อมต่อและกักกันข้อมูลเสี่ยงเข้าสู่ Chamber 02 Quarantine ทันที'}
              </p>
              {biometricUnlockSuccess && (
                <div className="text-[10px] text-emerald-300 font-bold mt-1 flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{biometricUnlockSuccess}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* If in lockdown, provide prominent Biometric Unlock via WebAuthn */}
            {isLocked && (
              <button
                type="button"
                onClick={handleBiometricUnlockDirect}
                disabled={isExecuting}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-purple-600/30 via-indigo-600/30 to-cyan-600/30 hover:from-purple-600/50 hover:to-cyan-600/50 text-purple-200 hover:text-white border-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.35)]"
                title="Use W3C WebAuthn Biometric API (Touch ID / Face ID / Windows Hello / YubiKey) for fast secure re-entry"
              >
                <Fingerprint className="w-4 h-4 text-purple-300 animate-pulse" />
                <span className="font-bold">Biometric Unlock</span>
                <span className="px-1.5 py-0.2 rounded bg-purple-500/30 text-[9px] text-purple-200 border border-purple-400/40">
                  WebAuthn
                </span>
              </button>
            )}

            {/* Standard manual toggle / emergency trigger button */}
            <button
              type="button"
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
      </div>

      {/* WebAuthn Sovereign Hardware Key Dialog */}
      <WebAuthnModal
        isOpen={isWebAuthnModalOpen}
        onClose={() => setIsWebAuthnModalOpen(false)}
        onSuccess={handleWebAuthnModalSuccess}
        mode="authenticate"
        title="🔒 SOVEREIGN LOCKDOWN BIOMETRIC RE-ENTRY"
        challengeText={`SOVEREIGN_SYSTEM_LOCKDOWN_REENTRY_${Date.now()}`}
      />
    </>
  );
};
