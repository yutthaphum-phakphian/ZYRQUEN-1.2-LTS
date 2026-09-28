import { useEffect, useState, useCallback, useRef } from 'react';
import { ViewType } from '../types';
import { SystemEvent } from '../components/SystemEventsSidebar';
import { offlineAuditSyncService } from '../services/offlineAuditSyncService';
import {
  speakSystemAlert,
  announceSecurityLockdown,
  announceHandsFreeBriefing,
  repeatLastAnnouncement,
} from '../utils/textToSpeechService';

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      length: number;
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent {
  error?: string;
  message?: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

interface CustomSpeechWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  _recognition?: SpeechRecognitionInstance;
}

export const useVoiceCommand = (
  onNavigate: (view: ViewType) => void,
  onCaptureSnapshot: () => void,
  onNotifyEvent: (type: SystemEvent['type'], title: string, desc: string, meta?: string, sev?: SystemEvent['severity']) => void
) => {
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>('');

  const callbacksRef = useRef({ onNavigate, onCaptureSnapshot, onNotifyEvent });
  useEffect(() => {
    callbacksRef.current = { onNavigate, onCaptureSnapshot, onNotifyEvent };
  }, [onNavigate, onCaptureSnapshot, onNotifyEvent]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const customWindow = window as unknown as CustomSpeechWindow;
    const SpeechRecognition = customWindow.SpeechRecognition || customWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      const errCode = event?.error || 'recognition-unavailable';
      if (errCode !== 'no-speech' && errCode !== 'aborted') {
        callbacksRef.current.onNotifyEvent(
          'AUDIO',
          'Voice Input Boundary Notice',
          `Speech recognition unavailable (${errCode}). Use text input or grant microphone permission.`,
          `voice:error:${errCode}`,
          'warning'
        );
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const {
        onNavigate: nav,
        onCaptureSnapshot: snap,
        onNotifyEvent: notify,
      } = callbacksRef.current;

      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
      setLastCommand(transcript);

      try {
        offlineAuditSyncService.enqueueEvent({
          type: 'COMPLIANCE',
          title: 'Voice Input Captured (VOICE_STT)',
          description: `Transcript="${transcript}" | Enforcing VOICE != AUTHORIZATION boundary.`,
          metaHash: `voice-input:${Date.now()}`,
          severity: 'info',
          statuteRef: 'VOICE != AUTHORIZATION · ETDA Sec 26 Audit Trail',
        });
      } catch {
        // Ignore storage errors in restricted environments
      }

      // Authorization Boundary Guard: Voice write/tuning commands must route through Explicit Approval Gate
      if (
        transcript.includes('batch') ||
        transcript.includes('tune') ||
        transcript.includes('quota') ||
        transcript.includes('apply') ||
        transcript.includes('execute') ||
        transcript.includes('mutate') ||
        transcript.includes('override') ||
        transcript.includes('ปรับ') ||
        transcript.includes('แก้')
      ) {
        const proposedBatch = transcript.includes('48') ? 48 : 64;
        speakSystemAlert('Voice input cannot bypass authorization. Routing proposal to Explicit Approval Gate.', 'info');
        notify(
          'COMPLIANCE',
          'Voice Request Routed to Explicit Approval Gate',
          `Voice command "${transcript}" staged for #EP-SOVEREIGN-01 Explicit Approval (VOICE != AUTHORIZATION).`,
          'voice:explicit-approval-gate',
          'info'
        );
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('zyrquen-stage-ai-approval', {
              detail: {
                proposalId: `PROP-VOICE-${Date.now()}`,
                proposedBatchSize: proposedBatch,
                summary: `Voice Command Proposal ("${transcript}") -> BATCH_SIZE ${proposedBatch}`,
                channel: 'VOICE_STT',
                targetWorkspace: 'ws-agent-02',
              },
            })
          );
        }
        return;
      }

      const commandMap: Record<string, ViewType> = {
        'ai workspace': 'ai-workspace',
        'workspace': 'ai-workspace',
        'sandbox': 'ai-workspace',
        'sovereign': 'sovereign',
        'phase 11': 'sovereign',
        'dashboard': 'dashboard',
        'quantum': 'quantum',
        'nexus': 'nexus',
        'vault': 'vault',
        'ledger': 'ledger',
        'pulse': 'pulse',
        'forge': 'forge',
        'matrix': 'matrix',
        'archive': 'archive',
        'console': 'console',
        'security': 'security',
        'settings': 'settings',
        'council': 'council',
        'legal': 'legal',
        'law': 'legal',
        'pdpa': 'legal',
        'กฎหมาย': 'legal',
      };

      let matched = false;

      // Status briefing command (Hands-free operation)
      if (transcript.includes('briefing') || transcript.includes('status report') || transcript.includes('system status')) {
        announceHandsFreeBriefing({
          blockHeight: 849202,
          sealCount: 14902,
          drift: '0.00%',
          quorum: '10/10 REAL_HSM',
          tempMK: 14.98,
        });
        notify('AUDIO', 'Hands-Free Briefing Requested', 'Spoken system invariants report delivered.', 'voice:briefing', 'info');
        return;
      }

      // Repeat last announcement command
      if (transcript.includes('repeat') || transcript.includes('say again') || transcript.includes('what was that')) {
        repeatLastAnnouncement();
        return;
      }

      // Voice lockdown trigger
      if (transcript.includes('lockdown') || transcript.includes('quarantine protocol') || transcript.includes('isolate system')) {
        announceSecurityLockdown('engaged', {
          chamber: 'Chamber 02 Quarantine',
          reason: 'Voice command lockdown initiated hands-free',
        });
        notify('SECURITY', 'Voice Command Lockdown', 'Chamber 02 Quarantine engaged via verbal command.', 'voice:lockdown', 'critical');
        return;
      }

      // View switching
      for (const [key, view] of Object.entries(commandMap)) {
        if (transcript.includes(key)) {
          nav(view);
          speakSystemAlert(`Navigating to ${key}`, 'info');
          notify(
            'AUDIO',
            'Voice Command Executed',
            `Switched view to ${key.toUpperCase()}`,
            'voice:navigate',
            'info'
          );
          matched = true;
          break;
        }
      }

      // Snapshot trigger
      if (!matched && (transcript.includes('capture') || transcript.includes('snapshot'))) {
        snap();
        speakSystemAlert('Signed snapshot captured and sealed.', 'info');
        notify(
          'AUDIO',
          'Voice Command Executed',
          'Triggered hardware telemetry snapshot.',
          'voice:snapshot',
          'success'
        );
      }
    };

    customWindow._recognition = recognition;
    return () => {
      try {
        recognition.stop();
      } catch {
        // Ignore stop errors on unstarted instance
      }
    };
  }, []);

  const toggleListening = useCallback(() => {
    const customWindow = window as unknown as CustomSpeechWindow;
    const recognition = customWindow._recognition;
    if (!recognition) {
      callbacksRef.current.onNotifyEvent(
        'AUDIO',
        'Voice Input Unsupported',
        'Web Speech API is not available in this browser environment.',
        'voice:unsupported',
        'warning'
      );
      return;
    }
    try {
      if (isListening) {
        recognition.stop();
        setIsListening(false);
      } else {
        recognition.start();
      }
    } catch {
      setIsListening(false);
    }
  }, [isListening]);

  return { isListening, lastCommand, toggleListening };
};
