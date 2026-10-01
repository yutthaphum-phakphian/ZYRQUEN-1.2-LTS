# ZYRQUEN Ω™ Sovereign World Engine

The application includes:
- Production UI written in TypeScript
- File-based development and production builds
- Comprehensive automated verification suite
- Continuous Integration via GitHub Actions
- GitHub Pages deployment support
- Security gates, invariant verification checks, telemetry, and test suites

---

## 🛠️ Technology Stack

| Area | Technology |
|---|---|
| Frontend | React 19, React Router, Tailwind CSS |
| UI | Lucide React |
| Language | TypeScript 5.x |
| Build | Vite 6, Tailwind CSS 4 |
| Backend | Express 4, Socket.IO, WebSockets |
| Testing | Vitest, Testing Library, `@vitest/coverage-v8` |
| Package Manager | npm with `package-lock.json` |

---

## 📋 Prerequisites

- **Node.js**: `>= 22` (or >= 22.x)
- **npm**: `>= 10` (or >= 10.x)
- **Git**
- **Python 3.12+** (required when running Python-based operational scripts)

---

## 🚀 Quick Start

```bash
git clone [https://github.com/yutthaphum-phakphian/ZYRQUEN-1.2-LTS.git](https://github.com/yutthaphum-phakphian/ZYRQUEN-1.2-LTS.git)
cd ZYRQUEN-1.2-LTS
npm ci
npm run dev

Run the test suite and check type safety before making changes:
npm run typecheck
npm test

To create and inspect a production build:
npm run build
npm run preview

📜 Available Scripts
| Script | Purpose |
|---|---|
| npm run dev | Start the development server with HMR. |
| npm run build | Run typecheck and compile production bundle. |
| npm run create-build | Create a production Vite build. |
| npm run preview | Preview the production build. |
| npm test | Run unit tests and Vitest suites. |
| npm run test:watch | Run tests in watch mode. |
| npm run test:coverage | Run Vitest with coverage report. |
| npm run start | Start server with Node.js. |
📁 Project Structure
ZYRQUEN-1.2-LTS/
├── .github/          # GitHub Actions and repository automation
├── config/           # Configuration files
├── docs/             # Specs, manuals, and docs
├── public/           # Static assets
├── scripts/          # Operational scripts
├── src/              # Application source code
│   ├── components/   # React components
│   ├── config/       # System & invariant configuration
│   ├── types/        # TypeScript declarations
│   └── main.tsx      # Entry point
├── tests/            # Vitest unit & integration tests
├── .env.example      # Environment variables template
├── package.json      # Dependencies and npm scripts
├── README.md         # Primary documentation
└── vite.config.ts    # Vite build configuration

⚙️ Configuration
Copy .env.example to .env for local configuration:
cp .env.example .env

> Important: Do not commit secrets or local credentials. Review the example file and the application documentation before adding new environment variables.
> 
🧪 Testing and Quality
The expected local verification sequence is:
npm ci
npx tsc --noEmit
npm run lint
npm test

TypeCheck is checked without emitting compiled files. New functionality should include appropriate tests, and pull requests should pass the build and test commands before submitting.
Additional operational checks may be required under scripts/ and are invoked by the relevant GitHub Actions workflows under .github/workflows/.
🚀 Deployment
The production PWA is published through GitHub Pages:
https://yutthaphum-phakphian.github.io/ZYRQUEN-1.2-LTS/
The normal deployment flow is:
 * Install the locked dependencies with npm ci.
 * Run type verification and build steps.
 * Publish the generated dist/ directory through the repository deployment workflow.
 * Validate the deployed application and SPA fallback assets.
See .github/workflows/ for the current workflow definitions rather than relying on workflow names in this document.
🛡️ Security
Security reporting and repository-specific security guidance are documented in SECURITY.md. Never commit credentials, personal data, or sensitive operational evidence to public issues.
The repository contains compliance documentation and audit workflows. These materials describe project intent and implementation patterns. They should not be interpreted as independent legal certification or a substitute for a formally licensed security audit.
🤝 Contributing
 * Create a focused feature branch.
 * Make the intended measurable change.
 * Add or update tests where appropriate.
 * Test locally with npx tsc --noEmit and npm test.
 * Open a pull request with a clear description and verification notes.
See CONTRIBUTING.md for repository guidance.
🔧 Troubleshooting
| Problem | Resolution |
|---|---|
| npm ci fails | Use Node.js 22+ and npm 10+. Clean node_modules and retry. |
| Type errors appear | Run npx tsc --noEmit and resolve every reported error. |
| Tests fail locally | Replace with npm test, then run the failing test command directly. |
| Dev server does not start | Check the configured port and verify that .env contains valid options. |
| Deployment is stale | Inspect the latest GitHub Actions run and confirm that dist/ was generated. |
📄 License
Copyright © ZYRQUEN Ω™ Sovereign Systems. All rights reserved.
For security concerns, see SECURITY.md.

