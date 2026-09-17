const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  `  chambers: {
    name: '18 Sovereign Chambers Control Plane',
    orb1: 'bg-indigo-600/18',
    orb2: 'bg-cyan-600/14',
    orb3: 'bg-emerald-600/10',
    accentGlow: 'rgba(99,102,241,0.12)',
  },`,
  `  chambers: {
    name: '18 Sovereign Chambers Control Plane',
    orb1: 'bg-indigo-600/18',
    orb2: 'bg-cyan-600/14',
    orb3: 'bg-emerald-600/10',
    accentGlow: 'rgba(99,102,241,0.12)',
  },
  'admin-users': {
    name: 'Sovereign RBAC Console',
    orb1: 'bg-cyan-600/18',
    orb2: 'bg-emerald-600/14',
    orb3: 'bg-teal-600/10',
    accentGlow: 'rgba(6,182,212,0.12)',
  },`
);

fs.writeFileSync('src/App.tsx', code);
