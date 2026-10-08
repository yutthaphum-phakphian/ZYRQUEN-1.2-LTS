import { ProjectContext, RuntimeProbeResult } from '../types';
import { assemblePreviewDocument, findEntryHtmlFile } from '../utils/documentAssembler';

/**
 * V10 Runtime Probe.
 *
 * This is a REAL execution probe: the assembled project document is actually
 * mounted inside a hidden iframe in the live browser, its scripts really run,
 * and the measurements below are read from the real DOM / real console.
 *
 * Nothing in this file fabricates a result. If the probe cannot run (no DOM,
 * blocked iframe, timeout) it returns loaded:false with an explicit
 * unavailableReason so callers report UNAVAILABLE instead of PASS.
 */

export const PROBE_SOURCE = 'codevoice-probe';

export const DEFAULT_PROBE_CHECKS = [
  'header',
  'nav',
  'main',
  'footer',
  'button',
  'a[href]',
  'form',
  'input',
  'img',
  'script',
  'link[rel="stylesheet"]',
  '[role="button"]',
];

export interface ProbeOptions {
  width?: number;
  height?: number;
  viewportName?: 'mobile' | 'tablet' | 'desktop';
  timeoutMs?: number;
  checks?: string[];
  context?: ProjectContext;
}

const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
};

/**
 * Harness injected into the probed document. Kept dependency free and defensive:
 * a failure inside the harness must never break the probed application.
 */
function buildHarness(checks: string[]): string {
  return `
<script>
(function () {
  var SRC = '${PROBE_SOURCE}';
  var CHECKS = ${JSON.stringify(checks)};
  var started = (window.performance && performance.now) ? performance.now() : 0;
  var errors = [], warnings = [], exceptions = [], failedAssets = [];
  var done = false;

  function fmt(args) {
    try {
      return Array.prototype.slice.call(args).map(function (a) {
        if (a instanceof Error) return a.message;
        if (typeof a === 'object' && a !== null) { try { return JSON.stringify(a); } catch (e) { return '[object]'; } }
        return String(a);
      }).join(' ');
    } catch (e) { return '[unserializable]'; }
  }

  function post(kind, payload) {
    try { window.parent.postMessage({ source: SRC, kind: kind, payload: payload }, '*'); } catch (e) {}
  }

  var _error = console.error, _warn = console.warn;
  console.error = function () { errors.push(fmt(arguments)); try { _error.apply(console, arguments); } catch (e) {} };
  console.warn = function () { warnings.push(fmt(arguments)); try { _warn.apply(console, arguments); } catch (e) {} };

  window.onerror = function (msg, url, line) {
    exceptions.push(String(msg) + ' @ ' + (url || 'inline') + ':' + (line || 0));
    return false;
  };

  window.addEventListener('unhandledrejection', function (e) {
    var r = e && e.reason;
    exceptions.push('Unhandled Promise Rejection: ' + (r && r.message ? r.message : String(r)));
  });

  // Capture-phase listener catches real resource load failures (missing script/style/img).
  window.addEventListener('error', function (e) {
    var t = e && e.target;
    if (t && t !== window && t.tagName) {
      var src = t.src || t.href || '';
      if (src) failedAssets.push(t.tagName.toLowerCase() + ' -> ' + src);
    }
  }, true);

  function measure() {
    var out = { checks: [], overflow: null, touch: null, a11y: null, title: '' };
    try {
      out.title = document.title || '';

      for (var i = 0; i < CHECKS.length; i++) {
        var sel = CHECKS[i], list = [];
        try { list = document.querySelectorAll(sel); } catch (e) { list = []; }
        out.checks.push({ selector: sel, found: list.length > 0, count: list.length });
      }

      var de = document.documentElement;
      var body = document.body;
      var vw = window.innerWidth || de.clientWidth;
      var docW = Math.max(de.scrollWidth || 0, body ? body.scrollWidth || 0 : 0);
      out.overflow = {
        hasHorizontalOverflow: docW > vw + 1,
        documentWidth: Math.round(docW),
        viewportWidth: Math.round(vw)
      };

      var nodes = document.querySelectorAll('button, a[href], input, select, textarea, [role="button"]');
      var total = 0, tooSmall = 0, samples = [];
      for (var j = 0; j < nodes.length; j++) {
        var el = nodes[j];
        var r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        total++;
        if (r.height < 44 || r.width < 24) {
          tooSmall++;
          if (samples.length < 6) {
            samples.push(el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
          }
        }
      }
      out.touch = { total: total, tooSmall: tooSmall, samples: samples };

      var imgs = document.querySelectorAll('img');
      var noAlt = 0;
      for (var k = 0; k < imgs.length; k++) {
        if (!imgs[k].hasAttribute('alt')) noAlt++;
      }
      var inputs = document.querySelectorAll('input, select, textarea');
      var noLabel = 0;
      for (var m = 0; m < inputs.length; m++) {
        var inp = inputs[m];
        var hasLabel = !!inp.getAttribute('aria-label') || !!inp.getAttribute('aria-labelledby');
        if (!hasLabel && inp.id) {
          try { hasLabel = !!document.querySelector('label[for="' + inp.id + '"]'); } catch (e) {}
        }
        if (!hasLabel) hasLabel = !!inp.closest('label');
        if (!hasLabel) noLabel++;
      }
      out.a11y = { imagesWithoutAlt: noAlt, inputsWithoutLabel: noLabel, documentTitle: out.title };
    } catch (e) {
      out.measureError = String(e && e.message ? e.message : e);
    }
    return out;
  }

  function finish(reason) {
    if (done) return;
    done = true;
    var m = measure();
    var ended = (window.performance && performance.now) ? performance.now() : 0;
    post('report', {
      reason: reason || 'load',
      loadTimeMs: Math.round(ended - started),
      consoleErrors: errors,
      consoleWarnings: warnings,
      runtimeExceptions: exceptions,
      failedAssets: failedAssets,
      domChecks: m.checks,
      overflow: m.overflow,
      touchTargets: m.touch,
      accessibility: m.a11y,
      measureError: m.measureError || null
    });
  }

  window.addEventListener('load', function () { setTimeout(function () { finish('load'); }, 900); });
  document.addEventListener('DOMContentLoaded', function () { setTimeout(function () { finish('domcontentloaded'); }, 2500); });
  setTimeout(function () { finish('timeout'); }, 5000);
})();
</script>
`.trim();
}

