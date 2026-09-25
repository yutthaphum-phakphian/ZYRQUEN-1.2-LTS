import { useEffect, useState, useCallback } from 'react';
import { ViewType } from '../types';
import { SystemEvent } from '../components/SystemEventsSidebar';
import {
  speakSystemAlert,
  announceSecurityLockdown,
  announceHandsFreeBriefing,
  repeatLastAnnouncement,
} from '../utils/textToSpeechService';

export const useVoiceCommand = (
  onNavigate: (view: ViewType) => void,
  onCaptureSnapshot: () => void,
  onNotifyEvent: (type: SystemEvent['type'], title: string, desc: string, meta?: string, sev?: SystemEvent['severity']) => void
) => {
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>('');

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onerror = (event: any) => {
      console.error("Voice command error", event);
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
      setLastCommand(transcript);

      const commandMap: Record<string, ViewType> = {
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
        onNotifyEvent('AUDIO', 'Hands-Free Briefing Requested', 'Spoken system invariants report delivered.', 'voice:briefing', 'info');
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
        onNotifyEvent('SECURITY', 'Voice Command Lockdown', 'Chamber 02 Quarantine engaged via verbal command.', 'voice:lockdown', 'critical');
        return;
      }

      // View switching
      for (const [key, view] of Object.entries(commandMap)) {
        if (transcript.includes(key)) {
          onNavigate(view);
          speakSystemAlert(`Navigating to ${key}`, 'info');
          onNotifyEvent(
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
        onCaptureSnapshot();
        speakSystemAlert('Signed snapshot captured and sealed.', 'info');
        onNotifyEvent(
          'AUDIO',
          'Voice Command Executed',
          'Triggered hardware telemetry snapshot.',
          'voice:snapshot',
          'success'
        );
      }
    };

    // Auto-restart if we want continuous listening, but here we just manage state
    // We'll expose a toggle function.
    (window as any)._recognition = recognition;
  }, [onNavigate, onCaptureSnapshot, onNotifyEvent]);

  const toggleListening = useCallback(() => {
    const recognition = (window as any)._recognition;
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  }, [isListening]);

  return { isListening, lastCommand, toggleListening };
};
