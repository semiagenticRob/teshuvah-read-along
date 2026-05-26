# Feigenbaum Remap — Plan B: Content Pipeline

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Each stage below = one TDD-style task. Steps use `- [ ]` checkboxes.

**Goal:** Build the 11-stage PDF → JSON content pipeline and produce all bundled `SiddurSection` + `LearnEssay` JSON under `src/data/siddur/`.

**Architecture:** Eleven sequential Node ESM scripts under `scripts/siddur/`. Each reads previous-stage output, writes its own. Stages 03–09 are per-section and fan out across orchestrated subagents. Curated rules in `content/feigenbaum-2026/rules/` (hand-edited JSON) encode what can't be inferred algorithmically.

**Tech stack:** Node ESM · `pdftohtml` + `pdftotext` (poppler) via `execFileSync` (no shell) · Jest tests · plain JSON for rules + intermediate state.

**Spec reference:** `docs/superpowers/specs/2026-05-26-feigenbaum-siddur-remap-design.md` §6.

**Source PDF:** `/Users/robertwarren/Desktop/100Reps Project/Daven Along/218b_feigenbaum_interior_R1 - reprint Ashk.pdf` (296 pages).

**Depends on:** Plan A Task 2 (`src/siddur/types.ts`) and Plan A Task 5 (invariant tests — validate Plan B output).

**Conventions for every task:**
- Use `execFileSync('pdftohtml', [args])` / `execFileSync('pdftotext', [args])` — never shell out via `execSync` or template strings.
- Output paths come from `scripts/siddur/utils/paths.mjs` (Task 1). No hardcoded paths.
- Tests live at `scripts/siddur/__tests__/stageNN.test.mjs`. Per-stage tests run that stage and assert shape of its output.
- Commit after each task. Pipeline scripts use ESM `.mjs`.

---

## File structure

```
scripts/siddur/
  config.json                     paths config
  README.md                       run instructions
  utils/
    paths.mjs                     shared paths from config.json
    pdfHtmlParser.mjs             tokenize() + italicAwareRuns() for pdftohtml output
    hebrewTokenize.mjs            tokenizeHebrewLines() + assignGlobalIndices()
    italicDetect.mjs              runsToSpans() → EnglishSpan[]
  01_extract_raw.mjs              PDF → raw/full.html + raw/full.txt
  02_detect_sections.mjs          section_manifest.json from rules/sections.json
  03_classify_blocks.mjs          per-section block-kind classification
  04_extract_hebrew.mjs           Hebrew tokenization with globalIndex
  05_extract_english.mjs          English paragraphs + italic spans
  06_port_translit.mjs            port legacy Sefaria translit
  07_detect_minyan.mjs            MinyanOnlyBlock conversion + renumber
  08_tag_conditional.mjs          ConditionalTag + section.conditionalRule
  09_anchor_learn.mjs             LearnCrossLinkBlock + anchoredFrom reverse index
  10_assemble.mjs                 final SiddurSection JSON + per-card index.ts
  11_verify.mjs                   coverage / italic / translit / anchoring reports
  __tests__/
    stage01.test.mjs..stage11.test.mjs
content/feigenbaum-2026/
  config.json
  rules/
    sections.json                 TOC: { sections: [...], essays: [...] }
    minyan.json                   minyan block boundaries
    conditional.json              conditional rules per section/block
    learn_anchors.json            essayId → [{cardId, sectionId, position}]
    italic_overrides.json         fallback for italic detection misses
  raw/ (gitignored)
  intermediate/ (gitignored)
  reports/ (tracked, diffable)
src/data/siddur/                  output of stage 10
  cards.ts                        MODIFIED — populates sections from generated indexes
  shacharit/index.ts + *.json + *.translit.json
  birkat_hamazon/index.ts + ...
  mincha/, maariv/, tefillos/
  learn/index.ts + *.json
```

---

## Task 1 — Scaffolding

**Create:** `scripts/siddur/config.json`, `scripts/siddur/utils/paths.mjs`, `scripts/siddur/README.md`.

**Config shape** (`config.json`):
```json
{
  "pdfPath": "/Users/robertwarren/Desktop/100Reps Project/Daven Along/218b_feigenbaum_interior_R1 - reprint Ashk.pdf",
  "totalPages": 296,
  "rulesDir": "content/feigenbaum-2026/rules",
  "rawDir": "content/feigenbaum-2026/raw",
  "intermediateDir": "content/feigenbaum-2026/intermediate",
  "reportsDir": "content/feigenbaum-2026/reports",
  "outputDataDir": "src/data/siddur",
  "legacyTranslitDir": "src/data/bundled/shacharit"
}
```

