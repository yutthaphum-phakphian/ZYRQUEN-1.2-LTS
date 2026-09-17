import React, { useState } from 'react';
import {
  Scale,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Layers,
  Sparkles,
  BookOpen,
  Calendar,
  Filter,
  CheckCircle2,
  ExternalLink,
  Shield,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  Legend,
  Cell,
} from 'recharts';
import { playTone } from './AudioSynthesizer';

// 7-Day Query Volume Trend across Thai Legal & Cryptographic Topics
const WEEKLY_SEARCH_TREND = [
  { day: 'Mon (14 Aug)', thaiLaw: 48, pqcStandards: 38, cybersecurity: 24, custodianAuth: 18, total: 128 },
  { day: 'Tue (15 Aug)', thaiLaw: 62, pqcStandards: 45, cybersecurity: 31, custodianAuth: 22, total: 160 },
  { day: 'Wed (16 Aug)', thaiLaw: 58, pqcStandards: 52, cybersecurity: 28, custodianAuth: 25, total: 163 },
  { day: 'Thu (17 Aug)', thaiLaw: 74, pqcStandards: 68, cybersecurity: 36, custodianAuth: 29, total: 207 },
  { day: 'Fri (18 Aug)', thaiLaw: 85, pqcStandards: 74, cybersecurity: 42, custodianAuth: 34, total: 235 },
  { day: 'Sat (19 Aug)', thaiLaw: 92, pqcStandards: 89, cybersecurity: 48, custodianAuth: 38, total: 267 },
  { day: 'Sun (20 Aug)', thaiLaw: 109, pqcStandards: 98, cybersecurity: 54, custodianAuth: 41, total: 302 },
];

const TOP_QUERY_TOPICS = [
  {
    topic: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA Thailand)',
    shortLabel: 'PDPA 2562',
    category: 'Thai Law',
    queries: 528,
    pct: '35.6%',
    growth: '+28.4%',
    color: '#06b6d4',
  },
  {
    topic: 'NIST FIPS 203 / 204 ML-KEM & ML-DSA Post-Quantum Standards',
    shortLabel: 'NIST PQC',
    category: 'Post-Quantum',
    queries: 464,
    pct: '31.3%',
    growth: '+34.2%',
    color: '#8b5cf6',
  },
  {
    topic: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544/2562 (ETDA Digital Signature)',
    shortLabel: 'ETDA Sec 9/26',
    category: 'Electronic Law',
    queries: 245,
    pct: '16.5%',
    growth: '+12.1%',
    color: '#10b981',
  },
  {
    topic: 'พ.ร.บ. การรักษาความมั่นคงปลอดภัยไซเบอร์ พ.ศ. 2562 (NCSA CII)',
    shortLabel: 'NCSA Cyber',
    category: 'Cybersecurity',
    queries: 142,
    pct: '9.6%',
    growth: '+18.7%',
    color: '#f59e0b',
  },
  {
    topic: 'Thai Sovereign Custodian Registry & Merkle Authority (#EP-SOVEREIGN-01)',
    shortLabel: 'Custodians',
    category: 'Sovereign Root',
    queries: 103,
    pct: '7.0%',
    growth: '+9.5%',
    color: '#ec4899',
  },
];

