import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Derive repo root by going up two directories from scripts/siddur/utils/
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

// Load config relative to repo root
const require = createRequire(import.meta.url);
const config = require(path.join(REPO_ROOT, 'scripts', 'siddur', 'config.json'));

export const PDF_PATH = config.pdfPath;
export const TOTAL_PAGES = config.totalPages;
export const RULES_DIR = path.resolve(REPO_ROOT, config.rulesDir);
export const RAW_DIR = path.resolve(REPO_ROOT, config.rawDir);
export const INTERMEDIATE_DIR = path.resolve(REPO_ROOT, config.intermediateDir);
export const REPORTS_DIR = path.resolve(REPO_ROOT, config.reportsDir);
export const OUTPUT_DATA_DIR = path.resolve(REPO_ROOT, config.outputDataDir);
export const LEGACY_TRANSLIT_DIR = path.resolve(REPO_ROOT, config.legacyTranslitDir);

export { REPO_ROOT };

/**
 * Ensures a directory exists, creating it (and any parents) if needed.
 * @param {string} p - Absolute path to the directory
 */
export function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}
