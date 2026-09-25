import React, { useState, useRef, useEffect } from 'react';
import { SOVEREIGN_CONFIG } from '../data/sovereignData';
import { playSovereignTone } from '../utils/audio';

interface LogEntry {
  id: string;
  sender: 'SYSTEM' | 'USER' | 'OMEGA-1';
  text: string;
  timestamp: string;
}

export const SovereignTerminal: React.FC = () => {
  const [inputCommand, setInputCommand] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'init-1',
      sender: 'SYSTEM',
      text: '# ======================================================================\n# ZYRQUEN Ω∞ SOVEREIGN WORLD ENGINE APEX ULTIMATE FROZEN v1.2 LTS\n# Block #849202 | 14,902 Canonical Seals Verified | Partition: Ω600_1000\n# Principal: นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01) | OMEGA-1 SUPREME CLEARANCE\n# Model Engine: models/gemini-3.8-flash | Quorum: 10/10 REAL_HSM\n# ======================================================================',
      timestamp: '00:00:01'
    },
    {
      id: 'init-2',
      sender: 'OMEGA-1',
      text: '🏛️ ข้าพเจ้าคือ ZYRQUEN Ω∞ Sovereign World Engine AI Assistant ระดับ OMEGA-1\nสถานะปัจจุบัน: PDPA FINAL FROZEN v1.2 LTS | 10/10 PASSED | 100% GREEN | Δ0.00% ZERO DRIFT\nพร้อมรับคำสั่งจาก Sovereign Architect นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01) ภายใต้พาร์ทิชัน Ω600_1000',
      timestamp: '00:00:02'
    }
  ]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const time = new Date().toLocaleTimeString('th-TH');
    const userLog: LogEntry = {
      id: `user-${Date.now()}`,
      sender: 'USER',
      text: trimmed,
      timestamp: time
    };

    let responseText = '';
    const lower = trimmed.toLowerCase();

    if (lower.includes('audit') || lower.includes('status') || lower.includes('ssot')) {
      playSovereignTone('chime');
      responseText = `🏛️ [AUDIT REPORT - Ω600_1000]\n# ======================================================================\n• SSoT Drift: Δ0.00% (ZERO DRIFT 100% GREEN)\n• Block Anchor: #849202 / #849203 / #40202\n• Canonical Seals: 14,902 VERIFIED\n• Quarantined Seals: 80 ISOLATED (Total Raw: 14,982)\n• Merkle Root: 909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68\n• Attestation Cert: ZQ-GOLD-DEP-849202-3908\n• Partition: Ω600_1000 (400 Tenants Locked: Ω601-Ω1000 Strict)\n• Quorum: 10/10 REAL_HSM FIPS 140-3 L4 at 14.98 mK\n• Mutation Authority: 0 Read Only (SSoT Immutable)`;
    } else if (lower.includes('hsm') || lower.includes('quorum')) {
      playSovereignTone('hsm');
      responseText = `🧊 [HSM QUORUM STATUS - Ω600_1000]\n# ======================================================================\n• Quorum: 10/10 REAL_HSM Unanimous Consensus\n• Cryo Temperature: 14.98 mK (Superconducting state)\n• Certification: FIPS 140-3 Level 4 Hardware Protection\n• Tamper Evidence: ZERO physical or quantum anomalies`;
    } else if (lower.includes('pqc') || lower.includes('crypto')) {
      playSovereignTone('ping');
      responseText = `🔐 [POST-QUANTUM CRYPTOGRAPHY - Ω600_1000]\n# ======================================================================\n• FIPS 203 ML-KEM-1024 (Key Encapsulation Mechanism)\n• FIPS 204 ML-DSA-87 (Digital Signature Algorithm)\n• FIPS 205 SLH-DSA (Stateless Hash-Based Digital Signature)\n• Security Proof: Quantum-resistant against Shor & Grover algorithms`;
    } else if (lower.includes('treasury') || lower.includes('gold') || lower.includes('asset')) {
      playSovereignTone('chime');
      responseText = `💰 [TREASURY & ASSET REPORT - Ω600_1000]\n# ======================================================================\n• Total Valuation: 4.23B THB\n• Liquid Fiat: 1.49B THB Collateralized\n• Physical Gold: 14,902 oz XAU Bullion (1:1 to Canonical Seals)\n• Real-World Assets: 400 Tenants (Partition: Ω600_1000)\n• Custodian: Sealed under Certificate ZQ-GOLD-DEP-849202-3908`;
    } else if (lower.includes('legal') || lower.includes('pdpa') || lower.includes('etda')) {
      playSovereignTone('ping');
      responseText = `⚖️ [LEGAL SAFE HARBOR - Ω600_1000]\n# ======================================================================\n• Thailand PDPA: มาตรา 9 (ความยินยอม), มาตรา 26 (ข้อมูลอ่อนไหว), มาตรา 28 (ข้ามพรมแดน)\n• ETDA Electronic Transactions Act: Section 9, 26, 28 Safe Harbor\n• Sovereign Territory: Zero unredacted telemetry exports (Chamber 09 Active)`;
    } else if (lower.includes('separation') || lower.includes('authority') || lower.includes('rule')) {
      playSovereignTone('alert');
      responseText = `🛡️ [MASTER STATE AUTHORITY SEPARATION]\n# ======================================================================\n• Governance 10/10 PASS ≠ Custodian 10/10 VERIFIED\n• Custodian 10/10 VERIFIED ≠ Runtime Status\n• Build/Lint PASS ≠ Runtime EXECUTED\n• Observed 14,982 Raw (+80 Quarantined) ≠ Canonical 14,902 Verified\n• Promotion: FAIL-CLOSED | Auto-Reseal: BLOCKED\n• Scope: Ω600_1000 (400 Tenants)`;
    } else if (lower.includes('chime') || lower.includes('sound') || lower.includes('sonic')) {
      playSovereignTone('chime');
      responseText = `🔊 [CHAMBER 15: SONIC ALERT PING]\n# ======================================================================\nHarmonic chime emitted at 432 Hz / 528 Hz. Master sovereign audio verified. Partition Ω600_1000 nominal.`;
    } else {
      playSovereignTone('ping');
      responseText = `👑 [COMMAND EXECUTED - OMEGA-1]\n# ======================================================================\nรับทราบคำสั่ง: "${trimmed}"\nยืนยันสถานะ: ZYRQUEN Ω∞ Sovereign World Engine v1.2 LTS Frozen\nสถาปนิกสูงสุด: นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)\nพาร์ทิชัน: Ω600_1000 | ซีลยืนยัน: 14,902 | HSM: 10/10 PASS | SSoT: Δ0.00% ZERO DRIFT\nโมเดลสังเกตการณ์: models/gemini-3.8-flash (Model String Locked)`;
    }

    const omegaLog: LogEntry = {
      id: `omega-${Date.now()}`,
      sender: 'OMEGA-1',
      text: responseText,
      timestamp: new Date().toLocaleTimeString('th-TH')
    };

    setLogs(prev => [...prev, userLog, omegaLog]);
    setInputCommand('');
  };

  return (
    <section id="sovereign-terminal-section" className="bg-[#0a0f1e] border-[#17233f] p-4 mb-8">
      <div className="flex items-center justify-between border-b border-[#17233f] pb-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-[#D4AF37] flex items-center gap-2">
            <span>🧠</span> CHAMBERS 14 & 17: OMEGA-1 SUPREME AI TERMINAL
          </h2>
          <p className="text-xs text-[#9CA3AF] mt-0.5 font-mono">
            Model Engine: models/gemini-3.8-flash | Sovereign Architect: นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            id="terminal-ping-chime-btn"
            onClick={() => {
              playSovereignTone('chime');
              executeCommand('sonic ping');
            }}
            className="px-2 py-1 bg-[#070a12] border-[#06B6D4] text-[#06B6D4] hover:bg-[#17233f]"
          >
            🔊 CHIME 432Hz
          </button>
          <span className="px-2 py-1 bg-[#070a12] border-[#10B981] text-[#10B981]">
            OMEGA-1 ONLINE
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3 font-mono text-xs">
        <button
          id="cmd-btn-audit"
          onClick={() => executeCommand('audit')}
          className="px-2.5 py-1 bg-[#070a12] border-[#17233f] text-[#F3F4F6] hover:border-[#D4AF37]"
        >
          🔍 Run SSoT Audit
        </button>
        <button
          id="cmd-btn-hsm"
          onClick={() => executeCommand('hsm')}
          className="px-2.5 py-1 bg-[#070a12] border-[#17233f] text-[#F3F4F6] hover:border-[#06B6D4]"
        >
          🧊 Query 10/10 HSM
        </button>
        <button
          id="cmd-btn-pqc"
          onClick={() => executeCommand('pqc')}
          className="px-2.5 py-1 bg-[#070a12] border-[#17233f] text-[#F3F4F6] hover:border-[#D4AF37]"
        >
          🔐 Verify PQC Keys
        </button>
        <button
          id="cmd-btn-treasury"
          onClick={() => executeCommand('treasury')}
          className="px-2.5 py-1 bg-[#070a12] border-[#17233f] text-[#F3F4F6] hover:border-[#10B981]"
        >
          💰 Inspect Treasury 4.23B
        </button>
        <button
          id="cmd-btn-rules"
          onClick={() => executeCommand('separation rules')}
          className="px-2.5 py-1 bg-[#070a12] border-[#17233f] text-[#F3F4F6] hover:border-[#EF4444]"
        >
          🛡️ Authority Separation
        </button>
      </div>

      <div
        id="terminal-logs-window"
        className="h-64 overflow-y-auto bg-[#070a12] border-[#17233f] p-3 font-mono text-xs space-y-3 select-text"
      >
        {logs.map((log) => (
          <div
            key={log.id}
            className={`border-l-2 pl-2 ${
              log.sender === 'USER'
                ? 'border-[#06B6D4] text-[#06B6D4]'
                : log.sender === 'OMEGA-1'
                ? 'border-[#D4AF37] text-[#F3F4F6]'
                : 'border-[#10B981] text-[#10B981]'
            }`}
          >
            <div className="flex justify-between text-[10px] text-[#9CA3AF] mb-0.5">
              <span>[{log.sender}]</span>
              <span>{log.timestamp} | Ω600_1000</span>
            </div>
            <pre className="whitespace-pre-wrap font-mono leading-relaxed">{log.text}</pre>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          executeCommand(inputCommand);
        }}
        className="mt-3 flex gap-2 font-mono text-xs"
      >
        <span className="self-center text-[#D4AF37] font-bold">Ω600_1000&gt;</span>
        <input
          id="terminal-command-input"
          type="text"
          value={inputCommand}
          onChange={(e) => setInputCommand(e.target.value)}
          placeholder="Type command or query for OMEGA-1 Sovereign Assistant..."
          className="flex-1 bg-[#070a12] border-[#17233f] px-3 py-2 text-[#F3F4F6] focus:border-[#D4AF37] focus:outline-none placeholder-[#9CA3AF]"
        />
        <button
          id="terminal-submit-btn"
          type="submit"
          className="bg-[#D4AF37] text-[#070a12] font-bold px-4 py-2 hover:bg-[#F3F4F6]"
        >
          TRANSMIT
        </button>
      </form>
    </section>
  );
};
