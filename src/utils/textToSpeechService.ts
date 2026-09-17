// Text-to-Speech (TTS) Low-Latency Sovereign Feedback Loop
// Provides verbal audio notifications for 'Critical' or 'Anomaly' system events

export interface TTSConfig {
  enabled: boolean;
  rate: number;
  pitch: number;
  volume: number;
  language: 'th' | 'en' | 'auto';
  announceCritical: boolean;
  announceAnomaly: boolean;
  announceWarning: boolean;
}

const STORAGE_KEY_ENABLED = 'zyrquen_tts_warnings_enabled';
const STORAGE_KEY_CONFIG = 'zyrquen_tts_config';

const DEFAULT_CONFIG: TTSConfig = {
  enabled: true,
  rate: 1.08,
  pitch: 0.96,
  volume: 0.9,
  language: 'auto',
  announceCritical: true,
  announceAnomaly: true,
  announceWarning: false,
};

let currentConfig: TTSConfig = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    }
    const legacyEnabled = localStorage.getItem(STORAGE_KEY_ENABLED);
    if (legacyEnabled !== null) {
      return { ...DEFAULT_CONFIG, enabled: JSON.parse(legacyEnabled) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_CONFIG;
})();

// Listeners for configuration updates across UI components
const listeners: Array<(config: TTSConfig) => void> = [];

export const getTTSConfig = (): TTSConfig => ({ ...currentConfig });

export const updateTTSConfig = (newConfig: Partial<TTSConfig>) => {
  currentConfig = { ...currentConfig, ...newConfig };
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(currentConfig));
    localStorage.setItem(STORAGE_KEY_ENABLED, JSON.stringify(currentConfig.enabled));
  } catch (e) {
    console.error('Failed to persist TTS config:', e);
  }
  listeners.forEach((fn) => fn(currentConfig));
};

export const toggleTTSEnabled = (enabled?: boolean): boolean => {
  const next = enabled !== undefined ? enabled : !currentConfig.enabled;
  updateTTSConfig({ enabled: next });
  return next;
};

export const subscribeTTSConfig = (fn: (config: TTSConfig) => void) => {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx !== -1) listeners.splice(idx, 1);
  };
};

/**
 * Checks if a string contains Thai characters
 */
export const containsThai = (text: string): boolean => {
  return /[\u0E00-\u0E7F]/.test(text);
};

let activeUtterance: SpeechSynthesisUtterance | null = null;
let lastSpokenText = '';
let lastSpokenTime = 0;

/**
 * Speaks a verbal low-latency system alert using Web Speech API
 */
export const speakSystemAlert = (
  text: string,
  priority: 'critical' | 'anomaly' | 'warning' | 'info' = 'critical',
  forcedLang?: 'th' | 'en'
): boolean => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  if (!currentConfig.enabled) {
    return false;
  }

  // Filter based on severity toggles
  if (priority === 'critical' && !currentConfig.announceCritical) return false;
  if (priority === 'anomaly' && !currentConfig.announceAnomaly) return false;
  if (priority === 'warning' && !currentConfig.announceWarning) return false;
  if (priority === 'info') return false; // Info is silent by default for clean audio UX

  // Anti-spam debounce (prevent repeated speech within 3 seconds for identical phrase)
  const now = Date.now();
  if (text === lastSpokenText && now - lastSpokenTime < 3000) {
    return false;
  }

  try {
    const synth = window.speechSynthesis;

    // Interrupt prior speech for high-priority critical alerts
    if (priority === 'critical' || priority === 'anomaly') {
      synth.cancel();
    }

    // Determine target language
    let langCode = 'en-US';
    if (forcedLang === 'th' || (currentConfig.language === 'auto' && containsThai(text)) || currentConfig.language === 'th') {
      langCode = 'th-TH';
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = currentConfig.rate;
    utterance.pitch = currentConfig.pitch;
    utterance.volume = currentConfig.volume;

    // Try finding an authoritative voice for the chosen language
    const voices = synth.getVoices();
    if (voices.length > 0) {
      const matchingVoice = voices.find((v) =>
        langCode.startsWith('th') ? v.lang.includes('th') : v.lang.includes('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Siri') || v.name.includes('Enhanced'))
      ) || voices.find((v) => v.lang.startsWith(langCode.slice(0, 2)));

      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }
    }

    utterance.onstart = () => {
      activeUtterance = utterance;
    };
    utterance.onend = () => {
      if (activeUtterance === utterance) activeUtterance = null;
    };
    utterance.onerror = (e) => {
      console.warn('TTS playback error:', e);
      if (activeUtterance === utterance) activeUtterance = null;
    };

    lastSpokenText = text;
    lastSpokenTime = now;

    synth.speak(utterance);
    return true;
  } catch (err) {
    console.warn('Speech synthesis invocation failed:', err);
    return false;
  }
};

/**
 * Format a system event into a concise, low-latency verbal phrase
 */
export const announceSystemEventVerbal = (
  type: string,
  title: string,
  severity: 'info' | 'warning' | 'critical' | 'success' = 'info'
) => {
  if (severity === 'critical' || type === 'ANOMALY') {
    // Concise phrasing for fast verbal audio delivery
    const cleanTitle = title.replace(/[#•\-_]/g, ' ').replace(/\s+/g, ' ').trim();
    if (containsThai(cleanTitle)) {
      speakSystemAlert(`แจ้งเตือนฉุกเฉิน: ${cleanTitle}`, 'critical', 'th');
    } else {
      speakSystemAlert(`Critical alert: ${cleanTitle}`, 'critical', 'en');
    }
  } else if (severity === 'warning' && currentConfig.announceWarning) {
    const cleanTitle = title.replace(/[#•\-_]/g, ' ').replace(/\s+/g, ' ').trim();
    if (containsThai(cleanTitle)) {
      speakSystemAlert(`คำเตือน: ${cleanTitle}`, 'warning', 'th');
    } else {
      speakSystemAlert(`System warning: ${cleanTitle}`, 'warning', 'en');
    }
  }
};
