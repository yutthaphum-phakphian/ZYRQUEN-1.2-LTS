"use client";

import React, { useState, useEffect, useRef } from 'react';
import { CHAMBERS_DATA, ChamberData, SSOT } from '../lib/ssot-data';
import { playTone, playAuditChime } from './AudioSynthesizer';
import { Chamber02View } from './views/Security/Chamber02View';
import { Chamber11QuantumRadar } from './Chamber11QuantumRadar';
import { AuditCertificateModal } from './AuditCertificateModal';
import { copyToClipboard } from '../utils/clipboard';

export interface ChambersExplorerProps {
  onSelectChamber?: (chamber: ChamberData) => void;
  onOpenCertificate?: () => void;
  className?: string;
}

// 5 Definitive Architecture Groups for the 18 Chambers
export interface ChamberGroup {
  id: string;
  idx: number;
  nameEn: string;
  nameTh: string;
  roomsCount: number;
  chamberNums: string[];
}

export const CHAMBER_GROUPS: ChamberGroup[] = [
  {
    id: 'grp-1',
    idx: 1,
    nameEn: '1. AUTHORITY / CANONICAL',
    nameTh: 'อำนาจการปกครองและรากแก้ว',
    roomsCount: 2,
    chamberNums: ['01', '09'],
  },
  {
    id: 'grp-2',
    idx: 2,
    nameEn: '2. SECURITY / GOVERNANCE',
    nameTh: 'ความปลอดภัยและการกำกับดูแล',
    roomsCount: 6,
    chamberNums: ['02', '03', '04', '05', '08', '17'],
  },
  {
    id: 'grp-3',
    idx: 3,
    nameEn: '3. RUNTIME / OPERATIONS',
    nameTh: 'รันไทม์และการปฏิบัติการ',
    roomsCount: 3,
    chamberNums: ['06', '12', '16'],
  },
  {
    id: 'grp-4',
    idx: 4,
    nameEn: '4. DATA / INTELLIGENCE',
    nameTh: 'ข้อมูลและปัญญาประดิษฐ์',
    roomsCount: 3,
    chamberNums: ['00', '07', '11'],
  },
  {
    id: 'grp-5',
    idx: 5,
    nameEn: '5. WORLD / NAVIGATION',
    nameTh: 'มิติโลกและการนำร่องพหุภพ',
    roomsCount: 4,
    chamberNums: ['10', '13', '14', '15'],
  },
];

// Chamber Room Metadata with Badge Types
export interface ChamberMetaInfo {
  num: string;
  codeName: string;
  thaiSub: string;
  badgeType: 'CANONICAL' | 'FROZEN' | 'RUNTIME' | 'PRESENTATION' | 'TELEMETRY' | 'SIMULATION';
  badgeColor: string;
}

export const CHAMBER_METAS: Record<string, ChamberMetaInfo> = {
  '00': { num: '00', codeName: 'MULTIVERSE DASHBOARD', thaiSub: 'เมนบอร์ดแห่งจักรวาล', badgeType: 'PRESENTATION', badgeColor: 'border-purple-600/50 bg-purple-950/40 text-purple-300' },
  '01': { num: '01', codeName: 'CANONICAL CORE GATEWAY', thaiSub: 'แกนกลางคานอนิคอล', badgeType: 'CANONICAL', badgeColor: 'border-emerald-600/50 bg-emerald-950/40 text-emerald-300' },
  '02': { num: '02', codeName: 'FORENSICS & QUARANTINE', thaiSub: 'นิติวิทยาศาสตร์ (+5 Seals)', badgeType: 'FROZEN', badgeColor: 'border-amber-600/50 bg-amber-950/40 text-amber-300' },
  '03': { num: '03', codeName: 'CUSTODIAN TRACKER 10/10', thaiSub: 'สภาผู้พิทักษ์ 10/10 REAL_HSM', badgeType: 'CANONICAL', badgeColor: 'border-emerald-600/50 bg-emerald-950/40 text-emerald-300' },
  '04': { num: '04', codeName: 'INVARIANTS 10/10', thaiSub: 'กฎแห่งความคงทนคงที่', badgeType: 'FROZEN', badgeColor: 'border-amber-600/50 bg-amber-950/40 text-amber-300' },
  '05': { num: '05', codeName: 'MASTER GATES 22/22', thaiSub: 'ประตูป้อมปราการแห่งการตรวจสอบ', badgeType: 'FROZEN', badgeColor: 'border-amber-600/50 bg-amber-950/40 text-amber-300' },
  '06': { num: '06', codeName: 'PHOENIX RECOVERY', thaiSub: 'กลไกฟื้นฟูอัตโนมัติ 142ms', badgeType: 'RUNTIME', badgeColor: 'border-cyan-600/50 bg-cyan-950/40 text-cyan-300' },
  '07': { num: '07', codeName: 'FIOS TREASURY & RWA', thaiSub: 'คลังทรัพย์สินและโทเคนเรียลเวิลด์', badgeType: 'CANONICAL', badgeColor: 'border-emerald-600/50 bg-emerald-950/40 text-emerald-300' },
  '08': { num: '08', codeName: 'POST-QUANTUM CRYPTO', thaiSub: 'ระบบเข้ารหัสลับเพนทาควนตัม', badgeType: 'CANONICAL', badgeColor: 'border-emerald-600/50 bg-emerald-950/40 text-emerald-300' },
  '09': { num: '09', codeName: 'PHASE REGISTRY 01-40', thaiSub: 'ทะเบียนเฟสและสถานะกระดาน', badgeType: 'FROZEN', badgeColor: 'border-amber-600/50 bg-amber-950/40 text-amber-300' },
  '10': { num: '10', codeName: 'SUPREME LEGAL SOVEREIGN', thaiSub: 'นโยบายข้อพิพาทและคำชี้ขาดสูงสุด', badgeType: 'SIMULATION', badgeColor: 'border-amber-600/50 bg-amber-950/40 text-amber-300' },
  '11': { num: '11', codeName: '8K QUANTUM RADAR', thaiSub: 'เรดาร์ตรวจจับคลื่นควันตัมสายตา', badgeType: 'TELEMETRY', badgeColor: 'border-blue-600/50 bg-blue-950/40 text-blue-300' },
  '12': { num: '12', codeName: 'SOVEREIGN CLI & KERNEL', thaiSub: 'เทอร์มินัลจัดการระบบ Kernel Stream', badgeType: 'RUNTIME', badgeColor: 'border-cyan-600/50 bg-cyan-950/40 text-cyan-300' },
  '13': { num: '13', codeName: 'MULTIVERSE NAV GRID', thaiSub: 'ผังพิกัดมัลติเวิร์ส 13 พหุจักรวาล', badgeType: 'TELEMETRY', badgeColor: 'border-blue-600/50 bg-blue-950/40 text-blue-300' },
  '14': { num: '14', codeName: 'WARP PATH VISUALIZER', thaiSub: 'เส้นทางท่องกาลอวกาศควอนตัม', badgeType: 'SIMULATION', badgeColor: 'border-amber-600/50 bg-amber-950/40 text-amber-300' },
  '15': { num: '15', codeName: 'QUANTUM FUEL CORE', thaiSub: 'แหล่งพลังงานฟิวชั่น Cryo', badgeType: 'TELEMETRY', badgeColor: 'border-blue-600/50 bg-blue-950/40 text-blue-300' },
  '16': { num: '16', codeName: 'RUNTIME DECK FROZEN', thaiSub: 'รันไทม์เด็คระดับ Core', badgeType: 'FROZEN', badgeColor: 'border-amber-600/50 bg-amber-950/40 text-amber-300' },
  '17': { num: '17', codeName: 'AUDIT TRAIL LEDGER', thaiSub: 'บัญชีรอยประทับตรวจสอบ Replay', badgeType: 'CANONICAL', badgeColor: 'border-emerald-600/50 bg-emerald-950/40 text-emerald-300' },
};

