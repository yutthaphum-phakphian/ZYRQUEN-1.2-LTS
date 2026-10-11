import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePasswordStrength, validateLoginInput } from '../../src/components/auth/LoginForm';

test('Password Strength Calculation & Visual Meter Logic', async (t) => {
  await t.test('returns empty state when password is empty or null', () => {
    const emptyResult = calculatePasswordStrength('');
    assert.equal(emptyResult.score, 0);
    assert.equal(emptyResult.level, 'empty');
    assert.equal(emptyResult.passedDiversityCount, 0);
    assert.equal(emptyResult.criteria.length8, false);
    assert.equal(emptyResult.criteria.length12, false);
    assert.equal(emptyResult.criteria.hasUpper, false);
    assert.equal(emptyResult.criteria.hasLower, false);
    assert.equal(emptyResult.criteria.hasNumber, false);
    assert.equal(emptyResult.criteria.hasSpecial, false);
  });

  await t.test('marks passwords shorter than 8 characters as weak regardless of symbols', () => {
    const shortResult = calculatePasswordStrength('Ab1!');
    assert.equal(shortResult.criteria.length8, false);
    assert.equal(shortResult.criteria.length12, false);
    assert.equal(shortResult.level, 'weak');
    assert.ok(shortResult.score <= 35, 'Short password score should be capped at 35%');
    assert.equal(shortResult.criteria.hasUpper, true);
    assert.equal(shortResult.criteria.hasLower, true);
    assert.equal(shortResult.criteria.hasNumber, true);
    assert.equal(shortResult.criteria.hasSpecial, true);
    assert.equal(shortResult.passedDiversityCount, 4);
  });

  await t.test('correctly evaluates character diversity criteria', () => {
    // Only lowercase
    const onlyLower = calculatePasswordStrength('abcdefgh');
    assert.equal(onlyLower.criteria.length8, true);
    assert.equal(onlyLower.criteria.hasLower, true);
    assert.equal(onlyLower.criteria.hasUpper, false);
    assert.equal(onlyLower.criteria.hasNumber, false);
    assert.equal(onlyLower.criteria.hasSpecial, false);
    assert.equal(onlyLower.passedDiversityCount, 1);

    // Uppercase + Lowercase
    const upperLower = calculatePasswordStrength('Abcdefgh');
    assert.equal(upperLower.criteria.hasUpper, true);
    assert.equal(upperLower.criteria.hasLower, true);
    assert.equal(upperLower.passedDiversityCount, 2);

    // Uppercase + Lowercase + Number
    const withNumber = calculatePasswordStrength('Abcdefg1');
    assert.equal(withNumber.criteria.hasNumber, true);
    assert.equal(withNumber.passedDiversityCount, 3);

    // All 4 diversity types
    const fullDiversity = calculatePasswordStrength('Abcdefg1!');
    assert.equal(fullDiversity.criteria.hasSpecial, true);
    assert.equal(fullDiversity.passedDiversityCount, 4);
  });

  await t.test('evaluates medium strength for 8+ chars with partial diversity', () => {
    const mediumResult = calculatePasswordStrength('pass1234');
    assert.equal(mediumResult.criteria.length8, true);
    assert.equal(mediumResult.criteria.length12, false);
    assert.ok(mediumResult.score >= 40 && mediumResult.score < 70);
    assert.equal(mediumResult.level, 'medium');
  });

  await t.test('evaluates strong strength for 8+ chars with high diversity', () => {
    const strongResult = calculatePasswordStrength('Password123');
    assert.equal(strongResult.criteria.length8, true);
    assert.ok(strongResult.score >= 70);
    assert.equal(strongResult.level, 'strong');
  });

  await t.test('evaluates very strong strength for 12+ chars with full character diversity', () => {
    const veryStrongResult = calculatePasswordStrength('Sovereign2026!#');
    assert.equal(veryStrongResult.criteria.length8, true);
    assert.equal(veryStrongResult.criteria.length12, true);
    assert.equal(veryStrongResult.passedDiversityCount, 4);
    assert.ok(veryStrongResult.score >= 90);
    assert.equal(veryStrongResult.level, 'very_strong');
    assert.ok(veryStrongResult.barColor.includes('emerald'));
  });
});

test('LoginForm Client-side Input Validation Matrix', async (t) => {
  await t.test('passes validation with valid email and compliant password', () => {
    const res = validateLoginInput('owner@zyrquen.court', 'Password123!');
    assert.equal(res.isValid, true);
    assert.equal(Object.keys(res.errors).length, 0);
  });

  await t.test('passes validation with valid username and compliant password', () => {
    const res = validateLoginInput('EP-SOVEREIGN-01', 'Password123!');
    assert.equal(res.isValid, true);
    assert.equal(Object.keys(res.errors).length, 0);
  });

  await t.test('fails validation when email is empty', () => {
    const res = validateLoginInput('', 'Password123!');
    assert.equal(res.isValid, false);
    assert.ok(res.errors.email);
  });

  await t.test('fails validation when email format is invalid', () => {
    const res = validateLoginInput('invalid-email@not-a-domain', 'Password123!');
    assert.equal(res.isValid, false);
    assert.ok(res.errors.email);
  });

  await t.test('fails validation when password is empty', () => {
    const res = validateLoginInput('user@zyrquen.court', '');
    assert.equal(res.isValid, false);
    assert.ok(res.errors.password);
  });

  await t.test('fails validation when password is shorter than 8 characters', () => {
    const res = validateLoginInput('user@zyrquen.court', 'pass123');
    assert.equal(res.isValid, false);
    assert.ok(res.errors.password?.includes('8'));
  });
});
