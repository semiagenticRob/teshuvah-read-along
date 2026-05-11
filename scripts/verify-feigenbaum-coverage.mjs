#!/usr/bin/env node
// Verify Hebrew coverage between Feigenbaum's printed text and our bundled
// `he[]` array.
//
// Why character-level: the PDF extraction has bidirectional-marker artifacts
// that fragment Hebrew words across line wraps. Word-level matching produces
// catastrophic false positives. Character-level multiset comparison is robust
// to PDF reordering and word fragmentation while still detecting actual
// missing/extra content.
//
// What it reports:
//   - Total Hebrew character counts (Feigenbaum vs bundled)
//   - Per-letter histogram delta (where they diverge)
//   - Pass/fail flag based on a configurable tolerance
//
// Manual visual verification against the PDF is still recommended for any
// prayer flagged here. This tool catches gross deltas; it does not catch
// subtle vowel/cantillation errors.
//
// Usage:
//   node scripts/verify-feigenbaum-coverage.mjs --prayer modeh_ani
//   node scripts/verify-feigenbaum-coverage.mjs --prayer modeh_ani --tolerance 0.05

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(REPO_ROOT, 'scripts/feigenbaum-manifest.json');
const BUNDLED_DIR = path.join(REPO_ROOT, 'src/data/bundled/shacharit');

function parseArgs(argv) {
  const args = { prayer: null, tolerance: 0.10 };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--prayer' || argv[i] === '-p') args.prayer = argv[++i];
    else if (argv[i] === '--tolerance' || argv[i] === '-t') args.tolerance = parseFloat(argv[++i]);
    else if (argv[i] === '--help' || argv[i] === '-h') {
      console.log('Usage: node scripts/verify-feigenbaum-coverage.mjs --prayer <id> [--tolerance 0.10]');
      process.exit(0);
    }
  }
  return args;
}

// Hebrew letters (skeletal alphabet — consonant skeleton matters; nikud may
// not survive PDF extraction faithfully).
const HEBREW_LETTER_RE = /[א-ת]/g;
// Final letter forms — map to their non-final equivalents so coverage isn't
// thrown off by word-internal positions in fragmented PDF text.
const FINAL_FORM_MAP = {
  'ך': 'כ',
  'ם': 'מ',
  'ן': 'נ',
  'ף': 'פ',
  'ץ': 'צ',
};

function normalizeLetters(text) {
  const letters = text.match(HEBREW_LETTER_RE) || [];
  return letters.map((c) => FINAL_FORM_MAP[c] ?? c);
}

function histogram(letters) {
  const h = new Map();
  for (const c of letters) {
    h.set(c, (h.get(c) ?? 0) + 1);
  }
  return h;
}

function diffHistograms(a, b) {
  const keys = new Set([...a.keys(), ...b.keys()]);
  const diff = [];
  for (const k of keys) {
    const aCount = a.get(k) ?? 0;
    const bCount = b.get(k) ?? 0;
    if (aCount !== bCount) {
      diff.push({ letter: k, feigenbaum: aCount, bundled: bCount, delta: aCount - bCount });
    }
  }
  diff.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
  return diff;
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

  const sourcePath = path.join(REPO_ROOT, manifest.source);
  const allLines = fs.readFileSync(sourcePath, 'utf8').split('\n');
  const sliced = allLines.slice(entry.lineStart - 1, entry.lineEnd).join('\n');

  // Strip out English (Latin) commentary lines so the Hebrew-only feigenbaum
  // letter set isn't inflated by quoted Hebrew lemmas inside English prose.
  // Keep only chunks that are predominantly Hebrew.
  const feigenbaumHebrewOnly = sliced
    .split('\n')
    .filter((line) => {
      const hebrew = (line.match(HEBREW_LETTER_RE) || []).length;
      const latin = (line.match(/[A-Za-z]/g) || []).length;
      return hebrew > 0 && latin < 3;
    })
    .join('\n');

  const feigenbaumLetters = normalizeLetters(feigenbaumHebrewOnly);

  const bundledPath = path.join(BUNDLED_DIR, `${args.prayer}.json`);
  if (!fs.existsSync(bundledPath)) {
    console.error(`Error: ${bundledPath} not found.`);
    process.exit(1);
  }
  const bundled = JSON.parse(fs.readFileSync(bundledPath, 'utf8'));
  const bundledLetters = normalizeLetters((bundled.he || []).join(' '));

  const fHist = histogram(feigenbaumLetters);
  const bHist = histogram(bundledLetters);
  const diffs = diffHistograms(fHist, bHist);

  const f = feigenbaumLetters.length;
  const b = bundledLetters.length;
  const ratio = f === 0 ? 0 : b / f;
  const tolerance = args.tolerance;
  const withinTolerance = Math.abs(ratio - 1) <= tolerance;

  console.log(`Coverage check: ${args.prayer}`);
  console.log(`  Feigenbaum Hebrew letter count: ${f}`);
  console.log(`  Bundled Hebrew letter count:    ${b}`);
  console.log(`  Ratio (bundled/feigenbaum):     ${ratio.toFixed(3)}`);
  console.log(`  Tolerance:                      ±${(tolerance * 100).toFixed(0)}%`);

  if (withinTolerance && diffs.length === 0) {
    console.log(`\n  ✓ Coverage matches within tolerance and letter histograms are identical.`);
    process.exit(0);
  }

  if (withinTolerance) {
    console.log(`\n  ✓ Total letter count within tolerance, but histogram differs:`);
  } else {
    console.log(`\n  ⚠ Letter count differs by more than ${(tolerance * 100).toFixed(0)}%.`);
  }

  if (diffs.length > 0) {
    console.log(`\n  Letter histogram delta (Feigenbaum vs bundled):`);
    for (const d of diffs.slice(0, 20)) {
      const sign = d.delta > 0 ? '+' : '';
      console.log(`    ${d.letter}: feigenbaum=${d.feigenbaum}, bundled=${d.bundled} (${sign}${d.delta})`);
    }
    if (diffs.length > 20) {
      console.log(`    ... and ${diffs.length - 20} more letters with non-zero deltas.`);
    }
  }

  console.log(`\nNext step: visually verify the bundled he[] against the PDF (content/feigenbaum/feigenbaum-siddur-original.pdf) around the prayer. Large positive deltas (Feigenbaum > bundled) likely mean missing content in bundled he[]. Large negative deltas mean bundled has more than Feigenbaum (unlikely for standard Ashkenaz weekday).`);
  process.exit(withinTolerance && diffs.length === 0 ? 0 : 2);
}

main();
