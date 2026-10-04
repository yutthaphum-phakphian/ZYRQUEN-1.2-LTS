const { launchChromium, startUiHarness } = require('./ui-harness.cjs');

let fail = 0;
const ok = (condition, message) => {
  console.log(`${condition ? 'PASS ' : 'FAIL '}${message}`);
  if (!condition) fail += 1;
};

(async () => {
  let harness;
  let browser;
  try {
    harness = await startUiHarness();
    browser = await launchChromium();
    const serverErrors = [];
    const page = await browser.newPage();
    page.on('pageerror', (error) => serverErrors.push(String(error)));

    let mode = 'ok';
    await page.route('**/api/login', async (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      if (mode === 'limit') {
        await route.fulfill({ status: 429, json: { error: 'TOO_MANY_FAILED_ATTEMPTS' } });
      } else if (body.key !== 'good-key-123456789') {
        await route.fulfill({ status: 401, json: { error: 'UNAUTHORIZED' } });
      } else {
        await route.fulfill({ json: { authRequired: true, userId: 'alice', token: 'SESS', expiresAt: Date.now() + 3600000 } });
      }
    });
    await page.route('**/api/logout', (route) => route.fulfill({ json: { ok: true } }));
    await page.goto(harness.url);

    const key = page.locator('input[type=password]');
    const login = page.getByText('ล็อกอิน', { exact: true });
    ok(await login.isDisabled(), 'ล็อกอิน disabled while key empty');

    await key.fill('bad');
    await login.click();
    await page.getByText('ล็อกอินไม่สำเร็จ').waitFor();
    ok(true, 'wrong key -> "ล็อกอินไม่สำเร็จ"');

    mode = 'limit';
    await login.click();
    await page.getByText(/ล็อกอินผิดบ่อยเกินไป/).waitFor();
    ok(true, '429 -> too-many-attempts message');
    mode = 'ok';

    await key.fill('good-key-123456789');
    await key.press('Enter');
    await page.getByText(/ล็อกอินแล้วในชื่อ alice/).waitFor();
    ok(true, 'Enter logs in as alice');
    ok(await page.getByText('ออกจากระบบ', { exact: true }).isVisible() && await key.count() === 0,
      'key box replaced by logout; key not left in DOM');
    ok(await page.evaluate(() => localStorage.getItem('codevoice-ai:authToken')) === 'SESS', 'session stored');

    await page.evaluate(() => window.dispatchEvent(new Event('codevoice-auth-expired')));
    await page.getByText(/เซสชันหมดอายุ/).waitFor();
    ok(await login.isVisible(), 'expired event shows message and login form again');

    await key.fill('good-key-123456789');
    await login.click();
    await page.getByText('ออกจากระบบ', { exact: true }).click();
    await page.getByText('ออกจากระบบแล้ว').waitFor();
    ok(await page.evaluate(() => localStorage.getItem('codevoice-ai:authToken')) === null, 'logout clears stored session');
    ok(serverErrors.length === 0, `no page errors${serverErrors.length ? `: ${serverErrors.join('; ')}` : ''}`);
    console.log(fail ? `${fail} FAILED` : 'ALL PASSED');
    process.exitCode = fail ? 1 : 0;
  } catch (error) {
    console.error('CRASH', error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
  } finally {
    await browser?.close();
    await harness?.close();
  }
})();
