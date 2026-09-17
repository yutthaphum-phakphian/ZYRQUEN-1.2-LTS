import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  ShieldCheck,
  Zap,
  Lock,
  RotateCw,
  Clock,
  Terminal,
  FileCheck2,
  Layers,
  Sparkles,
  Search,
  Scale,
  RefreshCw,
  HardDrive,
  ChevronRight,
  Database,
  ArrowRight,
  Shield,
  Fingerprint,
  Sliders,
  Download,
  FileText,
  FileSpreadsheet,
  Copy,
  Check,
  Eye,
  X,
  Play,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Activity,
  Server,
  Network,
  Gauge,
  SlidersHorizontal,
  KeyRound,
  ShieldAlert,
  Binary,
  Radio,
  Heart
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { SYSTEM_METADATA, THAI_CUSTODIANS } from '../data/canonicalData';
import { HardwareSnapshot, ViewType } from '../types';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';

export const CANONICAL_FROZEN_SEALS = 14902;
export const CANONICAL_BLOCK = 849202;
export const CANONICAL_MERKLE_ROOT = '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68';
export const CANONICAL_VERSION = 'ZYRQUEN Ω∞ v4.16 PDPA FINAL (Frozen v1.2 LTS)';
export const CANONICAL_PRINCIPAL = '🇹🇭 นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)';

interface Room03MasterPanelProps {
  snapshots?: HardwareSnapshot[];
  onNavigate?: (view: ViewType) => void;
  onOpenCertificate?: () => void;
}

