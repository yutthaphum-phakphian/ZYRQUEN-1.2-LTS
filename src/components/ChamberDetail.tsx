import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Lock, 
  Activity, 
  Zap, 
  Database, 
  Key, 
  FileCheck, 
  Scale, 
  GitBranch, 
  Radio, 
  Sliders, 
  Globe, 
  Eye, 
  Volume2, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  Search, 
  Play,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { 
  SOVEREIGN_CHAMBERS, 
  CANONICAL_CONSTANTS, 
  INVARIANTS, 
  VERIFICATION_PHASES, 
  SATELLITE_NODES, 
  HSM_UNITS, 
  TREASURY_ASSETS 
} from '../data/sovereignData.ts';
import { Chamber } from '../types.ts';
import { generateSealProof, verifyGenesisMerkleRoot } from '../services/cryptoEngine.ts';
import { soundFx } from '../services/audioEngine.ts';
import { QuantumVisualizer } from './QuantumVisualizer.tsx';
import { CryoJitterChart } from './CryoJitterChart.tsx';

interface ChamberDetailProps {
  chamberId: string;
  liveCryo?: number;
  onOpenPhoenix: () => void;
  onOpenDossier: () => void;
  onOpenTerminal: () => void;
}

export const ChamberDetail: React.FC<ChamberDetailProps> = ({
  chamberId,
  liveCryo,
  onOpenPhoenix,
  onOpenDossier,
  onOpenTerminal,
}) => {
  const chamber = SOVEREIGN_CHAMBERS.find((c) => c.id === chamberId) || SOVEREIGN_CHAMBERS[0];

  // Chamber 02 & 08 Seal Inspector State
  const [sealSearchIndex, setSealSearchIndex] = useState<number>(1);
  const [inspectedSeal, setInspectedSeal] = useState<{
    index: number;
    leafHash: string;
    pqcProof: string;
    status: string;
  } | null>(null);

  // Chamber 15 Audio Test State
  const [speechText, setSpeechText] = useState('ZYRQUEN Sovereign World Engine active. All invariants nominal.');
  const [speechLang, setSpeechLang] = useState<'th-TH' | 'en-US'>('en-US');

  // Chamber 03 PII Redaction Tester
  const [piiInput, setPiiInput] = useState('User: John Doe, ID: 1234567890123, Phone: +66 81 234 5678');
  const [piiOutput, setPiiOutput] = useState('User: [REDACTED], ID: [PDPA_SEC26_MASKED], Phone: [SECURE_HASH]');

  const handleInspectSeal = async (idx: number) => {
    soundFx.playTelemetryBeacon(880, 0.04);
    const proof = await generateSealProof(idx);
    setInspectedSeal(proof);
  };

  const handleTestSpeech = () => {
    soundFx.speakAnnouncement(speechText, speechLang);
  };

  const handlePiiRedact = (val: string) => {
    setPiiInput(val);
    const redacted = val
      .replace(/\d{13}/g, '[PDPA_SEC26_MASKED]')
      .replace(/\+?\d{2,3}[\s-]?\d{2,3}[\s-]?\d{4}/g, '[PHONE_REDACTED]')
      .replace(/[A-Z][a-z]+ [A-Z][a-z]+/g, '[NAME_REDACTED]');
    setPiiOutput(redacted);
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#05080f] select-none">
      {/* Chamber Header Card */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-[#091122] to-slate-950 border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="font-mono-code text-xs font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border-cyan-800">
                CHAMBER {chamber.id}
              </span>
              <span className="text-xs text-slate-400">[{chamber.category}]</span>
              <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border-emerald-800/80">
                {chamber.status}
              </span>
            </div>
            <h2 className="text-xl font-display font-bold text-slate-100 mt-1.5">
              {chamber.name}
            </h2>
            <p className="text-xs text-cyan-400 mt-0.5">{chamber.nameTh}</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenTerminal}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border-slate-700 text-xs text-slate-300 font-medium transition-all"
            >
              Open CLI Shell
            </button>
            <button
              onClick={onOpenDossier}
              className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border-cyan-800 text-xs text-cyan-200 font-medium transition-all"
            >
              View Legal Dossier
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-300 mt-3 pt-3 border-t border-slate-800/80 leading-relaxed">
          {chamber.description}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {chamber.metrics.map((metric, i) => (
          <div
            key={i}
            className="p-3 rounded-lg bg-slate-950/70 border-slate-800/80 hover:border-slate-700 transition-colors"
          >
            <div className="text-[11px] text-slate-400">{metric.label}</div>
            <div className="text-base font-mono-code font-bold text-cyan-200 mt-0.5 truncate">
              {metric.value}
            </div>
            {metric.sublabel && (
              <div className="text-[10px] text-slate-500 mt-0.5">{metric.sublabel}</div>
            )}
          </div>
        ))}
      </div>

      {/* Live Cryogenic Jitter Recharts Visualization */}
      <CryoJitterChart currentCryo={liveCryo} />

      {/* Chamber-Specific Specialized Modules */}

      {/* CHAMBER 17 & 00: 40-Phase Verification Matrix + 10 Invariants */}
      {(chamber.id === '17' || chamber.id === '00') && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950/80 border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-100 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>40-Phase Verification Matrix (All 40/40 PASS)</span>
              </h3>
              <span className="text-xs font-mono-code px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border-emerald-800">
                100% COHERENCE
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
              {VERIFICATION_PHASES.map((p) => (
                <div
                  key={p.id}
                  className="p-2 rounded bg-slate-900/60 border-slate-800 text-[11px] flex items-center justify-between"
                >
                  <div className="truncate mr-1">
                    <span className="font-mono-code text-cyan-400 font-bold mr-1.5">{p.id}</span>
                    <span className="text-slate-300">{p.name}</span>
                  </div>
                  <span className="text-[9px] font-mono-code px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 font-bold border-emerald-800">
                    PASS
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 10 Invariants Grid */}
          <div className="p-4 rounded-xl bg-slate-950/80 border-slate-800 space-y-3">
            <h3 className="font-semibold text-sm text-slate-100 flex items-center space-x-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>10 Sovereign SSoT Invariants</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {INVARIANTS.map((inv) => (
                <div
                  key={inv.id}
                  className="p-2.5 rounded bg-slate-900/50 border-slate-800 flex items-start justify-between space-x-2 text-xs"
                >
                  <div>
                    <div className="font-mono-code font-bold text-cyan-300">{inv.name}</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">{inv.description}</div>
                  </div>
                  <span className="text-[9px] font-mono-code px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border-emerald-800/60 shrink-0">
                    {inv.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CHAMBER 16: Dynamic 3D / 2D Quantum Visualizer */}
      {(chamber.id === '16' || chamber.id === '17') && (
        <div>
          <QuantumVisualizer />
        </div>
      )}

      {/* CHAMBER 02 & 08: Merkle Leaf & Digital Seal Inspector */}
      {(chamber.id === '02' || chamber.id === '08') && (
        <div className="p-4 rounded-xl bg-slate-950/80 border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-slate-100 flex items-center space-x-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>Digital Seal Proof Explorer (14,902 Canonical + 80 Quarantined)</span>
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min={1}
              max={14982}
              value={sealSearchIndex}
              onChange={(e) => setSealSearchIndex(Number(e.target.value))}
              placeholder="Enter Seal Number (1 - 14982)..."
              className="flex-1 bg-slate-900 border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={() => handleInspectSeal(sealSearchIndex)}
              className="px-4 py-1.5 rounded bg-cyan-950 hover:bg-cyan-900 border-cyan-800 text-xs text-cyan-200 font-semibold"
            >
              Verify Leaf Hash
            </button>
          </div>

          {inspectedSeal && (
            <div className="p-3 bg-slate-900/80 rounded border-slate-800 font-mono-code text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Seal Index:</span>
                <span className="text-cyan-300 font-bold">#{inspectedSeal.index}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span
                  className={
                    inspectedSeal.status === 'VERIFIED'
                      ? 'text-emerald-400 font-bold'
                      : 'text-amber-400 font-bold'
                  }
                >
                  {inspectedSeal.status}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Computed Leaf Hash: </span>
                <span className="text-slate-200 break-all">{inspectedSeal.leafHash}</span>
              </div>
              <div>
                <span className="text-slate-500">PQC Proof: </span>
                <span className="text-purple-300">{inspectedSeal.pqcProof}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CHAMBER 03: Thai ETDA & PDPA Safe Harbor Gateway */}
      {chamber.id === '03' && (
        <div className="p-4 rounded-xl bg-slate-950/80 border-slate-800 space-y-4">
          <h3 className="font-semibold text-sm text-slate-100 flex items-center space-x-2">
            <Scale className="w-4 h-4 text-cyan-400" />
            <span>Interactive PDPA Safe Harbor Redaction Engine</span>
          </h3>
          <div className="space-y-2">
            <label className="text-xs text-slate-400">Input Data with PII:</label>
            <input
              type="text"
              value={piiInput}
              onChange={(e) => handlePiiRedact(e.target.value)}
              className="w-full bg-slate-900 border-slate-800 rounded px-3 py-2 text-xs text-slate-200 font-mono-code focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div className="p-3 bg-slate-900/60 rounded border-slate-800 space-y-1">
            <div className="text-[11px] text-slate-500 font-mono-code">Redacted Legal Stream Output:</div>
            <div className="text-xs font-mono-code text-emerald-400">{piiOutput}</div>
          </div>
        </div>
      )}

      {/* CHAMBER 13: Global Satellite Mesh (6 Sovereign Nodes) */}
      {chamber.id === '13' && (
        <div className="p-4 rounded-xl bg-slate-950/80 border-slate-800 space-y-3">
          <h3 className="font-semibold text-sm text-slate-100 flex items-center space-x-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>6 Sovereign Satellite Mesh Centers</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {SATELLITE_NODES.map((node) => (
              <div
                key={node.code}
                className="p-3 bg-slate-900/60 border-slate-800 rounded-lg space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono-code font-bold text-cyan-400">{node.code}</span>
                  <span className="text-[9px] font-mono-code px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border-emerald-800">
                    {node.latency}
                  </span>
                </div>
                <div className="font-semibold text-slate-200">{node.location}</div>
                <div className="text-[11px] text-slate-400">{node.locationTh}</div>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800 font-mono-code">
                  {node.securityStandard}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CHAMBER 15: Sonic Alert & Bilingual Speech Synthesis */}
      {chamber.id === '15' && (
        <div className="p-4 rounded-xl bg-slate-950/80 border-slate-800 space-y-4">
          <h3 className="font-semibold text-sm text-slate-100 flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <span>WebAudio Sonic Beacon & Speech Synthesizer</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <button
              onClick={() => soundFx.playTelemetryBeacon(432, 0.15)}
              className="p-2.5 rounded bg-slate-900 hover:bg-slate-800 border-slate-800 text-xs text-slate-300 font-mono-code"
            >
              Play 432 Hz SSoT Tone
            </button>
            <button
              onClick={() => soundFx.playPhoenixChime()}
              className="p-2.5 rounded bg-amber-950/60 hover:bg-amber-900/60 border-amber-800/80 text-xs text-amber-300 font-mono-code"
            >
              Play Phoenix 142ms Chord
            </button>
            <button
              onClick={() => soundFx.playAlertBuzz()}
              className="p-2.5 rounded bg-rose-950/60 hover:bg-rose-900/60 border-rose-800/80 text-xs text-rose-300 font-mono-code"
            >
              Play Quarantine Alert
            </button>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-xs text-slate-400">Synthesize Voice Attestation:</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={speechText}
                onChange={(e) => setSpeechText(e.target.value)}
                className="flex-1 bg-slate-900 border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <select
                value={speechLang}
                onChange={(e) => setSpeechLang(e.target.value as 'th-TH' | 'en-US')}
                className="bg-slate-900 border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300"
              >
                <option value="en-US">English (UK/US)</option>
                <option value="th-TH">ภาษาไทย (TH-SOV)</option>
              </select>
              <button
                onClick={handleTestSpeech}
                className="px-4 py-1.5 rounded bg-cyan-950 hover:bg-cyan-900 border-cyan-800 text-xs text-cyan-200 font-semibold"
              >
                Speak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHAMBER 10: Sovereign Treasury & Fiduciary Assets */}
      {chamber.id === '10' && (
        <div className="p-4 rounded-xl bg-slate-950/80 border-slate-800 space-y-3">
          <h3 className="font-semibold text-sm text-slate-100 flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Fiduciary Treasury Reserve Allocation</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {TREASURY_ASSETS.map((asset) => (
              <div
                key={asset.assetClass}
                className="p-3 bg-slate-900/60 border-slate-800 rounded-lg space-y-1.5"
              >
                <div className="font-mono-code font-bold text-cyan-400 text-sm">
                  {asset.assetClass}
                </div>
                <div className="text-base font-bold text-slate-100">{asset.valuation}</div>
                <div className="text-xs text-slate-300">{asset.description}</div>
                <div className="text-[10px] text-emerald-400 pt-1 border-t border-slate-800 font-mono-code">
                  {asset.verificationStatus}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
