import React from 'react';
import { 
  Mic, 
  Code2, 
  Sparkles, 
  Bug, 
  Volume2, 
  VolumeX, 
  RotateCcw,
  Terminal,
  ShoppingCart,
  Check,
  Sliders,
  Bot,
  MessageSquare,
  FolderPlus,
  Folder,
  Search,
  Download,
  Brain
} from 'lucide-react';
import { AppMode, MainAgentMode, ProjectContext } from '../types';

interface HeaderProps {
  activeMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  activeAgentMode: MainAgentMode;
  onSelectAgentMode: (mode: MainAgentMode) => void;
  projectContext: ProjectContext;
  autoSpeak: boolean;
  onToggleAutoSpeak: () => void;
  voiceLang: 'th-TH' | 'en-US';
  onChangeVoiceLang: (lang: 'th-TH' | 'en-US') => void;
  onResetProject: () => void;
  onClearChat: () => void;
  onCopyAllCode: () => void;
  onDownloadAllCode: () => void;
  onExportZip: () => void;
  onOpenProjectsDashboard: () => void;
  onOpenCodeSearch: () => void;
  onToggleDevMode: () => void;
  onToggleCart: () => void;
  onOpenSettings: () => void;
  cartCount: number;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeMode,
  onSelectMode,
  activeAgentMode,
  onSelectAgentMode,
  projectContext,
  autoSpeak,
  onToggleAutoSpeak,
  voiceLang,
  onChangeVoiceLang,
  onResetProject,
  onClearChat,
  onCopyAllCode,
  onDownloadAllCode,
  onExportZip,
  onOpenProjectsDashboard,
  onOpenCodeSearch,
  onToggleDevMode,
  onToggleCart,
  onOpenSettings,
  cartCount,
  isSpeaking,
  onStopSpeaking,
}) => {
  const [copiedCode, setCopiedCode] = React.useState(false);

  const handleCopy = () => {
    onCopyAllCode();
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-xl pt-[max(0.25rem,env(safe-area-inset-top))] shrink-0">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-2">
        <div className="flex items-center justify-between gap-2">
          {/* Brand & Identity */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 p-0.5 shadow-md shadow-indigo-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Mic className="w-4 h-4 text-indigo-400" />
              </div>
              {isSpeaking && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs sm:text-base font-bold tracking-tight text-white truncate">
                  CodeVoice <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">V5</span>
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  <Brain className="w-2.5 h-2.5" />
                  <span>Memory ON</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate hidden lg:block">
                {projectContext.projectName || projectContext.name || 'ผู้ช่วยพัฒนาโปรแกรมด้วยเสียง'}
              </p>
            </div>
          </div>

          {/* Center: Mode Switcher (CHAT | CODE | AGENT) */}
          <div className="flex items-center p-0.5 bg-slate-900 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => onSelectAgentMode('CHAT')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeAgentMode === 'CHAT'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              <span className="hidden xs:inline">Chat</span>
            </button>

            <button
              onClick={() => onSelectAgentMode('CODE')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeAgentMode === 'CODE'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3 h-3" />
              <span className="hidden xs:inline">Code</span>
            </button>

            <button
              onClick={() => onSelectAgentMode('AGENT')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeAgentMode === 'AGENT'
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Agent</span>
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Search Project Code */}
            <button
              onClick={onOpenCodeSearch}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-400 transition cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center active:scale-95"
              title="ค้นหาโค้ดในโปรเจกต์ (Code Search)"
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            {/* My Projects Dashboard */}
            <button
              onClick={onOpenProjectsDashboard}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-indigo-400 transition cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center active:scale-95"
              title="แดชบอร์ดโปรเจกต์ (My Projects Dashboard)"
            >
              <Folder className="w-3.5 h-3.5" />
            </button>

            {/* Export ZIP Button */}
            <button
              onClick={onExportZip}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-cyan-300 transition cursor-pointer min-h-[38px] active:scale-95"
              title="ดาวน์โหลดทั้งโปรเจกต์เป็นไฟล์ .ZIP"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export ZIP</span>
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={onToggleCart}
              className="relative p-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-stone-800 text-xs font-medium text-amber-400 transition cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center active:scale-95"
              title="เปิด/ปิด ตะกร้าสินค้า (Ctrl+Shift+C)"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-stone-950 font-bold text-[9px]">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Voice auto-speak toggle button */}
            <button
              onClick={onToggleAutoSpeak}
              className={`p-2 rounded-xl border text-xs font-medium transition cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center active:scale-95 ${
                autoSpeak
                  ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title={autoSpeak ? 'เปิดเสียงอ่านสรุปอัตโนมัติ' : 'ปิดเสียงอ่านสรุป'}
            >
              {autoSpeak ? (
                <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>

            {/* Developer Mode Button (Hidden on small mobile) */}
            <button
              onClick={onToggleDevMode}
              className="hidden sm:flex p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-400 transition cursor-pointer min-h-[38px] min-w-[38px] items-center justify-center"
              title="เปิด Developer Mode"
            >
              <Terminal className="w-3.5 h-3.5" />
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-indigo-400 transition cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center active:scale-95"
              title="การตั้งค่าระบบ (Settings)"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
