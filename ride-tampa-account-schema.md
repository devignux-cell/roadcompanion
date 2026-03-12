# Roam Companion — Account Schema & Auth Feature Spec

---

## Account Table

The `accounts` table is the single source of truth for both **Driver** and **Passenger** identities. All passenger experiences (trivia scores, saved places, tip interactions) are associated to an `account_id`.

### Schema

```typescript
type Account = {
  // Identity
  id: string;                  // UUID v4, e.g. "a1b2c3d4-..."  (primary key)
  type: "Driver" | "Passenger";
  username: string;            // unique, lowercase
  password_hash: string;       // bcrypt hash — never store plaintext
  email?: string;              // optional for v1, required for v2

  // Profile
  display_name: string;        // shown to passengers, e.g. "Mike T."
  city: string;                // e.g. "Tampa"
  profile_pic_url?: string;    // URL to uploaded avatar (S3 / Supabase Storage)
  bio?: string;        
  custom_url: string; // This is for the url /{username}/companion . 'companion' is the passenger experience lading page. Populate the username into the url.

  // Payment platforms (Driver only — null for Passenger)
  tips: {
    cashapp?: string;          // handle e.g. "$MikeTampa"
    venmo?: string;            // handle e.g. "@MikeTampa"
    paypal?: string;           // handle e.g. "MikeTampa"
  };

  // QR (Driver only)
  qr_code_url: string;         // generated URL: roamcompanion.app/ride/[id]

  // Passenger experience association
  // Every scan of a driver QR creates a session tied to driver's account_id.
  // Passenger accounts optionally link their own profile for score persistence.
  passenger_experience?: {
    linked_driver_id?: string; // account_id of the driver they're riding with
    trivia_scores: {
      category: string;
      high_score: number;
      played_at: string;       // ISO timestamp
    }[];
    saved_places: string[];    // place names
  };

  // Metadata
  created_at: string;          // ISO timestamp
  updated_at: string;          // ISO timestamp
  is_active: boolean;

  // v2 placeholders — not in v1
  // theme?: "default" | "neon" | "chill" | "pro";
  // greeting?: string;
  // playlist_url?: string;
  // verified?: boolean;
  // total_tips_received?: number;
  // total_rides?: number;
};
```

---

## Dummy Driver Object (Seed / Test Account)

```json
{
  "id": "1",
  "type": "Driver",
  "username": "test",
  "password_hash": "test",

  "display_name": "Carlos V.",
  "city": "Tampa",
  "profile_pic_url": "https://i.pravatar.cc/150?img=12",
  "bio": "Ybor City native. 5 ⭐ since 2021. Ask me anything about Tampa.",
  "custom_url": "/{username}/companion",

  "tips": {
    "cashapp": "$CarlosTampa",
    "venmo": "@CarlosTampa",
    "paypal": "CarlosTampaRides"
  },

  "qr_code_url": "https://roamcompanion.app/ride/1",

  "passenger_experience": null,

  "created_at": "2024-03-01T09:00:00.000Z",
  "updated_at": "2025-03-10T14:32:00.000Z",
  "is_active": true
}
```

> ⚠️ `password_hash` is set to `"test"` here for seed/dev only. In production this must be a bcrypt hash. Never commit real credentials.

---

## Login Feature Spec (v1)

### Scope
Driver login only. Passengers are unauthenticated in v1 — their experience is tied to the driver's QR URL.

---

### UI Flow

```
Home Screen
  └── [Login] button (top-right corner)
        │
        ▼
  Login Page
    ├── Username field
    ├── Password field
    ├── [Sign In] button
    │     │
    │     ▼  (matches dummy account: username="test", password="test")
    │
    └── Edit Profile Page  (Driver Dashboard — profile tab focused)
          ├── Display Name
          ├── City
          ├── Profile Pic URL       (v1: text input; v2: file upload)
          ├── Bio
          ├── Cash App handle
          ├── Venmo handle
          ├── PayPal handle
          └── [Save Changes] button → updates account object + localStorage
```

---

### Component Map

| Screen | Component | Notes |
|---|---|---|
| Top-right Login button | `HomeScreen` | Renders in hero header area |
| Login page | `LoginScreen` | New screen — `screen === "login"` |
| Edit Profile | `DriverEditProfile` | Replaces / extends current `DriverDashboard` profile tab |

---

### Auth Logic (v1 — localStorage mock)

```typescript
// mock auth — swap for Supabase auth in v2
const login = (username: string, password: string): Account | null => {
  if (username === DUMMY_ACCOUNT.username && password === DUMMY_ACCOUNT.password_hash) {
    localStorage.setItem("currentAccountId", DUMMY_ACCOUNT.id);
    return DUMMY_ACCOUNT;
  }
  return null;
};

const logout = () => {
  localStorage.removeItem("currentAccountId");
};

const getCurrentAccount = (): Account | null => {
  const id = localStorage.getItem("currentAccountId");
  if (!id) return null;
  const raw = localStorage.getItem(`account_${id}`);
  return raw ? JSON.parse(raw) : DUMMY_ACCOUNT; // fallback to seed
};
```

---

### Editable Fields on Edit Profile Page

| Field | Type | Required | Notes |
|---|---|---|---|
| `display_name` | text | ✅ | Shown to passengers |
| `city` | text | ✅ | |
| `profile_pic_url` | text (URL) | ❌ | v2: file upload to Supabase Storage |
| `bio` | textarea | ❌ | Max 120 chars |
| `tips.cashapp` | text | ❌ (min 1) | Prefix `$` shown inline |
| `tips.venmo` | text | ❌ (min 1) | Prefix `@` shown inline |
| `tips.paypal` | text | ❌ (min 1) | |

> At least one tip handle must remain filled. Validation mirrors the onboarding flow.

---

### What Does NOT Change in v1

- `id` — immutable
- `type` — immutable  
- `username` — immutable (v2: allow change with email confirm)
- `qr_code_url` — derived from id, immutable
- `created_at` — immutable

---

## v2 Upgrade Path

| Feature | What changes |
|---|---|
| Real auth | Swap `localStorage` mock → Supabase `auth.signIn()` |
| Passwords | Store `bcrypt` hash, never plaintext |
| Profile photo | File upload → Supabase Storage → update `profile_pic_url` |
| Passenger accounts | Enable `passenger_experience` object, link via QR session |
| Driver analytics | Add `total_tips_received`, `total_rides`, `total_scans` to account |
| Theme + greeting | Uncomment v2 fields in schema, add to Edit Profile form |

---

*Last updated: March 2026 · Roam Companion v1*
