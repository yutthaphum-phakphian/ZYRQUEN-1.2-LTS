import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  escapeCsvField,
  generateAuditCsv,
  buildSystemAuditLogsJsonArchive,
  formatForensicTimestamp,
  generateForensicSystemEventsCsv,
  filterEventsForCsvExport,
  generateCsvPreview,
  FORENSIC_CSV_COLUMNS,
} from '../../src/utils/exportCsv.js';

describe('Audit Analytics & CSV Export', () => {
  it('correctly escapes fields containing commas, quotes, and newlines per RFC 4180', () => {
    assert.equal(escapeCsvField('hello,world'), '"hello,world"');
    assert.equal(escapeCsvField('say "hello"'), '"say ""hello"""');
    assert.equal(escapeCsvField('multi\nline'), '"multi\nline"');
  });

  it('generates compliant CSV with correct headers and CRLF row terminators', () => {
    const sampleEvent = {
      id: 'EVT-1',
      timestamp: '2026-03-29T12:00:00Z',
      eventType: 'STATE_CHECK',
      status: 'SUCCESS',
      operator: 'operator-1',
      driftPercentage: 0.0,
      blockHash: '0xabc',
      signature: '0xsig',
      acknowledged: true,
      details: 'Nominal'
    };
    const csv = generateAuditCsv([sampleEvent]);
    assert.ok(csv.startsWith('"Event ID","Timestamp (UTC)"'));
    assert.ok(csv.includes('\r\n'));
    assert.ok(csv.includes('"0.00%"'));
  });

  it('formats timestamps for forensic review with ISO 8601 UTC and jurisdiction ICT', () => {
    // 1. Direct ISO 8601 timestamp
    const isoResult = formatForensicTimestamp('2026-09-14T03:39:05.123Z');
    assert.equal(isoResult.isoUtc, '2026-09-14T03:39:05.123Z');
    assert.ok(isoResult.jurisdictionIct.includes('+07:00 (ICT)'));
    assert.equal(typeof isoResult.epochMs, 'number');
    assert.equal(isoResult.rawRecorded, '2026-09-14T03:39:05.123Z');

    // 2. ICT time string
    const refDate = new Date(Date.UTC(2026, 8, 14, 0, 0, 0));
    const ictResult = formatForensicTimestamp('05:06:01 ICT', refDate);
    assert.ok(ictResult.isoUtc.endsWith('Z'));
    assert.ok(ictResult.jurisdictionIct.includes('+07:00 (ICT)'));
    assert.equal(ictResult.rawRecorded, '05:06:01 ICT');
  });

  it('generates compliant forensic system events CSV for filtered log export', () => {
    const events = [
      {
        id: 'evt-test-01',
        type: 'COMPLIANCE',
        title: 'ETDA Sec 26 Digital Signature Verified',
        description: 'ML-DSA-87 PQC signature verified with 0 drift',
        timestamp: '2026-09-14T10:00:00Z',
        metaHash: '0x909ab814479844d8',
        statuteRef: 'ETDA B.E. 2544 Sec 26',
        severity: 'success',
        bindingStatus: 'ANCHORED',
        isComplianceDrift: false
      },
      {
        id: 'evt-test-02',
        type: 'HARDWARE',
        title: 'Cryo Temp Shift, Warning "High"',
        description: 'Detected sensor thermal variance',
        timestamp: '05:06:01 ICT',
        metaHash: '0x12345678abcdef',
        statuteRef: 'ETDA B.E. 2544 Sec 28',
        severity: 'warning',
        bindingStatus: 'ANCHORED',
        isComplianceDrift: true
      }
    ];

    const csv = generateForensicSystemEventsCsv(events);
    assert.ok(csv.includes('\r\n'));
    assert.ok(csv.includes('"Audit_Index","Event_ID","Forensic_Timestamp_UTC_ISO8601","Jurisdiction_Timestamp_ICT"'));
    assert.ok(csv.includes('"evt-test-01"'));
    assert.ok(csv.includes('"evt-test-02"'));
    assert.ok(csv.includes('"ETDA B.E. 2544 Sec 26"'));
    assert.ok(csv.includes('"YES - DRIFT DETECTED"'));
    assert.ok(csv.includes('"NO - INVARIANT NOMINAL"'));
    assert.ok(csv.includes('"SUCCESS"'));
    assert.ok(csv.includes('"WARNING"'));
  });

  it('generates compliant JSON archive containing Merkle Root and cryptographic seal data', () => {
    const sampleEvents = [
      {
        id: 'EVT-PQC-14902',
        timestamp: '2026-09-13T10:00:00Z',
        eventType: 'POST_QUANTUM_MERKLE_ROOT_VERIFICATION',
        status: 'SUCCESS',
        operator: 'dr-apichaya-sovereign',
        driftPercentage: 0.0,
        blockHash: '0x3a91b4c8d19e075af621bcde4901fa5c2b3e81749a0bcf18204689abcd14902',
        signature: 'NIST_FIPS_204_ML_DSA_87_VERIFIED',
        acknowledged: true
      }
    ];

    const archive = buildSystemAuditLogsJsonArchive(sampleEvents);
    assert.equal(archive.archiveFormat, 'ZYRQUEN_SYSTEM_AUDIT_LOGS_ARCHIVE_V1');
    assert.equal(archive.merkleRoot, '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68');
    assert.ok(archive.cryptographicSeal);
    assert.equal(archive.cryptographicSeal.merkleRoot, '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68');
    assert.equal(archive.cryptographicSeal.canonicalGenesisBlock, 849202);
    assert.equal(archive.cryptographicSeal.canonicalSealsCount, 14902);
    assert.ok(archive.cryptographicSeal.pqcDigitalSignature.includes('NIST_FIPS_204'));
    assert.ok(archive.cryptographicSeal.hsmQuorumAttestation.includes('10/10 REAL_HSM'));
    assert.equal(archive.totalRecords, 1);
    assert.equal(archive.events.length, 1);
  });

  it('filters events by specific severity levels and event types for CSV export', () => {
    const testPool = [
      { id: '1', type: 'COMPLIANCE', severity: 'critical', title: 'Critical Compliance' },
      { id: '2', type: 'COMPLIANCE', severity: 'warning', title: 'Warning Compliance' },
      { id: '3', type: 'CRYPTO', severity: 'success', title: 'Crypto Sealed' },
      { id: '4', type: 'HARDWARE', severity: 'info', title: 'Hardware Telemetry' },
      { id: '5', type: 'LEGAL_SEARCH', severity: 'critical', title: 'Legal Search Alert', isComplianceDrift: true },
    ];

    // Filter by severity only
    const criticalOnly = filterEventsForCsvExport(testPool, { severities: ['critical'] });
    assert.equal(criticalOnly.length, 2);
    assert.deepEqual(criticalOnly.map((e) => e.id), ['1', '5']);

    // Filter by type only
    const cryptoOnly = filterEventsForCsvExport(testPool, { types: ['CRYPTO'] });
    assert.equal(cryptoOnly.length, 1);
    assert.equal(cryptoOnly[0].id, '3');

    // Filter by severity AND type
    const criticalCompliance = filterEventsForCsvExport(testPool, {
      severities: ['critical'],
      types: ['COMPLIANCE'],
    });
    assert.equal(criticalCompliance.length, 1);
    assert.equal(criticalCompliance[0].id, '1');

    // Filter by compliance drift
    const driftOnly = filterEventsForCsvExport(testPool, { onlyComplianceDrift: true });
    assert.equal(driftOnly.length, 1);
    assert.equal(driftOnly[0].id, '5');
  });

  it('supports dynamic column selection in generateForensicSystemEventsCsv', () => {
    const sample = [
      {
        id: 'EVT-CUSTOM-COL',
        type: 'CRYPTO',
        title: 'Key Rotation',
        description: 'Rotation succeeded',
        timestamp: '2026-09-14T08:00:00Z',
        metaHash: '0xfeedface',
        statuteRef: 'ETDA Sec 28',
        severity: 'success',
      },
    ];

    // Export with only ID, ISO UTC timestamp, and Meta Hash
    const customCsv = generateForensicSystemEventsCsv(sample, {
      selectedColumnKeys: ['id', 'timestamp_utc', 'hash'],
    });

    const lines = customCsv.trim().split('\r\n');
    assert.equal(lines.length, 2);
    assert.equal(lines[0], '"Event_ID","Forensic_Timestamp_UTC_ISO8601","Meta_Hash"');
    assert.ok(lines[1].includes('"EVT-CUSTOM-COL"'));
    assert.ok(lines[1].includes('"2026-09-14T08:00:00.000Z"'));
    assert.ok(lines[1].includes('"0xfeedface"'));
    // Ensure excluded columns do not appear in headers
    assert.ok(!lines[0].includes('Statutory_Reference'));
    assert.ok(!lines[0].includes('Merkle_Proof_Status'));
  });

  it('supports international CSV separators (comma, semicolon, tab)', () => {
    const sample = [
      {
        id: 'EVT-SEP-001',
        type: 'COMPLIANCE',
        title: 'Check; Value, with separators',
        description: 'Testing delimiters: comma, semicolon; and \ttabs',
        timestamp: '2026-09-14T08:00:00Z',
        metaHash: '0x123abc',
        statuteRef: 'ETDA Sec 11',
        severity: 'critical',
      },
    ];

    // 1. Semicolon delimiter (Regional EU Excel)
    const semicolonCsv = generateForensicSystemEventsCsv(sample, {
      selectedColumnKeys: ['id', 'title', 'description'],
      delimiter: ';',
    });
    const semiLines = semicolonCsv.trim().split('\r\n');
    assert.equal(semiLines[0], '"Event_ID";"Event_Title";"Event_Description"');
    // In row, title has semicolon, so it MUST be escaped in quotes
    assert.ok(semiLines[1].includes(';"Check; Value, with separators";'));

    // 2. Tab delimiter (TSV format)
    const tabCsv = generateForensicSystemEventsCsv(sample, {
      selectedColumnKeys: ['id', 'type', 'title'],
      delimiter: '\t',
    });
    const tabLines = tabCsv.trim().split('\r\n');
    assert.equal(tabLines[0], '"Event_ID"\t"Event_Type"\t"Event_Title"');
    assert.ok(tabLines[1].includes('"EVT-SEP-001"\t'));

    // 3. Comma delimiter (Default RFC 4180)
    const commaCsv = generateForensicSystemEventsCsv(sample, {
      selectedColumnKeys: ['id', 'type', 'title'],
      delimiter: ',',
    });
    const commaLines = commaCsv.trim().split('\r\n');
    assert.equal(commaLines[0], '"Event_ID","Event_Type","Event_Title"');
  });

  it('generates mini-preview pane data with selected columns and active delimiter', () => {
    const sampleEvents = [
      {
        id: 'EVT-PREV-1',
        type: 'CRYPTO',
        title: 'Seal 1',
        description: 'Sample 1',
        timestamp: '2026-09-14T09:00:00Z',
        severity: 'info',
      },
      {
        id: 'EVT-PREV-2',
        type: 'SECURITY',
        title: 'Seal 2',
        description: 'Sample 2',
        timestamp: '2026-09-14T09:05:00Z',
        severity: 'warning',
      },
      {
        id: 'EVT-PREV-3',
        type: 'HARDWARE',
        title: 'Seal 3',
        description: 'Sample 3',
        timestamp: '2026-09-14T09:10:00Z',
        severity: 'critical',
      },
    ];

    const preview = generateCsvPreview(sampleEvents, {
      selectedColumnKeys: ['id', 'type', 'severity'],
      delimiter: ';',
      maxRows: 2,
    });

    assert.equal(preview.totalColumns, 3);
    assert.equal(preview.totalMatchingRecords, 3);
    assert.equal(preview.rows.length, 2);
    assert.deepEqual(preview.headers, ['Event_ID', 'Event_Type', 'Severity_Level']);
    assert.equal(preview.delimiter, ';');
    assert.ok(preview.rawPreviewText.includes('"Event_ID";"Event_Type";"Severity_Level"'));
  });

  it('validates public zyrquen-audit-analytics-utc.csv contains 30-day invariant records', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const csvPath = path.resolve(process.cwd(), 'public/zyrquen-audit-analytics-utc.csv');
    assert.ok(fs.existsSync(csvPath), 'zyrquen-audit-analytics-utc.csv must exist in public directory');
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.trim().split('\n');
    assert.equal(lines.length, 31, 'Header + 30 daily records = 31 lines');
    assert.ok(content.includes('0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68'));
    assert.ok(content.includes('10/10 REAL_HSM'));
    assert.ok(content.includes('CRYSTALS-Dilithium-5 (FIPS 204)'));
  });
});
