/**
 * Lightweight in-process metrics (Prometheus text exposition format).
 * No external dependency. Suitable for single-instance or as a sidecar scrape target.
 */
export type CounterMap = Map<string, number>;

const counters: CounterMap = new Map();
const histograms: Map<string, number[]> = new Map(); // simple latency samples (ms), capped

const MAX_SAMPLES = 200;

function key(name: string, labels?: Record<string, string>): string {
  if (!labels || !Object.keys(labels).length) return name;
  const parts = Object.keys(labels)
    .sort()
    .map((k) => `${k}="${String(labels[k]).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
  return `${name}{${parts.join(',')}}`;
}

export function inc(name: string, labels?: Record<string, string>, by = 1) {
  const k = key(name, labels);
  counters.set(k, (counters.get(k) || 0) + by);
}

export function observe(name: string, valueMs: number, labels?: Record<string, string>) {
  const k = key(name, labels);
  let arr = histograms.get(k);
  if (!arr) {
    arr = [];
    histograms.set(k, arr);
  }
  arr.push(valueMs);
  if (arr.length > MAX_SAMPLES) arr.shift();
  // Also keep a simple count + sum for averages
  inc(name + '_count', labels, 1);
  inc(name + '_sum_ms', labels, Math.round(valueMs));
}

export function snapshot(): { counters: Record<string, number>; histograms: Record<string, { count: number; avgMs: number; p95Ms: number }> } {
  const c: Record<string, number> = {};
  for (const [k, v] of counters) c[k] = v;
  const h: Record<string, { count: number; avgMs: number; p95Ms: number }> = {};
  for (const [k, arr] of histograms) {
    if (!arr.length) continue;
    const sorted = [...arr].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
    h[k] = { count: sorted.length, avgMs: Math.round(sum / sorted.length), p95Ms: Math.round(p95) };
  }
  return { counters: c, histograms: h };
}

/** Prometheus text format (OpenMetrics-compatible enough for most scrapers). */
export function toPrometheus(extraLabels: Record<string, string> = {}): string {
  const lines: string[] = [];
  const snap = snapshot();
  const help = new Set<string>();

  const emitHelp = (metric: string, type: string, helpText: string) => {
    if (help.has(metric)) return;
    help.add(metric);
    lines.push(`# HELP ${metric} ${helpText}`);
    lines.push(`# TYPE ${metric} ${type}`);
  };

  for (const [k, v] of Object.entries(snap.counters)) {
    const base = k.replace(/\{.*\}$/, '');
    emitHelp(base, 'counter', base);
    // Merge extra labels into existing label set if present
    if (k.includes('{') && Object.keys(extraLabels).length) {
      const m = /^([^{]+)\{(.+)\}$/.exec(k);
      if (m) {
        const existing = m[2];
        const extra = Object.keys(extraLabels)
          .sort()
          .map((lk) => `${lk}="${String(extraLabels[lk]).replace(/"/g, '\\"')}"`)
          .join(',');
        lines.push(`${m[1]}{${existing},${extra}} ${v}`);
        continue;
      }
    }
    if (!k.includes('{') && Object.keys(extraLabels).length) {
      const extra = Object.keys(extraLabels)
        .sort()
        .map((lk) => `${lk}="${String(extraLabels[lk]).replace(/"/g, '\\"')}"`)
        .join(',');
      lines.push(`${k}{${extra}} ${v}`);
    } else {
      lines.push(`${k} ${v}`);
    }
  }

  for (const [k, h] of Object.entries(snap.histograms)) {
    const base = k.replace(/\{.*\}$/, '');
    emitHelp(base + '_p95_ms', 'gauge', base + ' p95 latency ms');
    const labelPart = k.includes('{') ? k.slice(k.indexOf('{')) : '';
    lines.push(`${base}_p95_ms${labelPart} ${h.p95Ms}`);
    lines.push(`${base}_avg_ms${labelPart} ${h.avgMs}`);
  }

  lines.push('');
  return lines.join('\n');
}

/** Express middleware: count requests + observe latency by route group. */
export function metricsMiddleware(req: any, res: any, next: any) {
  const start = Date.now();
  const path = String(req.path || req.url || 'unknown').split('?')[0];
  // Group dynamic segments lightly
  const route =
    path.startsWith('/api/login') ? '/api/login' :
    path.startsWith('/api/logout') ? '/api/logout' :
    path.startsWith('/api/session') ? '/api/session' :
    path.startsWith('/api/health') ? '/api/health' :
    path.startsWith('/api/metrics') ? '/api/metrics' :
    path.startsWith('/api/chat') ? '/api/chat' :
    path.startsWith('/api/') ? '/api/*' :
    path === '/' ? '/' : 'static';

  res.on('finish', () => {
    const ms = Date.now() - start;
    const status = String(res.statusCode || 0);
    inc('http_requests_total', { route, method: req.method || 'GET', status });
    observe('http_request_duration_ms', ms, { route, method: req.method || 'GET' });
    if (status === '401') inc('auth_failures_total', { reason: 'unauthorized' });
    if (status === '429') inc('auth_failures_total', { reason: 'rate_limited' });
  });
  next();
}
