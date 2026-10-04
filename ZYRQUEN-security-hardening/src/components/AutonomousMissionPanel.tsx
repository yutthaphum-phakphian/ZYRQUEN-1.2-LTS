import React, { useState } from 'react';
import {
  BrainCircuit, Pause, Play, Square, SkipForward,
  CheckCircle2, XCircle, Clock, Loader2, Circle,
  FileUp, ChevronRight,
} from 'lucide-react';
import { Mission } from '../tools/autonomousMissionEngine';
import { readTextFile } from '../utils/readTextFile';
import { AdminPanel } from './AdminPanel';
import { SessionAuthBar } from './SessionAuthBar';

interface Props {
  mission?: Mission;
  onStart: (objective: string) => void;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onApprove: (taskId: string, approved: boolean) => void;
  onStep: () => void;
  onProvideInputs: (taskId: string, inputs: Record<string, unknown>) => void;
}

const statusStyle = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return { text: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/25', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> };
    case 'FAILED':
      return { text: 'text-rose-300', bg: 'bg-rose-500/10 border-rose-500/25', icon: <XCircle className="w-3.5 h-3.5 text-rose-300" /> };
    case 'RUNNING':
    case 'IN_PROGRESS':
      return { text: 'text-sky-300', bg: 'bg-sky-500/10 border-sky-500/25', icon: <Loader2 className="w-3.5 h-3.5 text-sky-300 animate-spin" /> };
    case 'WAITING_APPROVAL':
    case 'WAITING_USER':
      return { text: 'text-amber-300', bg: 'bg-amber-500/10 border-amber-500/25', icon: <Clock className="w-3.5 h-3.5 text-amber-300" /> };
    default:
      return { text: 'text-stone-400', bg: 'bg-stone-800/50 border-stone-700', icon: <Circle className="w-3.5 h-3.5 text-stone-500" /> };
  }
};

