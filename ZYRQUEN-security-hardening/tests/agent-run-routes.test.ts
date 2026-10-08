import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'codevoice-agent-run-routes-'));
process.env.CODEVOICE_DURABLE_ROOT = root;

const runs = await import('../server/agentRunController.ts');
const { listDurableRecordIds, loadDurableRecord } = await import('../server/durableStore.ts');
const R = await import('../src/server/agentRunRoutes.ts');

// Minimal Express-like harness: collects handlers, invokes them with fake req/res.
const handlers = new Map<string, any>();
const app = { get: (p: string, h: any) => handlers.set('GET ' + p, h), post: (p: string, h: any) => handlers.set('POST ' + p, h) };
const auditCalls: any[] = []; const incCalls: any[] = [];
const controller = { create: runs.createAgentRun as any, load: runs.loadAgentRun as any, approve: runs.approveAgentRun as any, cancel: runs.cancelAgentRun as any, listIds: (n: number) => listDurableRecordIds('agent-run', n) };
R.registerAgentRunRoutes(app as any, { controller, audit: (a: string, o: any) => auditCalls.push({ a, ...o }), inc: (n: string, l: any) => incCalls.push({ n, ...l }) });

async function call(method: 'GET' | 'POST', route: string, userId: string | undefined, opts: { params?: any; body?: any } = {}) {
  const h = handlers.get(`${method} ${route}`); assert.ok(h, `route registered: ${method} ${route}`);
  let status = 200, body: any;
  const res: any = { status(n: number) { status = n; return res; }, json(b: any) { body = b; return res; } };
  await h({ userId, params: opts.params || {}, body: opts.body }, res);
  return { status, body };
}
const READY_CAPS = ['workspace.read', 'workspace.inspect'];
const mk = (user: string | undefined, over: any = {}) => call('POST', '/api/agent/runs', user, { body: { project: 'p1', agentId: 'agent-1', goal: 'inspect the workspace', capabilities: READY_CAPS, ...over } });

test('all expected routes are registered', () => {
  for (const k of ['POST /api/agent/runs', 'GET /api/agent/runs', 'GET /api/agent/runs/:id', 'POST /api/agent/runs/:id/approve', 'POST /api/agent/runs/:id/cancel']) assert.ok(handlers.has(k), k);
});

test('unauthenticated or malformed user ids get 401 on every route', async () => {
  for (const u of [undefined, '', '../x', 'a.b']) {
    assert.equal((await mk(u)).status, 401);
    assert.equal((await call('GET', '/api/agent/runs', u)).status, 401);
    assert.equal((await call('GET', '/api/agent/runs/:id', u, { params: { id: 'x' } })).status, 401);
    assert.equal((await call('POST', '/api/agent/runs/:id/approve', u, { params: { id: 'x' } })).status, 401);
    assert.equal((await call('POST', '/api/agent/runs/:id/cancel', u, { params: { id: 'x' } })).status, 401);
  }
});

test('input validation rejects bad fields with the field name and creates nothing', async () => {
  const before = (await listDurableRecordIds('agent-run', 2000)).length;
  const bad: Array<[any, string]> = [
    [{ project: '../x' }, 'project'], [{ project: 'a.b' }, 'project'], [{ project: 'x'.repeat(49) }, 'project'], [{ project: 5 }, 'project'],
    [{ agentId: '' }, 'agentId'], [{ agentId: 'a b' }, 'agentId'],
    [{ goal: '' }, 'goal'], [{ goal: '   ' }, 'goal'], [{ goal: 'x'.repeat(2001) }, 'goal'], [{ goal: 42 }, 'goal'],
    [{ capabilities: 'workspace.read' }, 'capabilities'], [{ capabilities: Array(31).fill('a') }, 'capabilities'], [{ capabilities: ['../etc'] }, 'capabilities'], [{ capabilities: [1] }, 'capabilities'],
    [{ maxRisk: 'CRITICAL' }, 'maxRisk'], [{ maxRisk: 'low' }, 'maxRisk'],
    [{ maxAttempts: 0 }, 'maxAttempts'], [{ maxAttempts: 11 }, 'maxAttempts'], [{ maxAttempts: 1.5 }, 'maxAttempts'],
  ];
  for (const [over, field] of bad) { const r = await mk('alice', over); assert.equal(r.status, 400, JSON.stringify(over)); assert.equal(r.body.field, field, JSON.stringify(over)); }
  assert.equal((await call('POST', '/api/agent/runs', 'alice', { body: null })).status, 400);
  assert.equal((await listDurableRecordIds('agent-run', 2000)).length, before);
});

