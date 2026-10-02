# Ahead Deployment Guide

[简体中文](./deployment-guide.md)

This guide covers production deployment of Ahead on Vercel and Supabase. GitHub Actions is the
only deployment entry point. `vercel.json` disables automatic Vercel Git deployments so that one
commit is not built and deployed twice.

For the data model and trust boundaries see the [architecture guide](./architecture.en.md), for
repository access and the review gate see the [contributing guide](../CONTRIBUTING.md), and for
the private reporting channel see [SECURITY.md](../SECURITY.md).

## 1. Architecture

- Vercel runs the Next.js 16 application, Server Actions, and Route Handlers.
- Supabase provides Auth, Postgres, Storage, RLS, and narrow public RPCs.
- Pull requests are validated by `.github/workflows/ci.yml` and are not deployed automatically.
- Updates to `main` are deployed to Production by `.github/workflows/publish.yml`.
- Any branch can be deployed manually to Preview.
- Production incidents are handled manually through `.github/workflows/rollback.yml`.

The application neither needs nor permits a Supabase `service_role` key. Browser and server code
use only the public Supabase URL and Publishable Key; RLS and RPCs enforce data access.

## 2. Prerequisites

- A GitHub repository with permission to run Actions.
- A Vercel project and a token allowed to create Deployments.
- A Supabase project; separate Preview and Production projects are recommended.
- Node.js 22.13 or later (declared through `engines`; the floor comes from pnpm 11.21) and pnpm
  11.21.0.
- GitHub CLI, only when applying the repository's branch protection script.
- Repository setting: enable **Settings > Code security > Private vulnerability reporting** so the
  channel described in [SECURITY.md](../SECURITY.md) works.

## 3. Initialize Supabase

1. Create separate Supabase projects for Preview and Production when those environments must be
   isolated. Complete every step below in each project.
2. Run the complete `supabase/platform.sql` file in each project's SQL Editor. A new project does
   not also need `supabase/update.sql`.
3. Enable the Email provider in Authentication and keep **Confirm email** enabled.
4. Configure the email templates:
   - Confirm signup: use `{{ .ConfirmationURL }}`.
   - Magic Link: use `{{ .Token }}` for the numeric verification code.
   - Recovery: use `{{ .ConfirmationURL }}`.
5. Set the production Site URL in **URL Configuration**, then add these Redirect URLs:
   - `http://localhost:4433/auth/callback`
   - `https://<production-domain>/auth/callback`
   - `/auth/callback` under the controlled Preview or branch domains
6. Confirm that RLS is enabled on `users`, `subscription_campaigns`, `subscribers`, and
   `campaign_page_views`.
7. Confirm that the public-read `campaign-media` bucket exists and that its owner-scoped upload,
   update, and delete policies are active.

`platform.sql` is repeatable and reconciles tables, indexes, triggers, RLS, RPCs, and Storage
policies. A project initialized with an older full script may run the latest `platform.sql` to
reconcile everything or run only the current `update.sql`. Do not run both for a new project
because the full script already contains the incremental changes.

## 4. Create the Vercel project

1. Create a Vercel project and connect the GitHub repository.
2. Keep Root Directory set to the repository root.
3. Select **Next.js** as the Framework Preset.
4. Select **20.x** as the Node.js Version.
5. Do not set an Output Directory; use the Next.js default.
6. The import does not need to deploy immediately. Configure environment variables and Supabase
   callbacks first, then publish a Preview from GitHub Actions.

The versioned `vercel.json` defines:

```json
{
  "framework": "nextjs",
  "installCommand": "pnpm install --frozen-lockfile",
  "buildCommand": "pnpm build",
  "git": {
    "deploymentEnabled": false
  }
}
```

Do not override these commands in the Vercel dashboard. `git.deploymentEnabled: false` disables
only builds from the Vercel Git integration; it does not prevent GitHub Actions from deploying
through Vercel CLI.

## 5. Configure environment variables

Set these variables for Preview and Production under Vercel **Project Settings > Environment
Variables**:

| Variable | Required | Purpose | Scope |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | HTTPS URL of the Supabase project | Preview, Production |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase Publishable Key | Preview, Production |

Important:

- The `NEXT_PUBLIC_` prefix exposes both values in the browser bundle, so only use public keys.
- Do not configure `SUPABASE_SERVICE_ROLE_KEY` or place keys in the repository or Actions logs.
- Preview and Production should use different Supabase projects so test reservations do not enter
  production data.
- Environment variable changes affect only later Deployments; deploy again after an update.
- Vercel supplies system values such as `VERCEL_URL`; do not add them manually.

