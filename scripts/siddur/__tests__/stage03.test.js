'use strict';

/**
 * Stage 03 integration test.
 *
 * Jest (jest-expo preset) does not support .mjs transform, so this is a
 * plain CJS test file. It shells out to node to run the stage script if
 * the output files don't exist yet, then asserts on their contents.
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const INTERMEDIATE_DIR = path.join(REPO_ROOT, 'content', 'feigenbaum-2026', 'intermediate');
const SECTIONS_DIR = path.join(INTERMEDIATE_DIR, 'sections');
const MANIFEST_FILE = path.join(INTERMEDIATE_DIR, 'section_manifest.json');
const STAGE_SCRIPT = path.join(REPO_ROOT, 'scripts', 'siddur', '03_classify_blocks.mjs');

const VALID_KINDS = new Set(['prayer', 'heading', 'faq', 'instant_insight', 'rubric', 'callout']);

// Run the stage if any output files are missing.
function outputsExist(sections) {
  return sections.every(s =>
    fs.existsSync(path.join(SECTIONS_DIR, `${s.id}.classified.json`)),
  );
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
if (!outputsExist(manifest.sections)) {
  console.log('Stage 03 outputs missing — running stage script…');
  execFileSync(process.execPath, [STAGE_SCRIPT], { stdio: 'inherit' });
}

describe('Stage 03 — block kind classification', () => {
  let sectionFiles;

  beforeAll(() => {
    sectionFiles = manifest.sections.map(s => {
      const filePath = path.join(SECTIONS_DIR, `${s.id}.classified.json`);
      return {
        id: s.id,
        filePath,
        data: JSON.parse(fs.readFileSync(filePath, 'utf8')),
      };
    });
  });

  test('intermediate/sections/{id}.classified.json exists for every section', () => {
    for (const { id, filePath } of sectionFiles) {
      expect(fs.existsSync(filePath)).toBe(true);
    }
  });

  test('birchos_hashachar.classified.json has at least 3 prayer blocks', () => {
    const birchos = sectionFiles.find(s => s.id === 'birchos_hashachar');
    expect(birchos).toBeDefined();
    const prayerBlocks = birchos.data.blocks.filter(b => b.kind === 'prayer');
    expect(prayerBlocks.length).toBeGreaterThanOrEqual(3);
  });

  test('at least one section has a faq or instant_insight block', () => {
    const hasSpecialBlock = sectionFiles.some(s =>
      s.data.blocks.some(b => b.kind === 'faq' || b.kind === 'instant_insight'),
    );
    expect(hasSpecialBlock).toBe(true);
  });

  test('every block has kind (string) and rawText (string)', () => {
    for (const { id, data } of sectionFiles) {
      for (const block of data.blocks) {
        expect(typeof block.kind).toBe('string');
        expect(VALID_KINDS.has(block.kind)).toBe(true);
        expect(typeof block.rawText).toBe('string');
        expect(block.rawText.length).toBeGreaterThan(0);
      }
    }
  });

  test('every output file has the correct top-level structure', () => {
    for (const { id, data } of sectionFiles) {
      expect(typeof data.sectionId).toBe('string');
      expect(data.sectionId).toBe(id);
      expect(typeof data.cardId).toBe('string');
      expect(typeof data.pageStart).toBe('number');
      expect(typeof data.pageEnd).toBe('number');
      expect(Array.isArray(data.blocks)).toBe(true);
    }
  });

  test('total number of classified blocks is greater than 0 for every section', () => {
    for (const { id, data } of sectionFiles) {
      expect(data.blocks.length).toBeGreaterThan(0);
    }
  });

  test('every block has a runs array', () => {
    for (const { data } of sectionFiles) {
      for (const block of data.blocks) {
        expect(Array.isArray(block.runs)).toBe(true);
      }
    }
  });
});
