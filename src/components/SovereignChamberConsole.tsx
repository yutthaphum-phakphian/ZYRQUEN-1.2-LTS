import React, { useState, useMemo, useCallback } from 'react';
import { ChamberSparkline } from './ChamberSparkline';
import { playAuditChime, playTone } from './AudioSynthesizer';

export type ChamberStatus = 'stable' | 'unstable' | 'recalibrating';

export interface Chamber {
  id: string;
  name: string;
  status: ChamberStatus;
  coherenceScore: number; // 0 - 100%
  historicalStabilityIndex: number; // 0.0 - 1.0
  coherenceTrend24h: number[]; // ข้อมูล 24 ชั่วโมง
  currentTemp: number;
}

export type SortOption =
  | 'coherence_desc'
  | 'coherence_asc'
  | 'stability_desc'
  | 'stability_asc'
  | 'id_asc';

const INITIAL_CHAMBERS: Chamber[] = [
  {
    id: 'CHAMBER-01',
    name: 'Cryo-Vault Alpha',
    status: 'stable',
    coherenceScore: 99.4,
    historicalStabilityIndex: 0.99,
    coherenceTrend24h: [98.2, 98.5, 99.0, 99.1, 99.3, 99.4],
    currentTemp: -195.2
  },
  {
    id: 'CHAMBER-02',
    name: 'Threat Isolation Escrow',
    status: 'unstable',
    coherenceScore: 71.2,
    historicalStabilityIndex: 0.74,
    coherenceTrend24h: [94.0, 88.5, 82.1, 78.0, 74.2, 71.2],
    currentTemp: -182.4
  },
  {
    id: 'CHAMBER-03',
    name: 'Thermal Resonance Array',
    status: 'stable',
    coherenceScore: 96.8,
    historicalStabilityIndex: 0.95,
    coherenceTrend24h: [95.0, 95.8, 96.2, 96.5, 96.6, 96.8],
    currentTemp: -192.1
  },
  {
    id: 'CHAMBER-04',
    name: 'Quantum Core Delta',
    status: 'unstable',
    coherenceScore: 64.5,
    historicalStabilityIndex: 0.68,
    coherenceTrend24h: [88.0, 80.2, 75.1, 71.0, 68.3, 64.5],
    currentTemp: -178.9
  },
  {
    id: 'CHAMBER-05',
    name: '6-Stage DAG Execution Engine',
    status: 'stable',
    coherenceScore: 99.1,
    historicalStabilityIndex: 0.98,
    coherenceTrend24h: [97.5, 98.0, 98.4, 98.9, 99.0, 99.1],
    currentTemp: -194.8
  },
  {
    id: 'CHAMBER-06',
    name: 'Circuit Breaker Fail-Closed Defense',
    status: 'stable',
    coherenceScore: 98.9,
    historicalStabilityIndex: 0.97,
    coherenceTrend24h: [98.0, 98.2, 98.5, 98.6, 98.8, 98.9],
    currentTemp: -193.4
  },
  {
    id: 'CHAMBER-07',
    name: 'Quantum Continuum Phoenix Auto-Healing',
    status: 'stable',
    coherenceScore: 99.7,
    historicalStabilityIndex: 0.99,
    coherenceTrend24h: [99.0, 99.2, 99.4, 99.5, 99.6, 99.7],
    currentTemp: -196.1
  },
  {
    id: 'CHAMBER-08',
    name: 'Merkle Tree SSoT Verifier',
    status: 'stable',
    coherenceScore: 99.9,
    historicalStabilityIndex: 1.00,
    coherenceTrend24h: [99.8, 99.8, 99.9, 99.9, 99.9, 99.9],
    currentTemp: -197.0
  }
];

