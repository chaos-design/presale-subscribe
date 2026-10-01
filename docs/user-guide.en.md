# Ahead User Guide

[简体中文](./user-guide.md)

## 1. Introduction

Ahead is a feature announcement and reservation system for product teams. Users can create a
campaign from a template, edit a draft, publish an immutable public snapshot, and collect email
reservations and questionnaire answers through a public link. The workspace also provides
subscriber details, CSV export, and traffic and conversion analytics.

Ahead keeps draft and published content separate:

- A draft is visible only to its owner, and saving it does not change the public page.
- Publishing copies the current draft into a new public snapshot.
- Withdrawing stops public access without deleting the draft, reservations, or analytics.

## 2. Features

- Email and password signup and sign-in, numeric OTP login, email confirmation, and recovery.
- Sixteen responsive templates with live desktop, mobile, and full-screen previews.
- Configurable copy, countdown, section order, colors, typography, and motion.
- JPG, PNG, WebP, and AVIF image uploads plus MP4, WebM, OGG, and MOV video uploads.
- Short-text, single-choice, and multiple-choice questions with required-answer rules.
- Draft saving, publishing, withdrawal, republishing, and campaign deletion.
- Subscriber search, detail view, email copying, individual deletion, and UTF-8 CSV export.
- Page-view, visitor, conversion, source, device, location, engagement, and answer analytics.
- Read-only demo mode when Supabase is not configured.

## 3. Prerequisites

### Use a hosted instance

Regular users do not need to install software. Open the URL supplied by the deployment owner in
the latest Chrome, Edge, Safari, or Firefox, and use an email account that can receive confirmation
links or verification codes.

### Install locally

Self-hosting or local evaluation requires Node.js 20.9 or later, pnpm 11.21.0, and a Supabase
project.

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
```

Set these values in `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Run the complete `supabase/platform.sql` file in the Supabase SQL Editor, configure authentication
callbacks and email templates as described in the
[deployment guide](./deployment-guide.en.md), and then start the application:

```bash
pnpm dev
```

