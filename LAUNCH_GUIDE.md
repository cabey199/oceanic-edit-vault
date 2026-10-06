# Oceanic Edit Vault — Complete Beginner-Friendly Build and Launch Guide

This guide explains how to take the current **Oceanic Edit Vault** project from its current foundation to a real, secure, gift-ready website.

The goal is to build a private video archive where the owner can:

- Sign in securely.
- Change her email address.
- Change her password.
- Invite other people as viewers or editors.
- Upload videos.
- Keep the untouched original file.
- Create a smaller playback copy automatically.
- Play the playback copy in the website.
- Download the untouched original at full quality.
- Keep the playback copy at the uploaded video's original resolution; reduce file size through encoding efficiency rather than downscaling dimensions.
- Store media using Cloudflare R2 and Backblaze B2.
- See live storage statistics.
- Access a hidden developer vault through the Cat backdoor.
- Keep the developer vault protected by a real developer role.

## Current implementation progress

The following safe code-side work has now been completed automatically in this working copy:

- The existing source formatting issues were cleaned up.
- `pnpm lint` passes with six existing non-blocking Fast Refresh warnings from generated UI primitives.
- `pnpm test` passes.
- The Cloudflare production build passes.
- The video compressor now reads the source and playback dimensions and rejects a playback file if compression changes the width or height.
- The guide now explicitly requires file-size compression without resolution downscaling.
- The direct `/admin` route now checks for an authenticated developer membership before rendering.
- The Cat-triggered developer dashboard now verifies the developer role before showing its controls.

These changes are local until they are reviewed, committed, and deployed. The storage-provider integration still requires account-specific configuration and credentials that must never be placed in this guide or in the repository.

### Tasks that require your account access

You will need to personally complete, or provide access through the appropriate dashboard workflow, for:

1. Supabase project settings, redirect URLs, email delivery, and production database migration.
2. Confirming the owner account's developer membership.
3. Cloudflare Worker variables and secrets.
4. Cloudflare R2 bucket and restricted token.
5. Backblaze B2 bucket and restricted application key.
6. Final domain and DNS ownership.
7. Production email sender/domain verification if custom SMTP is used.

The exact click-by-click instructions for each item are in the relevant sections below. Never send service keys or secret values in chat.

The guide uses small steps. Do not skip a step just because it looks simple. A small configuration mistake in an authentication or storage system can prevent the entire website from working.

---

## Table of contents

