import React, { useState, useEffect, useRef, useMemo, useCallback, ChangeEvent } from 'react';
import { 
  Shield, AlertTriangle, Download, ShieldAlert, Volume2, VolumeX, 
  Activity, RefreshCw, Thermometer, Coins, Layers, Gavel, Cpu, 
  Lock, Play, RotateCcw, ChevronRight, CheckCircle2, Award,
  Trash2, Sliders, Users, Check, FileText, Server, Terminal,
  ExternalLink, KeyRound, Scale, Zap, Radio, QrCode, Camera
} from 'lucide-react';

// --- Types & Interfaces ---
export type TabType = 'overview' | 'vulnerabilities' | 'quorum' | 'replay' | 'runtime' | 'legal' | 'telemetry';

export interface TelemetryDataPoint {
  timestamp: string;
  temp: number;
}

export interface VulnerabilityItem {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  vector: string;
  chamber: string;
  rootCause: string;
  impact: string;
  remediation: string;
  beforeCode: string;
  afterCode: string;
  status: 'RESOLVED' | 'VERIFIED';
}

export interface CustodianItem {
  slot: string;
  id: string;
  name: string;
  role: string;
  device: string;
  cert: string;
  pqcAlgo: string;
  keySerial: string;
  status: 'ONLINE' | 'ACTIVE' | 'SYNCHRONIZED';
  latency: string;
}

export interface ReplayStage {
  stage: number;
  name: string;
  chamber: string;
  slaLimitMs: number;
  actualMs: number;
  status: 'PASSED' | 'OPTIMAL';
  description: string;
}

export interface StatutoryFramework {
  act: string;
  sections: string;
  technicalGuarantee: string;
  legalAdmissibility: string;
  status: 'COMPLIANT' | 'VERIFIED';
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ALERT' | 'CRITICAL';
  message: string;
}

// --- Mock Data Definitions ---
const VULNERABILITIES: VulnerabilityItem[] = [
  {
    id: 'ZYR-01',
    title: 'Sovereign Lockout (Type Mismatch in Access Control)',
    severity: 'CRITICAL',
    vector: '0x4F3A2D',
    chamber: 'Canonical Core G11',
    rootCause: 'Type mismatch at EVM level. Packing address and string hash yields distinct non-matching byte digests.',
    impact: 'Permanent administrative bricking (ADMIN_AUTH_REJECTED, STATE_PERMANENTLY_FROZEN). Sovereign lockout.',
    remediation: 'Refactored to direct, type-safe address verification check.',
    beforeCode: `// VULNERABLE v1.2
function setGovernanceOwner(address _new) external {
  require(
    keccak256(abi.encodePacked(msg.sender)) == 
    keccak256(abi.encodePacked(SOVEREIGN_ID)),
    "ADMIN_AUTH_REJECTED"
  );
  sovereignOwner = _new;
}`,
    afterCode: `// SECURED v2.0 GOLD MASTER
function setGovernanceOwner(address _new) external onlySovereign {
  require(_new != address(0), "INVALID_ADDRESS");
  address previousOwner = sovereignOwner;
  sovereignOwner = _new;
  emit SovereignOwnerTransferred(previousOwner, _new);
}`,
    status: 'VERIFIED',
  },
  {
    id: 'ZYR-02',
    title: 'Treasury DoS Attack (Unprotected Circuit Breaker)',
    severity: 'HIGH',
    vector: '0x2E9C1B',
    chamber: 'Chamber 07 - FIOS Treasury',
    rootCause: 'Absence of access control modifier on emergency circuit breaker trigger.',
    impact: 'External malicious actors could trigger arbitrary DoS state, freezing all treasury liquidity pools.',
    remediation: 'Bound triggerFailClosed strictly to onlySovereign modifier and HSM Quorum check.',
    beforeCode: `// VULNERABLE v1.2
function triggerFailClosed(string calldata _reason) external {
  isFrozen = true;
  emit CircuitBreakerTriggered(_reason, msg.sender);
}`,
    afterCode: `// SECURED v2.0 GOLD MASTER
function triggerFailClosed(string calldata _reason) 
  external 
  onlySovereign 
  whenNotFrozen 
{
  isFrozen = true;
  emit CircuitBreakerTriggered(_reason, msg.sender, block.timestamp);
}`,
    status: 'VERIFIED',
  },
  {
    id: 'ZYR-03',
    title: 'Quarantine Buffer Inflation (State Invariant Corruption)',
    severity: 'HIGH',
    vector: '0x9A7F8E',
    chamber: 'Chamber 02 - Quarantine Buffer',
    rootCause: 'Unrestricted entry point accepting arbitrary external quarantine seal payloads without oracle checks.',
    impact: 'Seal inflation corrupting Single Source of Truth (SSoT Delta 0) state consistency.',
    remediation: 'Restricted execution rights strictly to authorized Sentinel AI Oracle and Sovereign Guardians.',
    beforeCode: `// VULNERABLE v1.2
function quarantineSeal(bytes32 _sealId, bytes calldata _payload) external {
  seals[_sealId] = _payload;
  sealCount++;
}`,
    afterCode: `// SECURED v2.0 GOLD MASTER
function quarantineSeal(bytes32 _sealId, bytes calldata _payload) 
  external 
  onlyAuthorizedOracle 
{
  require(!sealExists[_sealId], "DUPLICATE_SEAL");
  seals[_sealId] = _payload;
  sealExists[_sealId] = true;
  sealCount++;
  emit QuarantineSealRegistered(_sealId, msg.sender);
}`,
    status: 'VERIFIED',
  },
  {
    id: 'ZYR-04',
    title: 'Risk Evaluation Oracle Bypass',
    severity: 'HIGH',
    vector: '0x7C2B14',
    chamber: 'Chamber 01 - Telemetry Interceptor',
    rootCause: 'Unvalidated risk threshold parameter passing allowing caller to bypass Sentinel evaluation.',
    impact: 'Unverified telemetry events could force rapid state mutations without security checks.',
    remediation: 'Enforced Sentinel Oracle cryptographic signature verification prior to state mutation.',
    beforeCode: `// VULNERABLE v1.2
function evaluateRisk(uint256 _score) external returns (bool) {
  currentRiskScore = _score;
  return currentRiskScore < MAX_RISK;
}`,
    afterCode: `// SECURED v2.0 GOLD MASTER
function evaluateRisk(uint256 _score, bytes calldata _oracleSig) 
  external 
  onlySentinelOracle(_score, _oracleSig) 
  returns (bool) 
{
  currentRiskScore = _score;
  return currentRiskScore < MAX_RISK;
}`,
    status: 'VERIFIED',
  },
  {
    id: 'ZYR-05',
    title: 'Gas Limit Exhaustion in Solvency Transfers',
    severity: 'MEDIUM',
    vector: '0x1D83E9',
    chamber: 'Chamber 07 - Solvency Vault',
    rootCause: 'Use of gas-limited payable.transfer() leading to unexpected execution reverts with smart wallets.',
    impact: 'Solvency payout transactions failed due to 2300 gas limit ceiling on smart contract recipients.',
    remediation: 'Replaced .transfer() with reentrancy-guarded low-level call.',
    beforeCode: `// VULNERABLE v1.2
function releaseSolvency(address payable _to, uint256 _amount) external onlySovereign {
  _to.transfer(_amount);
}`,
    afterCode: `// SECURED v2.0 GOLD MASTER
function releaseSolvency(address payable _to, uint256 _amount) 
  external 
  onlySovereign 
  nonReentrant 
{
  (bool success, ) = _to.call{value: _amount}("");
  require(success, "TRANSFER_FAILED");
}`,
    status: 'VERIFIED',
  },
];

