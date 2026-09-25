import React, { useState, useMemo } from 'react';
import {
  Flame,
  RotateCw,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Copy,
  Check,
  Zap,
  Layers,
  Terminal,
  Scale,
  FileCheck2,
  Sparkles,
  ShieldAlert,
  Snowflake,
  Play
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { HardwareSnapshot, ViewType } from '../types';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';
import {
  ZYRQUEN_ENTROPY_CONFIG,
  CH06_SAFETY_STATUS,
} from '../utils/circuitBreakerSafety';

export const CANONICAL_FROZEN_SEALS = 14902;
export const CANONICAL_BLOCK = 849202;
export const CANONICAL_MERKLE_ROOT = '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68';
export const CANONICAL_VERSION = 'ZYRQUEN Ω∞ v4.16 PDPA FINAL (Frozen v1.2 LTS)';
export const CANONICAL_PRINCIPAL = '🇹🇭 นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)';

interface Room06MasterPanelProps {
  snapshots?: HardwareSnapshot[];
  onNavigate?: (view: ViewType) => void;
  onOpenCertificate?: () => void;
}

export const Room06MasterPanel: React.FC<Room06MasterPanelProps> = ({
  snapshots = [],
  onNavigate,
  onOpenCertificate,
}) => {
  const [activeTab, setActiveTab] = useState<'rollback' | 'cryo-flush' | 'drill'>('rollback');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSimulatingRollback, setIsSimulatingRollback] = useState<boolean>(false);
  const [rollbackProgress, setRollbackProgress] = useState<number>(100);

  const handleCopy = (id: string, text: string) => {
    copyToClipboard(text);
    setCopiedId(id);
    playTone(650, 0.03);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTriggerDrill = () => {
    if (isSimulatingRollback) return;
    setIsSimulatingRollback(true);
    setRollbackProgress(0);
    playTone(520, 0.06);

    let step = 0;
    const interval = setInterval(() => {
      step += 20;
      setRollbackProgress(step);
      playTone(450 + step * 5, 0.02);
      if (step >= 100) {
        clearInterval(interval);
        setIsSimulatingRollback(false);
        playAuditChime();
      }
    }, 120);
  };

  // Recovery time telemetry data
  const recoveryChartData = useMemo(() => {
    return [
      { step: 'T-0ms (Detect Anomaly)', latencyMs: 2.1, state: 'ANOMALY_TRIGGER' },
      { step: 'T-10ms (Quarantine Lock)', latencyMs: 8.4, state: 'FAIL_CLOSED' },
      { step: 'T-20ms (Helium-4 Flush)', latencyMs: 14.2, state: 'CRYO_PURGE' },
      { step: 'T-35ms (Snapshot Restore)', latencyMs: 28.6, state: 'GENESIS_REPLAY' },
      { step: 'T-50ms (10/10 Re-attest)', latencyMs: 35.8, state: 'ALL_GREEN' },
    ];
  }, []);

  return (
    <div className="space-y-6 font-mono text-zinc-300">
      {/* Top Banner for Room 06 */}
      <div className="p-6 sm:p-8 rounded-[28px] bg-gradient-to-br from-rose-950/40 via-[#150a0e]/95 to-black border-rose-500/40 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rose-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-rose-500/15 text-rose-300 border-rose-500/40 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(244,63,94,0.25)]">
                <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
                CHAMBER 06 • PHOENIX DISASTER RECOVERY
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[11px] font-bold">
                RTO &lt; 50ms | RPO = 0.00s
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border-cyan-500/30 text-[11px] font-bold">
                14.98 mK HELIUM-4
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
                ศูนย์ฟื้นฟูความเย็นยิ่งยวด และกู้คืนวิกฤตภัยพิบัติ (Phoenix Engine)
              </h2>
              <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
                ระบบย้อนคืนสถานะสัจธรรมสู่บล็อกเจเนซิส #849202 อัตโนมัติในระดับมิลลิวินาที (Deterministic Autonomous Rollback) พร้อมวงจรล้างความร้อนวิกฤต (Helium-4 Cryo Thermal Flush) เพื่อคุ้มครองบูรณภาพข้อมูล 100% ปราศจากการสูญหาย
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-white/5 border-white/10 flex items-center gap-2">
                <span className="text-zinc-500">Recovery Time (RTO):</span>
                <span className="text-emerald-300 font-bold">35.8 ms (Pass &lt; 50ms)</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/5 border-white/10 flex items-center gap-2">
                <span className="text-zinc-500">Data Loss (RPO):</span>
                <span className="text-cyan-300 font-bold">0.00s (Zero Loss)</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border-amber-500/30 flex items-center gap-2">
                <span className="text-zinc-400">Entropy Threshold:</span>
                <span className="text-amber-300 font-bold">{ZYRQUEN_ENTROPY_CONFIG.criticalThresholdKBps.toLocaleString()} KBps</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border-cyan-500/30 flex items-center gap-2">
                <span className="text-zinc-400">TRNG Surges:</span>
                <span className="text-cyan-300 font-bold">Authorized Pass (14.3-14.9k)</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              onClick={handleTriggerDrill}
              disabled={isSimulatingRollback}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-black text-xs transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.3)] disabled:opacity-50 cursor-pointer"
            >
              {isSimulatingRollback ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Drill Active ({rollbackProgress}%)...</span>
                </>
              ) : (
                <>
                  <RotateCw className="w-4 h-4" />
                  <span>Simulate Disaster Drill</span>
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
              <FileCheck2 className="w-4 h-4 text-rose-400" />
              <span>Sovereign Certificate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-black/50 border-white/10 text-xs font-bold">
        <button
          onClick={() => {
            playTone(600, 0.03);
            setActiveTab('rollback');
          }}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'rollback'
              ? 'bg-rose-500/20 text-rose-200 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-white/5 border-transparent'
          }`}
        >
          <RotateCw className="w-4 h-4" />
          <span>Autonomous State Rollback (&lt; 50ms)</span>
        </button>

        <button
          onClick={() => {
            playTone(630, 0.03);
            setActiveTab('cryo-flush');
          }}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'cryo-flush'
              ? 'bg-rose-500/20 text-rose-200 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-white/5 border-transparent'
          }`}
        >
          <Snowflake className="w-4 h-4" />
          <span>Helium-4 Cryo Flush (14.98 mK)</span>
        </button>

        <button
          onClick={() => {
            playTone(660, 0.03);
            setActiveTab('drill');
          }}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'drill'
              ? 'bg-rose-500/20 text-rose-200 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-white/5 border-transparent'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Disaster Simulation Protocol</span>
        </button>
      </div>

      {/* Tab 1: Rollback & Recovery Timing Graph */}
      {activeTab === 'rollback' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-5 rounded-2xl bg-black/60 border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-400" />
                  Deterministic Rollback Timeline Curve (35.8 ms Completion)
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Instant restoration to Sealed Genesis Block #849202 without entropy contamination
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-xs font-bold">
                ZERO DATA LOSS CERTIFIED
              </span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={recoveryChartData}>
                  <defs>
                    <linearGradient id="recoveryGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="step" stroke="#71717a" fontSize={10} />
                  <YAxis stroke="#71717a" fontSize={10} unit="ms" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                    itemStyle={{ color: '#fb7185' }}
                  />
                  <Area type="monotone" dataKey="latencyMs" stroke="#f43f5e" strokeWidth={2} fill="url(#recoveryGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Cryo Flush */}
      {activeTab === 'cryo-flush' && (
        <div className="p-6 rounded-2xl bg-black/60 border-white/10 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <Snowflake className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Helium-4 Cryogenic Purge System</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            ระบบระบายความร้อนด้วยฮีเลียมเหลวบริสุทธิ์ (Helium-4 Subzero Purge) รักษาอุณหภูมิการทำงานของวงแหวนแลตทิซและตู้เซฟฮาร์ดแวร์ไว้ที่ <strong>14.98 mK</strong> อย่างต่อเนื่อง หากเซนเซอร์ตรวจพบความร้อนเพิ่มสูงผิดปกติ ระบบจะทำการฉีดก๊าซหล่อเย็นความดันสูงเพื่อดักจับเอนโทรปีส่วนเกินทันที
          </p>
        </div>
      )}

      {/* Tab 3: Drill */}
      {activeTab === 'drill' && (
        <div className="p-6 rounded-2xl bg-black/60 border-white/10 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-rose-400" />
            <h3 className="text-sm font-bold text-white">Fail-Closed Autonomous Drill Compliance</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            การซ้อมแผนเผชิญเหตุจำลองแบบ Fail-Closed ผ่านการประเมิน 100% โดยจำลองสถานการณ์ความพยายามเจาะระบบ การตัดสัญญาณอินเทอร์เน็ต และการสลับสิทธิ์ฉุกเฉินสู่สภาผู้พิทักษ์ 10/10 REAL_HSM
          </p>
        </div>
      )}
    </div>
  );
};
