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

```text
She uploads a 100 MB video
        ↓
The website compresses it carefully
        ↓
Only the compressed version is stored
        ↓
The compressed version is used for website playback
        ↓
The same compressed version is used for download
```

The compressed file might be:

- 20 MB.
- 35 MB.
- 50 MB.
- Another size that keeps the quality looking good.

We will **not force every video to become exactly 20 MB** if doing that makes it look bad.

The compressed file must keep:

- The same width and height.
- The same vertical or horizontal direction.
- The same shape/proportions.
- Approximately the same length.
- Working audio and video together.
- Good visual quality.

The original upload is **not stored** in this compressed-only design. This is how the project saves the most storage space.

---

# Your complete job

You have six jobs:

1. Confirm the correct Supabase project.
2. Set up the Supabase database.
3. Make your account the developer account.
4. Confirm the Cloudflare Worker settings.
5. Create the private storage buckets.
6. Tell me when you are finished.

That is all you need to do before I continue.

---

# Part 1 — Get ready

## Step 1: Open a private notes file

On your computer, open a private note or password manager entry called:

```text
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

```text
OWNER_EMAIL = your real owner email address
```

Use the exact email address, including spelling and punctuation.

## Step 3: Keep these browser tabs open

Open these websites in separate tabs:

1. [Supabase](https://supabase.com/dashboard)
2. [Cloudflare](https://dash.cloudflare.com/)
3. [Backblaze](https://secure.backblaze.com/user_signin.htm)
4. [GitHub repository](https://github.com/cabey199/oceanic-edit-vault)

If a website asks you to log in, log in using your own account.

---

# Part 2 — Supabase setup

Supabase is where the website keeps user accounts, invitations, permissions, and video information.

## Step 4: Open the correct Supabase project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard).
2. Look at the list of projects.
3. Find the project currently used by Oceanic Edit Vault.
4. Click that project.
5. Wait until the project dashboard opens.

Do not create a new Supabase project unless I specifically tell you to.

### How to know you are in the correct project

The project should be the one already connected to the website. If you see more than one possible project and you are unsure, stop and ask me before changing anything.

## Step 5: Copy the Supabase project URL privately

1. In the Supabase project, look for **Project Settings**.
2. Click **Project Settings**.
3. Click **API**.
4. Find **Project URL**.
5. Copy it into your private notes.
6. Do not paste it into this chat.

The URL usually looks similar to:

```text
https://something.supabase.co
```

The URL itself is not the most sensitive value, but keep it private for now.

## Step 6: Copy the public anon key privately

Stay on the Supabase **API** settings page.

1. Find the key named **Publishable key** or **anon public key**.
2. Copy it into your private notes.
3. Do not copy the **service_role** key into chat.
4. Do not put any key into a screenshot.

If Supabase shows both a publishable key and a secret/service-role key, use only the public/publishable key when a public key is requested.

## Step 7: Make a database backup if the option is available

1. In Supabase, open **Database**.
2. Look for **Backups**.
3. If you see a backup option, confirm that a recent backup exists.
4. If you can create a backup, create one now.
5. Wait until it finishes.

If your Supabase plan does not show backups, do not worry. Continue to the next step and tell me that backups were not available.

## Step 8: Open the SQL Editor

1. In the left side of Supabase, find **SQL Editor**.
2. Click **SQL Editor**.
3. Click **New query**.
4. Leave this tab open.

## Step 9: Get the database migration from GitHub

1. Open the GitHub repository:
   [oceanic-edit-vault](https://github.com/cabey199/oceanic-edit-vault)
2. Click the `supabase` folder.
3. Click the `migrations` folder.
4. Click the file named:

```text
20261006000000_archive_foundation.sql
```

5. Click the copy/raw button, or select the file contents.
6. Copy all of the SQL text.

Copy from the first line to the last line. Do not copy only part of the file.

## Step 10: Run the migration

1. Return to the Supabase SQL Editor tab.
2. Paste the SQL text into the blank query.
3. Look through it once to make sure text appears in the editor.
4. Click **Run**.
5. Wait for the result.

### If it says success

Continue to Step 11.

### If it shows an error

Do not keep clicking Run repeatedly.

1. Copy only the error message.
2. Do not copy secret values.
3. Tell me:

```text
The Supabase migration showed an error.
```

4. Include the error text if it does not contain a secret.

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
2. You should see four table names.
3. The names should include:

```text
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
2. Find the row containing your owner email.
3. Confirm that the email is exactly yours.
4. Keep the results page open.

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
2. Click **Run**.
3. Wait for success.

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
2. Look at the `role` column.
3. It must say:

```text
developer
```

If it says `developer`, continue.

If it says something else, stop and tell me what it says.

---

# Part 4 — Confirm the Cloudflare Worker settings

Cloudflare is where the live website runs.

## Step 15: Open the Worker

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Log in.
3. Click **Workers & Pages**.
4. Find the Worker for Oceanic Edit Vault.
5. Click it.

The Worker URL currently used for checking is:

```text
https://oceanic-edit-vault.calebasefa455.workers.dev/api/runtime-status
```

## Step 16: Check the Worker variables

1. Inside the Worker, click **Settings**.
2. Click **Variables and Secrets**.
3. Look for these names:

