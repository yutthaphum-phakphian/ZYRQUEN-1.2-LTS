// Web Audio synthesizer for Chamber 15 🔊 Sonic Alert System
let audioCtx: AudioContext | null = null;

export function playSovereignTone(type: 'chime' | 'alert' | 'ping' | 'hsm') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'chime') {
      // 432 Hz and harmonic 864 Hz
      osc.type = 'sine';
      osc.frequency.setValueAtTime(432, now);
      osc.frequency.exponentialRampToValueAtTime(528, now + 0.2);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
      osc.start(now);
      osc.stop(now + 0.8);
    } else if (type === 'alert') {
      // Emergency thermal alert tone
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(440, now + 0.15);
      osc.frequency.setValueAtTime(880, now + 0.3);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (type === 'hsm') {
      // High precision HSM lock click
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1024, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else {
      // Quantum ping
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (err) {
    console.warn("Audio Context error:", err);
  }
}
