const handleExportScanLogs = () => {
  playAuditChime();
  const exportPayload = {
    exportSchema: 'https://schema.sovereign-ledger.gov/v2.1/forensic-qr-scan-logs.json',
    canonicalBlock: 849202,
    merkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    partition: 'Ω600_1000',
    exportedAtUtc: new Date().toISOString(),
    totalScansRecorded: scanHistory.length,
    currentQuorumState: {
      verifiedCount: registryState.verifiedCount,
      isQuorumSatisfied: registryState.isQuorumSatisfied,
      isSuperMajorityAttained: registryState.isSuperMajorityAttained,
      ledgerMode: registryState.ledgerMode,
    },
    scans: scanHistory,
  };
  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const nowUtc = new Date().toISOString().replace(/[:.]/g, '-');
  link.href = url;
  link.download = `zyrquen-qr-forensic-scans-${nowUtc}.json`;
  document.body.appendChild(link);
  link.click();
  // ✅ FIXED: React 19 Safe
  setTimeout(() => {
    if (link.parentNode && link.isConnected) {
      link.parentNode.removeChild(link);
    }
    URL.revokeObjectURL(url);
  }, 150);
};
