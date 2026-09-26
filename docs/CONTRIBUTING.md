
Contributing to ZYRQUEN Ω™ Sovereign Runtime
Thank you for contributing to ZYRQUEN Ω™. To maintain SSoT \Delta 0 = 0.000\% zero-drift baseline and 100% Pure Green status, follow these guidelines.
Development Rules
Zero-any Discipline: TypeScript strict mode is strictly enforced (noImplicitAny: true). Zero any types are permitted.
PQC First: Do not introduce deprecated or legacy cryptographic functions (e.g., MD5, SHA-1, unpadded RSA). All cryptographic logic must align with NIST Post-Quantum Cryptography standards (ML-DSA-87 / Dilithium-5, ML-KEM-1024).
DOM Sanitization: All render outputs must utilize DOMPurify sanitization.
GPG Signing: Ensure commits are signed using authorized GPG keys matching your registered profile.
Pull Request Workflow
Branching Strategy: Create a feature or fix branch off main using structured naming:
git checkout -b feature/pqc-audit-extension
# or
git checkout -b fix/telemetry-latency-drift


Local Pre-flight Check: Run strict type checks and test suites locally:
npx tsc --noEmit
npm test


Signed Commits: Commit changes with GPG signature enabled:
git commit -S -m "feat(security): update invariant attestation logic"


Security Gate Verification: Push your branch and verify that all 7 stages of zyrquen-security-gate.yml pass successfully on GitHub.
Testing Standards
All new features require Vitest unit and invariant tests in tests/.
Maintained suites must retain a 100% pass rate.
Execute npm test and npx tsc --noEmit locally prior to opening a Pull Request.
Forensic & Statutory Compliance
Submissions affecting core runtime modules, cryptographic logic, or audit logs are registered under Module 17 immutable records and must strictly align with Thai statutory regulations (พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ฯ) and PDPA Section 37 data protection standards.
