/**
 * Stage 07 — Detect and mark minyan-only blocks.
 *
 * For each *.translit.json in intermediate/sections/:
 *   1. Checks minyan.json rules
 *   2. Converts matching blocks to kind: 'minyan_only'
 *   3. Sets all words in minyan_only blocks to globalIndex: -1
 *   4. Renumbers remaining prayer blocks' globalIndex / wordIndexStart / wordIndexEnd
 *   5. Writes to intermediate/sections/{id}.minyan.json
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const SECTIONS_DIR = join(REPO_ROOT, 'content', 'feigenbaum-2026', 'intermediate', 'sections');
const RULES_DIR = join(REPO_ROOT, 'content', 'feigenbaum-2026', 'rules');

// ─── Load rules ───────────────────────────────────────────────────────────────

const minyanRules = JSON.parse(readFileSync(join(RULES_DIR, 'minyan.json'), 'utf8'));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Strip niqqud (Hebrew vowel diacritics, U+0591–U+05C7) from a string.
 * Used for consonantal skeleton matching.
 */
function stripNiqqud(str) {
  return str.replace(/[֑-ׇ]/g, '');
}

/**
 * Join all words from all he lines in a block into a single consonantal string
 * (no spaces, no niqqud) for substring matching.
 */
function blockConsonantalText(block) {
  if (!block.he || block.he.length === 0) return '';
  return stripNiqqud(
    block.he.map(line => line.words.map(w => w.text).join('')).join('')
  );
}

/**
 * Convert a block to minyan_only.
 * Sets kind, reason, and all word globalIndexes to -1.
 */
function convertToMinyanOnly(block, reason) {
  block.kind = 'minyan_only';
  block.reason = reason;
  if (block.he) {
    for (const line of block.he) {
      for (const word of line.words) {
        word.globalIndex = -1;
      }
    }
  }
  // Remove karaoke index fields
  delete block.wordIndexStart;
  delete block.wordIndexEnd;
}

/**
 * Renumber prayer blocks' globalIndex values and wordIndexStart/wordIndexEnd
 * after minyan_only conversion. Counter resets to 0 per section.
 */
function renumberPrayerBlocks(blocks) {
  let counter = 0;
  for (const block of blocks) {
    if (block.kind !== 'prayer') continue;
    if (!block.he || block.he.length === 0) continue;

    block.wordIndexStart = counter;
    for (const line of block.he) {
      for (const word of line.words) {
        word.globalIndex = counter++;
      }
    }
    block.wordIndexEnd = counter - 1;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const inputFiles = readdirSync(SECTIONS_DIR).filter(f => f.endsWith('.translit.json'));

let totalConverted = 0;

for (const fname of inputFiles) {
  const inputPath = join(SECTIONS_DIR, fname);
  const sectionData = JSON.parse(readFileSync(inputPath, 'utf8'));
  const sectionId = sectionData.sectionId;

  // Find rules that apply to this section
  const applicableRules = minyanRules.blocks.filter(r => r.sectionId === sectionId);

  if (applicableRules.length === 0) {
    // No minyan rules for this section — write output unchanged (but as .minyan.json)
    const outputPath = join(SECTIONS_DIR, fname.replace('.translit.json', '.minyan.json'));
    writeFileSync(outputPath, JSON.stringify(sectionData, null, 2), 'utf8');
    continue;
  }

  // Check for wholeSection rules
  const wholeSectionRule = applicableRules.find(r => r.match && r.match.wholeSection);

  let converted = 0;

  if (wholeSectionRule) {
    // Convert ALL prayer blocks in this section to minyan_only
    for (const block of sectionData.blocks) {
      if (block.kind === 'prayer') {
        convertToMinyanOnly(block, wholeSectionRule.reason);
        converted++;
      }
    }
  } else {
    // Check rawTextContains rules
    const textRules = applicableRules.filter(r => r.match && r.match.rawTextContains);

    for (const block of sectionData.blocks) {
      if (block.kind !== 'prayer') continue;
      const consonants = blockConsonantalText(block);

      for (const rule of textRules) {
        const targetConsonants = stripNiqqud(rule.match.rawTextContains).replace(/\s+/g, '');
        if (targetConsonants && consonants.includes(targetConsonants)) {
          convertToMinyanOnly(block, rule.reason);
          converted++;
          break; // Don't apply multiple rules to same block
        }
      }
    }
  }

  totalConverted += converted;

  // Renumber surviving prayer blocks
  renumberPrayerBlocks(sectionData.blocks);

  const outputPath = join(SECTIONS_DIR, fname.replace('.translit.json', '.minyan.json'));
  writeFileSync(outputPath, JSON.stringify(sectionData, null, 2), 'utf8');

  if (converted > 0) {
    console.log(`  ${sectionId}: ${converted} block(s) → minyan_only`);
  }
}

console.log(`\nStage 07 complete. ${inputFiles.length} sections processed, ${totalConverted} blocks total converted to minyan_only.`);
