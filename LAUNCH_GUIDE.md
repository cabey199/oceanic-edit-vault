# Oceanic Edit Vault — Your Simple Setup Guide

## Read this first

This guide contains **only the things you need to do**.

You do **not** need to:

- Write code.

- Edit TypeScript files.

- Understand Cloudflare Workers.

- Understand FFmpeg.

- Understand databases.

- Send me passwords or secret keys.

- Change anything in GitHub unless I specifically tell you to.

Your job is to prepare the accounts and click the correct buttons. After you finish the steps, tell me the short message shown at the end. I will do the code, connect the services, test the website, and tell you what to do next.

> **Never send secret values in chat.** If a page shows a password, secret key, application key, or token, keep it private.

---

# What we are building

The website will work like this:

```
She uploads a 100 MB video
        ↓
The untouched original is stored privately in R2
        ↓
The same private R2 file is used for playback and download
```

The stored R2 file keeps its original quality:

- 20 MB.

- 35 MB.

- 50 MB.

- Another size that keeps the quality looking good.

The compressed file must keep:

- The same width and height.

- The same vertical or horizontal direction.

- The same shape/proportions.

- Approximately the same length.

- Working audio and video together.

- Good visual quality.

The original upload **is stored privately in R2** and is used for both playback and downloads.

---

# Your complete job

You have six jobs:

1. Confirm the correct Supabase project.

1. Set up the Supabase database.

1. Make your account the developer account.

1. Confirm the Cloudflare Worker settings.

1. Create the private storage buckets.

1. Tell me when you are finished.

That is all you need to do before I continue.

---

# Part 1 — Get ready

## Step 1: Open a private notes file

On your computer, open a private note or password manager entry called:

```
Oceanic Edit Vault setup
```

You may write down:

- The name of your Supabase project.

- The name of your Cloudflare Worker.

- The name of your R2 bucket.

- The name of your B2 bucket.

Do **not** put secret keys in this guide or in chat.

## Step 2: Make sure you know your owner email

You need the email address that will own the website.

Write it down privately:

```
OWNER_EMAIL = your real owner email address
```

Use the exact email address, including spelling and punctuation.

## Step 3: Keep these browser tabs open

Open these websites in separate tabs:

