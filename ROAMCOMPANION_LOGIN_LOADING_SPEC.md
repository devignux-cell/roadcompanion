# RoamCompanion — Login Page Video Background + Animated Loading Screen Spec

> **Scope:** Two isolated UI features. Neither touches routing logic, auth, or data. Both are pure presentation layer.

---

## Feature 1 — Login Page: Video Background + Overlay

### What Changes

The login page (`/login` or whatever route renders the login form) gets a fullscreen looping video background with a dark gradient overlay and preserved orb effects. **All other pages are unaffected.**

### Video Asset

```
src/lib/images/roam-commercial.mp4
```

Import it directly in the login component:

```tsx
import commercialVideo from '@/lib/images/roam-commercial.mp4'
```

Or reference it as a static path if your bundler doesn't support video imports:

```tsx
const VIDEO_SRC = '/images/roam-commercial.mp4'
```

---

### Video Element Requirements

| Property | Value | Reason |
|---|---|---|
| `autoPlay` | true | Starts immediately on mount |
| `loop` | true | Plays continuously |
| `muted` | true | Required for autoplay in all browsers |
| `playsInline` | true | Prevents fullscreen takeover on iOS |
| `preload` | `"auto"` | Loads before user interaction |
| object-fit | `cover` | Fills container without letterboxing |
| position | `fixed` | Behind all content |
| z-index | `-2` | Below overlay and content |
| pointer-events | `none` | Non-interactive |

```tsx
<video
  autoPlay
  loop
  muted
  playsInline
  preload="auto"
  style={{
    position: 'fixed',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: -2,
    pointerEvents: 'none',
  }}
>
  <source src={commercialVideo} type="video/mp4" />
</video>
```

---

### Gradient Overlay

A single `div` sits between the video (`z-index: -2`) and the page content (`z-index: 1`). It applies:

- A **grayish dark tone** at the top (semi-transparent)
- Transitions into a **near-black** at the bottom
- This keeps the top of the video readable while grounding the login form visually

```tsx
<div
  style={{
    position: 'fixed',
    inset: 0,
    zIndex: -1,
    background: `linear-gradient(
      to bottom,
      rgba(10, 10, 20, 0.55) 0%,
      rgba(10, 10, 20, 0.70) 40%,
      rgba(10, 10, 20, 0.88) 75%,
      rgba(10, 10, 20, 0.97) 100%
    )`,
    pointerEvents: 'none',
  }}
/>
```

Tweak the rgba opacity values to taste. The key shape is: **lighter at top, heavier at bottom**.

---

### Orb Globes

Keep the existing orbs exactly as they are. They sit at `z-index: 0` or higher, above both the video and overlay, so they remain visible through the overlay's transparency. No changes needed.

---

### Title / Branding

Per design direction: make `"RoamCompanion"` title smaller so the full word fits on one line without wrapping.

| Before | After |
|---|---|
| `fontSize: 44` (two-line: "Ride / Tampa") | `fontSize: 28–32` (one line: "RoamCompanion") |
| `fontFamily: Syne 800` | Keep Syne 800 — just reduce size |

Adjust the hero section `paddingTop` to push content slightly lower on the screen (e.g., `paddingTop: 120px` instead of `60px`).

---

### Login Page Layer Stack (z-index order, bottom to top)

```
z-index: -2   <video>                    — commercial video, loops, muted
z-index: -1   <div overlay>              — dark gradient, transparent top → opaque bottom
z-index:  0   <div orb1>, <div orb2>     — existing colored radial orbs (unchanged)
z-index:  1   <div page content>         — login form, title, nav cards
```

---

### Isolation — Other Pages

Render the video + overlay **only** inside the login page component. Do not add it to a shared layout or root component. Every other screen retains its existing `background: #0A0A0F` solid color with orbs. Nothing else changes.

