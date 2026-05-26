# Feigenbaum Siddur Remap — Design

**Date:** 2026-05-26
**Status:** Design approved, pending user review of written spec
**Author:** rbrt.s.wrrn@gmail.com (with Claude)
**Next step after approval:** invoke `superpowers:writing-plans` to produce the implementation plan

---

## 1. Problem

DavenAlong today is built around the concept of a "service" (Shacharit / Mincha / Maariv / Birkat Hamazon), with Shacharit as the only `available: true` service. The Shacharit scroll's content comes from a mix of Sefaria-derived Hebrew, a partial Feigenbaum English extraction, and a partial Sefaria-derived transliteration port.

We are remapping the app around **the Feigenbaum weekday siddur itself** as the authoritative source. The new PDF at `/Users/robertwarren/Desktop/100Reps Project/Daven Along/218b_feigenbaum_interior_R1 - reprint Ashk.pdf` (296 pages, Nusach Ashkenaz, "The Feigenbaum Teen Siddur") replaces all prior content sources. The karaoke-style word-level highlight, halo crescendo/decrescendo, and Hebrew/Transliteration/English lane toggle are preserved as the core interaction; everything else is rebuilt.

## 2. Goals

- **MVP ships a fully digital weekday Feigenbaum siddur** — every prayer, FAQ, instant insight, rubric, appendix essay, and glossary entry that appears in the printed PDF is present in the app.
- **Karaoke + halo + lane toggle preserved** at the same quality as today.
- **Print-faithful at MVP** — no calendar logic. Conditional content (Tachanun, Yaaleh V'Yavo, Mussaf for Rosh Chodesh, etc.) appears at its printed location with the siddur's own rubrics.
- **V2 hooks encoded now** — conditional rules and audio sync scaffolding are present in MVP data and code, dormant. V2 turns them on without re-extraction.

### Non-goals (deferred to V2 and beyond)

- Interactive anchored word-level commentary with audio (the old `FootnoteMarker`/`FootnotePanel` system).
- Recorded audio for karaoke timing — "language files."
- Date-aware show/hide of conditional content.
- Multi-language UI / natural-language i18n.
- Minyan content rendered as karaoke (it remains hidden-by-default reveal text).

## 3. Authoritative source

`218b_feigenbaum_interior_R1 - reprint Ashk.pdf` is the single source of truth at MVP for Hebrew, English, FAQs, Instant Insights, rubrics, appendix essays, and the glossary. Where the new PDF differs from prior extracted content, the new PDF wins. The existing Sefaria-derived transliteration is the only exception — it is ported into the new Hebrew structure where word identity matches; gaps are explicit.

### Translation philosophy (per PDF pp. XVI–XVII)

Feigenbaum's English is not a literal translation. It conveys essence, aimed at facilitating real conversation with Hashem. Specifically:

- Long Hebrew paragraphs may have only a few lines of English (e.g., Hodu, Az Yashir).
- Interpretive additions are *italicized* — e.g., "Happy are those who *(wherever they are)* are living in the house of Hashem."
- Specific translation choices: `בָּרוּךְ` = "You, Hashem, are the Source of everything"; `קָדוֹשׁ` = "You, Hashem, are separate and removed from this physical world"; `שֵׁם` = "the impact and presence of Hashem in the world."
- Ashkenazic transliteration is used throughout the PDF.
- A glossary at the back of the siddur covers Hebrew terms left untranslated inline.

These properties drive concrete design decisions: italic spans are first-class in the data model; the onboarding flow includes a translation philosophy screen; the same content is reachable from Settings for returning users.

## 4. Architecture & module shape

### 4.1 Top-level layout

```
src/
  siddur/                                NEW — replaces src/screens/ShacharitScrollScreen.tsx
    SiddurScrollScreen.tsx                  generalized scroll; one component drives all 5 karaoke cards
    LearnScreen.tsx                         non-karaoke reading mode for 12 essay appendices + glossary
    EssayScreen.tsx                         single essay view; opened from LearnScreen or via cross-link
    components/
      PrayerBlock.tsx                       moved from src/components/shacharit/, commentary coupling removed
      PairRow.tsx                           moved as-is
      LineRow.tsx                           moved as-is
      WordPair.tsx                          moved as-is
      Halo.tsx                              moved as-is
      ExpandablePanel.tsx                   kept as shared primitive
      FaqPanel.tsx                          NEW — wraps ExpandablePanel for textBlocks[].kind === 'faq' | 'callout' | 'instant_insight'
      MinyanRevealBlock.tsx                 NEW — hidden-by-default block with reveal toggle
      LearnCrossLink.tsx                    NEW — inline "Related essay: <title>" affordance
      ItalicEnglishText.tsx                 NEW — renders Feigenbaum interpretive italic spans

  data/
    siddur/                              NEW — replaces src/data/bundled/shacharit/ and src/data/prayerOrders/
      index.ts                              dispatcher: getSiddurSection(cardId, sectionId) → SiddurSection
      cards.ts                              6-card registry
      shacharit/                            per-card folder
        index.ts                            lazy require() thunks for each section
        hashkamas_haboker.json
        hashkamas_haboker.translit.json
        birchos_hashachar.json
        ...
      birkat_hamazon/                       same structure
      mincha/
      maariv/
      tefillos/
      learn/                                essays + glossary (no karaoke)
        appendix_01_how_davening_works.json
        ...
        glossary.json

  store/
    siddurStore.ts                       NEW — replaces prayerStore; section-agnostic karaoke + advance state
    haloStore.ts                          KEPT
    settingsStore.ts                      KEPT — drives lane toggle, location, profile, minhag config
    footnoteStore.ts                      DELETED

  hooks/
    useAudioPlayer.ts                     KEPT as V2 scaffolding (encodes tuned 50ms poll + 85ms anticipation)
    useWordSync.ts                        KEPT as V2 scaffolding
    useSiddurProgress.ts                  RENAMED from usePrayerProgress

  theme/
    siddurTheme.ts                        RENAMED from shacharitTheme; palette + FONTS + TIMING unchanged

  lib/zmanim/                             KEPT — still feeds Home zmanim header

  navigation/
    AppNavigator.tsx                      UPDATED: new routes (SiddurScroll, Learn, Essay, TranslationPhilosophy)
```

### 4.2 Module boundaries

- `siddur/` knows how to render a `SiddurSection` (defined in `data/siddur/`). It does not import section content directly — only the `getSiddurSection` dispatcher.
- `data/siddur/` knows nothing about React; pure data with lazy-require thunks preserved from the existing pattern.
- `store/siddurStore` is the only mutator of karaoke advance state. `useWordSync` (V2) and the MVP tick loop both call into it through `setCurrentWordIndex(sectionId, wordIndex)` — same contract.
- `LearnScreen` / `EssayScreen` are isolated from karaoke entirely — different rendering, no halo, no advance.

### 4.3 Deleted at MVP

- `src/components/shacharit/FootnoteMarker.tsx`
- `src/components/shacharit/FootnotePanel.tsx`
- `src/store/footnoteStore.ts` + tests
- `src/data/bundled/shacharit/` (after content re-extraction lands)
- `src/data/prayerOrders/*.ts`
- `src/screens/ShacharitScrollScreen.tsx`
- `src/data/serviceRegistry.ts` (replaced by `data/siddur/cards.ts`)
- `scripts/extract-feigenbaum.mjs`, `port-sefaria-translit.mjs`, `anchor-commentary.mjs`, `verify-feigenbaum-coverage.mjs`, `feigenbaum-manifest.json`
- `commentary?: BundledCommentary[]` field on bundled JSON

### 4.4 Kept as load-bearing

- Karaoke tick loop (generalized from `prayerStore.advanceShacharit` to a section-agnostic equivalent on `siddurStore`).
- `Halo.tsx` + `haloStore` + crescendo/decrescendo state machine.
- `WordPair`, `LineRow`, `PairRow`, `PrayerBlock` (commentary coupling refactored out of `PrayerBlock`).
- Lane toggle (Hebrew / Translit / English settings).
- Theme tokens — `TIMING.HALO_CRESCENDO_AVG`, `HALO_DECRESCENDO_AVG`, `FONTS.serifBody`, `FONTS.serifBodyItalic`, palette.
- RTL handling, `hebrewUtils`, `pairWords`.
- `useAudioPlayer` + `useWordSync` preserved unchanged for V2. The `ANTICIPATION_OFFSET_MS = 85` constant and the 50ms poll cadence are tuned values that would be expensive to rediscover.

### 4.5 Migration order

To keep the app runnable during the work:

1. Add new modules empty/stub-only (`data/siddur/cards.ts`, `siddurStore`, `SiddurScrollScreen` shell).
2. Move/rename primitives (`Halo`, `WordPair`, `LineRow`, `PairRow`, `ExpandablePanel`, `Theme`) into `siddur/components/`.
3. Wire `SiddurScrollScreen` to the new store against a tiny seeded section so the app boots.
4. Replace navigation (`AppNavigator`) — gate Shacharit card behind a feature flag during migration.
5. Run new content pipeline against PDF; land content card by card.
6. Flip the feature flag; delete legacy code.

## 5. Data model

### 5.1 Card and section registries

```ts
type CardId = 'shacharit' | 'birkat_hamazon' | 'mincha' | 'maariv' | 'tefillos' | 'learn';

interface SiddurCard {
  id: CardId;
  title: { he: string; en: string };
  kind: 'karaoke' | 'reading';        // first 5 = karaoke; learn = reading
  sections: SectionRef[];              // ordered TOC, matches Feigenbaum print order
}

interface SectionRef {
  id: string;                          // 'hashkamas_haboker', 'pesukei_dzimrah', etc.
  title: { he: string; en: string };
  pagePdf: number;                     // PDF page where this section starts
}
```

### 5.2 Section shape

```ts
interface SiddurSection {
  id: string;
  cardId: CardId;
  title: { he: string; en: string };
  source: 'feigenbaum';
  sourcePages: [number, number];       // verification + future "see in print" feature

  blocks: SiddurBlock[];               // heterogeneous content in print order
  conditionalRule?: ConditionalRule;   // section-level conditional (Hallel, Mussaf for RC, etc.)
  conditionalTags?: ConditionalTag[];  // block-level conditionals; MVP ignores
}
```

### 5.3 Block union

```ts
type SiddurBlock =
  | PrayerBlock          // karaoke target: Hebrew lines + paired English + optional translit
  | HeadingBlock         // section / subsection heading
  | RubricBlock          // siddur's own instruction text ("On Rosh Chodesh, add...")
  | FaqBlock             // FAQ / Instant Insight / callout (expandable)
  | MinyanOnlyBlock      // hidden-by-default reveal block
  | LearnCrossLinkBlock  // inline "Related essay: X" affordance
  | VariantBlock         // alternation (V'sen Tal U'Matar vs V'sen Bracha, etc.)
  | OmerCountBlock;      // sefiras haomer placeholder (V2 turns it dynamic)
```

### 5.4 Karaoke unit

```ts
interface PrayerBlock {
  kind: 'prayer';
  he: HebrewLine[];
  en: EnglishParagraph[];
  translit?: TranslitLine[];
  wordIndexStart: number;              // global karaoke index range for this block
  wordIndexEnd: number;
}

interface HebrewLine {
  lineIndex: number;
  words: { globalIndex: number; text: string }[];
}

interface EnglishParagraph {
  spans: { text: string; style?: 'italic' | 'bold' }[];   // italic = Feigenbaum interpretive
  anchorLine?: number;                                     // which Hebrew line this corresponds to
}

interface TranslitLine {
  lineIndex: number;
  words: { text: string | null }[];    // null = gap (no translit for this word yet)
  source: 'sefaria-ported' | 'feigenbaum-pdf' | 'missing';
}
```

### 5.5 Other block kinds

```ts
interface HeadingBlock {
  kind: 'heading' | 'subsection';
  he?: string;
  en: string;
}

interface RubricBlock {
  kind: 'rubric';
  text: { he?: string; en: string };
  italic: boolean;                     // Feigenbaum prints rubrics italicized
}

interface FaqBlock {
  kind: 'faq' | 'callout' | 'instant_insight';
  title?: string;
  body: EnglishParagraph[];
}

interface MinyanOnlyBlock {
  kind: 'minyan_only';
  reason: 'kaddish' | 'barchu' | 'kedushah' | 'birkas_cohanim' | 'krias_hatorah' | 'other';
  he: HebrewLine[];                    // NOTE: no globalIndex — excluded from karaoke sequence
  en: EnglishParagraph[];
  translit?: TranslitLine[];
}

interface LearnCrossLinkBlock {
  kind: 'learn_link';
  essayId: string;
  promptText?: string;
}

interface VariantBlock {
  kind: 'variant';
  primaryVariantIndex: number;         // MVP: only this variant's words get globalIndex (karaoke target).
                                       // Other variants render visibly with their rubrics but are not in the karaoke sequence.
                                       // V2: ignored; rule evaluation picks the active variant.
  variants: Array<{
    label: string;                     // "Winter (from Shemini Atzeres)", "Summer (from Pesach)"
    rule: ConditionalRule;
    he?: HebrewLine[];                 // one variant might be empty (Ashkenaz summer Morid HaTal)
    en?: EnglishParagraph[];
    translit?: TranslitLine[];
  }>;
}

interface OmerCountBlock {
  kind: 'omer_count';
  he: HebrewLine[];                    // MVP renders static text per print; V2 computes dynamically
  en: EnglishParagraph[];
}
```

### 5.6 Learn essay shape

```ts
interface LearnEssay {
  id: string;                          // 'appendix_01_how_davening_works', 'personal_note_teens', 'glossary', etc.
  essayKind: 'appendix' | 'personal_note' | 'introduction' | 'glossary';
  title: { he?: string; en: string };
  source: 'feigenbaum';
  sourcePages: [number, number];
  body: EnglishParagraph[];
  anchoredFrom: { cardId: CardId; sectionId: string }[];   // reverse index — populated by extractor
}
```

### 5.7 Conditional rules

```ts
type ConditionalRule =
  | { type: 'skip_on'; days: SpecialDay[] }
  | { type: 'rosh_chodesh_only' }
  | { type: 'chanukah_only' }
  | { type: 'purim_only' }
  | { type: 'chol_hamoed_only'; festival?: 'pesach' | 'sukkos' }
  | { type: 'sefirah_only' }
  | { type: 'motzaei_shabbos_only' }
  | { type: 'fast_day_only' }
  | { type: 'days_of_week_only'; days: ('mon' | 'thu')[] }
  | { type: 'date_window'; from: HebrewDateRef; to: HebrewDateRef }
  | { type: 'amidah_winter' }
  | { type: 'amidah_summer' }
  | { type: 'amidah_geshem_only' }
  | { type: 'hallel'; variant: 'full' | 'half' }
  | { type: 'community_minhag'; key: string };

type SpecialDay =
  | 'rosh_chodesh' | 'chanukah' | 'purim' | 'shushan_purim'
  | 'chol_hamoed_pesach' | 'chol_hamoed_sukkos' | 'isru_chag'
  | 'tu_bav' | 'tu_bshvat' | 'pesach_sheni' | 'lag_bomer'
  | 'erev_rh' | 'erev_yk' | 'erev_pesach' | 'erev_shavuos'
  | 'aseres_yemei_teshuva' | 'rest_of_tishrei_after_yk'
  | 'tisha_bav_mincha' | 'day_of_bris_in_shul';

type HebrewDateRef =
  | { kind: 'month_day'; month: HebrewMonth; day: number }
  | { kind: 'before_holiday'; holiday: SpecialDay; daysBefore: number }
  | { kind: 'first_day_of'; holiday: SpecialDay };

interface ConditionalTag {
  blockIndex: number;
  rule: ConditionalRule;
}
```

### 5.8 Design choices, called out

1. **Heterogeneous `blocks[]` in print order** — adding a new block kind is additive.
2. **Italic spans are first-class** — preserves Feigenbaum's translation philosophy at the data layer.
3. **Global word index is scoped per section, and only `PrayerBlock` words get one** — minyan-only words don't advance karaoke.
4. **Conditional tags are metadata, not data branching** — MVP ignores them entirely (print-faithful). Shape stays stable across MVP→V2.
5. **Translit gaps are explicit** — `null` per word, with `source` on the line.
6. **`sourcePages` everywhere** — enables coverage verification and a future "open this in the printed siddur" affordance.
7. **`LearnEssay.anchoredFrom` is reverse-indexed by the extractor** — bidirectional cross-linking.
8. **`VariantBlock` captures alternation** — not just hide/show, but which-of-two for Mashiv HaRuach and V'sen Tal U'Matar.

## 6. Content pipeline

### 6.1 Eleven sequential stages under `scripts/siddur/`

```
01_extract_raw.mjs         PDF → raw HTML (pdftohtml -i -noframes -fontfullname) + raw text (pdftotext -layout)
02_detect_sections.mjs     parse raw, produce section_manifest.json
03_classify_blocks.mjs     per section, classify text runs into block kinds (rules + heuristics)
04_extract_hebrew.mjs      tokenize Hebrew lines + words, assign globalIndex (PrayerBlock only)
05_extract_english.mjs     parse English paragraphs from HTML, preserving italic spans
06_port_translit.mjs       port existing Sefaria-derived translit to new Hebrew structure
07_detect_minyan.mjs       convert qualifying PrayerBlocks → MinyanOnlyBlock; strip from karaoke sequence
08_tag_conditional.mjs     attach ConditionalTag entries per rules/conditional.json
09_anchor_learn.mjs        bidirectional anchoring of essays ↔ sections
10_assemble.mjs            merge intermediates → final SiddurSection JSON in src/data/siddur/
11_verify.mjs              coverage / translit gap / italic audit / unanchored essay reports
```

### 6.2 Curated rules layer

```
content/feigenbaum-2026/
  config.json                pipeline-wide config (PDF path, output dirs)
  rules/
    sections.json            TOC: sectionId → cardId, pageStart, pageEnd, title
    minyan.json              MinyanOnlyBlock boundaries: per sectionId, [{startLine, endLine, reason}]
    conditional.json         ConditionalTag insertions: per sectionId, [{blockIndex, rule}]
    learn_anchors.json       essayId → [{cardId, sectionId, position?}]
    italic_overrides.json    italic span corrections (fallback when pdftohtml misses or hallucinates)
  raw/                       stage 01 output
  intermediate/              stages 02–09 output (per-section JSON)
  reports/                   stage 11 output (markdown audits)
```

### 6.3 Italic detection

`pdftohtml -i -noframes -fontfullname` emits `<i>` tags when font analysis detects italics. This is how we capture Feigenbaum's interpretive italic additions. `italic_overrides.json` is the fallback for any miss/hallucination.

### 6.4 Idempotency

Every stage reads from disk, writes to disk. Re-running any stage is safe; re-running the whole pipeline rebuilds everything from the PDF. The rules files in `content/feigenbaum-2026/rules/` are the only hand-edited inputs.

### 6.5 Parallelization across orchestrated agents

- Stages 01–02 are sequential (each needs the previous).
- Stages 03–08 are *per-section* — once stage 02 produces the section manifest, agents fan out one section at a time. ~30 sections × 6 stages each = many parallel work units.
- Stage 09 (Learn anchoring) runs after the fanout (needs all essays + all sections).
- Stage 10 (assemble) is mechanical aggregation.
- Stage 11 (verify) reads final output, produces reports — fully parallel per check.

A natural multi-agent decomposition: **one supervisor + N section-extraction agents working stages 03–08 against a section each + a verification agent for stage 11**. The supervisor owns the rules files and the manifest.

### 6.6 Integrity guarantees

1. **Hebrew coverage** — assembled output's Hebrew, concatenated, must character-match the PDF's Hebrew slice for that section, ignoring whitespace. Anything that diverges fails verify.
2. **Word-index continuity** — across all `PrayerBlock` blocks in a section, `globalIndex` values are contiguous from 0, strictly increasing, no duplicates.

### 6.7 What MVP pipeline does not do

- Does not extract or anchor V2 commentary (the audio-driven popover layer). That's a future stage 12 pass.

## 7. Navigation shell

### 7.1 Route structure

```
RootStack (AppNavigator.tsx)
  Onboarding (gate: !hasCompletedOnboarding)
    Welcome
    SkillTier
    LocationPermission
    TranslationPhilosophy        NEW — sources from PDF pp. XVI-XVII

  Main (gate: hasCompletedOnboarding)
    Home                          6 cards + zmanim header
    SiddurScroll                  params: { cardId, sectionId?, wordIndex? }
    Learn                         essay TOC + glossary entry
    Essay                         params: { essayId, returnTo? }
    Settings
    About
```

### 7.2 Home

- Header: greeting + zmanim row (Sunrise / Latest Shacharit / Mincha / Sunset) — current `ZmanimHeader` reused.
- 6-card grid, 2 columns × 3 rows, all cards live:
  ```
  Shacharit       | Birkat Hamazon
  Mincha          | Maariv
  Tefillos        | Learn
  ```
- Each card shows Hebrew title (large), English title (smaller below), optional "Last opened: <section name>" line.
- Tap karaoke card → push `SiddurScroll` with `{ cardId }`. Tap Learn → push `LearnScreen`.

### 7.3 SiddurScrollScreen

One component renders all five karaoke cards. The card determines which `SiddurSection[]` to load via `getSiddurSectionsForCard(cardId)`.

- Sections stitched into a continuous scroll **with section subheaders rendered as standalone blocks between sections** — the pattern from commit `694d842`, extended to all cards.
- Header has three controls: back to Home (left), section jump-to sheet (center, sticky on scroll, shows current section name), lane toggle (right).
- Section jump-to sheet: bottom sheet listing every section in the card. Tap → scrolls to that section's first karaoke word.
- `LearnCrossLinkBlock` blocks render as inline `LearnCrossLink` pills. Tap pushes `Essay` with `{ essayId, returnTo: { cardId, sectionId, wordIndex } }`.
- `MinyanOnlyBlock` renders via `MinyanRevealBlock` — collapsed by default, plain text when revealed, no halo, no advance.
- `FaqBlock` renders via `FaqPanel` (wraps `ExpandablePanel`).
- `EnglishParagraph.spans` rendered via `ItalicEnglishText` — italic spans use `serifBodyItalic`.

### 7.4 LearnScreen

- Top: header "Learn" + back to Home.
- Body, four sections:
  1. **Essays from the siddur** — 12 numbered appendices in print order. Each row: title + one-line teaser.
  2. **From Rabbi Feigenbaum** — the two Personal Notes (pp. 239–240) and the front-matter Introductions for Parents/Mechanchim/Mechanchos and for Teens (pp. XIV, XVIII). Same `LearnEssay` shape, distinguished by an `essayKind: 'appendix' | 'personal_note' | 'introduction'` discriminator added to `LearnEssay`.
  3. **Glossary** — single row opens a glossary view.
  4. **Recently relevant** (when present) — essays anchored to recently-opened sections.

### 7.5 EssayScreen

- Header: essay title + back (returns to `LearnScreen` or to originating scroll if `returnTo` is set).
- Body: `LearnEssay.body` rendered as `ItalicEnglishText`-supporting paragraphs. No karaoke, no lane toggle.
- Bottom: **"While davening, this is relevant during:"** — short list of `LearnEssay.anchoredFrom` entries, each tappable to push `SiddurScroll` with that target.

### 7.6 Cross-link UX

- Forward (scroll → essay): `LearnCrossLinkBlock` renders as a parchment-tinted pill inline at print position. Tap pushes `Essay` with `returnTo`. Closing the essay returns to the same scroll position.
- Reverse (essay → scroll): every essay's bottom section lists every place it's relevant.

### 7.7 Onboarding addition — TranslationPhilosophy

Final screen of onboarding, before exit to Main. Content sourced from PDF pp. XVI-XVII:

> Rabbi Feigenbaum's translation isn't literal — it aims to convey the essence of each tefillah and help you have a real conversation with Hashem. You'll see *italicized words* in the English; those are additions to make the meaning clearer, not part of the literal Hebrew.
>
> Example: "אַשְׁרֵי יוֹשְׁבֵי בֵיתֶךָ — Happy are those who *(wherever they are)* are living in the house of Hashem."
>
> A few specific word choices to know:
> - **בָּרוּךְ** — *You, Hashem, are the Source of everything*
> - **קָדוֹשׁ** — *You, Hashem, are separate and removed from this physical world*
> - **שֵׁם** — *the impact and presence of Hashem in the world*
>
> A full glossary is available under **Learn**.

CTA: "Got it" → completes onboarding.

### 7.8 Auto-migration

Existing TestFlight users with `hasCompletedOnboarding: true` skip onboarding entirely, including the new screen. The same `TranslationPhilosophy` content is reachable via **Settings → About this translation** (new row).

### 7.9 Settings additions

- New row: "About this translation" → opens a screen rendering the same content as the `TranslationPhilosophy` onboarding step (shared component).
- All existing rows preserved (lane visibility, karaoke speed, skill tier, location).

## 8. Scroll behavior

### 8.1 Render dispatcher

`SiddurScrollScreen` iterates `section.blocks[]` and switches on `block.kind`:

| `block.kind` | Renderer | Karaoke target? |
|---|---|---|
| `prayer` | `PrayerBlock` (refactored) | Yes |
| `heading` | inline heading text | No |
| `subsection` | section subheader (standalone block, per `694d842`) | No |
| `rubric` | italic instruction text | No |
| `faq` | `FaqPanel` (collapsed by default) | No |
| `callout` | `FaqPanel` with `variant: 'callout'` | No |
| `instant_insight` | `FaqPanel` with `variant: 'insight'` | No |
| `minyan_only` | `MinyanRevealBlock` (collapsed by default) | No |
| `learn_link` | `LearnCrossLink` pill | No |
| `variant` | all variants rendered with labels (MVP); V2 picks one | Only `primaryVariantIndex`'s words at MVP; V2 picks by rule |
| `omer_count` | static text at MVP, dynamic at V2 | No |

A `SiddurSection`'s blocks are flattened across the entire card so the user scrolls continuously: `[…section A blocks…, section-subheader, …section B blocks…, section-subheader, …]`.

### 8.2 Karaoke advance

- Tick loop is the only advance source at MVP. (V2: `useWordSync` becomes the primary advance source when audio plays; tick loop becomes fallback.)
- Advance unit: global word index within current section. Crossing section boundaries: once `currentWordIndex` exceeds last karaoke word of current section, store flips to next section's index space, starting at 0.
- Only `PrayerBlock` words have global indices. `MinyanOnlyBlock` words are skipped by index continuity.
- Halo state machine unchanged: `active` (crescendo over `TIMING.HALO_CRESCENDO_AVG / speed`) → `fading` (decrescendo over `TIMING.HALO_DECRESCENDO_AVG / speed`). Speed from `settingsStore.karaokeSpeed`.
- Halos viewport-lazy — existing pattern preserved.

### 8.3 Lane toggle

- Three independent booleans on settings: `showHebrew`, `showTranslit`, `showEnglish`. Persisted as `@displayLanes`.
- `PairRow` reads these flags and conditionally renders each lane.
- When `showTranslit` is on and a word's translit is `null`, the renderer shows a subtle underscore placeholder. Press-and-hold reveals "translit not yet available."
- Italic spans use `FONTS.serifBodyItalic` (already in theme).

### 8.4 MinyanRevealBlock

- Collapsed state: horizontal rule + italic line "*Recited only with a minyan — tap to view*" with chevron-down icon. ~36pt tall.
- Expanded state: He/En/Translit rendered as plain text via `PairRow` with `disableKaraoke: true`. No halo. Chevron flips up.
- Per-block local state (not in `siddurStore`); closing the section resets it.
- Visual treatment muted vs. surrounding prayer — desaturated ink, no parchment highlight.

### 8.5 FaqPanel

- Collapsed: single-line title chip with icon (❓ for `faq`, 💡 for `instant_insight`, no icon for `callout`).
- Expanded: body renders as `EnglishParagraph[]` with italic span support.
- Per-block local state. Multiple FAQs can be open simultaneously (intentional regression from old `footnoteStore` "one at a time" behavior).

### 8.6 LearnCrossLink pill

- Inline block, ~52pt tall, parchment-tinted, chevron-right icon, label "*Read more:* **<essay title>**".
- Tap pushes `Essay` with `{ essayId, returnTo: { cardId, sectionId, wordIndex } }`.
- On essay close, scroll restoration uses `wordIndex` to find the word's onscreen Y position.

### 8.7 Section jump-to sheet

- Sticky header button shows current section name (updates as user scrolls past section boundaries).
- Tap opens bottom sheet with full TOC of current card. Each row: Hebrew title + English title.
- Tap row → scrolls to that section's first karaoke word (or `wordIndex` of prior progress if present).

### 8.8 Performance contract

- `PrayerBlock`, `PairRow`, `LineRow`, `WordPair` `React.memo`'d with stable callbacks.
- Halos viewport-lazy.
- Section content via lazy `require()` thunks — never parse a card's JSON until user opens that card. Within a card, all sections load on open (continuous scroll); thunk pattern preserved for individual section files.
- Italic spans don't introduce extra views per word — inline `<Text>` children inside paragraph `<Text>`, RN's native flow.

### 8.9 Scroll position persistence

- `useSiddurProgress` (renamed from `usePrayerProgress`) writes `{ cardId, sectionId, wordIndex }` per card on a debounce.
- Home cards show "Last opened: <section name>" sourced from this.
- Re-opening a card seeks scroll to that section + wordIndex using the same restoration primitive as cross-link returns.

## 9. Calendar & conditional tagging (V2 hooks at MVP)

### 9.1 MVP rendering — print-faithful

- `ConditionalTag` entries are *present* on section JSON but renderer ignores them — every block renders.
- `VariantBlock` renders as a single group with all variants visible, each labeled with its rubric.
- Sections with `section.conditionalRule` (Hallel, Mussaf for RC, etc.) appear in Tefillos card's TOC unconditionally.

### 9.2 V2 rendering — same data, rules consulted

New module `src/lib/calendar/hebrewDate.ts`:

```ts
interface CalendarContext {
  today: HebrewDate;
  isRoshChodesh: boolean;
  isChanukah: boolean;
  isPurim: boolean;
  isCholHamoed: 'pesach' | 'sukkos' | null;
  isFastDay: boolean;
  omerDay: number | null;
  amidahSeason: 'winter' | 'summer';
  amidahGeshem: boolean;
  specialDays: SpecialDay[];
  minhag: { sayYomHaatzmaut: boolean; /* etc */ };
}
function evaluateRule(rule: ConditionalRule, ctx: CalendarContext): boolean;
```

- Render dispatcher checks `evaluateRule(tag.rule, ctx)` per block and skips when false.
- `VariantBlock` picks the variant whose rule passes (exactly one expected; falls back to last variant or shows everything if zero pass).
- Tefillos card TOC filters sections by `section.conditionalRule` evaluation.
- Settings includes a date picker override for "today" — useful for testing and planning ahead.

### 9.3 V2 implementation note

Try `@hebcal/core` again first — the previous block was on transitive `@hebcal/noaa` using top-level `await` in Hermes. `@hebcal/core` itself may load fine without `noaa`; verify before rolling our own. If still blocked, implement a minimal in-house engine using `lib/zmanim/sunMath.ts` for sunset boundaries.

### 9.4 Community-minhag config

A small `settingsStore.minhag` object: `{ sayYomHaatzmaut, sayYomYerushalayim, brisInShul, ... }`. MVP doesn't expose UI; defaults conservative ("yes, say the additions"). V2 adds Settings → Minhag screen.

## 10. Testing strategy

### 10.1 Layer 1 — Data invariants

`src/data/siddur/__tests__/invariants.test.ts` runs against every assembled `SiddurSection` JSON:

- Word-index continuity per section (contiguous from 0, strictly increasing, no duplicates; `wordIndexStart`/`wordIndexEnd` match actual range).
- Minyan-only exclusion (no `globalIndex` on minyan words).
- Translit alignment (`translit.words.length === hebrewLine.words.length` when present).
- Conditional tag references valid (`blockIndex` points to real block).
- Learn essay cross-references resolve.
- `VariantBlock` structure (no fully empty variants).
- `sourcePages` bounds (1..296, start <= end).

### 10.2 Layer 2 — Pipeline tests

`scripts/siddur/__tests__/`:

- Per-stage tests with PDF fixtures (4-page slice committed to `__tests__/fixtures/`).
- Golden JSON output per stage in `__tests__/golden/`.
- End-to-end test on fixture: run all 11 stages, assert final output matches golden.
- Italic detection regression test (fixture with known italics).
- Translit porting test (old + new Hebrew fixture).

### 10.3 Layer 3 — Component tests

`src/siddur/components/__tests__/`:

- `SiddurScrollScreen` dispatch test (one of each block kind, assert correct renderer).
- `PrayerBlock` lane toggle matrix (7 non-empty combinations).
- `MinyanRevealBlock` collapse/expand behavior, no halo mounted when expanded.
- `FaqPanel` collapse/expand, italic spans, multiple panels open simultaneously.
- `LearnCrossLink` navigation payload.
- `ItalicEnglishText` mixed spans, edge cases.
- `VariantBlock` MVP behavior (all variants render with labels).

### 10.4 Layer 4 — Stores + hooks

- `siddurStore` karaoke advance across section boundaries, past minyan-only words.
- `useSiddurProgress` persistence (debounced write, replay on mount).
- Cross-link return (push Essay, pop, scroll position restored).
- `useAudioPlayer` + `useWordSync` sanity test (still importable, `ANTICIPATION_OFFSET_MS = 85` intact).
- Settings persistence round-trip.

### 10.5 Layer 5 — Manual QA

`.claude/commands/siddur-qa.md` extends the existing `/shacharit-qa`:

**Phase A — automated:** `tsc --noEmit`, `npm run lint`, `npm test`, `scripts/siddur/11_verify.mjs`.

**Phase B — diff-aware code review** against `main`: kept primitives untouched? Audio scaffolding intact? No commentary regressions?

**Phase C — manual on simulator:** visit each of 6 cards, scroll each karaoke card entire length, verify lane toggle, cross-link round-trip, minyan reveal, italic English visible distinctly, FaqPanel expand, onboarding flow with new TranslationPhilosophy screen, Settings → About this translation, TestFlight auto-migration.

### 10.6 Pre-merge gates

| Gate | Source |
|---|---|
| Typecheck clean | `npx tsc --noEmit` |
| Lint clean | `npm run lint` |
| All unit + integration tests pass | `npm test` |
| Hebrew coverage 100% vs PDF for changed sections | `scripts/siddur/11_verify.mjs` |
| No regression in italic span count | `italic_audit.md` diff |
| No new translit gaps | `translit_gaps.md` diff |
| Manual QA checklist signed off | `/siddur-qa` Phase C |

### 10.7 Not tested at MVP

- V2 calendar rule evaluation — rules encoded, no engine consumes them. Layer 1 invariants prove rules are present and well-formed.
- V2 audio sync timing — hooks exist as scaffolding; behavior not driven at MVP.
- Performance benchmarks beyond existing virtualization patterns — keeping primitives that already perform well.

## 11. Open items for the planning phase

These are deliberately deferred to the implementation plan (next step), not unresolved questions:

- Multi-agent orchestration: detailed task decomposition, supervisor/worker prompt design, intermediate-state handoff protocol for the per-section extraction fanout.
- Exact schedule / sequencing of the migration steps in section 4.5 against the implementation calendar.
- Concrete `rules/*.json` authoring workflow — what part is hand-edited vs. seeded by automated detection.
- Test-coverage thresholds and CI integration.

## 12. Risks

| Risk | Mitigation |
|---|---|
| `pdftohtml` italic detection is unreliable on some pages | `italic_overrides.json` rules layer as fallback; italic audit report flags zero-italic sections for manual review |
| Hebrew tokenization edge cases (niqqud, te'amim, joined words) | Coverage report fails build on character mismatch; tokenizer tested against known fixtures |
| Translit porting misses many words because old Hebrew differs subtly from new PDF Hebrew | Gaps explicit in data; users see placeholder; V2 audio recordings can drive a refresh |
| Continuous scroll perf regression with multi-section flattening | Existing virtualization preserved; section content stays lazy-required; profile before/after on a long card |
| Onboarding skip leaves new translation philosophy invisible to migrated users | Settings → About this translation row makes it reachable; consider one-time bottom-sheet announcement on first launch of new version (deferred to plan) |
| New `siddurStore` advance contract subtly different from `prayerStore`, breaking karaoke feel | Layer 4 store tests cover advance behavior; manual QA Phase C verifies feel |
| Re-extraction loses hand-tuned bits of current Shacharit content | Greenfield is the chosen approach (explicit decision); fidelity to new PDF is the new bar |

## 13. Out of scope (explicitly)

- Shabbos / Yom Tov siddur content (Feigenbaum weekday only).
- Birkat Hamazon for Sheva Brachos / brit milah variants.
- Sefardic nusach.
- Selichos / High Holiday machzor.
- Tehillim app integration.
- Voice-controlled advance.
- Social / sharing features.
- Subscription / monetization plumbing.
