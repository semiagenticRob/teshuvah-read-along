/**
 * Stage 06 — Port Sefaria-derived transliteration to new Hebrew structure.
 *
 * For each *.english.json in intermediate/sections/, we find the best-matching
 * legacy translit line (from src/data/bundled/shacharit/*.translit.json) for
 * each Hebrew line in every prayer block.  Matching is done by word-identity
 * overlap after stripping niqqud.  The result is written to a parallel
 * *.translit.json file in the same directory.
 *
 * Usage:  node scripts/siddur/06_port_translit.mjs
 */

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const LEGACY_DIR = path.join(REPO_ROOT, 'src', 'data', 'bundled', 'shacharit');
const SECTIONS_DIR = path.join(
  REPO_ROOT,
  'content',
  'feigenbaum-2026',
  'intermediate',
  'sections',
);

// ─── Niqqud stripping ────────────────────────────────────────────────────────

/**
 * Strip niqqud (U+05B0–U+05C7), cantillation marks (U+0591–U+05AF), and
 * extra diacritic marks (U+05C8–U+05C9) from a Hebrew string, leaving only
 * base Hebrew letters (U+05D0–U+05EA) and spaces/punctuation.
 */
function stripNiqqud(text) {
  // Remove all Hebrew diacritics: cantillation (U+0591-U+05AF),
  // niqqud (U+05B0-U+05C7), and special marks (U+05C8-U+05C9)
  return text.replace(/[֑-׉]/g, '');
}

// ─── Load all legacy translit pairs ──────────────────────────────────────────

/**
 * Returns an array of { legacyWords: string[], translitLine: string }
 * built from all *.translit.json / matching *.json pairs under LEGACY_DIR.
 * legacyWords is already stripped of niqqud.
 */
function loadLegacyPairs() {
  const pairs = [];

  const files = fs.readdirSync(LEGACY_DIR).filter(f => f.endsWith('.translit.json'));

  for (const fname of files) {
    const prayerId = fname.replace('.translit.json', '');
    const hePath = path.join(LEGACY_DIR, `${prayerId}.json`);

    if (!fs.existsSync(hePath)) continue;

    const heData = JSON.parse(fs.readFileSync(hePath, 'utf8'));
    const trData = JSON.parse(fs.readFileSync(path.join(LEGACY_DIR, fname), 'utf8'));

    const heLines = heData.he ?? [];
    const trLines = trData.translit ?? [];

    for (let i = 0; i < Math.min(heLines.length, trLines.length); i++) {
      const stripped = stripNiqqud(heLines[i]);
      const legacyWords = stripped.split(/\s+/).filter(Boolean);
      pairs.push({ legacyWords, translitLine: trLines[i] });
    }
  }

  return pairs;
}

// ─── Matching logic ───────────────────────────────────────────────────────────

/**
 * Given a new line's stripped words and the pool of legacy pairs, find the
 * best-matching legacy pair.  Returns { pair, score } where score is the
 * overlap / newWordCount.  Returns null if no legacy pair has score >= 0.5.
 */
function findBestMatch(newWords, legacyPairs) {
  if (newWords.length === 0) return null;

  const newSet = new Set(newWords);
  let bestScore = 0;
  let bestPair = null;

  for (const pair of legacyPairs) {
    const legSet = new Set(pair.legacyWords);
    let overlap = 0;
    for (const w of newSet) {
      if (legSet.has(w)) overlap++;
    }
    const score = overlap / newWords.length;
    if (score > bestScore) {
      bestScore = score;
      bestPair = pair;
    }
  }

  if (bestScore >= 0.5) return { pair: bestPair, score: bestScore };
  return null;
}

/**
 * Given a matched legacy pair and a new line's words, align translit words
 * by position in the legacy line.  Words that don't have a positional match
 * in the legacy line get { text: null }.
 *
 * Strategy:
 *   1. Split the legacy translit line by whitespace into tokens.
 *   2. Split the legacy he line (stripped) into words.
 *   3. For each new word (stripped), find its first occurrence index in
 *      legacy he words (greedy left-to-right).
 *   4. Return the translit token at that same index, or null if not found.
 */
