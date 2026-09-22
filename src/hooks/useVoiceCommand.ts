import { useEffect, useState, useCallback } from 'react';
import { ViewType } from '../types';
import { SystemEvent } from '../components/SystemEventsSidebar';

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

      // View switching
      for (const [key, view] of Object.entries(commandMap)) {
        if (transcript.includes(key)) {
          onNavigate(view);
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
