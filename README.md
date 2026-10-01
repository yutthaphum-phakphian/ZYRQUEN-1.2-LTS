<div align="center">

<img src="banner.svg" alt="ZYRQUEN Ω™ banner" width="100%" />

<br />

[![PWA](https://img.shields.io/badge/PWA-LIVE-00e5ff?style=flat-square&labelColor=0d1117&logo=googlechrome&logoColor=00e5ff)](https://yutthaphum-phakphian.github.io/ZYRQUEN-1.2-LTS/)
[![Release](https://img.shields.io/badge/RELEASE-v1.2.1%20LTS-a855f7?style=flat-square&labelColor=0d1117)](https://github.com/yutthaphum-phakphian/ZYRQUEN-1.2-LTS/releases/tag/v1.2.1)
[![CI](https://img.shields.io/github/actions/workflow/status/yutthaphum-phakphian/ZYRQUEN-1.2-LTS/ci.yml?style=flat-square&labelColor=0d1117&label=CI&logo=githubactions&logoColor=ffd700)](https://github.com/yutthaphum-phakphian/ZYRQUEN-1.2-LTS/actions)
[![TypeScript](https://img.shields.io/badge/TYPESCRIPT-~5.8-ffd700?style=flat-square&labelColor=0d1117&logo=typescript&logoColor=ffd700)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/NODE-%E2%89%A522-00e5ff?style=flat-square&labelColor=0d1117&logo=nodedotjs&logoColor=00e5ff)](https://nodejs.org/)

<br />

**[▶ LIVE APP](https://yutthaphum-phakphian.github.io/ZYRQUEN-1.2-LTS/)** &nbsp;◆&nbsp; [RELEASES](https://github.com/yutthaphum-phakphian/ZYRQUEN-1.2-LTS/releases) &nbsp;◆&nbsp; [SECURITY](SECURITY.md) &nbsp;◆&nbsp; [CONTRIBUTING](CONTRIBUTING.md)

</div>

---

## Overview

The application includes:

- Production UI written in TypeScript
- File-based development and production builds
- Comprehensive automated verification suite
- Continuous Integration via GitHub Actions
- GitHub Pages deployment support
- Security gates, invariant verification checks, telemetry, and test suites

## Table of Contents

- [Verification Status](#verification-status)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Testing and Quality](#testing-and-quality)
- [Deployment](#deployment)
- [Security](#security)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Verification Status

Last checked in GitHub Codespaces on 2026-10-01:

| Check | Result |
|:--|:--|
| Unit tests (Vitest) | 128 of 128 passed; 21 of 21 test files passing |
| Production build (`npm run build`) | Succeeds |
| GitHub Actions | 13 workflow files in `.github/workflows/` |
| Genesis anchor | Block `849202`, recorded in `evidence/real-gates-verification.json` |

> [!NOTE]
> Files under `evidence/` are project-recorded data describing the verification model. They are not independent certification, and this README makes no claim of hardware HSM attestation or FIPS validation.

---

## Technology Stack

| Area | Technology |
|:--|:--|
| Frontend | React 19, React Router, Tailwind CSS |
| UI | Lucide React |
| Language | TypeScript ~5.8 |
| Build | Vite ^6.2, Tailwind CSS 4 |
| Backend | Express 4, Socket.IO, WebSockets |
| Testing | Vitest ^5, Testing Library, `@vitest/coverage-v8` |
| Package manager | npm with `package-lock.json` |

## Prerequisites

- **Node.js** `>= 22` (last verified on 24.21)
- **npm** `>= 10` (last verified on 11.19)
- **Git**
- **Python** `3.12+` (only for Python-based operational scripts)

## Quick Start

```bash
git clone https://github.com/yutthaphum-phakphian/ZYRQUEN-1.2-LTS.git
cd ZYRQUEN-1.2-LTS
npm ci
npm run dev
```

Check types and run tests before making changes:

```bash
npm run typecheck
npm test
```

Create and inspect a production build:

```bash
npm run build
npm run preview
```

## Available Scripts

| Script | Purpose |
|:--|:--|
| `npm run dev` | Start the development server with HMR |
| `npm run build` | Typecheck and compile the production bundle |
| `npm run create-build` | Create a production Vite build |
| `npm run preview` | Preview the production build |
| `npm test` | Run unit tests and Vitest suites |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run Vitest with a coverage report |
| `npm run start` | Start the server with Node.js |

## Project Structure

```text
ZYRQUEN-1.2-LTS/
├── .github/          # GitHub Actions and repository automation
├── config/           # Configuration files
├── docs/             # Specs, manuals, and docs
├── public/           # Static assets
├── scripts/          # Operational scripts
├── src/              # Application source code
│   ├── components/   # React components
│   ├── config/       # System and invariant configuration
│   ├── types/        # TypeScript declarations
│   └── main.tsx      # Entry point
├── tests/            # Vitest unit and integration tests
├── .env.example      # Environment variables template
├── package.json      # Dependencies and npm scripts
├── README.md         # Primary documentation
└── vite.config.ts    # Vite build configuration
```

## Configuration

Copy the example file for local configuration:

```bash
cp .env.example .env
```

> [!IMPORTANT]
> Do not commit secrets or local credentials. Review the example file and the application documentation before adding new environment variables.

## Testing and Quality

Expected local verification sequence:

```bash
npm ci
npx tsc --noEmit
npm run lint
npm test
```

Type checking runs without emitting compiled files. New functionality should include appropriate tests, and pull requests should pass the build and test commands before submitting.

Additional operational checks may live under `scripts/` and are invoked by the workflows in `.github/workflows/`.

## Deployment

The production PWA is published through GitHub Pages:

**https://yutthaphum-phakphian.github.io/ZYRQUEN-1.2-LTS/**

Normal deployment flow:

1. Install locked dependencies with `npm ci`.
2. Run type verification and build steps.
3. Publish the generated `dist/` directory through the repository deployment workflow.
4. Validate the deployed application and SPA fallback assets.

See `.github/workflows/` for the current workflow definitions rather than relying on workflow names in this document.

## Security

Security reporting and repository-specific guidance are documented in [SECURITY.md](SECURITY.md). Never commit credentials, personal data, or sensitive operational evidence to public issues.

The repository contains compliance documentation and audit workflows. These materials describe project intent and implementation patterns. They should not be interpreted as independent legal certification or a substitute for a formally licensed security audit.

## Contributing

1. Create a focused feature branch.
2. Make the intended measurable change.
3. Add or update tests where appropriate.
4. Test locally with `npx tsc --noEmit` and `npm test`.
5. Open a pull request with a clear description and verification notes.

See [CONTRIBUTING.md](CONTRIBUTING.md) for repository guidance.

## Troubleshooting

| Problem | Resolution |
|:--|:--|
| `npm ci` fails | Use Node.js 22+ and npm 10+. Remove `node_modules` and retry. |
| Type errors appear | Run `npx tsc --noEmit` and resolve every reported error. |
| Tests fail locally | Run `npm test`, then re-run the failing test file directly. |
| Dev server does not start | Check the configured port and confirm `.env` has valid values. |
| Deployment is stale | Inspect the latest GitHub Actions run and confirm `dist/` was generated. |

## License

Copyright © ZYRQUEN Ω™ Sovereign Systems. All rights reserved.

For security concerns, see [SECURITY.md](SECURITY.md).
