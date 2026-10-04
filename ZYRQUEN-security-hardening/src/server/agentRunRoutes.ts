/**
 * HTTP surface for the governed agent-run library in /server (plan → simulate → admit → approve/cancel).
 *
 * Scope: these routes only create, read, approve and cancel *governance records*. They never execute tools or
 * change project files. Runs are namespaced per user (`<userId>.<project>`), the approver is always the
 * authenticated user (never taken from the body), and policy management is deliberately NOT exposed so a user
 * cannot grant themselves capabilities.
 */
import { USER_ID_RE } from './auth';

export const PROJECT_RE = /^[A-Za-z0-9_-]{1,48}$/;
export const AGENT_ID_RE = /^[A-Za-z0-9._-]{1,64}$/;
export const CAPABILITY_RE = /^[A-Za-z0-9._:-]{1,64}$/;
export const RUN_ID_RE = /^agent-run-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
// CRITICAL is not requestable over HTTP, and the default is MEDIUM (the library itself would default to HIGH).
const RISKS = new Set(['LOW', 'MEDIUM', 'HIGH']);
export const DEFAULT_HTTP_MAX_RISK = 'MEDIUM' as const;
export const MAX_SCAN = 2000;
export const MAX_LIST = 50;

export interface RunLike { runId: string; projectId: string; agentId: string; goal: string; status: string; createdAt: string; updatedAt: string; [k: string]: unknown }
export interface RunController {
  create(input: { projectId: string; agentId: string; goal: string; capabilities?: string[]; maxRisk?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; maxAttempts?: number }): Promise<RunLike>;
  load(runId: string): Promise<RunLike | null>;
  approve(runId: string, approvedBy: string): Promise<RunLike>;
  cancel(runId: string): Promise<RunLike>;
  listIds(limit: number): Promise<string[]>;
}
export interface RouteDeps {
  controller: RunController;
  audit?: (action: string, opts?: { actor?: string; target?: string; result?: string; detail?: string }) => unknown;
  inc?: (name: string, labels?: Record<string, string>) => unknown;
}
interface Res { status(n: number): Res; json(b: unknown): unknown }
interface Req { userId?: string; params: Record<string, string>; body?: any; query?: Record<string, any> }
type Handler = (req: Req, res: Res) => Promise<unknown>;
export interface AppLike { get(path: string, h: Handler): unknown; post(path: string, h: Handler): unknown }

/** `<userId>.<project>` — '.' cannot appear in a user id, so the prefix is unambiguous. */
export const namespacedProject = (userId: string, project: string) => `${userId}.${project}`;
export const ownsRun = (userId: string, run: { projectId: string } | null | undefined) => !!run && typeof run.projectId === 'string' && run.projectId.startsWith(userId + '.');
const publicProject = (userId: string, projectId: string) => projectId.slice(userId.length + 1);

export const summarize = (userId: string, r: RunLike) => ({ runId: r.runId, project: publicProject(userId, r.projectId), agentId: r.agentId, goal: String(r.goal).slice(0, 200), status: r.status, createdAt: r.createdAt, updatedAt: r.updatedAt });
const detail = (userId: string, r: RunLike) => ({ ...r, projectId: undefined, project: publicProject(userId, r.projectId) });

/** Maps controller errors to safe HTTP responses (no internals leaked). */
export function mapError(e: unknown): { status: number; error: string } {
  const m = e instanceof Error ? e.message : String(e);
  if (m === 'INVALID_AGENT_RUN' || m === 'INVALID_DURABLE_ID' || m === 'INVALID_APPROVER') return { status: 400, error: 'BAD_REQUEST' };
  if (m === 'AGENT_RUN_NOT_FOUND') return { status: 404, error: 'NOT_FOUND' };
  if (m.startsWith('AGENT_RUN_TERMINAL') || m.startsWith('INVALID_AGENT_RUN_TRANSITION')) return { status: 409, error: m.split(':')[0] };
  if (m === 'APPROVER_DENIED') return { status: 403, error: 'APPROVER_DENIED' };
  return { status: 500, error: 'INTERNAL_ERROR' };
}

