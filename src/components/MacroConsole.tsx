import React, { useState, useEffect } from 'react';
import {
  Play,
  Square,
  Circle,
  Plus,
  Trash2,
  Save,
  Terminal,
  Code,
  Sparkles,
  CheckCircle2,
  Clock,
  RotateCcw,
  Layers,
  FileCode,
} from 'lucide-react';
import { playAuditChime, playTone, playWarningTone } from './AudioSynthesizer';

export interface MacroScript {
  id: string;
  name: string;
  description: string;
  category: 'MAINTENANCE' | 'SECURITY' | 'QUANTUM' | 'AUDIT';
  commands: string[];
  lastRun?: string;
  durationMs: number;
}

const PRESET_MACROS: MacroScript[] = [
  {
    id: 'macro-1',
    name: 'Full Subzero Cryo & Merkle Audit',
    description: 'Calibrates dilution cooling, captures instantaneous telemetry snapshot, and verifies Merkle root integrity.',
    category: 'MAINTENANCE',
    commands: ['pentest', 'audit', 'snapshot', 'seals'],
    durationMs: 1420,
  },
  {
    id: 'macro-2',
    name: 'Zero-Trust Reconcile & Invariant Gatekeeper',
    description: 'Executes tri-agent invariant validation, audits 14,902 cryptographic seals, and checks Thai custodian signatures.',
    category: 'SECURITY',
    commands: ['reconcile', 'cert', 'thai-custodians', 'trace'],
    durationMs: 1850,
  },
  {
    id: 'macro-3',
    name: 'High-Throughput Quantum Benchmark & Evidence Seal',
    description: 'Benchmarks 768-qubit QOps throughput, triggers auto-snapshot high load check, and dumps forensic JSON.',
    category: 'QUANTUM',
    commands: ['benchmark', 'snapshot', 'export-json'],
    durationMs: 1200,
  },
  {
    id: 'macro-4',
    name: 'Phase 13: Civilization Self-Evolution & Federation Sync',
    description: 'Executes Civilization Self-Evolution v13 (EVO-CIV-13), performs Merkle-root verification handshake, and audits cross-node knowledge drift.',
    category: 'AUDIT',
    commands: ['evolve', 'sync-ledger', 'fed-drift'],
    durationMs: 1600,
  },
  {
    id: 'macro-5',
    name: 'Phase 14: Sovereign Vault Expansion & Governance Fabric',
    description: 'Expands Sovereign Vault to 1,024 TB (FIPS 203 ML-KEM-1024), activates 128 Auditor Agents, and enforces invariant truth boundary laws.',
    category: 'SECURITY',
    commands: ['vault-expand', 'governance', 'seals'],
    durationMs: 1750,
  },
];

interface MacroConsoleProps {
  onExecuteCommand: (command: string) => void;
}