1. [Current project status](#1-current-project-status)
2. [How the finished system will work](#2-how-the-finished-system-will-work)
3. [Words and concepts you need to know](#3-words-and-concepts-you-need-to-know)
4. [Before starting](#4-before-starting)
5. [Create a safe backup](#5-create-a-safe-backup)
6. [Run the project locally](#6-run-the-project-locally)
7. [Set up Supabase](#7-set-up-supabase)
8. [Set up roles and invitations](#8-set-up-roles-and-invitations)
9. [Set up Cloudflare Worker configuration](#9-set-up-cloudflare-worker-configuration)
10. [Set up Cloudflare R2](#10-set-up-cloudflare-r2)
11. [Set up Backblaze B2](#11-set-up-backblaze-b2)
12. [Plan the storage model](#12-plan-the-storage-model)
13. [Build the storage server layer](#13-build-the-storage-server-layer)
14. [Build the upload pipeline](#14-build-the-upload-pipeline)
15. [Build real playback](#15-build-real-playback)
16. [Build original-quality downloads](#16-build-original-quality-downloads)
17. [Replace hardcoded gallery data](#17-replace-hardcoded-gallery-data)
18. [Build live storage statistics](#18-build-live-storage-statistics)
19. [Finish the account control panel](#19-finish-the-account-control-panel)
20. [Secure the Cat backdoor and admin route](#20-secure-the-cat-backdoor-and-admin-route)
21. [Improve invitation onboarding](#21-improve-invitation-onboarding)
22. [Add cancellation, retry, and cleanup](#22-add-cancellation-retry-and-cleanup)
23. [Testing checklist](#23-testing-checklist)
24. [Security checklist](#24-security-checklist)
25. [Mobile and browser checklist](#25-mobile-and-browser-checklist)
26. [Deploy the finished website](#26-deploy-the-finished-website)
27. [Gift-ready acceptance test](#27-gift-ready-acceptance-test)
28. [Troubleshooting](#28-troubleshooting)
29. [Useful commands](#29-useful-commands)
30. [Final launch checklist](#30-final-launch-checklist)

---

## 1. Current project status

The repository is:

```text
https://github.com/cabey199/oceanic-edit-vault
```

The local working directory used during development is:

```text
/home/ubuntu/oceanic-edit-vault
```

### Already completed

The project already has:

- React 19.
- TanStack Start and TanStack Router.
- Vite and Tailwind CSS.
- Framer Motion animations.
- Supabase email/password authentication.
- A protected home route that redirects unauthenticated users to `/login`.
- A styled login page.
- A styled account control panel.
- Email change through Supabase Auth.
- Password change through Supabase Auth.
- Sign out.
- Viewer/editor invitation UI.
- A server-side invitation endpoint at `POST /api/invitations`.
- Cloudflare runtime diagnostics at `GET /api/runtime-status`.
- A Supabase membership/invitation/media database migration.
- Browser-side FFmpeg video compression.
- Upload drag-and-drop UI.
- A cinematic player shell.
- A Cat backdoor visual trigger.
- A developer dashboard shell.
- Cloudflare-compatible production builds.

### Still to be completed

The project still needs:

- Real video uploads.
- Real original and playback file storage.
- R2 integration.
- B2 integration.
- Secure presigned upload URLs.
- Secure presigned download URLs.
- Real video playback.
- Real original-quality downloads.
- Database-backed gallery items.
- Live storage statistics.
- Real member management.
- Complete invitation onboarding.
- Developer-role protection for `/admin` and the Cat vault.
- Failed-upload cleanup.
- Retry support.
- More automated tests.
- Final lint cleanup.
- Mobile and production acceptance testing.

### Important rule

> The original uploaded file must never be overwritten by the compressed playback copy.

### The exact quality rule

There are two separate requirements:

1. **Download quality:** the downloaded file must be the untouched original upload. If the uploaded file is 100 MB, the download must use that original 100 MB file, subject only to normal transport or browser behavior. Never replace it with the smaller playback file.
2. **Website playback:** the playback copy may be smaller, for example roughly 20 MB instead of 100 MB, but it must keep the original video's pixel dimensions. If the uploaded video is 1920×1080, the playback video must also be 1920×1080. If it is 1080×1920, the playback video must also be 1080×1920.

This means **compressing file size is not the same as lowering resolution**. The playback encoder may reduce bitrate and remove unnecessary encoding overhead, but it must not add a scale filter or change width/height unless the owner explicitly chooses a separate lower-resolution option later.

The playback copy is allowed to be somewhat more compressed than the original because it is used for streaming, but it must remain visually clean. Use a quality-based encoder setting, preserve the original dimensions, and test dark scenes, text, fast movement, gradients, and audio synchronization. If a 100 MB upload becomes 20 MB but looks visibly blurry or blocky, the quality target is too aggressive and must be adjusted.

### Product decision: compressed-only, quality-first storage

The product will use the compressed-only model for the main archive:

```text
100 MB upload
→ one quality-controlled playback/download file
→ perhaps 20 MB, 35 MB, or another size depending on the content
```

The exact 20 MB result is not a requirement. A fixed size target could force a difficult video to become visibly bad. Instead, the encoder should use a quality target and accept the resulting size. The same stored compressed file will be used for both website playback and downloads.

The upload must be rejected or retried if any of these occur:

- Resolution changes.
- Orientation or aspect ratio changes.
- Duration changes beyond a small tolerance.
- Audio disappears unexpectedly.
- Audio and video become noticeably out of sync.
- The output has obvious blocking, banding, softness, or other visible damage in the quality review.

This model intentionally prioritizes a video that still looks relatively like the upload over a guaranteed storage ratio. If a particular source cannot be reduced aggressively without visible damage, it must remain larger rather than being forced into an arbitrary 20 MB limit.

The system will store at least three different media types:

1. **Original** — untouched, full-quality download file.
2. **Playback** — optimized copy used by the website player.
3. **Thumbnail** — small preview image used by the gallery.

---

## 2. How the finished system will work

The finished architecture will look like this:

```text
Browser
  |
  | 1. Sign in with Supabase Auth
  |
  | 2. Ask Worker for a short-lived upload URL
  v
Cloudflare Worker
  |
  | Checks the Supabase access token
  | Checks the user's role
  | Creates archive metadata
  | Creates short-lived storage URLs
  v
Supabase
  |
  | Auth users
  | Memberships and roles
  | Invitations
  | Archive metadata
  | Media object metadata
  v
R2 and B2
  |
  | Original file
  | Playback file
  | Thumbnail
  v
Browser player
  |
  | Streams playback copy
  | Downloads original through short-lived URL
```

### Upload sequence

1. The user selects a video.
2. The browser keeps the original file in memory.
3. FFmpeg creates a playback copy locally.
4. The browser creates a thumbnail.
5. The browser asks the Worker for upload instructions.
6. The Worker verifies the user session.
7. The Worker creates an `archive_items` record.
8. The Worker returns short-lived upload URLs.
9. The browser uploads the original, playback copy, and thumbnail.
10. The browser tells the Worker that the upload finished.
11. The Worker verifies the files and marks the item as `ready`.
12. The gallery refreshes and shows the new edit.

### Playback sequence

1. The user opens an archive item.
2. The browser asks the Worker for a playback URL.
3. The Worker checks that the user can view the item.
4. The Worker returns a short-lived URL for the playback object.
5. The browser streams the playback object.

### Download sequence

1. The user clicks Download Original.
2. The browser asks the Worker for a download URL.
3. The Worker checks that the user can view the item.
4. The Worker returns a short-lived URL for the original object.
5. The browser downloads the untouched original.

---

## 3. Words and concepts you need to know

### Supabase

Supabase provides:

- User accounts and authentication.
- A PostgreSQL database.
- Row Level Security policies.
- Email invitations and magic links.

### Cloudflare Worker

The Worker is the server-side part of the website. It receives requests from the browser and performs tasks that must not happen directly in frontend code, such as:

- Checking roles.
- Creating presigned URLs.
- Using service credentials.
- Talking to R2 and B2.

### R2

Cloudflare R2 is object storage. Large files are stored there instead of inside the database.

### B2

Backblaze B2 is another object-storage provider. It can be used as a second storage provider or fallback provider.

### Object storage

Object storage stores files using keys such as:

```text
archive/{ownerId}/{archiveItemId}/original/source-video.mov
archive/{ownerId}/{archiveItemId}/playback/source-video.playback.mp4
archive/{ownerId}/{archiveItemId}/thumbnail/source-video.jpg
```

### Presigned URL

A presigned URL is a temporary link that allows a specific upload or download without exposing permanent storage credentials.

### Service-role key

The Supabase service-role key has powerful access and can bypass Row Level Security. It must exist only on the server.

Never put it in:

- Frontend code.
- A `VITE_*` variable.
- GitHub.
- A screenshot.
- A browser URL.
- A chat message.

### RLS

Row Level Security is Supabase's database-level permission system. It decides which rows a user can read or change.

### Developer role

The developer role is stronger than viewer or editor. It is required for:

- Sending invitations.
- Managing memberships.
- Viewing infrastructure controls.
- Opening the developer vault.

---

## 4. Before starting

You need accounts with:

- GitHub access to the repository.
- Supabase access to the project.
- Cloudflare access to the Worker and R2.
- Backblaze access to B2.
- An email inbox that can receive test invitations.

You also need these installed locally:

- Git.
- Node.js.
- pnpm.
- A modern browser.
- Optional: Wrangler for Cloudflare deployment.

Check your tools:

```bash
node --version
pnpm --version
git --version
```

If `pnpm` is missing:

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

### Never share these secrets

Do not share:

- Supabase service-role key.
- Cloudflare API token.
- R2 access key.
- R2 secret key.
- B2 application key.
- B2 application key secret.
- SMTP password.
- Any `.env` file containing private values.

---

## 5. Create a safe backup

Before changing code, create a branch and tag the known-good state.

From the repository directory:

```bash
cd /home/ubuntu/oceanic-edit-vault
git status
git checkout -b build-real-storage
git tag foundation-before-storage
```

If you are working on another computer, clone the repository first:

```bash
git clone https://github.com/cabey199/oceanic-edit-vault.git
cd oceanic-edit-vault
pnpm install --frozen-lockfile
```

Confirm the project is clean:

```bash
git status --short
```

An empty result means there are no uncommitted changes.

### Make a database backup

In Supabase:

1. Open the project.
2. Go to the database backup area.
3. Create or verify a recent backup.
4. Do this before applying schema changes.

Do not delete the existing migration. Migrations are historical records of database changes.

---

## 6. Run the project locally

Install dependencies:

```bash
cd /home/ubuntu/oceanic-edit-vault
pnpm install --frozen-lockfile
```

Run the development server:

```bash
pnpm dev
```

Open the local URL shown in the terminal, usually:

```text
http://localhost:5173
```

Stop the server with:

```text
Ctrl + C
```

Run the current checks:

```bash
pnpm test
pnpm build
```

The production build should complete before continuing.

The current repository has one known lint problem in `src/routes/login.tsx` caused by line endings and formatting. Fix it before final launch:

```bash
pnpm exec prettier --write src/routes/login.tsx
pnpm lint
```

Do not run formatting over the entire repository unless you are ready to review every changed file.

---

## 7. Set up Supabase

### 7.1 Find the Supabase project

Open the Supabase dashboard and select the project used by the website.

The project URL currently resembles:

```text
https://uooxubwuvkifgieqbksv.supabase.co
```

Do not assume this URL is correct for a new project. Copy the current value from the Supabase dashboard.

### 7.2 Configure authentication URLs

In Supabase Authentication settings, configure:

- Site URL: the final website URL.
- Redirect URL: the final website URL plus `/login` if needed.
- Local redirect URL: your local development URL plus `/login`.

Examples:

```text
http://localhost:5173/login
https://your-final-domain.com/login
https://oceanic-edit-vault.calebasefa455.workers.dev/login
```

Only add URLs that you control.

### 7.3 Configure email delivery

For testing, Supabase's built-in email service may be enough. For a gift-ready website, configure a reliable custom SMTP provider if your project needs more email volume or better delivery.

Test that:

- Login emails arrive.
- Invitation emails arrive.
- Email-change confirmation emails arrive.
- Links point to the correct final domain.

### 7.4 Apply the database migration

The migration is located at:

```text
supabase/migrations/20261006000000_archive_foundation.sql
```

Open Supabase SQL Editor, create a new query, paste the migration contents, and run it.

After it finishes, verify the tables:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'archive_memberships',
    'archive_invitations',
    'archive_items',
    'archive_media_objects'
  )
order by table_name;
```

You should see four rows.

Verify the enum types:

```sql
select typname
from pg_type
where typname in (
  'archive_role',
  'invitation_status',
  'storage_provider',
  'archive_media_kind'
)
order by typname;
```

### 7.5 Add the owner as a developer

First find the authenticated user's ID:

```sql
select id, email, created_at
from auth.users
order by created_at;
```

Then add the owner as a developer. Replace the email exactly:

```sql
insert into public.archive_memberships (user_id, role)
select id, 'developer'::public.archive_role
from auth.users
where email = 'OWNER_EMAIL@example.com'
on conflict (user_id)
do update set
  role = 'developer'::public.archive_role,
  updated_at = now();
```

Verify:

```sql
select
  u.id,
  u.email,
  m.role,
  m.created_at
from auth.users u
join public.archive_memberships m on m.user_id = u.id
where u.email = 'OWNER_EMAIL@example.com';
```

The role must be `developer`.

### 7.6 Create a test user

Use a different email address for testing. Do not test invitations by inviting the owner to herself.

The test user should eventually receive either:

- `viewer`, or
- `editor`

Start with `viewer` because it is the least powerful role.

---

## 8. Set up roles and invitations

### Roles

The product uses three roles:

| Role      | Can view archive | Can edit archive | Can invite | Can use developer vault |
| --------- | ---------------: | ---------------: | ---------: | ----------------------: |
| Viewer    |              Yes |               No |         No |                      No |
| Editor    |              Yes |              Yes |         No |                      No |
| Developer |              Yes |              Yes |        Yes |                     Yes |

### Invitation behavior to implement

When a developer invites someone:

1. Validate the email.
2. Validate the selected role.
3. Create the Supabase invitation.
4. Create an `archive_invitations` row with `pending` status.
5. Send the email.
6. Let the recipient click the invitation link.
7. Let the recipient create or confirm their account.
8. Create their `archive_memberships` row.
9. Mark the invitation `accepted`.

### Important current limitation

The invitation send endpoint is working, but the complete acceptance-to-membership flow still needs to be implemented. Sending an email is not the same as granting a permanent role.

### Verify the current invitation endpoint

The endpoint is:

```text
POST /api/invitations
```

It expects:

```json
{
  "email": "viewer@example.com",
  "role": "viewer"
}
```

It also expects a valid header:

```text
Authorization: Bearer SUPABASE_ACCESS_TOKEN
```

Do not manually paste access tokens into public places.

---

## 9. Set up Cloudflare Worker configuration

The live diagnostic endpoint is:

```text
https://oceanic-edit-vault.calebasefa455.workers.dev/api/runtime-status
```

A healthy response should show:

```json
{
  "hasSupabaseUrl": true,
  "hasAnonKey": true,
  "hasServiceRoleKey": true
}
```

### 9.1 Configure the Worker dashboard

In Cloudflare:

1. Open **Workers & Pages**.
2. Open the `oceanic-edit-vault` Worker.
3. Open **Settings**.
4. Open **Variables and Secrets**.
5. Add or verify the following values.

| Name                        | Type     | Where it is used                 |
| --------------------------- | -------- | -------------------------------- |
| `SUPABASE_URL`              | Variable | Worker server code               |
| `SUPABASE_ANON_KEY`         | Variable | Worker/server compatibility      |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret   | Server-only Supabase admin calls |

The service-role key must be a secret, not an ordinary visible variable.

### 9.2 Add storage secrets later

When the storage implementation is ready, add secrets such as:

```text
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
B2_KEY_ID
B2_APPLICATION_KEY
B2_BUCKET_NAME
B2_ENDPOINT
```

The exact names should match the code. Do not invent a different name in Cloudflare than the name used by the Worker.

### 9.3 Redeploy after changing variables

Some deployment systems do not use new bindings until the Worker is redeployed.

After changing variables:

```bash
npx wrangler deploy
```

If Wrangler asks you to log in:

```bash
npx wrangler login
```

If you do not have Wrangler access, use the Cloudflare dashboard's deploy/redeploy workflow.

### 9.4 Verify the deployed Worker

Open:

```text
https://oceanic-edit-vault.calebasefa455.workers.dev/api/runtime-status
```

If any value is `false`, check:

- The variable was added to the correct Worker.
- The variable was added to the correct environment.
- The Worker was redeployed.
- The spelling is exact.
- The secret was not accidentally added to a local-only environment.
- The browser is opening the current Worker URL.

---

## 10. Set up Cloudflare R2

Use R2 as the primary object-storage provider.

### 10.1 Create the bucket

In Cloudflare:

1. Open **R2 Object Storage**.
2. Create a bucket.
3. Give it a simple name, for example:

```text
oceanic-edit-vault-media
```

Use a unique name if Cloudflare requires it.

### 10.2 Do not make the bucket public by default

The website should use short-lived signed URLs. Do not expose original private videos through a public bucket unless there is a clear product reason.

### 10.3 Create an R2 API token

Create a token that has only the permissions needed for this bucket:

- Read objects.
- Write objects.
- Delete objects if cleanup is implemented.

Do not grant account-wide permissions if bucket-level permissions are possible.

Save the credentials in a password manager. You will not put them in the repository.

### 10.4 Configure the Worker binding

There are two common approaches:

1. A native Cloudflare R2 Worker binding.
2. S3-compatible access using R2 access keys.

Use the approach supported by the current deployment setup. A native binding is often simpler inside a Worker, while S3-compatible requests can make multi-provider abstraction easier.

Whichever approach you choose, keep the storage interface provider-neutral so B2 can use the same application-level methods.

---

## 11. Set up Backblaze B2

Use B2 as the secondary provider or fallback provider.

### 11.1 Create the B2 bucket

In Backblaze:

1. Open **Buckets**.
2. Create a private bucket.
3. Use a name such as:

```text
oceanic-edit-vault-backup
```

### 11.2 Create an application key

Create a key scoped only to the bucket.

Required permissions normally include:

- Read files.
- Write files.
- Delete files if cleanup is needed.
- List files if reconciliation is needed.

Do not use a master application key if a restricted key is available.

### 11.3 Save B2 credentials securely

Store:

- Key ID.
- Application key.
- Bucket name.
- Endpoint.
- Region if required.

Never commit these to GitHub.

### 11.4 Decide how B2 participates

Choose one of these strategies:

#### Strategy A: Primary/fallback

- Upload to R2 first.
- If R2 is unavailable, upload to B2.
- Store the selected provider in `archive_media_objects.provider`.

#### Strategy B: Mirrored copies

- Upload the same object to R2 and B2.
- Store two media-object rows for the same logical file.
- Use one provider for playback and retain the other as redundancy.

#### Strategy C: Split media types

- Store originals in B2.
- Store playback copies in R2.
- Store thumbnails in R2.

For the first production version, **primary/fallback** is usually the least complicated. If redundancy is a business requirement, use mirrored copies and explicitly test reconciliation and deletion behavior.

Do not silently claim that a file is duplicated unless it really exists in both providers.

---

## 12. Plan the storage model

The existing database already has a foundation. Extend it carefully rather than replacing it.

### `archive_items`

One row represents one logical video edit.

It should contain:

- ID.
- Owner ID.
- Title.
- Note.
- Format.
- Duration.
- Width.
- Height.
- Codec.
- Favorite state.
- Archived state.
- Processing status.
- Created timestamp.
- Updated timestamp.

Recommended statuses:

```text
processing
ready
failed
archived
```

### `archive_media_objects`

One row represents one stored file.

It should contain:

- Archive item ID.
- Provider.
- Media kind.
- Object key.
- Byte size.
- Content type.
- Checksum if available.
- Upload status.
- Created timestamp.

Recommended media kinds:

```text
original
playback
thumbnail
```

### Recommended additional fields

Add a migration for fields such as:

```sql
alter table public.archive_media_objects
  add column if not exists checksum text,
  add column if not exists status text not null default 'pending',
  add column if not exists provider_object_id text;
```

Before applying a change, confirm that the exact column names match the code.

### Object-key example

For an item with:

```text
owner_id = user-123
archive_item_id = item-456
```

Use keys such as:

```text
archive/user-123/item-456/original/source.mov
archive/user-123/item-456/playback/source.playback.mp4
archive/user-123/item-456/thumbnail/source.jpg
```

Never use a user-provided filename as the complete storage key. User filenames can contain unsafe characters and collisions.

---

## 13. Build the storage server layer

Do not upload directly with permanent credentials from the browser.

Create a server-side storage abstraction with methods similar to:

```ts
interface StorageProvider {
  createUploadUrl(input: {
    objectKey: string;
    contentType: string;
    expiresInSeconds: number;
  }): Promise<{ url: string; headers?: Record<string, string> }>;

  createDownloadUrl(input: {
    objectKey: string;
    expiresInSeconds: number;
    downloadName?: string;
  }): Promise<string>;

  headObject(objectKey: string): Promise<{
    exists: boolean;
    byteSize?: number;
    contentType?: string;
  }>;

  deleteObject(objectKey: string): Promise<void>;
}
```

Implement separate adapters:

```text
src/server/storage/r2.ts
src/server/storage/b2.ts
src/server/storage/index.ts
```

The rest of the application should call the storage abstraction, not provider-specific code.

### Required Worker endpoints

Add endpoints such as:

```text
POST /api/archive-items
POST /api/archive-items/:id/uploads
POST /api/archive-items/:id/complete
GET  /api/archive-items
GET  /api/archive-items/:id/playback-url
GET  /api/archive-items/:id/download-url
DELETE /api/archive-items/:id
GET  /api/storage/metrics
```

Exact route syntax depends on the server framework. Keep the endpoint names consistent across frontend and backend.

### Every endpoint must check

1. A Bearer token exists.
2. The token is valid.
3. The membership exists.
4. The user has the required role.
5. The item belongs to the correct archive/owner.
6. The requested media kind is allowed.
7. The request payload is valid.
8. The URL expiration is short.

### URL expiration

Use short expiration periods:

- Upload URL: enough time for the expected upload, commonly several minutes.
- Playback URL: a short period appropriate for streaming.
- Download URL: a short period appropriate for a user download.

Do not make URLs permanent unless the product explicitly requires it.

---

## 14. Build the upload pipeline

This is the most important feature after authentication.

### 14.1 Choose a file

The existing upload drawer already accepts:

- MP4.
- MOV.
- WEBM.

Keep the file validation in the browser, but repeat important validation on the server.

### 14.2 Validate the file

Browser checks:

- Is there a file?
- Is it a video?
- Is it below the product's maximum size?
- Is the extension supported?

Server checks:

- Content type.
- Declared file size.
- Actual uploaded size.
- User permissions.
- Safe title and metadata.

Never rely only on the browser's file type value.

### 14.3 Compress locally

The current FFmpeg engine creates a playback copy. Keep the original `File` untouched.

The normal playback encode must preserve the uploaded video's pixel dimensions. Do not add an FFmpeg scaling step such as `-vf scale=...`, `-s ...`, or a width/height limit. If the source is 1920×1080, the playback copy must remain 1920×1080. If the source is 1080×1920, the playback copy must remain 1080×1920.

The goal is to reduce **file size**, not resolution. A 100 MB upload might produce a playback copy around 20 MB, give or take, depending on duration, motion, audio, source codec, and the quality setting. The original 100 MB file must still be stored separately and must remain the file used for Download Original.

The UI should display:

```text
Original: 84.2 MB
Playback: 18.4 MB
Saved: 78%
```

The current code uses H.264 for playback. If the UI says H.265, change the UI or change the encoder. Do not display a codec that is not actually used.

After encoding, compare source and playback metadata. If the dimensions changed, treat the encode as a failure or flag it for review. A smaller number of megabytes is expected; a smaller width or height is not expected for the normal playback path.

### 14.4 Extract metadata

Extract or calculate:

- Original filename.
- Original byte size.
- Playback byte size.
- MIME type.
- Width.
- Height.
- Duration.
- Orientation.
- Codec where available.
- Thumbnail.

Use a browser `<video>` element for basic duration and dimensions. Use a reliable media parser only if exact codec information is required.

### 14.5 Generate a thumbnail

Create a small thumbnail from a representative video frame:

1. Load the playback video into a hidden video element.
2. Seek to a safe timestamp, such as one second or 10% of the duration.
3. Draw the frame to a canvas.
4. Export it as JPEG or WebP.
5. Upload it as the `thumbnail` media object.

Handle videos that are shorter than the chosen timestamp.

### 14.6 Create the database record

The browser should request the Worker to create a new archive item.

The Worker should:

1. Authenticate the user.
2. Check that the user is an editor or developer.
3. Generate a UUID.
4. Insert an `archive_items` row with `processing` status.
5. Generate safe object keys.
6. Insert pending media-object rows.
7. Return upload instructions.

### 14.7 Upload the files

Upload separately:

- Original file.
- Playback blob.
- Thumbnail blob.

Show individual progress where possible:

```text
Original      40%
Playback      85%
Thumbnail     Complete
```

### 14.8 Complete the upload

The browser calls the completion endpoint after uploads finish.

The Worker should:

1. Verify each expected object exists.
2. Verify each object size.
3. Verify content type.
4. Update media-object rows.
5. Mark the archive item `ready`.
6. Return the complete item.

If any object is missing, leave the item as `failed` or `processing` and show a retry option.

### 14.9 Update the gallery

After a successful completion:

- Close or update the upload drawer.
- Refresh the archive query.
- Show the new item immediately.
- Display the real thumbnail, size, date, format, and duration.

Do not keep using the six hardcoded edits once real records are available. You can keep seeded sample data only for a deliberate demo mode.

---

## 15. Build real playback

The current cinematic player uses an image and simulated progress. Replace that with a real `<video>` element.

The player should:

- Request a playback URL when opened.
- Show a loading state.
- Show a useful error state.
- Use `controls` at first for reliability.
- Support `playsInline` on mobile.
- Support muted autoplay only when appropriate.
- Revoke or replace old object URLs if any are created in the browser.
- Stop playback when the modal closes.

Example conceptual structure:

```tsx
<video
  src={playbackUrl}
  poster={thumbnailUrl}
  controls
  playsInline
  preload="metadata"
  className="h-full w-full object-contain"
/>
```

Do not use the original file for normal playback. The original is reserved for full-quality download.

### Playback quality

“Playback quality” means the playback derivative keeps the uploaded resolution and remains visually appropriate without unnecessary degradation. It does not mean the original must be streamed for every viewing session.

The playback copy must preserve:

- Source width.
- Source height.
- Source orientation.
- Correct aspect ratio.
- Audio/video synchronization.

It may reduce file size through a more efficient codec, bitrate, or encoding settings, but it must not lower the pixel dimensions. Do not confuse a smaller number of megabytes with a lower resolution. If a 100 MB upload becomes 20 MB but looks visibly blurry or blocky, the quality target is too aggressive and must be adjusted.

Choose compression settings deliberately and test:

- Fast motion.
- Dark scenes.
- Text overlays.
- Vertical videos.
- Landscape videos.
- Audio synchronization.

---

## 16. Build original-quality downloads

The current Download button only displays a notice. Replace it with a real download flow.

### Download flow

1. User clicks Download Original.
2. Browser requests `/api/archive-items/:id/download-url`.
3. Worker authenticates the user.
4. Worker checks viewer/editor/developer access.
5. Worker finds the `original` media object.
6. Worker creates a short-lived signed URL.
7. Browser navigates to the URL or uses an anchor download.

Use a safe download filename generated from:

- The archive title.
- A safe extension.
- The original content type.

Do not trust a raw user-provided filename in an HTTP header without sanitizing it.

### Test downloads

Test:

- A small MP4.
- A large MP4.
- A MOV original.
- A vertical video.
- A filename with spaces.
- A filename with special characters.
- An expired URL.
- A user who should not have access.

The downloaded file must match the original file's byte size and, where practical, checksum.

---

## 17. Replace hardcoded gallery data

The current gallery data is defined in `src/routes/index.tsx` as a local `edits` array. Replace it with a database-backed query.

### Query behavior

The archive query should:

- Load only items the current user can view.
- Exclude failed items unless an admin is inspecting them.
- Exclude archived items from the normal gallery.
- Order by newest first.
- Include thumbnail metadata.
- Include playback metadata.
- Include original metadata needed for download.

### Loading states

Add:

- Initial loading skeletons.
- Empty archive state.
- Error state.
- Retry button.
- Pagination or infinite scrolling if the archive becomes large.

### Filters

Keep the existing filters:

- All Edits.
- TikTok / Reels.
- Landscape.
- Favorites.

Apply filters to real database results.

### Favorites

If favorites should persist, add an authenticated update endpoint instead of changing only local React state.

---

## 18. Build live storage statistics

The current developer dashboard contains placeholder values. Replace them with actual calculations.

### Metrics to display

In the owner control panel:

- Total storage used.
- Total storage available according to the selected provider plan.
- Number of archive items.
- Original storage used.
- Playback storage used.
- Thumbnail storage used.
- R2 usage.
- B2 usage.
- Number of failed or processing uploads.

### Where metrics come from

Use two sources:

1. Database metadata for fast application metrics.
2. Provider APIs or scheduled reconciliation for verification.

Do not calculate usage only from browser state.

### Recommended metric query

Sum `byte_size` grouped by:

- Provider.
- Media kind.
- Owner.

Use server-side queries and return only the user's permitted metrics.

### Reconciliation

A scheduled or manual reconciliation process should:

1. List known database objects.
2. Check provider object existence.
3. Detect missing files.
4. Detect untracked files.
5. Recalculate sizes.
6. Mark inconsistencies for review.

Do not silently delete a file during reconciliation until deletion rules are explicit.

---

## 19. Finish the account control panel

The current panel already includes email, password, sign-out, and invitations. Expand it carefully.

### 19.1 Email change

Expected flow:

1. Show current email.
2. User enters new email.
3. Submit to Supabase Auth.
4. Explain that confirmation may be required.
5. Do not display the new email as confirmed until Supabase confirms it.
6. Show pending state.
7. Handle duplicate-email errors.

### 19.2 Password change

Expected flow:

1. Require a minimum length.
2. Confirm the password twice.
3. Submit through Supabase Auth.
4. Show success or error.
5. Clear password fields after success.
6. Never log the password.

### 19.3 Invitations

Add:

- Invitation email field.
- Role field.
- Pending state.
- Success state.
- Error state.
- Invitation history.
- Expiration date.
- Revoke invitation action.

### 19.4 Member list

Add a members section showing:

- Email.
- Role.
- Joined date.
- Last activity if available.
- Status.
- Change role action.
- Revoke access action.

Only developers should see member-management controls.

### 19.5 Storage section

Add a calm, readable storage card:

```text
Archive storage
6.4 GB used of 10 GB

Originals       4.7 GB
Playback        1.6 GB
Thumbnails      0.1 GB
R2              5.1 GB
B2              1.3 GB
```

Do not display placeholder values in production.

---

## 20. Secure the Cat backdoor and admin route

Keep the Cat trigger. It is part of the product personality.

But the Cat trigger must not be the security mechanism.

### Required security behavior

- `/admin` checks authentication.
- `/admin` checks membership role.
- Only `developer` can access the page.
- The Cat modal also checks the role before showing developer controls.
- Direct URL access must use the same authorization logic.
- A viewer must receive a safe access-denied response.
- Do not rely on hiding a button.

### Recommended route flow

1. User navigates to `/admin`.
2. Route loader checks Supabase session.
3. If no session, redirect to `/login`.
4. If session exists, call a safe role-check endpoint or query the membership.
5. If role is not `developer`, show an access-denied page.
6. If role is `developer`, render the dashboard.

### Do not trust client-only role state

A client-side `isDeveloper` boolean is not sufficient. The server must enforce the role for every sensitive API request.

### Developer dashboard content

Replace placeholders with:

- Live provider health.
- Live storage metrics.
- Upload queue health.
- Failed upload count.
- Last reconciliation time.
- Compression configuration.
- Recent operational errors.

Do not show secrets, access keys, or signed URLs in the dashboard.

---

## 21. Improve invitation onboarding

The invite email must lead to a complete experience.

### Recipient flow

1. Recipient receives the email.
2. Recipient clicks the link.
3. Supabase redirects to `/login`.
4. The app detects the access token or invite hash.
5. The app establishes the session.
6. The app asks for any required profile/password information.
7. The app applies the invitation role.
8. The app marks the invitation accepted.
9. The app redirects to the archive.

### Invitation validation

The server should verify:

- Invitation exists.
- Invitation email matches the authenticated user email.
- Invitation is pending.
- Invitation is not expired.
- Invitation has not been revoked.
- Invitation role is valid.

### Expired invitation behavior

Show a clear page:

```text
This invitation has expired.
Ask the archive owner to send a new invitation.
```

Do not expose database errors directly to the recipient.

### Revoked invitation behavior

Show a similar safe message and do not create a membership.

---

## 22. Add cancellation, retry, and cleanup

A video upload can fail for many reasons:

- Browser tab closed.
- Network interruption.
- Storage provider timeout.
- Expired upload URL.
- Worker error.
- Insufficient storage.
- Unsupported codec.
- Mobile memory pressure.

### Required upload states

Use explicit states:

```text
idle
preparing
compressing
creating-record
uploading-original
uploading-playback
uploading-thumbnail
verifying
ready
cancelled
failed
```

### Cancellation

When the user cancels:

1. Stop FFmpeg.
2. Stop active uploads if supported.
3. Tell the Worker to mark the item cancelled.
4. Delete partial objects if possible.
5. Do not leave an item that looks ready.

### Retry

When retrying:

- Reuse the existing archive item if safe, or create a new one.
- Do not create duplicate items accidentally.
- Reissue expired upload URLs.
- Show what stage is being retried.

### Cleanup

Implement a cleanup routine for:

- Partial uploads.
- Failed items older than a configured period.
- Orphaned objects with no database row.
- Database rows whose objects are missing.

Keep cleanup conservative. Prefer marking an item for review before deletion during early production.

---

## 23. Testing checklist

### 23.1 Automated checks

Run:

```bash
pnpm lint
pnpm test
pnpm build
```

Add tests for:

- Login route behavior.
- Unauthenticated redirect.
- Developer-only route protection.
- Invitation payload validation.
- Viewer/editor/developer authorization.
- Upload completion validation.
- Download authorization.
- Storage metric aggregation.
- Expired invitation handling.

### 23.2 Manual authentication tests

Test:

- Correct login.
- Incorrect password.
- Missing email.
- Missing password.
- Sign out.
- Re-login.
- Expired session.
- Email change confirmation.
- Password change.

### 23.3 Manual invitation tests

Test:

- Developer invites viewer.
- Developer invites editor.
- Viewer cannot invite.
- Editor cannot invite.
- Invalid email.
- Duplicate invitation.
- Expired invitation.
- Revoked invitation.
- Recipient accepts invitation.
- Recipient receives correct role.

### 23.4 Manual upload tests

Test:

- Small MP4.
- Large MP4.
- MOV.
- WEBM.
- Vertical video.
- Landscape video.
- Audio and video synchronization.
- Compression error.
- Cancellation during compression.
- Cancellation during upload.
- Network interruption.
- Retry after failure.
- Duplicate filenames.
- Special characters in filenames.

### 23.5 Manual storage tests

Test:

- R2 upload.
- B2 upload.
- R2 fallback.
- B2 fallback.
- Original metadata.
- Playback metadata.
- Thumbnail metadata.
- A roughly 100 MB test upload whose playback copy is smaller but has exactly the same width and height as the original.
- A vertical test upload whose playback copy remains vertical at the original dimensions.
- A landscape test upload whose playback copy remains landscape at the original dimensions.
- A downloaded original whose byte size and quality match the untouched source file.
- Provider health status.
- Live byte counts.

### 23.6 Manual permissions tests

Test with separate accounts:

- Viewer can view and play.
- Viewer can download if product policy allows it.
- Viewer cannot upload.
- Viewer cannot edit metadata.
- Viewer cannot access `/admin`.
- Editor can upload.
- Editor can edit archive items.
- Editor cannot manage developers.
- Developer can invite and manage members.

---

## 24. Security checklist

Before gifting the website:

- [ ] Supabase service-role key is not in GitHub.
- [ ] R2 credentials are not in GitHub.
- [ ] B2 credentials are not in GitHub.
- [ ] No secrets are in frontend bundles.
- [ ] No secrets are in `VITE_*` variables.
- [ ] Cloudflare secrets are configured as secrets.
- [ ] Worker runtime status confirms expected bindings without displaying values.
- [ ] Supabase RLS is enabled.
- [ ] Server endpoints verify the Bearer token.
- [ ] Server endpoints enforce role permissions.
- [ ] `/admin` is protected server-side.
- [ ] Cat backdoor is not the only protection.
- [ ] Signed URLs expire.
- [ ] Private buckets are used unless public access is intentional.
- [ ] User filenames are sanitized.
- [ ] Upload sizes are limited.
- [ ] Content types are validated server-side.
- [ ] Failed uploads cannot be accessed as ready items.
- [ ] Error messages do not reveal credentials or internal secrets.
- [ ] Logs do not contain access tokens or signed URLs.
- [ ] Database backups exist.

### Search the repository for obvious secret mistakes

Run:

```bash
rg -n "service_role|SERVICE_ROLE|secret|application_key|access_key|private_key" . \
  --glob '!node_modules/**' \
  --glob '!.git/**' \
  --glob '!pnpm-lock.yaml'
```

Review every match. A variable name is not automatically a leaked secret, but an actual secret value must not appear.

---

## 25. Mobile and browser checklist

Test in:

- Chrome desktop.
- Safari desktop if available.
- Chrome on Android.
- Safari on iPhone.

Check:

- Login form fits on a small screen.
- Account panel scrolls correctly.
- Upload drawer fits on a small screen.
- File picker works.
- Drag-and-drop is not required on mobile.
- Compression does not freeze the page.
- Cancel works.
- Video playback uses `playsInline`.
- Download works from mobile.
- Signed URL does not open a broken blank page.
- Cat button is reachable but subtle.
- Focus states are visible.
- Dialogs can be closed with a visible control.
- Reduced-motion preference is respected.
- Network errors show understandable messages.

### Mobile memory rule

Large browser-side FFmpeg operations can use significant memory. Test with a large video on a real mobile device. If the browser crashes or becomes unusable:

- Reduce the maximum browser-side input size.
- Use a lower-memory compression strategy.
- Move transcoding to a server-side job later.
- Show a clear message instead of silently failing.

---

## 26. Deploy the finished website

### 26.1 Commit the changes

Review the files first:

```bash
git status
git diff --stat
git diff
```

Run checks:

```bash
pnpm lint
pnpm test
pnpm build
```

Commit in small, understandable units:

```bash
git add .
git commit -m "Connect archive uploads to private storage"
```

Do not force-push. This project is connected to Lovable, and rewriting published history can damage the project history.

### 26.2 Push the branch

```bash
git push -u origin build-real-storage
```

Open a pull request if you want review. Merge only after checks pass.

### 26.3 Deploy Worker code

If deploying with Wrangler:

```bash
npx wrangler login
npx wrangler deploy
```

If deploying through a connected platform, use its normal deploy flow and confirm the deployment completed.

### 26.4 Recheck runtime configuration

Open:

```text
https://oceanic-edit-vault.calebasefa455.workers.dev/api/runtime-status
```

Confirm the required values are true.

### 26.5 Configure the final domain

When the site is ready to gift:

1. Choose the final domain.
2. Add it to Cloudflare.
3. Configure the Worker route or custom domain.
4. Add the final domain to Supabase allowed redirect URLs.
5. Test login and invitation links using the final domain.
6. Do not gift the temporary Worker URL if you plan to change it immediately.

### 26.6 Configure production email links

Verify that invitation, login, and email-change links use the final domain. Do not assume the link is correct because the Worker itself loads.

---

## 27. Gift-ready acceptance test

Perform this entire test from a clean browser or private/incognito window.

### Owner test

1. Open the final website.
2. Confirm unauthenticated users see the login page.
3. Log in as the owner.
4. Confirm the main archive loads.
5. Open the account panel.
6. Confirm the current email is shown.
7. Change the password using a test password.
8. Sign out.
9. Sign back in with the new password.
10. Change the password back to the intended password.
11. Confirm live storage statistics load.
12. Confirm the Cat icon opens the developer vault.
13. Confirm the developer dashboard shows live data.
14. Send a viewer invitation.
15. Send an editor invitation.

### Upload test

1. Open the upload drawer.
2. Choose a test video.
3. Confirm the original remains untouched.
4. Confirm compression progress appears.
5. Confirm playback size is shown.
6. Confirm the upload reaches `ready`.
7. Confirm the item appears in the gallery.
8. Open it.
9. Confirm real video playback works.
10. Download the original.
11. Confirm the downloaded file opens.
12. Confirm the downloaded file matches the original quality and expected size.

### Viewer test

1. Accept the viewer invitation with a separate account.
2. Confirm the viewer can sign in.
3. Confirm the viewer can see allowed archive items.
4. Confirm the viewer cannot upload.
5. Confirm the viewer cannot access `/admin`.
6. Confirm the viewer cannot send invitations.

### Editor test

1. Accept the editor invitation with a separate account.
2. Confirm the editor can sign in.
3. Confirm the editor can upload if that is the intended policy.
4. Confirm the editor cannot manage memberships.
5. Confirm the editor cannot access developer controls.

### Failure test

1. Disable or misconfigure a storage provider in a test environment.
2. Confirm the fallback behavior is understandable.
3. Confirm incomplete uploads are not shown as ready.
4. Confirm retry works.
5. Confirm no secret appears in the UI or logs.

---

## 28. Troubleshooting

### Runtime status says all bindings are false

Check:

1. The variables were added to the correct Worker.
2. They were added to the correct deployment environment.
3. The Worker was redeployed.
4. The names are exact.
5. You are opening the current Worker URL.

Expected names:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

The current server code also accepts the existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` names for compatibility, but server secrets should use the non-`VITE_` names.

### Invitation says developer access is required

Verify the authenticated user's membership:

```sql
select
  u.email,
  m.role
from auth.users u
join public.archive_memberships m on m.user_id = u.id
where u.email = 'OWNER_EMAIL@example.com';
```

The role must be `developer`.

### Invitation says session expired

1. Sign out.
2. Close the tab.
3. Open the website again.
4. Sign in.
5. Try again.

### Invitation email arrives but link fails

Check Supabase:

- Site URL.
- Redirect URLs.
- Email template link.
- Final domain.

### Video compresses but does not appear in the gallery

Check:

- Completion endpoint response.
- `archive_items.status`.
- `archive_media_objects` rows.
- Object existence in storage.
- Browser network requests.
- Worker logs.

### Playback fails but download works

The playback object may have:

- Wrong content type.
- Incompatible codec.
- Missing fast-start metadata.
- An expired signed URL.
- Incorrect CORS configuration.

### Download fails but playback works

The original media object may be:

- Missing.
- Stored under the wrong key.
- Not authorized for the current user.
- Given an expired signed URL.
- Missing a correct content-disposition filename.

### R2 works but B2 does not

Check:

- B2 key ID.
- B2 application key.
- Bucket name.
- Endpoint.
- Region.
- S3-compatible signature settings.
- Clock differences if request signatures are used.

### The site works locally but not on Cloudflare

Local development can read `.env` or process variables that are absent in Workers. Check the deployed Worker bindings and redeploy after changing them.

### Lint fails on line endings

Format the specific file:

```bash
pnpm exec prettier --write src/routes/login.tsx
pnpm lint
```

### Build has a large chunk warning

This is not necessarily a failure. Later improvements can:

- Lazy-load the developer dashboard.
- Lazy-load FFmpeg.
- Lazy-load the cinematic player.
- Split large Radix or chart dependencies.

Do not optimize before the product flow works correctly.

---

## 29. Useful commands

### Start development

```bash
pnpm dev
```

### Run tests

```bash
pnpm test
```

### Run lint

```bash
pnpm lint
```

### Format one file

```bash
pnpm exec prettier --write path/to/file.tsx
```

### Build production output

```bash
pnpm build
```

### Check Git state

```bash
git status
git log --oneline -10
```

### Inspect repository files

```bash
git ls-files
```

### Check the live Worker diagnostic

```bash
curl -sS https://oceanic-edit-vault.calebasefa455.workers.dev/api/runtime-status
```

### Deploy with Wrangler

```bash
npx wrangler login
npx wrangler deploy
```

### Verify a route responds

```bash
curl -I https://oceanic-edit-vault.calebasefa455.workers.dev/login
curl -I https://oceanic-edit-vault.calebasefa455.workers.dev/
```

---

## 30. Final launch checklist

### Product

- [ ] Website has a final domain.
- [ ] Login works.
- [ ] Logout works.
- [ ] Email change works.
- [ ] Password change works.
- [ ] Invitations work.
- [ ] Invitation acceptance works.
- [ ] Viewer role works.
- [ ] Editor role works.
- [ ] Developer role works.
- [ ] Upload works.
- [ ] Compression works.
- [ ] Original is preserved.
- [ ] Playback derivative is created.
- [ ] Thumbnail is created.
- [ ] Real playback works.
- [ ] Original-quality download works.
- [ ] Gallery uses real database records.
- [ ] Favorites persist if required.
- [ ] Storage metrics are live.
- [ ] R2 integration works.
- [ ] B2 integration works.
- [ ] Fallback behavior works.
- [ ] Cat backdoor remains visually present.
- [ ] Cat backdoor is protected by the developer role.
- [ ] `/admin` is protected.

### Security

- [ ] No service-role key is committed.
- [ ] No R2 secret is committed.
- [ ] No B2 secret is committed.
- [ ] Private buckets are used.
- [ ] Presigned URLs expire.
- [ ] Server checks every sensitive request.
- [ ] RLS is enabled.
- [ ] Database backup exists.
- [ ] Logs contain no secrets.

### Quality

- [ ] `pnpm lint` passes.
- [ ] `pnpm test` passes.
- [ ] `pnpm build` passes.
- [ ] Desktop browser test passes.
- [ ] Mobile browser test passes.
- [ ] Upload failure test passes.
- [ ] Provider fallback test passes.
- [ ] Clean-browser login test passes.
- [ ] Final domain links work.

### Gift preparation

- [ ] Remove test users that should not remain.
- [ ] Remove test archive items.
- [ ] Remove test invitations.
- [ ] Confirm the owner account is a developer.
- [ ] Confirm the recipient's intended account/role.
- [ ] Confirm storage limits and notifications.
- [ ] Confirm backups.
- [ ] Prepare a short welcome message.
- [ ] Share only the final website URL.
- [ ] Do not share secrets.
- [ ] Keep an emergency owner/admin recovery method private.

---

## Definition of done

The website is ready to be gifted when a new person can open the final URL, receive or use an invitation, sign in, understand the interface without assistance, upload or view the appropriate media, play a real video, download the untouched original, manage the intended account settings, and never encounter a placeholder metric or fake action.

The final standard is:

> Beautiful on the surface, real underneath, private by default, and recoverable when something goes wrong.
