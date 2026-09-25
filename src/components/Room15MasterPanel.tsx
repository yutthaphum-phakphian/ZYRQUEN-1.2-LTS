import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Radio,
  Play,
  Square,
  Mic,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Sparkles,
  Zap,
  Globe,
  Music,
  Headphones
} from 'lucide-react';
import { ViewType } from '../types';
import { playAuditChime, playTone, playAnomalyAlarm, playTelemetryBeep } from './AudioSynthesizer';
import { soundFx } from '../services/audioEngine';

interface Room15MasterPanelProps {
  onNavigate?: (view: ViewType) => void;
  onOpenCertificate?: () => void;
}

export const Room15MasterPanel: React.FC<Room15MasterPanelProps> = ({
  onNavigate,
  onOpenCertificate
}) => {
  const [activeFrequency, setActiveFrequency] = useState<number>(432);
  const [isPlayingBeacon, setIsPlayingBeacon] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechLanguage, setSpeechLanguage] = useState<'th' | 'en'>('th');
  const [speechText, setSpeechText] = useState<string>(
    'ระบบ ZYRQUEN โอเมก้า อนันต์ 14,902 ตราประทับ ได้รับการล็อกสัจธรรมอย่างสมบูรณ์แบบ SSoT 100% Zero Drift'
  );

  const handlePlayFreq = (freq: number) => {
    setActiveFrequency(freq);
    playTone(freq, 0.4);
  };

  const handleToggleBeacon = () => {
    if (isPlayingBeacon) {
      setIsPlayingBeacon(false);
    } else {
      setIsPlayingBeacon(true);
      soundFx.playTelemetryBeacon(880, 0.2);
    }
  };

  const handleSpeakAttestation = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      playAuditChime();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      speechLanguage === 'th'
        ? speechText
        : 'ZYRQUEN Omega Infinity. 14,902 Canonical Seals. SSoT Zero Drift Invariants fully verified.'
    );
    utterance.lang = speechLanguage === 'th' ? 'th-TH' : 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    playTone(528, 0.1);
  };

  return (
    <div className="space-y-6 font-mono text-zinc-300">
      {/* Top Banner for Room 15 */}
      <div className="p-6 sm:p-8 rounded-[28px] bg-gradient-to-br from-indigo-950/40 via-[#0a0f24]/95 to-black border-indigo-500/40 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(99,102,241,0.25)]">
                <Music className="w-4 h-4 text-indigo-400 animate-pulse" />
                CHAMBER 15 • SONIC ALERT & MULTILINGUAL SPEECH SYNTHESIS
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border-cyan-500/30 text-[11px] font-bold">
                WEBAUDIO 48.0 kHz LOSSLESS
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border-purple-500/30 text-[11px] font-bold">
                BILINGUAL TH / EN
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
                ระบบสังเคราะห์เสียงสัญญาณเตือนภัย และสุนทรพจน์หลายภาษา (Sonic Attestation & Audio Synth)
              </h2>
              <p className="text-sm text-zinc-400 max-w-4xl leading-relaxed">
                ส่งสัญญาณความถี่อคูสติก (Acoustic Beacon), ซาวด์สเตทตรวจสอบพันธสัญญาเชิงความถี่ (432 Hz, 528 Hz, 880 Hz)
                และสังเคราะห์เสียงพากย์แถลงการณ์สถานะอธิปไตยภาษาไทยและอังกฤษ
              </p>
            </div>
          </div>

          <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-3 shrink-0">
            <button
              onClick={handleSpeakAttestation}
              disabled={isSpeaking}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600/80 to-purple-600/80 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20 border-indigo-400/40 transition-all transform hover:-translate-y-0.5"
            >
              <Mic className={`w-4 h-4 ${isSpeaking ? 'animate-bounce text-pink-300' : ''}`} />
              {isSpeaking ? 'Synthesizing Audio Voice...' : 'Play SSoT Voice Attestation'}
            </button>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-pink-400 animate-ping' : 'bg-indigo-400'}`} />
              <span>Voice Status: {isSpeaking ? 'Vocal Engine Active' : 'Standby / Ready'}</span>
            </div>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-indigo-500/20">
          <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Audio Engine</div>
            <div className="text-base sm:text-lg font-bold text-indigo-400">WebAudio API</div>
            <div className="text-[10px] text-zinc-400">Low-Latency Context</div>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Beacon Frequency</div>
            <div className="text-base sm:text-lg font-bold text-cyan-400">880 Hz Pulse</div>
            <div className="text-[10px] text-cyan-300">Continuous Sonar</div>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Speech Languages</div>
            <div className="text-base sm:text-lg font-bold text-purple-400">TH-SOV / EN-UK</div>
            <div className="text-[10px] text-purple-300">Web Speech Engine</div>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Sampling Rate</div>
            <div className="text-base sm:text-lg font-bold text-emerald-400">48.0 kHz 24-bit</div>
            <div className="text-[10px] text-zinc-400">Zero Loss Sound</div>
          </div>
        </div>
      </div>

      {/* Grid of Frequency Synth & Voice Controller */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Frequency & Tone Synthesizer */}
        <div className="p-6 rounded-2xl bg-[#0a0d1f] border-indigo-500/20 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Music className="w-4 h-4 text-indigo-400" />
            ตู้สังเคราะห์ความถี่สัตยาบัน (Harmonic Frequency Synthesizer)
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '432 Hz Harmonic', freq: 432, desc: 'Solfeggio Sovereign' },
              { label: '528 Hz Phoenix', freq: 528, desc: 'Phoenix Auto-Healing' },
              { label: '880 Hz Telemetry', freq: 880, desc: 'OTel Beacon Tone' },
              { label: '1056 Hz Merkle', freq: 1056, desc: 'SSoT Seal Lock' }
            ].map((item) => (
              <button
                key={item.freq}
                onClick={() => handlePlayFreq(item.freq)}
                className="p-3 rounded-xl bg-black/40 hover:bg-indigo-950/60 border-indigo-500/30 text-left transition-all group"
              >
                <div className="text-xs font-bold text-indigo-300 group-hover:text-indigo-200">{item.label}</div>
                <div className="text-[10px] text-zinc-500">{item.desc}</div>
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-white/5 flex gap-2">
            <button
              onClick={() => playAnomalyAlarm()}
              className="px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/40 text-xs font-bold flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              Test Fail-Closed Siren
            </button>
            <button
              onClick={() => playAuditChime()}
              className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40 text-xs font-bold flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Quantum Seal Chime
            </button>
          </div>
        </div>

        {/* Multilingual Voice Attestation */}
        <div className="p-6 rounded-2xl bg-[#0a0d1f] border-purple-500/20 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-purple-400" />
            ระบบเสียงพากย์สถานะอธิปไตย (Bilingual Sovereign Speech Engine)
          </h3>

          <div className="flex gap-2">
            <button
              onClick={() => setSpeechLanguage('th')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                speechLanguage === 'th'
                  ? 'bg-purple-500/30 text-purple-200 border-purple-500/50'
                  : 'bg-black/40 text-zinc-400 border-white/5'
              }`}
            >
              🇹🇭 ภาษาไทย (TH-SOV)
            </button>
            <button
              onClick={() => setSpeechLanguage('en')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                speechLanguage === 'en'
                  ? 'bg-purple-500/30 text-purple-200 border-purple-500/50'
                  : 'bg-black/40 text-zinc-400 border-white/5'
              }`}
            >
              🇬🇧 English (EN-UK)
            </button>
          </div>

          <div className="p-3 rounded-xl bg-black/60 border-white/10 text-xs text-zinc-300 leading-relaxed">
            {speechLanguage === 'th'
              ? speechText
              : 'ZYRQUEN Omega Infinity Sovereign Core. 14,902 Canonical Seals. 10 of 10 Invariants 100% verified with zero drift.'}
          </div>

          <button
            onClick={handleSpeakAttestation}
            className="w-full py-2.5 rounded-xl bg-purple-600/40 hover:bg-purple-600/60 text-purple-200 border-purple-500/40 text-xs font-bold flex items-center justify-center gap-2"
          >
            <Volume2 className="w-4 h-4" />
            Broadcast Audio Attestation
          </button>
        </div>
      </div>
    </div>
  );
};