export const SovereignChamberConsole: React.FC = () => {
  const [chambers, setChambers] = useState<Chamber[]>(INITIAL_CHAMBERS);
  const [sortOption, setSortOption] = useState<SortOption>('coherence_desc');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // นับจำนวน Chamber ที่อยู่ในสถานะ unstable
  const unstableCount = useMemo(
    () => chambers.filter((c) => c.status === 'unstable').length,
    [chambers]
  );

  // ระบบเรียงลำดับ Grid ตามเงื่อนไขที่เลือก
  const sortedChambers = useMemo(() => {
    return [...chambers].sort((a, b) => {
      switch (sortOption) {
        case 'coherence_desc':
          return b.coherenceScore - a.coherenceScore;
        case 'coherence_asc':
          return a.coherenceScore - b.coherenceScore;
        case 'stability_desc':
          return b.historicalStabilityIndex - a.historicalStabilityIndex;
        case 'stability_asc':
          return a.historicalStabilityIndex - b.historicalStabilityIndex;
        case 'id_asc':
        default:
          return a.id.localeCompare(b.id);
      }
    });
  }, [chambers, sortOption]);

  // ระบบ Batch Recalibration พร้อมการจำลองหน่วงเวลา Hardware Sync 2.5 วินาที
  const handleBatchRecalibrate = useCallback(() => {
    if (unstableCount === 0 || isSyncing) return;

    setIsSyncing(true);
    try {
      playTone(520, 0.1, 'sawtooth');
    } catch {}

    // ขั้นที่ 1: เปลี่ยนสถานะ unstable -> recalibrating ทันที
    setChambers((prev) =>
      prev.map((c) => (c.status === 'unstable' ? { ...c, status: 'recalibrating' } : c))
    );

    // ขั้นที่ 2: หน่วงเวลา 2.5 วินาที (2500ms) แล้วปรับสถานะ recalibrating -> stable
    setTimeout(() => {
      setChambers((prev) =>
        prev.map((c) => {
          if (c.status === 'recalibrating') {
            const restoredCoherence = 98.8;
            return {
              ...c,
              status: 'stable',
              coherenceScore: restoredCoherence,
              coherenceTrend24h: [...c.coherenceTrend24h.slice(1), restoredCoherence]
            };
          }
          return c;
        })
      );
      setIsSyncing(false);
      try {
        playAuditChime();
      } catch {}
    }, 2500);
  }, [unstableCount, isSyncing]);

  return (
    <div className="w-full bg-gray-950 p-4 sm:p-6 rounded-xl border border-gray-900 text-gray-100 space-y-5">
      {/* แถบควบคุม Control Plane */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-gray-900/90 p-3 sm:p-4 rounded-lg border border-gray-800 gap-3 sm:gap-4">
        {/* เมนูเลือกการเรียงลำดับ */}
        <div className="flex items-center gap-2.5">
          <label htmlFor="sort-select" className="text-xs font-semibold text-gray-300 whitespace-nowrap">
            Sort Grid By:
          </label>
          <select
            id="sort-select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="bg-gray-950 text-gray-200 border border-gray-700 text-xs font-mono rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="coherence_desc">Coherence Score (Highest First)</option>
            <option value="coherence_asc">Coherence Score (Lowest First)</option>
            <option value="stability_desc">Historical Stability (Most Stable First)</option>
            <option value="stability_asc">Historical Stability (Least Stable First)</option>
            <option value="id_asc">Chamber ID (Ascending)</option>
          </select>
        </div>

        {/* ปุ่ม Restore All Unstable */}
        <button
          type="button"
          onClick={handleBatchRecalibrate}
          disabled={unstableCount === 0 || isSyncing}
          className={`btn-compact cursor-pointer justify-center ${
            isSyncing
              ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
              : unstableCount > 0
              ? 'bg-amber-600/20 border-amber-500/80 text-amber-300 hover:bg-amber-600/30 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
              : 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed opacity-60'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isSyncing
                ? 'bg-cyan-400 animate-ping'
                : unstableCount > 0
                ? 'bg-amber-400 animate-pulse'
                : 'bg-gray-600'
            }`}
          />
          {isSyncing
            ? 'Hardware Syncing (2.5s)...'
            : `Restore All Unstable (${unstableCount})`}
        </button>
      </div>

      {/* Grid แสดงผลการ์ด Chamber */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {sortedChambers.map((chamber) => {
          const isUnstable = chamber.status === 'unstable';
          const isRecalibrating = chamber.status === 'recalibrating';

          // กำหนดสไตล์แอนิเมชัน Pulse และสี Badge ตามสถานะการเปลี่ยนผ่าน
          let cardStyle = 'border-gray-800 bg-gray-900/90 hover:border-gray-700';
          let badgeStyle = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60';
          let sparklineColor = '#34D399'; // Emerald

          if (isUnstable) {
            cardStyle =
              'border-amber-500/80 bg-gray-900/90 shadow-[0_0_16px_rgba(245,158,11,0.2)] animate-pulse';
            badgeStyle =
              'bg-amber-950/90 text-amber-300 border-amber-500/80 animate-pulse';
            sparklineColor = '#F59E0B'; // Amber
          } else if (isRecalibrating) {
            cardStyle =
              'border-cyan-500/80 bg-gray-900/90 shadow-[0_0_16px_rgba(6,182,212,0.25)] animate-pulse';
            badgeStyle =
              'bg-cyan-950/90 text-cyan-300 border-cyan-500/80 animate-pulse';
            sparklineColor = '#06B6D4'; // Cyan
          }

          return (
            <div
              key={chamber.id}
              className={`p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between ${cardStyle}`}
            >
              {/* แถบบน: ชื่อ Chamber และ Badge แสดงสถานะ */}
              <div className="flex justify-between items-start mb-2.5 gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-gray-500 tracking-wider block">
                    {chamber.id}
                  </span>
                  <h3 className="text-sm font-bold text-white truncate" title={chamber.name}>
                    {chamber.name}
                  </h3>
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full border shrink-0 ${badgeStyle}`}
                >
                  {chamber.status.toUpperCase()}
                </span>
              </div>

              {/* กราฟ Sparkline ย่อยย้อนหลัง 24 ชั่วโมง */}
              <div className="my-3 flex items-center justify-between bg-black/40 p-2.5 rounded-lg border border-gray-800/80">
                <div>
                  <span className="text-[9px] font-mono text-gray-400 block tracking-wider">
                    24H COHERENCE
                  </span>
                  <span className="text-xs font-mono font-bold text-gray-200">
                    {chamber.coherenceScore.toFixed(1)}%
                  </span>
                </div>
                <ChamberSparkline
                  data={chamber.coherenceTrend24h}
                  color={sparklineColor}
                />
              </div>

              {/* รายละเอียดดรรชนีความเสถียร */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-gray-800">
                <div>
                  <span className="text-gray-500 block text-[10px]">STABILITY</span>
                  <span className="text-gray-200 font-semibold">
                    {(chamber.historicalStabilityIndex * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-500 block text-[10px]">TEMP</span>
                  <span className="text-gray-200 font-semibold">
                    {chamber.currentTemp.toFixed(1)}°C
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SovereignChamberConsole;
