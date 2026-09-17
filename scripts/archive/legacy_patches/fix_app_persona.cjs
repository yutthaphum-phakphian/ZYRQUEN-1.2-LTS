const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /chambers: \{\n      name: 'Chambers',\n      orb1: 'from-amber-400', orb2: 'to-orange-500', orb3: 'via-red-500', accentGlow: 'shadow-orange-500\/50'\n    \}\n  \};/,
  `chambers: {
      name: 'Chambers',
      orb1: 'from-amber-400', orb2: 'to-orange-500', orb3: 'via-red-500', accentGlow: 'shadow-orange-500/50'
    },
    'admin-users': {
      name: 'Admin Users',
      orb1: 'from-cyan-400', orb2: 'to-emerald-500', orb3: 'via-teal-500', accentGlow: 'shadow-cyan-500/50'
    }
  };`
);

fs.writeFileSync('src/App.tsx', code);