let aliceReady: any;
test('create stores the run under a per-user namespace and hides the internal project id', async () => {
  const r = await mk('alice');
  assert.equal(r.status, 201); aliceReady = r.body.run;
  assert.match(aliceReady.runId, R.RUN_ID_RE); assert.equal(aliceReady.status, 'READY');
  assert.equal(aliceReady.project, 'p1'); assert.equal(aliceReady.projectId, undefined);
  const stored = (await loadDurableRecord<any>('agent-run', aliceReady.runId))!.payload;
  assert.equal(stored.projectId, 'alice.p1');
  assert.ok(auditCalls.some(a => a.a === 'agent.run.create' && a.actor === 'alice' && a.target === aliceReady.runId));
  assert.ok(incCalls.some(i => i.n === 'agent_run_total' && i.op === 'create'));
});

test('default risk is MEDIUM over HTTP: a HIGH-risk capability is not silently admitted', async () => {
  const caps = (await import('../server/agentCapabilityRegistry.ts')).listAgentCapabilities().capabilities as any[];
  const high = caps.find(c => c.risk === 'HIGH' || c.risk === 'CRITICAL');
  if (!high) return; // registry has none: nothing to assert
  const r = await mk('alice', { capabilities: [high.id] });
  assert.equal(r.status, 201); assert.equal(r.body.run.status, 'BLOCKED');
});

test('a user cannot read, list, approve or cancel another user\'s run (404, no existence leak)', async () => {
  const id = aliceReady.runId;
  assert.equal((await call('GET', '/api/agent/runs/:id', 'bob', { params: { id } })).status, 404);
  assert.equal((await call('POST', '/api/agent/runs/:id/approve', 'bob', { params: { id } })).status, 404);
  assert.equal((await call('POST', '/api/agent/runs/:id/cancel', 'bob', { params: { id } })).status, 404);
  const list = await call('GET', '/api/agent/runs', 'bob'); assert.equal(list.status, 200); assert.deepEqual(list.body.runs, []);
  assert.equal((await loadDurableRecord<any>('agent-run', id))!.payload.status, 'READY', 'bob changed nothing');
  // a user whose id is a prefix-lookalike must not match either ("alice" vs "alice-2")
  assert.equal((await call('GET', '/api/agent/runs/:id', 'alice-2', { params: { id } })).status, 404);
  assert.equal(R.ownsRun('alice-2', { projectId: 'alice.p1' }), false);
  assert.equal(R.ownsRun('alice', { projectId: 'alice-2.p1' }), false);
});

test('malformed or hostile run ids are 404 and never reach the store', async () => {
  for (const id of ['../x', 'agent-run-x', '', 'agent-run-' + 'a'.repeat(200), 'agent-run-00000000-0000-0000-0000-000000000000/../../x']) {
    assert.equal((await call('GET', '/api/agent/runs/:id', 'alice', { params: { id } })).status, 404, id);
    assert.equal((await call('POST', '/api/agent/runs/:id/approve', 'alice', { params: { id } })).status, 404, id);
  }
});

test('owner can read the run; list returns summaries only (no plan/simulation)', async () => {
  const g = await call('GET', '/api/agent/runs/:id', 'alice', { params: { id: aliceReady.runId } });
  assert.equal(g.status, 200); assert.equal(g.body.run.runId, aliceReady.runId); assert.ok(g.body.run.plan);
  const l = await call('GET', '/api/agent/runs', 'alice');
  assert.ok(l.body.runs.length >= 1 && l.body.total >= 1);
  for (const s of l.body.runs) { assert.equal(s.plan, undefined); assert.equal(s.simulation, undefined); assert.equal(s.projectId, undefined); assert.ok(s.goal.length <= 200); }
  const times = l.body.runs.map((s: any) => s.createdAt); assert.deepEqual(times, [...times].sort().reverse(), 'newest first');
});

