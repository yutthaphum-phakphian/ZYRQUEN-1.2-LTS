#!/usr/bin/env node
import crypto from 'node:crypto';

const required = ['CODEVOICE_BASE_URL', 'ZYRQUEN_BASE_URL', 'ZYRQUEN_USER_ID'];
for (const k of required) if (!process.env[k]) {
  console.error(`[bridge] BLOCKED: missing ${k}`);
  process.exit(2);
}

const cv = new URL(process.env.CODEVOICE_BASE_URL);
const zy = new URL(process.env.ZYRQUEN_BASE_URL);
for (const [name, u] of [['CODEVOICE_BASE_URL', cv], ['ZYRQUEN_BASE_URL', zy]]) {
  if (!['http:', 'https:'].includes(u.protocol)) throw new Error(`${name}_PROTOCOL_NOT_ALLOWED`);
  if (process.env.NODE_ENV === 'production' && u.protocol !== 'https:') throw new Error(`${name}_HTTPS_REQUIRED`);
}

const timeoutMs = Math.min(Math.max(Number(process.env.BRIDGE_TIMEOUT_MS || 10000), 1000), 30000);
const authHeader = process.env.ZYRQUEN_AUTH_TOKEN ? { Authorization: `Bearer ${process.env.ZYRQUEN_AUTH_TOKEN}` } : {};

async function request(base, path, options = {}) {
  const url = new URL(path, base);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { Accept: 'application/json', ...(options.body ? {'Content-Type': 'application/json'} : {}), ...options.headers },
    });
    const text = await res.text();
    let body; try { body = JSON.parse(text); } catch { body = { raw: text.slice(0, 2000) }; }
    if (!res.ok) throw new Error(`${res.status}:${JSON.stringify(body)}`);
    return body;
  } finally { clearTimeout(timer); }
}

const health = {
  codevoice: await request(cv, process.env.CODEVOICE_HEALTH_PATH || '/api/health'),
  zyrquen: await request(zy, process.env.ZYRQUEN_HEALTH_PATH || '/api/health'),
};
console.log('[bridge] health PASS', JSON.stringify({ codevoice: health.codevoice.status, zyrquen: health.zyrquen.status }));

const objective = process.env.BRIDGE_OBJECTIVE || 'Verify CodeVoice AI to ZYRQUEN governed execution handoff';
const proposalPath = process.env.CODEVOICE_PROPOSAL_PATH || '/api/ai/workspace';
let proposal = null;
if (process.env.BRIDGE_SKIP_PROPOSAL !== '1') {
  proposal = await request(cv, proposalPath, {
    method: 'POST',
    body: JSON.stringify({ message: objective, mode: 'PROPOSE_ONLY', approvalRequired: true }),
  });
  console.log('[bridge] CodeVoice proposal PASS');
}

const run = await request(zy, '/api/agent/runs', {
  method: 'POST',
  headers: { ...authHeader, 'X-Bridge-Id': crypto.randomUUID() },
  body: JSON.stringify({
    project: process.env.ZYRQUEN_PROJECT || 'codevoice-bridge',
    agentId: process.env.ZYRQUEN_AGENT_ID || 'codevoice-ai',
    goal: objective,
    capabilities: ['ANALYZE', 'PLAN', 'VALIDATE'],
    maxRisk: 'MEDIUM',
    maxAttempts: 3,
  }),
});
console.log('[bridge] ZYRQUEN governed run created:', run.run?.runId || 'unknown');

if (process.env.BRIDGE_AUTO_APPROVE === '1') {
  if (!process.env.ZYRQUEN_AUTH_TOKEN) throw new Error('AUTO_APPROVE_REQUIRES_ZYRQUEN_AUTH_TOKEN');
  const approved = await request(zy, `/api/agent/runs/${encodeURIComponent(run.run.runId)}/approve`, {
    method: 'POST', headers: authHeader,
  });
  console.log('[bridge] approval PASS:', approved.run?.status || 'unknown');
} else {
  console.log('[bridge] approval NOT EXECUTED: manual approval required');
}

console.log(JSON.stringify({
  ok: true,
  health,
  proposalReceived: !!proposal,
  runId: run.run?.runId,
  execution: 'GOVERNED_ONLY',
}, null, 2));
