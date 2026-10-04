import {
  CapabilityAssessment,
  ChangelogEntry,
  CodeFile,
  DependencyAuditResult,
  DependencyRecord,
  PerformanceAuditResult,
  ProductionBuildResult,
  ProjectContext,
  ReleaseChecklistItem,
  ReleaseEvidence,
  ReleaseGateResult,
  ReleaseReport,
  ReleaseRun,
  ReleaseStageId,
  ReleaseStageResult,
  RealityReport,
  SecurityAuditResult,
  SecurityFinding,
  VersionSuggestion,
  ValidationResult,
  RuntimeProbeResult,
} from '../types';
import { byteSize, assemblePreviewDocument, findEntryHtmlFile } from '../utils/documentAssembler';
import { maskSecrets } from './toolOrchestrator';

export const RELEASE_STAGE_DEFINITIONS: Array<{ id: ReleaseStageId; name: string; description: string }> = [
  { id: 'UNDERSTAND', name: 'Understand', description: 'ตรวจเป้าหมาย โปรเจกต์ และข้อจำกัดก่อน release' },
  { id: 'ANALYZE', name: 'Analyze', description: 'วิเคราะห์โครงสร้าง ไฟล์ และ dependencies ที่มีอยู่จริง' },
  { id: 'PLAN', name: 'Plan', description: 'วาง release plan และ release gate จากหลักฐานที่ตรวจได้' },
  { id: 'CODE', name: 'Code', description: 'ตรวจผลการเปลี่ยนแปลงและความพร้อมของ source files' },
  { id: 'VALIDATE', name: 'Validate', description: 'ตรวจ syntax, imports, references และ validation engine เดิม' },
  { id: 'BROWSER_QA', name: 'Browser QA', description: 'รันโปรเจกต์จริงใน browser probe และอ่าน console/runtime' },
  { id: 'VISUAL_QA', name: 'Visual QA', description: 'ตรวจ DOM, overflow, touch target และ responsive behavior จาก browser จริง' },
  { id: 'SECURITY_AUDIT', name: 'Security Audit', description: 'สแกน source/config จริงโดยไม่เปิดเผย secret' },
  { id: 'PERFORMANCE_AUDIT', name: 'Performance Audit', description: 'วัดขนาดไฟล์และรายการ request ที่ตรวจได้จริง' },
  { id: 'PRODUCTION_BUILD', name: 'Production Build', description: 'ประกอบ static production document และตรวจผลลัพธ์จริง' },
  { id: 'RELEASE_CHECK', name: 'Release Check', description: 'ประเมิน release gate และหลักฐานทุกด้าน' },
  { id: 'EXPORT', name: 'Export', description: 'เตรียม release artifact โดยยังไม่เผยแพร่ภายนอก' },
  { id: 'SUMMARY', name: 'Summary', description: 'สร้าง release report และ final reality report' },
];

function evidence(label: string, value: string, detail?: string): ReleaseEvidence {
  return { label, value, detail };
}

function stage(
  id: ReleaseStageId,
  status: ReleaseStageResult['status'],
  messages: string[],
  evidences: ReleaseEvidence[],
  capability: ReleaseStageResult['capability'] = 'REAL',
  durationMs = 0
): ReleaseStageResult {
  const now = new Date().toISOString();
  return {
    id,
    name: RELEASE_STAGE_DEFINITIONS.find((d) => d.id === id)?.name || id,
    description: RELEASE_STAGE_DEFINITIONS.find((d) => d.id === id)?.description || '',
    status,
    startedAt: now,
    finishedAt: now,
    durationMs,
    evidence: evidences,
    messages,
    capability,
  };
}

function fileLine(content: string, index: number): number {
  return content.slice(0, index).split('\n').length;
}

