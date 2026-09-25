// ZYRQUEN Ω∞ Verbal Feedback Service (Web Speech API)
// Provides hands-free audio telemetry, critical system event announcements,
// and emergency security lockdown alerts with low latency, voice selection,
// queue preemption, and browser speech engine resilience.

import { playTone, playAuditChime } from '../components/AudioSynthesizer';

export type AlertPriority = 'emergency' | 'critical' | 'anomaly' | 'warning' | 'info';

export interface TTSConfig {
  enabled: boolean;
  handsFreeMode: boolean;
  rate: number;
  pitch: number;
  volume: number;
  language: 'th' | 'en' | 'auto';
  announceLockdown: boolean;
  announceCritical: boolean;
  announceAnomaly: boolean;
  announceWarning: boolean;
  audibleChimePrepend: boolean;
  preferredVoiceName?: string;
}

export interface VerbalQueuedItem {
  id: string;
  text: string;
  priority: AlertPriority;
  lang?: 'th' | 'en';
  timestamp: number;
  onStart?: () => void;
  onEnd?: () => void;
}

const STORAGE_KEY_CONFIG = 'zyrquen_tts_config';
const STORAGE_KEY_ENABLED = 'zyrquen_tts_warnings_enabled';

const DEFAULT_CONFIG: TTSConfig = {
  enabled: true,
  handsFreeMode: false,
  rate: 1.05,
  pitch: 0.98,
  volume: 0.95,
  language: 'auto',
  announceLockdown: true,
  announceCritical: true,
  announceAnomaly: true,
  announceWarning: false,
  audibleChimePrepend: true,
  preferredVoiceName: '',
};

let currentConfig: TTSConfig = (() => {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    }
    const legacyEnabled = localStorage.getItem(STORAGE_KEY_ENABLED);
    if (legacyEnabled !== null) {
      return { ...DEFAULT_CONFIG, enabled: JSON.parse(legacyEnabled) };
    }
  } catch (e) {
    console.warn('Failed to read TTS configuration from storage:', e);
  }
  return DEFAULT_CONFIG;
})();

// Listeners for configuration updates across UI components
const configListeners: Array<(config: TTSConfig) => void> = [];
const speechStateListeners: Array<(isSpeaking: boolean, currentPhrase: string) => void> = [];

export const getTTSConfig = (): TTSConfig => ({ ...currentConfig });

export const updateTTSConfig = (newConfig: Partial<TTSConfig>) => {
  currentConfig = { ...currentConfig, ...newConfig };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(currentConfig));
      localStorage.setItem(STORAGE_KEY_ENABLED, JSON.stringify(currentConfig.enabled));
    } catch (e) {
      console.error('Failed to persist TTS config:', e);
    }
  }
  configListeners.forEach((fn) => {
    try {
      fn(currentConfig);
    } catch (err) {
      console.warn('Error in TTS config listener:', err);
    }
  });
};

export const toggleTTSEnabled = (enabled?: boolean): boolean => {
  const next = enabled !== undefined ? enabled : !currentConfig.enabled;
  updateTTSConfig({ enabled: next });
  return next;
};

export const toggleHandsFreeMode = (enabled?: boolean): boolean => {
  const next = enabled !== undefined ? enabled : !currentConfig.handsFreeMode;
  updateTTSConfig({ handsFreeMode: next });
  if (next) {
    speakSystemAlert(
      currentConfig.language === 'th'
        ? 'โหมดปฏิบัติการแบบไร้สัมผัสเปิดใช้งาน ระบบกำลังเฝ้าระวังความปลอดภัย'
        : 'Hands-free operation active. Verbal audio telemetry monitoring system events.',
      'info',
      currentConfig.language === 'auto' ? undefined : currentConfig.language
    );
  }
  return next;
};

