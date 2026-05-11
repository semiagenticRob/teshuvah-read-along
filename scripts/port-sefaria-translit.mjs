#!/usr/bin/env node
// Verify that the existing Sefaria-derived transliteration JSON aligns with
// the bundled Hebrew JSON, line-by-line and word-count-by-word-count.
//
// Background: Task #9 establishes that Feigenbaum's printed Hebrew is the
// same standard Nusach Ashkenaz weekday text as our Sefaria-derived `he[]`,
// so we preserve the existing translit JSONs (which were word-aligned to that
// Hebrew when generated). This script confirms the alignment is still valid
// after any Hebrew edits, and flags lines that need re-transliteration.
//
// What it checks per prayer:
//   - `he[]` and `translit[]` have the same length.
//   - For each line, Hebrew word count >= translit word count (Hebrew is
//     authoritative; translit may be shorter for unvoweled or untransliterable
//     lines, which is acceptable).
//   - Empty translit lines are listed so a generator can fill them.
//
// Usage:
//   node scripts/port-sefaria-translit.mjs --prayer modeh_ani
//   node scripts/port-sefaria-translit.mjs --all
//
// If gaps are found, regenerate via scripts/generate_shacharit_translit.py.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const BUNDLED_DIR = path.join(REPO_ROOT, 'src/data/bundled/shacharit');

const SHACHARIT_PRAYER_IDS = [
  'modeh_ani',
  'netilat_yadayim',
  'asher_yatzar',
  'elokai_neshama',
  'birchot_hatorah',
  'birchot_hashachar',
  'akedah',
  'korbanot',
  'pesukei_dezimrah',
  'shema',
  'amidah',
  'tachanun',
  'ashrei_uva_letziyon',
  'aleinu',
  'shir_shel_yom',
];

function parseArgs(argv) {
  const args = { prayer: null, all: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--prayer' || argv[i] === '-p') args.prayer = argv[++i];
    else if (argv[i] === '--all' || argv[i] === '-a') args.all = true;
    else if (argv[i] === '--help' || argv[i] === '-h') {
      console.log('Usage: node scripts/port-sefaria-translit.mjs (--prayer <id> | --all)');
      process.exit(0);
    }
  }
  return args;
}

function countWords(s) {
  if (!s) return 0;
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function checkPrayer(prayerId) {
  const hePath = path.join(BUNDLED_DIR, `${prayerId}.json`);
  const trPath = path.join(BUNDLED_DIR, `${prayerId}.translit.json`);

  if (!fs.existsSync(hePath)) {
    return { ok: false, reason: `Missing ${prayerId}.json` };
  }
  if (!fs.existsSync(trPath)) {
    return { ok: false, reason: `Missing ${prayerId}.translit.json` };
  }

  const bundled = JSON.parse(fs.readFileSync(hePath, 'utf8'));
  const translit = JSON.parse(fs.readFileSync(trPath, 'utf8'));

  const heLines = bundled.he ?? [];
  const trLines = translit.translit ?? [];

  const issues = [];
  if (heLines.length !== trLines.length) {
    issues.push(`Length mismatch: he[].length=${heLines.length}, translit[].length=${trLines.length}`);
  }

  const minLen = Math.min(heLines.length, trLines.length);
  let gapLines = 0;
  let shortLines = 0;
  for (let i = 0; i < minLen; i++) {
    const heCount = countWords(heLines[i]);
    const trCount = countWords(trLines[i]);
    if (heCount > 0 && trCount === 0) {
      gapLines++;
      issues.push(`  line ${i}: he has ${heCount} words, translit is empty`);
    } else if (trCount > 0 && trCount < heCount * 0.5) {
      shortLines++;
      issues.push(`  line ${i}: he=${heCount} words, translit=${trCount} words (likely partial)`);
    }
  }

  return {
    ok: issues.length === 0,
    prayerId,
    heLineCount: heLines.length,
    trLineCount: trLines.length,
    gapLines,
    shortLines,
    issues,
  };
}

function main() {
  const args = parseArgs(process.argv);
  const targets = args.all ? SHACHARIT_PRAYER_IDS : args.prayer ? [args.prayer] : null;
  if (!targets) {
    console.error('Error: --prayer <id> or --all is required');
    process.exit(1);
  }

  let failureCount = 0;
  for (const prayer of targets) {
    const result = checkPrayer(prayer);
    if (result.ok) {
      console.log(`✓ ${prayer}: ${result.heLineCount} lines aligned`);
    } else {
      failureCount++;
      console.log(`⚠ ${prayer}: ${result.reason ?? `${result.gapLines} gaps, ${result.shortLines} short lines`}`);
      for (const issue of (result.issues ?? []).slice(0, 10)) {
        console.log(`    ${issue}`);
      }
      if ((result.issues ?? []).length > 10) {
        console.log(`    ... and ${result.issues.length - 10} more issues.`);
      }
    }
  }

  if (failureCount > 0) {
    console.log(`\n${failureCount} prayer(s) need transliteration follow-up.`);
    console.log(`Regenerate gaps via: python3 scripts/generate_shacharit_translit.py <prayer_id>`);
    process.exit(2);
  }
  console.log(`\nAll ${targets.length} prayer(s) clean.`);
}

main();