**`paths.mjs`** exports `PDF_PATH`, `TOTAL_PAGES`, `RULES_DIR`, `RAW_DIR`, `INTERMEDIATE_DIR`, `REPORTS_DIR`, `OUTPUT_DATA_DIR`, `LEGACY_TRANSLIT_DIR`, `REPO_ROOT`, `ensureDir(p)`. Reads `config.json` once at import.

**Append to `.gitignore`:**
```
content/feigenbaum-2026/raw/
content/feigenbaum-2026/intermediate/
```

**Add to `package.json`:**
```json
"siddur:pipeline": "node scripts/siddur/01_extract_raw.mjs && node scripts/siddur/02_detect_sections.mjs && ... && node scripts/siddur/11_verify.mjs",
"siddur:verify": "node scripts/siddur/11_verify.mjs"
```

**Verify:** `node -e "import('./scripts/siddur/utils/paths.mjs').then(m => console.log(m.PDF_PATH))"` prints the PDF path.

**Commit:** `feat(pipeline): scaffolding — config, paths, README, .gitignore, npm script`

---

## Task 2 — Stage 01 (PDF → raw HTML + text)

**Create:** `scripts/siddur/01_extract_raw.mjs`, `__tests__/stage01.test.mjs`.

**Script body:** ensure `RAW_DIR`, then:
```js
execFileSync('pdftohtml', ['-i', '-noframes', '-fontfullname', '-enc', 'UTF-8', PDF_PATH, path.join(RAW_DIR, 'full')], { stdio: 'inherit' });
execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', PDF_PATH, path.join(RAW_DIR, 'full.txt')], { stdio: 'inherit' });
```

**Test assertions:**
- `raw/full.html` and `raw/full.txt` exist.
- HTML contains `סדור` (title page Hebrew) and at least one `<i>` tag (italic detection working).
- Text contains `Modeh Ani`.

**Commit:** `feat(pipeline): stage 01 — PDF → raw HTML + text via poppler`

---

## Task 3 — Stage 02 + author `rules/sections.json`

**Create:** `content/feigenbaum-2026/rules/sections.json`, `scripts/siddur/02_detect_sections.mjs`, `__tests__/stage02.test.mjs`.

**`sections.json`** must contain:
- 37 entries in `sections[]` (full TOC from spec §7 commentary): each `{ id, cardId, pageStart, pageEnd, title: { he, en } }`.
- 17 entries in `essays[]`: 12 appendices (1-12) + 2 personal notes (parents/teens) + 2 introductions (parents/teens) + 1 glossary. Each `{ id, essayKind, pageStart, pageEnd, title: { en } }`.

Page ranges sourced from the PDF's printed TOC (already verified earlier: Hashkamas HaBoker p.2, Birchos HaShachar p.10, ..., Mussaf for Chol Hamoed p.223-238, Appendix 1 p.242, ..., Glossary p.269).

**Script body:** read `rules/sections.json`, write `intermediate/section_manifest.json` with `{ sections, essays, generatedAt }`.

**Test assertions:**
- `section_manifest.json` exists.
- `sections.length === 37`, `essays.length === 17`.
- Each section: `cardId ∈ {shacharit, birkat_hamazon, mincha, maariv, tefillos}`, `1 ≤ pageStart ≤ pageEnd ≤ 296`.

**Commit:** `feat(pipeline): stage 02 + sections.json rules`

---

## Task 4 — Stage 03 (block classification)

**Create:** `scripts/siddur/utils/pdfHtmlParser.mjs`, `scripts/siddur/03_classify_blocks.mjs`, `__tests__/stage03.test.mjs`.

**`pdfHtmlParser.mjs`** exports:
- `tokenize(html)` → `[{ kind: 'open'|'close'|'text', tag?, text?, attrs? }]`. Strips entities (`&amp;` etc.). No external HTML parser.
- `italicAwareRuns(tokens)` generator → `{ text, italic, bold }` runs. Tracks depth of `<i>/<em>` and `<b>/<strong>`.

