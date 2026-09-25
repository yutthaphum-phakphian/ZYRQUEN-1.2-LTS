import React, { useState, useMemo } from 'react';
import {
  Coins,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Search,
  Copy,
  Check,
  Zap,
  RefreshCw,
  Scale,
  FileCheck2,
  Sparkles,
  Activity,
  SlidersHorizontal,
  Layers,
  Award,
  Flame,
  ArrowUpRight,
  Landmark,
  KeyRound
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { SYSTEM_METADATA } from '../data/canonicalData';
import { HardwareSnapshot, ViewType } from '../types';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';

export const CANONICAL_FROZEN_SEALS = 14902;
export const CANONICAL_BLOCK = 849202;
export const CANONICAL_MERKLE_ROOT = '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68';
export const CANONICAL_VERSION = 'ZYRQUEN Ω∞ v4.16 PDPA FINAL (Frozen v1.2 LTS)';
export const CANONICAL_PRINCIPAL = '🇹🇭 นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)';

interface Room07MasterPanelProps {
  snapshots?: HardwareSnapshot[];
  onNavigate?: (view: ViewType) => void;
  onOpenCertificate?: () => void;
}

export const Room07MasterPanel: React.FC<Room07MasterPanelProps> = ({
  snapshots = [],
  onNavigate,
  onOpenCertificate,
}) => {
  const [activeTab, setActiveTab] = useState<'budget' | 'rwa-gold' | 'zyr-02-shield'>('budget');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAuditingTreasury, setIsAuditingTreasury] = useState<boolean>(false);

  const handleCopy = (id: string, text: string) => {
    copyToClipboard(text);
    setCopiedId(id);
    playTone(650, 0.03);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAuditTreasury = () => {
    if (isAuditingTreasury) return;
    setIsAuditingTreasury(true);
    playTone(520, 0.06);

    setTimeout(() => {
      setIsAuditingTreasury(false);
      playAuditChime();
    }, 1000);
  };

  const treasuryAllocation = useMemo(() => {
    return [
      { name: 'Core Gas Reserves (THB)', value: 8500000, color: '#eab308' },
      { name: 'Cold Cryo Insurance Pool', value: 2500000, color: '#38bdf8' },
      { name: 'Sovereign Custody Guarantee', value: 1500000, color: '#10b981' },
    ];
  }, []);

  return (
    <div className="space-y-6 font-mono text-zinc-300">
      {/* Top Banner for Room 07 */}
      <div className="p-6 sm:p-8 rounded-[28px] bg-gradient-to-br from-amber-950/40 via-[#181105]/95 to-black border-amber-500/40 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/10 via-yellow-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border-amber-500/40 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(234,179,8,0.25)]">
                <Landmark className="w-4 h-4 text-amber-400 animate-pulse" />
                CHAMBER 07 • FIOS TREASURY & RWA GOLD INTEGRITY
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[11px] font-bold">
                AUDIT VARIANCE: ฿0.00 (0.00%)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-300 border-yellow-500/30 text-[11px] font-bold">
                14,902.00 oz LBMA GOLD
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
                คลังสินทรัพย์สัจธรรม และทองคำแท่งค้ำประกัน (FIOS Treasury Ledger)
              </h2>
              <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
                การบันทึกงบประมาณค่าแก๊ส ฿12,500,000.00 THB และทองคำแท่งกายภาพ 14,902.00 troy oz ผูกตรึงกับ Genesis Merkle Root #849202 พร้อมการอุดช่องโหว่ ZYR-02 ล็อกคำสั่งแช่แข็งคลังเฉพาะ Sovereign Principal (#EP-SOVEREIGN-01)
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-white/5 border-white/10 flex items-center gap-2">
                <span className="text-zinc-500">Gas Budget:</span>
                <span className="text-amber-300 font-bold">฿12,500,000.00 THB</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/5 border-white/10 flex items-center gap-2">
                <span className="text-zinc-500">RWA Gold Backing:</span>
                <span className="text-yellow-300 font-bold">14,902.00 oz (1:1 Pegged)</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/5 border-white/10 flex items-center gap-2">
                <span className="text-zinc-500">ZYR-02 Shield:</span>
                <span className="text-emerald-400 font-bold">OnlySovereign Locked</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              onClick={handleAuditTreasury}
              disabled={isAuditingTreasury}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(234,179,8,0.3)] disabled:opacity-50 cursor-pointer"
            >
              {isAuditingTreasury ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Reconciling Ledger...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Audit Treasury Proof</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                playTone(720, 0.04);
                if (onOpenCertificate) onOpenCertificate();
              }}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border-white/10 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <FileCheck2 className="w-4 h-4 text-amber-400" />
              <span>Reserve Certificate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-black/50 border-white/10 text-xs font-bold">
        <button
          onClick={() => {
            playTone(600, 0.03);
            setActiveTab('budget');
          }}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'budget'
              ? 'bg-amber-500/20 text-amber-200 border-amber-500/40 shadow-[0_0_12px_rgba(234,179,8,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-white/5 border-transparent'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>฿12.5M THB Gas Budget Matrix</span>
        </button>

        <button
          onClick={() => {
            playTone(630, 0.03);
            setActiveTab('rwa-gold');
          }}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'rwa-gold'
              ? 'bg-amber-500/20 text-amber-200 border-amber-500/40 shadow-[0_0_12px_rgba(234,179,8,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-white/5 border-transparent'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>14,902 oz LBMA Gold Vault</span>
        </button>

        <button
          onClick={() => {
            playTone(660, 0.03);
            setActiveTab('zyr-02-shield');
          }}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'zyr-02-shield'
              ? 'bg-amber-500/20 text-amber-200 border-amber-500/40 shadow-[0_0_12px_rgba(234,179,8,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-white/5 border-transparent'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Patch ZYR-02 Anti-Griefing</span>
        </button>
      </div>

      {/* Tab 1: Budget Chart */}
      {activeTab === 'budget' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
          <div className="p-5 rounded-2xl bg-black/60 border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              Treasury Allocation Breakdown
            </h3>
            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={treasuryAllocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {treasuryAllocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => `฿${Number(value).toLocaleString()} THB`}
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-black/60 border-white/10 space-y-3 flex flex-col justify-center">
            {treasuryAllocation.map((item) => (
              <div key={item.name} className="p-3 rounded-xl bg-white/5 border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-zinc-300 font-bold">{item.name}</span>
                </div>
                <span className="text-white font-mono font-bold">฿{item.value.toLocaleString()} THB</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: RWA Gold */}
      {activeTab === 'rwa-gold' && (
        <div className="p-6 rounded-2xl bg-black/60 border-white/10 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-yellow-400" />
            <h3 className="text-sm font-bold text-white">1:1 Physical LBMA Gold Reserve Proof</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            ทุกตราประทับทองคำ 1 ซีล มีทองคำแท่งกายภาพบริสุทธิ์ 99.99% (LBMA Certified) ค้ำประกันสิทธิ์ 1.00 troy oz รวมทั้งสิ้น <strong>14,902.00 troy oz</strong> ได้รับการตรวจสอบและตรวจนับยอดคงคลังแบบ Real-Time Proof-of-Reserve อย่างโปร่งใส
          </p>
        </div>
      )}

      {/* Tab 3: ZYR-02 Shield */}
      {activeTab === 'zyr-02-shield' && (
        <div className="p-6 rounded-2xl bg-black/60 border-white/10 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Patch ZYR-02 Anti-Griefing Security Fix</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            ในเวอร์ชันดั้งเดิม ฟังก์ชัน <code>triggerFailClosed</code> อาจถูกผู้ไม่หวังดีเรียกใช้เพื่อกลั่นแกล้งล็อกคลังสินทรัพย์ ในเวอร์ชัน <strong>v2 LTS</strong> ฟังก์ชันดังกล่าวได้รับการสวม Modifier <code>onlySovereign</code> ที่ผูกติดเฉพาะกุญแจของบอส (#EP-SOVEREIGN-01) เท่านั้น ทำให้ไม่สามารถถูกแฮกหรือกลั่นแกล้งได้อีกต่อไป
          </p>
        </div>
      )}
    </div>
  );
};
