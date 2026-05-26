'use strict';

/**
 * Stage 09 tests — Learn essay anchoring (bidirectional).
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
  'sections'
);
const ESSAYS_DIR = path.join(
  REPO_ROOT,
  'content',
  'feigenbaum-2026',
  'intermediate',
  'essays'
);
const STAGE09_SCRIPT = path.join(REPO_ROOT, 'scripts', 'siddur', '09_anchor_learn.mjs');

// ─── Helper ───────────────────────────────────────────────────────────────────

function learnExists(sectionId) {
  return fs.existsSync(path.join(SECTIONS_DIR, `${sectionId}.learn.json`));
}

function essayExists(essayId) {
  return fs.existsSync(path.join(ESSAYS_DIR, `${essayId}.json`));
}

// Run stage 09 if outputs are missing
if (!learnExists('pitum_haketores') || !essayExists('appendix_09_korbanos')) {
  console.log('Stage 09 outputs missing — running stage script…');
  execFileSync(process.execPath, [STAGE09_SCRIPT], { stdio: 'inherit' });
}

// ─── Test 1: pitum_haketores.learn.json has learn_link for korbanos ───────────

describe('Stage 09 — pitum_haketores.learn.json has learn_link block', () => {
  let data;

  beforeAll(() => {
    data = JSON.parse(
      fs.readFileSync(path.join(SECTIONS_DIR, 'pitum_haketores.learn.json'), 'utf8')
    );
  });

  test('pitum_haketores.learn.json exists', () => {
    expect(learnExists('pitum_haketores')).toBe(true);
  });

  test('blocks array contains a learn_link block', () => {
    const linkBlock = data.blocks.find(b => b.kind === 'learn_link');
    expect(linkBlock).toBeDefined();
  });

  test('learn_link block has essayId === appendix_09_korbanos', () => {
    const linkBlock = data.blocks.find(b => b.kind === 'learn_link');
    expect(linkBlock.essayId).toBe('appendix_09_korbanos');
  });

  test('learn_link block is placed before the first prayer block', () => {
    const blocks = data.blocks;
    const linkIdx = blocks.findIndex(b => b.kind === 'learn_link' && b.essayId === 'appendix_09_korbanos');
    const firstPrayerIdx = blocks.findIndex(b => b.kind === 'prayer');
    expect(linkIdx).toBeGreaterThanOrEqual(0);
    expect(firstPrayerIdx).toBeGreaterThanOrEqual(0);
    expect(linkIdx).toBeLessThan(firstPrayerIdx);
  });
});

// ─── Test 2: appendix_09_korbanos.json has anchoredFrom ──────────────────────

describe('Stage 09 — appendix_09_korbanos.json has correct anchoredFrom', () => {
  let data;

  beforeAll(() => {
    data = JSON.parse(
      fs.readFileSync(path.join(ESSAYS_DIR, 'appendix_09_korbanos.json'), 'utf8')
    );
  });

  test('appendix_09_korbanos.json exists', () => {
    expect(essayExists('appendix_09_korbanos')).toBe(true);
  });

  test('anchoredFrom array exists', () => {
    expect(Array.isArray(data.anchoredFrom)).toBe(true);
  });

  test('anchoredFrom contains shacharit/pitum_haketores entry', () => {
    const match = data.anchoredFrom.find(
      a => a.cardId === 'shacharit' && a.sectionId === 'pitum_haketores'
    );
    expect(match).toBeDefined();
  });
});

// ─── Test 3: appendix_12_halachos has anchoredFrom.length >= 4 ───────────────

describe('Stage 09 — appendix_12_halachos has >= 4 anchoredFrom entries', () => {
  let data;

  beforeAll(() => {
    data = JSON.parse(
      fs.readFileSync(path.join(ESSAYS_DIR, 'appendix_12_halachos.json'), 'utf8')
    );
  });

  test('appendix_12_halachos.json exists', () => {
    expect(essayExists('appendix_12_halachos')).toBe(true);
  });

  test('anchoredFrom.length >= 4', () => {
    expect(data.anchoredFrom.length).toBeGreaterThanOrEqual(4);
  });
});

// ─── Test 4: Essay body arrays are non-empty ─────────────────────────────────

describe('Stage 09 — essay body arrays are non-empty', () => {
  const essayIds = [
    'appendix_09_korbanos',
    'appendix_12_halachos',
    'introduction_for_teens',
    'appendix_01_how_davening_works',
  ];

  for (const essayId of essayIds) {
    test(`${essayId} has non-empty body`, () => {
      const data = JSON.parse(
        fs.readFileSync(path.join(ESSAYS_DIR, `${essayId}.json`), 'utf8')
      );
      expect(Array.isArray(data.body)).toBe(true);
      expect(data.body.length).toBeGreaterThan(0);
    });
  }
});

// ─── Test 5: All sections produce a .learn.json file ─────────────────────────

describe('Stage 09 — all sections produce .learn.json files', () => {
  test('all *.conditional.json files have a corresponding *.learn.json', () => {
    const conditionalFiles = fs
      .readdirSync(SECTIONS_DIR)
      .filter(f => f.endsWith('.conditional.json'));

    expect(conditionalFiles.length).toBeGreaterThan(0);

    for (const filename of conditionalFiles) {
      const sectionId = filename.replace('.conditional.json', '');
      expect(learnExists(sectionId)).toBe(true);
    }
  });

  test('all .learn.json sectionId values match their filename', () => {
    const learnFiles = fs
      .readdirSync(SECTIONS_DIR)
      .filter(f => f.endsWith('.learn.json'));

    for (const filename of learnFiles) {
      const sectionId = filename.replace('.learn.json', '');
      const data = JSON.parse(
        fs.readFileSync(path.join(SECTIONS_DIR, filename), 'utf8')
      );
      expect(data.sectionId).toBe(sectionId);
    }
  });
});
