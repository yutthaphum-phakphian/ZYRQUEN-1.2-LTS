// Web Audio API sovereign audio feedback and ambient sound profiles

let audioCtx: AudioContext | null = null;
let sovereignOscillator: OscillatorNode | null = null;
let sovereignSubOscillator: OscillatorNode | null = null;
let sovereignLfo: OscillatorNode | null = null;
let sovereignLfoGain: GainNode | null = null;
let sovereignGain: GainNode | null = null;
let masterGain: GainNode | null = null;
let audioAnalyser: AnalyserNode | null = null;

export interface HarmonicCarrierData {
  isActive: boolean;
  frequency: number;
  volume: number;
  waveform: number[];
}

export type AudioProfileId = 'deep-space' | 'circuitry' | 'neural-sync' | 'cryo-vacuum' | 'sovereign-harmonic';

export interface AudioProfile {
  id: AudioProfileId;
  name: string;
  subtitle: string;
  baseFreq: number;
  subFreq?: number;
  lfoFreq?: number;
  type: OscillatorType;
  description: string;
  color: string;
}

export const AUDIO_PROFILES: AudioProfile[] = [
  {
    id: 'deep-space',
    name: 'Deep Space Drone',
    subtitle: '432 Hz Cosmic Carrier + 54 Hz Sub-Bass',
    baseFreq: 432,
    subFreq: 54,
    lfoFreq: 0.2,
    type: 'sine',
    description: 'Ultra-low cosmic resonance calibrated to mathematical 432 Hz harmonic ground.',
    color: 'from-blue-500/20 to-indigo-500/20 text-blue-300 border-blue-500/30',
  },
  {
    id: 'circuitry',
    name: 'Circuitry Carrier',
    subtitle: '882 Hz Post-Quantum Clock Pulse',
    baseFreq: 882,
    subFreq: 110.25,
    lfoFreq: 1.5,
    type: 'sine',
    description: 'High-precision sovereign clock carrier mirroring subzero quantum processor cycles.',
    color: 'from-cyan-500/20 to-teal-500/20 text-cyan-300 border-cyan-500/30',
  },
  {
    id: 'neural-sync',
    name: 'Neural Sync Theta',
    subtitle: '528 Hz Solfeggio + 8 Hz Binaural Wave',
    baseFreq: 528,
    subFreq: 536,
    lfoFreq: 8.0,
    type: 'triangle',
    description: 'Cognitive coherence Solfeggio matrix stimulating deep neural synchronization.',
    color: 'from-violet-500/20 to-fuchsia-500/20 text-violet-300 border-violet-500/30',
  },
  {
    id: 'cryo-vacuum',
    name: 'Cryo Vacuum Chamber',
    subtitle: '174 Hz Low Resonance + Subzero Hum',
    baseFreq: 174,
    subFreq: 43.5,
    lfoFreq: 0.1,
    type: 'sine',
    description: 'Sub-Kelvin 12.4 mK cryostat acoustics for deep focus and operational calm.',
    color: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30',
  },
  {
    id: 'sovereign-harmonic',
    name: 'Sovereign Master Bell',
    subtitle: '741 Hz Clarity Harmonic + 3 Hz Modulation',
    baseFreq: 741,
    subFreq: 247,
    lfoFreq: 3.0,
    type: 'sine',
    description: 'Executive attestation frequency symbolizing immutable cryptographic authority.',
    color: 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30',
  },
];

let activeProfileId: AudioProfileId = 'circuitry';
let currentMasterVolume = 0.04;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const setMasterVolume = (vol: number) => {
  currentMasterVolume = Math.max(0, Math.min(1, vol));
  if (masterGain && audioCtx) {
    masterGain.gain.setValueAtTime(currentMasterVolume, audioCtx.currentTime);
  }
};

export const getMasterVolume = () => currentMasterVolume;

export const playTone = (frequency = 440, duration = 0.12, type: OscillatorType = 'sine', volume = 0.08) => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    const effectiveVol = volume * (currentMasterVolume / 0.04);
    gain.gain.setValueAtTime(Math.max(0.01, effectiveVol), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Graceful fallback if audio is muted or blocked
  }
};

export const playAuditChime = () => {
  playTone(523.25, 0.1, 'sine', 0.06); // C5
  setTimeout(() => playTone(659.25, 0.1, 'sine', 0.06), 80); // E5
  setTimeout(() => playTone(783.99, 0.18, 'sine', 0.08), 160); // G5
};

