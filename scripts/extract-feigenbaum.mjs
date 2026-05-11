#!/usr/bin/env node
// Extract a single Feigenbaum prayer's English + commentary into the bundled
// prayer JSON.
//
// Why this preserves Sefaria Hebrew: the Feigenbaum PDF's Hebrew text extraction
// has bidirectional-marker artifacts that scramble multi-line verses, but
// Feigenbaum's printed Hebrew IS the standard Nusach Ashkenaz weekday text
// (same words and vowels as Sefaria's). So we keep the existing Sefaria-derived
// `he[]` array (which is already clean) and replace `text[]` with Feigenbaum's
// pedagogical English. Coverage of every Hebrew passage Feigenbaum prints is
// verified separately by scripts/verify-feigenbaum-coverage.mjs.
//
// Usage:
//   node scripts/extract-feigenbaum.mjs --prayer modeh_ani
//   node scripts/extract-feigenbaum.mjs --prayer modeh_ani --dry-run
//
// Reads scripts/feigenbaum-manifest.json for the prayer's line range in
// content/feigenbaum/feigenbaum-siddur-extracted.txt and writes the merged
// JSON to src/data/bundled/shacharit/<prayer>.json with source: "feigenbaum".

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(REPO_ROOT, 'scripts/feigenbaum-manifest.json');
const OUTPUT_DIR = path.join(REPO_ROOT, 'src/data/bundled/shacharit');

function parseArgs(argv) {
  const args = { prayer: null, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--prayer' || argv[i] === '-p') args.prayer = argv[++i];
    else if (argv[i] === '--dry-run' || argv[i] === '-n') args.dryRun = true;
    else if (argv[i] === '--help' || argv[i] === '-h') {
      console.log('Usage: node scripts/extract-feigenbaum.mjs --prayer <id> [--dry-run]');
      process.exit(0);
    }
  }
  return args;
}

const HEBREW_RE = /[֐-׿]/g;
const LATIN_RE = /[A-Za-z]/g;

function isPageHeader(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^[IVXLCDM]+$/.test(trimmed)) return true;
  if (/^\d+\s+(Shacharis|Mincha|Maariv|Birkas|Hashkamas|Pesukei|Krias|Shemoneh|Aleinu|Tachanun)/.test(trimmed)) return true;
  if (/^\d+$/.test(trimmed)) return true;
  // Footer like "‫שחרית • רקובה תמכשה‬"
  if (/^[֐-׿\s•]+$/.test(trimmed) && trimmed.length < 40) return true;
  return false;
}

function classifyLine(line) {
  if (isPageHeader(line)) return 'header';
  const hebrewCount = (line.match(HEBREW_RE) || []).length;
  const latinCount = (line.match(LATIN_RE) || []).length;
  if (hebrewCount === 0 && latinCount === 0) return 'empty';
  if (hebrewCount === 0) return 'english';
  // Mixed lines (Hebrew lemma + English prose) are commentary.
  if (latinCount >= 3) return 'english';
  return 'hebrew';
}

/**
 * Strip Feigenbaum's inline Hebrew-lemma fragments from an English paragraph.
 *
 * Feigenbaum's pedagogical format inlines `‫ HEBREW ‬— English` pairs inside
 * what reads otherwise as continuous English commentary. For the English
 * display lane (`text[]`), we want clean English. The Hebrew lemmas live
 * separately on `commentary[]` once anchor-commentary.mjs runs.
 *
 * This stripper:
 *   - Removes bidi-isolated Hebrew runs (anything between U+202B/U+202E and
 *     U+202C, plus loose Hebrew letters/marks not enclosed in markers).
 *   - Drops the leading em-dash if it now starts a clause (was a lemma
 *     separator).
 *   - Collapses doubled whitespace and punctuation that the removal leaves.
 */