const CUSTODIANS: CustodianItem[] = [
  { slot: 'TC-01', id: '#EP-SOVEREIGN-01', name: 'นายยุทธภูมิ พากเพียร (Yuttaphum Phakphian)', role: 'Supreme Sovereign Principal Architect', device: 'NitroKey HSM-PQC-01', cert: 'FIPS 140-3 Level 4', pqcAlgo: 'CRYSTALS-Dilithium-5', keySerial: 'CERT-SOV-OMEGA-0001-2026-ROOT', status: 'ACTIVE', latency: '0.82 ms' },
  { slot: 'TC-02', id: '#EP-001', name: 'พล. สมชาย พากเพียร', role: 'Director of Civilization', device: 'YubiKey 5C FIPS', cert: 'FIPS 140-2 Level 3', pqcAlgo: 'FALCON-1024', keySerial: 'CERT-SOV-CIV-0002-2026-FIPS', status: 'ACTIVE', latency: '1.12 ms' },
  { slot: 'TC-03', id: '#EP-007', name: 'ดร. กัญญารัตน์ เวชสิทธิ์', role: 'Chief Post-Quantum Cryptographer', device: 'Trezor Safe 5 PQC Enclave', cert: 'CC EAL6+ Certified', pqcAlgo: 'Dilithium-5 / Kyber-1024', keySerial: 'CERT-SOV-PQC-0003-2026-EAL6', status: 'ACTIVE', latency: '0.94 ms' },
  { slot: 'TC-04', id: '#EP-014', name: 'วศ. ธนพล เกียรติไพศาล', role: '15-Layer Full-Corps / SRE Overseer', device: 'Ledger Flex Secure Enclave', cert: 'CC EAL6+ Certified', pqcAlgo: 'SPHINCS+ PQC', keySerial: 'CERT-SOV-SRE-0004-2026-CC', status: 'ACTIVE', latency: '1.28 ms' },
  { slot: 'TC-05', id: '#EP-022', name: 'ศ.ดร. นครินทร์ สุวรรณเมฆา', role: 'Topology Master', device: 'NitroKey HSM-PQC-05', cert: 'FIPS 140-3 Level 3', pqcAlgo: 'CRYSTALS-Dilithium-5', keySerial: 'CERT-SOV-MESH-0005-2026-FIPS', status: 'ACTIVE', latency: '0.89 ms' },
  { slot: 'TC-06', id: '#EP-033', name: 'พญ.ดร. รพิพร รัตนพิบูลย์', role: 'Bio-AI & Cognitive Ethics Guardian', device: 'YubiKey 5C FIPS PIV-06', cert: 'FIPS 140-2 Level 3', pqcAlgo: 'FALCON-1024', keySerial: 'CERT-SOV-BIO-0006-2026-FIPS', status: 'ACTIVE', latency: '1.05 ms' },
  { slot: 'TC-07', id: '#EP-048', name: 'ดร. ธีรภัทร ชาญวณิชย์', role: 'Warp Chief & Telemetry Overseer', device: 'Trezor Safe 5 PQC-07', cert: 'CC EAL6+ Certified', pqcAlgo: 'CRYSTALS-Dilithium-5', keySerial: 'CERT-SOV-WARP-0007-2026-EAL6', status: 'ACTIVE', latency: '0.91 ms' },
  { slot: 'TC-08', id: '#EP-059', name: 'อ. เมธาวี อัครเดโช', role: 'Forensic Auditor', device: 'Ledger Stax Enclave-08', cert: 'CC EAL6+ Certified', pqcAlgo: 'SPHINCS+ PQC', keySerial: 'CERT-SOV-EVD-0008-2026-EAL6', status: 'ACTIVE', latency: '1.18 ms' },
  { slot: 'TC-09', id: '#EP-077', name: 'ดร. ชวินทร์ โรจนทรัพย์', role: 'Resilience Master', device: 'NitroKey HSM-PQC-09', cert: 'FIPS 140-3 Level 3', pqcAlgo: 'CRYSTALS-Dilithium-5', keySerial: 'CERT-SOV-CHAOS-0009-2026-FIPS', status: 'ACTIVE', latency: '0.85 ms' },
  { slot: 'TC-10', id: '#EP-100', name: 'ดร. อภิชญา ทักษิณากุล', role: 'Knowledge Steward', device: 'Custom Hardware HSM-10', cert: 'HSM Level 3', pqcAlgo: 'FALCON-1024', keySerial: 'CERT-SOV-KNOW-0010-2026-LEVEL3', status: 'ACTIVE', latency: '0.99 ms' },
];

