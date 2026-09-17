const fs = require('fs');
let code = fs.readFileSync('src/components/views/PulseView.tsx', 'utf-8');

code = code.replace(
  `          {/* Export CSV Button */}
          <button
            id="pulseview-export-csv-btn"
            onClick={() => exportActiveEntropyCsv(entropyHistory60m, 'zyrquen-entropy-60min-telemetry')}`,
  `          {/* Export Hardware Snapshots CSV Button */}
          <button
            onClick={() => exportAllHardwareSnapshotsCsv(snapshots)}
            className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 hover:text-white flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)]"
            title="Download current hardware snapshots list for external audit analysis"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Snapshots CSV</span>
          </button>
          
          {/* Export CSV Button */}
          <button
            id="pulseview-export-csv-btn"
            onClick={() => exportActiveEntropyCsv(entropyHistory60m, 'zyrquen-entropy-60min-telemetry')}`
);

fs.writeFileSync('src/components/views/PulseView.tsx', code);
