const fs = require('fs');
let content = fs.readFileSync('src/components/views/DashboardView.tsx', 'utf8');

content = content.replace(
  'className="p-1.5 rounded-2xl bg-[#070a12] border border-cyan-500/30 flex flex-wrap items-center justify-between gap-2 font-mono text-xs max-[479px]:p-[12px] max-[479px]:grid max-[479px]:grid-cols-1 max-[479px]:gap-2"',
  'className="p-2 rounded-3xl bg-[#0a0f1e]/80 backdrop-blur-xl border border-cyan-500/30 shadow-[0_8px_32px_rgba(6,182,212,0.1)] flex flex-wrap items-center justify-between gap-2 font-mono text-xs max-[479px]:p-[16px] max-[479px]:grid max-[479px]:grid-cols-1 max-[479px]:gap-2"'
);

fs.writeFileSync('src/components/views/DashboardView.tsx', content);
console.log("Replaced nav styling.");