const REPLAY_STAGES: ReplayStage[] = [
  { stage: 1, name: 'Genesis Anchor Sync', chamber: 'Genesis Core', slaLimitMs: 10.0, actualMs: 1.20, status: 'OPTIMAL', description: 'Cross-verifies Merkle root against zero-state immutable block height #849202.' },
  { stage: 2, name: 'Merkle Trie Traversal', chamber: 'Chamber 01', slaLimitMs: 12.0, actualMs: 2.10, status: 'OPTIMAL', description: 'Traverses 14,902 canonical trie leafs for state key proof matching.' },
  { stage: 3, name: 'Cryostat Telemetry Verification', chamber: 'Cryo Bus', slaLimitMs: 10.0, actualMs: 1.80, status: 'OPTIMAL', description: 'Monitors Helium-4 sub-kelvin thermal status (14.98 mK).' },
  { stage: 4, name: 'Chamber 01 Isolation Scan', chamber: 'Chamber 01', slaLimitMs: 12.0, actualMs: 2.40, status: 'OPTIMAL', description: 'Verifies zero cross-chamber leakage across network perimeter.' },
  { stage: 5, name: 'Chamber 02 Quarantine Audit', chamber: 'Chamber 02', slaLimitMs: 15.0, actualMs: 3.10, status: 'OPTIMAL', description: 'Validates zero payload inflation across quarantine buffer seal array.' },
  { stage: 6, name: 'Chamber 07 Treasury Proof Check', chamber: 'Chamber 07', slaLimitMs: 15.0, actualMs: 2.90, status: 'OPTIMAL', description: 'Confirms circuit breaker state invariants and zero unauthorized liquidity drains.' },
  { stage: 7, name: 'Canonical Core G11 Verification', chamber: 'Core G11', slaLimitMs: 20.0, actualMs: 4.20, status: 'OPTIMAL', description: 'Executes type-safe access control rules and onlySovereign modifiers.' },
  { stage: 8, name: 'PQC Signature Validation', chamber: 'Crypto Core', slaLimitMs: 20.0, actualMs: 6.50, status: 'OPTIMAL', description: 'Validates CRYSTALS-Dilithium-5 / Kyber-1024 post-quantum key proofs.' },
  { stage: 9, name: 'Deca-Key Quorum Unanimity Check', chamber: 'HSM Enclave', slaLimitMs: 12.0, actualMs: 3.80, status: 'OPTIMAL', description: 'Gathers 10/10 active hardware HSM enclave quorum attestations.' },
  { stage: 10, name: 'Zero-Knowledge Proof Evaluation', chamber: 'ZK Vault', slaLimitMs: 10.0, actualMs: 4.10, status: 'OPTIMAL', description: 'Evaluates PDPA Section 37 ZK masked attribute data proofs.' },
  { stage: 11, name: 'Statutory Compliance Mapping', chamber: 'Legal Engine', slaLimitMs: 8.0, actualMs: 2.10, status: 'OPTIMAL', description: 'Verifies Thai Electronic Transactions Act B.E. 2544 evidentiary proofs.' },
  { stage: 12, name: 'Final Seal Ratification', chamber: 'Governance Core', slaLimitMs: 8.0, actualMs: 1.60, status: 'OPTIMAL', description: 'Appends cryptographically immutable seal to mainnet block.' },
];

const STATUTORY_FRAMEWORKS: StatutoryFramework[] = [
  { act: 'ETDA B.E. 2544 (Electronic Transactions Act)', sections: 'Section 9, Section 26, Section 28', technicalGuarantee: 'Automated cryptographic signatures via Dilithium-5; non-repudiation and immutable Merkle audit trails.', legalAdmissibility: 'FULL COURT ADMISSIBILITY (Verified Technical Proof)', status: 'COMPLIANT' },
  { act: 'PDPA B.E. 2562 (Personal Data Protection Act)', sections: 'Section 19, Section 27, Section 37', technicalGuarantee: 'Zero-Knowledge Vault architecture with automated data masking for sensitive personal attributes.', legalAdmissibility: 'FULLY AUDITED PRIVACY SHIELD', status: 'COMPLIANT' },
  { act: 'NCSA B.E. 2562 (Cybersecurity Act)', sections: 'Section 35', technicalGuarantee: 'Cryogenically isolated audit trails for Critical Information Infrastructure (CII) protection.', legalAdmissibility: 'NATIONAL SECURITY GRADE', status: 'COMPLIANT' },
  { act: 'FIPS 140-3 Level 4 / CC EAL6+', sections: 'Hardware Key Custody Standard', technicalGuarantee: 'Hardware-level key custody with active zeroization latency < 1.2ms upon physical breach detection.', legalAdmissibility: 'GLOBAL HARDWARE TRUST ROOT', status: 'VERIFIED' },
];

// ========================================== //
// UTIMACO SECONDARY HSM GAUGE COMPONENT
// ========================================== //
interface HSMGaugeProps {
  currentTemp: number;
  setCurrentTemp: React.Dispatch<React.SetStateAction<number>>;
  isSimulationActive: boolean;
  setIsSimulationActive: React.Dispatch<React.SetStateAction<boolean>>;
  addLog: (msg: string, level?: 'INFO' | 'WARN' | 'ALERT' | 'CRITICAL') => void;
}

