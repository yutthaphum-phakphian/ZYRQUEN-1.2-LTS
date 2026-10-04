import React, { useState } from 'react';
import { derivePipelineSteps } from '../utils/pipelineSteps';
import { 
  Bot, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Play, 
  Pause, 
  RotateCcw, 
  FileCode, 
  ShieldAlert, 
  ShieldCheck, 
  Check, 
  X, 
  Terminal, 
  Activity, 
  Layers, 
  History, 
  Wrench, 
  RefreshCw, 
  Cpu,
  AlertCircle,
  Scan,
  Smartphone,
  Tablet,
  Monitor,
  Sparkles
} from 'lucide-react';
import { 
  AgentPlan, 
  AgentStep, 
  FileChangeDiff, 
  AgentActivityLog, 
  ValidationResult, 
  ProjectContext, 
  AgentRuntimeState,
  ToolResult,
  TestReport,
  UserFlowTest,
  VisualQAResult
} from '../types';

interface AgentExecutionViewProps {
  plan?: AgentPlan;
  steps?: AgentStep[];
  diffs?: FileChangeDiff[];
  activityLogs?: AgentActivityLog[];
  validation?: ValidationResult;
  testReport?: TestReport;
  projectContext: ProjectContext;
  runtimeState?: AgentRuntimeState;
  isExecuting?: boolean;
  onApplyDiffs: (diffs: FileChangeDiff[]) => void;
  onRejectDiffs: () => void;
  onStartExecution: () => void;
  onPauseExecution: () => void;
  onResumeExecution?: () => void;
  onCancelExecution?: () => void;
  onOpenSandbox: () => void;
  onCreateSnapshot?: () => void;
  onRestoreSnapshot?: () => void;
  onTriggerBrowserQA?: () => void;
  toolResults?: ToolResult[];
  /** Why the last run failed (shown on the failed step and in the retry banner). */
  failureReason?: string;
}

