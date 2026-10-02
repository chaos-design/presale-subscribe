# Ahead Architecture

[简体中文](./architecture.md)

This document is for developers and operators. It describes Ahead's layer boundaries, data
model, RPC contract, and critical request flows. For product usage see the
[user guide](./user-guide.en.md); for local setup see the
[development guide](./development-guide.en.md); for production delivery see the
[deployment guide](./deployment-guide.en.md).

## 1. Layers and trust boundaries

```text
Browser (public page / dashboard)
  │  Supabase publishable key (public and readable by the browser)
  ├─ Supabase Auth: signup, password login, email OTP, recovery, session cookies
  └─ Supabase Storage: uploads limited to the owner's campaign directories
  │  Guarded by RLS and Storage policies
  ▼
Next.js (Vercel)
  ├─ src/proxy.ts: refreshes the session, redirects unauthenticated /dashboard requests
  ├─ Server Components: server-side reads, isolated per user
  ├─ Server Actions: every management write re-verifies identity and ownership
  └─ Route Handlers: /api/analytics/engagement engagement reporting
  │  Uses the same publishable key; the server never elevates privileges
  ▼
Supabase Postgres (single source of truth)
  ├─ 4 business tables + RLS: owners can only read their own rows
  └─ security definer RPCs: the only entry points for public reads, anonymous
     subscriptions, and anonymous page-view reporting
```

Three invariants must keep holding:

1. **The app never needs a `service_role` key.** Browser and server share one publishable
   key; every permission is decided by RLS and RPCs.
2. **Public writes only go through restricted RPCs.** The `anon` role has no `SELECT` or
   `INSERT` grant on the business tables; public reads, reservations, and reporting must use
   RPCs that are revoked from `public` and granted with explicit signatures.
3. **Public pages only read published snapshots.** Drafts live in `draft_config` and never
   appear on a public path.

## 2. Directory responsibilities

| Path | Responsibility |
| --- | --- |
| `src/app/` | Routes, layouts, Server Actions, Route Handlers |
| `src/components/` | Product components; `src/components/ui/` holds shadcn/ui primitives |
| `src/lib/` | Queries, validation, auth, Supabase helpers, pure functions |
| `src/lib/validation.ts` | Single source of truth for campaign config validation (Zod) |
| `src/lib/campaigns.ts` | Campaign reads and writes, publish/withdraw, public snapshot reads, demo data |
| `src/lib/analytics.ts` | Analytics aggregation and chart data shaping |
| `src/types/database.ts` | Database row types and config snapshot types |
| `supabase/platform.sql` | Authoritative full SQL, safe to re-run as a whole |
| `supabase/update.sql` | Pending incremental SQL; its content must already be merged into the full script |
| `tests/unit/`, `tests/integration/`, `tests/e2e/` | Vitest unit tests, PGlite database integration tests, and Playwright flow tests |

## 3. Data model

### 3.1 Business tables

| Table | Key columns | Notes |
| --- | --- | --- |
| `users` | `id` (references `auth.users`), `full_name`, `avatar_url` | Public profile; created by the `handle_new_user()` trigger on signup |
| `subscription_campaigns` | `user_id`, `slug`, `status`, `draft_config`, `published_config`, `published_at` | Campaign master row. `slug` is globally unique and stable; `status` is `draft` or `published` |
| `subscribers` | `campaign_id`, `email` (`citext`), `answers`, `visitor_hash`, `session_hash` | Reservations; `unique (campaign_id, email)` keeps writes idempotent |
| `campaign_page_views` | `campaign_id`, `view_hash`, `visitor_hash`, `session_hash`, source/device/locale/timezone, coarse location, `duration_seconds`, `max_scroll_depth`, `interaction_count` | Public page-view events; `unique (campaign_id, view_hash)` makes repeated reporting idempotent |

Hash columns are always 64 hex characters: visitor and session identifiers generated in the
browser are hashed to SHA-256 server-side before they are stored, so raw identifiers, IPs,
and raw User-Agent strings never reach the database.

### 3.2 Storage bucket

