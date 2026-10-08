import { strict as assert } from 'node:assert';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { runDeveloperTool } from '../server/developerToolRuntime.ts';

const root = await fs.mkdtemp(path.join(process.cwd(), '.developer-tools-test-'));
await fs.mkdir(path.join(root, 'src'), { recursive: true });
await fs.writeFile(path.join(root, 'src', 'hello.ts'), 'export const answer = 42;\n// TARGET\n', 'utf8');

const read = await runDeveloperTool({ action: 'READ', workspaceRoot: root, path: 'src/hello.ts' });
assert.equal(read.ok, true);
assert.match(String((read.data as any).content), /answer = 42/);

const search = await runDeveloperTool({ action: 'SEARCH', workspaceRoot: root, query: 'TARGET' });
assert.equal(search.ok, true);
assert.equal((search.data as any).count, 1);

const traversal = await runDeveloperTool({ action: 'READ', workspaceRoot: root, path: '../secret' });
assert.equal(traversal.ok, false);
assert.equal(traversal.error, 'PATH_TRAVERSAL_BLOCKED');

const denied = await runDeveloperTool({ action: 'RUN_TEST', workspaceRoot: root });
assert.equal(denied.ok, false);
assert.equal(denied.error, 'APPROVAL_REQUIRED');

const inspect = await runDeveloperTool({ action: 'INSPECT', workspaceRoot: root });
assert.equal(inspect.ok, true);
assert.equal((inspect.data as any).artifactCount, 0);

console.log('Developer tools milestone: PASS');
