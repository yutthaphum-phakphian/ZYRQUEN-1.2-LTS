# Final Tagging Checklist — v1.2.1

Use this checklist only after the migration pull request has been reviewed and
merged into `main`.

## 1. Pre-release gates

- [ ] Confirm the pull request targets `main`.
- [ ] Confirm all required CI checks are green.
- [ ] Confirm the PR contains only the intended jsPDF/AutoTable migration and
      regression test changes.
- [ ] Confirm the release version is `v1.2.1`.
- [ ] Confirm the working tree is clean:

  ```bash
  git status --short
  ```

- [ ] Confirm the release commit is the expected `main` commit:

  ```bash
  git switch main
  git pull --ff-only origin main
  git log -1 --oneline
  ```

## 2. Release validation

Run the release gates from the merged `main` commit:

```bash
npm ci
npx tsc --noEmit
npm run test:unit
npx vitest run --coverage
npm run build
npm audit --audit-level=high
```

Expected results:

- TypeScript compilation succeeds.
- Unit and Vitest suites pass.
- Production build succeeds.
- npm audit reports zero high-severity-or-higher vulnerabilities.

Record the actual CI and local results in the GitHub release discussion. Do not
replace measured coverage with a target or estimate.

## 3. Tag creation

Verify that the tag does not already exist, then create an annotated tag:

```bash
git fetch --tags origin
git tag --list v1.2.1
git tag -a v1.2.1 -m "Sovereign Runtime Security Patch v1.2.1"
git show --no-patch --format=fuller v1.2.1
git push origin v1.2.1
```

If repository signing policy requires signed tags, use the configured signing
key instead:

```bash
git tag -s v1.2.1 -m "Sovereign Runtime Security Patch v1.2.1"
```

Do not force-move or overwrite an existing release tag.

## 4. GitHub Release publication

Authenticate the GitHub CLI before publishing:

```bash
gh auth status
```

Create the release from the tag using the content in
`RELEASE_NOTES_v1.2.1.md`:

```bash
gh release create v1.2.1 \
  --title "Sovereign Runtime Security Patch v1.2.1" \
  --notes-file RELEASE_NOTES_v1.2.1.md
```

If the release should be reviewed before publication, create it as a draft:

```bash
gh release create v1.2.1 \
  --draft \
  --title "Sovereign Runtime Security Patch v1.2.1" \
  --notes-file RELEASE_NOTES_v1.2.1.md
```

## 5. Post-release verification

- [ ] Confirm the release page shows tag `v1.2.1`.
- [ ] Confirm the release target commit is the merged `main` commit.
- [ ] Confirm the release notes report measured validation results.
- [ ] Confirm the tag is visible remotely:

  ```bash
  git ls-remote --tags origin refs/tags/v1.2.1
  ```

- [ ] Confirm the production deployment workflow completes successfully.
- [ ] Record the release URL and workflow run URL in the deployment record.

