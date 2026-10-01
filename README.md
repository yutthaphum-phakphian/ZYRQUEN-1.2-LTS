<div align="center">
  <img src="banner.svg" alt="ZYRQUEN Ω™ banner" width="100%" />
</div>

# ZYRQUEN Ω™ Sovereign World Engine

> React 19 + TypeScript application for operational monitoring, security validation, and compliance-oriented infrastructure workflows.

[![Production PWA](https://img.shields.io/badge/Production-PWA-00e5ff?style=for-the-badge&logo=googlechrome&logoColor=black)](https://yutthaphum-phakphian.github.io/ZYRQUEN-1.2-LTS/)
[![Version](https://img.shields.io/badge/version-1.2.1-blue?style=for-the-badge)](https://github.com/yutthaphum-phakphian/ZYRQUEN-1.2-LTS/releases)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-Vitest-6E9F18?style=for-the-badge)](https://vitest.dev/)

## Contents

- [Overview](#overview)
- [Technology stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Available scripts](#available-scripts)
- [Project structure](#project-structure)
- [Configuration](#configuration)
- [Testing and quality](#testing-and-quality)
- [Deployment](#deployment)
- [Security](#security)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

## Overview

ZYRQUEN combines a React frontend, an Express runtime server, and automated verification tooling. The repository is intended for engineers working on monitoring interfaces, security-oriented workflows, audit data, and production deployment.

The application includes:

- React 19 UI components written in TypeScript
- Vite-based development and production builds
- Express.js and Socket.IO runtime services
- Vitest and Node-based unit tests
- PWA assets and GitHub Pages deployment support
- Configuration, documentation, scripts, telemetry, and test fixtures

## Technology stack

| Area | Technology |
| --- | --- |
| Runtime | Node.js 22+ |
| Frontend | React 19, React Router, Recharts, Three.js |
| Language | TypeScript 5.8 |
| Build | Vite 6, Tailwind CSS 4 |
| Server | Express.js, Socket.IO, WebSocket support |
| Testing | Vitest, Testing Library, `tsx --test` |
| Package manager | npm with `npm-shrinkwrap.json` |

## Prerequisites

- Node.js 22 or newer
- npm 10 or newer
- Git
- Python 3.12 or newer when running Python-based operational scripts

## Quick start

```bash
git clone https://github.com/yutthaphum-phakphian/ZYRQUEN-1.2-LTS.git
cd ZYRQUEN-1.2-LTS
npm ci
npm run dev
```

Run the type check and test suite before making changes:

```bash
npm run lint
npm test
```

To create and inspect a production build:

```bash
npm run build
npm run preview
```

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server through `tsx` |
| `npm run lint` | Run TypeScript with `--noEmit` |
| `npm run build` | Create a production Vite build |
| `npm run preview` | Preview the production build |
| `npm test` | Run unit tests and the Vitest suite |
| `npm run test:unit` | Run tests in `tests/unit/` |
| `npm run test:coverage` | Run Vitest with coverage |
| `npm run start` | Start `server.ts` with Node.js |

## Project structure

```text
ZYRQUEN-1.2-LTS/
├── .github/              # GitHub Actions and repository automation
├── architecture_docs/    # Architecture documentation
├── charts/               # Infrastructure charts
├── config/               # Configuration files
├── contracts/            # Contracts and schemas
├��─ docs/                 # Project documentation
├── evidence/             # Evidence and audit artifacts
├── public/               # Static assets and deployment README
├── scripts/              # Operational scripts
├── src/                  # React and TypeScript application source
├── telemetry/            # Telemetry resources
├── tests/                # Test suites
├── server.ts             # Express runtime entry point
├── package.json          # Scripts and dependencies
├── npm-shrinkwrap.json   # Locked dependency tree
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
└── vitest.config.ts      # Vitest configuration
```

## Configuration

Copy `.env.example` to `.env` for local configuration:

```bash
cp .env.example .env
```

Do not commit secrets or local credentials. Review the example file and the application configuration before adding new environment variables.

## Testing and quality

The expected local verification sequence is:

```bash
npm ci
npm run lint
npm test
npm run build
```

TypeScript is checked without emitting compiled files. New functionality should include appropriate tests, and pull requests should leave the build and test commands passing.

Additional operational checks may be provided under `scripts/` and are invoked by the relevant GitHub Actions workflows under `.github/workflows/`.

## Deployment

The production PWA is published through GitHub Pages:

[https://yutthaphum-phakphian.github.io/ZYRQUEN-1.2-LTS/](https://yutthaphum-phakphian.github.io/ZYRQUEN-1.2-LTS/)

The normal deployment flow is:

1. Install the locked dependencies with `npm ci`.
2. Run the verification and build steps.
3. Publish the generated `dist/` directory through the repository deployment workflow.
4. Validate the deployed application and SPA fallback assets.

See `.github/workflows/` for the current workflow definitions rather than relying on workflow names in this document.

## Security

Security reporting and repository-specific security guidance are documented in [`SECURITY.md`](SECURITY.md). Please do not disclose credentials, personal data, or sensitive operational evidence in public issues.

The repository contains compliance-oriented documentation and audit workflows. These materials describe project intent and implementation patterns; they should not be interpreted as independent legal certification or a substitute for a formal security assessment.

## Contributing

1. Create a focused feature branch.
2. Make the smallest maintainable change.
3. Add or update tests where appropriate.
4. Run `npm run lint`, `npm test`, and `npm run build`.
5. Open a pull request with a clear description and verification notes.

See [`docs/`](docs/) and [`SECURITY.md`](SECURITY.md) for repository guidance.

## Troubleshooting

| Problem | Resolution |
| --- | --- |
| `npm ci` fails | Use Node.js 22+ and npm 10+, then retry from a clean working tree. |
| Type errors appear | Run `npm run lint` and resolve every reported error. |
| Tests fail locally | Reinstall with `npm ci`, then run the failing test command directly. |
| Dev server does not start | Check the configured port and verify that `.env` contains the required local values. |
| Deployment is stale | Inspect the latest GitHub Actions run and confirm that `dist/` was generated. |

## License

Copyright © ZYRQUEN Ω™ Sovereign Systems. All rights reserved.

For security concerns, see [`SECURITY.md`](SECURITY.md).
