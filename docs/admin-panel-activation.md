# Admin Panel, Activation Runbook

How to take the admin panel from "frontend works on a mock" to "real, secure,
persistent" on Supabase project **`zrrbajdkptnzzurzlfiy`**.

Do the steps **in order**, later steps depend on earlier ones.
Project dashboard root: https://supabase.com/dashboard/project/zrrbajdkptnzzurzlfiy

---

## Step 0, Prerequisites (2 min)

- You can log in to the Supabase dashboard for project `zrrbajdkptnzzurzlfiy`.
- A terminal (PowerShell) open at the repo root
  `c:\Users\Dath\OneDrive\Desktop\DATHSTEL`.
- Node/pnpm already work here (they do, the app runs).

---

## Step 1, Copy the API keys (2 min)

1. Open: https://supabase.com/dashboard/project/zrrbajdkptnzzurzlfiy/settings/api
2. You need **two** values from this page:
   - **Project URL**, should be `https://zrrbajdkptnzzurzlfiy.supabase.co`
     (we already know it; just confirm it matches).
   - **anon / public** key (also labelled "Publishable"). A long string. Safe
     to expose in the browser, it is RLS-protected.
   - **service_role** key (also labelled "Secret"). Click "Reveal". **This is
     a master key, never share it, never put it in client code.**
3. Keep this tab open / paste the two keys somewhere temporary. You'll put them
   in `.env.local` and Vercel in Step 7.

> If the page shows the newer "API Keys" style (publishable `sb_publishable_…`
> / secret `sb_secret_…`) instead of anon/service_role JWTs, that's fine, use
> the **publishable** key where this runbook says "anon key" and the **secret**
> key where it says "service_role key".

---

## Step 2, Get the database password (1 min)

`supabase link` (next step) needs the Postgres password.

1. Open: https://supabase.com/dashboard/project/zrrbajdkptnzzurzlfiy/settings/database
2. Under **Database password**: if you remember it, use it. If not, click
   **Reset database password**, set a new one, and copy it. (Resetting is safe,
   nothing else uses this DB yet.)

---

## Step 3, Apply the database schema via the CLI (5 min)

The schema migration lives at
`apps/ds-site/supabase/migrations/20260519154207_admin_panel_init.sql`.
All `supabase` CLI commands must run **from `apps/ds-site`** (that's where the
`supabase/` folder is).

In PowerShell, from the repo root:

```powershell
cd apps\ds-site

# 3a. Authenticate the CLI.
#     EASIEST: create a token at
#     https://supabase.com/dashboard/account/tokens  (name it e.g. "cli"),
#     copy it, then:
npx supabase login --token YOUR_ACCESS_TOKEN
#     (or just `npx supabase login` and press Enter to use the browser flow)

# 3b. Link this repo's supabase/ folder to the live project.
npx supabase link --project-ref zrrbajdkptnzzurzlfiy
#     When prompted "Enter your database password", paste the password
#     from Step 2.

# 3c. Push the migration to the live database.
npx supabase db push
#     It lists 20260519154207_admin_panel_init.sql and asks to confirm.
#     Type Y and press Enter.
```

**Expected success output** ends with something like
`Applying migration 20260519154207_admin_panel_init.sql... Finished
supabase db push.`

This creates: the `projects`, `project_activity`, `admin_users` tables, the
three enums, the `is_admin()` / `set_updated_at()` functions, and all RLS
policies.

**Verify** it worked: open
https://supabase.com/dashboard/project/zrrbajdkptnzzurzlfiy/editor, you should
see the three new tables, all showing "RLS enabled".

> Troubleshooting: if `db push` complains about a *migration history mismatch*
> (only happens if this project already had Supabase migrations), stop and tell
> me the exact message, don't force it.

---

## Step 4, Lock down Auth settings (3 min)

1. **Disable public sign-ups** (only you + Stelios should ever have accounts):
   open https://supabase.com/dashboard/project/zrrbajdkptnzzurzlfiy/auth/providers
   → click **Email** → turn **OFF** "Allow new users to sign up" → Save.
   (Some dashboards show this as "User Signups" under
   Authentication → Settings, same thing, turn it off.)