/**
 * Custom low-frequency alert chime for Telemetry Anomaly Observer.
 * Distinguishable from the bright standard audit chime (C5 523Hz -> E5 659Hz -> G5 784Hz).
 * Emits a deep, resonant sub-bass harmonic chime sequence:
 * 1. Low fundamental strike: D3 (146.83 Hz) with warm triangle body
 * 2. Deep sub-harmonic chime: A2 (110.00 Hz) with resonant low-pass filter
 * 3. Authoritative sub-bass bell tail: D2 (73.42 Hz)
 */
export const playAnomalyAlertChime = (volumeMultiplier = 1.0) => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const createLowChime = (
      freq: number,
      offsetSec: number,
      durationSec: number,
      type: OscillatorType,
      gainLevel: number
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Low-pass filter to preserve warm resonant low-frequency tone and eliminate harsh upper harmonics
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 3.2, now + offsetSec);
      filter.Q.setValueAtTime(3.5, now + offsetSec);

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + offsetSec);

      const effectiveVol = Math.max(0.01, gainLevel * volumeMultiplier * (currentMasterVolume / 0.04));
      gain.gain.setValueAtTime(0.0001, now + offsetSec);
      gain.gain.linearRampToValueAtTime(effectiveVol, now + offsetSec + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offsetSec + durationSec);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offsetSec);
      osc.stop(now + offsetSec + durationSec);
    };

    // Strike 1: D3 (146.83 Hz)
    createLowChime(146.83, 0.0, 0.38, 'triangle', 0.12);
    // Strike 2: A2 (110.00 Hz)
    createLowChime(110.0, 0.13, 0.48, 'sine', 0.14);
    // Strike 3: D2 (73.42 Hz) - Deep sub-bass resonance
    createLowChime(73.42, 0.29, 0.68, 'triangle', 0.15);
  } catch {
    // Graceful fallback with standard playTone if web audio graph is constrained
    playTone(146.83, 0.35, 'triangle', 0.10);
    setTimeout(() => playTone(110.0, 0.45, 'sine', 0.12), 130);
    setTimeout(() => playTone(73.42, 0.65, 'sine', 0.14), 290);
  }
};

export const playWarningTone = () => {
  playTone(220, 0.15, 'sawtooth', 0.05);
};

export const playTelemetryBeep = (freq = 720) => {
  playTone(freq, 0.04, 'sine', 0.04);
};

export const playAnomalyAlarm = () => {
  try {
    playTone(880, 0.12, 'sawtooth', 0.1);
    setTimeout(() => playTone(440, 0.16, 'sawtooth', 0.09), 110);
    setTimeout(() => playTone(880, 0.14, 'sawtooth', 0.1), 240);
    setTimeout(() => playTone(440, 0.2, 'sawtooth', 0.08), 380);
  } catch {
    // Graceful fallback
  }
};

export const setAmbientSoundProfile = (profileId: AudioProfileId, isPlaying = true) => {
  activeProfileId = profileId;
  const profile = AUDIO_PROFILES.find((p) => p.id === profileId) || AUDIO_PROFILES[1];

  if (isPlaying) {
    startAmbientProfile(profile);
  }
};

export const getActiveProfileId = () => activeProfileId;

const startAmbientProfile = (profile: AudioProfile) => {
  try {
    const ctx = getAudioContext();

    // Clean up previous nodes
    stopAmbientProfile();

    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(currentMasterVolume, ctx.currentTime);

    audioAnalyser = ctx.createAnalyser();
    audioAnalyser.fftSize = 64;
    audioAnalyser.smoothingTimeConstant = 0.8;
    masterGain.connect(audioAnalyser);
    audioAnalyser.connect(ctx.destination);

    sovereignGain = ctx.createGain();
    sovereignGain.gain.setValueAtTime(0.015, ctx.currentTime);
    sovereignGain.connect(masterGain);

    // 1. Primary Carrier Oscillator
    sovereignOscillator = ctx.createOscillator();
    sovereignOscillator.type = profile.type;
    sovereignOscillator.frequency.setValueAtTime(profile.baseFreq, ctx.currentTime);
    sovereignOscillator.connect(sovereignGain);
    sovereignOscillator.start();

    // 2. Secondary Sub-Bass / Binaural Oscillator if configured
    if (profile.subFreq) {
      sovereignSubOscillator = ctx.createOscillator();
      sovereignSubOscillator.type = 'sine';
      sovereignSubOscillator.frequency.setValueAtTime(profile.subFreq, ctx.currentTime);
      sovereignSubOscillator.connect(sovereignGain);
      sovereignSubOscillator.start();
    }

    // 3. Subtle LFO Amplitude Modulator
    if (profile.lfoFreq) {
      sovereignLfo = ctx.createOscillator();
      sovereignLfo.frequency.setValueAtTime(profile.lfoFreq, ctx.currentTime);
      sovereignLfoGain = ctx.createGain();
      sovereignLfoGain.gain.setValueAtTime(0.005, ctx.currentTime);
      sovereignLfo.connect(sovereignLfoGain);
      sovereignLfoGain.connect(sovereignGain.gain);
      sovereignLfo.start();
    }
  } catch (e) {
    console.warn('Could not start ambient sound profile:', e);
  }
};

