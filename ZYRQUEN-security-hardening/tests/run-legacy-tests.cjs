const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(__dirname, 'out');
const compiler = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'tsc.cmd' : 'tsc');
const compileSources = [
  'src/server/auth.ts',
  'src/server/sessions.ts',
  'src/server/missionStore.ts',
  'src/server/security.ts',
  'src/server/redisSessions.ts',
  'src/server/metrics.ts',
  'src/types/redis.d.ts',
  'src/utils/authFetch.ts',
  'src/tools/autonomousMissionEngine.ts',
  'src/tools/selfContainedRuntime.ts',
];
const tests = [
  'auth.cjs',
  'sessions.cjs',
  'mission-store.cjs',
  'engine-stress.cjs',
  'runtime-restore.cjs',
  'v18-autonomous-mission.test.cjs',
  'express-auth-integration.cjs',
];
let testWorkingDirectory;

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, CODEVOICE_DURABLE_ROOT: path.join(testWorkingDirectory, '.data') },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${path.basename(command)} exited with status ${result.status}`);
}

if (fs.existsSync(output)) {
  console.error('Refusing to overwrite existing tests/out; move or inspect it before running legacy tests.');
  process.exit(2);
}

testWorkingDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'codevoice-legacy-'));
try {
  run(compiler, [
    '--ignoreConfig',
    '--outDir', output,
    '--module', 'commonjs',
    '--target', 'es2022',
    '--lib', 'es2022,dom',
    '--types', 'node',
    '--esModuleInterop',
    '--skipLibCheck',
    ...compileSources,
  ]);
  fs.writeFileSync(path.join(output, 'package.json'), '{"type":"commonjs"}\n');
  for (const test of tests) run(process.execPath, [path.join(__dirname, test)], testWorkingDirectory);
  console.log(`Legacy CommonJS regression scripts: ${tests.length} passed`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  fs.rmSync(output, { recursive: true, force: true });
  fs.rmSync(testWorkingDirectory, { recursive: true, force: true });
}
