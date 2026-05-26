/**
 * Stage 09 — Learn essay anchoring (bidirectional).
 *
 * Pass 1: Insert LearnCrossLinkBlocks into section *.conditional.json files.
 *   - For each anchor in rules/learn_anchors.json, find the matching section
 *     *.conditional.json and insert a { kind: 'learn_link', essayId, label }
 *     block at the specified position (before-first-prayer / after-last-prayer).
 *   - Write to intermediate/sections/{id}.learn.json
 *
 * Pass 2: Build essay JSON with anchoredFrom reverse index.
 *   - For each essay in section_manifest.json:
 *     - Collect all anchorAt entries that reference this essayId.
 *     - Extract essay body text from the PDF.
 *     - Write to intermediate/essays/{essayId}.json
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { PDF_PATH, INTERMEDIATE_DIR, RULES_DIR, ensureDir } from './utils/paths.mjs';
import { tokenize, italicAwareRuns } from './utils/pdfHtmlParser.mjs';
import { runsToSpans } from './utils/italicDetect.mjs';

const SECTIONS_DIR = path.join(INTERMEDIATE_DIR, 'sections');
const ESSAYS_DIR = path.join(INTERMEDIATE_DIR, 'essays');
const MANIFEST_PATH = path.join(INTERMEDIATE_DIR, 'section_manifest.json');
const ANCHORS_PATH = path.join(RULES_DIR, 'learn_anchors.json');

ensureDir(ESSAYS_DIR);

// ─── Load inputs ─────────────────────────────────────────────────────────────

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const anchorsData = JSON.parse(fs.readFileSync(ANCHORS_PATH, 'utf8'));

/** @type {Array<{ essayId: string, anchorAt: Array<{ cardId: string, sectionId: string, position: string }> }>} */
const anchors = anchorsData.anchors;

/** @type {Array<{ id: string, essayKind: string, pageStart: number, pageEnd: number, title: { en: string } }>} */
const essays = manifest.essays;

// ─── Build an essay title lookup ─────────────────────────────────────────────

/** @type {Map<string, { en: string }>} */
const essayTitleById = new Map(essays.map(e => [e.id, e.title]));

// ─── Build a section → anchors map ───────────────────────────────────────────
// Key: `${cardId}::${sectionId}`, value: array of { essayId, position } in order

/** @type {Map<string, Array<{ essayId: string, position: string }>>} */
const sectionAnchorMap = new Map();

for (const anchor of anchors) {
  for (const loc of anchor.anchorAt) {
    const key = `${loc.cardId}::${loc.sectionId}`;
    if (!sectionAnchorMap.has(key)) {
      sectionAnchorMap.set(key, []);
    }
    sectionAnchorMap.get(key).push({ essayId: anchor.essayId, position: loc.position });
  }
}

// ─── Pass 1: Insert learn_link blocks into each section ──────────────────────

console.log('Pass 1: Inserting LearnCrossLinkBlocks into section files…');

const conditionalFiles = fs
  .readdirSync(SECTIONS_DIR)
  .filter(f => f.endsWith('.conditional.json'))
  .sort();

console.log(`  Found ${conditionalFiles.length} conditional section file(s).`);

let sectionsModified = 0;
let linksInserted = 0;

