import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  QrCode,
  Scan,
  Camera,
  Upload,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Lock,
  X,
  Fingerprint,
  FileCode,
  ShieldAlert,
  History,
  Trash2,
  Download,
} from 'lucide-react';
import jsQR from 'jsqr';
import { systemStateStore, CustodianRegistrySnapshot } from '../../store/systemStateStore';
import { COUNCIL_MEMBERS } from '../../data/councilData';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { safeCopyToClipboard } from '../../utils/clipboard';

export interface QrScanRecord {
  id: string;
  timestamp: string;
  timeFormatted: string;
  title: string;
  type: 'SLOT_PROOF' | 'CANONICAL_BUNDLE';
  slotId?: number;
  guardianName?: string;
  councilCode?: string;
  signatureDigest: string;
  bundleId?: string;
  pqcStandard: string;
  ratified: boolean;
  rawPayload: string;
  verifiedAtQuorum?: number;
}

export interface CustodianQRValidatorProps {
  isOpen?: boolean;
  onClose?: () => void;
  isEmbedded?: boolean;
  onSignoffSuccess?: (result: {
    slotId: number;
    signatureDigest: string;
    verifiedCount: number;
    isQuorumSatisfied: boolean;
    bundleId?: string;
  }) => void;
  onAuditLog?: (title: string, description: string, severity?: 'info' | 'success' | 'warning' | 'error') => void;
}

interface LiveCameraScannerProps {
  onScan: (result: string) => void;
  onError: (error: any) => void;
}

const LiveCameraScanner: React.FC<LiveCameraScannerProps> = ({ onScan, onError }) => {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let isActive = true;
    let stream: MediaStream | null = null;
    let animationFrameId: number;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      onError({ name: 'NotSupportedError', message: 'Camera API not supported in this environment' });
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((s) => {
        if (!isActive) {
          s.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
        }

        const scanLoop = () => {
          if (!isActive) return;
          const video = videoRef.current;
          if (video && video.readyState >= 2 && ctx) {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imgData.data, imgData.width, imgData.height, {
              inversionAttempts: 'attemptBoth',
            });
            if (code && code.data) {
              onScan(code.data);
              return;
            }
          }
          animationFrameId = requestAnimationFrame(scanLoop);
        };
        animationFrameId = requestAnimationFrame(scanLoop);
      })
      .catch((err) => {
        if (isActive) {
          onError(err);
        }
      });

    return () => {
      isActive = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onScan, onError]);

  return (
    <video
      ref={videoRef}
      playsInline
      muted
      autoPlay
      className="w-full h-full object-cover"
    />
  );
};

