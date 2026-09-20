import React, { useState, useEffect } from 'react';
import { Search, Shield, Bot, Terminal, Download, Lock, RefreshCw, X, FileText, Database, ShieldCheck } from 'lucide-react';

interface CommandPaletteProps {
  onSelectAction?: (actionId: string) => void;
}

export const ExecutiveCommandPalette: React.FC<CommandPaletteProps> = ({ onSelectAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  // Keyboard shortcut listener (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const commands = [
    { id: 'forensic-dossier', label: 'เปิดสำนวนพยานหลักฐานดิจิทัล DOC-SOV-HSM-1010-2026-V9 (Court Master)', icon: ShieldCheck, category: 'Audit & Legal' },
    { id: 'snapshot', label: 'ดาวน์โหลด Signed Snapshot (FIPS 204)', icon: Download, category: 'Audit & Legal' },
    { id: 'pqc-verify', label: 'ตรวจสอบ PQC Dilithium-5 / Kyber Key Spec', icon: Shield, category: 'Security' },
    { id: 'lockdown', label: 'เปิดใช้งาน Emergency Air-Gap Isolation Protocol', icon: Lock, category: 'Emergency' },
    { id: 'legal-pdf', label: 'ส่งออก Legal Trigger Matrix เป็นเอกสาร PDF', icon: FileText, category: 'Legal Corpus' },
    { id: 'render-sphere', label: 'สลับ UI Renderer เป็น SPHERE Mode', icon: RefreshCw, category: '3D Continuum' },
    { id: 'copilot-trigger', label: 'เรียกใช้ Copilot Sovereign AI Reflex', icon: Bot, category: 'AI Autonomy' },
    { id: 'view-seals', label: 'เปิดดูทะเบียน 14,902 Active Evidence Seals', icon: Database, category: 'Storage & Ledger' },
  ];

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.category.toLowerCase().includes(query.toLowerCase()) ||
      cmd.id.toLowerCase().includes(query.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 bg-slate-950/80 backdrop-blur-xl font-mono text-slate-100 p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-950/50">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="พิมพ์คำสั่งเพื่อค้นหา (เช่น Snapshot, PQC, Lock, Render, Legal)..."
            className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 outline-none"
            autoFocus
          />
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 hidden sm:inline">
            ESC
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={() => {
                    if (onSelectAction) onSelectAction(cmd.id);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30 transition text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-cyan-500/20 text-cyan-400 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 truncate">
                        {cmd.label}
                      </div>
                      <div className="text-[10px] text-slate-500">{cmd.category}</div>
                    </div>
                  </div>
                  <Terminal className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 shrink-0 ml-2" />
                </button>
              );
            })
          ) : (
            <div className="p-6 text-center text-xs text-slate-500">
              ไม่พบคำสั่งที่ตรงกับการค้นหา "{query}"
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800/80 text-[10px] text-slate-500 flex justify-between items-center">
          <span>ZYRQUEN Ω Sovereign Launcher</span>
          <span>
            Shortcut: <kbd className="text-cyan-400 font-bold">⌘K</kbd> /{' '}
            <kbd className="text-cyan-400 font-bold">Ctrl+K</kbd>
          </span>
        </div>
      </div>
    </div>
  );
};