After `vercel pull`, the publish workflow checks both required variables, the HTTPS URL format,
and sample placeholder values without printing the values. A failed check prevents a read-only
demo build from being deployed accidentally.

## 6. Configure GitHub Actions

Add these entries under GitHub **Settings > Secrets and variables > Actions**:

| Secret | Source | Purpose |
| --- | --- | --- |
| `VERCEL_TOKEN` | Vercel Account Settings > Tokens | Vercel CLI authentication |
| `VERCEL_ORG_ID` | `orgId` in `.vercel/project.json` | Target Vercel team or account |
| `VERCEL_PROJECT_ID` | `projectId` in `.vercel/project.json` | Target Vercel project |

You can run `pnpm dlx vercel@59.3.0 link` once locally to obtain the project IDs. Do not commit the
generated `.vercel/` directory.

Create these environments under GitHub **Settings > Environments**:

- `preview`: allow maintainers to deploy manually; add approval if required by the team.
- `production`: restrict deployment to `main`, then enable Required reviewers and
  **Prevent self-review**. If the repository plan does not support these rules, establish an
  equivalent external two-person approval before enabling rollback; otherwise the workflow has no
  independent approval gate.

Secrets may be repository-level. If environments target different Vercel projects, store them in
the matching GitHub Environment instead. Supabase values still belong in Vercel and should not be
duplicated as GitHub Secrets.

## 7. Branch strategy and triggers

| Event | Workflow | Result |
| --- | --- | --- |
| Pull request into `main` | `CI` | Runs Biome, type checks, unit tests, build, and E2E |
| Manual `CI` run | `CI` | Validates the selected branch without deploying |
| Push or merge into `main` | `Publish` | Deploys Production after all release gates pass |
| Manual `Publish` with `preview` | `Publish` | Deploys the selected branch to Preview |
| Manual `Publish` with `production` | `Publish` | Deploys only when the selected branch is `main` |
| Manual `Rollback` from `main` | `Rollback` | Rolls back production after environment approval |

Use short-lived feature branches and merge them into a protected `main` through pull requests.
The repository can apply its recommended protection settings with:

```bash
GH_TOKEN=<token-with-repository-administration-access> \
  ./scripts/configure-branch-protection.sh owner/repository main
```

The script requires `quality` and `e2e`, one approval, approval of the last push by another user,
resolved conversations, and linear history. It also blocks force pushes and branch deletion. If
the repository plan or organization policy does not support an option, configure an equivalent
rule in GitHub settings.

## 8. Deployment flow

The `Publish` workflow executes these steps. A failure at any step blocks all later deployment
steps:

1. `quality` runs `pnpm check`.
2. `e2e` runs Playwright in demo mode with explicitly empty Supabase variables. Playwright runs
   `pnpm build` first and serves it with `next start`, so this job also proves the production
   build runs.
3. `deploy` validates Vercel credentials and the target; Production only accepts `main`.
4. `vercel pull` loads the target environment. Preview also passes the current branch name so
   branch-specific variables apply.
5. Required Supabase environment variables are checked without exposing their values.
6. `vercel build` creates `.vercel/output`.
7. The output is packaged as a GitHub Actions Artifact retained for 30 days.
8. The deploy command includes GitHub branch and commit metadata so the CLI Deployment is linked
   to the correct branch. Preview runs `vercel deploy --prebuilt` directly. Production uses
   `--prod --skip-domain` to create a staged Production Deployment.
9. Production runs `vercel promote` to assign the production domains explicitly. This also clears
   the domain auto-assignment pause left by an Instant Rollback.
10. The environment, version, and Deployment URL are written to the Job Summary.
11. A separate least-privilege `release` job creates a
    `v<major>.<minor>.<run-number>` GitHub Release with the downloaded build artifact.

Preview and Production use separate concurrency groups. Regular Production runs do not interrupt
the active deployment, but GitHub retains only the newest pending run in one concurrency group. A
Production rollback cancels an active Production publish and runs with priority. Pause merges into
`main` while handling an incident. The Vercel CLI version is pinned in the workflows; update and
verify both publish and rollback workflows together.

## 9. First deployment

### Pre-flight checklist