export const MacroConsole: React.FC<MacroConsoleProps> = ({ onExecuteCommand }) => {
  const [macros, setMacros] = useState<MacroScript[]>(PRESET_MACROS);
  const [selectedMacroId, setSelectedMacroId] = useState<string>(PRESET_MACROS[0].id);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedCommands, setRecordedCommands] = useState<string[]>([]);
  const [newMacroName, setNewMacroName] = useState<string>('');
  const [newMacroDesc, setNewMacroDesc] = useState<string>('');
  const [customCmdInput, setCustomCmdInput] = useState<string>('');
  const [isRunningMacro, setIsRunningMacro] = useState<boolean>(false);
  const [runningStepIndex, setRunningStepIndex] = useState<number>(-1);
  const [macroLogs, setMacroLogs] = useState<string[]>([]);

  const selectedMacro = macros.find((m) => m.id === selectedMacroId) || macros[0];

  const toggleRecording = () => {
    if (!isRecording) {
      playTone(600, 0.05);
      setIsRecording(true);
      setRecordedCommands([]);
      setMacroLogs(['[RECORDER ARMED] Recording CLI commands sequence...']);
    } else {
      playTone(400, 0.05);
      setIsRecording(false);
      setMacroLogs((prev) => [...prev, `[RECORDER STOPPED] Captured ${recordedCommands.length} commands.`]);
    }
  };

  const handleAddCommandToRecording = (cmd: string) => {
    if (!cmd.trim()) return;
    const cleanCmd = cmd.trim();
    setRecordedCommands((prev) => [...prev, cleanCmd]);
    setMacroLogs((prev) => [...prev, `+ Added step: ${cleanCmd}`]);
    setCustomCmdInput('');
    playTone(550, 0.03);
  };

  const handleSaveRecording = () => {
    if (recordedCommands.length === 0) {
      playWarningTone();
      return;
    }
    const newMacro: MacroScript = {
      id: `macro-custom-${Date.now()}`,
      name: newMacroName.trim() || `Automated Maintenance Run #${macros.length + 1}`,
      description: newMacroDesc.trim() || 'Custom recorded CLI macro for autonomous hardware maintenance.',
      category: 'MAINTENANCE',
      commands: [...recordedCommands],
      durationMs: recordedCommands.length * 400,
    };

    setMacros((prev) => [...prev, newMacro]);
    setSelectedMacroId(newMacro.id);
    setIsRecording(false);
    setRecordedCommands([]);
    setNewMacroName('');
    setNewMacroDesc('');
    playAuditChime();
    setMacroLogs((prev) => [...prev, `[SAVED] Script "${newMacro.name}" stored in sovereign registry.`]);
  };

  const handleDeleteMacro = (id: string) => {
    playTone(350, 0.05);
    setMacros((prev) => prev.filter((m) => m.id !== id));
    if (selectedMacroId === id && macros.length > 1) {
      setSelectedMacroId(macros.find((m) => m.id !== id)!.id);
    }
  };

  const handleRunMacro = (macroToRun: MacroScript) => {
    if (isRunningMacro || macroToRun.commands.length === 0) return;
    setIsRunningMacro(true);
    setRunningStepIndex(0);
    setMacroLogs([`[EXECUTION STARTED] Running macro: "${macroToRun.name}"...`]);
    playTone(650, 0.06);

    let step = 0;
    const runNextStep = () => {
      if (step < macroToRun.commands.length) {
        const cmd = macroToRun.commands[step];
        setRunningStepIndex(step);
        setMacroLogs((prev) => [...prev, `> [Step ${step + 1}/${macroToRun.commands.length}] Executing CLI: ${cmd}`]);
        onExecuteCommand(cmd);
        playTone(520 + step * 40, 0.04);
        step++;
        setTimeout(runNextStep, 550);
      } else {
        setIsRunningMacro(false);
        setRunningStepIndex(-1);
        playAuditChime();
        setMacroLogs((prev) => [
          ...prev,
          `[EXECUTION COMPLETED] All ${macroToRun.commands.length} maintenance steps executed nominal. Cryptographically sealed.`,
        ]);
        setMacros((prev) =>
          prev.map((m) =>
            m.id === macroToRun.id
              ? { ...m, lastRun: new Date().toLocaleTimeString('th-TH', { hour12: false }) + ' ICT' }
              : m
          )
        );
      }
    };

    setTimeout(runNextStep, 200);
  };

  return (
    <div className="space-y-4 font-mono text-xs select-text">
      {/* Macro Header and Recorder Toolbar */}
      <div className="p-4 rounded-2xl bg-[#0b0e1a]/85 border border-white/8 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white uppercase">Macro Console & Automation Scripts</span>
              <span className="px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[9px]">
                {macros.length} SCRIPTS
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Record, compile, and execute sequences of CLI commands for automated system maintenance.
            </p>
          </div>
        </div>

        {/* Recording Toggle Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleRecording}
            className={`px-3.5 py-1.5 rounded-xl border font-bold flex items-center gap-2 transition-all text-xs ${
              isRecording
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-200'
            }`}
          >
            {isRecording ? <Square className="w-3.5 h-3.5 fill-current" /> : <Circle className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />}
            <span>{isRecording ? 'Stop Recording' : 'Record Sequence'}</span>
          </button>
        </div>
      </div>

      {/* Recording in Progress Panel */}
      {isRecording && (
        <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 backdrop-blur-xl space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-rose-300 font-bold text-xs">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              RECORDING IN PROGRESS ({recordedCommands.length} Steps)
            </span>
            <span className="text-[10px] text-zinc-400">Append commands below or type in CLI</span>
          </div>

          {/* Quick command adder */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customCmdInput}
              onChange={(e) => setCustomCmdInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCommandToRecording(customCmdInput)}
              placeholder="Enter command to append (e.g. audit, snapshot, cert, pentest)..."
              className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
            />
            <button
              onClick={() => handleAddCommandToRecording(customCmdInput)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
            >
              Add Step
            </button>
          </div>

          {/* Quick Preset Buttons for Recording */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="text-zinc-500">Quick Insert:</span>
            {['snapshot', 'audit', 'reconcile', 'cert', 'pentest', 'benchmark', 'seals', 'export-json'].map((cmd) => (
              <button
                key={cmd}
                onClick={() => handleAddCommandToRecording(cmd)}
                className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-zinc-300 border border-white/10"
              >
                +{cmd}
              </button>
            ))}
          </div>

          {/* Save Macro Form */}
          {recordedCommands.length > 0 && (
            <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newMacroName}
                onChange={(e) => setNewMacroName(e.target.value)}
                placeholder="Script Name (e.g. Scheduled Nightly Audit)..."
                className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500"
              />
              <button
                onClick={handleSaveRecording}
                className="px-4 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Script</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Script Catalog on Left, Details & Execution Log on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 5 Cols: Script Catalog */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {macros.map((m) => {
            const isSelected = selectedMacroId === m.id;
            return (
              <div
                key={m.id}
                onClick={() => {
                  playTone(520, 0.03);
                  setSelectedMacroId(m.id);
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                  isSelected
                    ? 'bg-cyan-950/30 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                    : 'bg-[#0b0e1a]/70 border-white/6 hover:border-white/15'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs truncate max-w-[200px]">{m.name}</span>
                  <span
                    className={`px-2 py-0.2 rounded-full text-[9px] font-bold border ${
                      m.category === 'SECURITY'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : m.category === 'QUANTUM'
                        ? 'bg-violet-500/15 text-violet-300 border-violet-500/30'
                        : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                    }`}
                  >
                    {m.category}
                  </span>
                </div>

                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">{m.description}</p>

                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-white/5">
                  <span>{m.commands.length} Commands</span>
                  {m.lastRun && <span>Last: {m.lastRun}</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 7 Cols: Selected Script Inspector & Execution Console */}
        <div className="lg:col-span-7 space-y-3">
          <div className="p-4 rounded-2xl bg-[#0b0e1a]/85 border border-white/8 backdrop-blur-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase">{selectedMacro.name}</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">{selectedMacro.description}</p>
              </div>

              <div className="flex items-center gap-2">
                {macros.length > 1 && (
                  <button
                    onClick={() => handleDeleteMacro(selectedMacro.id)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 transition-all"
                    title="Delete Macro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => handleRunMacro(selectedMacro)}
                  disabled={isRunningMacro}
                  className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-xs transition-all ${
                    isRunningMacro
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                      : 'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  }`}
                >
                  <Play className={`w-3.5 h-3.5 ${isRunningMacro ? 'animate-spin' : ''}`} />
                  <span>{isRunningMacro ? 'Executing...' : 'Run Macro'}</span>
                </button>
              </div>
            </div>

            {/* Sequence Steps Pills */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-zinc-500 uppercase block">Sequential Steps:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedMacro.commands.map((cmd, idx) => {
                  const isCurrentStep = runningStepIndex === idx;
                  return (
                    <div
                      key={idx}
                      className={`px-2.5 py-1 rounded-xl font-mono text-[11px] border flex items-center gap-1.5 transition-all ${
                        isCurrentStep
                          ? 'bg-cyan-500 text-black font-bold border-cyan-400 scale-105 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                          : 'bg-black/40 border-white/10 text-zinc-300'
                      }`}
                    >
                      <span className="opacity-50 text-[9px]">#{idx + 1}</span>
                      <span>{cmd}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Execution Terminal Log Window */}
            <div className="p-3 bg-black/60 rounded-xl border border-white/5 space-y-1 max-h-[140px] overflow-y-auto text-[10px] text-zinc-400 font-mono">
              <div className="text-zinc-600 text-[9px] uppercase border-b border-white/5 pb-1 flex justify-between">
                <span>MACRO RUNTIME LOG</span>
                <span>STATUS: {isRunningMacro ? 'ACTIVE' : 'IDLE'}</span>
              </div>
              {macroLogs.length === 0 ? (
                <div className="text-zinc-600 italic py-2 text-center">Ready to execute maintenance script...</div>
              ) : (
                macroLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={
                      log.includes('COMPLETED') || log.includes('SAVED')
                        ? 'text-emerald-400 font-bold'
                        : log.includes('STARTED') || log.includes('Executing')
                        ? 'text-cyan-300'
                        : log.includes('RECORDING') || log.includes('STOPPED')
                        ? 'text-rose-300'
                        : 'text-zinc-300'
                    }
                  >
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
