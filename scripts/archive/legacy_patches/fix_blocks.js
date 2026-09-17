const fs = require('fs');
let code = fs.readFileSync('src/components/views/BlocksVisualizationTool.tsx', 'utf-8');

code = code.replace(
  /className={\\\`p-3 rounded-xl border font-mono cursor-pointer transition-all \\\${/g,
  "className={`p-3 rounded-xl border font-mono cursor-pointer transition-all ${"
);

code = code.replace(
  /\\\`\}/g,
  "`}"
);

code = code.replace(
  /className={\\\`text-\\[9px\\] px-2 py-0.5 rounded-full \\\${/g,
  "className={`text-[9px] px-2 py-0.5 rounded-full ${"
);

fs.writeFileSync('src/components/views/BlocksVisualizationTool.tsx', code);