**Stage 03 script:** for each section in manifest, extract that PDF page range as HTML + layout text:
```js
const html = execFileSync('pdftohtml', ['-i', '-noframes', '-fontfullname', '-enc', 'UTF-8', '-f', String(s.pageStart), '-l', String(s.pageEnd), '-stdout', PDF_PATH], { encoding: 'utf8' });
const txt = execFileSync('pdftotext', ['-layout', '-f', String(s.pageStart), '-l', String(s.pageEnd), '-enc', 'UTF-8', PDF_PATH, '-'], { encoding: 'utf8' });
```

Then classify into blocks. Heuristics:
- Group runs into paragraphs by double-newline.
- First paragraph of a section → `heading`.
- Paragraph contains Hebrew letters `[א-ת]` → `prayer`.
- Starts with `FAQ` / `Q:` / `Question:` → `faq`.
- Contains `Instant Insight` → `instant_insight`.
- Starts with rubric prefix (`On `, `If `, `When `, `During `, etc.) AND italic AND no Hebrew → `rubric`.
- Else → `callout`.

Each block keeps `{ kind, rawText, runs }` (runs needed by stage 05).

**Output:** `intermediate/sections/{id}.classified.json` per section.

**Test assertions (use `borei_nefashos` as small fixture):**
- A classified file exists for each section.
- `borei_nefashos.classified.json` has at least one `prayer` block.
- Every block has `kind: string` and either `rawText` or further-stage-ready fields.

**Commit:** `feat(pipeline): stage 03 — block kind classification`

---

## Task 5 — Stage 04 (Hebrew tokenization + globalIndex)

**Create:** `scripts/siddur/utils/hebrewTokenize.mjs`, `scripts/siddur/04_extract_hebrew.mjs`, `__tests__/stage04.test.mjs`.

**`hebrewTokenize.mjs`:**
- `tokenizeHebrewLines(text)` → `[{ lineIndex, words: string[] }]`. Splits on newlines, filters lines lacking Hebrew letters, splits words on whitespace, keeps niqqud attached.
- `assignGlobalIndices(lines, start)` → `{ lines: HebrewLine[], nextIndex }`. Monotonic numbering.

**Stage 04 script:** for each `*.classified.json`, walk blocks; for each `prayer` block tokenize its `rawText`, assign indices, write `wordIndexStart/End`. Per-section index counter starts at 0 and is contiguous across all PrayerBlocks in that section.

**Output:** `intermediate/sections/{id}.hebrew.json`.

**Test assertions:**
- Tokenizer keeps `מוֹדֶה אֲנִי לְפָנֶיךָ` as 3 words with niqqud intact.
- `assignGlobalIndices([{words:['א','ב']},{words:['ג']}], 0)` → indices 0,1,2; `nextIndex=3`.
- For `borei_nefashos.hebrew.json`: prayer blocks have contiguous globalIndex starting at 0; `wordIndexStart`/`wordIndexEnd` match.

**Commit:** `feat(pipeline): stage 04 — Hebrew tokenization with contiguous globalIndex`

---

## Task 6 — Stage 05 (English with italic spans)

**Create:** `scripts/siddur/utils/italicDetect.mjs`, `scripts/siddur/05_extract_english.mjs`, `__tests__/stage05.test.mjs`.

**`italicDetect.mjs`:** `runsToSpans(runs)` → merges consecutive same-style runs into `EnglishSpan[]` (`{ text, style?: 'italic' | 'bold' }`). Strips empty.

**Stage 05 script:** for each `*.hebrew.json`:
- For `prayer` blocks: filter runs to non-Hebrew (drop `[א-ת]` runs), `runsToSpans`, split on double-newline → `EnglishParagraph[]` as `en[]`.
- For `faq`/`callout`/`instant_insight`: same span/paragraph extraction → `body[]`.
- For `rubric`: convert `rawText` → `{ text: { en: rawText } }`.
- For `heading`: convert `rawText` → `en: string`, plus `he?` if Hebrew detected.
- Drop intermediate `rawText` and `runs` fields.

**Output:** `intermediate/sections/{id}.english.json`.

**Test assertions:**
- `runsToSpans` merges consecutive non-italic runs but breaks at italic boundaries.
- Stage produces `*.english.json` per section.
- Aggregate italic span count across all sections > 50 (sanity — confirms `pdftohtml` italic detection working).

**Commit:** `feat(pipeline): stage 05 — English paragraphs with Feigenbaum italics preserved`

---

## Task 7 — Stage 06 (translit porting)

**Create:** `scripts/siddur/06_port_translit.mjs`, `__tests__/stage06.test.mjs`.