for (const filename of conditionalFiles) {
  const sectionId = filename.replace('.conditional.json', '');
  const inPath = path.join(SECTIONS_DIR, filename);
  const outPath = path.join(SECTIONS_DIR, `${sectionId}.learn.json`);

  const data = JSON.parse(fs.readFileSync(inPath, 'utf8'));
  const cardId = data.cardId;

  // Find all anchors targeting this section
  const key = `${cardId}::${sectionId}`;
  const targetAnchors = sectionAnchorMap.get(key) || [];

  if (targetAnchors.length === 0) {
    // No anchors — copy as-is
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
    continue;
  }

  // Build learn_link blocks per anchor
  // Group by position so we can insert them in order
  const beforeLinks = [];
  const afterLinks = [];

  for (const { essayId, position } of targetAnchors) {
    const titleEntry = essayTitleById.get(essayId);
    const fullLabel = titleEntry ? titleEntry.en : essayId;
    const label = fullLabel.length > 60 ? fullLabel.slice(0, 57) + '…' : fullLabel;

    /** @type {{ kind: 'learn_link', essayId: string, label: string }} */
    const block = { kind: 'learn_link', essayId, label };

    if (position === 'before-first-prayer') {
      beforeLinks.push(block);
    } else {
      afterLinks.push(block);
    }
  }

  // Find insertion indices
  const blocks = data.blocks;
  const firstPrayerIdx = blocks.findIndex(b => b.kind === 'prayer');
  const lastPrayerIdx = (() => {
    for (let i = blocks.length - 1; i >= 0; i--) {
      if (blocks[i].kind === 'prayer') return i;
    }
    return -1;
  })();

  let newBlocks = [...blocks];

  // We need to handle both insertions carefully.
  // Insert after-last first (higher index), then before-first (lower index),
  // so the earlier insertion doesn't shift the later one.

  // Insert afterLinks after the last prayer block (or at end)
  if (afterLinks.length > 0) {
    const insertAfterIdx = lastPrayerIdx === -1 ? newBlocks.length : lastPrayerIdx + 1;
    newBlocks.splice(insertAfterIdx, 0, ...afterLinks);
    linksInserted += afterLinks.length;
  }

  // Insert beforeLinks before the first prayer block (or at index 0)
  // Note: insertions above may have shifted indices; recalculate first prayer idx
  if (beforeLinks.length > 0) {
    const updatedFirstPrayerIdx = newBlocks.findIndex(b => b.kind === 'prayer');
    const insertBeforeIdx = updatedFirstPrayerIdx === -1 ? 0 : updatedFirstPrayerIdx;
    newBlocks.splice(insertBeforeIdx, 0, ...beforeLinks);
    linksInserted += beforeLinks.length;
  }

  const output = { ...data, blocks: newBlocks };
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  sectionsModified++;

  console.log(
    `  ${sectionId}: inserted ${beforeLinks.length} before-first + ${afterLinks.length} after-last`
  );
}

// Sections with no anchors still need .learn.json — verify all were written
const learnFiles = fs.readdirSync(SECTIONS_DIR).filter(f => f.endsWith('.learn.json'));
console.log(`  Pass 1 complete: ${sectionsModified} section(s) modified, ${linksInserted} link(s) inserted.`);
console.log(`  Total .learn.json files written: ${learnFiles.length}`);

// ─── Pass 2: Build essay JSON with anchoredFrom reverse index ────────────────

console.log('\nPass 2: Building essay JSON files…');

// Paragraph break: two or more consecutive newlines
const PARA_BREAK_RE = /\n\n+|(?:\r?\n){2,}/;

/**
 * Splits an array of italic/bold runs into paragraphs.
 * @param {Array<{ text: string, italic: boolean, bold: boolean }>} runs
 * @returns {Array<{ spans: Array<{ text: string, style?: 'italic' | 'bold' }> }>}
 */
function runsToParagraphs(runs) {
  /** @type {Array<Array<{ text: string, italic: boolean, bold: boolean }>>} */
  const groups = [[]];

  for (const run of runs) {
    const parts = run.text.split(PARA_BREAK_RE);
    if (parts.length === 1) {
      groups[groups.length - 1].push(run);
    } else {
      for (let i = 0; i < parts.length; i++) {
        if (i === 0) {
          if (parts[i]) groups[groups.length - 1].push({ ...run, text: parts[i] });
        } else {
          groups.push([]);
          if (parts[i]) groups[groups.length - 1].push({ ...run, text: parts[i] });
        }
      }
    }
  }

  const paragraphs = [];
  for (const group of groups) {
    const spans = runsToSpans(group);
    if (spans.length > 0) {
      paragraphs.push({ spans });
    }
  }
  return paragraphs;
}

/**
 * Filter a token array to only body content, stripping head/style/script/title/meta
 * and nav/link artifacts outside <body>.
 * @param {Array<{kind: string, tag?: string, text?: string}>} tokens
 * @returns {Array<{kind: string, tag?: string, text?: string}>}
 */
