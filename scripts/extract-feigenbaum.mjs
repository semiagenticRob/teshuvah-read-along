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
 * Walk the slice and collect English commentary paragraphs.
 * Hebrew-only lines and page headers act as paragraph terminators.
 */
function extractEnglishParagraphs(rawLines) {
  const paragraphs = [];
  let current = [];
  for (const line of rawLines) {
    const kind = classifyLine(line);
    if (kind === 'english') {
      current.push(line.trim());
    } else {
      if (current.length > 0) {
        paragraphs.push(current.join(' ').replace(/\s+/g, ' ').trim());
        current = [];
      }
    }
  }
  if (current.length > 0) {
    paragraphs.push(current.join(' ').replace(/\s+/g, ' ').trim());
  }
  return paragraphs.filter(Boolean);
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

  // Preserve Hebrew from the existing bundled JSON (the standard Ashkenaz
  // weekday text Feigenbaum prints), but rewrite ref + source + English.
  const output = {
    ref: entry.ref,
    he: existing.he,
    text: englishParagraphs,
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