export const SearchInsightsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'TREND' | 'RANKING'>('TREND');

  return (
    <div className="p-6 rounded-[28px] bg-[#0b0e1a]/75 border border-white/8 backdrop-blur-xl space-y-6 font-mono text-xs select-text">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/8 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white uppercase text-sm tracking-wide">
                Thai Legal Search & PQC Query Insights
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold">
                7-DAY ROLLING
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              Weekly analytics and top query topics grounded by Google Search Oracle across Thai statutes and NIST PQC.
            </p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-black/40 border border-white/10 rounded-2xl p-1 text-xs">
          <button
            onClick={() => {
              playTone(550, 0.03);
              setActiveTab('TREND');
            }}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'TREND'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Weekly Trend</span>
          </button>
          <button
            onClick={() => {
              playTone(600, 0.03);
              setActiveTab('RANKING');
            }}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'RANKING'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Top Topics</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">7-Day Total Queries</span>
          <div className="text-lg font-bold text-white flex items-baseline gap-2">
            <span>1,482</span>
            <span className="text-[10px] text-emerald-400 font-normal">+24.8% WoW</span>
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Avg Grounding Accuracy</span>
          <div className="text-lg font-bold text-cyan-300 flex items-baseline gap-2">
            <span>99.8%</span>
            <span className="text-[10px] text-zinc-400 font-normal">Google Oracle</span>
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Avg Response Latency</span>
          <div className="text-lg font-bold text-emerald-300 flex items-baseline gap-2">
            <span>142 ms</span>
            <span className="text-[10px] text-zinc-400 font-normal">Sub-Second</span>
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">PQC Alignment Rate</span>
          <div className="text-lg font-bold text-violet-300 flex items-baseline gap-2">
            <span>100%</span>
            <span className="text-[10px] text-zinc-400 font-normal">NIST Level 5</span>
          </div>
        </div>
      </div>

      {/* Main Visualization Display */}
      {activeTab === 'TREND' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Daily Legal & PQC Grounding Inquiries (Stacked Volume)</span>
            <span className="text-cyan-400">Peak: 302 Queries/Day</span>
          </div>

          <div className="h-[260px] w-full bg-black/30 rounded-2xl p-2 border border-white/5">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={WEEKLY_SEARCH_TREND} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorThaiLaw" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorPqc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCyber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorAuth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="day" stroke="#ffffff40" tick={{ fontSize: 10 }} />
                <YAxis stroke="#ffffff40" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#07080F',
                    borderColor: 'rgba(255,255,255,0.15)',
                    borderRadius: '16px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  formatter={(value) => {
                    const map: Record<string, string> = {
                      thaiLaw: 'Thai Law (PDPA)',
                      pqcStandards: 'NIST PQC (ML-KEM)',
                      cybersecurity: 'Cybersecurity (NCSA)',
                      custodianAuth: 'Custodian Registry',
                    };
                    return map[value] || value;
                  }}
                />
                <Area type="monotone" dataKey="thaiLaw" stackId="1" stroke="#06b6d4" fill="url(#colorThaiLaw)" />
                <Area type="monotone" dataKey="pqcStandards" stackId="1" stroke="#8b5cf6" fill="url(#colorPqc)" />
                <Area type="monotone" dataKey="cybersecurity" stackId="1" stroke="#f59e0b" fill="url(#colorCyber)" />
                <Area type="monotone" dataKey="custodianAuth" stackId="1" stroke="#ec4899" fill="url(#colorAuth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        /* Top Topic Rankings Bar Chart & List */
        <div className="space-y-4">
          <div className="h-[240px] w-full bg-black/30 rounded-2xl p-2 border border-white/5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TOP_QUERY_TOPICS} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                <XAxis type="number" stroke="#ffffff40" tick={{ fontSize: 10 }} />
                <YAxis dataKey="shortLabel" type="category" stroke="#ffffff60" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#07080F',
                    borderColor: 'rgba(255,255,255,0.15)',
                    borderRadius: '16px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                  formatter={(val: number) => [`${val} Inquiries`, 'Query Volume']}
                />
                <Bar dataKey="queries" radius={[0, 8, 8, 0]}>
                  {TOP_QUERY_TOPICS.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            {TOP_QUERY_TOPICS.map((t, idx) => (
              <div
                key={t.topic}
                className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-[10px] text-zinc-400">
                    {idx + 1}
                  </span>
                  <div>
                    <h5 className="font-bold text-zinc-200">{t.topic}</h5>
                    <span className="text-[10px] text-zinc-500 font-sans">Category: {t.category}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-zinc-300 font-bold">{t.queries} queries</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {t.growth}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