export function validateCreate(body: any): { ok: true; value: { project: string; agentId: string; goal: string; capabilities?: string[]; maxRisk?: 'LOW' | 'MEDIUM' | 'HIGH'; maxAttempts?: number } } | { ok: false; field: string } {
  if (!body || typeof body !== 'object') return { ok: false, field: 'body' };
  if (typeof body.project !== 'string' || !PROJECT_RE.test(body.project)) return { ok: false, field: 'project' };
  if (typeof body.agentId !== 'string' || !AGENT_ID_RE.test(body.agentId)) return { ok: false, field: 'agentId' };
  if (typeof body.goal !== 'string' || !body.goal.trim() || body.goal.length > 2000) return { ok: false, field: 'goal' };
  let capabilities: string[] | undefined;
  if (body.capabilities !== undefined) {
    if (!Array.isArray(body.capabilities) || body.capabilities.length > 30 || body.capabilities.some((c: unknown) => typeof c !== 'string' || !CAPABILITY_RE.test(c))) return { ok: false, field: 'capabilities' };
    capabilities = body.capabilities;
  }
  if (body.maxRisk !== undefined && !RISKS.has(body.maxRisk)) return { ok: false, field: 'maxRisk' };
  if (body.maxAttempts !== undefined && (!Number.isInteger(body.maxAttempts) || body.maxAttempts < 1 || body.maxAttempts > 10)) return { ok: false, field: 'maxAttempts' };
  return { ok: true, value: { project: body.project, agentId: body.agentId, goal: body.goal.trim(), capabilities, maxRisk: body.maxRisk, maxAttempts: body.maxAttempts } };
}

export function registerAgentRunRoutes(app: AppLike, deps: RouteDeps) {
  const { controller: c } = deps;
  const track = (op: string, result: string) => deps.inc?.('agent_run_total', { op, result });
  const who = (req: Req, res: Res): string | null => { const u = req.userId; if (!u || !USER_ID_RE.test(u)) { res.status(401).json({ error: 'UNAUTHORIZED' }); return null; } return u; };
  const owned = async (user: string, id: string): Promise<RunLike | null> => (RUN_ID_RE.test(id) ? ((r) => (ownsRun(user, r) ? r : null))(await c.load(id)) : null);

  app.post('/api/agent/runs', async (req, res) => {
    const user = who(req, res); if (!user) return;
    const v = validateCreate(req.body); if (!v.ok) { track('create', 'invalid'); return res.status(400).json({ error: 'BAD_REQUEST', field: v.field }); }
    try {
      const run = await c.create({ projectId: namespacedProject(user, v.value.project), agentId: v.value.agentId, goal: v.value.goal, capabilities: v.value.capabilities, maxRisk: v.value.maxRisk ?? DEFAULT_HTTP_MAX_RISK, maxAttempts: v.value.maxAttempts });
      track('create', run.status); deps.audit?.('agent.run.create', { actor: user, target: run.runId, result: run.status });
      return res.status(201).json({ ok: true, run: detail(user, run) });
    } catch (e) { const m = mapError(e); track('create', 'error'); return res.status(m.status).json({ error: m.error }); }
  });

  app.get('/api/agent/runs', async (req, res) => {
    const user = who(req, res); if (!user) return;
    try {
      const ids = await c.listIds(MAX_SCAN);
      const mine: RunLike[] = [];
      for (let i = 0; i < ids.length; i += 25) { // bounded concurrency
        const batch = await Promise.all(ids.slice(i, i + 25).map(async (id) => { try { return await c.load(id); } catch { return null; } }));
        for (const r of batch) if (ownsRun(user, r)) mine.push(r as RunLike);
      }
      mine.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      return res.json({ runs: mine.slice(0, MAX_LIST).map((r) => summarize(user, r)), total: mine.length, scanned: ids.length, truncated: ids.length >= MAX_SCAN });
    } catch (e) { const m = mapError(e); return res.status(m.status).json({ error: m.error }); }
  });

  app.get('/api/agent/runs/:id', async (req, res) => {
    const user = who(req, res); if (!user) return;
    try { const r = await owned(user, req.params.id); return r ? res.json({ run: detail(user, r) }) : res.status(404).json({ error: 'NOT_FOUND' }); }
    catch (e) { const m = mapError(e); return res.status(m.status).json({ error: m.error }); }
  });

  for (const op of ['approve', 'cancel'] as const) {
    app.post(`/api/agent/runs/:id/${op}`, async (req, res) => {
      const user = who(req, res); if (!user) return;
      try {
        if (!(await owned(user, req.params.id))) { track(op, 'not_found'); return res.status(404).json({ error: 'NOT_FOUND' }); }
        const run = op === 'approve' ? await c.approve(req.params.id, user) : await c.cancel(req.params.id); // approver = authenticated user
        track(op, run.status); deps.audit?.(`agent.run.${op}`, { actor: user, target: run.runId, result: run.status });
        return res.json({ ok: true, run: detail(user, run) });
      } catch (e) { const m = mapError(e); track(op, 'error'); deps.audit?.(`agent.run.${op}`, { actor: user, target: req.params.id, result: 'error', detail: m.error }); return res.status(m.status).json({ error: m.error }); }
    });
  }
}
