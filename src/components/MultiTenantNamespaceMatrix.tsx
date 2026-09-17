import React, { useState } from 'react';
import {
  Building2,
  Shield,
  Server,
  Key,
  HardDrive,
  Activity,
  Lock,
  Ban,
  CheckCircle2,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import { playTone } from './AudioSynthesizer';

export interface TenantNamespace {
  tenantId: string;
  name: string;
  location: string;
  isolationMode: string;
  activeRelease: string;
  keyFingerprint: string;
  quotaCpu: number;
  quotaStorageGb: number;
  maxStorageGb: number;
  monthlyReq: string;
  crossTenantPromotion: 'BLOCKED';
  canonicalWriteAuthority: 'NONE (0 MUTATIONS)';
  status: 'ACTIVE_ISOLATED';
}

export const MultiTenantNamespaceMatrix: React.FC = () => {
  const [selectedTenantId, setSelectedTenantId] = useState<string>('TNT-TH-001');

  const tenants: TenantNamespace[] = [
    {
      tenantId: 'TNT-TH-001',
      name: 'MAEW HOLDINGS CO., LTD. (Sovereign HQ)',
      location: 'Bangkok Sovereign Core (Node-TH-01)',
      isolationMode: 'Sovereign Physical Hardware Isolation',
      activeRelease: 'v2.8.0-GA-SEAL',
      keyFingerprint: '0xTH-990A-F11E-8C2A-4F11',
      quotaCpu: 32,
      quotaStorageGb: 480,
      maxStorageGb: 2000,
      monthlyReq: '142.8M Req/mo',
      crossTenantPromotion: 'BLOCKED',
      canonicalWriteAuthority: 'NONE (0 MUTATIONS)',
      status: 'ACTIVE_ISOLATED',
    },
    {
      tenantId: 'TNT-TH-002',
      name: 'MAEW DIGITAL TWIN DATA LAB (EEC NODE)',
      location: 'Chonburi High-Throughput Datacenter (Node-EEC-02)',
      isolationMode: 'Dedicated Hardware Partition (SR-IOV / PCIe Isolated)',
      activeRelease: 'v2.8.0-GA-SEAL',
      keyFingerprint: '0xTH-EEC-881B-4402-99EA',
      quotaCpu: 48,
      quotaStorageGb: 820,
      maxStorageGb: 4000,
      monthlyReq: '218.4M Req/mo',
      crossTenantPromotion: 'BLOCKED',
      canonicalWriteAuthority: 'NONE (0 MUTATIONS)',
      status: 'ACTIVE_ISOLATED',
    },
    {
      tenantId: 'TNT-TH-003',
      name: 'MAEW FIDUCIARY BANKING CLEARING NODE',
      location: 'Silom Financial High-Frequency Link (Node-BKK-FIN-03)',
      isolationMode: 'Air-Gapped Cryo Vault HSM Partition',
      activeRelease: 'v2.8.0-GA-SEAL',
      keyFingerprint: '0xTH-FIN-771C-3301-11DF',
      quotaCpu: 19,
      quotaStorageGb: 240,
      maxStorageGb: 1000,
      monthlyReq: '64.2M Req/mo',
      crossTenantPromotion: 'BLOCKED',
      canonicalWriteAuthority: 'NONE (0 MUTATIONS)',
      status: 'ACTIVE_ISOLATED',
    },
  ];

  const currentTenant = tenants.find((t) => t.tenantId === selectedTenantId) || tenants[0];

  const handleSelect = (id: string) => {
    setSelectedTenantId(id);
    playTone(680, 0.03);
  };

  return (
    <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#0c1628] via-[#091020] to-[#040812] border-2 border-cyan-500/40 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-400 text-cyan-300 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-cyan-100 font-serif">
                MODULE 3: MULTI-TENANT HARDWARE ISOLATION MATRIX
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold">
                PHYSICAL HARDWARE SILOS
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Strict Tenant Evidence Namespace &bull; Zero Cross-Tenant Leakage &bull; Zero Cross-Tenant Inheritance
            </p>
          </div>
        </div>

        <span className="text-[10px] px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold self-start sm:self-auto">
          CROSS-TENANT INHERITANCE: BLOCKED
        </span>
      </div>

      {/* Tenant Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {tenants.map((t) => {
          const isSelected = t.tenantId === selectedTenantId;
          return (
            <button
              key={t.tenantId}
              onClick={() => handleSelect(t.tenantId)}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 ${
                isSelected
                  ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                  : 'bg-black/60 border-white/10 hover:border-cyan-500/40 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono">{t.tenantId}</span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  {t.status}
                </span>
              </div>
              <div className="text-[11px] font-bold text-cyan-200 truncate">{t.name}</div>
              <div className="text-[10px] text-zinc-400 truncate">{t.location}</div>
            </button>
          );
        })}
      </div>

      {/* Detailed Tenant Inspector */}
      <div className="p-5 rounded-2xl bg-black/70 border border-cyan-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2.5">
            <Server className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              TENANT SILO: {currentTenant.name} ({currentTenant.tenantId})
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold flex items-center gap-1">
              <Ban className="w-3 h-3 text-rose-400" />
              <span>CROSS-TENANT PROMOTION: BLOCKED</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-zinc-900/70 border border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-500 font-bold flex items-center gap-1">
              <Shield className="w-3 h-3 text-cyan-400" />
              ISOLATION MODE
            </div>
            <div className="text-cyan-300 font-bold text-[11px] leading-tight">
              {currentTenant.isolationMode}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/70 border border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-500 font-bold flex items-center gap-1">
              <Key className="w-3 h-3 text-amber-400" />
              KEY FINGERPRINT
            </div>
            <div className="text-amber-300 font-mono font-bold text-[11px] truncate">
              {currentTenant.keyFingerprint}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/70 border border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-500 font-bold flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-purple-400" />
              QUOTA TELEMETRY
            </div>
            <div className="text-purple-300 font-bold text-[11px]">
              {currentTenant.quotaStorageGb} / {currentTenant.maxStorageGb} GB ({currentTenant.monthlyReq})
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/70 border border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-500 font-bold flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" />
              MUTATION AUTHORITY
            </div>
            <div className="text-emerald-400 font-bold text-[11px]">
              {currentTenant.canonicalWriteAuthority}
            </div>
          </div>
        </div>

        {/* Tenant Rule 9 Compliance Banner */}
        <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[10px] text-cyan-200 space-y-1">
          <strong className="text-white">Rule 9 Tenant Isolation Policy Enforced:</strong> Every piece of evidence
          ingested under <span className="font-bold text-cyan-300">`{currentTenant.tenantId}`</span> remains strictly
          bound to its namespace silo. No cross-tenant promotion, no global canonical write, and zero leakage to other
          tenant matrices.
        </div>
      </div>
    </div>
  );
};
