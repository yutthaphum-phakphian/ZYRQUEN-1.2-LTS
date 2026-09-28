# Contributing to ZYRQUEN Ω™ Sovereign Runtime

Thank you for contributing to ZYRQUEN Ω™. To maintain SSoT Δ0 = 0.000% zero-drift baseline and 100% Pure Green status, follow these guidelines.

## Development Rules
- **Zero-any Discipline**: TypeScript strict mode is strictly enforced (`noImplicitAny: true`).
- **PQC First**: Do not introduce deprecated or legacy cryptographic functions (e.g., MD5, SHA-1, unpadded RSA).
- **DOM Sanitization**: All render outputs must utilize DOMPurify sanitization.
- **GPG Signing**: Ensure commits are signed using authorized GPG keys.

## Testing Standards
- All new features require Vitest unit tests in `tests/`.
- Run `npm test` and `npx tsc --noEmit` locally before pushing.
