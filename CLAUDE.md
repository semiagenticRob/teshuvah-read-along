# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Expo / React Native app (SDK 52, RN 0.76, React 18.3, TypeScript, Zustand) that plays Hebrew prayer audio with synchronized word-level highlighting across the Hebrew text, transliteration, and English translation. Covers four services: `shacharit`, `mincha`, `maariv`, `birkat_hamazon`.

The default base branch is `claude/jewish-prayer-app-plan-dmtkX` (not `main`) — PRs target it.

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
npx expo-doctor       # sanity check expo deps
```

TS path alias: `@/*` → `src/*` (per `tsconfig.json`).

ESLint ignores `android/`, `ios/`, `scripts/`, `audio-pilot/`, `design-prototype/`, `docs/`, `assets/` — those are not part of the app source.

## Architecture

### App entry & navigation

`App.tsx` loads Google fonts (Frank Ruhl Libre, EB Garamond, Cormorant Garamond), hydrates the settings store, and mounts `AppNavigator` (React Navigation stack). Routes: `Home → PrayerList → ReadAlong | ShacharitScroll → Settings / About`.

`ShacharitScroll` is a separate, redesigned continuous-scroll experience with its own component tree under `src/components/shacharit/` and its own data layer under `src/data/shacharit/`. The legacy per-prayer flow is `ReadAlong` and uses `src/components/ReadAlongView.tsx`. Both flows coexist — do not assume changes to one apply to the other.

### Services & prayer data

`src/data/serviceRegistry.ts` is the source of truth for which services exist and which prayer ordering function each one uses. Per-service prayer orderings live in `src/data/prayerOrders/{service}.ts`.

Bundled prayer text is JSON shipped in `src/data/bundled/{service}/{prayer_id}.json` (Hebrew, English) plus a parallel `.translit.json` for transliteration. The dispatcher `src/data/bundled/index.ts` routes `getBundledPrayerText(serviceId, prayerId)` to the right per-service loader.

**Lazy parse pattern** (`src/data/shacharit/loadPrayer.ts`): Metro must see static `require()` paths, so every JSON is bundled — but the `require()` calls are wrapped in thunks (`() => require(...)`) so JSON is not parsed until first access. Preserve this pattern when adding prayers; do not move requires to top-level.

### Audio / text synchronization (critical subsystem)

The read-along highlight is driven by aligning three asset families:

| Asset | Path | Status |
|---|---|---|
| Audio MP3s | `assets/audio/{service}/{prayer_id}.mp3` | ground truth, never edit |
| Whisper raw transcripts | `assets/whisper_raw/{service}/{prayer_id}.json` | ground truth, never edit |
| Bundled Hebrew/English | `src/data/bundled/{service}/{prayer_id}.json` | canonical visual text |
| Timing JSON (derived) | `assets/timing/{service}/{prayer_id}.json` | regenerated from the above |

Runtime sync path: `useAudioPlayer` (expo-av) provides `getPositionMs()` → `useWordSync` polls every 50ms, binary-searches the timing array, applies `ANTICIPATION_OFFSET_MS = 85` to compensate for render latency, and sets the current word index → `ReadAlongView` renders the highlight.

Regenerate timing with `python3 scripts/whisper_align_timing.py` (reads `whisper_raw/`, writes `assets/timing/`). For deeper sync debugging, follow `scripts/SYNC_PROTOCOL.md` — it documents the inspection script, alignment fix workflow, and common symptom → cause mappings (slivers, gaps, drift).

### State

Zustand stores in `src/store/`:
- `settingsStore.ts` — user prefs, persisted via AsyncStorage (`loadSettings()` called on app boot).
- `prayerStore.ts` — currently selected service / prayer / playback state.
- `haloStore.ts` — animated halo state for the Shacharit scroll redesign.

`src/hooks/usePrayerProgress.ts` is mounted at the App root and persists progress as the user moves through prayers.

### Shacharit scroll redesign specifics

`ShacharitScrollScreen` virtualizes a long list of prayer blocks. Performance is load-bearing:
- `PrayerBlock` and `PairRow` are `React.memo`'d with stabilized callbacks.
- Halos mount/unmount lazily based on viewport — do not eagerly mount all halos.
- Panels expand on demand to avoid parsing all prayer JSON up front (pairs with the lazy require thunks above).
- Theme tokens live in `src/theme/shacharitTheme.ts` (amber/gold siddur aesthetic); reuse them rather than inlining colors.

When working in this area, the `/shacharit-qa` slash command (`.claude/commands/shacharit-qa.md`) runs a three-pass automated + manual + diff review.

## Content / tooling scripts

`scripts/` contains Node (`.mjs`) and Python (`.py`) utilities for content authoring — they are not part of the runtime bundle. Notable:

- `bundle-sefaria.mjs`, `bundle-services.mjs` — fetch/format Sefaria text into `src/data/bundled/`.
- `whisper_generate_timing.py`, `whisper_align_timing.py` — generate and align timing JSON from audio.
- `generate_audio.py`, `generate_shacharit_translit.py` — TTS and transliteration generation.
- `inspect_prayer.py` — diagnostic tool referenced by `SYNC_PROTOCOL.md`.

Python scripts assume a local Python 3 with whisper/TTS deps; treat them as content-pipeline tools, not CI tasks.

## Conventions

- Hebrew text needs `writingDirection: 'rtl'` on Text components. The codebase uses `src/utils/hebrewUtils.ts` and `src/utils/pairWords.ts` for layout helpers — prefer these to ad-hoc string splitting.
- Tests are colocated in `__tests__/` next to the code they cover (`src/store/__tests__/`, `src/utils/__tests__/`, `src/data/shacharit/__tests__/`).
- Native dirs (`ios/`, `android/`) are committed but generated by `expo prebuild` — prefer editing `app.json` and regenerating over hand-editing native files.
