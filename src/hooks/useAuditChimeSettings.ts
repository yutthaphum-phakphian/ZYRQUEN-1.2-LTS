// src/hooks/useAuditChimeSettings.ts
import { useState, useEffect, useCallback } from 'react';
import {
  isAuditChimeEnabled,
  setAuditChimeEnabled,
  getAuditChimeVolume,
  setAuditChimeVolume,
  playAuditChime,
} from '../components/AudioSynthesizer';

export interface AuditChimeSettingsState {
  enabled: boolean;
  volume: number; // 0.0 to 1.0
  volumePercent: number; // 0 to 100
  setEnabled: (val: boolean) => void;
  setVolume: (vol: number) => void;
  setVolumePercent: (pct: number) => void;
  toggleEnabled: () => void;
  testChime: () => void;
}

export function useAuditChimeSettings(): AuditChimeSettingsState {
  const [enabled, setEnabledState] = useState<boolean>(isAuditChimeEnabled());
  const [volume, setVolumeState] = useState<number>(getAuditChimeVolume());

  useEffect(() => {
    const handleChimeChange = (e: Event) => {
      const custom = e as CustomEvent<{ enabled: boolean; volume: number }>;
      if (custom.detail) {
        setEnabledState(custom.detail.enabled);
        setVolumeState(custom.detail.volume);
      } else {
        setEnabledState(isAuditChimeEnabled());
        setVolumeState(getAuditChimeVolume());
      }
    };

    window.addEventListener('zyrquen_audit_chime_change', handleChimeChange);
    return () => {
      window.removeEventListener('zyrquen_audit_chime_change', handleChimeChange);
    };
  }, []);

  const handleSetEnabled = useCallback((val: boolean) => {
    setAuditChimeEnabled(val);
    setEnabledState(val);
  }, []);

  const handleToggle = useCallback(() => {
    const next = !isAuditChimeEnabled();
    handleSetEnabled(next);
  }, [handleSetEnabled]);

  const handleSetVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setAuditChimeVolume(clamped);
    setVolumeState(clamped);
  }, []);

  const handleSetVolumePercent = useCallback(
    (pct: number) => {
      const vol = Math.max(0, Math.min(100, pct)) / 100;
      handleSetVolume(vol);
    },
    [handleSetVolume]
  );

  const handleTestChime = useCallback(() => {
    playAuditChime();
  }, []);

  return {
    enabled,
    volume,
    volumePercent: Math.round(volume * 100),
    setEnabled: handleSetEnabled,
    setVolume: handleSetVolume,
    setVolumePercent: handleSetVolumePercent,
    toggleEnabled: handleToggle,
    testChime: handleTestChime,
  };
}
