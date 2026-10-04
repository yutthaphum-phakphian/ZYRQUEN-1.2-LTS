import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
  ComposedChart,
} from 'recharts';
import {
  Activity,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Layers,
  FileSpreadsheet,
  FileCode,
  Copy,
  Check,
  ChevronRight,
  Search,
  Sliders,
  Eye,
  Zap,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import { playTone, playAuditChime } from '../AudioSynthesizer';
import { safeCopyToClipboard } from '../../utils/clipboard';

// ==========================================
// 30-DAY AUDIT LOG TREND DATA TYPES & MODEL
// ==========================================

export interface DailyAuditLogTrend {
  dayIndex: number;
  date: string;          // YYYY-MM-DD
  displayDate: string;   // MM/DD
  weekday: string;
  totalEvents: number;
  successEvents: number;
  warningEvents: number;
  criticalEvents: number;
  successRate: number;    // %
  warningRate: number;    // %
  criticalRate: number;   // %
  avgLatencyMs: number;
  quarantineTriggered: number;
  merkleBlockStart: number;
  merkleBlockEnd: number;
  primarySubsystem: string;
  topStatuteRef: string;
  pqcSealDigest: string;
  sampleLogs: Array<{
    id: string;
    time: string;
    level: 'success' | 'warning' | 'critical';
    source: string;
    message: string;
    hash: string;
    statute: string;
  }>;
}

export type TimeWindow = '7d' | '14d' | '30d';
export type ChartDisplayMode = 'stacked-area' | 'normalized-area' | 'grouped-bar' | 'composed-trend';
export type SubsystemFilter = 'ALL' | 'HSM_QUORUM' | 'PQC_CRYPTO' | 'LEDGER_ENGINE' | 'ZERO_TRUST' | 'FIOS_SSOT';

// ==========================================
// GENERATE 30-DAY CANONICAL AUDIT DATASET
// ==========================================

const SUBSYSTEM_OPTIONS: { id: SubsystemFilter; label: string; desc: string }[] = [
  { id: 'ALL', label: 'All Subsystems', desc: 'Holistic system-wide audit telemetry across all 18 Chambers' },
  { id: 'HSM_QUORUM', label: 'HSM Quorum (CH-01/02)', desc: 'FIPS 140-3 L4 Deca-Custodian key signatures & consensus' },
  { id: 'PQC_CRYPTO', label: 'PQC Cryptography (CH-11/15)', desc: 'Kyber-1024, Dilithium-5 & SPHINCS+ lattice verification' },
  { id: 'LEDGER_ENGINE', label: 'Ledger Engine (CH-05/06)', desc: 'WORM immutable record commits and Merkle root sealing' },
  { id: 'ZERO_TRUST', label: 'Zero-Trust Gate (CH-17/18)', desc: 'Active perimeter intrusion isolation & fail-closed triggers' },
  { id: 'FIOS_SSOT', label: 'Fios SSoT Pipeline', desc: '7-Factor evidence verification & zero drift Δ0.00% validation' },
];

function generate30DayAuditData(): DailyAuditLogTrend[] {
  const days: DailyAuditLogTrend[] = [];
  const baseDate = new Date(2026, 8, 5); // September 5, 2026
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Realistic baseline patterns with specific engineered incident events
  const dailyProfiles = [
    { base: 142100, warnPct: 0.021, critPct: 0.002, sub: 'HSM_QUORUM', note: 'Nominal startup & genesis lock' },
    { base: 143800, warnPct: 0.024, critPct: 0.003, sub: 'PQC_CRYPTO', note: 'Lattice key rotation cycle' },
    { base: 141900, warnPct: 0.019, critPct: 0.001, sub: 'LEDGER_ENGINE', note: 'Batch WORM ledger commitment' },
    { base: 144500, warnPct: 0.032, critPct: 0.004, sub: 'ZERO_TRUST', note: 'Perimeter port scan isolated' },
    { base: 146200, warnPct: 0.020, critPct: 0.002, sub: 'FIOS_SSOT', note: '7-Factor evidence reconciliation' },
    { base: 148900, warnPct: 0.028, critPct: 0.003, sub: 'HSM_QUORUM', note: 'Custodian dual-auth check' },
    { base: 145100, warnPct: 0.022, critPct: 0.001, sub: 'PQC_CRYPTO', note: 'Kyber-1024 key encapsulation sync' },
    { base: 147800, warnPct: 0.025, critPct: 0.002, sub: 'LEDGER_ENGINE', note: 'Block #843900 sealed' },
    { base: 149400, warnPct: 0.038, critPct: 0.006, sub: 'ZERO_TRUST', note: 'Simulated adversarial stress test' },
    { base: 146700, warnPct: 0.021, critPct: 0.002, sub: 'FIOS_SSOT', note: 'Zero-drift invariant check PASS' },
    { base: 145300, warnPct: 0.019, critPct: 0.001, sub: 'HSM_QUORUM', note: 'Deca-HSM thermal audit nominal' },
    { base: 148100, warnPct: 0.027, critPct: 0.003, sub: 'PQC_CRYPTO', note: 'Dilithium-5 non-repudiation verified' },
    { base: 151200, warnPct: 0.045, critPct: 0.008, sub: 'ZERO_TRUST', note: 'Chaos Mesh latency injection vector' },
    { base: 153800, warnPct: 0.052, critPct: 0.012, sub: 'ZERO_TRUST', note: 'Adversarial spike contained (100%)' }, // Day 14 spike
    { base: 147200, warnPct: 0.024, critPct: 0.002, sub: 'LEDGER_ENGINE', note: 'Post-test ledger reconciliation' },
    { base: 146900, warnPct: 0.020, critPct: 0.001, sub: 'FIOS_SSOT', note: 'Fios Factor 4 digital signature check' },
    { base: 148500, warnPct: 0.023, critPct: 0.002, sub: 'HSM_QUORUM', note: '10/10 HSM Quorum ratified' },
    { base: 150100, warnPct: 0.031, critPct: 0.004, sub: 'PQC_CRYPTO', note: 'SPHINCS+ stateless tree reseed' },
    { base: 149200, warnPct: 0.026, critPct: 0.002, sub: 'LEDGER_ENGINE', note: 'Sealed 280 sub-blocks' },
    { base: 147600, warnPct: 0.018, critPct: 0.001, sub: 'FIOS_SSOT', note: 'ISO/IEC 27037 timestamp proof' },
    { base: 148900, warnPct: 0.022, critPct: 0.002, sub: 'HSM_QUORUM', note: 'NIMT microsecond clock sync' },
    { base: 152400, warnPct: 0.041, critPct: 0.007, sub: 'PQC_CRYPTO', note: 'Scheduled PQC Key Switcher Drill' }, // Day 22 drill
    { base: 148100, warnPct: 0.023, critPct: 0.002, sub: 'ZERO_TRUST', note: 'Zero-trust perimeter nominal' },
    { base: 149700, warnPct: 0.020, critPct: 0.001, sub: 'LEDGER_ENGINE', note: 'Merkle tree compaction PASS' },
    { base: 150800, warnPct: 0.027, critPct: 0.003, sub: 'FIOS_SSOT', note: 'ETDA Sec 26 compliance ratified' },
    { base: 151500, warnPct: 0.024, critPct: 0.002, sub: 'HSM_QUORUM', note: 'FIPS 140-3 Level 4 boundary check' },
    { base: 149800, warnPct: 0.019, critPct: 0.001, sub: 'PQC_CRYPTO', note: 'Quantum-safe handshake test' },
    { base: 152100, warnPct: 0.022, critPct: 0.002, sub: 'LEDGER_ENGINE', note: 'Block #848850 committed' },
    { base: 153400, warnPct: 0.025, critPct: 0.002, sub: 'FIOS_SSOT', note: 'Final acceptance baseline lock' },
    { base: 154200, warnPct: 0.017, critPct: 0.001, sub: 'HSM_QUORUM', note: 'Block #849202 Sealed • 14,902 Seals' },
  ];

  let startBlock = 842100;

  for (let i = 0; i < 30; i++) {
    const curDate = new Date(baseDate);
    curDate.setDate(baseDate.getDate() + i);

    const yyyy = curDate.getFullYear();
    const mm = String(curDate.getMonth() + 1).padStart(2, '0');
    const dd = String(curDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const displayDate = `${mm}/${dd}`;
    const weekday = weekdays[curDate.getDay()];

    const prof = dailyProfiles[i] || dailyProfiles[0];
    const total = prof.base;
    const critical = Math.round(total * prof.critPct);
    const warning = Math.round(total * prof.warnPct);
    const success = total - warning - critical;

    const blockCount = 230 + Math.floor(Math.random() * 40);
    const endBlock = startBlock + blockCount;

    const sampleLogs = [
      {
        id: `LOG-${dateStr}-01`,
        time: '04:12:08 UTC',
        level: 'success' as const,
        source: 'Chamber 01 Canonical Core',
        message: 'Deca-Custodian FIPS 140-3 L4 HSM Quorum (10/10) ratified genesis invariant.',
        hash: `0x${(i * 137 + 1042).toString(16).padStart(8, '0')}...b814`,
        statute: 'ETDA Sec 26 (Electronic Signature Binding)',
      },
      {
        id: `LOG-${dateStr}-02`,
        time: '09:45:22 UTC',
        level: 'warning' as const,
        source: 'Chamber 11 Quantum Radar',
        message: `Micro-jitter latency variation detected (${(0.018 + (i % 5) * 0.004).toFixed(3)} ms). Auto-compensated by Cryo-Loop.`,
        hash: `0x${(i * 241 + 2088).toString(16).padStart(8, '0')}...c468`,
        statute: 'ISO/IEC 27037 Telemetry Integrity',
      },
      {
        id: `LOG-${dateStr}-03`,
        time: '14:20:55 UTC',
        level: (critical > 400 ? 'critical' : 'success') as 'success' | 'critical',
        source: prof.sub === 'ZERO_TRUST' ? 'Chamber 18 Neural Sentinel' : 'Chamber 05 Ledger Engine',
        message:
          critical > 400
            ? 'Adversarial entropy deviation intercepted by Zero-Trust fail-closed circuit breaker. Threat quarantined in 0.38ms.'
            : 'WORM Immutable Audit Seal sequence synchronized with Canonical Merkle Root.',
        hash: `0x${(i * 389 + 3012).toString(16).padStart(8, '0')}...909a`,
        statute: 'PDPA Sec 37 & ETDA Sec 28 (Forensic Admissibility)',
      },
      {
        id: `LOG-${dateStr}-04`,
        time: '21:58:30 UTC',
        level: 'success' as const,
        source: 'Fios 7-Factor Engine',
        message: `End-of-day Merkle reconciliation complete. Block #${endBlock} frozen with zero drift Δ0.00%.`,
        hash: `0x${(i * 512 + 4096).toString(16).padStart(8, '0')}...fa4c`,
        statute: 'Thai Judicial Evidence Annex จพ.๐๑-๐๗',
      },
    ];

    days.push({
      dayIndex: i + 1,
      date: dateStr,
      displayDate,
      weekday,
      totalEvents: total,
      successEvents: success,
      warningEvents: warning,
      criticalEvents: critical,
      successRate: Number(((success / total) * 100).toFixed(2)),
      warningRate: Number(((warning / total) * 100).toFixed(2)),
      criticalRate: Number(((critical / total) * 100).toFixed(2)),
      avgLatencyMs: Number((35.6 + (i % 7) * 0.08).toFixed(2)),
      quarantineTriggered: critical,
      merkleBlockStart: startBlock,
      merkleBlockEnd: endBlock,
      primarySubsystem: prof.sub,
      topStatuteRef: 'ETDA Sec 9, 26, 28 • PDPA Sec 37',
      pqcSealDigest: `0x909a${(i * 99 + 1000).toString(16)}...${(i * 77 + 4000).toString(16)}`,
      sampleLogs,
    });

    startBlock = endBlock + 1;
  }

  return days;
}

const RAW_30D_DATA = generate30DayAuditData();

// ==========================================
// MAIN AUDIT LOG TRENDS VIEW COMPONENT
// ==========================================

export const AuditLogTrendsView: React.FC<{
  onNavigate?: (view: any) => void;
  onAddSystemEvent?: (event: any) => void;
}> = ({ onNavigate }) => {
  // State
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('30d');
  const [chartMode, setChartMode] = useState<ChartDisplayMode>('stacked-area');
  const [subsystemFilter, setSubsystemFilter] = useState<SubsystemFilter>('ALL');
  const [showSuccess, setShowSuccess] = useState<boolean>(true);
  const [showWarning, setShowWarning] = useState<boolean>(true);
  const [showCritical, setShowCritical] = useState<boolean>(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(30); // Default to last day
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [hoveredPoint, setHoveredPoint] = useState<DailyAuditLogTrend | null>(null);

  // Filtered dataset based on time window
  const windowedData = useMemo(() => {
    let sliced = [...RAW_30D_DATA];
    if (timeWindow === '7d') sliced = sliced.slice(-7);
    else if (timeWindow === '14d') sliced = sliced.slice(-14);

    if (subsystemFilter !== 'ALL') {
      // Scale event values based on subsystem contribution weight
      sliced = sliced.map((item) => {
        const isTarget = item.primarySubsystem === subsystemFilter;
        const multiplier = isTarget ? 0.45 : 0.12;
        const total = Math.round(item.totalEvents * multiplier);
        const warning = Math.round(item.warningEvents * multiplier);
        const critical = Math.round(item.criticalEvents * multiplier);
        const success = total - warning - critical;
        return {
          ...item,
          totalEvents: total,
          successEvents: success,
          warningEvents: warning,
          criticalEvents: critical,
          successRate: Number(((success / total) * 100).toFixed(2)),
          warningRate: Number(((warning / total) * 100).toFixed(2)),
          criticalRate: Number(((critical / total) * 100).toFixed(2)),
        };
      });
    }

    return sliced;
  }, [timeWindow, subsystemFilter]);

  // Aggregated KPIs
  const summaryKpis = useMemo(() => {
    const total = windowedData.reduce((acc, d) => acc + d.totalEvents, 0);
    const success = windowedData.reduce((acc, d) => acc + d.successEvents, 0);
    const warning = windowedData.reduce((acc, d) => acc + d.warningEvents, 0);
    const critical = windowedData.reduce((acc, d) => acc + d.criticalEvents, 0);
    const avgLatency =
      windowedData.reduce((acc, d) => acc + d.avgLatencyMs, 0) / (windowedData.length || 1);

    const successPct = total > 0 ? (success / total) * 100 : 0;
    const warningPct = total > 0 ? (warning / total) * 100 : 0;
    const criticalPct = total > 0 ? (critical / total) * 100 : 0;

    return {
      totalEvents: total,
      successEvents: success,
      warningEvents: warning,
      criticalEvents: critical,
      successPercentage: successPct.toFixed(2),
      warningPercentage: warningPct.toFixed(2),
      criticalPercentage: criticalPct.toFixed(2),
      avgLatencyMs: avgLatency.toFixed(2),
      daysCount: windowedData.length,
      quarantinedTotal: critical,
      merkleIntegrity: '100% INTACT',
      zeroDrift: 'Δ0.00%',
    };
  }, [windowedData]);

  // Pie chart breakdown data
  const pieBreakdownData = useMemo(() => {
    return [
      { name: 'Success / Nominal', value: summaryKpis.successEvents, color: '#10B981', fill: '#10B981' },
      { name: 'Warnings / Jitters', value: summaryKpis.warningEvents, color: '#F59E0B', fill: '#F59E0B' },
      { name: 'Critical / Contained', value: summaryKpis.criticalEvents, color: '#EF4444', fill: '#EF4444' },
    ];
  }, [summaryKpis]);

  // Selected Day Detail
  const selectedDay = useMemo(() => {
    if (selectedDayIndex === null) return windowedData[windowedData.length - 1] || null;
    return RAW_30D_DATA.find((d) => d.dayIndex === selectedDayIndex) || windowedData[windowedData.length - 1] || null;
  }, [selectedDayIndex, windowedData]);

  // Search filtered table rows
  const tableRows = useMemo(() => {
    if (!searchQuery.trim()) return windowedData;
    const q = searchQuery.toLowerCase();
    return windowedData.filter(
      (d) =>
        d.date.includes(q) ||
        d.displayDate.includes(q) ||
        d.weekday.toLowerCase().includes(q) ||
        d.primarySubsystem.toLowerCase().includes(q) ||
        d.pqcSealDigest.toLowerCase().includes(q)
    );
  }, [windowedData, searchQuery]);

  // Handlers
  const handleExportCsv = useCallback(() => {
    playTone(660, 0.04);
    const headers = [
      'DayIndex',
      'Date',
      'Weekday',
      'TotalEvents',
      'SuccessEvents',
      'WarningEvents',
      'CriticalEvents',
      'SuccessRatePct',
      'WarningRatePct',
      'CriticalRatePct',
      'AvgLatencyMs',
      'MerkleBlockStart',
      'MerkleBlockEnd',
      'PrimarySubsystem',
      'PqcSealDigest',
    ];

    const rows = windowedData.map((d) => [
      d.dayIndex,
      d.date,
      d.weekday,
      d.totalEvents,
      d.successEvents,
      d.warningEvents,
      d.criticalEvents,
      d.successRate,
      d.warningRate,
      d.criticalRate,
      d.avgLatencyMs,
      d.merkleBlockStart,
      d.merkleBlockEnd,
      d.primarySubsystem,
      d.pqcSealDigest,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `zyrquen-audit-trends-${timeWindow}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    playAuditChime();
  }, [windowedData, timeWindow]);

  const handleExportJson = useCallback(() => {
    playTone(720, 0.04);
    const exportPayload = {
      manifest: 'ZYRQUEN Ω∞ Sovereign Audit Log Trends Master',
      generatedUtc: new Date().toISOString(),
      timeWindow,
      subsystemFilter,
      summary: summaryKpis,
      trends: windowedData,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `zyrquen-audit-trends-${timeWindow}-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    playAuditChime();
  }, [windowedData, timeWindow, subsystemFilter, summaryKpis]);

  const handleCopyDigest = useCallback(() => {
    playTone(800, 0.03);
    const textToCopy = `ZYRQUEN 30-DAY AUDIT TRENDS ATTESTATION\nPeriod: ${windowedData[0]?.date} to ${windowedData[windowedData.length - 1]?.date}\nTotal Events: ${summaryKpis.totalEvents.toLocaleString()}\nSuccess: ${summaryKpis.successPercentage}% (${summaryKpis.successEvents.toLocaleString()})\nWarnings: ${summaryKpis.warningPercentage}% (${summaryKpis.warningEvents.toLocaleString()})\nCriticals Quarantined: ${summaryKpis.criticalPercentage}% (${summaryKpis.criticalEvents.toLocaleString()})\nSSoT Zero-Drift: Δ0.00% Verified\nMerkle Integrity: 100% INTACT\nMaster Seal: 0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68`;
    safeCopyToClipboard(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [windowedData, summaryKpis]);

  // Custom Tooltip Renderer
  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const dataPoint = payload[0]?.payload as DailyAuditLogTrend;
    if (!dataPoint) return null;

    return (
      <div className="bg-[#090d1a]/95 border border-cyan-500/40 rounded-xl p-3 shadow-2xl backdrop-blur-xl text-xs font-mono text-zinc-200 min-w-[240px] space-y-2 pointer-events-none">
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-white">
              {dataPoint.date} ({dataPoint.weekday})
            </span>
          </div>
          <span className="text-[10px] text-cyan-300 font-bold">Day #{dataPoint.dayIndex}</span>
        </div>

        <div className="space-y-1 text-[11px]">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Success:
            </span>
            <span className="font-bold tabular-nums">
              {dataPoint.successEvents.toLocaleString()} ({dataPoint.successRate}%)
            </span>
          </div>

          <div className="flex items-center justify-between text-amber-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Warning:
            </span>
            <span className="font-bold tabular-nums">
              {dataPoint.warningEvents.toLocaleString()} ({dataPoint.warningRate}%)
            </span>
          </div>

          <div className="flex items-center justify-between text-rose-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              Critical:
            </span>
            <span className="font-bold tabular-nums">
              {dataPoint.criticalEvents.toLocaleString()} ({dataPoint.criticalRate}%)
            </span>
          </div>

          <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-zinc-400 text-[10px]">
            <span>Total Logged:</span>
            <span className="text-white font-bold tabular-nums">{dataPoint.totalEvents.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between text-zinc-400 text-[10px]">
            <span>Blocks:</span>
            <span className="text-cyan-300">
              #{dataPoint.merkleBlockStart} - #{dataPoint.merkleBlockEnd}
            </span>
          </div>

          <div className="flex items-center justify-between text-zinc-400 text-[10px]">
            <span>Subsystem:</span>
            <span className="text-zinc-200 font-semibold">{dataPoint.primarySubsystem}</span>
          </div>
        </div>

        <div className="text-[9px] text-cyan-400/80 pt-1 border-t border-white/5 flex items-center justify-between">
          <span>Click to view day ledger</span>
          <span>Replay: {dataPoint.avgLatencyMs}ms</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 font-sans text-zinc-100">
      {/* ========================================================================= */}
      {/* 1. TOP BREADCRUMB & ACTION BAR */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#090D18]/80 border border-white/8 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <span className="hover:text-cyan-300 cursor-pointer" onClick={() => onNavigate?.('dashboard')}>
              Sovereign Control Plane
            </span>
            <span className="text-zinc-600">/</span>
            <span className="hover:text-cyan-300 cursor-pointer" onClick={() => onNavigate?.('analytics')}>
              Forensic Audit
            </span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-300 font-bold">30-Day Audit Log Trends</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Audit Log Distribution &amp; Incident Trends</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
              RECHARTS TELEMETRY
            </span>
          </h2>
          <p className="text-xs text-zinc-400 max-w-3xl font-sans">
            Continuous 30-day temporal verification of <strong>Success</strong>, <strong>Warning</strong>, and{' '}
            <strong>Critical</strong> audit entries across all 18 Chambers with cryptographic Merkle proof binding and
            FIPS 140-3 Level 4 HSM non-repudiation.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={handleCopyDigest}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
            title="Copy 30-day attestation digest summary to clipboard"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{isCopied ? 'Copied' : 'Copy Digest'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-200 hover:text-white border border-cyan-500/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Export 30-Day Trends Data as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/50 hover:to-blue-600/50 text-cyan-100 border border-cyan-400/50 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.25)] active:scale-95"
            title="Export full structured 30-day JSON audit ledger"
          >
            <Download className="w-3.5 h-3.5 text-cyan-300" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUMMARY KPI METRIC STRIP (TABULAR-NUMS & ZERO-PILL DISCIPLINE) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Total Events */}
        <div className="p-3.5 rounded-xl bg-[#090D18]/90 border border-white/8 space-y-1">
          <div className="text-[11px] font-mono text-zinc-400 flex items-center justify-between">
            <span>TOTAL AUDIT LOGS</span>
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white tabular-nums">
            {summaryKpis.totalEvents.toLocaleString()}
          </div>
          <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
            <span className="text-emerald-400">+4.2%</span>
            <span>vs prior 30d</span>
          </div>
        </div>

        {/* Card 2: Success Events */}
        <div className="p-3.5 rounded-xl bg-[#090D18]/90 border border-emerald-500/20 space-y-1">
          <div className="text-[11px] font-mono text-emerald-400 flex items-center justify-between">
            <span>SUCCESS (PASS)</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-300 tabular-nums">
            {summaryKpis.successEvents.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-400/80 font-mono">
            {summaryKpis.successPercentage}% Nominal SSoT
          </div>
        </div>

        {/* Card 3: Warning Events */}
        <div className="p-3.5 rounded-xl bg-[#090D18]/90 border border-amber-500/20 space-y-1">
          <div className="text-[11px] font-mono text-amber-400 flex items-center justify-between">
            <span>WARNINGS (JITTERS)</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-300 tabular-nums">
            {summaryKpis.warningEvents.toLocaleString()}
          </div>
          <div className="text-[10px] text-amber-400/80 font-mono">
            {summaryKpis.warningPercentage}% Auto-Remediated
          </div>
        </div>

        {/* Card 4: Critical Events */}
        <div className="p-3.5 rounded-xl bg-[#090D18]/90 border border-rose-500/20 space-y-1">
          <div className="text-[11px] font-mono text-rose-400 flex items-center justify-between">
            <span>CRITICAL (QUARANTINED)</span>
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-300 tabular-nums">
            {summaryKpis.criticalEvents.toLocaleString()}
          </div>
          <div className="text-[10px] text-rose-400/80 font-mono">
            {summaryKpis.criticalPercentage}% (100% Contained)
          </div>
        </div>

        {/* Card 5: Average Replay Latency */}
        <div className="p-3.5 rounded-xl bg-[#090D18]/90 border border-white/8 space-y-1">
          <div className="text-[11px] font-mono text-zinc-400 flex items-center justify-between">
            <span>MEAN REPLAY MTTR</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300 tabular-nums">
            {summaryKpis.avgLatencyMs} ms
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">
            SLA Floor &lt; 142.0 ms PASS
          </div>
        </div>

        {/* Card 6: Merkle Invariant */}
        <div className="p-3.5 rounded-xl bg-[#090D18]/90 border border-cyan-500/20 space-y-1">
          <div className="text-[11px] font-mono text-cyan-400 flex items-center justify-between">
            <span>SSOT ZERO-DRIFT</span>
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white tabular-nums">
            {summaryKpis.zeroDrift}
          </div>
          <div className="text-[10px] text-emerald-400 font-mono">
            14,902 Seals Validated
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE CONTROL STRIP: TIME WINDOW, CHART TYPE, SERIES TOGGLES */}
      {/* ========================================================================= */}
      <div className="p-3 rounded-2xl bg-[#090D18]/90 border border-white/8 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Left: Timeframe Segmented Control */}
        <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/5">
          <span className="text-zinc-500 px-2 text-[11px]">Period:</span>
          {(['7d', '14d', '30d'] as const).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => {
                playTone(540, 0.02);
                setTimeWindow(tf);
              }}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                timeWindow === tf
                  ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Center: Chart Type Segmented Control */}
        <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/5 flex-wrap">
          <span className="text-zinc-500 px-2 text-[11px]">Visualization:</span>
          {(
            [
              { id: 'stacked-area', label: 'Stacked Area' },
              { id: 'normalized-area', label: '100% Normalized' },
              { id: 'grouped-bar', label: 'Daily Breakdown' },
              { id: 'composed-trend', label: 'Volume & Incident Rate' },
            ] as const
          ).map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => {
                playTone(580, 0.02);
                setChartMode(mode.id);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                chartMode === mode.id
                  ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Right: Series Visibility Checkboxes */}
        <div className="flex items-center gap-3 bg-black/50 px-3 py-1.5 rounded-xl border border-white/5 flex-wrap">
          <span className="text-zinc-500 text-[11px]">Series:</span>

          <label className="flex items-center gap-1.5 cursor-pointer text-emerald-300 text-[11px] select-none">
            <input
              type="checkbox"
              checked={showSuccess}
              onChange={(e) => {
                playTone(500, 0.02);
                setShowSuccess(e.target.checked);
              }}
              className="accent-emerald-500 rounded cursor-pointer"
            />
            <span>Success</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-amber-300 text-[11px] select-none">
            <input
              type="checkbox"
              checked={showWarning}
              onChange={(e) => {
                playTone(500, 0.02);
                setShowWarning(e.target.checked);
              }}
              className="accent-amber-500 rounded cursor-pointer"
            />
            <span>Warning</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-rose-300 text-[11px] select-none">
            <input
              type="checkbox"
              checked={showCritical}
              onChange={(e) => {
                playTone(500, 0.02);
                setShowCritical(e.target.checked);
              }}
              className="accent-rose-500 rounded cursor-pointer"
            />
            <span>Critical</span>
          </label>
        </div>
      </div>

      {/* Subsystem Quick Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs font-mono">
        <span className="text-zinc-500 text-[11px] shrink-0">Filter Subsystem:</span>
        {SUBSYSTEM_OPTIONS.map((sub) => (
          <button
            key={sub.id}
            type="button"
            onClick={() => {
              playTone(620, 0.02);
              setSubsystemFilter(sub.id);
            }}
            title={sub.desc}
            className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap shrink-0 transition-all cursor-pointer border ${
              subsystemFilter === sub.id
                ? 'bg-cyan-950/80 text-cyan-200 border-cyan-400/60 font-bold shadow-sm'
                : 'bg-white/5 text-zinc-400 hover:text-zinc-200 border-white/5 hover:border-white/10'
            }`}
          >
            {sub.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 4. PRIMARY RECHARTS VISUALIZATION CONTAINER */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Main Chart View (8 Cols on Desktop) */}
        <div className="lg:col-span-8 p-4 sm:p-5 rounded-2xl bg-[#090D18]/90 border border-white/8 space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>
                  {chartMode === 'stacked-area' && 'Continuous 30-Day Event Volume Area Stream'}
                  {chartMode === 'normalized-area' && 'Normalized 100% Event Severity Distribution'}
                  {chartMode === 'grouped-bar' && 'Daily Event Volume & Severity Categorization'}
                  {chartMode === 'composed-trend' && 'Total Event Ingestion vs. Critical Alert Rate'}
                </span>
              </h3>
              <span className="text-[11px] text-zinc-400 font-sans">
                Hover to inspect single-day values • Click on chart node to drill down into audit logs
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>{windowedData.length} Day Points</span>
            </div>
          </div>

          {/* Recharts Area / Bar / Composed Canvas */}
          <div className="w-full h-[320px] sm:h-[380px] font-mono text-xs">
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'stacked-area' ? (
                <AreaChart
                  data={windowedData}
                  onClick={(data: any) => {
                    if (data && data.activePayload && data.activePayload[0]) {
                      const clicked = data.activePayload[0].payload as DailyAuditLogTrend;
                      playTone(720, 0.03);
                      setSelectedDayIndex(clicked.dayIndex);
                    }
                  }}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorWarning" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.15} />
                    </linearGradient>
                    <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="displayDate"
                    stroke="#71717A"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <YAxis
                    stroke="#71717A"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={renderCustomTooltip} />
                  {showSuccess && (
                    <Area
                      type="monotone"
                      dataKey="successEvents"
                      name="Success (Pass)"
                      stackId="1"
                      stroke="#10B981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorSuccess)"
                    />
                  )}
                  {showWarning && (
                    <Area
                      type="monotone"
                      dataKey="warningEvents"
                      name="Warning (Jitter)"
                      stackId="1"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorWarning)"
                    />
                  )}
                  {showCritical && (
                    <Area
                      type="monotone"
                      dataKey="criticalEvents"
                      name="Critical (Quarantine)"
                      stackId="1"
                      stroke="#EF4444"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorCritical)"
                    />
                  )}
                  {/* Highlight reference line on stress spike */}
                  <ReferenceLine
                    x="09/18"
                    stroke="#EF4444"
                    strokeDasharray="3 3"
                    label={{ value: 'Stress Test', fill: '#EF4444', fontSize: 9, position: 'top' }}
                  />
                </AreaChart>
              ) : chartMode === 'normalized-area' ? (
                <AreaChart
                  data={windowedData}
                  onClick={(data: any) => {
                    if (data && data.activePayload && data.activePayload[0]) {
                      const clicked = data.activePayload[0].payload as DailyAuditLogTrend;
                      playTone(720, 0.03);
                      setSelectedDayIndex(clicked.dayIndex);
                    }
                  }}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="normSuccess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.85} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id="normWarning" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.85} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id="normCritical" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="displayDate"
                    stroke="#71717A"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <YAxis
                    stroke="#71717A"
                    fontSize={10}
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={renderCustomTooltip} />
                  {showSuccess && (
                    <Area
                      type="monotone"
                      dataKey="successRate"
                      name="Success %"
                      stackId="pct"
                      stroke="#10B981"
                      fill="url(#normSuccess)"
                    />
                  )}
                  {showWarning && (
                    <Area
                      type="monotone"
                      dataKey="warningRate"
                      name="Warning %"
                      stackId="pct"
                      stroke="#F59E0B"
                      fill="url(#normWarning)"
                    />
                  )}
                  {showCritical && (
                    <Area
                      type="monotone"
                      dataKey="criticalRate"
                      name="Critical %"
                      stackId="pct"
                      stroke="#EF4444"
                      fill="url(#normCritical)"
                    />
                  )}
                </AreaChart>
              ) : chartMode === 'grouped-bar' ? (
                <BarChart
                  data={windowedData}
                  onClick={(data: any) => {
                    if (data && data.activePayload && data.activePayload[0]) {
                      const clicked = data.activePayload[0].payload as DailyAuditLogTrend;
                      playTone(720, 0.03);
                      setSelectedDayIndex(clicked.dayIndex);
                    }
                  }}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="displayDate"
                    stroke="#71717A"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <YAxis
                    stroke="#71717A"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={renderCustomTooltip} />
                  {showSuccess && <Bar dataKey="successEvents" name="Success" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />}
                  {showWarning && <Bar dataKey="warningEvents" name="Warning" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />}
                  {showCritical && <Bar dataKey="criticalEvents" name="Critical" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />}
                </BarChart>
              ) : (
                /* Composed Chart: Total Volume Bar + Critical Rate Line */
                <ComposedChart
                  data={windowedData}
                  onClick={(data: any) => {
                    if (data && data.activePayload && data.activePayload[0]) {
                      const clicked = data.activePayload[0].payload as DailyAuditLogTrend;
                      playTone(720, 0.03);
                      setSelectedDayIndex(clicked.dayIndex);
                    }
                  }}
                  margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="displayDate"
                    stroke="#71717A"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#71717A"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#EF4444"
                    fontSize={10}
                    domain={[0, 2]}
                    tickLine={false}
                    axisLine={{ stroke: '#EF4444' }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={renderCustomTooltip} />
                  <Bar yAxisId="left" dataKey="totalEvents" name="Total Volume" fill="#06B6D4" opacity={0.4} radius={[4, 4, 0, 0]} />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="criticalRate"
                    name="Critical Rate %"
                    stroke="#EF4444"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#EF4444' }}
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Chart Legend Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-[11px] font-mono text-zinc-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span>Success (Nominal Operations)</span>
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span>Warning (Compensated Jitters)</span>
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                <span>Critical (Quarantined Incidents)</span>
              </span>
            </div>
            <span className="text-zinc-500">Clicking data points selects day in drilldown ↓</span>
          </div>
        </div>

        {/* Right / Donut & Severity Composition (4 Cols on Desktop) */}
        <div className="lg:col-span-4 p-4 sm:p-5 rounded-2xl bg-[#090D18]/90 border border-white/8 space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>30-Day Aggregate Severity Mix</span>
            </h3>
            <span className="text-[11px] text-zinc-400 font-sans">
              Cumulative distribution across {summaryKpis.totalEvents.toLocaleString()} total audit transactions
            </span>
          </div>

          {/* Donut Chart with Centered KPI */}
          <div className="relative w-full h-[190px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="rgba(0,0,0,0.5)"
                  strokeWidth={2}
                >
                  {pieBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [
                    `${Number(val).toLocaleString()} (${(((Number(val) || 0) / summaryKpis.totalEvents) * 100).toFixed(2)}%)`,
                    'Count',
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-xs font-mono text-zinc-400">PASS RATE</span>
              <span className="text-lg font-bold font-mono text-emerald-300 tabular-nums">
                {summaryKpis.successPercentage}%
              </span>
              <span className="text-[9px] font-mono text-cyan-400">FIPS 140-3 L4</span>
            </div>
          </div>

          {/* Breakdown Rows */}
          <div className="space-y-2 pt-2 border-t border-white/8 text-xs font-mono">
            <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-zinc-200">Nominal Pass</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-emerald-300 tabular-nums">
                  {summaryKpis.successEvents.toLocaleString()}
                </span>
                <span className="text-zinc-500 text-[10px] block">{summaryKpis.successPercentage}%</span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-amber-950/20 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-zinc-200">Soft Warnings</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-amber-300 tabular-nums">
                  {summaryKpis.warningEvents.toLocaleString()}
                </span>
                <span className="text-zinc-500 text-[10px] block">{summaryKpis.warningPercentage}%</span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-rose-950/20 border border-rose-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-zinc-200">Critical Incidents</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-rose-300 tabular-nums">
                  {summaryKpis.criticalEvents.toLocaleString()}
                </span>
                <span className="text-zinc-500 text-[10px] block">{summaryKpis.criticalPercentage}% (Quarantined)</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-zinc-400 font-mono flex items-center justify-between pt-1">
            <span>Thai Legal Binding: ETDA Sec 9/26</span>
            <span className="text-cyan-300">100% Non-Repudiation</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. SELECTED DAY FORENSIC DRILLDOWN DRAWER */}
      {/* ========================================================================= */}
      {selectedDay && (
        <motion.div
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 sm:p-5 rounded-2xl bg-[#090D18]/95 border border-cyan-500/30 space-y-4 shadow-xl"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/8 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                  <span>
                    Selected Day Forensic Audit Ledger: {selectedDay.date} ({selectedDay.weekday})
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                    Day #{selectedDay.dayIndex} of 30
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 font-sans">
                  Blocks #{selectedDay.merkleBlockStart.toLocaleString()} to #{selectedDay.merkleBlockEnd.toLocaleString()} · Primary Subsystem: <strong>{selectedDay.primarySubsystem}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 font-bold">
                Pass: {selectedDay.successRate}%
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-950/60 text-amber-300 border border-amber-500/30 font-bold">
                Warn: {selectedDay.warningRate}%
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-rose-950/60 text-rose-300 border border-rose-500/30 font-bold">
                Crit: {selectedDay.criticalRate}%
              </span>
            </div>
          </div>

          {/* Sample Audit Logs for Selected Day */}
          <div className="space-y-2">
            <div className="text-xs font-mono text-zinc-400 flex items-center justify-between">
              <span>Granular Event Log Sample (Signed Cryptographic Trace)</span>
              <span className="text-cyan-400 text-[11px]">PQC Digest: {selectedDay.pqcSealDigest}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-xs">
              {selectedDay.sampleLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-xl border space-y-1.5 transition-colors ${
                    log.level === 'success'
                      ? 'bg-emerald-950/10 border-emerald-500/30 text-emerald-200'
                      : log.level === 'warning'
                      ? 'bg-amber-950/15 border-amber-500/30 text-amber-200'
                      : 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          log.level === 'success'
                            ? 'bg-emerald-400'
                            : log.level === 'warning'
                            ? 'bg-amber-400'
                            : 'bg-rose-400 animate-pulse'
                        }`}
                      />
                      <span className="font-bold text-white">{log.source}</span>
                    </div>
                    <span className="text-zinc-400">{log.time}</span>
                  </div>

                  <p className="text-[11px] text-zinc-300 font-sans leading-snug">{log.message}</p>

                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-white/5 text-zinc-400">
                    <span className="truncate max-w-[180px]">Hash: {log.hash}</span>
                    <span className="text-cyan-400 text-[9px] truncate">{log.statute}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* 6. FULL 30-DAY INTERACTIVE AUDIT TRENDS DATA TABLE */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#090D18]/90 border border-white/8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/8 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              <span>30-Day Comprehensive Ledger Distribution Table</span>
            </h3>
            <p className="text-xs text-zinc-400 font-sans">
              Day-by-day tabular records with exact counts, percentages, and Merkle block heights.
            </p>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search date, weekday, subsystem..."
              className="bg-transparent text-xs font-mono text-zinc-200 focus:outline-none w-full placeholder-zinc-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-zinc-500 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Table */}
        <div className="overflow-x-auto custom-scrollbar rounded-xl border border-white/5">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-black/60 border-b border-white/10 text-zinc-400 text-[11px]">
                <th className="py-2.5 px-3 font-semibold">Day #</th>
                <th className="py-2.5 px-3 font-semibold">UTC Date</th>
                <th className="py-2.5 px-3 font-semibold">Weekday</th>
                <th className="py-2.5 px-3 font-semibold text-right">Total Events</th>
                <th className="py-2.5 px-3 font-semibold text-right text-emerald-400">Success</th>
                <th className="py-2.5 px-3 font-semibold text-right text-amber-400">Warning</th>
                <th className="py-2.5 px-3 font-semibold text-right text-rose-400">Critical</th>
                <th className="py-2.5 px-3 font-semibold text-center">Pass Rate</th>
                <th className="py-2.5 px-3 font-semibold">Block Height</th>
                <th className="py-2.5 px-3 font-semibold">Subsystem</th>
                <th className="py-2.5 px-3 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tableRows.map((row) => {
                const isSelected = selectedDayIndex === row.dayIndex;
                return (
                  <tr
                    key={row.date}
                    onClick={() => {
                      playTone(680, 0.02);
                      setSelectedDayIndex(row.dayIndex);
                    }}
                    className={`transition-colors cursor-pointer text-[11px] ${
                      isSelected
                        ? 'bg-cyan-950/40 text-white font-semibold'
                        : 'hover:bg-white/[0.03] text-zinc-300'
                    }`}
                  >
                    <td className="py-2 px-3 text-zinc-400 font-bold">#{row.dayIndex}</td>
                    <td className="py-2 px-3 font-bold text-white whitespace-nowrap">{row.date}</td>
                    <td className="py-2 px-3 text-zinc-400">{row.weekday}</td>
                    <td className="py-2 px-3 text-right tabular-nums font-bold text-white">
                      {row.totalEvents.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-emerald-400">
                      {row.successEvents.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-amber-400">
                      {row.warningEvents.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-rose-400">
                      {row.criticalEvents.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          row.successRate >= 97
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {row.successRate}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-zinc-400 whitespace-nowrap">
                      #{row.merkleBlockStart} - #{row.merkleBlockEnd}
                    </td>
                    <td className="py-2 px-3 text-cyan-300 truncate max-w-[130px]" title={row.primarySubsystem}>
                      {row.primarySubsystem}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playTone(720, 0.03);
                          setSelectedDayIndex(row.dayIndex);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500 text-black font-bold'
                            : 'bg-white/5 hover:bg-cyan-500/20 text-zinc-300 hover:text-cyan-300 border border-white/10'
                        }`}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
