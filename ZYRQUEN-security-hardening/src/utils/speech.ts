// Speech Recognition & Text-to-Speech manager for CodeVoice AI with real-time MediaStream capture

// Extend window for webkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface SpeechRecognitionHandlers {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onStart: (stream: MediaStream | null) => void;
  onEnd: () => void;
}

export class SpeechManager {
  private recognition: any = null;
  private isListening: boolean = false;
  private currentAudio: HTMLAudioElement | null = null;
  private isSpeaking: boolean = false;
  private currentStream: MediaStream | null = null;

  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'th-TH'; // Default to Thai as specified in brief
    }
  }

  public isRecognitionSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public setLanguage(lang: 'th-TH' | 'en-US') {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public async startListening(handlers: SpeechRecognitionHandlers) {
    if (!this.recognition) {
      handlers.onError('เบราว์เซอร์นี้ยังไม่รองรับ Speech Recognition โดยตรง กรุณาใช้ Chrome หรือพิมพ์ข้อความแทนครับ');
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    // Capture microphone audio stream for the visualizer
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (err) {
      console.warn('Microphone stream access warning:', err);
      // Still proceed with speech recognition even if visualizer stream has issue
    }

    this.recognition.onstart = () => {
      this.isListening = true;
      handlers.onStart(this.currentStream);
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const text = finalTranscript || interimTranscript;
      handlers.onResult(text, Boolean(finalTranscript));
    };

    this.recognition.onerror = (event: any) => {
      this.cleanupStream();
      this.isListening = false;
      const errorMsg = event.error === 'not-allowed'
        ? 'ไมโครโฟนถูกบล็อก กรุณาอนุญาตการเข้าถึงไมโครโฟนในเบราว์เซอร์'
        : `ข้อผิดพลาดของเสียง: ${event.error}`;
      handlers.onError(errorMsg);
    };

    this.recognition.onend = () => {
      this.cleanupStream();
      this.isListening = false;
      handlers.onEnd();
    };

    try {
      this.recognition.start();
    } catch (err: any) {
      this.cleanupStream();
      console.error('Error starting recognition:', err);
      handlers.onError(err.message || 'ไม่สามารถเปิดไมโครโฟนได้');
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.isListening = false;
    }
    this.cleanupStream();
  }

  private cleanupStream() {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
      this.currentStream = null;
    }
  }

  public getAudioStream(): MediaStream | null {
    return this.currentStream;
  }

  private clientCooldownUntil: number = 0;

  // Text-To-Speech: Call Gemini TTS endpoint, with graceful Web Speech Synthesis fallback
  public async speakText(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    voiceName: string = 'Puck'
  ): Promise<void> {
    if (!text) return;
    this.stopSpeaking();

    this.isSpeaking = true;
    onStart?.();

    // If client is in TTS cooldown, go straight to Web Speech API
    if (Date.now() < this.clientCooldownUntil) {
      this.fallbackWebSpeech(text, onEnd);
      return;
    }

    try {
      // 1. Try Gemini TTS via server API
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: voiceName }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reason === 'quota_exceeded' || data.reason === 'quota_cooldown') {
          this.clientCooldownUntil = Date.now() + (data.cooldownRemainingMs || 30 * 60 * 1000);
          this.fallbackWebSpeech(text, onEnd);
          return;
        }

        if (data.audioBase64) {
          const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
          this.currentAudio = audio;

          audio.onended = () => {
            this.isSpeaking = false;
            this.currentAudio = null;
            onEnd?.();
          };

          audio.onerror = () => {
            this.fallbackWebSpeech(text, onEnd);
          };

          await audio.play();
          return;
        }
      }
      // If server TTS responded with fallback flag or no audio:
      this.fallbackWebSpeech(text, onEnd);
    } catch (err) {
      this.fallbackWebSpeech(text, onEnd);
    }
  }

  private fallbackWebSpeech(text: string, onEnd?: () => void) {
    if (!('speechSynthesis' in window)) {
      this.isSpeaking = false;
      onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Choose appropriate voice
      const voices = window.speechSynthesis.getVoices();
      const thaiVoice = voices.find(v => v.lang.startsWith('th') || v.lang.includes('th'));
      if (thaiVoice) {
        utterance.voice = thaiVoice;
        utterance.lang = 'th-TH';
      } else {
        utterance.lang = 'th-TH';
      }

      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        this.isSpeaking = false;
        onEnd?.();
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      this.isSpeaking = false;
      onEnd?.();
    }
  }

  // Interrupt: immediately stop audio playback and voice synthesis
  public stopSpeaking() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const speechManager = new SpeechManager();