export const AutonomousMissionPanel: React.FC<Props> = ({
  mission, onStart, onPause, onResume, onCancel, onApprove, onStep, onProvideInputs,
}) => {
  const [fileName, setFileName] = useState('src/generated.ts');
  const [fileContent, setFileContent] = useState('export const generated = true;');
  const [fileError, setFileError] = useState('');
  const [objective, setObjective] = useState(
    'Inspect this project, validate its files, and summarize the actual state.',
  );

  const pickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      const p = await readTextFile(f);
      setFileName('src/' + p.name);
      setFileContent(p.content);
      setFileError('');
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'อ่านไฟล์ไม่สำเร็จ');
    }
  };

  const progress = mission?.tasks.length
    ? Math.round(mission.tasks.filter((t) => t.status === 'COMPLETED').length / mission.tasks.length * 100)
    : 0;

  const stateLabel = mission?.state || 'IDLE';

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-stone-950 text-stone-100">
      <div className="sticky top-0 z-10 px-4 py-3.5 border-b border-stone-800/80 bg-stone-900/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-fuchsia-500/15 border border-fuchsia-500/30">
            <BrainCircuit className="w-5 h-5 text-fuchsia-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm sm:text-base tracking-tight">Autonomous Mission</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 font-medium border border-fuchsia-500/25">
                V18
              </span>
            </div>
            <p className="text-[11px] text-stone-500 truncate">
              Dependency-aware execution · real V17 internal tools
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-5xl w-full mx-auto space-y-4 pb-10">
        <section className="space-y-3">
          <SessionAuthBar />
          <AdminPanel />
        </section>

        <section className="rounded-2xl border border-stone-800 bg-stone-900/50 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-stone-800/80 flex items-center gap-2">
            <ChevronRight className="w-3.5 h-3.5 text-fuchsia-400" />
            <h3 className="text-xs font-semibold text-stone-300 uppercase tracking-wide">Objective</h3>
          </div>
          <div className="p-4 space-y-3">
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full p-3 rounded-xl bg-stone-950 border border-stone-700 text-sm min-h-[5.5rem] focus:outline-none focus:ring-1 focus:ring-fuchsia-500/40 placeholder:text-stone-600 resize-y"
              placeholder="อธิบายเป้าหมายของ mission…"
            />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => onStart(objective)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 text-white text-xs font-semibold transition-colors shadow-lg shadow-fuchsia-500/10">
                <Play className="w-3.5 h-3.5" />
                Start mission
              </button>
              <button type="button" onClick={onPause} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs border border-stone-600 transition-colors">
                <Pause className="w-3.5 h-3.5" />
                Pause
              </button>
              <button type="button" onClick={onResume} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs border border-stone-600 transition-colors">
                <Play className="w-3.5 h-3.5" />
                Resume
              </button>
              <button type="button" onClick={onCancel} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs border border-rose-500/25 transition-colors">
                <Square className="w-3.5 h-3.5" />
                Cancel
              </button>
              <button type="button" onClick={onStep} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 text-violet-200 text-xs border border-violet-500/30 transition-colors">
                <SkipForward className="w-3.5 h-3.5" />
                Run next task
              </button>
            </div>
          </div>
        </section>

        {mission && (
          <>
            <section className="rounded-2xl border border-stone-800 bg-stone-900/50 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wide text-stone-500 font-semibold">State</span>
                  <span data-testid="mission-state" className="px-2 py-0.5 rounded-lg bg-stone-800 border border-stone-700 font-mono text-stone-200">{stateLabel}</span>
                </div>
                <span data-testid="mission-progress" className="text-stone-400">
                  <span className="text-fuchsia-300 font-semibold">{progress}%</span>
                  <span className="text-stone-500"> task completion</span>
                </span>
              </div>
              <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-fuchsia-500 to-violet-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-stone-500 leading-relaxed">{mission.objective}</p>
            </section>

            <section className="rounded-2xl border border-stone-800 bg-stone-900/50 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-stone-800/80">
                <h3 className="text-xs font-semibold text-stone-300 uppercase tracking-wide">Task Graph</h3>
              </div>
              <ul className="divide-y divide-stone-800/80">
                {mission.tasks.map((t) => {
                  const st = statusStyle(t.status);
                  return (
                    <li key={t.taskId} className="px-4 py-3 hover:bg-stone-900/40 transition-colors">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {st.icon}
                            <b className="text-xs text-stone-100">{t.title}</b>
                          </div>
                          <div className="mt-1 text-[11px] text-stone-500 font-mono pl-5">
                            depends: {t.dependencies.length ? t.dependencies.join(', ') : 'none'}
                            <span className="mx-1.5 text-stone-700">·</span>
                            attempts: {t.attempts}
                          </div>
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${st.bg} ${st.text}`}>{t.status}</span>
                      </div>

                      {t.status === 'WAITING_APPROVAL' && (
                        <div className="mt-3 ml-5 flex flex-wrap gap-2">
                          <button type="button" onClick={() => onApprove(t.taskId, true)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 text-[11px] border border-emerald-500/30 hover:bg-emerald-500/25">
                            <CheckCircle2 className="w-3 h-3" /> Approve
                          </button>
                          <button type="button" onClick={() => onApprove(t.taskId, false)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 text-[11px] border border-rose-500/30 hover:bg-rose-500/25">
                            <XCircle className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      )}

                      {t.status === 'WAITING_USER' && (
                        <div className="mt-3 ml-5 space-y-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">
                          <input value={fileName} onChange={(e) => setFileName(e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg bg-stone-950 border border-stone-700 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500/40" placeholder="file name" />
                          <textarea value={fileContent} onChange={(e) => setFileContent(e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg bg-stone-950 border border-stone-700 text-xs min-h-[4rem] focus:outline-none focus:ring-1 focus:ring-cyan-500/40" placeholder="file content" />
                          <div className="flex flex-wrap items-center gap-2">
                            <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-800 text-stone-200 text-[11px] cursor-pointer border border-stone-600 hover:bg-stone-700">
                              <FileUp className="w-3 h-3" /> Load from file
                              <input type="file" className="hidden" onChange={pickFile} />
                            </label>
                            {fileError && <span className="text-[11px] text-rose-300">{fileError}</span>}
                            <button type="button" onClick={() => onProvideInputs(t.taskId, { name: fileName, content: fileContent, language: 'typescript' })} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-200 text-[11px] border border-cyan-500/30 hover:bg-cyan-500/30">
                              Provide inputs &amp; continue
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="rounded-2xl border border-stone-800 bg-stone-900/50 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-stone-800/80">
                <h3 className="text-xs font-semibold text-stone-300 uppercase tracking-wide">Evidence Trace</h3>
              </div>
              <ul className="divide-y divide-stone-800/60 max-h-64 overflow-y-auto">
                {mission.events.slice(-12).reverse().map((e) => (
                  <li key={e.id} className="px-4 py-2 text-xs hover:bg-stone-900/50 transition-colors">
                    <span className="font-mono text-[11px] text-fuchsia-300/90">{e.type}</span>
                    <span className="ml-2 text-stone-500 leading-relaxed">{e.summary}</span>
                  </li>
                ))}
                {mission.events.length === 0 && (
                  <li className="px-4 py-6 text-center text-xs text-stone-600">ยังไม่มี evidence</li>
                )}
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
};
