import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { ChamberSparkline, Sparkline } from './ChamberSparkline';
import { CoherenceGauge } from './CoherenceGauge';
import { playAuditChime, playTone } from './AudioSynthesizer';

export { Sparkline };

export interface CryoChamber {
  id: number;
  chamberId: string;
  name: string;
  coherence: number;
  coherenceTrend: string;
  temperature: number;
  status: string;
  merkleHash: string;
  lastSync: string;
  history24h: number[];
}

export type SortCriterion = 'coherence_desc' | 'coherence_asc' | 'temp_desc' | 'sync_desc';

export function playUnstableEventChime(force?: boolean): void {
  try {
    playTone(440, 0.15, 'triangle');
  } catch {}
}

export function generateForensicBatchPDF(chambers?: CryoChamber[]): void {
  // Batch PDF Forensic Export helper
}

export type ChamberStatus = 'stable' | 'unstable' | 'recalibrating';

export interface Chamber {
  id: string;
  name: string;
  status: ChamberStatus;
  coherenceScore: number; // 0 - 100%
  historicalStabilityIndex: number; // 0.0 - 1.0
  coherenceTrend24h: number[];
  currentTemp: number;
}

export type SortOption =
  | 'coherence_desc'
  | 'coherence_asc'
  | 'stability_desc'
  | 'stability_asc'
  | 'id_asc';

