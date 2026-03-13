# RoamCompanion — Testing Guide

> Run these tests after completing all Supabase UI setup (SQL schema, RLS policies, storage buckets, seeding).
> Tests are organized by experience flow. Complete them in order — each flow builds on the previous.

---

## Prerequisites

Before starting, confirm:
- [ ] All 11 SQL blocks executed with zero errors in Supabase SQL Editor
- [ ] Auth trigger `on_auth_user_created` exists
- [ ] Three storage buckets created: `avatars` (public), `driver-images` (public), `driver-documents` (**private**)
- [ ] All RLS policies applied (Phases 1, 2, 4, 5, 6)
- [ ] `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `npm run dev` starts without errors

---

---

## Experience 1 — Driver Signup Stepper

### 1.1 — Account creation (Step 1)

**Test for:** New driver can create an account; profile row is auto-created with `role = 'guest'`

**How to test:**
1. Go to `http://localhost:3000/signup/driver`
2. Enter: Full Name `Test Driver`, Email `test@example.com`, Password `password123`
3. Click **Continue →**

**Expected outcome:**
- Advances to Step 2 (City selection)
- In Supabase Dashboard → **Authentication → Users**: new user `test@example.com` appears
- In **Table Editor → profiles**: row exists with `role = 'guest'`, `display_name = 'Test Driver'`
- In **Table Editor → driver_signup_progress**: row exists with `current_step = 1`

**Email confirmation flow (recommended for production):**

When **Confirm email** is enabled in Supabase:
1. After signing up, users see: "An email has been sent to confirm your email. Please follow the link in the email to continue onboarding."
2. User clicks the link in the email → redirected to `/auth/callback` → session is created → redirected to `/signup/driver` at Step 2.

**Required setup for email confirmation:**
- **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**: Add `http://localhost:3000/auth/callback` (local) and `https://yourdomain.com/auth/callback` (production).
- **Auth trigger** must create both `profiles` and `driver_signup_progress` — run the updated trigger from `ROAMCOMPANION_IMPLEMENTATION.md` Step 1.3 (it now includes `driver_signup_progress` insert).

**Troubleshooting — `driver_signup_progress` row missing:**

1. **Auth trigger** — The `handle_new_user` trigger must create both `profiles` and `driver_signup_progress` rows. In Supabase SQL Editor, run:
   ```sql
   select * from pg_trigger where tgname = 'on_auth_user_created';
   ```
   If empty, create the trigger per `ROAMCOMPANION_IMPLEMENTATION.md` Step 1.3. If you had an older version, re-run the trigger SQL to add the `driver_signup_progress` insert.

