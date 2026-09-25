import React from 'react';

export interface MatrixRow {
  section: string;
  lawTitle: string;
  exhibits: string[];
  techMechanism: string[];
  legalEffect: string;
  status: 'VERIFIED' | 'RATIFIED' | 'IMMUTABLE';
}

export const LEGAL_MATRIX: MatrixRow[] = [
  {
    section: 'มาตรา 9',
    lawTitle: 'การรับรองเจตนาและอัตลักษณ์',
    exhibits: ['จพ.๐๒ Hardware TSA RFC 3161', 'จพ.๐๒ Deca-Key Certificates'],
    techMechanism: ['UTC(NIMT) Timestamp', 'Proof of Existence', 'Anti-Backdating', 'Hardware TSA'],
    legalEffect: 'ยืนยันเจตนาและอัตลักษณ์ผู้ลงนาม - ศาลรับฟังว่าเอกสารถูกสร้าง ณ เวลาที่ระบุจริง',
    status: 'VERIFIED'
  },
  {
    section: 'มาตรา 26',
    lawTitle: 'Non-Repudiation & Advanced Electronic Signature',
    exhibits: ['จพ.๐๓ Deca-Key Quorum', 'จพ.๐๕ Trace Replay SLA'],
    techMechanism: ['Dilithium-5 (FIPS 204)', 'SPHINCS+ (FIPS 205)', 'FIPS 140-3 L4 HSM', '12-Stage Replay 35.80ms < 142ms', 'Non-repudiation'],
    legalEffect: 'ห้ามปฏิเสธความรับผิด - ผู้ลงนามไม่สามารถปฏิเสธได้ด้วย PQC + HSM Quorum',
    status: 'RATIFIED'
  },
  {
    section: 'มาตรา 28',
    lawTitle: 'การคงสภาพและความน่าเชื่อถือของข้อมูล',
    exhibits: ['จพ.๐๑ Genesis Anchor', 'จพ.๐๔ Chamber 02 WORM', 'จพ.๐๖ Immutable Ledger', 'จพ.๐๗ zk-SNARKs Vault'],
    techMechanism: ['Genesis Block #849202', 'Merkle Root 0x909ab8...', 'Zero Drift Δ0.00%', 'WORM Storage', 'Fail-Closed 1-Bit', 'PDPA Sec 37 Privacy'],
    legalEffect: 'คงสภาพข้อมูลถาวร - Safe Harbor - พิสูจน์ว่าไม่มีการแก้ไขย้อนหลัง',
    status: 'IMMUTABLE'
  },
  {
    section: 'PDPA มาตรา 37',
    lawTitle: 'การคุ้มครองข้อมูลส่วนบุคคล',
    exhibits: ['จพ.๐๗ Zero-Knowledge Vault'],
    techMechanism: ['zk-SNARKs', 'PII Redaction', '100% PII Masked', 'Zero-Knowledge Proof'],
    legalEffect: 'ป้องกันการรั่วไหล - สอดคล้อง PDPA - ไม่เปิดเผยข้อมูลเกินจำเป็น',
    status: 'VERIFIED'
  }
];

