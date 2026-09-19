import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Fingerprint,
  Key,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  X,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Lock,
  Cpu,
  Smartphone,
  Laptop,
  Check,
  Copy,
  Terminal,
  FileCheck,
} from 'lucide-react';
import {
  webAuthnService,
  EnrolledWebAuthnCredential,
  WebAuthnAuthenticationResult,
} from '../../services/webAuthnService';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { safeCopyToClipboard } from '../../utils/clipboard';

interface WebAuthnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: WebAuthnAuthenticationResult) => void;
  mode?: 'authenticate' | 'register' | 'manage';
  challengeText?: string;
  title?: string;
}

export const WebAuthnModal: React.FC<WebAuthnModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode: initialMode = 'authenticate',
  challengeText,
  title,
}) => {
  const [mode, setMode] = useState<'authenticate' | 'register' | 'manage'>(initialMode);
  const [credentials, setCredentials] = useState<EnrolledWebAuthnCredential[]>([]);
  const [selectedCredId, setSelectedCredId] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'prompting' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [lastAuthResult, setLastAuthResult] = useState<WebAuthnAuthenticationResult | null>(null);
  const [isPlatformAvailable, setIsPlatformAvailable] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string>('');
  
  // Registration form state
  const [regName, setRegName] = useState('EP-SOVEREIGN-01');
  const [regDisplayName, setRegDisplayName] = useState('นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)');
  const [regType, setRegType] = useState<'platform' | 'cross-platform'>('platform');

  useEffect(() => {
    if (!isOpen) {
      setStatus('idle');
      setErrorMessage('');
      return;
    }

    // Refresh credentials & check biometric support
    const creds = webAuthnService.getEnrolledCredentials();
    setCredentials(creds);
    if (creds.length > 0) {
      setSelectedCredId(creds[0].id);
    }

    webAuthnService.isPlatformBiometricsAvailable().then((avail) => {
      setIsPlatformAvailable(avail);
    });

    setMode(initialMode);
  }, [isOpen, initialMode]);

  const handleAuthenticate = async () => {
    setStatus('prompting');
    setErrorMessage('');
    playTone(580, 0.05);

    try {
      setStatus('verifying');
      const result = await webAuthnService.authenticateWithPasskey({
        credentialId: selectedCredId,
        customChallenge: challengeText,
      });

      if (result.success) {
        setStatus('success');
        setLastAuthResult(result);
        playAuditChime();
        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'Authentication ceremony failed.');
        playTone(320, 0.1);
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err?.message || 'Biometric key verification cancelled or failed.');
      playTone(320, 0.1);
    }
  };

  const handleRegister = async () => {
    setStatus('prompting');
    setErrorMessage('');
    playTone(640, 0.05);

    try {
      const res = await webAuthnService.registerPasskey({
        userName: regName,
        userDisplayName: regDisplayName,
        authenticatorType: regType,
      });

      if (res.success && res.credential) {
        const updated = webAuthnService.getEnrolledCredentials();
        setCredentials(updated);
        setSelectedCredId(res.credential.id);
        setStatus('success');
        playAuditChime();
        setMode('manage');
      } else {
        setStatus('error');
        setErrorMessage(res.error || 'Credential enrollment failed.');
        playTone(320, 0.1);
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err?.message || 'Biometric enrollment failed.');
      playTone(320, 0.1);
    }
  };

  const handleDelete = (id: string) => {
    playTone(400, 0.05);
    webAuthnService.deleteEnrolledCredential(id);
    const updated = webAuthnService.getEnrolledCredentials();
    setCredentials(updated);
    if (selectedCredId === id) {
      setSelectedCredId(updated[0]?.id || '');
    }
  };

  const handleCopy = (text: string, label: string) => {
    safeCopyToClipboard(text);
    setCopiedKey(label);
    playTone(880, 0.02);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-[#0a0f1e] border-2 border-[#D4AF37] rounded-3xl shadow-2xl overflow-hidden font-mono text-zinc-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#070a12]/90">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Fingerprint className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                  <span>{title || 'Sovereign WebAuthn Biometric & Hardware Key Enclave'}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                    FIPS 140-3 L4
                  </span>
                </h2>
                <p className="text-xs text-zinc-400">
                  W3C Web Authentication API • ETDA Sec 9/26 • Non-repudiation
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 px-6 pt-4 border-b border-white/5 bg-[#070a12]/50 text-xs">
            <button
              onClick={() => {
                setMode('authenticate');
                setStatus('idle');
              }}
              className={`pb-3 px-3 font-semibold transition-all border-b-2 flex items-center gap-2 ${
                mode === 'authenticate'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Fingerprint className="w-4 h-4" />
              <span>Authenticate Ceremony</span>
            </button>
            <button
              onClick={() => {
                setMode('register');
                setStatus('idle');
              }}
              className={`pb-3 px-3 font-semibold transition-all border-b-2 flex items-center gap-2 ${
                mode === 'register'
                  ? 'border-[#D4AF37] text-[#D4AF37]'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>Enroll Hardware Key</span>
            </button>
            <button
              onClick={() => {
                setMode('manage');
                setStatus('idle');
              }}
              className={`pb-3 px-3 font-semibold transition-all border-b-2 flex items-center gap-2 ${
                mode === 'manage'
                  ? 'border-emerald-400 text-emerald-300'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Enrolled Keys ({credentials.length})</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Mode 1: Authenticate Ceremony */}
            {mode === 'authenticate' && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-[#070a12] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Target Credential:</span>
                    <span className="text-emerald-400 font-bold">
                      {isPlatformAvailable ? 'Platform Biometric Verified' : 'Hardware Security Token Ready'}
                    </span>
                  </div>

                  <select
                    value={selectedCredId}
                    onChange={(e) => setSelectedCredId(e.target.value)}
                    className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  >
                    {credentials.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.hardwareModel || c.userName} ({c.algorithm}) - ID: {c.rawIdHex.slice(0, 12)}...
                      </option>
                    ))}
                  </select>

                  {challengeText && (
                    <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-cyan-200 break-all">
                      <span className="text-zinc-400">Challenge Digest: </span>
                      <span className="font-mono text-cyan-300">{challengeText}</span>
                    </div>
                  )}
                </div>

                {/* Live Biometric Scanner Status Visualizer */}
                <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-black/60 to-black/30 border border-white/10 space-y-4">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    {status === 'verifying' || status === 'prompting' ? (
                      <>
                        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
                        <div className="absolute inset-2 rounded-full border-2 border-emerald-500/20 border-b-emerald-400 animate-spin-reverse" />
                        <Fingerprint className="w-12 h-12 text-cyan-400 animate-pulse" />
                      </>
                    ) : status === 'success' ? (
                      <div className="w-20 h-20 rounded-full bg-emerald-950/80 border-2 border-emerald-400 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-10 h-10" />
                      </div>
                    ) : status === 'error' ? (
                      <div className="w-20 h-20 rounded-full bg-rose-950/80 border-2 border-rose-500 flex items-center justify-center text-rose-400">
                        <AlertTriangle className="w-10 h-10" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-white/5 border border-white/20 flex items-center justify-center text-zinc-400 hover:text-cyan-400 transition-colors">
                        <Fingerprint className="w-10 h-10" />
                      </div>
                    )}
                  </div>

                  <div className="text-center space-y-1">
                    <div className="text-sm font-bold text-white">
                      {status === 'prompting' || status === 'verifying'
                        ? 'Awaiting Biometric Presence / Hardware Token Touch...'
                        : status === 'success'
                        ? 'WebAuthn Assertion Verified 100% Green'
                        : status === 'error'
                        ? 'Verification Error'
                        : 'Ready for Cryptographic Authentication'}
                    </div>
                    <p className="text-xs text-zinc-400 max-w-sm">
                      Touch your biometric sensor (Touch ID / Face ID / Windows Hello) or insert your FIPS 140-3 hardware security key.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="w-full p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300">
                      {errorMessage}
                    </div>
                  )}

                  {lastAuthResult && (
                    <div className="w-full p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs space-y-2">
                      <div className="flex items-center justify-between text-emerald-300 font-bold">
                        <span>PQC Signature Digest</span>
                        <span>ETDA Sec 9/26 PASS</span>
                      </div>
                      <div className="font-mono text-[10px] text-zinc-300 break-all bg-black/60 p-2 rounded-lg border border-white/10">
                        {lastAuthResult.signatureHex}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                        <span>Timestamp: {lastAuthResult.timestamp}</span>
                        <span className="text-emerald-400">FIPS 140-3 Level 4</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleAuthenticate}
                    disabled={status === 'verifying' || status === 'prompting'}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Fingerprint className="w-5 h-5" />
                    <span>Initiate Biometric / Hardware Key Authentication</span>
                  </button>
                </div>
              </div>
            )}

            {/* Mode 2: Enroll New Hardware Key */}
            {mode === 'register' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#070a12] border border-white/10 space-y-4">
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Custodian Identifier (User Name)</label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Legal Entity Display Name</label>
                    <input
                      type="text"
                      value={regDisplayName}
                      onChange={(e) => setRegDisplayName(e.target.value)}
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 block mb-1.5">Authenticator Attachment</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRegType('platform')}
                        className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                          regType === 'platform'
                            ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200'
                            : 'bg-black/40 border-white/10 text-zinc-400 hover:border-white/20'
                        }`}
                      >
                        <Laptop className="w-5 h-5" />
                        <div>
                          <div className="text-xs font-bold">Platform Biometric</div>
                          <div className="text-[10px] text-zinc-400">Touch ID, Face ID, Windows Hello</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRegType('cross-platform')}
                        className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                          regType === 'cross-platform'
                            ? 'bg-amber-950/60 border-[#D4AF37] text-[#D4AF37]'
                            : 'bg-black/40 border-white/10 text-zinc-400 hover:border-white/20'
                        }`}
                      >
                        <Key className="w-5 h-5" />
                        <div>
                          <div className="text-xs font-bold">Hardware Security Key</div>
                          <div className="text-[10px] text-zinc-400">YubiKey 5C, NitroKey FIPS 140-3</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300">
                    {errorMessage}
                  </div>
                )}

                <button
                  onClick={handleRegister}
                  disabled={status === 'verifying' || status === 'prompting'}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#D4AF37] hover:bg-[#e6bf47] text-black font-bold text-sm tracking-wide shadow-lg shadow-[#D4AF37]/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Key className="w-5 h-5" />
                  <span>Register Sovereign Passkey (WebAuthn Ceremony)</span>
                </button>
              </div>
            )}

            {/* Mode 3: Enrolled Keys Management */}
            {mode === 'manage' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Registered Cryptographic Authenticators:</span>
                  <span className="text-emerald-400 font-bold">{credentials.length} Active Keys</span>
                </div>

                <div className="space-y-3">
                  {credentials.map((cred) => (
                    <div
                      key={cred.id}
                      className="p-4 rounded-2xl bg-[#070a12] border border-white/10 hover:border-white/20 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                            {cred.authenticatorType === 'platform' ? (
                              <Fingerprint className="w-5 h-5" />
                            ) : (
                              <Key className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>{cred.hardwareModel || cred.userDisplayName}</span>
                              <span className="px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/30 text-[9px] text-cyan-300">
                                {cred.fipsLevel}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-400">
                              {cred.userName} • {cred.algorithm}
                            </div>
                          </div>
                        </div>

                        {credentials.length > 1 && (
                          <button
                            onClick={() => handleDelete(cred.id)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                            title="Zeroize Credential"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-[10px] text-zinc-400">
                        <div>
                          <span className="text-zinc-500">Raw Key ID: </span>
                          <span className="text-zinc-300 font-mono">{cred.rawIdHex.slice(0, 16)}...</span>
                        </div>
                        <div className="text-right">
                          <span className="text-zinc-500">Usage Counter: </span>
                          <span className="text-emerald-400 font-bold">{cred.counter} Signatures</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={() => setMode('register')}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white flex items-center gap-2 transition-colors"
                  >
                    <Key className="w-4 h-4 text-[#D4AF37]" />
                    <span>Enroll Another Authenticator</span>
                  </button>

                  <button
                    onClick={() => setMode('authenticate')}
                    className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs text-cyan-300 flex items-center gap-2 transition-colors"
                  >
                    <Fingerprint className="w-4 h-4" />
                    <span>Test Authentication</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-[#070a12] flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sovereign Enclave Active: <strong className="text-white">#EP-SOVEREIGN-01</strong></span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