// 17 Canonical Modules Toggle Items
export const CANONICAL_MODULES_TOGGLES = [
  { id: 'mod-01', num: '01', name: 'CORE & KERNEL', badge: 'CANONICAL', color: 'text-emerald-400' },
  { id: 'mod-02', num: '02', name: 'AI & INTELLIGENCE', badge: 'RUNTIME', color: 'text-cyan-400' },
  { id: 'mod-03', num: '03', name: 'DATA & STORAGE', badge: 'CANONICAL', color: 'text-emerald-400' },
  { id: 'mod-04', num: '04', name: 'WORKFLOW & AUTOMATION', badge: 'RUNTIME', color: 'text-cyan-400' },
  { id: 'mod-05', num: '05', name: 'GOVERNANCE & VETO', badge: 'FROZEN', color: 'text-amber-400' },
];

export const ChambersExplorer: React.FC<ChambersExplorerProps> = ({
  onSelectChamber,
  onOpenCertificate,
  className = '',
}) => {
  // Default selected chamber is 08 (as displayed in the screenshot)
  const [selectedChamberNum, setSelectedChamberNum] = useState<string>('08');
  const [selectedChamber, setSelectedChamber] = useState<ChamberData>(
    CHAMBERS_DATA.find((c) => c.num === '08') || CHAMBERS_DATA[0]
  );
  const [groupFilter, setGroupFilter] = useState<'ALL' | '1' | '2' | '3' | '4' | '5'>('ALL');
  const [provenanceFilter, setProvenanceFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [showTruthBoundary, setShowTruthBoundary] = useState<boolean>(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState<boolean>(false);
  const [isSoundActive, setIsSoundActive] = useState<boolean>(true);
  const [isEngineActive, setIsEngineActive] = useState<boolean>(true);

  // Active sub-tab inside Chamber 17
  const [chamber17Tab, setChamber17Tab] = useState<number>(1);
  const [selectedTimelinePoint, setSelectedTimelinePoint] = useState<number>(18);
  const [rotationCycle, setRotationCycle] = useState<number>(1);
  const [isRotatingKeys, setIsRotatingKeys] = useState<boolean>(false);

  // Toggle state for the 17 Canonical Modules in sidebar
  const [modulesToggle, setModulesToggle] = useState<Record<string, boolean>>({
    'mod-01': true,
    'mod-02': true,
    'mod-03': true,
    'mod-04': true,
    'mod-05': true,
  });

  // Keep selectedChamber in sync
  useEffect(() => {
    const found = CHAMBERS_DATA.find((c) => c.num === selectedChamberNum);
    if (found) {
      setSelectedChamber(found);
      if (onSelectChamber) onSelectChamber(found);
    }
  }, [selectedChamberNum, onSelectChamber]);

  const handleSelectChamber = (num: string) => {
    if (isSoundActive) playTone(560, 0.04);
    setSelectedChamberNum(num);
  };

  const toggleModule = (id: string) => {
    if (isSoundActive) playTone(680, 0.03);
    setModulesToggle((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEnableAllModules = (val: boolean) => {
    if (isSoundActive) playTone(720, 0.04);
    setModulesToggle({
      'mod-01': val,
      'mod-02': val,
      'mod-03': val,
      'mod-04': val,
      'mod-05': val,
    });
  };

  const handleExecuteKeyRotation = () => {
    if (isRotatingKeys) return;
    setIsRotatingKeys(true);
    if (isSoundActive) playTone(480, 0.1, 'sawtooth');
    setTimeout(() => {
      setIsRotatingKeys(false);
      setRotationCycle((prev) => prev + 1);
      if (isSoundActive) playAuditChime();
    }, 1400);
  };

  // Filter chambers based on search and group filter
  const isChamberVisible = (num: string) => {
    const meta = CHAMBER_METAS[num];
    const data = CHAMBERS_DATA.find((c) => c.num === num);
    if (!meta || !data) return false;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNum = num.includes(q);
      const matchCode = meta.codeName.toLowerCase().includes(q);
      const matchSub = meta.thaiSub.toLowerCase().includes(q);
      const matchEn = data.titleEn.toLowerCase().includes(q);
      const matchTh = data.titleTh.toLowerCase().includes(q);
      if (!matchNum && !matchCode && !matchSub && !matchEn && !matchTh) return false;
    }

    // Provenance filter
    if (provenanceFilter !== 'ALL') {
      if (meta.badgeType !== provenanceFilter && provenanceFilter !== 'FROZEN') {
        return false;
      }
      if (provenanceFilter === 'FROZEN' && meta.badgeType !== 'FROZEN') {
        return false;
      }
    }

    return true;
  };

  return (
    <div className={`space-y-4 font-mono select-none ${className}`} style={{ backgroundColor: '#070a12', color: '#e2e8f0' }}>
      {/* ====================================================================== */}
      {/* 1. TOP HEADER & TELEMETRY STATUS BAR (High-Fidelity Match) */}
      {/* ====================================================================== */}
      <div className="border border-cyan-900/60 p-3.5 rounded-xl space-y-2" style={{ backgroundColor: '#0a0f1e' }}>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded border border-cyan-800/80 text-cyan-300 font-bold bg-[#070a12]">
              Phase 01-40 (14,902 Seals All)
            </span>
            <span className="px-2 py-0.5 rounded border border-emerald-700 bg-emerald-950/60 text-emerald-300 font-bold flex items-center gap-1">
              <span>●</span> HEALTHY
            </span>
            <button
              onClick={() => setIsSoundActive(!isSoundActive)}
              className={`px-2 py-0.5 rounded border text-[11px] font-bold cursor-pointer transition ${
                isSoundActive ? 'border-cyan-600 bg-cyan-950/50 text-cyan-300' : 'border-zinc-800 bg-zinc-900 text-zinc-500'
              }`}
            >
              🔊 SOUND {isSoundActive ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => setIsEngineActive(!isEngineActive)}
              className={`px-2 py-0.5 rounded border text-[11px] font-bold cursor-pointer transition ${
                isEngineActive ? 'border-amber-600 bg-amber-950/50 text-[#D4AF37]' : 'border-zinc-800 bg-zinc-900 text-zinc-500'
              }`}
            >
              ⚙️ Engine
            </button>
            <span className="text-zinc-400">
              #EP-SOVEREIGN-01 • Sovereign Principal: <strong className="text-zinc-100">นายยุทธภูมิ ภักเพียร</strong>
            </span>
          </div>

          <div className="text-[11px] text-cyan-400 font-bold">
            CANONICAL PROOF CHAIN (14,902 SEALS)
          </div>
        </div>

        {/* Sub-line Stats */}
        <div className="text-xs text-zinc-400 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-cyan-950">
          <div>
            Block <strong className="text-zinc-200">#849202</strong> • Merkle <span className="text-[#06B6D4]">909ab814...43fa4c68</span> • 14,902 Seals SSoT • Immutable Read-Only • Boundary: <span className="text-[#D4AF37]">Ω600_1000</span>
          </div>
          <div className="text-[11px] text-zinc-500">
            FROZEN v1.2 LTS • 10/10 REAL_HSM FIPS 140-3 L4
          </div>
        </div>

        {/* Cryo QOps Ticker */}
        <div className="text-[11px] text-cyan-300/80 flex flex-wrap items-center gap-3 pt-1 border-t border-cyan-950/80">
          <span>Cert: <strong className="text-zinc-200">ZQ-GOLD-DEP-849202-3908</strong></span>
          <span>|</span>
          <span>QOps: <strong className="text-emerald-300">851.9</strong></span>
          <span>|</span>
          <span>Coherence: <strong className="text-emerald-300">99.992%</strong></span>
          <span>|</span>
          <span>Fuel: <strong className="text-cyan-300">88.8%</strong></span>
          <span>|</span>
          <span>Cryo: <strong className="text-cyan-300">14.98 mK</strong></span>
          <span>|</span>
          <span className="text-[#D4AF37] font-bold">DECK {selectedChamberNum} • ACTIVE (Ω600_1000 LOCKED)</span>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* 2. MAIN SPLIT INTERFACE: LEFT MASTER NAV + RIGHT MATRIX STAGE */}
      {/* ====================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ==================================================================== */}
        {/* LEFT COLUMN: 18 CHAMBERS IN 5/6 GROUPS + 17 CANONICAL MODULES TOGGLE */}
        {/* ==================================================================== */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          {/* Chamber Groups Container */}
          <div className="border border-cyan-900/60 rounded-xl p-3 space-y-3" style={{ backgroundColor: '#0a0f1e' }}>
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-cyan-950">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-100">
                <span>🏛️ CHAMBERS (18)</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded border border-cyan-800 bg-[#070a12] text-cyan-300 font-bold">
                6 GROUPS
              </span>
            </div>

            {/* Quick Filter Buttons */}
            <div className="grid grid-cols-6 gap-1 text-[10px] font-bold">
              <button
                onClick={() => {
                  if (isSoundActive) playTone(600, 0.02);
                  setGroupFilter('ALL');
                }}
                className={`py-1 rounded border text-center cursor-pointer transition ${
                  groupFilter === 'ALL'
                    ? 'border-[#06B6D4] bg-[#06B6D4] text-[#070a12] font-black'
                    : 'border-zinc-800 bg-[#070a12] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                ALL (18)
              </button>
              {(['1', '2', '3', '4', '5'] as const).map((gNum) => {
                const grp = CHAMBER_GROUPS.find((g) => String(g.idx) === gNum);
                return (
                  <button
                    key={gNum}
                    onClick={() => {
                      if (isSoundActive) playTone(600, 0.02);
                      setGroupFilter(gNum);
                    }}
                    className={`py-1 rounded border text-center cursor-pointer transition ${
                      groupFilter === gNum
                        ? 'border-[#06B6D4] bg-[#06B6D4] text-[#070a12] font-black'
                        : 'border-zinc-800 bg-[#070a12] text-zinc-400 hover:text-zinc-200'
                    }`}
                    title={grp?.nameEn}
                  >
                    {gNum}. ({grp?.roomsCount})
                  </button>
                );
              })}
            </div>

            {/* 5 Group Accordions */}
            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
              {CHAMBER_GROUPS.filter((g) => groupFilter === 'ALL' || String(g.idx) === groupFilter).map((grp) => {
                const visibleChambers = grp.chamberNums.filter((num) => isChamberVisible(num));
                if (visibleChambers.length === 0 && search.trim()) return null;

                return (
                  <div key={grp.id} className="border border-cyan-950 rounded-lg p-2 space-y-1.5 bg-[#070a12]/80">
                    {/* Group Header */}
                    <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300 pb-1 border-b border-cyan-950/60">
                      <span className="truncate">{grp.nameEn}</span>
                      <span className="text-[10px] text-zinc-500 whitespace-nowrap ml-1">
                        {grp.roomsCount} rooms
                      </span>
                    </div>

                    {/* Chambers in this Group */}
                    <div className="space-y-1">
                      {grp.chamberNums.map((num) => {
                        const meta = CHAMBER_METAS[num];
                        if (!meta || !isChamberVisible(num)) return null;
                        const isSelected = selectedChamberNum === num;

                        return (
                          <div
                            key={num}
                            onClick={() => handleSelectChamber(num)}
                            className={`p-1.5 rounded border text-xs cursor-pointer transition flex items-center justify-between gap-1.5 ${
                              isSelected
                                ? 'border-[#06B6D4] bg-[#0a0f1e] shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                                : 'border-zinc-800/80 bg-[#070a12] hover:border-zinc-700 hover:bg-[#0a0f1e]/40'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`font-bold ${isSelected ? 'text-[#06B6D4]' : 'text-zinc-400'}`}>
                                  {num}
                                </span>
                                <span className="font-bold text-zinc-200 truncate text-[11px]">
                                  {meta.codeName}
                                </span>
                              </div>
                              <div className="text-[10px] text-zinc-500 truncate pl-4">
                                {meta.thaiSub}
                              </div>
                            </div>

                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${meta.badgeColor}`}
                            >
                              {meta.badgeType}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Canonical Provenance Tooltip Note */}
            <div className="p-2 rounded border border-cyan-950 bg-[#070a12] text-[10px] space-y-1 text-zinc-400">
              <div className="text-cyan-300 font-bold flex items-center gap-1">
                <span>🛡️ CANONICAL PROVENANCE</span>
              </div>
              <div className="text-zinc-500">
                Authority Level: <span className="text-zinc-300">SSoT Architecture</span>
              </div>
              <div className="text-zinc-500">
                Data Source: <span className="text-zinc-300">Merkle Root Block #849202</span>
              </div>
              <div className="text-zinc-500">
                Evidence Status: <span className="text-emerald-400 font-semibold">Cryptographically Sealed (Δ0)</span>
              </div>
            </div>
          </div>

          {/* 17 CANONICAL MODULES SWITCH PANEL */}
          <div className="border border-cyan-900/60 rounded-xl p-3 space-y-2.5" style={{ backgroundColor: '#0a0f1e' }}>
            <div className="flex items-center justify-between pb-1.5 border-b border-cyan-950 text-xs font-bold">
              <span className="text-zinc-200">17 CANONICAL MODULES</span>
              <div className="flex items-center gap-2 text-[10px]">
                <button
                  onClick={() => handleEnableAllModules(true)}
                  className="text-cyan-400 hover:underline cursor-pointer"
                >
                  ทั้งหมด
                </button>
                <span className="text-zinc-600">|</span>
                <button
                  onClick={() => handleEnableAllModules(false)}
                  className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
                >
                  ปิดหมด
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              {CANONICAL_MODULES_TOGGLES.map((mod) => {
                const isOn = modulesToggle[mod.id] ?? true;
                return (
                  <div
                    key={mod.id}
                    className="flex items-center justify-between p-1.5 rounded border border-zinc-800 bg-[#070a12] text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-400">{mod.num}</span>
                      <span className="font-semibold text-zinc-200 text-[11px]">{mod.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] px-1.5 py-0.2 rounded border border-zinc-800 bg-black/40 font-bold ${mod.color}`}>
                        {mod.badge}
                      </span>
                      {/* Toggle Switch */}
                      <button
                        onClick={() => toggleModule(mod.id)}
                        className={`w-7 h-4 rounded-full transition-colors relative cursor-pointer ${
                          isOn ? 'bg-[#06B6D4]' : 'bg-zinc-800'
                        }`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${
                            isOn ? 'left-3.5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* RIGHT COLUMN: CHAMBER MATRIX + CLASSIFICATION + SSoT BASELINE + DETAIL */}
        {/* ==================================================================== */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          {/* ================================================================== */}
          {/* SECTION 1: CHAMBER MATRIX (ผังห้องปฏิบัติ 00-17) & QUICK CHIPS */}
          {/* ================================================================== */}
          <div className="border border-cyan-900/60 rounded-xl p-3.5 space-y-3" style={{ backgroundColor: '#0a0f1e' }}>
            {/* Title, Search, and Status */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-cyan-950">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                  <span>🏛️</span> CHAMBER MATRIX (ผังห้องปฏิบัติ 00-17)
                </span>
              </div>

              {/* Search Bar */}
              <div className="flex-1 max-w-sm">
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="🔍 ค้นหาห้อง..."
                    className="w-full bg-[#070a12] border border-cyan-900/80 rounded px-3 py-1 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#06B6D4]"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Current Status View Tag */}
              <div className="text-xs text-cyan-300 bg-[#070a12] px-2.5 py-1 rounded border border-cyan-900">
                กำลังดู: <strong className="text-zinc-100">Chamber {selectedChamberNum}</strong> • {CHAMBER_METAS[selectedChamberNum]?.thaiSub}{' '}
                <span className="text-emerald-400 font-bold">[18/18 ACTIVE]</span>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => {
                  if (isSoundActive) playTone(540, 0.02);
                  setGroupFilter('ALL');
                }}
                className={`px-3 py-1 rounded border font-bold text-xs whitespace-nowrap cursor-pointer transition ${
                  groupFilter === 'ALL'
                    ? 'border-[#06B6D4] bg-[#06B6D4] text-[#070a12]'
                    : 'border-cyan-950 bg-[#070a12] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                ALL (18)
              </button>
              {CHAMBER_GROUPS.map((grp) => (
                <button
                  key={grp.id}
                  onClick={() => {
                    if (isSoundActive) playTone(540, 0.02);
                    setGroupFilter(String(grp.idx) as any);
                  }}
                  className={`px-3 py-1 rounded border text-xs whitespace-nowrap cursor-pointer transition ${
                    groupFilter === String(grp.idx)
                      ? 'border-[#06B6D4] bg-[#06B6D4] text-[#070a12] font-bold'
                      : 'border-cyan-950 bg-[#070a12] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {grp.nameEn} ({grp.roomsCount})
                </button>
              ))}
            </div>

            {/* Horizontal Quick Chamber Selector Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              {Object.keys(CHAMBER_METAS).map((num) => {
                const meta = CHAMBER_METAS[num];
                const isSelected = selectedChamberNum === num;
                return (
                  <button
                    key={num}
                    onClick={() => handleSelectChamber(num)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'border-[#06B6D4] bg-[#070a12] text-[#06B6D4] shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        : 'border-zinc-800 bg-[#070a12] text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <span className={isSelected ? 'text-[#06B6D4]' : 'text-zinc-400'}>{num}</span>
                    <span>{meta.thaiSub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ================================================================== */}
          {/* SECTION 2: GLOBAL TRUTH & PROVENANCE CLASSIFICATION SYSTEM */}
          {/* ================================================================== */}
          <div className="border border-cyan-900/60 rounded-xl p-3.5 space-y-2.5" style={{ backgroundColor: '#0a0f1e' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-cyan-950">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                    <span>🌐</span> GLOBAL TRUTH &amp; PROVENANCE CLASSIFICATION SYSTEM
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded border border-emerald-700 bg-emerald-950/60 text-emerald-300 font-bold">
                    ENFORCED Δ0
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  ระบบจำแนกแหล่งที่มาของข้อมูล: <span className="text-emerald-400">CANONICAL</span> • <span className="text-cyan-400">RUNTIME</span> • <span className="text-blue-400">TELEMETRY</span> • <span className="text-purple-400">PRESENTATION</span> • <span className="text-amber-400">SIMULATION</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (isSoundActive) playTone(780, 0.03);
                  setShowTruthBoundary(!showTruthBoundary);
                }}
                className="px-3 py-1 rounded border border-cyan-800 bg-[#070a12] text-cyan-300 text-xs font-bold hover:border-cyan-600 transition cursor-pointer self-start sm:self-auto"
              >
                {showTruthBoundary ? 'HIDE TRUTH BOUNDARY' : 'SHOW TRUTH BOUNDARY'}
              </button>
            </div>

            {/* Provenance Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
              <span className="text-zinc-500 text-[11px] mr-1">FILTER:</span>
              {[
                { id: 'ALL', label: 'ทั้งหมด (ALL)' },
                { id: 'CANONICAL', label: 'CANONICAL' },
                { id: 'FROZEN', label: 'FROZEN' },
                { id: 'RUNTIME', label: 'RUNTIME' },
                { id: 'TELEMETRY', label: 'TELEMETRY' },
                { id: 'PRESENTATION', label: 'PRESENTATION' },
                { id: 'SIMULATION', label: 'SIMULATION' },
                { id: 'PENDING', label: 'PENDING' },
                { id: 'REDACTED', label: 'REDACTED' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => {
                    if (isSoundActive) playTone(640, 0.02);
                    setProvenanceFilter(pill.id);
                  }}
                  className={`px-2.5 py-1 rounded border text-[11px] font-bold whitespace-nowrap cursor-pointer transition ${
                    provenanceFilter === pill.id
                      ? 'border-[#06B6D4] bg-[#06B6D4] text-[#070a12]'
                      : 'border-zinc-800 bg-[#070a12] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Truth Boundary Popup Overlay if Toggled */}
            {showTruthBoundary && (
              <div className="p-3 rounded border border-cyan-800 bg-[#070a12] text-xs text-zinc-300 space-y-1.5 animate-in fade-in">
                <div className="text-cyan-300 font-bold flex items-center justify-between">
                  <span>TRUTH BOUNDARY &amp; ENCLAVE VERIFICATION MESH</span>
                  <span className="text-[10px] text-zinc-500">OMEGA-1 CLEARANCE</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div className="p-2 rounded border border-zinc-800 bg-black/40">
                    <span className="text-emerald-400 font-bold">CANONICAL REALM:</span>
                    <p className="text-zinc-400 mt-0.5">14,902 Seals verified at Block #849202. Zero ambient mutation.</p>
                  </div>
                  <div className="p-2 rounded border border-zinc-800 bg-black/40">
                    <span className="text-cyan-400 font-bold">RUNTIME &amp; PHOENIX:</span>
                    <p className="text-zinc-400 mt-0.5">142ms deterministic auto-recovery. Safe Harbor ETDA 2544.</p>
                  </div>
                  <div className="p-2 rounded border border-zinc-800 bg-black/40">
                    <span className="text-amber-400 font-bold">FAIL-CLOSED GATE:</span>
                    <p className="text-zinc-400 mt-0.5">Boundary Ω600_1000 (400 Tenants LOCKED). Zero drift Δ0.00%.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ================================================================== */}
          {/* SECTION 3: AUTHORITATIVE MASTER BASELINE (READ-ONLY) [FROZEN] */}
          {/* ================================================================== */}
          <div className="border border-amber-900/60 rounded-xl p-3.5 space-y-2.5" style={{ backgroundColor: '#0a0f1e' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-950">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#D4AF37] flex items-center gap-1">
                  <span>🔒</span> AUTHORITATIVE MASTER BASELINE (READ-ONLY)
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded border border-amber-700 bg-amber-950/60 text-[#D4AF37] font-bold">
                  FROZEN
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded border border-emerald-800 bg-emerald-950/60 text-emerald-300 font-bold text-[10px]">
                  CANONICAL MUTATION: Δ0
                </span>
                <span className="px-2 py-0.5 rounded border border-cyan-800 bg-cyan-950/60 text-cyan-300 font-bold text-[10px]">
                  FAIL-CLOSED: ACTIVE
                </span>
              </div>
            </div>

            <div className="text-[11px] text-zinc-400">
              Single Source of Truth (SSoT) — สถานะการทำงาน: <span className="text-[#D4AF37] font-semibold">MAINTENANCE / PRESERVATION ONLY</span>
            </div>

            {/* 7 Spec Blocks Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
              {[
                { label: 'PRODUCT', val: 'ZYRQUEN Ω∞' },
                { label: 'RELEASE', val: 'Prime v1.0 (LTS)' },
                { label: 'BASELINE', val: 'Frozen v1.2 LTS' },
                { label: 'PHASE REGISTRY', val: 'Phase 01-40' },
                { label: 'CANONICAL SEALS', val: '14,902 Seals', highlight: 'text-emerald-400' },
                { label: 'CHAMBERS/MODULES', val: '18 Chambers' },
                { label: 'SECURITY POLICY', val: 'Zero-Trust PQC' },
              ].map((item, idx) => (
                <div key={idx} className="p-2 rounded border border-zinc-800/80 bg-[#070a12] space-y-0.5">
                  <div className="text-[9px] text-zinc-500 font-bold">{item.label}</div>
                  <div className={`text-[11px] font-bold truncate ${item.highlight || 'text-zinc-200'}`}>
                    {item.val}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ================================================================== */}
          {/* SECTION 4: ACTIVE CHAMBER CONTENT */}
          {/* (Deep specialized views for 08 Post-Quantum Crypto, 17 Audit Ledger, etc.) */}
          {/* ================================================================== */}
          <div className="border border-cyan-900/60 rounded-xl p-4 space-y-4" style={{ backgroundColor: '#0a0f1e' }}>
            {/* Header / Breadcrumb of Selected Chamber */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-950">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="px-2 py-0.5 rounded border border-cyan-700 bg-[#070a12] text-cyan-300 font-bold">
                    🔑 CHAMBER {selectedChamberNum}
                  </span>
                  <span className="text-zinc-400">•</span>
                  <span className="text-zinc-300">{CHAMBER_METAS[selectedChamberNum]?.thaiSub}</span>
                  <span className="text-zinc-400">•</span>
                  <span className="text-zinc-400">
                    {CHAMBER_GROUPS.find((g) => g.chamberNums.includes(selectedChamberNum))?.nameEn}
                  </span>
                  <span className="text-zinc-400">•</span>
                  <span className="text-[#D4AF37] font-semibold text-[10px]">LOCKED_FROZEN_v1.2_LTS</span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <span>{selectedChamberNum} {CHAMBER_METAS[selectedChamberNum]?.codeName}</span>
                </h3>
                <p className="text-xs text-zinc-400 font-sans">
                  {selectedChamber.descriptionEn}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="px-2.5 py-1 rounded border border-emerald-600 bg-emerald-950/60 text-emerald-300 font-bold text-xs">
                  CANONICAL
                </span>
              </div>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* CHAMBER 08 SPECIFIC: POST-QUANTUM CRYPTOGRAPHY (PQC) ENCLAVE */}
            {/* ---------------------------------------------------------------- */}
            {selectedChamberNum === '08' && (
              <div className="space-y-3">
                <div className="p-3 rounded border border-purple-900/60 bg-[#070a12] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] text-purple-400 font-bold tracking-wider">
                      NEST FIPS 203 / 204 / 205 STANDARDS
                    </div>
                    <div className="text-sm font-bold text-zinc-100 mt-0.5">
                      Post-Quantum Cryptography (PQC) Enclave
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded border border-purple-600 bg-purple-950/60 text-purple-300 font-bold text-xs">
                    QUANTUM-RESISTANT 100%
                  </span>
                </div>

                {/* 4 PQC Cards Grid (2x2) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* 1. Dilithium-5 */}
                  <div className="p-3.5 rounded-lg border border-cyan-900 bg-[#070a12] space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-cyan-300">
                        CRYSTALS-Dilithium-5 (ML-DSA-87)
                      </h4>
                      <span className="text-[10px] px-1.5 py-0.2 rounded border border-cyan-800 bg-cyan-950/60 text-cyan-300 font-bold">
                        FIPS 204
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                      ลายมือชื่อดิจิทัลฐานแลตทิซ (Lattice-Based Digital Signature) ความมั่นคงปลอดภัยระดับ Category 5
                    </p>
                    <div className="text-[10px] text-zinc-500 pt-1 border-t border-cyan-950">
                      Public Key: <span className="text-zinc-300">0x0f3c7e91...4a2b10 (2,592 Bytes)</span> • Signature: <span className="text-zinc-300">4,595 Bytes</span>
                    </div>
                  </div>

                  {/* 2. Kyber-1024 */}
                  <div className="p-3.5 rounded-lg border border-cyan-900 bg-[#070a12] space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-cyan-300">
                        CRYSTALS-Kyber-1024 (ML-KEM-1024)
                      </h4>
                      <span className="text-[10px] px-1.5 py-0.2 rounded border border-cyan-800 bg-cyan-950/60 text-cyan-300 font-bold">
                        FIPS 203
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                      กลไกการห่อหุ้มกุญแจลับ (Key Encapsulation Mechanism) ความมั่นคงปลอดภัยระดับสูงสุด
                    </p>
                    <div className="text-[10px] text-zinc-500 pt-1 border-t border-cyan-950">
                      Encapsulated Secret: <span className="text-zinc-300">0x4d9a1f2b...8a0c19 (1,568 Bytes)</span> • Level 5 Security
                    </div>
                  </div>

                  {/* 3. FALCON-1024 */}
                  <div className="p-3.5 rounded-lg border border-cyan-900 bg-[#070a12] space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-cyan-300">
                        FALCON-1024
                      </h4>
                      <span className="text-[10px] px-1.5 py-0.2 rounded border border-amber-800 bg-amber-950/60 text-amber-300 font-bold">
                        NIST Round 3
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                      ลายมือชื่อกะทัดรัดด้วย Fast Fourier Sampling สำหรับการยืนยันด้วยความเร็วสูง
                    </p>
                    <div className="text-[10px] text-zinc-500 pt-1 border-t border-cyan-950">
                      Compact Signature: <span className="text-zinc-300">1,330 Bytes</span> • Verification Time: <span className="text-emerald-400 font-bold">0.08ms</span>
                    </div>
                  </div>

                  {/* 4. SPHINCS+ */}
                  <div className="p-3.5 rounded-lg border border-cyan-900 bg-[#070a12] space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-cyan-300">
                        SPHINCS+ (SLH-DSA)
                      </h4>
                      <span className="text-[10px] px-1.5 py-0.2 rounded border border-cyan-800 bg-cyan-950/60 text-cyan-300 font-bold">
                        FIPS 205
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                      ลายมือชื่อไร้สถานะไม่ขึ้นกับโครงสร้างแลตทิซ (Stateless Hash-Based Signature)
                    </p>
                    <div className="text-[10px] text-zinc-500 pt-1 border-t border-cyan-950">
                      Robust Security Guarantee: <span className="text-zinc-300">Zero Mathematical Lattice Assumptions</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* CHAMBER 17 SPECIFIC: AUDIT TRAIL LEDGER API & 8 SUB-ACTION TABS */}
            {/* ---------------------------------------------------------------- */}
            {selectedChamberNum === '17' && (
              <div className="space-y-4">
                {/* Chamber 17 Banner */}
                <div className="p-3 rounded border border-cyan-900 bg-[#070a12] space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-zinc-100">
                        CHAMBER 17: AUDIT TRAIL LEDGER API
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        Immutable Merkle Hash Chain • Dilithium-5 ML-DSA-87 • 10/10 REAL_HSM Quorum • 12-Stage Subzero Trace Replay (0.18ms) • ETDA 2544 Sections 9/26/28 Court Ready
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (isSoundActive) playTone(880, 0.05);
                          setIsCertificateModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded border border-amber-600 bg-amber-950/60 text-[#D4AF37] text-xs font-bold hover:bg-amber-900/60 cursor-pointer transition flex items-center gap-1"
                      >
                        <span>📑</span> Download PDF Audit Report
                      </button>
                      <button
                        onClick={() => {
                          if (isSoundActive) playTone(680, 0.03);
                          const jsonBlob = JSON.stringify(selectedChamber, null, 2);
                          copyToClipboard(jsonBlob);
                        }}
                        className="px-2.5 py-1 rounded border border-cyan-800 bg-[#070a12] text-cyan-300 text-xs font-bold cursor-pointer transition"
                      >
                        JSON Manifest
                      </button>
                      <button
                        onClick={() => {
                          if (isSoundActive) playAuditChime();
                        }}
                        className="px-2.5 py-1 rounded border border-emerald-800 bg-emerald-950/60 text-emerald-300 text-xs font-bold cursor-pointer transition"
                      >
                        5/5 Baseline Tests
                      </button>
                    </div>
                  </div>

                  {/* 6 Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-cyan-950">
                    <div className="p-2 rounded border border-zinc-800 bg-black/40 space-y-0.5">
                      <div className="text-[10px] text-zinc-500">CANONICAL BLOCK</div>
                      <div className="text-xs font-bold text-zinc-200">#849,202</div>
                      <div className="text-[9px] text-emerald-400">Slot #12 • 00:26 UTC</div>
                    </div>
                    <div className="p-2 rounded border border-zinc-800 bg-black/40 space-y-0.5">
                      <div className="text-[10px] text-zinc-500">SSoT DRIFT</div>
                      <div className="text-xs font-bold text-emerald-400">Δ0 (0.00%)</div>
                      <div className="text-[9px] text-zinc-400">Zero Drift Locked</div>
                    </div>
                    <div className="p-2 rounded border border-zinc-800 bg-black/40 space-y-0.5">
                      <div className="text-[10px] text-zinc-500">HSM QUORUM</div>
                      <div className="text-xs font-bold text-[#D4AF37]">10/10 REAL_HSM</div>
                      <div className="text-[9px] text-zinc-400">Slots 01-10 Enclave</div>
                    </div>
                    <div className="p-2 rounded border border-zinc-800 bg-black/40 space-y-0.5">
                      <div className="text-[10px] text-zinc-500">CRYO TEMP</div>
                      <div className="text-xs font-bold text-cyan-300">14.98 mK</div>
                      <div className="text-[9px] text-zinc-400">Helium-4 Dilution</div>
                    </div>
                    <div className="p-2 rounded border border-zinc-800 bg-black/40 space-y-0.5">
                      <div className="text-[10px] text-zinc-500">TRACE REPLAY</div>
                      <div className="text-xs font-bold text-emerald-400">0.18 ms</div>
                      <div className="text-[9px] text-zinc-400">QL &lt; 0.2ms P95</div>
                    </div>
                    <div className="p-2 rounded border border-zinc-800 bg-black/40 space-y-0.5">
                      <div className="text-[10px] text-zinc-500">QUARANTINE BUFFER</div>
                      <div className="text-xs font-bold text-rose-400">5 Items</div>
                      <div className="text-[9px] text-zinc-400">Chamber 02 Protected</div>
                    </div>
                  </div>
                </div>

                {/* 8 Sub-action Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
                  {[
                    { id: 1, label: '1. IMMUTABLE LEDGER (4)' },
                    { id: 2, label: '2. INGEST SIMULATOR (api/v1/verify)' },
                    { id: 3, label: '3. 12-STAGE TRACE REPLAY' },
                    { id: 4, label: '4. MERKLE VERIFIER (api/v1/verify)' },
                    { id: 5, label: '5. 5/5 BASELINE DIAGNOSTIC' },
                    { id: 6, label: '6. CHAMBER 02 QUARANTINE (5)' },
                    { id: 7, label: '7. AUDIT REPORT (PDF & SIGNATURE)' },
                    { id: 8, label: '8. HARDENING & KEY ROTATION (ETDA/NIST)' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        if (isSoundActive) playTone(600, 0.02);
                        setChamber17Tab(t.id);
                      }}
                      className={`px-3 py-1.5 rounded border text-xs font-bold whitespace-nowrap cursor-pointer transition ${
                        chamber17Tab === t.id
                          ? 'border-[#06B6D4] bg-[#06B6D4] text-[#070a12]'
                          : 'border-cyan-950 bg-[#070a12] text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Tab 1: Immutable Ledger Block Explorer */}
                {chamber17Tab === 1 && (
                  <div className="p-3.5 rounded border border-cyan-900/80 bg-[#070a12] space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-200">IMMUTABLE BLOCK CHAIN LEDGER</span>
                      <span className="text-zinc-500">Chain: ZYRQUEN-CANONICAL-P0</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {[
                        { block: '#849,202', name: 'RATIFY_GENESIS_CORE', hash: 'sha256-e14812a00c...', time: '00:26 UTC', status: 'CANONICAL_LOCKED' },
                        { block: '#849,203', name: 'THAI_PDPA_ETDA_SUITE', hash: 'sha256-f25581c900...', time: '00:28 UTC', status: 'CANONICAL_LOCKED' },
                        { block: '#849,204', name: 'FIOS_TREASURY_REIMBURSEMENT', hash: 'sha256-a909b81447...', time: '00:30 UTC', status: 'CANONICAL_LOCKED' },
                        { block: '#849,205', name: 'WARP_NAV_GRID_SYNCHRONIZATION', hash: 'sha256-c74da816be...', time: '00:32 UTC', status: 'CANONICAL_LOCKED' },
                      ].map((b, idx) => (
                        <div key={idx} className="p-2 rounded border border-zinc-800 bg-black/40 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span className="text-[#D4AF37] font-bold">{b.block}</span>
                            <span className="text-zinc-300 font-semibold">{b.name}</span>
                          </div>
                          <div className="flex items-center gap-3 text-zinc-400 text-[11px]">
                            <span className="hidden sm:inline font-mono">{b.hash}</span>
                            <span>{b.time}</span>
                            <span className="px-2 py-0.5 rounded border border-emerald-700 bg-emerald-950/60 text-emerald-300 font-bold text-[10px]">
                              {b.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 3: 12-Stage Trace Replay */}
                {chamber17Tab === 3 && (
                  <div className="p-3.5 rounded border border-cyan-900/80 bg-[#070a12] space-y-3">
                    <div className="text-xs font-bold text-zinc-200">
                      12-STAGE SUBZERO FORENSIC REPLAY PIPELINE (0.18ms)
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
                      {[
                        '01. INGEST', '02. DE-ANON', '03. REDACT', '04. TRNG', '05. ML-DSA', '06. KYBER',
                        '07. MERKLE', '08. HSM-VOTE', '09. IMMUTABLE', '10. ETDA-REC', '11. PDPA-SEAL', '12. REPLAY'
                      ].map((stg, idx) => (
                        <div key={idx} className="p-2 rounded border border-emerald-900 bg-emerald-950/20 text-center space-y-1">
                          <div className="text-emerald-400 font-bold text-[10px]">{stg}</div>
                          <div className="text-[9px] text-zinc-400">0.015ms • PASS</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 7: Official Audit Report & Ratification */}
                {chamber17Tab === 7 && (
                  <div className="p-3.5 rounded border border-amber-900 bg-[#070a12] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-[#D4AF37] flex items-center gap-1.5">
                          <span>👑</span> LEAD SOVEREIGN ARCHITECT DIGITAL RATIFICATION
                        </div>
                        <div className="text-xs text-zinc-300 mt-0.5">
                          Signatory: <strong className="text-zinc-100">นายยุทธภูมิ ภักเพียร (#EP-SOVEREIGN-01)</strong> • OMEGA-1 SUPREME CLEARANCE
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (isSoundActive) playTone(880, 0.05);
                          setIsCertificateModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded border border-amber-600 bg-amber-950/60 text-[#D4AF37] text-xs font-bold hover:bg-amber-900/60 cursor-pointer transition"
                      >
                        ดาวน์โหลดรายงานฉบับเต็ม (Full PDF)
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-2 border-t border-amber-950">
                      <div className="p-2 rounded border border-zinc-800 bg-black/40">
                        <span className="text-zinc-400">SIGNATURE STANDARD:</span>
                        <div className="text-purple-300 font-bold mt-0.5">NIST FIPS 204 (Dilithium-5)</div>
                      </div>
                      <div className="p-2 rounded border border-zinc-800 bg-black/40">
                        <span className="text-zinc-400">DECA-KEY QUORUM:</span>
                        <div className="text-emerald-300 font-bold mt-0.5">10/10 REAL_HSM Ratified</div>
                      </div>
                      <div className="p-2 rounded border border-zinc-800 bg-black/40">
                        <span className="text-zinc-400">LEGAL RELIANCE:</span>
                        <div className="text-[#D4AF37] font-bold mt-0.5">ETDA Sec 9, 26, 28 &amp; PDPA</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 8: Hardening & Key Rotation */}
                {chamber17Tab === 8 && (
                  <div className="p-3.5 rounded border border-cyan-900 bg-[#070a12] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-cyan-300">
                          DECA-KEY QUORUM (10/10) &amp; PHYSICAL TAMPER ZEROIZATION POLICY
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5">
                          Cryptographic Key Lifecycle and Zeroization Protocols in Compliance with FIPS 140-3 Level 4 (Sub-Section 9.4)
                        </div>
                      </div>

                      <button
                        onClick={handleExecuteKeyRotation}
                        disabled={isRotatingKeys}
                        className="px-3 py-1.5 rounded border border-cyan-600 bg-cyan-950/60 text-cyan-300 text-xs font-bold hover:bg-cyan-900/60 cursor-pointer transition whitespace-nowrap"
                      >
                        {isRotatingKeys ? 'กำลังหมุนเวียนกุญแจ...' : `EXECUTE 90-DAY KEY ROTATION (CYCLE #${rotationCycle})`}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                      <div className="p-2 rounded border border-zinc-800 bg-black/40">
                        <div className="text-[10px] text-zinc-500">ROTATION CYCLE</div>
                        <div className="text-xs font-bold text-zinc-200">Cycle #{rotationCycle}</div>
                      </div>
                      <div className="p-2 rounded border border-zinc-800 bg-black/40">
                        <div className="text-[10px] text-zinc-500">HSM QUORUM STATUS</div>
                        <div className="text-xs font-bold text-emerald-400">10/10 REAL_HSM</div>
                      </div>
                      <div className="p-2 rounded border border-zinc-800 bg-black/40">
                        <div className="text-[10px] text-zinc-500">GENESIS ROOT INVARIANT</div>
                        <div className="text-xs font-bold text-cyan-300">SSoT Δ0.00%</div>
                      </div>
                      <div className="p-2 rounded border border-zinc-800 bg-black/40">
                        <div className="text-[10px] text-zinc-500">ZEROIZE LATENCY SLA</div>
                        <div className="text-xs font-bold text-[#D4AF37]">&lt; 0.05 ms</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Historical State Reliability Index Chart (As shown in video) */}
                <div className="p-3.5 rounded border border-cyan-900 bg-[#070a12] space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-zinc-200">
                        HISTORICAL STATE RELIABILITY INDEX (24 h VERIFICATION SCALE)
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        Coherence Rate: <span className="text-emerald-400 font-bold">99.3%</span> • State Reliability: <span className="text-cyan-300 font-bold">99.9%</span> • Cryo: <span className="text-cyan-300">14.98 mK</span> • 10/10 REAL_HSM
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded border border-emerald-800 bg-emerald-950/60 text-emerald-300 font-bold">
                      Zero Drift Δ 0.0%
                    </span>
                  </div>

                  {/* 24-point Scrubber Timeline Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-end gap-1 h-14 w-full bg-black/40 p-1.5 rounded border border-zinc-800">
                      {Array.from({ length: 24 }).map((_, i) => {
                        const isSelectedPoint = selectedTimelinePoint === i;
                        const heightPercent = 88 + (i % 5) * 2.2;
                        return (
                          <div
                            key={i}
                            onClick={() => {
                              if (isSoundActive) playTone(500 + i * 15, 0.02);
                              setSelectedTimelinePoint(i);
                            }}
                            className={`flex-1 rounded-t cursor-pointer transition-all ${
                              isSelectedPoint ? 'bg-[#06B6D4] shadow-[0_0_8px_#06B6D4]' : 'bg-emerald-600/70 hover:bg-emerald-400'
                            }`}
                            style={{ height: `${heightPercent}%` }}
                            title={`T-${24 - i}h: State Reliability 99.9%`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                      <span>00:00 (T-24h)</span>
                      <span>06:00</span>
                      <span>12:00</span>
                      <span>18:00</span>
                      <span>CURRENT POINT (SSoT PASS)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chamber 02: Quarantine View */}
            {selectedChamberNum === '02' && (
              <div className="pt-2">
                <Chamber02View />
              </div>
            )}

            {/* Chamber 11: 8K Quantum Radar View */}
            {selectedChamberNum === '11' && (
              <div className="pt-2">
                <Chamber11QuantumRadar />
              </div>
            )}

            {/* Other Chambers: Telemetry and Sub-modules */}
            {!['08', '17', '02', '11'].includes(selectedChamberNum) && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selectedChamber.metrics.map((m, idx) => (
                    <div key={idx} className="p-3 rounded border border-zinc-800 bg-[#070a12] space-y-1">
                      <div className="text-[10px] text-zinc-500 font-bold">{m.label}</div>
                      <div className="text-sm font-bold text-zinc-100">{m.value}</div>
                      <div className="text-[9px] text-emerald-400 flex items-center gap-1">
                        <span>●</span> SSoT Invariant OK
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded border border-zinc-800 bg-[#070a12] space-y-2">
                  <div className="text-xs font-bold text-zinc-200">
                    โมดูลย่อยและเอนจินภายใน ({selectedChamber.subModules.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {selectedChamber.subModules.map((sub, idx) => (
                      <div key={idx} className="p-2 rounded border border-zinc-800/80 bg-black/40 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-200">{sub.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded border border-cyan-800 bg-cyan-950/60 text-cyan-300">
                            {sub.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-sans">{sub.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ================================================================== */}
          {/* SECTION 5: SYSTEM REAL-TIME LOGSTREAM & AUDIT TRAIL */}
          {/* ================================================================== */}
          <div className="border border-cyan-900/60 rounded-xl p-3.5 space-y-2.5" style={{ backgroundColor: '#0a0f1e' }}>
            <div className="flex items-center justify-between pb-2 border-b border-cyan-950">
              <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <span>&gt;_</span> SYSTEM REAL-TIME LOGSTREAM &amp; AUDIT TRAIL
              </span>

              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => {
                    if (isSoundActive) playTone(700, 0.02);
                    copyToClipboard('Phase,Block,Status,MerkleRoot\n01-40,849202,SSoT_PASS,909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68');
                  }}
                  className="px-2 py-0.5 rounded border border-cyan-800 bg-[#070a12] text-cyan-300 text-[10px] hover:border-cyan-600 cursor-pointer transition"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => {
                    if (isSoundActive) playTone(700, 0.02);
                    copyToClipboard('ZYRQUEN Ω∞ REAL-TIME AUDIT LOG\nBlock: #849202\n14,902 Seals Verified');
                  }}
                  className="px-2 py-0.5 rounded border border-cyan-800 bg-[#070a12] text-cyan-300 text-[10px] hover:border-cyan-600 cursor-pointer transition"
                >
                  Export TXT
                </button>
                <span className="px-2 py-0.5 rounded border border-emerald-800 bg-emerald-950/60 text-emerald-300 text-[10px] font-bold">
                  LIVE
                </span>
              </div>
            </div>

            {/* Terminal Window Box */}
            <div className="p-3 rounded border border-zinc-800 bg-black/60 text-[11px] font-mono text-zinc-300 space-y-1 overflow-x-auto leading-relaxed max-h-48 overflow-y-auto">
              <div>
                <span className="text-amber-400 font-bold">[FROZEN]</span>{' '}
                <span className="text-cyan-400">[Phase 01-40]</span> Master Manifest Replay Determinism Logged (SSoT Δ0)
              </div>
              <div>
                <span className="text-emerald-400 font-bold">[CANONICAL]</span>{' '}
                <span className="text-purple-400">[LedgerFabric]</span> Jump Transaction #081 -&gt; Signed ML-DSA-87
              </div>
              <div>
                <span className="text-emerald-400 font-bold">[CANONICAL]</span>{' '}
                <span className="text-purple-400">[MerkleWarpTree]</span> Proof Chain Anchored -&gt; Merkle Root 0x909ab814...43fa4c68
              </div>
              <div>
                <span className="text-rose-400 font-bold">[SECURITY]</span>{' '}
                <span className="text-amber-400">[ChaosDrill]</span> Intercepted Direct Write to Frozen Core -&gt; <span className="text-emerald-400 font-bold">FAIL-CLOSED ENFORCED</span>
              </div>
              <div>
                <span className="text-blue-400 font-bold">[TELEMETRY]</span>{' '}
                <span className="text-cyan-400">[NavGrid]</span> Tenant Ω1000 Sovereign Control Node Synchronized
              </div>
              <div>
                <span className="text-emerald-400 font-bold">[CANONICAL]</span>{' '}
                <span className="text-purple-400">[FIOS DS-901]</span> Quality 35% ROIC Z-Score Model Verified -&gt; Sharpe 2.41
              </div>
              <div>
                <span className="text-amber-400 font-bold">[FROZEN]</span>{' '}
                <span className="text-cyan-400">[Phase 40]</span> Gate 22 SSoT Mutation Delta = 0 Confirmed PASS
              </div>
            </div>
          </div>

          {/* ================================================================== */}
          {/* SECTION 6: SUPREME SOVEREIGN GOLD MASTER SEAL */}
          {/* ================================================================== */}
          <div className="border border-amber-900/80 rounded-xl p-4 space-y-3" style={{ backgroundColor: '#0a0f1e' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl border border-amber-500/60 bg-[#070a12] flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                  👑
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.2 rounded border border-amber-800 bg-amber-950/60 text-[#D4AF37] font-bold text-[9px]">
                      10/10 REAL_HSM ATTESTED
                    </span>
                    <span className="text-[10px] text-zinc-500">SSoT Δ0.00%</span>
                  </div>
                  <h4 className="text-sm font-bold text-zinc-100">
                    Supreme Sovereign Gold Master Seal
                  </h4>
                  <div className="text-xs text-zinc-400">
                    สถาปนิกอธิปไตยสูงสุด: <strong className="text-zinc-200">นายยุทธภูมิ ภักเพียร (#EP-SOVEREIGN-01)</strong>
                  </div>
                  <div className="text-[10px] text-zinc-500 pt-0.5">
                    Merkle Root: <span className="text-[#06B6D4]">909ab814...43fa4c68</span> • Block <span className="text-zinc-300">#849202</span> • 14,902 Seals (SSoT Δ0)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                <button
                  onClick={() => {
                    if (isSoundActive) playTone(880, 0.05);
                    setIsCertificateModalOpen(true);
                    if (onOpenCertificate) onOpenCertificate();
                  }}
                  className="px-3.5 py-2 rounded-lg border border-amber-500 bg-[#D4AF37] text-[#070a12] font-black text-xs hover:bg-amber-400 cursor-pointer transition shadow-[0_0_12px_rgba(212,175,55,0.3)] flex items-center gap-1.5"
                >
                  <span>📜</span> ดูใบรับรองทองคำ (Master Cert)
                </button>

                <button
                  onClick={() => {
                    if (isSoundActive) playAuditChime();
                  }}
                  className="px-3.5 py-2 rounded-lg border border-cyan-700 bg-[#070a12] text-cyan-300 font-bold text-xs hover:border-[#06B6D4] cursor-pointer transition flex items-center gap-1.5"
                >
                  <span>🛡️</span> ตรวจสอบ Invariants
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Certificate Modal */}
      {isCertificateModalOpen && (
        <AuditCertificateModal
          isOpen={isCertificateModalOpen}
          onClose={() => setIsCertificateModalOpen(false)}
        />
      )}
    </div>
  );
};
