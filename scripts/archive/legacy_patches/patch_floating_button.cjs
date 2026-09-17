const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  `      {/* Global Keyboard Shortcuts Modal */}`,
  `      {/* Floating Keyboard Shortcuts Button */}
      <button
        onClick={() => setIsShortcutsOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-cyan-600/30 hover:bg-cyan-500/50 border border-cyan-500/50 flex items-center justify-center text-cyan-200 hover:text-white backdrop-blur-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all z-[9990] animate-bounce-slight"
        title="View Keyboard Shortcuts & Help"
      >
        <span className="font-bold text-lg font-mono">?</span>
      </button>

      {/* Global Keyboard Shortcuts Modal */}`
);

fs.writeFileSync('src/App.tsx', code);
