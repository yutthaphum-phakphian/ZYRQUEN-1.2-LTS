// WebAudio and Web Speech synthesis service for Chamber 15 and OTel Audio telemetry

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public playTelemetryBeacon(freq: number = 880, duration: number = 0.08) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Ignore audio policy restrictions
    }
  }

  public playPhoenixChime() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const freqs = [528, 660, 792, 1056];
      freqs.forEach((f, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, this.ctx!.currentTime + idx * 0.04);
        
        gain.gain.setValueAtTime(0.05, this.ctx!.currentTime + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx!.currentTime + idx * 0.04 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(this.ctx!.currentTime + idx * 0.04);
        osc.stop(this.ctx!.currentTime + idx * 0.04 + 0.35);
      });
    } catch {
      // Ignore
    }
  }

  public playAlertBuzz() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {
      // Ignore
    }
  }

  public speakAnnouncement(text: string, lang: 'th-TH' | 'en-US' = 'en-US') {
    if (this.isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore
    }
  }
}

export const soundFx = new AudioEngine();
