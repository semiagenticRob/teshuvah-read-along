# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

DavenAlong is an Expo / React Native app (SDK 52, RN 0.76, React 18.3, TypeScript, Zustand) for solo weekday davening. The product surfaces the Feigenbaum siddur with a karaoke-style word-level highlight, layered Hebrew / transliteration / English display, and inline pedagogical commentary. V1 ships only `shacharit`; `mincha`, `maariv`, `birkat_hamazon` are registered but marked `available: false`.

Default base branch is `main`.

## Common commands

```bash
npm run start         # expo start (Metro)
npm run ios           # expo run:ios (requires Xcode, runs Pods)
npm run android       # expo run:android
npm run prebuild      # regenerate native ios/ + android/ dirs from app.json
npm run lint          # eslint . --ext .ts,.tsx
npm test              # jest (preset: jest-expo, ts-jest for .ts/.tsx)
npx tsc --noEmit      # no dedicated typecheck script — invoke tsc directly
npx jest path/to/file.test.ts        # single test file
npx jest -t "test name substring"     # single test by name
npx expo start --clear                # restart Metro with cleared bundler cache
```

TS path alias: `@/*` → `src/*` (per `tsconfig.json`).

ESLint ignores `android/`, `ios/`, `scripts/`, `docs/`, `assets/`.

## Architecture

### App entry & navigation

`App.tsx` loads Google fonts (Frank Ruhl Libre, EB Garamond, Cormorant Garamond), hydrates the settings store, then mounts `AppNavigator`. Existing TestFlight installs auto-migrate to `hasCompletedOnboarding: true` + `userTier: 'returning'`; fresh installs land in the onboarding flow.

`AppNavigator` conditionally renders two route sets keyed on `hasCompletedOnboarding`:
- **Onboarding**: `Welcome → SkillTier → LocationPermission`
- **Main**: `Home → ShacharitScroll`, `Settings`, `About`

There is no legacy `ReadAlong` or `PrayerList` route; both were deleted in `fdbb73e`. `ShacharitScrollScreen` is the only davening surface.

### Services & prayer data

`src/data/serviceRegistry.ts` is the source of truth for service availability. V1 marks Shacharit `available: true`; the other three services exist in the registry but are `available: false` and don't appear on Home as tap targets. Per-service prayer orderings live in `src/data/prayerOrders/{service}.ts`.

Bundled prayer text ships as JSON in `src/data/bundled/{service}/{prayer_id}.json` (Hebrew + typed English `textBlocks[]`) plus a parallel `.translit.json` for transliteration. The dispatcher `src/data/bundled/index.ts` routes `getBundledPrayerText(serviceId, prayerId)` to the right per-service loader.

**Lazy parse pattern** (`src/data/shacharit/loadPrayer.ts`): Metro needs static `require()` paths for bundling, but the `require()` calls are wrapped in thunks (`() => require(...)`) so JSON is not parsed until first access. Preserve this pattern when adding prayers.

**Bundled JSON shape** (`src/data/bundled/shacharit/index.ts`):
- `he: string[]` — Hebrew lines (line-by-line is rendered by `LineRow`)
- `textBlocks: TextBlock[]` — typed English paragraphs (`kind: 'body' | 'heading' | 'subheading' | 'faq' | 'callout'`)
- `commentary?: BundledCommentary[]` — anchored inline commentary `{lineIndex, wordIndex?, marker, text, audioUri?}`
- `segments?: BundledPrayerSegment[]` — line-level metadata for Phase 2 calendar variants (`variantTag`, `simplifiedOmit`)
- `source: 'sefaria' | 'feigenbaum'`

Two `pitum_haketores` / `shesh_zechiros` prayers ship with `he: []` and a `_hebrewSourcing: TODO` marker pending verified canonical Hebrew sourcing.

### Content: Feigenbaum

