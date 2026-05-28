# Next Steps — Feigenbaum Siddur Transposition

> Resume point for the next session. Last touched 2026-05-28.
> Branch: `main` (this work is now on main after the transposition push).

## State at end of last session

- **270/270 PDF pages** analyzed via LLM-vision (Sonnet) and saved to `content/feigenbaum-2026/intermediate/llm_pages/p###.json` (gitignored, derived).
- **37/37 sections** regenerated in `src/data/siddur/{card}/{section}.json`.
- **37/37 sections pass** the structural validation gates in `scripts/siddur/validate_sections.py` (no chrome leaks, no stripped-lemma artifacts, all `anchorLine`s resolve, all `he[]` lines have Hebrew letters).
- **3 sections sim-verified** end-to-end: Mincha → Ashrei, Birkat Hamazon, Maariv. Hebrew with full niqqud + sof-pasuk, inline lemma preservation, no column-merge artifacts.
- **Shacharit content generated but invisible** behind `USE_LEGACY_SHACHARIT_SCROLL = true`. The legacy `ShacharitScrollScreen` still owns that route.

## Start here when resuming

### 1. Sim QA the remaining 34 sections (30–60 min)

Visual sweep with the simulator. Three goals:
- Confirm the prayer block renders (not just collapsed Notes)
- Confirm Hebrew niqqud + sof-pasuk are intact
- Confirm English commentary with inline lemmas appears next to its verse

Sections most at risk (worth opening first):
- **Shacharit Shemoneh Esrei** (86 blocks, 127 he-lines) — has the most conditional inserts and sidebars
- **Tachanun Shacharit** (119 he-lines) — mixed verse + paragraph layout
- **Mussaf Chol HaMoed** (68 blocks) — complex variant structures
- **Avinu Malkeinu (Shacharit + Mincha)** — already known to dump 20+ sidebars before the prayer renders
- **Krias HaTorah** (34 blocks, 146 he-lines) — first time Torah-reading flow is in the data

Suggested runbook: `npm run ios`, navigate to each card → each section, screenshot, eyeball against `content/feigenbaum-2026/intermediate/page_images/p###.png`.

### 2. Fix the known structural issues

**Sidebar placement (high impact)**
- Symptom: Avinu Malkeinu lists 20 collapsed Notes/Instant Insights *before* the prayer becomes visible.
- Root cause: `scripts/siddur/aggregate_llm_to_sections.py` emits in-prayer-region sidebars after the merged prayer block, not inline in document order.
- Fix: split the prayer block at sidebar boundaries so we get `prayer A → instant_insight → prayer B` in the natural PDF reading order.

**Rubric `ואומר חצי קדיש:` as recitable verse (Task 12)**
- Symptom: in Mincha Ashrei, the Hebrew rubric "and one says Chatzi Kaddish:" has a `globalIndex` and gets karaoke-ticked.
- Fix: in `aggregate_llm_to_sections.py`, when an LLM block's `kind` is `rubric` but it landed inside a prayer's `verse_hebrew` consolidation, emit it as a sibling `rubric` block rather than appending to `he[]`.

**Multi-prayer sections producing one merged prayer block**
- Symptom: `birchas_hamazon` (4 brachos), Shemoneh Esrei sections, and Hallel all flatten into one prayer block.
- Fix: split prayer blocks at `heading_section` (e.g. `אבות`, `גבורות`) boundaries so each bracha is its own prayer with its own English subtitle visible.

### 3. Cutover (the blocking ship decision)

**Task 3 — Flip `USE_LEGACY_SHACHARIT_SCROLL = false`**
- File to edit: search the repo for that constant.
- After flipping, the Shacharit card on Home routes to `SiddurScrollScreen` and consumes the new content.
- Visual QA at parity with the legacy experience before proceeding.

**Task 4 — Delete `ShacharitScrollScreen` + its dependencies**
- Only after Task 3 is confirmed.
- Grep for any remaining imports of the legacy screen.

### 4. Cross-validation (Task 15)

Run pdfplumber `extract_text()` per page and diff against the LLM's `hebrew_text` field for each `verse_hebrew` / `hebrew_paragraph` block. Flag any divergence above ~5% consonant overlap.

Quick implementation outline:
```python
# scripts/siddur/cross_validate.py
import pdfplumber, json, re
HEB = re.compile(r"[א-ת]")
def cons(s): return "".join(c for c in s if HEB.match(c))
# for each page:
#   plumb_text = page.extract_text()
#   llm_blocks = json.load(...)
#   for each verse_hebrew block:
#     llm_cons = cons(block["hebrew_text"])
#     plumb_cons = cons(plumb_text)
#     check llm_cons is subset (or 95% subset) of plumb_cons
```

### 5. Translit (Task 10)

One-line fix in `scripts/siddur/06_port_translit.mjs` — change `LEGACY_DIR` from hard-coded `bundled/shacharit/` to enumerating all `bundled/{card}/` directories. Then re-run stage 06 so Mincha/Maariv/BH/Tefillos translits stop coming back `null`.

### 6. `/siddur-qa` slash command (Task 5)

Create `.claude/commands/siddur-qa.md` modeled on `.claude/commands/shacharit-qa.md`. Should run:
1. `python3 scripts/siddur/validate_sections.py` (must report 37/37 pass)
2. `npx tsc --noEmit`
3. `npm test`
4. A simulator walkthrough checklist covering all 5 cards
5. Diff vs main to highlight what changed

## Key files / commands

| Need | Where |
|---|---|
| Re-render a PDF page to PNG | `python3 scripts/siddur/render_pages.py` |
| Re-aggregate all sections from cached LLM JSON | `python3 scripts/siddur/aggregate_llm_to_sections.py` |
| Re-aggregate one card only | `python3 scripts/siddur/aggregate_llm_to_sections.py mincha` |
| Validate all 37 sections | `python3 scripts/siddur/validate_sections.py` |
| Re-run a single page's LLM analysis | Dispatch an Agent with `subagent_type=general-purpose`, `model=sonnet`, prompt from any past dispatch in the transcript |
| Per-page LLM analysis output | `content/feigenbaum-2026/intermediate/llm_pages/p###.json` |
| Rendered PDF page images | `content/feigenbaum-2026/intermediate/page_images/p###.png` |
| Final app data | `src/data/siddur/{card}/{section}.json` |
| Source PDF | `/Users/robertwarren/Desktop/100Reps Project/Daven Along/218b_feigenbaum_interior_R1 - reprint Ashk.pdf` |

## Open architectural questions

- **Are 0-English sections legitimate?** `al_hamichyah`, `ldovid_hashem_maariv`, `tefillas_haderech` have 0 en-paragraphs. Some are intentionally Hebrew-only; some may be a missed dispatch. Spot-check the PDF pages for each.
- **How aggressive should the rubric extraction be?** Right now LLM emits `rubric` blocks but our aggregator collapses small rubrics into intro callouts. May want a dedicated render path.
- **Sidebar binding to verse**: currently we attach `anchorLine` to sidebar blocks when the LLM provided a `verse_anchor`. The renderer doesn't yet use this to position the sidebar adjacent to the bound verse — that's a `PrayerBlock.tsx` enhancement.

## Validation invariants (must keep passing)

Add to CI eventually:
```
python3 scripts/siddur/validate_sections.py   # 37/37 must pass
npx tsc --noEmit                              # no TS errors
npm test                                       # 12/12 pass
```
