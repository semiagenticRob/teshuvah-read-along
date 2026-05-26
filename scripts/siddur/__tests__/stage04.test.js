'use strict';

/**
 * Stage 04 tests — Hebrew tokenization and contiguous globalIndex assignment.
 *
 * Jest (jest-expo preset) does not support .mjs transform for scripts, so
 * this is a plain CJS test file. Unit tests use the exported functions via
 * Node's --experimental-vm-modules path (shimmed via dynamic import in a
 * beforeAll), and integration tests assert on the written output files.
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const INTERMEDIATE_DIR = path.join(REPO_ROOT, 'content', 'feigenbaum-2026', 'intermediate');
const SECTIONS_DIR = path.join(INTERMEDIATE_DIR, 'sections');
const STAGE_SCRIPT = path.join(REPO_ROOT, 'scripts', 'siddur', '04_extract_hebrew.mjs');
const TOKENIZE_MODULE = path.join(REPO_ROOT, 'scripts', 'siddur', 'utils', 'hebrewTokenize.mjs');

// ─── Helper: run stage if output missing ────────────────────────────────────

function outputExists(sectionId) {
  return fs.existsSync(path.join(SECTIONS_DIR, `${sectionId}.hebrew.json`));
}

if (!outputExists('birchos_hashachar')) {
  console.log('Stage 04 outputs missing — running stage script…');
  execFileSync(process.execPath, [STAGE_SCRIPT], { stdio: 'inherit' });
}

// ─── Unit test helpers (ESM module loaded via child_process eval) ─────────────

/**
 * Calls tokenizeHebrewLines via a small node child process that imports the
 * ESM module and prints JSON to stdout, so we can use it from CJS tests.
 */
function callTokenize(text) {
  const result = execFileSync(
    process.execPath,
    ['--input-type=module', '--eval',
     `import { tokenizeHebrewLines } from ${JSON.stringify(TOKENIZE_MODULE)};
      const result = tokenizeHebrewLines(${JSON.stringify(text)});
      process.stdout.write(JSON.stringify(result));`],
    { encoding: 'utf8' },
  );
  return JSON.parse(result);
}

/**
 * Calls assignGlobalIndices via a small node child process.
 */
function callAssign(lines, startIndex) {
  const result = execFileSync(
    process.execPath,
    ['--input-type=module', '--eval',
     `import { assignGlobalIndices } from ${JSON.stringify(TOKENIZE_MODULE)};
      const result = assignGlobalIndices(${JSON.stringify(lines)}, ${startIndex});
      process.stdout.write(JSON.stringify(result));`],
    { encoding: 'utf8' },
  );
  return JSON.parse(result);
}

// ─── Unit tests ──────────────────────────────────────────────────────────────

describe('hebrewTokenize — tokenizeHebrewLines', () => {
  test('keeps niqqud intact on a single-line Hebrew string', () => {
    const text = 'מוֹדֶה אֲנִי לְפָנֶיךָ';
    const lines = callTokenize(text);
    expect(lines).toHaveLength(1);
    expect(lines[0].lineIndex).toBe(0);
    expect(lines[0].words).toHaveLength(3);
    // Niqqud characters must be present
    const joined = lines[0].words.join(' ');
    // At least one niqqud code point (U+05B0–U+05C7)
    expect([...joined].some(c => c.codePointAt(0) >= 0x05B0 && c.codePointAt(0) <= 0x05C7)).toBe(true);
    // Words should match (with niqqud preserved)
    expect(lines[0].words[0]).toBe('מוֹדֶה');
    expect(lines[0].words[1]).toBe('אֲנִי');
    expect(lines[0].words[2]).toBe('לְפָנֶיךָ');
  });

  test('filters out non-Hebrew lines, keeps Hebrew lines', () => {
    const text = ['hello', 'שָׁלוֹם', ''].join('\n');
    const lines = callTokenize(text);
    expect(lines).toHaveLength(1);
    expect(lines[0].words[0]).toBe('שָׁלוֹם');
  });
});

describe('hebrewTokenize — assignGlobalIndices', () => {
  test('assigns globalIndices 0, 1, 2 across two lines starting at 0', () => {
    const lines = [
      { lineIndex: 0, words: ['א', 'ב'] },
      { lineIndex: 1, words: ['ג'] },
    ];
    const { lines: out, nextIndex } = callAssign(lines, 0);
    expect(nextIndex).toBe(3);

    expect(out[0].words[0]).toEqual({ text: 'א', globalIndex: 0 });
    expect(out[0].words[1]).toEqual({ text: 'ב', globalIndex: 1 });
    expect(out[1].words[0]).toEqual({ text: 'ג', globalIndex: 2 });
  });

  test('assigns globalIndex starting from non-zero startIndex', () => {
    const lines = [{ lineIndex: 0, words: ['מ'] }];
    const { lines: out, nextIndex } = callAssign(lines, 10);
    expect(out[0].words[0]).toEqual({ text: 'מ', globalIndex: 10 });
    expect(nextIndex).toBe(11);
  });
});

// ─── Integration tests ───────────────────────────────────────────────────────

describe('Stage 04 — integration', () => {
  let data;

  beforeAll(() => {
    const filePath = path.join(SECTIONS_DIR, 'birchos_hashachar.hebrew.json');
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  });

  test('intermediate/sections/birchos_hashachar.hebrew.json exists', () => {
    const filePath = path.join(SECTIONS_DIR, 'birchos_hashachar.hebrew.json');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test('prayer blocks in birchos_hashachar.hebrew.json have `he` with at least 1 line each', () => {
    const prayerBlocks = data.blocks.filter(b => b.kind === 'prayer');
    expect(prayerBlocks.length).toBeGreaterThan(0);
    for (const block of prayerBlocks) {
      expect(Array.isArray(block.he)).toBe(true);
      expect(block.he.length).toBeGreaterThanOrEqual(1);
    }
  });

  test('wordIndexStart/wordIndexEnd are contiguous across consecutive prayer blocks', () => {
    const prayerBlocks = data.blocks.filter(b => b.kind === 'prayer');
    for (let i = 1; i < prayerBlocks.length; i++) {
      const prev = prayerBlocks[i - 1];
      const curr = prayerBlocks[i];
      expect(typeof prev.wordIndexEnd).toBe('number');
      expect(typeof curr.wordIndexStart).toBe('number');
      // Each block's start must immediately follow the previous block's end.
      expect(curr.wordIndexStart).toBe(prev.wordIndexEnd + 1);
    }
  });

  test('rawText is absent from prayer blocks in the hebrew output', () => {
    const prayerBlocks = data.blocks.filter(b => b.kind === 'prayer');
    for (const block of prayerBlocks) {
      expect(Object.prototype.hasOwnProperty.call(block, 'rawText')).toBe(false);
    }
  });
});
