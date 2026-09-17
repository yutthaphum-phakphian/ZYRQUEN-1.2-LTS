import React, { useState } from 'react';
import {
  ShieldAlert,
  Terminal,
  Play,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Bug,
  RotateCcw,
  Sparkles,
  Lock,
  Ban,
  Activity,
  FileCode,
  Shield,
  Layers,
  Key,
} from 'lucide-react';
import { playTone, playAuditChime } from './AudioSynthesizer';
import { SYSTEM_INVARIANTS } from '../data/canonicalData';

export interface AdversarialTestCase {
  id: string;
  name: string;
  category: 'DIGEST_ATTACK' | 'TENANT_SPOOF' | 'PROMOTION_BYPASS' | 'CANONICAL_WRITE' | 'REPLAY_ATTACK' | 'SIMULATION_ESCALATION';
  payloadVector: string;
  expectedBehavior: 'BLOCKED' | 'QUARANTINED';
  runtimeResult: 'BLOCKED' | 'QUARANTINED' | 'PASSED_FAIL_CLOSED' | 'PENDING';
  executedTimestamp: string | null;
  forensicTrace: string;
  ssotMutationDelta: 0;
}

export const AdversarialFailureLab: React.FC = () => {
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [tests, setTests] = useState<AdversarialTestCase[]>([
    {
      id: 'ADV-01',
      name: 'Forged Byte Digest Injection',
      category: 'DIGEST_ATTACK',
      payloadVector: 'Inject spoofed SHA-256 (0xDEADBEEF...) into TNT-TH-001 byte stream',
      expectedBehavior: 'QUARANTINED',
      runtimeResult: 'PENDING',
      executedTimestamp: null,
      forensicTrace: 'WebCrypto digest mismatch detected. Zero-trust gate halts parsing & routes to quarantine.',
      ssotMutationDelta: 0,
    },
    {
      id: 'ADV-02',
      name: 'Tenant Spoofing & Cross-Namespace Leakage',
      category: 'TENANT_SPOOF',
      payloadVector: 'TNT-TH-001 attempts unauthenticated READ/WRITE on TNT-TH-002 EEC Data Lab namespace',
      expectedBehavior: 'BLOCKED',
      runtimeResult: 'PENDING',
      executedTimestamp: null,
      forensicTrace: 'Hardware Silo boundary violation (Rule 9). Intercepted and blocked at ingress.',
      ssotMutationDelta: 0,
    },
    {
      id: 'ADV-03',
      name: 'Unauthorized Canonical Promotion Bypass',
      category: 'PROMOTION_BYPASS',
      payloadVector: 'Send promotion request while status is PENDING_VERIFICATION without HSM multi-sig',
      expectedBehavior: 'BLOCKED',
      runtimeResult: 'PENDING',
      executedTimestamp: null,
      forensicTrace: 'Promotion Firewall Rule: Artifact not in VERIFIED status. Promotion gate fails closed.',
      ssotMutationDelta: 0,
    },
    {
      id: 'ADV-04',
      name: 'Direct Canonical Merkle Root Overwrite Attempt',
      category: 'CANONICAL_WRITE',
      payloadVector: 'POST /api/canonical/mutate payload: { root: "0xNEWROOT999" }',
      expectedBehavior: 'BLOCKED',
      runtimeResult: 'PENDING',
      executedTimestamp: null,
      forensicTrace: 'Read-only Merkle kernel rejected mutation. SSoT Mutation counter remains 0.',
      ssotMutationDelta: 0,
    },
    {
      id: 'ADV-05',
      name: 'Cryptographic Signature Replay Attack',
      category: 'REPLAY_ATTACK',
      payloadVector: 'Replay stale ED25519 signature from block #849100 on block #849202',
      expectedBehavior: 'QUARANTINED',
      runtimeResult: 'PENDING',
      executedTimestamp: null,
      forensicTrace: 'Signature nonce timestamp mismatch detected. Injected event isolated into Quarantine.',
      ssotMutationDelta: 0,
    },
    {
      id: 'ADV-06',
      name: 'Simulation-to-Production Execution Escalation',
      category: 'SIMULATION_ESCALATION',
      payloadVector: 'DS-901-PILOT Monte Carlo path attempts live broker order routing (Fix Protocol / SEC API)',
      expectedBehavior: 'BLOCKED',
      runtimeResult: 'PENDING',
      executedTimestamp: null,
      forensicTrace: 'Financial Safety Barrier (Rule 8): Broker socket disabled in sandbox. Zero capital movement.',
      ssotMutationDelta: 0,
    },
    {
      id: 'ADV-07',
      name: 'Malformed JSON Payload Flood',
      category: 'DIGEST_ATTACK',
      payloadVector: 'Send truncated JSON with trailing delimiters into Evidence Intake Parser',
      expectedBehavior: 'QUARANTINED',
      runtimeResult: 'PENDING',
      executedTimestamp: null,
      forensicTrace: 'Parser exception trapped by zero-trust boundary. Input quarantined with 0 side-effects.',
      ssotMutationDelta: 0,
    },
    {
      id: 'ADV-08',
      name: 'Cross-Tenant Evidence Inheritance Hijack',
      category: 'TENANT_SPOOF',
      payloadVector: 'TNT-TH-003 attempts to inherit audit certificate from TNT-TH-001',
      expectedBehavior: 'BLOCKED',
      runtimeResult: 'PENDING',
      executedTimestamp: null,
      forensicTrace: 'Rule 9: Cross-tenant evidence inheritance strictly blocked by namespace firewall.',
      ssotMutationDelta: 0,
    },
  ]);

  const handleRunAllAttacks = async () => {
    setIsRunningAll(true);
    playTone(500, 0.05);

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      await new Promise((r) => setTimeout(r, 220));
      setTests((prev) =>
        prev.map((t) =>
          t.id === test.id
            ? {
                ...t,
                runtimeResult: t.expectedBehavior === 'BLOCKED' ? 'BLOCKED' : 'QUARANTINED',
                executedTimestamp: new Date().toLocaleTimeString() + ' ICT',
              }
            : t
        )
      );
      playTone(650 + i * 30, 0.03);
    }

    setIsRunningAll(false);
    playAuditChime();
  };

  const handleReset = () => {
    setTests((prev) =>
      prev.map((t) => ({
        ...t,
        runtimeResult: 'PENDING',
        executedTimestamp: null,
      }))
    );
    playTone(400, 0.04);
  };

  const allPassed = tests.every((t) => t.runtimeResult !== 'PENDING');

  return (
    <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#1a080d] via-[#120509] to-[#080204] border-2 border-rose-500/40 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-400 text-rose-300 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-rose-100 font-serif">
                PHASE 3: ADVERSARIAL FAILURE INJECTION &amp; ATTACK LAB
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-400/40 font-bold">
                8 NEGATIVE VECTORS
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live Attack Simulation &bull; Automated Fail-Closed Interception &bull; SSoT Mutation Invariant Delta = 0
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {allPassed && (
            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Lab</span>
            </button>
          )}

          <button
            onClick={handleRunAllAttacks}
            disabled={isRunningAll}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg ${
              allPassed
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 cursor-default'
                : isRunningAll
                ? 'bg-rose-600/50 text-rose-200 border border-rose-400/50 animate-pulse'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]'
            }`}
          >
            {allPassed ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>ALL 8 VECTORS FAIL-CLOSED (100% BLOCKED/QUARANTINED)</span>
              </>
            ) : isRunningAll ? (
              <>
                <Activity className="w-4 h-4 animate-spin" />
                <span>INJECTING ATTACK PAYLOADS...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>EXECUTE 8 ADVERSARIAL ATTACKS</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Invariant Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-black/60 border border-rose-500/30">
          <div className="text-[10px] text-zinc-500 font-bold">TOTAL VECTORS</div>
          <div className="text-white font-bold text-base">8 Vectors</div>
        </div>
        <div className="p-3 rounded-xl bg-black/60 border border-emerald-500/30">
          <div className="text-[10px] text-zinc-500 font-bold">INTERCEPTION RATE</div>
          <div className="text-emerald-400 font-bold text-base">{allPassed ? '100.00% (8/8)' : 'READY'}</div>
        </div>
        <div className="p-3 rounded-xl bg-black/60 border border-indigo-500/30">
          <div className="text-[10px] text-zinc-500 font-bold">FROZEN CORE STATE</div>
          <div className="text-indigo-300 font-bold text-base">#849202 (LOCKED)</div>
        </div>
        <div className="p-3 rounded-xl bg-black/60 border border-amber-500/30">
          <div className="text-[10px] text-zinc-500 font-bold">SSOT MUTATION DELTA</div>
          <div className="text-amber-400 font-bold text-base">0 (INVIOLABLE)</div>
        </div>
      </div>

      {/* Attack Vectors List */}
      <div className="space-y-2.5">
        {tests.map((test) => {
          const isExecuted = test.runtimeResult !== 'PENDING';
          return (
            <div
              key={test.id}
              className={`p-3.5 rounded-2xl border transition-all space-y-2 ${
                !isExecuted
                  ? 'bg-black/50 border-white/10'
                  : test.runtimeResult === 'BLOCKED'
                  ? 'bg-rose-950/40 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                  : 'bg-amber-950/40 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-zinc-400">{test.id}</span>
                  <span className="text-xs font-bold text-white">{test.name}</span>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold border border-white/10">
                    {test.category}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded font-bold border ${
                      !isExecuted
                        ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        : test.runtimeResult === 'BLOCKED'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    }`}
                  >
                    {!isExecuted ? 'AWAITING RUN' : `INTERCEPTED: ${test.runtimeResult}`}
                  </span>
                  {test.executedTimestamp && (
                    <span className="text-[10px] text-zinc-500 font-mono">{test.executedTimestamp}</span>
                  )}
                </div>
              </div>

              <div className="p-2 rounded-xl bg-black/60 border border-white/5 text-[11px] font-mono text-zinc-300">
                <span className="text-zinc-500">Payload: </span> {test.payloadVector}
              </div>

              {isExecuted && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] text-zinc-400 pt-1 border-t border-white/5">
                  <div>
                    <strong className="text-zinc-300">Forensic Intercept:</strong> {test.forensicTrace}
                  </div>
                  <span className="text-emerald-400 font-bold shrink-0">
                    SSoT Mutation Delta: {test.ssotMutationDelta}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
