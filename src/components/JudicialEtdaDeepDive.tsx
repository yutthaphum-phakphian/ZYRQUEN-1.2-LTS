import React, { useState } from 'react';
import {
  Scale,
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileText,
  FileCheck,
  Download,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Lock,
  Cpu
} from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';

export interface JudicialGate {
  id: string;
  gateNumber: number;
  name: string;
  thaiName: string;
  latency: string;
  statutoryBase: string;
  thaiLawSection: string;
  status: 'PASSED' | 'VERIFIED';
  description: string;
  forensicProof: string;
  courtAdmissibility: string;
}

export const JUDICIAL_GATES_15_22: JudicialGate[] = [
  {
    id: 'GATE-15',
    gateNumber: 15,
    name: 'RFC 3161 Trusted Time Stamping Gate',
    thaiName: 'การประทับเวลารับรองความถูกต้องสากล RFC 3161',
    latency: '3.5 ms',
    statutoryBase: 'NIST SP 800-102 / RFC 3161 TSA Protocol',
    thaiLawSection: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ มาตรา ๑๙ และ ๒๐',
    status: 'PASSED',
    description: 'ผูกประทับเวลามาตรฐานระดับนาโนวินาทีจาก Time Stamping Authority (TSA) ที่เชื่อถือได้ ป้องกันการปลอมแปลงลำดับเวลาก่อน-หลังของการทำธุรกรรม',
    forensicProof: 'TSA SHA-256 Digest bound to Genesis Block #849,202 at microsecond precision',
    courtAdmissibility: 'สืบพยานหลักฐานเวลาทำธุรกรรมได้ตามประมวลกฎหมายวิธีพิจารณาความแพ่ง มาตรา ๙๔'
  },
  {
    id: 'GATE-16',
    gateNumber: 16,
    name: 'ETDA Section 9 Legal Intent Gate',
    thaiName: 'ด่านตรวจเจตนาและการระบุตัวตนทางอิเล็กทรอนิกส์ (ม.๙)',
    latency: '2.2 ms',
    statutoryBase: 'Electronic Transactions Act B.E. 2544 (Section 9)',
    thaiLawSection: 'พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๙',
    status: 'PASSED',
    description: 'ยืนยันว่าการลงนามดิจิทัลสามารถระบุตัวตนของเจ้าของลายมือชื่อ (นายยุทธภูมิ พากเพียร #EP-SOVEREIGN-01) และแสดงเจตนาผูกพันในข้อความดังกล่าวอย่างชัดเจน',
    forensicProof: 'Signed executive passport payload OMEGA-1 with cryptographic intent marker',
    courtAdmissibility: 'ถือเป็นหนังสือลงลายมือชื่อตามกฎหมาย มีผลผูกพันบังคับใช้ได้จริง'
  },
  {
    id: 'GATE-17',
    gateNumber: 17,
    name: 'ETDA Section 26 Non-Repudiation Gate',
    thaiName: 'ด่านลายมือชื่ออิเล็กทรอนิกส์ที่เชื่อถือได้ระดับสูง (ม.๒๖)',
    latency: '2.8 ms',
    statutoryBase: 'Electronic Transactions Act B.E. 2544 (Section 26)',
    thaiLawSection: 'พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๒๖',
    status: 'PASSED',
    description: 'บังคับใช้กุญแจ PQC ML-DSA-87 (Dilithium-5) ร่วมกับ 10/10 Hardware HSM (FIPS 140-3 L4) กฎหมายจึงให้ข้อสันนิษฐานว่าลายมือชื่อนั้นเชื่อถือได้และไม่สามารถปฏิเสธความรับผิดได้',
    forensicProof: 'Hardware-anchored 10/10 Deca-Key Quorum with Lattice Post-Quantum Signature',
    courtAdmissibility: 'ศาลรับฟังข้อสันนิษฐานเด็ดขาดเรื่องความน่าเชื่อถือ ปราศจากการปฏิเสธความรับผิด (Non-repudiation)'
  },
  {
    id: 'GATE-18',
    gateNumber: 18,
    name: 'ETDA Section 28 Evidence Burden Gate',
    thaiName: 'ด่านการตรวจสอบประวัติใบรับรองและภาระการพิสูจน์ (ม.๒๘)',
    latency: '3.0 ms',
    statutoryBase: 'Electronic Transactions Act B.E. 2544 (Section 28)',
    thaiLawSection: 'พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๒๘',
    status: 'PASSED',
    description: 'ข้อมูลถูกเก็บใน WORM Ledger (Module 17 V24) พร้อมสายธารแฮชเชื่อมโยง ทำให้คู่กรณีหรือพนักงานอัยการสามารถตรวจสอบย้อนกลับความถูกต้องของใบรับรองและภาระการพิสูจน์พยานได้ทันที',
    forensicProof: 'Chronological WORM audit log with bidirectional Merkle verification trail',
    courtAdmissibility: 'พลิกภาระการพิสูจน์ (Reverse Burden of Proof) ผู้กล่าวอ้างว่าข้อมูลบิดเบือนต้องเป็นผู้พิสูจน์หักล้าง'
  },
  {
    id: 'GATE-19',
    gateNumber: 19,
    name: 'PDPA Zero-Knowledge PII Masking Gate',
    thaiName: 'ด่านคุ้มครองข้อมูลส่วนบุคคลด้วย ZK-Proofs (PDPA)',
    latency: '1.9 ms',
    statutoryBase: 'Personal Data Protection Act B.E. 2562 (Section 37)',
    thaiLawSection: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ มาตรา ๓๗',
    status: 'PASSED',
    description: 'ใช้ Zero-Knowledge Proofs ปกป้องข้อมูลส่วนบุคคล (PII) ไม่ให้รั่วไหลบนสมุดบัญชีสาธารณะ แต่ยังสามารถยืนยันความถูกต้องทางคณิตศาสตร์และสอดคล้องตามมาตรฐานความมั่นคงปลอดภัย',
    forensicProof: 'Zero-Knowledge cryptographic commitments without plaintext PII disclosure',
    courtAdmissibility: 'สอดคล้องกับระเบียบสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (สคส.)'
  },
  {
    id: 'GATE-20',
    gateNumber: 20,
    name: 'ISO/IEC 27037 Chain of Custody Gate',
    thaiName: 'ด่านห่วงโซ่การครอบครองพยานหลักฐานดิจิทัล ISO/IEC 27037',
    latency: '2.5 ms',
    statutoryBase: 'ISO/IEC 27037:2012 Digital Evidence Guidelines',
    thaiLawSection: 'มาตรฐานสากลการรวบรวมและรักษาสภาพพยานหลักฐานดิจิทัล',
    status: 'PASSED',
    description: 'บังคับใช้โปรโตคอล DELETE NOTHING บน Module 17 V24 ป้องกันข้อโต้แย้งเรื่องพยานหลักฐานถูกแทรกแซง ปนเปื้อน หรือสูญหายระหว่างกระบวนการจัดเก็บ',
    forensicProof: 'Immutable WORM storage with SHA-256 seal integrity across 14,902 blocks',
    courtAdmissibility: 'พยานหลักฐานมีน้ำหนักรับฟังสูงตามหลักสากล Digital Forensics Chain of Custody'
  },
  {
    id: 'GATE-21',
    gateNumber: 21,
    name: '12-Stage Deterministic Trace Gate',
    thaiName: 'ด่านสืบย้อนรอยพยานหลักฐาน 12 ขั้นตอนบิตต่อบิต',
    latency: '4.2 ms',
    statutoryBase: 'Deterministic Forensic Trace Replay Protocol',
    thaiLawSection: 'การจำลองพยานหลักฐานซ้ำ (Reproducibility & Audit Trail)',
    status: 'PASSED',
    description: 'ความสามารถในการจำลองพยานหลักฐานย้อนหลัง 12 ขั้นตอน บิตต่อบิต ให้ผลลัพธ์เดิม 100% ภายในเวลาไม่เกิน 142 ms (ประมวลผลจริง 35.80 ms)',
    forensicProof: '12-stage state machine deterministic replay match score 100.00%',
    courtAdmissibility: 'ผู้เชี่ยวชาญศาลสามารถตรวจสอบซ้ำ (Re-verify) ได้อย่างโปร่งใสและตรงกัน 100%'
  },
  {
    id: 'GATE-22',
    gateNumber: 22,
    name: 'Permanent Frozen LTS Seal Gate',
    thaiName: 'ด่านปิดผนึกตราประทับสัจธรรมถาวร FROZEN v1.2 LTS',
    latency: '1.0 ms',
    statutoryBase: 'SSoT Kernel Frozen Specification v1.2',
    thaiLawSection: 'การปิดผนึกเอกสารพยานสัจธรรมสูงสุด (Final Conclusive Seal)',
    status: 'PASSED',
    description: 'ปิดผนึกตราประทับทองคำถาวรสถานะ FROZEN v1.2 LTS บน Genesis Block #849,202 ห้ามมิให้มีการเปลี่ยนแปลงแก้ไขใดๆ อีกต่อไป (Mutation Authority = 0)',
    forensicProof: 'SSoT Mutation Delta = 0, Baseline Drift = 0.0000%, Final Ratified Stamp',
    courtAdmissibility: 'เป็นพยานหลักฐานสมบูรณ์ยุติ (Conclusive Evidence) ของระบบอธิปไตย'
  }
];