function bodyTokensOnly(tokens) {
  const SKIP_TAGS = new Set(['head', 'style', 'script', 'title', 'meta', 'a', 'hr']);
  let inBody = false;
  let inSkipTag = 0;
  const result = [];

  for (const tok of tokens) {
    if (tok.kind === 'open' && tok.tag === 'body') { inBody = true; continue; }
    if (tok.kind === 'close' && tok.tag === 'body') { inBody = false; continue; }
    if (!inBody) continue;

    if (tok.kind === 'open' && SKIP_TAGS.has(tok.tag)) { inSkipTag++; continue; }
    if (tok.kind === 'close' && SKIP_TAGS.has(tok.tag)) {
      inSkipTag = Math.max(0, inSkipTag - 1);
      continue;
    }
    if (inSkipTag > 0) continue;

    result.push(tok);
  }
  return result;
}

/**
 * Convert a manifest page number to a PDF physical page number.
 *
 * The manifest uses two numbering schemes:
 * - Front matter (pages 1–25): these are already PDF page numbers (no offset).
 * - Siddur content and back matter (pages 26+): printed page numbers; PDF page = printed + 24.
 *
 * @param {number} manifestPage
 * @returns {number}
 */
function toPdfPage(manifestPage) {
  const SIDDUR_OFFSET = 24;
  const FRONT_MATTER_CUTOFF = 25; // PDF pages 1–25 are front matter
  return manifestPage <= FRONT_MATTER_CUTOFF ? manifestPage : manifestPage + SIDDUR_OFFSET;
}

/**
 * Extract essay body from PDF pages.
 * @param {number} pageStart  manifest page number
 * @param {number} pageEnd    manifest page number
 * @returns {Array<{ spans: Array<{ text: string, style?: string }> }>}
 */
function extractEssayBody(pageStart, pageEnd) {
  const pdfStart = toPdfPage(pageStart);
  const pdfEnd = toPdfPage(pageEnd);

  let html;
  try {
    html = execFileSync(
      'pdftohtml',
      ['-i', '-noframes', '-fontfullname', '-enc', 'UTF-8',
       '-f', String(pdfStart), '-l', String(pdfEnd),
       '-stdout', PDF_PATH],
      { encoding: 'utf8' }
    );
  } catch (err) {
    console.warn(`  Warning: pdftohtml failed for pages ${pdfStart}-${pdfEnd}: ${err.message}`);
    return [];
  }

  const tokens = tokenize(html);
  const filtered = bodyTokensOnly(tokens);
  const runs = [...italicAwareRuns(filtered)].filter(r => r.text.trim().length > 0);
  return runsToParagraphs(runs);
}

// Build essay → anchoredFrom map
/** @type {Map<string, Array<{ cardId: string, sectionId: string, position: string }>>} */
const essayAnchoredFrom = new Map();

for (const anchor of anchors) {
  for (const loc of anchor.anchorAt) {
    if (!essayAnchoredFrom.has(anchor.essayId)) {
      essayAnchoredFrom.set(anchor.essayId, []);
    }
    essayAnchoredFrom.get(anchor.essayId).push({
      cardId: loc.cardId,
      sectionId: loc.sectionId,
      position: loc.position,
    });
  }
}

let essaysWritten = 0;
let essaysAnchored = 0;

for (const essay of essays) {
  const anchoredFrom = essayAnchoredFrom.get(essay.id) || [];

  console.log(
    `  ${essay.id} (pp.${essay.pageStart}-${essay.pageEnd}): ${anchoredFrom.length} anchor(s)`
  );

  const body = extractEssayBody(essay.pageStart, essay.pageEnd);

  const output = {
    id: essay.id,
    essayKind: essay.essayKind,
    title: essay.title,
    body,
    anchoredFrom,
  };

  const outPath = path.join(ESSAYS_DIR, `${essay.id}.json`);
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  essaysWritten++;
  if (anchoredFrom.length > 0) essaysAnchored++;
}

console.log(`\nPass 2 complete: ${essaysWritten} essay JSON file(s) written.`);
console.log(`  Essays with at least one anchor: ${essaysAnchored}`);
console.log(`  Essays directory: ${ESSAYS_DIR}`);

console.log('\nStage 09 complete.');
