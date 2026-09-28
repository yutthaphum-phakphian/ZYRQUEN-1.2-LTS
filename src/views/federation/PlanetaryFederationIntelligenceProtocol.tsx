/**
 * ZYRQUEN Ω∞ Planetary Federation Intelligence Protocol (Phase 20)
 * Cross-Civilization Intelligence Exchange, Boundary Verification & Sovereign Trust Mesh
 */
import React from 'react';
import { motion } from 'motion/react';
import { Globe, ShieldCheck, Scale, CheckCircle2, Award, Network, ArrowRight } from 'lucide-react';
import { SYSTEM_METADATA } from '../../data/canonicalData';

interface FederationEntity {
  id: string;
  civilization: string;
  constitution: string;
  trustStatus: 'VERIFIED' | 'PENDING' | 'REVOKED';
  membership: 'ACTIVE' | 'IN_REVIEW';
  anchorBlock: string;
}

const FEDERATIONS: FederationEntity[] = [
  {
    id: 'CIV-FED-001',
    civilization: 'ZYRQUEN-CIV-TH (Sovereign Primary)',
    constitution: `v${SYSTEM_METADATA.version} LTS Frozen`,
    trustStatus: 'VERIFIED',
    membership: 'ACTIVE',
    anchorBlock: `#${SYSTEM_METADATA.genesisBlock}`,
  },
  {
    id: 'CIV-FED-002',
    civilization: 'ALLIED-CIV-GLOBAL',
    constitution: 'v1.0 Standard Treaty',
    trustStatus: 'VERIFIED',
    membership: 'ACTIVE',
    anchorBlock: '#849200',
  },
  {
    id: 'CIV-FED-003',
    civilization: 'EXPERIMENTAL-FED-ENCLAVE',
    constitution: 'v0.9 Draft Protocol',
    trustStatus: 'PENDING',
    membership: 'IN_REVIEW',
    anchorBlock: 'PENDING',
  },
];

export const PlanetaryFederationIntelligenceProtocol: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-[#080d1a] border border-cyan-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl sm:text-2xl font-mono font-black text-white">
              Planetary Federation Intelligence Protocol (Phase 20)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-sans">
            โพรโทคอลการแลกเปลี่ยนข่าวกรองและความรู้อธิปไตยข้ามสหพันธรัฐดาวเคราะห์ (Planetary Intelligence Layer)
          </p>
        </div>
      </div>

      {/* Federations Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs text-slate-300">
            <thead className="bg-black/40 text-violet-400 text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-4">Federation ID</th>
                <th className="p-4">Civilization Domain</th>
                <th className="p-4">Constitution Spec</th>
                <th className="p-4">Trust Status</th>
                <th className="p-4">Membership Tier</th>
                <th className="p-4">Anchor Block</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {FEDERATIONS.map((f) => (
                <tr key={f.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-bold text-cyan-300">{f.id}</td>
                  <td className="p-4 font-semibold text-white flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    {f.civilization}
                  </td>
                  <td className="p-4 text-violet-300">{f.constitution}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        f.trustStatus === 'VERIFIED'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-950 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      ● {f.trustStatus}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300">{f.membership}</td>
                  <td className="p-4 text-slate-400 text-[11px]">{f.anchorBlock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Federation Intelligence Exchange Flow */}
      <div className="p-6 rounded-2xl bg-black/80 border border-amber-500/30 text-slate-300 font-mono text-xs shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
          <h3 className="text-sm font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Network className="w-4 h-4 text-amber-400" />
            <span>Federation Intelligence Exchange Flow</span>
          </h3>
          <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
            PQC ENCRYPTED
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 font-mono text-xs leading-relaxed text-slate-200">
          <span className="text-cyan-400 font-bold">Knowledge Request</span>
          <span className="text-slate-500"> → </span>
          <span className="text-violet-400 font-bold">Authority Check</span>
          <span className="text-slate-500"> → </span>
          <span className="text-amber-400 font-bold">Evidence Verification</span>
          <span className="text-slate-500"> → </span>
          <span className="text-emerald-400 font-bold">Privacy Boundary Guard</span>
          <span className="text-slate-500"> → </span>
          <span className="text-sky-400 font-bold">Kyber-1024 Knowledge Exchange</span>
          <span className="text-slate-500"> → </span>
          <span className="text-purple-400 font-bold">Global Ledger Record</span>
        </div>
      </div>
    </div>
  );
};

export default PlanetaryFederationIntelligenceProtocol;
