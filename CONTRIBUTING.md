# Contributing to Ahead

[简体中文](./CONTRIBUTING.zh-CN.md)

Ahead is an open-source feature announcement and reservation system built with Next.js 16,
React 19, Supabase, Tailwind CSS 4, and Biome. This guide covers the local setup, the
branch strategy enforced by CI, the quality gate every change must pass, and how database
changes are shipped.

By contributing you agree that your work is licensed under
[Apache-2.0](./LICENSE).

## 1. Prerequisites

- Node.js 20.9 or newer (`package.json` enforces this through `engines`).
- pnpm 11.21.0. Use the version pinned in `packageManager`; do not commit `package-lock.json`
  or `yarn.lock`.
- Optional: a Supabase project for real data. Without it the app runs in read-only demo
  mode, which is enough for UI work and for Playwright.

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
```

## 2. Run the app

```bash
pnpm dev            # http://localhost:4433, Turbopack
pnpm build          # production build
pnpm start          # serve the production build on port 4433
pnpm test:e2e       # builds, serves the build, then runs Playwright in demo mode on port 3100
```

`dev`, `build`, and `start` all honour `NEXT_DIST_DIR` and default to `.next`. Playwright
builds the app and serves it with `next start`, so E2E covers production output; an E2E run
replaces the local `.next` build.

## 3. Branch and commit strategy

- Work on short-lived branches, for example `feat/countdown-presets`.
- Open a pull request against `main`. Direct pushes to `main` are blocked by branch
  protection.
- Every pull request must pass the `quality` and `e2e` checks, needs one approving review,
  must not be approved by its own author, must have resolved conversations, and keeps a
  linear history. Force pushes and branch deletion are disabled.
- Configure the rules once per repository:

```bash
GH_TOKEN=<token with administration write access> \
  ./scripts/configure-branch-protection.sh owner/repository main
```

- Merges to `main` deploy to Vercel Production automatically. Deploy Preview manually from
  the `Publish` workflow before merging anything that changes routing, auth, or analytics.

## 4. Quality gate

Run the same commands CI runs:

```bash
pnpm lint        # Biome, no ESLint in this project
pnpm typecheck   # tsc --noEmit, strict mode
pnpm docs:check  # every relative Markdown link and heading anchor resolves
pnpm test        # Vitest unit tests
pnpm build       # production build
pnpm check       # lint + typecheck + docs:check + test
pnpm test:e2e    # Playwright, required for user-facing flow changes
```

`pnpm docs:check` runs `scripts/check-doc-links.mjs`, which walks every Markdown file and
fails when a relative link or heading anchor is stale. Run it after renaming a document or
restructuring a heading.

Conventions worth knowing before you write code:

- TypeScript strict mode; do not introduce `any` to silence the compiler.
- Frontend file names are lowercase and hyphenated; functions are camelCase; components and
  types are PascalCase. Formatting is owned by Biome (2 spaces, double quotes, semicolons
  only where required, trailing commas, 100 column width).
- Never read, print, or commit real values from `.env`; `.env.example` is the only template.
- Never put server-side keys in browser code, docs, tests, or logs. The app must keep
  working with the publishable key only.
- All management writes stay in Server Actions or server routes and re-verify the caller on
  the server.

### Keeping Playwright deterministic

The suite serves a real production build, so compile time is no longer a factor, but GSAP
entrance animations still hide content until a scroll trigger fires, and the editor focus
highlight is applied imperatively and cleared shortly after. Three conventions keep the suite
stable:

- Start a test with `await page.emulateMedia({ reducedMotion: "reduce" })` unless it actually
  verifies motion. Reduced motion skips the scroll-triggered reveals and smooth scrolling.
- Assert transient state right after the action that creates it. The editor focus highlight
  disappears within about a second, so check it before unrelated assertions.
- Assert configuration values from `src/lib` (for example `productConfig`) instead of
  hardcoding them, so product configuration changes do not require touching every spec.

`playwright.config.ts` raises the test and expect timeouts above the defaults because
template-by-template sweeps still run dozens of renders in a single test.

## 5. Database changes

`supabase/platform.sql` is the single authoritative, re-runnable full script.
`supabase/update.sql` holds only the increment that has not been applied yet.

1. Make the change in `platform.sql` first; keep it idempotent and commented.
2. If the change must ship before the next full run, mirror it into `update.sql`. Never
   keep already-applied historical increment files.
3. Update `src/types/database.ts`, the validation layer, and unit tests, including
   `tests/unit/database-security.test.ts` for grants and policies.
4. Update the architecture and deployment docs.

Rules that public SQL must keep:

- Public RPCs are `security definer` with `set search_path = ''`, revoked from `public`, and
  granted with an explicit signature to the smallest role set.
- The `anon` role must never gain `SELECT` or `INSERT` on `users`,
  `subscription_campaigns`, `subscribers`, or `campaign_page_views`.
- Reservations are idempotent per `(campaign_id, email)`, and questionnaire answers are
  validated against the published questions in both the Server Action and the RPC.

The [architecture guide](./docs/architecture.en.md#4-rpc-contract) documents the current
contract; keep it in sync.

## 6. Pull request checklist

- `pnpm check` and `pnpm build` pass locally.
- Playwright is updated or confirmed for any change to auth, the editor, the public page, or
  analytics.
- New behaviour is covered by unit tests; pure business logic stays in testable pure
  functions.
- Screenshots are attached for visual changes, including the mobile viewport.
- User-facing and deployment-facing documentation is updated in both languages.
- The pull request description states what changed, how it was verified, and the rollback
  path if it needs a database migration.

## 7. Reporting security issues

Do not open a public issue for a vulnerability. Follow [SECURITY.md](./SECURITY.md).