function unavailable(
  viewport: RuntimeProbeResult['viewport'],
  reason: string
): RuntimeProbeResult {
  return {
    loaded: false,
    viewport,
    consoleErrors: [],
    consoleWarnings: [],
    runtimeExceptions: [],
    failedAssets: [],
    domChecks: [],
    overflow: { hasHorizontalOverflow: false, documentWidth: 0, viewportWidth: 0 },
    touchTargets: { total: 0, tooSmall: 0, samples: [] },
    accessibility: { imagesWithoutAlt: 0, inputsWithoutLabel: 0, documentTitle: '' },
    measuredAt: new Date().toISOString(),
    unavailableReason: reason,
  };
}

/** Fallback: read the real DOM directly from the same-origin iframe. */
function measureDirectly(
  iframe: HTMLIFrameElement,
  checks: string[],
  viewport: RuntimeProbeResult['viewport'],
  consoleErrors: string[],
  consoleWarnings: string[],
  runtimeExceptions: string[],
  failedAssets: string[]
): RuntimeProbeResult | null {
  try {
    const doc = iframe.contentDocument;
    if (!doc || !doc.documentElement) return null;

    const domChecks = checks.map((selector) => {
      let count = 0;
      try {
        count = doc.querySelectorAll(selector).length;
      } catch {
        count = 0;
      }
      return { selector, found: count > 0, count };
    });

    const de = doc.documentElement;
    const viewportWidth = iframe.clientWidth || viewport.width;
    const documentWidth = Math.max(de.scrollWidth || 0, doc.body ? doc.body.scrollWidth || 0 : 0);

    const nodes = Array.from(
      doc.querySelectorAll('button, a[href], input, select, textarea, [role="button"]')
    ) as HTMLElement[];
    let total = 0;
    let tooSmall = 0;
    const samples: string[] = [];
    nodes.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      total++;
      if (r.height < 44 || r.width < 24) {
        tooSmall++;
        if (samples.length < 6) {
          samples.push(
            `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} ${Math.round(r.width)}x${Math.round(r.height)}`
          );
        }
      }
    });

    const imgs = Array.from(doc.querySelectorAll('img'));
    const imagesWithoutAlt = imgs.filter((i) => !i.hasAttribute('alt')).length;
    const inputs = Array.from(doc.querySelectorAll('input, select, textarea'));
    const inputsWithoutLabel = inputs.filter((i) => {
      const el = i as HTMLElement;
      if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return false;
      if (el.id && doc.querySelector(`label[for="${el.id}"]`)) return false;
      return !el.closest('label');
    }).length;

    return {
      loaded: true,
      viewport,
      consoleErrors,
      consoleWarnings,
      runtimeExceptions,
      failedAssets,
      domChecks,
      overflow: {
        hasHorizontalOverflow: documentWidth > viewportWidth + 1,
        documentWidth: Math.round(documentWidth),
        viewportWidth: Math.round(viewportWidth),
      },
      touchTargets: { total, tooSmall, samples },
      accessibility: { imagesWithoutAlt, inputsWithoutLabel, documentTitle: doc.title || '' },
      measuredAt: new Date().toISOString(),
    };
  } catch (err: any) {
    return null;
  }
}

