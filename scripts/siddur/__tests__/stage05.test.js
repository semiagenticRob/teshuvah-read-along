'use strict';

/**
 * Stage 05 tests — English paragraphs with Feigenbaum italics preserved.
 *
 * Jest (jest-expo preset) does not support .mjs transform for scripts, so
 * this is a plain CJS test file. Unit tests call the runsToSpans utility via
 * a node child-process eval, and integration tests assert on the written
 * output files.
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const INTERMEDIATE_DIR = path.join(REPO_ROOT, 'content', 'feigenbaum-2026', 'intermediate');
const SECTIONS_DIR = path.join(INTERMEDIATE_DIR, 'sections');
const STAGE_SCRIPT = path.join(REPO_ROOT, 'scripts', 'siddur', '05_extract_english.mjs');
const ITALIC_DETECT_MODULE = path.join(REPO_ROOT, 'scripts', 'siddur', 'utils', 'italicDetect.mjs');

// ─── Helper: run stage if output missing ─────────────────────────────────────

function outputExists(sectionId) {
  return fs.existsSync(path.join(SECTIONS_DIR, `${sectionId}.english.json`));
}

if (!outputExists('birchos_hashachar')) {
  console.log('Stage 05 outputs missing — running stage script…');
  execFileSync(process.execPath, [STAGE_SCRIPT], { stdio: 'inherit' });
}

// ─── Helper: call runsToSpans via child process (ESM from CJS) ───────────────

/**
 * Calls runsToSpans() via a small Node child process that imports the ESM
 * module and prints JSON to stdout, so we can use it from CJS tests.
 */
function callRunsToSpans(runs) {
  const result = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      `import { runsToSpans } from ${JSON.stringify(ITALIC_DETECT_MODULE)};
       const result = runsToSpans(${JSON.stringify(runs)});
       process.stdout.write(JSON.stringify(result));`,
    ],
    { encoding: 'utf8' },
  );
  return JSON.parse(result);
}

// ─── Unit tests — runsToSpans ─────────────────────────────────────────────────

describe('runsToSpans — merging and style assignment', () => {
  test('merges consecutive same-style runs into one span', () => {
    const runs = [
      { text: 'hello ', italic: false, bold: false },
      { text: 'world', italic: false, bold: false },
    ];
    const spans = callRunsToSpans(runs);
    expect(spans).toHaveLength(1);
    expect(spans[0].text).toBe('hello world');
    expect(spans[0].style).toBeUndefined();
  });

  test('breaks at italic boundary, producing 3 spans', () => {
    const runs = [
      { text: 'I ', italic: false, bold: false },
      { text: 'believe', italic: true, bold: false },
      { text: ' in you', italic: false, bold: false },
    ];
    const spans = callRunsToSpans(runs);
    expect(spans).toHaveLength(3);
    expect(spans[0].text).toBe('I');
    expect(spans[0].style).toBeUndefined();
    expect(spans[1].text).toBe('believe');
    expect(spans[1].style).toBe('italic');
    expect(spans[2].text).toBe('in you');
    expect(spans[2].style).toBeUndefined();
  });

  test('bold takes priority over italic when both are true', () => {
    const runs = [
      { text: 'important', italic: true, bold: true },
    ];
    const spans = callRunsToSpans(runs);
    expect(spans).toHaveLength(1);
    expect(spans[0].style).toBe('bold');
  });

  test('empty-only runs are dropped', () => {
    const runs = [
      { text: '  ', italic: false, bold: false },
      { text: 'text', italic: false, bold: false },
    ];
    const spans = callRunsToSpans(runs);
    // The leading whitespace-only run should be dropped
    expect(spans.some(s => s.text.trim() === '')).toBe(false);
    expect(spans.find(s => s.text === 'text')).toBeDefined();
  });
});

// ─── Integration tests ────────────────────────────────────────────────────────

describe('Stage 05 — output files exist', () => {
  test('intermediate/sections/birchos_hashachar.english.json exists', () => {
    expect(outputExists('birchos_hashachar')).toBe(true);
  });

  test('intermediate/sections/hashkamas_haboker.english.json exists', () => {
    expect(outputExists('hashkamas_haboker')).toBe(true);
  });
});

describe('Stage 05 — prayer blocks have en array', () => {
  let data;

  beforeAll(() => {
    const filePath = path.join(SECTIONS_DIR, 'birchos_hashachar.english.json');
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  });

  test('prayer blocks in birchos_hashachar have en (array of EnglishParagraph)', () => {
    const prayerBlocks = data.blocks.filter(b => b.kind === 'prayer');
    expect(prayerBlocks.length).toBeGreaterThan(0);
    for (const block of prayerBlocks) {
      expect(Array.isArray(block.en)).toBe(true);
    }
  });

  test('prayer block en paragraphs have spans arrays', () => {
    const prayerBlocks = data.blocks.filter(b => b.kind === 'prayer');
    for (const block of prayerBlocks) {
      for (const para of block.en) {
        expect(Array.isArray(para.spans)).toBe(true);
      }
    }
  });
});

describe('Stage 05 — italic span count', () => {
  test('total italic spans across all sections is > 50', () => {
    let total = 0;
    const files = fs.readdirSync(SECTIONS_DIR).filter(f => f.endsWith('.english.json'));
    for (const f of files) {
      const d = JSON.parse(fs.readFileSync(path.join(SECTIONS_DIR, f), 'utf8'));
      for (const block of d.blocks) {
        // en is an array for prayer blocks; body is an array for callout/faq/instant_insight.
        // heading has en as string — skip those.
        const paragraphs = Array.isArray(block.en)
          ? block.en
          : Array.isArray(block.body)
          ? block.body
          : [];
        for (const para of paragraphs) {
          for (const span of para.spans || []) {
            if (span.style === 'italic') total++;
          }
        }
      }
    }
    expect(total).toBeGreaterThan(50);
  });
});

describe('Stage 05 — faq/callout/instant_insight blocks have body array', () => {
  test('blocks with kind callout/faq/instant_insight have body (array)', () => {
    const files = fs.readdirSync(SECTIONS_DIR).filter(f => f.endsWith('.english.json'));
    let found = 0;
    for (const f of files) {
      const d = JSON.parse(fs.readFileSync(path.join(SECTIONS_DIR, f), 'utf8'));
      for (const block of d.blocks) {
        if (block.kind === 'callout' || block.kind === 'faq' || block.kind === 'instant_insight') {
          expect(Array.isArray(block.body)).toBe(true);
          found++;
        }
      }
    }
    // Ensure we actually tested something
    expect(found).toBeGreaterThan(0);
  });
});

describe('Stage 05 — runs field removed from processed blocks', () => {
  test('no processed block retains a runs field', () => {
    const files = fs.readdirSync(SECTIONS_DIR).filter(f => f.endsWith('.english.json'));
    for (const f of files) {
      const d = JSON.parse(fs.readFileSync(path.join(SECTIONS_DIR, f), 'utf8'));
      for (const block of d.blocks) {
        // All known block kinds should have runs removed
        if (['prayer', 'callout', 'faq', 'instant_insight', 'heading', 'rubric'].includes(block.kind)) {
          expect(Object.prototype.hasOwnProperty.call(block, 'runs')).toBe(false);
        }
      }
    }
  });
});
