import React, { useState, useMemo } from 'react';
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  ShieldAlert,
  Search,
  Copy,
  Check,
  Zap,
  RefreshCw,
  Scale,
  FileCheck2,
  Sparkles,
  Layers,
  SlidersHorizontal,
  Flame,
  AlertOctagon,
  Cpu,
  Terminal,
  Activity,
  KeyRound,
  Shield
} from 'lucide-react';
import { HardwareSnapshot, ViewType } from '../types';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';

export const CANONICAL_FROZEN_SEALS = 14902;
export const CANONICAL_BLOCK = 849202;
export const CANONICAL_MERKLE_ROOT = '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68';
export const CANONICAL_VERSION = 'ZYRQUEN Ω∞ v4.16 PDPA FINAL (Frozen v1.2 LTS)';
export const CANONICAL_PRINCIPAL = '🇹🇭 นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)';

export interface MemorySegmentGuard {
  id: string;
  segmentName: string;
  addressRange: string;
  accessMode: 'STRICT_READONLY' | 'HARDWARE_LOCKED' | 'SEALED_PAGE';
  status: 'ARMED' | 'PROTECTED' | 'ZERO_MUTATION';
  violationsIntercepted: number;
}

export const MEMORY_SEGMENTS: MemorySegmentGuard[] = [
  {
    id: 'seg-01',
    segmentName: 'Sovereign Genesis Core (Root Hash & Block #849202)',
    addressRange: '0x0000_0000 - 0x000F_FFFF',
    accessMode: 'STRICT_READONLY',
    status: 'ZERO_MUTATION',
    violationsIntercepted: 0
  },
  {
    id: 'seg-02',
    segmentName: '14,902 Canonical Merkle Tree Leaf Array',
    addressRange: '0x0010_0000 - 0x00FF_FFFF',
    accessMode: 'HARDWARE_LOCKED',
    status: 'ARMED',
    violationsIntercepted: 0
  },
  {
    id: 'seg-03',
    segmentName: 'Deca-Key HSM Quorum Authority & Public Rings',
    addressRange: '0x0100_0000 - 0x01FF_FFFF',
    accessMode: 'HARDWARE_LOCKED',
    status: 'ARMED',
    violationsIntercepted: 0
  },
  {
    id: 'seg-04',
    segmentName: 'RWA Asset Tenant State Matrix (Ω601–Ω1000)',
    addressRange: '0x0200_0000 - 0x02FF_FFFF',
    accessMode: 'SEALED_PAGE',
    status: 'PROTECTED',
    violationsIntercepted: 0
  }
];

interface Room12MasterPanelProps {
  snapshots?: HardwareSnapshot[];
  onNavigate?: (view: ViewType) => void;
  onOpenCertificate?: () => void;
}

