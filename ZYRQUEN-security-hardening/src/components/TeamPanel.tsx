import React, { useMemo, useState } from 'react';
import { AlertTriangle, Bot, CheckCircle2, ChevronRight, Circle, FileLock2, GitPullRequest, Pause, Play, ShieldCheck, Square, Users, XCircle } from 'lucide-react';
import { ProjectContext, TeamRunRecord, TeamAgentState } from '../types';

interface TeamPanelProps {
  projectContext: ProjectContext;
  record: TeamRunRecord | null;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

const stateStyle: Record<string, string> = {
  WORKING: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30',
  SUCCESS: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  PARTIAL: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  NEEDS_REVIEW: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  BLOCKED: 'text-rose-300 bg-rose-500/10 border-rose-500/30',
  FAILED: 'text-rose-300 bg-rose-500/10 border-rose-500/30',
  CANCELLED: 'text-stone-400 bg-stone-500/10 border-stone-500/30',
  WAITING: 'text-stone-300 bg-stone-500/10 border-stone-500/30',
};

function AgentIcon({ status }: { status: string }) {
  if (status === 'SUCCESS') return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  if (status === 'BLOCKED' || status === 'FAILED') return <XCircle className="w-4 h-4 text-rose-400" />;
  if (status === 'WORKING') return <Circle className="w-4 h-4 text-cyan-300 animate-pulse" />;
  if (status === 'NEEDS_REVIEW' || status === 'PARTIAL') return <AlertTriangle className="w-4 h-4 text-amber-300" />;
  return <Circle className="w-4 h-4 text-stone-600" />;
}

export const TeamPanel: React.FC<TeamPanelProps> = ({ projectContext, record, onStart, onPause, onResume, onCancel }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const agents = record?.state.activeAgents || [];
  const selectedAgent = agents.find((a) => a.id === selected);
  const progress = useMemo(() => {
    if (!agents.length) return 0;
    return Math.round(agents.reduce((sum, a) => sum + a.progress, 0) / agents.length);
  }, [agents]);
  const status = record?.state.status || 'TEAM_IDLE';
  const running = status === 'TEAM_EXECUTING' || status === 'TEAM_PLANNING';

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-stone-950 text-stone-100">
      <div className="sticky top-0 z-10 p-4 border-b border-stone-800 bg-stone-900/95 backdrop-blur space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center"><Users className="w-5 h-5 text-cyan-300" /></div><div><div className="flex items-center gap-2"><h2 className="font-bold">Multi-Agent Team Runtime</h2><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">V11</span></div><p className="text-xs text-stone-400">Lead orchestrates one shared task state — no isolated project copies</p></div></div>
          <div className="flex items-center gap-2">{running ? <><button onClick={onPause} className="px-3 py-2 rounded-lg text-xs font-bold text-amber-300 border border-amber-500/30"><Pause className="inline w-3.5 h-3.5 mr-1" />พัก</button><button onClick={onCancel} className="px-3 py-2 rounded-lg text-xs font-bold text-rose-300 border border-rose-500/30"><Square className="inline w-3.5 h-3.5 mr-1" />หยุดทีม</button></> : status === 'TEAM_PAUSED' ? <button onClick={onResume} className="px-3 py-2 rounded-lg text-xs font-bold bg-cyan-500 text-stone-950"><Play className="inline w-3.5 h-3.5 mr-1" />ทำต่อ</button> : <button onClick={onStart} className="px-3 py-2 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-stone-950"><Play className="inline w-3.5 h-3.5 mr-1" />สร้างทีม AI</button>}</div>
        </div>
        <div className="flex items-center justify-between text-xs"><span className="text-stone-400">Status: <b className="text-stone-200">{status}</b></span><span className="text-cyan-300 font-bold">{progress}% real task progress</span></div>
        <div className="h-2 rounded-full bg-stone-800 overflow-hidden"><div className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all" style={{ width: `${progress}%` }} /></div>
      </div>

      <div className="p-4 sm:p-6 space-y-5 max-w-6xl w-full mx-auto">
        {!record && <div className="p-6 rounded-xl border border-dashed border-stone-700 text-center text-sm text-stone-400"><Bot className="w-8 h-8 mx-auto mb-2 text-cyan-300" /><p>ยังไม่มีทีมที่กำลังทำงาน</p><p className="text-xs mt-1">กด “สร้างทีม AI” หรือพูดว่า “ให้ทีม AI จัดการโปรเจกต์นี้”</p></div>}
        {record && <>
          <div className="p-4 rounded-xl bg-stone-900 border border-stone-800"><div className="text-[10px] text-stone-500 uppercase font-bold">Objective</div><div className="text-sm font-bold mt-1">{record.state.objective}</div><div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs"><div><span className="text-stone-500">Agents</span><div className="font-bold">{agents.length}</div></div><div><span className="text-stone-500">Evidence</span><div className="font-bold">{record.state.evidence.length}</div></div><div><span className="text-stone-500">Messages</span><div className="font-bold">{record.state.messages.length}</div></div><div><span className="text-stone-500">Context</span><div className="font-bold">{record.state.sharedContext.contextBytes} bytes</div></div></div></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">{agents.map((a) => <button key={a.id} onClick={() => setSelected(a.id)} className={`text-left p-3 rounded-xl border transition ${selected === a.id ? 'border-cyan-500/60 bg-cyan-500/10' : 'border-stone-800 bg-stone-900 hover:border-stone-700'}`}><div className="flex items-start gap-3"><AgentIcon status={a.status} /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="text-sm font-bold truncate">{a.label}</span><span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${stateStyle[a.status] || ''}`}>{a.status}</span></div><div className="text-xs text-stone-500 mt-1 truncate">{a.currentAction || 'Waiting for assignment'}</div><div className="mt-2 h-1.5 rounded-full bg-stone-800"><div className="h-full rounded-full bg-cyan-500" style={{ width: `${a.progress}%` }} /></div><div className="flex justify-between text-[10px] text-stone-600 mt-1"><span>{a.filesTouched.length} files touched</span><span>{a.evidence.length} evidence</span></div></div><ChevronRight className="w-4 h-4 text-stone-600" /></div></button>)}</div>
          {selectedAgent && <AgentDetail agent={selectedAgent} />}
          <div className="p-4 rounded-xl bg-stone-900 border border-stone-800"><div className="flex items-center gap-2 text-sm font-bold mb-3"><GitPullRequest className="w-4 h-4 text-indigo-300" />Task Graph</div>{record.state.taskGraph.map((t) => <div key={t.id} className="flex items-center gap-2 py-1.5 border-t border-stone-800 text-xs"><span className={t.status === 'SUCCESS' ? 'text-emerald-400' : t.status === 'BLOCKED' ? 'text-rose-400' : 'text-stone-500'}>{t.status === 'SUCCESS' ? '✓' : t.status === 'BLOCKED' ? '✕' : '○'}</span><b>{t.role}</b><span className="text-stone-500">{t.title}</span>{t.dependencies.length > 0 && <span className="ml-auto text-[10px] text-stone-600">depends: {t.dependencies.length}</span>}</div>)}</div>
          <div className="p-4 rounded-xl bg-stone-900 border border-stone-800"><div className="flex items-center gap-2 text-sm font-bold mb-3"><ShieldCheck className="w-4 h-4 text-emerald-300" />Final Reality Report</div>{record.reality.assessments.map((a) => <div key={a.capability} className="flex items-center justify-between gap-3 py-1.5 border-t border-stone-800 text-xs"><span>{a.capability}</span><span className={a.reality === 'REAL' ? 'text-emerald-300' : a.reality === 'UNAVAILABLE' ? 'text-stone-500' : 'text-amber-300'}>{a.reality}</span></div>)}</div>
        </>}
      </div>
    </div>
  );
};

const AgentDetail: React.FC<{ agent: TeamAgentState }> = ({ agent }) => <div className="p-4 rounded-xl bg-stone-900 border border-cyan-500/30 space-y-3"><div className="flex items-center gap-2 text-sm font-bold"><Bot className="w-4 h-4 text-cyan-300" />{agent.label} detail</div><div className="grid grid-cols-2 gap-2 text-xs"><div><span className="text-stone-500">Task</span><div>{agent.currentTask || '—'}</div></div><div><span className="text-stone-500">Current file</span><div>{agent.currentFile || '—'}</div></div><div><span className="text-stone-500">Retries</span><div>{agent.retries}</div></div><div><span className="text-stone-500">Errors</span><div>{agent.errors.length}</div></div></div>{agent.findings.length > 0 && <div className="text-xs"><span className="text-stone-500">Findings</span>{agent.findings.map((f, i) => <div key={i} className="text-amber-200 mt-1">• {f}</div>)}</div>}{agent.evidence.length > 0 && <div className="text-xs"><span className="text-stone-500">Evidence</span>{agent.evidence.map((e) => <div key={e.id} className="mt-1"><b>{e.label}:</b> {e.value} <span className="text-stone-600">({e.source})</span></div>)}</div>}</div>;
