# Feigenbaum Remap — Plan C: Learn Surface + Cutover

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Each task = TDD-style; steps use `- [ ]` checkboxes.

**Goal:** Complete the user-visible Learn surface against real essay data, wire the karaoke tick loop into `siddurStore`, flip the feature flag so `SiddurScrollScreen` drives Shacharit too, delete legacy code, ship `/siddur-qa`, and run the full pre-merge QA pass.

**Architecture:** No new architectural pieces — this is the cutover plan. `LearnScreen` and `EssayScreen` get real data wiring (Plan B output). The tick loop migrates from `prayerStore.advanceShacharit()` to `siddurStore.advance()` with the same crescendo/decrescendo halo behavior. `useAudioPlayer` + `useWordSync` stay dormant; the V2 transition path stays clean.

**Tech stack:** Same as Plan A. No new dependencies.

**Spec reference:** `docs/superpowers/specs/2026-05-26-feigenbaum-siddur-remap-design.md` §7.4-7.6, §8.2, §8.7, §10.5.

**Depends on:** Plans A and B complete. `src/data/siddur/` populated. Plan A invariants passing against real data.

---

## Task 1 — Wire `LearnScreen` to real essay data

**Modify:** `src/siddur/LearnScreen.tsx`. **Test:** update `src/siddur/__tests__/LearnScreen.test.tsx`.

**What changes:**
- Import `ESSAYS` from `src/data/siddur/learn`.
- Build three derived lists from `Object.entries(ESSAYS)`:
  - **Essays from the siddur** — filter `essayKind === 'appendix'`, sorted by numeric prefix in `id` (`appendix_01_*` first).
  - **From Rabbi Feigenbaum** — filter `essayKind ∈ {'personal_note', 'introduction'}`.
  - **Glossary** — filter `essayKind === 'glossary'`.
- Each row: title + tap pushes `Essay` route with `{ essayId }`.
- "Recently relevant" section: read `useSiddurProgress`'s most recent card+section; intersect with `essay.anchoredFrom`; render up to 3 matches.

**Test additions:**
- Renders at least 12 appendix rows.
- Tapping an appendix calls `navigation.navigate('Essay', { essayId: <id> })`.

**Commit:** `feat(siddur): wire LearnScreen to real essay data from Plan B output`

---

## Task 2 — Wire `EssayScreen` to real essay data + reverse cross-links

**Modify:** `src/siddur/EssayScreen.tsx`. **Test:** update `src/siddur/__tests__/EssayScreen.test.tsx` (split from LearnScreen test if needed).

**What changes:**
- Import `ESSAYS` from `src/data/siddur/learn`.
- Look up essay by `route.params.essayId`. If missing, render an empty-state.
- Header: `essay.title.en` (with optional `title.he` below for glossary).
- Body: render `essay.body` (array of `EnglishParagraph`) via `ItalicEnglishText`.
- Bottom section "While davening, this is relevant during:" — list `essay.anchoredFrom`. Each row: `<cardId · sectionId title>`, tappable, pushes `SiddurScroll` with `{ cardId, sectionId }`.
- Honor `returnTo` route param: if present, back button returns to that scroll position via `navigation.goBack()` (works because `Essay` is pushed on top, not navigated as replace).

**Test additions:**
- Renders title and body for a real essay (use `appendix_09_korbanos`).
- Bottom section shows `anchoredFrom` rows.
- Tapping a row navigates to `SiddurScroll` with correct params.

**Commit:** `feat(siddur): EssayScreen renders real essays with reverse cross-links`

---

## Task 3 — Section jump-to bottom sheet

**Create:** `src/siddur/components/SectionJumpSheet.tsx`. **Modify:** `src/siddur/SiddurScrollScreen.tsx` to integrate it.

**Behavior:**
- Sticky button in the scroll header shows current section title (updates as user scrolls past section boundaries).
- Tap → bottom sheet listing every section in the current card (from `getCard(cardId).sections`).
- Tap a row → scrolls to that section's first word. Use a `ref` map on each section's wrapper `View` to call `scrollTo({ y: layoutY })`.
- Sheet closes on row tap.

**Implementation notes:**
- Use a simple `Modal` with `transparent presentationStyle="overFullScreen"` and a slide-up `View`. Avoid pulling in a sheet library.
- Current section tracking: `onScroll` handler reads each section's last-known `y` via `onLayout` callbacks and updates `siddurStore.activeSectionId` when crossing a boundary.

**Test (`src/siddur/components/__tests__/SectionJumpSheet.test.tsx`):**
- Renders all sections for the current card.
- Tapping a row calls the `onSelect(sectionId)` callback.

**Commit:** `feat(siddur): section jump-to bottom sheet`

---

## Task 4 — Wire the karaoke tick loop into `siddurStore`

**Create:** `src/siddur/hooks/useKaraokeTickLoop.ts`. **Modify:** `src/siddur/SiddurScrollScreen.tsx`.

