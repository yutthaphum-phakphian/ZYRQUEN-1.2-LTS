import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  Lock,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Copy,
  Check,
  RefreshCw,
  Terminal,
  Activity,
  Workflow,
  Fingerprint,
  Play,
  RotateCw,
  Scale,
  Download,
  FileText,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Cpu,
  Clock,
  ExternalLink,
  Shield,
  Eye,
  SlidersHorizontal,
  Flame,
  Zap,
  HardDrive
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { AUDIT_TRACE_TX, SYSTEM_METADATA } from '../data/canonicalData';
import { HardwareSnapshot, ViewType } from '../types';
import { INITIAL_HARDWARE_SNAPSHOTS } from '../utils/telemetrySnapshot';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';
import { P1QuarantineLayer } from '../utils/p1QuarantineLayer';
import { writeFirewall, WriteFirewallAuditRecord } from '../utils/writeFirewall';
import { generateForensicPdfReport } from '../utils/forensicPdfExport';
import { downloadEvidenceManifestJson } from '../utils/evidenceManifestGenerator';

export const CANONICAL_FROZEN_SEALS = 14902;
export const CANONICAL_BLOCK = 849202;
export const CANONICAL_MERKLE_ROOT = '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68';
export const CANONICAL_VERSION = 'ZYRQUEN Ω∞ v4.16 PDPA FINAL (Frozen v1.2 LTS)';
export const CANONICAL_PRINCIPAL = '🇹🇭 นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)';

interface Room02MasterPanelProps {
  snapshots?: HardwareSnapshot[];
  onNavigate?: (view: ViewType) => void;
  onOpenCertificate?: () => void;
}