```tsx
// LoginPage.tsx — only this file gets the video
export const LoginPage = () => {
  return (
    <>
      <VideoBackground />   {/* video + overlay, defined only here */}
      <OrbGlobes />         {/* existing orbs, shared or copied */}
      <LoginForm />
    </>
  )
}
```

---

---

## Feature 2 — Animated Loading Screen

### When It Appears

The loading screen appears whenever the user triggers a route transition that requires content to load — the primary trigger is clicking **"Create Driver Account"**. It can also wrap any other navigation action that needs a loading state (e.g., navigating to a dashboard for the first time).

### Rules

| Rule | Value |
|---|---|
| Minimum display time | **3 seconds** — never dismiss earlier even if content is ready |
| Maximum display time | Content load time, if longer than 3s |
| Dismiss condition | **Both** 3 seconds elapsed **AND** target content is loaded |
| Background | Gradient only — **no video** |
| Audio | None |

```tsx
const MIN_LOADING_MS = 3000

useEffect(() => {
  const start = Date.now()

  Promise.all([
    fetchRequiredContent(),                        // your actual data load
    new Promise(res => setTimeout(res, MIN_LOADING_MS))  // 3s floor
  ]).then(() => {
    setIsLoading(false)
  })
}, [])
```

---

### Background

Use the existing app background — no video, no new treatment. The gradient from the app's base `bg` color (`#0A0A0F`) is the canvas. The orbs can remain visible in the background if they are globally rendered, but they are not required on the loading screen.

---

### Emoji Sequence

Three icons play in sequence. Each icon:

- Is **large** (approximately `120–140px` rendered size)
- Uses a **3D cartoony emoji style** — render as text emoji at large size, or use a 3D emoji image asset if available
- Has a **subtle white/light fill with an inner shadow** effect that makes it look embossed/pressed into the background (see CSS below)
- Is **centered** both horizontally and vertically on screen
- **Fades in** from opacity 0 → 1
- **Fades out + slides left** as the next icon takes over

| Order | Emoji | Unicode | Description |
|---|---|---|---|
| 1 | ✈️ | U+2708 | Airplane — travel departure |
| 2 | 🚗 | U+1F697 | Car — rideshare/driver |
| 3 | 🧳 | U+1F9F3 | Suitcase — arriving, luggage |

---

### Animation Timing

Each icon occupies a ~1 second window. The transitions overlap slightly for smoothness.

```
t = 0.0s    Plane fades IN
t = 0.8s    Plane starts fade OUT + slide left
t = 1.0s    Car fades IN
t = 1.8s    Car starts fade OUT + slide left
t = 2.0s    Suitcase fades IN
t = 2.8s    Suitcase starts fade OUT + slide left (if looping) OR holds until dismiss
```

Total natural cycle: **~3 seconds** — aligns with the minimum display time floor.

If content takes longer than 3s, the sequence loops from the beginning.

---

### CSS — Embossed Emoji Style

The "embedded in background" look is achieved with a combination of:

- **Low opacity white color** on the emoji (text-shadow/filter, since emoji ignores `color`)
- **Drop shadow inward simulation** via `filter: drop-shadow()`
- **Subtle brightness reduction** so it reads as part of the surface, not floating on top

```css
.loading-icon {
  font-size: 130px;
  line-height: 1;
  display: block;

  /* Desaturate and lighten toward a pale ghost of the emoji */
  filter:
    grayscale(0.3)
    brightness(1.4)
    drop-shadow(0px 4px 12px rgba(255, 255, 255, 0.08))
    drop-shadow(0px -2px 6px rgba(0, 0, 0, 0.6));

  /* Inner shadow simulation — the key to the "embedded" look */
  /* Use a pseudo-element or a layered wrapper div for true inner shadow */
  opacity: 0.85;
}
```

