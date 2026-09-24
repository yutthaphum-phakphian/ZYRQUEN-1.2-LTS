// src/hooks/useOfflineWarning.ts
import { useEffect } from 'react';
import { toast } from '../utils/toast';

export const useOfflineWarning = () => {
  useEffect(() => {
    const handleOffline = () => {
      toast.warning('Browser is offline. Some features may not work properly.', {
        toastId: 'offline-warning-toast', // ป้องกันการแสดงผล Toast ซ้ำ
      });
    };

    const handleOnline = () => {
      toast.success('Connection restored.');
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // ตรวจสอบสถานะทันทีเมื่อโหลด Component
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);
};

export default useOfflineWarning;
