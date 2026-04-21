2026-04-19

Status: #baby

Tags: [[davenalomg]] [[teshuvah-read-along]] [[technical-spec]] [[ui-design]]

# DavenAlong — Continuous Scroll Shacharit Redesign Spec

CEO Agent overnight run, 2026-04-19.

Technical design specification for the pivoted Shacharit-first continuous scroll UI, per the direction from the TJE meeting (2026-04-17). This spec is implementation-ready — a developer (or agent) can build directly from this.

---

## Context

Current architecture: prayers are served one at a time through a `ReadAlongScreen` that receives a `prayerIndex` and loads each prayer individually. Navigation is prayer-by-prayer via `nextPrayer` / `previousPrayer` in the store.

**Pivot goal:** Replace the prayer-by-prayer model with a continuous vertical scroll that renders all of Shacharit as one long document, with section headers dividing the four major parts. The experience should feel like reading a real siddur, not a slideshow.

---

## New Screen: `ShacharitScrollScreen`

### Core Concept

One `ScrollView` rendering all Shacharit sections in sequence. No "next prayer" button — the user scrolls through the entire service. Auto-scroll and word-sync can still be supported but operate on the full document coordinate space rather than per-prayer.

### Section Structure

Shacharit has four major parts (aligned with Rabbi Feigenbaum's siddur structure):

| Section | Hebrew | Content |
|---------|--------|---------|
| 1. Morning Blessings | Birchot HaShachar | Modeh Ani → Asher Yatzar → Elohai Neshamah → Torah blessings → 15 Birchot HaShachar |
| 2. Verses of Praise | Pesukei D'Zimra | Baruch She'Amar → Ashrei → Yishtabach |
| 3. Shema & Its Blessings | Kriyat Shema | Barchu → Yotzer Or → Ahavah Rabbah → Shema → V'Ahavta → Emet V'Yatziv → Amidah (Shacharit) |
| 4. Concluding Prayers | Concluding | Tachanun → Ashrei → Alenu → Kaddish |

---

## Display Mode Toggle

Three modes, toggleable via a floating persistent header or sticky top bar:

| Mode | What It Shows |
|------|---------------|
| `hebrew` | Hebrew text only |
| `transliteration` | Transliteration only |
| `english` | English translation only |
| `hebrew+english` | Hebrew above, English below (side-by-side on tablet) |

Current `displayMode` from `useSettingsStore` maps to these — extend the type if needed.

**UI:** A segmented control or icon row pinned to the top of the screen, always visible. Tapping a mode instantly re-renders the entire scroll content in that mode.

---

## Section Introduction Cards

Before each of the four sections, insert a full-width "intro card" component:

```tsx
<SectionIntroCard
  sectionNumber={1}
  hebrewTitle="בִּרְכוֹת הַשַּׁחַר"
  englishTitle="Morning Blessings"
  description="We begin by acknowledging the gift of a new day and the body that carries us. These blessings are the first words we offer — gratitude before requests."
  entryPath={userEntryPath} // 'beginner' | 'returning'
/>
```

For `beginner` path: show the description text. Include a brief "why we say this" orientation.
For `returning` path: minimal card — just the section name and Hebrew title, no explanation. Gets out of the way.

---

## Dual Entry Paths

Controlled by a `userEntryPath` preference in `useSettingsStore` (or a one-time onboarding screen):

**Beginner path:**
- Section intro cards show full orientation text
- Each prayer has a collapsible "About this prayer" disclosure below the text
- Transliteration is the default display mode

**Returning path:**
- Section intros are minimal (title only)
- No "About" disclosures shown by default
- Hebrew is the default display mode

Entry path is set once at onboarding and can be changed in Settings.

---

## Zmanim Integration (top of screen)

A subtle header strip above the scroll content:

```
🌅  Shacharit zman: 9:42 AM  |  Latest: 10:54 AM   ⏱ 35 min left
```

- Powered by `@hebcal/core` (offline, pure JS, React Native compatible — see [[DavenAlong - Zmanim API Research]])
- Requires device location (ask permission on first use)
- Shows zman Tefillah (latest time for Shacharit Amidah) and a countdown
- Color shifts to amber when <30 min remain, red when <10 min

---

## Auto-scroll Behavior

On the continuous scroll screen, auto-scroll should scroll the `ScrollView` to keep the currently highlighted word/line in the middle third of the viewport — not at the top (which feels aggressive).

Implementation approach:
- Track each prayer section's `y` offset using `onLayout` refs
- When `currentWordIndex` advances, calculate the absolute document y-position and call `scrollViewRef.current?.scrollTo({ y: targetY, animated: true })`
- Debounce scroll calls to avoid jitter when the user is actively reading ahead

---

## Component Hierarchy

```
ShacharitScrollScreen
├── ZmanimHeader (sticky, top)
├── DisplayModeToggle (sticky, below ZmanimHeader)
└── ScrollView (main content)
    ├── SectionIntroCard (section 1)
    ├── PrayerBlock (Modeh Ani)
    │   ├── PrayerSectionTitle
    │   ├── PrayerTextContinuous  ← new component, replaces ReadAlongView
    │   └── AboutDisclosure (beginner only)
    ├── PrayerBlock (Asher Yatzar)
    │   └── ...
    ├── ... (all Birchot HaShachar prayers)
    ├── SectionIntroCard (section 2)
    ├── PrayerBlock (Baruch She'Amar)
    │   └── ...
    └── ... (all sections through Concluding)
```

---

## New Component: `PrayerTextContinuous`

Replaces `ReadAlongView` for the continuous scroll context. Key differences:

- Does not manage its own scroll — it's embedded in the parent `ScrollView`
- Renders words inline (using `Text` with wrapping) rather than in a fixed-height container
- Accepts `currentWordId` prop from the parent store and highlights the matching word
- No internal loading state — parent fetches and passes `prayerContent` as a prop

```tsx
interface PrayerTextContinuousProps {
  content: PrayerLine[];
  displayMode: DisplayMode;
  currentWordId: string | null; // null when not in playback
  textSize: 'small' | 'medium' | 'large';
}
```

---

## Migration Plan (non-breaking)

1. Create new `ShacharitScrollScreen.tsx` — doesn't touch existing screens
2. Add a route `ShacharitScroll` to `RootStackParamList`
3. Wire the "Shacharit" button on `HomeScreen` to navigate to `ShacharitScroll` instead of `ReadAlong` with serviceId='shacharit'
4. Existing `ReadAlongScreen` stays intact for Mincha, Ma'ariv, and Birkat Hamazon until those are redesigned

This lets Rabbi Feigenbaum's team review the new Shacharit UI without disrupting anything else.

---

## Files to Create / Modify

| File | Action | Notes |
|------|--------|-------|
| `src/screens/ShacharitScrollScreen.tsx` | CREATE | Main new screen |
| `src/components/PrayerTextContinuous.tsx` | CREATE | Inline word-highlighting text renderer |
| `src/components/SectionIntroCard.tsx` | CREATE | Section intro cards |
| `src/components/ZmanimHeader.tsx` | CREATE | Zmanim strip at top |
| `src/components/DisplayModeToggle.tsx` | CREATE | Sticky mode selector |
| `src/navigation/index.tsx` | MODIFY | Add ShacharitScroll route |
| `src/screens/HomeScreen.tsx` | MODIFY | Wire Shacharit button to new screen |
| `src/store/settingsStore.ts` | MODIFY | Add `userEntryPath` field |

---

## Out of Scope (for this sprint)

- Audio playback on the continuous scroll screen (can be added in a follow-up)
- Amidah (standing prayer) — needs special UI treatment, separate sprint
- Tachanun variations (Ashkenaz/Sefard/Yemenite) — post-Feigenbaum partnership decision

---

*Spec authored by CEO Agent, 2026-04-19. Ready for implementation — no open questions except Amidah handling.*