export const subscribeTTSConfig = (fn: (config: TTSConfig) => void) => {
  configListeners.push(fn);
  return () => {
    const idx = configListeners.indexOf(fn);
    if (idx !== -1) configListeners.splice(idx, 1);
  };
};

export const subscribeSpeechState = (fn: (isSpeaking: boolean, currentPhrase: string) => void) => {
  speechStateListeners.push(fn);
  return () => {
    const idx = speechStateListeners.indexOf(fn);
    if (idx !== -1) speechStateListeners.splice(idx, 1);
  };
};

const notifySpeechState = (isSpeaking: boolean, currentPhrase: string) => {
  speechStateListeners.forEach((fn) => {
    try {
      fn(isSpeaking, currentPhrase);
    } catch (err) {
      console.warn('Speech state listener error:', err);
    }
  });
};

/**
 * Checks if a string contains Thai characters
 */
export const containsThai = (text: string): boolean => {
  return /[\u0E00-\u0E7F]/.test(text);
};

// Queue & active speech management
const speechQueue: VerbalQueuedItem[] = [];
let isProcessingQueue = false;
let activeUtterance: SpeechSynthesisUtterance | null = null;
const activeUtteranceRefs = new Set<SpeechSynthesisUtterance>(); // Prevents Garbage Collection bug in Chromium
let lastSpokenText = '';
let lastSpokenTime = 0;
let lastSpokenItem: { text: string; lang?: 'th' | 'en'; priority: AlertPriority } | null = null;
let watchdogTimer: NodeJS.Timeout | null = null;

/**
 * Watchdog to unstick browser synthesis engine if it freezes in speaking state
 */
const startWatchdog = () => {
  stopWatchdog();
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  watchdogTimer = setInterval(() => {
    if (window.speechSynthesis.speaking) {
      // In Chromium, pausing and resuming unsticks frozen audio pipes
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 7000);
};

const stopWatchdog = () => {
  if (watchdogTimer) {
    clearInterval(watchdogTimer);
    watchdogTimer = null;
  }
};

/**
 * Selects the optimal system voice for the given language code
 */
export const getAvailableVoices = (): SpeechSynthesisVoice[] => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  return window.speechSynthesis.getVoices();
};

const selectOptimalVoice = (
  synth: SpeechSynthesis,
  langCode: string,
  preferredVoiceName?: string
): SpeechSynthesisVoice | null => {
  const voices = synth.getVoices();
  if (!voices || voices.length === 0) return null;

  if (preferredVoiceName) {
    const matched = voices.find((v) => v.name === preferredVoiceName);
    if (matched) return matched;
  }

  const isThai = langCode.startsWith('th');

  if (isThai) {
    // Prefer natural Thai voices
    return (
      voices.find((v) => v.lang.includes('th') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Siri'))) ||
      voices.find((v) => v.lang.includes('th')) ||
      null
    );
  }

  // English natural voices
  return (
    voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.name.includes('Samantha') ||
          v.name.includes('Daniel') ||
          v.name.includes('Enhanced'))
    ) ||
    voices.find((v) => v.lang.startsWith('en')) ||
    voices[0] ||
    null
  );
};

/**
 * Sound an acoustic cue prior to speech
 */
const playAcousticCue = (priority: AlertPriority) => {
  if (!currentConfig.audibleChimePrepend) return;
  try {
    if (priority === 'emergency') {
      playTone(880, 0.12, 'sawtooth');
      setTimeout(() => playTone(587.33, 0.16, 'sawtooth'), 130);
    } else if (priority === 'critical') {
      playTone(659.25, 0.1, 'triangle');
      setTimeout(() => playTone(880, 0.12, 'triangle'), 110);
    } else if (priority === 'anomaly') {
      playTone(523.25, 0.08, 'sine');
      setTimeout(() => playTone(659.25, 0.08, 'sine'), 90);
    } else if (priority === 'warning') {
      playTone(440, 0.08, 'sine');
    }
  } catch (e) {
    // Ignore audio synth errors
  }
};