test('approval always uses the authenticated user, never a body-supplied approver', async () => {
  const r = await mk('carol', { capabilities: ['developer.verify'] });
  assert.equal(r.body.run.status, 'APPROVAL_REQUIRED');
  const a = await call('POST', '/api/agent/runs/:id/approve', 'carol', { params: { id: r.body.run.runId }, body: { approvedBy: 'mallory' } });
  assert.equal(a.status, 200); assert.equal(a.body.run.status, 'APPROVED'); assert.equal(a.body.run.approval.approvedBy, 'carol');
  assert.ok(auditCalls.some(x => x.a === 'agent.run.approve' && x.actor === 'carol'));
  // idempotent for the same approver
  assert.equal((await call('POST', '/api/agent/runs/:id/approve', 'carol', { params: { id: r.body.run.runId } })).status, 200);
});

test('cancel is final: later approve/cancel return 409 and the record is unchanged', async () => {
  const r = await mk('dave', { capabilities: ['developer.verify'] });
  const id = r.body.run.runId;
  const c = await call('POST', '/api/agent/runs/:id/cancel', 'dave', { params: { id } }); assert.equal(c.status, 200); assert.equal(c.body.run.status, 'CANCELLED');
  const a = await call('POST', '/api/agent/runs/:id/approve', 'dave', { params: { id } }); assert.equal(a.status, 409);
  assert.equal((await call('POST', '/api/agent/runs/:id/cancel', 'dave', { params: { id } })).status, 409);
  assert.equal((await loadDurableRecord<any>('agent-run', id))!.payload.status, 'CANCELLED');
});

test('a BLOCKED run cannot be approved (409)', async () => {
  const r = await mk('erin', { capabilities: ['nonexistent.capability'] });
  assert.equal(r.body.run.status, 'BLOCKED');
  assert.equal((await call('POST', '/api/agent/runs/:id/approve', 'erin', { params: { id: r.body.run.runId } })).status, 409);
});

test('internal errors are reported as a generic 500 without leaking details', async () => {
  const failing = new Map<string, any>();
  R.registerAgentRunRoutes({ get: (p: string, h: any) => failing.set('GET ' + p, h), post: (p: string, h: any) => failing.set('POST ' + p, h) } as any, {
    controller: { ...controller, create: async () => { throw new Error('ENOENT: /secret/path/leak'); }, listIds: async () => { throw new Error('EACCES /secret'); } },
  });
  let status = 0, body: any; const res: any = { status(n: number) { status = n; return res; }, json(b: any) { body = b; return res; } };
  await failing.get('POST /api/agent/runs')({ userId: 'alice', params: {}, body: { project: 'p', agentId: 'a', goal: 'g' } }, res);
  assert.equal(status, 500); assert.deepEqual(body, { error: 'INTERNAL_ERROR' });
  await failing.get('GET /api/agent/runs')({ userId: 'alice', params: {} }, res);
  assert.equal(status, 500); assert.equal(JSON.stringify(body).includes('secret'), false);
});

test('list is bounded: scans at most MAX_SCAN ids, returns at most MAX_LIST, flags truncation', async () => {
  const ids = Array.from({ length: R.MAX_SCAN }, (_, i) => `agent-run-fake-${i}`);
  let loads = 0;
  const bounded = new Map<string, any>();
  R.registerAgentRunRoutes({ get: (p: string, h: any) => bounded.set('GET ' + p, h), post: () => {} } as any, {
    controller: { ...controller, listIds: async (n: number) => { assert.equal(n, R.MAX_SCAN); return ids; },
      load: async (id: string) => { loads++; return { runId: id, projectId: 'zed.p', agentId: 'a', goal: 'g', status: 'READY', createdAt: String(1000 + loads), updatedAt: 'x' }; } },
  });
  let body: any; const res: any = { status() { return res; }, json(b: any) { body = b; return res; } };
  await bounded.get('GET /api/agent/runs')({ userId: 'zed', params: {} }, res);
  assert.equal(body.runs.length, R.MAX_LIST); assert.equal(body.total, R.MAX_SCAN); assert.equal(body.truncated, true); assert.equal(loads, R.MAX_SCAN);
});

test.after(async () => { await fs.rm(root, { recursive: true, force: true }); });