const SECRET_PATTERNS: Array<{ category: SecurityFinding['category']; pattern: RegExp; severity: SecurityFinding['severity']; description: string }> = [
  { category: 'api_key', pattern: /AIza[0-9A-Za-z_-]{20,}/g, severity: 'CRITICAL', description: 'พบ Google API key-like value ใน source' },
  { category: 'token', pattern: /(?:sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})/g, severity: 'CRITICAL', description: 'พบ token-like value ใน source' },
  { category: 'private_key', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g, severity: 'CRITICAL', description: 'พบ private key marker' },
  { category: 'password', pattern: /(?:password|passwd|pwd)\s*[:=]\s*["'`][^"'`\n]{6,}/gi, severity: 'HIGH', description: 'พบ password assignment ที่อาจเป็น credential' },
  { category: 'client_side_secret', pattern: /(?:api[_-]?key|client[_-]?secret|access[_-]?token)\s*[:=]\s*["'`][^"'`\n]{8,}/gi, severity: 'HIGH', description: 'พบ secret-like assignment ที่อาจถูก bundle ฝั่ง client' },
  { category: 'insecure_configuration', pattern: /(?:http:\/\/|rejectUnauthorized\s*:\s*false|dangerouslySetInnerHTML)/g, severity: 'MEDIUM', description: 'พบ configuration/API pattern ที่ควร review' },
];

export function runSecurityAudit(files: CodeFile[]): SecurityAuditResult {
  const findings: SecurityFinding[] = [];
  let scannedBytes = 0;
  files.forEach((file) => {
    scannedBytes += byteSize(file.content);
    SECRET_PATTERNS.forEach((rule, ri) => {
      rule.pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = rule.pattern.exec(file.content))) {
        const masked = maskSecrets(match[0]).replace(/(?<=[A-Za-z0-9])([A-Za-z0-9_-]{3,})/g, '********');
        findings.push({
          id: `sec-${findings.length + 1}`,
          category: rule.category,
          severity: rule.severity,
          file: file.name,
          line: fileLine(file.content, match.index),
          maskedSample: masked.slice(0, 100),
          description: rule.description,
          recommendation: rule.severity === 'CRITICAL' ? 'ลบออกจาก source และใช้ server-side secret/env ที่ไม่ commit' : 'ตรวจสอบว่าไม่ใช่ credential จริง และย้าย secret ไป server-side env',
        });
        if (findings.length >= 100) return;
      }
      if (findings.length >= 100) return;
    });
  });
  const count = (severity: SecurityFinding['severity']) => findings.filter((f) => f.severity === severity).length;
  return {
    passed: !findings.some((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH'),
    releaseBlocked: findings.some((f) => f.severity === 'CRITICAL'),
    criticalCount: count('CRITICAL'),
    highCount: count('HIGH'),
    mediumCount: count('MEDIUM'),
    lowCount: count('LOW'),
    findings,
    scannedFiles: files.length,
    scannedBytes,
    scannedAt: new Date().toISOString(),
  };
}

function packageVersion(raw: string): string {
  return String(raw || 'unknown');
}

export function runDependencyAudit(context: ProjectContext): DependencyAuditResult {
  const packageFile = context.files.find((f) => f.name === 'package.json');
  const declared: Record<string, string> = {};
  if (packageFile) {
    try {
      const json = JSON.parse(packageFile.content);
      Object.assign(declared, json.dependencies || {}, json.devDependencies || {}, json.optionalDependencies || {});
    } catch {
      // validation engine reports malformed JSON separately
    }
  }
  const deps: DependencyRecord[] = Object.entries(declared).map(([pkg, version]) => {
    const usedIn = context.files.filter((f) => f.content.includes(`'${pkg}'`) || f.content.includes(`"${pkg}"`) || f.content.includes(`from '${pkg}`) || f.content.includes(`from "${pkg}`)).map((f) => f.name);
    return { package: pkg, version: packageVersion(version), declared: true, usageCount: usedIn.length, usedIn, issues: [], source: 'package.json' };
  });
  const cdnAssets: Array<{ url: string; host: string; integrity: boolean }> = [];
  const external = /(?:src|href)=["'](https?:\/\/[^"']+)["']/gi;
  context.files.forEach((file) => {
    let match: RegExpExecArray | null;
    while ((match = external.exec(file.content))) {
      try { cdnAssets.push({ url: match[1], host: new URL(match[1]).host, integrity: /integrity=["']/.test(file.content) }); } catch { /* ignore malformed URL */ }
    }
  });
  return {
    dependencies: deps,
    total: deps.length,
    unused: deps.filter((d) => d.usageCount === 0).map((d) => d.package),
    missing: [],
    cdnAssets,
    vulnerabilityScan: 'VULNERABILITY_SCAN_UNAVAILABLE',
    notes: ['ตรวจ dependencies จาก package.json และ source usage จริงแล้ว', 'VULNERABILITY_SCAN_UNAVAILABLE: ยังไม่มี external vulnerability database ใน runtime นี้; ไม่ได้อ้างว่า secure'],
    auditedAt: new Date().toISOString(),
  };
}

export function runPerformanceAudit(context: ProjectContext): PerformanceAuditResult {
  const files = context.files || [];
  const totalBytes = files.reduce((sum, f) => sum + byteSize(f.content), 0);
  const largestFiles = files.map((f) => ({ name: f.name, bytes: byteSize(f.content) })).sort((a, b) => b.bytes - a.bytes).slice(0, 5);
  const blockingScripts = files.filter((f) => f.name.endsWith('.html') && /<script(?![^>]*\b(?:async|defer)\b)[^>]*src=/i.test(f.content)).map((f) => f.name);
  const externalRequests: string[] = [];
  const urlPattern = /(?:src|href)=["'](https?:\/\/[^"']+)["']/gi;
  files.forEach((f) => { let m: RegExpExecArray | null; while ((m = urlPattern.exec(f.content))) externalRequests.push(m[1]); });
  return {
    metrics: [
      { label: 'Source bytes', value: `${totalBytes} bytes`, numeric: totalBytes, unit: 'bytes', status: 'MEASURED' },
      { label: 'Source files', value: `${files.length}`, numeric: files.length, unit: 'files', status: 'MEASURED' },
      { label: 'Largest file', value: largestFiles[0] ? `${largestFiles[0].name} (${largestFiles[0].bytes} bytes)` : 'UNAVAILABLE', status: largestFiles[0] ? 'MEASURED' : 'UNAVAILABLE' },
      { label: 'Network timing', value: 'UNAVAILABLE', status: 'UNAVAILABLE', detail: 'ต้องวัดจาก browser performance entries ของ deployment จริง' },
      { label: 'Lighthouse/Core Web Vitals', value: 'UNAVAILABLE', status: 'UNAVAILABLE', detail: 'ยังไม่มี Lighthouse ใน runtime นี้' },
    ],
    totalBytes,
    totalFiles: files.length,
    largestFiles,
    blockingScripts,
    externalRequests: [...new Set(externalRequests)],
    unavailable: ['network timing', 'Lighthouse/Core Web Vitals'],
    auditedAt: new Date().toISOString(),
  };
}

export function runProductionBuild(context: ProjectContext, validation: ValidationResult): ProductionBuildResult {
  const startedAt = new Date().toISOString();
  const start = Date.now();
  const entry = findEntryHtmlFile(context);
  const errors = [...(validation.errors || [])];
  const warnings = [...(validation.warnings || [])];
  let assembledDocumentBytes = 0;
  if (!entry && context.files.length === 0) errors.push('ไม่พบ source files สำหรับ production build');
  if (entry) {
    const assembled = assemblePreviewDocument(context, { includeConsoleInterceptor: false });
    assembledDocumentBytes = byteSize(assembled);
    if (!/<html[\s>]/i.test(assembled)) errors.push('assembled production document ไม่มี <html>');
    if (!/<\/html>/i.test(assembled)) errors.push('assembled production document ไม่มี </html>');
  } else if (context.files.length > 0) {
    warnings.push('ไม่มี HTML entry file; build ตรวจได้เฉพาะ source validation');
  }
  const finishedAt = new Date().toISOString();
  return {
    success: errors.length === 0,
    entryFile: entry?.name,
    mode: 'STATIC_BUILD_VERIFICATION',
    durationMs: Date.now() - start,
    errors,
    warnings,
    outputBytes: context.files.reduce((sum, f) => sum + byteSize(f.content), 0),
    outputFiles: context.files.length,
    assembledDocumentBytes,
    startedAt,
    finishedAt,
    fixAttempts: 0,
  };
}

export function suggestVersion(context: ProjectContext, previousFiles: CodeFile[] = []): VersionSuggestion {
  const current = context.releaseVersion || '1.0.0';
  const previous = new Map(previousFiles.map((f) => [f.name, f.content]));
  let added = 0, changed = 0, removed = 0;
  context.files.forEach((f) => { if (!previous.has(f.name)) added++; else if (previous.get(f.name) !== f.content) changed++; });
  previousFiles.forEach((f) => { if (!context.files.some((cf) => cf.name === f.name)) removed++; });
  const parts = current.split('.').map((n) => Number(n) || 0);
  let bump: VersionSuggestion['bump'] = 'NONE';
  if (removed > 0) bump = 'MAJOR'; else if (added > 0) bump = 'MINOR'; else if (changed > 0) bump = 'PATCH';
  const suggested = [...parts] as number[];
  if (bump === 'MAJOR') { suggested[0]++; suggested[1] = 0; suggested[2] = 0; }
  if (bump === 'MINOR') { suggested[1]++; suggested[2] = 0; }
  if (bump === 'PATCH') suggested[2]++;
  return { current, suggested: suggested.join('.'), bump, rationale: `ตรวจพบ Added ${added}, Changed ${changed}, Removed ${removed} จากไฟล์ที่เปรียบเทียบได้`, counts: { added, changed, removed } };
}

export function generateChangelog(context: ProjectContext, previousFiles: CodeFile[] = []): ChangelogEntry[] {
  const previous = new Map(previousFiles.map((f) => [f.name, f.content]));
  const entries: ChangelogEntry[] = [];
  context.files.forEach((f) => {
    if (!previous.has(f.name)) entries.push({ type: 'Added', description: `เพิ่มไฟล์ ${f.name}`, files: [f.name] });
    else if (previous.get(f.name) !== f.content) entries.push({ type: 'Changed', description: `ปรับปรุง ${f.name} จาก source ที่ตรวจพบ`, files: [f.name] });
  });
  previousFiles.forEach((f) => { if (!context.files.some((cf) => cf.name === f.name)) entries.push({ type: 'Removed', description: `ลบไฟล์ ${f.name}`, files: [f.name] }); });
  return entries;
}

function probeStage(probes: RuntimeProbeResult[], kind: 'browser' | 'visual'): ReleaseStageResult {
  const loaded = probes.filter((p) => p.loaded);
  if (loaded.length === 0) return stage(kind === 'browser' ? 'BROWSER_QA' : 'VISUAL_QA', 'UNAVAILABLE', ['ไม่สามารถรัน browser probe ได้'], [evidence('Probe', 'UNAVAILABLE', probes[0]?.unavailableReason)], 'UNAVAILABLE');
  const consoleErrors = loaded.reduce((n, p) => n + p.consoleErrors.length + p.runtimeExceptions.length, 0);
  const overflow = loaded.filter((p) => p.overflow.hasHorizontalOverflow).length;
  const tooSmall = loaded.reduce((n, p) => n + p.touchTargets.tooSmall, 0);
  const failed = kind === 'browser' ? consoleErrors > 0 : overflow > 0 || tooSmall > 0;
  return stage(kind === 'browser' ? 'BROWSER_QA' : 'VISUAL_QA', failed ? 'FAIL' : 'PASS', failed ? ['พบปัญหาจากการรันจริง'] : ['ตรวจจาก browser probe จริงแล้ว'], [
    evidence('Viewports loaded', `${loaded.length}/${probes.length}`),
    evidence('Console/runtime errors', `${consoleErrors}`),
    evidence('Horizontal overflow viewports', `${overflow}`),
    evidence('Touch targets below threshold', `${tooSmall}`),
  ], 'REAL');
}

export function buildReleaseGate(
  validation: ValidationResult,
  build: ProductionBuildResult,
  security: SecurityAuditResult,
  browser: ReleaseStageResult,
  visual: ReleaseStageResult,
  dependencies: DependencyAuditResult,
  performance: PerformanceAuditResult,
  probes: RuntimeProbeResult[]
): ReleaseGateResult {
  const checklist: ReleaseChecklistItem[] = [];
  const add = (id: string, label: string, status: ReleaseChecklistItem['status'], ev: string) => checklist.push({ id, label, status, evidence: ev });
  add('typecheck-validation', 'Code validation', validation.isValid ? 'PASS' : 'FAIL', validation.isValid ? `0 errors; ${validation.warnings.length} warnings` : validation.errors.join('; '));
  add('production-build', 'Production build', build.success ? 'PASS' : 'FAIL', build.success ? `${build.outputFiles} files / ${build.outputBytes} bytes` : build.errors.join('; '));
  add('browser-qa', 'Browser smoke test', browser.status === 'PASS' ? 'PASS' : browser.status === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'FAIL', browser.evidence.map((e) => `${e.label}: ${e.value}`).join(', '));
  add('visual-qa', 'Visual QA', visual.status === 'PASS' ? 'PASS' : visual.status === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'FAIL', visual.evidence.map((e) => `${e.label}: ${e.value}`).join(', '));
  add('security', 'Security scan', security.releaseBlocked ? 'FAIL' : security.passed ? 'PASS' : 'WARN', `critical=${security.criticalCount}, high=${security.highCount}, scanned=${security.scannedFiles} files`);
  add('dependencies', 'Dependency audit', 'WARN', `${dependencies.total} declared; ${dependencies.vulnerabilityScan}`);
  add('performance', 'Performance audit', 'WARN', `${performance.totalBytes} bytes measured; ${performance.unavailable.length} metrics unavailable`);
  const blockingIssues = checklist.filter((c) => c.status === 'FAIL').map((c) => `${c.label}: ${c.evidence}`);
  const unavailable = checklist.filter((c) => c.status === 'UNAVAILABLE').map((c) => `${c.label} unavailable`);
  const warnings = [...checklist.filter((c) => c.status === 'WARN').map((c) => `${c.label}: ${c.evidence}`), ...unavailable];
  const decision = blockingIssues.length > 0 ? 'BLOCKED' : warnings.length > 0 ? 'NOT_READY' : 'READY';
  return { decision, blockingIssues, warnings, checklist, evaluatedAt: new Date().toISOString() };
}

export function buildRealityReport(run: ReleaseRun): RealityReport {
  const assessments: CapabilityAssessment[] = [
    { capability: 'Production Build', reality: run.build ? 'REAL' : 'UNAVAILABLE', evidence: run.build ? `${run.build.mode}; success=${run.build.success}` : 'ไม่มีผล build' },
    { capability: 'Security Audit', reality: run.security ? 'REAL' : 'UNAVAILABLE', evidence: run.security ? `สแกน ${run.security.scannedFiles} files; findings masked` : 'ไม่มีผล security' },
    { capability: 'Dependency Audit', reality: run.dependencies ? 'PARTIAL' : 'UNAVAILABLE', evidence: run.dependencies ? `${run.dependencies.total} deps; ${run.dependencies.vulnerabilityScan}` : 'ไม่มีผล dependency' },
    { capability: 'Performance Audit', reality: run.performance ? 'PARTIAL' : 'UNAVAILABLE', evidence: run.performance ? `${run.performance.totalBytes} bytes measured; unavailable=${run.performance.unavailable.join(', ') || 'none'}` : 'ไม่มีผล performance' },
    { capability: 'Release Gate', reality: run.gate ? 'REAL' : 'UNAVAILABLE', evidence: run.gate ? `decision=${run.gate.decision}; checklist=${run.gate.checklist.length}` : 'ไม่มีผล gate' },
    { capability: 'Versioning', reality: run.report ? 'REAL' : 'UNAVAILABLE', evidence: run.report ? run.report.version : 'ไม่มี report' },
    { capability: 'Changelog', reality: 'REAL', evidence: `${run.changelog.length} entries generated from file comparison` },
    { capability: 'Snapshot', reality: run.snapshotId ? 'REAL' : 'UNAVAILABLE', evidence: run.snapshotId || 'ยังไม่ได้สร้าง snapshot' },
    { capability: 'Rollback', reality: 'REAL', evidence: 'ใช้ existing restoreSnapshot mechanism; exact files are stored in snapshot' },
    { capability: 'Export', reality: run.exportReady ? 'REAL' : 'UNAVAILABLE', evidence: run.exportReady ? 'artifact can be assembled; external publish is not performed' : 'ยังไม่พร้อม export' },
    { capability: 'Release Report', reality: run.report ? 'REAL' : 'UNAVAILABLE', evidence: run.report ? 'generated from run results' : 'ยังไม่มี report' },
  ];
  return { generatedAt: new Date().toISOString(), assessments };
}

export function buildReleaseReport(
  context: ProjectContext,
  version: string,
  suggestion: VersionSuggestion,
  validation: ValidationResult,
  build: ProductionBuildResult,
  browser: ReleaseStageResult,
  visual: ReleaseStageResult,
  security: SecurityAuditResult,
  dependencies: DependencyAuditResult,
  performance: PerformanceAuditResult,
  gate: ReleaseGateResult,
  changelog: ChangelogEntry[],
  probes: RuntimeProbeResult[]
): ReleaseReport {
  const accessibility: ReleaseChecklistItem[] = [];
  const loaded = probes.filter((p) => p.loaded);
  if (!loaded.length) accessibility.push({ id: 'a11y-probe', label: 'Accessibility runtime probe', status: 'UNAVAILABLE', evidence: 'ไม่มี browser probe result' });
  else {
    const noAlt = loaded.reduce((n, p) => n + p.accessibility.imagesWithoutAlt, 0);
    const noLabel = loaded.reduce((n, p) => n + p.accessibility.inputsWithoutLabel, 0);
    accessibility.push({ id: 'images-alt', label: 'Images have alt text', status: noAlt === 0 ? 'PASS' : 'WARN', evidence: `${noAlt} missing alt attributes across loaded viewports` });
    accessibility.push({ id: 'form-labels', label: 'Form controls have labels', status: noLabel === 0 ? 'PASS' : 'WARN', evidence: `${noLabel} controls without accessible label across loaded viewports` });
    accessibility.push({ id: 'document-title', label: 'Document title', status: loaded.every((p) => !!p.accessibility.documentTitle) ? 'PASS' : 'WARN', evidence: loaded.map((p) => p.accessibility.documentTitle || 'missing').join(' | ') });
  }
  return {
    id: `release-report-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    projectName: context.projectName || context.name || 'Project',
    version,
    versionSuggestion: suggestion,
    decision: gate.decision,
    productionReadiness: gate.checklist,
    build,
    validation,
    browserQA: browser,
    visualQA: visual,
    security,
    dependencies,
    performance,
    accessibility,
    filesChanged: changelog.flatMap((c) => c.files).filter((f, i, a) => a.indexOf(f) === i),
    changelog,
    warnings: [...gate.warnings, ...accessibility.filter((a) => a.status === 'WARN').map((a) => `${a.label}: ${a.evidence}`)],
    blockingIssues: gate.blockingIssues,
    runtimeProbe: loaded[0] || null,
  };
}
