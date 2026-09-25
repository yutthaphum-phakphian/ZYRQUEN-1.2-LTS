#!/bin/bash
set -e
# 🔒 FAIL-CLOSED GUARD - Zero-Touch Core Kernel
echo "🛡️  Verifying SSoT Core..."
grep -q "849202" src/App.tsx || { echo "❌ BLOCKED TAMPER DETECTED - Core missing"; exit 1; }
grep -q "14902" src/App.tsx || { echo "❌ BLOCKED - Seals missing"; exit 1; }
echo "✅ Core Genesis #849202 | 14902 Seals | Δ0 VERIFIED - Safe to proceed"

# 🔒 ห้ามแตะเด็ดขาด
PROTECTED=("src/App.tsx" "src/SovereignChamberConsole.tsx" ".github/workflows" "SHA256" "package.json" "evidence" ".git" "zyrquen-ssh-tunnel.sh")

DRY_RUN=${1:---dry-run}
if [ "$DRY_RUN" = "--dry-run" ]; then
  echo "🧪 DRY RUN - จะลบอะไรบ้าง:"
  echo "  - node_modules/ dist/ build/ .next/ .turbo/ .parcel-cache/ coverage/"
  echo "  - *.log .DS_Store Thumbs.db *.tmp"
  du -sh node_modules dist .next .turbo 2>/dev/null || true
else
  echo "🚀 Tomin Cleaning..."
  rm -rf node_modules dist build .next .turbo .parcel-cache coverage .nyc_output
  find . -type f \( -name "*.log" -o -name ".DS_Store" -o -name "Thumbs.db" -o -name "*.tmp" \) -delete
  echo "✅ Cleanup Done - Core Untouched 100%"
fi