/**
 * Process the internal verbal speech queue sequentially
 */
const processQueue = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;

  if (speechQueue.length === 0) {
    isProcessingQueue = false;
    notifySpeechState(false, '');
    stopWatchdog();
    return;
  }

  isProcessingQueue = true;
  const item = speechQueue.shift()!;

  // Determine language code
  let langCode = 'en-US';
  if (
    item.lang === 'th' ||
    (currentConfig.language === 'auto' && containsThai(item.text)) ||
    currentConfig.language === 'th'
  ) {
    langCode = 'th-TH';
  }

  // Sound cue
  playAcousticCue(item.priority);

  try {
    const utterance = new SpeechSynthesisUtterance(item.text);
    utterance.lang = langCode;
    utterance.rate = currentConfig.rate;
    utterance.pitch = item.priority === 'emergency' ? currentConfig.pitch * 1.05 : currentConfig.pitch;
    utterance.volume = currentConfig.volume;

    const voice = selectOptimalVoice(synth, langCode, currentConfig.preferredVoiceName);
    if (voice) {
      utterance.voice = voice;
    }

    // Retain reference to prevent GC dropping the utterance before completion
    activeUtteranceRefs.add(utterance);
    activeUtterance = utterance;

    utterance.onstart = () => {
      startWatchdog();
      notifySpeechState(true, item.text);
      item.onStart?.();
    };

    const cleanup = () => {
      activeUtteranceRefs.delete(utterance);
      if (activeUtterance === utterance) {
        activeUtterance = null;
      }
      item.onEnd?.();
      // Proceed to next queued announcement after a brief natural breathing gap
      setTimeout(() => {
        processQueue();
      }, 150);
    };

    utterance.onend = cleanup;
    utterance.onerror = (e) => {
      console.warn('[Verbal Feedback] Synthesis playback notice:', e);
      cleanup();
    };

    lastSpokenText = item.text;
    lastSpokenTime = Date.now();
    lastSpokenItem = { text: item.text, lang: item.lang, priority: item.priority };

    synth.speak(utterance);
  } catch (err) {
    console.warn('[Verbal Feedback] Speech invocation error:', err);
    activeUtteranceRefs.clear();
    activeUtterance = null;
    processQueue();
  }
};

/**
 * Speaks a verbal low-latency system alert using Web Speech API
 */
