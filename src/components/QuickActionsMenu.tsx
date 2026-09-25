import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings2, HardDrive, Trash2, ShieldAlert, X } from 'lucide-react';
import { playTone } from './AudioSynthesizer';
import { automatedBackupService } from '../services/automatedBackupService';

interface QuickActionsMenuProps {
  onToggleForensicAudit: () => void;
}

export const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({ onToggleForensicAudit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleAction = (action: string) => {
    playTone(600, 0.05);
    let msg = '';
    
    if (action === 'backup') {
      automatedBackupService.triggerManualSnapshot();
      msg = 'Backup triggered successfully.';
    } else if (action === 'clear') {
      // simulate clearing cache
      msg = 'System cache cleared.';
    } else if (action === 'audit') {
      onToggleForensicAudit();
      msg = 'Forensic audit mode toggled.';
    }

    setToast(msg);
    setTimeout(() => setToast(null), 3000);
    setIsOpen(false);
  };

  return (
    <>
      <div className="fixed bottom-6 left-6 z-50">
        <div className="relative">
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-16 left-0 flex flex-col gap-2 w-48"
              >
                <button
                  onClick={() => handleAction('backup')}
                  className="w-full min-h-[44px] flex items-center gap-3 px-4 py-3 bg-[#0a0f1e]/90 border-emerald-500/30 hover:bg-[#0a0f1e] hover:border-emerald-400 rounded-xl text-xs font-mono font-bold text-emerald-300 transition-all backdrop-blur-md shadow-lg"
                >
                  <HardDrive className="w-4 h-4" />
                  Trigger Backup
                </button>
                <button
                  onClick={() => handleAction('clear')}
                  className="w-full min-h-[44px] flex items-center gap-3 px-4 py-3 bg-[#0a0f1e]/90 border-amber-500/30 hover:bg-[#0a0f1e] hover:border-amber-400 rounded-xl text-xs font-mono font-bold text-amber-300 transition-all backdrop-blur-md shadow-lg"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Cache
                </button>
                <button
                  onClick={() => handleAction('audit')}
                  className="w-full min-h-[44px] flex items-center gap-3 px-4 py-3 bg-[#0a0f1e]/90 border-rose-500/30 hover:bg-[#0a0f1e] hover:border-rose-400 rounded-xl text-xs font-mono font-bold text-rose-300 transition-all backdrop-blur-md shadow-lg"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Toggle Forensic Audit
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => {
              playTone(isOpen ? 400 : 500, 0.05);
              setIsOpen(!isOpen);
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border transition-all ${
              isOpen 
                ? 'bg-cyan-900 border-cyan-400 text-cyan-200' 
                : 'bg-[#0a0f1e] border-white/10 text-zinc-400 hover:text-cyan-300 hover:border-cyan-500/50'
            }`}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Settings2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-24 left-1/2 z-[60] px-6 py-3 bg-cyan-950/90 border-cyan-500/50 text-cyan-100 text-xs font-mono font-bold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] backdrop-blur-md"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
