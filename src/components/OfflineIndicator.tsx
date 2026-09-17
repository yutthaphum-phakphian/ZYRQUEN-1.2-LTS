import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-[#0a0f1e] border border-amber-500/50 px-4 py-2 text-xs font-mono text-amber-300 shadow-2xl backdrop-blur-md">
      <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
      <span>📡 สภาวะออฟไลน์ (Offline Mode) — กำลังใช้งานฐานข้อมูลแคช WORM ท้องถิ่น</span>
    </div>
  );
};
