import fs from 'fs';
let content = fs.readFileSync('src/components/RightSidebar.tsx', 'utf-8');
console.log(content.includes('SovereignCopilot'));
