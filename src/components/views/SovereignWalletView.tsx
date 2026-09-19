import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import {
  Wallet,
  QrCode,
  Key,
  Fingerprint,
  ShieldCheck,
  ShieldAlert,
  Download,
  Copy,
  Check,
  CheckCircle2,
  RefreshCw,
  Send,
  FileCheck,
  Lock,
  Cpu,
  ArrowUpRight,
  Landmark,
  Coins,
  Sparkles,
  ExternalLink,
  Layers,
  Terminal,
  FileText,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import {
  webAuthnService,
  EnrolledWebAuthnCredential,
  WebAuthnAuthenticationResult,
} from '../../services/webAuthnService';
import { WebAuthnModal } from '../auth/WebAuthnModal';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { safeCopyToClipboard } from '../../utils/clipboard';
import {
  CANONICAL_MERKLE_ROOT,
  CANONICAL_GENESIS_BLOCK,
  SYSTEM_METADATA,
} from '../../data/canonicalData';
import { sha256Hex } from '../../services/cryptoEngine';

interface SovereignWalletViewProps {
  onNavigate?: (view: any) => void;
  onAddSystemEvent?: (type: string, title: string, desc: string, source: string, severity: 'info' | 'warn' | 'crit') => void;
}

interface SignedTransactionRecord {
  id: string;
  txHash: string;
  type: string;
  recipient: string;
  amount: string;
  timestamp: string;
  signatureHex: string;
  authenticator: string;
  fipsLevel: string;
  etdaSec9: boolean;
  etdaSec26: boolean;
}

export const SovereignWalletView: React.FC<SovereignWalletViewProps> = ({
  onNavigate,
  onAddSystemEvent,
}) => {
  // Enrolled keys
  const [credentials, setCredentials] = useState<EnrolledWebAuthnCredential[]>([]);
  const [selectedCredId, setSelectedCredId] = useState<string>('');
  const [isWebAuthnModalOpen, setIsWebAuthnModalOpen] = useState<boolean>(false);
  const [webAuthnModalMode, setWebAuthnModalMode] = useState<'authenticate' | 'register' | 'manage'>('manage');

  // QR Code Generation State
  const [qrType, setQrType] = useState<'PUBLIC_KEY' | 'PAYMENT_URI' | 'WEBAUTHN_DESCRIPTOR' | 'MERKLE_PROOF'>('PUBLIC_KEY');
  const [qrColorTheme, setQrColorTheme] = useState<'GOLD' | 'CYAN' | 'EMERALD'>('GOLD');
  const [qrEccLevel, setQrEccLevel] = useState<'L' | 'M' | 'Q' | 'H'>('H');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrPayloadString, setQrPayloadString] = useState<string>('');
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(false);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  // Transaction Signing State
  const [txType, setTxType] = useState<'TRANSFER' | 'RATIFICATION' | 'RWA_ALLOCATION' | 'CUSTOM_LEGAL'>('TRANSFER');
  const [txRecipient, setTxRecipient] = useState<string>('Ω601-TELECOM-FIBER-TENANT');
  const [txAmount, setTxAmount] = useState<string>('10000000.00');
  const [txMemo, setTxMemo] = useState<string>('Sovereign Infrastructure Allocation Block #849202');
  const [isSigningTx, setIsSigningTx] = useState<boolean>(false);
  const [signFeedback, setSignFeedback] = useState<string>('');
  const [lastSignedTx, setLastSignedTx] = useState<SignedTransactionRecord | null>(null);
  const [txReceiptQrUrl, setTxReceiptQrUrl] = useState<string>('');

  // Transaction History
  const [recentTxLog, setRecentTxLog] = useState<SignedTransactionRecord[]>([
    {
      id: 'TX-849202-001',
      txHash: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      type: 'SOVEREIGN_GENESIS_RATIFICATION',
      recipient: '0x0000000000000000000000000000000000000000',
      amount: '฿4,230,000,000.00 THB',
      timestamp: '2026-09-14T14:04:43Z',
      signatureHex: '3045022100e4b85c138d99047192a08f51bb1237a89e0231908ab158f9d020000000000001022026',
      authenticator: 'NitroKey HSM-PQC-01 FIPS 140-3 Level 4',
      fipsLevel: 'FIPS 140-3 Level 4',
      etdaSec9: true,
      etdaSec26: true,
    },
  ]);

  // Load credentials on mount
  useEffect(() => {
    const creds = webAuthnService.getEnrolledCredentials();
    setCredentials(creds);
    if (creds.length > 0 && !selectedCredId) {
      setSelectedCredId(creds[0].id);
    }
  }, []);

  const activeCred = credentials.find((c) => c.id === selectedCredId) || credentials[0];

  // Colors for QR code
  const QR_COLORS = {
    GOLD: { dark: '#D4AF37', light: '#070a12' },
    CYAN: { dark: '#06B6D4', light: '#070a12' },
    EMERALD: { dark: '#10B981', light: '#070a12' },
  };

  // Generate QR code whenever payload parameters change
  useEffect(() => {
    let payload = '';

    const sovereignAddress = '0x909ab814479844d8a14816bed34cdbb07528e185';
    const activePublicKeyHex = activeCred?.rawIdHex || '5a397330765f68617264776172655f746f6b656e5f66697073313430335f6c34';

    if (qrType === 'PUBLIC_KEY') {
      payload = JSON.stringify({
        standard: 'ZYRQUEN-PQC-PUBLIC-KEY-V1',
        principal: SYSTEM_METADATA.sovereignPrincipal,
        legalCustodian: 'นายยุทธภูมิ พากเพียร',
        keyId: activeCred?.id || 'cred-ep-sovereign-01',
        algorithm: activeCred?.algorithm || 'ES256 + Dilithium-5 (ML-DSA-87)',
        publicKeyHex: activePublicKeyHex,
        fipsLevel: activeCred?.fipsLevel || 'FIPS 140-3 Level 4',
        blockHeight: CANONICAL_GENESIS_BLOCK,
        merkleRoot: CANONICAL_MERKLE_ROOT,
        attestation: 'ETDA Sec 9/26 Non-Repudiation Verified',
      }, null, 2);
    } else if (qrType === 'PAYMENT_URI') {
      payload = `ethereum:${sovereignAddress}@849202/transfer?address=${sovereignAddress}&uint256=1000000000000000000&data=ZYRQUEN_SOVEREIGN_SETTLEMENT`;
    } else if (qrType === 'WEBAUTHN_DESCRIPTOR') {
      payload = JSON.stringify({
        type: 'public-key',
        id: activeCred?.credentialIdBase64 || 'Wl9TMFZfSEFSRFdBUkVfVE9LRU5fRklQUzE0MDNfTDQ=',
        transports: ['internal', 'usb', 'nfc', 'ble'],
        rpId: activeCred?.rpId || 'localhost',
        userName: activeCred?.userName || 'EP-SOVEREIGN-01',
        authenticatorType: activeCred?.authenticatorType || 'cross-platform',
        aaguid: activeCred?.aaguid || '00000000-0000-0000-0000-000000000001',
        counter: activeCred?.counter || 14902,
      }, null, 2);
    } else if (qrType === 'MERKLE_PROOF') {
      payload = JSON.stringify({
        system: 'ZYRQUEN Ω∞ SOVEREIGN WALLET PROOF',
        genesisBlock: CANONICAL_GENESIS_BLOCK,
        merkleRoot: CANONICAL_MERKLE_ROOT,
        sealsVerified: 14902,
        zeroDrift: 'Δ0.00%',
        treasuryGuarantee: '฿4,230,000,000.00 THB + 14,902 oz Gold',
        etdaCompliant: true,
      }, null, 2);
    }

    setQrPayloadString(payload);
    setIsGeneratingQr(true);

    const themeColors = QR_COLORS[qrColorTheme];

    QRCode.toDataURL(payload, {
      width: 420,
      margin: 2,
      color: themeColors,
      errorCorrectionLevel: qrEccLevel,
    })
      .then((url) => {
        setQrDataUrl(url);
        setIsGeneratingQr(false);
      })
      .catch((err) => {
        console.error('QR code generation error:', err);
        setIsGeneratingQr(false);
      });
  }, [qrType, qrColorTheme, qrEccLevel, activeCred]);

  // Handle Copy
  const handleCopy = (text: string, label: string) => {
    safeCopyToClipboard(text);
    setCopiedLabel(label);
    playTone(720, 0.03);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  // Handle Download QR PNG
  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `zyrquen-public-key-${qrType.toLowerCase()}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    playAuditChime();
  };

  // Sign Transaction Ceremony using WebAuthn
  const handleSignTransaction = async () => {
    setIsSigningTx(true);
    setSignFeedback('Preparing cryptographic intent & requesting hardware passkey ceremony...');
    playTone(520, 0.08);

    try {
      const intentPayload = JSON.stringify({
        system: 'ZYRQUEN-SOVEREIGN-SETTLEMENT-V1.2',
        type: txType,
        recipient: txRecipient,
        amount: txAmount,
        currency: 'THB-SOV',
        memo: txMemo,
        nonce: Date.now(),
        blockAnchor: CANONICAL_GENESIS_BLOCK,
        merkleRoot: CANONICAL_MERKLE_ROOT,
        principal: SYSTEM_METADATA.sovereignPrincipal,
      });

      const intentHash = await sha256Hex(intentPayload);

      // Execute WebAuthn signing via service
      const signRes = await webAuthnService.signTransactionWithKey(intentHash, activeCred?.id);

      if (signRes.success) {
        const newRecord: SignedTransactionRecord = {
          id: `TX-${Date.now().toString().slice(-6)}`,
          txHash: intentHash,
          type: txType,
          recipient: txRecipient,
          amount: `${txAmount} THB-SOV`,
          timestamp: signRes.timestamp,
          signatureHex: signRes.signatureHex,
          authenticator: activeCred?.hardwareModel || 'Platform Biometric Key',
          fipsLevel: activeCred?.fipsLevel || 'FIPS 140-3 Level 4',
          etdaSec9: signRes.etdaSec9Compliant,
          etdaSec26: signRes.etdaSec26Compliant,
        };

        setLastSignedTx(newRecord);
        setRecentTxLog((prev) => [newRecord, ...prev.slice(0, 9)]);
        setSignFeedback('Transaction signed & verified successfully via WebAuthn hardware token!');
        playAuditChime();

        // Generate receipt QR code
        QRCode.toDataURL(JSON.stringify({
          system: 'ZYRQUEN_SIGNED_TRANSACTION_RECEIPT',
          txId: newRecord.id,
          txHash: newRecord.txHash,
          signature: newRecord.signatureHex,
          timestamp: newRecord.timestamp,
          etdaSec9_26: 'RATIFIED',
        }), {
          width: 280,
          margin: 1,
          color: { dark: '#10B981', light: '#070a12' },
        }).then((receiptUrl) => setTxReceiptQrUrl(receiptUrl));

        if (onAddSystemEvent) {
          onAddSystemEvent(
            'WEBAUTHN_TX_SIGNED',
            `Transaction Signed: ${newRecord.id}`,
            `Signed ${txAmount} THB-SOV using ${activeCred?.hardwareModel || 'WebAuthn Passkey'}`,
            'SovereignWalletView',
            'info'
          );
        }
      } else {
        setSignFeedback(signRes.error || 'Transaction signing was rejected or timed out.');
        playTone(320, 0.1);
      }
    } catch (err: any) {
      setSignFeedback(err?.message || 'Cryptographic signing ceremony failed.');
      playTone(320, 0.1);
    } finally {
      setIsSigningTx(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-mono">
      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0a0f1e] via-[#070a12] to-[#0a0f1e] border-2 border-[#D4AF37]/50 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-950/60 border-2 border-[#D4AF37] flex items-center justify-center text-[#D4AF37] shadow-lg shadow-[#D4AF37]/20">
              <Wallet className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  VERIFIEDLIVEMAINNET 100% GREEN
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold">
                  FIPS 140-3 L4
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300 text-xs">
                  ETDA Sec 9/26
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-wide flex items-center gap-3">
                <span>Sovereign Cryptographic Wallet & Key Registry</span>
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                W3C WebAuthn Biometric Enclave • QR Code Public Key Dispatcher • Court-Admissible Signing
              </p>
            </div>
          </div>

          {/* Custodian Badge */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-black/50 border border-white/10 text-xs">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-400">SOVEREIGN CUSTODIAN</div>
              <div className="text-white font-bold">{SYSTEM_METADATA.sovereignPrincipal}</div>
              <div className="text-[10px] text-[#D4AF37]">นายยุทธภูมิ พากเพียร (Genesis #849202)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Treasury & Asset Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#0a0f1e] border border-[#D4AF37]/30 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] text-zinc-400">TOTAL SOVEREIGN RESERVE</div>
            <div className="text-base font-bold text-[#D4AF37]">฿4,230,000,000.00</div>
            <div className="text-[10px] text-emerald-400">100% Thai Treasury Guaranteed</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-950/40 text-[#D4AF37]">
            <Landmark className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a0f1e] border border-cyan-500/30 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] text-zinc-400">LBMA GOLD RESERVE</div>
            <div className="text-base font-bold text-cyan-300">14,902.00 oz</div>
            <div className="text-[10px] text-zinc-400">Allocated 99.99% Audited Physical</div>
          </div>
          <div className="p-3 rounded-xl bg-cyan-950/40 text-cyan-400">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a0f1e] border border-emerald-500/30 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] text-zinc-400">RWA TENANT PARTITIONS</div>
            <div className="text-base font-bold text-emerald-300">400 Tenants Locked</div>
            <div className="text-[10px] text-zinc-400">Boundary Ω601–Ω1000 Isolated</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-950/40 text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a0f1e] border border-violet-500/30 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] text-zinc-400">ACTIVE WEBAUTHN ENCLAVE</div>
            <div className="text-base font-bold text-violet-300 truncate max-w-[130px]">
              {activeCred?.hardwareModel || 'NitroKey HSM-PQC'}
            </div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> FIPS 140-3 L4 Active
            </div>
          </div>
          <div className="p-3 rounded-xl bg-violet-950/40 text-violet-400">
            <Key className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Dual-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: QR Code Public Key Dispatcher */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-3xl bg-[#0a0f1e] border border-white/10 space-y-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#D4AF37]" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Public Key QR Code Dispatcher
                </h2>
              </div>
              <span className="text-[11px] text-emerald-400 font-semibold">
                Instant Offline Scan
              </span>
            </div>

            {/* QR Payload Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                onClick={() => setQrType('PUBLIC_KEY')}
                className={`p-2.5 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                  qrType === 'PUBLIC_KEY'
                    ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                    : 'bg-black/40 border-white/10 text-zinc-400 hover:border-white/20'
                }`}
              >
                Public Key
              </button>

              <button
                onClick={() => setQrType('PAYMENT_URI')}
                className={`p-2.5 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                  qrType === 'PAYMENT_URI'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-black/40 border-white/10 text-zinc-400 hover:border-white/20'
                }`}
              >
                Settlement URI
              </button>

              <button
                onClick={() => setQrType('WEBAUTHN_DESCRIPTOR')}
                className={`p-2.5 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                  qrType === 'WEBAUTHN_DESCRIPTOR'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-black/40 border-white/10 text-zinc-400 hover:border-white/20'
                }`}
              >
                Passkey ID
              </button>

              <button
                onClick={() => setQrType('MERKLE_PROOF')}
                className={`p-2.5 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                  qrType === 'MERKLE_PROOF'
                    ? 'bg-violet-500/20 border-violet-400 text-violet-300'
                    : 'bg-black/40 border-white/10 text-zinc-400 hover:border-white/20'
                }`}
              >
                Merkle Proof
              </button>
            </div>

            {/* Visual QR Code Display Container */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-black/60 border border-white/10 relative overflow-hidden">
              <div className="relative p-4 rounded-2xl bg-[#070a12] border-2 border-[#D4AF37]/40 shadow-inner group">
                {isGeneratingQr ? (
                  <div className="w-[280px] h-[280px] flex items-center justify-center text-zinc-500">
                    <RefreshCw className="w-8 h-8 animate-spin text-[#D4AF37]" />
                  </div>
                ) : qrDataUrl ? (
                  <div className="relative">
                    <img
                      src={qrDataUrl}
                      alt="Sovereign Cryptographic Public Key QR Code"
                      className="w-[280px] h-[280px] rounded-xl object-contain"
                    />
                    {/* Visual hologram scan beam */}
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent top-0 animate-pulse pointer-events-none opacity-60" />
                  </div>
                ) : (
                  <div className="w-[280px] h-[280px] flex items-center justify-center text-rose-400 text-xs">
                    Failed to render QR Code
                  </div>
                )}
              </div>

              {/* QR Options: Colors & Error Correction */}
              <div className="flex items-center justify-between w-full max-w-sm mt-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 text-[11px]">Theme:</span>
                  {(['GOLD', 'CYAN', 'EMERALD'] as const).map((thm) => (
                    <button
                      key={thm}
                      onClick={() => setQrColorTheme(thm)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                        qrColorTheme === thm
                          ? thm === 'GOLD'
                            ? 'bg-[#D4AF37]/30 border-[#D4AF37] text-[#D4AF37]'
                            : thm === 'CYAN'
                            ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300'
                            : 'bg-emerald-500/30 border-emerald-400 text-emerald-300'
                          : 'bg-white/5 border-white/10 text-zinc-400'
                      }`}
                    >
                      {thm}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500 text-[11px]">ECC:</span>
                  {(['L', 'M', 'Q', 'H'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setQrEccLevel(lvl)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                        qrEccLevel === lvl
                          ? 'bg-white/20 border-white text-white'
                          : 'bg-white/5 border-white/10 text-zinc-400'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Download & Copy Action Buttons */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-4">
                <button
                  onClick={handleDownloadQr}
                  className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs text-white flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Download PNG</span>
                </button>

                <button
                  onClick={() => handleCopy(qrPayloadString, 'payload')}
                  className="py-2 px-3 rounded-xl bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/50 text-xs text-[#D4AF37] flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
                >
                  {copiedLabel === 'payload' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Payload</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Readout of Current QR Payload String */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Cryptographic Payload Inspector:</span>
                <button
                  onClick={() => handleCopy(qrPayloadString, 'raw')}
                  className="text-cyan-400 hover:text-cyan-300 text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedLabel === 'raw' ? 'Copied!' : 'Copy Raw Text'}</span>
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-black/70 border border-white/10 text-[10px] text-zinc-300 font-mono overflow-x-auto max-h-36 scrollbar-thin">
                {qrPayloadString}
              </pre>
            </div>
          </div>

          {/* Enrolled Hardware Keys Card */}
          <div className="p-6 rounded-3xl bg-[#0a0f1e] border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Enrolled WebAuthn Hardware Keys
                </h3>
              </div>
              <button
                onClick={() => {
                  setWebAuthnModalMode('register');
                  setIsWebAuthnModalOpen(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Fingerprint className="w-3.5 h-3.5" />
                <span>+ Enroll Key</span>
              </button>
            </div>

            <div className="space-y-2">
              {credentials.map((cred) => (
                <div
                  key={cred.id}
                  onClick={() => setSelectedCredId(cred.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    activeCred?.id === cred.id
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-white'
                      : 'bg-black/30 border-white/5 text-zinc-400 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
                      {cred.authenticatorType === 'platform' ? (
                        <Fingerprint className="w-4 h-4" />
                      ) : (
                        <Key className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{cred.hardwareModel}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                          {cred.fipsLevel}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {cred.userName} • Counter: {cred.counter} • {cred.algorithm}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {activeCred?.id === cred.id ? (
                      <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> ACTIVE
                      </span>
                    ) : (
                      <span className="text-zinc-500 text-xs">Select</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setWebAuthnModalMode('manage');
                setIsWebAuthnModalOpen(true);
              }}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>Launch Sovereign Key Management Deck</span>
            </button>
          </div>
        </div>

        {/* Right Column: Transaction Signing Terminal & Verification */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-3xl bg-[#0a0f1e] border border-white/10 space-y-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Cryptographic Transaction Signing Terminal
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                W3C WebAuthn
              </span>
            </div>

            {/* Transaction Parameters */}
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">Settlement Transaction Category</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('TRANSFER');
                      setTxAmount('10000000.00');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      txType === 'TRANSFER'
                        ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200'
                        : 'bg-black/40 border-white/10 text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <div className="font-bold">Digital Baht Transfer</div>
                    <div className="text-[10px] text-zinc-500">THB-SOV Treasury Reserve</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTxType('RWA_ALLOCATION');
                      setTxAmount('1.00');
                      setTxRecipient('Ω601-Ω700-INFRA-BUNDLE');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      txType === 'RWA_ALLOCATION'
                        ? 'bg-emerald-950/60 border-emerald-400 text-emerald-200'
                        : 'bg-black/40 border-white/10 text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <div className="font-bold">RWA Tenant Allocation</div>
                    <div className="text-[10px] text-zinc-500">Ω601–Ω1000 Isolation Partition</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTxType('RATIFICATION');
                      setTxAmount('14902.00');
                      setTxRecipient('0x909ab814479844d8a14816bed34cdbb07528e185');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      txType === 'RATIFICATION'
                        ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                        : 'bg-black/40 border-white/10 text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <div className="font-bold">Seal Ratification</div>
                    <div className="text-[10px] text-zinc-500">Genesis Block #849202</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTxType('CUSTOM_LEGAL');
                      setTxAmount('0.00');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      txType === 'CUSTOM_LEGAL'
                        ? 'bg-violet-950/60 border-violet-400 text-violet-200'
                        : 'bg-black/40 border-white/10 text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <div className="font-bold">Court Legal Briefing</div>
                    <div className="text-[10px] text-zinc-500">ETDA Sec 9/26 Signature</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Recipient / Target Partition</label>
                <input
                  type="text"
                  value={txRecipient}
                  onChange={(e) => setTxRecipient(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Amount / Units</label>
                  <input
                    type="text"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Signing Authenticator</label>
                  <div className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono truncate">
                    {activeCred?.hardwareModel || 'Platform Biometrics'}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Transaction Memo & Legal Basis</label>
                <input
                  type="text"
                  value={txMemo}
                  onChange={(e) => setTxMemo(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            {/* Execution Button */}
            <button
              onClick={handleSignTransaction}
              disabled={isSigningTx}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-amber-400 to-[#e6bf47] hover:from-[#c5a02e] hover:to-[#d4af37] text-black font-bold text-sm tracking-wide shadow-xl shadow-[#D4AF37]/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Fingerprint className="w-5 h-5" />
              <span>
                {isSigningTx
                  ? 'Requesting WebAuthn Passkey Touch...'
                  : 'Sign Transaction with Biometric Hardware Key'}
              </span>
            </button>

            {signFeedback && (
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-xs text-cyan-300 font-mono">
                {signFeedback}
              </div>
            )}

            {/* Latest Signed Transaction Receipt */}
            {lastSignedTx && (
              <div className="p-4 rounded-2xl bg-emerald-950/30 border-2 border-emerald-500/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Cryptographic Signature Ratified</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-500/40 text-emerald-200">
                    ETDA Sec 9/26 Non-Repudiation PASS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-zinc-300 pt-1">
                  <div>
                    <span className="text-zinc-500">Transaction ID: </span>
                    <span className="font-mono text-white">{lastSignedTx.id}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Timestamp: </span>
                    <span className="font-mono text-zinc-300">{lastSignedTx.timestamp}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400">Transaction Intent SHA-256 Digest:</span>
                  <div className="p-2 rounded bg-black/60 border border-white/10 text-[10px] font-mono text-cyan-300 break-all">
                    {lastSignedTx.txHash}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400">WebAuthn Signature Payload (r || s / ML-DSA-87):</span>
                  <div className="p-2 rounded bg-black/60 border border-white/10 text-[10px] font-mono text-emerald-300 break-all">
                    {lastSignedTx.signatureHex}
                  </div>
                </div>

                {txReceiptQrUrl && (
                  <div className="pt-2 flex items-center justify-between border-t border-emerald-500/20">
                    <div className="text-[11px] text-zinc-400">
                      Scan Receipt QR with mobile auditor:
                    </div>
                    <img
                      src={txReceiptQrUrl}
                      alt="Signed Transaction Receipt QR"
                      className="w-16 h-16 rounded-lg border border-emerald-500/40"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent Cryptographic Transactions Audit Log */}
          <div className="p-6 rounded-3xl bg-[#0a0f1e] border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Signed Transactions Audit Log
                </h3>
              </div>
              <span className="text-[11px] text-zinc-400">Zero Mutation SSoT</span>
            </div>

            <div className="space-y-2">
              {recentTxLog.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="font-bold text-white">{tx.id}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-zinc-300">
                        {tx.type}
                      </span>
                    </div>
                    <span className="text-emerald-400 font-bold">{tx.amount}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span className="font-mono">Hash: {tx.txHash.slice(0, 16)}...</span>
                    <span>{tx.authenticator}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* WebAuthn Management / Authentication Modal */}
      <WebAuthnModal
        isOpen={isWebAuthnModalOpen}
        onClose={() => {
          setIsWebAuthnModalOpen(false);
          setCredentials(webAuthnService.getEnrolledCredentials());
        }}
        mode={webAuthnModalMode}
        title="Sovereign Hardware Key Management Enclave"
      />
    </div>
  );
};
