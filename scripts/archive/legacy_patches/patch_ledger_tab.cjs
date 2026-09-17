const fs = require('fs');
let code = fs.readFileSync('src/components/views/LedgerView.tsx', 'utf-8');
code = code.replace(
  `          <span>Merkle Tree Graph</span>
        </button>
      </div>`,
  `          <span>Merkle Tree Graph</span>
        </button>

        <button
          onClick={() => {
            playTone(630, 0.04);
            setActiveLedgerTab('blocks');
          }}
          className={\`relative z-10 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all tracking-wide \${
            activeLedgerTab === 'blocks'
              ? 'bg-blue-500/25 text-blue-100 border border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.25)]'
              : 'text-zinc-400 hover:text-blue-300 hover:bg-blue-500/10 border border-transparent'
          }\`}
        >
          <Box className={\`w-4 h-4 \${activeLedgerTab === 'blocks' ? 'text-blue-400' : 'text-zinc-500'}\`} />
          <span>Block Visualizer</span>
        </button>
      </div>`
);
fs.writeFileSync('src/components/views/LedgerView.tsx', code);
