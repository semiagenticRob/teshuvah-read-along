# Siddur Content Pipeline

Transforms the Feigenbaum Teen Siddur PDF into structured JSON for the DavenAlong app.

## What it does

Reads the Feigenbaum siddur PDF and produces per-prayer JSON files in the shape expected by `src/data/siddur/`. Each stage writes its output to `content/feigenbaum-2026/` before the final stage assembles app-ready JSON.

## How to run

```bash
# Full pipeline (all 11 stages)
npm run siddur:pipeline

# Verification only (stage 11)
npm run siddur:verify
```

## Stages

| Stage | Script | What it does |
|-------|--------|--------------|
| 01 | `01_extract_raw.mjs` | Extract raw text and layout data from the PDF |
| 02 | `02_detect_sections.mjs` | Detect section and prayer boundaries |
| 03 | `03_classify_blocks.mjs` | Classify text blocks (Hebrew / English / transliteration) |
| 04 | `04_extract_hebrew.mjs` | Extract and normalize Hebrew lines into `he[]` arrays |
| 05 | `05_extract_english.mjs` | Extract English into typed `textBlocks[]` (body / heading / subheading / faq / callout) |
| 06 | `06_port_translit.mjs` | Port existing Sefaria transliterations into the new structure |
| 07 | `07_detect_minyan.mjs` | Flag minyan-required content (Kaddish, Borchu, Kedushah, Birkat Cohanim) |
| 08 | `08_tag_conditional.mjs` | Tag calendar-conditional lines (`variantTag`, `simplifiedOmit`) |
| 09 | `09_anchor_learn.mjs` | Anchor inline commentary using the LEMMA — English pattern |
| 10 | `10_assemble.mjs` | Assemble final per-prayer JSON and write to `src/data/siddur/` |
| 11 | `11_verify.mjs` | Verify coverage, Hebrew integrity, and JSON shape |

## Notes

- All scripts are Node ESM (`.mjs`). Requires Node 18+.
- Pipeline config lives in `scripts/siddur/config.json`.
- Shared path utilities are in `scripts/siddur/utils/paths.mjs`.
- `content/feigenbaum-2026/raw/` and `content/feigenbaum-2026/intermediate/` are gitignored (large / derived).
- `content/feigenbaum-2026/reports/` is committed (human-readable verification output).
- Final app JSON lands in `src/data/siddur/`.
