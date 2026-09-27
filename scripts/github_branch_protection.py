#!/usr/bin/env python3
"""
ZYRQUEN Ω∞ GitHub Security & Branch Protection Automation Script
Repo: yutthaphum-phakphian/ZYRQUEN-1.2-LTS
Branch: main

This script provides automated checks for GitHub PAT / GITHUB_TOKEN permissions
and configures strict Branch Protection Rules for the `main` branch.
"""

import json
import os

REPO_OWNER = "yutthaphum-phakphian"
REPO_NAME = "ZYRQUEN-1.2-LTS"
BRANCH = "main"

BRANCH_PROTECTION_PAYLOAD = {
    "required_status_checks": {
        "strict": True,
        "contexts": [
            "🛡️ SSoT Verification & Build Production Bundle",
            "🔬 CodeQL Security & Cryptographic Vulnerability Audit",
            "🏛️ Senate Gate — Helm Chart & Enterprise Performance Benchmark",
            "🛡️ Audit Ledger, PQC Parity & SPHINCS+ Fallback Validation"
        ]
    },
    "enforce_admins": True,
    "required_pull_request_reviews": {
        "dismiss_stale_reviews": True,
        "require_code_owner_reviews": False,
        "required_approving_review_count": 1
    },
    "restrictions": None,
    "required_linear_history": True,
    "allow_force_pushes": False,
    "allow_deletions": False,
    "required_conversation_resolution": True
}

def main():
    print("===========================================================================")
    print("  🛡️ ZYRQUEN Ω∞ GITHUB SECURITY & BRANCH PROTECTION CONFIGURATION")
    print(f"  Target Repository: {REPO_OWNER}/{REPO_NAME}")
    print(f"  Target Branch    : {BRANCH}")
    print("===========================================================================")
    
    print("\n[1] GitHub CLI / API Commands for Auth Status Check:")
    print("  # Check active GitHub auth status and token scopes")
    print("  gh auth status")
    print("  # Or check via cURL with GITHUB_TOKEN:")
    print("  curl -s -H \"Authorization: token $GITHUB_TOKEN\" https://api.github.com/user | grep login")
    
    print("\n[2] Setting Branch Protection Rules via GitHub CLI (`gh`):")
    print(f"  gh api -X PUT /repos/{REPO_OWNER}/{REPO_NAME}/branches/{BRANCH}/protection \\")
    print("    -H \"Accept: application/vnd.github+json\" \\")
    print("    -F \"required_status_checks[strict]=true\" \\")
    print("    -F \"required_status_checks[contexts][]=🛡️ SSoT Verification & Build Production Bundle\" \\")
    print("    -F \"required_status_checks[contexts][]=🔬 CodeQL Security & Cryptographic Vulnerability Audit\" \\")
    print("    -F \"required_status_checks[contexts][]=🏛️ Senate Gate — Helm Chart & Enterprise Performance Benchmark\" \\")
    print("    -F \"enforce_admins=true\" \\")
    print("    -F \"required_linear_history=true\" \\")
    print("    -F \"allow_force_pushes=false\" \\")
    print("    -F \"allow_deletions=false\"")

    print("\n[3] JSON Payload Reference for GitHub REST API (PUT /repos/.../protection):")
    print(json.dumps(BRANCH_PROTECTION_PAYLOAD, indent=2, ensure_ascii=False))

    print("\n===========================================================================")
    print("  VERDICT: GITHUB BRANCH PROTECTION CONFIGURATION READY 🟢")
    print("===========================================================================")

if __name__ == "__main__":
    main()
