import { useState, useEffect, useCallback } from 'react';

function getStoredTimerMinutes(): number {
  if (typeof window === 'undefined') return 30;
  try {
    const val = localStorage.getItem('zyrquen_inactivity_timer');
    return val ? Number(val) : 30;
  } catch {
    return 30;
  }
}

/**
 * SSR-safe inactivity lock hook that monitors user interactions and locks the session
 * after a configurable inactivity threshold.
 */
export function useInactivityLock() {
  const [isAppLocked, setIsAppLocked] = useState<boolean>(false);
  const [inactivityTimerMinutes, setInactivityTimerMinutes] = useState<number>(getStoredTimerMinutes);

  const unlockApp = useCallback(() => {
    setIsAppLocked(false);
  }, []);

  const updateInactivityTimerMinutes = useCallback((minutes: number) => {
    setInactivityTimerMinutes(minutes);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('zyrquen_inactivity_timer', String(minutes));
        window.dispatchEvent(new Event('zyrquen_inactivity_timer_updated'));
      } catch {
        // Ignore storage errors
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      if (!isAppLocked && inactivityTimerMinutes > 0) {
        timeoutId = setTimeout(() => {
          setIsAppLocked(true);
        }, inactivityTimerMinutes * 60 * 1000);
      }
    };

    const handleActivity = () => resetTimer();

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    resetTimer();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'zyrquen_inactivity_timer') {
        setInactivityTimerMinutes(getStoredTimerMinutes());
      }
    };
    window.addEventListener('storage', handleStorageChange);

    const handleLocalSettingsChange = () => {
      setInactivityTimerMinutes(getStoredTimerMinutes());
      resetTimer();
    };
    window.addEventListener('zyrquen_inactivity_timer_updated', handleLocalSettingsChange);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('zyrquen_inactivity_timer_updated', handleLocalSettingsChange);
    };
  }, [isAppLocked, inactivityTimerMinutes]);

  return {
    isAppLocked,
    setIsAppLocked,
    unlockApp,
    inactivityTimerMinutes,
    updateInactivityTimerMinutes,
  };
}
