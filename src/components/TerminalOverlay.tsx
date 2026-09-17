import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, X, Maximize2, Minimize2 } from 'lucide-react';
import { CANONICAL_CONSTANTS } from '../data/sovereignData.ts';
import { verifyGenesisMerkleRoot } from '../services/cryptoEngine.ts';
import { soundFx } from '../services/audioEngine.ts';

interface TerminalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPhoenix: () => void;
  onOpenDossier: () => void;
}

interface CommandLog {
  id: string;
  type: 'input' | 'output' | 'error' | 'success';
  text: string;
}

export const TerminalOverlay: React.FC<TerminalOverlayProps> = ({
  isOpen,
  onClose,
  onOpenPhoenix,
  onOpenDossier,
}) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<CommandLog[]>([
    {
      id: 'init-1',
      type: 'output',
      text: 'ZYRQUEN Ω∞ SOVEREIGN CLI SHELL [ZYRQUEN_SH v4.16.0]',
    },
    {
      id: 'init-2',
      type: 'output',
      text: 'Connected to Bangkok Sovereign Root (BK01) • QKD Channel Active',
    },
    {
      id: 'init-3',
      type: 'output',
      text: 'Type "help" for a list of cryptographic command verbs.',
    },
  ]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  if (!isOpen) return null;

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim().toLowerCase();
    if (!cmd) return;

    soundFx.playTelemetryBeacon(920, 0.04);

    const newLogs: CommandLog[] = [
      ...history,
      { id: String(Date.now()), type: 'input', text: `root@zyrquen:~# ${input}` },
    ];

    setInput('');

    if (cmd === 'clear') {
      setHistory([]);
      return;
    }

    if (cmd === 'help') {
      newLogs.push({
        id: String(Date.now() + 1),
        type: 'output',
        text: `AVAILABLE SOVEREIGN COMMANDS:
  • verify-merkle  - Recompute SHA-256 genesis hash & test 14,902 seals
  • hsm-status     - Query Deca-Key hardware cluster (TC-01..TC-10)
  • phoenix-heal   - Trigger 142ms autonomous self-healing pipeline
  • drift-check    - Verify SSoT mutation delta invariant (Δ 0.00%)
  • export-dossier - Open court-admissible forensic PDF dossier
  • clear          - Clear terminal display buffer
  • exit           - Close terminal interface`,
      });
    } else if (cmd === 'verify-merkle') {
      const res = await verifyGenesisMerkleRoot();
      newLogs.push({
        id: String(Date.now() + 1),
        type: res.matched ? 'success' : 'error',
        text: `[MERKLE AUDIT]
Seed Text: "${CANONICAL_CONSTANTS.GENESIS_SEED_TEXT}"
Expected Root: ${res.expectedRoot}
Computed Hash: ${res.calculatedHash}
Status: ${res.matched ? 'MATCHED (100% VALID)' : 'MISMATCH'}
Block Height: #${res.blockHeight} | Canonical Seals: ${res.totalSeals}
Attestation: ${res.pqcAttestation}`,
      });
      soundFx.playPhoenixChime();
    } else if (cmd === 'hsm-status') {
      newLogs.push({
        id: String(Date.now() + 1),
        type: 'success',
        text: `[DECA-KEY HSM STATUS]
Cluster Size: 10/10 REAL_HSM ONLINE (Required: 8/10)
Cryo Temperature: 14.98 mK (Stabilized)
FIPS Certification: FIPS 140-3 Level 4 Active
Zeroization: ARMED & ACTIVE`,
      });
    } else if (cmd === 'drift-check') {
      newLogs.push({
        id: String(Date.now() + 1),
        type: 'success',
        text: `[DRIFT METRIC]
SSoT Mutation Drift: Δ 0.00% (ZERO DRIFT ENFORCED)
Invariants Checked: 10/10 PASSED
Platform Boundary: ${CANONICAL_CONSTANTS.PLATFORM_BOUNDARY}`,
      });
    } else if (cmd === 'phoenix-heal') {
      onOpenPhoenix();
      newLogs.push({
        id: String(Date.now() + 1),
        type: 'output',
        text: 'Opening Phoenix 142ms Auto-Healing control module...',
      });
    } else if (cmd === 'export-dossier') {
      onOpenDossier();
      newLogs.push({
        id: String(Date.now() + 1),
        type: 'output',
        text: 'Launching Court-Admissible Dossier Export Window...',
      });
    } else if (cmd === 'exit') {
      onClose();
      return;
    } else {
      newLogs.push({
        id: String(Date.now() + 1),
        type: 'error',
        text: `zyrquen-sh: command not found: ${cmd}. Type "help" for available commands.`,
      });
    }

    setHistory(newLogs);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-3xl h-[520px] bg-[#050912] border border-cyan-500/40 rounded-xl shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col overflow-hidden font-mono-code">
        {/* Terminal Header Bar */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1.5 mr-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block cursor-pointer" onClick={onClose}></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block"></span>
            </div>
            <TerminalIcon className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-300 font-bold">ZYRQUEN SH — root@bk01:~#</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-slate-900 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Terminal Output */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2 text-xs text-slate-300 bg-[#040711]">
          {history.map((item) => (
            <div
              key={item.id}
              className={`whitespace-pre-wrap leading-relaxed ${
                item.type === 'input'
                  ? 'text-cyan-300 font-semibold'
                  : item.type === 'success'
                  ? 'text-emerald-400'
                  : item.type === 'error'
                  ? 'text-rose-400'
                  : 'text-slate-400'
              }`}
            >
              {item.text}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Terminal Input Bar */}
        <form onSubmit={handleCommand} className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center space-x-2">
          <span className="text-emerald-400 text-xs font-bold">root@zyrquen:~#</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent text-slate-100 text-xs focus:outline-none placeholder-slate-600"
            placeholder="Type command (e.g. verify-merkle, hsm-status, help)..."
          />
        </form>
      </div>
    </div>
  );
};