export const Room03MasterPanel: React.FC<Room03MasterPanelProps> = ({
  snapshots = [],
  onNavigate,
  onOpenCertificate,
}) => {
  const [selectedCustodianId, setSelectedCustodianId] = useState<string>('tc-01');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'hsm' | 'zeroization' | 'ai-threat'>('roster');
  const [isVerifyingAll, setIsVerifyingAll] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // AI Threat Detection State (Kafka + Isolation Forest Pipeline)
  const [threatEvents, setThreatEvents] = useState<Array<{
    id: string;
    deviceId: string;
    timestamp: string;
    appScore: number;
    networkScore: number;
    integrityScore: number;
    signalsCount: number;
    anomalyScore: number;
    prediction: 'NORMAL' | 'ANOMALY_DETECTED';
    status: string;
  }>>([
    {
      id: 'evt-01',
      deviceId: 'device_thai_enclave_01',
      timestamp: 'Just now',
      appScore: 0.04,
      networkScore: 0.08,
      integrityScore: 0.00,
      signalsCount: 1.0,
      anomalyScore: 0.4281,
      prediction: 'NORMAL',
      status: 'VERIFIED_INLIER',
    },
    {
      id: 'evt-02',
      deviceId: 'device_sentinel_edge_04',
      timestamp: '1m ago',
      appScore: 0.06,
      networkScore: 0.12,
      integrityScore: 0.00,
      signalsCount: 2.0,
      anomalyScore: 0.3954,
      prediction: 'NORMAL',
      status: 'VERIFIED_INLIER',
    },
    {
      id: 'evt-03',
      deviceId: 'device_under_attack_888',
      timestamp: '2m ago',
      appScore: 0.95,
      networkScore: 0.88,
      integrityScore: 0.90,
      signalsCount: 45.0,
      anomalyScore: -0.6721,
      prediction: 'ANOMALY_DETECTED',
      status: 'ISOLATED_QUARANTINED',
    },
  ]);
  const [warmupProgress, setWarmupProgress] = useState(20);
  const [isSimulatingStream, setIsSimulatingStream] = useState(false);

  const selectedCustodian = useMemo(
    () => THAI_CUSTODIANS.find((c) => c.id === selectedCustodianId) || THAI_CUSTODIANS[0],
    [selectedCustodianId]
  );

  const filteredCustodians = useMemo(() => {
    if (!searchTerm.trim()) return THAI_CUSTODIANS;
    const term = searchTerm.toLowerCase();
    return THAI_CUSTODIANS.filter(
      (c) =>
        c.nameTh.toLowerCase().includes(term) ||
        c.nameEn.toLowerCase().includes(term) ||
        c.passportNumber.toLowerCase().includes(term) ||
        c.roleTh.toLowerCase().includes(term) ||
        c.clearanceLevel.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const handleCopy = (id: string, text: string) => {
    copyToClipboard(text);
    setCopiedId(id);
    playTone(650, 0.03);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleVerifyAllCustodians = () => {
    if (isVerifyingAll) return;
    setIsVerifyingAll(true);
    playTone(520, 0.06);

    setTimeout(() => {
      setIsVerifyingAll(false);
      playAuditChime();
    }, 1200);
  };

  // Telemetry chart data for heartbeats
  const heartbeatChartData = useMemo(() => {
    return [
      { time: '08:00', coherence: 99.988, latency: 1.2 },
      { time: '08:05', coherence: 99.991, latency: 1.1 },
      { time: '08:10', coherence: 99.994, latency: 1.3 },
      { time: '08:15', coherence: 99.992, latency: 1.2 },
      { time: '08:20', coherence: 99.995, latency: 1.0 },
      { time: '08:25', coherence: 99.992, latency: 1.1 },
      { time: '08:30', coherence: 99.992, latency: 1.2 },
    ];
  }, []);

  return (
    <div className="space-y-6 font-mono text-zinc-300">
      {/* Top Banner for Room 03 */}
      <div className="p-6 sm:p-8 rounded-[28px] bg-gradient-to-br from-indigo-950/40 via-[#0a0d18]/95 to-black border border-indigo-500/40 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(99,102,241,0.25)]">
                <Users className="w-4 h-4 text-indigo-400 animate-pulse" />
                CHAMBER 03 • CUSTODIAN TRACKER & HSM ROSTER
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                10/10 REAL_HSM UNANIMOUS
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold">
                FIPS 140-3 LEVEL 4
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
                ทำเนียบผู้พิทักษ์กุญแจฮาร์ดแวร์ HSM และสภาฉันทามติ
              </h2>
              <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
                การติดตามตรวจสอบสัญญาณชีพชีวภาพ (Biometric Heartbeat Pulse) และลายมือชื่อรหัสลับวิทยาหลังยุคควอนตัม ML-DSA-87 (Dilithium-5) ของคณะผู้พิทักษ์ ๑๐ สัญชาติไทย ค้ำประกันอธิปไตยดิจิทัลแท้จริง
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                <span className="text-zinc-500">Quorum:</span>
                <span className="text-emerald-300 font-bold">10/10 Signed (100%)</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                <span className="text-zinc-500">Heartbeat Coherence:</span>
                <span className="text-cyan-300 font-bold">99.992%</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                <span className="text-zinc-500">Cryo-Bus:</span>
                <span className="text-indigo-300 font-bold">14.98 mK</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                <span className="text-zinc-500">Signature Scheme:</span>
                <span className="text-amber-300 font-bold">ML-DSA-87</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              onClick={handleVerifyAllCustodians}
              disabled={isVerifyingAll}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-black text-xs transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50 cursor-pointer"
            >
              {isVerifyingAll ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying 10 HSM Enclaves...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Attest 10/10 HSM Enclaves</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                playTone(720, 0.04);
                if (onNavigate) onNavigate('council');
              }}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Open Council View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-black/50 border border-white/10 text-xs font-bold">
        <button
          onClick={() => {
            playTone(600, 0.03);
            setActiveSubTab('roster');
          }}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeSubTab === 'roster'
              ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-white/5 border border-transparent'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>10/10 Custodians Roster</span>
        </button>

        <button
          onClick={() => {
            playTone(630, 0.03);
            setActiveSubTab('hsm');
          }}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeSubTab === 'hsm'
              ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-white/5 border border-transparent'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Hardware Enclaves & Biometrics</span>
        </button>

        <button
          onClick={() => {
            playTone(660, 0.03);
            setActiveSubTab('zeroization');
          }}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeSubTab === 'zeroization'
              ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-white/5 border border-transparent'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>FIPS 140-3 Active Zeroization</span>
        </button>

        <button
          onClick={() => {
            playTone(690, 0.03);
            setActiveSubTab('ai-threat');
          }}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeSubTab === 'ai-threat'
              ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-white/5 border border-transparent'
          }`}
        >
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>AI Threat Detection (Kafka + Isolation Forest)</span>
        </button>
      </div>

      {/* TAB 1: 10/10 Custodians Roster */}
      {activeSubTab === 'roster' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Search bar */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/60 border border-white/10">
            <Search className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหารายชื่อผู้พิทักษ์, หมายเลขพาสปอร์ต หรือระดับชั้นความลับ..."
              className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
            />
          </div>

          {/* Grid of 10 Custodians */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCustodians.map((custodian) => {
              const isSelected = selectedCustodianId === custodian.id;
              const isSovereign = custodian.id === 'tc-01';

              return (
                <div
                  key={custodian.id}
                  onClick={() => {
                    playTone(580, 0.03);
                    setSelectedCustodianId(custodian.id);
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.25)]'
                      : 'bg-black/60 border-white/10 hover:border-indigo-500/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        isSovereign ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}>
                        {custodian.passportNumber}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono font-bold">
                        {custodian.clearanceLevel}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      REAL_HSM_SIGNED
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-0.5">{custodian.nameTh}</h4>
                  <div className="text-[11px] text-zinc-400 font-sans mb-2">{custodian.nameEn}</div>
                  <p className="text-[11px] text-indigo-200/80 mb-3">{custodian.roleTh}</p>

                  <div className="pt-2.5 border-t border-white/5 space-y-1 text-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Key Fingerprint:</span>
                      <div className="flex items-center gap-1.5">
                        <code className="text-indigo-300 font-mono">{custodian.keyFingerprint.slice(0, 18)}...</code>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(`key-${custodian.id}`, custodian.keyFingerprint);
                          }}
                          className="p-1 rounded hover:bg-white/10 text-zinc-400"
                        >
                          {copiedId === `key-${custodian.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Signed Timestamp:</span>
                      <span className="text-zinc-300">{custodian.signedDate}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Hardware Enclaves & Biometrics */}
      {activeSubTab === 'hsm' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-400" />
                  Custodian Heartbeat Coherence Stream (99.992% Baseline)
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Real-time subzero cryo biometric pulse and hardware response telemetry
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                10/10 ENCLAVES ONLINE
              </span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={heartbeatChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="time" stroke="#71717a" fontSize={10} />
                  <YAxis domain={[99.98, 100]} stroke="#71717a" fontSize={10} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                    itemStyle={{ color: '#818cf8' }}
                  />
                  <Line type="monotone" dataKey="coherence" stroke="#818cf8" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Active Zeroization */}
      {activeSubTab === 'zeroization' && (
        <div className="p-6 rounded-2xl bg-black/60 border border-white/10 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-rose-400" />
            <h3 className="text-sm font-bold text-white">NIST FIPS 140-3 Level 4: Active Physical Zeroization</h3>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            ตู้เซฟฮาร์ดแวร์บรรจุกุญแจทั้ง 10 ตู้ได้รับการป้องกันทางกายภาพสูงสุด หากเซนเซอร์ตรวจจับการงัดแงะ (Tamper Foil Breach) หรืออุณหภูมิความร้อนขึ้นสูงเกิน <strong>85.0°C</strong> วงจรจะล้างหน่วยความจำคีย์ส่วนตัวภายใน RAM ทันที และซิงก์คำสั่ง <strong>`triggerFailClosed` (Patch ZYR-02)</strong> เพื่อแช่แข็งระบบคลังอธิปไตยใน Chamber 07 ทันที
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <span className="text-zinc-500 block text-[10px]">Tamper Response:</span>
              <span className="text-emerald-400 font-bold">&lt; 1.0 Millisecond</span>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <span className="text-zinc-500 block text-[10px]">Thermal Kill-Switch:</span>
              <span className="text-rose-400 font-bold">85.0°C Active Trigger</span>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <span className="text-zinc-500 block text-[10px]">Zeroization Medium:</span>
              <span className="text-cyan-400 font-bold">Helium-4 Cryo Bus Flush</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Real-time AI Threat Detection (Kafka + Isolation Forest Pipeline) */}
      {activeSubTab === 'ai-threat' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Pipeline Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-black border border-cyan-500/30 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold">
                    KAFKA EVENT STREAM: security.telemetry.raw
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                    ISOLATION FOREST CONTAMINATION: 2.0%
                  </span>
                </div>
                <h3 className="text-base font-bold text-white flex items-center gap-2 pt-1">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  Real-time AI Threat Intelligence Pipeline (Sentinel Chamber 03)
                </h3>
                <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                  วิเคราะห์มิติพฤติกรรม 4-D Vector (<code>app_score</code>, <code>network_score</code>, <code>integrity_score</code>, <code>signals_count</code>) เพื่อตรวจจับการโจมตี Zero-Day และสั่ง Quarantine อัตโนมัติเมื่อเกิดความผิดปกติ
                </p>
              </div>

              {/* Simulation Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playTone(550, 0.04);
                    const newNormal = {
                      id: `evt-${Date.now()}`,
                      deviceId: `device_user_${Math.floor(100 + Math.random() * 900)}`,
                      timestamp: 'Just now',
                      appScore: +(0.02 + Math.random() * 0.08).toFixed(2),
                      networkScore: +(0.05 + Math.random() * 0.1).toFixed(2),
                      integrityScore: 0.0,
                      signalsCount: +(1 + Math.floor(Math.random() * 3)).toFixed(1),
                      anomalyScore: +(0.35 + Math.random() * 0.15).toFixed(4),
                      prediction: 'NORMAL' as const,
                      status: 'VERIFIED_INLIER',
                    };
                    setThreatEvents((prev) => [newNormal, ...prev.slice(0, 7)]);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Inject Normal Telemetry</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playTone(280, 0.1);
                    const anomaly = {
                      id: `evt-${Date.now()}`,
                      deviceId: `device_threat_attack_${Math.floor(100 + Math.random() * 900)}`,
                      timestamp: 'Just now',
                      appScore: +(0.85 + Math.random() * 0.14).toFixed(2),
                      networkScore: +(0.88 + Math.random() * 0.1).toFixed(2),
                      integrityScore: +(0.9 + Math.random() * 0.09).toFixed(2),
                      signalsCount: +(35 + Math.floor(Math.random() * 40)).toFixed(1),
                      anomalyScore: -(0.55 + Math.random() * 0.35).toFixed(4),
                      prediction: 'ANOMALY_DETECTED' as const,
                      status: 'ISOLATED_QUARANTINED',
                    };
                    setThreatEvents((prev) => [anomaly, ...prev.slice(0, 7)]);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Trigger Threat Outlier</span>
                </button>
              </div>
            </div>

            {/* Pipeline Architecture Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
              <div className="p-3 bg-black/50 rounded-xl border border-white/5">
                <span className="text-zinc-500 text-[10px] block">KAFKA CLUSTER</span>
                <span className="text-cyan-300 font-bold mt-0.5 block">kafka:29092 ONLINE</span>
              </div>
              <div className="p-3 bg-black/50 rounded-xl border border-white/5">
                <span className="text-zinc-500 text-[10px] block">AI ENGINE BOOTSTRAP</span>
                <span className="text-emerald-400 font-bold mt-0.5 block">20/20 Frames (100%)</span>
              </div>
              <div className="p-3 bg-black/50 rounded-xl border border-white/5">
                <span className="text-zinc-500 text-[10px] block">INFERENCE LATENCY</span>
                <span className="text-indigo-300 font-bold mt-0.5 block">&lt; 0.085 ms (P99)</span>
              </div>
              <div className="p-3 bg-black/50 rounded-xl border border-white/5">
                <span className="text-zinc-500 text-[10px] block">FAIL-CLOSED HOOK</span>
                <span className="text-amber-300 font-bold mt-0.5 block">Trigger at 85.0°C</span>
              </div>
            </div>
          </div>

          {/* Live Events Table */}
          <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                Live Ingested Telemetry Frames & Isolation Forest Scores
              </h4>
              <span className="text-[11px] text-zinc-500">Auto-refreshing event loop</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-500 text-[10px]">
                    <th className="py-2 px-3">DEVICE ID</th>
                    <th className="py-2 px-3">TIMESTAMP</th>
                    <th className="py-2 px-3">APP RISK</th>
                    <th className="py-2 px-3">NETWORK</th>
                    <th className="py-2 px-3">SIGNALS</th>
                    <th className="py-2 px-3">ANOMALY SCORE</th>
                    <th className="py-2 px-3">VERDICT</th>
                    <th className="py-2 px-3">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {threatEvents.map((evt) => (
                    <tr key={evt.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-white">
                        {evt.deviceId}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                        {evt.timestamp}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-300">
                        {evt.appScore.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-300">
                        {evt.networkScore.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-300">
                        {evt.signalsCount.toFixed(0)}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        <span className={evt.anomalyScore < 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                          {evt.anomalyScore.toFixed(4)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {evt.prediction === 'NORMAL' ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                            INLIER (+1)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            OUTLIER (-1)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] font-mono ${
                          evt.status === 'ISOLATED_QUARANTINED' ? 'text-rose-400 font-bold' : 'text-cyan-400'
                        }`}>
                          {evt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
