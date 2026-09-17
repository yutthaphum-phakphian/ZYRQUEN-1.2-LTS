const fs = require('fs');
let code = fs.readFileSync('src/components/Navigation.tsx', 'utf-8');

if (!code.includes("ShieldAlert,")) {
  code = code.replace(/Settings,/, "Settings,\n  ShieldAlert,");
}

fs.writeFileSync('src/components/Navigation.tsx', code);