**Strategy:** legacy Sefaria translit at `src/data/bundled/shacharit/*.translit.json` has Hebrew + translit aligned line-by-line. For each new Hebrew line, pick the legacy line with the highest word-identity overlap and map word-by-word by Hebrew identity. Misses → `{ text: null }`, line `source: 'missing'`.

**Translit shape per block** (added to `prayer` blocks only):
```ts
translit?: { lineIndex: number; words: { text: string | null }[]; source: 'sefaria-ported' | 'feigenbaum-pdf' | 'missing' }[]
```

**Output:** `intermediate/sections/{id}.translit.json`.

**Test assertions:**
- For prayer blocks with translit: `translit[i].words.length === he[i].words.length`.
- Every translit line carries valid `source` value.

**Commit:** `feat(pipeline): stage 06 — port Sefaria-derived translit to new Hebrew structure`

---

## Task 8 — Stage 07 + 08 (minyan detection + conditional tagging)

**Create:** `content/feigenbaum-2026/rules/minyan.json`, `content/feigenbaum-2026/rules/conditional.json`, `scripts/siddur/07_detect_minyan.mjs`, `scripts/siddur/08_tag_conditional.mjs`, `__tests__/stage07_08.test.mjs`.

**`minyan.json` shape:**
```json
{ "blocks": [ { "sectionId": "...", "reason": "barchu|kedushah|birkas_cohanim|krias_hatorah|kaddish|other", "match": { "wholeSection": true } | { "rawTextContains": "..." } } ] }
```

Required entries: `barchu` (whole section), `krias_hatorah` (whole), Kedushah in `shemoneh_esrei_shacharit`/`mincha`/`maariv`/`mussaf_rosh_chodesh`/`mussaf_chol_hamoed` (match `קָדוֹשׁ קָדוֹשׁ קָדוֹשׁ`), Birkas Cohanim in Shemoneh Esrei (match `יְבָרֶכְךָ ה' וְיִשְׁמְרֶךָ`).

**Stage 07 script:** for each `*.translit.json`, apply minyan rules: convert qualifying `prayer` blocks → `minyan_only` with `reason` set, words get `globalIndex: -1`, then **renumber remaining prayer blocks** so word indices stay contiguous from 0.

**`conditional.json` shape:**
```json
{
  "sectionLevel": [ { "sectionId": "hallel", "rule": { "type": "hallel", "variant": "half" } }, ... ],
  "blockLevel": [ { "sectionId": "tachanun_shacharit", "blockMatch": { "wholeSection": true }, "rule": { "type": "skip_on", "days": [...] } }, ... ]
}
```

Required section-level: `hallel`, `mussaf_rosh_chodesh` (`rosh_chodesh_only`), `mussaf_chol_hamoed` (`chol_hamoed_only`), `sefiras_haomer` (`sefirah_only`), `maariv_motzaei_shabbos` (`motzaei_shabbos_only`).

Required block-level: `tachanun_shacharit` + `tachanun_mincha` (`skip_on` with full list), `avinu_malkeinu_shacharit` (`date_window` Tishrei 1-10), `ldovid_hashem_ori` (`date_window` Elul 1 → Tishrei 22), `krias_hatorah` (`days_of_week_only` Mon/Thu).

**Stage 08 script:** read each `*.minyan.json`, attach `section.conditionalRule` if section is in `sectionLevel`, build `conditionalTags[]` from `blockLevel` (for `wholeSection`: one tag per block index in section). Write `*.conditional.json`.

**Test assertions:**
- `barchu` section is all `minyan_only` blocks.
- Minyan-only words have `globalIndex < 0`.
- `tachanun_shacharit.conditional.json` has `conditionalTags` with at least one `skip_on` rule.
- `mussaf_rosh_chodesh.conditional.json` has `conditionalRule.type === 'rosh_chodesh_only'`.

**Commit:** `feat(pipeline): stages 07-08 — minyan detection + conditional tagging`

---

## Task 9 — Stage 09 (Learn anchoring, bidirectional)

**Create:** `content/feigenbaum-2026/rules/learn_anchors.json`, `scripts/siddur/09_anchor_learn.mjs`, `__tests__/stage09.test.mjs`.

**`learn_anchors.json` shape:**
```json
{ "anchors": [ { "essayId": "appendix_09_korbanos", "anchorAt": [ { "cardId": "shacharit", "sectionId": "pitum_haketores", "position": "before-first-prayer" | "after-last-prayer" } ] } ] }
```