2. **Email confirmation ON** — With confirmation enabled, the client cannot insert (user isn't authenticated yet). The trigger creates the row. Ensure the updated trigger includes `driver_signup_progress`.

3. **Table exists** — In Table Editor, confirm `driver_signup_progress` exists and has columns `user_id`, `current_step`, etc.

4. **Check the error** — If you see "Progress save failed" after clicking Continue (when confirmation is OFF), the message will include the Supabase error.

---

### 1.2 — City selection (Step 2)

**Test for:** Driver profile row is created with correct `city_id`

**How to test:**
1. On Step 2, click **Tampa**
2. Click **Continue →**

**Expected outcome:**
- Advances to Step 3
- In **Table Editor → driver_profiles**: row exists with correct `city_id` matching Tampa's UUID
- `driver_signup_progress.current_step` updated to `2`

---

### 1.3 — Identity (Step 3)

**Test for:** Avatar uploads to `avatars` bucket; display name + bio saved to both tables

**How to test:**
1. Tap the avatar circle, select any image file from your device
2. Enter Display Name: `Carlos V.`
3. Enter Bio: `Tampa's friendliest driver`
4. Click **Continue →**

**Expected outcome:**
- Advances to Step 4
- In Supabase Dashboard → **Storage → avatars**: file exists at `{user_id}/avatar.{ext}`
- In **driver_profiles**: `display_name = 'Carlos V.'`, `avatar_url` = public storage URL, `bio` set
- In **profiles**: `display_name` and `avatar_url` also updated

**Troubleshooting — Avatar upload fails (RLS policy / 400):**

1. **"new row violates row-level security policy"** — The storage INSERT policy is blocking. Run in SQL Editor:

   ```sql
   drop policy if exists "avatars: authenticated upload own" on storage.objects;
   create policy "avatars: authenticated upload own"
   on storage.objects for insert to authenticated
   with check (
     bucket_id = 'avatars'
     and (storage.foldername(name))[1] = (select auth.uid()::text)
   );
   ```

2. **Upsert requires SELECT + UPDATE** — If using `upsert: true`, you also need SELECT and UPDATE policies. Ensure these exist (see ROAMCOMPANION_IMPLEMENTATION.md Step 1.5).

3. **Session not sent** — Confirm you're signed in when reaching Step 3. After email confirmation, the callback sets the session. If the session is missing (e.g. cookies blocked), RLS will fail.

4. **File format** — Bucket allows only `image/jpeg`, `image/png`, `image/webp`.
5. **File size** — Max 2 MB for avatars.
6. **Bucket public** — avatars bucket must be **public**.

### 1.4 — Vehicle & experience (Step 4 — optional)

**Test for:** Optional step can be skipped cleanly

**How to test (skip path):**
1. On Step 4, click **Skip for now** without selecting anything

**Expected outcome:**
- Advances to Step 5
- `driver_profiles.vehicle_type` remains `null`

**How to test (fill path):**
1. Restart signup with a different email
2. On Step 4, select **SUV**, enter years `3`, select **English** and **Spanish**
3. Click **Continue →**

**Expected outcome:**
- `driver_profiles.vehicle_type = 'suv'`, `years_driving = 3`, `languages = ['English', 'Spanish']`

---

### 1.5 — Page setup + slug availability (Step 5)

**Test for:** Slug uniqueness check works; hero image uploads; slug is saved

**How to test (taken slug):**
1. On Step 5, type a slug that already exists in `driver_profiles.public_url_slug` (check Table Editor)
2. After 500ms debounce, the field should show **✗ Taken** in red

**How to test (available slug):**
1. Type a unique slug: `carlosv-tampa`
2. After 500ms, should show **✓ Available** in green
3. Enter Headline: `Tampa's friendliest driver 🌴`
4. Upload a hero image
5. Enter Service Area: `Tampa Bay Area`
6. Click **Continue →**

**Expected outcome:**
- Advances to Step 6
- In **driver_profiles**: `public_url_slug = 'carlosv-tampa'`, `headline`, `hero_image_url`, `service_area` set
- In **Storage → driver-images**: hero image at `{user_id}/hero.{ext}`

---

### 1.6 — Tip links (Step 6 — optional)

**Test for:** Optional step can be skipped; tip handles saved when filled

**How to test:**
1. Enter Cash App: `TestDriver`, Venmo: `TestDriver`
2. Click **Continue →**

**Expected outcome:**
- Advances to Step 7
- `driver_profiles.tip_cashapp = 'TestDriver'`, `tip_venmo = 'TestDriver'`

---

### 1.7 — Document upload validation (Step 7)

**Test for:** Incomplete uploads are rejected; valid submission creates application

**How to test (license front only — should fail):**
1. On Step 7, upload only a **License Front** image
2. Click **Submit Application →**

**Expected outcome:**
- Error: "Upload a rideshare screenshot OR both sides of your driver license."
- No `driver_applications` row created

**How to test (valid rideshare screenshot):**
1. Upload an **Uber** or **Lyft** screenshot
2. Click **Submit Application →**

**Expected outcome:**
- Redirected to `/verify/status`
- In **driver_applications**: row with `status = 'in_review'`, `submitted_at` set
- In **driver_documents**: one row with `file_path` populated
- In **Storage → driver-documents**: file at `{user_id}/{doc_type}.{ext}`
- `driver_signup_progress.is_complete = true`
- `profiles.role` is still `'guest'` ← critical

---

### 1.8 — Stepper resume on re-login

**Test for:** Driver can close the browser mid-stepper and resume from correct step

**How to test:**
1. Start a fresh signup, complete Steps 1–3
2. Close the browser tab
3. Navigate back to `http://localhost:3000/signup/driver`
4. You will be asked to log in (or redirected if session is active)

**Expected outcome:**
- Stepper resumes at Step 4 (not Step 1)
- Previously entered data is not re-entered (steps 1–3 already persisted to DB)

---

---

## Experience 2 — Verification Status Portal

### 2.1 — Status portal after submission

**Test for:** Driver sees correct `in_review` state with submitted documents listed

**How to test:**
1. After completing the stepper (Test 1.7), you are on `/verify/status`
2. Observe the page

**Expected outcome:**
- Blue `● In Review` status indicator
- Documents listed (e.g., "Uber Driver Screenshot ✓")
- No "Go to Dashboard" button visible
- No dashboard accessible — navigate to `http://localhost:3000/dashboard` manually

**Expected outcome (dashboard redirect):**
- Browser is redirected to `/verify/status` (not allowed in, not allowed to stay)

---

### 2.2 — Status portal polling

**Test for:** Status auto-updates when an admin changes status, without page reload

**How to test:**
1. Keep `/verify/status` open in one browser window
2. In a second window, log into the admin account (see Experience 3 first to set one up)
3. Approve the driver application from the admin panel
4. Watch the first window for up to 30 seconds

**Expected outcome:**
- The status page updates to show **✓ Approved** and a "Go to Dashboard →" button appears
- No manual page refresh required

---

### 2.3 — Rejection notes visible to driver

**Test for:** Rejection reason from admin is shown on the status page

**How to test:**
1. In the admin panel, reject an application with notes: "Please resubmit with a clearer photo."
2. Log into the rejected driver's account and go to `/verify/status`

**Expected outcome:**
- Status shows **✕ Not Approved**
- Rejection reason "Please resubmit with a clearer photo." is displayed
- Support email link is visible

---

---

## Experience 3 — Admin Review Panel

### 3.1 — Admin setup

**Test for:** A user can be manually promoted to admin and access the panel

**How to test:**
1. Create a user account via `/signup/driver` (or manually in Supabase Auth)
2. In **Table Editor → profiles**, manually change that user's `role` from `'guest'` to `'admin'`
3. Log into that account and navigate to `http://localhost:3000/admin/applications`

**Expected outcome:**
- Admin panel loads, showing all `in_review` applications
- Each application shows: driver name, city, submission date, documents

---

### 3.2 — Non-admin is blocked

**Test for:** A driver or guest cannot access the admin panel

**How to test:**
1. Log in as a regular driver (non-admin)
2. Navigate to `http://localhost:3000/admin/applications`

**Expected outcome:**
- Redirected to `/` (not shown the admin panel, no 500 error)

---

### 3.3 — Document signed URLs

**Test for:** Admin sees document links that open the private file (not a 403)

**How to test:**
1. In the admin panel, find an application with documents
2. Click **View ↗** on a document

**Expected outcome:**
- Document opens in a new tab
- URL is a Supabase signed URL (contains `token=` parameter)
- URL works for ~1 hour then expires

**Test for expiry:**
1. Copy a document signed URL
2. Wait 1 hour (or manually set clock forward for testing)
3. Open the URL again

**Expected outcome:**
- Returns 400 or "Invalid token" (not the file)

---

### 3.4 — Approve flow

**Test for:** Approval promotes `profiles.role` to `'driver'` and updates application status

**How to test:**
1. In the admin panel, find an `in_review` application
2. Optionally add review notes
3. Click **✓ Approve**

**Expected outcome:**
- Application card disappears from the list (no longer `in_review`)
- In **Table Editor → profiles**: the driver's `role = 'driver'`
- In **Table Editor → driver_applications**: `status = 'approved'`, `reviewed_at` set, `reviewed_by = admin_user_id`
- Driver can now access `/dashboard`

---

### 3.5 — Reject flow

**Test for:** Rejection sets status to `rejected` and stores notes; role stays `guest`

**How to test:**
1. Find an `in_review` application
2. Enter review notes: "Photo is too blurry to verify."
3. Click **✕ Reject**

**Expected outcome:**
- In **driver_applications**: `status = 'rejected'`, `review_notes = 'Photo is too blurry to verify.'`
- In **profiles**: `role` remains `'guest'` — not promoted
- Driver sees rejection message on `/verify/status`

---

### 3.6 — Role cannot be self-promoted via client

**Test for:** A driver cannot call Supabase directly to set their own role to `'admin'`

**How to test:**
1. Open browser DevTools → Console
2. Run (replace `USER_ID` with your user's UUID):
```js
const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
const sb = createClient('YOUR_SUPABASE_URL', 'YOUR_ANON_KEY')
const { error } = await sb.from('profiles').update({ role: 'admin' }).eq('id', 'USER_ID')
console.log(error)
```

**Expected outcome:**
- Returns a Postgres RLS error (update rejected)
- `profiles.role` unchanged in Table Editor

---

---

## Experience 4 — Driver Dashboard + Edit Profile

### 4.1 — Dashboard access gate

**Test for:** Only approved drivers reach the dashboard

| User state | Navigate to `/dashboard` | Expected |
|---|---|---|
| Not logged in | `/dashboard` | Redirect to `/login` |
| Logged in, no application | `/dashboard` | Redirect to `/signup/driver` |
| Application `in_review` | `/dashboard` | Redirect to `/verify/status` |
| Application `approved` | `/dashboard` | Dashboard renders |

**How to test:**
1. Log out completely
2. Navigate to each scenario above

---

### 4.2 — Edit profile loads real data

**Test for:** Approved driver sees their profile data pre-filled

**How to test:**
1. Log in as an approved driver
2. Navigate to `/driver/edit-profile`

**Expected outcome:**
- Display name, bio, avatar, tip handles are pre-filled from Supabase
- City shown as read-only text (no dropdown)
- QR code renders pointing to `/{public_url_slug}`

---

### 4.3 — Edit profile saves changes

**Test for:** Saving updates both `driver_profiles` and `profiles` tables

**How to test:**
1. Change the Display Name to `Carlos V. Updated`
2. Upload a new avatar image
3. Click **Save Changes**

**Expected outcome:**
- Button shows "✓ Saved!" briefly
- Reload page — new values are pre-filled
- In **Table Editor → driver_profiles**: `display_name` and `avatar_url` updated
- In **Table Editor → profiles**: `display_name` and `avatar_url` also updated
- In **Storage → avatars**: new file replaces old one at same path

---

### 4.4 — Sign out

**Test for:** Signing out clears session and redirects to login

**How to test:**
1. Click **Sign Out** on the edit profile page
2. Try navigating to `/dashboard`

**Expected outcome:**
- Redirected to `/` after sign out
- Navigating to `/dashboard` then redirects to `/login`

---

---

## Experience 5 — Passenger Page

### 5.1 — Driver page renders by slug

**Test for:** Published driver page loads correctly at `/{slug}`

**How to test:**
1. In **Table Editor → driver_profiles**, set `is_published = true` for your test driver
2. Navigate to `http://localhost:3000/{public_url_slug}` (e.g. `/carlosv-tampa`)

**Expected outcome:**
- Page renders with driver's name, bio, avatar
- Weather badge shows Tampa current weather
- Three tiles: Games, Recommendations, Stay

**Test for 404 (unpublished):**
1. Set `is_published = false`
2. Navigate to the same URL

**Expected outcome:**
- 404 page (not the driver's page)

---

### 5.2 — Recommendations page shows city picks

**Test for:** `city_picks` from Supabase appear on the recommendations page

**How to test:**
1. Seed at least 2 city_picks rows for Tampa in **SQL Editor** (from the seed SQL in Phase 4.3 of the implementation doc)
2. Navigate to `http://localhost:3000/{slug}/recommendations`

**Expected outcome:**
- City picks appear as cards (with category badge, emoji)
- Events from Ticketmaster (or mock) also appear
- Filter chips at top work (clicking "Food" shows only food items)

---

### 5.3 — Travel page shows city-specific resources

**Test for:** `travel_help_links` for the driver's city appear; affiliate links also present

**How to test:**
1. Insert a `travel_help_links` row for Tampa in SQL Editor:
```sql
insert into public.travel_help_links (city_id, title, category, url, description, is_active)
select id, 'Tampa International Airport', 'transport', 'https://tampaairport.com', 'Direct service + rideshare pickup info', true
from public.cities where slug = 'tampa';
```
2. Insert an emergency contact:
```sql
insert into public.travel_help_links (city_id, title, category, url, description, is_active)
select id, 'Tampa Non-Emergency Police', 'emergency', 'tel:8138316900', '813-831-6900', true
from public.cities where slug = 'tampa';
```
3. Navigate to `http://localhost:3000/{slug}/travel`

**Expected outcome:**
- "Emergency & Safety" section appears first with the police contact
- "Local Resources" section shows the airport link
- "Book Your Trip" affiliate links (Hotels.com, Viator, etc.) appear below
- FTC disclosure at bottom

---

### 5.4 — Tip jar shows correct handles

**Test for:** Tip handles from `driver_profiles` appear on the tip page

**How to test:**
1. Ensure the driver has `tip_cashapp` and `tip_venmo` set
2. Navigate to `http://localhost:3000/{slug}/tip`

**Expected outcome:**
- Cash App card shows correct handle with `$` prefix, links to `cash.app/$handle`
- Venmo card links to `venmo.com/handle`
- Clicking a card marks it with ✓ and shows thank-you message

**Test with no tip handles:**
1. Clear all tip handles in **Table Editor → driver_profiles**
2. Navigate to `/{slug}/tip`

**Expected outcome:**
- Empty tip jar (no cards shown) — does not crash

---

### 5.5 — Passenger page is unauthenticated

**Test for:** Passenger page works without any login

**How to test:**
1. Open a private/incognito browser window
2. Navigate to `http://localhost:3000/{slug}`
3. Click through to Recommendations, Travel, Tip

**Expected outcome:**
- All pages load without login prompt
- No 401 or redirect to login

---

---

## Experience 6 — Stripe Webhook

### 6.1 — Webhook rejects invalid signatures

**Test for:** A request without a valid Stripe signature returns 400

**How to test:**
1. In terminal, run:
```bash
curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "stripe-signature: invalid_sig" \
  -d '{"type":"customer.subscription.created"}'
```

**Expected outcome:**
- Response: `Signature verification failed` (400 status)

---

### 6.2 — Webhook creates subscription row

**Test for:** Valid Stripe event upserts a row in `subscriptions`

**How to test (requires Stripe CLI):**
1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Run: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. In another terminal: `stripe trigger customer.subscription.created`
4. Edit the event in Stripe Dashboard or use `stripe fixtures` to include `metadata.supabase_user_id = YOUR_USER_UUID`

**Expected outcome:**
- In **Table Editor → subscriptions**: row created with `status = 'active'`, `plan_code = 'plus'`

**Alternative (manual test without CLI):**
1. Directly insert a row in **Table Editor → subscriptions** for a user
2. Verify the entitlement check in Experience 7

---

### 6.3 — Client cannot write to subscriptions

**Test for:** A browser client cannot create or update a subscription row

**How to test:**
1. Open browser DevTools Console (logged in as any user)
2. Run:
```js
// assumes supabase client is available in window or import it
const { error } = await supabase.from('subscriptions').upsert({
  user_id: 'YOUR_USER_UUID', plan_code: 'plus', status: 'active'
}, { onConflict: 'user_id' })
console.log(error)
```

**Expected outcome:**
- RLS error returned — insert/update rejected
- `subscriptions` table unchanged

---

---

## Experience 7 — AI Recommendations (Phase 6)

### 7.1 — Premium gate blocks free users

**Test for:** A user without a subscription receives `premium_required` error

**How to test:**
1. Log in as a driver (or any authenticated user) with no subscription row
2. Navigate to `/{slug}/recommendations`
3. Type a prompt: "Romantic dinner then live music"
4. Click **✨ Generate Itinerary**

**Expected outcome:**
- Error message: "⭐ AI recommendations require a premium subscription."
- No API call to Anthropic made (check Supabase Edge Function logs)

---

### 7.2 — Unauthenticated user sees auth prompt

**Test for:** Passenger not logged in sees sign-in message (not a crash)

**How to test:**
1. Open incognito window (no session)
2. Navigate to `/{slug}/recommendations`
3. Enter a prompt and click Generate

**Expected outcome:**
- "Sign in to use AI recommendations." message
- No 500 error

---

### 7.3 — Premium user gets an itinerary

**Test for:** Active subscriber receives a valid structured itinerary

**Prerequisites:**
- Deploy Edge Function to Supabase: `supabase functions deploy generate-experience`
- Set secrets in Supabase Dashboard → Edge Functions → Secrets: `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Manually insert an active subscription for a test user in **Table Editor → subscriptions**: `status = 'active'`, `plan_code = 'plus'`

**How to test:**
1. Log in as the user with the active subscription
2. Navigate to `/{slug}/recommendations`
3. Type: "Best spots for a first-time visitor with 4 hours"
4. Click **✨ Generate Itinerary**

**Expected outcome:**
- Loading state shows "Generating…"
- Structured itinerary card appears with title, city, and 3–6 items
- Each item shows type emoji, title, description, and optional time/duration
- In **Table Editor → ai_generations**: new row with `response_json` containing the itinerary

---

### 7.4 — City is resolved server-side (not spoofable)

**Test for:** The Edge Function ignores any `city_id` sent from the client; derives it from `driver_profile_id`

**How to test:**
1. Open DevTools Network tab
2. Trigger a generation
3. Inspect the POST request to `/functions/v1/generate-experience`

**Expected outcome:**
- Request body contains only `driver_profile_id` and `prompt`
- No `city_id` in the request body
- `ai_generations.city_id` in Table Editor matches the driver's actual city

---

### 7.5 — API key not in browser

**Test for:** `ANTHROPIC_API_KEY` never appears in the browser network requests or JS bundle

**How to test:**
1. Open DevTools → Network tab
2. Trigger an AI generation
3. Inspect all requests — look for any that go directly to `api.anthropic.com`
4. In terminal: `grep -r "sk-ant" .next/` (or search for your actual key prefix)

**Expected outcome:**
- Zero direct requests to `api.anthropic.com` from the browser
- No results from the grep — key is not in the bundle

---

---

## Experience 8 — Security Audit

### 8.1 — Service role key not in client bundle

**Test for:** `SUPABASE_SERVICE_ROLE_KEY` is never shipped to the browser

**How to test:**
1. Run `npm run build`
2. In terminal:
```bash
grep -r "SERVICE_ROLE" .next/
grep -r "service_role" .next/
```

**Expected outcome:**
- Zero results — the key appears nowhere in the build output

---

### 8.2 — Private documents are not publicly accessible

**Test for:** Files in `driver-documents` bucket cannot be accessed via a direct URL

**How to test:**
1. Note a file path from **Table Editor → driver_documents** (e.g., `abc123/uber_driver_screenshot.jpg`)
2. Construct the public URL pattern:
   `https://YOUR_PROJECT_ID.supabase.co/storage/v1/object/public/driver-documents/abc123/uber_driver_screenshot.jpg`
3. Open that URL in a new incognito tab

**Expected outcome:**
- Returns 400 or "Object not found" — **not** the file
- The bucket is private, so no public URL exists

---

### 8.3 — RLS is enabled on all tables

**Test for:** All 11 tables have RLS enabled

**How to test:**
1. Open Supabase Dashboard → SQL Editor
2. Run:
```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

**Expected outcome:**
All 11 tables show `rowsecurity = true`:
- `ai_generations`, `cities`, `city_picks`, `curated_experiences`, `driver_applications`, `driver_documents`, `driver_profiles`, `driver_signup_progress`, `profiles`, `subscriptions`, `travel_help_links`

---

### 8.4 — Unpublished driver page returns 404

**Test for:** A driver with `is_published = false` cannot be accessed by passengers

**How to test:**
1. Set `driver_profiles.is_published = false` for a driver
2. Open incognito and navigate to `/{that_driver_slug}`

**Expected outcome:**
- 404 page shown
- No driver data leaked (name, bio, avatar not visible)

---

---

## Quick Smoke Test Checklist

Run this fast after any deployment or major change:

- [ ] `http://localhost:3000` loads (login form or redirect to dashboard)
- [ ] `http://localhost:3000/signup/driver` loads stepper Step 1
- [ ] `http://localhost:3000/{slug}` loads passenger home (use a published driver)
- [ ] `http://localhost:3000/{slug}/recommendations` loads cards
- [ ] `http://localhost:3000/{slug}/travel` loads affiliate links
- [ ] `http://localhost:3000/{slug}/tip` loads tip jar
- [ ] `http://localhost:3000/admin/applications` redirects non-admin to `/`
- [ ] `http://localhost:3000/dashboard` redirects unauthenticated user to `/login`
- [ ] `npx tsc --noEmit` returns zero errors
- [ ] `grep -r "SERVICE_ROLE" .next/` returns zero results
