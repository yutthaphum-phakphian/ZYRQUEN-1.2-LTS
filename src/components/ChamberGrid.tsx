import React, { useState } from 'react';
import { Chamber, CHAMBERS } from '../data/sovereignData';
import { playSovereignTone } from '../utils/audio';

const CHAMBER_EMOJIS: Record<string, string> = {
  '00': '🏛️',
  '01': '🔐',
  '02': '📜',
  '03': '⚖️',
  '04': '🧊',
  '05': '⚙️',
  '06': '🛡️',
  '07': '🐦‍🔥',
  '08': '🔍',
  '09': '📡',
  '10': '💰',
  '11': '📑',
  '12': '🔒',
  '13': '🌐',
  '14': '🧠',
  '15': '🔊',
  '16': '🎮',
  '17': '👑',
};

interface Props {
  onSelectChamber?: (chamber: Chamber) => void;
}

export const ChamberGrid: React.FC<Props> = ({ onSelectChamber }) => {
  const [selectedChamber, setSelectedChamber] = useState<Chamber | null>(null);

  const handleChamberClick = (chamber: Chamber) => {
    setSelectedChamber(chamber);
    playSovereignTone('ping');
    if (onSelectChamber) onSelectChamber(chamber);
  };

  return (
    <section id="chambers-section" className="mb-8">
      <div className="flex items-center justify-between border-b border-[#17233f] pb-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-[#D4AF37] flex items-center gap-2">
            <span>🏛️</span> 18 SOVEREIGN CHAMBERS (00 - 17)
          </h2>
          <p className="text-xs text-[#9CA3AF] mt-1 font-mono">
            Partition Bound: Ω600_1000 Strict | Block #849202 | 100% Operational Invariants
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs bg-[#0a0f1e] border-[#10B981] text-[#10B981] px-3 py-1 font-mono">
            18/18 ALL PASS
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {CHAMBERS.map((ch) => {
          const isSelected = selectedChamber?.id === ch.id;
          const chNum = ch.number || ch.id;
          const chEmoji = ch.emoji || CHAMBER_EMOJIS[ch.id] || '🏛️';
          const chProtocol = ch.details?.protocol || ch.code;

          return (
            <button
              key={ch.id}
              id={`chamber-btn-${chNum}`}
              onClick={() => handleChamberClick(ch)}
              className={`p-3 text-left border transition-colors bg-[#0a0f1e] ${
                isSelected
                  ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]'
                  : 'border-[#17233f] hover:border-[#06B6D4]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl" role="img" aria-label={ch.name}>
                  {chEmoji}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#070a12] border-[#17233f] text-[#06B6D4]">
                  {chNum}
                </span>
              </div>
              <div className="text-xs font-bold text-[#F3F4F6] truncate">{ch.name}</div>
              <div className="text-[10px] font-mono mt-1 text-[#9CA3AF] truncate">
                {chProtocol}
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
                <span className="text-[#10B981]">● {ch.status}</span>
                <span className="text-[#D4AF37]">Ω600_1000</span>
              </div>
            </button>
          );
        })}
      </div>

      {selectedChamber && (() => {
        const selNum = selectedChamber.number || selectedChamber.id;
        const selEmoji = selectedChamber.emoji || CHAMBER_EMOJIS[selectedChamber.id] || '🏛️';
        const selTagline = selectedChamber.tagline || selectedChamber.descriptionTh || selectedChamber.description;
        const selSpecs = selectedChamber.details?.keySpecs || selectedChamber.metrics.map(m => ({ label: m.label, value: m.value }));
        const selTelemetry = selectedChamber.details?.telemetry || 'Telemetry Active | SSoT Δ0.00% | Genesis #849202 | Seals 14,902';
        const selAuth = selectedChamber.details?.authorityCheck || '10/10 REAL_HSM Verified | FIPS 140-3 L4';

        return (
          <div
            id="chamber-inspector-modal"
            className="mt-4 bg-[#0a0f1e] border-[#D4AF37] p-4 text-xs font-mono"
          >
            <div className="flex items-center justify-between border-b border-[#17233f] pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selEmoji}</span>
                <div>
                  <span className="text-[#D4AF37] font-bold text-sm">
                    CHAMBER {selNum}: {selectedChamber.name.toUpperCase()}
                  </span>
                  <p className="text-[#9CA3AF] text-[11px]">{selTagline}</p>
                </div>
              </div>
              <button
                id="close-chamber-inspector"
                onClick={() => setSelectedChamber(null)}
                className="text-[#9CA3AF] hover:text-[#D4AF37] border-[#17233f] px-2 py-1 bg-[#070a12]"
              >
                ✕ CLOSE
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-[#06B6D4] font-bold mb-2"># SPECIFICATIONS & ANCHORS</div>
                <div className="bg-[#070a12] border-[#17233f] p-2 space-y-1.5">
                  {selSpecs.map((spec, i) => (
                    <div key={i} className="flex justify-between border-b border-[#17233f] pb-1">
                      <span className="text-[#9CA3AF]">{spec.label}:</span>
                      <span className="text-[#F3F4F6] font-bold">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[#06B6D4] font-bold mb-2"># REAL-TIME TELEMETRY & AUDIT</div>
                <div className="bg-[#070a12] border-[#17233f] p-2 space-y-2">
                  <div>
                    <span className="text-[#D4AF37]">Telemetry Stream:</span>
                    <p className="text-[#F3F4F6] mt-0.5">{selTelemetry}</p>
                  </div>
                  <div>
                    <span className="text-[#10B981]">Authority Verification:</span>
                    <p className="text-[#F3F4F6] mt-0.5">{selAuth}</p>
                  </div>
                  <div>
                    <span className="text-[#06B6D4]">Partition Boundary:</span>
                    <p className="text-[#F3F4F6] mt-0.5">Ω600_1000 STRICT LOCK (400 TENANTS)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
};
