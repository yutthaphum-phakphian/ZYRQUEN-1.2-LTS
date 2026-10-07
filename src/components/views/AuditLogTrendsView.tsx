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
  ReferenceArea,
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
  ChevronDown,
  ChevronRight,
  Search,
  Sliders,
  Eye,
  Zap,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  CalendarRange,
  ListFilter,
  SlidersHorizontal,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CalendarDays,
  Radio,
  ShieldAlert,
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
  chartSuccessEvents?: number;
  chartWarningEvents?: number;
  chartCriticalEvents?: number;
  chartTotalEvents?: number;
  chartSuccessRate?: number;
  chartWarningRate?: number;
  chartCriticalRate?: number;
}

export type TimeWindowPreset = '3d' | '7d' | '14d' | '30d' | 'custom';
export type ChartDisplayMode = 'stacked-area' | 'normalized-area' | 'grouped-bar' | 'composed-trend';
export type SubsystemFilter = 'ALL' | 'HSM_QUORUM' | 'PQC_CRYPTO' | 'LEDGER_ENGINE' | 'ZERO_TRUST' | 'FIOS_SSOT';
export type EventTypeFilter = 'ALL' | 'SUCCESS_ONLY' | 'WARNING_ONLY' | 'CRITICAL_ONLY' | 'INCIDENTS_ONLY' | 'NOMINAL_ONLY';

// ==========================================
// FILTER OPTIONS DEFINITIONS
// ==========================================

export const EVENT_TYPE_OPTIONS: {
  id: EventTypeFilter;
  labelEn: string;
  labelTh: string;
  dotColor: string;
  badgeBg: string;
  badgeText: string;
  description: string;
}[] = [
  {
    id: 'ALL',
    labelEn: 'All Event Types (Success, Warning, Critical)',
    labelTh: 'ประเภทเหตุการณ์ทั้งหมด (สำเร็จ, คำเตือน, วิกฤต)',
    dotColor: '#06B6D4',
    badgeBg: 'bg-cyan-500/20',
    badgeText: 'text-cyan-300',
    description: 'Complete 360° telemetry across all nominal and anomalous log occurrences',
  },
  {
    id: 'SUCCESS_ONLY',
    labelEn: 'Success / Nominal Only',
    labelTh: 'เฉพาะสำเร็จ (Success / Nominal)',
    dotColor: '#10B981',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    description: 'FIPS 140-3 L4 HSM ratified, zero-drift validated operations',
  },
  {
    id: 'WARNING_ONLY',
    labelEn: 'Warnings / Jitters Only',
    labelTh: 'เฉพาะคำเตือน (Warnings / Jitters)',
    dotColor: '#F59E0B',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    description: 'Soft latency variations and Cryo-Loop auto-compensated states',
  },
  {
    id: 'CRITICAL_ONLY',
    labelEn: 'Critical / Quarantined Only',
    labelTh: 'เฉพาะวิกฤต (Critical / Quarantined)',
    dotColor: '#EF4444',
    badgeBg: 'bg-rose-500/20',
    badgeText: 'text-rose-300',
    description: 'Zero-Trust fail-closed triggers and adversary intrusion containments',
  },
  {
    id: 'INCIDENTS_ONLY',
    labelEn: 'Incidents Only (Warning + Critical)',
    labelTh: 'เฉพาะเหตุการณ์ผิดปกติ (คำเตือน + วิกฤต)',
    dotColor: '#F43F5E',
    badgeBg: 'bg-rose-950/80',
    badgeText: 'text-rose-200',
    description: 'Filter out nominal traffic to focus exclusively on anomalies',
  },
  {
    id: 'NOMINAL_ONLY',
    labelEn: 'Nominal & Warnings (Exclude Critical)',
    labelTh: 'ปกติและคำเตือน (ไม่รวมวิกฤต)',
    dotColor: '#34D399',
    badgeBg: 'bg-teal-500/20',
    badgeText: 'text-teal-300',
    description: 'Operational traffic with soft fluctuations, excluding isolated intrusions',
  },
];

const SUBSYSTEM_OPTIONS: { id: SubsystemFilter; label: string; desc: string }[] = [
  { id: 'ALL', label: 'All Subsystems', desc: 'Holistic system-wide audit telemetry across all 18 Chambers' },
  { id: 'HSM_QUORUM', label: 'HSM Quorum (CH-01/02)', desc: 'FIPS 140-3 L4 Deca-Custodian key signatures & consensus' },
  { id: 'PQC_CRYPTO', label: 'PQC Cryptography (CH-11/15)', desc: 'Kyber-1024, Dilithium-5 & SPHINCS+ lattice verification' },
  { id: 'LEDGER_ENGINE', label: 'Ledger Engine (CH-05/06)', desc: 'WORM immutable record commits and Merkle root sealing' },
  { id: 'ZERO_TRUST', label: 'Zero-Trust Gate (CH-17/18)', desc: 'Active perimeter intrusion isolation & fail-closed triggers' },
  { id: 'FIOS_SSOT', label: 'Fios SSoT Pipeline', desc: '7-Factor evidence verification & zero drift Δ0.00% validation' },
];

// ==========================================
// GENERATE 30-DAY CANONICAL AUDIT DATASET
// ==========================================

