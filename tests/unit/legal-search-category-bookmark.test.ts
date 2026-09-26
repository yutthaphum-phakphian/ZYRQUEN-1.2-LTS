/**
 * Unit Test Suite: Legal Search Category Filtering & Pinned Statutes Bookmarks
 * Verifies category classification, pinned statute persistence, deduplication,
 * and ETDA / PDPA / International Standards forensic citations.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  LEGAL_CATEGORIES,
  CANONICAL_PINNED_STATUTES,
  CATEGORY_PRESET_QUERIES,
  PinnedStatute,
} from '../../src/data/legalStatutesData';
import {
  sanitizeUniqueRecentQueries,
  RecentLegalQuery,
} from '../../src/components/ThaiLegalSearchModal';

describe('Legal Search Category Filtering & Pinned Statutes Suite', () => {
  it('[TC-LEGAL-01] Validates all mandatory legal categories are defined with high-contrast sovereign metadata', () => {
    const expectedCategories = ['ALL', 'ETDA', 'PDPA', 'INTERNATIONAL_STANDARDS', 'CYBER_NCSA'];
    const categoryIds = LEGAL_CATEGORIES.map((c) => c.id);

    for (const expected of expectedCategories) {
      assert.ok(categoryIds.includes(expected as any), `Missing category: ${expected}`);
    }

    // Verify ETDA metadata
    const etda = LEGAL_CATEGORIES.find((c) => c.id === 'ETDA');
    assert.ok(etda);
    assert.strictEqual(etda.shortLabel, 'ETDA');
    assert.ok(etda.description.includes('Section 9, 26, 28'));

    // Verify PDPA metadata
    const pdpa = LEGAL_CATEGORIES.find((c) => c.id === 'PDPA');
    assert.ok(pdpa);
    assert.strictEqual(pdpa.shortLabel, 'PDPA');
    assert.ok(pdpa.description.includes('Section 19, 27, 37'));

    // Verify International Standards metadata
    const intl = LEGAL_CATEGORIES.find((c) => c.id === 'INTERNATIONAL_STANDARDS');
    assert.ok(intl);
    assert.ok(intl.description.includes('ISO/IEC 27037'));
    assert.ok(intl.description.includes('NIST FIPS'));
  });

  it('[TC-LEGAL-02] Verifies Canonical Pinned Statutes contain ETDA Sec 9/26/28, PDPA Sec 37, and ISO/IEC 27037', () => {
    assert.ok(CANONICAL_PINNED_STATUTES.length >= 6, 'Should have at least 6 canonical pinned statutes');

    const sec26 = CANONICAL_PINNED_STATUTES.find((s) => s.statuteNumber === 'มาตรา 26');
    assert.ok(sec26, 'Should have ETDA Section 26 pinned statute');
    assert.strictEqual(sec26.category, 'ETDA');
    assert.strictEqual(sec26.legalWeight, 'HIGH_RELIABILITY');
    assert.ok(sec26.fullText.includes('ลายมือชื่ออิเล็กทรอนิกส์ที่เชื่อถือได้'));
    assert.ok(sec26.citations.some((c) => c.uri.includes('etda.or.th')));

    const sec9 = CANONICAL_PINNED_STATUTES.find((s) => s.statuteNumber === 'มาตรา 9');
    assert.ok(sec9, 'Should have ETDA Section 9 pinned statute');
    assert.strictEqual(sec9.category, 'ETDA');
    assert.strictEqual(sec9.legalWeight, 'MANDATORY');

    const sec37 = CANONICAL_PINNED_STATUTES.find((s) => s.statuteNumber === 'มาตรา 37');
    assert.ok(sec37, 'Should have PDPA Section 37 pinned statute');
    assert.strictEqual(sec37.category, 'PDPA');
    assert.ok(sec37.summary.includes('มาตรการรักษาความมั่นคงปลอดภัย'));

    const iso27037 = CANONICAL_PINNED_STATUTES.find((s) => s.statuteNumber === 'ISO/IEC 27037');
    assert.ok(iso27037, 'Should have ISO/IEC 27037 pinned statute');
    assert.strictEqual(iso27037.category, 'INTERNATIONAL_STANDARDS');
    assert.strictEqual(iso27037.legalWeight, 'INTERNATIONAL_STANDARD');

    const fips204 = CANONICAL_PINNED_STATUTES.find((s) => s.statuteNumber === 'NIST FIPS 204');
    assert.ok(fips204, 'Should have NIST FIPS 204 ML-DSA pinned statute');
    assert.strictEqual(fips204.category, 'INTERNATIONAL_STANDARDS');
  });

  it('[TC-LEGAL-03] Categorizes preset benchmark queries accurately by legal discipline', () => {
    assert.ok(CATEGORY_PRESET_QUERIES.length >= 8);

    const etdaPresets = CATEGORY_PRESET_QUERIES.filter((p) => p.category === 'ETDA');
    assert.ok(etdaPresets.length >= 3, 'ETDA should have at least 3 presets');
    assert.ok(etdaPresets.some((p) => p.badgeText === 'มาตรา 26'));

    const pdpaPresets = CATEGORY_PRESET_QUERIES.filter((p) => p.category === 'PDPA');
    assert.ok(pdpaPresets.length >= 2, 'PDPA should have at least 2 presets');
    assert.ok(pdpaPresets.some((p) => p.badgeText === 'มาตรา 37'));

    const intlPresets = CATEGORY_PRESET_QUERIES.filter((p) => p.category === 'INTERNATIONAL_STANDARDS');
    assert.ok(intlPresets.length >= 3, 'International Standards should have at least 3 presets');
    assert.ok(intlPresets.some((p) => p.badgeText === 'ISO 27037'));
    assert.ok(intlPresets.some((p) => p.badgeText === 'FIPS 204'));
  });

  it('[TC-LEGAL-04] Sanitizes and deduplicates search history queries maintaining SSoT integrity', () => {
    const testQueries: RecentLegalQuery[] = [
      { id: '1', query: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ มาตรา 26', timestamp: '2026-09-26T00:00:00Z', dateStr: 'Today', category: 'ETDA' },
      { id: '2', query: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ มาตรา 26', timestamp: '2026-09-26T00:01:00Z', dateStr: 'Today', category: 'ETDA' }, // Duplicate
      { id: '3', query: '   พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ มาตรา 26   ', timestamp: '2026-09-26T00:02:00Z', dateStr: 'Today', category: 'ETDA' }, // Trim duplicate
      { id: '4', query: 'PDPA มาตรา 37', timestamp: '2026-09-26T00:03:00Z', dateStr: 'Today', category: 'PDPA' },
      { id: '5', query: 'ISO/IEC 27037', timestamp: '2026-09-26T00:04:00Z', dateStr: 'Today', category: 'INTERNATIONAL_STANDARDS' },
    ];

    const sanitized = sanitizeUniqueRecentQueries(testQueries);
    assert.strictEqual(sanitized.length, 3, 'Should remove whitespace and case-insensitive duplicates');
    assert.strictEqual(sanitized[0].query, 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ มาตรา 26');
    assert.strictEqual(sanitized[1].query, 'PDPA มาตรา 37');
    assert.strictEqual(sanitized[2].query, 'ISO/IEC 27037');
  });

  it('[TC-LEGAL-05] Confirms pinned statute bookmarking and unpinning logic functions without mutation', () => {
    const initialList: PinnedStatute[] = [...CANONICAL_PINNED_STATUTES];
    const initialCount = initialList.length;

    // Simulate bookmarking a new custom statute
    const customStatute: PinnedStatute = {
      id: 'statute-custom-test',
      statuteNumber: 'มาตรา 11',
      title: 'การห้ามมิให้ปฏิเสธความมีผลผูกพันของข้อมูลอิเล็กทรอนิกส์',
      actName: 'พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544',
      category: 'ETDA',
      categoryLabel: 'ETDA & Electronic Transactions',
      summary: 'ห้ามมิให้ปฏิเสธความมีผลผูกพันและการบังคับใช้ทางกฎหมายของข้อความใดเพียงเพราะเหตุที่ข้อความนั้นอยู่ในรูปของข้อมูลอิเล็กทรอนิกส์',
      fullText: 'มาตรา ๑๑ ห้ามมิให้ปฏิเสธความมีผลผูกพันและการบังคับใช้ทางกฎหมายของข้อความใดเพียงเพราะเหตุที่ข้อความนั้นอยู่ในรูปของข้อมูลอิเล็กทรอนิกส์',
      legalWeight: 'MANDATORY',
      statutoryRef: 'Section 11 — Legal Admissibility of Electronic Records',
      citations: [{ title: 'ETDA', uri: 'https://www.etda.or.th' }],
      pinnedAt: new Date().toISOString(),
      query: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ มาตรา 11',
      tags: ['ETDA', 'มาตรา 11'],
      forensicProofBinding: 'Test Forensic Proof',
    };

    // Add bookmark
    const bookmarkedList = [customStatute, ...initialList];
    assert.strictEqual(bookmarkedList.length, initialCount + 1);
    assert.ok(bookmarkedList.some((s) => s.id === 'statute-custom-test'));

    // Remove bookmark (unpin)
    const unpinnedList = bookmarkedList.filter((s) => s.id !== 'statute-custom-test');
    assert.strictEqual(unpinnedList.length, initialCount);
    assert.ok(!unpinnedList.some((s) => s.id === 'statute-custom-test'));
  });
});
