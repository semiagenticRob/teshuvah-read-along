# DavenAlong — Visual Identity Brief

Written by CEO Agent, 2026-04-22. Addresses the TJE meeting note that "design is load-bearing for adoption." This brief formalizes the visual identity system implied by the design prototype and extends it to the full app.

See: [[Teshuvah Read Along]], [[DavenAlong - ZmanimHeader Implementation]], [[DavenAlong - EntryPath Screen Implementation]]

---

## Design Philosophy

DavenAlong is not a productivity app. It is a sacred practice tool. The visual language should communicate:

- **Continuity with tradition** — this is ancient, serious, and worth sitting with
- **Accessibility** — but not sterile or institutional; warm, approachable, human
- **The passage of time** — davening happens at specific moments in the day; the interface knows what time it is
- **Reverence without formality** — not a legal document; more like a well-worn siddur

The design concept: *living parchment*. The app feels like a siddur that knows it's morning, that knows where you are in the service, that responds to light.

---

## Color System

### Foundation: Time-of-Day Backgrounds

The design prototype already implements this axis. Formalize it here:

| Time State | Background A | Background B | Mood |
|---|---|---|---|
| `dawn` | `#f7e3d4` | `#f4d8c6` | Pale rose-gold, the sky before Shacharit |
| `morning` | `#f6e9d2` | `#f9e6d0` | Warm parchment, full morning light |
| `afternoon` | `#f1ede0` | `#ece7d6` | Cooler, flatter — the day has started |
| `evening` | `#19202e` | `#1d2535` | Deep navy for Ma'ariv — the sky after dark |

Transitions between states: 1.4s ease — slow enough to feel like dawn breaking, not a UI animation.

### Section Accent Colors (Shacharit)

Each of the four sections of Shacharit has its own identity color used for highlights, active prayer indicators, and section intro cards.

| Section | Accent | Highlight | Usage |
|---|---|---|---|
| Birchot HaShachar | `#b07a1c` | `#d9a24a` | Warm morning gold — beginnings, blessings |
| Pesukei D'Zimra | `#c9831a` | `#eaae4c` | Orange-gold — psalms, elevation, praise |
| Shema | `#1d4a7a` | `#3f77aa` | Deep blue — declaration, gravity, the Shema |
| Amidah / Concluding | `#5c6b2f` | `#8ea051` | Forest green — grounded, complete |

These section colors should be used in:
- The ZmanimHeader indicator strip
- Section intro card headers
- The "current position" word highlight in the scroll
- The onboarding/EntryPath screen section previews

### Ink Colors

```
--ink:        #2a1d12   (primary text — deep warm brown, not pure black)
--ink-soft:   #5a4835   (secondary text — transliteration, labels)
--ink-faint:  #8a7a64   (tertiary text — hints, section numbers)
```

In dark/evening mode:
```
--ink:        #e8dfc8   (warm off-white)
--ink-soft:   #b8a988
--ink-faint:  #7d8396
```

---

## Typography

### Hebrew Text
**Frank Ruhl Libre** — a typeface designed specifically for Hebrew texts on screens. Used for all Hebrew prayer text.

- Prayer text (body): 22–24sp, weight 400
- Highlighted word (active): 22–24sp, weight 700, accent color
- Section headers: 18sp, weight 700

Alignment: right-to-left, naturally. Hebrew block sits on the right of the scroll.

### Latin Text (English / Transliteration)
**EB Garamond** — old-style serif, classical, warm. Matches the parchment aesthetic without looking like a word processor.

- Transliteration body: 16sp, weight 400, italic available for phonetic emphasis
- English meaning: 15sp, weight 400, `--ink-soft`
- Section intros / explanatory prose: 16sp, weight 400 or 500

Fallbacks: Georgia, serif.

### Display / Headings
**Cormorant Garamond** — more expressive than EB Garamond, used sparingly.

- Section intro headline (e.g., "Birchot HaShachar"): 24sp, weight 500
- Entry path screen card titles: 22sp, weight 400, italic
- App name in splash/onboarding: 32sp, weight 300, italic

---

## Texture and Surface

### Paper Grain
The design prototype uses an SVG-based noise filter at z-index 10 across the entire surface:

```css
background-image: url("data:image/svg+xml;utf8,<svg...>
  <feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/>
  <feColorMatrix values='0 0 0 0 0.15  0 0 0 0 0.12  0 0 0 0 0.08  0 0 0 0.7 0'/>
</svg>");
```