Open [http://localhost:4433](http://localhost:4433). The application also starts without
`.env.local`, but runs in read-only demo mode, so create, save, and publish actions are not
persisted.

## 4. Signup, sign-in, and recovery

### Sign up

1. Open the sign-in page and switch to **Create account**.
2. Enter an email, password, and password confirmation.
3. Read and accept the terms of service and privacy policy.
4. Submit the form and open the link in the confirmation email.
5. Return to Ahead. If no session was created, sign in with the confirmed account.

A password must contain at least eight characters and meet the strength rules shown on the page.

### Sign in

- **Password**: enter the confirmed email and password.
- **Email verification code**: enter a registered email, request a numeric code, and verify it.
  A code cannot be resent for 60 seconds. Its length and lifetime come from the deployment's
  Supabase configuration.

Both methods require acceptance of the terms and privacy policy. OTP login does not create an
account for an unregistered email.

### Reset a password

1. Select **Forgot password** from password sign-in.
2. Enter the registered email and submit.
3. Open the recovery email link.
4. Set and confirm a new password, then sign in again.

## 5. Workspace

After sign-in, the workspace provides:

- **Overview** for campaign, published snapshot, reservation, and recent-project summaries.
- **Projects** for managing drafts and published campaigns.
- **Analytics** for traffic, conversion, and questionnaire results by campaign and date range.
- **Templates** for browsing complete page templates and creating from a selected template.
- **Account settings** for the workspace display name. The sign-in email cannot currently be
  changed in the application.

Selecting a draft card opens the editor. Selecting a published card opens reservation details;
use the card's **Edit** button to change its next draft.

## 6. Create a campaign

1. Select **Create campaign** in the workspace or **Use this template** in the template library.
2. Enter a campaign name between 2 and 80 characters.
3. Select a page template and review the live preview.
4. Select **Create and edit**.

Ahead generates a stable public slug. A template supplies initial content and visual settings and
can still be changed after creation.

## 7. Edit a reservation page

The editor groups settings by page section on the left and shows a live preview on the right.
Primary settings include:

- Campaign name, public address, and complete page template.
- Header brand, hero title, supporting copy, and call to action.
- Countdown date and time with second-level precision.
- Cover position and preview video autoplay, mute, and loop controls.
- Feature highlights, long-form copy, release timeline, and reservation section.
- Section visibility and drag-and-drop order.
- Sixteen preset colors, a custom accent, typography, and motion intensity, speed, and behavior.

Select an editable preview region to focus its settings. Use desktop, mobile, and preview modes to
check the result; full-screen preview is useful for a final review.

### Media requirements

- Images: JPG, PNG, WebP, or AVIF, up to 8 MB.
- Videos: MP4, WebM, OGG, or MOV, up to 100 MB.
- The browser automatically captures a poster when a video is uploaded.
- Demo mode creates only a browser-local preview and does not upload files.

### Configure a questionnaire

1. Enable the questionnaire.
2. Set its title and description.
3. Add short-text, single-choice, or multiple-choice questions and mark required items.
4. Keep at least two options for choice questions, with at most eight options per question.
5. Add up to six questions and reorder them as needed.

Publishing locks the questionnaire structure into the public snapshot. Later draft edits do not
alter the live page or the interpretation of existing answers until the campaign is published
again.

## 8. Save, publish, and withdraw

- **Save draft** updates only the editable version.
- **Publish** saves the current configuration and copies it into a new public snapshot.
- **Copy sharing link** copies the stable `/p/[slug]` address; a draft is not publicly available.
- **Withdraw** stops public access and preserves the project and existing data.
- **Republish** replaces the public snapshot with the latest draft without changing its URL.

Before publishing, check desktop and mobile layouts, the countdown timezone, required questions,
image crops, and video playback.

## 9. Manage campaigns and reservations

### Campaign actions

The campaign card menu includes publish, withdraw, copy link, edit, and delete actions. Deleting a
campaign permanently removes its configuration, media files, page-view data, and every subscriber
email. It cannot be undone. Export the CSV first when records must be retained.

### Reservation management

Only published campaigns provide a reservation list:

1. Open the published campaign details.
2. Search by email, source, campaign tag, location, timezone, or browser locale.
3. Select a table row to open the detail drawer with engagement, visit journey, location, device,
   and answer data.
4. Use the final-column actions to copy an email or delete one reservation. These actions do not
   open the detail drawer.
5. Select **Export CSV** to download the complete reservation data for the campaign.

Submitting the same email more than once for a campaign does not create duplicate records. CSV
uses UTF-8 encoding and escapes spreadsheet formula prefixes.

## 10. Review analytics

Open **Analytics**, then select a published campaign and date range to review:

- Page views, unique visitors, reservations, and conversion rate.
- Daily traffic, browsing frequency, and reservation conversion details.
- Source, device, email domain, and location distributions.
- Conversion efficiency between visitors, sessions, and reservations.
- Active duration, maximum scroll depth, interaction count, and returning visits.
- Distribution of single-choice and multiple-choice answers.

Analytics only come from published pages. Visits are not reported when the browser enables Do Not
Track. Ahead does not store IP addresses or raw User-Agent values. Location first uses coarse
hosting-platform headers; when unavailable, the server transiently resolves the visitor IP and
stores only country, region, and city.

## 11. Visitor reservation flow

On `/p/[slug]`, a visitor:

1. Reviews the published page and its countdown, image, or video content.
2. Enters an address from a supported common email provider. Current domains include Gmail,
   Outlook, Hotmail, Live, MSN, Yahoo, iCloud, Me, Mac, Proton, QQ, Foxmail, 163, 126, Yeah, Sina,
   Sohu, 139, 189, and Aliyun.
3. Completes every required question; choice answers must come from the displayed options.
4. Submits the form and receives the configured success message.

The Ahead credit and GitHub icon in the footer point to the Ahead project itself and are not part
of the campaign template or published snapshot. The deployment owner configures the link through
`productCredit.githubUrl` in `src/lib/product-config.ts`.

## 12. Troubleshooting

### Why did the public page not change after saving?

Saving updates only the draft. After reviewing the preview, select **Publish** again to replace the
public snapshot.

### Why does the public link show a not-found page?

The campaign may still be a draft, may have been withdrawn, or may use a different slug. Confirm
its state in Projects and copy the sharing link again.

### Why does a draft have no reservation list?

A draft has no public entry point and does not collect reservations. The reservation list becomes
available after the first publication.

### Why did no confirmation, OTP, or recovery email arrive?

Check spam and confirm the address. An OTP can be resent after 60 seconds; request a new link if an
old one expired. If delivery keeps failing, ask the deployment administrator to check Supabase
email templates, sending limits, and Redirect URLs.

### Why am I redirected back to sign-in?

Confirm the email account, allow cookies for the site, and verify that the current domain is in
Supabase Redirect URLs. Clear the site's session and sign in again if the issue continues.

### Why does a media upload fail?

Confirm that the session is valid and the type and size meet the limits. Ask the administrator to
check the `campaign-media` bucket, RLS policies, and ownership of the current campaign.

### Why is there no real data, or why did a change disappear after refresh?

The instance may not be connected to Supabase. In read-only demo mode, screens remain available
but changes are not persisted. The administrator must configure Supabase and Vercel variables.

### Why is traffic lower than expected?

Visitors using Do Not Track are excluded. Script blocking, interrupted requests, and the selected
date range also affect totals. Reservation counts reflect successful database records.

### Why is a valid corporate email rejected?

The reservation form currently accepts only the common email providers listed above, not custom
corporate domains. Use a supported address or ask the deployment administrator to change the
email-domain policy.

### Why can I not change the sign-in email?

The current version only supports changing the display name. An email change must be handled by
the deployment administrator through a controlled Supabase Auth process.

## 13. Important notes

- Public pages read only published snapshots. Save and review important edits before republishing.
- Campaign and reservation deletion is irreversible. Export and retain the CSV when required.
- `campaign-media` is a public-read bucket. Do not upload personal, internal, or confidential
  files.
- Reservation emails and answers are personal data. Deployment owners must state their purpose,
  restrict access, and follow applicable privacy and retention requirements.
- Countdown values are entered in the editor's local timezone and stored as one instant. Verify
  them on a target device before publishing across time zones.
- Never expose email addresses, tokens, environment variables, or full reservation data in
  screenshots, public issues, or logs.

## 14. Contact and support

- Product or deployment questions: search or open an Issue in the repository linked by the footer
  GitHub icon. Include reproduction steps, browser version, and redacted error details.
- Account, permission, email, or production-data issues: contact the administrator of the current
  Ahead instance.
- Security or privacy reports: report privately as described in the repository
  [security policy](../SECURITY.md) and never attach secrets or personal data to a public Issue.
- Contributing changes: follow the repository [contributing guide](../CONTRIBUTING.md).

Before launch, the deployment owner should confirm `productCredit.githubUrl` points at the
actual source repository. If the footer still opens the GitHub home page, contact the
deployment administrator for the correct support address.