- Bucket `campaign-media`, `public = true`, 100 MB per object.
- Allowed types: `image/jpeg`, `image/png`, `image/webp`, `image/avif`, `video/mp4`,
  `video/webm`, `video/ogg`, `video/quicktime`.
- Object paths are always `{userId}/{campaignId}/{fileName}`. Insert, update, and delete
  require the first path segment to equal `auth.uid()` and
  `public.can_manage_campaign_media()` to confirm campaign ownership.
- A public bucket serves any known object URL, so **never upload non-public assets**.
  Anonymous users cannot list `storage.objects`, so directories are not enumerable.

### 3.3 Config snapshot shape

`draft_config` and `published_config` share one `CampaignConfig` shape, validated by
`campaignConfigSchema` in `src/lib/validation.ts`:

| Top-level field | Content |
| --- | --- |
| `name`/`title`/`slogan`/`description`/`featureTitle`/`featureDescription`/`eyebrow` | Brand and copy |
| `emailLabel`/`buttonLabel`/`successMessage` | Signup section interaction copy |
| `coverImage`/`coverImagePosition`/`previewVideo` | Image, focal point, and video (autoplay implies muted) |
| `themeColor`/`template`/`motion`/`motionSettings` | Accent color, one of 16 templates, motion type and intensity |
| `header`/`marquee`/`countdown` | Header bar, marquee text, countdown |
| `highlights` (inside `pageContent`) plus `sectionVisibility`/`sectionOrder` | Long-form content, section visibility, section order |
| `questionnaire` | Toggle, title, description, and question list (short text, single choice, multiple choice) |
| `intent` | Request-side only: `draft` saves the draft, `publish` also publishes |

Publishing copies `draft_config` verbatim into `published_config`, so public pages always
render the immutable content captured at publish time.

## 4. RPC contract

Only the first four are public entry points; the rest serve the dashboard or stay internal.

| RPC | Roles | Purpose and invariants |
| --- | --- | --- |
| `get_published_campaign(text)` | `anon`, `authenticated` | Returns only campaigns with `status = 'published'` and a non-null `published_config`; exposes only public rendering fields |
| `subscribe_to_campaign(text, text, jsonb, text, text)` | `anon`, `authenticated` | Idempotent reservation: email format and domain allowlist, answer size, question allowlist, required rules, and option allowlists are re-checked inside the function; `on conflict do nothing` and no signal about whether the email already existed; raises when the published snapshot closes the signup section |
| `track_campaign_page_view(...)` | `anon`, `authenticated` | Anonymous page-view reporting; published slug only, identifiers stored as SHA-256, idempotent per `(campaign_id, view_hash)` |
| `track_campaign_page_engagement(text, text, integer, integer, integer)` | `anon`, `authenticated` | Locates the same view by `view_id` and accumulates duration, scroll depth, and interactions |
| `get_campaigns_with_counts()` | `authenticated` | Current user's campaigns with reservation counts |
| `get_campaign_analytics(uuid, integer)` | `authenticated` | PV/UV/sessions/conversion/sources/devices/email domains/question distribution for one published campaign; the range is clamped to 7–365 days |
| `get_campaign_behavior_analytics(uuid, integer)` | `authenticated` | Engagement and coarse location distribution |
| `get_campaign_subscribers_with_analytics(uuid)` | `authenticated` | Subscriber rows with visit profiles |
| `can_manage_campaign_media(text)` | `authenticated` | Ownership check used by Storage policies |
| `get_workspace_analytics(integer)` / `get_workspace_behavior_analytics(integer)` | internal only | Called by the analytics RPCs above; revoked from `public` and `authenticated` |
| `prevent_closed_campaign_subscription()` | trigger | Blocks writes to `subscribers` when the campaign closes its signup section |

Every public RPC is `security definer` with `set search_path = ''`, so tables and functions
inside them must be schema-qualified (`public.`, `extensions.`).

## 5. Critical request flows

### 5.1 Public page render `/p/[slug]`

1. `src/app/p/[slug]/page.tsx` calls `getPublicCampaign(slug)` on the server.
2. Missing slug, draft, or withdrawn campaigns return 404 without leaking drafts.
3. The server renders `public-campaign-experience`; the client-side `page-view-tracker`
   owns reporting.