```text
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

```text
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
2. Check the spelling of the variable name.
3. Check that the variable is on the correct Worker.
4. Check that it is configured for the live/production environment.
5. Redeploy the Worker using the Cloudflare dashboard if Cloudflare shows a redeploy button.
6. Open the status URL again.

If it still says false, tell me which value is false. Do not send the value of the secret.

---

# Part 5 — Create the private R2 bucket

R2 is where the compressed videos and thumbnails will be stored.

## Step 18: Open R2

1. In Cloudflare, click **R2 Object Storage**.
2. Click **Create bucket**.

## Step 19: Name the bucket

Use this name if Cloudflare accepts it:

```text
oceanic-edit-vault-media
```

If Cloudflare says the name is already taken, add a short number to the end, for example:

```text
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
2. Allow reading objects.
3. Allow writing objects.
4. Allow deleting objects only if Cloudflare requires it for cleanup.
5. Do not choose account-wide access if bucket-only access is available.
6. Create the key.
7. Save the key in your password manager or private notes.
8. Do not send the key to me.

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
2. Continue to Part 7.
3. Tell me that you are launching with R2 first.

This is completely acceptable. B2 can be added after the first working upload.

### Backup option — create B2 now

Choose this if you have enough time.

## Step 23: Create a B2 bucket

1. Go to [Backblaze](https://secure.backblaze.com/user_signin.htm).
2. Log in.
3. Click **Buckets**.
4. Click **Create a Bucket**.
5. Name it:

```text
oceanic-edit-vault-backup
```

6. If the name is taken, add a number.
7. Set the bucket to **Private**.
8. Click **Create Bucket**.
9. Write the exact bucket name in your private notes.

## Step 24: Create a restricted B2 application key

1. In Backblaze, open **Application Keys**.
2. Click **Add a New Application Key**.
3. Give it a name such as:

```text
oceanic-edit-vault-worker
```

4. Limit it to the new bucket if Backblaze offers that option.
5. Allow reading files.
6. Allow writing files.
7. Allow deleting files only if needed.
8. Create the key.
9. Save the key ID and application key privately.
10. Do not send them to me.

You may not be able to view the application key again later. Save it immediately in your password manager.

---

# Part 7 — Supabase login settings

Do this after the Worker and storage setup.

## Step 25: Find the current website address

Use the current live website address you were given, or use:

```text
https://oceanic-edit-vault.calebasefa455.workers.dev
```

If we later choose a custom domain, we will add that domain too.

## Step 26: Add the website URL to Supabase

1. Return to Supabase.
2. Open the project.
3. Click **Authentication**.
4. Click **URL Configuration**.
5. Find **Site URL**.
6. Enter the live website address.
7. Find **Redirect URLs**.
8. Add the live website address followed by `/login`.

For the temporary Worker address, add:

```text
https://oceanic-edit-vault.calebasefa455.workers.dev/login
```

9. If you will test locally, add this too:

```text
http://localhost:5173/login
```

10. Click **Save**.

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

```text
My setup is complete. Supabase migration is done, my account is developer, the Worker status values are true, the private R2 bucket is ready, and I am [using R2 first / also ready with B2].
```

Replace the bracketed part with either:

```text
using R2 first
```

or:

```text
also ready with B2
```

If something failed, send this instead:

```text
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
2. Create a quality-controlled compressed file.
3. Check its width and height.
4. Check its duration.
5. Check that audio is still present when expected.
6. Upload only the compressed file and thumbnail.
7. Delete temporary browser data when finished.

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
2. Confirm you see the login page.
3. Sign in with your owner account.

## Step C: Test one video

1. Open the upload button.
2. Choose a test video.
3. Wait for compression to finish.
4. Watch the size information.
5. Wait for the upload to finish.
6. Confirm the video appears in the gallery.
7. Open the video.
8. Press play.
9. Confirm the picture looks good.
10. Confirm the sound works.
11. Confirm the length looks correct.
12. Confirm the video is still vertical or horizontal in the correct direction.
13. Download it.
14. Open the downloaded file.
15. Confirm it looks the same as the website playback.

## Step D: Decide whether the quality is acceptable

Ask yourself:

- Does it look clear enough on the computer?
- Is the text readable?
- Does fast movement look clean enough?
- Is the video still the correct shape?
- Is the sound synchronized?
- Does it still look good on the phone?

If the answer is yes, tell me:

```text
The test video quality is acceptable.
```

If the answer is no, tell me exactly what looks wrong:

```text
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
2. Send a test invitation.
3. Open the invitation email.
4. Click the invitation link.
5. Create or confirm the test account.
6. Confirm the invited account can access the correct pages.
7. Confirm the invited account cannot access developer controls.

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
2. Open the invitation area.
3. Enter the recipient’s email address carefully.
4. Choose `viewer` or `editor`.
5. Check the spelling one more time.
6. Send the invitation.

## Step 4: Prepare the birthday message

Use something simple such as:

```text
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

```text
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

# Your only immediate action

Start with **Part 2 — Supabase setup**.

When you finish Part 8, send me:

```text
My setup is complete. Supabase migration is done, my account is developer, the Worker status values are true, the private R2 bucket is ready, and I am using R2 first.
```

Then I will take over the technical build and move us toward the birthday launch.