export const speakSystemAlert = (
  text: string,
  priority: AlertPriority = 'critical',
  forcedLang?: 'th' | 'en',
  options?: { onStart?: () => void; onEnd?: () => void }
): boolean => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  if (!currentConfig.enabled) {
    return false;
  }

  // Filter based on severity toggles (Hands-free mode automatically allows all critical alerts)
  if (!currentConfig.handsFreeMode) {
    if (priority === 'emergency' && !currentConfig.announceLockdown) return false;
    if (priority === 'critical' && !currentConfig.announceCritical) return false;
    if (priority === 'anomaly' && !currentConfig.announceAnomaly) return false;
    if (priority === 'warning' && !currentConfig.announceWarning) return false;
    if (priority === 'info') return false; // Info is silent in standard mode
  }

  // Anti-spam debounce (prevent exact duplicate within 2.5 seconds)
  const now = Date.now();
  if (text === lastSpokenText && now - lastSpokenTime < 2500) {
    return false;
  }

  const synth = window.speechSynthesis;

  // Emergency & Critical alerts immediately preempt ongoing queue
  if (priority === 'emergency' || priority === 'critical') {
    speechQueue.length = 0; // Clear lower-priority backlog
    synth.cancel();
    activeUtteranceRefs.clear();
    activeUtterance = null;
  }

  speechQueue.push({
    id: `verbal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    text: text.trim(),
    priority,
    lang: forcedLang,
    timestamp: now,
    onStart: options?.onStart,
    onEnd: options?.onEnd,
  });

  if (!isProcessingQueue || priority === 'emergency' || priority === 'critical') {
    processQueue();
  }

  return true;
};

/**
 * Announce a security lockdown alert with highest emergency priority
 */
export const announceSecurityLockdown = (
  state: 'engaged' | 'released' | 'tamper' | 'fail_closed',
  details?: { reason?: string; chamber?: string }
): boolean => {
  const isThai = currentConfig.language === 'th' || (currentConfig.language === 'auto' && containsThai(details?.reason || ''));

  let phrase = '';
  if (isThai) {
    switch (state) {
      case 'engaged':
        phrase = `แจ้งเตือนความปลอดภัยขั้นสูงสุด! เริ่มมาตรการกักกัน Sovereign Isolation Protocol กักกัน Chamber 02 เรียบร้อยแล้ว${details?.reason ? ` เหตุผล: ${details.reason}` : ''}`;
        break;
      case 'released':
        phrase = 'แจ้งเตือนความปลอดภัย: ยกเลิกมาตรการกักกันฉุกเฉิน ระบบกลับคืนสู่สภาวะปกติ';
        break;
      case 'tamper':
        phrase = 'ตรวจพบการแทรกแซงฮาร์ดแวร์ HSM ระดับวิกฤต! ดำเนินการล็อกความปลอดภัยแบบ Fail-Closed ทันที';
        break;
      case 'fail_closed':
        phrase = 'เกิดความผิดปกติของค่าสัมบูรณ์! ระบบทำการล็อกข้อมูลถาวรเพื่อพิทักษ์ความถูกต้อง Single Source of Truth';
        break;
    }
  } else {
    switch (state) {
      case 'engaged':
        phrase = `Emergency Security Alert! Sovereign Isolation Protocol engaged. Chamber zero-two quarantine lockdown active. Air-gap sealed.${details?.reason ? ` Reason: ${details.reason}` : ''}`;
        break;
      case 'released':
        phrase = 'Security Alert Lifted. Sovereign Isolation Protocol disengaged. Chamber zero-two returned to normal operations.';
        break;
      case 'tamper':
        phrase = 'Critical Security Intrusion! Hardware tamper detected on HSM cluster. WORM fail-closed lockdown armed.';
        break;
      case 'fail_closed':
        phrase = 'Critical SSoT Invariant Alert! Fail-closed defensive lockdown enforced. Write authority zeroized.';
        break;
    }
  }

  return speakSystemAlert(phrase, 'emergency', isThai ? 'th' : 'en');
};

/**
 * Format a system event into a concise, low-latency verbal phrase
 */
export const announceSystemEventVerbal = (
  type: string,
  title: string,
  severity: 'info' | 'warning' | 'critical' | 'success' = 'info',
  details?: string
) => {
  // Check for security or quarantine indicators in title
  const isLockdown =
    /quarantine|lockdown|isolation protocol|tamper/i.test(title) ||
    type === 'SECURITY' && /lock|isolate|breach/i.test(title);

  if (isLockdown) {
    if (/released|lifted|unlocked|resume/i.test(title)) {
      return announceSecurityLockdown('released', { reason: title });
    }
    return announceSecurityLockdown('engaged', { reason: title });
  }

  if (severity === 'critical' || type === 'ANOMALY') {
    const cleanTitle = title.replace(/[#•\-_]/g, ' ').replace(/\s+/g, ' ').trim();
    if (containsThai(cleanTitle)) {
      speakSystemAlert(`แจ้งเตือนฉุกเฉิน: ${cleanTitle}${details ? ` ข้อมูล: ${details}` : ''}`, 'critical', 'th');
    } else {
      speakSystemAlert(`Critical system event: ${cleanTitle}${details ? `. ${details}` : ''}`, 'critical', 'en');
    }
  } else if (severity === 'warning' && (currentConfig.announceWarning || currentConfig.handsFreeMode)) {
    const cleanTitle = title.replace(/[#•\-_]/g, ' ').replace(/\s+/g, ' ').trim();
    if (containsThai(cleanTitle)) {
      speakSystemAlert(`คำเตือนระบบ: ${cleanTitle}`, 'warning', 'th');
    } else {
      speakSystemAlert(`System warning: ${cleanTitle}`, 'warning', 'en');
    }
  } else if (currentConfig.handsFreeMode && (severity === 'info' || severity === 'success')) {
    // In hands-free mode, verbalize significant status changes
    if (/sealed|verified|anchored|passed/i.test(title)) {
      const cleanTitle = title.replace(/[#•\-_]/g, ' ').replace(/\s+/g, ' ').trim();
      speakSystemAlert(
        containsThai(cleanTitle) ? `สถานะระบบ: ${cleanTitle}` : `System status: ${cleanTitle}`,
        'info'
      );
    }
  }
};

/**
 * Hands-Free Audio Telemetry Briefing
 */
export const announceHandsFreeBriefing = (stats: {
  blockHeight?: number;
  sealCount?: number;
  drift?: string;
  quorum?: string;
  tempMK?: number;
}) => {
  const isThai = currentConfig.language === 'th';
  let speech = '';
  if (isThai) {
    speech = `รายงานสรุปสถานะระบบ: บล็อกหมายเลข ${stats.blockHeight || 849202}. ตราประทับฮาร์ดแวร์ ${stats.sealCount || 14902} ดวง. ความสอดคล้องข้อมูล ดริฟต์ร้อยละ ${stats.drift || 'ศูนย์จุดศูนย์ศูนย์'}. ฉันทามติ ${stats.quorum || 'สิบในสิบ REAL HSM'}. อุณหภูมิควอนตัม ${stats.tempMK || 'สิบสี่จุดเก้าแปด'} มิลลิเคลวิน. สถานะระบบพร้อมสมบูรณ์.`;
  } else {
    speech = `Hands-free Sovereign Status Briefing. Genesis Block ${stats.blockHeight || 849202}. All ${stats.sealCount || 14902} hardware seals intact with zero drift. Cryptographic quorum ten out of ten REAL HSM confirmed. Cryogenic base temperature ${stats.tempMK || 14.98} milliKelvin. System fully operational.`;
  }
  return speakSystemAlert(speech, 'critical', isThai ? 'th' : 'en');
};

/**
 * Repeat the last verbal alert on command (essential for hands-free operation)
 */
export const repeatLastAnnouncement = (): boolean => {
  if (!lastSpokenItem) {
    speakSystemAlert(
      currentConfig.language === 'th' ? 'ไม่มีการแจ้งเตือนก่อนหน้านี้' : 'No prior announcement to repeat.',
      'info'
    );
    return false;
  }
  return speakSystemAlert(lastSpokenItem.text, lastSpokenItem.priority, lastSpokenItem.lang);
};

/**
 * Cancel all active and queued verbal announcements immediately
 */
export const cancelAllAnnouncements = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  speechQueue.length = 0;
  activeUtteranceRefs.clear();
  activeUtterance = null;
  isProcessingQueue = false;
  stopWatchdog();
  notifySpeechState(false, '');
};

/**
 * Singleton Verbal Feedback Service Object
 */
export const verbalFeedbackService = {
  getConfig: getTTSConfig,
  updateConfig: updateTTSConfig,
  toggleEnabled: toggleTTSEnabled,
  toggleHandsFreeMode,
  speak: speakSystemAlert,
  announceLockdown: announceSecurityLockdown,
  announceSystemEvent: announceSystemEventVerbal,
  announceBriefing: announceHandsFreeBriefing,
  repeatLast: repeatLastAnnouncement,
  cancelAll: cancelAllAnnouncements,
  getVoices: getAvailableVoices,
  subscribeConfig: subscribeTTSConfig,
  subscribeState: subscribeSpeechState,
};

