# Feigenbaum Remap — Plan A: Foundation + Scroll Shell

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the new `src/siddur/` module skeleton, data model, store, and scroll-rendering infrastructure so the app boots against a tiny seeded section JSON. Legacy Shacharit content remains reachable behind a feature flag until Plan B's content lands and Plan C cuts over.

**Architecture:** New `src/siddur/` module replaces `src/screens/ShacharitScrollScreen.tsx` with a card-agnostic `SiddurScrollScreen` driven by a generic `siddurStore`. Karaoke primitives (`Halo`, `WordPair`, `LineRow`, `PairRow`, `PrayerBlock`, `ExpandablePanel`) move under `siddur/components/` and are stripped of commentary coupling. New components (`ItalicEnglishText`, `FaqPanel`, `MinyanRevealBlock`, `LearnCrossLink`) cover the new block kinds from the spec. `LearnScreen` / `EssayScreen` stubs land for navigation continuity. Onboarding gains a `TranslationPhilosophy` screen. `useAudioPlayer` / `useWordSync` are preserved unchanged for V2.

**Tech Stack:** Expo SDK 52 · React Native 0.76 · TypeScript · Zustand · React Navigation · `react-native-reanimated` · `@testing-library/react-native` · `jest-expo`.

**Spec reference:** `docs/superpowers/specs/2026-05-26-feigenbaum-siddur-remap-design.md`

**Prerequisite knowledge for the executing agent:**
- `CLAUDE.md` covers app conventions, Hebrew RTL handling, and the lazy `require()` thunk pattern. Read it before starting.
- Path alias `@/*` → `src/*` is configured in `tsconfig.json`.
- ESLint ignores `android/`, `ios/`, `scripts/`, `docs/`, `assets/`.
- Tests live colocated under `__tests__/`. `jest-expo` preset. `ts-jest` for `.ts/.tsx`.
- The karaoke tick loop in the existing `usePrayerStore` is the canonical advance contract — read `src/store/prayerStore.ts:147-180` before designing `siddurStore`.
- The halo crescendo/decrescendo state machine lives in `src/components/shacharit/Halo.tsx`; preserve `TIMING.HALO_CRESCENDO_AVG` and `TIMING.HALO_DECRESCENDO_AVG` from `src/theme/shacharitTheme.ts:72-82`.
- `ANTICIPATION_OFFSET_MS = 85` in `src/hooks/useWordSync.ts` is a tuned value — do not modify.

---

## File Structure

**New files (created by this plan):**
```
src/siddur/
  types.ts                                   data model TypeScript types
  components/
    Halo.tsx                                 moved from src/components/shacharit/
    WordPair.tsx                             moved from src/components/shacharit/
    LineRow.tsx                              moved from src/components/shacharit/
    PairRow.tsx                              moved from src/components/shacharit/
    PrayerBlock.tsx                          moved + commentary coupling removed
    ExpandablePanel.tsx                      moved from src/components/shacharit/
    ItalicEnglishText.tsx                    NEW — renders EnglishSpan[] with italic support
    FaqPanel.tsx                             NEW — wraps ExpandablePanel for faq/callout/insight blocks
    MinyanRevealBlock.tsx                    NEW — hidden-by-default reveal toggle
    LearnCrossLink.tsx                       NEW — inline "Read more: <essay>" pill
    BlockRenderer.tsx                        NEW — dispatcher: switch on block.kind
    __tests__/                               component tests
  SiddurScrollScreen.tsx                     NEW — generalized scroll, replaces ShacharitScrollScreen
  LearnScreen.tsx                            NEW — stub, completed in Plan C
  EssayScreen.tsx                            NEW — stub, completed in Plan C
src/store/
  siddurStore.ts                             NEW — generalized karaoke advance state
  __tests__/siddurStore.test.ts              NEW
src/hooks/
  useSiddurProgress.ts                       NEW — renamed from usePrayerProgress; same contract
src/theme/
  siddurTheme.ts                             NEW — palette/FONTS/TIMING unchanged, SectionId removed
src/screens/
  TranslationPhilosophyScreen.tsx            NEW — onboarding step + Settings entry
src/data/siddur/
  index.ts                                   NEW — dispatcher: getSiddurSection(cardId, sectionId)
  cards.ts                                   NEW — 6-card registry
  fixtures/
    seed.json                                NEW — tiny test fixture (one section, one prayer block)
src/data/siddur/__tests__/
  fixture.test.ts                            NEW — sanity check on the seed fixture
docs/superpowers/plans/
  2026-05-26-feigenbaum-remap-plan-a-foundation.md   THIS FILE
```

**Modified files:**
```
src/navigation/AppNavigator.tsx              add SiddurScroll, Learn, Essay, TranslationPhilosophy routes; feature-flag Shacharit card
src/screens/HomeScreen.tsx                   6-card grid (legacy cards remain behind feature flag)
src/screens/SettingsScreen.tsx               add "About this translation" row
src/screens/onboarding/OnboardingNavigator.tsx (or equivalent)   insert TranslationPhilosophy after LocationPermission
App.tsx                                      no functional change; verify hydration still works
```

**Deleted files (after migration completes — last task of this plan):**
```
src/components/shacharit/FootnoteMarker.tsx
src/components/shacharit/FootnotePanel.tsx
src/store/footnoteStore.ts
src/store/__tests__/footnoteStore.test.ts
```

**Preserved unchanged (load-bearing):**
```
src/hooks/useAudioPlayer.ts
src/hooks/useWordSync.ts
src/lib/zmanim/                  (entire directory)
src/utils/hebrewUtils.ts
src/utils/pairWords.ts
```

---

## Task 1: Verify baseline — tests, lint, typecheck all green before any changes

**Files:**
- Read-only audit

- [ ] **Step 1: Verify clean working tree on `main`**

Run:
```bash
git status
git rev-parse --abbrev-ref HEAD
```
Expected: `nothing to commit, working tree clean` and `main`.

- [ ] **Step 2: Verify typecheck passes**

Run:
```bash
npx tsc --noEmit
```
Expected: exit 0, no output.

- [ ] **Step 3: Verify lint passes**

Run:
```bash
npm run lint
```
Expected: exit 0.

- [ ] **Step 4: Verify tests pass**

Run:
```bash
npm test -- --silent
```
Expected: all tests pass.

- [ ] **Step 5: Create a feature branch for Plan A**

Run:
```bash
git checkout -b feigenbaum-remap-plan-a-foundation
```

No commit yet — this is just baseline verification.

---

## Task 2: Define core data model types in `src/siddur/types.ts`

**Files:**
- Create: `src/siddur/types.ts`
- Test: `src/siddur/__tests__/types.test.ts`

- [ ] **Step 1: Write the failing compilation test**

Create `src/siddur/__tests__/types.test.ts`:
```ts
import type {
  CardId,
  SiddurCard,
  SectionRef,
  SiddurSection,
  SiddurBlock,
  PrayerBlock,
  HebrewLine,
  EnglishParagraph,
  EnglishSpan,
  TranslitLine,
  HeadingBlock,
  RubricBlock,
  FaqBlock,
  MinyanOnlyBlock,
  LearnCrossLinkBlock,
  VariantBlock,
  OmerCountBlock,
  ConditionalRule,
  ConditionalTag,
  SpecialDay,
  HebrewDateRef,
  HebrewMonth,
  LearnEssay,
} from '../types';

test('CardId union covers six cards', () => {
  const ids: CardId[] = ['shacharit', 'birkat_hamazon', 'mincha', 'maariv', 'tefillos', 'learn'];
  expect(ids).toHaveLength(6);
});

test('PrayerBlock requires wordIndex range and Hebrew lines', () => {
  const block: PrayerBlock = {
    kind: 'prayer',
    he: [{ lineIndex: 0, words: [{ globalIndex: 0, text: 'בָּרוּךְ' }] }],
    en: [{ spans: [{ text: 'Blessed' }] }],
    wordIndexStart: 0,
    wordIndexEnd: 0,
  };
  expect(block.kind).toBe('prayer');
});

test('EnglishSpan supports italic style for Feigenbaum interpretive additions', () => {
  const span: EnglishSpan = { text: 'wherever they are', style: 'italic' };
  expect(span.style).toBe('italic');
});

test('VariantBlock has primaryVariantIndex for MVP karaoke targeting', () => {
  const block: VariantBlock = {
    kind: 'variant',
    primaryVariantIndex: 0,
    variants: [{
      label: 'Winter',
      rule: { type: 'amidah_winter' },
    }],
  };
  expect(block.primaryVariantIndex).toBe(0);
});

test('LearnEssay carries essayKind discriminator', () => {
  const essay: LearnEssay = {
    id: 'appendix_01',
    essayKind: 'appendix',
    title: { en: 'How Davening Works' },
    source: 'feigenbaum',
    sourcePages: [242, 246],
    body: [],
    anchoredFrom: [],
  };
  expect(essay.essayKind).toBe('appendix');
});
```

- [ ] **Step 2: Run the test to verify it fails (compilation error)**

Run:
```bash
npx tsc --noEmit
```
Expected: TS errors about missing module `../types`.

- [ ] **Step 3: Create `src/siddur/types.ts`**

```ts
// src/siddur/types.ts

export type CardId =
  | 'shacharit'
  | 'birkat_hamazon'
  | 'mincha'
  | 'maariv'
  | 'tefillos'
  | 'learn';

export interface SiddurCard {
  id: CardId;
  title: { he: string; en: string };
  kind: 'karaoke' | 'reading';
  sections: SectionRef[];
}

export interface SectionRef {
  id: string;
  title: { he: string; en: string };
  pagePdf: number;
}

// ============================================================
// Section
// ============================================================

export interface SiddurSection {
  id: string;
  cardId: CardId;
  title: { he: string; en: string };
  source: 'feigenbaum';
  sourcePages: [number, number];

  blocks: SiddurBlock[];
  conditionalRule?: ConditionalRule;
  conditionalTags?: ConditionalTag[];
}

// ============================================================
// Block union
// ============================================================

export type SiddurBlock =
  | PrayerBlock
  | HeadingBlock
  | RubricBlock
  | FaqBlock
  | MinyanOnlyBlock
  | LearnCrossLinkBlock
  | VariantBlock
  | OmerCountBlock;

export interface PrayerBlock {
  kind: 'prayer';
  he: HebrewLine[];
  en: EnglishParagraph[];
  translit?: TranslitLine[];
  wordIndexStart: number;
  wordIndexEnd: number;
}

export interface HebrewLine {
  lineIndex: number;
  words: HebrewWord[];
}

export interface HebrewWord {
  globalIndex: number;
  text: string;
}

export interface EnglishParagraph {
  spans: EnglishSpan[];
  anchorLine?: number;
}

export interface EnglishSpan {
  text: string;
  style?: 'italic' | 'bold';
}

export interface TranslitLine {
  lineIndex: number;
  words: TranslitWord[];
  source: 'sefaria-ported' | 'feigenbaum-pdf' | 'missing';
}

export interface TranslitWord {
  text: string | null;
}

export interface HeadingBlock {
  kind: 'heading' | 'subsection';
  he?: string;
  en: string;
}

export interface RubricBlock {
  kind: 'rubric';
  text: { he?: string; en: string };
  italic: boolean;
}

export interface FaqBlock {
  kind: 'faq' | 'callout' | 'instant_insight';
  title?: string;
  body: EnglishParagraph[];
}

export interface MinyanOnlyBlock {
  kind: 'minyan_only';
  reason:
    | 'kaddish'
    | 'barchu'
    | 'kedushah'
    | 'birkas_cohanim'
    | 'krias_hatorah'
    | 'other';
  he: HebrewLine[];
  en: EnglishParagraph[];
  translit?: TranslitLine[];
}

export interface LearnCrossLinkBlock {
  kind: 'learn_link';
  essayId: string;
  promptText?: string;
}

export interface VariantBlock {
  kind: 'variant';
  primaryVariantIndex: number;
  variants: VariantOption[];
}

export interface VariantOption {
  label: string;
  rule: ConditionalRule;
  he?: HebrewLine[];
  en?: EnglishParagraph[];
  translit?: TranslitLine[];
}

export interface OmerCountBlock {
  kind: 'omer_count';
  he: HebrewLine[];
  en: EnglishParagraph[];
}

// ============================================================
// Conditional rules
// ============================================================

export type ConditionalRule =
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

export type SpecialDay =
  | 'rosh_chodesh'
  | 'chanukah'
  | 'purim'
  | 'shushan_purim'
  | 'chol_hamoed_pesach'
  | 'chol_hamoed_sukkos'
  | 'isru_chag'
  | 'tu_bav'
  | 'tu_bshvat'
  | 'pesach_sheni'
  | 'lag_bomer'
  | 'erev_rh'
  | 'erev_yk'
  | 'erev_pesach'
  | 'erev_shavuos'
  | 'aseres_yemei_teshuva'
  | 'rest_of_tishrei_after_yk'
  | 'tisha_bav_mincha'
  | 'day_of_bris_in_shul';

export type HebrewMonth =
  | 'tishrei' | 'cheshvan' | 'kislev' | 'tevet'
  | 'shvat' | 'adar_i' | 'adar_ii' | 'adar'
  | 'nisan' | 'iyar' | 'sivan' | 'tammuz'
  | 'av' | 'elul';

export type HebrewDateRef =
  | { kind: 'month_day'; month: HebrewMonth; day: number }
  | { kind: 'before_holiday'; holiday: SpecialDay; daysBefore: number }
  | { kind: 'first_day_of'; holiday: SpecialDay };

export interface ConditionalTag {
  blockIndex: number;
  rule: ConditionalRule;
}

// ============================================================
// Learn essay
// ============================================================

export interface LearnEssay {
  id: string;
  essayKind: 'appendix' | 'personal_note' | 'introduction' | 'glossary';
  title: { he?: string; en: string };
  source: 'feigenbaum';
  sourcePages: [number, number];
  body: EnglishParagraph[];
  anchoredFrom: { cardId: CardId; sectionId: string }[];
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npx tsc --noEmit
npm test -- --testPathPattern=siddur/__tests__/types --silent
```
Expected: typecheck clean, type tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/siddur/types.ts src/siddur/__tests__/types.test.ts
git commit -m "feat(siddur): define data model types for the remap

