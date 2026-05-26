import { execFileSync } from 'child_process';
import path from 'path';
import { PDF_PATH, RAW_DIR, ensureDir } from './utils/paths.mjs';

ensureDir(RAW_DIR);

console.log('Stage 01: extracting raw HTML from PDF...');
execFileSync('pdftohtml', [
  '-i',            // ignore images
  '-noframes',     // single file output
  '-fontfullname', // full font names (needed for italic detection)
  '-enc', 'UTF-8',
  PDF_PATH,
  path.join(RAW_DIR, 'full'),
], { stdio: 'inherit' });

console.log('Stage 01: extracting raw text from PDF...');
execFileSync('pdftotext', [
  '-layout',
  '-enc', 'UTF-8',
  PDF_PATH,
  path.join(RAW_DIR, 'full.txt'),
], { stdio: 'inherit' });

console.log('Stage 01: done.');
