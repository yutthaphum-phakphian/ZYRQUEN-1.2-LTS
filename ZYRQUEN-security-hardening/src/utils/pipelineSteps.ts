import type { AgentRuntimeState, AgentStep, FileChangeDiff, TestReport, ToolResult, ValidationResult } from '../types';

export interface PipelineInput {
  runtimeState: AgentRuntimeState;
  diffs?: FileChangeDiff[];
  validation?: ValidationResult;
  testReport?: TestReport;
  toolResults?: ToolResult[];
}

const LABELS = [
  'เข้าใจคำสั่ง (Understand Request)',
  'วิเคราะห์โปรเจกต์ & Memory (Analyze)',
  'วางแผนงาน (Create Plan)',
  'เรียกใช้ Tools & แก้ไขไฟล์ (Execute)',
  'ตรวจสอบโค้ด (Validate Code Gate)',
  'จำลอง Browser & ตรวจสอบ Visual QA (V9)',
  'อัปเดต Live Preview',
  'สรุปผลและรายงานด้วยเสียง (Summary)',
];

const step = (i: number, status: AgentStep['status'], detail?: string): AgentStep => ({ id: String(i + 1), label: LABELS[i], status, ...(detail ? { detail } : {}) });

/**
 * Derives the 8 pipeline steps from real runtime evidence. Rules:
 *  - FAILED never leaves steps silently "pending": the failing step is marked failed, steps that never ran are skipped,
 *    and only steps with real evidence (valid validation, a QA report) stay completed.
 *  - COMPLETED completes every step except optional Browser QA, which is "skipped" when no report exists.
 *  - Other states keep the original progressive behaviour.
 */
export function derivePipelineSteps({ runtimeState, diffs = [], validation, testReport, toolResults = [] }: PipelineInput, failureReason?: string): AgentStep[] {
  const executed = diffs.length > 0 || toolResults.length > 0;

  if (runtimeState === 'COMPLETED') {
    return LABELS.map((_, i) => step(i, i === 5 && !testReport ? 'skipped' : 'completed', i === 5 && !testReport ? 'ไม่ได้รัน Browser QA' : undefined));
  }

  if (runtimeState === 'FAILED') {
    const toolFailed = toolResults.find(r => !r.success);
    const validationFailed = !!validation && !validation.isValid;
    // Which stage actually broke: a failed validation gate, a failed tool, otherwise the execution/request itself.
    const failAt = validationFailed && !toolFailed ? 4 : 3;
    const toolMsg = toolFailed ? (typeof toolFailed.error === 'string' ? toolFailed.error : toolFailed.error?.message) : undefined;
    const detail = failAt === 4 ? (validation?.errors?.[0] || failureReason) : (failureReason || toolMsg);
    return LABELS.map((_, i) => {
      if (i < 3) return step(i, 'completed');
      if (i === failAt) return step(i, 'failed', detail);
      if (i < failAt) return step(i, 'completed');
      if (i === 4 && validation?.isValid) return step(i, 'completed');
      if (i === 5 && testReport) return step(i, 'completed');
      return step(i, 'skipped', 'ข้าม: ขั้นก่อนหน้าล้มเหลว');
    });
  }

  // Original progressive behaviour for non-terminal states, plus tool-only runs count as executed.
  return [
    step(0, 'completed'),
    step(1, 'completed'),
    step(2, runtimeState === 'PLANNING' ? 'running' : 'completed'),
    step(3, runtimeState === 'EXECUTING' ? 'running' : executed ? 'completed' : 'pending'),
    step(4, validation?.isValid ? 'completed' : runtimeState === 'VALIDATING' ? 'running' : 'pending'),
    step(5, testReport ? 'completed' : 'pending'),
    step(6, diffs.length > 0 ? 'completed' : 'pending'),
    step(7, 'pending'),
  ];
}