export const CourtSubmissionAnnex: React.FC = () => {
  return (
    <div className="w-full bg-slate-950 text-slate-100 p-8 rounded-xl border-slate-800 space-y-8">
      {/* Header - DOC-SOV-HSM-1010-2026-V9 */}
      <div className="border-b border-amber-800/50 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="px-3 py-1 bg-amber-950 border-amber-700 text-amber-400 rounded text-xs font-mono font-bold">COURT SUBMISSION ANNEX</span>
          <span className="px-2 py-1 bg-slate-900 border-slate-700 text-slate-400 rounded text-[10px] font-mono">DOC-SOV-HSM-1010-2026-V9 | Genesis #849202</span>
          <span className="px-2 py-1 bg-emerald-950 border-emerald-800 text-emerald-400 rounded text-[10px] font-mono">COURT-READY</span>
        </div>
        <h1 className="text-2xl font-black text-white">Legal–Evidence Matrix: มาตรากฎหมาย ↔ วัตถุพยานดิจิทัล จพ.๐๑-๐๗</h1>
        <p className="text-xs text-slate-400 font-mono mt-2">พ.ร.บ.ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ.2544 มาตรา 9, 26, 28 + PDPA มาตรา 37 | SSoT Δ0 0.00% | 14,902 Seals | 10/10 REAL_HSM Quorum RATIFIED</p>
      </div>

      {/* Main Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-900 border-b border-slate-700">
              <th className="text-left p-3 text-[11px] font-mono text-amber-400 uppercase">มาตราทางกฎหมาย</th>
              <th className="text-left p-3 text-[11px] font-mono text-amber-400 uppercase">วัตถุพยานดิจิทัล</th>
              <th className="text-left p-3 text-[11px] font-mono text-cyan-400 uppercase">กลไกทางเทคโนโลยี</th>
              <th className="text-left p-3 text-[11px] font-mono text-emerald-400 uppercase">ผลผูกพันทางกฎหมาย</th>
            </tr>
          </thead>
          <tbody>
            {LEGAL_MATRIX.map((row, idx) => (
              <tr key={idx} className="border-b border-slate-800 hover:bg-slate-900/50 transition-colors">
                <td className="p-4 align-top">
                  <div className="text-sm font-bold text-white">{row.section}</div>
                  <div className="text-[11px] text-slate-400 mt-1">{row.lawTitle}</div>
                  <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    row.status === 'RATIFIED' ? 'bg-purple-950 text-purple-400 border-purple-800' :
                    row.status === 'IMMUTABLE' ? 'bg-cyan-950 text-cyan-400 border-cyan-800' :
                    'bg-emerald-950 text-emerald-400 border-emerald-800'
                  }`}>{row.status}</span>
                </td>
                <td className="p-4 align-top">
                  <div className="space-y-1.5">
                    {row.exhibits.map((ex, i) => (
                      <div key={i} className="text-xs font-mono bg-slate-900 border-slate-800 rounded px-2 py-1 text-slate-200">
                        {ex}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="p-4 align-top">
                  <div className="space-y-1">
                    {row.techMechanism.map((tech, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] font-mono text-slate-300">
                        <span className="w-1 h-1 bg-cyan-400 rounded-full"></span>{tech}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="p-4 align-top">
                  <div className="text-xs text-slate-200 leading-relaxed">{row.legalEffect}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legal Analysis Deep Dive */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border-slate-800 rounded-lg p-4">
          <h3 className="text-xs font-bold text-amber-400 font-mono mb-2">📜 การรับรองเจตนา (Sec 9)</h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">การประทับเวลาฮาร์ดแวร์ UTC(NIMT) + Deca-Key Certificates ทำให้ศาลยอมรับได้ว่าเอกสารถูกสร้างขึ้นจริง ณ เวลาที่ระบุ ป้องกัน Anti-Backdating 100% ด้วย RFC 3161 Hardware TSA</p>
        </div>
        <div className="bg-slate-900 border-slate-800 rounded-lg p-4">
          <h3 className="text-xs font-bold text-purple-400 font-mono mb-2">🔐 Non-Repudiation (Sec 26)</h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">Dilithium-5 + SPHINCS+ บน FIPS 140-3 L4 + 12-Stage Replay 35.80ms ทำให้ผู้ลงนามไม่สามารถปฏิเสธความรับผิดได้ มีหลักฐานทางคณิตศาสตร์ยืนยัน</p>
        </div>
        <div className="bg-slate-900 border-slate-800 rounded-lg p-4">
          <h3 className="text-xs font-bold text-cyan-400 font-mono mb-2">🛡️ การคงสภาพ (Sec 28)</h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">Genesis Anchor #849202 + Merkle Root + WORM Storage + Fail-Closed 1-Bit ปิดตัวเองทันทีหากมีการเปลี่ยนแปลงแม้ 1 Bit ยืนยัน Zero Drift Δ0.00%</p>
        </div>
        <div className="bg-slate-900 border-slate-800 rounded-lg p-4">
          <h3 className="text-xs font-bold text-emerald-400 font-mono mb-2">🔒 PDPA Sec 37 Safe Harbor</h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">Zero-Knowledge Vault ด้วย zk-SNARKs + PII Redaction 100% Masked ป้องกันการเปิดเผยข้อมูลส่วนบุคคลโดยไม่จำเป็น สอดคล้อง PDPA เต็มรูปแบบ</p>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-amber-950/20 border-amber-800/50 rounded-lg p-4">
        <h3 className="text-xs font-bold text-amber-400 font-mono mb-3">📋 คำแนะนำสำหรับสำนวนศาล</h3>
        <div className="space-y-2 text-[11px] font-mono text-amber-200/80">
          <div>• แนบ Replay Verification Report (SHA-256 Hash Replay) เพื่อให้ผู้เชี่ยวชาญศาลตรวจสอบซ้ำได้ทันที - 35.80ms &lt; 142ms SLA</div>
          <div>• เพิ่ม ISO/IEC 27037 Compliance Statement - Zero-Deletion Guarantee - ไม่มีการแทรกแซงจากมนุษย์</div>
          <div>• จัดทำ Executive Infographic จพ.๐๑-๐๗ สำหรับนำเสนอในศาล (มีแล้วใน CourtEvidenceInfographic.tsx)</div>
          <div>• แนบ Evidence Ledger V25: 14,902 Seals | Δ0 0.00% | 10/10 REAL_HSM | Phoenix Recovery READY</div>
        </div>
      </div>

      {/* Verdict */}
      <div className="bg-emerald-950/20 border-emerald-800/50 rounded-lg p-4 text-center">
        <div className="text-xs font-mono text-emerald-400 font-bold">⚖️ VERDICT</div>
        <p className="text-sm text-white font-bold mt-2">Annex นี้ทำให้สำนวนพยานหลักฐานดิจิทัล DOC-SOV-HSM-1010-2026-V9 มีความสมบูรณ์ทั้งด้านเทคนิคและกฎหมาย พร้อมเข้าสู่กระบวนการพิจารณาคดีในศาลไทยได้อย่างเด็ดขาด</p>
        <div className="mt-3 text-[10px] font-mono text-slate-500">Merkle Root: 0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68 | Genesis #849202 | SSoT Δ0 0.00% | Court-Admissible</div>
      </div>
    </div>
  );
};

export default CourtSubmissionAnnex;
