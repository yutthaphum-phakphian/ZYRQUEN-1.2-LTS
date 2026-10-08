const esbuild = require('esbuild');
const fs = require('node:fs/promises');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { chromium } = require('playwright');

const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>';

function initialCafeTemplate(name) {
  const sourcePath = path.join(__dirname, '..', 'src', 'App.tsx');
  const source = require('node:fs').readFileSync(sourcePath, 'utf8');
  const declaration = source.indexOf(`const ${name} =`);
  if (declaration < 0) throw new Error(`INITIAL_TEMPLATE_NOT_FOUND_${name}`);
  const opening = source.indexOf('`', declaration);
  if (opening < 0 || source.slice(declaration + `const ${name} =`.length, opening).trim()) {
    throw new Error(`EXPECTED_STATIC_TEMPLATE_${name}`);
  }
  for (let index = opening + 1; index < source.length; index += 1) {
    if (source[index] === '\\') {
      index += 1;
    } else if (source[index] === '`') {
      const result = vm.runInNewContext(source.slice(opening, index + 1));
      if (typeof result !== 'string') throw new Error(`EXPECTED_STATIC_TEMPLATE_${name}`);
      return result;
    }
  }
  throw new Error(`UNTERMINATED_TEMPLATE_${name}`);
}

async function writeFixtures(directory) {
  const fixtures = path.join(directory, 'fixtures');
  await fs.mkdir(fixtures);
  await fs.writeFile(path.join(fixtures, 'login.ts'), 'export const login = true;\n');
  await fs.writeFile(path.join(fixtures, 'f1.txt'), 'file 1\n');
  for (let index = 2; index <= 6; index += 1) {
    await fs.writeFile(path.join(fixtures, `f${index}.txt`), `file ${index}\n`);
  }
  await fs.writeFile(path.join(fixtures, 'big.txt'), Buffer.alloc(1024 * 1024 + 1, 97));
  await fs.writeFile(path.join(fixtures, 'bin.dat'), Buffer.from([0, 1, 2]));
}

async function startUiHarness(options = {}) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'codevoice-ui-'));
  const bundlePath = path.join(directory, 'bundle.js');
  try {
    const templates = options.nutritionReport
      ? {
        html: initialCafeTemplate('INITIAL_INDEX_HTML').replace('</body>', '<script src="/script.js"></script></body>'),
        script: initialCafeTemplate('INITIAL_SCRIPT_JS'),
      }
      : undefined;
    if (!templates) await esbuild.build({
      entryPoints: [path.join(__dirname, 'harness.tsx')],
      bundle: true,
      outfile: bundlePath,
      platform: 'browser',
      format: 'iife',
      jsx: 'automatic',
      alias: { 'lucide-react': path.join(__dirname, 'lucide-stub.tsx') },
      define: { 'process.env.NODE_ENV': '"test"' },
      logLevel: 'silent',
    });
    await writeFixtures(directory);

    const server = http.createServer(async (request, response) => {
      const pathname = new URL(request.url, 'http://localhost').pathname;
      if (pathname.startsWith('/api/')) {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end('{}');
      } else if (pathname === '/bundle.js') {
        response.writeHead(200, { 'Content-Type': 'text/javascript' });
        response.end(await fs.readFile(bundlePath));
      } else if (pathname === '/script.js' && templates) {
        response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
        response.end(templates.script);
      } else if (pathname === '/favicon.ico') {
        response.writeHead(204);
        response.end();
      } else if (pathname === '/' || pathname === '/index.html') {
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        response.end(templates?.html || html);
      } else {
        response.writeHead(404);
        response.end('Not found');
      }
    });

    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('UI_HARNESS_LISTEN_FAILED');

    return {
      url: `http://127.0.0.1:${address.port}/`,
      fixture: (name) => path.join(directory, 'fixtures', name),
      async close() {
        await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
        await fs.rm(directory, { recursive: true, force: true });
      },
    };
  } catch (error) {
    await fs.rm(directory, { recursive: true, force: true });
    throw error;
  }
}

async function launchChromium() {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  return chromium.launch({
    headless: true,
    args: ['--no-sandbox'],
    ...(executablePath ? { executablePath } : {}),
  });
}

module.exports = { launchChromium, startUiHarness };
