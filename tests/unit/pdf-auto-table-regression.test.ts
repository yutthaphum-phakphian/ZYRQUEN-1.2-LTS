import assert from 'node:assert/strict';
import test from 'node:test';

import type { jsPDF } from 'jspdf';
import { getAutoTableFinalY } from '../../src/utils/pdfAutoTable';

test('pdfAutoTable finalY regression guard', () => {
  const docWithoutTable = {} as jsPDF;
  const docWithTable = { lastAutoTable: { finalY: 142 } } as jsPDF;

  assert.equal(getAutoTableFinalY(docWithoutTable, 80), 80);
  assert.equal(getAutoTableFinalY(docWithTable, 80), 142);
});
