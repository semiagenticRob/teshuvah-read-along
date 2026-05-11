#!/usr/bin/env node
// Detect lines in a bundled prayer JSON that look like they contain
// minyan-only content (Kaddish, Borchu, Kedushah responsives, Birkat Cohanim).
// Reports candidate (lineIndex, suggested label) tuples for editorial review;
// optionally writes them into the prayer's segments[] array as minyanOnly
// segments.
//
// What it looks for (Hebrew + English patterns, both sides must agree for a
// candidate to fire — reduces false positives from prayer body text that
// happens to mention these terms):
//   - Kaddish (יִתְגַּדַּל וְיִתְקַדַּשׁ ...)
//   - Borchu (בָּרְכוּ אֶת ה' הַמְבֹרָךְ ...)
//   - Kedushah responsive (קָדוֹשׁ קָדוֹשׁ קָדוֹשׁ ...) — flagged with note
//     because the Yotzer Or quotation is recited by all, only the chazzan-
//     led version is minyan-only.
//   - Birkat Cohanim wrap (יְבָרֶכְךָ ה' וְיִשְׁמְרֶךָ ...)
//
// Usage:
//   node scripts/detect-minyan-segments.mjs --prayer amidah
//   node scripts/detect-minyan-segments.mjs --all
//   node scripts/detect-minyan-segments.mjs --prayer amidah --write

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const BUNDLED_DIR = path.join(REPO_ROOT, 'src/data/bundled/shacharit');

const SHACHARIT_PRAYER_IDS = [
  'modeh_ani', 'netilat_yadayim', 'asher_yatzar', 'elokai_neshama',
  'birchot_hatorah', 'birchot_hashachar', 'akedah', 'korbanot',
  'pesukei_dezimrah', 'shema', 'amidah', 'tachanun',
  'ashrei_uva_letziyon', 'aleinu', 'shir_shel_yom',
];

/**
 * A signal fires only when BOTH the Hebrew and English/transliteration sides
 * agree, which avoids false positives when prayer body text incidentally
 * mentions these names.
 */
const SIGNALS = [
  {
    label: 'Kaddish',
    hePattern: /יִתְגַּדַּל[ ְ-ׇֽֿׁׂׅׄ]*\s+וְיִתְקַדַּשׁ/,
    enPattern: /Kaddish|May.{0,20}name.{0,20}great|magnified.{0,30}sanctified/i,
    note: 'said with a minyan',
  },
  {
    label: 'Borchu',
    hePattern: /בָּרְכוּ\s+אֶת\s+יְהֹוָה/,
    enPattern: /Borchu|Bless\s+the\s+Lord/i,
    note: 'said with a minyan',
  },
  {
    label: 'Kedushah responsive',
    hePattern: /נְקַדֵּשׁ\s+אֶת\s+שִׁמְךָ|כֶּתֶר\s+יִתְּנוּ/,
    enPattern: /Kedushah|We sanctify Your name|sanctification of God/i,
    note: 'said with a minyan (chazzan-led)',
  },
  {
    label: 'Birkat Cohanim',
    hePattern: /יְבָרֶכְךָ\s+יְהֹוָה\s+וְיִשְׁמְרֶךָ/,
    enPattern: /Birkat Cohanim|priestly blessing|May.{0,20}Lord.{0,20}bless.{0,20}keep/i,
    note: 'said with cohanim present',
  },
];

function parseArgs(argv) {
  const args = { prayer: null, all: false, write: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--prayer' || argv[i] === '-p') args.prayer = argv[++i];
    else if (argv[i] === '--all' || argv[i] === '-a') args.all = true;
    else if (argv[i] === '--write' || argv[i] === '-w') args.write = true;
    else if (argv[i] === '--help' || argv[i] === '-h') {
      console.log('Usage: node scripts/detect-minyan-segments.mjs (--prayer <id> | --all) [--write]');
      process.exit(0);
    }
  }
  return args;
}

function scanPrayer(prayerId) {
  const p = path.join(BUNDLED_DIR, `${prayerId}.json`);
  if (!fs.existsSync(p)) return null;
  const bundled = JSON.parse(fs.readFileSync(p, 'utf8'));
  const he = bundled.he ?? [];
  const text = bundled.text ?? [];

  const candidates = [];
  const max = Math.max(he.length, text.length);
  for (let i = 0; i < max; i++) {
    const heLine = he[i] ?? '';
    const enLine = text[i] ?? '';
    for (const signal of SIGNALS) {
      if (signal.hePattern.test(heLine) && signal.enPattern.test(enLine)) {
        candidates.push({
          lineIndex: i,
          minyanOnly: true,
          minyanLabel: signal.label,
          _note: signal.note,
          _hePreview: heLine.slice(0, 60),
          _enPreview: enLine.slice(0, 60),
        });
        break;
      }
    }
  }
  return { prayerId, candidates, bundled, path: p };
}

function main() {
  const args = parseArgs(process.argv);
  const targets = args.all ? SHACHARIT_PRAYER_IDS : args.prayer ? [args.prayer] : null;
  if (!targets) {
    console.error('Error: --prayer <id> or --all required');
    process.exit(1);
  }

  let totalCandidates = 0;
  for (const prayer of targets) {
    const result = scanPrayer(prayer);
    if (!result) {
      console.log(`  - ${prayer}: not found`);
      continue;
    }
    if (result.candidates.length === 0) {
      console.log(`  - ${prayer}: no minyan-only candidates`);
      continue;
    }
    console.log(`\n${prayer}: ${result.candidates.length} candidate(s)`);
    for (const c of result.candidates) {
      console.log(`  line ${c.lineIndex} [${c.minyanLabel}] — ${c._note}`);
      console.log(`    he: ${c._hePreview}`);
      console.log(`    en: ${c._enPreview}`);
    }
    totalCandidates += result.candidates.length;

    if (args.write) {
      const existing = result.bundled.segments ?? [];
      const existingKeys = new Set(existing.map((s) => `${s.lineIndex}:${s.minyanLabel ?? ''}`));
      const newSegs = result.candidates
        .map(({ _note, _hePreview, _enPreview, ...rest }) => rest)
        .filter((s) => !existingKeys.has(`${s.lineIndex}:${s.minyanLabel ?? ''}`));
      result.bundled.segments = [...existing, ...newSegs].sort((a, b) => a.lineIndex - b.lineIndex);
      fs.writeFileSync(result.path, JSON.stringify(result.bundled, null, 2) + '\n', 'utf8');
      console.log(`  → wrote ${newSegs.length} new segments to ${result.path}`);
    }
  }

  console.log(`\nTotal: ${totalCandidates} candidate(s) across ${targets.length} prayer(s).`);
  if (!args.write && totalCandidates > 0) {
    console.log(`Re-run with --write to merge into segments[].`);
  }
}

main();
