const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { launchChromium, startUiHarness } = require('./ui-harness.cjs');

(async () => {
  let harness;
  let browser;
  try {
    harness = await startUiHarness({ nutritionReport: true });
    browser = await launchChromium();
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();
    await page.goto(harness.url);

    await page.locator('#menu-grid button[onclick^="openQuickView"]').first().click();
    const modal = page.locator('#quick-view-modal');
    await modal.waitFor({ state: 'visible' });

    const summaryRow = await page.locator('#quick-view-content tbody tr').first().evaluate((row) => row.textContent);
    assert.match(summaryRow, /Average/);
    assert.match(summaryRow, /7%/);
    assert.match(summaryRow, /100%/);
    console.log('PASS detailed nutrition table shows average against 100% daily benchmark');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Download Nutrition Report/ }).click();
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), 'espresso-romano-nutrition-report.json');

    const report = JSON.parse(await fs.readFile(await download.path(), 'utf8'));
    assert.equal(report.reportType, 'Aroma Cafe Nutrition Report');
    assert.equal(report.drink.id, 1);
    assert.equal(report.drink.name, 'Espresso Romano');
    assert.equal(report.drink.servingNutrition.calories.amount, 5);
    assert.equal(report.drink.servingNutrition.calories.unit, 'kcal');
    assert.equal(report.drink.servingNutrition.caffeine.amount, 135);
    assert.equal(report.drink.servingNutrition.caffeine.percentOfDailyReference, 34);
    assert.equal(report.dailyReferenceComparison.averagePercent, 7);
    assert.equal(report.dailyReferenceComparison.benchmarkPercent, 100);
    console.log('PASS downloaded JSON contains selected drink nutrients and reference comparison');
  } finally {
    await browser?.close();
    await harness?.close();
  }
})().catch((error) => {
  console.error('FAIL nutrition report UI:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