Required minimum mappings:
- `appendix_01_how_davening_works` → before Birchos HaShachar
- `appendix_02_tzaddik_vra_lo` → before Tachanun (Shacharit)
- `appendix_03_positive_power_of_mistakes` → after Tachanun
- `appendix_04_am_segulah` → after Birchos HaShachar
- `appendix_05_bechirah_chofshis` → after Shemoneh Esrei (Shacharit)
- `appendix_06_siyata_dshmaya` → before Shemoneh Esrei (Shacharit)
- `appendix_07_all_hashem_does_is_good` → after Tachanun
- `appendix_08_material_world` → after Pesukei D'Zimrah
- `appendix_09_korbanos` → before Pitum HaKetores
- `appendix_10_making_hashem_happy` → before Pesukei D'Zimrah
- `appendix_11_ben_torah` → after Shloshah Asar Ikarim
- `appendix_12_halachos` → multiple anchors (Birchos HaShachar, Shemoneh Esrei, Mincha intro, Maariv intro)

**Stage 09 script — two passes:**
1. For each section's `*.conditional.json`: read `learn_anchors.json`, insert `LearnCrossLinkBlock` blocks at the indicated positions (before first `prayer` block or after last). Write `*.learn.json`.
2. For each essay in manifest: extract body text using same italic-aware approach as stages 03/05, populate `anchoredFrom` reverse-index from `learn_anchors.json`. Write `intermediate/essays/{id}.json`.

**Test assertions:**
- `pitum_haketores.learn.json` contains a `learn_link` block with `essayId === 'appendix_09_korbanos'`.
- `essays/appendix_09_korbanos.json` has `anchoredFrom` including `{ cardId: 'shacharit', sectionId: 'pitum_haketores' }`.
- `appendix_12_halachos` has `anchoredFrom.length >= 4`.

**Commit:** `feat(pipeline): stage 09 — Learn essay anchoring bidirectional`

---

## Task 10 — Stage 10 (assemble final JSON + per-card index.ts)

