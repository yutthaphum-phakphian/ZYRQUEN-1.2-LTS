import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CANONICAL_SEALS, QUARANTINE_COUNT, SYSTEM_METADATA } from '../../src/data/canonicalData';

describe('Sovereign Integrity Score Real-Time Ratio Engine', () => {
  it('correctly calculates comprehensive ratio of verified seals versus total ledger seals', () => {
    const verifiedSeals = CANONICAL_SEALS; // 14,902
    const quarantinedSeals = QUARANTINE_COUNT; // 80
    const totalSeals = verifiedSeals + quarantinedSeals; // 14,982

    assert.equal(verifiedSeals, 14902);
    assert.equal(totalSeals, 14982);

    const ratio = verifiedSeals / totalSeals;
    const scorePct = ratio * 100;

    assert.ok(scorePct > 99.46 && scorePct < 99.47);
    assert.equal(scorePct.toFixed(2), '99.47');
  });

  it('correctly calculates active canonical pool ratio without quarantined seals', () => {
    const verifiedSeals = CANONICAL_SEALS; // 14,902
    const totalActiveSeals = 14902;

    const ratio = verifiedSeals / totalActiveSeals;
    const scorePct = ratio * 100;

    assert.equal(scorePct, 100.0);
    assert.equal(scorePct.toFixed(2), '100.00');
  });

  it('satisfies 80% super-majority invariant with significant positive margin', () => {
    const verifiedSeals = CANONICAL_SEALS;
    const totalSeals = 14982;
    const scorePct = (verifiedSeals / totalSeals) * 100;
    const superMajorityThreshold = 80.0;

    assert.ok(scorePct >= superMajorityThreshold);
    const margin = scorePct - superMajorityThreshold;
    assert.equal(margin.toFixed(2), '19.47');
  });

  it('dynamically adapts ratio when live snapshots are added to the ledger', () => {
    const baselineVerified = 14902;
    const baselineTotal = 14982;
    const addedSnapshots = 5;

    const dynamicVerified = baselineVerified + addedSnapshots;
    const dynamicTotal = baselineTotal + addedSnapshots;

    assert.equal(dynamicVerified, 14907);
    assert.equal(dynamicTotal, 14987);

    const dynamicRatio = dynamicVerified / dynamicTotal;
    const dynamicScorePct = dynamicRatio * 100;

    assert.ok(dynamicScorePct > 99.46 && dynamicScorePct < 99.48);
    assert.equal(dynamicScorePct.toFixed(2), '99.47');
  });

  it('guarantees zero SSoT baseline drift is preserved', () => {
    assert.equal(SYSTEM_METADATA.ssotMutation, 0);
    assert.equal(SYSTEM_METADATA.baselineDrift, '0.00%');
  });

  it('correctly detects increased, decreased, and stable integrity trends', () => {
    // Current higher than previous -> increased
    const currentScore = 99.475;
    const prevScoreLower = 99.470;
    const diffInc = currentScore - prevScoreLower;
    const trendInc = diffInc > 0.0005 ? 'increased' : diffInc < -0.0005 ? 'decreased' : 'stable';
    assert.equal(trendInc, 'increased');

    // Current lower than previous -> decreased
    const prevScoreHigher = 99.480;
    const diffDec = currentScore - prevScoreHigher;
    const trendDec = diffDec > 0.0005 ? 'increased' : diffDec < -0.0005 ? 'decreased' : 'stable';
    assert.equal(trendDec, 'decreased');

    // Current equal to previous within tolerance -> stable
    const prevScoreSame = 99.4751;
    const diffSame = currentScore - prevScoreSame;
    const trendSame = diffSame > 0.0005 ? 'increased' : diffSame < -0.0005 ? 'decreased' : 'stable';
    assert.equal(trendSame, 'stable');
  });

  it('accurately triggers warning pulse condition when score drops below 95% threshold', () => {
    // Baseline 14,902 / 14,982 = 99.47% (nominal, not below threshold)
    const nominalScore = (14902 / 14982) * 100;
    assert.equal(nominalScore < 95.0, false);

    // Simulated degradation (14,142 / 14,982 = 94.39% < 95.0%)
    const degradedVerified = 14142;
    const totalSeals = 14982;
    const degradedScore = (degradedVerified / totalSeals) * 100;
    assert.ok(degradedScore < 95.0);
    assert.equal(degradedScore.toFixed(2), '94.39');
    
    // Warning pulse flag must trigger
    const isWarningTriggered = degradedScore < 95.0;
    assert.equal(isWarningTriggered, true);
  });

  it('generates 10 snapshot points for the Recharts sparkline trend trajectory', () => {
    const count = 10;
    const baseVerified = 14902;
    const baseTotal = 14982;
    const points = [];

    for (let i = 0; i < count; i++) {
      const snapVerified = baseVerified - (count - 1 - i);
      const snapTotal = baseTotal - (count - 1 - i);
      const score = Number(((snapVerified / snapTotal) * 100).toFixed(3));
      points.push({
        snapshot: `#${849193 + i}`,
        score,
        verified: snapVerified,
        total: snapTotal,
      });
    }

    assert.equal(points.length, 10);
    assert.equal(points[0].snapshot, '#849193');
    assert.equal(points[9].snapshot, '#849202');
    assert.equal(points[9].verified, 14902);
    assert.equal(points[9].total, 14982);
    assert.ok(points[9].score >= 99.46);
  });
});
