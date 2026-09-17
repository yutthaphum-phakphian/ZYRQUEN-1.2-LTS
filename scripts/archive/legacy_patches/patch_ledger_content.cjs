const fs = require('fs');
let code = fs.readFileSync('src/components/views/LedgerView.tsx', 'utf-8');
code = code.replace(
  `      {/* TAB: Interactive Merkle Tree Graph */}
      {activeLedgerTab === 'merkle-tree' && (
        <div className="animate-in fade-in duration-200">
          <MerkleTreeInteractiveGraph snapshots={allSnapshots} />
        </div>
      )}`,
  `      {/* TAB: Interactive Merkle Tree Graph */}
      {activeLedgerTab === 'merkle-tree' && (
        <div className="animate-in fade-in duration-200">
          <MerkleTreeInteractiveGraph snapshots={allSnapshots} />
        </div>
      )}

      {/* TAB: Block Visualizer */}
      {activeLedgerTab === 'blocks' && (
        <div className="animate-in fade-in duration-200">
          <BlocksVisualizationTool snapshots={allSnapshots} />
        </div>
      )}`
);

if (!code.includes("import { BlocksVisualizationTool }")) {
  code = `import { BlocksVisualizationTool } from './BlocksVisualizationTool';\n` + code;
}

fs.writeFileSync('src/components/views/LedgerView.tsx', code);
