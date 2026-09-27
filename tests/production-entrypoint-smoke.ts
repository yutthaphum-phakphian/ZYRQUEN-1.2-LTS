import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const PORT = 3199;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function waitForServer(child: ChildProcess): Promise<void> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`server exited before readiness with code ${child.exitCode}`);
    }
    try {
      const response = await fetch(`${BASE_URL}/healthz`);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error('timed out waiting for production server readiness');
}

test('production entrypoint exposes one truthful evidence contract', async () => {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(npmCommand, ['start'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
    stdio: 'ignore',
  });

  try {
    await waitForServer(child);

    const health = await fetch(`${BASE_URL}/healthz`).then((response) => response.json());
    assert.equal(health.status, 'ONLINE');

    const evidence = await fetch(`${BASE_URL}/api/v1/evidence/exhibits`).then((response) => response.json());
    assert.equal(evidence.totalExhibits, 7);
    assert.match(evidence.exhibits[0].legalBasis, /พ\.ร\.บ\. ธุรกรรมฯ/);
    assert.equal(evidence.exhibits[0].evidenceState, 'STATIC_REFERENCE');
    assert.equal(evidence.exhibits[0].provenance, 'SOURCE_FILE');

    const replay = await fetch(`${BASE_URL}/api/v1/replay/verify`, { method: 'POST' }).then((response) => response.json());
    assert.equal(replay.slaStatus, 'PASS');
    assert.match(replay.zeroDriftRatio, /0\.00%/);
  } finally {
    child.kill('SIGTERM');
    if (child.exitCode === null) {
      await Promise.race([
        once(child, 'exit'),
        new Promise((resolve) => setTimeout(resolve, 2_000)),
      ]);
    }
    if (child.exitCode === null) child.kill('SIGKILL');
  }
});