For a **true inner shadow** (which CSS `box-shadow` inset doesn't apply to emoji), wrap each emoji in a container and apply:

```css
.icon-wrapper {
  position: relative;
  display: inline-block;
}

.icon-wrapper::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  box-shadow: inset 0 4px 16px rgba(0, 0, 0, 0.5), inset 0 -2px 8px rgba(255, 255, 255, 0.04);
  pointer-events: none;
}
```

---

### Keyframe Animations

```css
@keyframes iconEnter {
  from {
    opacity: 0;
    transform: translateX(40px);   /* enters from the right */
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes iconExit {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(-50px);  /* exits to the left */
  }
}
```

Apply to each icon:

```tsx
// Plane: visible 0s → 1s
<span style={{ animation: 'iconEnter 0.4s ease forwards, iconExit 0.3s ease 0.8s forwards' }}>
  ✈️
</span>

// Car: visible 1s → 2s
<span style={{ animation: 'iconEnter 0.4s ease 1.0s forwards, iconExit 0.3s ease 1.8s forwards' }}>
  🚗
</span>

// Suitcase: visible 2s → holds
<span style={{ animation: 'iconEnter 0.4s ease 2.0s forwards' }}>
  🧳
</span>
```

Set all icons' initial state to `opacity: 0` and `display: none` (or `visibility: hidden`) until their enter animation fires. Use `animation-fill-mode: forwards` to hold the final state.

---

### React Component Structure

```tsx
// LoadingScreen.tsx

const LoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const icons = ['✈️', '🚗', '🧳']
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Component controls its own dismiss after 3s floor
    // Parent also passes onComplete to signal content readiness
    // Actual dismiss = max(3000ms, content ready)
  }, [])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#0A0A0F',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Orbs optional — can include existing orb divs here */}

      <div style={{ position: 'relative', width: 140, height: 140 }}>
        {icons.map((icon, i) => (
          <span
            key={icon}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 120,
              opacity: 0,
              animation: `
                iconEnter 0.4s ease ${i * 1.0}s forwards,
                ${i < icons.length - 1 ? `iconExit 0.3s ease ${i * 1.0 + 0.8}s forwards` : ''}
              `.trim(),
            }}
          >
            {icon}
          </span>
        ))}
      </div>
    </div>
  )
}
```

---

### Looping Behavior (if content takes > 3s)

If content hasn't loaded when the suitcase finishes its cycle, restart the sequence:

```tsx
const CYCLE_DURATION = 3000  // matches the 3s animation window

useEffect(() => {
  const loop = setInterval(() => {
    // Reset animation by toggling a key prop or re-mounting the icon spans
    setAnimKey(k => k + 1)
  }, CYCLE_DURATION)

  return () => clearInterval(loop)
}, [contentLoaded])

// Stop looping once content is ready
useEffect(() => {
  if (contentLoaded) clearInterval(loopRef.current)
}, [contentLoaded])
```

Use a `key={animKey}` on the icon container to force React to remount and restart CSS animations cleanly.

---

---

## Summary Checklist

### Login Video Background
- [ ] `roam-commercial.mp4` plays fullscreen, looped, muted, no controls
- [ ] Gradient overlay: grayish-dark at top → near-black at bottom
- [ ] Existing orb globes remain visible above the overlay
- [ ] Title "RoamCompanion" fits on one line (reduced font size)
- [ ] Content pushed slightly lower (increased top padding)
- [ ] Video + overlay rendered **only** on the login page component
- [ ] All other pages unchanged — no video, no overlay

### Animated Loading Screen
- [ ] Appears on "Create Driver Account" click (and other nav transitions as needed)
- [ ] Minimum 3-second display — never dismisses before 3s regardless of load speed
- [ ] Content must be ready before dismissal — both conditions required
- [ ] Background is gradient only — no video on loading screen
- [ ] Plane ✈️ enters, then exits left
- [ ] Car 🚗 enters, then exits left
- [ ] Suitcase 🧳 enters, holds until dismiss or next loop
- [ ] All icons: large (~120px), centered, 3D cartoony style, embedded/embossed look
- [ ] Sequence loops cleanly if content takes longer than 3s
- [ ] `animation-fill-mode: forwards` on all keyframes — no flickering between states