1. [Supabase](https://supabase.com/dashboard)

1. [Cloudflare](https://dash.cloudflare.com/)

1. [Backblaze](https://secure.backblaze.com/user_signin.htm)

1. [GitHub repository](https://github.com/cabey199/oceanic-edit-vault)

If a website asks you to log in, log in using your own account.

---

# Part 2 — Supabase setup

Supabase is where the website keeps user accounts, invitations, permissions, and video information.

## Step 4: Open the correct Supabase project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard).

1. Look at the list of projects.

1. Find the project currently used by Oceanic Edit Vault.

1. Click that project.

1. Wait until the project dashboard opens.

Do not create a new Supabase project unless I specifically tell you to.

### How to know you are in the correct project

The project should be the one already connected to the website. If you see more than one possible project and you are unsure, stop and ask me before changing anything.

## Step 5: Copy the Supabase project URL privately

1. In the Supabase project, look for **Project Settings**.

1. Click **Project Settings**.

1. Click **API**.

1. Find **Project URL**.

1. Copy it into your private notes.

1. Do not paste it into this chat.

The URL usually looks similar to:

```
https://something.supabase.co
```

The URL itself is not the most sensitive value, but keep it private for now.

## Step 6: Copy the public anon key privately

Stay on the Supabase **API** settings page.

1. Find the key named **Publishable key** or **anon public key**.

1. Copy it into your private notes.

1. Do not copy the **service_role** key into chat.

1. Do not put any key into a screenshot.

If Supabase shows both a publishable key and a secret/service-role key, use only the public/publishable key when a public key is requested.

## Step 7: Make a database backup if the option is available

1. In Supabase, open **Database**.

1. Look for **Backups**.

1. If you see a backup option, confirm that a recent backup exists.

1. If you can create a backup, create one now.

1. Wait until it finishes.

If your Supabase plan does not show backups, do not worry. Continue to the next step and tell me that backups were not available.

## Step 8: Open the SQL Editor

1. In the left side of Supabase, find **SQL Editor**.

1. Click **SQL Editor**.

1. Click **New query**.

1. Leave this tab open.

## Step 9: Get the database migration from GitHub

1. Open the GitHub repository:
   [oceanic-edit-vault](https://github.com/cabey199/oceanic-edit-vault)

1. Click the `supabase` folder.

1. Click the `migrations` folder.

1. Click the file named:

```
20261006000000_archive_foundation.sql
```

1. Click the copy/raw button, or select the file contents.

1. Copy all of the SQL text.

Copy from the first line to the last line. Do not copy only part of the file.

## Step 10: Run the migration

1. Return to the Supabase SQL Editor tab.

1. Paste the SQL text into the blank query.

1. Look through it once to make sure text appears in the editor.

1. Click **Run**.

1. Wait for the result.

### If it says success

Continue to Step 11.

### If it shows an error

Do not keep clicking Run repeatedly.

1. Copy only the error message.

1. Do not copy secret values.

1. Tell me:

```
The Supabase migration showed an error.
```

1. Include the error text if it does not contain a secret.

## Step 11: Check that the new tables exist

In the Supabase SQL Editor, open a new query and paste this:

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

1. Click **Run**.

1. You should see four table names.

1. The names should include:

```
archive_invitations
archive_items
archive_media_objects
archive_memberships
```

If you see all four, continue.

If one is missing, stop and tell me which one is missing.

---

# Part 3 — Make yourself the developer

Your account must have the `developer` role before the control panel and invitations can work.

## Step 12: Find your user ID

In Supabase SQL Editor, open a new query and paste this:

```sql
select id, email, created_at
from auth.users
order by created_at;
```

1. Click **Run**.

1. Find the row containing your owner email.

1. Confirm that the email is exactly yours.

1. Keep the results page open.

You do not need to copy the user ID into chat.

## Step 13: Set your role to developer

Open a new SQL Editor query.

Replace only the email inside the quotation marks with your exact owner email:

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

Example only:

```sql
where email = 'your-email@example.com'
```

Do not use the example email. Use your real owner email.

1. Replace the email.

1. Click **Run**.

1. Wait for success.

## Step 14: Check your role

Open a new query and paste this:

```sql
select
  u.email,
  m.role
from auth.users u
join public.archive_memberships m on m.user_id = u.id
where u.email = 'OWNER_EMAIL@example.com';
```

Replace the email with your exact owner email.

1. Click **Run**.

1. Look at the `role` column.

1. It must say:

```
developer
```

If it says `developer`, continue.

If it says something else, stop and tell me what it says.

---

# Part 4 — Confirm the Cloudflare Worker settings

Cloudflare is where the live website runs.

## Step 15: Open the Worker

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/).

1. Log in.

1. Click **Workers & Pages**.

1. Find the Worker for Oceanic Edit Vault.

1. Click it.

The Worker URL currently used for checking is:

```
https://oceanic-edit-vault.calebasefa455.workers.dev/api/runtime-status
```

## Step 16: Check the Worker variables

1. Inside the Worker, click **Settings**.

1. Click **Variables and Secrets**.

1. Look for these names:

```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

You may also see older names beginning with `VITE_`. That is okay if the website already uses them, but the server-side names above are preferred.

### Important

- `SUPABASE_SERVICE_ROLE_KEY` must be a **secret**.

- Do not click to reveal it unless necessary.

- Do not copy it.

- Do not send it to me.

- Do not put it in GitHub.

## Step 17: Check the live status page

Open this exact address in a new browser tab:

```
https://oceanic-edit-vault.calebasefa455.workers.dev/api/runtime-status
```

You should see JSON containing values like:

```json
{
  "hasSupabaseUrl": true,
  "hasAnonKey": true,
  "hasServiceRoleKey": true
}
```

All three values must say `true`.

### If all three say true

Continue to Part 5.

### If one says false

1. Return to the Worker settings.

1. Check the spelling of the variable name.

1. Check that the variable is on the correct Worker.

1. Check that it is configured for the live/production environment.

1. Redeploy the Worker using the Cloudflare dashboard if Cloudflare shows a redeploy button.

1. Open the status URL again.

If it still says false, tell me which value is false. Do not send the value of the secret.

---

# Part 5 — Create the private R2 bucket

R2 is where the compressed videos and thumbnails will be stored.

## Step 18: Open R2

1. In Cloudflare, click **R2 Object Storage**.

1. Click **Create bucket**.

## Step 19: Name the bucket

Use this name if Cloudflare accepts it:

```
oceanic-edit-vault-media
```

If Cloudflare says the name is already taken, add a short number to the end, for example:

```
oceanic-edit-vault-media-01
```

Write the exact bucket name in your private notes.

## Step 20: Keep the bucket private

When Cloudflare asks whether the bucket should be public:

- Choose **private**.

- Do not enable public access.

- Do not add a public custom domain for the bucket.

The website will use temporary secure links instead.

## Step 21: Create restricted R2 access

If Cloudflare asks you to create an API token or R2 key:

1. Choose access limited to the new bucket.

1. Allow reading objects.

1. Allow writing objects.

1. Allow deleting objects only if Cloudflare requires it for cleanup.

1. Do not choose account-wide access if bucket-only access is available.

1. Create the key.

1. Save the key in your password manager or private notes.

1. Do not send the key to me.

If you are unsure which permission button to select, stop and send me a screenshot with all secret values hidden.

## Step 22: Confirm the bucket exists

You should now see the bucket in your R2 bucket list.

Confirm:

- The bucket name is correct.

- The bucket is private.

- It is empty or contains no important files yet.

Do not upload personal videos manually into the bucket. The website will upload them after I connect the code.

---

# Part 6 — Backblaze B2 setup

B2 is optional for the first birthday launch. R2 is the fastest path.

## Choose one option now

### Fastest option — postpone B2

Choose this if the birthday is very soon.

1. Do not create the B2 bucket yet.

1. Continue to Part 7.

1. Tell me that you are launching with R2 first.

This is completely acceptable. B2 can be added after the first working upload.

### Backup option — create B2 now

Choose this if you have enough time.

## Step 23: Create a B2 bucket

1. Go to [Backblaze](https://secure.backblaze.com/user_signin.htm).

1. Log in.

1. Click **Buckets**.

1. Click **Create a Bucket**.

1. Name it:

```
oceanic-edit-vault-backup
```

1. If the name is taken, add a number.

1. Set the bucket to **Private**.

1. Click **Create Bucket**.

1. Write the exact bucket name in your private notes.

## Step 24: Create a restricted B2 application key

1. In Backblaze, open **Application Keys**.

1. Click **Add a New Application Key**.

1. Give it a name such as:

```
oceanic-edit-vault-worker
```

1. Limit it to the new bucket if Backblaze offers that option.

1. Allow reading files.

1. Allow writing files.

1. Allow deleting files only if needed.

1. Create the key.

1. Save the key ID and application key privately.

1. Do not send them to me.

You may not be able to view the application key again later. Save it immediately in your password manager.

---

# Part 7 — Supabase login settings

Do this after the Worker and storage setup.

## Step 25: Find the current website address

Use the current live website address you were given, or use:

```
https://oceanic-edit-vault.calebasefa455.workers.dev
```

If we later choose a custom domain, we will add that domain too.

## Step 26: Add the website URL to Supabase

1. Return to Supabase.

1. Open the project.

1. Click **Authentication**.

1. Click **URL Configuration**.

1. Find **Site URL**.

1. Enter the live website address.

1. Find **Redirect URLs**.

1. Add the live website address followed by `/login`.

For the temporary Worker address, add:

```
https://oceanic-edit-vault.calebasefa455.workers.dev/login
```

1. If you will test locally, add this too:

```
http://localhost:5173/login
```

1. Click **Save**.

Do not add random websites. Only add addresses that belong to this project.

---

# Part 8 — Stop here and tell me

You are finished with your part when all of these are true:

- [ ] You opened the correct Supabase project.

- [ ] The database migration ran successfully.

- [ ] All four archive tables exist.

- [ ] Your owner account has the `developer` role.

- [ ] The Worker status page shows `true` for the required Supabase values.

- [ ] A private R2 bucket exists.

- [ ] You decided whether B2 is postponed or ready.

- [ ] Supabase login URLs are configured.

- [ ] No secret was sent in chat.

## Send me this exact message

If everything above is complete, send:

```
My setup is complete. Supabase migration is done, my account is developer, the Worker status values are true, the private R2 bucket is ready, and I am [using R2 first / also ready with B2].
```

Replace the bracketed part with either:

```
using R2 first
```

or:

```
also ready with B2
```

If something failed, send this instead:

```
I am stuck at Part __, Step __. The message says: __.
```

Do not include secret keys.

---

# What I will do after you finish this guide

After you send the completion message, I will do the technical work in this order:

## 1. Connect the upload button

I will connect the website’s upload drawer to the compressor and storage system.

## 2. Store only the compressed file

The website will:

1. Temporarily read the selected video in the browser.

1. Create a quality-controlled compressed file.

1. Check its width and height.

1. Check its duration.

1. Check that audio is still present when expected.

1. Upload only the compressed file and thumbnail.

1. Delete temporary browser data when finished.

## 3. Connect the gallery

I will replace the sample videos with real database records.

## 4. Connect playback

I will replace the fake player with a real video player using the stored compressed file.

## 5. Connect downloads

The Download button will download the same compressed file used for playback.

## 6. Connect storage totals

The control panel will show the actual amount of compressed media and thumbnail storage being used.

## 7. Connect invitations

I will finish the viewer/editor invitation and acceptance flow.

## 8. Test the quality

We will test:

- A small video.

- A roughly 100 MB video.

- A vertical video.

- A horizontal video.

- A dark video.

- A fast-moving video.

- A video with text.

- A video with audio.

The compressed file must not look visibly botched.

## 9. Test the phone

We will test the website on a phone after the desktop version works.

## 10. Deploy the finished version

I will run the final checks, deploy the code, and give you the exact website address to test.

---

# What you will do after I finish the technical work

When I tell you the website is ready for your test, follow these steps.

## Step A: Open a private browser window

On your computer:

- Chrome: press `Ctrl + Shift + N`.

- Edge: press `Ctrl + Shift + N`.

- Firefox: press `Ctrl + Shift + P`.

- Safari: choose **File → New Private Window**.

## Step B: Open the website

1. Paste the final website address into the private window.

1. Confirm you see the login page.

1. Sign in with your owner account.

## Step C: Test one video

1. Open the upload button.

1. Choose a test video.

1. Wait for compression to finish.

1. Watch the size information.

1. Wait for the upload to finish.

1. Confirm the video appears in the gallery.

1. Open the video.

1. Press play.

1. Confirm the picture looks good.

1. Confirm the sound works.

1. Confirm the length looks correct.

1. Confirm the video is still vertical or horizontal in the correct direction.

1. Download it.

1. Open the downloaded file.

1. Confirm it looks the same as the website playback.

## Step D: Decide whether the quality is acceptable

Ask yourself:

- Does it look clear enough on the computer?

- Is the text readable?

- Does fast movement look clean enough?

- Is the video still the correct shape?

- Is the sound synchronized?

- Does it still look good on the phone?

If the answer is yes, tell me:

```
The test video quality is acceptable.
```

If the answer is no, tell me exactly what looks wrong:

```
The test video quality is not acceptable. The problem is: __.
```

We will improve the quality settings before gifting the website.

## Step E: Test the control panel

Check that you can:

- Change your email.

- Change your password.

- Sign out.

- Sign back in.

- See storage usage.

- Open the Cat/developer area.

- Send a test invitation.

## Step F: Test the invited person

After I tell you invitations are ready:

1. Use a second email address that you control.

1. Send a test invitation.

1. Open the invitation email.

1. Click the invitation link.

1. Create or confirm the test account.

1. Confirm the invited account can access the correct pages.

1. Confirm the invited account cannot access developer controls.

Do not invite the birthday recipient until the test invitation works.

---

# Final birthday steps

Do these only after the test is successful.

## Step 1: Remove test items

Tell me which test videos and test accounts should be removed. I will help clean them up safely.

## Step 2: Choose the recipient’s role

Choose one:

- **Viewer** — can watch and download the compressed files, but cannot upload or manage the archive.

- **Editor** — can watch, download, and upload, but cannot manage developer settings.

Do not give the recipient `developer` unless you deliberately want them to control the entire system.

## Step 3: Send the real invitation

1. Open the owner control panel.

1. Open the invitation area.

1. Enter the recipient’s email address carefully.

1. Choose `viewer` or `editor`.

1. Check the spelling one more time.

1. Send the invitation.

## Step 4: Prepare the birthday message

Use something simple such as:

```
I made you a private place for your edits and memories.
Use the invitation email to enter.
Happy birthday.
```

## Step 5: Give her the link

Send:

- The birthday message.

- The invitation email instruction.

- The final website link.

Do not send:

- Supabase links.

- Cloudflare links.

- R2 keys.

- B2 keys.

- Passwords.

- Developer secrets.

---

# If you get confused

Do not guess. Do not delete anything. Do not keep clicking buttons randomly.

Send me:

```
I am at Part __, Step __.
I see: __.
The button or message says: __.
```

If you send a screenshot, cover or blur:

- Passwords.

- Secret keys.

- Application keys.

- Tokens.

- Personal emails if you prefer.

---

# Current playback requirement

The free R2 setup stores original files and plays them directly. For reliable playback across phones and computers, upload H.264 video with AAC audio. HEVC/H.265 files may not play on every phone or browser.
