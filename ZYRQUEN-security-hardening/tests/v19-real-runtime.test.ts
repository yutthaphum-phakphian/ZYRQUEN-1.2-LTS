import assert from 'node:assert/strict';
import { executeLocalCommand } from '../server/localExecutionRuntime.ts';
import { parseExecutionErrors } from '../src/tools/executionErrorParser.ts';

const files = [
  { name: 'package.json', content: JSON.stringify({ scripts: { test: 'node test.js', build: 'node build.js', lint: 'node lint.js' } }) },
  { name: 'test.js', content: "console.log('V19_REAL_TEST_PASS')" },
  { name: 'build.js', content: "require('fs').mkdirSync('dist',{recursive:true}); require('fs').writeFileSync('dist/index.html','V19_BUILD_OK'); console.log('V19_BUILD_PASS')" },
  { name: 'lint.js', content: "console.log('V19_LINT_PASS')" },
];

async function main() {
  const permission = await executeLocalCommand({ command: 'npm test', projectId: 'v19-test', files, permission: 'REVIEW' });
  assert.equal(permission.status, 'BLOCKED');
  assert.equal(permission.reason, 'PERMISSION_DENIED');

  const test = await executeLocalCommand({ command: 'npm test', projectId: 'v19-test', files, permission: 'REVIEW', approved: true });
  assert.equal(test.status, 'SUCCESS');
  assert.match(test.stdout, /V19_REAL_TEST_PASS/);

  const build = await executeLocalCommand({ command: 'npm run build', projectId: 'v19-test', files, permission: 'REVIEW', approved: true });
  assert.equal(build.status, 'SUCCESS');
  assert.ok((build.artifacts || []).some((x) => x.path === 'dist/index.html'));

  const blocked = await executeLocalCommand({ command: 'rm -rf dist', projectId: 'v19-test', files });
  assert.equal(blocked.status, 'BLOCKED');

  const missing = await executeLocalCommand({ command: 'npm run missing', projectId: 'v19-test', files });
  assert.equal(missing.status, 'UNAVAILABLE');
  assert.equal(missing.reason, 'SCRIPT_MISSING');

  const timeoutFiles = [...files, { name: 'slow.js', content: "setTimeout(()=>console.log('late'),5000)" }];
  timeoutFiles[0] = { name: 'package.json', content: JSON.stringify({ scripts: { test: 'node slow.js' } }) };
  const timeout = await executeLocalCommand({ command: 'npm test', projectId: 'v19-timeout', files: timeoutFiles, permission: 'REVIEW', approved: true, timeoutMs: 200 });
  assert.equal(timeout.status, 'TIMEOUT');
  assert.equal(timeout.timedOut, true);

  const escape = await executeLocalCommand({ command: 'npm test', cwd: '../escape', projectId: 'v19-test', files, permission: 'REVIEW', approved: true });
  assert.equal(escape.status, 'BLOCKED');

  const parsed = parseExecutionErrors('src/App.tsx(12,4): error TS2322: Type mismatch', 'RUN_TYPECHECK');
  assert.equal(parsed[0]?.category, 'TYPE');
  assert.equal(parsed[0]?.line, 12);

  console.log('V19 REAL LOCAL RUNTIME TESTS: PASS');
}

main().catch((error) => { console.error(error); process.exit(1); });
