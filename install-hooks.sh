#!/usr/bin/env bash
# ======================================================================
# 🛡️ ZYRQUEN Ω∞ — SOVEREIGN PRE-COMMIT HOOK & GPG AUTO-INSTALLER v2.1
#    Release Spec : FROZEN v1.2.1 LTS | SSoT Baseline #849202 (Δ = 0.00%)
# ======================================================================

set -e

echo "======================================================================"
echo "🛡️ ZYRQUEN Ω∞ — Installing Sovereign Pre-Commit Security Hook..."
echo "======================================================================"

HOOK_DIR=".git/hooks"
PRE_COMMIT_HOOK="$HOOK_DIR/pre-commit"

if [ ! -d ".git" ]; then
    echo "⚠️ Warning: .git directory not initialized. Creating hook directory..."
    mkdir -p "$HOOK_DIR"
fi

mkdir -p "$HOOK_DIR"

cat << 'EOF' > "$PRE_COMMIT_HOOK"
#!/usr/bin/env bash
# ZYRQUEN Ω∞ Sovereign Pre-Commit Verification Gate
echo "🛡️ Running ZYRQUEN Ω∞ Pre-Commit Security Gate (22 Verification Gates)..."
python3 zyrquen-security-gate.py
EOF

chmod +x "$PRE_COMMIT_HOOK"

echo "✓ Created executable pre-commit hook at $PRE_COMMIT_HOOK"

# Git Configuration Setup
echo "⚙️ Configuring Sovereign Git Commit & GPG Signing Identity..."
if command -v git &> /dev/null && [ -d ".git" ]; then
    git config user.name "Nong Zyrquen"
    git config user.email "nong.zyrquen@zyrquen.io"
    git config user.signingkey "9641650E56EEEBC38263F4126AA098097151A505"
    git config commit.gpgsign true
    git config tag.gpgSign true

    echo "✓ Git user name       : Nong Zyrquen"
    echo "✓ Git user email      : nong.zyrquen@zyrquen.io"
    echo "✓ GPG Master Key ID   : 9641650E56EEEBC38263F4126AA098097151A505"
    echo "✓ Auto GPG Commit Sign: ENFORCED (commit.gpgsign=true)"
    echo "✓ Auto GPG Tag Sign   : ENFORCED (tag.gpgSign=true)"
else
    echo "ℹ️ Git directory not found or git not in path, skipped git config."
fi

echo "======================================================================"
echo "✅ SOVEREIGN PRE-COMMIT HOOK & GPG SIGNING INSTALLED SUCCESSFULLY"
echo "======================================================================"
