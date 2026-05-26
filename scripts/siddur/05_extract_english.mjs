/**
 * Stage 05 — Extract English paragraphs with Feigenbaum italics preserved.
 *
 * For each *.hebrew.json in intermediate/sections/:
 *
 * prayer blocks:
 *   - Filter out runs containing Hebrew letters (Unicode range א–ת).
 *   - Apply runsToSpans() to remaining (English/transliteration) runs.
 *   - Split into paragraphs on double-whitespace/newline sequences.
 *   - Detect inline FAQ / Instant Insight paragraphs and mark with _sidebarKind.
 *   - Store as en: EnglishParagraph[] on the block.
 *
 * faq / instant_insight / callout blocks:
 *   - Apply runsToSpans() to all runs.
 *   - Split into paragraphs.
 *   - Store as body: EnglishParagraph[].
 *   - Remove runs field.
 *
 * heading blocks:
 *   - Apply runsToSpans() to all runs.
 *   - Extract Hebrew text as he: string.
 *   - Extract English text as en: string.
 *   - Remove runs field.
 *
 * rubric blocks:
 *   - Store rawText as text: { en: rawText }.
 *   - Remove runs field.
 *
 * Write to intermediate/sections/{id}.english.json
 */

import fs from 'fs';
import path from 'path';
import { INTERMEDIATE_DIR, ensureDir } from './utils/paths.mjs';
import { runsToSpans } from './utils/italicDetect.mjs';

const SECTIONS_DIR = path.join(INTERMEDIATE_DIR, 'sections');

ensureDir(SECTIONS_DIR);

// Hebrew character range (covers all Hebrew letters including finals).
const HEBREW_RE = /[א-ת]/;

// Paragraph break: two or more consecutive whitespace chars including newlines.
// We split the *run texts* at these boundaries before building spans.
// We look for \n\n or multi-space/newline combos.
const PARA_BREAK_RE = /\n\n+|(?:\r?\n){2,}/;

/**
 * Detects whether a paragraph's first span text starts with a sidebar marker.
 * @param {Array<{text: string, style?: string}>} spans
 * @returns {'faq' | 'instant_insight' | null}
 */
function detectSidebarKind(spans) {
  if (!spans.length) return null;
  const firstText = spans[0].text.trimStart();
  if (
    firstText.startsWith('FAQ') ||
    firstText.startsWith('Q:') ||
    firstText.startsWith('Question:')
  ) {
    return 'faq';
  }
  if (firstText.startsWith('Instant Insight')) {
    return 'instant_insight';
  }
  return null;
}

/**
 * Given an array of runs, splits them into paragraph groups based on double-
 * newline (or similar) separators in the run texts, then converts each group
 * into an EnglishParagraph via runsToSpans().
 *
 * @param {Array<{text: string, italic: boolean, bold: boolean}>} runs
 * @returns {Array<{spans: Array<{text: string, style?: string}>}>}
 */
function runsToParagraphs(runs) {
  // We walk through runs, accumulating groups. When we encounter a run whose
  // text contains a paragraph-break sequence, we split it at the first break
  // and start a new group.

  /** @type {Array<Array<{text: string, italic: boolean, bold: boolean}>>} */
  const groups = [[]];

  for (const run of runs) {
    const parts = run.text.split(PARA_BREAK_RE);
    if (parts.length === 1) {
      // No paragraph break in this run — append to current group.
      groups[groups.length - 1].push(run);
    } else {
      // There are one or more paragraph breaks in this run's text.
      for (let i = 0; i < parts.length; i++) {
        if (i === 0) {
          // First part belongs to the current (last) group.
          if (parts[i]) {
            groups[groups.length - 1].push({ ...run, text: parts[i] });
          }
        } else {
          // Start a new group for each subsequent part.
          groups.push([]);
          if (parts[i]) {
            groups[groups.length - 1].push({ ...run, text: parts[i] });
          }
        }
      }
    }
  }

  // Convert each group of runs to spans, discarding empty paragraphs.
  const paragraphs = [];
  for (const group of groups) {
    const spans = runsToSpans(group);
    if (spans.length > 0) {
      paragraphs.push({ spans });
    }
  }

  return paragraphs;
}

// Find all hebrew JSON files.
const hebrewFiles = fs
  .readdirSync(SECTIONS_DIR)
  .filter(f => f.endsWith('.hebrew.json'))
  .sort();

console.log(`Stage 05: processing ${hebrewFiles.length} section(s)…`);

const globalStats = {
  sections: 0,
  totalPrayerBlocks: 0,
  totalEnglishParagraphs: 0,
  totalItalicSpans: 0,
  sidebarParagraphsDetected: 0,
};