const stopAmbientProfile = () => {
  try {
    if (sovereignOscillator) {
      sovereignOscillator.stop();
      sovereignOscillator.disconnect();
      sovereignOscillator = null;
    }
    if (sovereignSubOscillator) {
      sovereignSubOscillator.stop();
      sovereignSubOscillator.disconnect();
      sovereignSubOscillator = null;
    }
    if (sovereignLfo) {
      sovereignLfo.stop();
      sovereignLfo.disconnect();
      sovereignLfo = null;
    }
    if (sovereignLfoGain) {
      sovereignLfoGain.disconnect();
      sovereignLfoGain = null;
    }
    if (sovereignGain) {
      sovereignGain.disconnect();
      sovereignGain = null;
    }
    if (audioAnalyser) {
      audioAnalyser.disconnect();
      audioAnalyser = null;
    }
  } catch {
    // Ignore cleanup errors
  }
};

export const getHarmonicCarrierSnapshot = (): HarmonicCarrierData => {
  const profile = AUDIO_PROFILES.find((p) => p.id === activeProfileId) || AUDIO_PROFILES[1];
  const isActive = sovereignOscillator !== null;

  if (!isActive || !audioAnalyser) {
    return {
      isActive: false,
      frequency: profile.baseFreq,
      volume: 0,
      waveform: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };
  }

  try {
    const bufferLength = audioAnalyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    audioAnalyser.getByteTimeDomainData(dataArray);

    let sum = 0;
    const samplePoints: number[] = [];
    const step = Math.max(1, Math.floor(bufferLength / 16));

    for (let i = 0; i < bufferLength; i += step) {
      const v = (dataArray[i] - 128) / 128; // Normalize between -1 and 1
      samplePoints.push(v);
      sum += Math.abs(v);
      if (samplePoints.length >= 16) break;
    }

    const avgVol = sum / (samplePoints.length || 1);

    return {
      isActive: true,
      frequency: profile.baseFreq,
      volume: avgVol,
      waveform: samplePoints,
    };
  } catch {
    return {
      isActive: true,
      frequency: profile.baseFreq,
      volume: 0.05,
      waveform: [0, 0.2, -0.2, 0.3, -0.3, 0.1, -0.1, 0, 0.2, -0.2, 0.3, -0.3, 0.1, -0.1, 0, 0],
    };
  }
};

export const toggleSovereignSynth882Hz = (enable: boolean): boolean => {
  try {
    if (enable) {
      const profile = AUDIO_PROFILES.find((p) => p.id === activeProfileId) || AUDIO_PROFILES[1];
      startAmbientProfile(profile);
      return true;
    } else {
      stopAmbientProfile();
      return false;
    }
  } catch {
    return false;
  }
};

let currentAtmosphericEntropy = 50;

/**
 * Dynamically adjusts ambient carrier frequency, harmonic sub-pitch,
 * and modulation rates in real-time based on the aggregate system entropy level.
 */
export const updateAtmosphericEntropyPitch = (entropyPercent: number, isEnabled = true): number => {
  currentAtmosphericEntropy = Math.max(5, Math.min(95, entropyPercent));
  const profile = AUDIO_PROFILES.find((p) => p.id === activeProfileId) || AUDIO_PROFILES[1];

  if (!isEnabled) {
    return profile.baseFreq;
  }

  try {
    const ctx = getAudioContext();

    // If audio should be active but nodes are not initialized, initialize them
    if (!sovereignOscillator) {
      startAmbientProfile(profile);
    }

    // Mathematical microtonal pitch scaling:
    // Base frequency is preserved at 50% entropy (ratio 1.0).
    // Entropy 10% -> ratio ~0.78 (deep subzero calm)
    // Entropy 90% -> ratio ~1.25 (elevated high-flux excitation)
    const pitchRatio = 1 + (currentAtmosphericEntropy - 50) / 160;
    const targetFreq = Math.round(profile.baseFreq * pitchRatio * 10) / 10;

    if (sovereignOscillator && ctx.state === 'running') {
      // Butter-smooth frequency glide with 0.35s time constant
      sovereignOscillator.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.35);
    }

    if (sovereignSubOscillator && profile.subFreq && ctx.state === 'running') {
      const subRatio = 1 + (currentAtmosphericEntropy - 50) / 200;
      const targetSubFreq = Math.round(profile.subFreq * subRatio * 10) / 10;
      sovereignSubOscillator.frequency.setTargetAtTime(targetSubFreq, ctx.currentTime, 0.4);
    }

    if (sovereignLfo && ctx.state === 'running') {
      // Modulate LFO pulsation rate smoothly with entropy flux
      const baseLfo = profile.lfoFreq || 1.0;
      const targetLfoRate = baseLfo * (0.7 + (currentAtmosphericEntropy / 100) * 0.9);
      sovereignLfo.frequency.setTargetAtTime(targetLfoRate, ctx.currentTime, 0.5);
    }

    return targetFreq;
  } catch (e) {
    console.warn('Atmospheric entropy modulation error:', e);
    return profile.baseFreq;
  }
};

