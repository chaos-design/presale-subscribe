# REPS Development Guide

[简体中文](./development-guide.md)

For the data model, RPC contract, and request flows see the
[architecture guide](./architecture.en.md); for the review workflow and quality gate see the
[contributing guide](../CONTRIBUTING.md).

## Local environment

- Node.js 22.13 or newer (validated by `engines`; the floor comes from pnpm 11.21)
- pnpm 11.21.0 (pinned by `packageManager`)
- An optional Supabase development project

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

`pnpm dev` starts the Turbopack dev server on port 4433, and `pnpm start` serves the
production build on the same port:

```bash
pnpm build
pnpm start
```

`dev`, `build`, and `start` all honour `NEXT_DIST_DIR` and write to `.next` by default.
`pnpm test:e2e` runs `pnpm build` first and then serves the result with `next start`, so the
suite exercises the real production output; the trade-off is that an E2E run replaces the
local `.next` build, so rerun `pnpm build` afterwards.

The only environment variables are:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Without both values, the app uses a read-only demo mode that exposes the workspace, editor, public page, and sample reservation flow.

## Local Supabase

Local database development requires a Docker-compatible runtime and the Supabase CLI.
`supabase/config.toml` runs the complete `supabase/platform.sql` file whenever the local
database is reset:

```bash
supabase start
supabase db reset
```

The default database URL is `postgresql://postgres:postgres@127.0.0.1:54322/postgres`. Run
`supabase stop` when finished, and never commit local keys printed by `supabase status`.

`platform.sql` is the single authoritative full schema. `update.sql` contains only
the current pending production upgrade, is excluded from `db reset`, and must always be fully
merged back into the complete SQL. After an upgrade is applied, replace this file with the next
database change instead of retaining executed incremental scripts.

Both scripts are safe to re-run, and `update.sql` produces no differences on a database that
already matches the current `platform.sql`. After editing either script, verify locally that the
full script applies twice without errors and that the incremental script leaves function
signatures, grants, policies, and indexes unchanged on a synchronized database.

## Automated database verification

`pnpm test:db` runs PGlite, a WebAssembly build of PostgreSQL, inside the test process. Only the
Supabase-managed `auth` and `storage` schemas plus the `anon` and `authenticated` roles are
stubbed; everything else runs real SQL. It verifies that:

- `platform.sql` applies twice and `update.sql` changes nothing on a synchronized database.
- All four business tables enable RLS, `anon` holds no direct grant, and owners receive exactly
  the privileges the dashboard needs.
- Every RPC matches its expected `security definer`/`invoker` mode, execution roles, and pinned
  `search_path`.
- The media bucket configuration and four Storage policies exist, with no anonymous listing
  policy.
- Reservations stay idempotent, questionnaire answers are validated, closed campaigns reject
  writes, page-view identifiers are hashed, and owners stay isolated from each other.

SQL changes therefore need neither Docker nor a local Supabase project, and regressions surface
in CI.

## Structure

| Path | Responsibility |
| --- | --- |
| `src/app/` | Pages, layouts, Server Actions, and Route Handlers |
| `src/components/` | Product components and shadcn/ui primitives |
| `src/lib/` | Auth, queries, validation, presets, and Supabase helpers |
| `src/types/database.ts` | Database and product types |
| `public/brand/` | REPS brand artwork: seal, slogan badge, and home key visual |
| `supabase/platform.sql` | Repeatable all-in-one database and Storage initialization |
| `supabase/update.sql` | Current pending subscription-entry and media Storage policy upgrade |
| `tests/unit/` | Vitest unit coverage and SQL text assertions |
| `tests/integration/` | PGlite database script, grant, and behaviour tests |
| `tests/e2e/` | Playwright user-flow coverage |

## Brand artwork

The SVGs under `public/brand/` are the source of REPS brand artwork. The wordmark is assembled from
stroke paths rather than font files, so it can be inlined, recolored by CSS, and never degrades when
a visitor lacks a particular font:

| File | Use |
| --- | --- |
| `reps-mark.svg` | The seal, used in navigation and the dashboard; its colors are fixed and it does not follow `currentColor` |
| `reps-slogan.svg` | The slogan badge used at the top of both READMEs |
| `reps-key-visual.svg` | The home key visual; it carries its own track rotation and disables it under `prefers-reduced-motion` |

`src/app/icon.svg` and `src/app/apple-icon.png` are app-icon copies of the same seal and must stay in
sync with `reps-mark.svg`. The share image is rendered at build time by `src/app/opengraph-image.tsx`.
After changing any artwork run `pnpm check` and confirm the navigation, home key visual, and icons
still render correctly.

## Product and source-link configuration

