# RoamCompanion — Implementation Reference for Claude

> **Primary directive:** Do not build new premium features, AI experiences, or dashboards until the existing login, driver profile, and passenger-facing page are fully Supabase-backed, role-based, and persistent. That foundation must come first.

---

## What Already Exists (Do Not Rebuild)

- Login form UI
- Driver edit-profile flow UI
- Passenger-facing experience page UI (owned by a driver/host profile)
- Driver page content sections: games, recommendations, travel-help links

The job is to connect these existing screens to a real backend, add a proper driver signup flow, and gate all driver features behind manual admin verification.

---

## Stack

| Layer | Tool |
|---|---|
| Frontend | React + TypeScript |
| Auth | Supabase Auth |
| Database | Supabase Postgres |
| Access control | Supabase Row Level Security (RLS) |
| File storage | Supabase Storage |
| AI gating + generation | Supabase Edge Functions |
| Payments | Stripe (Phase 6) |

---

## Phase Map

Execute phases in order. Each phase ends in a working, deployable state. If something breaks mid-phase, revert only that phase — earlier phases remain intact.

| Phase | What Gets Built | Safe Revert |
|---|---|---|
| **1** | Supabase project + full schema + storage buckets + seed data | Delete Supabase project and recreate |
| **2** | Driver signup stepper — account creation through complete profile + document upload | Remove stepper, fall back to direct login |
| **2B** | Driver verification portal — status UI, admin review panel, approval routing | Disable verification gate, treat all drivers as approved temporarily |
| **3** | Auth trigger + profiles + driver profile wired to existing edit flow | Remove Supabase calls, restore local state |
| **4** | City-scoped content tables live + passenger page dynamic | Disable dynamic fetch, render static fallback |
| **5** | Subscriptions table + Stripe webhook + entitlement checks | Remove gating checks, all features temporarily open |
| **6** | AI Edge Function + generation storage + premium gate | Remove AI input UI, disable Edge Function route |

---

---

# PHASE 1 — Supabase Project + Schema + Storage

## Step 1.1 — Create the Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New Project**.
2. Choose **US East** region (closest to Boston, Tampa, Miami).
3. Save the following from **Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Add all three to `.env.local` and your deployment platform (Vercel / Render).

> **Security:** `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS policies. It must never be prefixed `NEXT_PUBLIC_`, never appear in client-side code, and never be committed to version control. It belongs only in server-side code and Edge Functions.

---

## Step 1.2 — Run the Full Schema

Open **Supabase Dashboard → SQL Editor → New Query**. Run each block in order. Each block depends on the one before it — do not reorder.

---

### Block 1 of 11 — cities

```sql
create table public.cities (
  id        uuid primary key default gen_random_uuid(),
  slug      text not null unique check (slug in ('boston', 'tampa', 'miami')),
  name      text not null unique check (name in ('Boston', 'Tampa', 'Miami')),
  is_active boolean not null default true
);

insert into public.cities (slug, name) values
  ('boston', 'Boston'),
  ('tampa',  'Tampa'),
  ('miami',  'Miami');
