# Ahead

[简体中文](./README.zh-CN.md)

Ahead is a full-stack feature announcement and reservation system. Teams can create campaigns, edit draft content, publish immutable public versions, withdraw them, and collect subscriber emails with questionnaire responses through shareable pages.

## Stack

- Next.js 16 App Router, React 19, strict TypeScript
- shadcn/ui with Base UI and Lucide React
- Supabase Auth, Postgres, Storage, RLS, and security-definer RPCs
- Tailwind CSS 4 and Biome

## Features

- Email/password and email OTP sign-in
- Email/password registration with strength guidance and a confirmation link
- Password recovery with a secure email callback
- Server-validated Supabase sessions and protected management routes
- Template-first campaign workspace with create, edit, delete, publish, and withdraw actions
- Account profile settings
- Subscriber search across emails and visit metadata, deletion, and CSV export
- Sixteen responsive announcement templates with full-screen live preview
- Configurable feature copy, long-form launch content, campaign images, and preview video uploads
- Configurable short-text, single-choice, and multiple-choice questionnaires in published snapshots
- Sixteen curated colors, custom accents, and template-aware motion with granular controls
- Terms of service and privacy policy pages linked from authentication
- Separate draft and published configurations
- Stable public URLs at `/p/[slug]`
- Public-page PV/UV, source, device, conversion, email-domain, and questionnaire analytics
- Validated, idempotent email reservations
- Demo data when Supabase is not configured

## Local Setup

Requirements: Node.js 20.9 or newer (enforced through `package.json` `engines`) and pnpm
11.21.0. A Supabase project is optional; without it the app runs in read-only demo mode.

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
```

Set the two public Supabase values:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Run the complete [`supabase/platform.sql`](./supabase/platform.sql) file in the
Supabase SQL Editor. The documented, function-oriented script can initialize a new project or
upgrade a project that used the earlier setup. It creates or updates:

- `users`
- `subscription_campaigns`
- `subscribers` with questionnaire responses and anonymous conversion-session linkage
- `campaign_page_views` with SHA-256-hashed visitor/session identifiers, engagement duration,
  scroll depth, interactions, browser context, and coarse request geography
- the public `campaign-media` Storage bucket for campaign images and videos
- RLS policies, profile triggers, indexes, and public RPCs

Existing projects that already ran the previous complete SQL can apply only the current
subscription-entry protection and media Storage upload policy changes by running
[`supabase/update.sql`](./supabase/update.sql).
The incremental script is not run by local `db reset`; its changes are already included in the
complete SQL.

### Email authentication configuration

1. Enable the Email provider in Supabase Authentication.
2. Keep **Confirm email** enabled.
3. In **Email Templates > Confirm signup**, render `{{ .ConfirmationURL }}`. Opening this link
   returns to `/auth/callback`, establishes the Supabase SSR session, and signs the user in.
4. In **Email Templates > Magic Link**, render `{{ .Token }}`. Ahead uses this template only for
   numeric OTP login and verifies the code with `verifyOtp({ type: "email" })`.
5. Keep the recovery template linked through `{{ .ConfirmationURL }}` so password reset requests
   return through `/auth/callback` and continue to `/reset-password`.
6. Add local and production `/auth/callback` URLs to the Auth redirect allow list.

Password and OTP login are available only to existing, confirmed accounts. OTP resend is locked
for 60 seconds after a successful send. The Supabase project configuration determines OTP length;
the frontend does not impose an additional maximum. Registration accepts an email and password,
then requires the user to open the confirmation link before signing in. Existing users can request
a password reset from the login page.

Start the app:

```bash
pnpm dev
```

Open [http://localhost:4433](http://localhost:4433). Without `.env.local`, the app starts in
read-only demo mode. To verify a production build locally:

```bash
pnpm build
pnpm start
```

## Documentation

- [User guide](./docs/user-guide.en.md)
- [Development guide](./docs/development-guide.en.md)
- [Architecture](./docs/architecture.en.md)
- [Deployment guide](./docs/deployment-guide.en.md)
- [Contributing](./CONTRIBUTING.md)
- [Security policy](./SECURITY.md)
- [简体中文文档](./README.zh-CN.md)

## Quality Checks

```bash
pnpm check
pnpm test:e2e
pnpm build
```

## Deployment

GitHub Actions owns production delivery: pull requests run CI, merges into `main` deploy to
Production, and maintainers can deploy Preview manually. The workflow validates Vercel
credentials and Supabase variables, retains the prebuilt output, and provides an
approval-protected production rollback.

See the [deployment guide](./docs/deployment-guide.en.md) for environment variables, build
settings, branch strategy, triggers, failure handling, and rollback. No service-role key is
required.

## Security Notes

- Management actions verify the authenticated user on the server.
- The proxy refreshes the Supabase session and redirects unauthenticated dashboard requests.
- RLS isolates campaigns and subscriber records by owner.
- Storage policies limit uploads to the authenticated owner's campaign directory.
- Anonymous users cannot select campaign or subscriber tables directly.
- Public reads, reservations, and page-view reports use narrow `security definer` RPCs and only
  process published campaign snapshots.
- Page analytics honor browser Do Not Track and never store IP addresses or raw user agents.
  Coarse location uses platform headers first, then a transient server-side IP lookup when needed.
- Questionnaire responses are validated against the published questions, required rules, and
  choice allowlists in both the server action and database RPC.
- Public subscription inserts are unique per campaign and email.

Report vulnerabilities privately as described in [SECURITY.md](./SECURITY.md).

## License

Licensed under the [Apache License 2.0](./LICENSE). Contributions are accepted under the
same license.