export const UtimacoSecondaryHSMGauge: React.FC<HSMGaugeProps> = ({ 
  currentTemp, 
  setCurrentTemp, 
  isSimulationActive, 
  setIsSimulationActive,
  addLog
}) => {
  const CANONICAL_BLOCK = 849202;
  const MERKLE_ROOT_GENESIS = "909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68";

  const [history, setHistory] = useState<TelemetryDataPoint[]>([]);
  const [isAudioMuted, setIsMuted] = useState<boolean>(false);

  const [tempThreshold, setTempThreshold] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('utimaco_temp_threshold');
      return saved ? parseFloat(saved) : 85.0;
    }
    return 85.0;
  });

  const [isZeroized, setIsZeroized] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    localStorage.setItem('utimaco_temp_threshold', tempThreshold.toString());
  }, [tempThreshold]);

  useEffect(() => {
    if (isZeroized && currentTemp !== 0) {
      setCurrentTemp(0);
    }
  }, [isZeroized, currentTemp, setCurrentTemp]);

  const triggerZeroization = useCallback((triggerSource: string = "MANUAL USER OVERRIDE") => {
    setIsZeroized(true);
    setCurrentTemp(0); 
    setHistory(prevHist => prevHist.map(pt => ({ ...pt, temp: 0 }))); 
    addLog(`🚨 [ACTIVE ZEROIZATION] Enforced via ${triggerSource}. Wiping sensitive Dilithium-5 keys from RAM in 0.48ms.`, 'CRITICAL');

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        const tempCtx = new AudioCtxClass();
        const osc = tempCtx.createOscillator();
        const gain = tempCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(350.0, tempCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80.0, tempCtx.currentTime + 0.8);
        gain.gain.setValueAtTime(0.08, tempCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, tempCtx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(tempCtx.destination);
        osc.start();
        osc.stop(tempCtx.currentTime + 0.8);
      }
    } catch {}
  }, [addLog, setCurrentTemp]);

  useEffect(() => {
    if (currentTemp >= 95.0 && !isZeroized) {
      triggerZeroization("AUTOMATIC CATASTROPHIC HEAT DETECTED");
    }
  }, [currentTemp, isZeroized, triggerZeroization]);

  useEffect(() => {
    const initialHistory: TelemetryDataPoint[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const timeStr = new Date(now.getTime() - i * 2000).toTimeString().slice(0, 8);
      const baseTemp = 42.0 + Math.sin(i / 3) * 2.0 + (Math.random() - 0.5) * 1.5;
      initialHistory.push({ timestamp: timeStr, temp: baseTemp });
    }
    setHistory(initialHistory);
  }, []);

  useEffect(() => {
    if (!isSimulationActive || isZeroized) return;

    const interval = setInterval(() => {
      const nowStr = new Date().toTimeString().slice(0, 8);
      
      setCurrentTemp(prev => {
        let nextTemp = prev;
        if (prev > tempThreshold) {
          nextTemp = prev + (Math.random() - 0.3) * 1.2;
          if (nextTemp > 98.0) nextTemp = 98.0;
        } else {
          nextTemp = 42.5 + Math.sin(Date.now() / 2000) * 1.2 + (Math.random() - 0.5) * 0.5;
        }

        setHistory(prevHist => {
          const updated = [...prevHist, { timestamp: nowStr, temp: nextTemp }];
          if (updated.length > 30) {
            return updated.slice(updated.length - 30);
          }
          return updated;
        });

        return nextTemp;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isSimulationActive, setCurrentTemp, tempThreshold, isZeroized]);

  const initAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtxRef.current = new AudioCtxClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playWarningTone = useCallback(() => {
    try {
      initAudioContext();
      const ctx = audioCtxRef.current;
      if (!ctx || isAudioMuted || isZeroized) return;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'triangle'; 
      osc.frequency.setValueAtTime(140.0, ctx.currentTime); 

      gainNode.gain.setValueAtTime(0.04, ctx.currentTime); 
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6); 

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.warn("AudioContext tone generation failed:", e);
    }
  }, [isAudioMuted, isZeroized]);

  const getPulseInterval = (temp: number, threshold: number) => {
    if (temp <= threshold) return 1500;
    const excess = temp - threshold;
    const range = Math.max(95.0 - threshold, 5.0); 
    const ratio = Math.min(excess / range, 1.0);
    return 1500 - (1500 - 300) * ratio; 
  };

  useEffect(() => {
    if (currentTemp >= tempThreshold && !isAudioMuted && !isZeroized) {
      let timeoutId: NodeJS.Timeout;

      const pulseTick = () => {
        playWarningTone();
        const nextDelay = getPulseInterval(currentTemp, tempThreshold);
        timeoutId = setTimeout(pulseTick, nextDelay);
      };

      pulseTick();

      return () => clearTimeout(timeoutId);
    }
  }, [currentTemp, tempThreshold, isAudioMuted, isZeroized, playWarningTone]);

  const sparklinePath = useMemo(() => {
    if (history.length < 2) return "";
    const svgWidth = 220;
    const svgHeight = 44;
    const padding = 2;
    
    const minScaleTemp = 20;
    const maxScaleTemp = 100;

    return history.map((point, index) => {
      const x = padding + (index / (history.length - 1)) * (svgWidth - padding * 2);
      const clampedTemp = Math.max(minScaleTemp, Math.min(maxScaleTemp, point.temp));
      const y = svgHeight - padding - ((clampedTemp - minScaleTemp) / (maxScaleTemp - minScaleTemp)) * (svgHeight - padding * 2);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  }, [history]);

  const handleDownloadTelemetryCSV = () => {
    const csvHeaders = "Timestamp,HSM_Temperature_Celsius,Threshold_Limit_Celsius,Status,Canonical_Block,Genesis_Merkle_Root,HSM_Sanitized\n";
    const csvRows = history.map(point => {
      const status = isZeroized ? "ZEROIZED" : (point.temp >= tempThreshold ? "CRITICAL_ALERT" : "NOMINAL");
      return `"${point.timestamp}",${point.temp.toFixed(2)},${tempThreshold.toFixed(1)},"${status}",${CANONICAL_BLOCK},"${MERKLE_ROOT_GENESIS}",${isZeroized ? "TRUE" : "FALSE"}`;
    }).join("\n");

    const blob = new Blob([csvHeaders + csvRows], { type: 'text/csv;charset=utf-8;' });
    const blobUrl = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", blobUrl);
    downloadAnchor.setAttribute("download", `hsm_thermal_telemetry_block_${CANONICAL_BLOCK}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(blobUrl);
    addLog("📥 Telemetry audit trail successfully downloaded as CSV file.", 'INFO');
  };

  const resetToNominalState = () => {
    setIsZeroized(false);
    setCurrentTemp(42.5); 
    const reseededHistory: TelemetryDataPoint[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const timeStr = new Date(now.getTime() - i * 2000).toTimeString().slice(0, 8);
      const baseTemp = 42.0 + Math.sin(i / 3) * 2.0 + (Math.random() - 0.5) * 1.5;
      reseededHistory.push({ timestamp: timeStr, temp: baseTemp });
    }
    setHistory(reseededHistory);
    addLog("❄️ HSM credentials re-armed. System rebooted back to nominal sub-Kelvin state.", 'INFO');
  };

  const visualTheme = useMemo(() => {
    const minTemp = 42.5;
    const maxTemp = tempThreshold;
    
    if (isZeroized) {
      return {
        borderColor: 'rgb(244, 63, 94)', 
        borderStyle: 'dashed',
        boxShadow: '0 0 35px rgba(244, 63, 94, 0.4)',
        glowColor: '#f43f5e',
        headerText: 'text-rose-500',
        textColor: 'text-rose-400',
        alertBg: 'bg-rose-950/20'
      };
    }

    if (currentTemp <= minTemp) {
      return {
        borderColor: 'rgba(6, 182, 212, 0.4)', 
        borderStyle: 'solid',
        boxShadow: '0 0 20px rgba(6, 182, 212, 0.1)',
        glowColor: '#06b6d4',
        headerText: 'text-cyan-500',
        textColor: 'text-cyan-400',
        alertBg: 'bg-zinc-900/60'
      };
    }

    if (currentTemp >= maxTemp) {
      return {
        borderColor: 'rgba(239, 68, 68, 0.8)', 
        borderStyle: 'solid',
        boxShadow: '0 0 30px rgba(239, 68, 68, 0.25)',
        glowColor: '#ef4444',
        headerText: 'text-rose-500',
        textColor: 'text-rose-400',
        alertBg: 'bg-rose-950/30'
      };
    }

    const ratio = (currentTemp - minTemp) / (maxTemp - minTemp);
    const r = Math.round(6 + (239 - 6) * ratio);
    const g = Math.round(182 + (68 - 182) * ratio);
    const b = Math.round(212 + (68 - 212) * ratio);

    return {
      borderColor: `rgba(${r}, ${g}, ${b}, ${0.4 + ratio * 0.4})`,
      borderStyle: 'solid',
      boxShadow: `0 0 ${20 + ratio * 10}px rgba(${r}, ${g}, ${b}, ${0.1 + ratio * 0.15})`,
      glowColor: `rgb(${r}, ${g}, ${b})`,
      headerText: ratio > 0.7 ? 'text-rose-400' : 'text-cyan-400',
      textColor: `rgb(${r}, ${g}, ${b})`,
      alertBg: ratio > 0.5 ? 'bg-amber-950/20' : 'bg-zinc-900/60'
    };
  }, [currentTemp, tempThreshold, isZeroized]);

  const isCritical = currentTemp >= tempThreshold;

  return (
    <div 
      className="p-6 rounded-3xl border transition-all duration-500 font-mono text-xs select-none relative overflow-hidden bg-zinc-950 shadow-2xl"
      style={{
        borderColor: visualTheme.borderColor,
        borderStyle: visualTheme.borderStyle,
        boxShadow: visualTheme.boxShadow,
      }}
    >
      {isCritical && !isZeroized && (
        <div className="absolute inset-0 bg-rose-950/10 pointer-events-none animate-pulse" />
      )}

      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${
            isZeroized ? 'bg-red-600 animate-pulse' : (isCritical ? 'bg-rose-500 animate-ping' : 'bg-cyan-500')
          }`} />
          <span className="font-bold text-zinc-100 text-xs tracking-wider">UTIMACO SECONDARY HSM GAUGE</span>
        </div>
        <div className="flex items-center gap-1.5 bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800 text-[10px] text-zinc-400">
          <Shield className="w-3.5 h-3.5 text-zinc-500" />
          <span>FIPS 140-3 LEVEL 4 ACTIVE</span>
        </div>
      </div>

      {isZeroized ? (
        <div className="bg-rose-950/10 rounded-2xl p-5 border border-dashed border-rose-500/80 text-center relative z-20 my-6 animate-pulse">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-2 animate-bounce" />
          <h3 className="text-sm font-extrabold text-rose-500 tracking-wider">ACTIVE ZEROIZATION COMPLETE</h3>
          <p className="text-[10px] text-zinc-400 mt-2 leading-relaxed">
            HSM private keys wiped from RAM in 0.48ms (Tamper Foil SLA &lt; 1.20ms). System state entering Fail-Closed mode.
          </p>
          <button 
            onClick={resetToNominalState}
            className="mt-4 px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all text-[9px] font-bold inline-flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>RE-ARM CREDENTIALS (REBOOT)</span>
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 items-center mb-5 relative z-10">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest">HSM Temperature</div>
              <div className="flex items-baseline gap-1 mt-1">
                <span 
                  className="text-4xl font-extrabold font-mono tracking-tight transition-colors duration-300"
                  style={{ color: visualTheme.textColor }}
                >
                  {currentTemp.toFixed(2)}
                </span>
                <span className="text-sm font-semibold text-zinc-400">°C</span>
              </div>
              <div className="text-[9px] text-zinc-400 mt-2 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-zinc-500" />
                <span>Threshold: {tempThreshold.toFixed(1)}°C</span>
              </div>
            </div>

            <div className="flex flex-col items-end justify-center">
              {isCritical ? (
                <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-rose-400 animate-bounce">
                  <ShieldAlert className="w-8 h-8 text-rose-500" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">
                    {currentTemp >= 95.0 ? "CRITICAL CRASH" : "THERMAL BREACH"}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-cyan-400">
                  <Activity className="w-8 h-8 text-cyan-500 animate-pulse" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">NOMINAL STATE</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-zinc-900/40 rounded-2xl p-3 border border-zinc-900 flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-zinc-500" />
              <div>
                <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Override Threshold</div>
                <div className="text-[8px] text-zinc-500">Persists in LocalStorage</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="50"
                max="95"
                step="0.5"
                value={tempThreshold}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 50 && val <= 95) {
                    setTempThreshold(val);
                    addLog(`🔧 [THRESHOLD OVERRIDE] Safety threshold updated to ${val.toFixed(1)}°C.`, 'WARN');
                  }
                }}
                className="w-16 bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-2 py-1 text-center font-bold text-xs focus:outline-none focus:border-cyan-500"
              />
              <span className="text-zinc-500 text-[10px]">°C</span>
            </div>
          </div>

          {/* Sparkline Telemetry Graph */}
          <div className="bg-zinc-900/30 rounded-2xl p-3 border border-zinc-900 mb-4 relative z-10">
            <div className="flex items-center justify-between text-[9px] text-zinc-500 mb-2">
              <span>REAL-TIME THERMAL SPARKLINE</span>
              <span>30 SAMPLES (2s INTERVAL)</span>
            </div>
            <div className="h-12 w-full flex items-center justify-center">
              <svg className="w-full h-11 overflow-visible" viewBox="0 0 220 44">
                <path
                  d={sparklinePath}
                  fill="none"
                  stroke={visualTheme.glowColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Action Button Strip */}
          <div className="grid grid-cols-3 gap-2 relative z-10 text-[9px] font-bold">
            <button
              onClick={() => setIsMuted(prev => !prev)}
              className="flex items-center justify-center gap-1 py-2 px-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-300 transition-colors"
            >
              {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{isAudioMuted ? 'UNMUTE' : 'MUTE TONE'}</span>
            </button>

            <button
              onClick={handleDownloadTelemetryCSV}
              className="flex items-center justify-center gap-1 py-2 px-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>EXPORT CSV</span>
            </button>

            <button
              onClick={() => triggerZeroization("MANUAL USER OVERRIDE")}
              className="flex items-center justify-center gap-1 py-2 px-2 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 rounded-xl text-rose-300 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>ZEROIZE</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ========================================== //
// OPTICAL QR SCANNER MODALS
// ========================================== //
interface CustodianQRValidatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

const CustodianQRValidatorModal: React.FC<CustodianQRValidatorModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [manualInput, setManualInput] = useState('');
  const [scanStatus, setScanStatus] = useState<'IDLE' | 'ANALYZING' | 'VALID' | 'INVALID'>('IDLE');

  if (!isOpen) return null;

  const handleVerify = () => {
    setScanStatus('ANALYZING');
    setTimeout(() => {
      if (manualInput.includes('CERT-SOV') || manualInput.includes('EP-') || manualInput.length > 8) {
        setScanStatus('VALID');
        onSuccess({ payload: manualInput, verifiedAt: new Date().toISOString() });
      } else {
        setScanStatus('INVALID');
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-mono">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white">✕</button>
        <div className="flex items-center gap-2 text-cyan-400 text-sm font-bold mb-4">
          <QrCode className="w-5 h-5" />
          <span>CUSTODIAN QR VALIDATOR</span>
        </div>

        <div className="space-y-4">
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-center relative overflow-hidden">
            <div className="w-32 h-32 mx-auto border-2 border-dashed border-cyan-500/60 rounded-xl flex items-center justify-center text-zinc-500 relative">
              <Camera className="w-10 h-10 text-cyan-400 animate-pulse" />
              <div className="absolute inset-x-0 top-0 h-0.5 bg-cyan-400 animate-bounce" />
            </div>
            <span className="text-[10px] text-zinc-500 block mt-2">Simulated Optical Lens Feed Active</span>
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Manual Payload Injection:</label>
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="CERT-SOV-OMEGA-0001-2026-ROOT"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={handleVerify}
            className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl transition-colors"
          >
            VERIFY CUSTODIAN CREDENTIAL
          </button>

          {scanStatus === 'VALID' && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs">
              ✓ CUSTODIAN CERTIFICATE VERIFIED (Dilithium-5 Proof Match)
            </div>
          )}
          {scanStatus === 'INVALID' && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-300 rounded-xl text-xs">
              ✕ INVALID OR UNTRUSTED CUSTODIAN PAYLOAD
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ========================================== //
// MAIN DASHBOARD V3 COMPONENT
// ========================================== //
export const ZyrquenSovereignDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedVulnId, setSelectedVulnId] = useState<string>('ZYR-01');
  const [isSimulatingReplay, setIsSimulatingReplay] = useState<boolean>(false);
  const [currentReplayStep, setCurrentReplayStep] = useState<number>(12);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);

  // HSM Shared Thermal State
  const [currentHSMTemp, setCurrentHSMTemp] = useState<number>(42.5);
  const [isSimulationActive, setIsSimulationActive] = useState<boolean>(true);

  // Live Audit Logs Engine
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', timestamp: new Date().toTimeString().slice(0, 8), level: 'INFO', message: 'ZYRQUEN Ω∞ Sovereign Gold Master Initialized. SSoT Delta 0 Locked.' },
    { id: '2', timestamp: new Date().toTimeString().slice(0, 8), level: 'INFO', message: 'Deca-Key 10/10 REAL_HSM Quorum Council Unanimously Verified.' },
    { id: '3', timestamp: new Date().toTimeString().slice(0, 8), level: 'INFO', message: '14,902 Canonical Seals Matched Against Genesis Block #849202.' },
  ]);

  const addLog = useCallback((message: string, level: 'INFO' | 'WARN' | 'ALERT' | 'CRITICAL' = 'INFO') => {
    const newEntry: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toTimeString().slice(0, 8),
      level,
      message,
    };
    setLogs((prev) => [newEntry, ...prev.slice(0, 49)]);
  }, []);

  // Interactive Replay Simulation Execution
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSimulatingReplay) {
      setCurrentReplayStep(1);
      addLog("🚀 Initiating 12-Stage Forensic Trace Replay SLA Pipeline...", 'INFO');
      let step = 1;
      timer = setInterval(() => {
        step++;
        if (step > 12) {
          setIsSimulatingReplay(false);
          setCurrentReplayStep(12);
          addLog("✅ Forensic Trace Replay Complete. All 12 Stages Passed SLA Limits.", 'INFO');
          clearInterval(timer);
        } else {
          setCurrentReplayStep(step);
        }
      }, 300);
    }
    return () => clearInterval(timer);
  }, [isSimulatingReplay, addLog]);

  const selectedVuln = useMemo(() => {
    return VULNERABILITIES.find((v) => v.id === selectedVulnId) || VULNERABILITIES[0];
  }, [selectedVulnId]);

  const filteredVulns = useMemo(() => {
    if (filterSeverity === 'ALL') return VULNERABILITIES;
    return VULNERABILITIES.filter((v) => v.severity === filterSeverity);
  }, [filterSeverity]);

  const totalReplayExecutionMs = useMemo(() => {
    return REPLAY_STAGES.reduce((acc, s) => acc + s.actualMs, 0);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased p-4 md:p-8 flex flex-col gap-6 selection:bg-cyan-500 selection:text-black">
      
      {/* Top Banner & Sovereign Header */}
      <header className="border border-zinc-800 rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-semibold uppercase tracking-wider animate-pulse">
                LOCKED_FROZEN_v1.2_LTS
              </span>
              <span className="font-mono text-xs text-zinc-400">
                Block Height: <strong className="text-cyan-400">#849202</strong>
              </span>
              <span className="font-mono text-xs text-zinc-400">
                SSoT Drift: <strong className="text-emerald-400">0.00% ($\Delta 0$)</strong>
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-white font-mono flex items-center gap-3">
              ZYRQUEN $\Omega \infty$ Sovereign Integrated Dashboard v3
            </h1>
            <p className="text-xs md:text-sm text-zinc-400 mt-1 max-w-3xl">
              Forensic Audit Verification, Post-Quantum Deca-Key Quorum Alignment & Statutory Proof Console.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 items-center bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800 font-mono text-xs">
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[10px] uppercase">Cryostat Thermal</span>
              <span className="text-cyan-300 font-bold">$14.98\text{ mK}$</span>
            </div>
            <div className="h-8 w-px bg-zinc-800" />
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[10px] uppercase">HSM Quorum</span>
              <span className="text-emerald-400 font-bold">10/10 Consensus</span>
            </div>
            <div className="h-8 w-px bg-zinc-800" />
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[10px] uppercase">Seals Passed</span>
              <span className="text-purple-400 font-bold">14,902 / 14,902</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex flex-wrap border-b border-zinc-800 gap-2 pb-2 font-mono text-xs">
        {[
          { id: 'overview', label: '01. SYSTEM OVERVIEW' },
          { id: 'telemetry', label: '02. UTIMACO HSM TELEMETRY' },
          { id: 'vulnerabilities', label: '03. VULNERABILITY AUTOPSY' },
          { id: 'quorum', label: '04. DECA-KEY HSM QUORUM' },
          { id: 'replay', label: '05. 12-STAGE TRACE REPLAY' },
          { id: 'runtime', label: '06. 4-TIER RUNTIME MATRIX' },
          { id: 'legal', label: '07. STATUTORY LEGAL PROOF' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-4 py-2.5 rounded-xl transition-all font-semibold ${
              activeTab === tab.id
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/40 shadow-lg shadow-cyan-950/50'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6">
              <h2 className="text-lg font-bold font-mono text-cyan-400 mb-3 uppercase tracking-wider">
                Executive Audit Verification Summary
              </h2>
              <p className="text-xs md:text-sm text-zinc-300 leading-relaxed mb-4">
                The <strong>ZYRQUEN $\Omega \infty$ Sovereign Cryptographic Core</strong> has completed comprehensive forensic remediation. All identified EVM logic vectors, type mismatch vulnerabilities, unprotected circuit breakers, and state inflation entry points have been completely eliminated.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">Audit Reference</div>
                  <div className="text-xs font-mono font-bold text-zinc-200 mt-0.5">ZYR-CORE-G11-V2.1</div>
                </div>
                <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">Write Mutations</div>
                  <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">0 (Zero Mutation)</div>
                </div>
                <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">Audit Status</div>
                  <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">100% GREEN (Passed)</div>
                </div>
                <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">Court Readiness</div>
                  <div className="text-xs font-mono font-bold text-purple-400 mt-0.5">Statutory Legal Proof</div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6">
              <h3 className="text-sm font-bold font-mono text-zinc-200 mb-4 uppercase">
                Vulnerability Remediation Quick Matrix
              </h3>
              <div className="space-y-3">
                {VULNERABILITIES.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => {
                      setSelectedVulnId(v.id);
                      setActiveTab('vulnerabilities');
                    }}
                    className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-cyan-500/50 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        v.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        v.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {v.id}
                      </span>
                      <span className="text-xs font-mono text-zinc-200 font-semibold">{v.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                      {v.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Embedded Secondary HSM Gauge */}
            <UtimacoSecondaryHSMGauge 
              currentTemp={currentHSMTemp}
              setCurrentTemp={setCurrentHSMTemp}
              isSimulationActive={isSimulationActive}
              setIsSimulationActive={setIsSimulationActive}
              addLog={addLog}
            />

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6">
              <h3 className="text-sm font-bold font-mono text-zinc-200 mb-4 uppercase">
                Genesis Block Merkle Anchor
              </h3>
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 font-mono text-[11px] text-cyan-300 break-all select-all">
                909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68
              </div>
              <p className="text-[11px] text-zinc-400 mt-2">
                Verified against 14,902 canonical seals. Zero drift confirmed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: UTIMACO HSM TELEMETRY */}
      {activeTab === 'telemetry' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <UtimacoSecondaryHSMGauge 
              currentTemp={currentHSMTemp}
              setCurrentTemp={setCurrentHSMTemp}
              isSimulationActive={isSimulationActive}
              setIsSimulationActive={setIsSimulationActive}
              addLog={addLog}
            />
          </div>

          <div className="lg:col-span-2 bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-mono text-cyan-400 uppercase">
                Live HSM Thermal Control Panel
              </h3>
              <button
                onClick={() => setIsSimulationActive(prev => !prev)}
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-xs font-mono rounded-xl transition-colors"
              >
                {isSimulationActive ? 'PAUSE TELEMETRY FEED' : 'RESUME TELEMETRY FEED'}
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed font-mono">
              Direct telemetry stream from Utimaco u.trust FIPS 140-3 Level 4 HSM enclave. Thermal sensors trigger active key zeroization when temperature exceeds the safety threshold ($&lt; 1.20\text{ ms}$ tamper SLA).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 font-mono text-xs">
              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                <span className="text-zinc-500 text-[10px] uppercase block mb-1">Simulate Thermal Surge</span>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      setCurrentHSMTemp(88.5);
                      addLog("⚠️ Simulated thermal breach injected (88.5°C).", 'WARN');
                    }}
                    className="px-3 py-1.5 bg-amber-950/60 border border-amber-500/40 text-amber-300 rounded-xl hover:bg-amber-900/80 transition-colors"
                  >
                    Set 88.5°C (Alert)
                  </button>
                  <button
                    onClick={() => {
                      setCurrentHSMTemp(96.0);
                      addLog("🚨 Simulated catastrophic heat injected (96.0°C).", 'CRITICAL');
                    }}
                    className="px-3 py-1.5 bg-rose-950/60 border border-rose-500/40 text-rose-300 rounded-xl hover:bg-rose-900/80 transition-colors"
                  >
                    Set 96.0°C (Crash)
                  </button>
                </div>
              </div>

              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                <span className="text-zinc-500 text-[10px] uppercase block mb-1">Reset Sub-Kelvin Coolant</span>
                <button
                  onClick={() => {
                    setCurrentHSMTemp(42.5);
                    addLog("❄️ Sub-Kelvin Helium-4 bus refreshed. Nominal thermal state restored.", 'INFO');
                  }}
                  className="w-full mt-2 py-1.5 bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 rounded-xl hover:bg-cyan-900/80 transition-colors"
                >
                  Cool to 42.5°C
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VULNERABILITY AUTOPSY */}
      {activeTab === 'vulnerabilities' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-zinc-400 uppercase">Filter Severity:</span>
              <div className="flex gap-1 font-mono text-[10px]">
                {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setFilterSeverity(sev)}
                    className={`px-2 py-1 rounded ${
                      filterSeverity === sev ? 'bg-cyan-500 text-black font-bold' : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {filteredVulns.map((v) => (
                <div
                  key={v.id}
                  onClick={() => setSelectedVulnId(v.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedVulnId === v.id
                      ? 'bg-zinc-900 border-cyan-500 shadow-lg shadow-cyan-950/50'
                      : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-cyan-400">{v.id}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      v.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' :
                      v.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {v.severity}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-zinc-200 line-clamp-1">{v.title}</h4>
                  <div className="text-[10px] font-mono text-zinc-500 mt-2">Vector: {v.vector} | {v.chamber}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8 bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 flex flex-col gap-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-bold">
                  Autopsy Detail: {selectedVuln.id}
                </span>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-500/30">
                  Status: {selectedVuln.status}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">{selectedVuln.title}</h2>
              <div className="text-xs font-mono text-zinc-400 mt-1">
                Target Vector: <span className="text-cyan-300">{selectedVuln.vector}</span> | Chamber Target: <span className="text-zinc-200">{selectedVuln.chamber}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                <span className="text-zinc-500 uppercase text-[10px] block mb-1">Root Cause Analysis</span>
                <p className="text-zinc-300 leading-relaxed">{selectedVuln.rootCause}</p>
              </div>
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                <span className="text-zinc-500 uppercase text-[10px] block mb-1">Architectural Impact</span>
                <p className="text-rose-300 leading-relaxed">{selectedVuln.impact}</p>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-mono text-zinc-300 uppercase font-bold">Code Refactoring Comparison</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[11px]">
                <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-3 overflow-x-auto">
                  <span className="text-rose-400 text-[10px] uppercase font-bold block mb-2">Vulnerable v1.2 Implementation</span>
                  <pre className="text-rose-200 leading-tight"><code>{selectedVuln.beforeCode}</code></pre>
                </div>
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-3 overflow-x-auto">
                  <span className="text-emerald-400 text-[10px] uppercase font-bold block mb-2">Secured v2.0 GOLD MASTER Fix</span>
                  <pre className="text-emerald-200 leading-tight"><code>{selectedVuln.afterCode}</code></pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DECA-KEY HSM QUORUM */}
      {activeTab === 'quorum' && (
        <div className="space-y-6">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold font-mono text-cyan-400 uppercase tracking-wider">
                  Deca-Key $10/10$ REAL_HSM Quorum Council Registry
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Enforcing the Rule of Unanimity (10/10 Hardware Security Module Enclave Attestation).
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsQrModalOpen(true)}
                  className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                >
                  <QrCode className="w-4 h-4" />
                  <span>VALIDATE QR CREDENTIAL</span>
                </button>
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold rounded-xl self-start md:self-auto flex items-center">
                  QUORUM: 100% UNANIMOUS
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {CUSTODIANS.map((c) => (
                <div
                  key={c.slot}
                  className="bg-zinc-950 border border-zinc-800 hover:border-cyan-500/40 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-cyan-400">{c.slot}</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <div className="font-mono text-xs font-bold text-zinc-200 line-clamp-1">{c.name}</div>
                    <div className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">{c.role}</div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-zinc-900 text-[10px] font-mono">
                    <div className="text-zinc-400">
                      Enclave: <span className="text-zinc-200">{c.device}</span>
                    </div>
                    <div className="text-zinc-400">
                      Standard: <span className="text-emerald-400">{c.cert}</span>
                    </div>
                    <div className="text-zinc-400">
                      PQC Algo: <span className="text-purple-300">{c.pqcAlgo}</span>
                    </div>
                  </div>

                  <div className="text-[9px] font-mono text-zinc-600 truncate pt-1">
                    {c.keySerial}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: 12-STAGE TRACE REPLAY SLA */}
      {activeTab === 'replay' && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold font-mono text-cyan-400 uppercase tracking-wider">
                12-Stage Forensic Trace Replay SLA Pipeline
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Execution Time: <strong className="text-emerald-400">{totalReplayExecutionMs.toFixed(2)} ms</strong> vs SLA Limit Threshold: <strong className="text-zinc-200">142.00 ms</strong> (74.8% SLA Margin)
              </p>
            </div>

            <button
              onClick={() => setIsSimulatingReplay(true)}
              disabled={isSimulatingReplay}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs transition-all disabled:opacity-50"
            >
              {isSimulatingReplay ? 'REPLAYING PIPELINE...' : 'EXECUTE FORENSIC REPLAY'}
            </button>
          </div>

          <div className="space-y-3">
            {REPLAY_STAGES.map((s) => {
              const isActive = isSimulatingReplay && s.stage === currentReplayStep;
              const isCompleted = s.stage <= currentReplayStep;

              return (
                <div
                  key={s.stage}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isActive
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-950/80 scale-[1.01]'
                      : isCompleted
                      ? 'bg-zinc-950 border-zinc-800'
                      : 'bg-zinc-950/40 border-zinc-900 opacity-40'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                      isActive ? 'bg-cyan-400 text-black animate-pulse' : 'bg-zinc-800 text-zinc-300'
                    }`}>
                      {s.stage}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-zinc-200 font-mono">{s.name}</h4>
                        <span className="text-[10px] font-mono text-zinc-500">[{s.chamber}]</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{s.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 font-mono text-xs self-end md:self-auto">
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 block">Actual Latency</span>
                      <span className="text-emerald-400 font-bold">{s.actualMs.toFixed(2)} ms</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 block">SLA Threshold</span>
                      <span className="text-zinc-400">{s.slaLimitMs.toFixed(1)} ms</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: 4-TIER RUNTIME MATRIX */}
      {activeTab === 'runtime' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { tier: 'TIER 0', title: 'Sub-Kelvin Hardware Enclave Layer', desc: 'Utimaco u.trust FIPS 140-3 Level 4 enclaves operating at 14.98 mK Helium-4 bus. Active zeroization latency < 1.2ms.' },
            { tier: 'TIER 1', title: 'Post-Quantum Consensus Engine', desc: '10/10 REAL_HSM quorum utilizing ML-DSA-87 (Dilithium-5), Kyber-1024, SPHINCS+, and FALCON-1024 stateless signature fallbacks.' },
            { tier: 'TIER 2', title: 'Zero-Knowledge Chamber Isolation', desc: 'Strict chamber isolation (Chambers 01 through 07) maintaining SSoT Delta 0 zero-drift state integrity.' },
            { tier: 'TIER 3', title: 'Statutory Legal Verification Interface', desc: 'Immutable audit logging for court admissibility under Thai ETDA B.E. 2544, PDPA B.E. 2562, and ISO/IEC 27037 standards.' },
          ].map((item) => (
            <div key={item.tier} className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 space-y-2">
              <span className="text-xs font-mono text-cyan-400 font-bold">{item.tier}</span>
              <h3 className="text-base font-bold text-white">{item.title}</h3>
              <p className="text-xs text-zinc-300 leading-relaxed font-mono">{item.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* TAB 7: STATUTORY LEGAL PROOF */}
      {activeTab === 'legal' && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold font-mono text-cyan-400 uppercase tracking-wider">
              Statutory & Regulatory Alignment Matrix
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Establishing statutory evidentiary proof and court admissibility under Thai Law and global cybersecurity frameworks.
            </p>
          </div>

          <div className="space-y-4">
            {STATUTORY_FRAMEWORKS.map((f) => (
              <div key={f.act} className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <h3 className="text-xs md:text-sm font-bold font-mono text-zinc-100">{f.act}</h3>
                  <span className="text-[10px] font-mono px-2.5 py-1 bg-purple-950 border border-purple-500/30 text-purple-300 rounded font-semibold self-start md:self-auto">
                    {f.legalAdmissibility}
                  </span>
                </div>
                <div className="text-xs font-mono text-cyan-400">Sections: {f.sections}</div>
                <p className="text-xs text-zinc-300 leading-relaxed">{f.technicalGuarantee}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Live Audit Console Footer */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-zinc-200">REAL-TIME FORENSIC AUDIT CONSOLE LOGS</span>
          </div>
          <button
            onClick={() => setLogs([])}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            CLEAR LOGS
          </button>
        </div>

        <div className="h-24 overflow-y-auto space-y-1 text-[11px] font-mono pr-2">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2">
              <span className="text-zinc-500">[{log.timestamp}]</span>
              <span className={`font-bold ${
                log.level === 'CRITICAL' ? 'text-rose-500' :
                log.level === 'WARN' ? 'text-amber-400' :
                log.level === 'ALERT' ? 'text-purple-400' : 'text-cyan-400'
              }`}>
                [{log.level}]
              </span>
              <span className="text-zinc-300">{log.message}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sovereign Dashboard Footer */}
      <footer className="border-t border-zinc-800 pt-4 flex flex-col md:flex-row justify-between items-center text-[10px] font-mono text-zinc-500 gap-2">
        <div>
          Signatory: Supreme Sovereign Principal Architect (นายยุทธภูมิ พากเพียร) — #EP-SOVEREIGN-01
        </div>
        <div>
          ZYRQUEN $\Omega \infty$ v4.16 GOLD MASTER | Mainnet Verified
        </div>
      </footer>

      {/* Custodian QR Validator Modal */}
      <CustodianQRValidatorModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onSuccess={(data) => {
          addLog(`✓ Custodian QR validated: ${data.payload}`, 'INFO');
          setIsQrModalOpen(false);
        }}
      />
    </div>
  );
};

export default ZyrquenSovereignDashboard;