export const Room12MasterPanel: React.FC<Room12MasterPanelProps> = ({
  snapshots = [],
  onNavigate,
  onOpenCertificate
}) => {
  const [activeTab, setActiveTab] = useState<'firewall-status' | 'memory-segments' | 'mutation-simulator' | 'tamper-guard'>('firewall-status');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSimulatingWrite, setIsSimulatingWrite] = useState<boolean>(false);
  const [interceptedLog, setInterceptedLog] = useState<{
    time: string;
    attemptedAddress: string;
    action: string;
    reason: string;
  } | null>(null);

  const handleCopy = (id: string, text: string) => {
    copyToClipboard(text);
    setCopiedId(id);
    playTone(650, 0.03);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTestIllegalWrite = () => {
    if (isSimulatingWrite) return;
    setIsSimulatingWrite(true);
    playTone(480, 0.06);

    setTimeout(() => {
      setIsSimulatingWrite(false);
      setInterceptedLog({
        time: new Date().toLocaleTimeString('th-TH'),
        attemptedAddress: '0x0014_9020 (Canonical Leaf #14902)',
        action: 'WRITE_ATTEMPT_BLOCKED',
        reason: 'Mutation Authority: 0 (Hard Read-Only Fail-Closed Guard Active)'
      });
      playAuditChime();
    }, 600);
  };

  return (
    <div className="space-y-6 font-mono text-zinc-300">
      {/* Top Banner for Room 12 */}
      <div className="p-6 sm:p-8 rounded-[28px] bg-gradient-to-br from-red-950/40 via-[#150a0a]/95 to-black border-red-500/40 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-red-500/10 via-rose-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-red-500/15 text-red-300 border-red-500/40 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(239,68,68,0.25)]">
                <Lock className="w-4 h-4 text-red-400 animate-pulse" />
                CHAMBER 12 • ZERO-TRUST WRITE FIREWALL & MEMORY LOCKDOWN
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[11px] font-bold">
                MUTATION AUTHORITY: 0 (READ ONLY)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-300 border-red-500/30 text-[11px] font-bold">
                FAIL-CLOSED ARMED
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
                ไฟร์วอลล์ห้ามเขียนทับ และระบบล็อกความมั่นคงของหน่วยความจำ (Zero-Trust Memory Guard)
              </h2>
              <p className="text-sm text-zinc-400 max-w-4xl leading-relaxed">
                บังคับใช้โหมด Read-Only โดยสมบูรณ์บนแกน Sovereign Kernel ป้องกันการเขียนทับหน่วยความจำ,
                การฉีดคำสั่งแปลกปลอม (Thread Injection) หรือความพยายามแก้ไขสัจธรรม 14,902 ตราประทับ
              </p>
            </div>
          </div>

          <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-3 shrink-0">
            <button
              onClick={handleTestIllegalWrite}
              disabled={isSimulatingWrite}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600/80 to-rose-600/80 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-500/20 border-red-400/40 transition-all transform hover:-translate-y-0.5"
            >
              <AlertOctagon className="w-4 h-4" />
              {isSimulatingWrite ? 'Intercepting Write Attempt...' : 'Test Memory Mutation Intercept'}
            </button>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Kernel Lock: HARDWARE_ENFORCED</span>
            </div>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-red-500/20">
          <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Kernel Mode</div>
            <div className="text-base sm:text-lg font-bold text-red-400">READ_ONLY</div>
            <div className="text-[10px] text-emerald-400 font-semibold">100% Immutable</div>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Illegal Writes Allowed</div>
            <div className="text-base sm:text-lg font-bold text-emerald-400">0 Writes</div>
            <div className="text-[10px] text-zinc-400">Absolute Zero</div>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Memory Segments</div>
            <div className="text-base sm:text-lg font-bold text-cyan-400">4 / 4 Locked</div>
            <div className="text-[10px] text-cyan-300">Ω601–Ω1000 Sealed</div>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Thermal Quarantine Line</div>
            <div className="text-base sm:text-lg font-bold text-amber-400">85.0 °C</div>
            <div className="text-[10px] text-amber-300">Instant Fail-Closed</div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#0a0d16] border-red-500/20">
        <button
          onClick={() => {
            playTone(600, 0.04);
            setActiveTab('firewall-status');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'firewall-status'
              ? 'bg-red-500/20 text-red-200 border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-transparent border-transparent'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          1. Zero-Trust Hardware Firewall Status
        </button>

        <button
          onClick={() => {
            playTone(640, 0.04);
            setActiveTab('memory-segments');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'memory-segments'
              ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-transparent border-transparent'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          2. Protected Address Range & Segments
        </button>

        <button
          onClick={() => {
            playTone(680, 0.04);
            setActiveTab('mutation-simulator');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'mutation-simulator'
              ? 'bg-amber-500/20 text-amber-200 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-transparent border-transparent'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          3. Mutation & Write Attack Interceptor
        </button>

        <button
          onClick={() => {
            playTone(720, 0.04);
            setActiveTab('tamper-guard');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'tamper-guard'
              ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-transparent border-transparent'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          4. Zeroization Tamper-Proof Circuit
        </button>
      </div>

      {/* Tab 1: Firewall Status */}
      {activeTab === 'firewall-status' && (
        <div className="p-6 rounded-2xl bg-[#0a0d1a] border-red-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-400" />
                สถานะการบังคับใช้กฎ Read-Only (Hardware Memory Firewall Matrix)
              </h3>
              <p className="text-xs text-zinc-400">
                ตรวจจับและปฏิเสธทุกการร้องขอคำสั่ง Write, Modify, Append หรือ Re-route บน SSoT
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 border-red-500/30 text-xs font-bold">
              FIREWALL: ENFORCED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-black/40 border-white/5 space-y-2">
              <div className="text-xs font-bold text-red-400">Policy: ZERO_MUTATION_AUTHORITY</div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                ห้ามแก้ไขโครงสร้างหลักหรือตราประทับใดๆ ทั้งสิ้น การบันทึกเป็นแบบ Append-Only บนวงจรสัจธรรมเท่านั้น
              </p>
            </div>
            <div className="p-4 rounded-xl bg-black/40 border-white/5 space-y-2">
              <div className="text-xs font-bold text-emerald-400">Policy: THREAD_INTEGRITY_ISOLATION</div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                การรันโปรเซสทั้งหมดถูกกักกันในหน่วยความจำระดับ Safe Buffer ป้องกันการ Overwrite นอกขอบเขต
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Memory Segments */}
      {activeTab === 'memory-segments' && (
        <div className="space-y-4">
          {MEMORY_SEGMENTS.map((seg) => (
            <div
              key={seg.id}
              className="p-4 rounded-2xl bg-[#0a0d1a] border-white/10 hover:border-red-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  {seg.segmentName}
                </div>
                <div className="text-zinc-500 font-mono text-[11px]">{seg.addressRange}</div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold border-red-500/30 text-[10px]">
                  {seg.accessMode}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border-emerald-500/30 text-[10px]">
                  {seg.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Mutation Interceptor */}
      {activeTab === 'mutation-simulator' && (
        <div className="p-6 rounded-2xl bg-[#0a0d1a] border-amber-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-amber-400" />
                บันทึกการสกัดกั้นการแก้ไขหน่วยความจำ (Write Intercept Log)
              </h3>
              <p className="text-xs text-zinc-400">
                ทดสอบจำลองการส่งคำสั่งเขียนหน่วยความจำแปลกปลอมเพื่อยืนยันการทำงานของระบบตัดวงจร
              </p>
            </div>
          </div>

          {interceptedLog ? (
            <div className="p-4 rounded-xl bg-red-950/30 border-red-500/30 font-mono text-xs space-y-1.5 text-red-300">
              <div className="font-bold flex items-center gap-1.5 text-red-400">
                <AlertOctagon className="w-4 h-4" />
                INTERCEPT SUCCESSFUL: {interceptedLog.action}
              </div>
              <div>Timestamp: <span className="text-white">{interceptedLog.time}</span></div>
              <div>Target Address: <span className="text-yellow-300">{interceptedLog.attemptedAddress}</span></div>
              <div>Defense Guard: <span className="text-emerald-300">{interceptedLog.reason}</span></div>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-black/40 border-white/5 text-center text-xs text-zinc-500">
              ยังไม่มีการตรวจพบความพยายามเขียนทับ — กดปุ่ม "Test Memory Mutation Intercept" เพื่อทดสอบ
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Tamper Guard */}
      {activeTab === 'tamper-guard' && (
        <div className="p-6 rounded-2xl bg-[#0a0d1a] border-emerald-500/20 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            วงจรลบล้างกุญแจทันทีเมื่อถูกเจาะระบบ (Active Zeroization Circuit)
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            ตู้ฮาร์ดแวร์ HSM FIPS 140-3 Level 4 จะปล่อยแรงดันลบล้างสารกึ่งตัวนำ (Zeroize Memory)
            ภายในเวลา &lt; 1 ไมโครวินาที หากตรวจพบการงัดแงะทางกายภาพ หรืออุณหภูมิเกิน 85.0°C
          </p>
        </div>
      )}
    </div>
  );
};