**Create:** `scripts/siddur/10_assemble.mjs`, `__tests__/stage10.test.mjs`. **Replace:** `src/data/siddur/index.ts` (Plan A's seed dispatcher) with one that consumes per-card index modules.

**Stage 10 script:** for each section's `*.learn.json`:
- Strip remaining intermediate fields (`rawText`, `runs`).
- Build final `SiddurSection` JSON conforming to `src/siddur/types.ts`.
- Extract translit per prayer block into a sidecar `{sectionId}.translit.json` shaped as `[{ blockIndex, translit: TranslitLine[] }]`.
- Write to `src/data/siddur/{cardId}/{sectionId}.json` (+ sidecar if present).

After all sections written, for each `cardId` generate `src/data/siddur/{cardId}/index.ts`:
```ts
// AUTO-GENERATED by scripts/siddur/10_assemble.mjs — do not edit
import type { SiddurSection } from '../../../siddur/types';
export const SECTIONS = {
  hashkamas_haboker: () => require('./hashkamas_haboker.json') as SiddurSection,
  birchos_hashachar: () => require('./birchos_hashachar.json') as SiddurSection,
  // ...
} as const;
```

Then for essays in `src/data/siddur/learn/index.ts`:
```ts
import type { LearnEssay } from '../../../siddur/types';
export const ESSAYS = {
  appendix_01_how_davening_works: () => require('./appendix_01_how_davening_works.json') as LearnEssay,
  // ...
} as const;
```

**Update `src/data/siddur/index.ts`** to import per-card `SECTIONS` and dispatch by `cardId + sectionId`. Drops the `fixtures/seed.json` thunk from Plan A — that fixture is retired now that real content lives at the same path layer.

**Test assertions:**
- `src/data/siddur/birkat_hamazon/borei_nefashos.json` exists, conforms to `SiddurSection`.
- `src/data/siddur/shacharit/index.ts` has lazy require thunks for every Shacharit section.
- `src/data/siddur/learn/appendix_09_korbanos.json` exists with `essayKind: 'appendix'`.

**Commit:** `feat(pipeline): stage 10 — assemble final JSON into src/data/siddur/`

---

## Task 11 — Stage 11 (verification reports)

**Create:** `scripts/siddur/11_verify.mjs`, `__tests__/stage11.test.mjs`. **Output:** `content/feigenbaum-2026/reports/*.md` (committed for diff review).

**Five reports:**

1. **`coverage_report.md`** — per section, extract Hebrew character stream from PDF (stripping whitespace + niqqud + ta'amim) and from JSON, assert equality. Each section line: `OK · cardId/sectionId · pdf=N json=N` or `FAIL · cardId/sectionId · pdf=N json=N`. **Build-blocker** if any FAIL.

2. **`translit_gaps.md`** — per section, count translit words and how many are `null`. Format: `cardId/sectionId: 47/52 words have translit (90%)`.

3. **`italic_audit.md`** — per section italic span count. Total at top: `Total italic spans: N`. Sorted ascending. Zero-italic sections flagged for manual review.

4. **`unanchored_essays.md`** — list essays with empty `anchoredFrom`. Format: `UNANCHORED  essay_id` or `OK (N)  essay_id`.

5. **`block_classification.md`** — per section histogram of block kinds.

**Test assertions:**
- All 5 reports exist after running.
- `coverage_report.md` has zero `FAIL` lines.
- `italic_audit.md` total > 50.

**Commit:** `feat(pipeline): stage 11 — verification reports (coverage, gaps, italics, anchoring)`

---

## Task 12 — Run pipeline + iterate + populate `cards.ts`

**Modify:** `src/data/siddur/cards.ts` to derive `sections: SectionRef[]` from generated per-card `SECTIONS`.

**Steps:**
1. `npm run siddur:pipeline` (full run).
2. Review `coverage_report.md`. For each FAIL: inspect PDF range, adjust `rules/minyan.json` (if a block was wrongly classified) or extend `03_classify_blocks.mjs` heuristic, re-run. Iterate until zero FAILs.
3. Review `italic_audit.md`. Sections with 0 italics: visually verify (some genuinely have none; others may need `italic_overrides.json` entries — file new follow-up task if any are real misses).
4. Update `src/data/siddur/cards.ts`:
   ```ts
   import { SECTIONS as SHACHARIT } from './shacharit';
   // ...
   function refs(loaders: Record<string, () => any>): SectionRef[] {
     return Object.entries(loaders).map(([id, load]) => {
       const data = load();
       return { id, title: data.title, pagePdf: data.sourcePages[0] };
     });
   }
   // CARDS uses refs(SHACHARIT), refs(BIRKAT), etc.
   ```
5. Run Plan A's invariant tests: `npm test -- --testPathPattern=siddur/__tests__/invariants --silent`. Fix any failures (typically: missing translit alignment, off-by-one indices). Re-run pipeline if needed.
6. Run `npm test -- --silent && npx tsc --noEmit && npm run lint`. All clean.

**Commit:** `feat(siddur): populate card section refs from bundled content`

---

## Multi-agent orchestration

Plan B fans out naturally — stages 03-09 are per-section. Two patterns:

**Stage-major (first pass):** for each stage 03-09, dispatch one subagent per ~10 sections. Workers receive stage + section list + rules. They return completed-section list + anomalies. Supervisor reviews anomalies between stages.

**Section-major (cleanup pass):** after stage 11 surfaces `FAIL` sections, dispatch one subagent per failing section. Worker inspects the PDF range, hypothesizes the cause, proposes a fix (rules edit or classifier patch), applies it, re-runs the pipeline scoped to that section, verifies.

**Supervisor never delegates:**
- `rules/sections.json` authoring (Task 3) — wrong page ranges cascade.
- `rules/minyan.json` + `rules/conditional.json` (Task 8) — halachic correctness.
- `coverage_report.md` review — silent data corruption is the worst outcome.

---

## Self-review

| Spec § | Tasks |
|---|---|
| §6.1 stages | 2-11 |
| §6.2 rules | 3, 8, 9 |
| §6.3 italic detection | 2, 6 |
| §6.4 idempotency | All stages disk → disk |
| §6.5 parallelization | Orchestration section above |
| §6.6 Hebrew coverage | 11 (build-blocker) |
| §6.6 word-index continuity | 5, 8 + Plan A invariants |
| §6.7 V2 commentary deferred | Explicit |

No placeholders. Type consistency: only Task 10's output conforms to `src/siddur/types.ts`; intermediate JSON is descriptive (classified/hebrew/english/translit/minyan/conditional/learn).

---

## Execution handoff

Subagent-driven recommended. Stage-major orchestration first; section-major for iterative cleanup.
