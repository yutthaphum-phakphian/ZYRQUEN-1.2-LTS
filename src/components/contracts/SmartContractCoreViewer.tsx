import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Code2,
  ShieldCheck,
  Cpu,
  FileCode,
  Key,
  Copy,
  Check,
  Download,
  Terminal,
  Zap,
  Lock,
  Unlock,
  AlertTriangle,
  Play,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Flame,
  CheckCircle2,
  FileSearch,
} from 'lucide-react';
import {
  ZYRQUEN_SOVEREIGN_CORE_V2_SOURCE,
  SOVEREIGN_CONTRACT_ABI,
  CONTRACT_REMEDIATIONS,
  DEFAULT_HSM_CUSTODIANS,
} from '../../data/sovereignContractData';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { copyToClipboard } from '../../utils/clipboard';

export const SmartContractCoreViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'simulator' | 'source' | 'remediations' | 'abi'>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Contract State in Simulation
  const [contractState, setContractState] = useState({
    sovereignAddress: '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2',
    securityOracleAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    totalSeals: 14902,
    failClosedLocked: false,
    systemStatus: 'LOCKED_FROZEN_v1.2_LTS',
    merkleRootGenesis: '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    activeCaller: '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2', // Default Sovereign
  });

  const [simulatedLogs, setSimulatedLogs] = useState<
    Array<{ timestamp: string; event: string; details: string; type: 'success' | 'error' | 'warn' }>
  >([
    {
      timestamp: new Date().toLocaleTimeString(),
      event: 'ContractDeployed',
      details: 'ZyrquenSovereignCoreV2 initialized with 10/10 HSM Custodians & 14,902 Canonical Seals.',
      type: 'success',
    },
  ]);

  // Method execution inputs
  const [quarantineSealInput, setQuarantineSealInput] = useState({
    sealId: '14903',
    reason: 'Adversarial Entropy Drift Detected (>0.00%)',
    initialStatus: '0', // FAIL_CLOSED
  });

  const [failClosedReason, setFailClosedReason] = useState('Manual Emergency Thermal Cutoff Trigger');
  const [quorumResult, setQuorumResult] = useState<boolean | null>(null);
  const [isVerifyingQuorum, setIsVerifyingQuorum] = useState(false);

  const handleCopy = (text: string, label: string) => {
    copyToClipboard(text);
    setCopiedKey(label);
    playAuditChime();
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleExportSolidity = () => {
    const blob = new Blob([ZYRQUEN_SOVEREIGN_CORE_V2_SOURCE], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ZyrquenSovereignCoreV2.sol';
    a.click();
    URL.revokeObjectURL(url);
    playAuditChime();
  };

  const handleExportAbi = () => {
    const blob = new Blob([JSON.stringify(SOVEREIGN_CONTRACT_ABI, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ZyrquenSovereignCoreV2_ABI.json';
    a.click();
    URL.revokeObjectURL(url);
    playAuditChime();
  };

  // Simulation Methods
  const executeVerifyREAL_HSMQuorum = () => {
    setIsVerifyingQuorum(true);
    playTone(550, 0.08);

    setTimeout(() => {
      setIsVerifyingQuorum(false);
      setQuorumResult(true);
      playAuditChime();
      setSimulatedLogs((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          event: 'HSMQuorumVerified',
          details: `10/10 REAL_HSM Signatures Validated on Merkle Root ${contractState.merkleRootGenesis.slice(0, 14)}... (ETDA Sec 26/28 Compliant)`,
          type: 'success',
        },
        ...prev,
      ]);
    }, 600);
  };

  const executeTriggerFailClosed = () => {
    if (contractState.activeCaller !== contractState.sovereignAddress) {
      playTone(220, 0.2, 'sawtooth');
      setSimulatedLogs((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          event: 'Revert (ZYR-02 onlySovereign)',
          details: `Caller ${contractState.activeCaller.slice(0, 10)}... is unauthorized. Only Sovereign Principal allowed.`,
          type: 'error',
        },
        ...prev,
      ]);
      return;
    }

    playTone(180, 0.3, 'sawtooth');
    setContractState((prev) => ({ ...prev, failClosedLocked: true }));
    setSimulatedLogs((prev) => [
      {
        timestamp: new Date().toLocaleTimeString(),
        event: 'FailClosedTriggered',
        details: `Reason: "${failClosedReason}". Circuit tripped to locked state.`,
        type: 'warn',
      },
      ...prev,
    ]);
  };

  const executeQuarantineSeal = () => {
    if (contractState.failClosedLocked) {
      playTone(220, 0.15, 'sawtooth');
      setSimulatedLogs((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          event: 'Revert (whenNotFailClosed)',
          details: 'Cannot mutate state while contract is in FailClosedLocked state.',
          type: 'error',
        },
        ...prev,
      ]);
      return;
    }

    const isAuthorized =
      contractState.activeCaller === contractState.sovereignAddress ||
      contractState.activeCaller === contractState.securityOracleAddress;

    if (!isAuthorized) {
      playTone(220, 0.2, 'sawtooth');
      setSimulatedLogs((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          event: 'Revert (ZYR-03 onlySovereignOrOracle)',
          details: `Caller ${contractState.activeCaller.slice(0, 10)}... has Mutation Authority: 0.`,
          type: 'error',
        },
        ...prev,
      ]);
      return;
    }

    playAuditChime();
    setContractState((prev) => ({ ...prev, totalSeals: prev.totalSeals + 1 }));
    setSimulatedLogs((prev) => [
      {
        timestamp: new Date().toLocaleTimeString(),
        event: 'SealFailsafeTriggered',
        details: `Seal #${quarantineSealInput.sealId} Quarantined. Reason: "${quarantineSealInput.reason}". Total Seals updated to ${contractState.totalSeals + 1}.`,
        type: 'success',
      },
      ...prev,
    ]);
  };

  return (
    <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#0c1424]/95 via-[#0b0e1b]/95 to-[#06070D] border border-cyan-500/30 backdrop-blur-xl space-y-6 font-mono shadow-2xl">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5" />
              SOLIDITY ^0.8.20 CORE
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              ZYR-01 TO ZYR-05 REMEDIATED (5/5 PATCHED)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs font-bold">
              ETDA SEC 9, 26, 28 BOUND
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Code2 className="w-6 h-6 text-cyan-400" />
            ZyrquenSovereignCoreV2 Smart Contract
          </h3>
          <p className="text-xs text-zinc-400">
            Official immutable EVM Smart Contract implementing Sovereign Access Control, 10/10 REAL_HSM Quorum Verification, and Section 26/28 Non-Repudiation.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportSolidity}
            className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.2)]"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download .sol</span>
          </button>
          <button
            onClick={handleExportAbi}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" />
            <span>Export ABI</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {[
          { id: 'overview', label: 'Contract Overview & State', icon: Layers },
          { id: 'simulator', label: 'EVM Method Execution Sandbox', icon: Zap },
          { id: 'remediations', label: 'Security Patches (ZYR 01-05)', icon: ShieldCheck },
          { id: 'source', label: 'Source Code (Solidity)', icon: FileCode },
          { id: 'abi', label: 'Contract ABI & Signatures', icon: Terminal },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                playTone(500, 0.03);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                  : 'bg-black/30 text-zinc-400 hover:text-white border border-white/5 hover:border-white/20'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-zinc-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & STATE */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-bold">System Status Constant</span>
              <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {contractState.systemStatus}
              </div>
              <span className="text-[10px] text-zinc-500">Involatile Baseline v1.2</span>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-bold">Total Canonical Seals</span>
              <div className="text-sm font-bold text-cyan-300 font-mono">
                {contractState.totalSeals.toLocaleString()} Seals
              </div>
              <span className="text-[10px] text-zinc-500">Mutation Authority: 0 Protected</span>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-bold">REAL_HSM Quorum Size</span>
              <div className="text-sm font-bold text-purple-300">
                10 / 10 Custodians (100%)
              </div>
              <span className="text-[10px] text-zinc-500">FIPS 140-3 Level 4 Bound</span>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-bold">Circuit Lockdown State</span>
              <div className="text-sm font-bold flex items-center gap-1.5">
                {contractState.failClosedLocked ? (
                  <span className="text-red-400 flex items-center gap-1">
                    <Flame className="w-4 h-4" /> FAIL_CLOSED LOCKED
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> ACTIVE OPERATIONAL
                  </span>
                )}
              </div>
              <span className="text-[10px] text-zinc-500">85.0°C Thermal Threshold</span>
            </div>
          </div>

          {/* Immutable Constants & Addresses Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-black/50 border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Sovereign Entity State Variables
                </h4>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                  Verified On-Chain
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <div className="text-[10px] text-zinc-400 flex items-center justify-between">
                    <span>Sovereign Principal Architect:</span>
                    <span className="text-white font-bold">#EP-SOVEREIGN-01</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white font-semibold flex items-center justify-between">
                    <span>Yuttaphum Phakphian (นายยุทธภูมิ พากเพียร)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">OMEGA-1</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-zinc-400 flex items-center justify-between">
                    <span>Sovereign Wallet Address (onlySovereign):</span>
                    <button
                      onClick={() => handleCopy(contractState.sovereignAddress, 'sovereign_addr')}
                      className="text-cyan-400 hover:text-cyan-200 flex items-center gap-1"
                    >
                      {copiedKey === 'sovereign_addr' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span className="text-[10px]">Copy</span>
                    </button>
                  </div>
                  <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] truncate">
                    {contractState.sovereignAddress}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-zinc-400 flex items-center justify-between">
                    <span>Security Oracle Address (onlySovereignOrOracle):</span>
                    <button
                      onClick={() => handleCopy(contractState.securityOracleAddress, 'oracle_addr')}
                      className="text-purple-400 hover:text-purple-200 flex items-center gap-1"
                    >
                      {copiedKey === 'oracle_addr' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span className="text-[10px]">Copy</span>
                    </button>
                  </div>
                  <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono text-[11px] truncate">
                    {contractState.securityOracleAddress}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-zinc-400 flex items-center justify-between">
                    <span>Genesis Merkle Root (SSoT Δ0.0% Anchor):</span>
                    <button
                      onClick={() => handleCopy(contractState.merkleRootGenesis, 'merkle_genesis')}
                      className="text-amber-400 hover:text-amber-200 flex items-center gap-1"
                    >
                      {copiedKey === 'merkle_genesis' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span className="text-[10px]">Copy</span>
                    </button>
                  </div>
                  <div className="p-2 rounded-lg bg-black/60 border border-white/10 text-amber-300 font-mono text-[10px] break-all">
                    {contractState.merkleRootGenesis}
                  </div>
                </div>
              </div>
            </div>

            {/* 10/10 HSM Custodians Quorum Registry */}
            <div className="p-5 rounded-2xl bg-black/50 border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  10/10 HSM Hardware Custodians
                </h4>
                <span className="text-[10px] text-zinc-400 font-mono">
                  hsmCustodians[addr] == true
                </span>
              </div>

              <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                {DEFAULT_HSM_CUSTODIANS.map((c) => (
                  <div
                    key={c.slot}
                    className="p-2 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-cyan-400">Slot #{c.slot}</span>
                        <span className="text-zinc-300 font-semibold">{c.role}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono">{c.address}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/20 font-bold">
                      ACTIVE
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SIMULATOR & EXECUTION SANDBOX */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          {/* Left 6 Cols: Method Execution Forms */}
          <div className="lg:col-span-6 space-y-4">
            {/* Caller Address Selector */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                <span>Simulated `msg.sender` (Transaction Caller):</span>
                <span className="text-[10px] text-cyan-400">Access Control Simulation</span>
              </div>

              <select
                value={contractState.activeCaller}
                onChange={(e) => setContractState((prev) => ({ ...prev, activeCaller: e.target.value }))}
                className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value={contractState.sovereignAddress}>
                  👑 Sovereign Principal ({contractState.sovereignAddress.slice(0, 10)}...)
                </option>
                <option value={contractState.securityOracleAddress}>
                  🛡️ Security Sentinel Oracle ({contractState.securityOracleAddress.slice(0, 10)}...)
                </option>
                <option value="0x999999cf1046e68e36E1aA2E0E07105eDDD1f08E">
                  ⚠️ Unauthorized External Actor (0x9999...f08E)
                </option>
              </select>
            </div>

            {/* Method 1: verifyREAL_HSMQuorum */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  verifyREAL_HSMQuorum(bytes32, HSMSignature[])
                </span>
                <span className="text-[10px] text-zinc-500">view</span>
              </div>

              <p className="text-[11px] text-zinc-400">
                Validates 10/10 HSM custodian signatures without duplicates, satisfying ETDA Section 26 &amp; 28.
              </p>

              <button
                onClick={executeVerifyREAL_HSMQuorum}
                disabled={isVerifyingQuorum}
                className="w-full py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isVerifyingQuorum ? 'Verifying 10/10 Signatures...' : 'Execute verifyREAL_HSMQuorum()'}</span>
              </button>
            </div>

            {/* Method 2: quarantineSeal */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  quarantineSeal(uint256, string, uint8)
                </span>
                <span className="text-[10px] text-zinc-500">onlySovereignOrOracle</span>
              </div>

              <div className="space-y-2 text-xs">
                <input
                  type="text"
                  placeholder="Seal ID (e.g. 14903)"
                  value={quarantineSealInput.sealId}
                  onChange={(e) => setQuarantineSealInput({ ...quarantineSealInput, sealId: e.target.value })}
                  className="w-full p-2 rounded-lg bg-black/60 border border-white/10 text-white font-mono"
                />
                <input
                  type="text"
                  placeholder="Failure Reason"
                  value={quarantineSealInput.reason}
                  onChange={(e) => setQuarantineSealInput({ ...quarantineSealInput, reason: e.target.value })}
                  className="w-full p-2 rounded-lg bg-black/60 border border-white/10 text-white"
                />
              </div>

              <button
                onClick={executeQuarantineSeal}
                className="w-full py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Execute quarantineSeal()</span>
              </button>
            </div>

            {/* Method 3: triggerFailClosed */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                  <Flame className="w-4 h-4" />
                  triggerFailClosed(string)
                </span>
                <span className="text-[10px] text-zinc-500">onlySovereign</span>
              </div>

              <input
                type="text"
                placeholder="Lockdown Reason"
                value={failClosedReason}
                onChange={(e) => setFailClosedReason(e.target.value)}
                className="w-full p-2 rounded-lg bg-black/60 border border-white/10 text-xs text-white"
              />

              <button
                onClick={executeTriggerFailClosed}
                className="w-full py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Execute triggerFailClosed() [Panic Circuit]</span>
              </button>
            </div>
          </div>

          {/* Right 6 Cols: Execution Logs Console */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-3 h-full flex flex-col">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  EVM Execution Logs &amp; Events
                </h4>
                <button
                  onClick={() => setSimulatedLogs([])}
                  className="text-[10px] text-zinc-500 hover:text-white"
                >
                  Clear Console
                </button>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto max-h-[480px] font-mono text-xs pr-1">
                {simulatedLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border text-[11px] space-y-1 ${
                      log.type === 'error'
                        ? 'bg-red-500/10 border-red-500/30 text-red-300'
                        : log.type === 'warn'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] opacity-70">
                      <span className="font-bold uppercase">{log.event}</span>
                      <span>{log.timestamp}</span>
                    </div>
                    <div className="leading-relaxed">{log.details}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REMEDIATIONS (ZYR 01-03) */}
      {activeTab === 'remediations' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CONTRACT_REMEDIATIONS.map((rem) => (
              <div
                key={rem.code}
                className="p-5 rounded-2xl bg-black/40 border border-cyan-500/20 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold">
                    {rem.code}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      rem.severity === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {rem.severity}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white leading-snug">{rem.title}</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">{rem.description}</p>

                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
                  <span className="font-bold">Impact: </span>
                  {rem.impact}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SOURCE CODE VIEWER */}
      {activeTab === 'source' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">
              File: <span className="text-white font-bold font-mono">contracts/ZyrquenSovereignCoreV2.sol</span>
            </span>
            <button
              onClick={() => handleCopy(ZYRQUEN_SOVEREIGN_CORE_V2_SOURCE, 'full_solidity')}
              className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-cyan-300 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedKey === 'full_solidity' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy Full Source</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-black/80 border border-white/10 max-h-[500px] overflow-y-auto font-mono text-xs text-zinc-300 leading-relaxed select-all">
            <pre className="whitespace-pre-wrap">{ZYRQUEN_SOVEREIGN_CORE_V2_SOURCE}</pre>
          </div>
        </div>
      )}

      {/* TAB 5: ABI VIEWER */}
      {activeTab === 'abi' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Application Binary Interface (JSON ABI)</span>
            <button
              onClick={() => handleCopy(JSON.stringify(SOVEREIGN_CONTRACT_ABI, null, 2), 'full_abi')}
              className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-purple-300 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedKey === 'full_abi' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy ABI JSON</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-black/80 border border-white/10 max-h-[500px] overflow-y-auto font-mono text-[11px] text-purple-200 leading-relaxed select-all">
            <pre className="whitespace-pre-wrap">{JSON.stringify(SOVEREIGN_CONTRACT_ABI, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
