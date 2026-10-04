import { ProjectContext } from '../types';

/**
 * Shared document assembly used by BOTH the Live Sandbox preview and the V10
 * Runtime Probe. Extracted from the original LiveSandbox implementation so the
 * project is only ever assembled in one place (no duplicate preview system).
 */

const PREVIEW_CONSOLE_INTERCEPTOR = `
<style>
  html, body {
    background-color: #0c0a09 !important;
    color: #f5f5f4 !important;
    margin: 0;
    padding: 0;
  }
</style>
<script>
  (function() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    function sendToParent(type, args) {
      try {
        const msg = Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
        window.parent.postMessage({ source: 'codevoice-sandbox', type: type, message: msg }, '*');
      } catch(e) {}
    }

    console.log = function(...args) {
      originalLog.apply(console, args);
      sendToParent('log', args);
    };
    console.error = function(...args) {
      originalError.apply(console, args);
      sendToParent('error', args);
    };
    console.warn = function(...args) {
      originalWarn.apply(console, args);
      sendToParent('warn', args);
    };

    window.onerror = function(msg, url, line) {
      sendToParent('error', ['Error: ' + msg + ' (Line: ' + line + ')']);
      return false;
    };
  })();
</script>
`.trim();

export interface AssembleOptions {
  /** Replaces the default sandbox console interceptor (probe injects its own harness). */
  headScript?: string;
  /** Set to false when headScript already handles console forwarding. */
  includeConsoleInterceptor?: boolean;
}

export function findEntryHtmlFile(context: ProjectContext) {
  const files = context.files || [];
  return files.find((f) => f.name.endsWith('.html')) || files.find((f) => f.language === 'html');
}

export function assemblePreviewDocument(
  context: ProjectContext,
  options: AssembleOptions = {}
): string {
  const files = context.files || [];
  const htmlFile = findEntryHtmlFile(context);
  const cssFiles = files.filter((f) => f.name.endsWith('.css') || f.language === 'css');
  const jsFiles = files.filter(
    (f) => f.name.endsWith('.js') || f.name.endsWith('.ts') || f.language === 'javascript'
  );

  let baseDoc = htmlFile ? htmlFile.content : '';

  if (!baseDoc) {
    const codeToRun = files[0]?.content || '';
    baseDoc = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${context.projectName || context.name || 'Preview'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 p-4 sm:p-6 min-h-screen">
  <div id="root" class="max-w-4xl mx-auto">
    <div class="p-5 bg-slate-800 rounded-2xl border border-slate-700 shadow-xl space-y-4">
      <h1 class="text-xl sm:text-2xl font-bold text-white">${context.projectName || context.name || 'Preview'}</h1>
      <p class="text-xs sm:text-sm text-slate-300">${context.description || 'พรีวิวโค้ดโปรเจกต์'}</p>
      <div id="app-output"></div>
    </div>
  </div>
  <script>
    try {
      ${codeToRun}
    } catch(err) {
      console.error('Runtime Error:', err);
    }
  </script>
</body>
</html>
      `.trim();
  }

  const cssEmbed = cssFiles.length > 0
    ? `\n<style>\n${cssFiles.map((c) => c.content).join('\n')}\n</style>\n`
    : '';

  const jsEmbed = jsFiles.length > 0
    ? `\n<script>\n${jsFiles.map((j) => j.content).join('\n')}\n</script>\n`
    : '';

  const includeInterceptor = options.includeConsoleInterceptor !== false;
  const headInjection = `${includeInterceptor ? PREVIEW_CONSOLE_INTERCEPTOR : ''}${options.headScript || ''}${cssEmbed}`;

  let finalHtml = baseDoc;

  // Strip relative local references to style.css and script.js to avoid 404s inside srcDoc
  finalHtml = finalHtml.replace(/<link[^>]+href=["']style\.css["'][^>]*>/gi, '');
  finalHtml = finalHtml.replace(/<script[^>]+src=["']script\.js["'][^>]*><\/script>/gi, '');

  if (!finalHtml.includes('tailwindcss')) {
    finalHtml = finalHtml.replace(
      '<head>',
      '<head>\n<script src="https://cdn.tailwindcss.com"></script>'
    );
  }

  if (finalHtml.includes('<head>')) {
    finalHtml = finalHtml.replace('<head>', `<head>${headInjection}`);
  } else {
    finalHtml = headInjection + finalHtml;
  }

  if (finalHtml.includes('</body>')) {
    finalHtml = finalHtml.replace('</body>', `${jsEmbed}</body>`);
  } else {
    finalHtml = finalHtml + jsEmbed;
  }

  return finalHtml;
}

/** UTF-8 byte size, used for every size metric reported by V10 (never estimated). */
export function byteSize(text: string): number {
  if (!text) return 0;
  try {
    return new TextEncoder().encode(text).length;
  } catch {
    return text.length;
  }
}