| Item | Action | Pass criteria |
| --- | --- | --- |
| Node version | Vercel Project Settings > Node.js Version | Satisfies the `engines` range `>=22.13.0`, ideally the same 22.x used by CI |
| Build commands | Do not override `installCommand` or `buildCommand` from `vercel.json` | No custom override in the dashboard |
| Production database | Run `supabase/platform.sql` as a whole in the SQL Editor | RLS enabled on all four tables and the `campaign-media` bucket exists |
| Auth callbacks | Supabase URL Configuration | Production and Preview `/auth/callback` entries are in Redirect URLs |
| Environment variables | Vercel Preview / Production | Both `NEXT_PUBLIC_SUPABASE_*` values are real and the URL is HTTPS |
| Source link | `src/lib/product-config.ts` | `productCredit.githubUrl` points at this deployment's source repository |
| Gate | `main` branch protection | `quality` and `e2e` are required checks with at least one approval |
| Approvals | GitHub Environments | `production` is restricted to `main` with required reviewers and prevent self-review |
| Security reports | Settings > Code security | Private vulnerability reporting enabled |
| Domain | Vercel Domains | Production domain assigned and DNS resolving |

### Steps

1. Open **Publish** in GitHub Actions.
2. Select a branch that passed CI and choose `preview` as `target`.
3. Obtain the Preview URL from the Job Summary and first confirm that the home page loads.
4. Add the Preview URL's `/auth/callback` and the Production callback to Redirect URLs in their
   corresponding Supabase projects.
5. Complete the Preview acceptance checks below.
6. Merge the pull request into `main` and wait for the automatic Production deployment.
7. After configuring DNS for the production domain, verify authentication callbacks and the
   public reservation page again.

## 10. Acceptance checks

### Preview acceptance

Preview points at its own Supabase project, so it validates behaviour and isolation:

| Item | Pass criteria |
| --- | --- |
| Static pages | Home, login, terms, and privacy pages load |
| Auth loop | Signup confirmation, password login, OTP login, and password recovery work |
| Dashboard guard | Unauthenticated `/dashboard` requests redirect to sign-in |
| Publish loop | A campaign can be created, drafted, published, withdrawn, and republished |
| Snapshot isolation | Saving a draft leaves the published page untouched, duplicate emails stay idempotent, and questionnaire rules are enforced |
| Analytics | PV/UV, sources, devices, engagement, and questionnaire results load |
| Subscriber tooling | Details, single deletion, and CSV export work |
| Authorization | Another account cannot reach the campaign, reservations, or media directory |
| Data isolation | No production reservations appear in the Preview database |

### Production acceptance

After merging into `main` and completing DNS, confirm at least that:

- The home, login, terms, and privacy pages load.
- Signup confirmation, password login, numeric OTP login, and password recovery work.
- Unauthenticated requests to `/dashboard` redirect to sign-in.
- A user can create a campaign, upload image and video media, save a draft, and publish.
- Saving a draft does not alter the published page; republishing replaces the snapshot.
- `/p/[slug]` accepts reservations, keeps duplicate emails idempotent, and enforces questions.
- Analytics return page views, visitors, engagement, and questionnaire results.
- Subscriber details, deletion, and CSV export work.
- Withdrawal immediately hides the public page, and republishing restores it.
- One account cannot access another account's campaigns, reservations, or media directory.

## 11. Error handling

| Stage | Symptom | Resolution |
| --- | --- | --- |
| Dependency install | Lockfile mismatch | Run `pnpm install` locally and commit `pnpm-lock.yaml` |
| Quality gate | Biome, type, or test failure | Fix the source branch; do not bypass the gate |
| E2E | Browser assertion fails | Download the seven-day Playwright Artifact for reports and screenshots |
| Credentials | `Missing required secret` | Check the secret name, Environment scope, and token permissions |
| Environment | Missing Supabase value or non-HTTPS URL | Correct the target Vercel environment and rerun |
| Vercel build | Next.js compile or packaging failure | Inspect `Build Vercel output` and run `pnpm build` locally |
| Deploy | Vercel API, quota, or network error | Check Vercel logs and rerun after excluding a platform incident |
| Promote | `vercel promote` fails | Production traffic remains unchanged; inspect the staged Deployment and rerun |
| Runtime | Authentication callback fails | Check Supabase Site URL, Redirect URLs, and email templates |
| Runtime | Queries or uploads fail | Check the SQL version, RLS, RPCs, bucket, and Storage policies |

A build or deployment failure leaves current production traffic unchanged. If deployment succeeds
but the later GitHub Release step fails, the Vercel Deployment may already be live. Check the Job
Summary and Vercel dashboard before rerunning only the failed workflow.

## 12. Rollback

Use Vercel Instant Rollback for an application version incident. It switches production traffic
without changing the Supabase schema, data, or current Vercel Project Settings. However, the
target Deployment keeps its build-time environment configuration, including the
`NEXT_PUBLIC_SUPABASE_*` values embedded in this application's older build.

Recommended procedure:

1. Find the last verified Production Deployment in the Vercel dashboard and copy its `dpl_...`
   ID or generated `*.vercel.app` URL.
2. Open the **Rollback** workflow in GitHub Actions and confirm that the selected branch is
   `main`.
3. Enter the ID or URL as `deployment` and type `ROLLBACK` exactly as `confirmation`.
4. Approve the `production` Environment and wait for the workflow to finish.
5. Confirm that the target Deployment's Supabase configuration is compatible with the current
   database.
6. Confirm that the production domain points to the target version, then test sign-in, the public
   page, and reservation writes.
7. Fix the root cause through the normal pull request and Production deployment process. The
   workflow explicitly promotes the new version and restores normal production domain assignment.

An authorized maintainer can also run this in a linked project:

```bash
pnpm dlx vercel@59.3.0 rollback <deployment-id-or-url> --yes --timeout=5m
```

Vercel Hobby plans generally allow rollback only to the previous Production Deployment. To undo a
rollback, use the Vercel dashboard or `vercel promote <deployment-id-or-url>`.

Database changes require a forward fix: back up data, validate compatible SQL in an isolated
environment, and then apply the production change. A Vercel rollback does not restore the
database, and applied production data should not be reversed manually.

## 13. Operational notes

- Rotate `VERCEL_TOKEN` regularly and remove obsolete deployment access.
- Record the reason, operator, target version, and verification result of every Production
  environment-variable change and rollback.
- Validate `supabase/update.sql` before release and ensure it is also merged into `platform.sql`.
- GitHub Releases and 30-day build Artifacts support auditing; they do not replace source and
  database backups.
- Objects in the public media bucket are accessible through known URLs. Never upload private or
  confidential files.

## 14. Credential and environment rotation

`NEXT_PUBLIC_*` values are compiled into the browser bundle, so changing one requires a fresh
build and deployment; existing Deployments and Instant Rollback targets keep the old values.
Rotating a Supabase publishable key is therefore a production release.

Rotating `VERCEL_TOKEN`:

1. Create a new token in Vercel **Account Settings > Tokens** with the smallest scope the
   project needs.
2. Update the `VERCEL_TOKEN` GitHub Secret. When Preview and Production use different Vercel
   projects, update the Secret in each matching Environment.
3. Revoke the old token in Vercel.
4. Trigger **Publish** with `preview` manually to confirm the credentials work, then resume
   normal releases.

Rotating the Supabase Publishable Key:

1. Generate a new Publishable/Anon key in Supabase **Project Settings > API**.
2. Update `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the matching Vercel environment.
3. Publish Preview and complete the Preview acceptance checks in section 10.
4. Merge into `main` for the Production release and re-verify sign-in, reservations, and
   analytics.
5. Revoke the previous key in Supabase once the release is confirmed healthy.

`VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` only change when the Vercel account or project changes.
Both come from `.vercel/project.json`; never commit that directory.

## 15. Database release procedure

1. Merge the change into `supabase/platform.sql` first and mirror it into `supabase/update.sql`
   when an incremental release is needed.
2. Run the script against the Preview Supabase project and confirm it completes without errors.
3. Back up the production database, then run the same script in the production SQL Editor.
   `platform.sql` is safe to re-run.
4. Verify afterwards: RLS enabled on all four tables, `campaign_page_views` indexes present,
   `campaign-media` bucket present, and the `anon` role still holds no `SELECT` or `INSERT` grant
   on the business tables.
5. Immediately complete the Production acceptance checks in section 10, focusing on public
   reservations and analytics.

Both scripts are safe to re-run. `update.sql` produces no differences on a project that already
matches the current `platform.sql`, so upgrading an old project and initializing a new one can
follow the same verification steps. The analytics RPCs in the incremental script use the same
self-contained implementation as the full script and never depend on functions that only
existed in earlier versions.

Database changes are forward fixes only. A Vercel rollback does not revert the schema; undo work
must ship as new SQL and be validated on Preview first.

## 16. Running outside Vercel

The default delivery path is Vercel plus GitHub Actions, but the application itself only needs
Node.js and the two public environment variables, so it can be self-hosted:

```bash
pnpm install --frozen-lockfile
pnpm build
NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=... pnpm start
```

`dev` and `start` always use port 4433; run `next start --port <port>` for a different port.
Self-hosted environments must handle TLS termination, process supervision, preview/production
isolation, and key custody themselves, and they lose Instant Rollback.

Vercel references:
[Deploying from CI](https://vercel.com/docs/deployments/ci-cd),
[Environment Variables](https://vercel.com/docs/environment-variables), and
[Instant Rollback](https://vercel.com/docs/instant-rollback).
