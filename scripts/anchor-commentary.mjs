#!/usr/bin/env node
// Draft commentary anchors for a Feigenbaum prayer.
//
// Feigenbaum uses the pattern: a Hebrew lemma, then an em-dash, then an
// English explanation. This script detects that pattern in the extracted
// commentary paragraphs, normalizes each lemma (strip nikud, bidi marks,
// final-form letters), and finds the first matching position in the
// bundled `he[]` array. Each match becomes a draft commentary entry with
// an auto-assigned marker glyph.
//
// Output is a draft. Editorial review is required for:
//   - false matches on common short words (e.g. "אני" appears many places),
//   - lemma fragmentation (PDF bidi can split long lemmas at line wraps),
//   - paragraph splitting where one Feigenbaum block has multiple lemmas.
//
// Usage:
//   node scripts/anchor-commentary.mjs --prayer modeh_ani
//   node scripts/anchor-commentary.mjs --prayer modeh_ani --write
//
// With --write, drafts are merged into the prayer's bundled JSON under
// commentary[]. Without it, drafts print to stdout for review.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(REPO_ROOT, 'scripts/feigenbaum-manifest.json');
const BUNDLED_DIR = path.join(REPO_ROOT, 'src/data/bundled/shacharit');

const HEBREW_MARK_RE = /[ֽ-ׇ]/g;
const BIDI_MARK_RE = /[‎‏‪-‮⁦-⁩]/g;
const FINAL_FORM_MAP = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };

function parseArgs(argv) {
  const args = { prayer: null, write: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--prayer' || argv[i] === '-p') args.prayer = argv[++i];
    else if (argv[i] === '--write' || argv[i] === '-w') args.write = true;
    else if (argv[i] === '--help' || argv[i] === '-h') {
      console.log('Usage: node scripts/anchor-commentary.mjs --prayer <id> [--write]');
      process.exit(0);
    }
  }
  return args;
}

function normalize(text) {
  return text
    .replace(BIDI_MARK_RE, '')
    .replace(HEBREW_MARK_RE, '')
    .replace(/[^א-ת]/g, (c) => (/\s/.test(c) ? ' ' : ''))
    .replace(/\s+/g, ' ')
    .trim()
    .split('')
    .map((c) => FINAL_FORM_MAP[c] ?? c)
    .join('');
}

function normalizeWords(text) {
  return normalize(text).split(' ').filter(Boolean);
}

const COMMON_PARTICLES = new Set([
  'ה', 'ו', 'ב', 'כ', 'ל', 'מ', 'ש',
  'את', 'אל', 'על', 'אם', 'כי', 'אך', 'כן',
  'הוא', 'היא', 'אני', 'אתה', 'אנו', 'אנחנו',
]);

function findExactAnchor(he, lemmaWords) {
  if (lemmaWords.length === 0) return null;
  for (let lineIdx = 0; lineIdx < he.length; lineIdx++) {
    const heWords = normalizeWords(he[lineIdx]);
    for (let i = 0; i <= heWords.length - lemmaWords.length; i++) {
      let match = true;
      for (let j = 0; j < lemmaWords.length; j++) {
        if (heWords[i + j] !== lemmaWords[j]) {
          match = false;
          break;
        }
      }
      if (match) return { lineIndex: lineIdx, wordIndex: i, fuzzy: false };
    }
  }
  return null;
}

/**
 * Fallback: find the longest non-common Hebrew word in the lemma and anchor
 * to its first match in he[]. Useful when PDF bidi has fragmented the lemma
 * but at least one distinctive word survives intact.
 */
function findFuzzyAnchor(he, lemmaWords) {
  const candidates = lemmaWords
    .filter((w) => w.length >= 3 && !COMMON_PARTICLES.has(w))
    .sort((a, b) => b.length - a.length);
  for (const word of candidates) {
    for (let lineIdx = 0; lineIdx < he.length; lineIdx++) {
      const heWords = normalizeWords(he[lineIdx]);
      const idx = heWords.indexOf(word);
      if (idx !== -1) return { lineIndex: lineIdx, wordIndex: idx, fuzzy: true, matchedWord: word };
    }
  }
  return null;
}

/**
 * Last-ditch: collapse whitespace from the lemma (PDF bidi often splits one
 * Hebrew word with internal spaces) and do a substring search against each
 * bundled line. Returns (lineIndex, wordIndex) of the bundled word whose
 * starting character offset is closest to the match position.
 */
function findCollapsedAnchor(he, lemmaText) {
  const lemmaCollapsed = normalize(lemmaText).replace(/\s+/g, '');
  if (lemmaCollapsed.length < 3) return null;
  for (let lineIdx = 0; lineIdx < he.length; lineIdx++) {
    const heWords = normalizeWords(he[lineIdx]);
    if (heWords.length === 0) continue;
    const heCollapsed = heWords.join('');
    // Track char offsets where each word starts in the collapsed line.
    const wordStartOffsets = [0];
    let running = 0;
    for (const w of heWords) {
      running += w.length;
      wordStartOffsets.push(running);
    }
    const matchOffset = heCollapsed.indexOf(lemmaCollapsed);
    if (matchOffset !== -1) {
      // Find the word index whose start offset is <= matchOffset.
      let wordIdx = 0;
      for (let i = 0; i < wordStartOffsets.length - 1; i++) {
        if (wordStartOffsets[i] <= matchOffset && matchOffset < wordStartOffsets[i + 1]) {
          wordIdx = i;
          break;
        }
      }
      return { lineIndex: lineIdx, wordIndex: wordIdx, fuzzy: true, matchedWord: lemmaCollapsed.slice(0, 20) + '...' };
    }
  }
  return null;
}