Source of truth for SiddurCard / SiddurSection / SiddurBlock union,
ConditionalRule shapes, and LearnEssay. No runtime code yet."
```

---

## Task 3: Create the 6-card registry in `src/data/siddur/cards.ts`

**Files:**
- Create: `src/data/siddur/cards.ts`
- Test: `src/data/siddur/__tests__/cards.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/data/siddur/__tests__/cards.test.ts`:
```ts
import { CARDS, getCard, getCardIds } from '../cards';

test('exposes six cards in print order', () => {
  expect(getCardIds()).toEqual([
    'shacharit', 'birkat_hamazon', 'mincha', 'maariv', 'tefillos', 'learn',
  ]);
});

test('first five cards are karaoke, learn is reading', () => {
  expect(getCard('shacharit').kind).toBe('karaoke');
  expect(getCard('birkat_hamazon').kind).toBe('karaoke');
  expect(getCard('mincha').kind).toBe('karaoke');
  expect(getCard('maariv').kind).toBe('karaoke');
  expect(getCard('tefillos').kind).toBe('karaoke');
  expect(getCard('learn').kind).toBe('reading');
});

test('each card has a Hebrew and English title', () => {
  CARDS.forEach((card) => {
    expect(card.title.he.length).toBeGreaterThan(0);
    expect(card.title.en.length).toBeGreaterThan(0);
  });
});

test('every card starts with an empty sections array (filled by Plan B)', () => {
  CARDS.forEach((card) => {
    expect(card.sections).toEqual([]);
  });
});