```

The DB-level `check` constraint on `slug` and `name` means no code path can create a fourth city by accident. Adding a city requires modifying the constraint in SQL — intentional friction.

---

### Block 2 of 11 — profiles

```sql
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  display_name text,
  role         text not null default 'guest' check (role in ('guest', 'driver', 'admin')),
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
```

- `id` matches `auth.users.id` exactly — this is the join key between Auth and app data.
- `on delete cascade` means deleting the auth user also deletes the profile.
- `role` is DB-constrained. No frontend code can write an arbitrary role string.
- Role defaults to `guest` for all new users. It is only promoted to `driver` after verification is approved.

---

### Block 3 of 11 — driver_signup_progress

Tracks where a driver is in the multi-step signup stepper. Separate from `driver_profiles` so partial signups can resume without corrupting live profile data.

```sql
create table public.driver_signup_progress (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique references public.profiles(id) on delete cascade,
  current_step  int not null default 1,
  is_complete   boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
```

- `is_complete` flips to `true` only when the driver submits the final stepper step (document upload).
- `is_complete = true` triggers application creation. It does NOT grant driver access — that requires admin approval.

---

### Block 4 of 11 — driver_profiles

```sql
create table public.driver_profiles (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null unique references public.profiles(id) on delete cascade,
  city_id          uuid not null references public.cities(id),
  display_name     text,
  headline         text,
  bio              text,
  vehicle_type     text check (vehicle_type in ('sedan', 'suv', 'van', 'luxury', 'other')),
  years_driving    int,
  languages        text[],
  service_area     text,
  hero_image_url   text,
  avatar_url       text,
  tip_cashapp      text,
  tip_venmo        text,
  tip_paypal       text,
  public_url_slug  text unique,
  is_published     boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
```

`is_published` cannot be set to `true` unless the driver's application `status = 'approved'`. This is enforced in the frontend routing and should be double-checked in any publish API call.

---

### Block 5 of 11 — driver_applications

Tracks the lifecycle of a driver's verification application. One application per driver. Created automatically when the signup stepper completes.

```sql
create table public.driver_applications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique references public.profiles(id) on delete cascade,
  city_id       uuid not null references public.cities(id),
  status        text not null default 'pending_submission'
                  check (status in ('pending_submission', 'in_review', 'approved', 'rejected')),
  submitted_at  timestamptz,
  reviewed_at   timestamptz,
  reviewed_by   uuid references public.profiles(id),
  review_notes  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
```

- `status` follows a strict one-way lifecycle: `pending_submission → in_review → approved | rejected`.
- `submitted_at` is set when the driver submits their documents (stepper completion).
- `reviewed_by` records which admin approved or rejected — important for audit trail.
- `review_notes` stores admin feedback. Shown to the driver only on rejection.
- `user_id unique` — one application per driver, period. A rejected driver cannot create a second application without admin intervention in V1.

---

### Block 6 of 11 — driver_documents

Stores metadata for each verification document uploaded by the driver. The actual files live in Storage; this table stores their URLs and types.

```sql
create table public.driver_documents (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references public.driver_applications(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  document_type   text not null check (document_type in (
                    'license_front',
                    'license_back',
                    'uber_driver_screenshot',
                    'lyft_driver_screenshot',
                    'insurance'
                  )),
  file_url        text not null,
  file_path       text not null,
  status          text not null default 'uploaded' check (status in ('uploaded', 'reviewed', 'rejected')),
  uploaded_at     timestamptz not null default now()
);
```

- `file_url` — the public Storage URL used for display.
- `file_path` — the internal Storage path used for deletion or replacement.
- `document_type` is DB-constrained. No arbitrary document category can be created from the frontend.
- MVP requires at least one of: `uber_driver_screenshot`, `lyft_driver_screenshot`, `license_front`. The backend validates this before allowing status to advance to `in_review`.

---

### Block 7 of 11 — city_picks

```sql
create table public.city_picks (
  id           uuid primary key default gen_random_uuid(),
  city_id      uuid not null references public.cities(id),
  created_by   uuid references public.profiles(id),
  title        text not null,
  category     text not null check (category in ('food', 'nightlife', 'stay', 'activity', 'transport')),
  description  text,
  external_url text,
  image_url    text,
  is_featured  boolean not null default false,
  is_active    boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);
```

Backs the "My Picks" section on passenger pages. Always filtered by the driver's `city_id`, never by URL params.

---

### Block 8 of 11 — travel_help_links

```sql
create table public.travel_help_links (
  id          uuid primary key default gen_random_uuid(),
  city_id     uuid not null references public.cities(id),
  title       text not null,
  category    text not null check (category in ('stay', 'booking', 'transport', 'tourism', 'emergency')),
  description text,
  url         text not null,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
```

The `emergency` category is reserved for city-specific emergency contacts and should always render regardless of sort order.

---

### Block 9 of 11 — curated_experiences

```sql
create table public.curated_experiences (
  id             uuid primary key default gen_random_uuid(),
  city_id        uuid not null references public.cities(id),
  created_by     uuid references public.profiles(id),
  title          text not null,
  description    text,
  duration_label text,
  category       text check (category in ('nightlife', 'date', 'chill', 'before-flight')),
  price_note     text,
  is_free        boolean not null default true,
  is_active      boolean not null default true,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now()
);
```

`is_free` must remain `true` for all V1 content. These are editorial templates, not bookable services.

---

### Block 10 of 11 — ai_generations

```sql
create table public.ai_generations (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id),
  city_id           uuid not null references public.cities(id),
  driver_profile_id uuid references public.driver_profiles(id),
  prompt            text not null,
  response_json     jsonb not null,
  preview_text      text,
  is_saved          boolean not null default false,
  created_at        timestamptz not null default now()
);
```

- `city_id` is resolved server-side in the Edge Function. Never trusted from client.
- `response_json` stores structured itinerary data only — never raw prose.

---

### Block 11 of 11 — subscriptions

```sql
create table public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null unique references public.profiles(id),
  plan_code              text not null default 'free' check (plan_code in ('free', 'plus')),
  status                 text not null default 'inactive' check (status in ('inactive', 'trialing', 'active', 'past_due', 'canceled')),
  ai_generation_limit    int,
  stripe_customer_id     text,
  stripe_subscription_id text,
  current_period_end     timestamptz,
  updated_at             timestamptz not null default now()
);
```

`stripe_customer_id` and `stripe_subscription_id` are written only by the Stripe webhook via service role. Zero client-write policies exist for this table.

---

## Step 1.3 — Auth Trigger (Auto-create Profile on Signup)

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      split_part(new.email, '@', 1)
    ),
    'guest'
  );
  insert into public.driver_signup_progress (user_id, current_step)
  values (new.id, 1);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

- `security definer` — function runs as table owner because the new user has no session yet.
- `driver_signup_progress` row is created here so email confirmation works — the client cannot insert while unauthenticated.
- `set search_path = public` — prevents schema injection by locking execution scope.
- Role always defaults to `guest`. Promotion to `driver` only happens after admin approves the verification application.

---

## Step 1.4 — Storage Buckets

Go to **Supabase Dashboard → Storage → New Bucket** and create the following buckets.

### Bucket: `avatars`
| Setting | Value |
|---|---|
| Name | `avatars` |
| Public | Yes |
| Allowed MIME types | `image/jpeg, image/png, image/webp` |
| Max file size | 2 MB |

### Bucket: `driver-images`
| Setting | Value |
|---|---|
| Name | `driver-images` |
| Public | Yes |
| Allowed MIME types | `image/jpeg, image/png, image/webp` |
| Max file size | 5 MB |

### Bucket: `driver-documents`

> **Critical:** This bucket must be set to **private (not public)**. Verification documents (licenses, rideshare screenshots) are sensitive — they must never be publicly accessible via URL. Admin access is handled via signed URLs generated server-side.

| Setting | Value |
|---|---|
| Name | `driver-documents` |
| Public | **No** |
| Allowed MIME types | `image/jpeg, image/png, image/webp, application/pdf` |
| Max file size | 5 MB |

---

## Step 1.5 — Storage RLS Policies

Paste all of the following in the SQL Editor in one block.

```sql
-- ── avatars (public read, owner write) ──────────────────────────────────
drop policy if exists "avatars: authenticated upload own" on storage.objects;
create policy "avatars: authenticated upload own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "avatars: public read"
on storage.objects for select to public
using (bucket_id = 'avatars');

create policy "avatars: authenticated update own"
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "avatars: authenticated delete own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

-- ── driver-images (public read, owner write) ─────────────────────────────
drop policy if exists "driver-images: authenticated upload own" on storage.objects;
create policy "driver-images: authenticated upload own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'driver-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "driver-images: public read"
on storage.objects for select to public
using (bucket_id = 'driver-images');

create policy "driver-images: authenticated update own"
on storage.objects for update to authenticated
using (
  bucket_id = 'driver-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "driver-images: authenticated delete own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'driver-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

-- ── driver-documents (PRIVATE — owner upload, admin read only) ───────────
-- Drivers can upload only to their own folder
create policy "driver-documents: authenticated upload own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'driver-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Drivers can read their own documents
create policy "driver-documents: owner read own"
on storage.objects for select to authenticated
using (
  bucket_id = 'driver-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Admin reads all documents — checked via profiles.role
-- Note: because this is a storage policy, role check uses a subquery
create policy "driver-documents: admin read all"
on storage.objects for select to authenticated
using (
  bucket_id = 'driver-documents'
  and exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'admin'
  )
);

-- Drivers cannot delete their own documents once submitted (admin only)
-- No delete policy for drivers on this bucket intentionally.
```

> **Security:** There is no public read policy on `driver-documents`. The bucket is private. Admin access uses a role-checked subquery. Document URLs stored in `driver_documents.file_url` must be **signed URLs** (time-limited), not public URLs. Generate them server-side when the admin panel loads.

---

## Step 1.6 — Enable RLS on All Tables

```sql
alter table public.profiles                enable row level security;
alter table public.driver_signup_progress  enable row level security;
alter table public.driver_profiles         enable row level security;
alter table public.driver_applications     enable row level security;
alter table public.driver_documents        enable row level security;
alter table public.cities                  enable row level security;
alter table public.city_picks              enable row level security;
alter table public.travel_help_links       enable row level security;
alter table public.curated_experiences     enable row level security;
alter table public.ai_generations          enable row level security;
alter table public.subscriptions           enable row level security;
```

Audit — every table must show `rowsecurity = true`:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

---

## Phase 1 — Verify Before Moving On

- [ ] All 11 tables created with zero SQL errors
- [ ] `cities` has exactly 3 rows: Boston, Tampa, Miami
- [ ] Auth trigger exists: `select * from pg_trigger where tgname = 'on_auth_user_created';`
- [ ] Three storage buckets created: `avatars` (public), `driver-images` (public), `driver-documents` (**private**)
- [ ] All storage RLS policies created — confirm `driver-documents` has NO public read policy
- [ ] Audit query shows `rowsecurity = true` for all 11 tables
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is NOT prefixed `NEXT_PUBLIC_`

**If anything in Phase 1 fails:** drop the project and start over. Schema is fast to re-run. Do not patch a broken foundation.

---

---

# PHASE 2 — Driver Signup Stepper + Document Upload

This is the entry point for new drivers. The flow creates their auth account, builds their full driver profile, and ends with document upload to initiate the verification application. The existing login form handles returning drivers.

## Stepper Overview

The stepper has **7 steps**. Steps 1, 2, 3, 5, and 7 are required. Steps 4 and 6 can be skipped.

| Step | Name | Required | Fields |
|---|---|---|---|
| 1 | Account Creation | Yes | Full name, email, password, confirm password |
| 2 | Your City | Yes | City dropdown (Boston / Tampa / Miami) |
| 3 | Your Identity | Yes | Display name, avatar photo, short bio |
| 4 | Vehicle & Experience | Optional | Vehicle type, years driving, languages |
| 5 | Your Page Setup | Yes | Headline, hero image, vanity URL slug, service area |
| 6 | Tip Links | Optional | Cash App, Venmo, PayPal handles |
| 7 | Verification Documents | Yes | Rideshare screenshot OR driver license (front + back) |

After Step 7, the driver is redirected to the **Verification Status Portal** — not the dashboard. The dashboard is locked until admin approval.

---

## Step 2.1 — RLS Policies for Signup + Application Tables

```sql
-- profiles: owner read and update
create policy "profiles: owner read"
on public.profiles for select to authenticated
using (id = auth.uid());

create policy "profiles: owner update"
on public.profiles for update to authenticated
using (id = auth.uid());

-- driver_signup_progress: owner manages own row
create policy "driver_signup_progress: owner read"
on public.driver_signup_progress for select to authenticated
using (user_id = auth.uid());

create policy "driver_signup_progress: owner insert"
on public.driver_signup_progress for insert to authenticated
with check (user_id = auth.uid());

create policy "driver_signup_progress: owner update"
on public.driver_signup_progress for update to authenticated
using (user_id = auth.uid());

-- driver_profiles: public reads published; owner manages own row
create policy "driver_profiles: public read published"
on public.driver_profiles for select to public
using (is_published = true);

create policy "driver_profiles: owner read own"
on public.driver_profiles for select to authenticated
using (user_id = auth.uid());

create policy "driver_profiles: owner insert"
on public.driver_profiles for insert to authenticated
with check (user_id = auth.uid());

create policy "driver_profiles: owner update"
on public.driver_profiles for update to authenticated
using (user_id = auth.uid());

-- driver_applications: owner reads own; admin reads all
create policy "driver_applications: owner read"
on public.driver_applications for select to authenticated
using (user_id = auth.uid());

create policy "driver_applications: owner insert"
on public.driver_applications for insert to authenticated
with check (user_id = auth.uid());

-- Drivers cannot update their own application after submission.
-- Status transitions happen via admin-only server-side calls.

create policy "driver_applications: admin read all"
on public.driver_applications for select to authenticated
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "driver_applications: admin update"
on public.driver_applications for update to authenticated
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- driver_documents: owner inserts; admin reads all
create policy "driver_documents: owner insert"
on public.driver_documents for insert to authenticated
with check (user_id = auth.uid());

create policy "driver_documents: owner read"
on public.driver_documents for select to authenticated
using (user_id = auth.uid());

create policy "driver_documents: admin read all"
on public.driver_documents for select to authenticated
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- cities: public reads active
create policy "cities: public read active"
on public.cities for select to public
using (is_active = true);
```

---

## Step 2.2 — Stepper State Management

Manage state in React with a single `draftProfile` object that accumulates across steps. Persist to Supabase after each step so the driver can resume on re-login.

```typescript
interface SignupDraft {
  // Step 1
  email: string
  password: string
  fullName: string

  // Step 2
  cityId: string

  // Step 3
  displayName: string
  avatarUrl: string | null
  bio: string

  // Step 4 (optional)
  vehicleType: 'sedan' | 'suv' | 'van' | 'luxury' | 'other' | null
  yearsDriving: number | null
  languages: string[]

  // Step 5
  headline: string
  heroImageUrl: string | null
  publicUrlSlug: string
  serviceArea: string | null

  // Step 6 (optional)
  tipCashapp: string | null
  tipVenmo: string | null
  tipPaypal: string | null

  // Step 7
  documents: {
    type: 'license_front' | 'license_back' | 'uber_driver_screenshot' | 'lyft_driver_screenshot'
    file: File
    uploadedUrl: string | null
    uploadedPath: string | null
  }[]
}
```

Persist after every step:
```typescript
await supabase
  .from('driver_signup_progress')
  .upsert({
    user_id: user.id,
    current_step: completedStepNumber,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' })
```

On re-login, read progress and jump to `current_step + 1`.

---

## Step 2.3 — Step 1: Account Creation

```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { display_name: fullName }
  }
})

if (error) {
  // Show inline error — do not advance
}

// profiles row auto-created by trigger with role = 'guest'
await supabase.from('driver_signup_progress').insert({
  user_id: data.user!.id,
  current_step: 1
})
```

> **Security:** Role is never set during account creation. Trigger always assigns `guest`. The driver does not become `driver` until admin approval.

---

## Step 2.4 — Step 2: Your City

```typescript
await supabase.from('driver_profiles').upsert({
  user_id: user.id,
  city_id: selectedCityId,
  updated_at: new Date().toISOString()
}, { onConflict: 'user_id' })

await supabase.from('driver_signup_progress').update({
  current_step: 2,
  updated_at: new Date().toISOString()
}).eq('user_id', user.id)
```

City is locked after this step. Changing city in V1 requires admin action.

---

## Step 2.5 — Step 3: Your Identity

Fields: display name (required), avatar photo upload (required), bio (required, max 300 chars).

```typescript
// Upload avatar
const avatarPath = `${user.id}/avatar.jpg`
await supabase.storage.from('avatars').upload(avatarPath, file, { upsert: true })
const { data: { publicUrl: avatarUrl } } = supabase.storage.from('avatars').getPublicUrl(avatarPath)

// Write to both tables
await supabase.from('driver_profiles').upsert({
  user_id: user.id,
  display_name: displayName,
  avatar_url: avatarUrl,
  bio,
  updated_at: new Date().toISOString()
}, { onConflict: 'user_id' })

await supabase.from('profiles').update({
  display_name: displayName,
  avatar_url: avatarUrl,
  updated_at: new Date().toISOString()
}).eq('id', user.id)
```

---

## Step 2.6 — Step 4: Vehicle & Experience (Optional)

Fields: vehicle type, years driving, languages. All optional — show "Skip for now" prominently.

```typescript
await supabase.from('driver_profiles').upsert({
  user_id: user.id,
  vehicle_type: vehicleType ?? null,
  years_driving: yearsDriving ?? null,
  languages: languages.length > 0 ? languages : null,
  updated_at: new Date().toISOString()
}, { onConflict: 'user_id' })
```

---

## Step 2.7 — Step 5: Your Page Setup

Fields: headline (required, max 80 chars), hero image (required), vanity URL slug (required, unique), service area (optional).

**Slug validation — debounced, 500ms:**
```typescript
const checkSlug = async (slug: string) => {
  const cleaned = slug.toLowerCase().replace(/[^a-z0-9-]/g, '')
  const { data } = await supabase
    .from('driver_profiles')
    .select('id')
    .eq('public_url_slug', cleaned)
    .single()
  return data === null // true = available
}
```

```typescript
const heroPath = `${user.id}/hero.jpg`
await supabase.storage.from('driver-images').upload(heroPath, heroFile, { upsert: true })
const { data: { publicUrl: heroUrl } } = supabase.storage.from('driver-images').getPublicUrl(heroPath)

await supabase.from('driver_profiles').upsert({
  user_id: user.id,
  headline,
  hero_image_url: heroUrl,
  public_url_slug: cleanedSlug,
  service_area: serviceArea ?? null,
  updated_at: new Date().toISOString()
}, { onConflict: 'user_id' })
```

---

## Step 2.8 — Step 6: Tip Links (Optional)

Fields: Cash App handle (`$`), Venmo handle (`@`), PayPal handle. All optional. Show "Skip for now."

```typescript
await supabase.from('driver_profiles').upsert({
  user_id: user.id,
  tip_cashapp: cashapp ?? null,
  tip_venmo: venmo ?? null,
  tip_paypal: paypal ?? null,
  updated_at: new Date().toISOString()
}, { onConflict: 'user_id' })
```

---

## Step 2.9 — Step 7: Verification Documents (Required)

This is the final stepper step. The driver must upload at least one of the following to proceed:

**Option A — Rideshare Proof (Recommended, faster review)**
- Screenshot of active Uber or Lyft driver dashboard showing: driver name, rating, active interface.
- Document types: `uber_driver_screenshot` or `lyft_driver_screenshot`.

**Option B — Driver License**
- Both front and back are required if choosing this option.
- Document types: `license_front` + `license_back`.

**Optional additions (future, not required for MVP):**
- `insurance` — vehicle insurance document.

**UI layout for this step:**
```
┌─────────────────────────────────────────────────────┐
│  Verify Your Identity                                │
│                                                      │
│  Upload at least one of the following:               │
│                                                      │
│  ☐  Rideshare Proof (Recommended)                   │
│     Screenshot of your Uber or Lyft driver page     │
│     showing your name, rating, and active status.   │
│     [Upload Screenshot]                              │
│                                                      │
│  ☐  Driver License                                   │
│     Front  [Upload]     Back  [Upload]               │
│                                                      │
│  Your documents are encrypted and reviewed only     │
│  by the RoamCompanion team. They are never shared.  │
│                                                      │
│  [Submit Application →]                             │
└─────────────────────────────────────────────────────┘
```

**Document upload pattern — private bucket, path-scoped:**
```typescript
// Upload to private bucket using driver's user_id as folder
const uploadDocument = async (
  file: File,
  docType: 'license_front' | 'license_back' | 'uber_driver_screenshot' | 'lyft_driver_screenshot',
  userId: string
): Promise<{ path: string }> => {
  const ext = file.type === 'application/pdf' ? 'pdf' : file.name.split('.').pop()
  const filePath = `${userId}/${docType}.${ext}`

  const { error } = await supabase.storage
    .from('driver-documents')
    .upload(filePath, file, { upsert: true })

  if (error) throw error
  return { path: filePath }
}
```

**Validation before submit:**
```typescript
const hasRideshareProof = uploadedDocs.some(d =>
  d.type === 'uber_driver_screenshot' || d.type === 'lyft_driver_screenshot'
)
const hasLicenseFront = uploadedDocs.some(d => d.type === 'license_front')
const hasLicenseBack  = uploadedDocs.some(d => d.type === 'license_back')
const hasLicense = hasLicenseFront && hasLicenseBack

if (!hasRideshareProof && !hasLicense) {
  setError('Please upload a rideshare screenshot or both sides of your driver license.')
  return
}
```

**On submit — application creation sequence:**
```typescript
// 1. Look up driver's city_id
const { data: driverProfile } = await supabase
  .from('driver_profiles')
  .select('city_id')
  .eq('user_id', user.id)
  .single()

// 2. Create the application record
const { data: application } = await supabase
  .from('driver_applications')
  .insert({
    user_id: user.id,
    city_id: driverProfile.city_id,
    status: 'in_review',       // jump straight to in_review on submit
    submitted_at: new Date().toISOString()
  })
  .select()
  .single()

// 3. For each uploaded document, insert a row in driver_documents
for (const doc of uploadedDocs) {
  // Generate a short-lived signed URL for the admin panel
  // (file_url stored here is a signed URL; regenerate on read — see Phase 2B)
  const { data: signedData } = await supabase.storage
    .from('driver-documents')
    .createSignedUrl(doc.uploadedPath, 60 * 60 * 24) // 24hr expiry

  await supabase.from('driver_documents').insert({
    application_id: application.id,
    user_id: user.id,
    document_type: doc.type,
    file_url: signedData.signedUrl,
    file_path: doc.uploadedPath,
    uploaded_at: new Date().toISOString()
  })
}

// 4. Mark stepper complete
await supabase.from('driver_signup_progress').update({
  current_step: 7,
  is_complete: true,
  updated_at: new Date().toISOString()
}).eq('user_id', user.id)

// 5. Do NOT promote role to 'driver' yet — that happens in Phase 2B on approval
// 6. Redirect to verification status portal
router.push('/verify/status')
```

> **Security:** Documents are uploaded to the private `driver-documents` bucket. `file_url` in `driver_documents` stores a signed URL with a 24-hour expiry. The admin panel must regenerate signed URLs on load — never cache them or use permanent URLs for sensitive documents.

---

## Step 2.10 — Resumable Stepper (Re-entry Logic)

```typescript
const { data: progress } = await supabase
  .from('driver_signup_progress')
  .select('current_step, is_complete')
  .eq('user_id', user.id)
  .single()

if (!progress) {
  // New driver — begin stepper
  router.push('/signup/driver?step=1')
  return
}

if (progress.is_complete) {
  // Stepper done — check application status to determine where to send them
  const { data: application } = await supabase
    .from('driver_applications')
    .select('status')
    .eq('user_id', user.id)
    .single()

  if (application?.status === 'approved') {
    router.push('/dashboard')
  } else {
    router.push('/verify/status')  // pending, in_review, or rejected
  }
  return
}

// Resume at next step
router.push(`/signup/driver?step=${progress.current_step + 1}`)
```

---

## Phase 2 — Verify Before Moving On

- [ ] All 7 steps complete: account, city, identity, vehicle (skip OK), page setup, tips (skip OK), documents
- [ ] Uploading only a rideshare screenshot passes validation
- [ ] Uploading only `license_front` (without back) fails validation with inline error
- [ ] Documents stored in `driver-documents` bucket under `{user_id}/{docType}.ext`
- [ ] `driver_applications` row created with `status = 'in_review'` and `submitted_at` set
- [ ] `driver_documents` rows created with `file_path` populated for each uploaded file
- [ ] `profiles.role` is still `'guest'` after stepper completes — verify in Table Editor
- [ ] `driver_profiles.is_published` is `false` — verify in Table Editor
- [ ] Driver is redirected to `/verify/status` after submission — not `/dashboard`
- [ ] Browser direct-navigation to `/dashboard` redirects a non-approved driver to `/verify/status`
- [ ] Documents in `driver-documents` bucket are not publicly accessible via storage URL (returns 400/403)

---

---

# PHASE 2B — Driver Verification Portal + Admin Review Panel

This phase builds two distinct UIs: the **driver-facing status portal** (what the driver sees while waiting) and the **admin review panel** (where the RoamCompanion team approves or rejects applications). It also defines the routing rules that gate the entire driver dashboard behind verified status.

---

## Step 2B.1 — Routing Guard: Verification Gate

All routes under `/dashboard/*` must check verification status before rendering. This check runs at the layout level — not per-page.

```typescript
// src/app/dashboard/layout.tsx  (Next.js app router)
// or equivalent route guard in React Router

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: application } = await supabase
    .from('driver_applications')
    .select('status')
    .eq('user_id', user.id)
    .single()

  // No application at all → still in stepper
  if (!application) {
    redirect('/signup/driver')
  }

  // Application exists but not approved → verification portal
  if (application.status !== 'approved') {
    redirect('/verify/status')
  }

  // Only approved drivers reach the dashboard
  return <>{children}</>
}
```

**Route map:**

| URL | Who can access | Notes |
|---|---|---|
| `/signup/driver` | Unauthenticated or incomplete signup | Stepper entry point |
| `/verify/status` | Any authenticated driver | Shows current application status |
| `/dashboard` | Approved drivers only | Gated by layout guard above |
| `/dashboard/*` | Approved drivers only | All sub-routes inherit the guard |
| `/admin/applications` | Admin role only | Server-side role check required |
| `/driver/:slug` | Public (passenger page) | Only renders if `is_published = true` |

---

## Step 2B.2 — Driver Verification Status Portal

Route: `/verify/status`

This is what the driver sees after submitting their application. It is their only available screen until approval. It must be polished and reassuring — the driver has just completed a long signup flow and is waiting.

**Data fetch:**
```typescript
const { data: application } = await supabase
  .from('driver_applications')
  .select('status, submitted_at, reviewed_at, review_notes')
  .eq('user_id', user.id)
  .single()

const { data: documents } = await supabase
  .from('driver_documents')
  .select('document_type, uploaded_at, status')
  .eq('user_id', user.id)
```

**Status UI — four states:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Verification Status                       │
│                                                             │
│  ● pending_submission   Not yet submitted                   │
│  ● in_review            Your application is being reviewed  │
│  ✓ approved             You're approved — go to dashboard   │
│  ✕ rejected             See notes below                     │
│                                                             │
│  Documents Submitted:                                       │
│  ✓ Uber Driver Screenshot                                   │
│  ✓ License Front                                            │
│  ✓ License Back                                             │
│                                                             │
│  Submitted: Feb 14, 2025                                    │
│                                                             │
│  [Go to Dashboard →]   ← only shown when approved          │
└─────────────────────────────────────────────────────────────┘
```

**Status display logic:**

```typescript
const statusConfig = {
  pending_submission: {
    icon: '●',
    color: 'text-yellow-400',
    label: 'Pending Submission',
    message: 'Your application has not been submitted yet. Please complete the signup process.',
    showDashboardLink: false,
  },
  in_review: {
    icon: '●',
    color: 'text-blue-400',
    label: 'In Review',
    message: 'Your application is being reviewed by the RoamCompanion team. This usually takes 1–2 business days.',
    showDashboardLink: false,
  },
  approved: {
    icon: '✓',
    color: 'text-green-400',
    label: 'Approved',
    message: 'Welcome to RoamCompanion! Your profile is ready.',
    showDashboardLink: true,
  },
  rejected: {
    icon: '✕',
    color: 'text-red-400',
    label: 'Not Approved',
    message: 'Your application was not approved at this time.',
    showDashboardLink: false,
  },
}
```

**On rejection — show admin review notes:**
```typescript
{application.status === 'rejected' && application.review_notes && (
  <div className="rejection-notes">
    <p className="label">Reason:</p>
    <p>{application.review_notes}</p>
    <p className="support-note">
      If you believe this is an error, please contact support@roamcompanion.app
    </p>
  </div>
)}
```

**On approval — show dashboard entry:**
```typescript
{application.status === 'approved' && (
  <div className="approval-panel">
    <h2>Welcome to RoamCompanion 🎉</h2>
    <p>Your profile is ready. Publish your page when you're ready to go live.</p>
    <button onClick={() => router.push('/dashboard')}>
      Go to Dashboard →
    </button>
  </div>
)}
```

**Auto-refresh:** Poll every 30 seconds while `status === 'in_review'` so the driver sees approval without manually refreshing.

```typescript
useEffect(() => {
  if (application?.status !== 'in_review') return
  const interval = setInterval(async () => {
    const { data } = await supabase
      .from('driver_applications')
      .select('status, review_notes, reviewed_at')
      .eq('user_id', user.id)
      .single()
    if (data?.status !== 'in_review') {
      setApplication(data)
      clearInterval(interval)
    }
  }, 30000)
  return () => clearInterval(interval)
}, [application?.status])
```

---

## Step 2B.3 — Admin Review Panel

Route: `/admin/applications`

Protected by server-side role check. If `profiles.role !== 'admin'`, return 403 or redirect.

**Server-side admin check (runs before any data is returned):**
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

if (profile?.role !== 'admin') {
  redirect('/') // or return 403
}
```

**Applications list query:**
```typescript
// Fetch all in_review applications with driver info
const { data: applications } = await supabase
  .from('driver_applications')
  .select(`
    id,
    status,
    submitted_at,
    review_notes,
    profiles (
      display_name,
      email
    ),
    cities (
      name
    ),
    driver_documents (
      id,
      document_type,
      file_path,
      uploaded_at
    )
  `)
  .eq('status', 'in_review')
  .order('submitted_at', { ascending: true })
```

**Generating signed URLs for document review:**

Because `driver-documents` is a private bucket, documents cannot be viewed with a direct URL. The admin panel must generate signed URLs server-side for each document before rendering.

```typescript
// For each document in the application
const signedUrls: Record<string, string> = {}

for (const doc of application.driver_documents) {
  const { data } = await supabase.storage
    .from('driver-documents')
    .createSignedUrl(doc.file_path, 60 * 60) // 1hr expiry for admin session

  if (data?.signedUrl) {
    signedUrls[doc.id] = data.signedUrl
  }
}
```

**Admin panel UI layout:**

```
┌─────────────────────────────────────────────────────────────┐
│  Driver Applications — In Review (3)                        │
├─────────────────────────────────────────────────────────────┤
│  Carlos Martinez · Tampa · Submitted Feb 14, 2025           │
│                                                             │
│  Documents:                                                 │
│  📄 Uber Driver Screenshot  [View ↗]                        │
│  📄 License Front           [View ↗]                        │
│  📄 License Back            [View ↗]                        │
│                                                             │
│  Review Notes: ___________________________________          │
│                                                             │
│  [✓ Approve]   [✕ Reject]                                  │
├─────────────────────────────────────────────────────────────┤
│  Maria Santos · Miami · Submitted Feb 15, 2025              │
│  ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

**Approve action:**
```typescript
const approveApplication = async (applicationId: string, driverUserId: string) => {
  // 1. Update application status
  await supabase
    .from('driver_applications')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminUser.id
    })
    .eq('id', applicationId)

  // 2. Promote role to 'driver'
  // This requires the service role key — do this in an API route, not client-side
  // POST /api/admin/approve-driver  { driverUserId }
  await fetch('/api/admin/approve-driver', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ driverUserId, applicationId })
  })
}
```

**Server-side approve handler (`/api/admin/approve-driver`):**
```typescript
// This uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS for the role promotion
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!   // server-side only
)

export async function POST(req: Request) {
  // 1. Verify the caller is an admin
  const callerSession = await getSession(req)
  const { data: callerProfile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', callerSession.user.id)
    .single()

  if (callerProfile?.role !== 'admin') {
    return new Response('Forbidden', { status: 403 })
  }

  const { driverUserId, applicationId } = await req.json()

  // 2. Promote the driver's role
  await supabaseAdmin
    .from('profiles')
    .update({ role: 'driver', updated_at: new Date().toISOString() })
    .eq('id', driverUserId)

  // 3. Update application status
  await supabaseAdmin
    .from('driver_applications')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: callerSession.user.id
    })
    .eq('id', applicationId)

  return new Response('ok', { status: 200 })
}
```

**Reject action:**
```typescript
const rejectApplication = async (
  applicationId: string,
  reviewNotes: string
) => {
  await supabase
    .from('driver_applications')
    .update({
      status: 'rejected',
      review_notes: reviewNotes,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminUser.id
    })
    .eq('id', applicationId)
  // Role stays 'guest' — no further action needed
}
```

> **Security:** Role promotion from `guest` to `driver` must ONLY happen via the server-side API route using the service role key. The client-side admin panel triggers this via a POST to the API route — it cannot write to `profiles.role` directly because the client uses the anon key which is subject to RLS. An admin user updating their own role or another user's role directly from the client must be impossible. The server-side route double-checks the caller's role before executing.

---

## Step 2B.4 — Approval Effect: What Changes When Approved

When the server-side approve handler runs, the following must be true:

| Field | Before Approval | After Approval |
|---|---|---|
| `profiles.role` | `'guest'` | `'driver'` |
| `driver_applications.status` | `'in_review'` | `'approved'` |
| `driver_profiles.is_published` | `false` | Still `false` — driver chooses to publish |
| Dashboard access | Blocked (redirect to `/verify/status`) | Unlocked |
| Experience creation | Blocked | Unlocked |
| Profile editing | Blocked | Unlocked |
| Page publishing | Blocked | Available (driver's choice) |

Publishing the public page is always an explicit driver action from the dashboard. Approval grants dashboard access — it does not auto-publish the passenger page.

---

## Phase 2B — Verify Before Moving On

- [ ] `/dashboard` redirects a driver with `status = 'in_review'` to `/verify/status`
- [ ] `/dashboard` redirects a driver with no application to `/signup/driver`
- [ ] `/dashboard` renders correctly for a driver with `status = 'approved'`
- [ ] `/verify/status` displays the correct state for all four status values
- [ ] Rejection reason from `review_notes` is visible to the driver on the status page
- [ ] Status portal polls every 30s and auto-advances to approval state without page reload
- [ ] Admin panel at `/admin/applications` returns 403/redirect for a non-admin user
- [ ] Document "View" links in admin panel open signed URLs (not public URLs)
- [ ] Signed URLs expire — verify a 1hr-old link returns 400
- [ ] Approve button triggers the server-side API route — confirm `profiles.role` becomes `'driver'` in Table Editor
- [ ] Reject button sets `status = 'rejected'` and stores `review_notes`
- [ ] `profiles.role` cannot be changed to `'driver'` via a direct Supabase client call from the browser (test with anon key)
- [ ] Approved driver's `driver_profiles.is_published` remains `false` until they explicitly publish from the dashboard

---

---

# PHASE 3 — Auth + Profiles + Driver Edit Profile Wired to Frontend

This phase connects the **existing** driver edit-profile screen to Supabase. Drivers who completed the stepper and were approved can return and update any field. City is locked; slug changes are deferred to a later version.

## Step 3.1 — Supabase Auth Dashboard Settings

Go to **Authentication → Settings**:

| Setting | Value |
|---|---|
| Email confirmations | Disabled for dev, **enabled in production** |
| Minimum password length | 8 |
| JWT expiry | 3600 (default) |
| Allowed redirect URLs | Exact domain only — no wildcards |

---

## Step 3.2 — Install Supabase Client

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-react
```

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

Never import the service role key in this file or any file bundled to the client.

---

## Step 3.3 — Driver Edit Profile: Frontend Integration

**On page load:**
```typescript
const { data: { user } } = await supabase.auth.getUser()

const { data: profile } = await supabase
  .from('profiles')
  .select('display_name, avatar_url, role')
  .eq('id', user.id)
  .single()

const { data: driverProfile } = await supabase
  .from('driver_profiles')
  .select('*')
  .eq('user_id', user.id)
  .single()

const { data: cities } = await supabase
  .from('cities')
  .select('id, name')
  .eq('is_active', true)
```

**On save:**
```typescript
await supabase.from('profiles').update({
  display_name,
  avatar_url,
  updated_at: new Date().toISOString()
}).eq('id', user.id)

await supabase.from('driver_profiles').upsert({
  user_id: user.id,
  display_name,
  avatar_url,
  headline,
  bio,
  vehicle_type,
  years_driving,
  languages,
  service_area,
  hero_image_url,
  tip_cashapp,
  tip_venmo,
  tip_paypal,
  updated_at: new Date().toISOString()
}, { onConflict: 'user_id' })
```

City is read-only in the edit screen. Do not render a city dropdown — display the city name as static text.

---

## Phase 3 — Verify Before Moving On

- [ ] Approved driver can log in and see their profile data pre-filled in the edit screen
- [ ] Saving updated fields persists correctly across page reload
- [ ] City field is read-only — no dropdown, display name as text
- [ ] Re-uploading avatar replaces the old file at the same Storage path
- [ ] `grep -r "SERVICE_ROLE" .next/` returns zero results

---

---

# PHASE 4 — City-Scoped Content + Passenger Page Dynamic

## Step 4.1 — RLS Policies for Content Tables

```sql
create policy "city_picks: public read active"
on public.city_picks for select to public
using (is_active = true);

create policy "city_picks: owner manage"
on public.city_picks for all to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

create policy "travel_help_links: public read active"
on public.travel_help_links for select to public
using (is_active = true);

create policy "curated_experiences: public read active"
on public.curated_experiences for select to public
using (is_active = true);

create policy "curated_experiences: owner manage"
on public.curated_experiences for all to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());
```

---

## Step 4.2 — Passenger Page Data Fetch

Resolve by vanity slug. Derive `city_id` from the driver record — never from the URL.

```typescript
const { data: driver } = await supabase
  .from('driver_profiles')
  .select(`
    id, city_id, display_name, headline, bio,
    vehicle_type, years_driving, languages, service_area,
    hero_image_url, avatar_url,
    tip_cashapp, tip_venmo, tip_paypal, public_url_slug
  `)
  .eq('public_url_slug', slugFromUrl)
  .eq('is_published', true)
  .single()

if (!driver) return // 404 — not found or not published

const cityId = driver.city_id  // authoritative — never override from URL

const [picks, links, experiences] = await Promise.all([
  supabase.from('city_picks').select('*').eq('city_id', cityId).eq('is_active', true).order('sort_order'),
  supabase.from('travel_help_links').select('*').eq('city_id', cityId).eq('is_active', true).order('sort_order'),
  supabase.from('curated_experiences').select('*').eq('city_id', cityId).eq('is_active', true).order('sort_order')
])
```

---

## Step 4.3 — Seed Content

```sql
select id, slug from public.cities;  -- get real UUIDs first

insert into public.city_picks (city_id, title, category, description, is_active, sort_order) values
  ('<tampa-uuid>',  'Columbia Restaurant',  'food',      'Floridas oldest restaurant. Flamenco shows nightly in Ybor City.', true, 1),
  ('<tampa-uuid>',  'Sparkman Wharf',       'nightlife', 'Container bars, fire pits, waterfront views downtown.',           true, 2),
  ('<miami-uuid>',  'Wynwood Walls',        'activity',  'Iconic open-air street art museum.',                              true, 1),
  ('<miami-uuid>',  'Versailles Restaurant','food',      'Legendary Cuban food in Little Havana.',                          true, 2),
  ('<boston-uuid>', 'Freedom Trail',        'activity',  '2.5-mile walking route through 16 historic landmarks.',          true, 1),
  ('<boston-uuid>', 'Legal Sea Foods',      'food',      'Classic Boston seafood institution.',                            true, 2);
```

---

## Phase 4 — Verify Before Moving On

- [ ] Passenger page renders by vanity slug
- [ ] Tip handles render only for non-null values
- [ ] City picks match driver's city only
- [ ] Unauthenticated browser loads the page
- [ ] `is_active = false` on a pick removes it immediately
- [ ] Unpublished slug returns 404/empty state

---

---

# PHASE 5 — Subscriptions + Stripe Webhook

## Step 5.1 — RLS Policies for subscriptions

```sql
create policy "subscriptions: owner read"
on public.subscriptions for select to authenticated
using (user_id = auth.uid());

-- Zero client-write policies. Stripe webhook only.
```

---

## Step 5.2 — Stripe Webhook Handler

```typescript
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return new Response('Signature verification failed', { status: 400 })
  }

  if (['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
    const sub = event.data.object as Stripe.Subscription
    const userId = sub.metadata['supabase_user_id']
    await supabaseAdmin.from('subscriptions').upsert({
      user_id:                userId,
      stripe_customer_id:     sub.customer as string,
      stripe_subscription_id: sub.id,
      plan_code:              sub.status === 'active' ? 'plus' : 'free',
      status:                 sub.status,
      current_period_end:     new Date(sub.current_period_end * 1000).toISOString(),
      updated_at:             new Date().toISOString()
    }, { onConflict: 'user_id' })
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    await supabaseAdmin.from('subscriptions')
      .update({ status: 'past_due', updated_at: new Date().toISOString() })
      .eq('stripe_subscription_id', invoice.subscription as string)
  }

  return new Response('ok', { status: 200 })
}
```

---

## Step 5.3 — Frontend Entitlement Check

UX gate only. Real enforcement is in Phase 6 Edge Function.

```typescript
const { data: subscription } = await supabase
  .from('subscriptions')
  .select('status, plan_code')
  .eq('user_id', user.id)
  .single()

const hasPremium =
  subscription?.status === 'active' ||
  subscription?.status === 'trialing'
```

---

## Phase 5 — Verify Before Moving On

- [ ] Stripe webhook updates `subscriptions` row in Table Editor
- [ ] Webhook rejects invalid `stripe-signature` with 400
- [ ] Active subscriber sees AI input; free user sees upgrade CTA
- [ ] Direct client upsert to `subscriptions` (anon key) is rejected

---

---

# PHASE 6 — AI Edge Function + Generation Storage

## Step 6.1 — RLS Policies for ai_generations

```sql
create policy "ai_generations: owner read"
on public.ai_generations for select to authenticated
using (user_id = auth.uid());
-- Zero client insert policies. Edge Function only.
```

---

## Step 6.2 — Create the Edge Function

**Supabase Dashboard → Edge Functions → New Function → name: `generate-experience`**

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (authError || !user) return new Response('Unauthorized', { status: 401 })

  const { data: sub } = await supabaseAdmin
    .from('subscriptions').select('status').eq('user_id', user.id).single()

  if (sub?.status !== 'active' && sub?.status !== 'trialing') {
    return new Response(JSON.stringify({ error: 'premium_required' }), {
      status: 403, headers: { 'Content-Type': 'application/json' }
    })
  }

  const { driver_profile_id, prompt } = await req.json()

  const { data: driverProfile } = await supabaseAdmin
    .from('driver_profiles')
    .select('city_id, cities(name)')
    .eq('id', driver_profile_id)
    .single()

  if (!driverProfile) return new Response('Invalid driver context', { status: 400 })

  const cityName = (driverProfile as any).cities.name

  const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: `You are a local expert for ${cityName}. Respond ONLY with a valid JSON object — no prose, no markdown — matching this exact structure:
{
  "title": "short label",
  "city": "${cityName}",
  "items": [{
    "order": 1,
    "type": "place | activity | food | transport",
    "title": "string",
    "description": "string",
    "start_time": "string or null",
    "duration_label": "string or null",
    "map_link": "string or null",
    "booking_link": "string or null"
  }]
}`,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const aiData = await aiResponse.json()
  let parsed: object
  try { parsed = JSON.parse(aiData.content[0].text) }
  catch { return new Response('AI response unparseable', { status: 500 }) }

  const { data: generation } = await supabaseAdmin
    .from('ai_generations')
    .insert({
      user_id: user.id,
      city_id: driverProfile.city_id,
      driver_profile_id,
      prompt,
      response_json: parsed,
      preview_text: (parsed as any).title || prompt.slice(0, 80)
    })
    .select().single()

  return new Response(JSON.stringify(generation), { headers: { 'Content-Type': 'application/json' } })
})
```

---

## Step 6.3 — Edge Function Secrets

**Supabase Dashboard → Edge Functions → generate-experience → Secrets:**

| Key | Value |
|---|---|
| `SUPABASE_URL` | Your project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |

---

## Step 6.4 — Frontend: Calling the Edge Function

```typescript
const { data: { session } } = await supabase.auth.getSession()

const response = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-experience`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ driver_profile_id: driver.id, prompt: userInputText })
    // Never send city_id — resolved server-side
  }
)

if (response.status === 403) { /* show upgrade CTA */ }
if (!response.ok) { /* show generic error */ }

const generation = await response.json()
```

---

## Phase 6 — Verify Before Moving On

- [ ] Free user receives `{ error: 'premium_required' }` (403)
- [ ] Active subscriber receives valid structured itinerary
- [ ] Result stored in `ai_generations` with valid `response_json`
- [ ] `ANTHROPIC_API_KEY` absent from browser network tab and bundle
- [ ] Request without JWT rejected with 401

---

---

# Security Risk Reference

| Risk | Location | Mitigation |
|---|---|---|
| `SERVICE_ROLE_KEY` in client bundle | Env config | Never prefix `NEXT_PUBLIC_`. Run `grep -r SERVICE_ROLE .next/` before every deploy. |
| Driver role assigned before approval | Signup + verification | Trigger assigns `guest`. Role promoted to `driver` only by server-side approve API route after admin action. |
| Admin self-approves via client | Admin panel | Role promotion only via `/api/admin/approve-driver` which server-side verifies caller is `admin`. |
| Verification documents publicly accessible | Storage | `driver-documents` bucket is **private**. Admin access uses signed URLs generated server-side only. |
| Signed URL leaked or cached | Admin panel | 1-hour expiry on all signed document URLs. Regenerate on every admin panel load. |
| Duplicate vanity slugs | Stepper Step 5 | DB `unique` constraint on `public_url_slug` + debounced real-time check before submit. |
| Auto-publish without driver review | Stepper + approval | `is_published` never set automatically. Only explicit driver action from dashboard. |
| Incomplete signup grants driver access | Role logic | `profiles.role` stays `guest` through entire stepper and verification. `driver` only after admin approves. |
| Driver bypasses dashboard gate | Routing guard | Layout-level redirect checks `driver_applications.status === 'approved'` on every dashboard route. |
| User self-promotes subscription | `subscriptions` | Zero client-write RLS policies. Stripe webhook + service role only. |
| User spoofs `city_id` in AI request | Edge Function | Client sends `driver_profile_id` only. City resolved server-side. |
| Fake Stripe webhook grants premium | Webhook | `stripe.webhooks.constructEvent` required. 400 on failure. |
| AI API key in browser | Edge Function secrets | `ANTHROPIC_API_KEY` in Edge Function secrets only. |
| Arbitrary role string | DB constraint | `check (role in ('guest', 'driver', 'admin'))` at DB level. |
| Unpublished driver page readable | `driver_profiles` RLS | Public select requires `is_published = true`. |
| Cross-city content on passenger page | Fetch logic | All content queries use `driver_profiles.city_id`. Never URL params. |
| RLS off on a table | DB audit | Audit query: `select tablename, rowsecurity from pg_tables where schemaname = 'public'`. |
| Storage path traversal | Storage RLS | `(storage.foldername(name))[1] = auth.uid()::text` on all write policies. |

---

# Screen-to-Table Reference

| Screen | Reads From | Writes To |
|---|---|---|
| Login | `auth.users` | — |
| Signup stepper Steps 1–6 | `cities`, `driver_signup_progress` | `auth.users`, `profiles`, `driver_signup_progress`, `driver_profiles` |
| Signup stepper Step 7 (docs) | `driver_profiles` | `driver_applications`, `driver_documents`, Storage: `driver-documents` |
| `/verify/status` | `driver_applications`, `driver_documents` | — |
| `/admin/applications` | `driver_applications`, `driver_documents`, `profiles` | `driver_applications` (status/notes) |
| Admin approve action | `profiles` (caller role check) | `profiles.role`, `driver_applications.status` via API route |
| Driver edit profile | `profiles`, `driver_profiles`, `cities` | `profiles`, `driver_profiles` |
| Driver publishes page | `driver_applications` (approval check) | `driver_profiles.is_published` |
| Passenger page | `driver_profiles`, `city_picks`, `travel_help_links`, `curated_experiences` | Nothing |
| AI generation | `subscriptions` via Edge Fn | `ai_generations` via Edge Fn |
| Subscription status | `subscriptions` | Via Stripe webhook only |

---

# What Not to Build

- No real-time ride dispatch or driver availability calendars
- No in-app messaging between driver and passenger
- No automated Uber/Lyft API verification — no public API exists
- No Checkr background check integration (future enhancement)
- No document OCR or automated validation (future enhancement)
- No self-serve re-application flow for rejected drivers in V1
- No self-serve city change — admin action only
- No additional cities beyond Boston, Tampa, Miami
- No additional roles beyond `guest`, `driver`, `admin`
- No bookable services — all outbound actions open external sites
- No marketplace or partner features until all 6 phases are stable
