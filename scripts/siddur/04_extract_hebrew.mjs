/**
 * Stage 04 — Hebrew tokenization and contiguous globalIndex assignment.
 *
 * For each *.classified.json in intermediate/sections/:
 *   1. Walk through all blocks in document order.
 *   2. For each `prayer` block:
 *      - Tokenize its rawText with tokenizeHebrewLines().
 *      - Assign globalIndex values starting from the current section counter.
 *      - Store result as `he: HebrewLine[]` on the block.
 *      - Store `wordIndexStart` and `wordIndexEnd` on the block.
 *      - Remove `rawText` from the prayer block (parsed; `runs` kept for stage 05).
 *   3. Non-prayer blocks: leave unchanged (rawText and runs untouched).
 *   4. Write to intermediate/sections/{id}.hebrew.json
 *
 * The section-level index counter resets to 0 for each section and counts
 * strictly through prayer blocks only.
 */

import fs from 'fs';
import path from 'path';
import { INTERMEDIATE_DIR, ensureDir } from './utils/paths.mjs';
import { tokenizeHebrewLines, assignGlobalIndices } from './utils/hebrewTokenize.mjs';

const SECTIONS_DIR = path.join(INTERMEDIATE_DIR, 'sections');

ensureDir(SECTIONS_DIR);

// Find all classified JSON files.
const classifiedFiles = fs
  .readdirSync(SECTIONS_DIR)
  .filter(f => f.endsWith('.classified.json'))
  .sort();

console.log(`Stage 04: processing ${classifiedFiles.length} section(s)…`);

const globalStats = {
  sections: 0,
  totalPrayerBlocks: 0,
  totalWords: 0,
  sectionsWithZeroWords: [],
};

for (const filename of classifiedFiles) {
  const sectionId = filename.replace('.classified.json', '');
  const inPath = path.join(SECTIONS_DIR, filename);
  const outPath = path.join(SECTIONS_DIR, `${sectionId}.hebrew.json`);

  const data = JSON.parse(fs.readFileSync(inPath, 'utf8'));

  // Section-level word index counter — resets to 0 per section.
  let sectionWordIndex = 0;
  let sectionPrayerBlocks = 0;
  let sectionWords = 0;

  const outputBlocks = data.blocks.map(block => {
    if (block.kind !== 'prayer') {
      // Non-prayer blocks are passed through unchanged.
      return { ...block };
    }

    // --- Prayer block processing ---
    const lines = tokenizeHebrewLines(block.rawText);
    const { lines: heLines, nextIndex } = assignGlobalIndices(lines, sectionWordIndex);

    const wordCount = nextIndex - sectionWordIndex;
    const wordIndexStart = sectionWordIndex;
    const wordIndexEnd = wordCount > 0 ? nextIndex - 1 : sectionWordIndex - 1;

    sectionWordIndex = nextIndex;
    sectionPrayerBlocks++;
    sectionWords += wordCount;

    // Build the output block: remove rawText, add he/wordIndexStart/wordIndexEnd.
    const { rawText: _removed, ...restBlock } = block;
    return {
      ...restBlock,
      he: heLines,
      wordIndexStart,
      wordIndexEnd,
    };
  });

  const output = {
    sectionId: data.sectionId,
    cardId: data.cardId,
    pageStart: data.pageStart,
    pageEnd: data.pageEnd,
    blocks: outputBlocks,
  };

  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log(
    `  ${sectionId}: ${sectionPrayerBlocks} prayer blocks, ${sectionWords} words`
  );

  if (sectionWords === 0) {
    globalStats.sectionsWithZeroWords.push(sectionId);
  }

  globalStats.sections++;
  globalStats.totalPrayerBlocks += sectionPrayerBlocks;
  globalStats.totalWords += sectionWords;
}

console.log('\nStage 04 complete.');
console.log(`  Sections processed:    ${globalStats.sections}`);
console.log(`  Total prayer blocks:   ${globalStats.totalPrayerBlocks}`);
console.log(`  Total words (all):     ${globalStats.totalWords}`);

if (globalStats.sectionsWithZeroWords.length > 0) {
  console.warn(
    `  [WARN] Sections with 0 words: ${globalStats.sectionsWithZeroWords.join(', ')}`
  );
}