export const getAtmosphericCarrierState = () => {
  const profile = AUDIO_PROFILES.find((p) => p.id === activeProfileId) || AUDIO_PROFILES[1];
  const pitchRatio = 1 + (currentAtmosphericEntropy - 50) / 160;
  return {
    isActive: sovereignOscillator !== null,
    profileName: profile.name,
    baseFreq: profile.baseFreq,
    currentFreq: Math.round(profile.baseFreq * pitchRatio * 10) / 10,
    entropy: currentAtmosphericEntropy,
  };
};

let cryoHumOsc1: OscillatorNode | null = null;
let cryoHumOsc2: OscillatorNode | null = null;
let cryoHumGain: GainNode | null = null;

/**
 * Toggles the calibrated Sub-Kelvin Cryostat Acoustic Hum at 55Hz + 110Hz harmonics.
 */
export const toggleCryoHum55_110 = (enable?: boolean): boolean => {
  try {
    const ctx = getAudioContext();
    if (cryoHumGain) {
      if (enable === true) return true;
      cryoHumOsc1?.stop();
      cryoHumOsc1?.disconnect();
      cryoHumOsc2?.stop();
      cryoHumOsc2?.disconnect();
      cryoHumGain.disconnect();
      cryoHumOsc1 = null;
      cryoHumOsc2 = null;
      cryoHumGain = null;
      return false;
    } else {
      if (enable === false) return false;
      cryoHumGain = ctx.createGain();
      cryoHumGain.gain.setValueAtTime(0.015, ctx.currentTime);
      cryoHumGain.connect(masterGain || ctx.destination);

      cryoHumOsc1 = ctx.createOscillator();
      cryoHumOsc1.type = 'sine';
      cryoHumOsc1.frequency.setValueAtTime(55, ctx.currentTime);
      cryoHumOsc1.connect(cryoHumGain);
      cryoHumOsc1.start();

      cryoHumOsc2 = ctx.createOscillator();
      cryoHumOsc2.type = 'sine';
      cryoHumOsc2.frequency.setValueAtTime(110, ctx.currentTime);
      cryoHumOsc2.connect(cryoHumGain);
      cryoHumOsc2.start();

      return true;
    }
  } catch (e) {
    console.warn('Cryo hum audio error:', e);
    return false;
  }
};

export const isCryoHumActive = (): boolean => {
  return cryoHumGain !== null;
};

export interface AudioSynthesizerStatus {
  state: AudioContextState | 'uninitialized';
  frequency: number;
  sampleRate: number;
  profileId: string;
  isCarrierActive: boolean;
}

export function getAudioSynthesizerStatus(): AudioSynthesizerStatus {
  const isRunning = audioCtx !== null && audioCtx.state === 'running';
  const profile = AUDIO_PROFILES.find((p) => p.id === activeProfileId) || AUDIO_PROFILES[1];
  return {
    state: audioCtx ? audioCtx.state : 'uninitialized',
    frequency: profile ? profile.baseFreq : 882,
    sampleRate: audioCtx ? audioCtx.sampleRate : 48000,
    profileId: activeProfileId || 'circuitry',
    isCarrierActive: sovereignOscillator !== null || isRunning,
  };
}

export async function restartAudioSynthesizer(): Promise<boolean> {
  try {
    if (audioCtx) {
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
    } else {
      getAudioContext();
    }
    playTone(882, 0.05, 'sine', 0.05);
    return true;
  } catch (e) {
    console.warn('Failed to restart Audio Synthesizer:', e);
    return false;
  }
}