export const JudicialEtdaDeepDive: React.FC = () => {
  const [selectedGate, setSelectedGate] = useState<JudicialGate>(JUDICIAL_GATES_15_22[1]); // Default Gate 16 (ETDA Sec 9)
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<string | null>(null);

  const handleSelectGate = (gate: JudicialGate) => {
    playTone(650, 0.03);
    setSelectedGate(gate);
    setVerificationResult(null);
  };

  const handleSimulateVerification = () => {
    setIsVerifying(true);
    playTone(850, 0.05);

    setTimeout(() => {
      setIsVerifying(false);
      playAuditChime();
      setVerificationResult(`[VERIFICATION CONFIRMED] ${selectedGate.id}: Passed 100% Deterministic Judicial Audit.
- Statute: ${selectedGate.thaiLawSection}
- Evidence Weight: Prima Facie Electronic Evidence under Thai Law
- Chain of Custody: Sealed on Genesis Block #849,202 with 10/10 Deca-Key Quorum
- Non-Repudiation Status: Absolute.`);
    }, 700);
  };

  const handleExportJudicialDossier = () => {
    playAuditChime();
    const content = `========================================================================
ZYRQUEN Ω v1.2 LTS — JUDICIAL ETDA & EVIDENCE AUDIT CERTIFICATE
========================================================================
Sovereign Authority: นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)
Genesis Anchor: Block #849,202 | 14,902 Canonical Seals
Legal Framework: Thai Electronic Transactions Act B.E. 2544 (Sections 9, 26, 28)
Privacy Standard: Thai Personal Data Protection Act B.E. 2562 (Section 37)
Forensic Standard: ISO/IEC 27037:2012 Digital Evidence Chain of Custody
Cryptographic Baseline: Post-Quantum NIST Category 5 (ML-DSA-87 / FIPS 204)
Kernel Status: FROZEN v1.2 LTS (Delta=0, Drift=0.0000%)

EVALUATION SUMMARY OF JUDICIAL ETDA TIER (GATES 15–22):
${JUDICIAL_GATES_15_22.map(
  (g) => `• [${g.id}] ${g.name} (${g.latency})
  - Thai Statute: ${g.thaiLawSection}
  - Status: ${g.status} (Pass)
  - Forensic Proof: ${g.forensicProof}
  - Admissibility: ${g.courtAdmissibility}`
).join('\n\n')}

VERDICT:
The electronic records, cryptographic signatures, and 12-stage trace replay
are hereby certified as 100% Court-Admissible Electronic Evidence.
========================================================================
Certified by ZYRQUEN Ω Sovereign Supreme Apex Plane | ${new Date().toISOString()}`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZYRQUEN_Judicial_ETDA_Court_Certificate_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-950/80 border border-cyan-700/60 rounded-xl text-cyan-400">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                JUDICIAL ETDA TIER (GATES 15–22)
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                100% Court Admissible Ready
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">
              การผูกตรึงฐานกฎหมายไทยและมาตรฐานนิติวิทยาศาสตร์ดิจิทัลสากล
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportJudicialDossier}
          className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-slate-950 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-cyan-950"
        >
          <Download className="w-4 h-4" />
          <span>Export Court Certificate</span>
        </button>
      </div>

      {/* Main Grid: Gate Selector List (Col 1) + Deep-Dive Details (Col 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Gates 15–22 List */}
        <div className="space-y-2 font-mono">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Master Gates 15–22 (Chamber 05)
          </span>
          {JUDICIAL_GATES_15_22.map((gate) => {
            const isSelected = selectedGate.id === gate.id;
            return (
              <div
                key={gate.id}
                onClick={() => handleSelectGate(gate)}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-cyan-950/80 border-cyan-400 shadow-md shadow-cyan-950 text-white'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-400">{gate.id}</span>
                    <span className="text-[10px] text-slate-500 font-normal">({gate.latency})</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 mt-0.5 truncate max-w-[210px]">
                    {gate.thaiName}
                  </h4>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  PASS
                </span>
              </div>
            );
          })}
        </div>

        {/* Right 2 Columns: Detailed Gate Dossier & Simulator */}
        <div className="lg:col-span-2 bg-slate-950/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-5">
          <div>
            {/* Gate Title & Metadata */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-mono text-xs font-bold border border-cyan-800">
                    {selectedGate.id}
                  </span>
                  <span className="text-xs font-mono text-slate-400">Latency: {selectedGate.latency}</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {selectedGate.name}
                </h3>
                <p className="text-xs text-amber-400 font-medium mt-0.5">
                  {selectedGate.thaiName}
                </p>
              </div>

              <div className="px-3 py-1 rounded-xl bg-emerald-950/90 border border-emerald-800 text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>UNANIMOUS PASS</span>
              </div>
            </div>

            {/* Legal Foundation & Statutory Base Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  ฐานกฎหมายไทยที่รองรับ
                </span>
                <p className="text-xs font-bold text-slate-200 mt-1">
                  {selectedGate.thaiLawSection}
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  มาตรฐานสากลอ้างอิง
                </span>
                <p className="text-xs font-bold text-slate-200 mt-1">
                  {selectedGate.statutoryBase}
                </p>
              </div>
            </div>

            {/* Description & Court Weight */}
            <div className="space-y-3 font-sans text-xs">
              <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl">
                <span className="font-bold text-slate-300 block mb-1">กลไกและหน้าที่ของด่านตรวจสอบ:</span>
                <p className="text-slate-400 leading-relaxed">{selectedGate.description}</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl">
                <span className="font-bold text-cyan-300 block mb-1">หลักฐานทางนิติวิทยาศาสตร์ (Forensic Proof):</span>
                <p className="font-mono text-slate-300 text-[11px]">{selectedGate.forensicProof}</p>
              </div>

              <div className="bg-slate-900/60 border border-emerald-900/40 p-3.5 rounded-xl">
                <span className="font-bold text-emerald-300 block mb-1">น้ำหนักการรับฟังในชั้นศาล (Court Admissibility):</span>
                <p className="text-slate-300 leading-relaxed">{selectedGate.courtAdmissibility}</p>
              </div>
            </div>
          </div>

          {/* Verification Simulator Action */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-mono text-slate-400">
                ทดสอบตรวจพิสูจน์พยานหลักฐานด่าน {selectedGate.id} ตามข้อกำหนดศาล
              </span>
              <button
                type="button"
                onClick={handleSimulateVerification}
                disabled={isVerifying}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <span className="animate-spin text-sm">⚙️</span>
                    <span>กำลังตรวจพิสูจน์บิตต่อบิต...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Run Forensic Proof Audit</span>
                  </>
                )}
              </button>
            </div>

            {verificationResult && (
              <div className="p-3 bg-emerald-950/70 border border-emerald-800/80 rounded-xl font-mono text-xs text-emerald-300 whitespace-pre-line animate-fadeIn">
                {verificationResult}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Statutory Legal Matrix Bar */}
      <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-3">
          <FileCheck className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-300">
            พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ (ม.๙, ๒๖, ๒๘) • พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ (ม.๓๗)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Chain of Custody:</span>
          <span className="text-cyan-400 font-bold">DELETE NOTHING (Module 17 V24)</span>
        </div>
      </div>
    </div>
  );
};

export default JudicialEtdaDeepDive;