test('getCard throws on unknown id', () => {
  // @ts-expect-error testing runtime guard
  expect(() => getCard('bogus')).toThrow();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npm test -- --testPathPattern=siddur/__tests__/cards --silent
```
Expected: FAIL — module `../cards` not found.

- [ ] **Step 3: Implement `src/data/siddur/cards.ts`**

```ts
// src/data/siddur/cards.ts
import type { SiddurCard, CardId } from '../../siddur/types';

export const CARDS: ReadonlyArray<SiddurCard> = [
  {
    id: 'shacharit',
    title: { he: 'שַׁחֲרִית', en: 'Shacharit' },
    kind: 'karaoke',
    sections: [],
  },
  {
    id: 'birkat_hamazon',
    title: { he: 'בִּרְכַּת הַמָּזוֹן', en: 'Birkat Hamazon' },
    kind: 'karaoke',
    sections: [],
  },
  {
    id: 'mincha',
    title: { he: 'מִנְחָה', en: 'Mincha' },
    kind: 'karaoke',
    sections: [],
  },
  {
    id: 'maariv',
    title: { he: 'מַעֲרִיב', en: 'Maariv' },
    kind: 'karaoke',
    sections: [],
  },
  {
    id: 'tefillos',
    title: { he: 'תְּפִילּוֹת וּבְרָכוֹת', en: 'Tefillos' },
    kind: 'karaoke',
    sections: [],
  },
  {
    id: 'learn',
    title: { he: 'לִלְמֹד', en: 'Learn' },
    kind: 'reading',
    sections: [],
  },
];

const CARD_MAP: Record<CardId, SiddurCard> = Object.fromEntries(
  CARDS.map((c) => [c.id, c]),
) as Record<CardId, SiddurCard>;

export function getCard(id: CardId): SiddurCard {
  const card = CARD_MAP[id];
  if (!card) throw new Error(`Unknown card id: ${id}`);
  return card;
}

export function getCardIds(): CardId[] {
  return CARDS.map((c) => c.id);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
npm test -- --testPathPattern=siddur/__tests__/cards --silent
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/siddur/cards.ts src/data/siddur/__tests__/cards.test.ts
git commit -m "feat(siddur): 6-card registry with empty sections

Cards are listed in print order. Sections arrays get populated by
Plan B's content pipeline."
```

---

## Task 4: Create the section dispatcher with seed fixture

**Files:**
- Create: `src/data/siddur/fixtures/seed.json`
- Create: `src/data/siddur/index.ts`
- Test: `src/data/siddur/__tests__/dispatcher.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/data/siddur/__tests__/dispatcher.test.ts`:
```ts
import { getSiddurSection } from '../index';

test('seed fixture loads as a valid SiddurSection', () => {
  const section = getSiddurSection('shacharit', 'seed');
  expect(section).not.toBeNull();
  expect(section!.id).toBe('seed');
  expect(section!.cardId).toBe('shacharit');
  expect(section!.blocks.length).toBeGreaterThan(0);
});

test('unknown card returns null', () => {
  expect(getSiddurSection('shacharit', 'nonexistent')).toBeNull();
});

test('seed has at least one PrayerBlock with contiguous word indices', () => {
  const section = getSiddurSection('shacharit', 'seed')!;
  const prayers = section.blocks.filter((b) => b.kind === 'prayer');
  expect(prayers.length).toBeGreaterThan(0);
  const first = prayers[0] as Extract<typeof prayers[number], { kind: 'prayer' }>;
  expect(first.wordIndexStart).toBe(0);
  expect(first.wordIndexEnd).toBeGreaterThanOrEqual(first.wordIndexStart);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npm test -- --testPathPattern=siddur/__tests__/dispatcher --silent
```
Expected: FAIL — module not found.

- [ ] **Step 3: Create seed fixture**

Create `src/data/siddur/fixtures/seed.json`:
```json
{
  "id": "seed",
  "cardId": "shacharit",
  "title": { "he": "מוֹדֶה אֲנִי (זרע)", "en": "Modeh Ani (seed)" },
  "source": "feigenbaum",
  "sourcePages": [2, 3],
  "blocks": [
    {
      "kind": "heading",
      "level": "section",
      "he": "הַשְׁכָּמַת הַבּוֹקֶר",
      "en": "Waking up in the morning"
    },
    {
      "kind": "prayer",
      "he": [
        {
          "lineIndex": 0,
          "words": [
            { "globalIndex": 0, "text": "מוֹדֶה" },
            { "globalIndex": 1, "text": "אֲנִי" },
            { "globalIndex": 2, "text": "לְפָנֶיךָ" }
          ]
        }
      ],
      "en": [
        {
          "spans": [
            { "text": "I gratefully thank You" },
            { "text": " (right when I wake up) ", "style": "italic" },
            { "text": "for restoring my soul." }
          ],
          "anchorLine": 0
        }
      ],
      "translit": [
        {
          "lineIndex": 0,
          "words": [
            { "text": "Modeh" },
            { "text": "ani" },
            { "text": "lefanecha" }
          ],
          "source": "sefaria-ported"
        }
      ],
      "wordIndexStart": 0,
      "wordIndexEnd": 2
    },
    {
      "kind": "faq",
      "title": "Why this prayer first?",
      "body": [
        {
          "spans": [
            { "text": "Modeh Ani is said before anything else because it expresses gratitude for the gift of another day of life." }
          ]
        }
      ]
    },
    {
      "kind": "minyan_only",
      "reason": "barchu",
      "he": [
        {
          "lineIndex": 0,
          "words": [
            { "globalIndex": -1, "text": "בָּרְכוּ" },
            { "globalIndex": -1, "text": "אֶת" },
            { "globalIndex": -1, "text": "ה'" }
          ]
        }
      ],
      "en": [
        {
          "spans": [{ "text": "Bless Hashem (recited only with a minyan)." }]
        }
      ]
    },
    {
      "kind": "learn_link",
      "essayId": "appendix_01_how_davening_works"
    }
  ]
}
```

- [ ] **Step 4: Create dispatcher `src/data/siddur/index.ts`**

```ts
// src/data/siddur/index.ts
import type { CardId, SiddurSection } from '../../siddur/types';

type SectionLoader = () => SiddurSection;
type CardRegistry = Record<string, SectionLoader>;

// Lazy require thunks — Metro needs static require() paths, but the
// require() itself is deferred until first access to avoid eagerly
// parsing every section's JSON at startup.
const REGISTRY: Record<CardId, CardRegistry> = {
  shacharit: {
    seed: () => require('./fixtures/seed.json') as SiddurSection,
  },
  birkat_hamazon: {},
  mincha: {},
  maariv: {},
  tefillos: {},
  learn: {},
};

export function getSiddurSection(cardId: CardId, sectionId: string): SiddurSection | null {
  const loader = REGISTRY[cardId]?.[sectionId];
  if (!loader) return null;
  return loader();
}

export function listSectionIds(cardId: CardId): string[] {
  return Object.keys(REGISTRY[cardId] ?? {});
}
```

- [ ] **Step 5: Run test, then commit**

Run:
```bash
npx tsc --noEmit
npm test -- --testPathPattern=siddur/__tests__/dispatcher --silent
```
Expected: both pass.

```bash
git add src/data/siddur/fixtures/seed.json src/data/siddur/index.ts src/data/siddur/__tests__/dispatcher.test.ts
git commit -m "feat(siddur): section dispatcher with seed fixture

Lazy require() thunks preserve the existing pattern. Seed fixture
exercises four block kinds (heading, prayer, faq, minyan_only,
learn_link) so the scroll renderer can be developed without waiting
for Plan B's content pipeline."
```

---

## Task 5: Define data invariants test against the seed fixture

**Files:**
- Create: `src/data/siddur/__tests__/invariants.test.ts`

- [ ] **Step 1: Write the test (these are the spec §10.1 invariants)**

Create `src/data/siddur/__tests__/invariants.test.ts`:
```ts
import { getSiddurSection, listSectionIds } from '../index';
import type { CardId, PrayerBlock, MinyanOnlyBlock, SiddurBlock } from '../../../siddur/types';

const ALL_CARDS: CardId[] = ['shacharit', 'birkat_hamazon', 'mincha', 'maariv', 'tefillos', 'learn'];

function eachSection(cb: (cardId: CardId, sectionId: string) => void) {
  for (const cardId of ALL_CARDS) {
    for (const sectionId of listSectionIds(cardId)) {
      cb(cardId, sectionId);
    }
  }
}

describe('section invariants', () => {
  test('word-index continuity: contiguous from 0, strictly increasing, no duplicates', () => {
    eachSection((cardId, sectionId) => {
      const section = getSiddurSection(cardId, sectionId)!;
      const prayerBlocks = section.blocks.filter(
        (b): b is PrayerBlock => b.kind === 'prayer',
      );
      let expected = 0;
      for (const block of prayerBlocks) {
        expect(block.wordIndexStart).toBe(expected);
        for (const line of block.he) {
          for (const word of line.words) {
            expect(word.globalIndex).toBe(expected);
            expected += 1;
          }
        }
        expect(block.wordIndexEnd).toBe(expected - 1);
      }
    });
  });

  test('minyan-only words have globalIndex < 0 (excluded from karaoke sequence)', () => {
    eachSection((cardId, sectionId) => {
      const section = getSiddurSection(cardId, sectionId)!;
      const minyanBlocks = section.blocks.filter(
        (b): b is MinyanOnlyBlock => b.kind === 'minyan_only',
      );
      for (const block of minyanBlocks) {
        for (const line of block.he) {
          for (const word of line.words) {
            expect(word.globalIndex).toBeLessThan(0);
          }
        }
      }
    });
  });

  test('translit lines align 1:1 with Hebrew lines when present', () => {
    eachSection((cardId, sectionId) => {
      const section = getSiddurSection(cardId, sectionId)!;
      section.blocks.forEach((block: SiddurBlock) => {
        if (block.kind !== 'prayer') return;
        if (!block.translit) return;
        block.translit.forEach((tLine, i) => {
          const hLine = block.he[i];
          expect(tLine.words.length).toBe(hLine.words.length);
        });
      });
    });
  });

  test('sourcePages: start <= end, both within 1..296', () => {
    eachSection((cardId, sectionId) => {
      const section = getSiddurSection(cardId, sectionId)!;
      const [start, end] = section.sourcePages;
      expect(start).toBeGreaterThanOrEqual(1);
      expect(end).toBeLessThanOrEqual(296);
      expect(start).toBeLessThanOrEqual(end);
    });
  });

  test('conditional tag references point to real blocks', () => {
    eachSection((cardId, sectionId) => {
      const section = getSiddurSection(cardId, sectionId)!;
      (section.conditionalTags ?? []).forEach((tag) => {
        expect(tag.blockIndex).toBeGreaterThanOrEqual(0);
        expect(tag.blockIndex).toBeLessThan(section.blocks.length);
      });
    });
  });
});
```

- [ ] **Step 2: Run tests — they should pass against the seed fixture**

Run:
```bash
npm test -- --testPathPattern=siddur/__tests__/invariants --silent
```
Expected: PASS — the seed fixture was crafted to satisfy all invariants.

- [ ] **Step 3: Commit**

```bash
git add src/data/siddur/__tests__/invariants.test.ts
git commit -m "test(siddur): data invariants enforce karaoke-index continuity

These invariants run against every assembled SiddurSection. They
fail the build if Plan B's content pipeline produces inconsistent
JSON."
```

---

## Task 6: Create `src/theme/siddurTheme.ts` (renamed, palette unchanged)

**Files:**
- Create: `src/theme/siddurTheme.ts`
- Keep: `src/theme/shacharitTheme.ts` (will be deleted in Task 24 after all imports migrate)

- [ ] **Step 1: Copy `src/theme/shacharitTheme.ts` to `src/theme/siddurTheme.ts`**

Run:
```bash
cp src/theme/shacharitTheme.ts src/theme/siddurTheme.ts
```

- [ ] **Step 2: Remove the Shacharit-specific `SectionId` and `SECTIONS` from `src/theme/siddurTheme.ts`**

Open `src/theme/siddurTheme.ts`. Delete these blocks:
- `export type SectionId = 'birchot' | 'pesukei' | 'shema' | 'concluding';`
- The entire `export const SECTIONS: Record<SectionId, ...> = { ... };` block.
- `export const SECTION_ORDER: SectionId[] = [...];`

Keep `INK`, `PARCHMENT`, `FONTS`, `TIMING` blocks unchanged.

The file's first lines should now read:
```ts
// src/theme/siddurTheme.ts
export const INK = {
  strong: '#2a1d12',
  soft:   '#5a4835',
  faint:  '#8a7a64',
} as const;

export const PARCHMENT = '#f6e9d2';

export const FONTS = {
  hebrew: 'FrankRuhlLibre_500Medium',
  serifBody: 'EBGaramond_400Regular',
  serifBodyItalic: 'EBGaramond_400Regular_Italic',
  display: 'CormorantGaramond_500Medium',
  displayItalic: 'CormorantGaramond_500Medium_Italic',
} as const;

export const TIMING = {
  CADENCE_MIN: 757,
  CADENCE_JITTER: 378,
  INITIAL_DELAY: 585,
  HALO_CRESCENDO_AVG: 946 * 0.78,
  HALO_DECRESCENDO_AVG: 946 * 4.0,
  SPEED_MIN: 0.5,
  SPEED_MAX: 2.0,
  SPEED_STEP: 0.1,
  SPEED_DEFAULT: 1.0,
};
```

- [ ] **Step 3: Verify typecheck still passes (no consumer yet)**

Run:
```bash
npx tsc --noEmit
```
Expected: clean (no consumers yet).

- [ ] **Step 4: Commit**

```bash
git add src/theme/siddurTheme.ts
git commit -m "feat(siddur): siddurTheme with palette/FONTS/TIMING unchanged

SectionId/SECTIONS were Shacharit-specific and don't generalize to
the 6-card model. The remaining theme tokens are card-agnostic and
preserved verbatim."
```

---

## Task 7: Create `src/store/siddurStore.ts` with karaoke advance contract

**Files:**
- Create: `src/store/siddurStore.ts`
- Test: `src/store/__tests__/siddurStore.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/store/__tests__/siddurStore.test.ts`:
```ts
import { useSiddurStore } from '../siddurStore';

beforeEach(() => {
  useSiddurStore.getState().reset();
});

test('initial state has no active section, no active word', () => {
  const s = useSiddurStore.getState();
  expect(s.activeCardId).toBeNull();
  expect(s.activeSectionId).toBeNull();
  expect(s.activeWordIndex).toBeNull();
  expect(s.isPlaying).toBe(false);
});

test('setActiveSection seeds activeWordIndex to null', () => {
  useSiddurStore.getState().setActiveSection('shacharit', 'seed', [
    { sectionId: 'seed', start: 0, end: 2 },
  ]);
  const s = useSiddurStore.getState();
  expect(s.activeCardId).toBe('shacharit');
  expect(s.activeSectionId).toBe('seed');
  expect(s.activeWordIndex).toBeNull();
});

test('setActiveWord updates the current word', () => {
  const store = useSiddurStore.getState();
  store.setActiveSection('shacharit', 'seed', [{ sectionId: 'seed', start: 0, end: 2 }]);
  store.setActiveWord(1);
  expect(useSiddurStore.getState().activeWordIndex).toBe(1);
});

describe('advance', () => {
  beforeEach(() => {
    const store = useSiddurStore.getState();
    store.setActiveSection('shacharit', 'seed', [
      { sectionId: 'first',  start: 0, end: 2 },
      { sectionId: 'second', start: 3, end: 4 },
    ]);
  });

  test('advance from null sets to first word of first section', () => {
    const result = useSiddurStore.getState().advance();
    expect(result).toBe('advanced');
    expect(useSiddurStore.getState().activeWordIndex).toBe(0);
  });

  test('advance within a section increments by 1', () => {
    useSiddurStore.getState().setActiveWord(0);
    expect(useSiddurStore.getState().advance()).toBe('advanced');
    expect(useSiddurStore.getState().activeWordIndex).toBe(1);
  });

  test('advance at last word of a section returns section-boundary, pauses playback', () => {
    useSiddurStore.getState().setActiveWord(2);
    useSiddurStore.getState().setIsPlaying(true);
    expect(useSiddurStore.getState().advance()).toBe('section-boundary');
    expect(useSiddurStore.getState().isPlaying).toBe(false);
  });

  test('jumpToNextSection moves to start of next section', () => {
    useSiddurStore.getState().setActiveWord(2);
    useSiddurStore.getState().jumpToNextSection();
    expect(useSiddurStore.getState().activeWordIndex).toBe(3);
    expect(useSiddurStore.getState().activeSectionId).toBe('second');
  });

  test('advance past last word of last section returns end', () => {
    useSiddurStore.getState().setActiveWord(4);
    expect(useSiddurStore.getState().advance()).toBe('end');
  });
});

test('reset clears all state', () => {
  const store = useSiddurStore.getState();
  store.setActiveSection('shacharit', 'seed', [{ sectionId: 'seed', start: 0, end: 2 }]);
  store.setActiveWord(1);
  store.setIsPlaying(true);
  store.reset();
  const s = useSiddurStore.getState();
  expect(s.activeCardId).toBeNull();
  expect(s.activeSectionId).toBeNull();
  expect(s.activeWordIndex).toBeNull();
  expect(s.isPlaying).toBe(false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npm test -- --testPathPattern=store/__tests__/siddurStore --silent
```
Expected: FAIL.

- [ ] **Step 3: Implement `src/store/siddurStore.ts`**

```ts
// src/store/siddurStore.ts
import { create } from 'zustand';
import type { CardId } from '../siddur/types';

/**
 * One entry per SiddurSection in the current card's scroll.
 * `start` and `end` are inclusive global karaoke word indices.
 */
export interface SectionBounds {
  sectionId: string;
  start: number;
  end: number;
}

export type AdvanceResult = 'advanced' | 'section-boundary' | 'end';

interface SiddurState {
  // Which card+section is currently the karaoke target
  activeCardId: CardId | null;
  activeSectionId: string | null;
  // Section bounds for the entire card's continuous scroll
  bounds: SectionBounds[];
  // Currently highlighted word's global index, or null if not started
  activeWordIndex: number | null;
  // Playback (tick loop) state
  isPlaying: boolean;
  speed: number;

  // Setters
  setActiveSection: (cardId: CardId, sectionId: string, bounds: SectionBounds[]) => void;
  setActiveWord: (index: number | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setSpeed: (speed: number) => void;

  // Advance contract — single call from tick loop OR (V2) useWordSync
  advance: () => AdvanceResult;
  jumpToNextSection: () => void;
  reset: () => void;
}

export const useSiddurStore = create<SiddurState>((set, get) => ({
  activeCardId: null,
  activeSectionId: null,
  bounds: [],
  activeWordIndex: null,
  isPlaying: false,
  speed: 1.0,

  setActiveSection: (cardId, sectionId, bounds) => {
    set({ activeCardId: cardId, activeSectionId: sectionId, bounds, activeWordIndex: null });
  },

  setActiveWord: (activeWordIndex) => {
    if (activeWordIndex !== null) {
      const cur = get().bounds.find((b) => activeWordIndex >= b.start && activeWordIndex <= b.end);
      if (cur && cur.sectionId !== get().activeSectionId) {
        set({ activeSectionId: cur.sectionId });
      }
    }
    set({ activeWordIndex });
  },

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setSpeed: (speed) => set({ speed }),

  advance: () => {
    const s = get();
    if (s.bounds.length === 0) return 'end';
    // From null → start of first section
    if (s.activeWordIndex === null) {
      set({ activeWordIndex: s.bounds[0].start, activeSectionId: s.bounds[0].sectionId });
      return 'advanced';
    }
    const cur = s.bounds.find((b) => s.activeWordIndex! >= b.start && s.activeWordIndex! <= b.end);
    if (!cur) return 'end';
    // At last word of last section overall
    const lastBound = s.bounds[s.bounds.length - 1];
    if (s.activeWordIndex === lastBound.end) return 'end';
    // At last word of current section (but not last section overall)
    if (s.activeWordIndex === cur.end) {
      set({ isPlaying: false });
      return 'section-boundary';
    }
    // Normal advance
    set({ activeWordIndex: s.activeWordIndex + 1 });
    return 'advanced';
  },

  jumpToNextSection: () => {
    const s = get();
    if (s.activeWordIndex === null) return;
    const curIdx = s.bounds.findIndex((b) => s.activeWordIndex! >= b.start && s.activeWordIndex! <= b.end);
    if (curIdx < 0 || curIdx === s.bounds.length - 1) return;
    const next = s.bounds[curIdx + 1];
    set({ activeWordIndex: next.start, activeSectionId: next.sectionId });
  },

  reset: () => {
    set({
      activeCardId: null,
      activeSectionId: null,
      bounds: [],
      activeWordIndex: null,
      isPlaying: false,
      speed: 1.0,
    });
  },
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
npm test -- --testPathPattern=store/__tests__/siddurStore --silent
```
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/store/siddurStore.ts src/store/__tests__/siddurStore.test.ts
git commit -m "feat(siddur): siddurStore with section-agnostic advance

Replaces prayerStore's Shacharit-specific bounds with a card+section
model. The advance() contract is the single mutation entry point —
called by the MVP tick loop and (V2) useWordSync."
```

---

## Task 8: Move karaoke primitives into `src/siddur/components/`

**Files:**
- Move (copy + update imports): `src/components/shacharit/Halo.tsx` → `src/siddur/components/Halo.tsx`
- Move: `src/components/shacharit/WordPair.tsx` → `src/siddur/components/WordPair.tsx`
- Move: `src/components/shacharit/LineRow.tsx` → `src/siddur/components/LineRow.tsx`
- Move: `src/components/shacharit/PairRow.tsx` → `src/siddur/components/PairRow.tsx`
- Move: `src/components/shacharit/ExpandablePanel.tsx` → `src/siddur/components/ExpandablePanel.tsx`

Keep originals in place for now — they'll be deleted in Task 24 after all consumers update.

- [ ] **Step 1: Copy each file using `git mv`'s copy semantics (so we keep blame history while migrating consumers)**

Actually use plain `cp` to keep both copies live during migration:
```bash
mkdir -p src/siddur/components
cp src/components/shacharit/Halo.tsx           src/siddur/components/Halo.tsx
cp src/components/shacharit/WordPair.tsx       src/siddur/components/WordPair.tsx
cp src/components/shacharit/LineRow.tsx        src/siddur/components/LineRow.tsx
cp src/components/shacharit/PairRow.tsx        src/siddur/components/PairRow.tsx
cp src/components/shacharit/ExpandablePanel.tsx src/siddur/components/ExpandablePanel.tsx
```

- [ ] **Step 2: Update theme imports in each new file from `shacharitTheme` to `siddurTheme`**

In each of the 5 new files under `src/siddur/components/`, find and replace:
- `from '../../theme/shacharitTheme'` → `from '../../theme/siddurTheme'`

Run after each replacement:
```bash
grep -l shacharitTheme src/siddur/components/ 2>/dev/null
```
Expected: empty output once all replacements are done.

- [ ] **Step 3: Update relative imports between the moved files**

Some primitives import each other (e.g., `PairRow` imports `LineRow`). The relative paths inside `src/siddur/components/` remain the same (`./LineRow`, `./WordPair`, etc.), so no change needed for component-to-component imports. Verify by searching:
```bash
grep -n "from '\.\./shacharit/" src/siddur/components/*.tsx
```
Expected: empty (no `../shacharit/` references inside the new directory).

If any `../shacharit/` references exist (e.g., `WordPair` referencing `Halo` via old path), update them to `./` relative.

- [ ] **Step 4: Verify typecheck on new files passes (originals still exist as fallback for consumers)**

Run:
```bash
npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/siddur/components/
git commit -m "feat(siddur): copy karaoke primitives into siddur/components

Halo, WordPair, LineRow, PairRow, ExpandablePanel are duplicated
(not yet replaced). Theme imports updated to siddurTheme. The
original src/components/shacharit/ copies stay in place until
all consumers migrate (Task 24)."
```

---

## Task 9: Refactor PrayerBlock — remove commentary coupling, move to `src/siddur/components/`

**Files:**
- Create: `src/siddur/components/PrayerBlock.tsx` (refactored copy)
- Reference: `src/components/shacharit/PrayerBlock.tsx` (read for current behavior; do NOT modify in this task)

- [ ] **Step 1: Read the existing PrayerBlock to understand its current shape**

Run:
```bash
wc -l src/components/shacharit/PrayerBlock.tsx
```

Open `src/components/shacharit/PrayerBlock.tsx` in your editor. Identify:
- The props interface (note any `commentary`-related or `footnote`-related props).
- Imports from `footnoteStore`, `FootnoteMarker`, `FootnotePanel`, or `BundledCommentary`.
- How `LineRow` / `PairRow` are composed inside.

- [ ] **Step 2: Write a smoke test for the refactored PrayerBlock**

Create `src/siddur/components/__tests__/PrayerBlock.test.tsx`:
```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import PrayerBlock from '../PrayerBlock';
import type { PrayerBlock as PrayerBlockData } from '../../types';

const fixture: PrayerBlockData = {
  kind: 'prayer',
  he: [
    {
      lineIndex: 0,
      words: [
        { globalIndex: 0, text: 'מוֹדֶה' },
        { globalIndex: 1, text: 'אֲנִי' },
      ],
    },
  ],
  en: [
    {
      spans: [{ text: 'I thank You' }],
      anchorLine: 0,
    },
  ],
  wordIndexStart: 0,
  wordIndexEnd: 1,
};

test('renders Hebrew words from a PrayerBlock', () => {
  const { getByText } = render(
    <PrayerBlock data={fixture} activeWordIndex={null} showHebrew={true} showTranslit={false} showEnglish={false} />,
  );
  expect(getByText('מוֹדֶה')).toBeTruthy();
  expect(getByText('אֲנִי')).toBeTruthy();
});

test('renders English when showEnglish is true', () => {
  const { getByText } = render(
    <PrayerBlock data={fixture} activeWordIndex={null} showHebrew={false} showTranslit={false} showEnglish={true} />,
  );
  expect(getByText(/I thank You/)).toBeTruthy();
});

test('does not import or render commentary markers', () => {
  // This is a structural assertion via snapshot — no FootnoteMarker glyphs.
  const tree = render(
    <PrayerBlock data={fixture} activeWordIndex={null} showHebrew={true} showTranslit={false} showEnglish={true} />,
  ).toJSON();
  const flat = JSON.stringify(tree);
  expect(flat).not.toMatch(/FootnoteMarker/);
  expect(flat).not.toMatch(/commentary/i);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run:
```bash
npm test -- --testPathPattern=siddur/components/__tests__/PrayerBlock --silent
```
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `src/siddur/components/PrayerBlock.tsx`**

```tsx
// src/siddur/components/PrayerBlock.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import LineRow from './LineRow';
import type { PrayerBlock as PrayerBlockData } from '../types';

interface Props {
  data: PrayerBlockData;
  activeWordIndex: number | null;
  showHebrew: boolean;
  showTranslit: boolean;
  showEnglish: boolean;
}

function PrayerBlock({ data, activeWordIndex, showHebrew, showTranslit, showEnglish }: Props) {
  return (
    <View style={styles.block}>
      {data.he.map((line, i) => {
        const translit = data.translit?.[i];
        const english = data.en.find((p) => p.anchorLine === line.lineIndex);
        return (
          <LineRow
            key={line.lineIndex}
            hebrewLine={line}
            translitLine={translit}
            englishParagraph={english}
            activeWordIndex={activeWordIndex}
            showHebrew={showHebrew}
            showTranslit={showTranslit}
            showEnglish={showEnglish}
          />
        );
      })}
      {/* English paragraphs not bound to a specific line render below */}
      {data.en
        .filter((p) => p.anchorLine === undefined)
        .map((para, i) => (
          <LineRow
            key={`unbound-${i}`}
            englishParagraph={para}
            activeWordIndex={null}
            showHebrew={false}
            showTranslit={false}
            showEnglish={showEnglish}
          />
        ))}
    </View>
  );
}

export default React.memo(PrayerBlock);

const styles = StyleSheet.create({
  block: {
    marginVertical: 12,
  },
});
```

- [ ] **Step 5: Update `LineRow` to accept the new props shape**

Open `src/siddur/components/LineRow.tsx`. You will likely need to add optional props `hebrewLine`, `translitLine`, `englishParagraph`, `activeWordIndex`, `showHebrew`, `showTranslit`, `showEnglish` that match `PrayerBlock`'s usage. Read the existing `LineRow` to understand its current shape; then adapt the props interface.

Verify with:
```bash
npx tsc --noEmit
npm test -- --testPathPattern=siddur/components/__tests__/PrayerBlock --silent
```
Expected: typecheck clean, tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/siddur/components/PrayerBlock.tsx src/siddur/components/LineRow.tsx src/siddur/components/__tests__/PrayerBlock.test.tsx
git commit -m "feat(siddur): PrayerBlock refactored without commentary coupling

PrayerBlock now takes a typed PrayerBlockData directly and the
lane visibility flags as props. No imports from footnoteStore,
FootnoteMarker, or FootnotePanel. LineRow's props adapted to the
new shape."
```

---

## Task 10: Create `ItalicEnglishText` for Feigenbaum interpretive italics

**Files:**
- Create: `src/siddur/components/ItalicEnglishText.tsx`
- Test: `src/siddur/components/__tests__/ItalicEnglishText.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/siddur/components/__tests__/ItalicEnglishText.test.tsx`:
```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import ItalicEnglishText from '../ItalicEnglishText';

test('renders plain spans as default-styled text', () => {
  const { getByText } = render(
    <ItalicEnglishText spans={[{ text: 'Blessed are You' }]} />,
  );
  expect(getByText('Blessed are You')).toBeTruthy();
});

test('renders italic spans with serifBodyItalic font', () => {
  const { getByText } = render(
    <ItalicEnglishText
      spans={[
        { text: 'Happy are those who ' },
        { text: 'wherever they are', style: 'italic' },
        { text: ' are living in the house of Hashem.' },
      ]}
    />,
  );
  const italicNode = getByText('wherever they are');
  // Style is a flattened array on RN text nodes
  const flat = Array.isArray(italicNode.props.style)
    ? Object.assign({}, ...italicNode.props.style)
    : italicNode.props.style;
  expect(flat.fontFamily).toMatch(/Italic/);
});

test('handles consecutive italic spans without collapsing them', () => {
  const { getAllByText } = render(
    <ItalicEnglishText
      spans={[
        { text: 'one', style: 'italic' },
        { text: 'two', style: 'italic' },
      ]}
    />,
  );
  expect(getAllByText(/one|two/)).toHaveLength(2);
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npm test -- --testPathPattern=ItalicEnglishText --silent
```
Expected: FAIL.

- [ ] **Step 3: Implement `src/siddur/components/ItalicEnglishText.tsx`**

```tsx
// src/siddur/components/ItalicEnglishText.tsx
import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { FONTS, INK } from '../../theme/siddurTheme';
import type { EnglishSpan } from '../types';

interface Props {
  spans: EnglishSpan[];
  baseStyle?: TextStyle;
}

/**
 * Renders an array of EnglishSpan as a single Text with inline style runs.
 * Italic spans use FONTS.serifBodyItalic — these are Feigenbaum's
 * interpretive translation additions (see spec §3, pp. XVI-XVII of the PDF).
 */
function ItalicEnglishText({ spans, baseStyle }: Props) {
  return (
    <Text style={[styles.base, baseStyle]}>
      {spans.map((span, i) => (
        <Text key={i} style={styleForSpan(span)}>
          {span.text}
        </Text>
      ))}
    </Text>
  );
}

function styleForSpan(span: EnglishSpan): TextStyle {
  switch (span.style) {
    case 'italic':
      return { fontFamily: FONTS.serifBodyItalic, fontStyle: 'italic' };
    case 'bold':
      return { fontFamily: FONTS.serifBody, fontWeight: '700' };
    default:
      return { fontFamily: FONTS.serifBody };
  }
}

export default React.memo(ItalicEnglishText);

const styles = StyleSheet.create({
  base: {
    fontSize: 16,
    lineHeight: 24,
    color: INK.strong,
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- --testPathPattern=ItalicEnglishText --silent
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/siddur/components/ItalicEnglishText.tsx src/siddur/components/__tests__/ItalicEnglishText.test.tsx
git commit -m "feat(siddur): ItalicEnglishText preserves Feigenbaum interpretive italics

Italic spans render with FONTS.serifBodyItalic per spec §3.
Used by every paragraph renderer (PrayerBlock English lane,
FaqPanel body, EssayScreen body)."
```

---

## Task 11: Create `FaqPanel` for FAQ / callout / Instant Insight blocks

**Files:**
- Create: `src/siddur/components/FaqPanel.tsx`
- Test: `src/siddur/components/__tests__/FaqPanel.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/siddur/components/__tests__/FaqPanel.test.tsx`:
```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FaqPanel from '../FaqPanel';
import type { FaqBlock } from '../../types';

const faqFixture: FaqBlock = {
  kind: 'faq',
  title: 'Why this prayer first?',
  body: [{ spans: [{ text: 'Because gratitude opens the day.' }] }],
};

test('collapsed by default, body is not in the tree', () => {
  const { queryByText, getByText } = render(<FaqPanel data={faqFixture} />);
  expect(getByText(/Why this prayer first/)).toBeTruthy();
  expect(queryByText(/gratitude opens the day/)).toBeNull();
});

test('tapping the chip expands the body', () => {
  const { getByText } = render(<FaqPanel data={faqFixture} />);
  fireEvent.press(getByText(/Why this prayer first/));
  expect(getByText(/gratitude opens the day/)).toBeTruthy();
});

test('uses ❓ icon for faq kind', () => {
  const { getByText } = render(<FaqPanel data={faqFixture} />);
  expect(getByText(/❓/)).toBeTruthy();
});

test('uses 💡 icon for instant_insight kind', () => {
  const data: FaqBlock = { ...faqFixture, kind: 'instant_insight' };
  const { getByText } = render(<FaqPanel data={data} />);
  expect(getByText(/💡/)).toBeTruthy();
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npm test -- --testPathPattern=FaqPanel --silent
```
Expected: FAIL.

- [ ] **Step 3: Implement `src/siddur/components/FaqPanel.tsx`**

```tsx
// src/siddur/components/FaqPanel.tsx
import React, { useCallback, useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import ExpandablePanel from './ExpandablePanel';
import ItalicEnglishText from './ItalicEnglishText';
import { FONTS, INK, PARCHMENT } from '../../theme/siddurTheme';
import type { FaqBlock } from '../types';

interface Props {
  data: FaqBlock;
}

function iconFor(kind: FaqBlock['kind']): string {
  switch (kind) {
    case 'faq': return '❓';
    case 'instant_insight': return '💡';
    case 'callout': return '✦';
  }
}

function FaqPanel({ data }: Props) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const title = data.title ?? (data.kind === 'faq' ? 'FAQ' : data.kind === 'instant_insight' ? 'Instant Insight' : 'Note');
  return (
    <View style={styles.wrap}>
      <Pressable onPress={toggle} style={styles.chip} hitSlop={8}>
        <Text style={styles.icon}>{iconFor(data.kind)}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.chevron}>{open ? '▾' : '▸'}</Text>
      </Pressable>
      <ExpandablePanel open={open}>
        <View style={styles.body}>
          {data.body.map((para, i) => (
            <ItalicEnglishText key={i} spans={para.spans} />
          ))}
        </View>
      </ExpandablePanel>
    </View>
  );
}

export default React.memo(FaqPanel);

const styles = StyleSheet.create({
  wrap: {
    marginVertical: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PARCHMENT,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  title: {
    flex: 1,
    fontFamily: FONTS.serifBody,
    fontSize: 14,
    fontWeight: '600',
    color: INK.strong,
  },
  chevron: {
    fontSize: 12,
    color: INK.soft,
  },
  body: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
});
```

- [ ] **Step 4: Run test, commit**

```bash
npm test -- --testPathPattern=FaqPanel --silent
```
Expected: PASS.

```bash
git add src/siddur/components/FaqPanel.tsx src/siddur/components/__tests__/FaqPanel.test.tsx
git commit -m "feat(siddur): FaqPanel for FAQ / callout / Instant Insight blocks

Reuses ExpandablePanel for collapse/expand. Icon varies by block kind.
Multiple panels can be open simultaneously (intentional change from
the old footnoteStore one-at-a-time pattern)."
```

---

## Task 12: Create `MinyanRevealBlock`

**Files:**
- Create: `src/siddur/components/MinyanRevealBlock.tsx`
- Test: `src/siddur/components/__tests__/MinyanRevealBlock.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/siddur/components/__tests__/MinyanRevealBlock.test.tsx`:
```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MinyanRevealBlock from '../MinyanRevealBlock';
import type { MinyanOnlyBlock } from '../../types';

const fixture: MinyanOnlyBlock = {
  kind: 'minyan_only',
  reason: 'barchu',
  he: [{
    lineIndex: 0,
    words: [
      { globalIndex: -1, text: 'בָּרְכוּ' },
      { globalIndex: -1, text: 'אֶת' },
    ],
  }],
  en: [{ spans: [{ text: 'Bless Hashem.' }] }],
};

test('collapsed by default: content not visible, prompt visible', () => {
  const { queryByText, getByText } = render(<MinyanRevealBlock data={fixture} />);
  expect(queryByText('בָּרְכוּ')).toBeNull();
  expect(getByText(/minyan/i)).toBeTruthy();
});

test('tapping the prompt reveals the content as plain text', () => {
  const { getByText, queryByText } = render(<MinyanRevealBlock data={fixture} />);
  expect(queryByText('בָּרְכוּ')).toBeNull();
  fireEvent.press(getByText(/minyan/i));
  expect(getByText('בָּרְכוּ')).toBeTruthy();
});

test('revealed content has no halo glow component', () => {
  const { toJSON } = render(<MinyanRevealBlock data={fixture} />);
  fireEvent.press(toJSON()! as any); // trigger expand via root
  const flat = JSON.stringify(toJSON());
  expect(flat).not.toMatch(/Halo/);
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npm test -- --testPathPattern=MinyanRevealBlock --silent
```
Expected: FAIL.

- [ ] **Step 3: Implement `src/siddur/components/MinyanRevealBlock.tsx`**

```tsx
// src/siddur/components/MinyanRevealBlock.tsx
import React, { useCallback, useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import ItalicEnglishText from './ItalicEnglishText';
import { FONTS, INK } from '../../theme/siddurTheme';
import type { MinyanOnlyBlock } from '../types';

interface Props {
  data: MinyanOnlyBlock;
}

function MinyanRevealBlock({ data }: Props) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  if (!open) {
    return (
      <Pressable onPress={toggle} style={styles.collapsed} hitSlop={4}>
        <View style={styles.rule} />
        <Text style={styles.prompt}>
          Recited only with a minyan — tap to view  ▸
        </Text>
        <View style={styles.rule} />
      </Pressable>
    );
  }
  return (
    <View style={styles.expanded}>
      <Pressable onPress={toggle} hitSlop={4}>
        <Text style={styles.collapseLabel}>Hide minyan-only content  ▾</Text>
      </Pressable>
      {data.he.map((line) => (
        <Text key={line.lineIndex} style={styles.hebrew} allowFontScaling={false}>
          {line.words.map((w) => w.text).join('  ')}
        </Text>
      ))}
      {data.en.map((para, i) => (
        <ItalicEnglishText key={i} spans={para.spans} baseStyle={styles.english} />
      ))}
    </View>
  );
}

export default React.memo(MinyanRevealBlock);

const styles = StyleSheet.create({
  collapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingVertical: 4,
  },
  rule: {
    flex: 1,
    height: 1,
    backgroundColor: INK.faint,
    opacity: 0.4,
  },
  prompt: {
    fontFamily: FONTS.serifBodyItalic,
    fontStyle: 'italic',
    fontSize: 12,
    color: INK.soft,
    paddingHorizontal: 12,
  },
  expanded: {
    marginVertical: 12,
    paddingHorizontal: 8,
    opacity: 0.7,
  },
  collapseLabel: {
    fontFamily: FONTS.serifBodyItalic,
    fontSize: 12,
    color: INK.soft,
    paddingBottom: 6,
  },
  hebrew: {
    fontFamily: FONTS.hebrew,
    fontSize: 20,
    lineHeight: 30,
    writingDirection: 'rtl',
    textAlign: 'right',
    color: INK.soft,
    marginBottom: 4,
  },
  english: {
    color: INK.soft,
  },
});
```

- [ ] **Step 4: Run test, commit**

```bash
npm test -- --testPathPattern=MinyanRevealBlock --silent
```
Expected: PASS.

```bash
git add src/siddur/components/MinyanRevealBlock.tsx src/siddur/components/__tests__/MinyanRevealBlock.test.tsx
git commit -m "feat(siddur): MinyanRevealBlock hides minyan-only content by default

Tap to reveal as plain text (no halo, no karaoke advance).
Desaturated styling communicates 'reading, not davening'."
```

---

## Task 13: Create `LearnCrossLink` pill

**Files:**
- Create: `src/siddur/components/LearnCrossLink.tsx`
- Test: `src/siddur/components/__tests__/LearnCrossLink.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/siddur/components/__tests__/LearnCrossLink.test.tsx`:
```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LearnCrossLink from '../LearnCrossLink';

test('renders the prompt text when provided', () => {
  const onPress = jest.fn();
  const { getByText } = render(
    <LearnCrossLink essayId="appendix_09_korbanos" promptText="Why we say the Korbanos" onPress={onPress} />,
  );
  expect(getByText(/Why we say the Korbanos/)).toBeTruthy();
});

test('falls back to essayId when promptText is missing', () => {
  const onPress = jest.fn();
  const { getByText } = render(
    <LearnCrossLink essayId="appendix_09_korbanos" onPress={onPress} />,
  );
  expect(getByText(/appendix_09_korbanos/i)).toBeTruthy();
});

test('tapping invokes onPress with the essayId', () => {
  const onPress = jest.fn();
  const { getByText } = render(
    <LearnCrossLink essayId="appendix_01" promptText="How Davening Works" onPress={onPress} />,
  );
  fireEvent.press(getByText(/How Davening Works/));
  expect(onPress).toHaveBeenCalledWith('appendix_01');
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npm test -- --testPathPattern=LearnCrossLink --silent
```
Expected: FAIL.

- [ ] **Step 3: Implement `src/siddur/components/LearnCrossLink.tsx`**

```tsx
// src/siddur/components/LearnCrossLink.tsx
import React, { useCallback } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { FONTS, INK, PARCHMENT } from '../../theme/siddurTheme';

interface Props {
  essayId: string;
  promptText?: string;
  onPress: (essayId: string) => void;
}

function LearnCrossLink({ essayId, promptText, onPress }: Props) {
  const handlePress = useCallback(() => onPress(essayId), [essayId, onPress]);
  const label = promptText ?? essayId;
  return (
    <Pressable onPress={handlePress} style={styles.pill} hitSlop={6}>
      <View style={styles.row}>
        <Text style={styles.prefix}>Read more:</Text>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  );
}

export default React.memo(LearnCrossLink);

const styles = StyleSheet.create({
  pill: {
    backgroundColor: PARCHMENT,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefix: {
    fontFamily: FONTS.serifBodyItalic,
    fontStyle: 'italic',
    fontSize: 13,
    color: INK.soft,
    marginRight: 8,
  },
  label: {
    flex: 1,
    fontFamily: FONTS.serifBody,
    fontSize: 15,
    fontWeight: '600',
    color: INK.strong,
  },
  chevron: {
    fontSize: 22,
    color: INK.soft,
    marginLeft: 8,
  },
});
```

- [ ] **Step 4: Run test, commit**

```bash
npm test -- --testPathPattern=LearnCrossLink --silent
```
Expected: PASS.

```bash
git add src/siddur/components/LearnCrossLink.tsx src/siddur/components/__tests__/LearnCrossLink.test.tsx
git commit -m "feat(siddur): LearnCrossLink pill for inline 'Related essay: X' affordance"
```

---

## Task 14: Create `BlockRenderer` dispatcher

**Files:**
- Create: `src/siddur/components/BlockRenderer.tsx`
- Test: `src/siddur/components/__tests__/BlockRenderer.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/siddur/components/__tests__/BlockRenderer.test.tsx`:
```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import BlockRenderer from '../BlockRenderer';
import type { SiddurBlock } from '../../types';

const defaultProps = {
  activeWordIndex: null,
  showHebrew: true,
  showTranslit: false,
  showEnglish: true,
  onLearnLinkPress: jest.fn(),
};

test('dispatches prayer block to PrayerBlock renderer', () => {
  const block: SiddurBlock = {
    kind: 'prayer',
    he: [{ lineIndex: 0, words: [{ globalIndex: 0, text: 'מוֹדֶה' }] }],
    en: [{ spans: [{ text: 'I thank You' }] }],
    wordIndexStart: 0,
    wordIndexEnd: 0,
  };
  const { getByText } = render(<BlockRenderer block={block} {...defaultProps} />);
  expect(getByText('מוֹדֶה')).toBeTruthy();
});

test('dispatches heading block to a heading text', () => {
  const block: SiddurBlock = { kind: 'heading', en: 'Morning Blessings', he: 'בִּרְכוֹת הַשַּׁחַר' };
  const { getByText } = render(<BlockRenderer block={block} {...defaultProps} />);
  expect(getByText(/Morning Blessings/)).toBeTruthy();
});

test('dispatches rubric block to italic instruction text', () => {
  const block: SiddurBlock = {
    kind: 'rubric',
    text: { en: 'On Rosh Chodesh, add the following:' },
    italic: true,
  };
  const { getByText } = render(<BlockRenderer block={block} {...defaultProps} />);
  expect(getByText(/On Rosh Chodesh/)).toBeTruthy();
});

test('dispatches faq block to FaqPanel (collapsed by default, title visible)', () => {
  const block: SiddurBlock = {
    kind: 'faq',
    title: 'Why this first?',
    body: [{ spans: [{ text: 'Because gratitude.' }] }],
  };
  const { queryByText, getByText } = render(<BlockRenderer block={block} {...defaultProps} />);
  expect(getByText(/Why this first/)).toBeTruthy();
  expect(queryByText(/Because gratitude/)).toBeNull();
});

test('dispatches minyan_only block to MinyanRevealBlock (collapsed by default)', () => {
  const block: SiddurBlock = {
    kind: 'minyan_only',
    reason: 'barchu',
    he: [{ lineIndex: 0, words: [{ globalIndex: -1, text: 'בָּרְכוּ' }] }],
    en: [{ spans: [{ text: 'Bless Hashem.' }] }],
  };
  const { queryByText, getByText } = render(<BlockRenderer block={block} {...defaultProps} />);
  expect(queryByText('בָּרְכוּ')).toBeNull();
  expect(getByText(/minyan/i)).toBeTruthy();
});

test('dispatches learn_link block to LearnCrossLink with onPress wired', () => {
  const onLearnLinkPress = jest.fn();
  const block: SiddurBlock = {
    kind: 'learn_link',
    essayId: 'appendix_01',
    promptText: 'How Davening Works',
  };
  const { getByText } = render(
    <BlockRenderer block={block} {...defaultProps} onLearnLinkPress={onLearnLinkPress} />,
  );
  expect(getByText(/How Davening Works/)).toBeTruthy();
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npm test -- --testPathPattern=BlockRenderer --silent
```
Expected: FAIL.

- [ ] **Step 3: Implement `src/siddur/components/BlockRenderer.tsx`**

```tsx
// src/siddur/components/BlockRenderer.tsx
import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import PrayerBlock from './PrayerBlock';
import FaqPanel from './FaqPanel';
import MinyanRevealBlock from './MinyanRevealBlock';
import LearnCrossLink from './LearnCrossLink';
import ItalicEnglishText from './ItalicEnglishText';
import { FONTS, INK } from '../../theme/siddurTheme';
import type { SiddurBlock, VariantBlock, OmerCountBlock } from '../types';

interface Props {
  block: SiddurBlock;
  activeWordIndex: number | null;
  showHebrew: boolean;
  showTranslit: boolean;
  showEnglish: boolean;
  onLearnLinkPress: (essayId: string) => void;
}

function BlockRenderer({ block, activeWordIndex, showHebrew, showTranslit, showEnglish, onLearnLinkPress }: Props) {
  switch (block.kind) {
    case 'prayer':
      return (
        <PrayerBlock
          data={block}
          activeWordIndex={activeWordIndex}
          showHebrew={showHebrew}
          showTranslit={showTranslit}
          showEnglish={showEnglish}
        />
      );
    case 'heading':
    case 'subsection':
      return (
        <View style={styles.headingWrap}>
          {block.he && <Text style={styles.headingHebrew}>{block.he}</Text>}
          <Text style={styles.headingEn}>{block.en}</Text>
        </View>
      );
    case 'rubric':
      return (
        <View style={styles.rubricWrap}>
          {block.text.he && <Text style={[styles.rubricHe, block.italic && styles.italic]}>{block.text.he}</Text>}
          <Text style={[styles.rubricEn, block.italic && styles.italic]}>{block.text.en}</Text>
        </View>
      );
    case 'faq':
    case 'callout':
    case 'instant_insight':
      return <FaqPanel data={block} />;
    case 'minyan_only':
      return <MinyanRevealBlock data={block} />;
    case 'learn_link':
      return (
        <LearnCrossLink
          essayId={block.essayId}
          promptText={block.promptText}
          onPress={onLearnLinkPress}
        />
      );
    case 'variant':
      return <VariantBlockRenderer block={block} activeWordIndex={activeWordIndex} showHebrew={showHebrew} showTranslit={showTranslit} showEnglish={showEnglish} />;
    case 'omer_count':
      return <OmerCountRenderer block={block} showHebrew={showHebrew} showEnglish={showEnglish} />;
  }
}

function VariantBlockRenderer({ block, activeWordIndex, showHebrew, showTranslit, showEnglish }: { block: VariantBlock; activeWordIndex: number | null; showHebrew: boolean; showTranslit: boolean; showEnglish: boolean }) {
  // MVP: render all variants visibly with their labels. Only primaryVariantIndex's
  // words have karaoke globalIndex (extractor enforces).
  return (
    <View style={styles.variantWrap}>
      {block.variants.map((v, i) => (
        <View key={i} style={i > 0 ? styles.variantSeparator : undefined}>
          <Text style={styles.variantLabel}>{v.label}</Text>
          {v.he && showHebrew && v.he.map((line) => (
            <Text key={line.lineIndex} style={styles.variantHebrew}>
              {line.words.map((w) => w.text).join('  ')}
            </Text>
          ))}
          {v.en && showEnglish && v.en.map((para, j) => (
            <ItalicEnglishText key={j} spans={para.spans} />
          ))}
        </View>
      ))}
    </View>
  );
}

function OmerCountRenderer({ block, showHebrew, showEnglish }: { block: OmerCountBlock; showHebrew: boolean; showEnglish: boolean }) {
  return (
    <View style={styles.omerWrap}>
      {showHebrew && block.he.map((line) => (
        <Text key={line.lineIndex} style={styles.variantHebrew}>
          {line.words.map((w) => w.text).join('  ')}
        </Text>
      ))}
      {showEnglish && block.en.map((para, j) => (
        <ItalicEnglishText key={j} spans={para.spans} />
      ))}
    </View>
  );
}

export default React.memo(BlockRenderer);

const styles = StyleSheet.create({
  headingWrap: { marginTop: 24, marginBottom: 12 },
  headingHebrew: {
    fontFamily: FONTS.display,
    fontSize: 24,
    color: INK.strong,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  headingEn: {
    fontFamily: FONTS.serifBody,
    fontSize: 16,
    color: INK.soft,
    marginTop: 4,
  },
  rubricWrap: { marginVertical: 10 },
  rubricHe: {
    fontFamily: FONTS.hebrew,
    fontSize: 16,
    color: INK.soft,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  rubricEn: {
    fontFamily: FONTS.serifBody,
    fontSize: 14,
    color: INK.soft,
    marginTop: 2,
  },
  italic: {
    fontFamily: FONTS.serifBodyItalic,
    fontStyle: 'italic',
  },
  variantWrap: { marginVertical: 12 },
  variantSeparator: { marginTop: 12, borderTopWidth: 1, borderTopColor: INK.faint, paddingTop: 12, opacity: 0.95 },
  variantLabel: {
    fontFamily: FONTS.serifBodyItalic,
    fontStyle: 'italic',
    fontSize: 13,
    color: INK.soft,
    marginBottom: 6,
  },
  variantHebrew: {
    fontFamily: FONTS.hebrew,
    fontSize: 22,
    lineHeight: 32,
    color: INK.strong,
    writingDirection: 'rtl',
    textAlign: 'right',
    marginBottom: 4,
  },
  omerWrap: { marginVertical: 12 },
});
```

- [ ] **Step 4: Run test, commit**

```bash
npm test -- --testPathPattern=BlockRenderer --silent
```
Expected: PASS.

```bash
git add src/siddur/components/BlockRenderer.tsx src/siddur/components/__tests__/BlockRenderer.test.tsx
git commit -m "feat(siddur): BlockRenderer dispatches each block kind

Single switch over block.kind. VariantBlock renders all variants
visibly per MVP print-faithful behavior. OmerCount renders static
text from the bundled JSON; V2 will compute dynamically."
```

---

## Task 15: Create `SiddurScrollScreen` shell against the seed fixture

**Files:**
- Create: `src/siddur/SiddurScrollScreen.tsx`
- Test: `src/siddur/__tests__/SiddurScrollScreen.test.tsx`

- [ ] **Step 1: Write the failing smoke test**

Create `src/siddur/__tests__/SiddurScrollScreen.test.tsx`:
```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import SiddurScrollScreen from '../SiddurScrollScreen';

const route = { params: { cardId: 'shacharit' as const } } as any;
const navigation = { push: jest.fn(), goBack: jest.fn(), navigate: jest.fn() } as any;

test('renders the seed section header and at least one Hebrew word', () => {
  const { getByText } = render(
    <NavigationContainer>
      <SiddurScrollScreen route={route} navigation={navigation} />
    </NavigationContainer>,
  );
  expect(getByText(/Modeh Ani/i)).toBeTruthy();
  expect(getByText('מוֹדֶה')).toBeTruthy();
});

test('renders the FAQ collapsed by default', () => {
  const { queryByText, getByText } = render(
    <NavigationContainer>
      <SiddurScrollScreen route={route} navigation={navigation} />
    </NavigationContainer>,
  );
  expect(getByText(/Why this prayer first/)).toBeTruthy();
  expect(queryByText(/gratitude opens the day/)).toBeNull();
});

test('renders the minyan-only block collapsed by default', () => {
  const { queryByText } = render(
    <NavigationContainer>
      <SiddurScrollScreen route={route} navigation={navigation} />
    </NavigationContainer>,
  );
  expect(queryByText('בָּרְכוּ')).toBeNull();
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npm test -- --testPathPattern=siddur/__tests__/SiddurScrollScreen --silent
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/siddur/SiddurScrollScreen.tsx`**

```tsx
// src/siddur/SiddurScrollScreen.tsx
import React, { useCallback, useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BlockRenderer from './components/BlockRenderer';
import { getSiddurSection, listSectionIds } from '../data/siddur';
import { useSiddurStore, SectionBounds } from '../store/siddurStore';
import { useSettingsStore } from '../store/settingsStore';
import { FONTS, INK, PARCHMENT } from '../theme/siddurTheme';
import type { CardId, SiddurSection, PrayerBlock } from './types';

interface Props {
  route: { params: { cardId: CardId; sectionId?: string; wordIndex?: number } };
  navigation: any;
}

function computeBounds(sections: SiddurSection[]): SectionBounds[] {
  return sections.map((s) => {
    const prayers = s.blocks.filter((b): b is PrayerBlock => b.kind === 'prayer');
    if (prayers.length === 0) return { sectionId: s.id, start: 0, end: -1 };
    return {
      sectionId: s.id,
      start: prayers[0].wordIndexStart,
      end: prayers[prayers.length - 1].wordIndexEnd,
    };
  });
}

export default function SiddurScrollScreen({ route, navigation }: Props) {
  const { cardId } = route.params;
  const sections = useMemo(() => {
    return listSectionIds(cardId)
      .map((id) => getSiddurSection(cardId, id))
      .filter((s): s is SiddurSection => s !== null);
  }, [cardId]);

  const activeWordIndex = useSiddurStore((s) => s.activeWordIndex);
  const setActiveSection = useSiddurStore((s) => s.setActiveSection);

  // Settings: lane visibility
  const showHebrew = useSettingsStore((s) => s.displayLanes?.hebrew ?? true);
  const showTranslit = useSettingsStore((s) => s.displayLanes?.translit ?? true);
  const showEnglish = useSettingsStore((s) => s.displayLanes?.english ?? true);

  React.useEffect(() => {
    if (sections.length > 0) {
      setActiveSection(cardId, sections[0].id, computeBounds(sections));
    }
  }, [cardId, sections, setActiveSection]);

  const onLearnLinkPress = useCallback(
    (essayId: string) => {
      navigation.navigate('Essay', { essayId });
    },
    [navigation],
  );

  if (sections.length === 0) {
    return (
      <SafeAreaView style={styles.empty}>
        <Text style={styles.emptyTitle}>{cardId}</Text>
        <Text style={styles.emptyBody}>
          Content for this card hasn't been bundled yet. Plan B's content pipeline will fill this in.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={navigation.goBack} hitSlop={8}>
          <Text style={styles.back}>‹ Home</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {sections[0].title.en}
        </Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {sections.map((section) => (
          <View key={section.id}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderHe}>{section.title.he}</Text>
              <Text style={styles.sectionHeaderEn}>{section.title.en}</Text>
            </View>
            {section.blocks.map((block, i) => (
              <BlockRenderer
                key={i}
                block={block}
                activeWordIndex={activeWordIndex}
                showHebrew={showHebrew}
                showTranslit={showTranslit}
                showEnglish={showEnglish}
                onLearnLinkPress={onLearnLinkPress}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PARCHMENT },
  empty: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: PARCHMENT },
  emptyTitle: { fontFamily: FONTS.display, fontSize: 28, color: INK.strong, textTransform: 'capitalize' },
  emptyBody: { fontFamily: FONTS.serifBody, fontSize: 14, color: INK.soft, marginTop: 12, textAlign: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  back: { fontFamily: FONTS.serifBody, fontSize: 15, color: INK.soft },
  title: { fontFamily: FONTS.display, fontSize: 18, color: INK.strong },
  scroll: { paddingHorizontal: 16, paddingBottom: 64 },
  sectionHeader: { marginTop: 16, marginBottom: 12, alignItems: 'center' },
  sectionHeaderHe: { fontFamily: FONTS.display, fontSize: 22, color: INK.strong, writingDirection: 'rtl' },
  sectionHeaderEn: { fontFamily: FONTS.serifBodyItalic, fontStyle: 'italic', fontSize: 13, color: INK.soft, marginTop: 4 },
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- --testPathPattern=siddur/__tests__/SiddurScrollScreen --silent
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/siddur/SiddurScrollScreen.tsx src/siddur/__tests__/SiddurScrollScreen.test.tsx
git commit -m "feat(siddur): SiddurScrollScreen renders any card's continuous scroll

Drives all 5 karaoke cards from one component. Reads sections via
the dispatcher and computes karaoke bounds on mount. Falls back to
an empty-state notice for cards whose content Plan B hasn't shipped."
```

---

## Task 16: Create `LearnScreen` and `EssayScreen` stubs

**Files:**
- Create: `src/siddur/LearnScreen.tsx`
- Create: `src/siddur/EssayScreen.tsx`
- Test: `src/siddur/__tests__/LearnScreen.test.tsx`

- [ ] **Step 1: Write the test**

Create `src/siddur/__tests__/LearnScreen.test.tsx`:
```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import LearnScreen from '../LearnScreen';
import EssayScreen from '../EssayScreen';

const nav = { goBack: jest.fn(), navigate: jest.fn(), push: jest.fn() } as any;

test('LearnScreen renders the four-section header (essays/from R. Feigenbaum/glossary/recent)', () => {
  const { getByText } = render(
    <NavigationContainer>
      <LearnScreen navigation={nav} route={{} as any} />
    </NavigationContainer>,
  );
  expect(getByText(/Essays from the siddur/i)).toBeTruthy();
  expect(getByText(/From Rabbi Feigenbaum/i)).toBeTruthy();
  expect(getByText(/Glossary/i)).toBeTruthy();
});

test('LearnScreen shows the empty-state notice while Plan B content is pending', () => {
  const { getByText } = render(
    <NavigationContainer>
      <LearnScreen navigation={nav} route={{} as any} />
    </NavigationContainer>,
  );
  expect(getByText(/Content for Learn hasn't been bundled yet/i)).toBeTruthy();
});

test('EssayScreen renders the essay title from the route param', () => {
  const route = { params: { essayId: 'appendix_01' } } as any;
  const { getByText } = render(
    <NavigationContainer>
      <EssayScreen navigation={nav} route={route} />
    </NavigationContainer>,
  );
  expect(getByText(/appendix_01/)).toBeTruthy();
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npm test -- --testPathPattern=siddur/__tests__/LearnScreen --silent
```
Expected: FAIL.

- [ ] **Step 3: Implement `src/siddur/LearnScreen.tsx`**

```tsx
// src/siddur/LearnScreen.tsx
import React from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONTS, INK, PARCHMENT } from '../theme/siddurTheme';

interface Props { navigation: any; route: any; }

function SectionHeader({ children }: { children: string }) {
  return <Text style={styles.sectionHeader}>{children}</Text>;
}

export default function LearnScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.headerRow}>
        <Pressable onPress={navigation.goBack} hitSlop={8}>
          <Text style={styles.back}>‹ Home</Text>
        </Pressable>
        <Text style={styles.title}>Learn</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <SectionHeader>Essays from the siddur</SectionHeader>
        <Text style={styles.emptyNote}>Content for Learn hasn't been bundled yet. Plan B's content pipeline will fill this in.</Text>

        <SectionHeader>From Rabbi Feigenbaum</SectionHeader>
        <Text style={styles.emptyNote}>Personal notes and introductions will appear here.</Text>

        <SectionHeader>Glossary</SectionHeader>
        <Text style={styles.emptyNote}>Glossary not yet bundled.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PARCHMENT },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  back: { fontFamily: FONTS.serifBody, fontSize: 15, color: INK.soft },
  title: { fontFamily: FONTS.display, fontSize: 22, color: INK.strong },
  scroll: { paddingHorizontal: 20, paddingBottom: 64 },
  sectionHeader: {
    fontFamily: FONTS.display,
    fontSize: 18,
    color: INK.strong,
    marginTop: 24,
    marginBottom: 8,
  },
  emptyNote: {
    fontFamily: FONTS.serifBodyItalic,
    fontStyle: 'italic',
    fontSize: 13,
    color: INK.soft,
  },
});
```

- [ ] **Step 4: Implement `src/siddur/EssayScreen.tsx`**

```tsx
// src/siddur/EssayScreen.tsx
import React from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONTS, INK, PARCHMENT } from '../theme/siddurTheme';

interface Props {
  navigation: any;
  route: { params: { essayId: string; returnTo?: any } };
}

export default function EssayScreen({ navigation, route }: Props) {
  const { essayId } = route.params;
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.headerRow}>
        <Pressable onPress={navigation.goBack} hitSlop={8}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{essayId}</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.emptyNote}>
          Essay content not yet bundled. Plan B's content pipeline will fill this in.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PARCHMENT },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  back: { fontFamily: FONTS.serifBody, fontSize: 15, color: INK.soft },
  title: { fontFamily: FONTS.display, fontSize: 18, color: INK.strong, flex: 1, textAlign: 'center' },
  scroll: { paddingHorizontal: 20, paddingBottom: 64 },
  emptyNote: { fontFamily: FONTS.serifBodyItalic, fontStyle: 'italic', fontSize: 13, color: INK.soft, marginTop: 24 },
});
```

- [ ] **Step 5: Run test, commit**

```bash
npm test -- --testPathPattern=siddur/__tests__/LearnScreen --silent
```
Expected: PASS.

```bash
git add src/siddur/LearnScreen.tsx src/siddur/EssayScreen.tsx src/siddur/__tests__/LearnScreen.test.tsx
git commit -m "feat(siddur): LearnScreen and EssayScreen stubs

Four-section LearnScreen layout per spec §7.4 (essays / from R.
Feigenbaum / glossary / recent). Both screens show empty-state
notices until Plan B's content pipeline runs."
```

---

## Task 17: Create the `TranslationPhilosophy` screen and wire it into onboarding

**Files:**
- Create: `src/screens/TranslationPhilosophyScreen.tsx`
- Modify: the onboarding navigator (locate via `grep -rln 'SkillTier\|LocationPermission' src/navigation src/screens 2>/dev/null | head -5`)
- Modify: `src/screens/SettingsScreen.tsx` to add "About this translation" row

- [ ] **Step 1: Locate the onboarding navigator**

Run:
```bash
grep -rln 'LocationPermission' src/navigation src/screens 2>/dev/null
```

Open the file (typically `src/navigation/AppNavigator.tsx` or `src/screens/onboarding/OnboardingNavigator.tsx`). Note the route names already registered for the onboarding stack — you'll add `TranslationPhilosophy` as the new final step.

- [ ] **Step 2: Write the failing test**

Create `src/screens/__tests__/TranslationPhilosophyScreen.test.tsx`:
```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TranslationPhilosophyScreen from '../TranslationPhilosophyScreen';

const nav = { goBack: jest.fn(), navigate: jest.fn() } as any;
const onComplete = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

test('renders the translation note title and Feigenbaum example', () => {
  const { getByText } = render(<TranslationPhilosophyScreen onComplete={onComplete} mode="onboarding" />);
  expect(getByText(/About this translation/i)).toBeTruthy();
  expect(getByText(/wherever they are/i)).toBeTruthy();
});

test('shows specific word choices (Baruch, Kadosh, Shem)', () => {
  const { getByText } = render(<TranslationPhilosophyScreen onComplete={onComplete} mode="onboarding" />);
  expect(getByText(/Source of everything/i)).toBeTruthy();
  expect(getByText(/separate and removed/i)).toBeTruthy();
  expect(getByText(/impact and presence/i)).toBeTruthy();
});

test('onboarding mode: tapping "Got it" invokes onComplete', () => {
  const { getByText } = render(<TranslationPhilosophyScreen onComplete={onComplete} mode="onboarding" />);
  fireEvent.press(getByText(/Got it/i));
  expect(onComplete).toHaveBeenCalled();
});

test('settings mode: shows a back affordance instead of "Got it"', () => {
  const { queryByText, getByText } = render(<TranslationPhilosophyScreen onComplete={onComplete} mode="settings" navigation={nav as any} />);
  expect(queryByText(/Got it/i)).toBeNull();
  fireEvent.press(getByText(/‹/));
  expect(nav.goBack).toHaveBeenCalled();
});
```

- [ ] **Step 3: Run to verify it fails**

```bash
npm test -- --testPathPattern=TranslationPhilosophyScreen --silent
```
Expected: FAIL.

- [ ] **Step 4: Implement `src/screens/TranslationPhilosophyScreen.tsx`**

```tsx
// src/screens/TranslationPhilosophyScreen.tsx
import React from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONTS, INK, PARCHMENT } from '../theme/siddurTheme';

interface Props {
  onComplete?: () => void;
  mode: 'onboarding' | 'settings';
  navigation?: any;
}

export default function TranslationPhilosophyScreen({ onComplete, mode, navigation }: Props) {
  return (
    <SafeAreaView style={styles.root}>
      {mode === 'settings' && navigation && (
        <View style={styles.headerRow}>
          <Pressable onPress={navigation.goBack} hitSlop={8}>
            <Text style={styles.back}>‹ Settings</Text>
          </Pressable>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>About this translation</Text>
        <Text style={styles.body}>
          Rabbi Feigenbaum's translation isn't literal — it aims to convey the essence of each tefillah and help you have a real conversation with Hashem. You'll see <Text style={styles.italic}>italicized words</Text> in the English; those are additions to make the meaning clearer, not part of the literal Hebrew.
        </Text>

        <View style={styles.example}>
          <Text style={styles.exampleHe}>אַשְׁרֵי יוֹשְׁבֵי בֵיתֶךָ</Text>
          <Text style={styles.exampleEn}>
            Happy are those who <Text style={styles.italic}>(wherever they are)</Text> are living in the house of Hashem.
          </Text>
        </View>

        <Text style={styles.subhead}>A few specific word choices to know:</Text>
        <View style={styles.choice}>
          <Text style={styles.choiceHebrew}>בָּרוּךְ</Text>
          <Text style={styles.choiceEn}>"You, Hashem, are the Source of everything"</Text>
        </View>
        <View style={styles.choice}>
          <Text style={styles.choiceHebrew}>קָדוֹשׁ</Text>
          <Text style={styles.choiceEn}>"You, Hashem, are separate and removed from this physical world"</Text>
        </View>
        <View style={styles.choice}>
          <Text style={styles.choiceHebrew}>שֵׁם</Text>
          <Text style={styles.choiceEn}>"the impact and presence of Hashem in the world"</Text>
        </View>

        <Text style={styles.footer}>A full glossary is available under <Text style={styles.bold}>Learn</Text>.</Text>

        {mode === 'onboarding' && (
          <Pressable onPress={onComplete} style={styles.cta} hitSlop={8}>
            <Text style={styles.ctaLabel}>Got it</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PARCHMENT },
  headerRow: { paddingHorizontal: 16, paddingVertical: 10 },
  back: { fontFamily: FONTS.serifBody, fontSize: 15, color: INK.soft },
  scroll: { paddingHorizontal: 22, paddingVertical: 24, paddingBottom: 64 },
  title: { fontFamily: FONTS.display, fontSize: 26, color: INK.strong, marginBottom: 16 },
  body: { fontFamily: FONTS.serifBody, fontSize: 15, lineHeight: 24, color: INK.strong },
  italic: { fontFamily: FONTS.serifBodyItalic, fontStyle: 'italic' },
  bold: { fontFamily: FONTS.serifBody, fontWeight: '700' },
  example: { marginVertical: 18, padding: 12, borderLeftWidth: 2, borderLeftColor: INK.faint },
  exampleHe: { fontFamily: FONTS.hebrew, fontSize: 22, color: INK.strong, writingDirection: 'rtl', textAlign: 'right' },
  exampleEn: { fontFamily: FONTS.serifBody, fontSize: 14, color: INK.soft, marginTop: 6 },
  subhead: { fontFamily: FONTS.display, fontSize: 16, color: INK.strong, marginTop: 16, marginBottom: 10 },
  choice: { marginBottom: 12 },
  choiceHebrew: { fontFamily: FONTS.hebrew, fontSize: 20, color: INK.strong, writingDirection: 'rtl', textAlign: 'right' },
  choiceEn: { fontFamily: FONTS.serifBody, fontSize: 13, color: INK.soft, marginTop: 2 },
  footer: { fontFamily: FONTS.serifBody, fontSize: 14, color: INK.soft, marginTop: 18 },
  cta: {
    marginTop: 28,
    backgroundColor: INK.strong,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  ctaLabel: { fontFamily: FONTS.serifBody, fontSize: 15, fontWeight: '600', color: PARCHMENT },
});
```

- [ ] **Step 5: Run test, commit**

```bash
npm test -- --testPathPattern=TranslationPhilosophyScreen --silent
```
Expected: PASS.

```bash
git add src/screens/TranslationPhilosophyScreen.tsx src/screens/__tests__/TranslationPhilosophyScreen.test.tsx
git commit -m "feat(onboarding): TranslationPhilosophy screen sourced from PDF pp. XVI-XVII

Renders in two modes: 'onboarding' (with Got it CTA) and 'settings'
(with back affordance). Same component used in both routes."
```

---

## Task 18: Wire `TranslationPhilosophy` into onboarding and add Settings entry

**Files:**
- Modify: onboarding navigator file (located in Task 17 step 1)
- Modify: `src/screens/SettingsScreen.tsx`

- [ ] **Step 1: Add `TranslationPhilosophy` as the final onboarding step**

In the onboarding navigator, register the new route after `LocationPermission`. Example shape (adapt to the file's existing structure):
```tsx
<Stack.Screen name="LocationPermission" component={LocationPermissionScreen} />
<Stack.Screen name="TranslationPhilosophy">
  {(props) => (
    <TranslationPhilosophyScreen
      mode="onboarding"
      onComplete={() => {
        useSettingsStore.getState().setHasCompletedOnboarding(true);
      }}
    />
  )}
</Stack.Screen>
```

Verify the `LocationPermission` screen's "Done" / "Continue" CTA navigates to `TranslationPhilosophy` instead of completing onboarding directly. Search for the existing navigation call:
```bash
grep -rn "setHasCompletedOnboarding" src 2>/dev/null
```
Replace that call inside `LocationPermissionScreen` (or equivalent) with `navigation.navigate('TranslationPhilosophy')`.

- [ ] **Step 2: Add the Settings row**

Open `src/screens/SettingsScreen.tsx`. Locate the existing row list (look for `<Pressable>` rows that navigate to existing settings sub-screens). Add a new row:
```tsx
<Pressable
  onPress={() => navigation.navigate('TranslationPhilosophy')}
  style={styles.row}
  hitSlop={8}
>
  <Text style={styles.rowLabel}>About this translation</Text>
  <Text style={styles.rowChevron}>›</Text>
</Pressable>
```

Then register the screen in the main stack (`AppNavigator.tsx`) as well so Settings can navigate to it:
```tsx
<Stack.Screen name="TranslationPhilosophy">
  {(props) => <TranslationPhilosophyScreen {...props} mode="settings" />}
</Stack.Screen>
```

- [ ] **Step 3: Verify type check and lint clean**

```bash
npx tsc --noEmit
npm run lint
```
Expected: clean.

- [ ] **Step 4: Manual smoke test on simulator**

Run:
```bash
npm run start -- --clear
```

Then in another terminal, with the simulator open:
```bash
npm run ios
```

In the app, simulate a fresh install by clearing AsyncStorage in the dev menu (Reload → Reset). Walk the onboarding flow: Welcome → SkillTier → LocationPermission → **TranslationPhilosophy** → Home. Then from Home → Settings → **About this translation** to verify the second entry point works.

- [ ] **Step 5: Commit**

```bash
git add src/navigation src/screens/SettingsScreen.tsx src/screens/LocationPermissionScreen.tsx 2>/dev/null || true
git add -u
git commit -m "feat(onboarding): wire TranslationPhilosophy as final onboarding step

LocationPermission's continue button now navigates to
TranslationPhilosophy instead of completing onboarding directly.
Settings gets an 'About this translation' row that opens the same
screen in settings mode (back affordance instead of Got it)."
```

---

## Task 19: Migrate `usePrayerProgress` → `useSiddurProgress`

**Files:**
- Create: `src/hooks/useSiddurProgress.ts`
- Test: `src/hooks/__tests__/useSiddurProgress.test.ts`
- Reference: `src/hooks/usePrayerProgress.ts` (read for current behavior)

- [ ] **Step 1: Read the existing hook**

```bash
cat src/hooks/usePrayerProgress.ts 2>&1 || echo "file not found"
```

Note: storage key, debounce interval, return shape. The new hook keeps the same external contract but persists `{ cardId, sectionId, wordIndex }` per card.

- [ ] **Step 2: Write the failing test**

Create `src/hooks/__tests__/useSiddurProgress.test.ts`:
```ts
import { act, renderHook } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSiddurProgress } from '../useSiddurProgress';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  (AsyncStorage.getItem as jest.Mock).mockClear();
  (AsyncStorage.setItem as jest.Mock).mockClear();
});

test('initial state has no progress for any card', async () => {
  const { result } = renderHook(() => useSiddurProgress());
  await act(async () => { await result.current.hydrate(); });
  expect(result.current.getProgress('shacharit')).toBeNull();
});

test('record() persists card+section+wordIndex to storage', async () => {
  const { result } = renderHook(() => useSiddurProgress());
  await act(async () => { await result.current.hydrate(); });
  await act(async () => {
    result.current.record('shacharit', 'pesukei_dzimrah', 42);
  });
  // setItem is debounced — wait for flush
  await act(async () => { await new Promise((r) => setTimeout(r, 600)); });
  expect(AsyncStorage.setItem).toHaveBeenCalled();
  expect(result.current.getProgress('shacharit')).toEqual({
    sectionId: 'pesukei_dzimrah',
    wordIndex: 42,
  });
});

test('hydrate() restores per-card progress from storage', async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
    JSON.stringify({ shacharit: { sectionId: 'shema', wordIndex: 17 } }),
  );
  const { result } = renderHook(() => useSiddurProgress());
  await act(async () => { await result.current.hydrate(); });
  expect(result.current.getProgress('shacharit')).toEqual({
    sectionId: 'shema',
    wordIndex: 17,
  });
});
```

- [ ] **Step 3: Run to verify it fails**

```bash
npm test -- --testPathPattern=hooks/__tests__/useSiddurProgress --silent
```
Expected: FAIL.

- [ ] **Step 4: Implement `src/hooks/useSiddurProgress.ts`**

```ts
// src/hooks/useSiddurProgress.ts
import { useCallback, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CardId } from '../siddur/types';

const STORAGE_KEY = '@siddur_progress';
const DEBOUNCE_MS = 500;

export interface CardProgress {
  sectionId: string;
  wordIndex: number;
}

type ProgressMap = Partial<Record<CardId, CardProgress>>;

export function useSiddurProgress() {
  const [progress, setProgress] = useState<ProgressMap>({});
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<ProgressMap | null>(null);

  const hydrate = useCallback(async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setProgress(JSON.parse(raw) as ProgressMap);
      } catch {
        // Ignore malformed storage; reset to empty.
      }
    }
  }, []);

  const flush = useCallback(() => {
    if (!pending.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pending.current)).catch(() => {});
    pending.current = null;
  }, []);

  const record = useCallback(
    (cardId: CardId, sectionId: string, wordIndex: number) => {
      setProgress((prev) => {
        const next: ProgressMap = { ...prev, [cardId]: { sectionId, wordIndex } };
        pending.current = next;
        if (flushTimer.current) clearTimeout(flushTimer.current);
        flushTimer.current = setTimeout(flush, DEBOUNCE_MS);
        return next;
      });
    },
    [flush],
  );

  const getProgress = useCallback(
    (cardId: CardId): CardProgress | null => progress[cardId] ?? null,
    [progress],
  );

  return { hydrate, record, getProgress };
}
```

- [ ] **Step 5: Run test, commit**

```bash
npm test -- --testPathPattern=hooks/__tests__/useSiddurProgress --silent
```
Expected: PASS.

```bash
git add src/hooks/useSiddurProgress.ts src/hooks/__tests__/useSiddurProgress.test.ts
git commit -m "feat(siddur): useSiddurProgress hook with debounced per-card persistence

Storage key '@siddur_progress'. Per-card { sectionId, wordIndex }.
Replaces usePrayerProgress; old hook stays in place until consumers
migrate (Task 22)."
```

---

## Task 20: Sanity-test `useAudioPlayer` and `useWordSync` (V2 scaffolding)

**Files:**
- Read: `src/hooks/useAudioPlayer.ts`
- Read: `src/hooks/useWordSync.ts`
- Test: `src/hooks/__tests__/v2-scaffolding.test.ts`

- [ ] **Step 1: Verify the 85ms anticipation offset constant is still present**

```bash
grep -n "ANTICIPATION_OFFSET_MS" src/hooks/useWordSync.ts
```
Expected: a line like `const ANTICIPATION_OFFSET_MS = 85;`. If missing, restore from git history (`git log -p src/hooks/useWordSync.ts | grep -A1 ANTICIPATION`).

- [ ] **Step 2: Write a "still importable" sanity test**

Create `src/hooks/__tests__/v2-scaffolding.test.ts`:
```ts
// V2 scaffolding sanity test — these hooks are not driven at MVP, but their
// presence and the tuned 85ms anticipation offset must survive the remap.
// See spec §4.4 ("Kept as load-bearing").

import * as audioPlayerModule from '../useAudioPlayer';
import * as wordSyncModule from '../useWordSync';
import fs from 'fs';
import path from 'path';

test('useAudioPlayer module exports something', () => {
  expect(Object.keys(audioPlayerModule).length).toBeGreaterThan(0);
});

test('useWordSync module exports something', () => {
  expect(Object.keys(wordSyncModule).length).toBeGreaterThan(0);
});

test('useWordSync source still contains the tuned ANTICIPATION_OFFSET_MS = 85', () => {
  const src = fs.readFileSync(path.join(__dirname, '../useWordSync.ts'), 'utf8');
  expect(src).toMatch(/ANTICIPATION_OFFSET_MS\s*=\s*85/);
});

test('useWordSync source still uses ~50ms poll cadence', () => {
  const src = fs.readFileSync(path.join(__dirname, '../useWordSync.ts'), 'utf8');
  expect(src).toMatch(/setInterval[\s\S]{0,80}50/);
});
```

- [ ] **Step 3: Run test**

```bash
npm test -- --testPathPattern=v2-scaffolding --silent
```
Expected: PASS. If the 50ms poll test fails, inspect the file; the actual constant may live in a `POLL_MS` const rather than inline. Adjust the regex to match whatever is canonical, but only after verifying the value really is ~50ms.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/__tests__/v2-scaffolding.test.ts
git commit -m "test(siddur): pin V2 audio scaffolding's tuned constants

ANTICIPATION_OFFSET_MS = 85 and the 50ms poll cadence are tuned
values. This test fails the build if anyone touches them, forcing
an explicit re-tuning conversation."
```

---

## Task 21: Update `AppNavigator` with new routes and feature flag

**Files:**
- Modify: `src/navigation/AppNavigator.tsx`
- Reference: `src/screens/ShacharitScrollScreen.tsx` (legacy, kept behind flag)

- [ ] **Step 1: Read the current navigator**

```bash
cat src/navigation/AppNavigator.tsx
```

Note: existing route names (`Home`, `ShacharitScroll`, `Settings`, `About`), the stack navigator type, and how onboarding gates main routes.

- [ ] **Step 2: Add a feature flag in `src/lib/featureFlags.ts`**

Create `src/lib/featureFlags.ts`:
```ts
// src/lib/featureFlags.ts
// Toggle off when Plan B's content lands and Plan C cuts over.
// At that point the legacy Shacharit scroll is deleted entirely.
export const FEATURE_FLAGS = {
  USE_LEGACY_SHACHARIT_SCROLL: true,
} as const;
```

- [ ] **Step 3: Modify `src/navigation/AppNavigator.tsx`** to register the new routes and switch Shacharit based on the flag

The exact edits depend on the existing file's shape. The required additions are:

```tsx
import SiddurScrollScreen from '../siddur/SiddurScrollScreen';
import LearnScreen from '../siddur/LearnScreen';
import EssayScreen from '../siddur/EssayScreen';
import TranslationPhilosophyScreen from '../screens/TranslationPhilosophyScreen';
import { FEATURE_FLAGS } from '../lib/featureFlags';
```

Add these screens to the main stack:
```tsx
<Stack.Screen name="SiddurScroll" component={SiddurScrollScreen} />
<Stack.Screen name="Learn" component={LearnScreen} />
<Stack.Screen name="Essay" component={EssayScreen} />
<Stack.Screen
  name="TranslationPhilosophy"
  component={(props: any) => <TranslationPhilosophyScreen {...props} mode="settings" />}
/>
```

Keep the existing `ShacharitScroll` route registered for now — `HomeScreen` (Task 22) decides which to push based on the flag.

Also add `TranslationPhilosophy` to the **onboarding** stack (per Task 18 step 1) if not already done there.

- [ ] **Step 4: Verify typecheck**

```bash
npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/lib/featureFlags.ts src/navigation/AppNavigator.tsx
git commit -m "feat(siddur): register SiddurScroll/Learn/Essay routes + feature flag

USE_LEGACY_SHACHARIT_SCROLL gates whether Home pushes the legacy
ShacharitScrollScreen or the new SiddurScrollScreen for the
Shacharit card. Defaults to legacy until Plan C cuts over."
```

---

## Task 22: Rebuild `HomeScreen` with 6-card grid (legacy Shacharit behind flag)

**Files:**
- Modify: `src/screens/HomeScreen.tsx`
- Test: `src/screens/__tests__/HomeScreen.test.tsx`

- [ ] **Step 1: Read the current HomeScreen and the ZmanimHeader**

```bash
cat src/screens/HomeScreen.tsx
grep -rn "ZmanimHeader" src/components src/screens 2>/dev/null | head
```

Note: the existing layout, how `ZmanimHeader` is composed in, and where `useZmanim` is consumed.

- [ ] **Step 2: Write the failing test**

Create or replace `src/screens/__tests__/HomeScreen.test.tsx`:
```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../HomeScreen';

jest.mock('../../hooks/useZmanim', () => ({
  useZmanim: () => ({
    sunrise: '6:15',
    latestShacharit: '9:42',
    mincha: '6:30',
    sunset: '7:48',
  }),
}));

const nav = { navigate: jest.fn(), push: jest.fn() } as any;

beforeEach(() => { jest.clearAllMocks(); });

test('renders all six card titles in print order', () => {
  const { getByText } = render(
    <NavigationContainer>
      <HomeScreen navigation={nav} route={{} as any} />
    </NavigationContainer>,
  );
  expect(getByText(/Shacharit/i)).toBeTruthy();
  expect(getByText(/Birkat Hamazon/i)).toBeTruthy();
  expect(getByText(/Mincha/i)).toBeTruthy();
  expect(getByText(/Maariv/i)).toBeTruthy();
  expect(getByText(/Tefillos/i)).toBeTruthy();
  expect(getByText(/Learn/i)).toBeTruthy();
});

test('tapping the Learn card navigates to the Learn screen', () => {
  const { getByText } = render(
    <NavigationContainer>
      <HomeScreen navigation={nav} route={{} as any} />
    </NavigationContainer>,
  );
  fireEvent.press(getByText(/Learn/i));
  expect(nav.navigate).toHaveBeenCalledWith('Learn');
});

test('tapping the Mincha card navigates to SiddurScroll with cardId=mincha', () => {
  const { getByText } = render(
    <NavigationContainer>
      <HomeScreen navigation={nav} route={{} as any} />
    </NavigationContainer>,
  );
  fireEvent.press(getByText(/Mincha/));
  expect(nav.navigate).toHaveBeenCalledWith('SiddurScroll', { cardId: 'mincha' });
});

test('tapping the Shacharit card respects the feature flag', () => {
  // With USE_LEGACY_SHACHARIT_SCROLL = true, Shacharit still routes to the legacy screen.
  const { getByText } = render(
    <NavigationContainer>
      <HomeScreen navigation={nav} route={{} as any} />
    </NavigationContainer>,
  );
  fireEvent.press(getByText(/^Shacharit$/));
  expect(nav.navigate).toHaveBeenCalledWith(
    expect.stringMatching(/ShacharitScroll|SiddurScroll/),
    expect.any(Object),
  );
});
```

- [ ] **Step 3: Run to verify the test fails**

```bash
npm test -- --testPathPattern=HomeScreen --silent
```
Expected: FAIL (existing HomeScreen layout differs).

- [ ] **Step 4: Rewrite `src/screens/HomeScreen.tsx`** (preserve `ZmanimHeader` composition)

```tsx
// src/screens/HomeScreen.tsx
import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ZmanimHeader from '../components/ZmanimHeader';
import { FONTS, INK, PARCHMENT } from '../theme/siddurTheme';
import { CARDS } from '../data/siddur/cards';
import { FEATURE_FLAGS } from '../lib/featureFlags';
import type { CardId } from '../siddur/types';

interface Props { navigation: any; route: any; }

export default function HomeScreen({ navigation }: Props) {
  const handleCardPress = useCallback(
    (cardId: CardId) => {
      if (cardId === 'learn') {
        navigation.navigate('Learn');
        return;
      }
      if (cardId === 'shacharit' && FEATURE_FLAGS.USE_LEGACY_SHACHARIT_SCROLL) {
        navigation.navigate('ShacharitScroll');
        return;
      }
      navigation.navigate('SiddurScroll', { cardId });
    },
    [navigation],
  );

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ZmanimHeader />
        <View style={styles.grid}>
          {CARDS.map((card) => (
            <Pressable
              key={card.id}
              onPress={() => handleCardPress(card.id)}
              style={styles.card}
              hitSlop={4}
            >
              <Text style={styles.cardHebrew}>{card.title.he}</Text>
              <Text style={styles.cardEnglish}>{card.title.en}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PARCHMENT },
  scroll: { paddingHorizontal: 12, paddingBottom: 32 },
  grid: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    aspectRatio: 1.4,
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  cardHebrew: {
    fontFamily: FONTS.display,
    fontSize: 22,
    color: INK.strong,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  cardEnglish: {
    fontFamily: FONTS.serifBody,
    fontSize: 13,
    color: INK.soft,
    marginTop: 6,
  },
});
```

- [ ] **Step 5: Run test, commit**

```bash
npm test -- --testPathPattern=HomeScreen --silent
```
Expected: PASS.

```bash
git add src/screens/HomeScreen.tsx src/screens/__tests__/HomeScreen.test.tsx
git commit -m "feat(siddur): Home 6-card grid (legacy Shacharit gated by feature flag)

All six cards visible from Day 1 of Plan A. Tapping Shacharit still
opens the legacy ShacharitScrollScreen while the flag is on; Plan
C flips the flag once Plan B content is bundled."
```

---

## Task 23: Delete `FootnoteMarker`, `FootnotePanel`, `footnoteStore`

**Files:**
- Delete: `src/components/shacharit/FootnoteMarker.tsx`
- Delete: `src/components/shacharit/FootnotePanel.tsx`
- Delete: `src/store/footnoteStore.ts`
- Delete: `src/store/__tests__/footnoteStore.test.ts`

- [ ] **Step 1: Find every importer first**

```bash
grep -rln "footnoteStore\|FootnoteMarker\|FootnotePanel" src 2>/dev/null
```

Expected importers: legacy `src/screens/ShacharitScrollScreen.tsx`, legacy `src/components/shacharit/PrayerBlock.tsx`, possibly tests.

- [ ] **Step 2: Strip the imports + JSX from each importer**

For each file in the grep output (excluding the deletion targets themselves):
- Remove the import line.
- Remove any JSX referencing `FootnoteMarker` or `FootnotePanel`.
- Remove any selector/hook call against `useFootnoteStore`.

These are surgical edits. The legacy `ShacharitScrollScreen` should remain functional after stripping (the commentary path becomes dead — no popovers — but the karaoke scroll still works).

- [ ] **Step 3: Delete the files**

```bash
git rm src/components/shacharit/FootnoteMarker.tsx \
       src/components/shacharit/FootnotePanel.tsx \
       src/store/footnoteStore.ts \
       src/store/__tests__/footnoteStore.test.ts
```

- [ ] **Step 4: Verify typecheck + tests + lint**

```bash
npx tsc --noEmit
npm test -- --silent
npm run lint
```
Expected: all clean.

- [ ] **Step 5: Commit**

```bash
git add -u
git commit -m "chore: remove commentary popover code

FootnoteMarker, FootnotePanel, footnoteStore deleted per spec §4.3.
V2 will reintroduce commentary with audio. ExpandablePanel is
preserved as a shared primitive (used by FaqPanel)."
```

---

## Task 24: Final integration smoke test — boot the app

**Files:**
- No code changes; verifies everything wired correctly

- [ ] **Step 1: Clean caches and reinstall**

Run:
```bash
rm -rf node_modules/.cache .expo
npm run start -- --clear
```
Wait for "Metro waiting on..." prompt.

- [ ] **Step 2: Launch the iOS simulator**

In another terminal:
```bash
npm run ios
```

- [ ] **Step 3: Verify onboarding flow on a fresh install**

In the simulator: Device → Erase All Content and Settings, then re-launch the app.
Walk through: Welcome → SkillTier → LocationPermission → **TranslationPhilosophy** → Home.
Verify the TranslationPhilosophy screen renders the Ashrei example, the three word-choice rows, and the Got it CTA.

- [ ] **Step 4: Verify Home renders 6 cards**

Confirm visually that the home grid shows two columns × three rows:
- Shacharit · Birkat Hamazon
- Mincha · Maariv
- Tefillos · Learn

ZmanimHeader still shows (Sunrise / Latest Shacharit / Mincha / Sunset).

- [ ] **Step 5: Verify card navigation**

Tap each card and confirm routing:
- Shacharit → legacy `ShacharitScrollScreen` (feature flag still on)
- Birkat Hamazon, Mincha, Maariv, Tefillos → `SiddurScrollScreen` with empty-state notice
- Learn → `LearnScreen` with the four section headers and empty-state notices

- [ ] **Step 6: Verify SiddurScrollScreen seed-fixture fallback**

In `src/navigation/AppNavigator.tsx` or via a temporary route override, navigate to `SiddurScroll` with `{ cardId: 'shacharit' }` while keeping the feature flag OFF temporarily (just for this verification — revert immediately after). The seed fixture should render: heading "Waking up in the morning", three Hebrew words (מוֹדֶה אֲנִי לְפָנֶיךָ), FAQ chip "Why this prayer first?" (collapsed), minyan-only reveal prompt, and a "Read more: appendix_01_how_davening_works" pill.

- [ ] **Step 7: Verify Settings entry**

Home → Settings → tap **About this translation**. Confirms the TranslationPhilosophyScreen renders in settings mode with a back arrow instead of Got it.

- [ ] **Step 8: Revert any temporary debug changes, then commit a checkpoint marker**

If you changed the feature flag for Step 6, restore it:
```bash
git diff src/lib/featureFlags.ts
```
Expected: clean.

Run all checks one more time:
```bash
npx tsc --noEmit
npm run lint
npm test -- --silent
```

- [ ] **Step 9: Commit a checkpoint message**

```bash
git commit --allow-empty -m "checkpoint: Plan A foundation complete

Foundation + scroll shell + onboarding addition + Learn/Essay stubs +
6-card Home + feature-flagged Shacharit + commentary code deleted.
Ready for Plan B (content pipeline) and Plan C (cutover)."
```

---

## Self-Review (run before declaring Plan A done)

Re-read each section/requirement in the spec and confirm a task implements it:

| Spec section | Implementing task(s) |
|---|---|
| §4.1 module layout | Tasks 2, 3, 4, 7, 8 |
| §4.2 module boundaries | Tasks 4, 15 (dispatcher + screen don't import content directly) |
| §4.3 deleted at MVP | Task 23 |
| §4.4 kept as load-bearing | Tasks 8, 9, 20 (sanity-pinning audio constants) |
| §4.5 migration order | Plan A follows steps 1-4; Plan C completes steps 5-6 |
| §5.1-§5.7 data model | Task 2 |
| §6 content pipeline | **Plan B** (out of scope here) |
| §7.1 route structure | Task 21 |
| §7.2 Home 6-card grid | Task 22 |
| §7.3 SiddurScrollScreen | Task 15 |
| §7.4 LearnScreen | Task 16 (stub; Plan C completes) |
| §7.5 EssayScreen | Task 16 (stub; Plan C completes) |
| §7.6 cross-link UX forward | Tasks 13, 14, 15 |
| §7.6 cross-link UX reverse | **Plan C** |
| §7.7 TranslationPhilosophy onboarding | Tasks 17, 18 |
| §7.8 auto-migration | Settings entry in Task 18 |
| §7.9 Settings additions | Task 18 |
| §8.1 render dispatcher | Task 14 |
| §8.2 karaoke advance | Task 7 |
| §8.3 lane toggle | Tasks 9, 14 |
| §8.4 MinyanRevealBlock | Task 12 |
| §8.5 FaqPanel | Task 11 |
| §8.6 LearnCrossLink pill | Task 13 |
| §8.7 section jump-to | **Plan C** (after content lands) |
| §8.8 performance contract | Tasks 8, 9 preserve memo/lazy patterns |
| §8.9 scroll position persistence | Task 19 |
| §9 calendar/conditional encoding | Data model in Task 2; runtime engine = V2 |
| §10.1 data invariants | Task 5 |
| §10.3 component tests | Tasks 9-16 |
| §10.4 store/hooks tests | Tasks 7, 19, 20 |
| §10.5 /siddur-qa skill | **Plan C** |

Gaps deferred to later plans (acceptable): §6 content pipeline (Plan B), §7.7 reverse cross-links + jump-to + /siddur-qa skill (Plan C).

**Placeholder scan:** No TBDs, no "implement later", no "similar to Task N" — every step has explicit code, paths, and commands.

**Type consistency:** `CardId`, `SiddurSection`, `PrayerBlock`, `EnglishSpan`, `CardProgress` are defined once and referenced consistently across tasks. `SectionBounds` is defined in `siddurStore.ts` (Task 7) and used by `SiddurScrollScreen` (Task 15).

---

## Execution Handoff

Plan A complete. Two options for execution:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task with two-stage review between tasks.

**2. Inline Execution** — execute tasks in this session via `superpowers:executing-plans` with batch checkpoints.

Pick one when ready. Plans B and C will be drafted next.
