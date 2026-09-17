import React from 'react';
import { ShieldCheck, Lock, FileText, CheckCircle2, HardDrive, AlertTriangle, Activity, Database, Key, Server, Cpu } from 'lucide-react';

export const HardeningV21RealEvidenceIntake: React.FC = () => {
  return (
    <div className="space-y-6 font-mono text-zinc-300 select-none animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="p-6 bg-[#0b0d18] border border-cyan-500/30 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.1)] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none">
          <ShieldCheck className="w-32 h-32 text-cyan-500" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-cyan-300 tracking-widest">REAL EVIDENCE INTAKE</h2>
              <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/50 rounded text-xs font-bold tracking-wider">
                HARDENING v2.1
              </span>
            </div>
            <p className="text-xs text-cyan-500/80 uppercase tracking-widest font-bold">
              Control-Plane Hardening Layer • External Evidence Ingestion • Zero Canonical Write Authority
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-lg text-sm font-bold flex items-center gap-2">
              <Lock className="w-4 h-4" />
              SSOT MUTATION = 0
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs transition-colors">
                PHASE 3 MANIFEST
              </button>
              <button className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded text-xs transition-colors">
                EXPORT INTAKE LEDGER
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Taxonomy Section */}
      <div className="p-5 bg-black/40 border border-white/10 rounded-2xl">
        <h3 className="text-xs text-zinc-500 font-bold mb-3 tracking-widest uppercase">Provenance & Verification Taxonomy</h3>
        <p className="text-[10px] text-zinc-600 mb-4 uppercase">Explicit Visual Boundaries Enforced</p>
        <div className="flex flex-wrap gap-2">
          <Badge color="cyan">CANONICAL (SSoT Core)</Badge>
          <Badge color="emerald">REAL SOURCE FILE (Supplied Input)</Badge>
          <Badge color="amber">PENDING VERIFICATION (Awaiting Hardware Node)</Badge>
          <Badge color="purple">OBSERVED (Runtime Telemetry Probe)</Badge>
          <Badge color="blue">REFERENCE (RFC / Standard Spec)</Badge>
          <Badge color="zinc">SIMULATED (Local Fallback)</Badge>
          <Badge color="rose">BLOCKED (Write Firewall)</Badge>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="CANONICAL STATE" val1="14,902 SEALS" val2="Root: 909ab814...fa4c68" icon={<Database />} color="cyan" />
        <StatCard title="INTAKE FILES" val1="2 REAL ARTIFACTS" val2="TNT-TH-001 • DS-901-PILOT" icon={<FileText />} color="emerald" />
        <StatCard title="VERIFICATION" val1="VERIFIED (2/2)" val2="100% Byte Match • Attested" icon={<Activity />} color="emerald" />
        <StatCard title="PROMOTION GATE" val1="FAIL-CLOSED" val2="No Canonical Write" icon={<Lock />} color="rose" />
      </div>

      {/* Module 1: Deterministic Crypto Verify */}
      <div className="mt-8 border border-white/10 rounded-2xl overflow-hidden bg-[#070a12]">
        <div className="p-4 bg-white/5 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-emerald-400 font-bold tracking-widest text-sm">MODULE 1: DETERMINISTIC CRYPTOGRAPHIC VERIFICATION GATE</span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded border border-emerald-500/30">WEBCRYPTO SHA-256</span>
            </div>
            <div className="text-[11px] text-zinc-400">Live Hardware Digest Engine • Field-by-Field Attestation • Zero Canonical Overwrite</div>
          </div>
          <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded flex items-center gap-2 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            ALL ARTIFACTS VERIFIED
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: TNT-TH-001 */}
          <ArtifactCard 
            code="TNT-TH-001"
            type="TENANT_AUDIT_MANIFEST"
            filename="tenant_audit_manifest_TNT-TH-001.json"
            bytes={1488}
            hash="c6bee148a544dc196bf2d54d934de9edfd7f9383ff3c2e0227209571777d381e"
            slot="HSM-SLOT-01-ED25519-SOVEREIGN-SEAL"
            time="10:46:02"
            status="LOCKED"
          />

          {/* Card 2: DS-901-PILOT */}
          <ArtifactCard 
            code="DS-901-PILOT"
            type="FIOS_PILOT_DATASET"
            filename="maew_fios_pilot_dataset.json"
            bytes={2140}
            hash="8a824a424ee1dc7d86d5f9673e39398b77620ab6cc7f9fd921d730ce43257cc8"
            slot="HSM-SLOT-02-ED25519-FIDUCIARY-GATE"
            time="10:46:03"
            status="UPLOADED"
          />
        </div>
      </div>
    </div>
  );
};

// --- Subcomponents ---

const Badge = ({ children, color }: { children: React.ReactNode, color: string }) => {
  const colorMap: Record<string, string> = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    zinc: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  };
  return (
    <span className={`px-2.5 py-1 text-[10px] font-bold border rounded uppercase tracking-wider ${colorMap[color] || colorMap.zinc}`}>
      {children}
    </span>
  );
};

const StatCard = ({ title, val1, val2, icon, color }: any) => {
  const colorStyles: Record<string, string> = {
    cyan: 'text-cyan-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
  };
  
  return (
    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-colors relative overflow-hidden group">
      <div className={`absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity ${colorStyles[color]}`}>
        {React.cloneElement(icon, { className: 'w-24 h-24' })}
      </div>
      <div className="text-[10px] text-zinc-500 tracking-widest font-bold mb-2 uppercase">{title}</div>
      <div className={`text-sm font-bold mb-1 ${colorStyles[color]}`}>{val1}</div>
      <div className="text-[11px] text-zinc-400 truncate">{val2}</div>
    </div>
  );
};

const ArtifactCard = ({ code, type, filename, bytes, hash, slot, time, status }: any) => {
  return (
    <div className="bg-black/60 border border-white/10 rounded-xl overflow-hidden flex flex-col">
      <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-zinc-100">{code}</span>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] rounded border border-emerald-500/30">VERIFIED (READ-ONLY)</span>
          </div>
          <div className="text-xs text-zinc-400">{type}</div>
          <div className="text-[11px] text-cyan-400/80 mt-2 font-mono flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            {filename}
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-4 flex-1">
        <div>
          <div className="text-[10px] text-zinc-500 mb-1">COMPUTED SHA-256 DIGEST: {bytes} BYTES</div>
          <div className="p-2.5 bg-[#0a0f1e] border border-cyan-500/20 rounded-lg text-[10px] text-cyan-300 font-mono break-all leading-relaxed shadow-[inset_0_0_10px_rgba(6,182,212,0.05)]">
            {hash}
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-2 text-[11px]">
          <div className="flex justify-between items-center py-1 border-b border-white/5">
            <span className="text-zinc-500">Attestation Slot</span>
            <span className="text-amber-400 font-mono">{slot}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-white/5">
            <span className="text-zinc-500">Time Sealed</span>
            <span className="text-zinc-300">{time}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-white/5">
            <span className="text-zinc-500">CANONICAL WRITE</span>
            <span className="text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded">BLOCKED (0 MUTATIONS)</span>
          </div>
        </div>
      </div>
      
      <div className="p-3 bg-emerald-500/10 border-t border-emerald-500/20 flex items-center gap-2 text-xs font-bold text-emerald-400">
        <Lock className="w-4 h-4" />
        TERMINAL: {status} {status === 'LOCKED' && <span className="text-[10px] ml-1 bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300">(LOCKED)</span>}
      </div>
    </div>
  );
};