function alignWords(newWords, matchedPair) {
  const { legacyWords, translitLine } = matchedPair;
  const translitTokens = translitLine.split(/\s+/).filter(Boolean);

  // Build a cursor-based greedy alignment
  const result = [];
  let cursor = 0;

  for (const newWord of newWords) {
    const stripped = stripNiqqud(newWord);
    let found = false;

    // Search forward from cursor for a match in legacyWords
    for (let i = cursor; i < legacyWords.length; i++) {
      if (legacyWords[i] === stripped) {
        // Get corresponding translit token (if index exists)
        const token = translitTokens[i] ?? null;
        result.push({ text: token });
        cursor = i + 1;
        found = true;
        break;
      }
    }

    if (!found) {
      result.push({ text: null });
    }
  }

  return result;
}

// ─── Process a single section file ───────────────────────────────────────────

/**
 * Reads an *.english.json, adds `translit` field to each prayer block, and
 * returns the augmented data object.
 */
function processSection(englishData, legacyPairs) {
  const blocks = englishData.blocks ?? [];
  let portedLines = 0;
  let missingLines = 0;

  const processedBlocks = blocks.map(block => {
    if (block.kind !== 'prayer') return block;

    const heLines = block.he ?? [];
    const translit = heLines.map(line => {
      const newWords = (line.words ?? []).map(w => w.text);
      const strippedWords = newWords.map(stripNiqqud).filter(Boolean);

      if (strippedWords.length === 0) {
        missingLines++;
        return {
          lineIndex: line.lineIndex,
          words: newWords.map(() => ({ text: null })),
          source: 'missing',
        };
      }

      const match = findBestMatch(strippedWords, legacyPairs);

      if (!match) {
        missingLines++;
        return {
          lineIndex: line.lineIndex,
          words: newWords.map(() => ({ text: null })),
          source: 'missing',
        };
      }

      portedLines++;
      const alignedWords = alignWords(newWords, match.pair);
      return {
        lineIndex: line.lineIndex,
        words: alignedWords,
        source: 'sefaria-ported',
      };
    });

    return { ...block, translit };
  });

  return {
    data: { ...englishData, blocks: processedBlocks },
    portedLines,
    missingLines,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log('Stage 06 — porting Sefaria transliteration…\n');

  const legacyPairs = loadLegacyPairs();
  console.log(`Loaded ${legacyPairs.length} legacy translit line pairs.\n`);

  const sectionFiles = fs
    .readdirSync(SECTIONS_DIR)
    .filter(f => f.endsWith('.english.json'))
    .sort();

  let totalPorted = 0;
  let totalMissing = 0;

  for (const fname of sectionFiles) {
    const sectionId = fname.replace('.english.json', '');
    const inPath = path.join(SECTIONS_DIR, fname);
    const outPath = path.join(SECTIONS_DIR, `${sectionId}.translit.json`);

    const englishData = JSON.parse(fs.readFileSync(inPath, 'utf8'));

    const { data, portedLines, missingLines } = processSection(englishData, legacyPairs);

    fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');

    const total = portedLines + missingLines;
    const pct = total > 0 ? ((portedLines / total) * 100).toFixed(0) : '0';
    console.log(
      `  ${sectionId.padEnd(45)} ported=${portedLines}  missing=${missingLines}  (${pct}%)`,
    );

    totalPorted += portedLines;
    totalMissing += missingLines;
  }

  const grandTotal = totalPorted + totalMissing;
  const grandPct = grandTotal > 0 ? ((totalPorted / grandTotal) * 100).toFixed(1) : '0';

  console.log(`\nDone. ${sectionFiles.length} sections written.`);
  console.log(
    `Total: ported=${totalPorted}  missing=${totalMissing}  overall=${grandPct}%`,
  );
}

main();