V1 content is sourced from the Feigenbaum Teen Siddur (canonical English commentary + standard Nusach Ashkenaz Hebrew). Hebrew preserves the existing Sefaria-derived `he[]` (which matches Feigenbaum's printed Hebrew letter-for-letter); only the English commentary comes from Feigenbaum's PDF.

Content pipeline in `scripts/`:
- `extract-feigenbaum.mjs` — Hebrew preserved, `textBlocks[]` rebuilt from Feigenbaum's PDF slice, source flipped to `'feigenbaum'`. Detects heading / subheading / FAQ / "Instant Insight" kinds; filters out all minyan-required content (Kaddish, Borchu, Kedushah, Birkat Cohanim).
- `verify-feigenbaum-coverage.mjs` — character-level Hebrew coverage check vs the PDF slice.
- `port-sefaria-translit.mjs` — alignment verifier; surfaces gaps in existing transliteration.
- `anchor-commentary.mjs` — drafts `commentary[]` entries by detecting `‫LEMMA‬ — English` pattern in Feigenbaum prose.
- `feigenbaum-manifest.json` — per-prayer line ranges in the extracted text.

Source: `content/feigenbaum/feigenbaum-siddur-original.pdf` and `content/feigenbaum/feigenbaum-siddur-extracted.txt`.

### Audio / text synchronization (subsystem, not currently wired)

The Shacharit scroll's tick loop drives word advance manually via `prayerStore.advanceShacharit()` — there is no audio playback in the current build. The audio pipeline exists and is documented, ready to re-wire when V1 audio recording (Task #13) lands:

| Asset | Path | Role |
|---|---|---|
| Audio MP3s | `assets/audio/{service}/{prayer_id}.mp3` | ground truth (recorded) |
| Whisper raw transcripts | `assets/whisper_raw/{service}/{prayer_id}.json` | ground truth, input to alignment |
| Bundled Hebrew | `src/data/bundled/{service}/{prayer_id}.json` `he[]` | canonical visual text |
| Timing JSON (derived) | `assets/timing/{service}/{prayer_id}.json` | regenerated from the above |

Hooks: `useAudioPlayer` (expo-av) provides `getPositionMs()` → `useWordSync` polls every 50ms, binary-searches the timing array, applies `ANTICIPATION_OFFSET_MS = 85` to compensate for render latency, and sets the current word index in `prayerStore`. Neither hook is currently imported by any component.

Regenerate timing with `python3 scripts/whisper_align_timing.py` (reads `whisper_raw/`, writes `assets/timing/`). For sync debugging, follow `scripts/SYNC_PROTOCOL.md`.

### Zmanim

`src/lib/zmanim/` exposes a `ZmanimProvider` interface with a default `LocalZmanimProvider` (in-house NOAA solar math in `sunMath.ts`, no external deps). `useZmanim` reads the user's location from `settingsStore` and recomputes once per minute. `ZmanimHeader` on Home shows Sunrise / Latest Shacharit / Mincha / Sunset; the "Latest Shacharit" cell colors amber under 30 min and red under 10 min before sof zman tfilla.

`@hebcal/core` was tried first but uses top-level `await` in transitive deps (`@hebcal/noaa`) and crashes Hermes at JS compile time — that's why we rolled our own.

### State

Zustand stores in `src/store/`:
- `settingsStore.ts` — user profile (`userTier`, `prayerSetSize`, `location`, `hasCompletedOnboarding`) + display lanes + playback prefs. Persists via AsyncStorage (`@teshuvah_settings`, `@displayLanes`, `@profile`). `loadSettings()` called on app boot, auto-migrates legacy installs.
- `prayerStore.ts` — current service / prayer / playback state.
- `haloStore.ts` — animated halo state for the Shacharit scroll.
- `footnoteStore.ts` — single-open-at-a-time toggle for inline commentary markers.

`src/hooks/usePrayerProgress.ts` is mounted at the App root and persists per-prayer progress.

### Shacharit scroll specifics

`ShacharitScrollScreen` virtualizes a long list of prayer blocks. Performance is load-bearing:
- `PrayerBlock`, `PairRow`, `LineRow` are `React.memo`'d with stabilized callbacks.
- Halos mount/unmount lazily based on viewport — do not eagerly mount all halos.
- Panels expand on demand to avoid parsing all prayer JSON up front (pairs with the lazy require thunks).
- Theme tokens live in `src/theme/shacharitTheme.ts` (amber/gold parchment); reuse them rather than inlining colors.

Rendering hierarchy: `PrayerBlock` → `PairRow` (line-aware) → `LineRow` (per Hebrew line) → `WordPair` (per word). Word indices are stable global integers across the prayer, so halo / word-sync subsystems keep working regardless of line-level rendering.

When working in this area, the `/shacharit-qa` slash command (`.claude/commands/shacharit-qa.md`) runs a three-pass automated + manual + diff review.

## Conventions

- Hebrew text needs `writingDirection: 'rtl'` on Text components. The codebase uses `src/utils/hebrewUtils.ts` and `src/utils/pairWords.ts` for layout helpers.
- Tests are colocated in `__tests__/` next to the code they cover.
- Native dirs (`ios/`, `android/`) are committed but generated by `expo prebuild` — prefer editing `app.json` and regenerating over hand-editing native files.
- Solo davener only — minyan-required content (Kaddish, Borchu, Kedushah, Birkat Cohanim) is filtered out at extraction time by `extract-feigenbaum.mjs` and is not present in any bundled English. If you need to re-introduce minyan content, both the data shape and the extractor would need to be revisited.
