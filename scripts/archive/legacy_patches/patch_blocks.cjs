const fs = require('fs');
let code = fs.readFileSync('src/components/views/BlocksVisualizationTool.tsx', 'utf-8');

code = code.replace(
  `                  <span className="text-[10px] text-zinc-500 block">SEALED HASH</span>
                  <p className="text-xs text-blue-300 font-mono break-all cursor-pointer hover:text-blue-200" onClick={() => copyToClipboard(selectedSnapshot.sealedHash)}>
                    {selectedSnapshot.sealedHash}
                  </p>`,
  `                  <span className="text-[10px] text-zinc-500 block">SEALED HASH</span>
                  <div className="flex items-start gap-2">
                    <p className="text-xs text-blue-300 font-mono break-all flex-1">
                      {selectedSnapshot.sealedHash}
                    </p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(selectedSnapshot.sealedHash); }}
                      className="text-blue-400 hover:text-white p-1 rounded-md bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 transition-all flex-shrink-0"
                      title="Copy Hash"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                  </div>`
);

code = code.replace(
  `                  <span className="text-[10px] text-zinc-500 block mt-2">PARENT HASH</span>
                  <p className="text-xs text-zinc-400 font-mono break-all cursor-pointer hover:text-zinc-300" onClick={() => copyToClipboard(selectedSnapshot.parentHash)}>
                    {selectedSnapshot.parentHash}
                  </p>`,
  `                  <span className="text-[10px] text-zinc-500 block mt-2">PARENT HASH</span>
                  <div className="flex items-start gap-2">
                    <p className="text-xs text-zinc-400 font-mono break-all flex-1">
                      {selectedSnapshot.parentHash}
                    </p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(selectedSnapshot.parentHash); }}
                      className="text-zinc-400 hover:text-white p-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex-shrink-0"
                      title="Copy Parent Hash"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                  </div>`
);

fs.writeFileSync('src/components/views/BlocksVisualizationTool.tsx', code);
