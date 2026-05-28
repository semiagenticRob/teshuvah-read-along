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

// ─── Commentary pairing helpers ───────────────────────────────────────────────

/**
 * Extract Hebrew base consonants (alef-tav only, no niqqud/cantillation/spaces).
 * @param {string} text
 * @returns {string}
 */
function extractHebConsonants(text) {
  return text.split('').filter(c => c >= 'א' && c <= 'ת').join('');
}

/**
 * Find which HebrewLine in heLines best matches the Hebrew lemma in rawText.
 * Uses consonant-level substring matching with an 8-character window.
 * Returns lineIndex of the matched line, or null if no confident match.
 *
 * @param {Array<{lineIndex: number, words: Array<{text: string}>}>} heLines
 * @param {string} rawText
 * @returns {number|null}
 */
function findAnchorLine(heLines, rawText) {
  const rawConsonants = extractHebConsonants(rawText);
  if (rawConsonants.length < 6) return null;

  // Build consonant strings for all lines once.
  const lineConsonants = heLines.map(line => ({
    lineIndex: line.lineIndex,
    consonants: extractHebConsonants(line.words.map(w => w.text).join('')),
  }));

  // Try windows from position 0 outward (window-first order so that the lemma
  // at the beginning of rawText takes precedence over later incidental matches).
  const maxStart = Math.min(rawConsonants.length - 8, 50);
  for (let start = 0; start <= maxStart; start++) {
    const sub = rawConsonants.slice(start, start + 8);
    if (sub.length < 6) continue;
    for (const { lineIndex, consonants } of lineConsonants) {
      if (consonants.includes(sub)) return lineIndex;
    }
  }
  return null;
}

/**
 * Extract the English explanation from a commentary callout's rawText.
 * Strips Hebrew chars, RTL/LTR marks, leading punctuation.
 * @param {string} rawText
 * @returns {string}
 */
function extractCommentaryEnglish(rawText) {
  return rawText
    .replace(/[ְ-ׇא-ת֑-֯]/g, '') // Hebrew + niqqud + cantillation
    .replace(/[​-‏‪-‮﻿]/g, '')          // directional marks
    .replace(/[^\x20-\x7E\n]/g, ' ')                             // remaining non-ASCII → space
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^[\s,\-—–‒()]+/, '')                // strip leading punctuation
    .trim();
}

// ─── Block kind classifier ────────────────────────────────────────────────────

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
  let sectionCommentaryPaired = 0;

  const outputBlocks = [];
  // Points at the processed prayer block most recently added to outputBlocks.
  // Commentary callout blocks that follow are paired into this block's en[].
  let currentPrayerBlock = null;

  for (const block of data.blocks) {
    const kind = block.kind;

    // ── heading / subsection — reset commentary target ────────────────────────
    if (kind === 'heading' || kind === 'subsection') {
      currentPrayerBlock = null;

      const runs = block.runs || [];
      const spans = runsToSpans(runs);
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
      if (hebrewParts.length > 0) result.he = hebrewParts.join(' ').trim();
      result.en = englishParts.join(' ').trim();
      if (!result.en && rawText) result.en = rawText.trim();
      outputBlocks.push(result);
      continue;
    }

    // ── prayer ──────────────────────────────────────────────────────────────
    if (kind === 'prayer') {
      const runs = block.runs || [];
      const englishRuns = runs.filter(run => !HEBREW_RE.test(run.text));
      const paragraphs = runsToParagraphs(englishRuns);
      const annotatedParagraphs = paragraphs.map(para => {
        const sidebarKind = detectSidebarKind(para.spans);
        if (sidebarKind) {
          globalStats.sidebarParagraphsDetected++;
          return { ...para, _sidebarKind: sidebarKind };
        }
        return para;
      });
      for (const para of annotatedParagraphs) {
        for (const span of para.spans) {
          if (span.style === 'italic') sectionItalicSpans++;
        }
      }
      sectionPrayerBlocks++;
      sectionEnParagraphs += annotatedParagraphs.length;
      const { runs: _removed, ...restBlock } = block;
      const prayerOut = { ...restBlock, en: annotatedParagraphs };
      outputBlocks.push(prayerOut);
      currentPrayerBlock = prayerOut;
      continue;
    }

    // ── faq / instant_insight / callout ──────────────────────────────────────
    if (kind === 'faq' || kind === 'instant_insight' || kind === 'callout') {
      // If a prayer block precedes this, treat it as verse-level commentary:
      // pair the English text with the matching Hebrew line in that block.
      if (currentPrayerBlock) {
        const rawText = block.rawText || '';
        const englishText = extractCommentaryEnglish(rawText);
        if (englishText.length > 10) {
          const anchorLine = currentPrayerBlock.he.length > 0
            ? findAnchorLine(currentPrayerBlock.he, rawText)
            : null;
          const para = anchorLine !== null
            ? { spans: [{ text: englishText }], anchorLine }
            : { spans: [{ text: englishText }] };
          currentPrayerBlock.en.push(para);
          sectionCommentaryPaired++;
          continue;
        }
        // Fall through to normal FaqPanel rendering if English text is too short.
      }

      // No preceding prayer block — render as standalone FaqPanel.
      const rawText = block.rawText || '';
      let paragraphs;
      if (rawText.trim().length > 0) {
        const cleaned = rawText
          .replace(/[א-ת֑-ׇ‏‎‪-‮]/g, '')
          .replace(/[^\x20-\x7E\n]/g, ' ')
          .replace(/[ \t]{2,}/g, ' ')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        const parts = cleaned.split(/\n\n+/).map(p => p.replace(/\s+/g, ' ').trim()).filter(Boolean);
        paragraphs = parts.map(text => ({ spans: [{ text }] }));
      } else {
        const runs = block.runs || [];
        paragraphs = runsToParagraphs(runs);
      }
      for (const para of paragraphs) {
        for (const span of para.spans) {
          if (span.style === 'italic') sectionItalicSpans++;
        }
      }
      const { runs: _removed, rawText: _rawRemoved, ...restBlock } = block;
      outputBlocks.push({ ...restBlock, body: paragraphs });
      continue;
    }

    // ── rubric ────────────────────────────────────────────────────────────────
    if (kind === 'rubric') {
      const rawText = block.rawText || '';
      const { runs: _removedRuns, rawText: _removedRaw, ...restBlock } = block;
      outputBlocks.push({ ...restBlock, text: { en: rawText } });
      continue;
    }

    // ── unknown — pass through unchanged ─────────────────────────────────────
    outputBlocks.push({ ...block });
  }

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

  const pairedNote = sectionCommentaryPaired > 0 ? `, ${sectionCommentaryPaired} commentary paired` : '';
  console.log(
    `  ${sectionId}: ${sectionPrayerBlocks} prayer blocks, ${sectionEnParagraphs} en-paragraphs, ${sectionItalicSpans} italic spans${pairedNote}`
  );
}

console.log('\nStage 05 complete.');
console.log(`  Sections processed:       ${globalStats.sections}`);
console.log(`  Total prayer blocks:       ${globalStats.totalPrayerBlocks}`);
console.log(`  Total English paragraphs:  ${globalStats.totalEnglishParagraphs}`);
console.log(`  Total italic spans:        ${globalStats.totalItalicSpans}`);
console.log(`  Sidebar paragraphs found:  ${globalStats.sidebarParagraphsDetected}`);