**The hook:** mirrors the existing tick cadence from `prayerStore` (CADENCE_MIN + jitter, scaled by speed), driving `siddurStore.advance()` on each tick.

```ts
export function useKaraokeTickLoop() {
  const { isPlaying, speed, advance } = useSiddurStore(...);
  useEffect(() => {
    if (!isPlaying) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const result = advance();
      if (result === 'end' || result === 'section-boundary') return;
      const ms = (TIMING.CADENCE_MIN + Math.random() * TIMING.CADENCE_JITTER) / speed;
      timer = setTimeout(tick, ms);
    };
    timer = setTimeout(tick, TIMING.INITIAL_DELAY);
    return () => clearTimeout(timer);
  }, [isPlaying, speed, advance]);
}
```

**`SiddurScrollScreen` changes:**
- Call `useKaraokeTickLoop()` at the top of the component.
- Add play/pause control (button in header).
- Connect `activeWordIndex` from `siddurStore` to `BlockRenderer` (already passed; just verify wiring).
- Halo state for the active word: `WordPair` component reads `activeWordIndex === word.globalIndex` and passes `'active' | 'fading' | 'idle'` to `<Halo>`. (Should already work from Plan A; verify under real content.)

**Test (`src/siddur/hooks/__tests__/useKaraokeTickLoop.test.ts`):**
- Use `jest.useFakeTimers()`.
- Start with `isPlaying=true`, advance fake timer past `INITIAL_DELAY + CADENCE_MIN`. Assert `advance` called.
- After `'section-boundary'` return, no further calls.

**Commit:** `feat(siddur): karaoke tick loop driving siddurStore.advance`

---

## Task 5 — Manual visual QA on the new scroll (before cutover)

**No code changes.** This task verifies the new scroll feels right against real content **before** flipping the feature flag.

