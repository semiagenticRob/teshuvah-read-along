/**
 * Stage 03 — Block kind classification.
 *
 * For each section in section_manifest.json:
 *   1. Extract the page range using pdftohtml (HTML) and pdftotext (for paragraph analysis).
 *   2. Parse pdftotext paragraphs (blank-line separated) as the primary block boundaries.
 *   3. For each text-paragraph, find its corresponding italic/bold annotation from the HTML.
 *   4. Classify each paragraph block: prayer | heading | faq | instant_insight | rubric | callout
 *   5. Write intermediate/sections/{sectionId}.classified.json
 */

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import {
  PDF_PATH,
  INTERMEDIATE_DIR,
  ensureDir,
} from './utils/paths.mjs';
import { tokenize, italicAwareRuns } from './utils/pdfHtmlParser.mjs';

// ─── Paths ───────────────────────────────────────────────────────────────────

const MANIFEST_PATH = path.join(INTERMEDIATE_DIR, 'section_manifest.json');
const SECTIONS_OUT_DIR = path.join(INTERMEDIATE_DIR, 'sections');

ensureDir(SECTIONS_OUT_DIR);

// ─── Load manifest ────────────────────────────────────────────────────────────

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const sections = manifest.sections;

console.log(`Stage 03: classifying ${sections.length} sections…`);

// ─── Text utilities ──────────────────────────────────────────────────────────

/** True if string contains Hebrew letter (alef–tav). */
function hasHebrew(s) {
  return /[א-ת]/.test(s);
}

