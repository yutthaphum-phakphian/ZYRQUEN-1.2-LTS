#!/usr/bin/env bash
# ==============================================================================
# ZYRQUEN Ω∞ Sovereign Release Tagging Automation Script
# Engine Version: LOCKED_FROZEN_v1.2_LTS
# Sovereign Principal: นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)
# ==============================================================================

set -euo pipefail

TAG_NAME="v1.2-LTS"
RELEASE_BRANCH="main"
RELEASE_NOTES_FILE="RELEASE_NOTES_v1.2_LTS.md"

echo "================================================================="
echo "   ZYRQUEN Ω∞ RELEASE TAGGING AUTOMATION (${TAG_NAME})"
echo "================================================================="

# 1. Check if git working directory is clean
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ ERROR: Working directory is not clean. Please commit or stash changes first."
  exit 1
fi
echo "✔ Working tree clean."

# 2. Check current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "$RELEASE_BRANCH" ]; then
  echo "❌ ERROR: Must be on branch '${RELEASE_BRANCH}' to release. Current branch: '${CURRENT_BRANCH}'"
  exit 1
fi
echo "✔ On release branch '${RELEASE_BRANCH}'."

# 3. Verify release notes exist
if [ ! -f "$RELEASE_NOTES_FILE" ]; then
  echo "⚠️ WARNING: Release notes file '${RELEASE_NOTES_FILE}' not found in root directory."
fi

# 4. Check if tag already exists
if git rev-parse "$TAG_NAME" >/dev/null 2>&1; then
  echo "⚠️ Tag '${TAG_NAME}' already exists locally."
  read -p "Do you want to recreate tag '${TAG_NAME}'? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git tag -d "$TAG_NAME"
  else
    echo "Aborting release tagging."
    exit 0
  fi
fi

# 5. Create annotated git tag
echo "🏷️ Creating annotated Git tag: ${TAG_NAME}..."
git tag -a "$TAG_NAME" -m "Release ZYRQUEN Ω∞ v1.2-LTS (Commit $(git rev-parse --short HEAD)): React 19 Native Upgrade, Strict CI/CD, SSoT Δ0 Baseline 0.00% Drift"

echo "✔ Tag '${TAG_NAME}' created successfully."

# 6. Push tag to origin
echo "🚀 Pushing tag '${TAG_NAME}' to remote origin..."
git push origin "$TAG_NAME"

echo "================================================================="
echo " [✓] RELEASE TAGGING COMPLETED SUCCESSFULLY FOR ${TAG_NAME}"
echo "================================================================="
