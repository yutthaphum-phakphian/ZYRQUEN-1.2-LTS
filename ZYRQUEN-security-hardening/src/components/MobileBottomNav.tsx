import React from 'react';
import { 
  MessageSquare, 
  Bot, 
  Code2, 
  Sparkles, 
  Brain, 
  Sliders, 
  Play,
  Users,
  Layers3,
  PlugZap,
  BookOpen,
  Activity,
  Network,
  BrainCircuit
} from 'lucide-react';

export type MobileTab = 'chat' | 'agent' | 'code' | 'sandbox' | 'prompt' | 'memory' | 'team' | 'mission' | 'integration' | 'research' | 'production' | 'infrastructure' | 'runtime' | 'autonomous' | 'settings';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onChangeTab: (tab: MobileTab) => void;
  unreadCount?: number;
  filesCount?: number;
  isAgentRunning?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onChangeTab,
  filesCount = 0,
  isAgentRunning = false,
}) => {
  const tabs = [
    {
      id: 'chat' as MobileTab,
      label: 'แชต',
      icon: <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'agent' as MobileTab,
      label: 'Agent',
      isAgent: true,
      icon: <Bot className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'code' as MobileTab,
      label: 'โค้ด',
      badge: filesCount > 0 ? `${filesCount}` : undefined,
      icon: <Code2 className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'sandbox' as MobileTab,
      label: 'พรีวิว',
      icon: <Play className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'prompt' as MobileTab,
      label: 'พรอมต์',
      icon: <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'memory' as MobileTab,
      label: 'บริบท',
      icon: <Brain className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'team' as MobileTab,
      label: 'ทีม',
      icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'mission' as MobileTab,
      label: 'Mission',
      icon: <Layers3 className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'integration' as MobileTab,
      label: 'Hub',
      icon: <PlugZap className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'research' as MobileTab,
      label: 'วิจัย',
      icon: <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'production' as MobileTab,
      label: 'Control',
      icon: <Activity className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'infrastructure' as MobileTab,
      label: 'Infra',
      icon: <Network className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'runtime' as MobileTab,
      label: 'Runtime',
      icon: <Brain className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'autonomous' as MobileTab,
      label: 'Mission',
      icon: <BrainCircuit className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'settings' as MobileTab,
      label: 'ตั้งค่า',
      icon: <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
  ];

  return (
    <nav className="md:hidden sticky bottom-0 z-40 w-full bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-1 py-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] shadow-2xl shrink-0">
      <div className="grid grid-cols-15 gap-0.5 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all duration-150 min-h-[46px] relative select-none cursor-pointer ${
                isActive
                  ? 'text-indigo-400 bg-indigo-500/15 font-bold scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 active:scale-95'
              }`}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 px-1 min-w-[12px] h-3 bg-cyan-500 text-slate-950 text-[8px] font-bold rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
                {tab.isAgent && isAgentRunning && (
                  <span className="absolute -top-0.5 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                )}
              </div>
              <span className="text-[9px] mt-0.5 truncate max-w-full leading-none tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
