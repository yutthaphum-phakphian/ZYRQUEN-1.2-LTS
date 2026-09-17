import React, { useState, useMemo } from 'react';
import { generateTenants, Tenant } from '../data/sovereignData';

interface Props {
  onSelectTenant?: (tenant: Tenant) => void;
}

export const TenantPartition: React.FC<Props> = ({ onSelectTenant }) => {
  const tenants = useMemo(() => generateTenants(), []);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return tenants;
    return tenants.filter(t => 
      t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.merkleLeaf.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tenants, searchTerm]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const displayed = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleTenantClick = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    if (onSelectTenant) onSelectTenant(tenant);
  };

  return (
    <section id="tenants-partition-section" className="bg-[#0a0f1e] border border-[#17233f] p-4 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#17233f] pb-3 mb-4 gap-2">
        <div>
          <h2 className="text-sm font-bold text-[#D4AF37] flex items-center gap-2">
            <span>🌐</span> PARTITION Ω600_1000 (400 TENANTS LOCKED)
          </h2>
          <p className="text-xs text-[#9CA3AF] mt-0.5 font-mono">
            Boundary: Ω601-Ω1000 Strict | Partition Alias: Ω600_1000 | 400 Tenants Immutable
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="tenant-search-input"
            type="text"
            placeholder="Search Ω601..Ω1000"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="bg-[#070a12] border border-[#17233f] px-3 py-1 text-xs font-mono text-[#F3F4F6] focus:border-[#D4AF37] focus:outline-none placeholder-[#9CA3AF]"
          />
          <span className="text-xs font-mono px-2 py-1 bg-[#070a12] border border-[#06B6D4] text-[#06B6D4]">
            {filtered.length} Tenants
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#17233f] text-[#9CA3AF] bg-[#070a12]">
              <th className="p-2">TENANT CODE</th>
              <th className="p-2">PARTITION</th>
              <th className="p-2">SEAL INDEX</th>
              <th className="p-2">MERKLE LEAF HASH</th>
              <th className="p-2">ALLOCATION VALUE</th>
              <th className="p-2">STATUS</th>
              <th className="p-2 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((t) => {
              const isSelected = selectedTenant?.id === t.id;
              return (
                <tr
                  key={t.id}
                  id={`tenant-row-${t.code}`}
                  className={`border-b border-[#17233f] hover:bg-[#070a12] transition-colors ${
                    isSelected ? 'bg-[#070a12] border-l-2 border-l-[#D4AF37]' : ''
                  }`}
                >
                  <td className="p-2 font-bold text-[#D4AF37]">{t.code}</td>
                  <td className="p-2 text-[#06B6D4]">Ω600_1000</td>
                  <td className="p-2 text-[#9CA3AF]">#{t.sealIndex} / 14,902</td>
                  <td className="p-2 text-[#F3F4F6]">{t.merkleLeaf}</td>
                  <td className="p-2 text-[#10B981] font-bold">{t.allocatedValue}</td>
                  <td className="p-2">
                    <span className="px-1.5 py-0.5 bg-[#070a12] border border-[#10B981] text-[#10B981] text-[10px]">
                      ● {t.status}
                    </span>
                  </td>
                  <td className="p-2 text-right">
                    <button
                      id={`inspect-tenant-btn-${t.code}`}
                      onClick={() => handleTenantClick(t)}
                      className="px-2 py-0.5 border border-[#17233f] hover:border-[#D4AF37] text-[11px] text-[#F3F4F6] bg-[#0a0f1e]"
                    >
                      INSPECT
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3 font-mono text-xs text-[#9CA3AF]">
        <div>
          Showing page {page} of {totalPages || 1} (Partition: <span className="text-[#06B6D4]">Ω600_1000</span>)
        </div>
        <div className="flex gap-2">
          <button
            id="prev-page-btn"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-3 py-1 bg-[#070a12] border border-[#17233f] text-[#F3F4F6] disabled:opacity-30 hover:border-[#D4AF37]"
          >
            PREV
          </button>
          <button
            id="next-page-btn"
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="px-3 py-1 bg-[#070a12] border border-[#17233f] text-[#F3F4F6] disabled:opacity-30 hover:border-[#D4AF37]"
          >
            NEXT
          </button>
        </div>
      </div>

      {selectedTenant && (
        <div id="tenant-details-box" className="mt-4 p-3 bg-[#070a12] border border-[#06B6D4] text-xs font-mono">
          <div className="flex justify-between items-center text-[#06B6D4] font-bold mb-2">
            <span># TENANT DOSSIER: {selectedTenant.code} ({selectedTenant.partition})</span>
            <button
              id="close-tenant-details"
              onClick={() => setSelectedTenant(null)}
              className="text-[#9CA3AF] hover:text-[#D4AF37]"
            >
              ✕ CLOSE
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[#9CA3AF]">
            <div>Assigned Partition: <span className="text-[#D4AF37]">Ω600_1000 (Boundary Strict)</span></div>
            <div>Canonical Seal Index: <span className="text-[#F3F4F6]">#{selectedTenant.sealIndex} of 14,902</span></div>
            <div>Merkle Leaf Hash: <span className="text-[#06B6D4]">{selectedTenant.merkleLeaf}</span></div>
            <div>Sovereign Collateral: <span className="text-[#10B981]">{selectedTenant.allocatedValue}</span></div>
            <div>Vault Status: <span className="text-[#10B981]">LOCKED & AUDITED</span></div>
            <div>Principal Anchor: <span className="text-[#F3F4F6]">#EP-SOVEREIGN-01</span></div>
          </div>
        </div>
      )}
    </section>
  );
};
