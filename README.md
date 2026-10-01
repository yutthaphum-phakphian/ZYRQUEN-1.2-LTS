# ZYRQUEN Ω™ Sovereign World Engine

Version: 1.2.1  
Repository: [yutthaphum-phakphian/ZYRQUEN-1.2-LTS](https://github.com/yutthaphum-phakphian/ZYRQUEN-1.2-LTS)  
Production UI: [https://yutthaphum-phakphian.github.io/ZYRQUEN-1.2-LTS/](https://yutthaphum-phakphian.github.io/ZYRQUEN-1.2-LTS/)

---

## Overview

ZYRQUEN is a React 19 + TypeScript application for operational monitoring, security validation, and compliance-oriented infrastructure workflows. It combines a modern frontend, Express-based backend, and GitHub Actions automation to support deterministic deployment and engineering-grade verification.

This repository is structured for:
- React 19 UI development with TypeScript strict mode
- Production builds via Vite
- Runtime services through Express.js and Socket.IO
- Automated testing with Vitest
- CI/CD verification through GitHub Actions
- PWA deployment to GitHub Pages

---

## Prerequisites

- Node.js 22+ LTS
- npm 10+
- Git
- Python 3.12+ (for operational scripts)

---

## Quick Start

### Clone and install

```bash
git clone https://github.com/yutthaphum-phakphian/ZYRQUEN-1.2-LTS.git
cd ZYRQUEN-1.2-LTS
npm ci
```

If `npm ci` fails because the lockfile is unavailable or outdated, use:

```bash
npm install
```

### Development

```bash
npm run lint
npm run dev
```

### Test and build

```bash
npm test
npm run build
npm run preview
```

---

## Scripts

The project scripts defined in `package.json` are:

```bash
npm run dev          # Start the dev server
npm run lint         # TypeScript check via tsc --noEmit
npm run build        # Production build with Vite
npm run preview      # Preview production output locally
npm run test         # Run unit and Vitest suites
npm run test:unit    # Run unit tests only
npm run test:coverage # Run coverage report
npm run start        # Run the application server
```

---

## Project Structure

```text
ZYRQUEN-1.2-LTS/
├── .github/
│   └── workflows/              # CI/CD pipeline definitions
├── config/                     # Runtime and environment configuration
├── docs/                       # Documentation and specifications
├── public/                     # Static assets and GitHub Pages content
├── scripts/                    # Operational and security scripts
├── src/                        # Application source code
│   ├── components/             # React components
│   ├── adapters/               # Service integrations
│   ├── config/                 # App configuration
│   └── ...                     # Additional application modules
├── tests/                      # Test suite
├── .env.example                # Example environment configuration
├── index.html                 # Frontend entry HTML
├── package.json                # Dependencies and scripts
├── server.ts                  # Express server entry point
├── tsconfig.json              # TypeScript config
├── vite.config.ts             # Vite config
├── vitest.config.ts           # Vitest config
├── SECURITY.md                # Security policy and reporting
├── README.md                  # Repository overview
├── banner.svg                 # Banner asset
├── replay_verification_dashboard.svg
├── zyrquen-architecture.svg.png
├── metadata.json              # Project metadata
├── npm-shrinkwrap.json        # Lockfile
└── LICENSE                    # Licensing information
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 |
| Language | TypeScript 5.8 |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS 4 |
| Backend | Express.js |
| Real-time communication | Socket.IO |
| Testing | Vitest |
| Runtime | Node.js 22 LTS |

---

## Deployment

The repository is configured for GitHub Pages deployment:

1. Build the app with Vite
2. Publish the generated `dist/` output
3. Sync the artifact to the `gh-pages` branch
4. Serve the site from GitHub Pages

Production site:
- https://yutthaphum-phakphian.github.io/ZYRQUEN-1.2-LTS/

---

## CI/CD and Quality Gates

The repository uses GitHub Actions to validate pull requests and deployment pipelines.

Typical workflow steps:
- Type checking (`npm run lint`)
- Unit test execution (`npm run test:unit`)
- Full test suite (`npm test`)
- Production build (`npm run build`)
- Deployment verification to `gh-pages`

Workflows are stored under:
- `.github/workflows/`

---

## Configuration

### Environment variables

Use `.env` locally for runtime configuration. A sample file is provided:

```bash
.env.example
```

Example:

```bash
VITE_API_BASE=http://localhost:5173
NODE_ENV=development
```

### TypeScript settings

The project uses strict TypeScript configuration. This repository expects:
- no implicit `any`
- no type-checking failures
- no unhandled lint/type errors before merge

---

## Security and Compliance

The project includes operational and compliance-oriented patterns suitable for security-sensitive environments.

Relevant areas include:
- environment configuration management
- CI validation and deployment controls
- audit-oriented operational logging
- structured release and deployment review
- security reporting via `SECURITY.md`

For detailed policy and disclosure guidance, refer to:
- [SECURITY.md](SECURITY.md)
- `docs/`

---

## Development Workflow

Before creating a pull request, ensure the following pass locally:

```bash
npm ci
npm run lint
npm test
npm run build
```

Recommended workflow:
1. Create a feature branch
2. Implement code and tests
3. Run local verification
4. Submit a pull request
5. Confirm CI passes before merge

---

## Contributing

Contributions are welcome. Please keep changes focused, testable, and well-documented.

Expected standards:
- TypeScript must remain strict and build cleanly
- New features should include tests where applicable
- Avoid undocumented behavior changes
- Keep output deterministic and verifiable
- Document operational changes in the relevant docs or PR description

---

## Troubleshooting

| Issue | Suggested fix |
|---|---|
| `npm ci` fails | Ensure lockfile is present and Node/npm versions match project requirements |
| Type checks fail | Run `npm run lint` and fix all TypeScript errors before continuing |
| Local app does not start | Confirm Node 22+ is active and dependencies are installed |
| Tests fail | Run `npm test` and inspect the failing suite before pushing |
| Deployment is stale | Rebuild and verify GitHub Actions deploy workflow output |

---

## License

Copyright © ZYRQUEN Ω™ Sovereign Systems. All rights reserved.

See [LICENSE](LICENSE) for full license terms.

---

## Further Documentation

Relevant documentation directories and files:
- `docs/`
- `SECURITY.md`
- `README.md`
- `package.json`
- `.github/workflows/`