function generate30DayAuditData(): DailyAuditLogTrend[] {
  const days: DailyAuditLogTrend[] = [];
  const baseDate = new Date(2026, 8, 5); // September 5, 2026
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
const EARLIEST_DATE = RAW_30D_DATA[0].date;
const LATEST_DATE = RAW_30D_DATA[RAW_30D_DATA.length - 1].date;

// ==========================================
// DEDICATED AUDIT LOG DATE RANGE PICKER COMPONENT
// ==========================================

export interface AuditLogDateRangePickerProps {
  startDate: string;
  endDate: string;
  earliestDate: string;
  latestDate: string;
  startDayIndex: number;
  endDayIndex: number;
  activePreset: TimeWindowPreset;
  rawDays: DailyAuditLogTrend[];
  totalLogsInInterval: number;
  onPresetSelect: (preset: TimeWindowPreset) => void;
  onCustomDateChange: (start: string, end: string) => void;
  onSliderRangeChange: (startDay: number, endDay: number) => void;
  onShiftInterval: (direction: 'left' | 'right') => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const AuditLogDateRangePicker: React.FC<AuditLogDateRangePickerProps> = ({
  startDate,
  endDate,
  earliestDate,
  latestDate,
  startDayIndex,
  endDayIndex,
  activePreset,
  rawDays,
  totalLogsInInterval,
  onPresetSelect,
  onCustomDateChange,
  onSliderRangeChange,
  onShiftInterval,
  isOpen,
  onToggleOpen,
}) => {
  const dayCount = Math.max(1, endDayIndex - startDayIndex + 1);

  return (
    <div className="flex-1 min-w-[320px] space-y-1 font-mono">
      {/* Top Header Label & Active Interval Pill */}
      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold">
        <span className="flex items-center gap-1.5 uppercase tracking-wider">
          <CalendarRange className="w-3.5 h-3.5 text-cyan-400" />
          <span>Dynamic Date Range Picker (ช่วงเวลาวิเคราะห์):</span>
        </span>
        <span className="text-cyan-300 font-normal flex items-center gap-1">
          <span className="font-bold text-white">{startDate}</span>
          <span className="text-zinc-500">→</span>
          <span className="font-bold text-white">{endDate}</span>
          <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
            {dayCount} {dayCount === 1 ? 'Day' : 'Days'}
          </span>
        </span>
      </div>

      {/* Primary Toolbar: Quick Presets + Interval Shift + Custom Trigger */}
      <div className="flex flex-wrap items-center gap-1.5 bg-black/60 p-1.5 rounded-xl border border-white/10">
        {/* Preset Buttons */}
        {(['3d', '7d', '14d', '30d'] as const).map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onPresetSelect(preset)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activePreset === preset
                ? 'bg-cyan-500/30 text-cyan-100 border border-cyan-400/60 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {preset === '3d' && 'Last 3D'}
            {preset === '7d' && 'Last 7D'}
            {preset === '14d' && 'Last 14D'}
            {preset === '30d' && 'Full 30D'}
          </button>
        ))}

        {/* Pan / Shift Interval Window */}
        <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => onShiftInterval('left')}
            disabled={startDayIndex <= 1}
            title="Shift interval earlier in time"
            className="px-2 py-0.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-0.5 text-[11px]"
          >
            <span>◀</span>
            <span className="hidden sm:inline">Prev</span>
          </button>
          <span className="text-zinc-600 text-[10px]">|</span>
          <button
            type="button"
            onClick={() => onShiftInterval('right')}
            disabled={endDayIndex >= 30}
            title="Shift interval later in time"
            className="px-2 py-0.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-0.5 text-[11px]"
          >
            <span className="hidden sm:inline">Next</span>
            <span>▶</span>
          </button>
        </div>

        {/* Toggle Custom Dates Drawer */}
        <button
          type="button"
          onClick={onToggleOpen}
          className={`ml-auto px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
            activePreset === 'custom' || isOpen
              ? 'bg-purple-950/80 text-purple-200 border-purple-400/60 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
              : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/5'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5 text-purple-400" />
          <span>Interval Studio</span>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
        </button>
      </div>

      {/* Expandable Custom Date Range Studio with Day Grid, Date Pickers & Dual Scrubber */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="pt-3 border-t border-cyan-500/20 space-y-3 overflow-hidden font-mono"
          >
            {/* Interactive 30-Day Timeline Track */}
            <div className="space-y-1.5 p-3 rounded-xl bg-black/70 border border-white/10">
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span className="flex items-center gap-1.5 font-bold">
                  <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
                  <span>Interactive 30-Day Timeline Track (คลิกเพื่อเลือกวันเริ่มต้น/สิ้นสุด):</span>
                </span>
                <span className="text-zinc-500 text-[9px]">
                  Click day chip to set interval bounds · Red dots indicate peak anomalies
                </span>
              </div>

              {/* 30 Day Chips Grid */}
              <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 lg:grid-cols-30 gap-1 pt-1">
                {rawDays.map((d) => {
                  const inRange = d.dayIndex >= startDayIndex && d.dayIndex <= endDayIndex;
                  const isStart = d.dayIndex === startDayIndex;
                  const isEnd = d.dayIndex === endDayIndex;
                  const isPeak = d.criticalEvents > 300;

                  return (
                    <button
                      key={d.dayIndex}
                      type="button"
                      onClick={() => {
                        playTone(680, 0.02);
                        if (d.dayIndex < startDayIndex) {
                          onSliderRangeChange(d.dayIndex, endDayIndex);
                        } else if (d.dayIndex > endDayIndex) {
                          onSliderRangeChange(startDayIndex, d.dayIndex);
                        } else {
                          const distToStart = Math.abs(d.dayIndex - startDayIndex);
                          const distToEnd = Math.abs(d.dayIndex - endDayIndex);
                          if (distToStart <= distToEnd) {
                            onSliderRangeChange(d.dayIndex, endDayIndex);
                          } else {
                            onSliderRangeChange(startDayIndex, d.dayIndex);
                          }
                        }
                      }}
                      title={`Day #${d.dayIndex} (${d.date}): ${(d.totalEvents).toLocaleString()} events ${isPeak ? '(Peak Incidents)' : ''}`}
                      className={`relative p-1 rounded-md text-[10px] text-center transition-all cursor-pointer flex flex-col items-center justify-center border ${
                        isStart || isEnd
                          ? 'bg-cyan-500 text-black font-extrabold border-cyan-300 shadow-[0_0_8px_#06B6D4]'
                          : inRange
                          ? 'bg-cyan-950/80 text-cyan-200 border-cyan-500/50'
                          : 'bg-white/5 text-zinc-500 hover:text-zinc-300 hover:bg-white/10 border-white/5'
                      }`}
                    >
                      <span className="leading-none text-[9px]">#{d.dayIndex}</span>
                      <span className="leading-none text-[8px] opacity-70">{d.displayDate.split('/')[1]}</span>
                      {isPeak && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 border border-black shadow-[0_0_4px_#EF4444]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date Inputs & Dual Scrubber Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs items-center">
              {/* Start Date Input */}
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 block font-bold">Start Date (วันเริ่มต้น):</label>
                <input
                  type="date"
                  min={earliestDate}
                  max={endDate}
                  value={startDate}
                  onChange={(e) => onCustomDateChange(e.target.value, endDate)}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/80 border border-cyan-500/40 text-cyan-200 text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* End Date Input */}
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 block font-bold">End Date (วันสิ้นสุด):</label>
                <input
                  type="date"
                  min={startDate}
                  max={latestDate}
                  value={endDate}
                  onChange={(e) => onCustomDateChange(startDate, e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/80 border border-cyan-500/40 text-cyan-200 text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Scrubber / Slider Day 1 to 30 */}
              <div className="sm:col-span-2 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                  <span>Day Range Scrubber:</span>
                  <span className="text-cyan-300 font-bold">
                    Day #{startDayIndex} to #{endDayIndex} ({dayCount} Days) · {totalLogsInInterval.toLocaleString()} logs
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1}
                    max={endDayIndex}
                    value={startDayIndex}
                    onChange={(e) => onSliderRangeChange(Number(e.target.value), endDayIndex)}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                    title="Adjust start day"
                  />
                  <input
                    type="range"
                    min={startDayIndex}
                    max={30}
                    value={endDayIndex}
                    onChange={(e) => onSliderRangeChange(startDayIndex, Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                    title="Adjust end day"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-white/5">
              <span>Earliest dataset available: {earliestDate}</span>
              <button
                type="button"
                onClick={() => onPresetSelect('30d')}
                className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
              >
                Reset to Full 30-Day Window
              </button>
              <span>Latest sealed block: {latestDate} (#849202)</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==========================================
// MAIN AUDIT LOG TRENDS VIEW COMPONENT
// ==========================================

export const AuditLogTrendsView: React.FC<{
  onNavigate?: (view: any) => void;
  onAddSystemEvent?: (event: any) => void;
}> = ({ onNavigate }) => {
  // State: Time window & Custom Date Range
  const [timePreset, setTimePreset] = useState<TimeWindowPreset>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>(RAW_30D_DATA[0].date);
  const [customEndDate, setCustomEndDate] = useState<string>(RAW_30D_DATA[RAW_30D_DATA.length - 1].date);
  const [startDayIndex, setStartDayIndex] = useState<number>(1);
  const [endDayIndex, setEndDayIndex] = useState<number>(30);
  const [isDateRangePickerOpen, setIsDateRangePickerOpen] = useState<boolean>(false);

  // State: Event Type Filter Dropdown
  const [eventTypeFilter, setEventTypeFilter] = useState<EventTypeFilter>('ALL');
  const [isEventTypeDropdownOpen, setIsEventTypeDropdownOpen] = useState<boolean>(false);

  // State: Chart & Subsystem Modes
  const [chartMode, setChartMode] = useState<ChartDisplayMode>('stacked-area');
  const [subsystemFilter, setSubsystemFilter] = useState<SubsystemFilter>('ALL');
  const [showSuccess, setShowSuccess] = useState<boolean>(true);
  const [showWarning, setShowWarning] = useState<boolean>(true);
  const [showCritical, setShowCritical] = useState<boolean>(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(30);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // State: Interactive Legend Category Hover & Chart Point Hover Sync
  const [hoveredLegendCategory, setHoveredLegendCategory] = useState<'success' | 'warning' | 'critical' | null>(null);
  const [hoveredChartDay, setHoveredChartDay] = useState<any | null>(null);

  // State: Click-and-Drag Zoom Feature
  const [zoomRefAreaLeft, setZoomRefAreaLeft] = useState<string | null>(null);
  const [zoomRefAreaRight, setZoomRefAreaRight] = useState<string | null>(null);
  const [isDraggingZoom, setIsDraggingZoom] = useState<boolean>(false);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [preZoomRange, setPreZoomRange] = useState<{ start: string; end: string } | null>(null);

  // State: Average Event Count Threshold Reference Line
  const [showAverageThreshold, setShowAverageThreshold] = useState<boolean>(true);

  // State: Injected Adversarial Stress Test Anomalies for Automated Verification Demo
  const [isInjectedStressMode, setIsInjectedStressMode] = useState<boolean>(false);

  // Quick Preset Handlers
  const handlePresetSelect = (preset: TimeWindowPreset) => {
    playTone(540, 0.02);
    setTimePreset(preset);
    if (preset === '3d') {
      const start = RAW_30D_DATA[RAW_30D_DATA.length - 3];
      const end = RAW_30D_DATA[RAW_30D_DATA.length - 1];
      setCustomStartDate(start.date);
      setCustomEndDate(end.date);
      setStartDayIndex(start.dayIndex);
      setEndDayIndex(end.dayIndex);
    } else if (preset === '7d') {
      const start = RAW_30D_DATA[RAW_30D_DATA.length - 7];
      const end = RAW_30D_DATA[RAW_30D_DATA.length - 1];
      setCustomStartDate(start.date);
      setCustomEndDate(end.date);
      setStartDayIndex(start.dayIndex);
      setEndDayIndex(end.dayIndex);
    } else if (preset === '14d') {
      const start = RAW_30D_DATA[RAW_30D_DATA.length - 14];
      const end = RAW_30D_DATA[RAW_30D_DATA.length - 1];
      setCustomStartDate(start.date);
      setCustomEndDate(end.date);
      setStartDayIndex(start.dayIndex);
      setEndDayIndex(end.dayIndex);
    } else if (preset === '30d') {
      const start = RAW_30D_DATA[0];
      const end = RAW_30D_DATA[RAW_30D_DATA.length - 1];
      setCustomStartDate(start.date);
      setCustomEndDate(end.date);
      setStartDayIndex(start.dayIndex);
      setEndDayIndex(end.dayIndex);
    }
  };

  // Custom Start/End Date Change Handler
  const handleCustomDateChange = (start: string, end: string) => {
    if (start > end) return;
    setCustomStartDate(start);
    setCustomEndDate(end);
    setTimePreset('custom');

    const sIdx = RAW_30D_DATA.findIndex((d) => d.date >= start);
    const eIdx = RAW_30D_DATA.findLastIndex((d) => d.date <= end);
    if (sIdx !== -1) setStartDayIndex(sIdx + 1);
    if (eIdx !== -1) setEndDayIndex(eIdx + 1);
  };

  // Slider change handler
  const handleSliderRangeChange = (sIdx: number, eIdx: number) => {
    const clampedS = Math.max(1, Math.min(sIdx, eIdx));
    const clampedE = Math.min(30, Math.max(sIdx, eIdx));
    setStartDayIndex(clampedS);
    setEndDayIndex(clampedE);
    setCustomStartDate(RAW_30D_DATA[clampedS - 1].date);
    setCustomEndDate(RAW_30D_DATA[clampedE - 1].date);
    setTimePreset('custom');
  };

  // Interval Shift Handler (Shift timeframe window left or right)
  const handleShiftInterval = useCallback(
    (direction: 'left' | 'right') => {
      playTone(560, 0.02);
      const currentLength = endDayIndex - startDayIndex + 1;
      const shiftStep = Math.max(1, Math.min(7, Math.floor(currentLength / 2)));

      let newStart = startDayIndex;
      let newEnd = endDayIndex;

      if (direction === 'left') {
        newStart = Math.max(1, startDayIndex - shiftStep);
        newEnd = Math.min(30, newStart + currentLength - 1);
      } else {
        newEnd = Math.min(30, endDayIndex + shiftStep);
        newStart = Math.max(1, newEnd - currentLength + 1);
      }

      handleSliderRangeChange(newStart, newEnd);
    },
    [startDayIndex, endDayIndex]
  );

  // Filtered dataset based on customizable date range + subsystem + event type
  const windowedData = useMemo(() => {
    let sliced = RAW_30D_DATA.filter((d) => d.date >= customStartDate && d.date <= customEndDate);
    if (sliced.length === 0) sliced = [RAW_30D_DATA[RAW_30D_DATA.length - 1]];

    // Apply subsystem weight scaling if not ALL
    if (subsystemFilter !== 'ALL') {
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

    // Apply Log Event Type Filter to Recharts Series values
    sliced = sliced.map((item) => {
      let activeSuccess = item.successEvents;
      let activeWarning = item.warningEvents;
      let activeCritical = item.criticalEvents;

      // Injected Adversarial Stress Test Scenario: Spike Day 27 & Day 28
      if (isInjectedStressMode) {
        if (item.dayIndex === 27) {
          // Surge Day 27: Massive volumetric load + quarantine spike
          activeSuccess = Math.round(activeSuccess * 1.55);
          activeWarning = Math.round(activeWarning * 4.2);
          activeCritical = Math.round(activeCritical * 9.8) + 12500;
        } else if (item.dayIndex === 28) {
          // Contained Day 28: Elevated warning & high critical quarantine containment
          activeSuccess = Math.round(activeSuccess * 1.35);
          activeWarning = Math.round(activeWarning * 5.8) + 9400;
          activeCritical = Math.round(activeCritical * 7.5) + 8200;
        }
      }

      if (eventTypeFilter === 'SUCCESS_ONLY') {
        activeWarning = 0;
        activeCritical = 0;
      } else if (eventTypeFilter === 'WARNING_ONLY') {
        activeSuccess = 0;
        activeCritical = 0;
      } else if (eventTypeFilter === 'CRITICAL_ONLY') {
        activeSuccess = 0;
        activeWarning = 0;
      } else if (eventTypeFilter === 'INCIDENTS_ONLY') {
        activeSuccess = 0;
      } else if (eventTypeFilter === 'NOMINAL_ONLY') {
        activeCritical = 0;
      }

      const activeTotal = activeSuccess + activeWarning + activeCritical;

      return {
        ...item,
        // Chart display keys refined by event type filter
        chartSuccessEvents: activeSuccess,
        chartWarningEvents: activeWarning,
        chartCriticalEvents: activeCritical,
        chartTotalEvents: activeTotal,
        chartSuccessRate: activeTotal > 0 ? Number(((activeSuccess / activeTotal) * 100).toFixed(2)) : 0,
        chartWarningRate: activeTotal > 0 ? Number(((activeWarning / activeTotal) * 100).toFixed(2)) : 0,
        chartCriticalRate: activeTotal > 0 ? Number(((activeCritical / activeTotal) * 100).toFixed(2)) : 0,
      };
    });

    return sliced;
  }, [customStartDate, customEndDate, subsystemFilter, eventTypeFilter, isInjectedStressMode]);

  // Click-and-Drag Zoom Handlers
  const handleChartMouseDown = useCallback((e: any) => {
    if (e && e.activeLabel) {
      setZoomRefAreaLeft(e.activeLabel);
      setZoomRefAreaRight(e.activeLabel);
      setIsDraggingZoom(true);
    }
  }, []);

  const handleChartMouseMove = useCallback(
    (e: any) => {
      if (e && e.activePayload && e.activePayload[0]) {
        setHoveredChartDay(e.activePayload[0].payload as DailyAuditLogTrend);
      }
      if (isDraggingZoom && e && e.activeLabel) {
        setZoomRefAreaRight(e.activeLabel);
      }
    },
    [isDraggingZoom]
  );

  const handleChartMouseUp = useCallback(() => {
    if (!isDraggingZoom) return;
    setIsDraggingZoom(false);

    if (!zoomRefAreaLeft || !zoomRefAreaRight || zoomRefAreaLeft === zoomRefAreaRight) {
      setZoomRefAreaLeft(null);
      setZoomRefAreaRight(null);
      return;
    }

    let leftIdx = windowedData.findIndex((d) => d.displayDate === zoomRefAreaLeft);
    let rightIdx = windowedData.findIndex((d) => d.displayDate === zoomRefAreaRight);

    if (leftIdx === -1 || rightIdx === -1) {
      setZoomRefAreaLeft(null);
      setZoomRefAreaRight(null);
      return;
    }

    if (leftIdx > rightIdx) {
      const temp = leftIdx;
      leftIdx = rightIdx;
      rightIdx = temp;
    }

    const zoomedStart = windowedData[leftIdx].date;
    const zoomedEnd = windowedData[rightIdx].date;

    if (zoomedStart === zoomedEnd) {
      setZoomRefAreaLeft(null);
      setZoomRefAreaRight(null);
      return;
    }

    if (!isZoomed) {
      setPreZoomRange({ start: customStartDate, end: customEndDate });
    }

    playTone(880, 0.04);
    setCustomStartDate(zoomedStart);
    setCustomEndDate(zoomedEnd);
    setTimePreset('custom');
    setIsZoomed(true);

    const sIdx = RAW_30D_DATA.findIndex((d) => d.date >= zoomedStart);
    const eIdx = RAW_30D_DATA.findLastIndex((d) => d.date <= zoomedEnd);
    if (sIdx !== -1) setStartDayIndex(sIdx + 1);
    if (eIdx !== -1) setEndDayIndex(eIdx + 1);

    setZoomRefAreaLeft(null);
    setZoomRefAreaRight(null);
  }, [isDraggingZoom, zoomRefAreaLeft, zoomRefAreaRight, windowedData, isZoomed, customStartDate, customEndDate]);

  const handleResetZoom = useCallback(() => {
    playTone(520, 0.03);
    if (preZoomRange) {
      setCustomStartDate(preZoomRange.start);
      setCustomEndDate(preZoomRange.end);
      const sIdx = RAW_30D_DATA.findIndex((d) => d.date >= preZoomRange.start);
      const eIdx = RAW_30D_DATA.findLastIndex((d) => d.date <= preZoomRange.end);
      if (sIdx !== -1) setStartDayIndex(sIdx + 1);
      if (eIdx !== -1) setEndDayIndex(eIdx + 1);
    } else {
      handlePresetSelect('30d');
    }
    setIsZoomed(false);
    setPreZoomRange(null);
    setZoomRefAreaLeft(null);
    setZoomRefAreaRight(null);
  }, [preZoomRange]);

  // Aggregated KPIs
  const summaryKpis = useMemo(() => {
    const total = windowedData.reduce((acc, d: any) => acc + (d.chartTotalEvents ?? d.totalEvents), 0);
    const success = windowedData.reduce((acc, d: any) => acc + (d.chartSuccessEvents ?? d.successEvents), 0);
    const warning = windowedData.reduce((acc, d: any) => acc + (d.chartWarningEvents ?? d.warningEvents), 0);
    const critical = windowedData.reduce((acc, d: any) => acc + (d.chartCriticalEvents ?? d.criticalEvents), 0);
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
    const list = [];
    if (summaryKpis.successEvents > 0) {
      list.push({ name: 'Success / Nominal', value: summaryKpis.successEvents, color: '#10B981', fill: '#10B981' });
    }
    if (summaryKpis.warningEvents > 0) {
      list.push({ name: 'Warnings / Jitters', value: summaryKpis.warningEvents, color: '#F59E0B', fill: '#F59E0B' });
    }
    if (summaryKpis.criticalEvents > 0) {
      list.push({ name: 'Critical / Contained', value: summaryKpis.criticalEvents, color: '#EF4444', fill: '#EF4444' });
    }
    if (list.length === 0) {
      list.push({ name: 'No Events in Filter', value: 1, color: '#71717A', fill: '#71717A' });
    }
    return list;
  }, [summaryKpis]);

  // Selected Day Detail
  const selectedDay = useMemo(() => {
    if (selectedDayIndex === null) return windowedData[windowedData.length - 1] || null;
    return RAW_30D_DATA.find((d) => d.dayIndex === selectedDayIndex) || windowedData[windowedData.length - 1] || null;
  }, [selectedDayIndex, windowedData]);

  // Search filtered table rows
  const tableRows = useMemo(() => {
    let rows = windowedData;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(
        (d) =>
          d.date.includes(q) ||
          d.displayDate.includes(q) ||
          d.weekday.toLowerCase().includes(q) ||
          d.primarySubsystem.toLowerCase().includes(q) ||
          d.pqcSealDigest.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [windowedData, searchQuery]);

  // Active Event Type Option Object
  const currentEventTypeOption = useMemo(() => {
    return EVENT_TYPE_OPTIONS.find((opt) => opt.id === eventTypeFilter) || EVENT_TYPE_OPTIONS[0];
  }, [eventTypeFilter]);

  // Dynamic Y-Axis Scaling: Automatically computes max scale with clean headroom based on the selected date range & filters
  const { dynamicYAxisMax, peakStackedEvents, dynamicCriticalRateMax, averageThresholdEvents, anomalyDaysAboveAverage } = useMemo(() => {
    if (!windowedData || windowedData.length === 0) {
      return { dynamicYAxisMax: 60000, peakStackedEvents: 50000, dynamicCriticalRateMax: 2.0, averageThresholdEvents: 30000, anomalyDaysAboveAverage: 0 };
    }

    let maxStacked = 0;
    let maxCritRate = 0;

    for (const d of windowedData) {
      let daySum = 0;
      if (showSuccess) daySum += (d.chartSuccessEvents ?? d.successEvents ?? 0);
      if (showWarning) daySum += (d.chartWarningEvents ?? d.warningEvents ?? 0);
      if (showCritical) daySum += (d.chartCriticalEvents ?? d.criticalEvents ?? 0);
      if (daySum > maxStacked) maxStacked = daySum;

      const critRate = d.chartCriticalRate ?? d.criticalRate ?? 0;
      if (critRate > maxCritRate) maxCritRate = critRate;
    }

    if (maxStacked <= 0) {
      return { dynamicYAxisMax: 100, peakStackedEvents: 0, dynamicCriticalRateMax: 2.0, averageThresholdEvents: 0, anomalyDaysAboveAverage: 0 };
    }

    // Add 12% headroom so the curve doesn't touch the top ceiling of the chart
    const targetWithHeadroom = maxStacked * 1.12;
    let calculatedMax = 100;

    if (targetWithHeadroom <= 50) calculatedMax = Math.ceil(targetWithHeadroom / 5) * 5;
    else if (targetWithHeadroom <= 200) calculatedMax = Math.ceil(targetWithHeadroom / 20) * 20;
    else if (targetWithHeadroom <= 500) calculatedMax = Math.ceil(targetWithHeadroom / 50) * 50;
    else if (targetWithHeadroom <= 1000) calculatedMax = Math.ceil(targetWithHeadroom / 100) * 100;
    else if (targetWithHeadroom <= 2500) calculatedMax = Math.ceil(targetWithHeadroom / 250) * 250;
    else if (targetWithHeadroom <= 5000) calculatedMax = Math.ceil(targetWithHeadroom / 500) * 500;
    else if (targetWithHeadroom <= 10000) calculatedMax = Math.ceil(targetWithHeadroom / 1000) * 1000;
    else if (targetWithHeadroom <= 25000) calculatedMax = Math.ceil(targetWithHeadroom / 2500) * 2500;
    else if (targetWithHeadroom <= 50000) calculatedMax = Math.ceil(targetWithHeadroom / 5000) * 5000;
    else if (targetWithHeadroom <= 100000) calculatedMax = Math.ceil(targetWithHeadroom / 10000) * 10000;
    else calculatedMax = Math.ceil(targetWithHeadroom / 25000) * 25000;

    const scaledCritRateMax = Math.min(100, Math.max(0.5, Number((maxCritRate * 1.3).toFixed(1))));

    // Calculate average event count threshold across windowed days for active categories
    let totalWindowedSum = 0;
    for (const d of windowedData) {
      let daySum = 0;
      if (showSuccess) daySum += (d.chartSuccessEvents ?? d.successEvents ?? 0);
      if (showWarning) daySum += (d.chartWarningEvents ?? d.warningEvents ?? 0);
      if (showCritical) daySum += (d.chartCriticalEvents ?? d.criticalEvents ?? 0);
      totalWindowedSum += daySum;
    }
    const daysCount = Math.max(1, windowedData.length);
    const averageThreshold = Math.round(totalWindowedSum / daysCount);

    // Count anomaly days above threshold
    let anomalyDaysAboveAverage = 0;
    for (const d of windowedData) {
      let daySum = 0;
      if (showSuccess) daySum += (d.chartSuccessEvents ?? d.successEvents ?? 0);
      if (showWarning) daySum += (d.chartWarningEvents ?? d.warningEvents ?? 0);
      if (showCritical) daySum += (d.chartCriticalEvents ?? d.criticalEvents ?? 0);
      if (daySum > averageThreshold) {
        anomalyDaysAboveAverage++;
      }
    }

    return {
      dynamicYAxisMax: calculatedMax,
      peakStackedEvents: maxStacked,
      dynamicCriticalRateMax: scaledCritRateMax,
      averageThresholdEvents: averageThreshold,
      anomalyDaysAboveAverage,
    };
  }, [windowedData, showSuccess, showWarning, showCritical]);

  // Dynamic Y-Axis Tick Formatter
  const formatDynamicYAxisTick = useCallback(
    (v: number) => {
      if (v === 0) return '0';
      if (dynamicYAxisMax <= 1000) return v.toLocaleString();
      if (dynamicYAxisMax < 10000) return `${(v / 1000).toFixed(1)}k`;
      return `${(v / 1000).toFixed(0)}k`;
    },
    [dynamicYAxisMax]
  );

  // Category Detailed Statistics for Interactive Legend Hover
  const categoryStats = useMemo(() => {
    let successPeak = 0;
    let warningPeak = 0;
    let criticalPeak = 0;
    let successPeakDate = '';
    let warningPeakDate = '';
    let criticalPeakDate = '';

    for (const d of windowedData) {
      const s = d.chartSuccessEvents ?? d.successEvents ?? 0;
      const w = d.chartWarningEvents ?? d.warningEvents ?? 0;
      const c = d.chartCriticalEvents ?? d.criticalEvents ?? 0;
      if (s > successPeak) {
        successPeak = s;
        successPeakDate = d.displayDate;
      }
      if (w > warningPeak) {
        warningPeak = w;
        warningPeakDate = d.displayDate;
      }
      if (c > criticalPeak) {
        criticalPeak = c;
        criticalPeakDate = d.displayDate;
      }
    }

    const days = Math.max(1, windowedData.length);
    return {
      success: {
        total: summaryKpis.successEvents,
        percentage: summaryKpis.successPercentage,
        avgDaily: Math.round(summaryKpis.successEvents / days),
        peak: successPeak,
        peakDate: successPeakDate || 'N/A',
      },
      warning: {
        total: summaryKpis.warningEvents,
        percentage: summaryKpis.warningPercentage,
        avgDaily: Math.round(summaryKpis.warningEvents / days),
        peak: warningPeak,
        peakDate: warningPeakDate || 'N/A',
      },
      critical: {
        total: summaryKpis.criticalEvents,
        percentage: summaryKpis.criticalPercentage,
        avgDaily: Math.round(summaryKpis.criticalEvents / days),
        peak: criticalPeak,
        peakDate: criticalPeakDate || 'N/A',
      },
    };
  }, [windowedData, summaryKpis]);

  // Recharts Interactive Legend Component
  const renderCustomInteractiveLegend = useCallback(() => {
    return (
      <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-2 px-1 text-xs font-mono select-none">
        <div className="flex flex-wrap items-center gap-2">
          {/* Success Legend Button with Hover Event Count */}
          <div
            onMouseEnter={() => {
              playTone(660, 0.015);
              setHoveredLegendCategory('success');
            }}
            onMouseLeave={() => setHoveredLegendCategory(null)}
            onClick={() => {
              playTone(700, 0.02);
              setShowSuccess((prev) => !prev);
            }}
            className={`relative group flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              !showSuccess
                ? 'opacity-40 bg-zinc-900/60 border-zinc-700/40 text-zinc-500'
                : hoveredLegendCategory === 'success'
                ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400/50'
                : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/70 hover:border-emerald-400/60'
            }`}
            title="Click to toggle visibility. Hover to view count and highlight area."
          >
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shrink-0 shadow-sm" />
            <span className="font-bold text-[11px]">Success</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-200 text-[10px] font-bold tabular-nums">
              {hoveredChartDay
                ? (hoveredChartDay.chartSuccessEvents ?? hoveredChartDay.successEvents ?? 0).toLocaleString()
                : summaryKpis.successEvents.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-300/80 hidden sm:inline tabular-nums">
              ({hoveredChartDay
                ? (((hoveredChartDay.chartSuccessEvents ?? hoveredChartDay.successEvents ?? 0) / ((hoveredChartDay.chartTotalEvents ?? hoveredChartDay.totalEvents) || 1)) * 100).toFixed(1)
                : summaryKpis.successPercentage}%)
            </span>

            {/* Hover Popover with full stats */}
            <AnimatePresence>
              {hoveredLegendCategory === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-1.5 z-40 p-2.5 rounded-xl bg-[#081515] border border-emerald-500/50 shadow-2xl backdrop-blur-xl min-w-[220px] text-left pointer-events-none space-y-1.5"
                >
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1 text-[10px] text-emerald-300 font-bold">
                    <span>SUCCESS TELEMETRY</span>
                    <span className="text-[9px] px-1 rounded bg-emerald-500/20">{showSuccess ? 'VISIBLE' : 'HIDDEN'}</span>
                  </div>
                  <div className="text-[11px] space-y-1">
                    <div className="flex justify-between text-zinc-300">
                      <span className="text-zinc-400">Total Count:</span>
                      <span className="font-bold text-emerald-300 tabular-nums">{summaryKpis.successEvents.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-zinc-300">
                      <span className="text-zinc-400">Range Share:</span>
                      <span className="font-bold text-emerald-300 tabular-nums">{summaryKpis.successPercentage}%</span>
                    </div>
                    <div className="flex justify-between text-zinc-300">
                      <span className="text-zinc-400">Daily Average:</span>
                      <span className="font-bold text-emerald-300 tabular-nums">{categoryStats.success.avgDaily.toLocaleString()} / day</span>
                    </div>
                    <div className="flex justify-between text-zinc-300">
                      <span className="text-zinc-400">Peak Day:</span>
                      <span className="font-bold text-emerald-300 tabular-nums">{categoryStats.success.peakDate} ({categoryStats.success.peak.toLocaleString()})</span>
                    </div>
                  </div>
                  <div className="text-[9px] text-emerald-400/80 pt-1 border-t border-emerald-500/20">
                    Click to toggle · Area highlighted in stream
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Warning Legend Button with Hover Event Count */}
          <div
            onMouseEnter={() => {
              playTone(660, 0.015);
              setHoveredLegendCategory('warning');
            }}
            onMouseLeave={() => setHoveredLegendCategory(null)}
            onClick={() => {
              playTone(700, 0.02);
              setShowWarning((prev) => !prev);
            }}
            className={`relative group flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              !showWarning
                ? 'opacity-40 bg-zinc-900/60 border-zinc-700/40 text-zinc-500'
                : hoveredLegendCategory === 'warning'
                ? 'bg-amber-950/90 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)] ring-1 ring-amber-400/50'
                : 'bg-amber-950/40 border-amber-500/30 text-amber-300 hover:bg-amber-950/70 hover:border-amber-400/60'
            }`}
            title="Click to toggle visibility. Hover to view count and highlight area."
          >
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 shrink-0 shadow-sm" />
            <span className="font-bold text-[11px]">Warning</span>
            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-200 text-[10px] font-bold tabular-nums">
              {hoveredChartDay
                ? (hoveredChartDay.chartWarningEvents ?? hoveredChartDay.warningEvents ?? 0).toLocaleString()
                : summaryKpis.warningEvents.toLocaleString()}
            </span>
            <span className="text-[10px] text-amber-300/80 hidden sm:inline tabular-nums">
              ({hoveredChartDay
                ? (((hoveredChartDay.chartWarningEvents ?? hoveredChartDay.warningEvents ?? 0) / ((hoveredChartDay.chartTotalEvents ?? hoveredChartDay.totalEvents) || 1)) * 100).toFixed(1)
                : summaryKpis.warningPercentage}%)
            </span>

            {/* Hover Popover */}
            <AnimatePresence>
              {hoveredLegendCategory === 'warning' && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-1.5 z-40 p-2.5 rounded-xl bg-[#171105] border border-amber-500/50 shadow-2xl backdrop-blur-xl min-w-[220px] text-left pointer-events-none space-y-1.5"
                >
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-1 text-[10px] text-amber-300 font-bold">
                    <span>WARNING TELEMETRY</span>
                    <span className="text-[9px] px-1 rounded bg-amber-500/20">{showWarning ? 'VISIBLE' : 'HIDDEN'}</span>
                  </div>
                  <div className="text-[11px] space-y-1">
                    <div className="flex justify-between text-zinc-300">
                      <span className="text-zinc-400">Total Count:</span>
                      <span className="font-bold text-amber-300 tabular-nums">{summaryKpis.warningEvents.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-zinc-300">
                      <span className="text-zinc-400">Range Share:</span>
                      <span className="font-bold text-amber-300 tabular-nums">{summaryKpis.warningPercentage}%</span>
                    </div>
                    <div className="flex justify-between text-zinc-300">
                      <span className="text-zinc-400">Daily Average:</span>
                      <span className="font-bold text-amber-300 tabular-nums">{categoryStats.warning.avgDaily.toLocaleString()} / day</span>
                    </div>
                    <div className="flex justify-between text-zinc-300">
                      <span className="text-zinc-400">Peak Day:</span>
                      <span className="font-bold text-amber-300 tabular-nums">{categoryStats.warning.peakDate} ({categoryStats.warning.peak.toLocaleString()})</span>
                    </div>
                  </div>
                  <div className="text-[9px] text-amber-400/80 pt-1 border-t border-amber-500/20">
                    Click to toggle · Area highlighted in stream
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Critical Legend Button with Hover Event Count */}
          <div
            onMouseEnter={() => {
              playTone(660, 0.015);
              setHoveredLegendCategory('critical');
            }}
            onMouseLeave={() => setHoveredLegendCategory(null)}
            onClick={() => {
              playTone(700, 0.02);
              setShowCritical((prev) => !prev);
            }}
            className={`relative group flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              !showCritical
                ? 'opacity-40 bg-zinc-900/60 border-zinc-700/40 text-zinc-500'
                : hoveredLegendCategory === 'critical'
                ? 'bg-rose-950/90 border-rose-400 text-rose-200 shadow-[0_0_12px_rgba(239,68,68,0.3)] ring-1 ring-rose-400/50'
                : 'bg-rose-950/40 border-rose-500/30 text-rose-300 hover:bg-rose-950/70 hover:border-rose-400/60'
            }`}
            title="Click to toggle visibility. Hover to view count and highlight area."
          >
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 shrink-0 shadow-sm animate-pulse" />
            <span className="font-bold text-[11px]">Critical</span>
            <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-200 text-[10px] font-bold tabular-nums">
              {hoveredChartDay
                ? (hoveredChartDay.chartCriticalEvents ?? hoveredChartDay.criticalEvents ?? 0).toLocaleString()
                : summaryKpis.criticalEvents.toLocaleString()}
            </span>
            <span className="text-[10px] text-rose-300/80 hidden sm:inline tabular-nums">
              ({hoveredChartDay
                ? (((hoveredChartDay.chartCriticalEvents ?? hoveredChartDay.criticalEvents ?? 0) / ((hoveredChartDay.chartTotalEvents ?? hoveredChartDay.totalEvents) || 1)) * 100).toFixed(1)
                : summaryKpis.criticalPercentage}%)
            </span>

            {/* Hover Popover */}
            <AnimatePresence>
              {hoveredLegendCategory === 'critical' && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-1.5 z-40 p-2.5 rounded-xl bg-[#1a0808] border border-rose-500/50 shadow-2xl backdrop-blur-xl min-w-[220px] text-left pointer-events-none space-y-1.5"
                >
                  <div className="flex items-center justify-between border-b border-rose-500/20 pb-1 text-[10px] text-rose-300 font-bold">
                    <span>CRITICAL INCIDENTS</span>
                    <span className="text-[9px] px-1 rounded bg-rose-500/20">{showCritical ? 'VISIBLE' : 'HIDDEN'}</span>
                  </div>
                  <div className="text-[11px] space-y-1">
                    <div className="flex justify-between text-zinc-300">
                      <span className="text-zinc-400">Total Count:</span>
                      <span className="font-bold text-rose-300 tabular-nums">{summaryKpis.criticalEvents.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-zinc-300">
                      <span className="text-zinc-400">Range Share:</span>
                      <span className="font-bold text-rose-300 tabular-nums">{summaryKpis.criticalPercentage}%</span>
                    </div>
                    <div className="flex justify-between text-zinc-300">
                      <span className="text-zinc-400">Daily Average:</span>
                      <span className="font-bold text-rose-300 tabular-nums">{categoryStats.critical.avgDaily.toLocaleString()} / day</span>
                    </div>
                    <div className="flex justify-between text-zinc-300">
                      <span className="text-zinc-400">Peak Day:</span>
                      <span className="font-bold text-rose-300 tabular-nums">{categoryStats.critical.peakDate} ({categoryStats.critical.peak.toLocaleString()})</span>
                    </div>
                  </div>
                  <div className="text-[9px] text-rose-400/80 pt-1 border-t border-rose-500/20">
                    Click to toggle · Area highlighted in stream
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Hover Status Readout & Live Sync */}
        <div className="flex items-center gap-2 text-[10px] text-zinc-400">
          {hoveredChartDay ? (
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>Hovered: <strong>{hoveredChartDay.date}</strong> ({(hoveredChartDay.chartTotalEvents ?? hoveredChartDay.totalEvents).toLocaleString()} events)</span>
            </span>
          ) : hoveredLegendCategory ? (
            <span className="text-zinc-300 flex items-center gap-1">
              <span>Highlighting</span>
              <strong className="text-white uppercase">{hoveredLegendCategory}</strong>
              <span className="text-zinc-500">(hovered count displayed)</span>
            </span>
          ) : (
            <span className="text-zinc-500 hidden md:inline">
              Hover categories to view counts &amp; highlight series
            </span>
          )}
        </div>
      </div>
    );
  }, [
    showSuccess,
    showWarning,
    showCritical,
    hoveredLegendCategory,
    hoveredChartDay,
    summaryKpis,
    categoryStats,
  ]);

  // Export CSV
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

    const rows = windowedData.map((d: any) => [
      d.dayIndex,
      d.date,
      d.weekday,
      d.chartTotalEvents ?? d.totalEvents,
      d.chartSuccessEvents ?? d.successEvents,
      d.chartWarningEvents ?? d.warningEvents,
      d.chartCriticalEvents ?? d.criticalEvents,
      d.chartSuccessRate ?? d.successRate,
      d.chartWarningRate ?? d.warningRate,
      d.chartCriticalRate ?? d.criticalRate,
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
    link.setAttribute('download', `zyrquen-audit-trends-${customStartDate}-to-${customEndDate}-${eventTypeFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    playAuditChime();
  }, [windowedData, customStartDate, customEndDate, eventTypeFilter]);

  // Export JSON
  const handleExportJson = useCallback(() => {
    playTone(720, 0.04);
    const exportPayload = {
      manifest: 'ZYRQUEN Ω∞ Sovereign Audit Log Trends Master',
      generatedUtc: new Date().toISOString(),
      dateWindow: {
        startDate: customStartDate,
        endDate: customEndDate,
        daysCount: windowedData.length,
        preset: timePreset,
      },
      filters: {
        eventTypeFilter,
        subsystemFilter,
      },
      summary: summaryKpis,
      trends: windowedData,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `zyrquen-audit-trends-${customStartDate}-to-${customEndDate}-${eventTypeFilter}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    playAuditChime();
  }, [windowedData, customStartDate, customEndDate, timePreset, eventTypeFilter, subsystemFilter, summaryKpis]);

  // Copy Digest
  const handleCopyDigest = useCallback(() => {
    playTone(800, 0.03);
    const textToCopy = `ZYRQUEN CUSTOM AUDIT LOG TRENDS ATTESTATION\nPeriod: ${customStartDate} to ${customEndDate} (${windowedData.length} Days)\nEvent Type Filter: ${currentEventTypeOption.labelEn}\nSubsystem: ${subsystemFilter}\nTotal Filtered Events: ${summaryKpis.totalEvents.toLocaleString()}\nSuccess: ${summaryKpis.successPercentage}% (${summaryKpis.successEvents.toLocaleString()})\nWarnings: ${summaryKpis.warningPercentage}% (${summaryKpis.warningEvents.toLocaleString()})\nCriticals: ${summaryKpis.criticalPercentage}% (${summaryKpis.criticalEvents.toLocaleString()})\nSSoT Zero-Drift: Δ0.00% Verified\nMerkle Integrity: 100% INTACT\nMaster Seal: 0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68`;
    safeCopyToClipboard(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [customStartDate, customEndDate, windowedData.length, currentEventTypeOption, subsystemFilter, summaryKpis]);

  // Custom Floating Tooltip Renderer with Exact Event Counts & Forensic Telemetry
  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const dataPoint = payload[0]?.payload as any;
    if (!dataPoint) return null;

    const displaySuccess = dataPoint.chartSuccessEvents ?? dataPoint.successEvents ?? 0;
    const displayWarning = dataPoint.chartWarningEvents ?? dataPoint.warningEvents ?? 0;
    const displayCritical = dataPoint.chartCriticalEvents ?? dataPoint.criticalEvents ?? 0;
    const displayTotal =
      dataPoint.chartTotalEvents ??
      dataPoint.totalEvents ??
      (displaySuccess + displayWarning + displayCritical);

    const successPct = displayTotal > 0 ? ((displaySuccess / displayTotal) * 100).toFixed(2) : '0.00';
    const warningPct = displayTotal > 0 ? ((displayWarning / displayTotal) * 100).toFixed(2) : '0.00';
    const criticalPct = displayTotal > 0 ? ((displayCritical / displayTotal) * 100).toFixed(2) : '0.00';

    return (
      <div className="bg-[#070b16]/98 border-2 border-cyan-400/60 rounded-2xl p-4 shadow-[0_16px_40px_rgba(0,0,0,0.85),0_0_24px_rgba(6,182,212,0.3)] backdrop-blur-2xl text-xs font-mono text-zinc-200 min-w-[280px] sm:min-w-[320px] space-y-2.5 pointer-events-none ring-1 ring-cyan-500/20">
        {/* Header: Date, Weekday & Status */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-bold text-white text-xs tracking-tight">
                {dataPoint.date} <span className="text-zinc-400 font-normal">({dataPoint.weekday})</span>
              </div>
              <span className="text-[10px] text-cyan-400/80 font-sans">
                Day #{dataPoint.dayIndex} of 30 · Forensic Audit Point
              </span>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
            SEALED
          </span>
        </div>

        {/* Hero Card: Exact Total Event Count */}
        <div className="p-2.5 rounded-xl bg-black/70 border border-cyan-500/35 flex items-center justify-between shadow-inner">
          <div>
            <span className="text-[10px] font-sans text-zinc-400 uppercase tracking-wider block font-bold">
              Exact Total Event Count
            </span>
            <div className="text-xl font-bold font-mono text-white tabular-nums tracking-tight flex items-baseline gap-1.5">
              <span>{displayTotal.toLocaleString()}</span>
              <span className="text-xs font-normal text-cyan-300">events</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-sans text-zinc-400 block">NOMINAL PASS</span>
            <span className="text-xs font-bold font-mono text-emerald-400 tabular-nums">
              {successPct}%
            </span>
          </div>
        </div>

        {/* Categorical Exact Breakdown */}
        <div className="space-y-1.5 text-[11px] pt-0.5">
          {/* Success */}
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-emerald-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]" />
              <span className="font-semibold">Success (Pass):</span>
            </span>
            <span className="font-bold tabular-nums text-right">
              {displaySuccess.toLocaleString()}{' '}
              <span className="text-[10px] text-emerald-400/80 font-normal">({successPct}%)</span>
            </span>
          </div>

          {/* Warning */}
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-amber-950/30 border border-amber-500/20 text-amber-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#F59E0B]" />
              <span className="font-semibold">Warning (Jitter):</span>
            </span>
            <span className="font-bold tabular-nums text-right">
              {displayWarning.toLocaleString()}{' '}
              <span className="text-[10px] text-amber-400/80 font-normal">({warningPct}%)</span>
            </span>
          </div>

          {/* Critical */}
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-rose-950/30 border border-rose-500/20 text-rose-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_#EF4444] animate-pulse" />
              <span className="font-semibold">Critical (Quarantine):</span>
            </span>
            <span className="font-bold tabular-nums text-right">
              {displayCritical.toLocaleString()}{' '}
              <span className="text-[10px] text-rose-400/80 font-normal">({criticalPct}%)</span>
            </span>
          </div>
        </div>

        {/* Anomaly Detection vs Average Threshold */}
        {showAverageThreshold && averageThresholdEvents > 0 && (
          <div
            className={`p-2 rounded-xl border text-[11px] font-mono flex items-center justify-between ${
              displayTotal > averageThresholdEvents
                ? 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              {displayTotal > averageThresholdEvents ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-pulse" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
              <span>
                {displayTotal > averageThresholdEvents ? (
                  <strong className="text-rose-300">Anomaly Peak Detected</strong>
                ) : (
                  <span className="text-emerald-300">Within Nominal Threshold</span>
                )}
              </span>
            </div>
            <span className="font-bold tabular-nums">
              {displayTotal > averageThresholdEvents ? '+' : ''}
              {(((displayTotal - averageThresholdEvents) / averageThresholdEvents) * 100).toFixed(1)}% vs Avg (
              {averageThresholdEvents.toLocaleString()})
            </span>
          </div>
        )}

        {/* Forensic Metadata: Merkle block & Subsystem */}
        <div className="pt-2 border-t border-white/10 space-y-1 text-[10px] text-zinc-400">
          <div className="flex items-center justify-between">
            <span>Merkle Block Height:</span>
            <span className="text-cyan-300 font-bold">
              #{dataPoint.merkleBlockStart} → #{dataPoint.merkleBlockEnd}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Primary Subsystem:</span>
            <span className="text-zinc-200 font-semibold">{dataPoint.primarySubsystem}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Avg Replay Latency:</span>
            <span className="text-emerald-400 font-bold tabular-nums">{dataPoint.avgLatencyMs} ms</span>
          </div>
        </div>

        {/* Zoom & Interaction Guidance */}
        <div className="text-[9px] text-cyan-400/90 pt-1.5 border-t border-white/5 flex items-center justify-between font-sans">
          <span className="flex items-center gap-1">
            <ZoomIn className="w-3 h-3 text-cyan-300" />
            <span>Click &amp; drag across chart to zoom peak</span>
          </span>
          <span className="text-zinc-500">Click node for day logs</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 font-sans text-zinc-100">
      {/* ========================================================================= */}
      {/* 1. TOP BREADCRUMB & PRIMARY ACTION BAR */}
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
            <span className="text-zinc-300 font-bold">Audit Log Trends &amp; Incident Analytics</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5 flex-wrap">
            <span>Audit Log Distribution &amp; Incident Trends</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
              CUSTOM DATE RANGE &amp; EVENT TYPE FILTER
            </span>
          </h2>
          <p className="text-xs text-zinc-400 max-w-3xl font-sans">
            Refined temporal audit visualization with custom date range selection and granular event type filtering (
            <strong className="text-emerald-300">Success</strong>, <strong className="text-amber-300">Warning</strong>, and{' '}
            <strong className="text-rose-300">Critical</strong>) across all 18 Chambers.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={handleCopyDigest}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
            title="Copy current filtered attestation digest summary to clipboard"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{isCopied ? 'Copied' : 'Copy Digest'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-200 hover:text-white border border-cyan-500/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Export current filtered data as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playTone(isInjectedStressMode ? 440 : 880, 0.03);
              setIsInjectedStressMode((prev) => !prev);
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              isInjectedStressMode
                ? 'bg-rose-950/80 hover:bg-rose-900 border-rose-500 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white'
            }`}
            title="Inject simulated adversarial stress & quarantine anomaly spike to test verification framework"
          >
            {isInjectedStressMode ? (
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Radio className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{isInjectedStressMode ? 'Stress Vector Active (สภาวะวิกฤต)' : 'Simulate Stress Drill'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/50 hover:to-blue-600/50 text-cyan-100 border border-cyan-400/50 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.25)] active:scale-95"
            title="Export full filtered structured JSON audit ledger"
          >
            <Download className="w-3.5 h-3.5 text-cyan-300" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DEDICATED CONTROLS BAR: EVENT TYPE DROPDOWN + CUSTOM DATE RANGE PICKER */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#090D18] via-[#0b1224] to-[#090D18] border border-cyan-500/30 shadow-xl space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 font-mono text-xs">
          {/* FEATURE 1: EVENT TYPE FILTER DROPDOWN */}
          <div className="relative flex-1 min-w-[280px]">
            <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-bold flex items-center gap-1.5">
              <ListFilter className="w-3.5 h-3.5 text-cyan-400" />
              <span>Filter Log Event Types (กรองประเภทเหตุการณ์):</span>
            </label>

            <button
              type="button"
              onClick={() => {
                playTone(isEventTypeDropdownOpen ? 500 : 640, 0.03);
                setIsEventTypeDropdownOpen((prev) => !prev);
              }}
              className="w-full p-2.5 rounded-xl bg-black/70 hover:bg-black/90 border border-cyan-500/40 hover:border-cyan-400 text-left flex items-center justify-between gap-2 transition-all cursor-pointer shadow-inner group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: currentEventTypeOption.dotColor }}
                />
                <span className="font-bold text-white truncate text-xs">{currentEventTypeOption.labelEn}</span>
                <span className="text-[10px] text-zinc-500 hidden sm:inline truncate">
                  ({currentEventTypeOption.labelTh})
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-cyan-400 shrink-0 transition-transform duration-200 ${
                  isEventTypeDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isEventTypeDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="absolute left-0 right-0 top-full mt-2 z-50 p-1.5 rounded-xl bg-[#090e1f] border border-cyan-500/50 shadow-2xl backdrop-blur-2xl space-y-1"
                >
                  {EVENT_TYPE_OPTIONS.map((opt) => {
                    const isSelected = eventTypeFilter === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          playTone(700, 0.03);
                          setEventTypeFilter(opt.id);
                          setIsEventTypeDropdownOpen(false);
                        }}
                        className={`w-full p-2 rounded-lg text-left flex items-start justify-between gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-950/80 border border-cyan-400/50 text-white font-bold shadow-sm'
                            : 'hover:bg-white/5 text-zinc-300 border border-transparent'
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: opt.dotColor }}
                            />
                            <span className="text-xs text-zinc-100 font-bold">{opt.labelEn}</span>
                          </div>
                          <p className="text-[10px] text-zinc-400 font-sans pl-4 leading-tight">
                            {opt.labelTh} · {opt.description}
                          </p>
                        </div>

                        {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* FEATURE 2: DEDICATED AUDIT LOG DATE RANGE PICKER COMPONENT */}
          <AuditLogDateRangePicker
            startDate={customStartDate}
            endDate={customEndDate}
            earliestDate={EARLIEST_DATE}
            latestDate={LATEST_DATE}
            startDayIndex={startDayIndex}
            endDayIndex={endDayIndex}
            activePreset={timePreset}
            rawDays={RAW_30D_DATA}
            totalLogsInInterval={summaryKpis.totalEvents}
            onPresetSelect={handlePresetSelect}
            onCustomDateChange={handleCustomDateChange}
            onSliderRangeChange={handleSliderRangeChange}
            onShiftInterval={handleShiftInterval}
            isOpen={isDateRangePickerOpen}
            onToggleOpen={() => {
              playTone(600, 0.03);
              setIsDateRangePickerOpen((prev) => !prev);
            }}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SUMMARY KPI METRIC STRIP (TABULAR-NUMS & ZERO-PILL DISCIPLINE) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Total Events */}
        <div className="p-3.5 rounded-xl bg-[#090D18]/90 border border-white/8 space-y-1">
          <div className="text-[11px] font-mono text-zinc-400 flex items-center justify-between">
            <span>FILTERED LOGS</span>
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white tabular-nums">
            {summaryKpis.totalEvents.toLocaleString()}
          </div>
          <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
            <span className="text-cyan-400">{windowedData.length} days active</span>
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
      {/* 4. VISUALIZATION MODES & SUBSYSTEM SELECTOR STRIP */}
      {/* ========================================================================= */}
      <div className="p-3 rounded-2xl bg-[#090D18]/90 border border-white/8 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Left: Chart Type Segmented Control */}
        <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/5 flex-wrap">
          <span className="text-zinc-500 px-2 text-[11px]">Chart Type:</span>
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

        {/* Right: Subsystem Quick Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs font-mono">
          <span className="text-zinc-500 text-[11px] shrink-0">Subsystem:</span>
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
      </div>

      {/* ========================================================================= */}
      {/* 5. PRIMARY RECHARTS VISUALIZATION CANVAS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Main Chart View (8 Cols on Desktop) */}
        <div className="lg:col-span-8 p-4 sm:p-5 rounded-2xl bg-[#090D18]/90 border border-white/8 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-2.5 gap-2">
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>
                  {chartMode === 'stacked-area' && 'Event Volume Area Stream (Success, Warning, Critical)'}
                  {chartMode === 'normalized-area' && 'Normalized 100% Severity Composition'}
                  {chartMode === 'grouped-bar' && 'Daily Event Volume & Breakdown'}
                  {chartMode === 'composed-trend' && 'Filtered Event Volume & Incident Alert Rate'}
                </span>
              </h3>
              <span className="text-[11px] text-zinc-400 font-sans">
                Filtered by: <strong className="text-cyan-300">{currentEventTypeOption.labelEn}</strong> · {customStartDate} to {customEndDate}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-zinc-400">
              <span className="px-2.5 py-1 rounded-lg bg-cyan-950/70 border border-cyan-400/40 text-cyan-300 flex items-center gap-1.5 shadow-sm">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Dynamic Y-Scale: <strong>0 → {dynamicYAxisMax.toLocaleString()}</strong> (Peak: {peakStackedEvents.toLocaleString()})</span>
              </span>

              {/* Horizontal Reference Line: Average Event Count Threshold Toggle & Anomaly Indicator */}
              <button
                type="button"
                onClick={() => {
                  playTone(showAverageThreshold ? 480 : 720, 0.02);
                  setShowAverageThreshold((prev) => !prev);
                }}
                className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                  showAverageThreshold
                    ? 'bg-amber-950/60 border-amber-400/60 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/10'
                }`}
                title="Toggle horizontal reference line for average daily event count threshold to detect anomaly spikes"
              >
                <span
                  className={`w-3 h-0.5 border-t-2 border-dashed ${
                    showAverageThreshold ? 'border-amber-400' : 'border-zinc-500'
                  }`}
                />
                <span className="font-bold">Avg Threshold:</span>
                <span className="tabular-nums font-semibold">
                  {averageThresholdEvents.toLocaleString()}
                </span>
                {showAverageThreshold && anomalyDaysAboveAverage > 0 && (
                  <span className="px-1.5 py-0.2 rounded bg-rose-500/25 border border-rose-500/40 text-rose-300 text-[10px] font-bold flex items-center gap-0.5">
                    <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                    <span>{anomalyDaysAboveAverage} Anomaly {anomalyDaysAboveAverage === 1 ? 'Day' : 'Days'}</span>
                  </span>
                )}
              </button>

              {/* Click-and-Drag Zoom Reset & Active Indicator */}
              {isZoomed ? (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-200 hover:text-white flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] cursor-pointer"
                  title="Click to reset zoom back to full timeframe"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-cyan-300" />
                  <span className="font-bold">Reset Zoom</span>
                  <span className="text-[10px] text-cyan-300/80">({windowedData.length}d Zoomed)</span>
                </button>
              ) : (
                <span className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-400 text-[10px]">
                  <ZoomIn className="w-3 h-3 text-cyan-400" />
                  <span>Drag across chart to zoom</span>
                </span>
              )}

              {/* Live Selection Readout during dragging */}
              {isDraggingZoom && zoomRefAreaLeft && zoomRefAreaRight ? (
                <span className="px-2 py-1 rounded-lg bg-cyan-500/30 border border-cyan-400 text-cyan-200 animate-pulse font-bold">
                  Selecting: {zoomRefAreaLeft} → {zoomRefAreaRight}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/40 border border-white/5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>{windowedData.length} Days</span>
                </span>
              )}
            </div>
          </div>

          {/* Recharts Area / Bar / Composed Canvas with Dynamic Entry Animation on Filter/Date Change */}
          <div className="w-full h-[360px] sm:h-[420px] font-mono text-xs relative select-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={`recharts-view-${chartMode}-${eventTypeFilter}-${customStartDate}-${customEndDate}-${subsystemFilter}`}
                initial={{ opacity: 0, scale: 0.975, y: 8, filter: 'blur(4px)' }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.98, y: -6, filter: 'blur(3px)' }}
                transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  {chartMode === 'stacked-area' ? (
                    <AreaChart
                      key={`area-stacked-${eventTypeFilter}-${customStartDate}-${customEndDate}`}
                      data={windowedData}
                      onMouseDown={handleChartMouseDown}
                      onMouseMove={handleChartMouseMove}
                      onMouseUp={handleChartMouseUp}
                      onMouseLeave={() => {
                        setHoveredChartDay(null);
                        if (isDraggingZoom) {
                          setZoomRefAreaLeft(null);
                          setZoomRefAreaRight(null);
                          setIsDraggingZoom(false);
                        }
                      }}
                      onClick={(data: any) => {
                        if (!isDraggingZoom && data && data.activePayload && data.activePayload[0]) {
                          const clicked = data.activePayload[0].payload as DailyAuditLogTrend;
                          playTone(720, 0.03);
                          setSelectedDayIndex(clicked.dayIndex);
                        }
                      }}
                      margin={{ top: 8, right: 10, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.85} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="colorWarning" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.85} />
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.15} />
                        </linearGradient>
                        <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.95} />
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
                        domain={[0, dynamicYAxisMax]}
                        allowDataOverflow={false}
                        tickFormatter={formatDynamicYAxisTick}
                      />
                      <Tooltip
                        content={renderCustomTooltip}
                        cursor={{ stroke: '#06B6D4', strokeWidth: 1.5, strokeDasharray: '3 3' }}
                        isAnimationActive={true}
                        animationDuration={150}
                      />
                      <Legend content={renderCustomInteractiveLegend} verticalAlign="top" height={48} />
                      {showSuccess && (
                        <Area
                          type="monotone"
                          dataKey="chartSuccessEvents"
                          name="Success (Pass)"
                          stackId="1"
                          stroke="#10B981"
                          strokeWidth={hoveredLegendCategory === 'success' ? 3.5 : 2}
                          fillOpacity={hoveredLegendCategory && hoveredLegendCategory !== 'success' ? 0.12 : 1}
                          strokeOpacity={hoveredLegendCategory && hoveredLegendCategory !== 'success' ? 0.22 : 1}
                          fill="url(#colorSuccess)"
                          isAnimationActive={true}
                          animationDuration={950}
                          animationBegin={0}
                          animationEasing="ease-out"
                        />
                      )}
                      {showWarning && (
                        <Area
                          type="monotone"
                          dataKey="chartWarningEvents"
                          name="Warning (Jitter)"
                          stackId="1"
                          stroke="#F59E0B"
                          strokeWidth={hoveredLegendCategory === 'warning' ? 3.5 : 2}
                          fillOpacity={hoveredLegendCategory && hoveredLegendCategory !== 'warning' ? 0.12 : 1}
                          strokeOpacity={hoveredLegendCategory && hoveredLegendCategory !== 'warning' ? 0.22 : 1}
                          fill="url(#colorWarning)"
                          isAnimationActive={true}
                          animationDuration={950}
                          animationBegin={140}
                          animationEasing="ease-out"
                        />
                      )}
                      {showCritical && (
                        <Area
                          type="monotone"
                          dataKey="chartCriticalEvents"
                          name="Critical (Quarantine)"
                          stackId="1"
                          stroke="#EF4444"
                          strokeWidth={hoveredLegendCategory === 'critical' ? 3.5 : 2.5}
                          fillOpacity={hoveredLegendCategory && hoveredLegendCategory !== 'critical' ? 0.12 : 1}
                          strokeOpacity={hoveredLegendCategory && hoveredLegendCategory !== 'critical' ? 0.22 : 1}
                          fill="url(#colorCritical)"
                          isAnimationActive={true}
                          animationDuration={950}
                          animationBegin={260}
                          animationEasing="ease-out"
                        />
                      )}
                      {/* Horizontal Reference Line: Average Event Count Threshold for Anomaly Detection */}
                      {showAverageThreshold && averageThresholdEvents > 0 && (
                        <ReferenceLine
                          y={averageThresholdEvents}
                          stroke="#F59E0B"
                          strokeDasharray="4 4"
                          strokeWidth={2}
                          strokeOpacity={0.9}
                          label={{
                            value: `Avg Threshold: ${averageThresholdEvents.toLocaleString()} events/day`,
                            position: 'insideTopRight',
                            fill: '#FDE68A',
                            fontSize: 10,
                            fontWeight: 'bold',
                            fontFamily: 'monospace',
                            className: 'shadow-sm select-none',
                          }}
                        />
                      )}

                      {/* Click-and-drag zoom preview overlay */}
                      {zoomRefAreaLeft && zoomRefAreaRight && (
                        <ReferenceArea
                          x1={zoomRefAreaLeft}
                          x2={zoomRefAreaRight}
                          strokeOpacity={0.8}
                          stroke="#06B6D4"
                          fill="#06B6D4"
                          fillOpacity={0.25}
                        />
                      )}
                    </AreaChart>
                  ) : chartMode === 'normalized-area' ? (
                    <AreaChart
                      key={`area-norm-${eventTypeFilter}-${customStartDate}-${customEndDate}`}
                      data={windowedData}
                      onMouseDown={handleChartMouseDown}
                      onMouseMove={handleChartMouseMove}
                      onMouseUp={handleChartMouseUp}
                      onMouseLeave={() => {
                        setHoveredChartDay(null);
                        if (isDraggingZoom) {
                          setZoomRefAreaLeft(null);
                          setZoomRefAreaRight(null);
                          setIsDraggingZoom(false);
                        }
                      }}
                      onClick={(data: any) => {
                        if (!isDraggingZoom && data && data.activePayload && data.activePayload[0]) {
                          const clicked = data.activePayload[0].payload as DailyAuditLogTrend;
                          playTone(720, 0.03);
                          setSelectedDayIndex(clicked.dayIndex);
                        }
                      }}
                      margin={{ top: 8, right: 10, left: -10, bottom: 0 }}
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
                      <Tooltip
                        content={renderCustomTooltip}
                        cursor={{ stroke: '#06B6D4', strokeWidth: 1.5, strokeDasharray: '3 3' }}
                        isAnimationActive={true}
                        animationDuration={150}
                      />
                      <Legend content={renderCustomInteractiveLegend} verticalAlign="top" height={48} />
                      {showSuccess && (
                        <Area
                          type="monotone"
                          dataKey="chartSuccessRate"
                          name="Success %"
                          stackId="pct"
                          stroke="#10B981"
                          strokeWidth={hoveredLegendCategory === 'success' ? 3.5 : 2}
                          fillOpacity={hoveredLegendCategory && hoveredLegendCategory !== 'success' ? 0.2 : 1}
                          strokeOpacity={hoveredLegendCategory && hoveredLegendCategory !== 'success' ? 0.25 : 1}
                          fill="url(#normSuccess)"
                          isAnimationActive={true}
                          animationDuration={900}
                          animationBegin={0}
                          animationEasing="ease-out"
                        />
                      )}
                      {showWarning && (
                        <Area
                          type="monotone"
                          dataKey="chartWarningRate"
                          name="Warning %"
                          stackId="pct"
                          stroke="#F59E0B"
                          strokeWidth={hoveredLegendCategory === 'warning' ? 3.5 : 2}
                          fillOpacity={hoveredLegendCategory && hoveredLegendCategory !== 'warning' ? 0.2 : 1}
                          strokeOpacity={hoveredLegendCategory && hoveredLegendCategory !== 'warning' ? 0.25 : 1}
                          fill="url(#normWarning)"
                          isAnimationActive={true}
                          animationDuration={900}
                          animationBegin={120}
                          animationEasing="ease-out"
                        />
                      )}
                      {showCritical && (
                        <Area
                          type="monotone"
                          dataKey="chartCriticalRate"
                          name="Critical %"
                          stackId="pct"
                          stroke="#EF4444"
                          strokeWidth={hoveredLegendCategory === 'critical' ? 3.5 : 2}
                          fillOpacity={hoveredLegendCategory && hoveredLegendCategory !== 'critical' ? 0.2 : 1}
                          strokeOpacity={hoveredLegendCategory && hoveredLegendCategory !== 'critical' ? 0.25 : 1}
                          fill="url(#normCritical)"
                          isAnimationActive={true}
                          animationDuration={900}
                          animationBegin={240}
                          animationEasing="ease-out"
                        />
                      )}
                      {/* Click-and-drag zoom preview overlay */}
                      {zoomRefAreaLeft && zoomRefAreaRight && (
                        <ReferenceArea
                          x1={zoomRefAreaLeft}
                          x2={zoomRefAreaRight}
                          strokeOpacity={0.8}
                          stroke="#06B6D4"
                          fill="#06B6D4"
                          fillOpacity={0.25}
                        />
                      )}
                    </AreaChart>
                  ) : chartMode === 'grouped-bar' ? (
                    <BarChart
                      key={`bar-group-${eventTypeFilter}-${customStartDate}-${customEndDate}`}
                      data={windowedData}
                      onMouseDown={handleChartMouseDown}
                      onMouseMove={handleChartMouseMove}
                      onMouseUp={handleChartMouseUp}
                      onMouseLeave={() => {
                        setHoveredChartDay(null);
                        if (isDraggingZoom) {
                          setZoomRefAreaLeft(null);
                          setZoomRefAreaRight(null);
                          setIsDraggingZoom(false);
                        }
                      }}
                      onClick={(data: any) => {
                        if (!isDraggingZoom && data && data.activePayload && data.activePayload[0]) {
                          const clicked = data.activePayload[0].payload as DailyAuditLogTrend;
                          playTone(720, 0.03);
                          setSelectedDayIndex(clicked.dayIndex);
                        }
                      }}
                      margin={{ top: 8, right: 10, left: -10, bottom: 0 }}
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
                        domain={[0, dynamicYAxisMax]}
                        allowDataOverflow={false}
                        tickFormatter={formatDynamicYAxisTick}
                      />
                      <Tooltip
                        content={renderCustomTooltip}
                        cursor={{ fill: 'rgba(6,182,212,0.08)' }}
                        isAnimationActive={true}
                        animationDuration={150}
                      />
                      <Legend content={renderCustomInteractiveLegend} verticalAlign="top" height={48} />
                      {showSuccess && (
                        <Bar
                          dataKey="chartSuccessEvents"
                          name="Success"
                          stackId="a"
                          fill="#10B981"
                          opacity={hoveredLegendCategory && hoveredLegendCategory !== 'success' ? 0.2 : 1}
                          radius={[0, 0, 0, 0]}
                          isAnimationActive={true}
                          animationDuration={850}
                          animationBegin={0}
                        />
                      )}
                      {showWarning && (
                        <Bar
                          dataKey="chartWarningEvents"
                          name="Warning"
                          stackId="a"
                          fill="#F59E0B"
                          opacity={hoveredLegendCategory && hoveredLegendCategory !== 'warning' ? 0.2 : 1}
                          radius={[0, 0, 0, 0]}
                          isAnimationActive={true}
                          animationDuration={850}
                          animationBegin={100}
                        />
                      )}
                      {showCritical && (
                        <Bar
                          dataKey="chartCriticalEvents"
                          name="Critical"
                          stackId="a"
                          fill="#EF4444"
                          opacity={hoveredLegendCategory && hoveredLegendCategory !== 'critical' ? 0.2 : 1}
                          radius={[4, 4, 0, 0]}
                          isAnimationActive={true}
                          animationDuration={850}
                          animationBegin={200}
                        />
                      )}
                      {/* Horizontal Reference Line: Average Event Count Threshold for Anomaly Detection */}
                      {showAverageThreshold && averageThresholdEvents > 0 && (
                        <ReferenceLine
                          y={averageThresholdEvents}
                          stroke="#F59E0B"
                          strokeDasharray="4 4"
                          strokeWidth={2}
                          strokeOpacity={0.9}
                          label={{
                            value: `Avg: ${averageThresholdEvents.toLocaleString()}`,
                            position: 'insideTopRight',
                            fill: '#FDE68A',
                            fontSize: 10,
                            fontWeight: 'bold',
                            fontFamily: 'monospace',
                          }}
                        />
                      )}

                      {/* Click-and-drag zoom preview overlay */}
                      {zoomRefAreaLeft && zoomRefAreaRight && (
                        <ReferenceArea
                          x1={zoomRefAreaLeft}
                          x2={zoomRefAreaRight}
                          strokeOpacity={0.8}
                          stroke="#06B6D4"
                          fill="#06B6D4"
                          fillOpacity={0.25}
                        />
                      )}
                    </BarChart>
                  ) : (
                    /* Composed Chart: Total Volume Bar + Critical Rate Line */
                    <ComposedChart
                      key={`composed-trend-${eventTypeFilter}-${customStartDate}-${customEndDate}`}
                      data={windowedData}
                      onMouseDown={handleChartMouseDown}
                      onMouseMove={handleChartMouseMove}
                      onMouseUp={handleChartMouseUp}
                      onMouseLeave={() => {
                        setHoveredChartDay(null);
                        if (isDraggingZoom) {
                          setZoomRefAreaLeft(null);
                          setZoomRefAreaRight(null);
                          setIsDraggingZoom(false);
                        }
                      }}
                      onClick={(data: any) => {
                        if (!isDraggingZoom && data && data.activePayload && data.activePayload[0]) {
                          const clicked = data.activePayload[0].payload as DailyAuditLogTrend;
                          playTone(720, 0.03);
                          setSelectedDayIndex(clicked.dayIndex);
                        }
                      }}
                      margin={{ top: 8, right: 20, left: -10, bottom: 0 }}
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
                        domain={[0, dynamicYAxisMax]}
                        allowDataOverflow={false}
                        tickFormatter={formatDynamicYAxisTick}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#EF4444"
                        fontSize={10}
                        domain={[0, dynamicCriticalRateMax]}
                        tickLine={false}
                        axisLine={{ stroke: '#EF4444' }}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        content={renderCustomTooltip}
                        cursor={{ stroke: '#06B6D4', strokeWidth: 1.5, strokeDasharray: '3 3' }}
                        isAnimationActive={true}
                        animationDuration={150}
                      />
                      <Legend content={renderCustomInteractiveLegend} verticalAlign="top" height={48} />
                      <Bar
                        yAxisId="left"
                        dataKey="chartTotalEvents"
                        name="Filtered Volume"
                        fill="#06B6D4"
                        opacity={0.4}
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={true}
                        animationDuration={850}
                        animationBegin={0}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="chartCriticalRate"
                        name="Critical Rate %"
                        stroke="#EF4444"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#EF4444' }}
                        isAnimationActive={true}
                        animationDuration={1000}
                        animationBegin={200}
                      />
                      {/* Horizontal Reference Line: Average Event Count Threshold for Anomaly Detection */}
                      {showAverageThreshold && averageThresholdEvents > 0 && (
                        <ReferenceLine
                          yAxisId="left"
                          y={averageThresholdEvents}
                          stroke="#F59E0B"
                          strokeDasharray="4 4"
                          strokeWidth={2}
                          strokeOpacity={0.9}
                          label={{
                            value: `Avg: ${averageThresholdEvents.toLocaleString()}`,
                            position: 'insideTopRight',
                            fill: '#FDE68A',
                            fontSize: 10,
                            fontWeight: 'bold',
                            fontFamily: 'monospace',
                          }}
                        />
                      )}

                      {/* Click-and-drag zoom preview overlay */}
                      {zoomRefAreaLeft && zoomRefAreaRight && (
                        <ReferenceArea
                          yAxisId="left"
                          x1={zoomRefAreaLeft}
                          x2={zoomRefAreaRight}
                          strokeOpacity={0.8}
                          stroke="#06B6D4"
                          fill="#06B6D4"
                          fillOpacity={0.25}
                        />
                      )}
                    </ComposedChart>
                  )}
                </ResponsiveContainer>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Interactive Chart Legend Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-white/5 text-[11px] font-mono text-zinc-400">
            <div className="flex flex-wrap items-center gap-3">
              {/* Success */}
              <button
                type="button"
                onMouseEnter={() => {
                  playTone(660, 0.01);
                  setHoveredLegendCategory('success');
                }}
                onMouseLeave={() => setHoveredLegendCategory(null)}
                onClick={() => {
                  playTone(700, 0.02);
                  setShowSuccess((prev) => !prev);
                }}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  !showSuccess
                    ? 'opacity-40 bg-zinc-900 border-zinc-700 text-zinc-500'
                    : hoveredLegendCategory === 'success'
                    ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200 ring-1 ring-emerald-400/40 shadow-sm'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span className="font-semibold">Success</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-200 font-bold tabular-nums">
                  {hoveredChartDay
                    ? (hoveredChartDay.chartSuccessEvents ?? hoveredChartDay.successEvents ?? 0).toLocaleString()
                    : summaryKpis.successEvents.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-400/70">
                  ({hoveredChartDay
                    ? (((hoveredChartDay.chartSuccessEvents ?? hoveredChartDay.successEvents ?? 0) / ((hoveredChartDay.chartTotalEvents ?? hoveredChartDay.totalEvents) || 1)) * 100).toFixed(1)
                    : summaryKpis.successPercentage}%)
                </span>
              </button>

              {/* Warning */}
              <button
                type="button"
                onMouseEnter={() => {
                  playTone(660, 0.01);
                  setHoveredLegendCategory('warning');
                }}
                onMouseLeave={() => setHoveredLegendCategory(null)}
                onClick={() => {
                  playTone(700, 0.02);
                  setShowWarning((prev) => !prev);
                }}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  !showWarning
                    ? 'opacity-40 bg-zinc-900 border-zinc-700 text-zinc-500'
                    : hoveredLegendCategory === 'warning'
                    ? 'bg-amber-950/90 border-amber-400 text-amber-200 ring-1 ring-amber-400/40 shadow-sm'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span className="font-semibold">Warning</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-200 font-bold tabular-nums">
                  {hoveredChartDay
                    ? (hoveredChartDay.chartWarningEvents ?? hoveredChartDay.warningEvents ?? 0).toLocaleString()
                    : summaryKpis.warningEvents.toLocaleString()}
                </span>
                <span className="text-[10px] text-amber-400/70">
                  ({hoveredChartDay
                    ? (((hoveredChartDay.chartWarningEvents ?? hoveredChartDay.warningEvents ?? 0) / ((hoveredChartDay.chartTotalEvents ?? hoveredChartDay.totalEvents) || 1)) * 100).toFixed(1)
                    : summaryKpis.warningPercentage}%)
                </span>
              </button>

              {/* Critical */}
              <button
                type="button"
                onMouseEnter={() => {
                  playTone(660, 0.01);
                  setHoveredLegendCategory('critical');
                }}
                onMouseLeave={() => setHoveredLegendCategory(null)}
                onClick={() => {
                  playTone(700, 0.02);
                  setShowCritical((prev) => !prev);
                }}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  !showCritical
                    ? 'opacity-40 bg-zinc-900 border-zinc-700 text-zinc-500'
                    : hoveredLegendCategory === 'critical'
                    ? 'bg-rose-950/90 border-rose-400 text-rose-200 ring-1 ring-rose-400/40 shadow-sm'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 animate-pulse" />
                <span className="font-semibold">Critical</span>
                <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-200 font-bold tabular-nums">
                  {hoveredChartDay
                    ? (hoveredChartDay.chartCriticalEvents ?? hoveredChartDay.criticalEvents ?? 0).toLocaleString()
                    : summaryKpis.criticalEvents.toLocaleString()}
                </span>
                <span className="text-[10px] text-rose-400/70">
                  ({hoveredChartDay
                    ? (((hoveredChartDay.chartCriticalEvents ?? hoveredChartDay.criticalEvents ?? 0) / ((hoveredChartDay.chartTotalEvents ?? hoveredChartDay.totalEvents) || 1)) * 100).toFixed(1)
                    : summaryKpis.criticalPercentage}%)
                </span>
              </button>

              {/* Restore All Series Button */}
              {(!showSuccess || !showWarning || !showCritical) && (
                <button
                  type="button"
                  onClick={() => {
                    playTone(600, 0.02);
                    setShowSuccess(true);
                    setShowWarning(true);
                    setShowCritical(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-zinc-300 hover:text-white text-[10px] font-bold border border-white/10 transition-all cursor-pointer"
                >
                  Restore All Series
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 text-zinc-500">
              <span>Hover category to inspect counts &amp; highlight series · Click to toggle</span>
            </div>
          </div>
        </div>

        {/* Right / Donut & Severity Composition (4 Cols on Desktop) */}
        <div className="lg:col-span-4 p-4 sm:p-5 rounded-2xl bg-[#090D18]/90 border border-white/8 space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Severity Ratio ({customStartDate} - {customEndDate})</span>
            </h3>
            <span className="text-[11px] text-zinc-400 font-sans">
              Cumulative breakdown across {summaryKpis.totalEvents.toLocaleString()} active filtered logs
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
                    `${Number(val).toLocaleString()} (${(((Number(val) || 0) / (summaryKpis.totalEvents || 1)) * 100).toFixed(2)}%)`,
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
            <span>ETDA Sec 9/26/28 · PDPA Sec 37</span>
            <span className="text-cyan-300 font-bold">Δ0.00% Zero-Drift</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. SELECTED DAY FORENSIC DRILLDOWN DRAWER */}
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
      {/* 7. CUSTOM DATE RANGE TABLE WITH SEARCH */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#090D18]/90 border border-white/8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/8 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              <span>Granular Audit Distribution Table ({customStartDate} → {customEndDate})</span>
            </h3>
            <p className="text-xs text-zinc-400 font-sans">
              Showing {tableRows.length} daily rows filtered by {currentEventTypeOption.labelEn}
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
                <th className="py-2.5 px-3 font-semibold text-right">Filtered Total</th>
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
              {tableRows.map((row: any) => {
                const isSelected = selectedDayIndex === row.dayIndex;
                const dTotal = row.chartTotalEvents ?? row.totalEvents;
                const dSuccess = row.chartSuccessEvents ?? row.successEvents;
                const dWarning = row.chartWarningEvents ?? row.warningEvents;
                const dCritical = row.chartCriticalEvents ?? row.criticalEvents;
                const dPassRate = row.chartSuccessRate ?? row.successRate;

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
                      {dTotal.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-emerald-400">
                      {dSuccess.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-amber-400">
                      {dWarning.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-rose-400">
                      {dCritical.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          dPassRate >= 97
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {dPassRate}%
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
