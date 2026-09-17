const fs = require('fs');
let code = fs.readFileSync('src/components/AudioSynthesizer.ts', 'utf-8');

code = code.replace(
  `export type AudioProfileId = 'deep-space' | 'circuitry' | 'neural-sync' | 'cryo-vacuum' | 'sovereign-harmonic';`,
  `export type AudioProfileId = 'deep-space' | 'quantum-lattice' | 'binary-rain' | 'circuitry' | 'neural-sync' | 'cryo-vacuum' | 'sovereign-harmonic';`
);

code = code.replace(
  `export const AUDIO_PROFILES: AudioProfile[] = [
  {
    id: 'deep-space',
    name: 'Deep Space Drone',
    subtitle: '432 Hz Cosmic Carrier + 54 Hz Sub-Bass',`,
  `export const AUDIO_PROFILES: AudioProfile[] = [
  {
    id: 'deep-space',
    name: 'Deep Space',
    subtitle: '432 Hz Cosmic Carrier + 54 Hz Sub-Bass',`
);

code = code.replace(
  `export const AUDIO_PROFILES: AudioProfile[] = [
  {`,
  `export const AUDIO_PROFILES: AudioProfile[] = [
  {
    id: 'quantum-lattice',
    name: 'Quantum Lattice',
    subtitle: '741 Hz Resonance + 111 Hz Harmonic',
    baseFreq: 741,
    subFreq: 111,
    lfoFreq: 3.0,
    type: 'triangle',
    description: 'Crisp quantum structural vibrations.',
    color: 'from-violet-500/20 to-fuchsia-500/20 text-violet-300 border-violet-500/30',
  },
  {
    id: 'binary-rain',
    name: 'Binary Rain',
    subtitle: '1024 Hz Data Stream + 256 Hz Backing',
    baseFreq: 1024,
    subFreq: 256,
    lfoFreq: 8.0,
    type: 'square',
    description: 'Rapid digital oscillation mimicking data streams.',
    color: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30',
  },
  {`
);

fs.writeFileSync('src/components/AudioSynthesizer.ts', code);