function stripHebrewFragments(text) {
  return text
    .replace(/[‪-‮⁦-⁩]/g, '')           // remove bidi isolate/embedding marks
    .replace(/[֐-׿]+/g, '')             // remove all Hebrew letters + nikud
    .replace(/\s+—\s+/g, ' — ')         // normalize em-dash spacing
    .replace(/(^|\s)—\s+/g, '$1')        // drop leading em-dash (was lemma sep)
    .replace(/\(\s*\)/g, '')             // empty parens from stripped Hebrew
    .replace(/\(\s*$/g, '')              // orphan open-paren at end (stripped lemma)
    .replace(/^\s*\)/g, '')              // orphan close-paren at start
    .replace(/[;,]\s*[;,]/g, ',')        // doubled punctuation
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/[ \t]+\(\s*\.?\s*$/g, '.') // trailing "( ." or "(." → "."
    // Leading orphan punctuation from stripped Hebrew at start of paragraph.
    // Repeat until stable so combinations like "— / / / / Text" fully clean.
    .replace(/^[\s/,:;.—–]+/g, '')
    .replace(/^[\s/,:;.—–]+/g, '')
    .trim();
}

/**
 * Walk the slice and collect English commentary paragraphs.
 *
 * Only blank lines and page headers terminate paragraphs. Hebrew-classified
 * lines get folded in alongside English so that punctuation marooned on a
 * mostly-Hebrew line (e.g., the closing `.` of an English sentence that
 * happens to fall on the same wrap as a Hebrew quotation) survives the
 * later stripHebrewFragments pass. A paragraph that ends up empty after
 * stripping is filtered out at the end.
 */
/**
 * Classify an extracted English paragraph as one of:
 *   - 'faq'        — Feigenbaum's "FAQ: ..." Q&A callouts.
 *   - 'callout'    — "Instant Insight: ..." pedagogical notes.
 *   - 'heading'    — Section title style: short, strong statement, often all
 *                    caps or ends with "!". E.g. "MY BODY WORKS!",
 *                    "OUR REQUESTS", "Last Thoughts before Pesukei D'Zimrah".
 *   - 'subheading' — Mid-prose interjection. Conversational opener (OK / But /
 *                    And then), short-medium, ends with "!" or "?", no
 *                    sentence-internal periods.
 *   - 'body'       — Everything else (the running commentary).
 */
/**
 * Detect Feigenbaum English paragraphs that describe or translate
 * minyan-required content (Kaddish, Borchu, Kedushah responsives, Birkat
 * Cohanim). The app is a solo-davener tool — minyan-required content is
 * deliberately omitted from rendering, so these paragraphs are dropped
 * from text[]/textBlocks[] at extraction time.
 *
 * Patterns are aggressive on purpose. If a paragraph mentions Kaddish or
 * carries the canonical Kaddish responsive ("And to that we respond:
 * Absolutely, we agree!"), it goes.
 */
function isMinyanContent(text) {
  if (!text) return false;
  if (/\bKaddish\b/i.test(text)) return true;
  if (/yehei\s+shemei\s+rabba/i.test(text)) return true;
  if (/\byisga?dd?al\b/i.test(text)) return true;
  if (/yisbarach v.?yishtabach/i.test(text)) return true;
  if (/oseh\s+shalom\s+bi[mn]romav/i.test(text)) return true;
  if (/\bBorchu\b/i.test(text)) return true;
  if (/\bKedushah\b/i.test(text)) return true;
  if (/\bBirkat\s+Cohanim\b/i.test(text)) return true;
  if (/\bduchanen\b/i.test(text)) return true;
  // The canonical Kaddish response, used by Feigenbaum after every Kaddish
  // recitation. Distinct enough that it only appears in Kaddish translation.
  if (/and to that we respond.{0,20}absolutely.{0,5}we agree/i.test(text)) return true;
  return false;
}

