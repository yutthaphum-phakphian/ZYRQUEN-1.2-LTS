import React, { useState, useMemo } from 'react';
import { SealDetailModal, HardwareUnit } from './SealDetailModal';
import { ShieldCheck, AlertTriangle, Flame, ShieldAlert, Cpu, Activity, RefreshCw } from 'lucide-react';

interface GovernanceHealthHeatmapProps {
  units?: HardwareUnit[];
}

const DEFAULT_SAMPLE_UNITS: HardwareUnit[] = Array.from({ length: 48 }, (_, i) => {
  const chamber = (i % 16) + 1;
  const isQuarantined = i === 13 || i === 29;
  const isDrifted = i === 7 || i === 21 || i === 38;
  const status: HardwareUnit['status'] = isQuarantined ? 'Quarantined' : isDrifted ? 'Drifted' : 'Verified';
  const driftValue = isQuarantined ? 0.0892 : isDrifted ? 0.0412 : (i * 0.00017) % 0.003;

  return {
    id: `NODE-${String(i + 1).padStart(3, '0')}`,
    serialNumber: `ZYR-HSM-Q${chamber}-${(1000 + i).toString(16).toUpperCase()}`,
    status,
    lastAudit: new Date(Date.now() - (i * 1234567)).toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
    signature: `0x${Array.from({ length: 32 }, (_, k) => ((i * 37 + k * 19) % 256).toString(16).padStart(2, '0')).join('')}`,
    enclaveHash: `0x${Array.from({ length: 32 }, (_, k) => ((i * 53 + k * 23) % 256).toString(16).padStart(2, '0')).join('')}`,
    firmwareVersion: `v2.4.${(i % 5) + 1}-fips-l4`,
    driftValue,
  };
});

export const GovernanceHealthHeatmap: React.FC<GovernanceHealthHeatmapProps> = ({ units = DEFAULT_SAMPLE_UNITS }) => {
  const [selectedUnit, setSelectedUnit] = useState<HardwareUnit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'Verified' | 'Drifted' | 'Quarantined'>('ALL');

  const counts = useMemo(() => {
    return units.reduce(
      (acc, unit) => {
        acc[unit.status] = (acc[unit.status] || 0) + 1;
        return acc;
      },
      { Verified: 0, Drifted: 0, Quarantined: 0 } as Record<HardwareUnit['status'], number>
    );
  }, [units]);

  const filteredUnits = useMemo(() => {
    if (activeFilter === 'ALL') return units;
    return units.filter((u) => u.status === activeFilter);
  }, [units, activeFilter]);

  const handleSelectUnit = (unit: HardwareUnit) => {
    setSelectedUnit(unit);
    setIsModalOpen(true);
  };

  const getStatusColor = (status: HardwareUnit['status']) => {
    switch (status) {
      case 'Verified':
        return 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400 hover:bg-emerald-900/80 hover:border-emerald-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]';
      case 'Drifted':
        return 'bg-amber-950/80 border-amber-500/50 text-amber-400 hover:bg-amber-900/80 hover:border-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]';
      case 'Quarantined':
        return 'bg-rose-950/80 border-rose-500/50 text-rose-400 hover:bg-rose-900/80 hover:border-rose-400 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)]';
    }
  };

  return (
    <div className="relative w-full bg-slate-950 border border-slate-800 rounded-lg p-6 font-mono text-slate-100 shadow-2xl">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold tracking-wider uppercase text-slate-200">
              GOVERNANCE HEALTH MATRIX // HARDWARE HSM TOPOLOGY
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            48-Node Sub-Kelvin Cryogenic Enclaves & Cryptographic Consensus Seal Health
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-md text-xs">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeFilter === 'ALL' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ALL ({units.length})
          </button>
          <button
            onClick={() => setActiveFilter('Verified')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeFilter === 'Verified' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            VERIFIED ({counts.Verified})
          </button>
          <button
            onClick={() => setActiveFilter('Drifted')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeFilter === 'Drifted' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            DRIFTED ({counts.Drifted})
          </button>
          <button
            onClick={() => setActiveFilter('Quarantined')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeFilter === 'Quarantined' ? 'bg-rose-500/20 text-rose-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            QUARANTINED ({counts.Quarantined})
          </button>
        </div>
      </div>

      {/* Grid of Hardware Units */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2.5 mb-16">
        {filteredUnits.map((unit) => (
          <button
            key={unit.id}
            onClick={() => handleSelectUnit(unit)}
            className={`relative group aspect-square flex flex-col items-center justify-center p-1 rounded border transition-all duration-200 cursor-pointer ${getStatusColor(
              unit.status
            )}`}
            title={`${unit.id} (${unit.serialNumber}) - Status: ${unit.status} - Drift: ${unit.driftValue.toFixed(4)}`}
          >
            <span className="text-[10px] font-bold tracking-tight">{unit.id.replace('NODE-', '#')}</span>
            <span className="text-[8px] opacity-75 font-mono">
              {unit.status === 'Verified' ? 'OK' : unit.status === 'Drifted' ? 'DRIFT' : 'HALT'}
            </span>

            {/* Micro Indicator Dot */}
            <span
              className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${
                unit.status === 'Verified' ? 'bg-emerald-400' : unit.status === 'Drifted' ? 'bg-amber-400' : 'bg-rose-400 animate-ping'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Floating Status Distribution Legend Overlay (Pinned to Bottom-Right) */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-3 px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-lg shadow-xl backdrop-blur-md text-xs">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300 font-semibold">{counts.Verified}</span>
          <span className="text-slate-500 text-[10px]">VERIFIED</span>
        </div>

        <div className="w-px h-3.5 bg-slate-700" />

        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="text-slate-300 font-semibold">{counts.Drifted}</span>
          <span className="text-slate-500 text-[10px]">DRIFTED</span>
        </div>

        <div className="w-px h-3.5 bg-slate-700" />

        <div className="flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-rose-400" />
          <span className="text-slate-300 font-semibold">{counts.Quarantined}</span>
          <span className="text-slate-500 text-[10px]">QUARANTINED</span>
        </div>
      </div>

      {/* Forensic Seal Detail Modal */}
      <SealDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        unit={selectedUnit}
      />
    </div>
  );
};
