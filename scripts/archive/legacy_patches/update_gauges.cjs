const fs = require('fs');
let content = fs.readFileSync('src/components/views/DashboardView.tsx', 'utf8');

content = content.replace(/className={\`p-4 rounded-2xl bg-\[#0a0f1e\] border space-y-1\.5 transition-all relative overflow-hidden/g, 'className={`p-4 sm:p-5 rounded-3xl bg-[#0a0f1e]/80 backdrop-blur-xl border space-y-2 transition-all relative overflow-hidden shadow-lg');

fs.writeFileSync('src/components/views/DashboardView.tsx', content);
console.log("Replaced gauges styling.");
