/**
 * Stage 04 — Hebrew word assignment using legacy bundled data.
 *
 * The Feigenbaum PDF stores Hebrew in visual order with per-character spacing,
 * making direct PDF tokenization unreliable. Instead, we source Hebrew from the
 * existing Sefaria-derived legacy bundled files (src/data/bundled/) whose word
 * boundaries and niqqud are correct.
 *
 * For each *.classified.json in intermediate/sections/:
 *   1. Look up the section in legacy_hebrew_map.json.
 *   2. If a mapping exists, load the legacy he[] lines and tokenize them.
 *   3. Distribute the legacy Hebrew lines across the section's prayer blocks:
 *      - One new prayer block per legacy source file.
 *      - Non-prayer blocks (heading, faq, callout, rubric, etc.) are kept.
 *   4. If no mapping exists, prayer blocks get he: [], wordIndexStart/End: -1.
 *   5. Write to intermediate/sections/{id}.hebrew.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INTERMEDIATE_DIR, ensureDir } from './utils/paths.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const SECTIONS_DIR = path.join(INTERMEDIATE_DIR, 'sections');
const BUNDLED_DIR = path.join(REPO_ROOT, 'src', 'data', 'bundled');
const MAP_PATH = path.join(
  REPO_ROOT,
  'content',
  'feigenbaum-2026',
  'rules',
  'legacy_hebrew_map.json',
);

ensureDir(SECTIONS_DIR);

// ─── Load mapping ─────────────────────────────────────────────────────────────

const rawMap = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));
// Remove the _comment key.
const LEGACY_MAP = Object.fromEntries(
  Object.entries(rawMap).filter(([k]) => !k.startsWith('_')),
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Load a legacy bundled file and return its he[] array.
 * Resolves the folder using the path prefix (e.g. "shacharit/modeh_ani" →
 * src/data/bundled/shacharit/modeh_ani.json).
 *
 * @param {string} legacyId  e.g. "shacharit/modeh_ani"
 * @returns {string[]}  array of Hebrew line strings, or [] if file missing
 */
function loadLegacyHe(legacyId) {
  const filePath = path.join(BUNDLED_DIR, `${legacyId}.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`  [WARN] Legacy file not found: ${filePath}`);
    return [];
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return Array.isArray(data.he) ? data.he : [];
}

/**
 * Tokenize a single Hebrew line string into word tokens.
 * The legacy data has proper Unicode word boundaries (spaces between words).
 * We split on whitespace and filter out tokens that contain no Hebrew base letter.
 *
 * @param {string} line
 * @returns {string[]}
 */
function tokenizeLegacyLine(line) {
  if (!line) return [];
  return line.split(/\s+/).filter(token => /[א-ת]/.test(token));
}

/**
 * Convert an array of legacy he[] strings into HebrewLine objects, assigning
 * globalIndex values starting from startIndex.
 *
 * @param {string[]} heLines
 * @param {number} startIndex
 * @returns {{ heLines: HebrewLineObj[], nextIndex: number }}
 */
function buildHebrewLines(heLines, startIndex) {
  let counter = startIndex;
  let lineIndex = 0;

  const result = [];
  for (const lineStr of heLines) {
    const words = tokenizeLegacyLine(lineStr);
    if (words.length === 0) continue;

    result.push({
      lineIndex,
      words: words.map(text => ({ text, globalIndex: counter++ })),
    });
    lineIndex++;
  }

  return { heLines: result, nextIndex: counter };
}

// ─── Main loop ────────────────────────────────────────────────────────────────

const classifiedFiles = fs
  .readdirSync(SECTIONS_DIR)
  .filter(f => f.endsWith('.classified.json'))
  .sort();

console.log(`Stage 04: processing ${classifiedFiles.length} section(s)…`);

const globalStats = {
  sections: 0,
  mapped: 0,
  unmapped: 0,
  totalWords: 0,
};

for (const filename of classifiedFiles) {
  const sectionId = filename.replace('.classified.json', '');
  const inPath = path.join(SECTIONS_DIR, filename);
  const outPath = path.join(SECTIONS_DIR, `${sectionId}.hebrew.json`);

  const data = JSON.parse(fs.readFileSync(inPath, 'utf8'));

  const mapKey = `${data.cardId}/${data.sectionId}`;
  const legacyIds = LEGACY_MAP[mapKey];

  let outputBlocks;
  let sectionWords = 0;

  if (legacyIds && legacyIds.length > 0) {
    // ── Mapped: replace prayer blocks with legacy-derived blocks ──────────────
    globalStats.mapped++;

    // Collect all non-prayer blocks (keep ordering from classified.json).
    // We'll prepend one prayer block per legacy source file, then append
    // the non-prayer blocks at the end.
    const nonPrayerBlocks = data.blocks.filter(b => b.kind !== 'prayer');

    // Build one prayer block per legacy file.
    let wordCounter = 0;
    const prayerBlocks = [];

    for (const legacyId of legacyIds) {
      const heStrings = loadLegacyHe(legacyId);
      const { heLines, nextIndex } = buildHebrewLines(heStrings, wordCounter);

      if (heLines.length === 0) continue;

      const wordCount = nextIndex - wordCounter;
      const wordIndexStart = wordCounter;
      const wordIndexEnd = wordCount > 0 ? nextIndex - 1 : wordCounter - 1;

      prayerBlocks.push({
        kind: 'prayer',
        runs: [],
        he: heLines,
        wordIndexStart,
        wordIndexEnd,
        _legacySource: legacyId,
      });

      sectionWords += wordCount;
      wordCounter = nextIndex;
    }

    // Interleave: all prayer blocks first, then non-prayer blocks.
    outputBlocks = [...prayerBlocks, ...nonPrayerBlocks];
  } else {
    // ── Unmapped: keep non-prayer blocks; prayer blocks get empty Hebrew ───────
    globalStats.unmapped++;

    outputBlocks = data.blocks.map(block => {
      if (block.kind !== 'prayer') return { ...block };
      const { rawText: _raw, ...rest } = block;
      return {
        ...rest,
        runs: [],
        he: [],
        wordIndexStart: 0,
        wordIndexEnd: -1,
      };
    });
  }

  const output = {
    sectionId: data.sectionId,
    cardId: data.cardId,
    pageStart: data.pageStart,
    pageEnd: data.pageEnd,
    blocks: outputBlocks,
  };

  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  const prayerCount = outputBlocks.filter(b => b.kind === 'prayer').length;
  console.log(
    `  ${sectionId}: ${prayerCount} prayer block(s), ${sectionWords} words ${legacyIds ? '' : '[unmapped]'}`,
  );

  globalStats.totalWords += sectionWords;
  globalStats.sections++;
}

console.log('\nStage 04 complete.');
console.log(`  Sections processed: ${globalStats.sections}`);
console.log(`  Mapped (legacy):    ${globalStats.mapped}`);
console.log(`  Unmapped:           ${globalStats.unmapped}`);
console.log(`  Total words:        ${globalStats.totalWords}`);