2. **Rate limiting** (security finding #10): open
   https://supabase.com/dashboard/project/zrrbajdkptnzzurzlfiy/auth/rate-limits,
   Supabase enforces login rate limits by default. Just confirm the
   "Sign in / Sign ups" and "Token refresh" limits are at sane non-zero
   defaults (the defaults are fine). This is what protects the login endpoint
   from brute force.

---

## Step 5, Create the two founder accounts (3 min)

1. Open https://supabase.com/dashboard/project/zrrbajdkptnzzurzlfiy/auth/users
2. Click **Add user → Create new user**.
   - Email: `dimo.atheneos@gmail.com`
   - Password: a strong password (save it in your password manager)
   - **Check "Auto Confirm User"** ✅ (critical, without this the account
     is unconfirmed and login will fail)
   - Create.
3. Repeat **Add user** for Stelios (his email + a strong password +
   Auto Confirm).
4. For each created user, click it and copy the **User UID** (a UUID like
   `8f3c…`). You need both UUIDs for Step 6.

---

## Step 6, Map usernames → accounts (2 min)

1. Open https://supabase.com/dashboard/project/zrrbajdkptnzzurzlfiy/sql/new
2. Paste this, replacing the two UUIDs with the ones from Step 5, then **Run**:

```sql
insert into public.admin_users (username, auth_user_id) values
  ('dimitris', 'PASTE-DIMITRIS-UID-HERE'),
  ('stelios',  'PASTE-STELIOS-UID-HERE');
```

3. Verify, run:

```sql
select username, auth_user_id from public.admin_users;
```

You should see exactly two rows. (You log in with the **username**
`dimitris` / `stelios`, the email stays internal.)

---

## Step 7, Set environment variables (5 min)

### 7a. Local (`apps/ds-site/.env.local`, already open in your editor)

Add these four lines (this file is gitignored, safe for secrets):

```
NEXT_PUBLIC_SUPABASE_URL=https://zrrbajdkptnzzurzlfiy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<the anon/publishable key from Step 1>
SUPABASE_SERVICE_ROLE_KEY=<the service_role/secret key from Step 1>
ADMIN_ALLOWED_EMAILS=dimo.atheneos@gmail.com,<stelios email>
```

`ADMIN_ALLOWED_EMAILS` is a comma-separated allowlist, only these emails can
pass the gate even with a valid session. Use the **exact** emails from Step 5.

### 7b. Vercel (production)

1. Vercel dashboard → the **ds-site** project → **Settings → Environment
   Variables**.
2. Add the same four variables. For each, tick **Production** (and Preview if
   you want it gated there too).
3. `SUPABASE_SERVICE_ROLE_KEY`, leave it a normal variable (NOT prefixed
   `NEXT_PUBLIC_`). Vercel keeps non-`NEXT_PUBLIC_` vars server-only; it is
   never sent to the browser. This is correct and required.
4. **Redeploy** (Deployments → ⋯ → Redeploy, or push a commit) so the new env
   takes effect.

---

## Step 8, Verify it's real and secure

### Local (tell me once Step 7a is done, I'll run this for you)

I restart the dev server with the new env and confirm:
- Logged out, visiting `/admin` → **redirected to `/admin/login`** (the gate
  is live; mock no longer in use).
- Login with `dimitris` + your password → dashboard loads from the **live DB**
  (it'll be empty, no seeded mock data; that's expected/correct).
- Create a project → refresh / restart server → it **persists** (real DB).
- Sign out → `/admin` redirects to login again.
- `/$ecretAnalytics/` → also requires the admin session.

### Production (after Step 7b redeploy)

Same checks against your live domain `https://www.ds2-consulting.com/admin`.

---

## Notes / out of scope

- This migration does **not** create the `visits` table that the
  pre-existing `$ecretAnalytics` page reads. If that page shows "Supabase data
  unavailable", its `visits` table needs creating separately, say the word and
  we'll add a migration for it.
- The first real login lands on an **empty** dashboard, the mock seed
  (MegaGym, Kallisto, etc.) was demo data only. You build the real list via
  "+ New project".

---

## Quick reference, the 4 env vars

| Variable | Value | Exposed to browser? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://zrrbajdkptnzzurzlfiy.supabase.co` | yes (safe) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon/publishable key | yes (RLS-protected) |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role/secret key | **NO, server only** |
| `ADMIN_ALLOWED_EMAILS` | `dimo.atheneos@gmail.com,<stelios>` | no |
