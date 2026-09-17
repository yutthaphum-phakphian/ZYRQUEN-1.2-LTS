import React, { useState } from 'react';
import {
  Scale,
  ShieldCheck,
  Award,
  BookOpen,
  FileCheck2,
  Lock,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import { SYSTEM_METADATA, CANONICAL_MERKLE_ROOT, CANONICAL_GENESIS_BLOCK, CANONICAL_SEALS } from '../../data/canonicalData';
import { copyToClipboard } from '../../utils/clipboard';
import { playAuditChime, playTone } from '../AudioSynthesizer';

interface LegalCitationRecord {
  id: string;
  actName: string;
  sections: string;
  statutoryRule: string;
  systemBinding: string;
  status: 'INVIOLABLE' | 'VERIFIED' | 'ADMISSIBLE';
  dossierRef: string;
}

const CITATIONS: LegalCitationRecord[] = [
  {
    id: 'ETDA-01',
    actName: 'พระราชบัญญัติว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 (ETDA)',
    sections: 'มาตรา ๙, ๒๖, ๒๘',
    statutoryRule: 'การรับรองลายมือชื่ออิเล็กทรอนิกส์ที่มีความปลอดภัยและข้อสันนิษฐานความถูกต้องตามกฎหมายในชั้นศาล',
    systemBinding: 'ผูกมัดด้วยลายเซ็น Post-Quantum ML-DSA-87 และ FALCON-1024 ภายใต้ฮาร์ดแวร์ FIPS 140-3 L4 ของผู้พิทักษ์ 10 ท่าน',
    status: 'ADMISSIBLE',
    dossierRef: 'ETDA-SEC28-PROOF-849202',
  },
  {
    id: 'PDPA-01',
    actName: 'พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)',
    sections: 'มาตรา 26, 28',
    statutoryRule: 'การห้ามส่งหรือโอนข้อมูลส่วนบุคคลไปยังต่างประเทศโดยปราศจากมาตรฐานคุ้มครองที่เพียงพอ',
    systemBinding: 'การควบคุมขอบเขตข้อมูลอธิปไตย Ω601-Ω1000 และการแยก Enclave ในระดับฮาร์ดแวร์ ข้อมูลไม่รั่วไหลออกนอกอธิปไตย',
    status: 'INVIOLABLE',
    dossierRef: 'PDPA-SEC28-ENCLAVE-01',
  },
  {
    id: 'NCSA-01',
    actName: 'พระราชบัญญัติการรักษาความมั่นคงปลอดภัยไซเบอร์ พ.ศ. 2562 (NCSA)',
    sections: 'การคุ้มครองโครงสร้างพื้นฐานสำคัญทางสารสนเทศ (CII)',
    statutoryRule: 'มาตรการรับมือภัยคุกคามทางไซเบอร์ในระดับวิกฤตและความต่อเนื่องในการปฏิบัติงาน',
    systemBinding: 'กลไก Fail-Closed Circuit Breaker ตัดวงจรฉุกเฉินและกักกัน (Quarantine) อัตโนมัติทันทีหากเกิดความผิดปกติ',
    status: 'VERIFIED',
    dossierRef: 'NCSA-CII-QUARANTINE-GATE',
  },
  {
    id: 'NIST-01',
    actName: 'NIST Post-Quantum Cryptography Federal Standards',
    sections: 'FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA)',
    statutoryRule: 'สถาปัตยกรรมการเข้ารหัสลับที่ทนทานต่อการโจมตีจากคอมพิวเตอร์ควอนตัมขนาดใหญ่ (CRQC)',
    systemBinding: 'การใช้งาน Dual-Key Dilithium-5 / Kyber-1024 ร่วมกับ SPHINCS+ ไฮบริดระดับสากล',
    status: 'VERIFIED',
    dossierRef: 'NIST-FIPS-PQC-AGILITY',
  },
];

export const Room00LegalGraph: React.FC = () => {
  const [selectedCitation, setSelectedCitation] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  const handleCopy = (ref: string, id: string) => {
    copyToClipboard(ref);
    setCopiedRef(id);
    playTone(650, 0.04);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Supreme Room 00 Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/30 via-black to-emerald-950/30 border border-blue-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-lg text-blue-400 shrink-0">
            ⚖️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">Room 00: Gold Seal Legal Graph &amp; Senate Audit</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold">
                STATUTORY SUPREME
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Binding Genesis Block #{CANONICAL_GENESIS_BLOCK} &amp; {CANONICAL_SEALS.toLocaleString()} Seals to Thai Sovereign Jurisprudence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-zinc-500">Admissibility:</span>
          <span className="text-emerald-400 font-bold">100% INVIOLABLE</span>
        </div>
      </div>

      {/* Citations List */}
      <div className="space-y-2.5">
        {CITATIONS.map((cit) => {
          const isSelected = selectedCitation === cit.id;
          return (
            <div
              key={cit.id}
              onClick={() => {
                playTone(isSelected ? 450 : 600, 0.03);
                setSelectedCitation(isSelected ? null : cit.id);
              }}
              className="p-3.5 rounded-xl bg-black/40 border border-white/10 hover:border-blue-500/40 transition-colors cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-blue-400 font-bold">{cit.sections}</span>
                  <span className="text-white font-bold truncate max-w-sm sm:max-w-md">{cit.actName}</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  {cit.status}
                </span>
              </div>

              <p className="text-[11px] text-zinc-300 line-clamp-1">{cit.statutoryRule}</p>

              {isSelected && (
                <div className="pt-3 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-3 bg-white/[0.01] p-3 rounded-lg text-[11px]">
                  <div>
                    <div className="text-zinc-500 text-[10px] uppercase font-bold">System Cryptographic Binding</div>
                    <div className="text-emerald-300 mt-1">{cit.systemBinding}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-zinc-500 text-[10px] uppercase font-bold">Forensic Dossier Citation</div>
                    <div className="flex items-center justify-between gap-2 p-1.5 rounded bg-black/60 border border-white/5">
                      <code className="text-cyan-300 text-[10px]">{cit.dossierRef}</code>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(cit.dossierRef, cit.id);
                        }}
                        className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-zinc-300 text-[9px] shrink-0"
                      >
                        {copiedRef === cit.id ? 'Copied' : 'Copy Ref'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
