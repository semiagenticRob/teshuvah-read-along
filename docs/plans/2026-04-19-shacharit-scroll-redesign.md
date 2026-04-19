# Shacharit Continuous-Scroll Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the `design-prototype/shacharit-scroll.html` experience into the existing Expo/React Native app as a new `ShacharitScrollScreen`, leaving the current `ReadAlongScreen` intact for Mincha, Ma'ariv, and Birkat Hamazon.

**Architecture:** A new screen renders all Shacharit prayers as one continuous vertical ScrollView. Each section (Birchot HaShachar → Pesukei D'Zimra → Shema → Concluding) carries its own background color, gradient-blended at boundaries. Each prayer renders as a header (title, subtitle, two expandable panels for Commentary and Audio & Notes) followed by an interlinear word-pair body (Hebrew word stacked above its transliteration, flowing RTL) and an English paragraph beneath. A bottom app bar contains a multi-select display-mode toggle, a play button, and a speed slider. A right-side rail with a bird marker tracks section progress. Word-level audio sync drives a white-halo crescendo on the current word pair, with a slow-decaying trail of halos behind it. Playback auto-stops at each prayer's last word; the next play-press advances into the following prayer.

**Tech Stack:** Expo SDK 52, React Native 0.76, TypeScript, Zustand (state), React Navigation stack, expo-av (audio playback — existing), expo-speech (TTS fallback — existing), expo-linear-gradient (already installed — for section backgrounds), **expo-font** (NEW — custom Google Fonts), **react-native-svg** (NEW — bird, icons), **react-native-reanimated** v3 (already installed, currently unused — halo crescendo/decrescendo on native thread), @react-native-community/slider (existing — speed control).

**Source of truth for visual details:** `/Users/robertwarren/teshuvah-read-along/design-prototype/shacharit-scroll.html`. When in doubt on a visual decision, open the prototype in a browser and match.

---

## File Structure (new files)

- `src/screens/ShacharitScrollScreen.tsx` — main continuous-scroll screen
- `src/components/shacharit/SectionBlock.tsx` — one of the four sections: renders background + intro + prayers
- `src/components/shacharit/SectionIntro.tsx` — "Section One" eyebrow + Hebrew title + subtitle + body + expandable panels
- `src/components/shacharit/SectionDivider.tsx` — glowing gold line between sections
- `src/components/shacharit/PrayerBlock.tsx` — single prayer's header + panels + body
- `src/components/shacharit/PrayerHeader.tsx` — title + subtitle + toggle row
- `src/components/shacharit/ExpandablePanel.tsx` — shared animated collapsible used by both Commentary and Audio & Notes
- `src/components/shacharit/AudioPlayerPlaceholder.tsx` — placeholder audio player (play button, title, duration, animated waveform, notes)
- `src/components/shacharit/PairRow.tsx` — RTL flex-wrap container of word pairs
- `src/components/shacharit/WordPair.tsx` — Hebrew word stacked above transliteration word, tappable, halo host
- `src/components/shacharit/Halo.tsx` — native-driven crescendo glow behind a word pair
- `src/components/shacharit/AppBar.tsx` — bottom floating bar (modes, play, speed)
- `src/components/shacharit/ProgressRail.tsx` — right-side rail with four gradient segments
- `src/components/shacharit/BirdMarker.tsx` — SVG bird that glides the rail
- `src/components/shacharit/PaperGrain.tsx` — fixed low-opacity noise overlay
- `src/theme/shacharitTheme.ts` — section palettes, ink tokens, font family names, timing constants
- `src/data/shacharit/structure.ts` — the four-section breakdown with ordered prayer IDs
- `src/data/shacharit/prayerMeta.ts` — subtitle, commentary placeholder, audio-duration placeholder, per prayer
- `src/hooks/useShacharitScroll.ts` — hook that exposes `activeSectionIndex`, `scrollProgress`, and scrolls-to-section
- `src/hooks/usePrayerBoundary.ts` — hook that wraps `useWordSync` and stops auto-advance at the last word of a prayer

## File Structure (modified files)

- `package.json` — add `expo-font`, `react-native-svg`, font packages
- `App.tsx` — wrap with font loader
- `src/navigation/AppNavigator.tsx` — add `ShacharitScroll` route
- `src/screens/HomeScreen.tsx` — route Shacharit card to new screen
- `src/store/prayerStore.ts` — add section-awareness, a helper `advanceToNextPrayer()`
- `src/store/settingsStore.ts` — extend `displayMode` to support multi-select (or replace with a `{hebrew: bool, translit: bool, english: bool}` triple)
- `src/hooks/useAudioPlayer.ts` — expose a cleanup-friendly stop-at-boundary mode (or replace the consuming screen's usage)
- `src/hooks/useWordSync.ts` — emit a boundary callback when the current word is the last of its prayer

---

## Phase 0 — Preparation

### Task 0.1: Create a fresh working branch (if a git repo)

**Files:** none (git)

- [ ] **Step 1:** Check if the project is a git repository.

Run: `cd /Users/robertwarren/teshuvah-read-along && git status`

If it is, proceed. If it is not, skip to Task 0.2 — do not initialize a repo without asking the user.

- [ ] **Step 2:** Create and check out a branch.

Run: `git checkout -b shacharit-scroll-redesign`
Expected: `Switched to a new branch 'shacharit-scroll-redesign'`

- [ ] **Step 3:** Commit a snapshot of the current state.

Run: `git add -A && git commit -m "checkpoint: before shacharit scroll redesign" --allow-empty`

### Task 0.2: Install new dependencies

**Files:** `package.json`, `package-lock.json`

- [ ] **Step 1:** Install fonts + svg + linear-gradient is already present.

Run:
```
cd /Users/robertwarren/teshuvah-read-along
npx expo install expo-font react-native-svg @expo-google-fonts/frank-ruhl-libre @expo-google-fonts/eb-garamond @expo-google-fonts/cormorant-garamond
```

- [ ] **Step 2:** Confirm `react-native-reanimated` is already installed at v3.16.x. If not, run `npx expo install react-native-reanimated`.

- [ ] **Step 3:** Confirm the `babel.config.js` has the reanimated plugin enabled. The file should contain:

```js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'], // MUST be last
  };
};
```

If the plugin is missing, add it. The reanimated plugin MUST be the last plugin.

- [ ] **Step 4:** Verify the bundler builds.

Run: `npm run start -- --clear` (or the Expo equivalent). Verify no "Module not found" errors on startup. Quit the bundler.

- [ ] **Step 5:** Commit.

```
git add package.json package-lock.json babel.config.js
git commit -m "chore: install expo-font, react-native-svg, google font packages"
```

---

## Phase 1 — Theme and font foundation

### Task 1.1: Create the theme module

**Files:** Create `src/theme/shacharitTheme.ts`

- [ ] **Step 1:** Write the theme file.

```ts
// src/theme/shacharitTheme.ts
export type SectionId = 'birchot' | 'pesukei' | 'shema' | 'concluding';

export const INK = {
  strong: '#2a1d12',
  soft:   '#5a4835',
  faint:  '#8a7a64',
} as const;

export const PARCHMENT = '#f6e9d2';

export const SECTIONS: Record<SectionId, {
  label: string;
  roman: string;
  hebrew: string;
  english: string;
  accent: string;
  accentHi: string;
  accentLow: string;
  // vertical gradient stops for the section background (top-to-bottom)
  gradient: [string, string, string, string];
  gradientStops: [number, number, number, number];
}> = {
  birchot: {
    label: 'Section One',
    roman: 'I',
    hebrew: 'בִּרְכוֹת הַשַּׁחַר',
    english: 'Morning Blessings — the first words of the day',
    accent: '#b07a1c',
    accentHi: '#d9a24a',
    accentLow: 'rgba(176,122,28,0.14)',
    gradient: ['#f2e2ba', '#ecd197', '#ecd197', '#e7c88a'],
    gradientStops: [0, 0.10, 0.86, 1.0],
  },
  pesukei: {
    label: 'Section Two',
    roman: 'II',
    hebrew: 'פְּסוּקֵי דְּזִמְרָה',
    english: "Verses of Praise — the ascent begins",
    accent: '#c9831a',
    accentHi: '#eaae4c',
    accentLow: 'rgba(201,131,26,0.13)',
    gradient: ['#e7c88a', '#e4c17d', '#e4c17d', '#d6ccaa'],
    gradientStops: [0, 0.10, 0.84, 1.0],
  },
  shema: {
    label: 'Section Three',
    roman: 'III',
    hebrew: 'קְרִיאַת שְׁמַע',
    english: "The Shema and Its Blessings — the heart of the service",
    accent: '#1d4a7a',
    accentHi: '#3f77aa',
    accentLow: 'rgba(29,74,122,0.16)',
    gradient: ['#d6ccaa', '#c3d0e1', '#c3d0e1', '#ccd4c1'],
    gradientStops: [0, 0.18, 0.84, 1.0],
  },
  concluding: {
    label: 'Section Four',
    roman: 'IV',
    hebrew: 'עָלֵינוּ',
    english: 'Concluding Prayers — carrying the service back into the day',
    accent: '#5c6b2f',
    accentHi: '#8ea051',
    accentLow: 'rgba(92,107,47,0.14)',
    gradient: ['#ccd4c1', '#d1d7b6', '#d1d7b6', '#d1d7b6'],
    gradientStops: [0, 0.12, 0.88, 1.0],
  },
};

export const SECTION_ORDER: SectionId[] = ['birchot', 'pesukei', 'shema', 'concluding'];

export const FONTS = {
  hebrew: 'FrankRuhlLibre_500Medium',
  serifBody: 'EBGaramond_400Regular',
  serifBodyItalic: 'EBGaramond_400Regular_Italic',
  display: 'CormorantGaramond_500Medium',
  displayItalic: 'CormorantGaramond_500Medium_Italic',
} as const;

// Timing (ms) — baseline 1× reading cadence.
// Real tick interval = (CADENCE_MIN + random * CADENCE_JITTER) / speed
export const TIMING = {
  CADENCE_MIN: 757,
  CADENCE_JITTER: 378,
  INITIAL_DELAY: 585,
  // Halo durations (ms) at 1× speed — scaled by current speed at use-site.
  HALO_CRESCENDO_AVG: 946 * 0.78,
  HALO_DECRESCENDO_AVG: 946 * 4.0,
  SPEED_MIN: 0.5,
  SPEED_MAX: 2.0,
  SPEED_STEP: 0.1,
  SPEED_DEFAULT: 1.0,
};
```

- [ ] **Step 2:** Commit.

```
git add src/theme/shacharitTheme.ts
git commit -m "feat(theme): shacharit section palette, font names, timing constants"
```

### Task 1.2: Load custom fonts in App.tsx

**Files:** `App.tsx`

- [ ] **Step 1:** Read the current `App.tsx`.

Run: `cat App.tsx`

- [ ] **Step 2:** Add the font loader. Replace App.tsx's existing render so it waits for fonts before mounting the navigator.

```tsx
// App.tsx
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useFonts as useFrankRuhl, FrankRuhlLibre_500Medium } from '@expo-google-fonts/frank-ruhl-libre';
import { EBGaramond_400Regular, EBGaramond_400Regular_Italic } from '@expo-google-fonts/eb-garamond';
import { CormorantGaramond_500Medium, CormorantGaramond_500Medium_Italic } from '@expo-google-fonts/cormorant-garamond';
import AppNavigator from './src/navigation/AppNavigator';
import { useSettingsStore } from './src/store/settingsStore';
import { usePrayerProgress } from './src/hooks/usePrayerProgress';

export default function App() {
  const [fontsLoaded] = useFrankRuhl({
    FrankRuhlLibre_500Medium,
    EBGaramond_400Regular,
    EBGaramond_400Regular_Italic,
    CormorantGaramond_500Medium,
    CormorantGaramond_500Medium_Italic,
  });

  // existing app-level side effects (keep whatever was here)
  const loadSettings = useSettingsStore(s => s.loadSettings);
  React.useEffect(() => { loadSettings(); }, []);
  usePrayerProgress();

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f6e9d2' }}>
        <ActivityIndicator color="#b07a1c" />
      </View>
    );
  }

  return <AppNavigator />;
}
```

If the existing App.tsx references other hooks (for example prayer progress), preserve them in the same positions.

- [ ] **Step 3:** Start the bundler and launch on a simulator or device.

Run: `npm run start -- --clear`

Expected: a brief splash of the `#f6e9d2` background and spinner while fonts fetch, then the Home screen renders.

- [ ] **Step 4:** Commit.

```
git add App.tsx
git commit -m "feat(fonts): load Frank Ruhl Libre, EB Garamond, Cormorant Garamond via expo-google-fonts"
```

### Task 1.3: Extend settingsStore for multi-select display mode

**Files:** `src/store/settingsStore.ts`

- [ ] **Step 1:** Add a new `displayLanes` field shaped as `{ hebrew: boolean; translit: boolean; english: boolean }`. Keep the existing `displayMode` for backward compatibility with the existing `ReadAlongScreen`.

Read the current store: `cat src/store/settingsStore.ts`

Add to the state interface:

```ts
export interface Settings {
  // ...existing fields...
  displayLanes: { hebrew: boolean; translit: boolean; english: boolean };
}

// Default value
const DEFAULT_LANES = { hebrew: true, translit: true, english: false };
```

In the `useSettingsStore` factory, add:

```ts
displayLanes: DEFAULT_LANES,

setDisplayLane: (lane: 'hebrew' | 'translit' | 'english', on: boolean) => {
  const current = get().displayLanes;
  const next = { ...current, [lane]: on };
  const allOff = !next.hebrew && !next.translit && !next.english;
  if (allOff) return; // refuse to turn off the last remaining lane
  set({ displayLanes: next });
  AsyncStorage.setItem('@displayLanes', JSON.stringify(next)).catch(() => {});
},
```

Update `loadSettings` to also read `@displayLanes` from AsyncStorage.

- [ ] **Step 2:** Write a unit test.

Create `src/store/__tests__/settingsStore.test.ts`:

```ts
import { act } from '@testing-library/react-native';
import { useSettingsStore } from '../settingsStore';

describe('displayLanes', () => {
  beforeEach(() => {
    useSettingsStore.setState({ displayLanes: { hebrew: true, translit: true, english: false } });
  });

  it('allows independent toggling', () => {
    useSettingsStore.getState().setDisplayLane('english', true);
    expect(useSettingsStore.getState().displayLanes).toEqual({ hebrew: true, translit: true, english: true });
  });

  it('refuses to turn off the last remaining lane', () => {
    useSettingsStore.setState({ displayLanes: { hebrew: true, translit: false, english: false } });
    useSettingsStore.getState().setDisplayLane('hebrew', false);
    expect(useSettingsStore.getState().displayLanes.hebrew).toBe(true);
  });
});
```

Run: `npx jest src/store/__tests__/settingsStore.test.ts`
Expected: PASS.

- [ ] **Step 3:** Commit.

```
git add src/store/settingsStore.ts src/store/__tests__/settingsStore.test.ts
git commit -m "feat(settings): multi-select displayLanes with last-lane protection"
```

---

## Phase 2 — Data scaffolding

### Task 2.1: Define the four-section structure

**Files:** Create `src/data/shacharit/structure.ts`

- [ ] **Step 1:** Identify the prayer IDs in the existing bundled data.

Run: `ls src/data/bundled/shacharit/` and inspect one file to confirm the ID field used (likely `id` or `slug`).

- [ ] **Step 2:** Write the structure file. Fill in prayer IDs to match the bundled content exactly — the engineer must verify each ID against a `src/data/bundled/shacharit/*.json` file.

```ts
// src/data/shacharit/structure.ts
import type { SectionId } from '../../theme/shacharitTheme';

export interface SectionSpec {
  id: SectionId;
  prayerIds: string[];
}

// NOTE: verify each prayerId below against the bundled JSON filenames.
// If a bundled prayer is missing from this list it will not appear in
// the continuous scroll. Add or reorder to taste — this is the order
// a user will experience Shacharit.
export const SHACHARIT_STRUCTURE: SectionSpec[] = [
  { id: 'birchot',    prayerIds: ['modeh_ani', 'asher_yatzar', 'elohai_neshamah', 'birchot_hatorah', 'hanoten_layaef_koach'] },
  { id: 'pesukei',    prayerIds: ['baruch_sheamar', 'mizmor_ltodah', 'ashrei', 'yishtabach'] },
  { id: 'shema',      prayerIds: ['barchu', 'yotzer_or', 'shema', 'vahavta', 'emet_vyatziv'] },
  { id: 'concluding', prayerIds: ['alenu', 'kaddish_yatom', 'ein_keloheinu', 'adon_olam'] },
];
```

- [ ] **Step 3:** Write a sanity test.

Create `src/data/shacharit/__tests__/structure.test.ts`:

```ts
import { SHACHARIT_STRUCTURE } from '../structure';
import fs from 'fs';
import path from 'path';

describe('SHACHARIT_STRUCTURE', () => {
  it('every prayer id maps to a bundled prayer file', () => {
    const bundled = fs.readdirSync(path.join(__dirname, '../../bundled/shacharit'));
    const bundledIds = new Set(bundled.map(f => f.replace(/\.json$/, '')));
    const missing: string[] = [];
    SHACHARIT_STRUCTURE.forEach(sec => {
      sec.prayerIds.forEach(id => {
        if (!bundledIds.has(id)) missing.push(`${sec.id}/${id}`);
      });
    });
    expect(missing).toEqual([]);
  });
});
```

Run: `npx jest src/data/shacharit/__tests__/structure.test.ts`
If any IDs are missing, either rename in `structure.ts` to match reality or add bundled JSON files for the missing prayers. Re-run until PASS.

- [ ] **Step 4:** Commit.

```
git add src/data/shacharit/structure.ts src/data/shacharit/__tests__/structure.test.ts
git commit -m "feat(data): shacharit four-section structure with bundled-content verification"
```

### Task 2.2: Add per-prayer metadata (subtitle, commentary, audio placeholder)

**Files:** Create `src/data/shacharit/prayerMeta.ts`

- [ ] **Step 1:** Port the metadata from the prototype.

Open `design-prototype/shacharit-scroll.html` and find the `prayerMeta = { ... }` object inside the `<script>` block. Port every entry verbatim into:

```ts
// src/data/shacharit/prayerMeta.ts
export interface PrayerMeta {
  subtitle: string;
  commentary: string;
  audioDuration: string;    // e.g. "2:15"
  audioTitle?: string;      // derived from prayer name by default
}

export const PRAYER_META: Record<string, PrayerMeta> = {
  modeh_ani: {
    subtitle: "First words on waking — gratitude before speech",
    commentary: "Recited before the morning washing, in the half-light between sleep and waking. Tradition teaches its simplicity is what makes it safe to say with a tongue not yet alert.",
    audioDuration: "2:15",
  },
  asher_yatzar: {
    subtitle: "The body's miraculous ordinary function",
    commentary: "A blessing that pairs the most physical of daily acts with gratitude — insisting the sacred and the ordinary occupy one plane.",
    audioDuration: "3:10",
  },
  // ...continue for all 18 prayers. If the bundled prayer ID differs from
  // the prototype's display name (e.g. `birchot_hatorah` vs `Birchot HaTorah`),
  // map accordingly. Every id listed in `SHACHARIT_STRUCTURE` must have an entry here.
};
```

- [ ] **Step 2:** Write a coverage test.

Create `src/data/shacharit/__tests__/prayerMeta.test.ts`:

```ts
import { SHACHARIT_STRUCTURE } from '../structure';
import { PRAYER_META } from '../prayerMeta';

it('every structure prayer has metadata', () => {
  const missing: string[] = [];
  SHACHARIT_STRUCTURE.forEach(sec => {
    sec.prayerIds.forEach(id => {
      if (!PRAYER_META[id]) missing.push(id);
    });
  });
  expect(missing).toEqual([]);
});
```

Run: `npx jest src/data/shacharit/__tests__/prayerMeta.test.ts`
Expected: PASS after all 18 entries are written.

- [ ] **Step 3:** Commit.

```
git add src/data/shacharit/prayerMeta.ts src/data/shacharit/__tests__/prayerMeta.test.ts
git commit -m "feat(data): per-prayer subtitle, commentary, audio placeholder metadata"
```

### Task 2.3: Word-pair alignment helper

**Files:** Create `src/utils/pairWords.ts`, `src/utils/__tests__/pairWords.test.ts`

The existing bundled prayer data contains Hebrew text per line and transliteration per line (not per word). For interlinear pairs, we need a word-level split. The pairing is by index — if Hebrew has N words and translit has M, we emit `max(N, M)` pairs, padding the shorter list with `null`.

- [ ] **Step 1:** Write the test first.

```ts
// src/utils/__tests__/pairWords.test.ts
import { pairWords } from '../pairWords';

it('pairs equal-length lists one-to-one', () => {
  expect(pairWords('שְׁמַע יִשְׂרָאֵל', 'Shema Yisrael'))
    .toEqual([
      { hebrew: 'שְׁמַע',    translit: 'Shema' },
      { hebrew: 'יִשְׂרָאֵל', translit: 'Yisrael' },
    ]);
});

it('pads the shorter list with null', () => {
  expect(pairWords('א ב ג', 'one two'))
    .toEqual([
      { hebrew: 'א', translit: 'one' },
      { hebrew: 'ב', translit: 'two' },
      { hebrew: 'ג', translit: null },
    ]);
});

it('preserves punctuation attached to words', () => {
  expect(pairWords('ה׳ אֶחָד.', 'Adonai Echad.'))
    .toEqual([
      { hebrew: 'ה׳',    translit: 'Adonai' },
      { hebrew: 'אֶחָד.', translit: 'Echad.' },
    ]);
});
```

Run: `npx jest src/utils/__tests__/pairWords.test.ts`
Expected: FAIL (function not defined).

- [ ] **Step 2:** Implement.

```ts
// src/utils/pairWords.ts
export interface WordPair {
  hebrew: string | null;
  translit: string | null;
}

const tokenize = (s: string): string[] =>
  s.trim().split(/\s+/).filter(t => t.length > 0);

export function pairWords(hebrew: string, translit: string): WordPair[] {
  const h = tokenize(hebrew);
  const t = tokenize(translit);
  const n = Math.max(h.length, t.length);
  const out: WordPair[] = [];
  for (let i = 0; i < n; i++) {
    out.push({ hebrew: h[i] ?? null, translit: t[i] ?? null });
  }
  return out;
}
```

- [ ] **Step 3:** Run the test.

Run: `npx jest src/utils/__tests__/pairWords.test.ts`
Expected: PASS.

- [ ] **Step 4:** Commit.

```
git add src/utils/pairWords.ts src/utils/__tests__/pairWords.test.ts
git commit -m "feat(utils): pairWords — zip Hebrew and translit into indexed pairs"
```

---

## Phase 3 — Core ScrollScreen skeleton

### Task 3.1: Create the ShacharitScrollScreen shell

**Files:** Create `src/screens/ShacharitScrollScreen.tsx`. Modify `src/navigation/AppNavigator.tsx`, `src/screens/HomeScreen.tsx`.

- [ ] **Step 1:** Create the empty screen.

```tsx
// src/screens/ShacharitScrollScreen.tsx
import React from 'react';
import { ScrollView, View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { SHACHARIT_STRUCTURE } from '../data/shacharit/structure';
import { PARCHMENT } from '../theme/shacharitTheme';

export default function ShacharitScrollScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {SHACHARIT_STRUCTURE.map(sec => (
          <View key={sec.id} style={{ padding: 20 }}>
            <Text>{sec.id}: {sec.prayerIds.join(', ')}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PARCHMENT },
  scroll: { paddingVertical: 20 },
});
```

- [ ] **Step 2:** Register the route. Read `src/navigation/AppNavigator.tsx`, then add:

```tsx
import ShacharitScrollScreen from '../screens/ShacharitScrollScreen';

// inside the Stack.Navigator:
<Stack.Screen
  name="ShacharitScroll"
  component={ShacharitScrollScreen}
  options={{ headerShown: false }}  // the screen owns its own chrome
/>
```

Also update the nav type (likely `RootStackParamList` or similar in `src/navigation/types.ts`) to include `ShacharitScroll: undefined`.

- [ ] **Step 3:** Wire the Shacharit card on HomeScreen. Read `src/screens/HomeScreen.tsx` and find the handler that navigates when the Shacharit card is tapped. Change it to:

```tsx
onPress={() =>
  service.id === 'shacharit'
    ? navigation.navigate('ShacharitScroll')
    : navigation.navigate('ReadAlong', { serviceId: service.id, prayerIndex: 0 })
}
```

- [ ] **Step 4:** Run the app, tap Shacharit. Expected: the new screen appears with a plaintext list of the sections and prayer IDs. Tap the back gesture — returns to Home.

- [ ] **Step 5:** Commit.

```
git add src/screens/ShacharitScrollScreen.tsx src/navigation/AppNavigator.tsx src/navigation/types.ts src/screens/HomeScreen.tsx
git commit -m "feat(screen): ShacharitScroll skeleton wired to Home card"
```

### Task 3.2: Build SectionBlock with gradient background

**Files:** Create `src/components/shacharit/SectionBlock.tsx`, modify `ShacharitScrollScreen.tsx`

- [ ] **Step 1:** Build the component. LinearGradient from expo-linear-gradient fills the full width of the viewport; content sits inside a content column of max width 760 (or device width on phones).

```tsx
// src/components/shacharit/SectionBlock.tsx
import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SECTIONS, type SectionId } from '../../theme/shacharitTheme';

interface Props {
  sectionId: SectionId;
  children: React.ReactNode;
}

export default function SectionBlock({ sectionId, children }: Props) {
  const spec = SECTIONS[sectionId];
  const { width } = useWindowDimensions();
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={spec.gradient}
        locations={spec.gradientStops}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={[styles.column, { maxWidth: Math.min(width, 760) }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:   { width: '100%', alignItems: 'center' },
  column: { width: '100%', paddingHorizontal: 22, paddingVertical: 16 },
});
```

- [ ] **Step 2:** Use it from the screen.

Replace the placeholder map in `ShacharitScrollScreen.tsx`:

```tsx
import SectionBlock from '../components/shacharit/SectionBlock';
import { Text } from 'react-native';

// ...
{SHACHARIT_STRUCTURE.map(sec => (
  <SectionBlock key={sec.id} sectionId={sec.id}>
    <Text style={{ padding: 40 }}>{sec.prayerIds.join(' · ')}</Text>
  </SectionBlock>
))}
```

- [ ] **Step 3:** Run. Expected: scrolling through four colored bands — honey → gold → tekhelet → olive. Each band transitions to the next via its gradient's final stop matching the next band's first stop.

- [ ] **Step 4:** Commit.

```
git add src/components/shacharit/SectionBlock.tsx src/screens/ShacharitScrollScreen.tsx
git commit -m "feat(shacharit): SectionBlock with per-section linear-gradient background"
```

### Task 3.3: Add the glowing gold divider between sections

**Files:** Create `src/components/shacharit/SectionDivider.tsx`, update `SectionBlock.tsx` to accept an `isFirst` prop and render the divider at its top when not first.

- [ ] **Step 1:** Component.

```tsx
// src/components/shacharit/SectionDivider.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';

export default function SectionDivider() {
  const { width } = useWindowDimensions();
  const opacity = useSharedValue(0.75);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 2500 }), -1, true);
  }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[styles.wrap, { width }, animStyle]} pointerEvents="none">
      <LinearGradient
        colors={[
          'rgba(230,178,74,0)',
          'rgba(230,178,74,0.25)',
          '#e6b24a',
          'rgba(230,178,74,0.25)',
          'rgba(230,178,74,0)'
        ]}
        locations={[0, 0.15, 0.5, 0.85, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.line}
      />
      <View style={styles.glow} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 18, justifyContent: 'center', alignItems: 'center' },
  line: { height: 1, width: '100%' },
  glow: {
    position: 'absolute', left: 0, right: 0, top: 8, height: 2,
    backgroundColor: 'transparent',
    shadowColor: '#e6b24a',
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 8,
  },
});
```

- [ ] **Step 2:** Use it. In `SectionBlock.tsx` add an `isFirst` prop:

```tsx
interface Props {
  sectionId: SectionId;
  isFirst?: boolean;
  children: React.ReactNode;
}

// at top of the <View style={styles.wrap}>
{!isFirst && <SectionDivider />}
```

In `ShacharitScrollScreen.tsx`, pass `isFirst={idx === 0}` when mapping.

- [ ] **Step 3:** Run. Verify a soft gold line appears at the top of sections 2, 3, and 4 (not section 1), pulses gently.

- [ ] **Step 4:** Commit.

```
git add src/components/shacharit/SectionDivider.tsx src/components/shacharit/SectionBlock.tsx src/screens/ShacharitScrollScreen.tsx
git commit -m "feat(shacharit): glowing gold divider between sections"
```

---

## Phase 4 — Section intro and expandable panels

### Task 4.1: ExpandablePanel component

**Files:** Create `src/components/shacharit/ExpandablePanel.tsx`

The two panel types (Commentary and Audio & Notes) share the same open/close animation. Build one component.

- [ ] **Step 1:** Component.

```tsx
// src/components/shacharit/ExpandablePanel.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle, useDerivedValue, withTiming,
} from 'react-native-reanimated';

interface Props {
  open: boolean;
  children: React.ReactNode;
}

export default function ExpandablePanel({ open, children }: Props) {
  const progress = useDerivedValue(() => withTiming(open ? 1 : 0, { duration: 450 }));
  const animStyle = useAnimatedStyle(() => ({
    maxHeight: progress.value * 900, // 900 matches the HTML prototype
    opacity: progress.value,
    marginTop: progress.value * 22,
  }));
  return (
    <Animated.View style={[styles.wrap, animStyle]}>
      <View>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
});
```

- [ ] **Step 2:** Commit.

```
git add src/components/shacharit/ExpandablePanel.tsx
git commit -m "feat(shacharit): ExpandablePanel with reanimated open/close"
```

### Task 4.2: AudioPlayerPlaceholder

**Files:** Create `src/components/shacharit/AudioPlayerPlaceholder.tsx`

- [ ] **Step 1:** Component.

```tsx
// src/components/shacharit/AudioPlayerPlaceholder.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { FONTS, INK, type SectionId, SECTIONS } from '../../theme/shacharitTheme';

interface Props {
  title: string;         // e.g. "Rabbi Feigenbaum · Modeh Ani"
  duration: string;      // e.g. "2:15"
  accent: string;        // hex — section accent or prayer accent
  parchment: string;     // hex — button text color
  notes: string;         // italic commentary text shown below player
}

function WaveBar({ playing, delay }: { playing: boolean; delay: number }) {
  const h = useSharedValue(4);
  React.useEffect(() => {
    if (playing) {
      h.value = withRepeat(
        withSequence(
          withTiming(4,  { duration: 0 }),
          withTiming(4,  { duration: delay }),
          withTiming(18, { duration: 500 }),
          withTiming(4,  { duration: 500 })
        ), -1, false
      );
    } else {
      h.value = withTiming(4, { duration: 200 });
    }
  }, [playing, delay]);
  const a = useAnimatedStyle(() => ({ height: h.value }));
  return <Animated.View style={[{ width: 2, backgroundColor: 'currentColor' as any, borderRadius: 1, marginHorizontal: 1 }, a]} />;
}

export default function AudioPlayerPlaceholder({ title, duration, accent, parchment, notes }: Props) {
  const [playing, setPlaying] = useState(false);
  return (
    <View>
      <View style={styles.player}>
        <Pressable
          onPress={() => setPlaying(p => !p)}
          style={[styles.playBtn, { backgroundColor: accent }]}
        >
          <Svg width={12} height={12} viewBox="0 0 24 24">
            <Path
              d={playing ? 'M6 5h4v14H6zm8 0h4v14h-4z' : 'M7 5v14l12-7z'}
              fill={parchment}
            />
          </Svg>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title]}>{title}</Text>
          <Text style={[styles.duration, { color: INK.faint }]}>{duration} · Placeholder</Text>
        </View>
        <View style={[styles.wave, { height: 18 }]}>
          {Array.from({ length: 10 }).map((_, i) => (
            <WaveBar key={i} playing={playing} delay={i * 120} />
          ))}
        </View>
      </View>
      <View style={[styles.notes, { borderLeftColor: accent }]}>
        <Text style={styles.notesText}>{notes}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  player: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: 'rgba(255,252,245,0.55)',
    borderColor: 'rgba(0,0,0,0.08)',
    borderWidth: 1,
    borderRadius: 14,
  },
  playBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontFamily: FONTS.serifBodyItalic, fontSize: 14, color: INK.strong },
  duration: { fontFamily: FONTS.serifBody, fontSize: 10, letterSpacing: 2.4, marginTop: 2 },
  wave: { flexDirection: 'row', alignItems: 'center' },
  notes: {
    marginTop: 10, paddingLeft: 16, borderLeftWidth: 1.5,
  },
  notesText: { fontFamily: FONTS.displayItalic, fontSize: 15, lineHeight: 22, color: INK.soft },
});
```

**Note on the `WaveBar` color:** React Native does not support `currentColor`. Replace `'currentColor' as any` with `accent`.

- [ ] **Step 2:** Commit.

```
git add src/components/shacharit/AudioPlayerPlaceholder.tsx
git commit -m "feat(shacharit): placeholder audio player with animated waveform"
```

### Task 4.3: SectionIntro component

**Files:** Create `src/components/shacharit/SectionIntro.tsx`

- [ ] **Step 1:** Build the component with the large italic "Section One" eyebrow, Hebrew title, subtitle, body, and two toggle buttons that each control an ExpandablePanel.

```tsx
// src/components/shacharit/SectionIntro.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SECTIONS, INK, FONTS, type SectionId } from '../../theme/shacharitTheme';
import ExpandablePanel from './ExpandablePanel';
import AudioPlayerPlaceholder from './AudioPlayerPlaceholder';

interface Props {
  sectionId: SectionId;
  bodyCopy: string;            // the paragraph text
  commentary: string;
  audioTitle: string;
  audioDuration: string;
  audioNotes: string;
  parchment: string;           // the base bg tone for button text
}

export default function SectionIntro(props: Props) {
  const [openCommentary, setOpenCommentary] = useState(false);
  const [openAudio, setOpenAudio] = useState(false);
  const spec = SECTIONS[props.sectionId];
  return (
    <View style={styles.wrap}>
      <Text style={[styles.eyebrow, { color: spec.accent }]}>{spec.label}</Text>
      <Text style={styles.hebrewTitle}>{spec.hebrew}</Text>
      <Text style={[styles.englishTitle, { color: INK.soft }]}>{spec.english}</Text>
      <Text style={[styles.body, { color: INK.soft }]}>{props.bodyCopy}</Text>
      <View style={styles.toggles}>
        <Pressable onPress={() => setOpenCommentary(o => !o)}>
          <Text style={[styles.toggle, { color: spec.accent }]}>
            {openCommentary ? 'Commentary ×' : 'Commentary +'}
          </Text>
        </Pressable>
        <Pressable onPress={() => setOpenAudio(o => !o)}>
          <Text style={[styles.toggle, { color: spec.accent }]}>
            {openAudio ? 'Audio & Notes ×' : 'Audio & Notes +'}
          </Text>
        </Pressable>
      </View>
      <ExpandablePanel open={openCommentary}>
        <View style={[styles.commentaryBlock, { borderLeftColor: spec.accent }]}>
          <Text style={styles.commentaryText}>{props.commentary}</Text>
          <Text style={[styles.attribution, { color: INK.faint }]}>— Placeholder · Feigenbaum Commentary</Text>
        </View>
      </ExpandablePanel>
      <ExpandablePanel open={openAudio}>
        <AudioPlayerPlaceholder
          title={props.audioTitle}
          duration={props.audioDuration}
          accent={spec.accent}
          parchment={props.parchment}
          notes={props.audioNotes}
        />
      </ExpandablePanel>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 36, paddingBottom: 14 },
  eyebrow: { fontFamily: FONTS.displayItalic, fontSize: 30, lineHeight: 34, marginBottom: 14 },
  hebrewTitle: { fontFamily: FONTS.hebrew, fontSize: 46, lineHeight: 52, color: INK.strong, writingDirection: 'rtl', textAlign: 'right', marginBottom: 6 },
  englishTitle: { fontFamily: FONTS.serifBodyItalic, fontSize: 20, marginBottom: 28 },
  body: { fontFamily: FONTS.serifBody, fontSize: 17, lineHeight: 26 },
  toggles: { flexDirection: 'row', gap: 22, marginTop: 22, flexWrap: 'wrap' },
  toggle: { fontFamily: FONTS.serifBody, fontSize: 13, letterSpacing: 2.2, textTransform: 'uppercase' },
  commentaryBlock: { borderLeftWidth: 2, paddingLeft: 22, paddingVertical: 4 },
  commentaryText: { fontFamily: FONTS.displayItalic, fontSize: 18, lineHeight: 28, color: INK.soft },
  attribution: { fontFamily: FONTS.serifBody, fontSize: 11, letterSpacing: 2.4, marginTop: 10, textTransform: 'uppercase' },
});
```

- [ ] **Step 2:** Plug into the screen. For each section, render `SectionIntro` with hard-coded English body copy ported from the prototype (the long paragraph in each section-intro). Example for Birchot:

```tsx
const SECTION_BODY_COPY: Record<SectionId, string> = {
  birchot:    'We begin by acknowledging the gift of a new day and the body that carries us. These blessings are the first words we offer — gratitude before requests, wonder before work.',
  pesukei:    'Before we can ask, we must praise. Pesukei D\'Zimra gathers the Psalms that sing the world into its right relationship: creation marveled at, the Creator named, the soul tuned.',
  shema:      'Here the service gathers itself. After gratitude and praise, we arrive at the declaration: God is One. The Shema is less a prayer than a stance — the posture the rest of the day rests upon.',
  concluding: 'The service ends with a turn outward. Alenu speaks of the world as it is and the world as it could be, then Kaddish raises the name of God in the voice of the community.',
};

const SECTION_COMMENTARY: Record<SectionId, string> = {
  birchot:    'Before reciting Birchot HaShachar, the tradition asks us to pause at the threshold of consciousness...',
  pesukei:    'The Talmud calls these verses "the warmup of the service." One does not leap into the presence of God...',
  shema:      'The Shema is the only prayer the tradition insists we recite with full concentration...',
  concluding: 'We do not end with another petition but with a declaration of responsibility...',
};

const SECTION_AUDIO_NOTES: Record<SectionId, string> = { /* ported from prototype */ };
```

Place these in `src/data/shacharit/sectionCopy.ts` to keep them out of the component file.

- [ ] **Step 3:** Run. Verify all four section intros render with correct typography, colors, toggles expand and collapse.

- [ ] **Step 4:** Commit.

```
git add src/components/shacharit/SectionIntro.tsx src/data/shacharit/sectionCopy.ts src/screens/ShacharitScrollScreen.tsx
git commit -m "feat(shacharit): SectionIntro with expandable commentary and audio panels"
```

---

## Phase 5 — Prayer blocks

### Task 5.1: PrayerHeader component

**Files:** Create `src/components/shacharit/PrayerHeader.tsx`

- [ ] **Step 1:** Build the header: italic prayer name + Hebrew subtitle inline, a one-line subtitle below, and two toggle buttons.

```tsx
// src/components/shacharit/PrayerHeader.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { FONTS, INK } from '../../theme/shacharitTheme';

interface Props {
  englishName: string;
  hebrewName: string;
  subtitle: string;
  accent: string;
  commentaryOpen: boolean;
  audioOpen: boolean;
  onToggleCommentary: () => void;
  onToggleAudio: () => void;
}

export default function PrayerHeader(p: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Text style={styles.name}>{p.englishName}</Text>
        <Text style={[styles.hebrewName, { color: p.accent }]}>{p.hebrewName}</Text>
      </View>
      <Text style={styles.subtitle}>{p.subtitle}</Text>
      <View style={styles.toggles}>
        <Pressable onPress={p.onToggleCommentary}>
          <Text style={[styles.toggle, { color: p.accent }]}>
            {p.commentaryOpen ? 'Commentary ×' : 'Commentary +'}
          </Text>
        </Pressable>
        <Pressable onPress={p.onToggleAudio}>
          <Text style={[styles.toggle, { color: p.accent }]}>
            {p.audioOpen ? 'Audio & Notes ×' : 'Audio & Notes +'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 10 },
  name: { fontFamily: FONTS.displayItalic, fontSize: 23, color: INK.strong, fontWeight: '500' },
  hebrewName: { fontFamily: FONTS.hebrew, fontSize: 17, writingDirection: 'rtl' },
  subtitle: { fontFamily: FONTS.serifBodyItalic, fontSize: 15, color: INK.faint, marginTop: 2, lineHeight: 22 },
  toggles: { flexDirection: 'row', gap: 18, marginTop: 8, flexWrap: 'wrap' },
  toggle: { fontFamily: FONTS.serifBody, fontSize: 11, letterSpacing: 2.4, textTransform: 'uppercase' },
});
```

- [ ] **Step 2:** Commit.

```
git add src/components/shacharit/PrayerHeader.tsx
git commit -m "feat(shacharit): PrayerHeader component"
```

### Task 5.2: PrayerBlock (header + panels + body placeholder)

**Files:** Create `src/components/shacharit/PrayerBlock.tsx`

- [ ] **Step 1:** Component — combines header, two panels, and a placeholder body area that Phase 6 will replace with pairs.

```tsx
// src/components/shacharit/PrayerBlock.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SECTIONS, INK, FONTS, type SectionId } from '../../theme/shacharitTheme';
import PrayerHeader from './PrayerHeader';
import ExpandablePanel from './ExpandablePanel';
import AudioPlayerPlaceholder from './AudioPlayerPlaceholder';
import { PRAYER_META } from '../../data/shacharit/prayerMeta';

interface Props {
  prayerId: string;
  englishName: string;
  hebrewName: string;
  sectionId: SectionId;
  parchment: string;
  hebrewText: string;
  translitText: string;
  englishText: string;
}

export default function PrayerBlock(p: Props) {
  const [openCommentary, setOpenCommentary] = useState(false);
  const [openAudio, setOpenAudio] = useState(false);
  const spec = SECTIONS[p.sectionId];
  const meta = PRAYER_META[p.prayerId];

  return (
    <View style={[styles.wrap, { borderLeftColor: spec.accent }]}>
      <PrayerHeader
        englishName={p.englishName}
        hebrewName={p.hebrewName}
        subtitle={meta?.subtitle ?? ''}
        accent={spec.accent}
        commentaryOpen={openCommentary}
        audioOpen={openAudio}
        onToggleCommentary={() => setOpenCommentary(o => !o)}
        onToggleAudio={() => setOpenAudio(o => !o)}
      />
      <ExpandablePanel open={openCommentary}>
        <View style={[styles.commentaryBlock, { borderLeftColor: spec.accent }]}>
          <Text style={styles.commentaryText}>{meta?.commentary ?? ''}</Text>
        </View>
      </ExpandablePanel>
      <ExpandablePanel open={openAudio}>
        <AudioPlayerPlaceholder
          title={`Rabbi Feigenbaum · ${p.englishName}`}
          duration={meta?.audioDuration ?? '0:00'}
          accent={spec.accent}
          parchment={p.parchment}
          notes="Audio commentary plays alongside the written notes. Placeholder recording — final audio will be recorded by Rabbi Feigenbaum."
        />
      </ExpandablePanel>
      {/* Body placeholder — replaced with word pairs in Phase 6 */}
      <Text style={[styles.hebrewPlaceholder, { color: INK.strong }]}>{p.hebrewText}</Text>
      <Text style={[styles.translitPlaceholder]}>{p.translitText}</Text>
      <Text style={[styles.english]}>{p.englishText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingLeft: 32, paddingRight: 0, paddingVertical: 26,
    marginVertical: 10, position: 'relative',
    borderLeftWidth: 2,
  },
  commentaryBlock: { borderLeftWidth: 1.5, paddingLeft: 16, paddingVertical: 3 },
  commentaryText: { fontFamily: FONTS.displayItalic, fontSize: 16, lineHeight: 25, color: INK.soft },
  hebrewPlaceholder: { fontFamily: FONTS.hebrew, fontSize: 26, lineHeight: 42, writingDirection: 'rtl', textAlign: 'right', marginTop: 12 },
  translitPlaceholder: { fontFamily: FONTS.serifBody, fontSize: 16, color: INK.soft, lineHeight: 28, marginTop: 10 },
  english: { fontFamily: FONTS.serifBodyItalic, fontSize: 17, color: INK.soft, lineHeight: 28, marginTop: 10 },
});
```

- [ ] **Step 2:** Wire into screen. Load each prayer's bundled JSON (the existing data layer) and pass its raw text strings. This is the point where the engineer must inspect the bundled JSON shape and map to `hebrewText / translitText / englishText`. Example loader (place in `src/data/shacharit/loadPrayer.ts`):

```ts
import { PRAYER_META } from './prayerMeta';

// The engineer must implement this to read from src/data/bundled/shacharit/{id}.json
// and return { englishName, hebrewName, hebrewText, translitText, englishText }.
// Use whatever the bundled shape is — inspect one file to see field names.
export function loadBundledPrayer(prayerId: string): {
  englishName: string;
  hebrewName: string;
  hebrewText: string;
  translitText: string;
  englishText: string;
} {
  const raw = require(`../bundled/shacharit/${prayerId}.json`);
  return {
    englishName: raw.english_name   ?? raw.englishName   ?? prayerId,
    hebrewName:  raw.hebrew_name    ?? raw.hebrewName    ?? '',
    hebrewText:  (raw.lines ?? []).map((l: any) => l.hebrew ?? l.he ?? '').join(' '),
    translitText:(raw.lines ?? []).map((l: any) => l.translit ?? l.transliteration ?? '').join(' '),
    englishText: (raw.lines ?? []).map((l: any) => l.english ?? l.en ?? '').join(' '),
  };
}
```

**This is the only place a real field-name mapping is required.** Confirm against the actual JSON by running `cat src/data/bundled/shacharit/modeh_ani.json | head -30` and adjusting the mapping.

- [ ] **Step 3:** Render all prayers in the screen:

```tsx
import PrayerBlock from '../components/shacharit/PrayerBlock';
import { loadBundledPrayer } from '../data/shacharit/loadPrayer';

// inside ShacharitScrollScreen:
{SHACHARIT_STRUCTURE.map((sec, sIdx) => (
  <SectionBlock key={sec.id} sectionId={sec.id} isFirst={sIdx === 0}>
    <SectionIntro sectionId={sec.id} ... />
    {sec.prayerIds.map(pid => {
      const data = loadBundledPrayer(pid);
      return (
        <PrayerBlock
          key={pid}
          prayerId={pid}
          sectionId={sec.id}
          parchment={PARCHMENT}
          {...data}
        />
      );
    })}
  </SectionBlock>
))}
```

- [ ] **Step 4:** Run. Verify: each prayer has a header, subtitle, two toggles, expandable panels, and placeholder Hebrew/translit/English body stacked beneath. Scroll end-to-end — all 18 prayers should render.

- [ ] **Step 5:** Commit.

```
git add src/components/shacharit/PrayerBlock.tsx src/data/shacharit/loadPrayer.ts src/screens/ShacharitScrollScreen.tsx
git commit -m "feat(shacharit): PrayerBlock with header, expandable panels, text body"
```

---

## Phase 6 — Interlinear word pairs

### Task 6.1: WordPair component

**Files:** Create `src/components/shacharit/WordPair.tsx`

- [ ] **Step 1:** Build a component that shows the Hebrew word above its transliteration and accepts tap events plus an `active` and `fading` visual state (halo will be added in Phase 7).

```tsx
// src/components/shacharit/WordPair.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { FONTS, INK } from '../../theme/shacharitTheme';

interface Props {
  hebrew: string | null;
  translit: string | null;
  showHebrew: boolean;
  showTranslit: boolean;
  onPress: () => void;
  renderHalo: () => React.ReactNode; // Phase 7 provides this
}

function WordPair({ hebrew, translit, showHebrew, showTranslit, onPress, renderHalo }: Props) {
  return (
    <Pressable onPress={onPress} hitSlop={4} style={styles.pair}>
      {renderHalo()}
      {showHebrew && hebrew !== null && (
        <Text style={styles.hebrew}>{hebrew}</Text>
      )}
      {showTranslit && translit !== null && (
        <Text style={styles.translit}>{translit}</Text>
      )}
    </Pressable>
  );
}

export default React.memo(WordPair);

const styles = StyleSheet.create({
  pair: { alignItems: 'center', paddingHorizontal: 2, paddingVertical: 2, position: 'relative' },
  hebrew:   { fontFamily: FONTS.hebrew, fontSize: 24, lineHeight: 28, color: INK.strong, textAlign: 'center', writingDirection: 'rtl' },
  translit: { fontFamily: FONTS.serifBodyItalic, fontSize: 11, lineHeight: 14, color: INK.faint, textAlign: 'center', marginTop: 3 },
});
```

- [ ] **Step 2:** Commit.

```
git add src/components/shacharit/WordPair.tsx
git commit -m "feat(shacharit): WordPair component"
```

### Task 6.2: PairRow — RTL flex-wrap container

**Files:** Create `src/components/shacharit/PairRow.tsx`

- [ ] **Step 1:** Component.

```tsx
// src/components/shacharit/PairRow.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import WordPair from './WordPair';
import { pairWords } from '../../utils/pairWords';

interface Props {
  hebrew: string;
  translit: string;
  showHebrew: boolean;
  showTranslit: boolean;
  prayerStartIdx: number;   // the global word index of the first Hebrew word in this prayer
  onTapWord: (globalIdx: number) => void;
  renderHalo: (globalIdx: number) => React.ReactNode;
}

export default function PairRow({ hebrew, translit, showHebrew, showTranslit, prayerStartIdx, onTapWord, renderHalo }: Props) {
  const pairs = React.useMemo(() => pairWords(hebrew, translit), [hebrew, translit]);
  // When only translit is shown, flip container direction to LTR:
  const direction = showHebrew ? 'rtl' : 'ltr';
  return (
    <View style={[styles.row, { direction } as any]}>
      {pairs.map((p, i) => (
        <WordPair
          key={i}
          hebrew={p.hebrew}
          translit={p.translit}
          showHebrew={showHebrew}
          showTranslit={showTranslit}
          onPress={() => onTapWord(prayerStartIdx + i)}
          renderHalo={() => renderHalo(prayerStartIdx + i)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10,
    columnGap: 14,
    marginVertical: 6,
  },
});
```

**Note:** React Native's `direction` prop on View is valid as of RN 0.76 and respects both flex and text direction when set on the container. We're using it to flip visual word order between RTL (Hebrew lead) and LTR (translit-only).

- [ ] **Step 2:** Use it in PrayerBlock. Replace the placeholder `<Text style={styles.hebrewPlaceholder}>` and `translitPlaceholder` with:

```tsx
import PairRow from './PairRow';
import { useSettingsStore } from '../../store/settingsStore';

// in PrayerBlock props: add `startIdx: number`, `onTapWord: (i: number) => void`, `renderHalo: (i: number) => ReactNode`

// in render:
const lanes = useSettingsStore(s => s.displayLanes);
<PairRow
  hebrew={p.hebrewText}
  translit={p.translitText}
  showHebrew={lanes.hebrew}
  showTranslit={lanes.translit}
  prayerStartIdx={p.startIdx}
  onTapWord={p.onTapWord}
  renderHalo={p.renderHalo}
/>

// english line remains:
{lanes.english && <Text style={styles.english}>{p.englishText}</Text>}
```

- [ ] **Step 3:** In `ShacharitScrollScreen`, compute `startIdx` per prayer by summing Hebrew word counts of previous prayers. Provide `onTapWord` and a placeholder `renderHalo={() => null}` for now (Phase 7 will implement).

Simple implementation for startIdx:

```tsx
const prayers: Array<{ id: string; sectionId: SectionId; data: any; startIdx: number }> = [];
let running = 0;
SHACHARIT_STRUCTURE.forEach(sec => {
  sec.prayerIds.forEach(pid => {
    const data = loadBundledPrayer(pid);
    prayers.push({ id: pid, sectionId: sec.id, data, startIdx: running });
    running += data.hebrewText.trim().split(/\s+/).length;
  });
});
const totalWords = running;
```

Pass `startIdx` to `PrayerBlock` and a `onTapWord` handler that calls the prayer store's seek action (to be added in Phase 8).

- [ ] **Step 4:** Run. Verify: each prayer's Hebrew body is now laid out as tight word-pairs flowing RTL, with translit tucked beneath each Hebrew word. Toggle Hebrew off via the app bar (not yet built — temporarily add a debug toggle or verify via the `displayLanes` state manipulation).

- [ ] **Step 5:** Commit.

```
git add src/components/shacharit/PairRow.tsx src/components/shacharit/PrayerBlock.tsx src/screens/ShacharitScrollScreen.tsx
git commit -m "feat(shacharit): interlinear word-pair layout with global word indexing"
```

---

## Phase 7 — Halo animation (Reanimated)

### Task 7.1: Build the shared active-index store

**Files:** Create `src/store/haloStore.ts`

Halo state changes on every word advance. Keeping it in its own small store (not the big prayerStore) isolates renders.

- [ ] **Step 1:** Write the store.

```ts
// src/store/haloStore.ts
import { create } from 'zustand';

interface HaloState {
  activeIdx: number | null;       // current global word index, or null when paused/idle
  recentlyActive: number[];       // global indices that are decrescendoing (trail)
  setActive: (i: number | null) => void;
}

export const useHaloStore = create<HaloState>((set) => ({
  activeIdx: null,
  recentlyActive: [],
  setActive: (i) => set((s) => {
    const trail = s.activeIdx !== null ? [s.activeIdx, ...s.recentlyActive].slice(0, 12) : s.recentlyActive;
    return { activeIdx: i, recentlyActive: trail };
  }),
}));
```

12 trail entries is enough for a visible comet tail at any speed.

- [ ] **Step 2:** Commit.

```
git add src/store/haloStore.ts
git commit -m "feat(halo): activeIdx + trail store"
```

### Task 7.2: Halo component (Reanimated crescendo + slow decrescendo)

**Files:** Create `src/components/shacharit/Halo.tsx`

- [ ] **Step 1:** Component.

```tsx
// src/components/shacharit/Halo.tsx
import React, { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { StyleSheet } from 'react-native';
import { TIMING } from '../../theme/shacharitTheme';

interface Props {
  state: 'idle' | 'active' | 'fading';
  speed: number;
}

/**
 * Absolute-positioned glow behind a word pair. Bright-white radial gradient
 * approximated with shadow + background. Crescendo on 'active', slow decrescendo
 * on 'fading', invisible on 'idle'.
 */
export default function Halo({ state, speed }: Props) {
  const opacity = useSharedValue(0);
  const scale   = useSharedValue(0.88);

  useEffect(() => {
    const crescendoMs = TIMING.HALO_CRESCENDO_AVG / speed;
    const fadeMs      = TIMING.HALO_DECRESCENDO_AVG / speed;
    if (state === 'active') {
      opacity.value = withTiming(1, { duration: crescendoMs, easing: Easing.in(Easing.ease) });
      scale.value   = withTiming(1.10, { duration: crescendoMs, easing: Easing.in(Easing.ease) });
    } else if (state === 'fading') {
      opacity.value = withTiming(0, { duration: fadeMs, easing: Easing.linear });
      scale.value   = withTiming(1.04, { duration: fadeMs, easing: Easing.linear });
    } else {
      opacity.value = 0;
      scale.value   = 0.88;
    }
  }, [state, speed]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View pointerEvents="none" style={[styles.halo, style]} />;
}

const styles = StyleSheet.create({
  halo: {
    position: 'absolute',
    left: -4, right: -4, top: -6, bottom: -6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.72)',
    shadowColor: '#fff',
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 10,
  },
});
```

The `backgroundColor` with `shadowRadius` produces a soft glow against colored backgrounds. On Android, `elevation` drives the glow; on iOS, `shadowColor/Opacity/Radius` drive it.

- [ ] **Step 2:** Commit.

```
git add src/components/shacharit/Halo.tsx
git commit -m "feat(halo): Reanimated crescendo + decrescendo halo component"
```

### Task 7.3: Wire halos into WordPair via haloStore

**Files:** Modify `src/components/shacharit/PrayerBlock.tsx` (or its parent)

- [ ] **Step 1:** In the screen, build a `renderHalo` function that subscribes to `haloStore` and decides each pair's state.

```tsx
// in ShacharitScrollScreen.tsx
import Halo from '../components/shacharit/Halo';
import { useHaloStore } from '../store/haloStore';
import { useSettingsStore } from '../store/settingsStore';

const speed = useSettingsStore(s => /* playback speed, see Phase 8/10 */ 1);

const renderHalo = (idx: number) => {
  const ActiveWatcher = () => {
    const activeIdx = useHaloStore(s => s.activeIdx);
    const trail     = useHaloStore(s => s.recentlyActive);
    const state =
      idx === activeIdx ? 'active'
      : trail.includes(idx) ? 'fading'
      : 'idle';
    return <Halo state={state} speed={speed} />;
  };
  return <ActiveWatcher />;
};
```

Pass `renderHalo` into each `PrayerBlock`, which forwards it to `PairRow`.

- [ ] **Step 2:** Add a temporary dev button to verify halos. Place a debug button on the screen that calls `useHaloStore.getState().setActive(next)` repeatedly. Confirm the halo crescendos on the current pair and a visible trail persists on recent ones.

- [ ] **Step 3:** Remove the dev button after verification.

- [ ] **Step 4:** Commit.

```
git add src/screens/ShacharitScrollScreen.tsx
git commit -m "feat(halo): wire WordPair halos to haloStore active/trail state"
```

---

## Phase 8 — Auto-progression with prayer-boundary stop

### Task 8.1: prayerStore gains word-index bounds and advance-to-next-prayer

**Files:** Modify `src/store/prayerStore.ts`

- [ ] **Step 1:** Add fields and actions.

```ts
// additions to the existing prayerStore shape:
interface ShacharitFields {
  shacharitBounds: Array<{ prayerId: string; sectionId: SectionId; start: number; end: number }>;  // computed from prayer texts
  shacharitActiveWord: number | null;
  shacharitPlaying: boolean;
  shacharitSpeed: number;

  setShacharitBounds: (b: ShacharitFields['shacharitBounds']) => void;
  setShacharitActive: (i: number | null) => void;
  setShacharitPlaying: (p: boolean) => void;
  setShacharitSpeed: (s: number) => void;
  advanceShacharit: () => 'advanced' | 'prayer-boundary' | 'end';
  jumpToNextPrayer: () => void;
}
```

Implement `advanceShacharit`:

```ts
advanceShacharit: () => {
  const s = get();
  if (s.shacharitActiveWord === null) return 'end';
  const idx = s.shacharitActiveWord;
  const cur = s.shacharitBounds.find(b => idx >= b.start && idx < b.end);
  if (!cur) return 'end';
  const isLast = idx === cur.end - 1;
  if (isLast) {
    set({ shacharitPlaying: false });
    return 'prayer-boundary';
  }
  set({ shacharitActiveWord: idx + 1 });
  return 'advanced';
},

jumpToNextPrayer: () => {
  const s = get();
  if (s.shacharitActiveWord === null) return;
  const cur = s.shacharitBounds.find(b => s.shacharitActiveWord! >= b.start && s.shacharitActiveWord! < b.end);
  if (!cur) return;
  const next = s.shacharitBounds.find(b => b.start === cur.end);
  if (next) set({ shacharitActiveWord: next.start });
},
```

- [ ] **Step 2:** Test.

Create `src/store/__tests__/prayerStore.shacharit.test.ts`:

```ts
import { usePrayerStore } from '../prayerStore';

describe('shacharit advance', () => {
  beforeEach(() => {
    usePrayerStore.getState().setShacharitBounds([
      { prayerId: 'a', sectionId: 'birchot', start: 0, end: 3 },
      { prayerId: 'b', sectionId: 'birchot', start: 3, end: 5 },
    ]);
    usePrayerStore.getState().setShacharitActive(0);
  });

  it('advances within a prayer', () => {
    expect(usePrayerStore.getState().advanceShacharit()).toBe('advanced');
    expect(usePrayerStore.getState().shacharitActiveWord).toBe(1);
  });

  it('stops at prayer boundary', () => {
    usePrayerStore.getState().setShacharitActive(2);
    expect(usePrayerStore.getState().advanceShacharit()).toBe('prayer-boundary');
    expect(usePrayerStore.getState().shacharitPlaying).toBe(false);
    expect(usePrayerStore.getState().shacharitActiveWord).toBe(2); // stays at last word
  });

  it('jumpToNextPrayer moves into following prayer', () => {
    usePrayerStore.getState().setShacharitActive(2);
    usePrayerStore.getState().jumpToNextPrayer();
    expect(usePrayerStore.getState().shacharitActiveWord).toBe(3);
  });
});
```

Run: `npx jest src/store/__tests__/prayerStore.shacharit.test.ts`
Expected: PASS.

- [ ] **Step 3:** Commit.

```
git add src/store/prayerStore.ts src/store/__tests__/prayerStore.shacharit.test.ts
git commit -m "feat(prayerStore): shacharit word bounds, advance, jumpToNextPrayer"
```

### Task 8.2: Tick loop inside ShacharitScrollScreen

**Files:** Modify `src/screens/ShacharitScrollScreen.tsx`

- [ ] **Step 1:** Add a tick loop. When `shacharitPlaying` is true, fire advances at a speed-scaled random cadence. On `prayer-boundary`, playback stops automatically. On next play press, `jumpToNextPrayer` runs if the user is parked at a boundary.

```tsx
React.useEffect(() => {
  const store = usePrayerStore.getState();
  if (!store.shacharitPlaying) return;
  let cancelled = false;
  const schedule = () => {
    const { CADENCE_MIN, CADENCE_JITTER } = TIMING;
    const speed = store.shacharitSpeed;
    const delay = (CADENCE_MIN + Math.random() * CADENCE_JITTER) / speed;
    const t = setTimeout(() => {
      if (cancelled) return;
      const result = usePrayerStore.getState().advanceShacharit();
      // mirror into haloStore
      const idx = usePrayerStore.getState().shacharitActiveWord;
      useHaloStore.getState().setActive(idx);
      if (result === 'advanced') schedule();
    }, delay);
    return t;
  };
  schedule();
  return () => { cancelled = true; };
}, [usePrayerStore(s => s.shacharitPlaying)]);
```

Also: when `shacharitPlaying` flips on, if the user sits at a prayer boundary (last word), jump to next prayer first:

```tsx
const setPlaying = (on: boolean) => {
  const s = usePrayerStore.getState();
  if (on && s.shacharitActiveWord !== null) {
    const cur = s.shacharitBounds.find(b => s.shacharitActiveWord! >= b.start && s.shacharitActiveWord! < b.end);
    if (cur && s.shacharitActiveWord === cur.end - 1) {
      s.jumpToNextPrayer();
    }
  }
  s.setShacharitPlaying(on);
};
```

- [ ] **Step 2:** Verify by temporarily calling `setPlaying(true)` from a debug button and watching the halo advance and stop at each prayer boundary.

- [ ] **Step 3:** Commit.

```
git add src/screens/ShacharitScrollScreen.tsx
git commit -m "feat(playback): tick loop with prayer-boundary auto-stop"
```

---

## Phase 9 — Right-side rail with bird

### Task 9.1: ProgressRail segments

**Files:** Create `src/components/shacharit/ProgressRail.tsx`

- [ ] **Step 1:** Component — four vertical gradient segments, tappable to scroll to section.

```tsx
// src/components/shacharit/ProgressRail.tsx
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SECTIONS, SECTION_ORDER, type SectionId } from '../../theme/shacharitTheme';

interface Props {
  activeSection: SectionId;
  onJumpSection: (id: SectionId) => void;
  birdTop: number;          // vertical position of bird in px, 0..railHeight
  renderBird: () => React.ReactNode;
}

const SEG_GRADIENTS: Record<SectionId, [string, string]> = {
  birchot:    ['#eab864', '#b07a1c'],
  pesukei:    ['#b07a1c', '#d48d23'],
  shema:      ['#d48d23', '#1d4a7a'],
  concluding: ['#1d4a7a', '#5c6b2f'],
};

export default function ProgressRail({ activeSection, onJumpSection, birdTop, renderBird }: Props) {
  return (
    <View style={styles.rail} pointerEvents="box-none">
      <View style={styles.segments}>
        {SECTION_ORDER.map(id => (
          <Pressable
            key={id}
            onPress={() => onJumpSection(id)}
            style={[styles.seg, id === activeSection && styles.segActive]}
          >
            <LinearGradient
              colors={SEG_GRADIENTS[id]}
              style={StyleSheet.absoluteFill}
            />
          </Pressable>
        ))}
      </View>
      <View style={[styles.birdHost, { top: birdTop }]}>{renderBird()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: { position: 'absolute', right: 16, top: 80, bottom: 140, width: 12, alignItems: 'center' },
  segments: { flex: 1, width: 4, justifyContent: 'space-between', gap: 6 },
  seg: { flex: 1, borderRadius: 999, overflow: 'hidden', opacity: 0.55 },
  segActive: { opacity: 1 },
  birdHost: { position: 'absolute', right: '100%', marginRight: 6, width: 40, height: 24 },
});
```

Note: the bird host is positioned on the left of the rail (`right: '100%'`) so it does not run off the right edge — matching the prototype's final placement.

- [ ] **Step 2:** Commit.

```
git add src/components/shacharit/ProgressRail.tsx
git commit -m "feat(shacharit): ProgressRail with four gradient segments"
```

### Task 9.2: BirdMarker SVG

**Files:** Create `src/components/shacharit/BirdMarker.tsx`

- [ ] **Step 1:** Component.

```tsx
// src/components/shacharit/BirdMarker.tsx
import React, { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Path, Ellipse, Circle } from 'react-native-svg';
import { StyleSheet } from 'react-native';

interface Props { color: string }

export default function BirdMarker({ color }: Props) {
  const y = useSharedValue(0);
  const r = useSharedValue(-3);
  useEffect(() => {
    y.value = withRepeat(withTiming(-2, { duration: 1700 }), -1, true);
    r.value = withRepeat(withTiming(3,  { duration: 1700 }), -1, true);
  }, []);
  const s = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { rotate: `${r.value}deg` }],
  }));
  return (
    <Animated.View style={[styles.wrap, s]}>
      <Svg width="100%" height="100%" viewBox="0 0 42 24">
        <Path d="M2 16 Q 9 3 18 13"  stroke={color} strokeWidth={3.2} strokeLinecap="round" fill="none" />
        <Path d="M24 13 Q 33 3 40 16" stroke={color} strokeWidth={3.2} strokeLinecap="round" fill="none" />
        <Ellipse cx={21} cy={15} rx={4.6} ry={3.3} fill={color} />
        <Circle cx={21}   cy={11.4} r={2.4} fill="#fffcf3" />
        <Circle cx={21.3} cy={11}   r={0.75} fill="rgba(40,25,10,0.85)" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', height: '100%', shadowColor: '#2a1a0a', shadowOpacity: 0.28, shadowRadius: 4, elevation: 6 },
});
```

- [ ] **Step 2:** Commit.

```
git add src/components/shacharit/BirdMarker.tsx
git commit -m "feat(shacharit): BirdMarker SVG with glide animation"
```

### Task 9.3: Scroll-to-position hook

**Files:** Create `src/hooks/useShacharitScroll.ts`

- [ ] **Step 1:** Hook exposes the scroll handler, active section id, and bird position fraction (0..1).

```ts
// src/hooks/useShacharitScroll.ts
import { useRef, useState, useCallback } from 'react';
import type { NativeSyntheticEvent, NativeScrollEvent, ScrollView } from 'react-native';
import { SECTION_ORDER, type SectionId } from '../theme/shacharitTheme';

export interface SectionLayout {
  id: SectionId;
  y: number;
  height: number;
}

export function useShacharitScroll() {
  const scrollRef = useRef<ScrollView>(null);
  const [layouts, setLayouts] = useState<Record<SectionId, SectionLayout | null>>({
    birchot: null, pesukei: null, shema: null, concluding: null,
  });
  const [activeSection, setActiveSection] = useState<SectionId>('birchot');
  const [birdFraction, setBirdFraction] = useState(0);

  const onSectionLayout = useCallback((id: SectionId, y: number, height: number) => {
    setLayouts(l => ({ ...l, [id]: { id, y, height } }));
  }, []);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const viewH = e.nativeEvent.layoutMeasurement.height;
    const focus = y + viewH * 0.42;

    // compute bird fraction based on first-top/last-bottom span
    const entries = SECTION_ORDER.map(id => layouts[id]).filter(Boolean) as SectionLayout[];
    if (entries.length === SECTION_ORDER.length) {
      const first = entries[0].y;
      const last  = entries[entries.length - 1];
      const total = Math.max(1, last.y + last.height - first);
      setBirdFraction(Math.max(0, Math.min(1, (focus - first) / total)));

      let active: SectionId = SECTION_ORDER[0];
      for (const e of entries) {
        if (e.y < y + viewH * 0.5) active = e.id;
      }
      setActiveSection(active);
    }
  }, [layouts]);

  const jumpToSection = useCallback((id: SectionId) => {
    const l = layouts[id];
    if (!l || !scrollRef.current) return;
    scrollRef.current.scrollTo({ y: Math.max(0, l.y - 20), animated: true });
  }, [layouts]);

  return { scrollRef, onScroll, onSectionLayout, activeSection, birdFraction, jumpToSection };
}
```

- [ ] **Step 2:** Wire into ShacharitScrollScreen.

```tsx
const { scrollRef, onScroll, onSectionLayout, activeSection, birdFraction, jumpToSection } = useShacharitScroll();

<ScrollView
  ref={scrollRef}
  onScroll={onScroll}
  scrollEventThrottle={16}
  contentContainerStyle={styles.scroll}
>
  {SHACHARIT_STRUCTURE.map((sec, sIdx) => (
    <View
      key={sec.id}
      onLayout={e => onSectionLayout(sec.id, e.nativeEvent.layout.y, e.nativeEvent.layout.height)}
    >
      <SectionBlock sectionId={sec.id} isFirst={sIdx === 0}>...</SectionBlock>
    </View>
  ))}
</ScrollView>

<ProgressRail
  activeSection={activeSection}
  onJumpSection={jumpToSection}
  birdTop={birdFraction * RAIL_HEIGHT_PX}
  renderBird={() => <BirdMarker color={SECTIONS[activeSection].accent} />}
/>
```

Where `RAIL_HEIGHT_PX` is computed from the rail's measured height (use `onLayout` on the rail's segments View and store in state).

- [ ] **Step 3:** Run. Scroll slowly from top to bottom — bird should glide down the rail, changing color as sections transition. Tap a rail segment — screen smoothly scrolls to that section.

- [ ] **Step 4:** Commit.

```
git add src/hooks/useShacharitScroll.ts src/screens/ShacharitScrollScreen.tsx
git commit -m "feat(rail): bird + segment tracking synced to scroll position"
```

---

## Phase 10 — Bottom app bar

### Task 10.1: AppBar component

**Files:** Create `src/components/shacharit/AppBar.tsx`

- [ ] **Step 1:** Component — modes pill (3 multi-select buttons), play button (primary), speed slider.

```tsx
// src/components/shacharit/AppBar.tsx
import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Slider from '@react-native-community/slider';
import { INK, FONTS, PARCHMENT, TIMING } from '../../theme/shacharitTheme';

interface Props {
  lanes: { hebrew: boolean; translit: boolean; english: boolean };
  onToggleLane: (lane: 'hebrew' | 'translit' | 'english') => void;
  playing: boolean;
  onTogglePlay: () => void;
  speed: number;
  onSpeedChange: (v: number) => void;
}

export default function AppBar(p: Props) {
  return (
    <View style={styles.bar}>
      <View style={styles.modes}>
        {(['hebrew', 'translit', 'english'] as const).map(lane => (
          <Pressable key={lane} onPress={() => p.onToggleLane(lane)} style={[styles.modeBtn, p.lanes[lane] && styles.modeBtnOn]}>
            <Text style={[styles.modeText, p.lanes[lane] && styles.modeTextOn]}>
              {lane === 'hebrew' ? 'א' : lane === 'translit' ? 'Aa' : 'En'}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.divider} />
      <Pressable onPress={p.onTogglePlay} style={[styles.play, p.playing && styles.playOn]}>
        <Svg width={18} height={18} viewBox="0 0 24 24">
          <Path
            d={p.playing ? 'M6 5h4v14H6zm8 0h4v14h-4z' : 'M7 5v14l12-7z'}
            fill={PARCHMENT}
          />
        </Svg>
      </Pressable>
      <View style={styles.divider} />
      <View style={styles.speed}>
        <Text style={styles.speedVal}>{p.speed.toFixed(1)}×</Text>
        <Slider
          style={{ width: 88, height: 28 }}
          minimumValue={TIMING.SPEED_MIN}
          maximumValue={TIMING.SPEED_MAX}
          step={TIMING.SPEED_STEP}
          value={p.speed}
          onValueChange={p.onSpeedChange}
          minimumTrackTintColor={INK.strong}
          maximumTrackTintColor="rgba(0,0,0,0.15)"
          thumbTintColor={INK.strong}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute', bottom: 22, left: 22, right: 22,
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 6,
    backgroundColor: 'rgba(255,253,247,0.78)', borderRadius: 999,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
    shadowColor: '#2a1a0a', shadowOpacity: 0.13, shadowRadius: 14, elevation: 10,
    justifyContent: 'center',
  },
  modes: { flexDirection: 'row' },
  modeBtn: { minWidth: 40, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  modeBtnOn: { backgroundColor: INK.strong },
  modeText: { color: INK.faint, fontFamily: FONTS.serifBodyItalic, fontSize: 15 },
  modeTextOn: { color: PARCHMENT, fontFamily: FONTS.serifBody },
  divider: { width: 1, height: 28, backgroundColor: 'rgba(0,0,0,0.09)' },
  play: { width: 54, height: 54, borderRadius: 27, backgroundColor: INK.strong, alignItems: 'center', justifyContent: 'center' },
  playOn: { backgroundColor: '#b07a1c' },
  speed: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10 },
  speedVal: { fontFamily: FONTS.displayItalic, fontSize: 13, color: INK.soft, minWidth: 34, textAlign: 'center' },
});
```

- [ ] **Step 2:** Plug into screen.

```tsx
<AppBar
  lanes={useSettingsStore(s => s.displayLanes)}
  onToggleLane={(l) => {
    const cur = useSettingsStore.getState().displayLanes[l];
    useSettingsStore.getState().setDisplayLane(l, !cur);
  }}
  playing={usePrayerStore(s => s.shacharitPlaying)}
  onTogglePlay={() => setPlaying(!usePrayerStore.getState().shacharitPlaying)}
  speed={usePrayerStore(s => s.shacharitSpeed)}
  onSpeedChange={(v) => usePrayerStore.getState().setShacharitSpeed(v)}
/>
```

- [ ] **Step 3:** Run. Toggle lanes on and off, drag speed, press play. Verify all three connect to state.

- [ ] **Step 4:** Commit.

```
git add src/components/shacharit/AppBar.tsx src/screens/ShacharitScrollScreen.tsx
git commit -m "feat(shacharit): bottom AppBar with modes, play, speed slider"
```

---

## Phase 11 — Ambient polish

### Task 11.1: Paper grain overlay

**Files:** Create `src/components/shacharit/PaperGrain.tsx`

React Native cannot use inline SVG as a tiled pattern the way CSS can, but can use a repeating image. Generate a small PNG noise texture (or reuse the SVG encoded as a data URI via `react-native-svg`).

- [ ] **Step 1:** Simplest reliable path — use `Image` with a pre-generated low-contrast noise PNG placed in `assets/textures/paper-grain.png`. Then:

```tsx
// src/components/shacharit/PaperGrain.tsx
import React from 'react';
import { Image, StyleSheet } from 'react-native';

export default function PaperGrain() {
  return (
    <Image
      source={require('../../../assets/textures/paper-grain.png')}
      style={styles.grain}
      resizeMode="repeat"
    />
  );
}

const styles = StyleSheet.create({
  grain: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.055,
  },
});
```

**Generate the texture** once with ImageMagick: `convert -size 220x220 xc: +noise random -colorspace Gray -attenuate 0.2 -evaluate max 0 grain.png` or let the engineer find a CC0 noise PNG.

- [ ] **Step 2:** Overlay at screen level, just under the AppBar:

```tsx
<PaperGrain />
```

Verify on a cream section that grain is barely perceptible but visible under raking light.

- [ ] **Step 3:** Commit.

```
git add assets/textures/paper-grain.png src/components/shacharit/PaperGrain.tsx src/screens/ShacharitScrollScreen.tsx
git commit -m "feat(ambient): paper-grain overlay"
```

### Task 11.2: Section motion-overlay drift

**Files:** Modify `SectionBlock.tsx`

- [ ] **Step 1:** Inside SectionBlock, add a second absolute-positioned Animated.View with a soft dual-radial overlay that slowly translates on a 40-second loop, similar to the HTML prototype's `::after`. Use Reanimated:

```tsx
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';

const x = useSharedValue(0);
const y = useSharedValue(0);
useEffect(() => {
  x.value = withRepeat(withTiming(-0.025, { duration: 40000 }), -1, true);
  y.value = withRepeat(withTiming(0.02,  { duration: 40000 }), -1, true);
}, []);
const driftStyle = useAnimatedStyle(() => ({
  transform: [
    { translateX: x.value * Dimensions.get('window').width },
    { translateY: y.value * Dimensions.get('window').height },
  ],
}));

<Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, driftStyle, { opacity: 0.3 }]}>
  <LinearGradient
    colors={['rgba(255,252,240,0.10)', 'transparent']}
    style={{ position: 'absolute', top: 0, left: 0, width: '80%', height: '60%' }}
    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
  />
  <LinearGradient
    colors={['rgba(30,20,10,0.06)', 'transparent']}
    style={{ position: 'absolute', bottom: 0, right: 0, width: '75%', height: '55%' }}
    start={{ x: 1, y: 1 }} end={{ x: 0, y: 0 }}
  />
</Animated.View>
```

- [ ] **Step 2:** Commit.

```
git add src/components/shacharit/SectionBlock.tsx
git commit -m "feat(ambient): section motion overlay with drift"
```

---

## Phase 12 — Performance and QA

### Task 12.1: FlatList investigation

**Files:** Possibly modify `src/screens/ShacharitScrollScreen.tsx`

- [ ] **Step 1:** Profile render time with all 18 prayers mounted. On the screen, measure initial render time with `console.time('shacharit-render')` at the start of the component and `console.timeEnd` on a useEffect after mount.

- [ ] **Step 2:** If initial render exceeds 800ms on a mid-range device, convert to `FlatList`. Each item is a `SectionBlock` containing its prayers. Provide a `getItemLayout` so the rail's scroll-to-section math still works. If render is acceptable, keep ScrollView.

- [ ] **Step 3:** Commit any change.

```
git add src/screens/ShacharitScrollScreen.tsx
git commit -m "perf(shacharit): convert to FlatList" # only if conversion was done
```

### Task 12.2: Memoization audit

**Files:** `WordPair.tsx`, `PairRow.tsx`, `PrayerBlock.tsx`

- [ ] **Step 1:** Confirm `WordPair` is wrapped in `React.memo` (done in Phase 6). Confirm `PairRow` uses `useMemo` for pairs (done).

- [ ] **Step 2:** Ensure the Halo's `ActiveWatcher` inner component is memoized so that pairs whose `idx` is neither active nor in trail do NOT re-render on every tick. Test by setting `idx` to advance and watching React DevTools (or a render-log via `useEffect`). If all pairs re-render every tick, lift the subscription — only pairs in the "active window" of ~12 words should subscribe.

- [ ] **Step 3:** Commit.

```
git add src/components/shacharit/*.tsx
git commit -m "perf(halo): scoped subscription per pair to avoid global re-renders"
```

### Task 12.3: Manual QA checklist

No code changes — run through the app and confirm each item.

- [ ] Home → Shacharit card → ShacharitScrollScreen opens at top of Birchot HaShachar
- [ ] Scroll end-to-end — all 18 prayers render, section color transitions visible
- [ ] Gold divider visible between sections 2/3/4, pulses
- [ ] Tap Commentary on Modeh Ani — panel expands, tap again — collapses
- [ ] Tap Audio & Notes on Shema — panel expands, placeholder player shows
- [ ] Tap play in audio placeholder — wave animates, other players don't affect main playback
- [ ] Press main play — halo crescendos on first word of current prayer
- [ ] Halo trails visible — previous words fading
- [ ] Halo stops at end of Modeh Ani, play button deactivates
- [ ] Press play again — advances to Asher Yatzar's first word
- [ ] Tap a translit word mid-prayer — halo jumps to matching Hebrew position (pair still intact)
- [ ] Drag speed slider — cadence accelerates/decelerates, halo timing follows
- [ ] Bottom app bar: toggle Hebrew off — translit-only view, flows LTR
- [ ] Toggle English on — English paragraph appears below each prayer
- [ ] Rail: bird visible on left of rail, color matches active section
- [ ] Scroll — bird position updates, section color shifts smoothly
- [ ] Tap rail segment III — screen smooth-scrolls to Shema section intro
- [ ] Rotate device — layout re-flows without losing position or state
- [ ] Dark room: grain visible as subtle paper texture under bloom

### Task 12.4: Back-compat regression check

- [ ] Navigate to Mincha from Home — opens old ReadAlongScreen, unchanged
- [ ] Navigate to Birkat Hamazon — old screen, unchanged
- [ ] Settings screen — existing settings still work; `displayLanes` does not break the legacy `displayMode`
- [ ] Kill and relaunch app — previously-set displayLanes persists

### Task 12.5: Commit final checkpoint

- [ ] **Step 1:**

```
git add -A
git commit -m "chore: Shacharit continuous scroll redesign complete" --allow-empty
```

- [ ] **Step 2:** Report readiness: "Shacharit continuous-scroll redesign ready for Rabbi Feigenbaum review. Branch: `shacharit-scroll-redesign`."

---

## Self-review notes

- Spec coverage: all elements from `design-prototype/shacharit-scroll.html` appear in a task — section backgrounds, dividers, intros, prayer headers, panels, word pairs, halos with trail, auto-stop, rail, bird, app bar, speed, grain, motion overlay.
- Reused components: `ExpandablePanel` serves both section-level and prayer-level panels.
- Known gaps the engineer may surface:
  - The `loadBundledPrayer` shape in Task 5.2 depends on the actual bundled JSON format — the engineer must adjust the field names once they inspect a real file.
  - `react-native-reanimated` on Expo SDK 52 typically works out of the box; if animations feel janky on dev builds, test on a release build.
  - React Native's Text component does not render `currentColor`; every place the HTML prototype used `currentColor`, this plan hard-codes the section accent.
  - The bird's drop-shadow differs across iOS/Android; the `elevation` on Android may produce a soft square shadow instead of a halo. Accept per-platform variance.
