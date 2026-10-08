import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Clock3,
  FileText,
  GitBranch,
  History,
  LockKeyhole,
  PackageCheck,
  Play,
  RotateCcw,
  ShieldCheck,
  Square,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { ProjectContext, ReleaseRun, ReleaseSnapshot } from '../types';

interface ReleasePanelProps {
  projectContext: ProjectContext;
  run: ReleaseRun | null;
  snapshots: ReleaseSnapshot[];
  onPrepare: () => void;
  onCancel: () => void;
  onExport: () => void;
  onRollback: (snapshotId?: string) => void;
}

const statusClass: Record<string, string> = {
  PASS: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  READY: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  WARN: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  NOT_READY: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  FAIL: 'text-rose-300 bg-rose-500/10 border-rose-500/30',
  BLOCKED: 'text-rose-300 bg-rose-500/10 border-rose-500/30',
  UNAVAILABLE: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
};

export const ReleasePanel: React.FC<ReleasePanelProps> = ({ projectContext, run, snapshots, onPrepare, onCancel, onExport, onRollback }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'report' | 'reality' | 'snapshots'>('overview');
  const isRunning = run?.status === 'RUNNING';
  const decision = run?.gate?.decision || run?.status || 'IDLE';
  const files = useMemo(() => projectContext.files.length, [projectContext.files.length]);

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-stone-950 text-stone-100">
      <div className="sticky top-0 z-10 p-4 border-b border-stone-800 bg-stone-900/95 backdrop-blur space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center"><PackageCheck className="w-5 h-5 text-indigo-300" /></div>
            <div>
              <div className="flex items-center gap-2"><h2 className="font-bold">Production Release Agent</h2><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">V10</span></div>
              <p className="text-xs text-stone-400">ตรวจจริงก่อน release — ไม่แสดง PASS โดยไม่มี evidence</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isRunning ? <button onClick={onCancel} className="px-3 py-2 rounded-lg text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30"><Square className="inline w-3.5 h-3.5 mr-1" />หยุด</button> : <button onClick={onPrepare} className="px-3 py-2 rounded-lg text-xs font-bold bg-indigo-500 hover:bg-indigo-400 text-white"><Play className="inline w-3.5 h-3.5 mr-1" />เตรียม production</button>}
            {run?.exportReady && run.gate?.decision === 'READY' && <button onClick={onExport} className="px-3 py-2 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-stone-950"><Archive className="inline w-3.5 h-3.5 mr-1" />Export release</button>}
          </div>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {(['overview', 'report', 'reality', 'snapshots'] as const).map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap ${activeTab === tab ? 'bg-indigo-500 text-white font-bold' : 'text-stone-400 hover:bg-stone-800'}`}>{tab === 'overview' ? 'Pipeline' : tab === 'report' ? 'Release Report' : tab === 'reality' ? 'Reality Report' : 'Snapshots'}</button>)}
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-6xl w-full mx-auto space-y-5">
        {!run && <div className="p-6 rounded-xl border border-dashed border-stone-700 text-center text-sm text-stone-400"><PackageCheck className="w-8 h-8 mx-auto mb-2 text-indigo-300" /><p>พร้อมตรวจโปรเจกต์ {projectContext.projectName || projectContext.name || 'ปัจจุบัน'} จำนวน {files} ไฟล์</p><p className="text-xs mt-1">ขั้นตอนจะรันจาก Understand → Analyze → Build → Gate → Export</p></div>}

        {run && activeTab === 'overview' && <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`p-3 rounded-xl border ${statusClass[decision] || 'text-stone-300 bg-stone-900 border-stone-800'}`}><span className="text-[10px] uppercase font-bold">Decision</span><div className="text-lg font-bold">{decision}</div></div>
            <div className="p-3 rounded-xl bg-stone-900 border border-stone-800"><span className="text-[10px] uppercase text-stone-500 font-bold">Version</span><div className="text-lg font-bold">{run.version}</div></div>
            <div className="p-3 rounded-xl bg-stone-900 border border-stone-800"><span className="text-[10px] uppercase text-stone-500 font-bold">Stages</span><div className="text-lg font-bold">{run.stages.filter(s => s.status === 'PASS').length}/{run.stages.length}</div></div>
            <div className="p-3 rounded-xl bg-stone-900 border border-stone-800"><span className="text-[10px] uppercase text-stone-500 font-bold">Snapshot</span><div className="text-sm font-bold truncate">{run.snapshotId || 'pending'}</div></div>
          </div>
          <div className="space-y-2">
            {run.stages.map((s) => <div key={s.id} className="p-3 rounded-xl bg-stone-900 border border-stone-800"><div className="flex items-start gap-3"><div className="mt-0.5">{s.status === 'PASS' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : s.status === 'FAIL' || s.status === 'BLOCKED' ? <XCircle className="w-4 h-4 text-rose-400" /> : s.status === 'WARN' ? <AlertTriangle className="w-4 h-4 text-amber-400" /> : s.status === 'RUNNING' ? <Clock3 className="w-4 h-4 text-indigo-300 animate-spin" /> : <div className="w-4 h-4 rounded-full border border-stone-600" />}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="text-sm font-bold">{s.name}</span><span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${statusClass[s.status] || 'text-stone-400 border-stone-700'}`}>{s.status}</span></div><p className="text-xs text-stone-500 mt-0.5">{s.description}</p>{s.evidence.length > 0 && <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">{s.evidence.map((e, i) => <div key={i} className="text-[11px] text-stone-400"><span className="text-stone-500">{e.label}:</span> {e.value}</div>)}</div>}</div></div></div>)}
          </div>
          {run.gate && <div className="p-4 rounded-xl bg-stone-900 border border-stone-800"><div className="flex items-center gap-2 mb-3"><ShieldCheck className="w-4 h-4 text-indigo-300" /><h3 className="text-sm font-bold">Release Gate Checklist</h3></div>{run.gate.checklist.map((c) => <div key={c.id} className="flex items-start gap-2 py-1.5 text-xs border-t border-stone-800"><span className={c.status === 'PASS' ? 'text-emerald-400' : c.status === 'FAIL' ? 'text-rose-400' : 'text-amber-300'}>{c.status === 'PASS' ? '✓' : c.status === 'FAIL' ? '✕' : '!'}</span><span className="font-semibold">{c.label}</span><span className="text-stone-500">— {c.evidence}</span></div>)}</div>}
          {run.gate?.blockingIssues.length ? <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200"><b>RELEASE BLOCKED</b>{run.gate.blockingIssues.map((x, i) => <div key={i} className="mt-1">• {x}</div>)}</div> : null}
        </>}

        {run && activeTab === 'report' && <div className="space-y-4"><div className="flex items-center gap-2 text-sm font-bold"><FileText className="w-4 h-4 text-indigo-300" />Release Report</div><pre className="whitespace-pre-wrap p-4 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-300 font-mono overflow-x-auto">{run.report ? JSON.stringify(run.report, null, 2) : 'Report ยังไม่พร้อม'}</pre></div>}
        {run && activeTab === 'reality' && <div className="space-y-3"><div className="flex items-center gap-2 text-sm font-bold"><TrendingUp className="w-4 h-4 text-indigo-300" />Final Reality Report</div>{run.reality?.assessments.map((a) => <div key={a.capability} className="p-3 rounded-xl bg-stone-900 border border-stone-800 flex items-start justify-between gap-3"><div><div className="text-sm font-bold">{a.capability}</div><div className="text-xs text-stone-500 mt-1">{a.evidence}</div></div><span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${statusClass[a.reality] || 'text-stone-400 border-stone-700'}`}>{a.reality}</span></div>)}</div>}
        {activeTab === 'snapshots' && <div className="space-y-3"><div className="flex items-center gap-2 text-sm font-bold"><History className="w-4 h-4 text-indigo-300" />Release Snapshots</div>{snapshots.length === 0 ? <div className="p-6 text-center text-xs text-stone-500">ยังไม่มี Release Snapshot</div> : snapshots.map((s) => <div key={s.id} className="p-3 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between gap-3"><div><div className="text-sm font-bold">{s.label}</div><div className="text-xs text-stone-500">v{s.version} · {s.timestamp} · {s.files.length} files · {s.gateDecision || 'not evaluated'}</div></div><button onClick={() => onRollback(s.id)} className="px-2.5 py-1.5 rounded-lg text-xs text-amber-300 border border-amber-500/30 hover:bg-amber-500/10"><RotateCcw className="inline w-3 h-3 mr-1" />Rollback</button></div>)}</div>}
      </div>
    </div>
  );
};
