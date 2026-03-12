# Roam Companion — Product Brief & Technical Specification

> **This document is the source of truth for Claude Code.** Read this before making any changes to the codebase. Every architectural decision, feature, naming convention, and monetization strategy is documented here. When in doubt, refer back to this file.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Current State of the App](#2-current-state-of-the-app)
3. [Core User Journey](#3-core-user-journey)
4. [Feature Specifications](#4-feature-specifications)
5. [Tech Stack](#5-tech-stack)
6. [Database Schema](#6-database-schema)
7. [Monetization Strategy](#7-monetization-strategy)
8. [API & Integration Plan](#8-api--integration-plan)
9. [UX & Design System](#9-ux--design-system)
10. [Build Phases](#10-build-phases)
11. [Analytics Plan](#11-analytics-plan)
12. [Auth Strategy](#12-auth-strategy)
13. [Folder Structure](#13-folder-structure)
14. [Environment Variables](#14-environment-variables)
15. [Known Constraints & Decisions](#15-known-constraints--decisions)

---

## 1. Product Overview

**Roam Companion** is a mobile-first web application designed for rideshare passengers. A QR code mounted in the driver's vehicle gives passengers instant access to a lightweight, engaging digital experience during their ride.

### The Core Idea

Turn passive passenger attention into a useful, fun, and optionally monetized micro-experience. The passenger scans the QR code, lands on the app, and within seconds they can:

- Play a quick trivia game
- Discover local Tampa spots
- Find events happening this week
- Book hotels or experiences
- Optionally tip the driver

The experience must feel **instant, premium, and frictionless**. No forced sign-up. No loading spinners. No clutter.

### Who This Is For

- **Primary user:** Rideshare passengers in Tampa Bay (tourists, locals, visitors)
- **Operator:** The driver — they set up the QR code, collect tips, and benefit from a better passenger experience
- **Future:** Could expand to other cities as a white-label platform

### Business Goals

1. Generate passive income through affiliate commissions (hotel/car/tour bookings)
2. Generate direct income through optional driver tips
3. Create engagement through games and leaderboards that encourage repeat scans
4. Build a local Tampa discovery layer that becomes genuinely useful

---

## 2. Current State of the App

The current codebase is a **single-file React component** (`roam-companion.jsx`) that serves as the interactive prototype / MVP UI. It is fully functional as a mock and has been built to production visual standards.

### What's Already Built

| Screen | Status | Notes |
|--------|--------|-------|
| Home | ✅ Complete | Nav cards with stagger animation, live score badge |
| Games (category select) | ✅ Complete | 4 categories, leaderboard teaser |
| Game (trivia flow) | ✅ Complete | Streak logic, answer reveal, score accumulation |
| Results | ✅ Complete | Score summary, streak badge, play again |
| Explore Tampa | ✅ Complete | Filter tabs, expandable place cards, map links |
| Events / Things To Do | ✅ Complete | Event cards with hover glow |
| Travel Help | ✅ Complete | Affiliate link tiles |
| Tip Jar | ✅ Complete | 3 payment methods, confirmation state |

### What Needs to Be Built Next

- Next.js project scaffold with proper routing
- Supabase backend (database + auth)
- Real leaderboard with persistent scores
- Username creation flow post-game
- Dynamic content from database (trivia questions, places, events)
- QR code generator for driver dashboard
- Analytics tracking (Plausible or GA)
- Admin panel for managing content

---

## 3. Core User Journey

```
Passenger enters car
        ↓
Scans QR code on dashboard/seat
        ↓
Lands on Roam Companion home screen (< 1 second load)
        ↓
Browses nav: Games / Explore / Events / Travel / Tip
        ↓
[Path A] Plays trivia → answers 5 questions → sees score
        ↓
Prompted to enter username → score saved to leaderboard
        ↓
[Path B] Explores Tampa → taps a spot → opens Google Maps
        ↓
[Path C] Taps Travel Help → clicks hotel link → affiliate conversion
        ↓
[Path D] Taps Tip → opens Cash App / Venmo / PayPal
        ↓
Ride ends. Passenger closes browser.
```

**Critical constraint:** The entire first interaction must be possible in under 60 seconds. Most passengers will only have 5–15 minutes. Every screen must be high-value, fast, and thumb-friendly.

---

## 4. Feature Specifications

### 4.1 Games

The games section is the primary engagement driver. It creates repeat behavior and leaderboard competition.

**MVP Game Type: Trivia**

- 5 questions per round
- 4 answer choices (A / B / C / D)
- Correct answer = 100 points + (streak × 10) bonus points
- Wrong answer = 0 points, streak resets
- Streak indicator shown in header during game
- 🔥 burst animation appears at streak ≥ 3
- Progress bar fills as questions are answered
- Answer reveal: correct = teal highlight, wrong = red highlight

**Categories (current):**
- 🌴 Tampa — local knowledge
- 🎵 Music — Tampa music scene + general
- 🍕 Food — Tampa food culture
- ⚡ Sports — Tampa Bay teams

**Future game types to add:**
- This or That — swipe-based binary choice game
- Guess the Place — photo of a Tampa location, user picks from 4 options
- Emoji Quiz — decode an emoji sequence to name a Tampa spot
- Speed Round — timed mode, 10 seconds per question

**Leaderboard:**
- Daily leaderboard resets at midnight
- All-time leaderboard persists
- Username stored in Supabase
- Score stored per game session with category, duration, streak
- Top 10 shown on leaderboard screen
- "You're #7 today" shown on results screen if username exists

**Username Flow:**
- Anonymous play is default — no barrier to starting a game
- After a game ends, if user has no username: "Save your score to the leaderboard?"
- Simple one-field input: just a display name (no password required at first)
- Stored in Supabase Auth (anonymous → named user upgrade later)

---

### 4.2 Explore Tampa

A curated local discovery section. This is not a Yelp clone — it is a handpicked, high-quality local guide with affiliate monetization potential.

**Place Card Data Structure:**
```
name: string
category: Food | Bars | Beaches | Attractions | Coffee | Date Spots | Hidden Gems
tag: string (short label e.g. "Historic", "Must-try", "Free")
description: string (1-2 sentences, personality-driven)
neighborhood: string (Ybor City, Heights, Downtown, Hyde Park, etc.)
emoji: string
color: hex string (each place has a brand accent color)
googleMapsUrl: string
affiliateUrl: string | null (for bookable places like OpenTable later)
imageUrl: string | null
isFeatured: boolean
```

**Filter tabs:** All · Food · Bars · Beaches · Attractions

**Expanded card actions:**
- 📍 Directions → opens Google Maps link
- 🔗 Details → opens affiliate/reservation link or Google search fallback

**Current hardcoded places (to migrate to Supabase):**
Columbia Restaurant, Ulele, Armature Works, Bern's Steak House, Busch Gardens, Channelside Bay Plaza, Sparkman Wharf, Clearwater Beach, Tampa Riverwalk, Ichicoro Ramen

---

### 4.3 Events / Things To Do

Helps passengers find things to do while they're in Tampa. High potential for Eventbrite affiliate integration.

**Event Card Data:**
```
title: string
date: string (human-readable, e.g. "Mar 15" or "Every Sat")
venue: string
type: Music | Sports | Food | Market | Comedy | Festival
emoji: string
color: hex
ticketUrl: string | null
affiliateUrl: string | null
isRecurring: boolean
```

**Current hardcoded events (to migrate to Supabase):**
Gasparilla Music Fest, Tampa Bay Beer Week, Bucs vs Saints, Ybor City Night Market, Jazz & Rib Fest, Lightning vs Panthers

**Phase 2:** Connect to Eventbrite API to pull live events dynamically.

---

### 4.4 Travel Help

Affiliate monetization hub. Each tile links out to a partner with a tracked affiliate URL.

**Current affiliate partners:**
| Partner | Category | Program |
|---------|----------|---------|
| Booking.com | Hotels | Free to join, % of reservation revenue |
| DiscoverCars | Car Rental | Commission on completed rentals |
| Viator | Experiences | Commission on booked tours |
| Expedia | Flights | Affiliate program |
| Amazon | Shopping | Associates program, % of purchases |

**FTC Disclosure:** Footer on Travel screen reads: "Some links may earn a commission · FTC-compliant disclosure" — this must remain on all affiliate-heavy screens.

---

### 4.5 Tip Your Driver

Simple, tasteful tipping page. No payment processing needed — just deep links to external apps.

**Payment methods:**
- 💚 Cash App — `$RoamCompanion` (replace with real driver handle)
- 💙 Venmo — `@RoamCompanion`
- 💛 PayPal — `paypal.me/RoamCompanion`

**UX copy:** "Tips appreciated, never expected. Every bit means a lot."

**Confirmation state:** When a tip method is tapped, it shows a ✓ checkmark and a thank-you message below.

**Important:** The handles above are placeholders. In the real app, these should be dynamic — either fetched from the driver's profile in Supabase, or configurable per QR code.

---

## 5. Tech Stack

### Frontend

| Tool | Choice | Why |
|------|--------|-----|
| Framework | Next.js 14 (App Router) | Fast, SEO-ready, Vercel-native, easy routing |
| Language | TypeScript | Type safety, better DX in Claude Code |
| Styling | Inline styles + CSS modules | Already established in prototype; no Tailwind compiler needed |
| Fonts | Syne (display) + DM Sans (body) | Via Google Fonts, already in prototype |
| Hosting | Vercel | Zero-config Next.js deployment, preview URLs |

### Backend

| Tool | Choice | Why |
|------|--------|-----|
| Database | Supabase (Postgres) | SQL is cleaner for relational leaderboard/trivia data |
| Auth | Supabase Auth | Anonymous → named user upgrade flow, magic link later |
| Storage | Supabase Storage | Place/event images |
| Edge Functions | Supabase Edge | Click tracking, affiliate redirect logging |
| Realtime | Supabase Realtime | Live leaderboard updates (Phase 2) |

### Analytics

- **Phase 1:** Plausible Analytics (privacy-friendly, simple, no cookie banner needed)
- **Phase 2:** Custom event tracking via Supabase click_events table

---

## 6. Database Schema

All tables live in Supabase (Postgres). Use Row Level Security (RLS) on all tables.

### `users`
```sql
id            uuid primary key default gen_random_uuid()
username      text unique
created_at    timestamptz default now()
avatar_seed   text                    -- used to generate consistent avatar color/emoji
hometown      text                    -- optional, user-provided
auth_id       uuid references auth.users(id)
```

### `game_categories`
```sql
id      serial primary key
name    text not null              -- "Tampa", "Music", "Food", "Sports"
slug    text unique not null       -- "tampa", "music", "food", "sports"
icon    text                       -- emoji
active  boolean default true
```

### `trivia_questions`
```sql
id            serial primary key
category_id   int references game_categories(id)
question      text not null
answer_a      text not null
answer_b      text not null
answer_c      text not null
answer_d      text not null
correct       int not null check (correct in (0,1,2,3))   -- index of correct answer
difficulty    text default 'medium' check (difficulty in ('easy','medium','hard'))
active        boolean default true
created_at    timestamptz default now()
```

### `game_sessions`
```sql
id            uuid primary key default gen_random_uuid()
user_id       uuid references users(id)    -- nullable for anonymous
category_id   int references game_categories(id)
score         int not null default 0
streak_max    int not null default 0
duration_sec  int                          -- seconds to complete game
game_type     text default 'trivia'
created_at    timestamptz default now()
```

### `leaderboard`
```sql
id            serial primary key
user_id       uuid references users(id)
category_id   int references game_categories(id)
game_type     text default 'trivia'
high_score    int not null
updated_at    timestamptz default now()
-- unique per user + category + game_type
unique(user_id, category_id, game_type)
```

### `places`
```sql
id                serial primary key
name              text not null
category          text not null          -- Food, Bars, Beaches, Attractions
tag               text                   -- "Historic", "Must-try", etc.
description       text
neighborhood      text
emoji             text
color             text                   -- hex color for UI accent
google_maps_url   text
affiliate_url     text
image_url         text
google_place_id   text                   -- for future Places API integration
is_featured       boolean default false
active            boolean default true
sort_order        int default 0
```

### `events`
```sql
id                serial primary key
title             text not null
event_date        text                   -- human-readable for MVP ("Mar 15", "Every Sat")
event_date_iso    date                   -- machine-readable for sorting
venue             text
type              text                   -- Music, Sports, Food, Market, Comedy
emoji             text
color             text
ticket_url        text
affiliate_url     text
eventbrite_id     text                   -- for future Eventbrite API sync
is_recurring      boolean default false
active            boolean default true
```

### `affiliate_links`
```sql
id                serial primary key
partner_name      text not null          -- "Booking.com", "Viator", etc.
category          text                   -- Hotels, Car Rental, Experiences
display_label     text                   -- "Book a Hotel"
display_desc      text                   -- "Best rates via Booking.com"
icon              text                   -- emoji
color             text                   -- hex
destination_url   text not null          -- where the user goes
tracking_url      text                   -- affiliate-tracked version
disclosure_text   text                   -- FTC disclosure copy
active            boolean default true
sort_order        int default 0
```

### `click_events`
```sql
id              uuid primary key default gen_random_uuid()
session_id      text                     -- anonymous session identifier
user_id         uuid references users(id)
click_type      text not null            -- "affiliate", "tip", "game_start", "place_directions", "event_ticket"
target_id       text                     -- ID of the place/event/link clicked
source_screen   text                     -- which screen the click came from
created_at      timestamptz default now()
```

### RLS Policies (critical)

```sql
-- Users can only read/write their own data
-- click_events: insert only (no reads for anonymous users)
-- leaderboard: readable by all, writable only by owner
-- trivia_questions: readable by all (no writes from client)
-- places/events: readable by all (no writes from client)
```

---

## 7. Monetization Strategy

### Layer 1: Direct Tips (Immediate)

Passengers can tip directly via Cash App, Venmo, or PayPal. No platform cut. Immediate value.

### Layer 2: Affiliate Clicks → Conversions (Immediate)

Affiliate income comes from **completed actions**, not clicks. Revenue is earned when a user:
- Books a hotel stay (Booking.com → % of reservation revenue)
- Books a tour or experience (Viator → commission on booking)
- Completes a car rental (DiscoverCars → commission)
- Makes a purchase (Amazon Associates → % of qualifying purchase)
- Books a flight (Expedia → affiliate commission)

**Implementation:** All affiliate links must go through a tracked redirect. Log in `click_events` and use partner-provided tracking URLs.

### Layer 3: Sponsored Local Listings (Phase 2)

Local Tampa businesses pay to be featured in the Explore section. Mark these as `is_featured: true` and show them at the top with a "Sponsored" badge.

### Layer 4: Featured Events (Phase 2)

Event promoters pay to have their event listed and featured in the Things To Do section.

### FTC Compliance

Every screen with affiliate links must display: *"Some links may earn a commission"*

This is already present in the prototype on the home screen footer, travel screen footer, and events screen footer. Do not remove these disclosures.

---

## 8. API & Integration Plan

### Phase 1 (MVP) — No live APIs required

All data is stored in Supabase and managed manually. External links are static affiliate URLs.

- Google Maps: deep-link URLs only (`https://maps.google.com/?q=...`)
- Affiliate partners: static tracking URLs from each partner dashboard
- Tip apps: deep links to Cash App / Venmo / PayPal

### Phase 2 — Live Data

| Integration | Use | Pricing |
|------------|-----|---------|
| Google Places API | Place photos, ratings, hours, search | Pay-per-use, use field masks to control cost |
| Eventbrite API | Live event listings, ticket links | OAuth 2.0, free developer access |
| Supabase Realtime | Live leaderboard score updates | Included in Supabase plan |
| Plausible Analytics | Page views, click tracking | $9/mo or self-hosted |

### Phase 3 — Advanced

| Integration | Use |
|------------|-----|
| OpenTable | Restaurant reservations (partner access required) |
| Yelp Places API | Reviews and ratings overlay |
| Stripe | If direct payment features are added |

---

## 9. UX & Design System

### Design Tokens

```js
const COLORS = {
  bg:         "#0A0A0F",   // page background
  card:       "#13131A",   // card surface
  cardHover:  "#1A1A25",   // card on hover
  accent:     "#FF5C28",   // primary CTA, brand orange
  accentGlow: "rgba(255,92,40,0.3)",
  gold:       "#F5C842",   // score, leaderboard highlight
  teal:       "#2DFFC7",   // correct answer, success states
  purple:     "#A259FF",   // games/attractions accent
  text:       "#F0EDE8",   // primary text
  muted:      "#6B6878",   // secondary text, labels
  border:     "rgba(255,255,255,0.07)", // card borders
};
```

### Typography

- **Display / Headlines:** `Syne` weight 700–800 — used for screen titles, scores, hero text
- **Body / UI:** `DM Sans` weight 300–600 — used for all other text
- **Load via:** Google Fonts CDN

### Animation Guidelines

| Animation | Usage | Spec |
|-----------|-------|------|
| `fadeUp` | Screen transitions, card reveals | `0.4–0.5s ease`, stagger with delay |
| `float` | Emoji icons, decorative elements | `3s ease-in-out infinite`, 6px travel |
| `pulse` | Live dot indicators | `2s infinite` scale 1→1.05 |
| `burst` | Streak milestone (🔥) | `0.9s ease forwards`, scale 0.5→1.2→1 |
| Card press | All tappable cards | `scale(0.97)` on `:active` |

### Layout Rules

- Max content width: `430px` centered — optimized for mobile phones
- Horizontal padding: `16px` left/right on all screens
- Card border radius: `20px` standard, `24px` for larger feature cards
- Card gap: `12px` in vertical lists
- Icon containers: `52×52px`, `border-radius: 16px`

### Ambient Orbs

Two fixed-position gradient orbs create depth on all screens:
- Orb 1: top-right, accent orange, `rgba(255,92,40,0.12)`
- Orb 2: bottom-left, teal, `rgba(45,255,199,0.08)`
- Both: `pointer-events: none`, `z-index: 0`

### Screen Navigation Pattern

The app uses a **single-page state machine** — no URL routing in the prototype, but **should be migrated to Next.js App Router routes** in the real build:

```
/                  → Home
/games             → Game category select
/games/[category]  → Active trivia game
/games/results     → Post-game results
/explore           → Tampa places
/events            → Things to do
/travel            → Affiliate booking links
/tip               → Tip jar
```

### Mobile UX Rules

- All interactive elements minimum 44px touch target
- No horizontal scroll except filter pill rows (intentional)
- Scrollbars hidden with `::-webkit-scrollbar { display: none }`
- No form inputs except username entry (keep friction minimal)
- Back navigation: always top-left `←` button, never browser back dependency

---

## 10. Build Phases

### Phase 1 — MVP Launch (Current Priority)

**Goal:** Get a polished, working product live on a real URL within the shortest time possible.

**Deliverables:**
- [ ] Next.js project scaffold with App Router
- [ ] All screens from prototype migrated to separate route components
- [ ] Supabase project created and connected
- [ ] Database tables created (see schema above)
- [ ] Trivia questions seeded (20+ questions per category)
- [ ] Places seeded (10+ per category)
- [ ] Events seeded (6–10 current events)
- [ ] Game flow fully wired to Supabase (save scores)
- [ ] Username creation after game
- [ ] Real leaderboard with top 10 daily + all-time
- [ ] Affiliate links live with tracking
- [ ] Deployed to Vercel on custom domain
- [ ] QR code generated pointing to live URL
- [ ] Analytics installed (Plausible)

**Explicitly NOT in Phase 1:**
- Admin CMS
- Live event API
- Google Places API
- Social sharing
- Push notifications
- Multi-driver support

---

### Phase 2 — Live Data + Monetization

**Deliverables:**
- [ ] Google Places API integration for photos + ratings
- [ ] Eventbrite API for live event listings
- [ ] Admin panel (Supabase Studio + a simple custom dashboard)
- [ ] Affiliate click tracking with conversion attribution
- [ ] Driver profile system (multiple QR codes, each linked to a driver)
- [ ] Dynamic tip handles per QR code / driver
- [ ] Sponsored listings support

---

### Phase 3 — Growth

**Deliverables:**
- [ ] This or That game mode
- [ ] Guess the Place photo game
- [ ] Neighborhood guide pages
- [ ] Seasonal content modules
- [ ] OpenTable restaurant reservation integration
- [ ] City expansion framework (Miami, Orlando, etc.)
- [ ] Local business partnership portal

---

## 11. Analytics Plan

### Events to Track (from Day 1)

| Event | Properties |
|-------|-----------|
| `page_view` | screen, referrer |
| `qr_scan` | driver_id, location |
| `game_start` | category |
| `game_complete` | category, score, streak_max |
| `answer_submitted` | question_id, correct, time_taken |
| `leaderboard_username_saved` | |
| `place_expanded` | place_id, place_name |
| `place_directions_clicked` | place_id |
| `affiliate_click` | partner, category, source_screen |
| `tip_method_clicked` | method (cashapp/venmo/paypal) |
| `event_ticket_clicked` | event_id |

### KPIs to Monitor

- QR scans per day / per driver
- Game starts per session
- Game completion rate
- Average score
- Leaderboard participation rate
- Affiliate click-through rate
- Tip click rate
- Session duration

---

## 12. Auth Strategy

### Anonymous-First Approach

1. User arrives with no account
2. They can browse everything and play games without signing up
3. After completing a game, if their score is worth saving: "Want to appear on the leaderboard? Add a username."
4. Username entry = create account (email optional, just a display name for now)
5. Score is retroactively attached to their new profile

### Supabase Auth Implementation

```
Phase 1: Anonymous session → named user via username
Phase 2: Add magic link email login (for returning users)
Phase 3: Optional social login (Google) for frictionless return
```

### What's Stored Per User

- Display name (username)
- High score per category
- Game session history
- Hometown (optional, for fun)

### What's NOT stored

- Real name
- Phone number
- Precise location
- Payment info

---

## 13. Folder Structure

```
roam-companion/
├── app/
│   ├── layout.tsx                  # Root layout with fonts + metadata
│   ├── page.tsx                    # Home screen → redirect or HomeScreen component
│   ├── globals.css                 # CSS custom properties + animation keyframes
│   ├── games/
│   │   ├── page.tsx                # Category select
│   │   ├── [category]/
│   │   │   └── page.tsx            # Active game
│   │   └── results/
│   │       └── page.tsx            # Results screen
│   ├── explore/
│   │   └── page.tsx                # Tampa places
│   ├── events/
│   │   └── page.tsx                # Things to do
│   ├── travel/
│   │   └── page.tsx                # Affiliate links
│   └── tip/
│       └── page.tsx                # Tip jar
├── components/
│   ├── ui/
│   │   ├── BackHeader.tsx          # Back button + title
│   │   ├── NavCard.tsx             # Home screen nav cards
│   │   ├── PlaceCard.tsx           # Expandable place card
│   │   └── EventCard.tsx           # Event list card
│   ├── games/
│   │   ├── CategoryGrid.tsx        # 2×2 category selector
│   │   ├── QuestionCard.tsx        # Question display
│   │   ├── AnswerButton.tsx        # Answer option
│   │   ├── ProgressBar.tsx         # Q progress bar
│   │   ├── ScoreDisplay.tsx        # Score counter
│   │   └── Leaderboard.tsx         # Leaderboard list
│   └── layout/
│       ├── AmbientOrbs.tsx         # Background glow orbs
│       └── PageWrapper.tsx         # Max-width + padding wrapper
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server client
│   │   └── types.ts                # Generated types from Supabase CLI
│   ├── constants/
│   │   ├── colors.ts               # COLORS token object
│   │   └── animations.ts           # Animation constants
│   └── utils/
│       ├── score.ts                # Score calculation logic
│       └── tracking.ts             # Click event logging
├── hooks/
│   ├── useGame.ts                  # Game state machine hook
│   ├── useLeaderboard.ts           # Leaderboard data fetching
│   └── usePlaces.ts                # Places with filter
├── types/
│   ├── game.ts                     # Game types
│   ├── places.ts                   # Place types
│   └── events.ts                   # Event types
├── public/
│   └── qr-placeholder.png          # QR code (generated)
├── BRIEF.md                        # ← this file
├── .env.local                      # Supabase keys (never commit)
├── next.config.ts
└── package.json
```

---

## 14. Environment Variables

```bash
# .env.local — never commit this file

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server-side only

# Analytics (Plausible)
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=roamcompanion.com

# Feature Flags (optional)
NEXT_PUBLIC_ENABLE_LEADERBOARD=true
NEXT_PUBLIC_ENABLE_AFFILIATE=true
```

---

## 15. Known Constraints & Decisions

### Why no React Native / native app?

Web app only. Passengers scan a QR code — they will not download an app for a 10-minute ride. The web is the right delivery mechanism. PWA enhancements (install prompt, offline) can be added later.

### Why no Tailwind?

The prototype uses inline styles, which gives full control over the dark-mode design system with `COLORS` constants. Tailwind would require a compiler and its default classes don't map cleanly to the custom design tokens. Keep using inline styles + CSS modules.

### Why Supabase over Firebase?

The data model is relational — leaderboard entries reference users reference categories. SQL handles this better than Firestore. Supabase also has a friendlier admin UI for non-developers managing content.

### Why anonymous-first auth?

Forcing sign-up before playing a game kills conversion. Passengers have 5 minutes. Let them play first, ask for a name second — only if they want to save their score. This is a proven pattern for casual game apps.

### Affiliate disclosure is non-negotiable

FTC guidelines require disclosure of material connections. Every screen with affiliate links must show "Some links may earn a commission." Do not remove or hide this copy.

### QR code strategy

For Phase 1: one QR code, one URL, one driver (the operator). The tip handles are hardcoded to the operator's accounts.

For Phase 2: each driver gets a unique QR code URL (e.g., `roamcompanion.com/ride/driver123`) which loads their profile — their tip handles, their custom intro message, their car's playlist suggestions.

### Content management in Phase 1

All content (trivia questions, places, events) is seeded directly into Supabase via the Supabase Studio table editor. No admin panel needed in Phase 1 — the operator manages content directly in Supabase Studio.

---

## Quick Reference for Claude Code

When making changes to this codebase, always:

1. **Keep the mobile-first constraint** — max-width 430px, 16px horizontal padding, 44px min touch targets
2. **Use the COLORS token object** — never hardcode hex values outside of `constants/colors.ts`
3. **Preserve the animation system** — `fadeUp`, `float`, `pulse`, `burst` keyframes live in `globals.css`
4. **Anonymous-first** — never gate any content behind a login wall
5. **FTC disclosure** — affiliate link screens must always show "Some links may earn a commission"
6. **Supabase for everything** — no other backend services in Phase 1
7. **TypeScript strictly** — no `any` types, use generated Supabase types
8. **Check BRIEF.md before adding features** — if something isn't in the plan, ask before building it

---

*Last updated: March 2026 · Version 1.0 · Roam Companion*
