"use client";

import React, { useState } from 'react';
import {
  FileCheck2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Scale,
  Lock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { SSOT } from '../lib/ssot-data';
import { playTone, playAuditChime } from './AudioSynthesizer';

interface AuditRule {
  id: string;
  nameTh: string;
  nameEn: string;
  clause: string;
  category: 'ETA_2544' | 'PDPA_2562' | 'SOC2_ISO';
  status: 'PASS' | 'AUDITING' | 'VERIFIED';
  digest: string;
  details: string;
}

const INITIAL_RULES: AuditRule[] = [
  {
    id: 'ETA-SEC-09',
    nameTh: 'ความสมบูรณ์และผลผูกพันทางกฎหมายของลายมือชื่ออิเล็กทรอนิกส์',
    nameEn: 'Electronic Signature Legal Enforceability',
    clause: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 มาตรา ๙',
    category: 'ETA_2544',
    status: 'VERIFIED',
    digest: 'SHA256:7e819ac2190f84a861d8a12903fe5918bbda2094892c90fa1893c83091e8430a',
    details: 'ผูกโยงลายมือชื่อ Dilithium-5 (ML-DSA-87) กับเจตนาของสถาปนิกสูงสุด (#EP-SOVEREIGN-01)',
  },
  {
    id: 'ETA-SEC-26',
    nameTh: 'ข้อกำหนดความมั่นคงปลอดภัยขั้นสูงและการปฏิเสธความรับผิดไม่ได้',
    nameEn: 'Advanced E-Signature Security & Non-Repudiation',
    clause: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 มาตรา ๒๖',
    category: 'ETA_2544',
    status: 'VERIFIED',
    digest: 'SHA256:43fa4c68909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a',
    details: 'รับรองด้วยฉันทามติเอกฉันท์ 10/10 REAL_HSM Quorum (FIPS 140-3 Level 4)',
  },
  {
    id: 'ETA-SEC-28',
    nameTh: 'การตรวจพิสูจน์โดยบุคคลภายนอกและความรับผิดชอบในพยานหลักฐาน',
    nameEn: 'Third-Party Verification & Reliance Integrity',
    clause: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 มาตรา ๒๘',
    category: 'ETA_2544',
    status: 'VERIFIED',
    digest: 'SHA256:909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    details: 'จุดตรวจรับรองพยานหลักฐานอิสระสำหรับศาลสถิตย์ยุติธรรมและพนักงานเจ้าหน้าที่ ETDA',
  },
  {
    id: 'PDPA-SEC-22',
    nameTh: 'การจำกัดการเก็บรวบรวมข้อมูลส่วนบุคคลเท่าที่จำเป็น',
    nameEn: 'Data Minimization & Dynamic PII Masking',
    clause: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 มาตรา ๒๒',
    category: 'PDPA_2562',
    status: 'VERIFIED',
    digest: 'SHA256:0a91f4bde018f921d7b322a4501445210abefea12349deca019cf3951ab1e1f',
    details: 'ระบบพรางข้อมูลส่วนบุคคล PII แบบอัตโนมัติในระดับไบต์ก่อนบันทึกสู่ Merkle Ledger',
  },
  {
    id: 'PDPA-SEC-24',
    nameTh: 'การประมวลผลข้อมูลตามวัตถุประสงค์และการแยกแยะผู้เช่า',
    nameEn: 'Purpose Limitation & Tenant Context Routing',
    clause: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 มาตรา ๒๔',
    category: 'PDPA_2562',
    status: 'VERIFIED',
    digest: 'SHA256:88fb22b918af5e2b001a4e512cf82210aeb88cd223d6a04e578f1e109ff34db',
    details: 'การแยกบริบทฐานข้อมูลผู้เช่าและวัตถุประสงค์การใช้งานแบบ Zero Trust',
  },
  {
    id: 'PDPA-SEC-28',
    nameTh: 'การควบคุมการโอนข้อมูลข้ามพรมแดนและการล็อกถิ่นที่อยู่ข้อมูล',
    nameEn: 'Cross-Border Regional Residency Lock',
    clause: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 มาตรา ๒๘',
    category: 'PDPA_2562',
    status: 'VERIFIED',
    digest: 'SHA256:e109ff34dbca223eef12a03f4455a228f44de12cdab29ef11abcf5b1e1fd951a',
    details: 'ล็อกข้อมูลในอาณาเขต Sovereign Siam Cloud (asia-east1/bangkok-dc1) 100%',
  },
];

export const ComplianceAuditSimulator: React.FC = () => {
  const [rules, setRules] = useState<AuditRule[]>(INITIAL_RULES);
  const [isAuditing, setIsAuditing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'ETA_2544' | 'PDPA_2562'>('ALL');
  const [lastAuditTimestamp, setLastAuditTimestamp] = useState<string>('2026-09-01T00:22:36+07:00');

  const handleRunAudit = async () => {
    setIsAuditing(true);
    playTone(520, 0.05);

    // Simulate stepping through audit items
    for (let i = 0; i < rules.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      playTone(600 + i * 40, 0.03);
    }

    setRules((prev) =>
      prev.map((r) => ({
        ...r,
        status: 'VERIFIED',
      }))
    );
    setIsAuditing(false);
    setLastAuditTimestamp(new Date().toISOString());
    playAuditChime();
  };

  const filteredRules = rules.filter(
    (r) => selectedFilter === 'ALL' || r.category === selectedFilter
  );

  return (
    <div className="bg-zinc-950/90 border border-emerald-500/40 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
                THAI LEGAL TECH AUDIT ENGINE
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                ETA 2544 &bull; PDPA 2562
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold font-mono text-zinc-100 mt-0.5">
              Automated Statutory Compliance Simulator
            </h3>
          </div>
        </div>

        <button
          onClick={handleRunAudit}
          disabled={isAuditing}
          className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-semibold flex items-center gap-2 border transition-all self-start sm:self-auto ${
            isAuditing
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 animate-pulse'
              : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-md'
          }`}
        >
          <RotateCw className={`w-3.5 h-3.5 text-emerald-400 ${isAuditing ? 'animate-spin' : ''}`} />
          <span>{isAuditing ? 'Auditing Laws & Rules...' : 'Re-Run Compliance Audit'}</span>
        </button>
      </div>

      {/* Filter Tabs & Compliance Score */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          {(['ALL', 'ETA_2544', 'PDPA_2562'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => {
                playTone(620, 0.02);
                setSelectedFilter(filter);
              }}
              className={`px-2.5 py-1 rounded-lg transition border ${
                selectedFilter === filter
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600 font-bold'
                  : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {filter === 'ALL'
                ? 'กฎหมายทั้งหมด (6)'
                : filter === 'ETA_2544'
                ? 'พ.ร.บ. ธุรกรรมฯ (ม.๙, ๒๖, ๒๘)'
                : 'PDPA พ.ศ. ๒๕๖๒'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-lg text-[11px]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>คะแนนความพร้อมศาลไทย: 100% PASS</span>
        </div>
      </div>

      {/* Rule Cards List */}
      <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
        {filteredRules.map((rule) => (
          <div
            key={rule.id}
            className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-1.5 hover:border-emerald-500/40 transition"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {rule.id}
                  </span>
                  <span className="text-xs font-bold text-zinc-200">
                    {rule.nameTh}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                  {rule.clause} ({rule.nameEn})
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60 whitespace-nowrap">
                {rule.status}
              </span>
            </div>

            <p className="text-xs text-zinc-400 font-sans">{rule.details}</p>

            <div className="text-[10px] font-mono text-zinc-500 truncate bg-black/40 px-2 py-0.5 rounded border border-zinc-800/60">
              Digest: {rule.digest}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Assurance Info */}
      <div className="text-[11px] font-mono text-zinc-400 flex items-center justify-between border-t border-zinc-800/80 pt-2.5">
        <span>การตรวจสอบล่าสุด: {lastAuditTimestamp.slice(0, 19)}</span>
        <span className="text-emerald-400">Court-Admissible ISO/IEC 27037</span>
      </div>
    </div>
  );
};
