'use strict';

/**
 * Stage 01 integration test.
 *
 * Jest (jest-expo preset) does not support .mjs transform, so this is a
 * plain CJS test file. It shells out to node to run the stage script if
 * the output files don't exist yet, then asserts on their contents.
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const RAW_DIR = path.join(REPO_ROOT, 'content', 'feigenbaum-2026', 'raw');
const HTML_FILE = path.join(RAW_DIR, 'full.html');
const TXT_FILE = path.join(RAW_DIR, 'full.txt');
const STAGE_SCRIPT = path.join(REPO_ROOT, 'scripts', 'siddur', '01_extract_raw.mjs');

// Run the stage if either output file is missing.
if (!fs.existsSync(HTML_FILE) || !fs.existsSync(TXT_FILE)) {
  execFileSync(process.execPath, [STAGE_SCRIPT], { stdio: 'inherit' });
}

describe('Stage 01 — PDF → raw HTML + text', () => {
  test('raw/full.html exists and is non-empty', () => {
    expect(fs.existsSync(HTML_FILE)).toBe(true);
    expect(fs.statSync(HTML_FILE).size).toBeGreaterThan(0);
  });

  test('raw/full.txt exists and is non-empty', () => {
    expect(fs.existsSync(TXT_FILE)).toBe(true);
    expect(fs.statSync(TXT_FILE).size).toBeGreaterThan(0);
  });

  test('full.html contains Hebrew letter ס', () => {
    const html = fs.readFileSync(HTML_FILE, 'utf8');
    expect(html).toContain('ס');
  });

  test('full.html contains at least one <i> tag (italic detection)', () => {
    const html = fs.readFileSync(HTML_FILE, 'utf8');
    expect(html).toContain('<i>');
  });

  test('full.txt contains "Modeh" (from Modeh Ani)', () => {
    const txt = fs.readFileSync(TXT_FILE, 'utf8');
    expect(txt).toContain('Modeh');
  });
});