function classifyParagraph(text) {
  const t = text.trim();
  if (!t) return 'body';
  if (/^FAQ\s*:/i.test(t)) return 'faq';
  if (/^Instant Insight\s*:/i.test(t)) return 'callout';

  const letters = (t.match(/[A-Za-z]/g) || []).length;
  const uppers = (t.match(/[A-Z]/g) || []).length;

  // All-caps short phrase: section header.
  if (letters >= 3 && uppers / letters > 0.7 && t.length < 80) return 'heading';

  // Heading style: short title-ish line with no internal sentence punctuation,
  // optionally ending in "!" or "?".
  const endsWithBang = /[!?]$/.test(t);
  const hasInternalPunct = /[.,;:][^!?]/.test(t);

  if (t.length <= 50 && !hasInternalPunct) return 'heading';
  if (endsWithBang && t.length < 80 && !hasInternalPunct) return 'heading';

  // Subheading: longer interjection that ends with "!" or "?" and lacks
  // sentence-internal periods.
  if (endsWithBang && t.length < 130 && !/\./.test(t.slice(0, -1))) return 'subheading';

  return 'body';
}

function extractEnglishParagraphs(rawLines) {
  const paragraphs = [];
  let current = [];
  let hasEnglishContent = false;

  const flush = () => {
    if (hasEnglishContent && current.length > 0) {
      paragraphs.push(current.join(' ').replace(/\s+/g, ' ').trim());
    }
    current = [];
    hasEnglishContent = false;
  };

  for (const line of rawLines) {
    const kind = classifyLine(line);
    if (kind === 'empty' || kind === 'header') {
      flush();
      continue;
    }
    current.push(line.trim());
    if (kind === 'english') hasEnglishContent = true;
  }
  flush();

  return paragraphs
    .map(stripHebrewFragments)
    .filter(Boolean)
    .filter((p) => !isMinyanContent(p));
}

function loadExistingBundled(prayerId) {
  const p = path.join(OUTPUT_DIR, `${prayerId}.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
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
    console.error(`Error: prayer "${args.prayer}" not in manifest. Add an entry to scripts/feigenbaum-manifest.json first.`);
    process.exit(1);
  }

  const existing = loadExistingBundled(args.prayer);
  if (!existing) {
    console.error(`Error: no existing bundled JSON at src/data/bundled/shacharit/${args.prayer}.json. Hebrew must come from the existing Sefaria-derived file.`);
    process.exit(1);
  }

  const sourcePath = path.join(REPO_ROOT, manifest.source);
  const allLines = fs.readFileSync(sourcePath, 'utf8').split('\n');
  const sliced = allLines.slice(entry.lineStart - 1, entry.lineEnd);
  const englishParagraphs = extractEnglishParagraphs(sliced);
  const textBlocks = englishParagraphs.map((text) => ({
    kind: classifyParagraph(text),
    text,
  }));

  // Preserve Hebrew from the existing bundled JSON (the standard Ashkenaz
  // weekday text Feigenbaum prints), but rewrite ref + source + English.
  const output = {
    ref: entry.ref,
    he: existing.he,
    text: englishParagraphs,
    textBlocks,
    heTitle: existing.heTitle ?? args.prayer,
    source: 'feigenbaum',
    ...(existing.commentary ? { commentary: existing.commentary } : {}),
    ...(existing.segments ? { segments: existing.segments } : {}),
  };

  if (args.dryRun) {
    console.log(JSON.stringify(output, null, 2));
    console.log(`\n[dry-run] Hebrew lines preserved: ${output.he.length}. Feigenbaum English paragraphs: ${englishParagraphs.length}.`);
    return;
  }

  const outPath = path.join(OUTPUT_DIR, `${args.prayer}.json`);
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${outPath}`);
  console.log(`  Hebrew: ${output.he.length} lines (preserved from existing JSON).`);
  console.log(`  English: ${englishParagraphs.length} paragraphs (Feigenbaum).`);
  console.log(`  Next: run \`node scripts/verify-feigenbaum-coverage.mjs --prayer ${args.prayer}\` to confirm Hebrew coverage.`);
}

main();