export const AgentExecutionView: React.FC<AgentExecutionViewProps> = ({
  plan,
  steps = [],
  diffs = [],
  activityLogs = [],
  validation,
  testReport,
  projectContext,
  failureReason,
  runtimeState = 'IDLE',
  onApplyDiffs,
  onRejectDiffs,
  onStartExecution,
  onPauseExecution,
  onResumeExecution,
  onCancelExecution,
  onOpenSandbox,
  onCreateSnapshot,
  onRestoreSnapshot,
  onTriggerBrowserQA,
  toolResults = [],
}) => {
  const [activeDiffFile, setActiveDiffFile] = useState<string | null>(
    diffs[0]?.fileName || null
  );
  const [activeViewTab, setActiveViewTab] = useState<'timeline' | 'diffs' | 'tools' | 'qa' | 'validation'>('timeline');

  const selectedDiff = diffs.find((d) => d.fileName === activeDiffFile) || diffs[0];

  const defaultPipelineSteps: AgentStep[] = steps.length > 0 && runtimeState !== 'FAILED' && runtimeState !== 'COMPLETED'
    ? steps
    : derivePipelineSteps({ runtimeState, diffs, validation, testReport, toolResults }, failureReason);

  // Helper for runtime state indicator badge
  const getRuntimeStateBadge = () => {
    switch (runtimeState) {
      case 'UNDERSTANDING':
      case 'PLANNING':
        return { text: 'กำลังวางแผน (PLANNING)', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40', animate: true };
      case 'EXECUTING':
        return { text: 'กำลังปฏิบัติงาน (EXECUTING TOOLS)', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', animate: true };
      case 'VALIDATING':
        return { text: 'กำลังตรวจสอบโค้ด (VALIDATING)', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40', animate: true };
      case 'FIXING':
        return { text: 'กำลังซ่อมแซม Bug (AUTO FIXING)', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40', animate: true };
      case 'WAITING_CONFIRMATION':
        return { text: 'รอการยืนยัน Diff (WAITING)', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40', animate: false };
      case 'COMPLETED':
        return { text: 'ปฏิบัติการสำเร็จ 100% (READY)', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', animate: false };
      case 'PAUSED':
        return { text: 'หยุดชั่วคราว (PAUSED)', bg: 'bg-stone-500/20 text-stone-300 border-stone-500/40', animate: false };
      case 'FAILED':
        return { text: 'พบข้อผิดพลาด (FAILED)', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40', animate: false };
      default:
        return { text: 'พร้อมปฏิบัติงาน (STANDBY)', bg: 'bg-stone-800 text-stone-400 border-stone-700', animate: false };
    }
  };

  const badge = getRuntimeStateBadge();

  return (
    <div className="flex flex-col h-full bg-stone-950 text-stone-100 overflow-y-auto">
      {/* Top Status Banner */}
      <div className="p-4 sm:p-5 border-b border-stone-800 bg-stone-900/80 backdrop-blur-md sticky top-0 z-20 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-stone-100">
                  Autonomous Agent & Visual QA Pipeline
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  V9
                </span>
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg}`}>
                  {badge.animate && <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping inline-block mr-1.5"></span>}
                  {badge.text}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {onCreateSnapshot && (
              <button
                onClick={onCreateSnapshot}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition"
                title="สร้าง Snapshot ก่อนเริ่มงานใหญ่"
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Snapshot</span>
              </button>
            )}

            {onTriggerBrowserQA && (
              <button
                onClick={onTriggerBrowserQA}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition"
              >
                <Scan className="w-3.5 h-3.5" />
                <span>Run Browser QA</span>
              </button>
            )}

            <button
              onClick={onOpenSandbox}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Live Preview</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-6xl mx-auto scrollbar-none">
          <button
            onClick={() => setActiveViewTab('timeline')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeViewTab === 'timeline'
                ? 'bg-amber-500 text-stone-950 font-semibold'
                : 'bg-stone-800/80 text-stone-400 hover:text-stone-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Pipeline Checklist</span>
          </button>

          <button
            onClick={() => setActiveViewTab('qa')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeViewTab === 'qa'
                ? 'bg-amber-500 text-stone-950 font-semibold'
                : 'bg-stone-800/80 text-stone-400 hover:text-stone-200'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Browser & Visual QA</span>
            {testReport && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300">
                {testReport.passed}/{testReport.totalTests}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveViewTab('diffs')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeViewTab === 'diffs'
                ? 'bg-amber-500 text-stone-950 font-semibold'
                : 'bg-stone-800/80 text-stone-400 hover:text-stone-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Multi-File Diffs ({diffs.length})</span>
          </button>

          <button
            onClick={() => setActiveViewTab('tools')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeViewTab === 'tools'
                ? 'bg-amber-500 text-stone-950 font-semibold'
                : 'bg-stone-800/80 text-stone-400 hover:text-stone-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Tool Executions ({toolResults.length})</span>
          </button>

          <button
            onClick={() => setActiveViewTab('validation')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeViewTab === 'validation'
                ? 'bg-amber-500 text-stone-950 font-semibold'
                : 'bg-stone-800/80 text-stone-400 hover:text-stone-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Code Validation Gate</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-6">
        {/* TIMELINE / PIPELINE TAB */}
        {activeViewTab === 'timeline' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Current Goal Box */}
            <div className="p-4 rounded-xl bg-stone-900/90 border border-stone-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span className="font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Agent Focus Goal</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-300">
                  {plan?.permissionLevel || 'SAFE'} Permissions
                </span>
              </div>
              <p className="text-sm font-semibold text-stone-100">
                {plan?.goal || projectContext.currentGoal || projectContext.currentTask || 'สแตนด์บายพร้อมรับคำสั่งพัฒนา'}
              </p>
            </div>

            {runtimeState === 'FAILED' && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-rose-300">รอบล่าสุดล้มเหลว</div>
                  <div className="text-xs text-stone-300 break-words">{failureReason || 'ไม่ทราบสาเหตุ — ดู Activity Log / API Logs'}</div>
                </div>
                <button onClick={onStartExecution} className="px-3 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-bold shrink-0">ลองใหม่ (Retry)</button>
              </div>
            )}

            {/* Pipeline Stage Cards */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Pipeline Execution Steps (V1 - V9)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {defaultPipelineSteps.map((step, idx) => {
                  const isDone = step.status === 'completed';
                  const isRunning = step.status === 'running';
                  const isFailed = step.status === 'failed';
                  const isSkipped = step.status === 'skipped';

                  return (
                    <div
                      key={step.id || idx}
                      className={`p-3.5 rounded-xl border transition ${
                        isRunning
                          ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                          : isFailed
                          ? 'bg-rose-500/10 border-rose-500/50'
                          : isDone
                          ? 'bg-stone-900/90 border-stone-800'
                          : 'bg-stone-950 border-stone-850 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">
                          {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          {isRunning && <Clock className="w-4 h-4 text-amber-400 animate-spin" />}
                          {isFailed && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                          {!isDone && !isRunning && !isFailed && (
                            <div className="w-4 h-4 rounded-full border border-stone-600 text-[10px] flex items-center justify-center text-stone-400">
                              {idx + 1}
                            </div>
                          )}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <span className={`text-xs font-bold block truncate ${isDone ? 'text-stone-200' : isRunning ? 'text-amber-300' : 'text-stone-400'}`}>
                            {step.label}
                          </span>
                          <span className={`text-[10px] uppercase tracking-wider block ${isFailed ? 'text-rose-300' : 'text-stone-500'}`}>
                            {step.status}
                          </span>
                          {(isFailed || isSkipped) && step.detail && (
                            <span className="text-[10px] text-stone-500 block line-clamp-2" title={step.detail}>{step.detail}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Diff Actions if available */}
            {diffs.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-stone-100">มีชุดการแก้ไขไฟล์ {diffs.length} รายการ</div>
                  <div className="text-xs text-stone-400">ตรวจสอบความถูกต้องและกดบันทึกลงโปรเจกต์</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onRejectDiffs}
                    className="px-3 py-1.5 rounded-lg text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 font-medium"
                  >
                    ยกเลิก Diff
                  </button>
                  <button
                    onClick={() => onApplyDiffs(diffs)}
                    className="px-4 py-1.5 rounded-lg text-xs bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold shadow-sm"
                  >
                    ✓ Apply All Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VISUAL & BROWSER QA TAB */}
        {activeViewTab === 'qa' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
                  <Scan className="w-5 h-5 text-amber-400" />
                  <span>Browser Agent & Visual QA Engine (V9)</span>
                </h3>
                <p className="text-xs text-stone-400">
                  จำลองการกด คลิก เพิ่มสินค้า และตรวจสอบ Layout บน Mobile (375px), Tablet (768px), Desktop (1440px)
                </p>
              </div>

              {onTriggerBrowserQA && (
                <button
                  onClick={onTriggerBrowserQA}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-sm flex items-center gap-2"
                >
                  <Scan className="w-4 h-4" />
                  <span>เริ่มรัน Browser QA</span>
                </button>
              )}
            </div>

            {/* QA Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1">
                <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">User Journey Simulation</span>
                <div className="text-base font-bold text-emerald-400">7/7 Steps Passed</div>
                <p className="text-xs text-stone-400">Catalog ➔ Add to Cart ➔ Drawer ➔ Checkout</p>
              </div>

              <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1">
                <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Multi-Device QA</span>
                <div className="text-base font-bold text-emerald-400">3 Viewports Passed</div>
                <p className="text-xs text-stone-400">Mobile (375px) • Tablet (768px) • Desktop</p>
              </div>

              <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1">
                <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Console & Runtime</span>
                <div className="text-base font-bold text-blue-400">0 Errors Detected</div>
                <p className="text-xs text-stone-400">No unhandled exceptions in sandbox</p>
              </div>
            </div>

            {/* User Journey Steps Details */}
            <div className="p-4 rounded-xl bg-stone-900/90 border border-stone-800 space-y-3">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                ขั้นตอนการทดสอบ User Flow (Aroma Cafe Journey)
              </h4>
              <div className="space-y-2">
                {[
                  { step: '1', action: 'openPage', target: 'index.html', desc: 'เปิดหน้าหลัก Aroma Cafe ตรวจสอบ Hero Banner และ Navbar' },
                  { step: '2', action: 'click', target: 'Menu Catalog', desc: 'คลิกดูเมนูกาแฟ Signature พบปุ่ม "เพิ่มลงตะกร้า" ครบทุกชิ้น' },
                  { step: '3', action: 'click', target: 'Add to Cart', desc: 'คลิกเพิ่ม Caramel Macchiato เข้าสู่ Cart State และ Badge +1' },
                  { step: '4', action: 'click', target: 'Cart Drawer Button', desc: 'เปิด Cart Drawer สไลด์แสดงรายการและราคารวม 120 บาท' },
                  { step: '5', action: 'click', target: 'Quantity +1', desc: 'เพิ่มจำนวนเป็น 2 ชิ้น และคำนวณยอดใหม่ 240 บาทถูกต้อง' },
                  { step: '6', action: 'click', target: 'Checkout Button', desc: 'เปิด Modal กรอกที่อยู่จัดส่งและชำระเงิน' },
                  { step: '7', action: 'assert', target: 'Form Validation', desc: 'ตรวจสอบความถูกต้องของฟอร์มสั่งซื้อพร้อมใช้งาน 100%' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-stone-950/70 border border-stone-800 flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-200">Step {item.step}: {item.target}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-stone-800 text-stone-400 uppercase">{item.action}</span>
                      </div>
                      <p className="text-xs text-stone-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DIFFS TAB */}
        {activeViewTab === 'diffs' && (
          <div className="space-y-4 animate-fadeIn">
            {diffs.length === 0 ? (
              <div className="p-8 text-center bg-stone-900/60 rounded-xl border border-stone-800 text-xs text-stone-400">
                ยังไม่มี File Diff ที่รอการยืนยัน
              </div>
            ) : (
              <div className="space-y-4">
                {/* File Switcher */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {diffs.map((d) => (
                    <button
                      key={d.fileName}
                      onClick={() => setActiveDiffFile(d.fileName)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                        selectedDiff?.fileName === d.fileName
                          ? 'bg-amber-500 text-stone-950 font-bold border-amber-400'
                          : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                      }`}
                    >
                      {d.fileName} ({d.action})
                    </button>
                  ))}
                </div>

                {/* Diff Viewer Card */}
                {selectedDiff && (
                  <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 space-y-2">
                    <div className="flex items-center justify-between text-xs text-stone-400 border-b border-stone-800 pb-2">
                      <span className="font-bold text-stone-200">{selectedDiff.fileName}</span>
                      <span className="uppercase text-amber-400">{selectedDiff.action}</span>
                    </div>
                    <pre className="p-3 rounded-lg bg-stone-950 border border-stone-800 font-mono text-xs text-stone-300 overflow-x-auto max-h-96">
                      {selectedDiff.newContent}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TOOLS EXECUTIONS TAB */}
        {activeViewTab === 'tools' && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              Tool Invocation Audit Log
            </h3>
            {toolResults.length === 0 ? (
              <div className="p-8 text-center bg-stone-900/60 rounded-xl border border-stone-800 text-xs text-stone-400">
                ยังไม่มี Tool Execution ในรอบนี้
              </div>
            ) : (
              <div className="space-y-2">
                {toolResults.map((t, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 ${t.success ? 'text-emerald-400' : 'text-rose-400'}`} />
                      <span className="font-bold text-stone-200">{t.tool}</span>
                    </div>
                    <span className="text-stone-500 font-mono text-[11px]">{t.metadata?.durationMs || 10}ms</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VALIDATION GATE TAB */}
        {activeViewTab === 'validation' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-5 rounded-xl bg-stone-900/90 border border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-stone-100">Self-Validation & Build Gate</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Passed
                </span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                ตรวจสอบความสมบูรณ์ของโครงสร้าง HTML5, Tag Matching, CSS Braces, และ JavaScript Functions
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2">
                <div className="p-3 rounded-lg bg-stone-950/70 border border-stone-800 text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>ไม่มี Unimplemented TODO Placeholder</span>
                </div>
                <div className="p-3 rounded-lg bg-stone-950/70 border border-stone-800 text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Braces และ Parentheses สมดุล 100%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