### 5.2 Page-view and engagement reporting

1. The client creates visitor and session identifiers in `localStorage`/`sessionStorage`;
   nothing is reported when the browser enables Do Not Track.
2. First view calls the `trackPageViewAction` Server Action: the payload is validated with
   Zod, `resolveRequestLocation()` resolves coarse location (platform headers first, then a
   short-timeout IP lookup), and `track_campaign_page_view` is called.
3. Duration and interactions are sent to `POST /api/analytics/engagement`, which calls
   `track_campaign_page_engagement`. Demo slugs and unconfigured Supabase return `204`.

### 5.3 Anonymous reservation

1. `subscribe-form` posts to `src/app/p/[slug]/actions.ts`.
2. The Server Action validates email, slug, the honeypot field, and questionnaire answers
   with Zod and reuses the domain allowlist in `src/lib/common-email-domains.ts`.
3. On success it calls `subscribe_to_campaign`, which repeats the same checks in Postgres.
4. The UI only reports success or failure; it never distinguishes a new reservation from an
   existing one.

### 5.4 Dashboard reads and writes

1. `src/proxy.ts` uses `supabase.auth.getClaims()` to determine the session and redirects
   unauthenticated `/dashboard` requests to `/login` with a `next` parameter.
2. Server Actions call `getCurrentUser()` (`auth.getUser()`) to re-verify identity and
   campaign ownership; direct table access is additionally constrained by RLS.
3. Analytics go through the analytics RPCs so aggregation logic never lives in the client.

### 5.5 Publish and withdraw

- Publish: validate config → write `draft_config` → copy the draft into
  `published_config` in the same operation → set `status = 'published'` and `published_at`.
- Withdraw: only flips `status` back to `draft`, which closes public access without deleting
  drafts, media, reservations, or page-view data.
- Deleting a campaign cascades to subscribers, page views, and media paths and cannot be
  undone.

### 5.6 Media uploads

The browser uploads directly to Storage with the publishable key
(`src/lib/campaign-media.ts`); the Server Action confirms ownership before the upload and the
database policy re-checks it with `can_manage_campaign_media()`, so bypassing the UI cannot
write into another owner's directory.

## 6. Auth and sessions

- Supabase Auth handles email/password, email confirmation, numeric OTP (the Magic Link
  template renders `{{ .Token }}`), and password recovery.
- `/auth/callback` establishes the SSR session and decides the redirect target through
  `src/lib/redirect-path.ts`.
- Server reads use the `@supabase/ssr` cookie client; the proxy performs session refresh.
- Password and OTP login only work for registered, confirmed accounts; OTP resend is locked
  for 60 seconds.

## 7. Demo mode

Without `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`:

- No Supabase client is created, every page renders demo data from `src/lib/campaigns.ts`,
  writes return failure, and changes are lost on refresh.
- The demo campaign uses the fixed slug `ahead-2-preview`, and reporting endpoints return
  `204` for it.
- Playwright relies on this mode, so E2E tests never touch a database.

`NEXT_PUBLIC_SUPABASE_ANON_KEY` only exists as a compatibility fallback for older
deployments; do not configure it in new ones.

## 8. Extension checklist

Ship new capabilities in this order to avoid states where the client has a feature but the
database does not:

- **New config field**: Zod schema (`src/lib/validation.ts`) → `src/types/database.ts` →
  presets/defaults (`src/lib/campaign-presets.ts`) → editor UI → public rendering →
  `tests/unit/validation.test.ts` → docs.
- **New RPC**: `security definer` + `set search_path = ''` → `revoke all from public` →
  explicit-signature `grant` → `tests/unit/database-security.test.ts` → mirror the change in
  `platform.sql` and `update.sql`.
- **New public route**: confirm it needs no write access; when writes are unavoidable,
  reuse a restricted RPC and keep an idempotency constraint.
- **New environment variable**: first check whether it can be derived from the existing
  public variables; if it is truly required, update `.env.example`, the workflow
  validation, and the deployment guide.