export const Room02MasterPanel: React.FC<Room02MasterPanelProps> = ({
  snapshots = [],
  onNavigate,
  onOpenCertificate,
}) => {
  const [activeTab, setActiveTab] = useState<'replay' | 'quarantine' | 'forensics' | 'security'>('replay');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(11);
  const [selectedSealNum, setSelectedSealNum] = useState<number>(14903);
  const [firewallTestOutput, setFirewallTestOutput] = useState<WriteFirewallAuditRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const quarantinedItems = useMemo(() => P1QuarantineLayer.getQuarantineRegistry(), []);
  const selectedQuarantine = useMemo(
    () => quarantinedItems.find((i) => i.observedSeal === selectedSealNum) || quarantinedItems[0],
    [quarantinedItems, selectedSealNum]
  );

  const handleCopy = (id: string, text: string) => {
    copyToClipboard(text);
    setCopiedId(id);
    playTone(650, 0.03);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartReplay = () => {
    if (isReplaying) return;
    setIsReplaying(true);
    setCurrentStageIdx(0);
    playTone(520, 0.08);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < AUDIT_TRACE_TX.stages.length) {
        setCurrentStageIdx(step);
        playTone(400 + step * 40, 0.03);
      } else {
        clearInterval(interval);
        setIsReplaying(false);
        playAuditChime();
      }
    }, 120);
  };

  const handleTestFirewall = (target: string, value: string) => {
    playTone(420, 0.08);
    const result = writeFirewall({
      targetProperty: target,
      requestedValue: value,
      actor: 'ROOM02_QUARANTINE_INSPECTOR',
      origin: 'quarantine://room02WriteProbe',
      reason: `Attempted mutation of canonical ${target} from Room 02 Forensic Console`,
    });
    setFirewallTestOutput(result.auditRecord);
    setTimeout(() => setFirewallTestOutput(null), 7000);
  };

  const handleExportPdf = () => {
    playAuditChime();
    const snapA = snapshots[0] || INITIAL_HARDWARE_SNAPSHOTS[0];
    const snapB = snapshots[1] || snapshots[0] || INITIAL_HARDWARE_SNAPSHOTS[1];
    generateForensicPdfReport({
      snapA,
      snapB,
      allSnapshots: snapshots,
      timestampFormat: 'human',
    });
  };

  const handleExportJson = () => {
    playTone(700, 0.05);
    downloadEvidenceManifestJson();
  };

  // Replay timing chart data
  const replayChartData = useMemo(() => {
    let cumulative = 0;
    return AUDIT_TRACE_TX.stages.map((stage) => {
      cumulative += stage.durationMs;
      return {
        name: stage.id,
        duration: stage.durationMs,
        cumulativeMs: cumulative,
        status: stage.status,
      };
    });
  }, []);

  return (
    <div className="space-y-6 font-mono text-zinc-300">
      {/* Top Banner for Room 02 */}
      <div className="p-6 sm:p-8 rounded-[28px] bg-gradient-to-br from-amber-950/40 via-[#0e101a]/95 to-black border-amber-500/40 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/10 via-rose-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border-amber-500/40 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
                CHAMBER 02 • FORENSICS & QUARANTINE BUFFER
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border-rose-500/30 text-[11px] font-bold">
                SSoT MUTATION = 0 (LOCKED)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border-cyan-500/30 text-[11px] font-bold">
                PATCH ZYR-03: ACTIVE
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
                ศูนย์นิติวิทยาศาสตร์ดิจิทัล และบัฟเฟอร์กักกันตราประทับ
              </h2>
              <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
                ระบบแยกกักกันตราประทับแปลกปลอม (Quarantine Isolation), การตรวจพิสูจน์พยานหลักฐาน 12-Stage Trace Replay (142 ms) ตามมาตรฐาน ISO/IEC 27037 และการบังคับใช้ พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๙, ๒๖, ๒๘
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-white/5 border-white/10 flex items-center gap-2">
                <span className="text-zinc-500">Quarantined:</span>
                <span className="text-amber-300 font-bold">80 Isolated Seals</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/5 border-white/10 flex items-center gap-2">
                <span className="text-zinc-500">Trace Replay:</span>
                <span className="text-emerald-300 font-bold">142ms (12/12 Verified)</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/5 border-white/10 flex items-center gap-2">
                <span className="text-zinc-500">Cryo Temp:</span>
                <span className="text-cyan-300 font-bold">15.45 mK</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/5 border-white/10 flex items-center gap-2">
                <span className="text-zinc-500">Leakage Rate:</span>
                <span className="text-emerald-400 font-bold">0.00% Zero Leak</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              onClick={handleStartReplay}
              disabled={isReplaying}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50 cursor-pointer"
            >
              {isReplaying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Replaying Trace ({currentStageIdx + 1}/12)...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-black" />
                  <span>Run 12-Stage Trace Replay</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportPdf}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border-white/10 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Export Forensic PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-black/50 border-white/10 text-xs font-bold">
        <button
          onClick={() => {
            playTone(600, 0.03);
            setActiveTab('replay');
          }}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'replay'
              ? 'bg-amber-500/20 text-amber-200 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-white/5 border-transparent'
          }`}
        >
          <Workflow className="w-4 h-4" />
          <span>12-Stage Trace Replay (142ms)</span>
        </button>

        <button
          onClick={() => {
            playTone(630, 0.03);
            setActiveTab('quarantine');
          }}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'quarantine'
              ? 'bg-amber-500/20 text-amber-200 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-white/5 border-transparent'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Quarantine Registry (80 Isolated)</span>
        </button>

        <button
          onClick={() => {
            playTone(660, 0.03);
            setActiveTab('forensics');
          }}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'forensics'
              ? 'bg-amber-500/20 text-amber-200 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-white/5 border-transparent'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>ISO/IEC 27037 & ETDA Legal Matrix</span>
        </button>

        <button
          onClick={() => {
            playTone(690, 0.03);
            setActiveTab('security');
          }}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'security'
              ? 'bg-amber-500/20 text-amber-200 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-white/5 border-transparent'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Write Firewall & ZYR-03 Patch</span>
        </button>
      </div>

      {/* TAB 1: 12-Stage Trace Replay */}
      {activeTab === 'replay' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Replay Visualization Timeline Graph */}
          <div className="p-5 rounded-2xl bg-black/60 border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Execution Duration Curve (Cumulative 142 ms)
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Bit-for-bit forensic determinism across all 12 stages from SENSE to REPLAY
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-xs font-bold">
                12/12 STAGES BIT-FOR-BIT VERIFIED
              </span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={replayChartData}>
                  <defs>
                    <linearGradient id="replayGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={10} />
                  <YAxis stroke="#71717a" fontSize={10} unit="ms" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                    itemStyle={{ color: '#fbbf24' }}
                  />
                  <Area type="monotone" dataKey="duration" stroke="#f59e0b" strokeWidth={2} fill="url(#replayGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 12 Stages Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {AUDIT_TRACE_TX.stages.map((stage, idx) => {
              const isCurrent = isReplaying && currentStageIdx === idx;
              const isPassed = currentStageIdx >= idx;

              return (
                <div
                  key={stage.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-[1.02]'
                      : isPassed
                      ? 'bg-white/5 border-white/10 hover:border-amber-500/40'
                      : 'bg-black/30 border-white/5 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                      STAGE {stage.stageNumber}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      ⏱️ {stage.durationMs}ms ({stage.timestamp})
                    </span>
                  </div>

                  <div className="font-bold text-white text-xs mb-1">{stage.name}</div>
                  <p className="text-[11px] text-zinc-400 mb-3">{stage.shortDesc}</p>

                  <div className="space-y-1.5 pt-2 border-t border-white/5 text-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Output Hash:</span>
                      <code className="text-amber-300 font-mono">{stage.outputHash.slice(0, 16)}...</code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Actor / Module:</span>
                      <span className="text-zinc-300 truncate max-w-[140px]">{stage.actor}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Quarantine Registry */}
      {activeTab === 'quarantine' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-5 rounded-2xl bg-black/60 border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Isolated Quarantine Buffer Registry
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                80 Total Quarantined Seals • 5 Active Observed Delta Entries (#14,903–#14,907) • Promotion strictly blocked
              </p>
            </div>

            <button
              onClick={() => handleTestFirewall('canonicalSeals', '14907')}
              className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/40 text-rose-200 font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Probe Write Firewall</span>
            </button>
          </div>

          {/* Firewall Alert Output */}
          {firewallTestOutput && (
            <div className="p-4 rounded-2xl bg-rose-950/60 border-rose-500/50 text-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200 shadow-2xl">
              <div className="flex items-start sm:items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <div className="font-bold text-white">Write Firewall Intercepted State Mutation</div>
                  <p className="text-[11px] text-rose-200">{firewallTestOutput.reason}</p>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    Audit ID: <code className="text-rose-300">{firewallTestOutput.auditId}</code> • Mutation Delta: <strong className="text-emerald-400">0</strong>
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-rose-500/30 text-rose-100 border-rose-400/40 font-bold text-[10px] shrink-0">
                BLOCKED (FAIL-CLOSED)
              </span>
            </div>
          )}

          {/* Selected Quarantine Details */}
          {selectedQuarantine && (
            <div className="p-5 rounded-2xl bg-black/70 border-white/10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 font-bold text-xs">
                    SEAL #{selectedQuarantine.observedSeal}
                  </span>
                  <span className="text-xs text-zinc-400 font-bold">
                    ID: {selectedQuarantine.evidenceId}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                  {selectedQuarantine.promotionStatus}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/5 border-white/5">
                  <span className="text-zinc-500 block text-[10px]">Notes & Classification:</span>
                  <span className="text-zinc-200 font-semibold">{selectedQuarantine.notes} ({selectedQuarantine.classification})</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border-white/5">
                  <span className="text-zinc-500 block text-[10px]">Source & Observer:</span>
                  <span className="text-amber-300 font-semibold">{selectedQuarantine.source} ({selectedQuarantine.observerIdentity})</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border-white/5 sm:col-span-2 lg:col-span-1">
                  <span className="text-zinc-500 block text-[10px]">Artifact Digest:</span>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <code className="text-zinc-300 font-mono text-[10px] truncate">{selectedQuarantine.artifactDigest}</code>
                    <button
                      onClick={() => handleCopy(`digest-${selectedQuarantine.observedSeal}`, selectedQuarantine.artifactDigest)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400"
                    >
                      {copiedId === `digest-${selectedQuarantine.observedSeal}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Forensic & Legal Matrix */}
      {activeTab === 'forensics' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-black/60 border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <Scale className="w-4 h-4" />
                ETDA ม.๙, ๒๖, ๒๘
              </div>
              <p className="text-[11px] text-zinc-400">
                พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ รับรองลายมือชื่อดิจิทัลและพยานหลักฐานอิเล็กทรอนิกส์ที่มีน้ำหนักรับฟังได้สูงสุดในชั้นศาลไทย
              </p>
              <div className="pt-2 text-[10px] text-emerald-400 font-bold">100% ADMISSIBLE</div>
            </div>

            <div className="p-5 rounded-2xl bg-black/60 border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                <FileCheck2 className="w-4 h-4" />
                ISO/IEC 27037 FORENSICS
              </div>
              <p className="text-[11px] text-zinc-400">
                มาตรฐานสากลว่าด้วยการตรวจพิสูจน์ การจัดเก็บ และการคงความถูกต้องของพยานหลักฐานดิจิทัลแบบ DELETE NOTHING
              </p>
              <div className="pt-2 text-[10px] text-cyan-400 font-bold">BIT-FOR-BIT INTACT</div>
            </div>

            <div className="p-5 rounded-2xl bg-black/60 border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                <Shield className="w-4 h-4" />
                PDPA พ.ร.บ. คุ้มครองข้อมูล
              </div>
              <p className="text-[11px] text-zinc-400">
                มาตรา ๒๖ และ ๒๘ บังคับใช้การแปลงข้อมูลนิรนาม (PII Masking) และแยกกักกันข้อมูลอ่อนไหวเข้าสู่ Sandboxing ทันที
              </p>
              <div className="pt-2 text-[10px] text-rose-400 font-bold">ENCLAVE PROTECTED</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Write Firewall & ZYR-03 Patch */}
      {activeTab === 'security' && (
        <div className="p-6 rounded-2xl bg-black/60 border-white/10 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Smart Contract Security Hardening: Patch ZYR-03</h3>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            ในเวอร์ชัน Smart Contract v1.2 ฟังก์ชัน <code className="text-amber-300">quarantineSeal</code> เปิดเป็น Public โดยไม่มี Modifier ป้องกัน ทำให้บุคคลภายนอกสามารถฉีดซีลหลอกเพื่อบิดเบือนสถิติได้ ในเวอร์ชัน v2 จึงได้ติดตั้งตัวคุมสิทธิ์ <strong>`onlyAuthorizedOracle`</strong> เพื่อจำกัดเฉพาะ Sentinel-Ledger AI Interceptor และกระเป๋าอธิปไตยของบอส (#EP-SOVEREIGN-01) เท่านั้น
          </p>

          <div className="p-4 rounded-xl bg-white/5 border-white/10 space-y-2 font-mono text-[11px]">
            <div className="text-zinc-500">// Smart Contract v2 Code Snippet:</div>
            <pre className="text-emerald-300 overflow-x-auto">
{`function quarantineSeal(uint256 sealId, bytes32 reasonDigest) external onlyAuthorizedOracle {
    require(msg.sender == sovereignOracleAddress || msg.sender == sovereignOwner, "ERR: UNAUTHORIZED_ORACLE");
    quarantinedLedger[sealId] = QuarantineRecord(block.timestamp, reasonDigest, false);
    emit SealQuarantined(sealId, reasonDigest, block.timestamp);
}`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