for (const filename of hebrewFiles) {
  const sectionId = filename.replace('.hebrew.json', '');
  const inPath = path.join(SECTIONS_DIR, filename);
  const outPath = path.join(SECTIONS_DIR, `${sectionId}.english.json`);

  const data = JSON.parse(fs.readFileSync(inPath, 'utf8'));

  let sectionPrayerBlocks = 0;
  let sectionEnParagraphs = 0;
  let sectionItalicSpans = 0;

  const outputBlocks = data.blocks.map(block => {
    const kind = block.kind;

    // ── prayer ──────────────────────────────────────────────────────────────
    if (kind === 'prayer') {
      const runs = block.runs || [];

      // Filter out runs containing any Hebrew letters.
      const englishRuns = runs.filter(run => !HEBREW_RE.test(run.text));

      // Split into paragraphs and convert to spans.
      const paragraphs = runsToParagraphs(englishRuns);

      // Detect inline FAQ / Instant Insight paragraphs.
      const annotatedParagraphs = paragraphs.map(para => {
        const sidebarKind = detectSidebarKind(para.spans);
        if (sidebarKind) {
          globalStats.sidebarParagraphsDetected++;
          return { ...para, _sidebarKind: sidebarKind };
        }
        return para;
      });

      // Count italic spans for stats.
      for (const para of annotatedParagraphs) {
        for (const span of para.spans) {
          if (span.style === 'italic') sectionItalicSpans++;
        }
      }

      sectionPrayerBlocks++;
      sectionEnParagraphs += annotatedParagraphs.length;

      // Keep runs off the output (they've been processed); retain he and other fields.
      const { runs: _removed, ...restBlock } = block;
      return {
        ...restBlock,
        en: annotatedParagraphs,
      };
    }

    // ── faq / instant_insight / callout ─────────────────────────────────────
    if (kind === 'faq' || kind === 'instant_insight' || kind === 'callout') {
      const runs = block.runs || [];
      const paragraphs = runsToParagraphs(runs);

      for (const para of paragraphs) {
        for (const span of para.spans) {
          if (span.style === 'italic') sectionItalicSpans++;
        }
      }

      const { runs: _removed, ...restBlock } = block;
      return {
        ...restBlock,
        body: paragraphs,
      };
    }

    // ── heading ──────────────────────────────────────────────────────────────
    if (kind === 'heading') {
      const runs = block.runs || [];
      const spans = runsToSpans(runs);

      // Partition into Hebrew and English text.
      const hebrewParts = [];
      const englishParts = [];
      for (const span of spans) {
        if (HEBREW_RE.test(span.text)) {
          hebrewParts.push(span.text);
        } else {
          englishParts.push(span.text);
        }
      }

      const { runs: _removed, rawText, ...restBlock } = block;
      const result = { ...restBlock };

      if (hebrewParts.length > 0) {
        result.he = hebrewParts.join(' ').trim();
      }
      result.en = englishParts.join(' ').trim();

      // If rawText was present and en is empty, fall back to rawText.
      if (!result.en && rawText) {
        result.en = rawText.trim();
      }

      return result;
    }

    // ── rubric ────────────────────────────────────────────────────────────────
    if (kind === 'rubric') {
      const rawText = block.rawText || '';
      const { runs: _removedRuns, rawText: _removedRaw, ...restBlock } = block;
      return {
        ...restBlock,
        text: { en: rawText },
      };
    }

    // ── unknown — pass through unchanged ─────────────────────────────────────
    return { ...block };
  });

  const output = {
    sectionId: data.sectionId,
    cardId: data.cardId,
    pageStart: data.pageStart,
    pageEnd: data.pageEnd,
    blocks: outputBlocks,
  };

  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  globalStats.totalItalicSpans += sectionItalicSpans;
  globalStats.totalPrayerBlocks += sectionPrayerBlocks;
  globalStats.totalEnglishParagraphs += sectionEnParagraphs;
  globalStats.sections++;

  console.log(
    `  ${sectionId}: ${sectionPrayerBlocks} prayer blocks, ${sectionEnParagraphs} en-paragraphs, ${sectionItalicSpans} italic spans`
  );
}

console.log('\nStage 05 complete.');
console.log(`  Sections processed:       ${globalStats.sections}`);
console.log(`  Total prayer blocks:       ${globalStats.totalPrayerBlocks}`);
console.log(`  Total English paragraphs:  ${globalStats.totalEnglishParagraphs}`);
console.log(`  Total italic spans:        ${globalStats.totalItalicSpans}`);
console.log(`  Sidebar paragraphs found:  ${globalStats.sidebarParagraphsDetected}`);