/** Collapse whitespace to single spaces. */
function normalizeWS(s) {
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Split a pdftotext layout string into raw paragraph strings.
 * Paragraph boundary = one or more blank lines.
 *
 * @param {string} txt
 * @returns {string[]}
 */
function splitTxtParagraphs(txt) {
  return txt
    .split(/\n[ \t]*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

/**
 * Build a flat array of all italic-aware runs from pdftohtml HTML,
 * stripping HTML structure tags (head, style, a, hr, etc.) and
 * keeping only runs with non-whitespace text.
 *
 * @param {string} html
 * @returns {Array<{text: string, italic: boolean, bold: boolean}>}
 */
function extractHtmlRuns(html) {
  const tokens = tokenize(html);

  // Filter tokens to only body content (skip head/style/meta)
  let inBody = false;
  let inSkipTag = 0; // depth counter for tags whose content we skip
  const SKIP_TAGS = new Set(['head', 'style', 'script', 'title', 'meta']);

  const bodyTokens = [];
  for (const tok of tokens) {
    if (tok.kind === 'open' && tok.tag === 'body') {
      inBody = true;
      continue;
    }
    if (tok.kind === 'close' && tok.tag === 'body') {
      inBody = false;
      continue;
    }
    if (!inBody) continue;

    if (tok.kind === 'open' && SKIP_TAGS.has(tok.tag)) {
      inSkipTag++;
      continue;
    }
    if (tok.kind === 'close' && SKIP_TAGS.has(tok.tag)) {
      inSkipTag = Math.max(0, inSkipTag - 1);
      continue;
    }
    if (inSkipTag > 0) continue;

    bodyTokens.push(tok);
  }

  const runs = [...italicAwareRuns(bodyTokens)];
  return runs.filter(r => r.text.trim().length > 0);
}

/**
 * Given a pdftotext paragraph and the full list of HTML runs from the same
 * page range, attempt to annotate the paragraph's text with italic/bold
 * information by fuzzy-matching runs.
 *
 * This is a best-effort approach: we normalize whitespace for matching.
 * We return an array of runs covering the paragraph text.
 *
 * @param {string} paraText - normalized paragraph text from pdftotext
 * @param {Array<{text:string,italic:boolean,bold:boolean}>} htmlRuns
 * @returns {Array<{text:string,italic:boolean,bold:boolean}>}
 */
function annotateParaRuns(paraText, htmlRuns) {
  // For paragraphs that are mostly ASCII (no Hebrew), attempt substring matching.
  // For paragraphs with Hebrew, the two-column layout makes reliable alignment hard.
  // Fall back to a single run with italic=false, bold=false.

  if (!paraText) return [];

  // Simple heuristic: if the paragraph is short enough, scan HTML runs for
  // a run whose normalized text closely contains the paragraph text.
  const normalized = normalizeWS(paraText);

  // Try to find all HTML runs whose text appears in the paragraph
  const matchedRuns = [];
  for (const run of htmlRuns) {
    const runNorm = normalizeWS(run.text);
    if (runNorm && normalized.includes(runNorm)) {
      matchedRuns.push(run);
    }
  }

  if (matchedRuns.length > 0) {
    return matchedRuns;
  }

  // Fallback: single plain run
  return [{ text: paraText, italic: false, bold: false }];
}

/**
 * Classify a paragraph into a block kind.
 *
 * Priority (in order):
 *   1. prayer           — has Hebrew letters [א-ת]
 *   2. faq              — starts with FAQ / Q: / Question: (case-insensitive)
 *   3. instant_insight  — contains "Instant Insight"
 *   4. rubric           — fully italic + no Hebrew + rubric trigger prefix
 *   5. heading          — first meaningful block + short (< 60 chars) + no Hebrew
 *   6. callout          — everything else
 *
 * @param {string} rawText
 * @param {Array<{text:string,italic:boolean,bold:boolean}>} runs
 * @param {boolean} isFirst
 * @returns {string}
 */
/**
 * Returns true if the text is predominantly Hebrew (prayer content) rather than
 * mostly English with a few quoted Hebrew words (commentary content).
 * Threshold: Hebrew base letters must make up ≥20% of non-whitespace characters.
 */
function isPredominantlyHebrew(text) {
  const nonWS = text.replace(/\s/g, '');
  if (!nonWS.length) return false;
  const heCount = (text.match(/[א-ת]/g) || []).length;
  return heCount / nonWS.length >= 0.20;
}

function classifyBlock(rawText, runs, isFirst) {
  if (!rawText) return null;

  // 1. Prayer — has Hebrew AND is predominantly Hebrew (≥20% Hebrew chars)
  if (hasHebrew(rawText) && isPredominantlyHebrew(rawText)) {
    return 'prayer';
  }

  // 2. FAQ
  if (/^(FAQ[:\s]|Q:\s|Question:\s)/i.test(rawText)) {
    return 'faq';
  }

  // 3. Instant Insight
  if (/Instant Insight/i.test(rawText)) {
    return 'instant_insight';
  }

  // 4. Rubric
  const allItalic = runs.length > 0 && runs.every(r => r.italic);
  if (allItalic && /^(On |If |When |During |Say |Recite )/i.test(rawText)) {
    return 'rubric';
  }

  // 5. Heading
  if (isFirst && rawText.length < 60) {
    return 'heading';
  }

  // 6. Callout
  return 'callout';
}

// ─── Main loop ────────────────────────────────────────────────────────────────

const stats = {
  total: 0,
  prayer: 0,
  heading: 0,
  faq: 0,
  instant_insight: 0,
  rubric: 0,
  callout: 0,
};

for (const section of sections) {
  const { id: sectionId, cardId, pageStart, pageEnd } = section;

  // 1. Extract HTML and plain text
  let html = '';
  let txt = '';

  try {
    html = execFileSync(
      'pdftohtml',
      ['-i', '-noframes', '-fontfullname', '-enc', 'UTF-8',
       '-f', String(pageStart), '-l', String(pageEnd), '-stdout', PDF_PATH],
      { encoding: 'utf8' },
    );
  } catch (err) {
    console.error(`  [ERROR] pdftohtml failed for ${sectionId}: ${err.message}`);
  }

  try {
    txt = execFileSync(
      'pdftotext',
      ['-layout', '-f', String(pageStart), '-l', String(pageEnd), '-enc', 'UTF-8', PDF_PATH, '-'],
      { encoding: 'utf8' },
    );
  } catch (err) {
    console.error(`  [ERROR] pdftotext failed for ${sectionId}: ${err.message}`);
  }

  // 2. Extract italic/bold runs from HTML
  const htmlRuns = extractHtmlRuns(html);

  // 3. Split pdftotext output into paragraphs
  const txtParas = splitTxtParagraphs(txt);

  // 4. Classify each paragraph
  const blocks = [];
  let firstMeaningfulSeen = false;

  for (const paraTxt of txtParas) {
    const rawText = normalizeWS(paraTxt);
    if (!rawText) continue;

    // Annotate with italic/bold from HTML
    const runs = annotateParaRuns(rawText, htmlRuns);

    const isFirst = !firstMeaningfulSeen;
    const kind = classifyBlock(rawText, runs, isFirst);
    if (!kind) continue;

    firstMeaningfulSeen = true;

    const block = {
      kind,
      rawText,
      runs: runs
        .filter(r => r.text.trim())
        .map(r => ({ text: r.text, italic: r.italic, bold: r.bold })),
    };

    blocks.push(block);
    stats[kind] = (stats[kind] || 0) + 1;
    stats.total++;
  }

  // Warn if 0 prayer blocks
  const prayerCount = blocks.filter(b => b.kind === 'prayer').length;
  if (prayerCount === 0) {
    console.warn(`  [WARN] ${sectionId} has 0 prayer blocks (${blocks.length} total blocks)`);
  }

  // 5. Write output
  const output = { sectionId, cardId, pageStart, pageEnd, blocks };
  const outPath = path.join(SECTIONS_OUT_DIR, `${sectionId}.classified.json`);
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`  ${sectionId}: ${blocks.length} blocks (${prayerCount} prayer)`);
}

// Summary
console.log('\nStage 03 complete.');
console.log(`Total blocks: ${stats.total}`);
console.log(`  prayer:          ${stats.prayer}`);
console.log(`  heading:         ${stats.heading}`);
console.log(`  faq:             ${stats.faq}`);
console.log(`  instant_insight: ${stats.instant_insight}`);
console.log(`  rubric:          ${stats.rubric}`);
console.log(`  callout:         ${stats.callout}`);