`src/lib/product-config.ts` centralizes the REPS product name, wordmark, home path, plus the
product credit and GitHub repository URL shown in public project page footers. It promotes the
REPS project itself; it is not user-configured project or template content and is not copied into
draft or published snapshots:

```ts
export const productConfig = {
  name: "REPS",
  fullName: "Release, Email-capture, Preview & Subscription",
  wordmark: "REPS",
  stages: ["Release", "Email-capture", "Preview", "Subscription"],
  slogan: "Every release, a way in.",
  // 供分享图与站点元信息使用的英文描述；中文描述保留在 tagline。
  description: "Prescribe the release. Capture the demand.",
  tagline: "把功能预告做成一条可以追踪的发布链路",
  homePath: "/",
  productCredit: {
    label: "MADE WITH REPS",
    description: "开源功能预告与预约订阅系统",
    year: "2026",
    githubUrl: "https://github.com/chaos-design/presale-subscribe",
  },
} as const
```

`name` and `fullName` expand the acronym, `stages` holds the English names of its four stages,
`slogan` and `description` are the English tagline pair, and `tagline` is the Chinese description. The
share image in `src/app/opengraph-image.tsx` only reads the English fields because the bundled Geist
font has no Chinese glyphs.

Before deployment, confirm `githubUrl` points at the public source repository for that deployment. The
public reservation page renders it as an icon-only external link and opens it in a new tab. Editor
previews display the icon without navigation. After changing this configuration, run `pnpm check`
and `pnpm build`, then verify that the footer does not overflow on desktop or mobile.

## Primary routes

| Route | Purpose |
| --- | --- |
| `/` | Product home and template showcase |
| `/login` | Password and OTP sign-in plus registration |
| `/forgot-password` / `/reset-password` | Password recovery flow |
| `/terms` / `/privacy` | Terms of service and privacy policy |
| `/dashboard` | Template library, campaign library, and account settings |
| `/dashboard/analytics` | PV/UV, source, device, conversion, and questionnaire analytics |
| `/p/[slug]` | Public reservation page backed only by a published snapshot |

## Product boundaries

- `subscription_campaigns.draft_config` stores editable content.
- Publishing copies the draft to `published_config`; public pages only read that snapshot.
- Feature copy, long-form content, image and video URLs, templates, granular motion settings, and
  questionnaire definitions all live in the same snapshot.
- Images and videos upload to the public-read `campaign-media` bucket with owner and campaign path
  isolation. The client limits images to 8 MB and videos to 100 MB.
- Withdrawing a campaign preserves drafts and subscribers while disabling public access.
- Public reservations write emails and `answers` through `subscribe_to_campaign`, remain
  idempotent by campaign and email, and link visits only through SHA-256-hashed random visitor
  and session identifiers.
- Public reservations accept common email providers such as Gmail, Outlook, QQ, 163, and iCloud;
  the frontend, Server Action, and RPC enforce the same allowlist.
- Server Actions and the RPC both validate responses against published questions, required rules,
  and choice allowlists.
- Public pages report views and engagement through `track_campaign_page_view` and
  `track_campaign_page_engagement`, including active duration, maximum scroll depth, and
  interaction count. The database does not store IP addresses, raw User-Agent values, or precise
  location.
- Country, region, and city come first from coarse hosting-platform request headers. When fields
  are missing, a short-timeout server-side IP geolocation request fills them in; only country,
  region, and city are stored, never the source IP. Browser locale and timezone add context.
- The dashboard combines `get_campaign_analytics` and `get_campaign_behavior_analytics` to report
  traffic, conversion, engagement, geography, and questionnaire results for one selected project.
- RLS isolates management data by the authenticated campaign owner.

## Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm docs:check
pnpm test
pnpm test:e2e
pnpm build
```

`pnpm check` runs Biome, TypeScript, the documentation link check, and the tests under
`tests/unit` and `tests/integration`. `pnpm docs:check` validates every relative Markdown link and heading anchor.
Playwright runs from `tests/e2e`, builds the app and serves it with `next start`, explicitly
clears Supabase variables, and tests demo mode, so it never connects to local or production
data.

## Conventions

- Frontend filenames use lowercase kebab-case; functions use camelCase.
- Keep business writes in Server Actions or server routes.
- The browser Supabase client handles authentication and RLS-scoped campaign media uploads; it
  does not read or write business tables.
- When adding campaign fields, update types, Zod validation, defaults, stored JSON, and the editor together.
- Merge every database change into `platform.sql`. When an incremental release is needed,
  replace `update.sql` and update the types, README, and deployment guide. Do not retain
  incremental scripts that have already been applied.

The full extension checklist lives in the
[architecture guide](./architecture.en.md#8-extension-checklist); report vulnerabilities as
described in [SECURITY.md](../SECURITY.md).
