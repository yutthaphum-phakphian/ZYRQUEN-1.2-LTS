import fs from 'fs';

let content = fs.readFileSync('src/components/RightSidebar.tsx', 'utf-8');

if (!content.includes('SovereignCopilot')) {
    const importStr = "import { SovereignCopilot } from './SovereignCopilot';\n";
    content = importStr + content;
    
    // find a place to put it, maybe at the top of the RightSidebar inside `<aside>`
    content = content.replace(/<aside[^>]*>/, '$&\n        <div className="mb-4 h-64">\n          <SovereignCopilot />\n        </div>\n');
    
    fs.writeFileSync('src/components/RightSidebar.tsx', content);
}
