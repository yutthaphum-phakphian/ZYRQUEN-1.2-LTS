import React from 'react';
import { SOVEREIGN_CONFIG } from '../data/sovereignData';

export const TreasuryDossier: React.FC = () => {
  return (
    <section id="treasury-dossier-section" className="bg-[#0a0f1e] border border-[#17233f] p-4 mb-8">
      <div className="flex items-center justify-between border-b border-[#17233f] pb-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-[#D4AF37] flex items-center gap-2">
            <span>💰</span> CHAMBERS 10 & 11: TREASURY & COURT DOSSIER (4.23B THB)
          </h2>
          <p className="text-xs text-[#9CA3AF] mt-0.5 font-mono">
            PDPA มาตรา 9, 26, 28 + ETDA Sec 9, 26, 28 Safe Harbor | Certificate ZQ-GOLD-DEP-849202-3908
          </p>
        </div>
        <span className="text-xs font-mono px-2 py-1 bg-[#070a12] border border-[#D4AF37] text-[#D4AF37]">
          VAULT SEALED
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 font-mono text-xs">
        <div className="p-3 bg-[#070a12] border border-[#17233f]">
          <div className="text-[#9CA3AF]">TOTAL VALUATION</div>
          <div className="text-lg font-bold text-[#D4AF37] mt-1">{SOVEREIGN_CONFIG.treasury.fiatThbTotal}</div>
          <div className="text-[10px] text-[#06B6D4] mt-1">Sovereign Net Worth</div>
        </div>
        <div className="p-3 bg-[#070a12] border border-[#17233f]">
          <div className="text-[#9CA3AF]">LIQUID FIAT RESERVE</div>
          <div className="text-lg font-bold text-[#10B981] mt-1">{SOVEREIGN_CONFIG.treasury.fiatLiquid}</div>
          <div className="text-[10px] text-[#9CA3AF] mt-1">Unencumbered Capital</div>
        </div>
        <div className="p-3 bg-[#070a12] border border-[#17233f]">
          <div className="text-[#9CA3AF]">GOLD BULLION (XAU)</div>
          <div className="text-lg font-bold text-[#D4AF37] mt-1">{SOVEREIGN_CONFIG.treasury.goldXauOz}</div>
          <div className="text-[10px] text-[#9CA3AF] mt-1">1:1 Seal Backed</div>
        </div>
        <div className="p-3 bg-[#070a12] border border-[#17233f]">
          <div className="text-[#9CA3AF]">RWA REAL-WORLD ASSETS</div>
          <div className="text-lg font-bold text-[#06B6D4] mt-1">{SOVEREIGN_CONFIG.treasury.rwaTenants}</div>
          <div className="text-[10px] text-[#9CA3AF] mt-1">Partition Ω600_1000</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
        <div className="p-3 bg-[#070a12] border border-[#17233f]">
          <div className="text-[#D4AF37] font-bold mb-2 flex items-center gap-1.5">
            <span>📑</span> COURT DOSSIER & LEGAL SAFE HARBOR
          </div>
          <div className="space-y-1.5 text-[#9CA3AF]">
            <div className="flex justify-between border-b border-[#17233f] pb-1">
              <span>Certificate ID:</span>
              <span className="text-[#F3F4F6]">{SOVEREIGN_CONFIG.attestationCert}</span>
            </div>
            <div className="flex justify-between border-b border-[#17233f] pb-1">
              <span>Sovereign Architect:</span>
              <span className="text-[#F3F4F6]">{SOVEREIGN_CONFIG.principal}</span>
            </div>
            <div className="flex justify-between border-b border-[#17233f] pb-1">
              <span>Principal ID:</span>
              <span className="text-[#D4AF37]">{SOVEREIGN_CONFIG.principalId}</span>
            </div>
            <div className="flex justify-between border-b border-[#17233f] pb-1">
              <span>Clearance Level:</span>
              <span className="text-[#10B981]">{SOVEREIGN_CONFIG.clearance}</span>
            </div>
            <div className="flex justify-between">
              <span>Mutation Authority:</span>
              <span className="text-[#06B6D4]">{SOVEREIGN_CONFIG.mutationAuthority}</span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-[#070a12] border border-[#17233f]">
          <div className="text-[#06B6D4] font-bold mb-2 flex items-center gap-1.5">
            <span>⚖️</span> STATUTORY COMPLIANCE (TH-PDPA & ETDA)
          </div>
          <div className="space-y-1.5 text-[#9CA3AF]">
            <div className="flex justify-between border-b border-[#17233f] pb-1">
              <span>PDPA กฎหมายหลัก:</span>
              <span className="text-[#F3F4F6]">มาตรา 9, 26, 28</span>
            </div>
            <div className="flex justify-between border-b border-[#17233f] pb-1">
              <span>ETDA กฎหมายดิจิทัล:</span>
              <span className="text-[#F3F4F6]">Section 9, 26, 28 Safe Harbor</span>
            </div>
            <div className="flex justify-between border-b border-[#17233f] pb-1">
              <span>PQC Post-Quantum:</span>
              <span className="text-[#10B981]">FIPS 203 / 204 / 205</span>
            </div>
            <div className="flex justify-between border-b border-[#17233f] pb-1">
              <span>Air-Gap Status:</span>
              <span className="text-[#F3F4F6]">No External Hyperlinks</span>
            </div>
            <div className="flex justify-between">
              <span>Tenants Bound:</span>
              <span className="text-[#D4AF37]">Ω600_1000 (400 Tenants)</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
