import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  Shield,
  Key,
  Lock,
  Ban,
  CheckCircle2,
  Users,
  Server,
  Fingerprint,
  RefreshCw,
  FileCheck2,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Radio
} from 'lucide-react';
import {
  identityFederationService,
  FEDERATED_TENANTS,
  FederatedTenantOrganization,
  FederatedUserSession,
} from '../../services/identityFederationService';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { CANONICAL_GENESIS_BLOCK, CANONICAL_MERKLE_ROOT } from '../../data/canonicalData';

export const SovereignIdentityFederation: React.FC = () => {
  const [activeTenant, setActiveTenant] = useState<FederatedTenantOrganization>(() =>
    identityFederationService.getActiveTenant()
  );
  const [currentSession, setCurrentSession] = useState<FederatedUserSession | null>(() =>
    identityFederationService.getSession()
  );
  const [isSwitching, setIsSwitching] = useState(false);
  const [simulatedEvidenceCheck, setSimulatedEvidenceCheck] = useState<{
    evidenceId: string;
    targetTenant: string;
    result: 'ISOLATED_MATCH' | 'CROSS_TENANT_BLOCKED' | null;
  }>({ evidenceId: '', targetTenant: '', result: null });

  useEffect(() => {
    const unsub = identityFederationService.subscribe((session) => {
      setCurrentSession(session);
      setActiveTenant(identityFederationService.getActiveTenant());
    });
    return () => unsub();
  }, []);

  const handleSelectTenant = (tenantId: string) => {
    if (tenantId === activeTenant.tenantId) return;
    playTone(640, 0.05, 'sine');
    setIsSwitching(true);

    setTimeout(() => {
      playAuditChime();
      const newSession = identityFederationService.switchTenant(tenantId);
      setActiveTenant(identityFederationService.getActiveTenant());
      setCurrentSession(newSession);
      setIsSwitching(false);
    }, 400);
  };

  const handleTestIsolation = (targetTenantId: string) => {
    const isAllowed = identityFederationService.verifyTenantEvidenceIsolation(
      'EVD-TEST-001',
      targetTenantId
    );
    playTone(isAllowed ? 700 : 320, 0.1, isAllowed ? 'sine' : 'sawtooth');
    setSimulatedEvidenceCheck({
      evidenceId: `EVD-${targetTenantId.split('-')[1]}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      targetTenant: targetTenantId,
      result: isAllowed ? 'ISOLATED_MATCH' : 'CROSS_TENANT_BLOCKED',
    });
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-cyan-950/30 to-[#070914] border border-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.15)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.3)] shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-mono">
                Phase 14: Sovereign Identity Federation &amp; Multi-Tenant Auth
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                MULTI-TENANT SILO
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Firebase Auth Federation ↔ Dilithium-5 Cryptographic Silos ↔ ETDA Sec 9/26/28 &amp; PDPA Sec 37
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-black/60 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Cross-Tenant Inheritance: STRICTLY BLOCKED</span>
          </span>
        </div>
      </div>

      {/* Tenant Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {FEDERATED_TENANTS.map((tenant) => {
          const isSelected = tenant.tenantId === activeTenant.tenantId;
          return (
            <button
              key={tenant.tenantId}
              onClick={() => handleSelectTenant(tenant.tenantId)}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-b from-indigo-950/80 to-[#0c1228] border-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.3)]'
                  : 'bg-[#080B18] border-white/10 hover:border-indigo-500/40 opacity-80 hover:opacity-100'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-indigo-300">{tenant.tenantId}</span>
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                      tenant.securityClearance === 'TOP_SECRET_SOVEREIGN'
                        ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                        : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
                    }`}
                  >
                    {tenant.securityClearance}
                  </span>
                </div>
                <div className="text-xs font-bold text-white mt-1.5 truncate">{tenant.name}</div>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate">{tenant.domain}</div>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono">
                <span className="text-zinc-500">{tenant.totalSealsAnchored.toLocaleString()} Seals</span>
                <span className="text-emerald-400 font-bold">{tenant.activeUsersCount} Users Active</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Tenant Security & Cryptographic Isolation Inspection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Active Cryptographic Silo Session */}
        <div className="lg:col-span-7 bg-[#070914] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2 font-mono">
              <Server className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                ACTIVE FEDERATED SESSION: {activeTenant.tenantId}
              </h4>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              {currentSession?.role}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#0B0F20] border border-white/5 space-y-1">
              <span className="text-[10px] text-zinc-500 block">AUTHENTICATED PRINCIPAL</span>
              <span className="font-bold text-zinc-200 truncate block">{currentSession?.displayName}</span>
              <span className="text-[10px] text-cyan-400">{currentSession?.email}</span>
            </div>

            <div className="p-3 rounded-xl bg-[#0B0F20] border border-white/5 space-y-1">
              <span className="text-[10px] text-zinc-500 block">ISOLATION ENCLAVE</span>
              <span className="font-bold text-zinc-200 truncate block">{activeTenant.isolationEnclave}</span>
              <span className="text-[10px] text-indigo-300">Prefix: {activeTenant.evidencePrefix}-*</span>
            </div>

            <div className="p-3 rounded-xl bg-[#0B0F20] border border-white/5 space-y-1">
              <span className="text-[10px] text-zinc-500 block">KEY FINGERPRINT (FIPS 204)</span>
              <span className="font-bold text-amber-300 text-[11px] truncate block font-mono">
                {activeTenant.keyFingerprint}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#0B0F20] border border-white/5 space-y-1">
              <span className="text-[10px] text-zinc-500 block">ETDA LEGAL CLEARANCE</span>
              <span className="font-bold text-emerald-400 block">{currentSession?.etdaComplianceLevel}</span>
              <span className="text-[10px] text-zinc-400">Zero Cross-Tenant Leakage</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-black/60 border border-indigo-500/30 font-mono text-[11px] space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-zinc-400">
              <span>FIPS 204 PQC SESSION TOKEN</span>
              <span className="text-emerald-400 font-bold">EXPIRES T+8H</span>
            </div>
            <div className="text-cyan-300 break-all select-all font-mono text-[10px] bg-zinc-950/80 p-2 rounded-lg border border-white/5">
              {currentSession?.sessionTokenPqc}
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Cross-Tenant Cryptographic Silo Verification Test */}
        <div className="lg:col-span-5 bg-[#070914] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 font-mono">
            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Evidence Silo Isolation Test</span>
            </h4>
            <span className="text-[10px] text-zinc-500">ABAC Gate</span>
          </div>

          <p className="text-xs text-zinc-400 font-mono leading-relaxed">
            ทดสอบการแยกโดเมนพยานหลักฐาน (Cryptographic Siloing) เพื่อพิสูจน์ว่าผู้ใช้ในสังกัด{' '}
            <strong className="text-indigo-300">{activeTenant.tenantId}</strong> ไม่สามารถเข้าถึงหรือข้ามสายงานไปยัง
            Tenant อื่นได้ตามกฎหมาย PDPA มาตรา ๓๗
          </p>

          <div className="space-y-2 font-mono text-xs">
            <div className="text-[10px] font-bold text-zinc-500 uppercase">Simulate Evidence Access Across Tenants:</div>
            <div className="grid grid-cols-2 gap-2">
              {FEDERATED_TENANTS.map((t) => (
                <button
                  key={t.tenantId}
                  onClick={() => handleTestIsolation(t.tenantId)}
                  className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-indigo-400/50 text-left transition cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-zinc-200">{t.tenantId}</div>
                  <div className="text-[9px] text-zinc-500 truncate">{t.name.split(' ')[0]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Test Feedback Result */}
          {simulatedEvidenceCheck.result && (
            <div
              className={`p-3 rounded-xl border font-mono text-xs space-y-1 ${
                simulatedEvidenceCheck.result === 'ISOLATED_MATCH'
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-[11px]">
                <span>{simulatedEvidenceCheck.evidenceId}</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-black/40">
                  {simulatedEvidenceCheck.result}
                </span>
              </div>
              <p className="text-[10px] leading-snug">
                {simulatedEvidenceCheck.result === 'ISOLATED_MATCH'
                  ? `✅ สิทธิ์เข้าถึงถูกต้อง: สังกัดตรงกับ Active Silo (${simulatedEvidenceCheck.targetTenant}) สามารถอ่านสำนวนพยานหลักฐานได้สมบูรณ์.`
                  : `🛑 ปฏิเสธการเข้าถึง (Access Denied): สังกัดเป้าหมาย (${simulatedEvidenceCheck.targetTenant}) ขัดแย้งกับ Active Silo (${activeTenant.tenantId}). ห้าม Cross-Tenant Leakage เด็ดขาด.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SovereignIdentityFederation;
