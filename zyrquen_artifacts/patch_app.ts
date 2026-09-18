import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace the old footer block with MainFooter
if (!content.includes('MainFooter')) {
    const mainFooterImport = "import { MainFooter } from './components/MainFooter';\n";
    content = mainFooterImport + content;
    
    // Find <footer className="relative z-10 border-t border-white/8 bg-[#07080F]/90 backdrop-blur-md py-4">
    // and replace until </footer>
    content = content.replace(/<footer[\s\S]*?<\/footer>/, '<MainFooter />');
    
    fs.writeFileSync('src/App.tsx', content);
}