function findFirstAnchor(he, lemmaWords, lemmaText) {
  return (
    findExactAnchor(he, lemmaWords) ??
    findFuzzyAnchor(he, lemmaWords) ??
    findCollapsedAnchor(he, lemmaText)
  );
}

function isHebrewOrMark(c) {
  // Hebrew letter, Hebrew nikud/cantillation, bidi marks, or space inside a lemma.
  return /[֐-׿‎‏‪-‮⁦-⁩  ]/.test(c);
}

/**
 * For each em-dash in `paragraph`, walk backward to find the start of the
 * Hebrew lemma immediately preceding it. The lemma is the contiguous run
 * of Hebrew + nikud + bidi marks + spaces just before the dash, anchored
 * by requiring at least one actual Hebrew letter in the captured run.
 */
function extractLemmas(paragraph) {
  const lemmas = [];
  const dashRe = /[—–]/g;
  let m;
  while ((m = dashRe.exec(paragraph)) !== null) {
    const dashPos = m.index;
    // Walk backward across Hebrew/marks/spaces.
    let start = dashPos;
    while (start > 0 && isHebrewOrMark(paragraph[start - 1])) start--;
    const lemma = paragraph.slice(start, dashPos).trim();
    if (!/[֐-׿]/.test(lemma)) continue; // require an actual Hebrew letter

    lemmas.push({
      hebrew: lemma,
      lemmaStart: start,
      dashEnd: dashPos + 1,
    });
  }

  // Assign each lemma's English text: from its dash to the next lemma's start
  // (or end of paragraph).
  for (let i = 0; i < lemmas.length; i++) {
    const textStart = lemmas[i].dashEnd;
    const textEnd = i + 1 < lemmas.length ? lemmas[i + 1].lemmaStart : paragraph.length;
    lemmas[i].text = paragraph.slice(textStart, textEnd).trim();
  }

  return lemmas.filter((l) => l.text.length > 0);
}

function makeMarker(perLineCount) {
  const glyphs = ['*', '†', '‡', '§'];
  if (perLineCount < glyphs.length) return glyphs[perLineCount];
  return String(perLineCount + 1);
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.prayer) {
    console.error('Error: --prayer <id> is required');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const entry = manifest.prayers[args.prayer];
  if (!entry) {
    console.error(`Error: prayer "${args.prayer}" not in manifest.`);
    process.exit(1);
  }

  const bundledPath = path.join(BUNDLED_DIR, `${args.prayer}.json`);
  if (!fs.existsSync(bundledPath)) {
    console.error(`Error: ${bundledPath} not found.`);
    process.exit(1);
  }
  const bundled = JSON.parse(fs.readFileSync(bundledPath, 'utf8'));
  const he = bundled.he ?? [];

  const sourcePath = path.join(REPO_ROOT, manifest.source);
  const allLines = fs.readFileSync(sourcePath, 'utf8').split('\n');
  const sliced = allLines.slice(entry.lineStart - 1, entry.lineEnd).join('\n');

  const paragraphs = sliced
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const perLineMarkerCount = new Map();
  const drafts = [];
  const unanchored = [];

  for (const paragraph of paragraphs) {
    const lemmas = extractLemmas(paragraph);
    for (const lemma of lemmas) {
      const lemmaWords = normalizeWords(lemma.hebrew);
      const anchor = findFirstAnchor(he, lemmaWords, lemma.hebrew);
      if (!anchor) {
        unanchored.push({ hebrew: lemma.hebrew, text: lemma.text.slice(0, 80) });
        continue;
      }
      const count = perLineMarkerCount.get(anchor.lineIndex) ?? 0;
      perLineMarkerCount.set(anchor.lineIndex, count + 1);
      drafts.push({
        lineIndex: anchor.lineIndex,
        wordIndex: anchor.wordIndex,
        marker: makeMarker(count),
        text: lemma.text,
        _anchorMode: anchor.fuzzy ? `fuzzy(${anchor.matchedWord})` : 'exact',
      });
    }
  }

  console.log(`Drafted ${drafts.length} commentary anchor(s) for ${args.prayer}:`);
  for (const d of drafts) {
    const preview = d.text.length > 80 ? d.text.slice(0, 80) + '...' : d.text;
    const mode = d._anchorMode === 'exact' ? '' : ` [${d._anchorMode}]`;
    console.log(`  line ${d.lineIndex}, word ${d.wordIndex}, marker "${d.marker}"${mode}: ${preview}`);
  }
  if (unanchored.length > 0) {
    console.log(`\n${unanchored.length} unanchored lemma(s) (no match in he[]):`);
    for (const u of unanchored.slice(0, 10)) {
      console.log(`  "${u.hebrew}" -> "${u.text}..."`);
    }
    if (unanchored.length > 10) {
      console.log(`  ... and ${unanchored.length - 10} more.`);
    }
  }

  if (args.write) {
    // Strip _anchorMode debug field from the persisted commentary array.
    bundled.commentary = drafts.map(({ _anchorMode, ...rest }) => rest);
    fs.writeFileSync(bundledPath, JSON.stringify(bundled, null, 2) + '\n', 'utf8');
    console.log(`\nWrote ${drafts.length} commentary entries to ${bundledPath}.`);
  } else {
    console.log(`\nRe-run with --write to merge into ${bundledPath}.`);
  }
}

main();