**Steps:**
1. Temporarily route the Shacharit card to `SiddurScroll` instead of legacy (edit `HomeScreen.tsx` locally, don't commit).
2. `npm run start -- --clear && npm run ios`.
3. Walk through Shacharit start to finish:
   - Open Modeh Ani via Birchos HaShachar → halo lights up on first word, crescendo timing matches old feel.
   - Scroll through Pesukei D'Zimrah → no rendering glitches; line/word layout matches Feigenbaum print.
   - Hit a `MinyanOnlyBlock` (Barchu, Kedushah in Amidah, Birkas Cohanim) → collapsed by default, tap reveals plain text.
   - Hit a `LearnCrossLink` pill → tap pushes Essay; back returns to scroll position.
   - Hit a `FaqBlock` → expand/collapse smoothly.
   - Switch lane toggles in Settings → He/Translit/En render correctly.
4. Revert the temporary HomeScreen edit.
5. Note any issues; file follow-up tasks if any. Block flipping the flag (next task) until critical visual issues are resolved.

**No commit.** This is verification only.

---

## Task 6 — Flip the feature flag

**Modify:** `src/lib/featureFlags.ts`.

```ts
export const FEATURE_FLAGS = {
  USE_LEGACY_SHACHARIT_SCROLL: false,
} as const;
```

Verify on simulator: Shacharit card now opens `SiddurScrollScreen` with real Shacharit content.

**Commit:** `feat(siddur): cut over Shacharit to new SiddurScrollScreen`

---

## Task 7 — Delete legacy Shacharit code

**Delete:**
```
src/screens/ShacharitScrollScreen.tsx
src/components/shacharit/    (entire directory)
src/data/bundled/             (entire directory; Plan B already ported translit)
src/data/serviceRegistry.ts
src/data/prayerOrders/        (entire directory)
src/data/shacharit/           (entire directory; load helpers superseded)
src/store/prayerStore.ts
src/theme/shacharitTheme.ts
src/hooks/usePrayerProgress.ts
```

**Modify any importers** to use new paths/names:
- `src/data/siddur/*` instead of `src/data/bundled/shacharit/*`.
- `src/store/siddurStore` instead of `src/store/prayerStore`.
- `src/theme/siddurTheme` instead of `src/theme/shacharitTheme`.
- `src/hooks/useSiddurProgress` instead of `src/hooks/usePrayerProgress`.
- `src/siddur/components/*` for any remaining `src/components/shacharit/*` imports.

Also delete the `ShacharitScroll` route registration in `src/navigation/AppNavigator.tsx` and the `FEATURE_FLAGS.USE_LEGACY_SHACHARIT_SCROLL` branch in `src/screens/HomeScreen.tsx`. After removal, `src/lib/featureFlags.ts` may end up with no flags — keep it as an empty `{}` rather than deleting in case future flags need a home, OR delete it cleanly if nothing else uses it.

**Verify:**
- `grep -rln "shacharit/\|prayerStore\|usePrayerProgress\|shacharitTheme\|serviceRegistry\|ShacharitScroll" src` returns no results (or only inside `siddur/components/` filenames, which are fine).
- `npx tsc --noEmit && npm run lint && npm test -- --silent` all clean.

**Commit:** `chore(siddur): delete legacy Shacharit code after cutover`

---

## Task 8 — Add `/siddur-qa` slash command skill

**Create:** `.claude/commands/siddur-qa.md`. **Reference:** the existing `.claude/commands/shacharit-qa.md` (read for the format) — replace with the new siddur-aware version, or delete the old file if it's still around.

**Skill content** (mirroring spec §10.5):

```markdown
# /siddur-qa

Runs the full pre-merge QA pass for the siddur remap. Three phases.

## Phase A — automated

Run in order; stop on first failure:
1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm test -- --silent`
4. `npm run siddur:verify` — regenerates reports under `content/feigenbaum-2026/reports/`.
5. Diff the reports against the committed copy. Any new FAIL in `coverage_report.md`, italic count drop, or new translit gap is a regression.

## Phase B — diff-aware code review against `main`

`git diff --stat main...HEAD`. Then for each touched area:
- Are kept primitives (`Halo`, `WordPair`, `LineRow`, `PairRow`) unchanged or only mechanically renamed?
- Are `useAudioPlayer`/`useWordSync` untouched?
- Does the `ANTICIPATION_OFFSET_MS = 85` constant survive?
- No commentary popover references reintroduced?

## Phase C — manual on simulator

`npm run start -- --clear && npm run ios`, then walk this checklist:

- [ ] Fresh-install onboarding flow: Welcome → SkillTier → LocationPermission → **TranslationPhilosophy** → Home.
- [ ] Home shows 6 cards in 2×3 grid plus the zmanim header.
- [ ] Each karaoke card opens a working scroll with at least the first section's content rendered.
- [ ] Lane toggle: turn each of He/Translit/En off and on; corresponding lane appears/disappears.
- [ ] In Shacharit, hit a FAQ block — expands and collapses smoothly.
- [ ] In Shacharit, hit a `MinyanOnlyBlock` (Barchu) — collapsed by default, plain text on reveal, no halo.
- [ ] Tap a Learn cross-link pill — opens Essay screen; back returns to same scroll position.
- [ ] Open Learn from Home — four sections render (Essays / From R. Feigenbaum / Glossary / Recently relevant).
- [ ] Tap an essay — opens Essay screen with body + reverse-link "While davening, this is relevant during" rows.
- [ ] Tap a reverse-link row — navigates to that prayer location.
- [ ] Settings → "About this translation" — opens same content in settings mode (back arrow, no Got it).
- [ ] Italic interpretive English visible distinctly from regular English on Ashrei or Modeh Ani.
- [ ] TestFlight auto-migration: install over the previous version (use Xcode's "install over" or a TestFlight build) — no re-onboarding.
- [ ] Karaoke advance: play/pause works; halo crescendo/decrescendo matches old feel.

Sign off when every box is checked.
```

Verify the skill is registered by typing `/siddur-qa` in Claude Code — it should be listed.

**Commit:** `feat(qa): /siddur-qa slash command for pre-merge QA`

---

## Task 9 — Run `/siddur-qa` and resolve findings

**Steps:**
1. Invoke `/siddur-qa` and walk all three phases.
2. For each Phase A failure: fix and commit.
3. For each Phase B finding: fix and commit.
4. For each Phase C checklist item that fails: file a follow-up if non-blocking, fix inline if blocking.
5. Re-run from Phase A until all green.

**Commit (if any fixes landed):** `fix: address /siddur-qa findings`

---

## Task 10 — Update memory + final commit

**Update auto-memory** to reflect MVP launch state:
- `project_v1_scope.md` — V1 has shipped as the full Feigenbaum weekday siddur per this remap.
- `project_phasing_plan.md` — V1 done; V2 is commentary + audio language files; V3 is calendar engine.

**Run end-to-end:**
```bash
git log --oneline main..HEAD | head -30
npx tsc --noEmit && npm run lint && npm test -- --silent
```

All green. Plan C complete. Ready for branch → PR → review → merge to main.

**Commit (memory update):** `docs(memory): mark V1 Feigenbaum remap shipped`

---

## Self-review

| Spec § | Tasks |
|---|---|
| §7.4 LearnScreen (full) | 1 |
| §7.5 EssayScreen (full) | 2 |
| §7.6 cross-links forward | Plan A Task 14 (BlockRenderer dispatches `learn_link`) |
| §7.6 cross-links reverse | 2 |
| §8.2 karaoke advance | 4 |
| §8.7 section jump-to | 3 |
| §10.5 manual QA | 5, 8, 9 |
| §10.6 pre-merge gates | 8 (codified) |
| §4.5 migration step 6 (flip + delete legacy) | 6, 7 |

No placeholders. The hook code in Task 4 is illustrative; the executing agent fills in exact imports/typing against the live `siddurStore` shape from Plan A Task 7.

---

## Execution handoff

Subagent-driven recommended; tasks are sequential, no fanout opportunity. Pair Task 5 (manual QA) and Task 9 (final QA) with the user at the simulator — these are sign-off moments, not autonomous.