export type ConsoleTab = 'grid' | 'historical';

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
  const [activeTab, setActiveTab] = useState<ConsoleTab>('grid');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Request browser notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  /**
   * Triggers a browser notification when a chamber degrades to 'unstable'
   */
  const triggerUnstableNotification = useCallback((chamberName: string, id: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`⚠️ Sovereign Chamber Alert: ${id}`, {
          body: `${chamberName} has entered UNSTABLE state. Potential coherence loss detected!`,
          icon: '/favicon.ico'
        });
      } catch (err) {
        console.warn('Browser Notification error:', err);
      }
    }
  }, []);

  // Monitor status changes and fire browser notifications for unstable transitions
  useEffect(() => {
    chambers.forEach((c) => {
      if (c.status === 'unstable') {
        triggerUnstableNotification(c.name, c.id);
      }
    });
  }, [chambers, triggerUnstableNotification]);

  const unstableCount = useMemo(
    () => chambers.filter((c) => c.status === 'unstable').length,
    [chambers]
  );

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

  // Recharts payload format for Historical Stability Index degradation analysis
  const historicalChartData = useMemo(() => {
    return chambers.map((c) => ({
      chamberId: c.id,
      name: c.name,
      stabilityIndexPercentage: Number((c.historicalStabilityIndex * 100).toFixed(1)),
      coherenceScore: c.coherenceScore
    }));
  }, [chambers]);

  const handleBatchRecalibrate = useCallback(() => {
    if (unstableCount === 0 || isSyncing) return;

    setIsSyncing(true);
    try {
      playTone(520, 0.1, 'sawtooth');
    } catch {}

    setChambers((prev) =>
      prev.map((c) => (c.status === 'unstable' ? { ...c, status: 'recalibrating' } : c))
    );

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
    <div className="w-full bg-gray-950 p-4 sm:p-6 rounded-xl border border-gray-900 text-gray-100 space-y-6">
      {/* Console Tab Bar Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 pb-3 gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('grid')}
            className={`btn-compact cursor-pointer ${
              activeTab === 'grid'
                ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-gray-200'
            }`}
          >
            ❖ Active Chambers Grid
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('historical')}
            className={`btn-compact cursor-pointer ${
              activeTab === 'historical'
                ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-gray-200'
            }`}
          >
            📈 Historical Trend Analysis
          </button>
        </div>

        <span className="text-[11px] font-mono text-gray-400">
          Chamber Monitoring Engine v2.4 • Coherence Matrix
        </span>
      </div>

      {/* TAB 1: Grid View */}
      {activeTab === 'grid' && (
        <>
          {/* Control Plane Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-gray-900/90 p-3 sm:p-4 rounded-lg border border-gray-800 gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <label htmlFor="sort-select" className="text-xs font-semibold text-gray-300 whitespace-nowrap">
                Sort Grid By:
              </label>
              <select
                id="sort-select"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="bg-gray-950 text-gray-200 border border-gray-700 text-xs font-mono rounded px-3 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="coherence_desc">Coherence Score (Highest First)</option>
                <option value="coherence_asc">Coherence Score (Lowest First)</option>
                <option value="stability_desc">Historical Stability (Most Stable First)</option>
                <option value="stability_asc">Historical Stability (Least Stable First)</option>
                <option value="id_asc">Chamber ID (Ascending)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleBatchRecalibrate}
              disabled={unstableCount === 0 || isSyncing}
              className={`btn-compact cursor-pointer justify-center ${
                isSyncing
                  ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : unstableCount > 0
                  ? 'bg-amber-600/20 border-amber-500/80 text-amber-300 hover:bg-amber-600/30 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
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
                ? 'Recalibrating (2.5s)...'
                : `Batch Recalibrate Unstable (${unstableCount})`}
            </button>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sortedChambers.map((chamber) => {
              const isUnstable = chamber.status === 'unstable';
              const isRecalibrating = chamber.status === 'recalibrating';

              let cardStyle = 'border-gray-800 bg-gray-900/90 hover:border-gray-700';
              let badgeStyle = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60';
              let sparklineColor = '#34D399';

              if (isUnstable) {
                cardStyle =
                  'border-amber-500/80 bg-gray-900/90 shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-pulse';
                badgeStyle =
                  'bg-amber-950/90 text-amber-300 border-amber-500/80 animate-pulse';
                sparklineColor = '#F59E0B';
              } else if (isRecalibrating) {
                cardStyle =
                  'border-cyan-500/80 bg-gray-900/90 shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-pulse';
                badgeStyle =
                  'bg-cyan-950/90 text-cyan-300 border-cyan-500/80 animate-pulse';
                sparklineColor = '#06B6D4';
              }

              return (
                <div
                  key={chamber.id}
                  className={`p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between ${cardStyle}`}
                >
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

                  {/* D3 Circular Coherence Arc Gauge & Sparkline */}
                  <div className="my-3 flex items-center justify-between bg-black/40 p-2.5 rounded-lg border border-gray-800/80 gap-2">
                    <div className="flex items-center gap-2">
                      {/* D3 Arc Gauge */}
                      <CoherenceGauge score={chamber.coherenceScore} size={64} />
                      <div>
                        <span className="text-[9px] font-mono text-gray-400 block tracking-wider">
                          COHERENCE
                        </span>
                        <span className="text-[11px] font-mono text-gray-200 font-semibold">
                          {chamber.coherenceScore >= 80 ? 'OPTIMAL' : 'DEGRADED'}
                        </span>
                      </div>
                    </div>

                    <ChamberSparkline
                      data={chamber.coherenceTrend24h}
                      color={sparklineColor}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-gray-800">
                    <div>
                      <span className="text-gray-500 block text-[10px]">HISTORICAL STABILITY</span>
                      <span className="text-gray-200 font-semibold">
                        {(chamber.historicalStabilityIndex * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500 block text-[10px]">CURRENT TEMP</span>
                      <span className="text-gray-200 font-semibold">
                        {chamber.currentTemp.toFixed(1)}°C
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* TAB 2: Recharts Historical Stability Trend View */}
      {activeTab === 'historical' && (
        <div className="bg-gray-900/90 p-5 rounded-lg border border-gray-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-200">
              Long-Term Chamber Stability Index & Degradation Patterns
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Evaluates historical stability benchmarks across chambers. Values below 80.0% signal impending hardware fatigue.
            </p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={historicalChartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="chamberId" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    borderColor: '#374151',
                    color: '#F3F4F6',
                    fontSize: '12px',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any) => [`${value}%`, 'Stability Index']}
                />
                <ReferenceLine
                  y={80}
                  stroke="#F59E0B"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Degradation Limit (80%)',
                    fill: '#F59E0B',
                    fontSize: 10
                  }}
                />
                <Bar
                  dataKey="stabilityIndexPercentage"
                  fill="#06B6D4"
                  radius={[4, 4, 0, 0]}
                  name="Historical Stability Index (%)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default SovereignChamberConsole;
