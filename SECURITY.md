# Contributing

Thanks for helping improve ZYRQUEN Ω™. This guide keeps changes small, tested, and easy to review.

## Setup

Requirements: Node.js 22+ and npm 10+.

```bash
git clone https://github.com/yutthaphum-phakphian/ZYRQUEN-1.2-LTS.git
cd ZYRQUEN-1.2-LTS
npm ci
npm run dev
```

## Workflow

1. Create a focused feature branch from `main`.
2. Make one measurable change per pull request.
3. Add or update tests for the behavior you change.
4. Run the local checks below.
5. Open a pull request describing what changed and how you verified it.

## Local checks

Run these before opening a pull request:

```bash
npx tsc --noEmit
npm test
npm run build
```

All three should pass. The CI workflows in `.github/workflows/` run the repository's automated checks on every pull request.

## Commit messages

Use short, descriptive messages with a type prefix, for example:

- `feat: add replay export`
- `fix: resolve race condition in dashboard tests`
- `docs: update README verification status`
- `chore: remove unused assets`

## Security

Do not commit secrets, credentials, or personal data. Report vulnerabilities as described in [SECURITY.md](SECURITY.md) instead of opening a public issue.
