import JSZip from 'jszip';
import {
  ChangelogEntry,
  CodeFile,
  ProjectContext,
  RealityReport,
  ReleaseReport,
} from '../types';
import { byteSize } from './documentAssembler';

/**
 * V10 Release Artifact.
 *
 * Reuses the existing ZIP Export system (JSZip) but adds the release-specific
 * guarantees required for a production export:
 *  - secret-bearing files are EXCLUDED entirely
 *  - secret-looking values inside included files are REDACTED (never exported)
 *  - release version, changelog, metadata and the release report are included
 *
 * The artifact is really assembled (a real Blob is produced and measured)
 * before any download happens.
 */

const EXCLUDED_FILE_PATTERNS: RegExp[] = [
  /^\.env/i,
  /\.env$/i,
  /\.env\./i,
  /\.pem$/i,
  /\.key$/i,
  /\.p12$/i,
  /\.pfx$/i,
  /\.jks$/i,
  /^id_(rsa|dsa|ecdsa|ed25519)/i,
  /credential/i,
  /secret/i,
  /^\.npmrc$/i,
  /^\.netrc$/i,
  /^\.htpasswd$/i,
];

const REDACTION_RULES: Array<{ pattern: RegExp; replace: string }> = [
  { pattern: /(AIza)[0-9A-Za-z\-_]{35}/g, replace: '$1****************' },
  { pattern: /(sk-ant-)[A-Za-z0-9\-_]{16,}/g, replace: '$1****************' },
  { pattern: /(sk-)[A-Za-z0-9\-_]{20,}/g, replace: '$1****************' },
  { pattern: /(gh[pousr]_)[A-Za-z0-9]{20,}/g, replace: '$1****************' },
  { pattern: /(github_pat_)[A-Za-z0-9_]{20,}/g, replace: '$1****************' },
  { pattern: /(AKIA)[0-9A-Z]{16}/g, replace: '$1****************' },
  { pattern: /(xox[baprs]-)[A-Za-z0-9-]{10,}/g, replace: '$1****************' },
  { pattern: /(eyJ[A-Za-z0-9_\-]{10,})\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}/g, replace: '$1.********.********' },
  { pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, replace: '-----BEGIN PRIVATE KEY----- ******** -----END PRIVATE KEY-----' },
  {
    pattern:
      /((?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis|amqp):\/\/[^:\s"'@/]+:)[^@\s"']+(@)/g,
    replace: '$1********$2',
  },
  {
    pattern:
      /((?:api[_-]?key|apikey|secret|access[_-]?token|auth[_-]?token|client[_-]?secret|password|passwd|pwd)\s*[:=]\s*["'`])[^"'`\n]{6,}(["'`])/gi,
    replace: '$1********$2',
  },
  { pattern: /(bearer\s+)[A-Za-z0-9_\-.]{25,}/gi, replace: '$1********' },
];

export interface SanitizeResult {
  files: CodeFile[];
  excludedFiles: string[];
  redactions: number;
}

export function isExcludedFromRelease(fileName: string): boolean {
  const base = fileName.split('/').pop() || fileName;
  return EXCLUDED_FILE_PATTERNS.some((p) => p.test(base) || p.test(fileName));
}

export function redactContent(content: string): { content: string; redactions: number } {
  let out = content || '';
  let redactions = 0;
  REDACTION_RULES.forEach((rule) => {
    out = out.replace(rule.pattern, (...args: any[]) => {
      redactions++;
      const groups = args.slice(0, -2);
      let result = rule.replace;
      groups.forEach((g, idx) => {
        result = result.replace(`$${idx + 1}`, g ?? '');
      });
      return result;
    });
  });
  return { content: out, redactions };
}

export function sanitizeFilesForRelease(files: CodeFile[]): SanitizeResult {
  const excludedFiles: string[] = [];
  const kept: CodeFile[] = [];
  let redactions = 0;

  (files || []).forEach((file) => {
    if (isExcludedFromRelease(file.name)) {
      excludedFiles.push(file.name);
      return;
    }
    const { content, redactions: count } = redactContent(file.content);
    redactions += count;
    kept.push({ ...file, content });
  });

  return { files: kept, excludedFiles, redactions };
}

export function changelogToMarkdown(entries: ChangelogEntry[]): string {
  const sections: Array<ChangelogEntry['type']> = ['Added', 'Changed', 'Fixed', 'Removed'];
  const lines: string[] = ['# Changelog', ''];
  if (!entries || entries.length === 0) {
    lines.push('_ไม่พบการเปลี่ยนแปลงที่ตรวจพบได้ (no detectable changes)_');
    return lines.join('\n');
  }
  sections.forEach((section) => {
    const items = entries.filter((e) => e.type === section);
    if (items.length === 0) return;
    lines.push(`## ${section}`);
    items.forEach((item) => {
      lines.push(`- ${item.description}${item.files.length > 0 ? ` (\`${item.files.join('`, `')}\`)` : ''}`);
    });
    lines.push('');
  });
  return lines.join('\n');
}

export function buildReleaseReportMarkdown(report: ReleaseReport, reality?: RealityReport | null): string {
  const L: string[] = [];
  const status = (s: string) => `[${s}]`;

  L.push(`# Release Report - ${report.projectName}`);
  L.push('');
  L.push(`- **Version:** ${report.version}`);
  L.push(`- **Decision:** ${report.decision}`);
  L.push(`- **Generated:** ${report.generatedAt}`);
  L.push('');

  L.push('## Production Readiness');
  report.productionReadiness.forEach((c) => L.push(`- ${status(c.status)} ${c.label} — ${c.evidence}`));
  L.push('');

  L.push('## Build');
  if (report.build) {
    L.push(`- Result: ${report.build.success ? 'SUCCESS' : 'FAILURE'} (${report.build.mode})`);
    L.push(`- Duration: ${report.build.durationMs}ms`);
    L.push(`- Output: ${report.build.outputFiles} files / ${report.build.outputBytes} bytes (unminified)`);
    if (report.build.errors.length) L.push(`- Errors: ${report.build.errors.length}`);
    report.build.errors.forEach((e) => L.push(`  - ${e}`));
    if (report.build.warnings.length) L.push(`- Warnings: ${report.build.warnings.length}`);
    report.build.warnings.forEach((w) => L.push(`  - ${w}`));
  } else {
    L.push('- UNAVAILABLE');
  }
  L.push('');

  L.push('## Validation');
  if (report.validation) {
    L.push(`- Valid: ${report.validation.isValid}`);
    report.validation.errors.forEach((e) => L.push(`  - ERROR: ${e}`));
    report.validation.warnings.forEach((w) => L.push(`  - WARN: ${w}`));
  } else {
    L.push('- UNAVAILABLE');
  }
  L.push('');

  L.push('## Browser QA (real runtime probe)');
  if (report.browserQA) {
    L.push(`- Status: ${report.browserQA.status} (capability: ${report.browserQA.capability})`);
    report.browserQA.evidence.forEach((e) => L.push(`  - ${e.label}: ${e.value}`));
  } else {
    L.push('- UNAVAILABLE');
  }
  L.push('');

  L.push('## Visual QA (real runtime probe)');
  if (report.visualQA) {
    L.push(`- Status: ${report.visualQA.status} (capability: ${report.visualQA.capability})`);
    report.visualQA.evidence.forEach((e) => L.push(`  - ${e.label}: ${e.value}`));
  } else {
    L.push('- UNAVAILABLE');
  }
  L.push('');

  L.push('## Security');
  if (report.security) {
    L.push(`- Passed: ${report.security.passed} | Release blocked: ${report.security.releaseBlocked}`);
    L.push(`- Findings: CRITICAL ${report.security.criticalCount} / HIGH ${report.security.highCount} / MEDIUM ${report.security.mediumCount} / LOW ${report.security.lowCount}`);
    L.push(`- Scanned: ${report.security.scannedFiles} files / ${report.security.scannedBytes} bytes`);
    report.security.findings.forEach((f) => {
      L.push(`  - [${f.severity}] ${f.category}${f.file ? ` @ ${f.file}${f.line ? ':' + f.line : ''}` : ''} — ${f.maskedSample}`);
    });
  } else {
    L.push('- UNAVAILABLE');
  }
  L.push('');

  L.push('## Dependencies');
  if (report.dependencies) {
    L.push(`- Total: ${report.dependencies.total} | Unused: ${report.dependencies.unused.length} | Undeclared: ${report.dependencies.missing.length}`);
    L.push(`- Vulnerability scan: ${report.dependencies.vulnerabilityScan}`);
    report.dependencies.dependencies.forEach((d) =>
      L.push(`  - ${d.package}@${d.version} — usage ${d.usageCount}${d.issues.length ? ` — ${d.issues.join('; ')}` : ''}`)
    );
  } else {
    L.push('- UNAVAILABLE');
  }
  L.push('');

  L.push('## Performance');
  if (report.performance) {
    report.performance.metrics.forEach((m) =>
      L.push(`- ${m.status === 'MEASURED' ? '[MEASURED]' : '[UNAVAILABLE]'} ${m.label}: ${m.value}`)
    );
  } else {
    L.push('- UNAVAILABLE');
  }
  L.push('');

  L.push('## Accessibility');
  report.accessibility.forEach((c) => L.push(`- ${status(c.status)} ${c.label} — ${c.evidence}`));
  L.push('');

  L.push('## Files Changed');
  if (report.filesChanged.length === 0) {
    L.push('- ไม่มีการเปลี่ยนแปลง');
  } else {
    report.filesChanged.forEach((f) => L.push(`- ${f}`));
  }
  L.push('');

  L.push('## Warnings');
  if (report.warnings.length === 0) L.push('- ไม่มี');
  else report.warnings.forEach((w) => L.push(`- ${w}`));
  L.push('');

  L.push('## Blocking Issues');
  if (report.blockingIssues.length === 0) L.push('- ไม่มี');
  else report.blockingIssues.forEach((b) => L.push(`- ${b}`));
  L.push('');

  L.push('## Changelog');
  L.push(changelogToMarkdown(report.changelog));

  if (reality) {
    L.push('');
    L.push('## Final Reality Report');
    reality.assessments.forEach((a) => L.push(`- ${a.capability}: ${a.reality} — ${a.evidence}`));
  }

  return L.join('\n');
}

export interface ReleaseArtifactManifest {
  version: string;
  generatedAt: string;
  filesIncluded: string[];
  filesExcluded: string[];
  redactions: number;
  totalBytes: number;
  decision: string;
  includedDocuments: string[];
}

export interface ReleaseArtifact {
  blob: Blob;
  manifest: ReleaseArtifactManifest;
  reportMarkdown: string;
  fileName: string;
}

/**
 * Really builds the release artifact (in memory) with secrets excluded/redacted.
 */
export async function buildReleaseArtifact(
  context: ProjectContext,
  report: ReleaseReport,
  changelog: ChangelogEntry[],
  version: string,
  reality?: RealityReport | null
): Promise<ReleaseArtifact> {
  const zip = new JSZip();
  const projectName = context.projectName || context.name || 'codevoice-project';
  const folderName = `release-v${version}`;
  const folder = zip.folder(folderName) || zip;

  const { files, excludedFiles, redactions } = sanitizeFilesForRelease(context.files || []);
  const filesIncluded: string[] = [];

  files.forEach((file) => {
    folder.file(file.name, file.content);
    filesIncluded.push(file.name);
  });

  const reportMarkdown = buildReleaseReportMarkdown(report, reality);
  const includedDocuments = ['project.config.json', 'release-metadata.json', 'CHANGELOG.md', 'RELEASE_REPORT.md'];

  folder.file(
    'project.config.json',
    JSON.stringify(
      {
        name: projectName,
        framework: context.framework,
        category: context.category || 'Web App',
        description: context.description,
        features: context.features || [],
        releaseVersion: version,
        exportedAt: new Date().toISOString(),
        generator: 'CodeVoice AI V10 Production Release Agent',
      },
      null,
      2
    )
  );

  folder.file(
    'release-metadata.json',
    JSON.stringify(
      {
        version,
        decision: report.decision,
        generatedAt: report.generatedAt,
        gate: report.productionReadiness,
        blockingIssues: report.blockingIssues,
        warnings: report.warnings,
        build: report.build
          ? {
              success: report.build.success,
              mode: report.build.mode,
              durationMs: report.build.durationMs,
              outputBytes: report.build.outputBytes,
              outputFiles: report.build.outputFiles,
              errors: report.build.errors,
              warnings: report.build.warnings,
            }
          : null,
        security: report.security
          ? {
              passed: report.security.passed,
              releaseBlocked: report.security.releaseBlocked,
              criticalCount: report.security.criticalCount,
              highCount: report.security.highCount,
              scannedFiles: report.security.scannedFiles,
            }
          : null,
        dependencies: report.dependencies
          ? {
              total: report.dependencies.total,
              unused: report.dependencies.unused,
              missing: report.dependencies.missing,
              vulnerabilityScan: report.dependencies.vulnerabilityScan,
            }
          : null,
        performance: report.performance ? report.performance.metrics : null,
        excludedFromArtifact: excludedFiles,
        secretRedactions: redactions,
      },
      null,
      2
    )
  );

  folder.file('CHANGELOG.md', changelogToMarkdown(changelog));
  folder.file('RELEASE_REPORT.md', reportMarkdown);

  const blob = await zip.generateAsync({ type: 'blob' });

  return {
    blob,
    reportMarkdown,
    fileName: `${projectName.toLowerCase().replace(/\s+/g, '-')}-release-v${version}.zip`,
    manifest: {
      version,
      generatedAt: new Date().toISOString(),
      filesIncluded,
      filesExcluded: excludedFiles,
      redactions,
      totalBytes: blob.size || byteSize(reportMarkdown),
      decision: report.decision,
      includedDocuments,
    },
  };
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