/**
 * Run the real execution probe against a project (or a raw document string).
 */
export async function runRuntimeProbe(
  contextOrHtml: ProjectContext | string,
  options: ProbeOptions = {}
): Promise<RuntimeProbeResult> {
  const viewportName = options.viewportName || 'mobile';
  const dims = VIEWPORTS[viewportName];
  const width = options.width || dims.width;
  const height = options.height || dims.height;
  const viewport = { width, height, name: viewportName };
  const timeoutMs = options.timeoutMs ?? 9000;
  const checks = options.checks || DEFAULT_PROBE_CHECKS;

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return unavailable(viewport, 'ไม่มี DOM ในสภาพแวดล้อมนี้ (รันได้เฉพาะบน Browser)');
  }

  const context: ProjectContext =
    typeof contextOrHtml === 'string'
      ? { description: 'probe', framework: 'html', files: [{ name: 'index.html', language: 'html', content: contextOrHtml }] }
      : contextOrHtml;

  if (!context.files || context.files.length === 0) {
    return unavailable(viewport, 'โปรเจกต์ไม่มีไฟล์สำหรับรัน Probe');
  }

  const html = assemblePreviewDocument(context, {
    includeConsoleInterceptor: false,
    headScript: buildHarness(checks),
  });

  const iframe = document.createElement('iframe');
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-modals');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = `position:fixed;top:0;left:-20000px;width:${width}px;height:${height}px;border:0;opacity:0;pointer-events:none;z-index:-1;`;

  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];
  const runtimeExceptions: string[] = [];
  const failedAssets: string[] = [];

  let settled = false;
  let harnessPayload: any = null;

  const cleanup = () => {
    window.removeEventListener('message', onMessage);
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
  };

  function onMessage(event: MessageEvent) {
    if (event.source !== iframe.contentWindow) return;
    const data = event.data;
    if (!data || data.source !== PROBE_SOURCE) return;
    if (data.kind === 'report') {
      harnessPayload = data.payload;
      settled = true;
    }
  }

  window.addEventListener('message', onMessage);

  const container = document.body || document.documentElement;
  container.appendChild(iframe);

  const startedAt = Date.now();
  iframe.srcdoc = html;

  await new Promise<void>((resolve) => {
    const poll = window.setInterval(() => {
      if (settled || Date.now() - startedAt > timeoutMs) {
        window.clearInterval(poll);
        resolve();
      }
    }, 120);
  });

  // Allow one extra tick for the harness report to be delivered.
  await new Promise((r) => window.setTimeout(r, 80));

  if (harnessPayload) {
    const result: RuntimeProbeResult = {
      loaded: true,
      viewport,
      consoleErrors: harnessPayload.consoleErrors || [],
      consoleWarnings: harnessPayload.consoleWarnings || [],
      runtimeExceptions: harnessPayload.runtimeExceptions || [],
      failedAssets: harnessPayload.failedAssets || [],
      domChecks: harnessPayload.domChecks || [],
      overflow: harnessPayload.overflow || {
        hasHorizontalOverflow: false,
        documentWidth: 0,
        viewportWidth: width,
      },
      touchTargets: harnessPayload.touchTargets || { total: 0, tooSmall: 0, samples: [] },
      accessibility: harnessPayload.accessibility || {
        imagesWithoutAlt: 0,
        inputsWithoutLabel: 0,
        documentTitle: '',
      },
      loadTimeMs: harnessPayload.loadTimeMs,
      measuredAt: new Date().toISOString(),
    };
    cleanup();
    return result;
  }

  // Harness did not report (blocked / stripped) - try direct same-origin DOM read.
  const direct = measureDirectly(
    iframe,
    checks,
    viewport,
    consoleErrors,
    consoleWarnings,
    runtimeExceptions,
    failedAssets
  );
  cleanup();

  if (direct) {
    direct.unavailableReason =
      'Console interception ไม่พร้อมใช้งาน (อ่านค่าได้จาก DOM จริงเท่านั้น)';
    return direct;
  }

  return unavailable(
    viewport,
    `Probe ไม่สามารถรันโปรเจกต์ได้ภายใน ${timeoutMs}ms (iframe ถูกบล็อกหรือไม่มีผลลัพธ์)`
  );
}

/** Convenience: probe every responsive viewport. */
export async function runResponsiveProbe(context: ProjectContext): Promise<RuntimeProbeResult[]> {
  const results: RuntimeProbeResult[] = [];
  for (const name of ['mobile', 'tablet', 'desktop'] as const) {
    results.push(await runRuntimeProbe(context, { viewportName: name }));
  }
  return results;
}

export function describeProbeSource(context: ProjectContext): string {
  const entry = findEntryHtmlFile(context);
  return entry ? entry.name : '(ไม่มีไฟล์ HTML - ใช้ไฟล์แรกเป็น entry)';
}
