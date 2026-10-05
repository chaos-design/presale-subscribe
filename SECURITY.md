# Security Policy

[简体中文](./SECURITY.zh-CN.md)

## Supported versions

REPS is deployed from `main`. Only the latest commit on `main` receives security fixes; if
you run your own deployment, update the image or redeploy on a regular schedule.

| Version | Supported |
| --- | --- |
| `main` (current production) | Yes |
| Older commits and forks | No |

## Reporting a vulnerability

Report privately through GitHub Security Advisories:

1. Open the repository page, go to **Security**, then **Advisories** and choose
   **New draft advisory**.
2. Describe the issue, the affected commit or version, and the impact.
3. Do not open a public issue, pull request, or discussion for the same report.

Maintainers acknowledge a report within three business days and keep you updated until a fix
is released. If private advisories are disabled on the repository, ask the maintainers for a
private contact channel before disclosing anything.

Never include in a report:

- Access tokens, publishable or service-role keys, or `.env` contents.
- Real subscriber email addresses or exported CSV data.
- Personal data of visitors captured by analytics.

Redact those and describe the shape of the data instead.

## Security model of this project

The application runs with the Supabase publishable key only; there is no server-side
privileged key to leak. Reports that violate one of the following invariants are treated as
high severity:

- The `anon` role has no `SELECT` or `INSERT` grant on `users`,
  `subscription_campaigns`, `subscribers`, or `campaign_page_views`. Public reads,
  reservations, and page-view reporting must go through the restricted `security definer`
  RPCs that are revoked from `public` and granted with explicit signatures.
- Public pages only render `published_config` of campaigns with `status = 'published'`.
  Draft content must never be reachable without an authenticated owner session.
- Management Server Actions re-verify the caller and campaign ownership on the server; RLS
  is the second line of defence, not the only one.
- Anonymous reservations are idempotent per `(campaign_id, email)` and must not reveal
  whether an address already exists.
- Questionnaire answers are validated against the published questions, required rules, and
  option allowlists in both the Server Action and the RPC.
- Analytics store SHA-256 hashes of visitor and session identifiers only. Raw identifiers,
  IP addresses, and raw User-Agent strings must never be persisted, and browsers with Do Not
  Track enabled must not be reported at all.
- Storage policies restrict writes to `{userId}/{campaignId}/...` paths owned by the caller.

`campaign-media` is a public bucket: anyone with the object URL can read the file. Never
upload confidential material to it, and treat published media as public by definition.

## Deployment responsibility

Operators of a self-hosted instance are responsible for:

- Keeping `VERCEL_TOKEN`, GitHub secrets, and Supabase keys out of the repository and out of
  build logs, and rotating them on a schedule and after team changes.
- Restricting Supabase Authentication redirect URLs to known domains.
- Keeping `main` protected and reviewing who can approve `production` deployments and
  rollbacks.
- Applying database changes only from reviewed SQL, in the order described in the
  [deployment guide](./docs/deployment-guide.en.md).

## Dependencies

Dependencies are managed with pnpm and pinned through `pnpm-lock.yaml`. Report a vulnerable
package the same way as an application vulnerability, including the affected version and a
suggested fixed range.