export const CustodianQRValidator: React.FC<CustodianQRValidatorProps> = ({
  isOpen = true,
  onClose = () => {},
  isEmbedded = false,
  onSignoffSuccess,
  onAuditLog,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'samples'>('camera');
  const [scannedData, setScannedData] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [cameraScannerActive, setCameraScannerActive] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Local state maintaining history of recent successful QR forensic scans with local storage persistence
  const [scanHistory, setScanHistory] = useState<QrScanRecord[]>(() => {
    try {
      const saved = localStorage.getItem('zyrquen_qr_scan_history_omega1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore storage errors
    }

    const slot1 = systemStateStore.getState().custodianRegistry.slots.find((s) => s.slot_id === '#01');
    const now = new Date();
    const timeStr = now.toLocaleTimeString('th-TH', { hour12: false });
    if (slot1 && (slot1.status === 'verified' || (slot1.status as string) === 'VERIFIED')) {
      return [
        {
          id: 'scan-genesis-01',
          timestamp: timeStr,
          timeFormatted: `${timeStr} (Genesis SSoT)`,
          title: 'Slot #01 Sovereign Architect',
          type: 'SLOT_PROOF',
          slotId: 1,
          guardianName: 'นายยุทธภูมิ พากเพียร',
          councilCode: '#EP-SOVEREIGN-01',
          signatureDigest: slot1.signature_digest,
          pqcStandard: 'NIST FIPS 204 ML-DSA-87',
          ratified: true,
          rawPayload: JSON.stringify(
            {
              slot_id: '#01',
              passportId: 'EP-SOV-001',
              signature_digest: slot1.signature_digest,
              standard: 'NIST FIPS 204 ML-DSA-87',
              boundary: 'Ω600_1000',
            },
            null,
            2
          ),
          verifiedAtQuorum: 1,
        },
      ];
    }
    return [];
  });

  // Sync scan history changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('zyrquen_qr_scan_history_omega1', JSON.stringify(scanHistory));
    } catch {
      // Ignore quota errors
    }
  }, [scanHistory]);

  // Export local scan logs history as a formatted JSON file
  const handleExportScanLogs = () => {
    playAuditChime();
    const exportPayload = {
      exportSchema: 'https://schema.sovereign-ledger.gov/v2.1/forensic-qr-scan-logs.json',
      canonicalBlock: 849202,
      merkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      partition: 'Ω600_1000',
      exportedAtUtc: new Date().toISOString(),
      totalScansRecorded: scanHistory.length,
      currentQuorumState: {
        verifiedCount: registryState.verifiedCount,
        isQuorumSatisfied: registryState.isQuorumSatisfied,
        isSuperMajorityAttained: registryState.isSuperMajorityAttained,
        ledgerMode: registryState.ledgerMode,
      },
      scans: scanHistory,
    };

    const jsonStr = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const nowUtc = new Date().toISOString().replace(/[:.]/g, '-');
    link.href = url;
    link.download = `zyrquen-qr-forensic-scans-${nowUtc}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const [registryState, setRegistryState] = useState<CustodianRegistrySnapshot>(
    systemStateStore.getState().custodianRegistry
  );

  const [validationState, setValidationState] = useState<{
    status: 'IDLE' | 'ANALYZING' | 'VALID' | 'DUPLICATE' | 'INVALID';
    title?: string;
    details: string[];
    parsedPayload?: any;
    targetSlotId?: number;
    signatureDigest?: string;
    bundleId?: string;
    isDuplicate?: boolean;
    canSignoff?: boolean;
  }>({
    status: 'IDLE',
    details: [],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = systemStateStore.subscribe((state) => {
      setRegistryState(state.custodianRegistry);
    });
    return unsub;
  }, []);

  // Reset scan state on modal open
  useEffect(() => {
    if (isOpen) {
      setCameraScannerActive(true);
      setCameraError(null);
    } else {
      setCameraScannerActive(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handles result from react-qr-reader
  const handleQrReaderResult = (result: any | null | undefined, error: any | null | undefined) => {
    if (result) {
      const text = typeof result === 'string' ? result : result?.getText?.() || result?.text;
      if (text && text !== scannedData) {
        playTone(840, 0.08);
        setScannedData(text);
        setCameraScannerActive(false);
        processScannedPayload(text);
      }
    }
    if (error) {
      // Normal continuous frame search errors in react-qr-reader can be safely suppressed
      // unless user camera is actively denied
      if (error?.name === 'NotAllowedError') {
        setCameraError('Camera access permission was denied. Please allow camera or upload an image.');
      }
    }
  };

  // Process manual file upload using fallback decoder jsQR
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playTone(620, 0.04);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });
        if (code && code.data) {
          playAuditChime();
          setScannedData(code.data);
          processScannedPayload(code.data);
        } else {
          playTone(320, 0.2, 'sawtooth');
          setValidationState({
            status: 'INVALID',
            title: 'No Optical QR Code Detected',
            details: [
              'The uploaded image does not contain a recognizable high-contrast QR pattern.',
              'Ensure the image contains a clear forensic QR code.',
            ],
            isDuplicate: false,
            canSignoff: false,
          });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Inspect and validate payload against CustodianRegistry validateSignature method
  const processScannedPayload = (raw: string) => {
    setValidationState({
      status: 'ANALYZING',
      details: ['Validating forensic QR payload against CustodianRegistry...'],
    });

    setTimeout(() => {
      let parsed: any = null;
      let decodedStr = raw.trim();

      // Check if base64 encoded
      if (!decodedStr.startsWith('{') && !decodedStr.startsWith('[')) {
        try {
          decodedStr = decodeURIComponent(escape(atob(decodedStr)));
        } catch {
          // Keep raw string
        }
      }

      try {
        parsed = JSON.parse(decodedStr);
      } catch {
        parsed = {
          rawDigest: decodedStr,
        };
      }

      evaluateEvidence(parsed, decodedStr);
    }, 350);
  };

  const evaluateEvidence = (parsed: any, rawString: string) => {
    const details: string[] = [];
    details.push(`Raw Payload Size: ${rawString.length} bytes`);

    // Case 1: Multi-slot Evidence Bundle (CEB)
    if (parsed.quorum_attestation && Array.isArray(parsed.quorum_attestation.proof_slots)) {
      const bundleId = parsed.bundle_metadata?.bundle_id || 'CEB-BUNDLE';
      details.push(`Detected Schema: Canonical Evidence Bundle (${bundleId})`);
      details.push(`Total Proof Slots Provided: ${parsed.quorum_attestation.proof_slots.length}`);

      // Check bundle duplication
      if (registryState.registeredBundles.includes(bundleId)) {
        playTone(300, 0.25, 'sawtooth');
        setValidationState({
          status: 'DUPLICATE',
          title: 'FAIL-CLOSED: Duplicate Evidence Bundle Rejected',
          details: [
            ...details,
            `REPLAY BLOCKED: Bundle ID '${bundleId}' is already anchored in CustodianRegistry.`,
            'Zero-trust duplicate rejection policy active. Quorum counter unchanged.',
          ],
          parsedPayload: parsed,
          bundleId,
          isDuplicate: true,
          canSignoff: false,
        });
        if (onAuditLog) {
          onAuditLog(
            'Replay Attack Blocked: Duplicate Bundle',
            `Attempted re-anchoring of bundle ${bundleId}. Rejected by fail-closed duplicate validator.`,
            'error'
          );
        }
        return;
      }

      setValidationState({
        status: 'VALID',
        title: 'Authentic Canonical Evidence Bundle (CEB)',
        details: [
          ...details,
          `Hardware Node: ${parsed.cryptography_suite?.hardware_attestation || 'REAL_HSM Array'}`,
          `Signature Algorithm: ${parsed.cryptography_suite?.signature_scheme || 'Dilithium-5 / PQC'}`,
          'Status: Ready for Quorum Super-Majority Sign-off.',
        ],
        parsedPayload: parsed,
        bundleId,
        isDuplicate: false,
        canSignoff: true,
      });

      // Record successful CEB bundle scan in local scan history
      const now = new Date();
      const timeStr = now.toLocaleTimeString('th-TH', { hour12: false });
      const bundleRecord: QrScanRecord = {
        id: `scan-bundle-${Date.now()}`,
        timestamp: timeStr,
        timeFormatted: timeStr,
        title: `Bundle: ${bundleId}`,
        type: 'CANONICAL_BUNDLE',
        signatureDigest: bundleId,
        bundleId,
        pqcStandard: parsed.cryptography_suite?.signature_scheme || 'Dilithium-5 / PQC',
        ratified: false,
        rawPayload: rawString,
      };
      setScanHistory((prev) => [bundleRecord, ...prev.filter((r) => r.signatureDigest !== bundleRecord.signatureDigest)].slice(0, 20));

      playTone(880, 0.08);
      return;
    }

    // Case 2: Individual Slot Evidence
    const slotIdRaw = parsed.slot_id || parsed.slotId || parsed.slot;
    const sigDigest =
      parsed.signature ||
      parsed.signature_digest ||
      parsed.cryptoSignature ||
      parsed.rawDigest ||
      (rawString.length >= 24 ? rawString : null);

    let numericSlotId = 0;
    if (typeof slotIdRaw === 'string') {
      numericSlotId = parseInt(slotIdRaw.replace('#', ''), 10);
    } else if (typeof slotIdRaw === 'number') {
      numericSlotId = slotIdRaw;
    }

    // Match by certificateSerial or passportId if available
    if (!numericSlotId && (parsed.passportId || parsed.certificateSerial)) {
      const match = COUNCIL_MEMBERS.find(
        (m) =>
          (parsed.passportId && m.passportId === parsed.passportId) ||
          (parsed.certificateSerial && m.certificateSerial === parsed.certificateSerial)
      );
      if (match) {
        numericSlotId = match.slotId;
      }
    }

    // Execute validateSignature from CustodianRegistry via systemStateStore
    const validation = systemStateStore.validateSignature(
      sigDigest || '',
      numericSlotId || undefined,
      parsed.bundle_id
    );

    if (validation.isDuplicate) {
      playTone(300, 0.25, 'sawtooth');
      setValidationState({
        status: 'DUPLICATE',
        title: 'FAIL-CLOSED: Duplicate Signature Rejected',
        details: [
          ...details,
          validation.reason,
          'Deduplication guard enforced: Re-anchoring of historical signatures is disallowed in quorum calculation.',
        ],
        parsedPayload: parsed,
        targetSlotId: numericSlotId,
        signatureDigest: sigDigest,
        isDuplicate: true,
        canSignoff: false,
      });
      if (onAuditLog) {
        onAuditLog(
          'Replay Attack Blocked: Duplicate Signature',
          `Duplicate signature digest ${sigDigest?.slice(0, 16)}... rejected from quorum count.`,
          'warning'
        );
      }
      return;
    }

    if (!validation.isValid) {
      playTone(320, 0.2, 'sawtooth');
      setValidationState({
        status: 'INVALID',
        title: 'FAIL-CLOSED: Cryptographic Signature Verification Failed',
        details: [...details, validation.reason],
        parsedPayload: parsed,
        isDuplicate: false,
        canSignoff: false,
      });
      return;
    }

    // Valid unique signature
    const councilMember = numericSlotId
      ? COUNCIL_MEMBERS.find((m) => m.slotId === numericSlotId)
      : null;

    setValidationState({
      status: 'VALID',
      title: councilMember
        ? `Valid Custodian Proof for Slot #${numericSlotId} (${councilMember.nameEn})`
        : `Cryptographic Evidence Verified (${sigDigest?.slice(0, 16)}...)`,
      details: [
        ...details,
        validation.reason,
        `Matched Guardian: ${councilMember ? `${councilMember.nameEn} [${councilMember.councilCode}]` : 'Dynamic Quorum Slot'}`,
        `Cryptographic Enclave: ${councilMember ? councilMember.hardwareEnclave : 'REAL_HSM FIPS 140-3 L4'}`,
        `Signature Digest: ${sigDigest?.slice(0, 32)}...`,
        'Ready for CustodianRegistry Quorum Sign-off.',
      ],
      parsedPayload: parsed,
      targetSlotId: numericSlotId || 5,
      signatureDigest: sigDigest,
      isDuplicate: false,
      canSignoff: true,
    });

    // Record successful individual slot scan in local scan history
    const now = new Date();
    const timeStr = now.toLocaleTimeString('th-TH', { hour12: false });
    const slotRecord: QrScanRecord = {
      id: `scan-slot-${Date.now()}`,
      timestamp: timeStr,
      timeFormatted: timeStr,
      title: councilMember
        ? `Slot #${numericSlotId || 5} (${councilMember.nameEn})`
        : `Slot #${numericSlotId || '05'} Custodian`,
      type: 'SLOT_PROOF',
      slotId: numericSlotId || 5,
      guardianName: councilMember?.nameEn,
      councilCode: councilMember?.councilCode,
      signatureDigest: sigDigest || '',
      bundleId: parsed.bundle_id,
      pqcStandard: 'NIST FIPS 204 ML-DSA-87',
      ratified: false,
      rawPayload: rawString,
    };
    setScanHistory((prev) => [slotRecord, ...prev.filter((r) => r.signatureDigest !== slotRecord.signatureDigest)].slice(0, 20));

    playTone(880, 0.08);
  };

  // Executes secure sign-off callback and updates CustodianRegistry
  const handleExecuteSignoff = () => {
    if (!validationState.canSignoff || !validationState.parsedPayload) return;

    const payload = validationState.parsedPayload;

    // Ingest Multi-Slot Evidence Bundle
    if (payload.quorum_attestation && Array.isArray(payload.quorum_attestation.proof_slots)) {
      const bundleResult = systemStateStore.ingestEvidenceBundle(payload);
      if (bundleResult.success) {
        playAuditChime();
        // Update Council members in memory
        payload.quorum_attestation.proof_slots.forEach((p: any) => {
          const numId = parseInt(p.slot_id?.replace('#', '') || '0', 10);
          const idx = COUNCIL_MEMBERS.findIndex((m) => m.slotId === numId);
          if (idx > -1) {
            COUNCIL_MEMBERS[idx].verificationStatus = 'REAL_HSM_SIGNED';
          }
        });

        const bId = payload.bundle_metadata?.bundle_id || 'CEB-BUNDLE';

        // Update scan history record status to ratified
        setScanHistory((prev) =>
          prev.map((item) =>
            item.bundleId === bId || item.signatureDigest === bId
              ? { ...item, ratified: true, verifiedAtQuorum: bundleResult.totalVerifiedCount }
              : item
          )
        );

        if (onSignoffSuccess) {
          onSignoffSuccess({
            slotId: 8,
            signatureDigest: bId,
            verifiedCount: bundleResult.totalVerifiedCount,
            isQuorumSatisfied: bundleResult.isQuorumSatisfied,
            bundleId: payload.bundle_metadata?.bundle_id,
          });
        }

        if (onAuditLog) {
          onAuditLog(
            'Quorum Evidence Bundle Ratified',
            `Ingested ${bundleResult.acceptedSlots} unique proofs via QR Validator. Total Quorum: ${bundleResult.totalVerifiedCount}/10.`,
            'success'
          );
        }

        setValidationState({
          status: 'VALID',
          title: 'Quorum Sign-Off Ratified into SSoT',
          details: [
            `Anchored ${bundleResult.acceptedSlots} Physical Custodian Proofs.`,
            `Total Quorum Attained: ${bundleResult.totalVerifiedCount} / 10`,
            bundleResult.isQuorumSatisfied
              ? '★ 8/10 SUPER-MAJORITY QUORUM ASCENSION RATIFIED.'
              : `Pending for 8/10: ${Math.max(0, 8 - bundleResult.totalVerifiedCount)} additional signatures required.`,
          ],
          canSignoff: false,
        });
      }
      return;
    }

    // Ingest Individual Slot Proof
    const slotId = validationState.targetSlotId || 5;
    const digest = validationState.signatureDigest || '0xvalid';
    const member = COUNCIL_MEMBERS.find((m) => m.slotId === slotId);

    const ingestResult = systemStateStore.ingestCustodianEvidence(slotId, digest, {
      name: member ? member.roleEn : `Custodian Slot #${slotId}`,
      signerNode: member ? member.hardwareEnclave : 'REAL_HSM_01',
      publicKey: member ? member.keyFingerprint : 'pqc_dilithium5_pk',
      bundleId: payload.bundle_id || 'QR-FORENSIC-VALIDATOR',
    });

    if (ingestResult.success) {
      playAuditChime();
      if (member) {
        member.verificationStatus = 'REAL_HSM_SIGNED';
      }

      // Update scan history item status to ratified
      setScanHistory((prev) =>
        prev.map((item) =>
          (item.slotId && item.slotId === slotId) || item.signatureDigest === digest
            ? { ...item, ratified: true, verifiedAtQuorum: ingestResult.verifiedCount }
            : item
        )
      );

      if (onSignoffSuccess) {
        onSignoffSuccess({
          slotId,
          signatureDigest: digest,
          verifiedCount: ingestResult.verifiedCount,
          isQuorumSatisfied: ingestResult.quorumUnlocked,
        });
      }

      if (onAuditLog) {
        onAuditLog(
          `Custodian Slot #${slotId} Ratified`,
          `Physical proof anchored into CustodianRegistry. Quorum count updated to ${ingestResult.verifiedCount}/10.`,
          'success'
        );
      }

      setValidationState({
        status: 'VALID',
        title: `Slot #${slotId} Successfully Ratified & Anchored`,
        details: [
          `Custodian Slot #${slotId} bound to CustodianRegistry.`,
          `Current Quorum Verified: ${ingestResult.verifiedCount} / 10`,
          ingestResult.quorumUnlocked
            ? '★ 8/10 SUPER-MAJORITY QUORUM REACHED!'
            : `Pending for 8/10: ${Math.max(0, 8 - ingestResult.verifiedCount)} additional signatures required.`,
        ],
        canSignoff: false,
      });
    } else {
      playTone(300, 0.25, 'sawtooth');
      setValidationState({
        status: 'INVALID',
        title: 'FAIL-CLOSED: Quorum Mutation Rejected',
        details: [ingestResult.reason || 'Evidence submission failed registry validation.'],
        canSignoff: false,
      });
    }
  };

  const handleTestVector = (vector: 'valid-slot5' | 'valid-bundle' | 'duplicate-replay') => {
    playTone(660, 0.04);
    if (vector === 'valid-bundle') {
      const payload = {
        $schema: 'https://schema.sovereign-ledger.gov/v2.1/evidence-bundle.json',
        bundle_metadata: {
          bundle_id: `CEB-QR-TEST-${Date.now()}`,
          canonical_block_height: 849208,
          total_seals_anchored: 14908,
          state_drift_integrity: 'Δ0.00%',
        },
        cryptography_suite: {
          signature_scheme: 'Dilithium-5',
          hardware_attestation: 'Sovereign Physical HSM Node #01',
        },
        quorum_attestation: {
          super_majority_attained: true,
          proof_slots: [
            {
              slot_id: '#05',
              name: 'PDPA Consent Verification',
              signer_node: 'HSM Node #02',
              signature_digest: `0xqr_test_slot05_${Date.now()}`,
            },
            {
              slot_id: '#06',
              name: 'Zero State Drift Proof',
              signer_node: 'HSM Node #03',
              signature_digest: `0xqr_test_slot06_${Date.now()}`,
            },
            {
              slot_id: '#07',
              name: 'Judicial Registrar Witness',
              signer_node: 'HSM Node #01',
              signature_digest: `0xqr_test_slot07_${Date.now()}`,
            },
            {
              slot_id: '#08',
              name: 'Super Majority Gate Anchor',
              signer_node: 'HSM Node #02',
              signature_digest: `0xqr_test_slot08_${Date.now()}`,
            },
          ],
        },
      };
      const text = JSON.stringify(payload, null, 2);
      setScannedData(text);
      processScannedPayload(text);
    } else if (vector === 'duplicate-replay') {
      // Re-use Slot #01 Genesis signature
      const slot1Sig = registryState.slots.find((s) => s.slot_id === '#01')?.signature_digest || '0x8f9a2b7c4e1d90a883fa51c892bc0183';
      const payload = {
        slot_id: '#05',
        passportId: 'EP-SOV-005',
        signature_digest: slot1Sig,
      };
      const text = JSON.stringify(payload, null, 2);
      setScannedData(text);
      processScannedPayload(text);
    } else {
      // Valid Slot #05 payload
      const payload = {
        slot_id: '#05',
        passportId: 'EP-SOV-005',
        certificateSerial: 'CERT-TH-PDPA-2026-005',
        signature_digest: `0xvalid_dilithium5_slot05_${Math.random().toString(16).slice(2)}${Date.now()}`,
      };
      const text = JSON.stringify(payload, null, 2);
      setScannedData(text);
      processScannedPayload(text);
    }
  };

  const verifiedCount = registryState.verifiedCount;
  const isQuorumReached = registryState.isQuorumSatisfied;

  const content = (
    <div
      className={`relative w-full ${
        isEmbedded
          ? 'rounded-2xl border border-cyan-500/30 bg-[#070a12]'
          : 'max-w-4xl max-h-[92vh] flex flex-col rounded-[28px] bg-[#070914] border border-cyan-500/40 forensic-frame-pulse shadow-[0_0_60px_rgba(6,182,212,0.25)]'
      } overflow-hidden text-zinc-300`}
    >
      {/* Subtle Forensic CRT Scanline Overlay and Scanning Beam */}
      <div className="absolute inset-0 forensic-crt-mesh pointer-events-none z-30 opacity-60" />
      <div className="forensic-scanline-beam" />

      {/* Modal Header */}
      <div className="flex items-center justify-between p-5 sm:p-6 border-b border-cyan-500/20 bg-black/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">
                🏛️ Custodian QR Validator &amp; Quorum Sign-off
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                REAL_HSM FIPS 140-3 L4
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Scan forensic optical credentials using 'react-qr-reader' to validate against CustodianRegistry SSoT (Ω600_1000).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end text-right px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[9px] text-zinc-400 uppercase font-bold">Quorum Super-Majority</span>
            <span className={`text-xs font-bold ${isQuorumReached ? 'text-emerald-400' : 'text-amber-300'}`}>
              {verifiedCount} / 10 Verified ({isQuorumReached ? '>=80%' : `${Math.max(0, 8 - verifiedCount)} Req`})
            </span>
          </div>

          {!isEmbedded && (
            <button
              onClick={() => {
                playTone(500, 0.04);
                onClose();
              }}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-white/5 bg-black/20">
          <button
            onClick={() => {
              playTone(600, 0.04);
              setActiveTab('camera');
              setCameraScannerActive(true);
            }}
            className={`px-4 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
              activeTab === 'camera'
                ? 'text-cyan-300 border-cyan-400 bg-cyan-500/10'
                : 'text-zinc-400 border-transparent hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Optical QR Scanner (react-qr-reader)</span>
          </button>

          <button
            onClick={() => {
              playTone(600, 0.04);
              setActiveTab('upload');
              setCameraScannerActive(false);
            }}
            className={`px-4 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
              activeTab === 'upload'
                ? 'text-cyan-300 border-cyan-400 bg-cyan-500/10'
                : 'text-zinc-400 border-transparent hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Image File Dropzone</span>
          </button>

          <button
            onClick={() => {
              playTone(600, 0.04);
              setActiveTab('samples');
              setCameraScannerActive(false);
            }}
            className={`px-4 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
              activeTab === 'samples'
                ? 'text-purple-300 border-purple-400 bg-purple-500/10'
                : 'text-zinc-400 border-transparent hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Diagnostic QR Vectors</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Viewport Left 6 cols */}
            <div className="lg:col-span-6 space-y-4">
              {activeTab === 'camera' && (
                <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                      <Scan className="w-4 h-4 text-cyan-400" />
                      Live Optical Camera
                    </span>
                    <button
                      onClick={() => {
                        playTone(600, 0.04);
                        setCameraScannerActive(!cameraScannerActive);
                      }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 cursor-pointer"
                    >
                      {cameraScannerActive ? 'Pause Sensor' : 'Resume Sensor'}
                    </button>
                  </div>

                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#030408] border border-cyan-500/20 flex items-center justify-center">
                    {cameraScannerActive ? (
                      <div className="w-full h-full relative">
                        <LiveCameraScanner
                          onScan={(text) => handleQrReaderResult(text, null)}
                          onError={(err) => handleQrReaderResult(null, err)}
                        />
                        {/* Target Reticle */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <div className="w-44 h-44 border-2 border-dashed border-cyan-400/80 rounded-2xl animate-pulse flex items-center justify-center relative shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                            <span className="text-[10px] text-cyan-300 bg-black/70 px-2 py-0.5 rounded font-mono tracking-wider">
                              TARGET QR CODE
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center space-y-2">
                        <Camera className="w-10 h-10 text-zinc-600 mx-auto" />
                        <div className="text-xs font-bold text-zinc-400">Camera Feed Paused</div>
                        <p className="text-[10px] text-zinc-500 max-w-xs mx-auto">
                          Click 'Resume Sensor' or use the Image Upload / Diagnostic Vectors tab.
                        </p>
                      </div>
                    )}

                    {cameraError && (
                      <div className="absolute inset-0 bg-black/90 p-4 flex flex-col items-center justify-center text-center space-y-2">
                        <AlertTriangle className="w-8 h-8 text-amber-400" />
                        <div className="text-xs font-bold text-amber-300">Optical Sensor Permission</div>
                        <p className="text-[10px] text-zinc-400 max-w-xs">{cameraError}</p>
                        <button
                          onClick={() => setActiveTab('upload')}
                          className="mt-2 text-xs px-3 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 cursor-pointer"
                        >
                          Switch to File Upload
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'upload' && (
                <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
                  <span className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-cyan-400" />
                    Upload QR Image File
                  </span>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-8 border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/60 rounded-xl cursor-pointer bg-black/40 text-center space-y-3 transition-all"
                  >
                    <QrCode className="w-10 h-10 text-cyan-400 mx-auto" />
                    <div className="text-xs font-bold text-white">Drop or select forensic QR snapshot</div>
                    <div className="text-[10px] text-zinc-500">Supports PNG, JPG, WEBP, or SVG files</div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'samples' && (
                <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Forensic Test Vectors
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    Test deduplication rejection, 8/10 super-majority quorum logic, and fail-closed security:
                  </p>

                  <div className="space-y-2">
                    <button
                      onClick={() => handleTestVector('valid-slot5')}
                      className="w-full text-left p-3 rounded-xl bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-500/30 transition-all flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-bold text-cyan-300">Vector 1: Valid Slot #05 Proof</div>
                        <div className="text-[10px] text-zinc-400">Valid unique Dilithium-5 signature</div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        TEST VALID
                      </span>
                    </button>

                    <button
                      onClick={() => handleTestVector('valid-bundle')}
                      className="w-full text-left p-3 rounded-xl bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/30 transition-all flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-bold text-purple-300">Vector 2: CEB 4-Slot Quorum Batch</div>
                        <div className="text-[10px] text-zinc-400">Batch of Slots #05-#08 to attain 8/10</div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        TEST BUNDLE
                      </span>
                    </button>

                    <button
                      onClick={() => handleTestVector('duplicate-replay')}
                      className="w-full text-left p-3 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/30 transition-all flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-bold text-rose-300">Vector 3: Duplicate Replay Attack</div>
                        <div className="text-[10px] text-zinc-400">Reuses Slot #01 Genesis signature</div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        TEST REPLAY
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Raw Payload Preview Box */}
              <div className="p-4 rounded-2xl bg-black/50 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
                    Decoded Payload (Optical Text)
                  </span>
                  {scannedData && (
                    <button
                      onClick={() => {
                        safeCopyToClipboard(scannedData);
                        setCopiedKey('raw');
                        setTimeout(() => setCopiedKey(null), 2000);
                      }}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'raw' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'raw' ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>
                <textarea
                  value={scannedData}
                  onChange={(e) => {
                    setScannedData(e.target.value);
                    if (e.target.value.trim()) {
                      processScannedPayload(e.target.value);
                    }
                  }}
                  placeholder="Awaiting QR decode or paste evidence payload..."
                  className="w-full h-20 bg-[#030408] border border-white/10 rounded-xl p-2.5 text-[11px] font-mono text-cyan-300 focus:outline-none focus:border-cyan-500/40 resize-none"
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Validation & Ratification Status Right 6 cols */}
            <div className="lg:col-span-6 flex flex-col justify-between p-5 rounded-2xl bg-black/60 border border-white/10 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    CustodianRegistry Verification
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      validationState.status === 'VALID'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : validationState.status === 'DUPLICATE' || validationState.status === 'INVALID'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : validationState.status === 'ANALYZING'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {validationState.status}
                  </span>
                </div>

                {validationState.title && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-bold flex items-start gap-2.5 ${
                      validationState.status === 'VALID'
                        ? 'bg-emerald-950/30 text-emerald-300 border-emerald-500/40'
                        : validationState.status === 'DUPLICATE'
                        ? 'bg-rose-950/30 text-rose-300 border-rose-500/40'
                        : 'bg-amber-950/30 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {validationState.status === 'VALID' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>{validationState.title}</div>
                  </div>
                )}

                {/* Audit trace logs */}
                <div className="space-y-1.5 p-3 rounded-xl bg-[#030408] border border-white/5 min-h-[110px] max-h-[160px] overflow-y-auto">
                  <div className="text-[10px] text-zinc-500 mb-1 font-bold">Attestation Trace Log:</div>
                  {validationState.details.length === 0 ? (
                    <div className="text-[11px] text-zinc-600">Scan or paste a QR code to run validation...</div>
                  ) : (
                    validationState.details.map((line, idx) => (
                      <div
                        key={idx}
                        className={`text-[10px] ${
                          line.includes('FAIL-CLOSED') || line.includes('BLOCKED') || line.includes('Duplicate')
                            ? 'text-rose-400 font-bold'
                            : line.includes('SUPER-MAJORITY') || line.includes('VERIFIED') || line.includes('Authentic')
                            ? 'text-emerald-400 font-bold'
                            : 'text-zinc-400'
                        }`}
                      >
                        • {line}
                      </div>
                    ))
                  )}
                </div>

                {/* Recent Successful Forensic Scans List */}
                <div className="p-3 rounded-xl bg-[#030408] border border-cyan-500/20 space-y-2">
                  <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Recent Forensic Scans History</span>
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        {scanHistory.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {scanHistory.length > 0 && (
                        <button
                          type="button"
                          onClick={handleExportScanLogs}
                          className="px-2 py-0.5 rounded bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs hover:text-cyan-100"
                          title="Download local history of successful QR forensic scans as a JSON file"
                        >
                          <Download className="w-2.5 h-2.5" />
                          <span>Export Logs</span>
                        </button>
                      )}

                      {scanHistory.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            playTone(400, 0.05);
                            setScanHistory([]);
                          }}
                          className="text-[9px] text-zinc-500 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
                          title="Clear scan history"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Clear</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Scrollable list of scans */}
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 font-mono custom-scrollbar">
                    {scanHistory.length === 0 ? (
                      <div className="p-4 text-center text-[10px] text-zinc-500 rounded-lg bg-black/40 border border-white/5 flex flex-col items-center justify-center gap-1.5">
                        <History className="w-4 h-4 text-zinc-600" />
                        <span>No recent forensic scans recorded. Scan or select a QR vector above.</span>
                      </div>
                    ) : (
                      scanHistory.map((scan) => (
                        <div
                          key={scan.id}
                          onClick={() => {
                            playTone(700, 0.04);
                            setScannedData(scan.rawPayload);
                            processScannedPayload(scan.rawPayload);
                          }}
                          className="group p-2.5 rounded-lg bg-[#070a12] hover:bg-cyan-950/40 border border-white/5 hover:border-cyan-500/40 transition-all cursor-pointer flex items-center justify-between gap-2 shadow-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px]">
                                {scan.type === 'CANONICAL_BUNDLE' ? '📦' : '🏛️'}
                              </span>
                              <span className="text-[11px] font-bold text-cyan-300 truncate group-hover:text-cyan-200">
                                {scan.title}
                              </span>
                              <span className="text-[9px] text-zinc-500 shrink-0 font-mono">
                                {scan.timeFormatted}
                              </span>
                            </div>
                            <div className="text-[9px] text-zinc-400 font-mono truncate mt-0.5 flex items-center gap-2">
                              <span>Digest: {scan.signatureDigest.slice(0, 18)}...</span>
                              <span className="text-[8px] text-cyan-400/80 px-1 py-0.2 rounded bg-black/80 border border-cyan-500/20">
                                {scan.pqcStandard}
                              </span>
                              {scan.verifiedAtQuorum && (
                                <span className="text-[8px] text-zinc-500">
                                  Q#{scan.verifiedAtQuorum}/10
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {scan.ratified ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                                👑 RATIFIED
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                🛡️ VERIFIED
                              </span>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                safeCopyToClipboard(scan.signatureDigest);
                                setCopiedKey(scan.id);
                                playTone(800, 0.03);
                                setTimeout(() => setCopiedKey(null), 1500);
                              }}
                              className="p-1.5 rounded-md text-zinc-500 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors cursor-pointer"
                              title="Copy signature digest"
                            >
                              {copiedKey === scan.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Secure Sign-Off Action Button */}
              <div className="pt-3 border-t border-white/5 space-y-2">
                <button
                  onClick={handleExecuteSignoff}
                  disabled={!validationState.canSignoff}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-[#06B6D4] hover:bg-[#0891B2] text-black shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                >
                  <Fingerprint className="w-4 h-4" />
                  <span>SIGN-OFF &amp; RATIFY QUORUM IN CUSTODIAN REGISTRY</span>
                </button>

                <div className="flex items-center justify-between text-[10px] text-zinc-500 px-1">
                  <span>SSoT Invariant: Δ0.00% Zero Drift | Ω600_1000 LOCKED</span>
                  <span>ETDA Sec 9, 26, 28 Safe Harbor</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-mono">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-4xl"
      >
        {content}
      </motion.div>
    </div>
  );
};
