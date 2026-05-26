'use strict';

/**
 * Stage 02 integration test.
 *
 * Jest (jest-expo preset) does not support .mjs transform, so this is a
 * plain CJS test file. It shells out to node to run the stage script if
 * the output file doesn't exist yet, then asserts on its contents.
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const INTERMEDIATE_DIR = path.join(REPO_ROOT, 'content', 'feigenbaum-2026', 'intermediate');
const MANIFEST_FILE = path.join(INTERMEDIATE_DIR, 'section_manifest.json');
const STAGE_SCRIPT = path.join(REPO_ROOT, 'scripts', 'siddur', '02_detect_sections.mjs');

const VALID_CARD_IDS = ['shacharit', 'birkat_hamazon', 'mincha', 'maariv', 'tefillos'];

// Run the stage if the output file is missing.
if (!fs.existsSync(MANIFEST_FILE)) {
  execFileSync(process.execPath, [STAGE_SCRIPT], { stdio: 'inherit' });
}

describe('Stage 02 — sections.json → section_manifest.json', () => {
  let manifest;

  beforeAll(() => {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
  });

  test('section_manifest.json exists and is valid JSON', () => {
    expect(fs.existsSync(MANIFEST_FILE)).toBe(true);
    expect(manifest).toBeDefined();
  });

  test('manifest has at least 30 sections', () => {
    expect(Array.isArray(manifest.sections)).toBe(true);
    expect(manifest.sections.length).toBeGreaterThanOrEqual(30);
  });

  test('manifest has at least 15 essays', () => {
    expect(Array.isArray(manifest.essays)).toBe(true);
    expect(manifest.essays.length).toBeGreaterThanOrEqual(15);
  });

  test('every section has a valid cardId', () => {
    for (const section of manifest.sections) {
      expect(VALID_CARD_IDS).toContain(section.cardId);
    }
  });

  test('every section has pageStart >= 1', () => {
    for (const section of manifest.sections) {
      expect(section.pageStart).toBeGreaterThanOrEqual(1);
    }
  });

  test('every section has pageEnd >= pageStart', () => {
    for (const section of manifest.sections) {
      expect(section.pageEnd).toBeGreaterThanOrEqual(section.pageStart);
    }
  });

  test('every section has pageEnd <= 296', () => {
    for (const section of manifest.sections) {
      expect(section.pageEnd).toBeLessThanOrEqual(296);
    }
  });

  test('every section has an id (non-empty string)', () => {
    for (const section of manifest.sections) {
      expect(typeof section.id).toBe('string');
      expect(section.id.length).toBeGreaterThan(0);
    }
  });

  test('every section has a title with an en string', () => {
    for (const section of manifest.sections) {
      expect(section.title).toBeDefined();
      expect(typeof section.title.en).toBe('string');
      expect(section.title.en.length).toBeGreaterThan(0);
    }
  });

  test('manifest includes a generatedAt timestamp', () => {
    expect(typeof manifest.generatedAt).toBe('string');
    expect(manifest.generatedAt.length).toBeGreaterThan(0);
  });
});
