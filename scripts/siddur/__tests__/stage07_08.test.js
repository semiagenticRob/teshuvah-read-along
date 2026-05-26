'use strict';

/**
 * Stage 07-08 tests — minyan detection + conditional tagging.
 *
 * Jest (jest-expo preset) does not support .mjs transform for scripts, so
 * this is a plain CJS test file. Integration tests assert on written output files.
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const SECTIONS_DIR = path.join(
  REPO_ROOT,
  'content',
  'feigenbaum-2026',
  'intermediate',
  'sections',
);
const STAGE07_SCRIPT = path.join(REPO_ROOT, 'scripts', 'siddur', '07_detect_minyan.mjs');
const STAGE08_SCRIPT = path.join(REPO_ROOT, 'scripts', 'siddur', '08_tag_conditional.mjs');

// ─── Helper: run stages if outputs are missing ────────────────────────────────

function minyanExists(sectionId) {
  return fs.existsSync(path.join(SECTIONS_DIR, `${sectionId}.minyan.json`));
}

function conditionalExists(sectionId) {
  return fs.existsSync(path.join(SECTIONS_DIR, `${sectionId}.conditional.json`));
}

if (!minyanExists('barchu')) {
  console.log('Stage 07 outputs missing — running stage script…');
  execFileSync(process.execPath, [STAGE07_SCRIPT], { stdio: 'inherit' });
}

if (!conditionalExists('tachanun_shacharit')) {
  console.log('Stage 08 outputs missing — running stage script…');
  execFileSync(process.execPath, [STAGE08_SCRIPT], { stdio: 'inherit' });
}

// ─── Test 1: Output files exist ───────────────────────────────────────────────

describe('Stage 07 — minyan output files exist', () => {
  test('barchu.minyan.json exists', () => {
    expect(minyanExists('barchu')).toBe(true);
  });

  test('tachanun_shacharit.minyan.json exists', () => {
    expect(minyanExists('tachanun_shacharit')).toBe(true);
  });
});

describe('Stage 08 — conditional output files exist', () => {
  test('barchu.conditional.json exists', () => {
    expect(conditionalExists('barchu')).toBe(true);
  });

  test('tachanun_shacharit.conditional.json exists', () => {
    expect(conditionalExists('tachanun_shacharit')).toBe(true);
  });
});

// ─── Test 2: All blocks in barchu are minyan_only ─────────────────────────────

describe('Stage 07 — barchu is fully minyan_only', () => {
  let data;

  beforeAll(() => {
    data = JSON.parse(
      fs.readFileSync(path.join(SECTIONS_DIR, 'barchu.minyan.json'), 'utf8')
    );
  });

  test('all blocks in barchu.minyan.json have kind === "minyan_only"', () => {
    expect(data.blocks.length).toBeGreaterThan(0);
    for (const block of data.blocks) {
      expect(block.kind).toBe('minyan_only');
    }
  });

  test('no prayer blocks remain in barchu.minyan.json', () => {
    const prayerBlocks = data.blocks.filter(b => b.kind === 'prayer');
    expect(prayerBlocks.length).toBe(0);
  });
});

// ─── Test 3: Words in minyan_only blocks have globalIndex === -1 ──────────────

describe('Stage 07 — minyan_only words have globalIndex -1', () => {
  let data;

  beforeAll(() => {
    data = JSON.parse(
      fs.readFileSync(path.join(SECTIONS_DIR, 'barchu.minyan.json'), 'utf8')
    );
  });

  test('all words in barchu minyan_only blocks have globalIndex < 0', () => {
    const minyanBlocks = data.blocks.filter(b => b.kind === 'minyan_only');
    expect(minyanBlocks.length).toBeGreaterThan(0);

    for (const block of minyanBlocks) {
      if (!block.he) continue;
      for (const line of block.he) {
        for (const word of line.words) {
          expect(word.globalIndex).toBe(-1);
        }
      }
    }
  });
});

// ─── Test 4: tachanun_shacharit has skip_on conditionalTags ──────────────────

describe('Stage 08 — tachanun_shacharit has skip_on conditional tags', () => {
  let data;

  beforeAll(() => {
    data = JSON.parse(
      fs.readFileSync(path.join(SECTIONS_DIR, 'tachanun_shacharit.conditional.json'), 'utf8')
    );
  });

  test('at least one block in tachanun_shacharit.conditional.json has conditionalTags', () => {
    const blocksWithTags = data.blocks.filter(
      b => Array.isArray(b.conditionalTags) && b.conditionalTags.length > 0
    );
    expect(blocksWithTags.length).toBeGreaterThan(0);
  });

  test('at least one block has a skip_on conditionalTag', () => {
    const blocksWithSkipOn = data.blocks.filter(
      b =>
        Array.isArray(b.conditionalTags) &&
        b.conditionalTags.some(t => t.type === 'skip_on')
    );
    expect(blocksWithSkipOn.length).toBeGreaterThan(0);
  });

  test('skip_on tag contains expected days (rosh_chodesh)', () => {
    const firstTagged = data.blocks.find(
      b =>
        Array.isArray(b.conditionalTags) &&
        b.conditionalTags.some(t => t.type === 'skip_on')
    );
    const skipTag = firstTagged.conditionalTags.find(t => t.type === 'skip_on');
    expect(Array.isArray(skipTag.days)).toBe(true);
    expect(skipTag.days).toContain('rosh_chodesh');
  });
});

// ─── Test 5: mussaf_rosh_chodesh has rosh_chodesh_only conditionalRule ────────

describe('Stage 08 — mussaf_rosh_chodesh has section-level conditionalRule', () => {
  let data;

  beforeAll(() => {
    data = JSON.parse(
      fs.readFileSync(
        path.join(SECTIONS_DIR, 'mussaf_rosh_chodesh.conditional.json'),
        'utf8'
      )
    );
  });

  test('mussaf_rosh_chodesh.conditional.json has conditionalRule', () => {
    expect(data.conditionalRule).toBeDefined();
  });

  test('conditionalRule.type === "rosh_chodesh_only"', () => {
    expect(data.conditionalRule.type).toBe('rosh_chodesh_only');
  });
});

// ─── Test 6: birchos_hashachar prayer blocks are contiguously renumbered ──────

describe('Stage 07 — birchos_hashachar prayer block renumbering', () => {
  let data;

  beforeAll(() => {
    data = JSON.parse(
      fs.readFileSync(
        path.join(SECTIONS_DIR, 'birchos_hashachar.minyan.json'),
        'utf8'
      )
    );
  });

  test('first prayer block wordIndexStart is 0', () => {
    const prayerBlocks = data.blocks.filter(b => b.kind === 'prayer');
    expect(prayerBlocks.length).toBeGreaterThan(0);
    expect(prayerBlocks[0].wordIndexStart).toBe(0);
  });

  test('prayer block wordIndexStart / wordIndexEnd values are contiguous', () => {
    const prayerBlocks = data.blocks.filter(b => b.kind === 'prayer');
    for (let i = 1; i < prayerBlocks.length; i++) {
      const prev = prayerBlocks[i - 1];
      const curr = prayerBlocks[i];
      expect(curr.wordIndexStart).toBe(prev.wordIndexEnd + 1);
    }
  });

  test('first word of first prayer block has globalIndex === 0', () => {
    const prayerBlocks = data.blocks.filter(b => b.kind === 'prayer');
    const firstBlock = prayerBlocks[0];
    expect(firstBlock.he[0].words[0].globalIndex).toBe(0);
  });
});
