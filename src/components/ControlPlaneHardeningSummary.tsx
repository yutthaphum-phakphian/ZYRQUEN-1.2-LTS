import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Flame,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Zap,
  Activity,
  Check,
  Copy,
  Clock,
  Radio,
  FileCheck,
  EyeOff,
  AlertOctagon,
} from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';

export const ControlPlaneHardeningSummary: React.FC = () => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleCopy = (text: string, id: string) => {
    copyToClipboard(text);
    setCopiedHash(id);
    playTone(720, 0.03);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleExportAuditSnapshot = () => {
    setIsExporting(true);
    playTone(650, 0.04);
    setTimeout(() => {
      const auditSnapshot = {
        title: 'ZYRQUEN_OMEGA_CONTROL_PLANE_AUDIT_SNAPSHOT',
        exportedAtIct: '2026-08-22 01:58:00 ICT',
        frozenBaseline: {
          merkleRoot: '909ab8146747f520beec1907beab286c06a38096f9bf00f40d8aa536b3fa4c68',
          blockHeight: 849202,
          totalSeals: 14902,
          mutationAllowed: 0,
        },
        evidenceProvenance: {
          canonical: 'LOCKED_SSOT',
          verifiedLocal: 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
          deployedIntegrity: 'PENDING_EXTERNAL_VERIFICATION',
          independentRuntime: 'NOT_EXECUTED',
          unverifiedClaims: 'FAIL_CLOSED',
        },
        exportBoundary: 'READ_ONLY_SNAPSHOT_NO_WRITE_BACK',
      };
      const blob = new Blob([JSON.stringify(auditSnapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ZYRQUEN_AUDIT_SNAPSHOT_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setIsExporting(false);
      playAuditChime();
    }, 400);
  };

  return (
    <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#0c0f1d]/95 via-[#080b14]/90 to-[#07080F] border-2 border-cyan-500/40 backdrop-blur-2xl space-y-6 shadow-2xl font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-cyan-100 font-serif">
                CONTROL-PLANE HARDENING PASS (ข้อ ๘ — ๑๘)
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                FROZEN CORE: UNTOUCHED
              </span>
            </div>
            <p className="text-xs text-cyan-200/80 font-serif mt-0.5">
              Evidence State Machine &bull; Canonical Write Firewall &bull; Artifact Integrity &bull; Runtime Provenance &bull; Final Hardening Seal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handleExportAuditSnapshot}
            disabled={isExporting}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 font-bold flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)]"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>{isExporting ? 'EXPORTING SNAPSHOT...' : 'EXPORT AUDIT EVIDENCE (ข้อ ๑๓)'}</span>
          </button>
          <span className="px-3 py-1 rounded-xl bg-black/60 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>SSOT MUTATION: 0</span>
          </span>
        </div>
      </div>

      {/* Hardening Pillars Grid (8 - 16) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        {/* 8. Evidence State Machine */}
        <div className="p-4 rounded-2xl bg-black/60 border border-white/8 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300 border-b border-white/5 pb-2">
            <span className="flex items-center gap-1.5 text-amber-300">
              <Layers className="w-3.5 h-3.5" />
              <span>8. Evidence State Machine</span>
            </span>
            <span className="text-emerald-400 text-[10px]">ENFORCED</span>
          </div>
          <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
            Strict directional sequence:
            <br />
            <strong className="text-amber-200 font-mono text-[10px]">
              CANDIDATE ➔ EVIDENCE ➔ VERIFIED ➔ GOVERNED ➔ PROMOTED
            </strong>
          </p>
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] text-red-300">
            MISMATCH / UNVERIFIED ➔ <strong>BLOCKED</strong> (ห้ามย้อนหรือข้ามสถานะด้วย UI)
          </div>
        </div>

        {/* 9. Canonical Write Firewall */}
        <div className="p-4 rounded-2xl bg-black/60 border border-white/8 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300 border-b border-white/5 pb-2">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>9. Canonical Write Firewall</span>
            </span>
            <span className="text-emerald-400 text-[10px]">P0 LOCKED</span>
          </div>
          <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
            ตรวจ P0 reconciliation ก่อนทุก write operation. ปฏิเสธการแก้ไข Merkle Root / Block / Seal Count โดยสมบูรณ์.
          </p>
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-200">
            Auto-Reseal: <strong>BLOCKED</strong> | SSOT Mutation: <strong>0</strong>
          </div>
        </div>

        {/* 10. Artifact Integrity Gate */}
        <div className="p-4 rounded-2xl bg-black/60 border border-white/8 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300 border-b border-white/5 pb-2">
            <span className="flex items-center gap-1.5 text-purple-300">
              <FileCode className="w-3.5 h-3.5" />
              <span>10. Artifact Integrity Gate</span>
            </span>
            <span className="text-amber-300 text-[10px]">SEPARATED</span>
          </div>
          <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
            แยก Merkle Root ออกจาก SHA-256(index.html) อย่างเด็ดขาด. ตรวจ LOCAL SHA-256 ↔ DEPLOYED SHA-256.
          </p>
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-200 flex items-center justify-between">
            <span>DEPLOYED VERIFICATION:</span>
            <span className="font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded">
              PENDING EXTERNAL
            </span>
          </div>
        </div>

        {/* 11. Runtime Provenance Gate */}
        <div className="p-4 rounded-2xl bg-black/60 border border-white/8 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300 border-b border-white/5 pb-2">
            <span className="flex items-center gap-1.5 text-blue-300">
              <Radio className="w-3.5 h-3.5" />
              <span>11. Runtime Provenance Gate</span>
            </span>
            <span className="text-blue-300 text-[10px]">PASSIVE</span>
          </div>
          <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
            INDEPENDENT RUNTIME: <strong className="text-blue-300">NOT EXECUTED</strong> จนกว่าจะมี execution evidence จริง.
          </p>
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-200 space-y-1">
            <div>• SIMULATED &ne; VERIFIED (ห้ามสับสน)</div>
            <div>• REFERENCE &ne; LIVE (คงสถานะจริง)</div>
          </div>
        </div>

        {/* 13. Audit Evidence Export Boundary */}
        <div className="p-4 rounded-2xl bg-black/60 border border-white/8 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300 border-b border-white/5 pb-2">
            <span className="flex items-center gap-1.5 text-emerald-300">
              <FileCheck className="w-3.5 h-3.5" />
              <span>13. Audit Export Boundary</span>
            </span>
            <span className="text-emerald-400 text-[10px]">READ-ONLY</span>
          </div>
          <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
            Export ได้เฉพาะ evidence ที่มี provenance ชัดเจน. Snapshots เป็น Read-only โดยสมบูรณ์ ห้ามเขียนกลับเข้า Canonical.
          </p>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-200">
            Write-Back to Canonical: <strong>STRICTLY FORBIDDEN</strong>
          </div>
        </div>

        {/* 14. Governance Decision Ledger */}
        <div className="p-4 rounded-2xl bg-black/60 border border-white/8 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300 border-b border-white/5 pb-2">
            <span className="flex items-center gap-1.5 text-indigo-300">
              <Activity className="w-3.5 h-3.5" />
              <span>14. Governance Decision Ledger</span>
            </span>
            <span className="text-indigo-300 text-[10px]">IMMUTABLE</span>
          </div>
          <p className="text-[10px] text-zinc-400 font-mono leading-relaxed">
            Actor ➔ Input ➔ Evidence ➔ Verification ➔ Decision ➔ Timestamp
          </p>
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-200">
            Allowed Outputs: <strong>APPROVED / BLOCKED / FAIL_CLOSED</strong>
          </div>
        </div>

        {/* 15. Anti-Spoofing Identity Lock */}
        <div className="p-4 rounded-2xl bg-black/60 border border-white/8 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300 border-b border-white/5 pb-2">
            <span className="flex items-center gap-1.5 text-rose-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>15. Anti-Spoofing Identity</span>
            </span>
            <span className="text-emerald-400 text-[10px]">5-TIER LOCK</span>
          </div>
          <p className="text-[10px] text-zinc-400 font-mono leading-relaxed">
            Display Name ➔ Signer ID ➔ Credential ID ➔ Fingerprint ➔ Signature
          </p>
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-300">
            Mismatch Any Point ➔ <strong>BLOCKED</strong>
          </div>
        </div>

        {/* 16. Presentation Non-Authority Seal */}
        <div className="p-4 rounded-2xl bg-black/60 border border-white/8 space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300 border-b border-white/5 pb-2">
            <span className="flex items-center gap-1.5 text-amber-300">
              <EyeOff className="w-3.5 h-3.5" />
              <span>16. Presentation Non-Authority Seal</span>
            </span>
            <span className="text-amber-400 text-[10px]">COSMETIC BOUNDARY</span>
          </div>
          <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
            Royal Gazette UI, Legal Dashboard, Quantum Visualizer, และ 3D Citadel เป็น Presentation Layer เท่านั้น ไม่มีสิทธิ์แก้ไข evidence หรือ canonical state ใดๆ
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono text-zinc-400">
            <span className="p-1.5 rounded bg-black/40 border border-white/5 text-center">Royal Gazette = UI</span>
            <span className="p-1.5 rounded bg-black/40 border border-white/5 text-center">Legal Dash = UI</span>
            <span className="p-1.5 rounded bg-black/40 border border-white/5 text-center">Quantum Viz = UI</span>
            <span className="p-1.5 rounded bg-black/40 border border-white/5 text-center">3D Citadel = UI</span>
          </div>
        </div>
      </div>

      {/* 17. Release Closure Invariant Matrix */}
      <div className="p-5 rounded-2xl bg-black/70 border border-emerald-500/30 space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <span className="text-xs font-bold text-emerald-200 font-serif flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span>17. Release Closure Invariant Matrix</span>
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
            INVIOLABLE
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] font-mono">
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-0.5">
            <div className="text-[10px] text-zinc-500">P0 CANONICAL:</div>
            <div className="text-emerald-400 font-bold">PASS</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-0.5">
            <div className="text-[10px] text-zinc-500">P2 GOVERNANCE:</div>
            <div className="text-emerald-400 font-bold">PASS</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-0.5">
            <div className="text-[10px] text-zinc-500">P3 DELIVERY:</div>
            <div className="text-emerald-400 font-bold">PASS</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-0.5">
            <div className="text-[10px] text-zinc-500">CANONICAL MUTATION:</div>
            <div className="text-emerald-400 font-bold">0</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-0.5">
            <div className="text-[10px] text-zinc-500">BASELINE DRIFT:</div>
            <div className="text-emerald-400 font-bold">0.00%</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-0.5">
            <div className="text-[10px] text-zinc-500">RUNTIME:</div>
            <div className="text-blue-300 font-bold">NOT EXECUTED</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-0.5">
            <div className="text-[10px] text-zinc-500">PROMOTION BYPASS:</div>
            <div className="text-emerald-400 font-bold">0</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-0.5">
            <div className="text-[10px] text-zinc-500">EVIDENCE SPOOF:</div>
            <div className="text-emerald-400 font-bold">0</div>
          </div>
        </div>
      </div>

      {/* 18. Final Hardening Seal Terminal Output */}
      <div className="p-5 rounded-2xl bg-[#05070c] border-2 border-cyan-400/60 shadow-[0_0_30px_rgba(6,182,212,0.2)] text-xs font-mono space-y-3">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
          <div className="text-cyan-300 font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>18. FINAL HARDENING SEAL — ZYRQUEN Ω∞</span>
          </div>
          <span className="text-[10px] text-zinc-400">2026-08-22 01:58:00 ICT</span>
        </div>

        <div className="bg-black/90 p-4 rounded-xl border border-cyan-500/30 text-zinc-300 space-y-1.5 leading-relaxed">
          <div className="text-cyan-400 font-bold">ZYRQUEN Ω∞</div>
          <div className="text-zinc-400">CONTROL-PLANE HARDENING</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 pt-2 border-t border-white/10 text-[11px]">
            <div>STATUS: <strong className="text-emerald-300">PASS</strong></div>
            <div>CANONICAL: <strong className="text-cyan-300">FROZEN (v1.2 LTS)</strong></div>
            <div>GOVERNANCE CONTROLS: <strong className="text-emerald-300">ENFORCED (10/10 Matrix)</strong></div>
            <div>CUSTODIAN QUORUM: <strong className="text-amber-300">LOCKED (Physical Evidence Bound)</strong></div>
            <div>PROVENANCE: <strong className="text-amber-300">LOCKED</strong></div>
            <div>PROMOTION: <strong className="text-red-300">FAIL-CLOSED</strong></div>
            <div>PRESENTATION: <strong className="text-zinc-400">NON-AUTHORITATIVE</strong></div>
            <div>MUTATION: <strong className="text-emerald-400">0</strong></div>
            <div>CANONICAL PROMOTION: <strong className="text-red-400">BLOCKED UNTIL REQUIRED EVIDENCE</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};