This should be applied globally in React Native using an `<Animated.View>` overlay or a custom canvas component. Opacity: 0.45–0.55. The grain is subtle — it should feel like paper, not noise.

### Card Surfaces
Prayer blocks and section intro cards use a semi-transparent surface slightly lighter than the background with no hard border:
- Background: `rgba(255, 255, 255, 0.12)` over parchment
- Border: none; use a 1px-wide left accent-color bar for active states
- Radius: 6px (subtle)
- Shadow: none; use elevation sparingly

---

## Motion Principles

1. **Slow and deliberate** — time-of-day background transitions are 1.4s. Prayer section transitions are 800ms. Nothing snaps.
2. **Scroll-driven highlighting** — the word highlight follows reading position without animation; it's immediate but the glow fades in over 200ms.
3. **No bounce** — `scrollEventThrottle={16}`, `decelerationRate="normal"`. Avoid iOS rubber-band feel on the prayer scroll.
4. **Entry path screen** — the two cards (Beginner / Returning) should animate in on mount with a 200ms stagger, slight fade + translate up from 10px. One deliberate breath.

---

## Iconography and App Icon

### App Icon Concept
A Hebrew letter **ד** (Dalet) rendered in Frank Ruhl Libre weight 700, warm gold (`#b07a1c`), centered on a dawn parchment background (`#f6e9d2`). Clean, immediate, Jewish without being decorative.

Alternative: the word **דַּוֶּן** (daven) in small caps, centered. More explicit but slightly busier.

The app icon should not use a siddur photo, a star, or generic "spiritual" imagery. The Hebrew letterform itself is the symbol.

### Navigation Icons
Use system icons (SF Symbols on iOS, Material Icons on Android) in `--ink-soft` color. No color fills. Stroke weight: medium. Size: 22pt.

Tab icons:
- Home / Today: `clock` or `sunrise`
- Shacharit: `text.book.closed` (or custom dalet mark)
- Settings: `gear`

---

## Screen-Specific Notes

### ZmanimHeader
The time-remaining bar at the top of the scroll:
- Background: section accent color at 15% opacity
- Text: "Shacharit ends in 42 min" in EB Garamond 13sp `--ink-soft`
- Warning state (<30 min): amber `#d97706`
- Urgent state (<10 min): `#dc2626`
- Transition: 500ms ease on color change

### EntryPath Screen (onboarding)
This is a critical first impression. Two tappable cards:

**"New to davening"**
- Background: warm dawn parchment
- Headline: "Just starting?" in Cormorant Garamond italic 22sp
- Subtext: "We'll walk you through every section." in EB Garamond 15sp `--ink-soft`
- Accent bar: Birchot HaShachar gold

**"Coming back to it"**
- Background: slightly cooler morning parchment
- Headline: "Back into davening?" in Cormorant Garamond italic 22sp
- Subtext: "Dive in wherever you are." in EB Garamond 15sp `--ink-soft`
- Accent bar: Shema blue

Both cards: full-width, 120px height, 12px radius, 16px horizontal margin. 16px gap between cards.

---

## What Rob Should Do With This

This brief formalizes the visual direction that exists in the design prototype. Rob does not need to design from scratch — the prototype has already made the key decisions. What's needed:

1. **Extract the CSS variables to a React Native theme file** — `src/theme/colors.ts` and `src/theme/typography.ts` using these values
2. **Brief a designer (if using one)** — hand them this document plus the `design-prototype/shacharit-scroll.html` file. One hour of their time will produce a full Figma component kit.
3. **Commission an app icon** — the Hebrew Dalet concept is simple enough to brief a Fiverr designer in 30 minutes. Budget: $50-100.
4. **Apply the section accent colors** to the existing `ShacharitScrollScreen.tsx` section intro cards — they're already built, just need the right colors assigned.

---

## Design Checklist

- [ ] Extract color tokens to `src/theme/colors.ts`
- [ ] Extract typography tokens to `src/theme/typography.ts`
- [ ] Apply section accent colors to ShacharitScrollScreen section intro cards
- [ ] Apply time-of-day background transitions to root app layout
- [ ] Commission app icon (Hebrew Dalet concept)
- [ ] Brief designer on EntryPath screen card designs (or implement directly)
- [ ] Add paper grain texture overlay to app root
- [ ] Apply ZmanimHeader time-warning color states (amber/red thresholds)
